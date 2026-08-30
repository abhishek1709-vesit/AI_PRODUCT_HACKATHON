import json
import time
from sqlalchemy.orm import Session
from backend.models.models import (
    Evaluation, Vendor, Requirement, VendorAnalysis, Risk, VendorCost, 
    Recommendation, NegotiationStrategy, ProcurementChatSession, ProcurementChatMessage
)
from backend.services.rag_service import RAGService
from backend.services.llm_service import LLMService

class ChatService:
    def __init__(self, db: Session):
        self.db = db
        self.rag_service = RAGService(db)
        self.llm_service = LLMService()
        
    def _get_or_create_session(self, evaluation_id: str) -> ProcurementChatSession:
        session = self.db.query(ProcurementChatSession).filter(ProcurementChatSession.evaluation_id == evaluation_id).first()
        if not session:
            session = ProcurementChatSession(evaluation_id=evaluation_id, memory_summary="")
            self.db.add(session)
            self.db.commit()
            self.db.refresh(session)
        return session
        
    def _build_evaluation_context(self, evaluation_id: str) -> str:
        eval_obj = self.db.query(Evaluation).filter(Evaluation.id == evaluation_id).first()
        if not eval_obj:
            return ""
            
        vendors = self.db.query(Vendor).filter(Vendor.evaluation_id == evaluation_id).all()
        vendor_map = {str(v.id): v.name for v in vendors}
        
        reqs = self.db.query(Requirement).filter(Requirement.evaluation_id == evaluation_id).all()
        risks = self.db.query(Risk).filter(Risk.evaluation_id == evaluation_id).all()
        costs = self.db.query(VendorCost).filter(VendorCost.evaluation_id == evaluation_id).all()
        
        # We don't recalculate scores here. We just present what's saved in VendorCost, Risk, etc. 
        # For full scores, we can pull the latest recommendation if available.
        rec = self.db.query(Recommendation).filter(Recommendation.evaluation_id == evaluation_id).first()
        
        context_parts = []
        context_parts.append(f"Evaluation Name: {eval_obj.description or 'Procurement Evaluation'}")
        
        if rec and rec.recommended_vendor_id:
            rec_vendor_name = vendor_map.get(str(rec.recommended_vendor_id), "Unknown")
            context_parts.append(f"\nCURRENT RECOMMENDATION:\nVendor: {rec_vendor_name}\nSummary: {rec.summary}\nTrade-offs: {rec.reasoning}")
            
        context_parts.append("\nVENDORS:")
        for v in vendors:
            v_costs = next((c for c in costs if str(c.vendor_id) == str(v.id)), None)
            v_risks = [r for r in risks if str(r.vendor_id) == str(v.id)]
            
            part = f"- {v.name}:\n"
            if v_costs:
                part += f"  Estimated TCO: {v_costs.estimated_tco}\n"
            
            high_risks = [r for r in v_risks if r.severity.lower() == 'high']
            if high_risks:
                part += f"  High Risks: {len(high_risks)} ({', '.join([r.risk_type for r in high_risks])})\n"
            context_parts.append(part)
            
        return "\n".join(context_parts)
        
    def _build_rag_context(self, query: str, evaluation_id: str) -> (str, list):
        # We only retrieve top 3 chunks to leave room for context
        results = self.rag_service.retrieval_service.search(
            query=query,
            evaluation_id=evaluation_id,
            top_k=3
        )
        
        if not results:
            return "No specific evidence found for this query in the proposals.", []
            
        context_parts = []
        sources = []
        for i, res in enumerate(results, 1):
            vendor = self.db.query(Vendor).filter(Vendor.id == res['vendor_id']).first()
            vendor_name = vendor.name if vendor else "Unknown Vendor"
            
            source_id = str(i)
            
            part = f"[EVIDENCE {source_id}]\n"
            part += f"SOURCE_ID: {source_id}\n"
            part += f"Vendor: {vendor_name}\n"
            part += f"Page: {res.get('page_number')}\n"
            part += f"Section: {res.get('section')}\n"
            part += f"TEXT:\n{res.get('chunk_text')}\n"
            context_parts.append(part)
            
            sources.append({
                "source_id": source_id,
                "vendor_id": str(res['vendor_id']),
                "vendor_name": vendor_name,
                "proposal_id": str(res['proposal_id']),
                "chunk_id": res.get("chunk_id"),
                "page_number": res.get('page_number'),
                "section": res.get('section'),
                "evidence": res.get('chunk_text')[:150] + "..." # Snippet
            })
            
        return "\n".join(context_parts), sources

    def _update_memory_summary(self, session: ProcurementChatSession, messages: list):
        # Only run if we have enough messages (e.g., 6) to warrant a summary update
        if len(messages) < 6:
            return
            
        prompt = f"""Summarize the following procurement conversation. 
Keep it concise. Focus on:
- Which vendors the user is interested in.
- Which specific requirements or risks they are asking about.
- Their preferences or decisions so far.

Current Summary: {session.memory_summary or 'None'}

Recent Messages:
"""
        for m in messages[-6:]:
            prompt += f"{m.role.upper()}: {m.content}\n"
            
        try:
            # We use text-based generation for summary, not json
            new_summary = self.llm_service.generate_json_response(
                "You are a helpful assistant that summarizes conversations. Output JSON: {\"summary\": \"...\"}",
                prompt
            )
            session.memory_summary = new_summary.get("summary", session.memory_summary)
            self.db.commit()
        except Exception as e:
            print(f"[Chat] Failed to update memory summary: {e}")

    def chat(self, evaluation_id: str, message: str) -> dict:
        try:
            session = self._get_or_create_session(evaluation_id)
            
            # Fetch recent messages (up to 8)
            recent_messages = self.db.query(ProcurementChatMessage)\
                .filter(ProcurementChatMessage.session_id == session.id)\
                .order_by(ProcurementChatMessage.created_at.asc())\
                .all()[-8:]
                
            history_text = ""
            for msg in recent_messages:
                history_text += f"{msg.role.upper()}: {msg.content}\n\n"
                
            eval_context = self._build_evaluation_context(evaluation_id)
            rag_context, retrieved_sources = self._build_rag_context(message, evaluation_id)
            
            system_prompt = """You are Procurement Copilot, an AI assistant helping a user with a specific vendor evaluation.
You have persistent memory of this evaluation. 
Answer the user's question accurately using ONLY the provided contexts.

RULES:
1. Do NOT invent or hallucinate capabilities, prices, or terms.
2. If the data is not in the context, explicitly say so.
3. Be concise, professional, and easy to scan. Use bullet points if helpful.
4. When you state a fact from the proposal, YOU MUST use the exact source metadata if provided in the EVIDENCE section.
5. If answering based on current evaluation context, no source array is strictly needed, but if answering from [EVIDENCE X], you must cite it.

OUTPUT FORMAT (Valid JSON):
{
    "answer": "Your detailed response...",
    "sources": [
        {
            "source_id": "The ID provided in SOURCE_ID of the EVIDENCE block"
        }
    ]
}"""

            user_prompt = f"""
CONVERSATION MEMORY SUMMARY:
{session.memory_summary or 'No summary yet.'}

RECENT CHAT HISTORY:
{history_text}

CURRENT EVALUATION CONTEXT (Structured Data):
{eval_context}

RETRIEVED PROPOSAL EVIDENCE:
{rag_context}

USER QUESTION:
{message}
"""
            print("[Chat] Starting LLM generation...")
            llm_response = self.llm_service.generate_json_response(system_prompt, user_prompt)
            
            answer = llm_response.get("answer", "I couldn't process that question right now.")
            llm_sources = llm_response.get("sources", [])
            
            # Map selected sources back to authoritative metadata
            validated_sources = []
            for src in llm_sources:
                s_id = str(src.get("source_id", ""))
                for ret_src in retrieved_sources:
                    if ret_src["source_id"] == s_id:
                        validated_sources.append(ret_src)
                        break
            
            sources = validated_sources
            
            # Save user message
            user_msg = ProcurementChatMessage(session_id=session.id, role='user', content=message)
            self.db.add(user_msg)
            
            # Save assistant message
            assistant_msg = ProcurementChatMessage(session_id=session.id, role='assistant', content=answer, sources=sources)
            self.db.add(assistant_msg)
            self.db.commit()
            
            # Async/background summarize would be better, but we do it synchronously here for simplicity
            all_messages = self.db.query(ProcurementChatMessage).filter(ProcurementChatMessage.session_id == session.id).all()
            if len(all_messages) % 6 == 0:
                self._update_memory_summary(session, all_messages)
                
            return {
                "answer": answer,
                "session_id": str(session.id),
                "sources": sources
            }
            
        except Exception as e:
            import traceback
            print(f"[Chat Service Error]: {traceback.format_exc()}")
            raise Exception("I couldn't process that question right now. Please try again.")

    def get_history(self, evaluation_id: str) -> list:
        session = self.db.query(ProcurementChatSession).filter(ProcurementChatSession.evaluation_id == evaluation_id).first()
        if not session:
            return []
            
        messages = self.db.query(ProcurementChatMessage)\
            .filter(ProcurementChatMessage.session_id == session.id)\
            .order_by(ProcurementChatMessage.created_at.asc())\
            .all()
            
        return [
            {
                "id": str(m.id),
                "role": m.role,
                "content": m.content,
                "sources": m.sources or [],
                "created_at": m.created_at.isoformat()
            }
            for m in messages
        ]

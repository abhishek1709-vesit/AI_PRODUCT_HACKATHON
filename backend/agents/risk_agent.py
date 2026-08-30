import json
from sqlalchemy.orm import Session
from backend.services.llm_service import LLMService
from backend.services.retrieval_service import RetrievalService
from backend.agents.state import ProcurementState

class RiskAgent:
    def __init__(self, db: Session):
        self.db = db
        self.llm_service = LLMService()
        self.retrieval_service = RetrievalService(db)

    def _format_evidence(self, results):
        if not results:
            return "No evidence found."
        parts = []
        for i, res in enumerate(results, 1):
            parts.append(f"[EVIDENCE {i}] Page {res['page_number']} | Section: {res['section']}\nText: {res['chunk_text']}\n")
        return "\n".join(parts)

    def run(self, state: ProcurementState) -> ProcurementState:
        import time
        start_time = time.time()
        risks = []
        errors = []
        
        system_prompt = """You are a procurement risk analyst. 
Review the provided evidence from a vendor proposal. Identify any major risks such as:
- Long contract lock-ins
- Early termination fees or obligations
- Weak SLA penalties
- Data residency concerns
- Hidden costs

Output JSON exactly matching this schema:
{
    "risks": [
        {
            "risk_type": "string (e.g. contract_lock_in)",
            "description": "string",
            "severity": "low" | "medium" | "high" | "critical",
            "page_number": <int or null>,
            "section": "string or null",
            "evidence": "Exact short quote from the text, or null"
        }
    ]
}
If no risks are found, return {"risks": []}.
Do NOT invent risks without evidence.
"""

        risk_queries = [
            "contract lock-in termination fee SLA penalty obligation renewal liability support limitations",
            "data residency privacy security compliance hidden costs extra fees"
        ]

        for vendor in state["vendors"]:
            vid = vendor["id"]
            
            # Cache check
            existing_for_vendor = [r for r in state.get("risks", []) if r["vendor_id"] == vid]
            if existing_for_vendor:
                print(f"[PERF] Using cached Risks for {vendor['name']}")
                continue
                
            try:
                all_results = []
                for rq in risk_queries:
                    # Retrieve chunks for this vendor that match risk keywords
                    res = self.retrieval_service.search(
                        query=rq,
                        evaluation_id=state["evaluation_id"],
                        vendor_id=vendor["id"],
                        top_k=4
                    )
                    all_results.extend(res)
                
                # Deduplicate chunks based on chunk_id
                unique_results = list({r['chunk_id']: r for r in all_results}.values())
                print(f"[RISK DEBUG] vendor={vendor['name']} retrieved_chunks={len(unique_results)}")
                
                evidence_text = self._format_evidence(unique_results)
                user_prompt = f"EVIDENCE:\n{evidence_text}"
                
                llm_start = time.time()
                try:
                    analysis = self.llm_service.generate_json_response(system_prompt, user_prompt)
                    parsed_risks = analysis.get("risks", [])
                    print(f"[RISK DEBUG] vendor={vendor['name']} llm_risks_count={len(parsed_risks)}")
                    if not parsed_risks:
                        print(f"[RISK DEBUG] LLM returned empty risks array for {vendor['name']}")
                except Exception as llm_err:
                    print(f"[RISK DEBUG] Groq parsing failed for {vendor['name']}: {str(llm_err)}")
                    raise llm_err
                print(f"[PERF] RiskAgent LLM call for {vendor['name']}: {time.time() - llm_start:.2f} seconds")
                
                for risk_item in parsed_risks:
                    print(f"[RISK DEBUG] risk_type={risk_item.get('risk_type')} severity={risk_item.get('severity')}")
                    risks.append({
                        "vendor_id": vendor["id"],
                        "risk_type": risk_item.get("risk_type"),
                        "description": risk_item.get("description"),
                        "severity": risk_item.get("severity"),
                        "evidence": risk_item.get("evidence", ""),
                        "page_number": risk_item.get("page_number"),
                        "section": risk_item.get("section")
                    })
            except Exception as e:
                import traceback
                print(f"[RISK DEBUG] Exception in RiskAgent for {vendor['name']}: {traceback.format_exc()}")
                errors.append(f"RiskAgent error for Vendor {vendor['name']}: {str(e)}")

        print(f"[RISK DEBUG] state_risks_count = {len(risks)}")
        
        duration = time.time() - start_time
        print(f"[PERF] risk_agent: {duration:.2f} seconds")
        
        return {
            "risks": risks,
            "execution_trace": ["risk_agent"],
            "errors": errors
        }

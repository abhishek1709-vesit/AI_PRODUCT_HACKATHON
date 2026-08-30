import json
from sqlalchemy.orm import Session
from backend.services.llm_service import LLMService
from backend.services.retrieval_service import RetrievalService
from backend.agents.state import ProcurementState

class VendorAnalysisAgent:
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
        vendor_analysis_results = []
        errors = []
        
        system_prompt = """You are analyzing a vendor's proposal against multiple requirements.
Review the provided evidence and determine if the vendor meets EACH requirement.

Output JSON exactly matching this schema:
{
    "analyses": [
        {
            "requirement_id": "uuid of the requirement",
            "status": "meets" | "partially_meets" | "does_not_meet" | "unknown",
            "explanation": "Brief explanation citing the evidence",
            "page_number": <int from evidence, or null>,
            "section": "section name from evidence, or null",
            "evidence": "Exact short quote from the text, or null"
        }
    ]
}
Do NOT invent evidence or page numbers. Use ONLY what is provided. Make sure to return an object in the 'analyses' list for every requirement_id provided.
"""

        for vendor in state["vendors"]:
            vid = vendor["id"]
            
            # Cache check
            existing_for_vendor = [a for a in state.get("vendor_analysis", []) if a["vendor_id"] == vid]
            req_ids = set([r["id"] for r in state["requirements"]])
            
            # Only count validly cached items (not "unknown" or "Error")
            valid_existing_req_ids = set([
                a.get("requirement_id") for a in existing_for_vendor 
                if a.get("status") not in ["unknown", None]
            ])
            
            if req_ids.issubset(valid_existing_req_ids) and req_ids:
                print(f"[PERF] Using cached VendorAnalysis for {vendor['name']}")
                continue

            try:
                # Combine all requirements into a single search query to reduce DB hits
                req_names = " ".join([r['name'] for r in state["requirements"]])
                combined_query = f"Requirements: {req_names}"
                
                results = self.retrieval_service.search(
                    query=combined_query,
                    evaluation_id=state["evaluation_id"],
                    vendor_id=vendor["id"],
                    top_k=12
                )
                
                evidence_text = self._format_evidence(results) if results else "No evidence found."
                
                req_prompts = []
                for req in state["requirements"]:
                    req_prompts.append(f"ID: {req['id']} | Name: {req['name']} | Desc: {req['description']} | Min: {req['minimum_value']}")
                    
                reqs_text = "\n".join(req_prompts)
                
                user_prompt = f"REQUIREMENTS TO EVALUATE:\n{reqs_text}\n\nEVIDENCE FROM PROPOSAL:\n{evidence_text}"
                
                llm_start = time.time()
                analysis = self.llm_service.generate_json_response(system_prompt, user_prompt)
                llm_time = time.time() - llm_start
                print(f"[PERF] VendorAnalysis LLM call for {vendor['name']}: {llm_time:.2f} seconds")
                
                # Process results
                analyses_list = analysis.get("analyses", [])
                analysis_map = {item.get("requirement_id"): item for item in analyses_list if item.get("requirement_id")}
                
                for req in state["requirements"]:
                    item = analysis_map.get(req["id"], {})
                    
                    vendor_analysis_results.append({
                        "vendor_id": vendor["id"],
                        "requirement_id": req["id"],
                        "status": item.get("status", "unknown"),
                        "explanation": item.get("explanation", "Failed to analyze"),
                        "evidence": item.get("evidence", ""),
                        "page_number": item.get("page_number"),
                        "section": item.get("section")
                    })
                    
            except Exception as e:
                errors.append(f"VendorAnalysis error for Vendor {vendor['name']}: {str(e)}")
                for req in state["requirements"]:
                    vendor_analysis_results.append({
                        "vendor_id": vendor["id"],
                        "requirement_id": req["id"],
                        "status": "unknown",
                        "explanation": "Error during analysis.",
                        "evidence": "",
                        "page_number": None,
                        "section": None
                    })
                    
        duration = time.time() - start_time
        print(f"[PERF] vendor_analysis_agent: {duration:.2f} seconds")
        
        return {
            "vendor_analysis": vendor_analysis_results,
            "execution_trace": ["vendor_analysis_agent"],
            "errors": errors
        }

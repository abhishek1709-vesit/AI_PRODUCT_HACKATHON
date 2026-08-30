import json
from sqlalchemy.orm import Session
from backend.services.llm_service import LLMService
from backend.services.retrieval_service import RetrievalService
from backend.services.tco_service import TCOService
from backend.agents.state import ProcurementState

class CommercialAgent:
    def __init__(self, db: Session):
        self.db = db
        self.llm_service = LLMService()
        self.retrieval_service = RetrievalService(db)
        self.tco_service = TCOService()

    def _format_evidence(self, results):
        if not results:
            return "No evidence found."
        parts = []
        for i, res in enumerate(results, 1):
            parts.append(f"[EVIDENCE {i}] Page {res['page_number']} | Section: {res['section']}\nText: {res['chunk_text']}\n")
        return "\n".join(parts)

    def run(self, state: ProcurementState) -> dict:
        import time
        start_time = time.time()
        tco_results = []
        errors = []
        
        system_prompt = """You are a Commercial Data Extraction Agent.
Extract pricing and cost information exactly as specified from the vendor proposal evidence.
Return a JSON object containing the numeric values in INR (as floats) WITHOUT symbols or commas.
If a cost is not explicitly mentioned or cannot be confidently inferred from evidence, return null. DO NOT invent costs.

{
    "subscription_cost": float | null,
    "implementation_cost": float | null,
    "support_cost": float | null,
    "usage_cost": float | null,
    "additional_costs": float | null,
    "notes": "Brief explanation of costs extracted."
}
"""

        for vendor in state["vendors"]:
            vid = vendor["id"]
            
            # Cache check
            existing_for_vendor = [c for c in state.get("commercial_extraction", []) if c["vendor_id"] == vid]
            if existing_for_vendor:
                print(f"[PERF] Using cached Commercial extraction for {vendor['name']}")
                continue
                
            try:
                # Search for cost-related chunks
                res = self.retrieval_service.search(
                    query="pricing cost fee subscription implementation support",
                    evaluation_id=state["evaluation_id"],
                    vendor_id=vendor["id"],
                    top_k=3 # Optimized
                )
                
                evidence_text = self._format_evidence(res)
                user_prompt = f"EVIDENCE:\n{evidence_text}"
                
                llm_start = time.time()
                extracted = self.llm_service.generate_json_response(system_prompt, user_prompt)
                print(f"[PERF] CommercialAgent LLM call for {vendor['name']}: {time.time() - llm_start:.2f} seconds")
                
                sub = extracted.get("subscription_cost")
                imp = extracted.get("implementation_cost")
                sup = extracted.get("support_cost")
                usg = extracted.get("usage_cost")
                add = extracted.get("additional_costs")
                notes = extracted.get("notes", "")
                
                tco_calc = self.tco_service.calculate_tco(sub, imp, sup, usg, add)
                
                tco_results.append({
                    "vendor_id": vendor["id"],
                    "subscription_cost": sub,
                    "implementation_cost": imp,
                    "support_cost": sup,
                    "usage_cost": usg,
                    "additional_costs": add,
                    "estimated_tco": tco_calc["estimated_tco"],
                    "is_estimated": tco_calc["is_estimated"],
                    "horizon_years": tco_calc["horizon_years"],
                    "notes": notes
                })
            except Exception as e:
                errors.append(f"CommercialAgent error for Vendor {vendor['name']}: {str(e)}")

        duration = time.time() - start_time
        print(f"[PERF] commercial_agent: {duration:.2f} seconds")
        
        return {
            "commercial_extraction": tco_results,
            "execution_trace": ["commercial_agent"],
            "errors": errors
        }

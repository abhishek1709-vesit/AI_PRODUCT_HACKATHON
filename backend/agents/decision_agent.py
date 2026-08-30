import json
from backend.services.llm_service import LLMService
from backend.agents.state import ProcurementState

class DecisionAgent:
    def __init__(self):
        self.llm_service = LLMService(model_type="reasoning")

    def run(self, state: ProcurementState) -> dict:
        import time
        start_time = time.time()
        errors = []
        
        vendors = state["vendors"]
        comparison = state["comparison"]
        risks = state["risks"]
        priorities = state.get("priorities", {"requirements": 50, "cost": 30, "risk": 20})
        
        context_data = {
            "vendors": vendors,
            "comparison": comparison,
            "risks": risks,
            "user_priorities": priorities
        }
        
        system_prompt = """You are a Decision Agent explaining the deterministic scoring results of a procurement analysis. 
Review the vendor scores, priorities, and risks provided. The vendor with the highest "final_score" is the winner.
Recommend the vendor with the highest "final_score". DO NOT change or invent the scores.

Explain exactly why this vendor won by referencing:
(IMPORTANT: Use INR (₹) for all currency values, NEVER use $)
1. Their TCO (if known).
2. Their requirement match score.
3. Their risk profile and any penalties.
4. How the user's explicit priorities influenced the outcome.

Output JSON matching this schema:
{
    "recommended_vendor_id": "uuid of best vendor",
    "explanation": "Detailed explanation of why they won based on scores, TCO, and risks.",
    "trade_offs": "What are the major trade-offs or weaknesses of this choice.",
    "alternatives_rejected_reason": "Briefly why the other vendors lost (e.g. higher TCO, severe risks, low match)."
}
"""
        user_prompt = f"DATA:\n{json.dumps(context_data, indent=2)}"
        
        try:
            llm_start = time.time()
            decision = self.llm_service.generate_json_response(system_prompt, user_prompt)
            print(f"[PERF] DecisionAgent LLM call: {time.time() - llm_start:.2f} seconds")
            
        except Exception as e:
            errors.append(f"DecisionAgent error: {str(e)}")
            decision = {
                "recommended_vendor_id": None,
                "explanation": "Failed to generate decision.",
                "trade_offs": "",
                "alternatives_rejected_reason": ""
            }
        duration = time.time() - start_time
        print(f"[PERF] decision_agent: {duration:.2f} seconds")
        
        return {
            "recommendation": decision,
            "execution_trace": ["decision_agent"],
            "errors": errors
        }

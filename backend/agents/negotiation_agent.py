import json
from backend.services.llm_service import LLMService
from backend.agents.state import ProcurementState

class NegotiationAgent:
    def __init__(self):
        self.llm_service = LLMService(model_type="reasoning")

    def run(self, state: ProcurementState) -> dict:
        import time
        start_time = time.time()
        negotiation_strategies = []
        errors = []
        
        system_prompt = """You are a Negotiation Agent.
Look at the risks and vendor analysis for multiple vendors and suggest a negotiation strategy for EACH vendor.

Output JSON matching this schema:
{
    "strategies": [
        {
            "vendor_id": "uuid of the vendor",
            "strategy": "Overall approach",
            "leverage_points": ["point 1", "point 2"],
            "clarification_questions": ["q1", "q2"],
            "terms_to_negotiate": ["term 1", "term 2"]
        }
    ]
}
Make sure to include a strategy for every vendor provided.
"""
        
        vendor_prompts = []
        for vendor in state["vendors"]:
            vid = vendor["id"]
            v_risks = [r for r in state["risks"] if r["vendor_id"] == vid]
            # Only include unmet/partial requirements to keep prompt small
            v_analysis = [a for a in state["vendor_analysis"] if a["vendor_id"] == vid and a.get("status") != "meets"]
            vendor_prompts.append(f"VENDOR: {vendor['name']} (ID: {vid})\nRISKS: {json.dumps(v_risks)}\nWEAKNESSES/GAPS: {json.dumps(v_analysis)}")
            
        if not vendor_prompts:
            return {
                "negotiation_strategy": [],
                "execution_trace": ["negotiation_agent"],
                "errors": errors
            }

        user_prompt = "\n\n".join(vendor_prompts)
        
        try:
            llm_start = time.time()
            result = self.llm_service.generate_json_response(system_prompt, user_prompt)
            print(f"[PERF] NegotiationAgent LLM call for all vendors: {time.time() - llm_start:.2f} seconds")
            
            strategies = result.get("strategies", [])
            for s in strategies:
                if s.get("vendor_id"):
                    negotiation_strategies.append(s)
        except Exception as e:
            errors.append(f"NegotiationAgent error: {str(e)}")
            
        duration = time.time() - start_time
        print(f"[PERF] negotiation_agent: {duration:.2f} seconds")
        
        return {
            "negotiation_strategy": negotiation_strategies,
            "execution_trace": ["negotiation_agent"],
            "errors": errors
        }

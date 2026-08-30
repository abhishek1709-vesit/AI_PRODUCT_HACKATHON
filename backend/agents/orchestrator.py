import json
from backend.services.llm_service import LLMService
from backend.agents.state import ProcurementState

class OrchestratorAgent:
    def __init__(self):
        self.llm_service = LLMService()

    def run(self, state: ProcurementState) -> dict:
        query = state.get("query", "")
        
        system_prompt = """You are an orchestrator router for an AI Procurement System.
Analyze the user's query and decide which agents need to run.

AGENTS:
- requirements: ALWAYS TRUE for context.
- vendor_analysis: TRUE if query needs comparing vendors to requirements or specific facts about vendors, or if it is a full analysis.
- risk: TRUE if query mentions risks, lock-in, SLA penalties, hidden costs, or comparing general weaknesses, or if it is a full analysis.
- comparison: TRUE if query asks to score, compare, or rank vendors holistically, or if it is a full analysis.
- decision: TRUE if query asks for a final recommendation, strongest option, or best choice, or if it is a full analysis.
- negotiation: TRUE if query mentions leverage, negotiation, discounts, terms to argue, or if it is a full analysis.

If the user asks for a "full procurement analysis" or something similar, EVERYTHING MUST BE TRUE.

Output valid JSON matching this schema:
{
    "run_requirements": true,
    "run_vendor_analysis": true|false,
    "run_risk": true|false,
    "run_comparison": true|false,
    "run_decision": true|false,
    "run_negotiation": true|false
}"""

        try:
            res = self.llm_service.generate_json_response(system_prompt, query)
            
            # Map back to state
            state["run_requirements"] = True  # Always load context
            state["run_vendor_analysis"] = res.get("run_vendor_analysis", True)
            state["run_risk"] = res.get("run_risk", False)
            state["run_comparison"] = res.get("run_comparison", False)
            state["run_decision"] = res.get("run_decision", False)
            state["run_negotiation"] = res.get("run_negotiation", False)
            
            # If decision or comparison are true, we usually need vendor_analysis
            if state["run_decision"] or state["run_comparison"]:
                state["run_vendor_analysis"] = True
                state["run_comparison"] = True
                
            # HARD OVERRIDE for Full Procurement Analysis
            if "full procurement analysis" in query.lower():
                state["run_vendor_analysis"] = True
                state["run_risk"] = True
                state["run_comparison"] = True
                state["run_decision"] = True
                state["run_negotiation"] = True
                
        except Exception as e:
            # Fallback to run all analysis if parsing fails
            return {
                "run_requirements": True,
                "run_vendor_analysis": True,
                "run_risk": True,
                "run_comparison": True,
                "run_decision": True,
                "run_negotiation": True,
                "errors": [f"Orchestrator error: {str(e)}"],
                "execution_trace": ["orchestrator"]
            }

        return {
            "run_requirements": state.get("run_requirements", True),
            "run_vendor_analysis": state.get("run_vendor_analysis", True),
            "run_risk": state.get("run_risk", False),
            "run_comparison": state.get("run_comparison", False),
            "run_decision": state.get("run_decision", False),
            "run_negotiation": state.get("run_negotiation", False),
            "execution_trace": ["orchestrator"]
        }

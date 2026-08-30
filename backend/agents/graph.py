from langgraph.graph import StateGraph, END
from sqlalchemy.orm import Session

from backend.agents.state import ProcurementState
from backend.agents.orchestrator import OrchestratorAgent
from backend.agents.requirement_agent import RequirementAgent
from backend.agents.vendor_analysis_agent import VendorAnalysisAgent
from backend.agents.risk_agent import RiskAgent
from backend.agents.comparison_agent import ComparisonAgent
from backend.agents.decision_agent import DecisionAgent
from backend.agents.negotiation_agent import NegotiationAgent

from backend.agents.commercial_agent import CommercialAgent

def create_procurement_graph(db: Session):
    # Initialize agents
    orchestrator = OrchestratorAgent()
    requirement_agent = RequirementAgent(db)
    vendor_analysis_agent = VendorAnalysisAgent(db)
    commercial_agent = CommercialAgent(db)
    risk_agent = RiskAgent(db)
    comparison_agent = ComparisonAgent()
    decision_agent = DecisionAgent()
    negotiation_agent = NegotiationAgent()

    # Define nodes
    def run_orchestrator(state: ProcurementState):
        return orchestrator.run(state)
        
    def run_requirement(state: ProcurementState):
        return requirement_agent.run(state)
        
    def run_vendor_analysis(state: ProcurementState):
        return vendor_analysis_agent.run(state)
        
    def run_commercial(state: ProcurementState):
        return commercial_agent.run(state)
        
    def run_risk(state: ProcurementState):
        return risk_agent.run(state)
        
    def run_comparison(state: ProcurementState):
        return comparison_agent.run(state)
        
    def run_decision(state: ProcurementState):
        return decision_agent.run(state)
        
    def run_negotiation(state: ProcurementState):
        return negotiation_agent.run(state)

    # Build Graph
    workflow = StateGraph(ProcurementState)
    
    workflow.add_node("orchestrator", run_orchestrator)
    workflow.add_node("requirement", run_requirement)
    workflow.add_node("vendor_analysis", run_vendor_analysis)
    workflow.add_node("commercial", run_commercial)
    workflow.add_node("risk", run_risk)
    workflow.add_node("comparison", run_comparison)
    workflow.add_node("decision", run_decision)
    workflow.add_node("negotiation", run_negotiation)
    
    # 1. Orchestrator defines routing flags
    workflow.set_entry_point("orchestrator")
    workflow.add_edge("orchestrator", "requirement")
    
    # 2. From Requirement -> Vendor Analysis, Commercial, Risk (PARALLEL)
    def after_requirement(state: ProcurementState):
        next_nodes = []
        if state.get("run_vendor_analysis"):
            next_nodes.append("vendor_analysis")
        # Assuming commercial always runs if vendor analysis runs, or independent flag
        # Let's check state. We will just add them if their flags are true.
        # Actually commercial and risk don't have explicit orchestrator flags? 
        # Wait, state has run_risk, but commercial is usually after vendor_analysis. 
        # Let's run all 3 in parallel unconditionally if they were requested.
        # The orchestrator sets run_vendor_analysis, run_risk.
        # If run_vendor_analysis is true, we always run commercial in the old flow.
        if state.get("run_vendor_analysis"):
            next_nodes.append("commercial")
        if state.get("run_risk"):
            next_nodes.append("risk")
            
        if not next_nodes:
            # Skip straight to comparison or end
            if state.get("run_comparison"):
                return ["comparison"]
            return END
            
        return next_nodes

    workflow.add_conditional_edges("requirement", after_requirement)
    
    # 3. From Vendor Analysis, Commercial, Risk -> Comparison
    # They all converge on Comparison
    workflow.add_edge("vendor_analysis", "comparison")
    workflow.add_edge("commercial", "comparison")
    workflow.add_edge("risk", "comparison")
    
    # 4. From Comparison -> Decision or Negotiation
    def after_comparison(state: ProcurementState):
        if state["run_decision"]:
            return "decision"
        elif state["run_negotiation"]:
            return "negotiation"
        return END
        
    workflow.add_conditional_edges("comparison", after_comparison)
    
    # 6. From Decision, we can run Negotiation
    def after_decision(state: ProcurementState):
        if state["run_negotiation"]:
            return "negotiation"
        return END
        
    workflow.add_conditional_edges("decision", after_decision)
    workflow.add_edge("negotiation", END)

    return workflow.compile()

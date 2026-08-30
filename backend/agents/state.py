from typing import TypedDict, List, Dict, Any, Optional, Annotated
import operator

class ProcurementState(TypedDict):
    evaluation_id: str
    query: str
    
    # Context loaded from DB
    requirements: List[Dict[str, Any]]
    vendors: List[Dict[str, Any]]
    
    # Analysis outputs
    vendor_analysis: Annotated[List[Dict[str, Any]], operator.add]
    commercial_extraction: Annotated[List[Dict[str, Any]], operator.add]
    risks: Annotated[List[Dict[str, Any]], operator.add]
    comparison: Dict[str, Any]
    recommendation: Dict[str, Any]
    negotiation_strategy: Annotated[List[Dict[str, Any]], operator.add]
    
    # Priority configuration
    priorities: Dict[str, int]
    
    # Routing flags from orchestrator
    run_requirements: bool
    run_vendor_analysis: bool
    run_risk: bool
    run_comparison: bool
    run_decision: bool
    run_negotiation: bool
    
    # System execution
    execution_trace: Annotated[List[str], operator.add]
    errors: Annotated[List[str], operator.add]

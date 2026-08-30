from backend.agents.state import ProcurementState
from backend.services.scoring_service import ScoringService

class ComparisonAgent:
    def run(self, state: ProcurementState) -> ProcurementState:
        import time
        start_time = time.time()
        # 1. Requirement Scores
        # Requirement scores are a raw percentage 0-100 of matched requirements
        requirement_scores_raw = {}
        print(f"[COMPARISON DEBUG] state['vendor_analysis'] total length = {len(state.get('vendor_analysis', []))}")
        for vendor in state["vendors"]:
            vid = vendor["id"]
            v_analysis = [va for va in state.get("vendor_analysis", []) if va["vendor_id"] == vid]
            
            print(f"[COMPARISON DEBUG] vendor={vendor['name']} vendor_analysis_count={len(v_analysis)} requirements_evaluated={len(state['requirements'])}")
            if len(v_analysis) > 0:
                print(f"[COMPARISON DEBUG] Sample analysis: {v_analysis[0]}")
                print(f"[COMPARISON DEBUG] Sample requirement: {state['requirements'][0]}")
            
            score = ScoringService.calculate_requirement_score(state["requirements"], v_analysis)
            print(f"[COMPARISON DEBUG] requirement_score={score}")
            requirement_scores_raw[vid] = score
            
        # 2. Risk Penalties
        # Raw integer penalties (e.g. 10, 15)
        risk_penalties = {}
        for vendor in state["vendors"]:
            vid = vendor["id"]
            vendor_risks = [r for r in state["risks"] if r["vendor_id"] == vid]
            print(f"[COMPARISON DEBUG] vendor={vendor['name']} risks_received={len(vendor_risks)}")
            penalty = ScoringService.calculate_risk_penalty(vendor_risks)
            risk_penalties[vid] = penalty
            
        # 3. Commercial Scores
        # Extracted from state["commercial_extraction"]
        tco_map = {}
        for comm in state.get("commercial_extraction", []):
            tco_map[comm["vendor_id"]] = comm.get("estimated_tco")
            
        commercial_scores_raw = ScoringService.calculate_commercial_scores(tco_map)
        
        # 4. Final Scores
        final_scores = ScoringService.calculate_final_scores(
            state["vendors"], 
            requirement_scores_raw, 
            commercial_scores_raw, 
            risk_penalties, 
            state.get("priorities", {"requirements": 50, "cost": 30, "risk": 20})
        )
        
        comparison = {}
        for vid, scores in final_scores.items():
            # Add TCO explicitly to the output payload for the frontend
            tco = tco_map.get(vid)
            
            comparison[vid] = {
                "requirement_score": scores["requirement_score"],
                "commercial_score": scores["commercial_score"],
                "risk_penalty": scores["risk_penalty"],
                "final_score": scores["final_score"],
                "estimated_tco": tco
            }
            
        duration = time.time() - start_time
        print(f"[PERF] comparison_agent: {duration:.2f} seconds")
        
        return {
            "comparison": comparison,
            "execution_trace": ["comparison_agent"]
        }

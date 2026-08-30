class ScoringService:
    @staticmethod
    def calculate_requirement_score(requirements, vendor_analysis):
        score = 0.0
        max_score = 0.0
        
        for req in requirements:
            weight = float(req["weight"])
            # Maximum achievable base score for this requirement
            if req["priority"] == "must_have":
                max_score += weight
            elif req["priority"] == "nice_to_have":
                max_score += (weight * 0.5)
            else:
                max_score += (weight * 0.2)
                
            analysis = next((a for a in vendor_analysis if a["requirement_id"] == req["id"]), None)
            
            if analysis:
                if analysis["status"] == "meets":
                    if req["priority"] == "must_have":
                        score += weight
                    elif req["priority"] == "nice_to_have":
                        score += weight * 0.5
                    else:
                        score += weight * 0.2
                elif analysis["status"] == "partially_meets":
                    if req["priority"] == "must_have":
                        score += weight * 0.5
                    elif req["priority"] == "nice_to_have":
                        score += weight * 0.25
                    else:
                        score += weight * 0.1
                        
        if max_score == 0:
            return 0.0
        return (score / max_score) * 100

    @staticmethod
    def calculate_risk_penalty(risks):
        penalty = 0.0
        seen_risks = set()
        
        for risk in risks:
            # Prevent double-counting the exact same risk type if generated multiple times
            if risk["risk_type"] in seen_risks:
                continue
            seen_risks.add(risk["risk_type"])
            
            severity = risk.get("severity", "medium").lower()
            if severity == "low":
                penalty += 2
            elif severity == "medium":
                penalty += 5
            elif severity == "high":
                penalty += 10
            elif severity == "critical":
                penalty += 20
        return penalty

    @staticmethod
    def calculate_commercial_scores(tcos):
        # tcos is a dict of vendor_id -> estimated_tco
        # We find the min known TCO. Cheapest vendor gets 100. Others scale down proportionally.
        # If TCO is None, score is 0.
        valid_tcos = {vid: val for vid, val in tcos.items() if val is not None}
        if not valid_tcos:
            return {vid: 0.0 for vid in tcos.keys()}
            
        min_tco = min(valid_tcos.values())
        if min_tco <= 0:
            min_tco = 0.0001 # avoid division by zero if cost is mysteriously 0
            
        scores = {}
        for vid, val in tcos.items():
            if val is None:
                scores[vid] = 0.0
            else:
                # Inversely proportional: min_tco / val * 100
                if val <= 0:
                    scores[vid] = 100.0
                else:
                    scores[vid] = (min_tco / val) * 100
        return scores

    @staticmethod
    def calculate_final_scores(vendors, requirement_scores, commercial_scores, risk_penalties, priorities):
        # priorities: {"requirements": 50, "cost": 30, "risk": 20}
        req_weight = priorities.get("requirements", 50) / 100.0
        cost_weight = priorities.get("cost", 30) / 100.0
        risk_weight = priorities.get("risk", 20) / 100.0
        
        results = {}
        for vendor in vendors:
            vid = vendor["id"]
            
            req_score = requirement_scores.get(vid, 0.0)
            comm_score = commercial_scores.get(vid, 0.0)
            penalty = risk_penalties.get(vid, 0.0)
            
            # Risk penalty reduces the overall score based on the risk priority weight
            # e.g., if total risk penalty is 30, and risk weight is 0.2, we deduct 30 * 0.2 = 6 points
            weighted_req = req_score * req_weight
            weighted_comm = comm_score * cost_weight
            weighted_penalty = penalty * risk_weight
            
            final_score = weighted_req + weighted_comm - weighted_penalty
            # Floor at 0
            if final_score < 0:
                final_score = 0.0
                
            results[vid] = {
                "requirement_score": round(req_score, 2),
                "commercial_score": round(comm_score, 2),
                "risk_penalty": round(penalty, 2),
                "final_score": round(final_score, 2)
            }
            
        return results

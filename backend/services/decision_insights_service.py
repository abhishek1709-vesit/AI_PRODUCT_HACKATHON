from backend.services.scoring_service import ScoringService

class DecisionInsightsService:
    @staticmethod
    def calculate_contributions(vendors, requirement_scores, commercial_scores, risk_penalties, priorities, tco_map=None):
        if tco_map is None:
            tco_map = {}
        req_weight = priorities.get('requirements', 50) / 100.0
        cost_weight = priorities.get('cost', 30) / 100.0
        risk_weight = priorities.get('risk', 20) / 100.0
        
        breakdown = {}
        for vendor in vendors:
            vid = str(vendor['id'])
            req_score = requirement_scores.get(vid, 0.0)
            comm_score = commercial_scores.get(vid, 0.0)
            penalty = risk_penalties.get(vid, 0.0)
            tco = tco_map.get(vid, None)
            
            req_contrib = req_score * req_weight
            comm_contrib = comm_score * cost_weight
            risk_contrib = -(penalty * risk_weight)
            
            final_score = req_contrib + comm_contrib + risk_contrib
            if final_score < 0:
                final_score = 0.0
                
            breakdown[vid] = {
                'requirement_score': round(req_score, 2),
                'requirement_contribution': round(req_contrib, 2),
                'commercial_score': round(comm_score, 2),
                'commercial_contribution': round(comm_contrib, 2),
                'risk_penalty': round(penalty, 2),
                'risk_contribution': round(risk_contrib, 2),
                'final_score': round(final_score, 2),
                'estimated_tco': tco
            }
        return breakdown

    @staticmethod
    def generate_ranking_change_explanation(old_ranking, new_ranking, old_priorities, new_priorities, new_breakdown, vendors_map):
        if not old_ranking or not new_ranking:
            return None
        
        if old_ranking[0] == new_ranking[0]:
            return f"{vendors_map.get(new_ranking[0], 'The recommended vendor')} remained the top choice despite the priority changes."
            
        old_top = vendors_map.get(old_ranking[0], 'Unknown')
        new_top = vendors_map.get(new_ranking[0], 'Unknown')
        
        # Find why
        reasons = []
        if new_priorities.get('cost', 30) > old_priorities.get('cost', 30):
            reasons.append('Cost/TCO weight increased')
        if new_priorities.get('risk', 20) > old_priorities.get('risk', 20):
            reasons.append('Risk weight increased')
        if new_priorities.get('requirements', 50) > old_priorities.get('requirements', 50):
            reasons.append('Requirements weight increased')
            
        reason_str = ' and '.join(reasons) if reasons else 'priorities changed'
        
        new_top_data = new_breakdown[new_ranking[0]]
        old_top_data = new_breakdown[old_ranking[0]]
        
        advantage = ''
        if new_top_data['commercial_contribution'] > old_top_data['commercial_contribution']:
            advantage = 'its lower TCO.'
        elif new_top_data['risk_contribution'] > old_top_data['risk_contribution']:
            advantage = 'its lower risk profile.'
        elif new_top_data['requirement_contribution'] > old_top_data['requirement_contribution']:
            advantage = 'its stronger requirement fit.'
        else:
            advantage = 'its overall balanced profile.'
            
        old_index = old_ranking.index(new_ranking[0]) + 1 if new_ranking[0] in old_ranking else 'a lower rank'
        return f"{new_top} moved from #{old_index} to #1 because {reason_str}. This change favored {new_top} due to {advantage}"

    @staticmethod
    def calculate_decision_confidence(vendor_analysis, vendor_costs, risks, final_scores):
        if not final_scores:
            return {'level': 'Low', 'reasons': ['No scoring data available.']}
            
        reasons = []
        points = 0
        
        # 1. Missing evidence check
        missing_count = sum(1 for a in vendor_analysis if a.get('status') in ['unknown', 'does_not_meet'])
        total_reqs = len(vendor_analysis)
        if total_reqs > 0:
            if missing_count / total_reqs > 0.5:
                reasons.append('Substantial requirement evidence is missing or negative.')
            else:
                points += 1
                
        # 2. TCO check
        top_vid = sorted(final_scores.items(), key=lambda x: x[1]['final_score'], reverse=True)[0][0]
        top_cost = next((c for c in vendor_costs if c['vendor_id'] == top_vid), None)
        if top_cost and top_cost.get('estimated_tco'):
            points += 1
        else:
            reasons.append(f"TCO for the recommended vendor is unknown or not estimated.")
            
        # 3. Margin check
        sorted_scores = sorted(final_scores.items(), key=lambda x: x[1]['final_score'], reverse=True)
        if len(sorted_scores) > 1:
            margin = sorted_scores[0][1]['final_score'] - sorted_scores[1][1]['final_score']
            if margin > 5.0:
                points += 1
            else:
                reasons.append(f"The margin between the top two vendors is very small ({margin:.1f} points).")
                
        if points == 3:
            return {'level': 'High', 'reasons': ['Strong evidence found.', 'TCO is known.', 'Clear winning margin.']}
        elif points == 2:
            return {'level': 'Medium', 'reasons': reasons if reasons else ['Moderate confidence.']}
        else:
            return {'level': 'Low', 'reasons': reasons if reasons else ['Insufficient data for a confident decision.']}

    @staticmethod
    def generate_procurement_alerts(vendor_costs, risks, vendor_analysis, vendors_map):
        alerts = []
        
        for risk in risks:
            if risk.get('severity', '').lower() in ['high', 'critical']:
                v_name = vendors_map.get(risk['vendor_id'], 'Unknown')
                alerts.append({'level': 'HIGH PRIORITY', 'message': f"{v_name}: {risk.get('description', 'Critical risk identified.')}"})
                
        for cost in vendor_costs:
            if not cost.get('estimated_tco'):
                v_name = vendors_map.get(cost['vendor_id'], 'Unknown')
                alerts.append({'level': 'WARNING', 'message': f"{v_name} does not have a fully quantifiable TCO."})
                
        valid_tcos = [c for c in vendor_costs if c.get('estimated_tco')]
        if valid_tcos:
            lowest = min(valid_tcos, key=lambda x: x['estimated_tco'])
            v_name = vendors_map.get(lowest['vendor_id'], 'Unknown')
            alerts.append({'level': 'INFO', 'message': f"{v_name} has the lowest estimated 1-year TCO (INR {lowest['estimated_tco']:,.0f})."})
            
        return alerts

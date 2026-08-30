from sqlalchemy.orm import Session
from backend.models.models import VendorAnalysis, Risk, VendorCost, Recommendation, NegotiationStrategy
import json

class AnalysisPersistenceService:
    def __init__(self, db: Session):
        self.db = db

    def persist_state(self, state: dict):
        eval_id = state.get("evaluation_id")
        if not eval_id:
            return

        # 1. Vendor Analysis
        if state.get("vendor_analysis"):
            for item in state["vendor_analysis"]:
                db_va = self.db.query(VendorAnalysis).filter(
                    VendorAnalysis.evaluation_id == eval_id,
                    VendorAnalysis.vendor_id == item["vendor_id"],
                    VendorAnalysis.requirement_id == item["requirement_id"]
                ).first()
                if item.get('status') in ['unknown', None]:
                    continue
                if not db_va:
                    db_va = VendorAnalysis(
                        evaluation_id=eval_id,
                        vendor_id=item["vendor_id"],
                        requirement_id=item["requirement_id"]
                    )
                    self.db.add(db_va)
                
                db_va.status = item.get("status")
                db_va.explanation = item.get("explanation")
                db_va.evidence = item.get("evidence")
                db_va.page_number = item.get("page_number")
                db_va.section = item.get("section")
            # Replaced self.db.commit() instances, will add one at the end

        # 2. Risks
        if state.get("risks"):
            print(f"[PERSIST DEBUG] risks_to_persist = {len(state['risks'])}")
            try:
                for item in state["risks"]:
                    db_risk = self.db.query(Risk).filter(
                        Risk.evaluation_id == eval_id,
                        Risk.vendor_id == item["vendor_id"],
                        Risk.risk_type == item["risk_type"]
                    ).first()
                    if not db_risk:
                        db_risk = Risk(
                            evaluation_id=eval_id,
                            vendor_id=item["vendor_id"],
                            risk_type=item["risk_type"]
                        )
                        self.db.add(db_risk)
                    
                    db_risk.description = item.get("description")
                    db_risk.severity = item.get("severity")
                    db_risk.evidence = item.get("evidence")
                    db_risk.page_number = item.get("page_number")
                    db_risk.section = item.get("section")
                
                # Flush to DB to catch errors early
                self.db.flush()
                print(f"[PERSIST DEBUG] risks_persisted = {len(state['risks'])}")
            except Exception as risk_err:
                import traceback
                print(f"[PERSIST DEBUG] Error persisting risks: {traceback.format_exc()}")
                raise risk_err

        # 3. Commercial Extraction / Vendor Costs
        if state.get("commercial_extraction"):
            for item in state["commercial_extraction"]:
                db_cost = self.db.query(VendorCost).filter(
                    VendorCost.evaluation_id == eval_id,
                    VendorCost.vendor_id == item["vendor_id"]
                ).first()
                if not db_cost:
                    db_cost = VendorCost(
                        evaluation_id=eval_id,
                        vendor_id=item["vendor_id"]
                    )
                    self.db.add(db_cost)
                
                db_cost.subscription_cost = item.get("subscription_cost")
                db_cost.implementation_cost = item.get("implementation_cost")
                db_cost.support_cost = item.get("support_cost")
                db_cost.usage_cost = item.get("usage_cost")
                db_cost.additional_costs = item.get("additional_costs")
                db_cost.estimated_tco = item.get("estimated_tco")
                db_cost.is_estimated = item.get("is_estimated", True)
                db_cost.notes = item.get("notes")
            # Replaced self.db.commit() instances, will add one at the end

        # 4. Recommendation
        if state.get("recommendation") and state["recommendation"].get("recommended_vendor_id"):
            rec = state["recommendation"]
            db_rec = self.db.query(Recommendation).filter(
                Recommendation.evaluation_id == eval_id
            ).first()
            if not db_rec:
                db_rec = Recommendation(evaluation_id=eval_id)
                self.db.add(db_rec)
                
            db_rec.recommended_vendor_id = rec.get("recommended_vendor_id")
            db_rec.summary = rec.get("explanation")
            db_rec.reasoning = rec.get("trade_offs", "") + "\n\nRejected Alternatives: " + rec.get("alternatives_rejected_reason", "")
            
            # Also store score if possible
            vid = rec.get("recommended_vendor_id")
            if state.get("comparison") and vid in state["comparison"]:
                db_rec.recommendation_score = state["comparison"][vid].get("final_score")
                
            # Replaced self.db.commit() instances, will add one at the end

        # 5. Negotiation Strategies
        if state.get("negotiation_strategy"):
            for item in state["negotiation_strategy"]:
                db_neg = self.db.query(NegotiationStrategy).filter(
                    NegotiationStrategy.evaluation_id == eval_id,
                    NegotiationStrategy.vendor_id == item["vendor_id"]
                ).first()
                if not db_neg:
                    db_neg = NegotiationStrategy(
                        evaluation_id=eval_id,
                        vendor_id=item["vendor_id"]
                    )
                    self.db.add(db_neg)
                    
                db_neg.strategy_details = item.get("strategy")
                db_neg.clarification_questions = item.get("clarification_questions", [])
                db_neg.leverage_points = item.get("leverage_points", [])
            # Replaced self.db.commit() instances, will add one at the end

        self.db.commit()

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from typing import List
from uuid import UUID

from backend.database import get_db
from backend.models.models import Evaluation, Vendor, Requirement, VendorAnalysis, Risk, VendorCost, Recommendation, NegotiationStrategy
from backend.schemas.evaluation import EvaluationCreate, EvaluationUpdate, EvaluationResponse


router = APIRouter(prefix="/api/evaluations", tags=["Evaluations"])

@router.post("", response_model=EvaluationResponse)
def create_evaluation(eval_in: EvaluationCreate, db: Session = Depends(get_db)):
    try:
        db_eval = Evaluation(**eval_in.model_dump())
        db.add(db_eval)
        db.commit()
        db.refresh(db_eval)
        return db_eval
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Database error occurred while creating evaluation.")

@router.get("", response_model=List[EvaluationResponse])
def get_evaluations(db: Session = Depends(get_db)):
    try:
        return db.query(Evaluation).order_by(Evaluation.created_at.desc()).all()
    except Exception as e:
        raise HTTPException(status_code=500, detail="Database error occurred.")

@router.get("/{evaluation_id}", response_model=EvaluationResponse)
def get_evaluation(evaluation_id: UUID, db: Session = Depends(get_db)):
    try:
        db_eval = db.query(Evaluation).filter(Evaluation.id == evaluation_id).first()
        if not db_eval:
            raise HTTPException(status_code=404, detail="Evaluation not found")
        return db_eval
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=500, detail="Database error occurred.")

@router.put("/{evaluation_id}", response_model=EvaluationResponse)
def update_evaluation(evaluation_id: UUID, eval_in: EvaluationUpdate, db: Session = Depends(get_db)):
    try:
        db_eval = db.query(Evaluation).filter(Evaluation.id == evaluation_id).first()
        if not db_eval:
            raise HTTPException(status_code=404, detail="Evaluation not found")
        
        update_data = eval_in.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_eval, key, value)
            
        db.commit()
        db.refresh(db_eval)
        return db_eval
    except HTTPException:
        raise
    except Exception:
        db.rollback()
        raise HTTPException(status_code=500, detail="Database error occurred.")

@router.delete("/{evaluation_id}")
def delete_evaluation(evaluation_id: UUID, db: Session = Depends(get_db)):
    try:
        db_eval = db.query(Evaluation).filter(Evaluation.id == evaluation_id).first()
        if not db_eval:
            raise HTTPException(status_code=404, detail="Evaluation not found")
            
        db.delete(db_eval)
        db.commit()
        return {"detail": "Evaluation deleted successfully"}
    except HTTPException:
        raise
    except Exception:
        db.rollback()
        raise HTTPException(status_code=500, detail="Database error occurred.")

from pydantic import BaseModel
from typing import Dict, Optional

class AnalyzeRequest(BaseModel):
    query: str
    priorities: Optional[Dict[str, int]] = None

@router.post("/{evaluation_id}/analyze")
def analyze_evaluation(evaluation_id: UUID, req: AnalyzeRequest, db: Session = Depends(get_db)):
    from backend.agents.graph import create_procurement_graph
    from backend.agents.state import ProcurementState
    
    # 1. Validate eval
    db_eval = db.query(Evaluation).filter(Evaluation.id == evaluation_id).first()
    if not db_eval:
        raise HTTPException(status_code=404, detail="Evaluation not found")
        
    priorities = req.priorities or {"requirements": 50, "cost": 30, "risk": 20}
    
    # Validate priorities sum to 100
    if sum(priorities.values()) != 100:
        raise HTTPException(status_code=400, detail="Priorities must sum to 100")
        
    # Preload existing analysis to avoid redundant LLM calls
    from backend.models.models import VendorAnalysis, Risk, VendorCost, Recommendation, NegotiationStrategy
    
    db_analysis = db.query(VendorAnalysis).filter(VendorAnalysis.evaluation_id == str(evaluation_id)).all()
    cached_analysis = [{"vendor_id": str(a.vendor_id), "requirement_id": str(a.requirement_id), "status": a.status, "explanation": a.explanation, "evidence": a.evidence, "page_number": a.page_number, "section": a.section} for a in db_analysis]
    
    db_risks = db.query(Risk).filter(Risk.evaluation_id == str(evaluation_id)).all()
    cached_risks = [{"vendor_id": str(r.vendor_id), "risk_type": r.risk_type, "description": r.description, "severity": r.severity, "evidence": r.evidence, "page_number": r.page_number, "section": r.section} for r in db_risks]
    
    db_costs = db.query(VendorCost).filter(VendorCost.evaluation_id == str(evaluation_id)).all()
    cached_costs = [{"vendor_id": str(c.vendor_id), "subscription_cost": float(c.subscription_cost) if c.subscription_cost else None, "implementation_cost": float(c.implementation_cost) if c.implementation_cost else None, "support_cost": float(c.support_cost) if c.support_cost else None, "usage_cost": float(c.usage_cost) if c.usage_cost else None, "additional_costs": float(c.additional_costs) if c.additional_costs else None, "estimated_tco": float(c.estimated_tco) if c.estimated_tco else None, "is_estimated": c.is_estimated, "notes": c.notes} for c in db_costs]
    
    # 2. Setup state
    initial_state: ProcurementState = {
        "evaluation_id": str(evaluation_id),
        "query": req.query,
        "requirements": [],
        "vendors": [],
        "vendor_analysis": cached_analysis,
        "commercial_extraction": cached_costs,
        "risks": cached_risks,
        "comparison": {},
        "recommendation": {},
        "negotiation_strategy": [],
        "priorities": priorities,
        "run_requirements": False,
        "run_vendor_analysis": False,
        "run_risk": False,
        "run_comparison": False,
        "run_decision": False,
        "run_negotiation": False,
        "execution_trace": [],
        "errors": []
    }
    
    # 3. Run Graph
    try:
        app = create_procurement_graph(db)
        final_state = app.invoke(initial_state)
        
        # 4. Check for catastrophic failure (e.g., rate limits causing all 0s)
        comparison = final_state.get("comparison", {})
        if comparison:
            all_zero = True
            for vid, data in comparison.items():
                if data.get("requirement_score", 0) > 0 or data.get("estimated_tco") is not None or data.get("risk_penalty", 0) > 0:
                    all_zero = False
                    break
            
            errs = final_state.get("errors", [])
            err_msg = errs[0] if errs else ""
            if "429" in err_msg or "rate limit" in err_msg.lower():
                raise HTTPException(status_code=429, detail="LLM Rate Limit Reached. Please wait a few minutes and try again.")
            
            if all_zero:
                raise HTTPException(status_code=500, detail=f"Analysis failed to extract any meaningful data. Internal errors: {err_msg}")
                    
        # 5. Persist Results
        from backend.services.analysis_persistence_service import AnalysisPersistenceService
        persister = AnalysisPersistenceService(db)
        persister.persist_state(final_state)
        
        from backend.services.decision_insights_service import DecisionInsightsService
        from backend.models.models import Vendor
        
        vendors = [{"id": str(v.id), "name": v.name} for v in db.query(Vendor).filter(Vendor.evaluation_id == evaluation_id).all()]
        vendors_map = {v["id"]: v["name"] for v in vendors}
        
        req_raw = {}
        comm_raw = {}
        risk_raw = {}
        if final_state.get("comparison"):
            for vid, d in final_state["comparison"].items():
                req_raw[vid] = d.get('requirement_score', 0.0)
                comm_raw[vid] = d.get('commercial_score', 0.0)
                risk_raw[vid] = d.get('risk_penalty', 0.0)
        
        # ----------------------------------------------------
        # THE FIX: Create tco_map and pass it down
        # ----------------------------------------------------
        tco_map = {c["vendor_id"]: c["estimated_tco"] for c in cached_costs}
        
        new_breakdown = DecisionInsightsService.calculate_contributions(
            vendors, req_raw, comm_raw, risk_raw, priorities, tco_map
        )
        new_ranking = sorted(new_breakdown.keys(), key=lambda vid: new_breakdown[vid]["final_score"], reverse=True)
        
        confidence = DecisionInsightsService.calculate_decision_confidence(
            final_state.get("vendor_analysis", []), 
            final_state.get("commercial_extraction", []), 
            final_state.get("risks", []), 
            new_breakdown
        )
        alerts = DecisionInsightsService.generate_procurement_alerts(
            final_state.get("commercial_extraction", []), 
            final_state.get("risks", []), 
            final_state.get("vendor_analysis", []), 
            vendors_map
        )
        
        return {
            "evaluation_id": str(evaluation_id),
            "execution_trace": final_state["execution_trace"],
            "errors": final_state["errors"],
            "recommendation": final_state["recommendation"],
            "vendor_analysis": final_state["vendor_analysis"],
            "risks": final_state["risks"],
            "comparison": new_breakdown,
            "negotiation": final_state["negotiation_strategy"],
            "ranking": new_ranking,
            "decision_confidence": confidence,
            "alerts": alerts,
            "recommended_vendor_id": new_ranking[0] if new_ranking else None
        }
    except Exception as e:
        import logging
        logging.exception("Analyze endpoint failed")
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Graph execution or persistence failed: {str(e)}")

class SimulateRequest(BaseModel):
    priorities: Dict[str, int]
    previous_priorities: Optional[Dict[str, int]] = None

@router.post("/{evaluation_id}/simulate")
def simulate_evaluation(evaluation_id: UUID, req: SimulateRequest, db: Session = Depends(get_db)):
    from backend.services.scoring_service import ScoringService
    from backend.services.decision_insights_service import DecisionInsightsService
    from backend.models.models import VendorAnalysis, Risk, VendorCost, Requirement, Vendor
    
    # 1. Validate eval & priorities
    if sum(req.priorities.values()) != 100:
        raise HTTPException(status_code=400, detail="Priorities must sum to 100")
        
    db_eval = db.query(Evaluation).filter(Evaluation.id == evaluation_id).first()
    if not db_eval:
        raise HTTPException(status_code=404, detail="Evaluation not found")
        
    # 2. Load basic state
    vendors = [{"id": str(v.id), "name": v.name} for v in db.query(Vendor).filter(Vendor.evaluation_id == evaluation_id).all()]
    vendors_map = {v["id"]: v["name"] for v in vendors}
    
    reqs = [{"id": str(r.id), "weight": float(r.weight), "priority": r.priority} for r in db.query(Requirement).filter(Requirement.evaluation_id == evaluation_id).all()]
    
    # 3. Load cached DB analysis
    db_analysis = db.query(VendorAnalysis).filter(VendorAnalysis.evaluation_id == str(evaluation_id)).all()
    cached_analysis = [{"vendor_id": str(a.vendor_id), "requirement_id": str(a.requirement_id), "status": a.status} for a in db_analysis]
    
    db_risks = db.query(Risk).filter(Risk.evaluation_id == str(evaluation_id)).all()
    cached_risks = [{"vendor_id": str(r.vendor_id), "risk_type": r.risk_type, "severity": r.severity, "description": r.description} for r in db_risks]
    
    db_costs = db.query(VendorCost).filter(VendorCost.evaluation_id == str(evaluation_id)).all()
    cached_costs = [{"vendor_id": str(c.vendor_id), "estimated_tco": float(c.estimated_tco) if c.estimated_tco else None} for c in db_costs]
    
    # 4. Calculate raw scores using ScoringService (same as ComparisonAgent)
    requirement_scores_raw = {}
    for v in vendors:
        v_analysis = [a for a in cached_analysis if a["vendor_id"] == v["id"]]
        requirement_scores_raw[v["id"]] = ScoringService.calculate_requirement_score(reqs, v_analysis)
        
    risk_penalties = {}
    for v in vendors:
        v_risks = [r for r in cached_risks if r["vendor_id"] == v["id"]]
        risk_penalties[v["id"]] = ScoringService.calculate_risk_penalty(v_risks)
        
    tco_map = {c["vendor_id"]: c["estimated_tco"] for c in cached_costs}
    commercial_scores_raw = ScoringService.calculate_commercial_scores(tco_map)
    
    # 5. Calculate new breakdown and ranking
    # ----------------------------------------------------
    # THE FIX: pass tco_map down
    # ----------------------------------------------------
    new_breakdown = DecisionInsightsService.calculate_contributions(
        vendors, requirement_scores_raw, commercial_scores_raw, risk_penalties, req.priorities, tco_map
    )
    new_ranking = sorted(new_breakdown.keys(), key=lambda vid: new_breakdown[vid]["final_score"], reverse=True)
    
    ranking_explanation = None
    if req.previous_priorities:
        old_breakdown = DecisionInsightsService.calculate_contributions(
            vendors, requirement_scores_raw, commercial_scores_raw, risk_penalties, req.previous_priorities, tco_map
        )
        old_ranking = sorted(old_breakdown.keys(), key=lambda vid: old_breakdown[vid]["final_score"], reverse=True)
        ranking_explanation = DecisionInsightsService.generate_ranking_change_explanation(
            old_ranking, new_ranking, req.previous_priorities, req.priorities, new_breakdown, vendors_map
        )
        
    confidence = DecisionInsightsService.calculate_decision_confidence(cached_analysis, cached_costs, cached_risks, new_breakdown)
    alerts = DecisionInsightsService.generate_procurement_alerts(cached_costs, cached_risks, cached_analysis, vendors_map)
    
    return {
        "evaluation_id": str(evaluation_id),
        "comparison": new_breakdown,
        "ranking": new_ranking,
        "ranking_explanation": ranking_explanation,
        "decision_confidence": confidence,
        "alerts": alerts,
        "recommended_vendor_id": new_ranking[0] if new_ranking else None
    }


from fastapi.responses import StreamingResponse
from backend.services.report_service import ReportService
from backend.services.scoring_service import ScoringService

@router.get("/{evaluation_id}/report")
def generate_procurement_report(evaluation_id: UUID, db: Session = Depends(get_db)):
    try:
        eval_record = db.query(Evaluation).filter(Evaluation.id == evaluation_id).first()
        if not eval_record:
            raise HTTPException(status_code=404, detail="Evaluation not found")
            
        vendors = [{"id": str(v.id), "name": v.name} for v in db.query(Vendor).filter(Vendor.evaluation_id == evaluation_id).all()]
        reqs = [{"id": str(r.id), "name": r.name, "weight": float(r.weight), "priority": r.priority} for r in db.query(Requirement).filter(Requirement.evaluation_id == evaluation_id).all()]
        
        db_analysis = db.query(VendorAnalysis).filter(VendorAnalysis.evaluation_id == str(evaluation_id)).all()
        cached_analysis = [{"vendor_id": str(a.vendor_id), "requirement_id": str(a.requirement_id), "status": a.status, "explanation": a.explanation, "evidence": a.evidence, "page_number": a.page_number, "section": a.section} for a in db_analysis]
        
        db_risks = db.query(Risk).filter(Risk.evaluation_id == str(evaluation_id)).all()
        cached_risks = [{"vendor_id": str(r.vendor_id), "risk_type": r.risk_type, "description": r.description, "severity": r.severity, "evidence": r.evidence, "page_number": r.page_number, "section": r.section} for r in db_risks]
        
        db_costs = db.query(VendorCost).filter(VendorCost.evaluation_id == str(evaluation_id)).all()
        cached_costs = [{"vendor_id": str(c.vendor_id), "subscription_cost": float(c.subscription_cost) if c.subscription_cost else None, "implementation_cost": float(c.implementation_cost) if c.implementation_cost else None, "support_cost": float(c.support_cost) if c.support_cost else None, "usage_cost": float(c.usage_cost) if c.usage_cost else None, "additional_costs": float(c.additional_costs) if c.additional_costs else None, "estimated_tco": float(c.estimated_tco) if c.estimated_tco else None, "is_estimated": c.is_estimated, "notes": c.notes} for c in db_costs]
        
        db_rec = db.query(Recommendation).filter(Recommendation.evaluation_id == str(evaluation_id)).first()
        cached_rec = {"recommended_vendor_id": str(db_rec.recommended_vendor_id) if db_rec.recommended_vendor_id else None, "explanation": db_rec.summary, "trade_offs": db_rec.reasoning} if db_rec else {}
        
        db_neg = db.query(NegotiationStrategy).filter(NegotiationStrategy.evaluation_id == str(evaluation_id)).all()
        cached_neg = [{"vendor_id": str(n.vendor_id), "leverage_points": n.leverage_points, "clarification_questions": n.clarification_questions} for n in db_neg]

        priorities = {"requirements": 50, "cost": 30, "risk": 20}
        
        req_raw = {}
        comm_raw = {}
        risk_raw = {}
        tco_map = {c["vendor_id"]: c["estimated_tco"] for c in cached_costs}
        
        comm_raw = ScoringService.calculate_commercial_scores(tco_map)
        
        for v in vendors:
            v_analysis = [a for a in cached_analysis if a["vendor_id"] == v["id"]]
            req_raw[v["id"]] = ScoringService.calculate_requirement_score(reqs, v_analysis)
            
            v_risks = [r for r in cached_risks if r["vendor_id"] == v["id"]]
            risk_raw[v["id"]] = ScoringService.calculate_risk_penalty(v_risks)
            
        breakdown = DecisionInsightsService.calculate_contributions(vendors, req_raw, comm_raw, risk_raw, priorities, tco_map)
        ranking = sorted(breakdown.keys(), key=lambda x: breakdown[x]["final_score"], reverse=True)
        
        vendors_map = {v["id"]: v["name"] for v in vendors}
        alerts = DecisionInsightsService.generate_procurement_alerts(cached_costs, cached_risks, cached_analysis, vendors_map)
        
        data = {
            "evaluation_name": eval_record.description or "Procurement Evaluation",
            "vendors": vendors,
            "requirements": reqs,
            "vendor_analysis": cached_analysis,
            "commercial_extraction": cached_costs,
            "risks": cached_risks,
            "recommendation": cached_rec,
            "negotiation": cached_neg,
            "priorities": priorities,
            "comparison": breakdown,
            "ranking": ranking,
            "alerts": alerts
        }
        
        report_service = ReportService(db)
        pdf_buffer = report_service.generate_report(str(evaluation_id), data)
        
        return StreamingResponse(
            pdf_buffer, 
            media_type="application/pdf", 
            headers={"Content-Disposition": f"attachment; filename=procurement_report_{evaluation_id}.pdf"}
        )
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        print(f"Error generating report: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail="Failed to generate report")


from backend.services.chat_service import ChatService

class CopilotChatRequest(BaseModel):
    message: str

@router.post("/{evaluation_id}/chat")
def copilot_chat(evaluation_id: UUID, req: CopilotChatRequest, db: Session = Depends(get_db)):
    # Validate evaluation
    db_eval = db.query(Evaluation).filter(Evaluation.id == evaluation_id).first()
    if not db_eval:
        raise HTTPException(status_code=404, detail="Evaluation not found")
        
    chat_service = ChatService(db)
    try:
        response = chat_service.chat(str(evaluation_id), req.message)
        return response
    except Exception as e:
        # Graceful LLM failure handling
        raise HTTPException(status_code=503, detail=str(e))

@router.get("/{evaluation_id}/chat/history")
def copilot_chat_history(evaluation_id: UUID, db: Session = Depends(get_db)):
    # Validate evaluation
    db_eval = db.query(Evaluation).filter(Evaluation.id == evaluation_id).first()
    if not db_eval:
        raise HTTPException(status_code=404, detail="Evaluation not found")
        
    chat_service = ChatService(db)
    try:
        history = chat_service.get_history(str(evaluation_id))
        return history
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to load chat history")

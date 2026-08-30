from sqlalchemy.orm import Session
from backend.models.models import Requirement, Vendor
from backend.agents.state import ProcurementState

class RequirementAgent:
    def __init__(self, db: Session):
        self.db = db

    def run(self, state: ProcurementState) -> dict:
        import time
        start_time = time.time()
        
        # Load Requirements
        db_reqs = self.db.query(Requirement).filter(
            Requirement.evaluation_id == state["evaluation_id"]
        ).all()
        
        reqs = [{
            "id": str(r.id),
            "name": r.name,
            "description": r.description,
            "priority": r.priority,
            "category": r.category,
            "weight": float(r.weight),
            "minimum_value": r.minimum_value,
            "preferred_value": r.preferred_value
        } for r in db_reqs]
        
        # Load Vendors
        db_vendors = self.db.query(Vendor).filter(
            Vendor.evaluation_id == state["evaluation_id"]
        ).all()
        
        vendors = [{
            "id": str(v.id),
            "name": v.name,
            "contact_info": v.contact_info
        } for v in db_vendors]
        
        duration = time.time() - start_time
        print(f"[PERF] requirement_agent: {duration:.2f} seconds")
        
        return {
            "requirements": reqs,
            "vendors": vendors,
            "execution_trace": ["requirement_agent"]
        }

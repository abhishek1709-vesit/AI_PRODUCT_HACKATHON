from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from typing import List
from uuid import UUID



from backend.database import get_db
from backend.models.models import Requirement, Evaluation
from backend.schemas.requirement import RequirementCreate, RequirementUpdate, RequirementResponse

router = APIRouter(tags=["Requirements"])

@router.post("/api/evaluations/{evaluation_id}/requirements", response_model=RequirementResponse)
def create_requirement(evaluation_id: UUID, req_in: RequirementCreate, db: Session = Depends(get_db)):
    try:
        # Check if evaluation exists to prevent foreign key errors leaking
        db_eval = db.query(Evaluation).filter(Evaluation.id == evaluation_id).first()
        if not db_eval:
            raise HTTPException(status_code=404, detail="Evaluation not found")

        db_req = Requirement(**req_in.model_dump(), evaluation_id=evaluation_id)
        db.add(db_req)
        db.commit()
        db.refresh(db_req)
        return db_req
    except HTTPException:
        raise
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Database constraint error.")
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Database error occurred.")

@router.get("/api/evaluations/{evaluation_id}/requirements", response_model=List[RequirementResponse])
def get_requirements(evaluation_id: UUID, db: Session = Depends(get_db)):
    try:
        db_eval = db.query(Evaluation).filter(Evaluation.id == evaluation_id).first()
        if not db_eval:
            raise HTTPException(status_code=404, detail="Evaluation not found")
            
        return db.query(Requirement).filter(Requirement.evaluation_id == evaluation_id).all()
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=500, detail="Database error occurred.")

@router.put("/api/requirements/{requirement_id}", response_model=RequirementResponse)
def update_requirement(requirement_id: UUID, req_in: RequirementUpdate, db: Session = Depends(get_db)):
    try:
        db_req = db.query(Requirement).filter(Requirement.id == requirement_id).first()
        if not db_req:
            raise HTTPException(status_code=404, detail="Requirement not found")
        
        update_data = req_in.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_req, key, value)
            
        db.commit()
        db.refresh(db_req)
        return db_req
    except HTTPException:
        raise
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Database constraint error.")
    except Exception:
        db.rollback()
        raise HTTPException(status_code=500, detail="Database error occurred.")

@router.delete("/api/requirements/{requirement_id}")
def delete_requirement(requirement_id: UUID, db: Session = Depends(get_db)):
    try:
        db_req = db.query(Requirement).filter(Requirement.id == requirement_id).first()
        if not db_req:
            raise HTTPException(status_code=404, detail="Requirement not found")
            
        db.delete(db_req)
        db.commit()
        return {"detail": "Requirement deleted successfully"}
    except HTTPException:
        raise
    except Exception:
        db.rollback()
        raise HTTPException(status_code=500, detail="Database error occurred.")

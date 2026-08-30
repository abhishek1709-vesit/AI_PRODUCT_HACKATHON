from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from typing import List
from uuid import UUID



from backend.database import get_db
from backend.models.models import Vendor, Evaluation
from backend.schemas.vendor import VendorCreate, VendorUpdate, VendorResponse

router = APIRouter(tags=["Vendors"])

@router.post("/api/evaluations/{evaluation_id}/vendors", response_model=VendorResponse)
def create_vendor(evaluation_id: UUID, vendor_in: VendorCreate, db: Session = Depends(get_db)):
    try:
        db_eval = db.query(Evaluation).filter(Evaluation.id == evaluation_id).first()
        if not db_eval:
            raise HTTPException(status_code=404, detail="Evaluation not found")

        db_vendor = Vendor(**vendor_in.model_dump(), evaluation_id=evaluation_id)
        db.add(db_vendor)
        db.commit()
        db.refresh(db_vendor)
        return db_vendor
    except HTTPException:
        raise
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Database constraint error.")
    except Exception:
        db.rollback()
        raise HTTPException(status_code=500, detail="Database error occurred.")

@router.get("/api/evaluations/{evaluation_id}/vendors", response_model=List[VendorResponse])
def get_vendors(evaluation_id: UUID, db: Session = Depends(get_db)):
    try:
        db_eval = db.query(Evaluation).filter(Evaluation.id == evaluation_id).first()
        if not db_eval:
            raise HTTPException(status_code=404, detail="Evaluation not found")
            
        return db.query(Vendor).filter(Vendor.evaluation_id == evaluation_id).all()
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=500, detail="Database error occurred.")

@router.get("/api/vendors/{vendor_id}", response_model=VendorResponse)
def get_vendor(vendor_id: UUID, db: Session = Depends(get_db)):
    try:
        db_vendor = db.query(Vendor).filter(Vendor.id == vendor_id).first()
        if not db_vendor:
            raise HTTPException(status_code=404, detail="Vendor not found")
        return db_vendor
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=500, detail="Database error occurred.")

@router.put("/api/vendors/{vendor_id}", response_model=VendorResponse)
def update_vendor(vendor_id: UUID, vendor_in: VendorUpdate, db: Session = Depends(get_db)):
    try:
        db_vendor = db.query(Vendor).filter(Vendor.id == vendor_id).first()
        if not db_vendor:
            raise HTTPException(status_code=404, detail="Vendor not found")
        
        update_data = vendor_in.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_vendor, key, value)
            
        db.commit()
        db.refresh(db_vendor)
        return db_vendor
    except HTTPException:
        raise
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Database constraint error.")
    except Exception:
        db.rollback()
        raise HTTPException(status_code=500, detail="Database error occurred.")

@router.delete("/api/vendors/{vendor_id}")
def delete_vendor(vendor_id: UUID, db: Session = Depends(get_db)):
    try:
        db_vendor = db.query(Vendor).filter(Vendor.id == vendor_id).first()
        if not db_vendor:
            raise HTTPException(status_code=404, detail="Vendor not found")
            
        db.delete(db_vendor)
        db.commit()
        return {"detail": "Vendor deleted successfully"}
    except HTTPException:
        raise
    except Exception:
        db.rollback()
        raise HTTPException(status_code=500, detail="Database error occurred.")

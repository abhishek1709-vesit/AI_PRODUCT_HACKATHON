from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List, Any, Dict
from backend.database import get_db
from backend.services.rag_service import RAGService

router = APIRouter(tags=["RAG"])

class RAGRequest(BaseModel):
    query: str
    evaluation_id: Optional[str] = None
    vendor_id: Optional[str] = None
    proposal_id: Optional[str] = None
    top_k: int = 5

@router.post("/api/rag/query")
def query_rag(req: RAGRequest, db: Session = Depends(get_db)):
    rag_service = RAGService(db)
    
    try:
        response = rag_service.query(
            query=req.query,
            evaluation_id=req.evaluation_id,
            vendor_id=req.vendor_id,
            proposal_id=req.proposal_id,
            top_k=req.top_k
        )
        return response
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

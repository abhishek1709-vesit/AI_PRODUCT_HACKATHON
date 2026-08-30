from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
from backend.database import get_db
from backend.services.retrieval_service import RetrievalService

router = APIRouter(tags=["Search"])

class SearchRequest(BaseModel):
    query: str
    evaluation_id: Optional[str] = None
    vendor_id: Optional[str] = None
    proposal_id: Optional[str] = None
    top_k: int = 5

class SearchResult(BaseModel):
    proposal_id: str
    vendor_id: str
    page_number: int
    section: str
    chunk_text: str
    score: float

class SearchResponse(BaseModel):
    query: str
    results: List[SearchResult]

@router.post("/api/search", response_model=SearchResponse)
def search_proposals(req: SearchRequest, db: Session = Depends(get_db)):
    retrieval_service = RetrievalService(db)
    
    try:
        results = retrieval_service.search(
            query=req.query,
            evaluation_id=req.evaluation_id,
            vendor_id=req.vendor_id,
            proposal_id=req.proposal_id,
            top_k=req.top_k
        )
        return {
            "query": req.query,
            "results": results
        }
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Search failed.")

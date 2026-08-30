import uuid
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID



from backend.database import get_db
from backend.models.models import Proposal, Vendor, Evaluation
from backend.schemas.proposal import ProposalResponse
from backend.services.storage import StorageService

router = APIRouter(tags=["Proposals"])
storage_service = StorageService()

MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB limit for proposals

@router.post("/api/evaluations/{evaluation_id}/vendors/{vendor_id}/proposals", response_model=ProposalResponse)
async def upload_proposal(
    evaluation_id: UUID,
    vendor_id: UUID,
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    # Validate PDF
    if not file.filename.lower().endswith(".pdf") or file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Only PDF files are allowed.")

    file_bytes = await file.read()
    if len(file_bytes) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail=f"File exceeds maximum size of {MAX_FILE_SIZE / 1024 / 1024} MB.")
    if len(file_bytes) == 0:
        raise HTTPException(status_code=400, detail="File is empty.")

    # Validate evaluation & vendor exist and belong to each other
    db_eval = db.query(Evaluation).filter(Evaluation.id == evaluation_id).first()
    if not db_eval:
        raise HTTPException(status_code=404, detail="Evaluation not found.")
    
    db_vendor = db.query(Vendor).filter(Vendor.id == vendor_id, Vendor.evaluation_id == evaluation_id).first()
    if not db_vendor:
        raise HTTPException(status_code=404, detail="Vendor not found or does not belong to this evaluation.")

    proposal_id = str(uuid.uuid4())
    storage_path = f"{evaluation_id}/{vendor_id}/{proposal_id}.pdf"

    # 1. Upload to Storage
    try:
        storage_service.upload_file(storage_path, file_bytes, "application/pdf")
    except Exception as e:
        print(f"Storage upload error: {e}")
        raise HTTPException(status_code=500, detail="Failed to upload file to storage.")

    # 2. Save DB Record
    try:
        db_proposal = Proposal(
            id=proposal_id,
            evaluation_id=evaluation_id,
            vendor_id=vendor_id,
            file_name=file.filename,
            storage_path=storage_path,
            processing_status="pending"
        )
        db.add(db_proposal)
        db.commit()
        db.refresh(db_proposal)
        return db_proposal
    except Exception as e:
        db.rollback()
        # Rollback storage
        try:
            storage_service.delete_file(storage_path)
        except Exception as delete_error:
            print(f"Failed to cleanup storage after DB error: {delete_error}")
        raise HTTPException(status_code=500, detail="Database error. Upload reverted.")

@router.get("/api/evaluations/{evaluation_id}/proposals", response_model=List[ProposalResponse])
def get_eval_proposals(evaluation_id: UUID, db: Session = Depends(get_db)):
    return db.query(Proposal).filter(Proposal.evaluation_id == evaluation_id).order_by(Proposal.uploaded_at.desc()).all()

@router.get("/api/vendors/{vendor_id}/proposals", response_model=List[ProposalResponse])
def get_vendor_proposals(vendor_id: UUID, db: Session = Depends(get_db)):
    return db.query(Proposal).filter(Proposal.vendor_id == vendor_id).order_by(Proposal.uploaded_at.desc()).all()

@router.get("/api/proposals/{proposal_id}", response_model=ProposalResponse)
def get_proposal(proposal_id: UUID, db: Session = Depends(get_db)):
    proposal = db.query(Proposal).filter(Proposal.id == proposal_id).first()
    if not proposal:
        raise HTTPException(status_code=404, detail="Proposal not found")
    return proposal

@router.delete("/api/proposals/{proposal_id}")
def delete_proposal(proposal_id: UUID, db: Session = Depends(get_db)):
    proposal = db.query(Proposal).filter(Proposal.id == proposal_id).first()
    if not proposal:
        raise HTTPException(status_code=404, detail="Proposal not found")
    
    # 1. Delete from storage
    try:
        storage_service.delete_file(proposal.storage_path)
    except Exception as e:
        print(f"Error deleting file from storage: {e}")
        # Decide if we still want to delete the DB record. Usually yes, to remove broken state.
        pass

    # 2. Delete from DB
    try:
        db.delete(proposal)
        db.commit()
        return {"detail": "Proposal deleted successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Database error during deletion.")

@router.post("/api/proposals/{proposal_id}/process")
def process_proposal(proposal_id: UUID, db: Session = Depends(get_db)):
    from backend.services.document_processor import DocumentProcessor
    processor = DocumentProcessor(db)
    
    try:
        chunk_count = processor.process_proposal(str(proposal_id))
        return {"proposal_id": str(proposal_id), "status": "completed", "chunk_count": chunk_count}
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail="An error occurred during processing.")

@router.get("/api/proposals/{proposal_id}/status")
def get_proposal_status(proposal_id: UUID, db: Session = Depends(get_db)):
    from backend.models.models import Proposal, ProposalChunk
    proposal = db.query(Proposal).filter(Proposal.id == proposal_id).first()
    if not proposal:
        raise HTTPException(status_code=404, detail="Proposal not found")
        
    chunk_count = db.query(ProposalChunk).filter(ProposalChunk.proposal_id == proposal_id).count()
    
    return {
        "proposal_id": str(proposal_id),
        "processing_status": proposal.processing_status,
        "chunk_count": chunk_count
    }
@router.post("/api/proposals/{proposal_id}/embed")
def embed_proposal(proposal_id: UUID, db: Session = Depends(get_db)):
    from backend.models.models import Proposal, ProposalChunk
    from backend.services.embedding_service import EmbeddingService
    
    proposal = db.query(Proposal).filter(Proposal.id == proposal_id).first()
    if not proposal:
        raise HTTPException(status_code=404, detail="Proposal not found")
        
    embed_service = EmbeddingService()
    
    try:
        embedded_count = embed_service.process_proposal_chunks(db, str(proposal_id))
        total_chunks = db.query(ProposalChunk).filter(ProposalChunk.proposal_id == proposal_id).count()
        return {
            "proposal_id": str(proposal_id),
            "chunks_total": total_chunks,
            "chunks_embedded": embedded_count,
            "embedding_model": embed_service.model_name,
            "embedding_dimension": embed_service.dimension
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Embedding generation failed: {str(e)}")

@router.get("/api/proposals/{proposal_id}/pdf-url")
def get_proposal_pdf_url(proposal_id: UUID, db: Session = Depends(get_db)):
    """
    Returns a short-lived signed URL for viewing the vendor proposal PDF.
    Does NOT expose raw storage paths or filesystem locations.
    """
    proposal = db.query(Proposal).filter(Proposal.id == proposal_id).first()
    if not proposal:
        raise HTTPException(status_code=404, detail="Proposal not found")

    try:
        signed_url = storage_service.create_signed_url(proposal.storage_path, expires_in=3600)
        if not signed_url:
            raise HTTPException(status_code=500, detail="Could not generate signed URL for proposal.")
        return {
            "proposal_id": str(proposal_id),
            "vendor_id": str(proposal.vendor_id),
            "file_name": proposal.file_name,
            "pdf_url": signed_url
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error generating PDF URL for proposal {proposal_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate PDF access URL.")

@router.get("/api/proposals/{proposal_id}/embedding-status")
def get_embedding_status(proposal_id: UUID, db: Session = Depends(get_db)):
    from backend.models.models import Proposal, ProposalChunk
    from backend.services.embedding_service import EmbeddingService
    
    proposal = db.query(Proposal).filter(Proposal.id == proposal_id).first()
    if not proposal:
        raise HTTPException(status_code=404, detail="Proposal not found")
        
    total_chunks = db.query(ProposalChunk).filter(ProposalChunk.proposal_id == proposal_id).count()
    embedded_chunks = db.query(ProposalChunk).filter(ProposalChunk.proposal_id == proposal_id, ProposalChunk.embedding.is_not(None)).count()
    
    embed_service = EmbeddingService()
    
    return {
        "proposal_id": str(proposal_id),
        "total_chunks": total_chunks,
        "embedded_chunks": embedded_chunks,
        "missing_embeddings": total_chunks - embedded_chunks,
        "embedding_model": embed_service.model_name
    }

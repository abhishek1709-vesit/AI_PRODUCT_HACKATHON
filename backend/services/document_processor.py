import fitz  # PyMuPDF
import re

from sqlalchemy.orm import Session
from backend.models.models import Proposal, ProposalChunk
from backend.services.storage import StorageService

class DocumentProcessor:
    def __init__(self, db: Session):
        self.db = db
        self.storage = StorageService("proposals")

    def process_proposal(self, proposal_id: str):
        proposal = self.db.query(Proposal).filter(Proposal.id == proposal_id).first()
        if not proposal:
            raise ValueError("Proposal not found")
            
        # Check idempotency: If already completed and chunks exist, skip reprocessing
        existing_chunks = self.db.query(ProposalChunk).filter(ProposalChunk.proposal_id == proposal_id).count()
        if proposal.processing_status in ["completed", "ready"] and existing_chunks > 0:
            print(f"[PIPELINE] Proposal {proposal_id} already processed. Skipping PDF extraction.")
            return existing_chunks
        
        print(f"[PIPELINE] Processing started for {proposal_id}")
        # 1. Update status to processing
        proposal.processing_status = "processing"
        self.db.commit()

        try:
            # 2. Download PDF
            # In Supabase storage python client, download returns bytes
            file_data = self.storage.supabase.storage.from_(self.storage.bucket).download(proposal.storage_path)
            
            # 3. Extract text page-aware
            pages = self.extract_text_from_pdf(file_data)
            
            # 4. Section detection & Chunking
            chunks = self.create_chunks(pages)
            
            if not chunks:
                raise ValueError("No extractable text found in PDF.")

            # 5. DB insert (clear old first)
            self.db.query(ProposalChunk).filter(ProposalChunk.proposal_id == proposal_id).delete()
            
            for chunk in chunks:
                db_chunk = ProposalChunk(
                    proposal_id=proposal.id,
                    vendor_id=proposal.vendor_id,
                    evaluation_id=proposal.evaluation_id,
                    page_number=chunk["page_number"],
                    section=chunk["section"],
                    chunk_text=chunk["chunk_text"]
                )
                self.db.add(db_chunk)
            
            # 6. Update status to completed
            proposal.processing_status = "completed"
            self.db.commit()
            
            print(f"[PIPELINE] Processing completed: {len(chunks)} chunks")
            return len(chunks)
            
        except Exception as e:
            print(f"[PIPELINE] Processing failed: {str(e)}")
            proposal.processing_status = "failed"
            self.db.commit()
            raise ValueError(f"Processing failed: {str(e)}")

    def extract_text_from_pdf(self, file_bytes: bytes):
        pages = []
        with fitz.open(stream=file_bytes, filetype="pdf") as doc:
            for i in range(len(doc)):
                page = doc[i]
                text = page.get_text("text").strip()
                if text:
                    pages.append({
                        "page_number": i + 1,
                        "text": text
                    })
        return pages

    def detect_section(self, text: str) -> str:
        # Simple heuristic: Look for known headings early in the text block
        headings = [
            "Executive Summary", "Pricing", "Commercial Terms", "Contract Terms",
            "Technical Requirements", "Security", "Compliance", "Support",
            "Implementation", "SLA", "Service Level Agreement", "Termination"
        ]
        text_upper = text.upper()
        
        best_heading = "Unknown"
        best_pos = float('inf')
        for h in headings:
            pos = text_upper.find(h.upper())
            # If found near the beginning of a chunk (first 150 chars)
            if 0 <= pos < min(150, best_pos):
                best_pos = pos
                best_heading = h
        return best_heading

    def create_chunks(self, pages: list, chunk_size=150, overlap=30):
        # Using word counts for chunking instead of chars for readability
        # 150 words ~ 800-1000 characters (tokens)
        chunks = []
        current_section = "Unknown"
        
        for page in pages:
            text = page["text"]
            page_num = page["page_number"]
            
            words = text.split()
            
            if not words:
                continue
                
            i = 0
            while i < len(words):
                chunk_words = words[i:i + chunk_size]
                chunk_text = " ".join(chunk_words)
                
                # Check for new section in this chunk
                found_section = self.detect_section(chunk_text)
                if found_section != "Unknown":
                    current_section = found_section
                
                chunks.append({
                    "page_number": page_num,
                    "section": current_section,
                    "chunk_text": chunk_text
                })
                
                # If we've reached the end of the page's words
                if i + chunk_size >= len(words):
                    break
                    
                i += (chunk_size - overlap)
                
        return chunks

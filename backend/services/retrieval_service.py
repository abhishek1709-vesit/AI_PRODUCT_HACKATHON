from typing import List, Optional
from uuid import UUID
from sqlalchemy.orm import Session
from backend.models.models import ProposalChunk
from backend.services.embedding_service import EmbeddingService

class RetrievalService:
    def __init__(self, db: Session):
        self.db = db
        self.embed_service = EmbeddingService()
        self._query_cache = {}

    def search(
        self,
        query: str,
        evaluation_id: Optional[str] = None,
        vendor_id: Optional[str] = None,
        proposal_id: Optional[str] = None,
        top_k: int = 5
    ) -> List[dict]:
        import time
        start_time = time.time()
        
        if not query or not query.strip():
            raise ValueError("Query cannot be empty.")
            
        # 1. Generate normalized query embedding (cached)
        embed_start = time.time()
        if query in self._query_cache:
            query_embedding = self._query_cache[query]
        else:
            query_embedding = self.embed_service.embed_text(query)
            self._query_cache[query] = query_embedding
            
        embed_time = time.time() - embed_start
        print(f"[PERF] Embedding search query: {embed_time:.3f}s")

        # 2. Build the base query for retrieval
        base_query = self.db.query(ProposalChunk).filter(ProposalChunk.embedding.is_not(None))

        # 3. Apply scopes (filters)
        if evaluation_id:
            base_query = base_query.filter(ProposalChunk.evaluation_id == evaluation_id)
        if vendor_id:
            base_query = base_query.filter(ProposalChunk.vendor_id == vendor_id)
        if proposal_id:
            base_query = base_query.filter(ProposalChunk.proposal_id == proposal_id)
            
        # 4. Perform vector similarity search
        distance_col = ProposalChunk.embedding.cosine_distance(query_embedding).label("distance")
        
        results = base_query.with_entities(
            ProposalChunk,
            distance_col
        ).order_by(
            distance_col
        ).limit(top_k).all()

        # 5. Format results
        output = []
        for chunk, distance in results:
            # Cosine distance to Cosine Similarity: 1 - distance
            similarity = 1.0 - float(distance)
            output.append({
                "chunk_id": str(chunk.id),
                "proposal_id": str(chunk.proposal_id),
                "vendor_id": str(chunk.vendor_id),
                "evaluation_id": str(chunk.evaluation_id),
                "page_number": chunk.page_number,
                "section": chunk.section,
                "chunk_text": chunk.chunk_text,
                "score": round(similarity, 4)
            })

        duration = time.time() - start_time
        print(f"[PERF] Retrieval execution: {duration:.3f} seconds (returned {len(output)} chunks)")
        return output

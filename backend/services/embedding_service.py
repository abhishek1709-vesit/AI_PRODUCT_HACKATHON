import warnings

# Suppress noisy HuggingFace warnings
warnings.filterwarnings("ignore", category=FutureWarning)

class EmbeddingService:
    _instance = None
    _model = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(EmbeddingService, cls).__new__(cls)
            cls._instance.model_name = "sentence-transformers/all-MiniLM-L6-v2"
            cls._instance.dimension = 384
        return cls._instance

    def _get_model(self):
        if self._model is None:
            import psutil
            import os
            process = psutil.Process(os.getpid())
            print(f"[MEMORY] Before embedding model load: {process.memory_info().rss / 1024 / 1024:.2f} MB")
            
            print(f"Lazy loading embedding model: {self.model_name}...")
            # Lazy import to prevent massive startup memory usage
            from sentence_transformers import SentenceTransformer
            import torch
            
            self._model = SentenceTransformer(self.model_name, device="cpu")
            print(f"[MEMORY] After embedding model load: {process.memory_info().rss / 1024 / 1024:.2f} MB")
        return self._model

    def embed_text(self, text: str) -> list[float]:
        # Generate embedding and return as python list
        model = self._get_model()
        embedding = model.encode(text, normalize_embeddings=True)
        return embedding.tolist()

    def embed_texts(self, texts: list[str]) -> list[list[float]]:
        # Generate embeddings in batch and return as lists of lists
        model = self._get_model()
        embeddings = model.encode(texts, normalize_embeddings=True)
        return embeddings.tolist()

    def process_proposal_chunks(self, db_session, proposal_id: str, force_rebuild: bool = False):
        from backend.models.models import ProposalChunk
        
        # 1. Fetch chunks
        query = db_session.query(ProposalChunk).filter(ProposalChunk.proposal_id == proposal_id)
        if not force_rebuild:
            query = query.filter(ProposalChunk.embedding.is_(None))
            
        chunks = query.all()
        
        if not chunks:
            return 0
            
        # 2. Extract texts
        texts = [chunk.chunk_text for chunk in chunks]
        
        print(f"[PIPELINE] Embedding started for {proposal_id}")
        
        # 3. Generate embeddings
        embeddings = self.embed_texts(texts)
        
        # 4. Save to DB
        for chunk, emb in zip(chunks, embeddings):
            chunk.embedding = emb
            
        # 5. Mark proposal as ready
        from backend.models.models import Proposal
        proposal = db_session.query(Proposal).filter(Proposal.id == proposal_id).first()
        if proposal and proposal.processing_status != "ready":
            # Check if all chunks are now embedded
            total = db_session.query(ProposalChunk).filter(ProposalChunk.proposal_id == proposal_id).count()
            embedded = db_session.query(ProposalChunk).filter(ProposalChunk.proposal_id == proposal_id, ProposalChunk.embedding.is_not(None)).count()
            if total > 0 and embedded == total:
                proposal.processing_status = "ready"
                
        db_session.commit()
        print(f"[PIPELINE] Embedding completed: {len(chunks)} vectors")
        print(f"[PIPELINE] Proposal READY")
        return len(chunks)

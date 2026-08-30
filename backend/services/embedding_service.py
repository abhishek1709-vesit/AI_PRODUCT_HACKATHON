from sentence_transformers import SentenceTransformer
import torch
import warnings

# Suppress noisy HuggingFace warnings
warnings.filterwarnings("ignore", category=FutureWarning)

class EmbeddingService:
    _instance = None
    _model = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(EmbeddingService, cls).__new__(cls)
            cls._instance._initialize()
        return cls._instance

    def _initialize(self):
        self.model_name = "sentence-transformers/all-MiniLM-L6-v2"
        self.dimension = 384
        # Load the model on CPU
        print(f"Loading embedding model: {self.model_name}...")
        self._model = SentenceTransformer(self.model_name, device="cpu")
        print("Model loaded successfully.")

    def embed_text(self, text: str) -> list[float]:
        # Generate embedding and return as python list
        embedding = self._model.encode(text, normalize_embeddings=True)
        return embedding.tolist()

    def embed_texts(self, texts: list[str]) -> list[list[float]]:
        # Generate embeddings in batch and return as lists of lists
        embeddings = self._model.encode(texts, normalize_embeddings=True)
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

from sqlalchemy import Column, String, Integer, Numeric, Boolean, ForeignKey, DateTime, Text, text
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from pgvector.sqlalchemy import Vector
from backend.database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    email = Column(String, unique=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"))
    updated_at = Column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"))

    evaluations = relationship("Evaluation", back_populates="user", cascade="all, delete-orphan")

class Evaluation(Base):
    __tablename__ = "evaluations"
    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"))
    name = Column(String, nullable=False)
    description = Column(Text)
    status = Column(String, server_default="draft")
    created_at = Column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"))
    updated_at = Column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"))

    user = relationship("User", back_populates="evaluations")
    requirements = relationship("Requirement", back_populates="evaluation", cascade="all, delete-orphan")
    vendors = relationship("Vendor", back_populates="evaluation", cascade="all, delete-orphan")
    recommendations = relationship("Recommendation", back_populates="evaluation", cascade="all, delete-orphan")
    negotiation_strategies = relationship("NegotiationStrategy", back_populates="evaluation", cascade="all, delete-orphan")

class Requirement(Base):
    __tablename__ = "requirements"
    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    evaluation_id = Column(UUID(as_uuid=True), ForeignKey("evaluations.id", ondelete="CASCADE"))
    name = Column(String, nullable=False)
    description = Column(Text)
    category = Column(String)
    priority = Column(String)
    weight = Column(Numeric(5, 4), server_default="1.0")
    minimum_value = Column(Text)
    preferred_value = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"))
    updated_at = Column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"))

    evaluation = relationship("Evaluation", back_populates="requirements")
    vendor_analyses = relationship("VendorAnalysis", back_populates="requirement", cascade="all, delete-orphan")

class Vendor(Base):
    __tablename__ = "vendors"
    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    evaluation_id = Column(UUID(as_uuid=True), ForeignKey("evaluations.id", ondelete="CASCADE"))
    name = Column(String, nullable=False)
    contact_info = Column(Text)
    status = Column(String, server_default="pending")
    created_at = Column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"))
    updated_at = Column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"))

    evaluation = relationship("Evaluation", back_populates="vendors")
    proposals = relationship("Proposal", back_populates="vendor", cascade="all, delete-orphan")
    vendor_analyses = relationship("VendorAnalysis", back_populates="vendor", cascade="all, delete-orphan")
    risks = relationship("Risk", back_populates="vendor", cascade="all, delete-orphan")
    vendor_costs = relationship("VendorCost", back_populates="vendor", cascade="all, delete-orphan")

class Proposal(Base):
    __tablename__ = "proposals"
    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    vendor_id = Column(UUID(as_uuid=True), ForeignKey("vendors.id", ondelete="CASCADE"))
    evaluation_id = Column(UUID(as_uuid=True), ForeignKey("evaluations.id", ondelete="CASCADE"))
    file_name = Column(String, nullable=False)
    storage_path = Column(String, nullable=False)
    processing_status = Column(String, server_default="pending")
    uploaded_at = Column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"))
    created_at = Column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"))
    updated_at = Column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"))

    vendor = relationship("Vendor", back_populates="proposals")
    chunks = relationship("ProposalChunk", back_populates="proposal", cascade="all, delete-orphan")

class ProposalChunk(Base):
    __tablename__ = "proposal_chunks"
    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    proposal_id = Column(UUID(as_uuid=True), ForeignKey("proposals.id", ondelete="CASCADE"))
    vendor_id = Column(UUID(as_uuid=True), ForeignKey("vendors.id", ondelete="CASCADE"))
    evaluation_id = Column(UUID(as_uuid=True), ForeignKey("evaluations.id", ondelete="CASCADE"))
    page_number = Column(Integer)
    section = Column(Text)
    chunk_text = Column(Text, nullable=False)
    embedding = Column(Vector(384))
    created_at = Column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"))

    proposal = relationship("Proposal", back_populates="chunks")

class VendorAnalysis(Base):
    __tablename__ = "vendor_analysis"
    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    vendor_id = Column(UUID(as_uuid=True), ForeignKey("vendors.id", ondelete="CASCADE"))
    evaluation_id = Column(UUID(as_uuid=True), ForeignKey("evaluations.id", ondelete="CASCADE"))
    requirement_id = Column(UUID(as_uuid=True), ForeignKey("requirements.id", ondelete="CASCADE"))
    status = Column(String)
    explanation = Column(Text)
    evidence = Column(Text)
    page_number = Column(Integer)
    section = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"))
    updated_at = Column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"))

    vendor = relationship("Vendor", back_populates="vendor_analyses")
    requirement = relationship("Requirement", back_populates="vendor_analyses")

class Risk(Base):
    __tablename__ = "risks"
    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    vendor_id = Column(UUID(as_uuid=True), ForeignKey("vendors.id", ondelete="CASCADE"))
    evaluation_id = Column(UUID(as_uuid=True), ForeignKey("evaluations.id", ondelete="CASCADE"))
    risk_type = Column(String)
    description = Column(Text)
    severity = Column(String)
    evidence = Column(Text)
    page_number = Column(Integer)
    section = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"))
    updated_at = Column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"))

    vendor = relationship("Vendor", back_populates="risks")

class VendorCost(Base):
    __tablename__ = "vendor_costs"
    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    vendor_id = Column(UUID(as_uuid=True), ForeignKey("vendors.id", ondelete="CASCADE"))
    evaluation_id = Column(UUID(as_uuid=True), ForeignKey("evaluations.id", ondelete="CASCADE"))
    currency = Column(String, server_default="INR")
    subscription_cost = Column(Numeric)
    subscription_period = Column(String)
    implementation_cost = Column(Numeric)
    support_cost = Column(Numeric)
    support_period = Column(String)
    usage_cost = Column(Numeric)
    additional_costs = Column(Numeric)
    estimated_tco = Column(Numeric)
    is_estimated = Column(Boolean, server_default=text("true"))
    notes = Column(Text)
    evidence = Column(Text)
    page_number = Column(Integer)
    section = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"))
    updated_at = Column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"))

    vendor = relationship("Vendor", back_populates="vendor_costs")

class Recommendation(Base):
    __tablename__ = "recommendations"
    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    evaluation_id = Column(UUID(as_uuid=True), ForeignKey("evaluations.id", ondelete="CASCADE"))
    recommended_vendor_id = Column(UUID(as_uuid=True), ForeignKey("vendors.id", ondelete="SET NULL"))
    recommendation_score = Column(Numeric(5, 2))
    summary = Column(Text)
    reasoning = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"))
    updated_at = Column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"))

    evaluation = relationship("Evaluation", back_populates="recommendations")
    recommended_vendor = relationship("Vendor")

class NegotiationStrategy(Base):
    __tablename__ = "negotiation_strategies"
    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    evaluation_id = Column(UUID(as_uuid=True), ForeignKey("evaluations.id", ondelete="CASCADE"))
    vendor_id = Column(UUID(as_uuid=True), ForeignKey("vendors.id", ondelete="CASCADE"))
    strategy_details = Column(Text)
    clarification_questions = Column(JSONB)
    leverage_points = Column(JSONB)
    created_at = Column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"))
    updated_at = Column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"))

    evaluation = relationship("Evaluation", back_populates="negotiation_strategies")
    vendor = relationship("Vendor")

class ProcurementChatSession(Base):
    __tablename__ = "procurement_chat_sessions"
    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    evaluation_id = Column(UUID(as_uuid=True), ForeignKey("evaluations.id", ondelete="CASCADE"), unique=True)
    memory_summary = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"))
    updated_at = Column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"))

    evaluation = relationship("Evaluation")
    messages = relationship("ProcurementChatMessage", back_populates="session", cascade="all, delete-orphan")

class ProcurementChatMessage(Base):
    __tablename__ = "procurement_chat_messages"
    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    session_id = Column(UUID(as_uuid=True), ForeignKey("procurement_chat_sessions.id", ondelete="CASCADE"))
    role = Column(String)  # 'user' or 'assistant'
    content = Column(Text)
    sources = Column(JSONB) # Store JSON of sources used by the assistant
    created_at = Column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"))

    session = relationship("ProcurementChatSession", back_populates="messages")


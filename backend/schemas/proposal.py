from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime
from uuid import UUID

class ProposalBase(BaseModel):
    file_name: str
    processing_status: str = "pending"

class ProposalCreate(ProposalBase):
    pass

class ProposalResponse(ProposalBase):
    id: UUID
    vendor_id: UUID
    evaluation_id: UUID
    storage_path: str
    uploaded_at: datetime
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime
from uuid import UUID

class VendorBase(BaseModel):
    name: str
    contact_info: Optional[str] = None
    status: str = "pending"

class VendorCreate(VendorBase):
    pass

class VendorUpdate(BaseModel):
    name: Optional[str] = None
    contact_info: Optional[str] = None
    status: Optional[str] = None

class VendorResponse(VendorBase):
    id: UUID
    evaluation_id: UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

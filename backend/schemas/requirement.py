from pydantic import BaseModel, ConfigDict, Field
from typing import Optional
from datetime import datetime
from uuid import UUID

class RequirementBase(BaseModel):
    name: str
    description: Optional[str] = None
    category: Optional[str] = None
    priority: str = Field(default="nice_to_have", pattern="^(must_have|nice_to_have|optional)$")
    weight: float = Field(default=1.0)
    minimum_value: Optional[str] = None
    preferred_value: Optional[str] = None

class RequirementCreate(RequirementBase):
    pass

class RequirementUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    priority: Optional[str] = Field(None, pattern="^(must_have|nice_to_have|optional)$")
    weight: Optional[float] = None
    minimum_value: Optional[str] = None
    preferred_value: Optional[str] = None

class RequirementResponse(RequirementBase):
    id: UUID
    evaluation_id: UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

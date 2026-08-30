from pydantic import BaseModel, ConfigDict, Field
from typing import Optional, List
from datetime import datetime
from uuid import UUID

class EvaluationBase(BaseModel):
    name: str = Field(..., description="Name of the evaluation")
    description: Optional[str] = None
    status: str = Field(default="draft")

class EvaluationCreate(EvaluationBase):
    pass

class EvaluationUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None

class EvaluationResponse(EvaluationBase):
    id: UUID
    user_id: Optional[UUID] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

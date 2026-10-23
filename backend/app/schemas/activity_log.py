from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime
from uuid import UUID
from decimal import Decimal


class ActivityLogResponse(BaseModel):
    id: UUID
    rfq_id: UUID
    event_type: str
    description: str
    extension_minutes: Optional[Decimal] = None
    previous_close_time: Optional[datetime] = None
    new_close_time: Optional[datetime] = None
    actor: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

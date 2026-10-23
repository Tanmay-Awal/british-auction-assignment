from pydantic import BaseModel, Field, model_validator, ConfigDict
from typing import Optional, List
from datetime import datetime, date
from uuid import UUID
from decimal import Decimal
from app.models.enums import AuctionStatus, ExtensionTriggerType


class RFQBase(BaseModel):
    reference_id: str = Field(..., min_length=2, max_length=50, json_schema_extra={"example": "RFQ-2026-LON-NYC"})
    title: str = Field(..., min_length=3, max_length=255, json_schema_extra={"example": "London to New York 20x40ft FCL"})
    pickup_date: datetime = Field(..., json_schema_extra={"example": "2026-11-15T10:00:00Z"})
    bid_start_time: datetime = Field(..., json_schema_extra={"example": "2026-10-22T10:00:00Z"})
    bid_close_time: datetime = Field(..., json_schema_extra={"example": "2026-10-22T18:00:00Z"})
    forced_bid_close_time: datetime = Field(..., json_schema_extra={"example": "2026-10-22T19:00:00Z"})
    is_british_auction: bool = Field(default=True)
    trigger_window_minutes: Decimal = Field(default=Decimal("10.0"), gt=0, json_schema_extra={"example": 10.0})
    extension_duration_minutes: Decimal = Field(default=Decimal("5.0"), gt=0, json_schema_extra={"example": 5.0})
    extension_trigger_type: ExtensionTriggerType = Field(default=ExtensionTriggerType.BID_RECEIVED)

    @model_validator(mode="after")
    def validate_timestamps(self):
        if self.bid_close_time <= self.bid_start_time:
            raise ValueError("Bid Close Time must be strictly greater than Bid Start Time.")
        if self.forced_bid_close_time < self.bid_close_time:
            raise ValueError("Forced Bid Close Time must be greater than or equal to Bid Close Time.")
        return self


class RFQCreate(RFQBase):
    pass


class RFQUpdate(BaseModel):
    title: Optional[str] = None
    status: Optional[AuctionStatus] = None


class RFQListItem(BaseModel):
    id: UUID
    reference_id: str
    title: str
    pickup_date: datetime
    bid_start_time: datetime
    bid_close_time: datetime
    original_bid_close_time: datetime
    forced_bid_close_time: datetime
    is_british_auction: bool
    trigger_window_minutes: Decimal
    extension_duration_minutes: Decimal
    extension_trigger_type: str
    status: str
    current_lowest_bid: Optional[Decimal] = None
    lowest_bidder_carrier: Optional[str] = None
    total_bids_count: int = 0
    time_remaining_seconds: float = 0.0
    in_trigger_window: bool = False
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class RFQDetails(RFQListItem):
    pass

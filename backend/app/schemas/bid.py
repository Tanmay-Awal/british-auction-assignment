from pydantic import BaseModel, Field, model_validator
from typing import Optional
from datetime import datetime, date
from uuid import UUID
from decimal import Decimal


class BidCreate(BaseModel):
    carrier_name: str = Field(..., min_length=2, max_length=100, example="Maersk Line")
    freight_charges: Decimal = Field(..., ge=0, example=2400.00)
    origin_charges: Decimal = Field(..., ge=0, example=350.00)
    destination_charges: Decimal = Field(..., ge=0, example=450.00)
    transit_time_days: int = Field(..., gt=0, example=28)
    quote_validity: date = Field(..., example="2026-12-31")

    @model_validator(mode="after")
    def validate_positive_total(self):
        total = self.freight_charges + self.origin_charges + self.destination_charges
        if total <= 0:
            raise ValueError("Total quote amount must be strictly greater than 0.")
        return self


class BidResponse(BaseModel):
    id: UUID
    rfq_id: UUID
    carrier_name: str
    freight_charges: Decimal
    origin_charges: Decimal
    destination_charges: Decimal
    total_amount: Decimal
    transit_time_days: int
    quote_validity: date
    rank_at_submission: Optional[int] = None
    current_rank: Optional[int] = None
    rank_label: Optional[str] = None  # e.g., "L1", "L2", "L3"
    created_at: datetime

    class Config:
        from_attributes = True


class BidSubmissionResult(BaseModel):
    bid: BidResponse
    extended: bool
    extension_reason: Optional[str] = None
    new_bid_close_time: datetime
    forced_close_hit: bool
    current_status: str

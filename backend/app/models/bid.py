import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Numeric, Integer, Date, DateTime, ForeignKey, Index, CheckConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.core.database import Base


class Bid(Base):
    __tablename__ = "bids"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    rfq_id = Column(UUID(as_uuid=True), ForeignKey("rfqs.id", ondelete="CASCADE"), nullable=False, index=True)
    carrier_name = Column(String(100), nullable=False)
    
    # Specific charges requested in PDF Section 5
    freight_charges = Column(Numeric(14, 2), nullable=False)
    origin_charges = Column(Numeric(14, 2), nullable=False)
    destination_charges = Column(Numeric(14, 2), nullable=False)
    total_amount = Column(Numeric(14, 2), nullable=False)
    
    transit_time_days = Column(Integer, nullable=False)
    quote_validity = Column(Date, nullable=False)
    rank_at_submission = Column(Integer, nullable=True)
    
    created_at = Column(
        DateTime(timezone=True), 
        default=lambda: datetime.now(timezone.utc), 
        nullable=False,
        index=True
    )

    # Relationships
    rfq = relationship("RFQ", back_populates="bids")

    __table_args__ = (
        CheckConstraint("freight_charges >= 0", name="chk_bid_freight_non_negative"),
        CheckConstraint("origin_charges >= 0", name="chk_bid_origin_non_negative"),
        CheckConstraint("destination_charges >= 0", name="chk_bid_dest_non_negative"),
        CheckConstraint("total_amount > 0", name="chk_bid_total_positive"),
        CheckConstraint("transit_time_days > 0", name="chk_bid_transit_positive"),
        Index("idx_bids_rfq_total_time", "rfq_id", "total_amount", "created_at"),
    )

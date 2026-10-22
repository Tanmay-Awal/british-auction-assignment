import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Boolean, Numeric, DateTime, CheckConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.enums import AuctionStatus, ExtensionTriggerType


class RFQ(Base):
    __tablename__ = "rfqs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    reference_id = Column(String(50), unique=True, nullable=False, index=True)
    title = Column(String(255), nullable=False)
    pickup_date = Column(DateTime(timezone=True), nullable=False)
    bid_start_time = Column(DateTime(timezone=True), nullable=False)
    bid_close_time = Column(DateTime(timezone=True), nullable=False)
    original_bid_close_time = Column(DateTime(timezone=True), nullable=False)
    forced_bid_close_time = Column(DateTime(timezone=True), nullable=False)
    
    is_british_auction = Column(Boolean, default=True, nullable=False)
    trigger_window_minutes = Column(Numeric(6, 2), default=10.0, nullable=False)
    extension_duration_minutes = Column(Numeric(6, 2), default=5.0, nullable=False)
    extension_trigger_type = Column(
        String(50), 
        default=ExtensionTriggerType.BID_RECEIVED.value, 
        nullable=False
    )
    
    status = Column(
        String(30), 
        default=AuctionStatus.ACTIVE.value, 
        nullable=False, 
        index=True
    )
    
    created_at = Column(
        DateTime(timezone=True), 
        default=lambda: datetime.now(timezone.utc), 
        nullable=False
    )
    updated_at = Column(
        DateTime(timezone=True), 
        default=lambda: datetime.now(timezone.utc), 
        onupdate=lambda: datetime.now(timezone.utc), 
        nullable=False
    )

    # Relationships
    bids = relationship("Bid", back_populates="rfq", cascade="all, delete-orphan", order_by="Bid.total_amount.asc()")
    activity_logs = relationship("RFQActivityLog", back_populates="rfq", cascade="all, delete-orphan", order_by="RFQActivityLog.created_at.desc()")

    __table_args__ = (
        CheckConstraint("bid_close_time > bid_start_time", name="chk_rfq_close_after_start"),
        CheckConstraint("forced_bid_close_time >= bid_close_time", name="chk_rfq_forced_after_close"),
        CheckConstraint("trigger_window_minutes > 0 AND extension_duration_minutes > 0", name="chk_rfq_positive_configs"),
    )

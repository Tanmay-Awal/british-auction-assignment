import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Numeric, DateTime, ForeignKey, Text, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.core.database import Base


class RFQActivityLog(Base):
    __tablename__ = "rfq_activity_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    rfq_id = Column(UUID(as_uuid=True), ForeignKey("rfqs.id", ondelete="CASCADE"), nullable=False, index=True)
    event_type = Column(String(50), nullable=False)
    description = Column(Text, nullable=False)
    extension_minutes = Column(Numeric(6, 2), nullable=True)
    previous_close_time = Column(DateTime(timezone=True), nullable=True)
    new_close_time = Column(DateTime(timezone=True), nullable=True)
    actor = Column(String(100), nullable=False, default="System")
    created_at = Column(
        DateTime(timezone=True), 
        default=lambda: datetime.now(timezone.utc), 
        nullable=False,
        index=True
    )

    # Relationships
    rfq = relationship("RFQ", back_populates="activity_logs")

    __table_args__ = (
        Index("idx_logs_rfq_created_at", "rfq_id", "created_at"),
    )

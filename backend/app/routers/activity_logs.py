from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from typing import List
from uuid import UUID

from app.core.database import get_db
from app.models.activity_log import RFQActivityLog
from app.schemas.activity_log import ActivityLogResponse

router = APIRouter(prefix="/api/rfqs/{rfq_id}/logs", tags=["Activity Logs"])


@router.get("", response_model=List[ActivityLogResponse])
async def get_activity_logs(
    rfq_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    """
    Returns full chronological audit trail of bids, extensions, and lifecycle events for an RFQ.
    """
    stmt = (
        select(RFQActivityLog)
        .where(RFQActivityLog.rfq_id == rfq_id)
        .order_by(desc(RFQActivityLog.created_at))
    )
    result = await db.execute(stmt)
    logs = result.scalars().all()
    return logs

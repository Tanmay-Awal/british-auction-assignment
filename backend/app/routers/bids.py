from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from uuid import UUID

from app.core.database import get_db
from app.schemas.bid import BidCreate, BidResponse, BidSubmissionResult
from app.services.auction_engine import AuctionEngine

router = APIRouter(prefix="/api/rfqs/{rfq_id}/bids", tags=["Bids"])


@router.post("", response_model=BidSubmissionResult, status_code=status.HTTP_201_CREATED)
async def submit_bid(
    rfq_id: UUID,
    payload: BidCreate,
    db: AsyncSession = Depends(get_db)
):
    """
    Submits a carrier quote for the specified RFQ.
    Calculates rankings (L1, L2...), evaluates trigger window and dynamic British Auction extension.
    """
    return await AuctionEngine.submit_quote(
        db=db,
        rfq_id=rfq_id,
        quote_data=payload
    )


@router.get("", response_model=List[BidResponse])
async def get_bids(
    rfq_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    """
    Returns all bids for the RFQ sorted by total_amount ASC (L1, L2, L3...).
    """
    return await AuctionEngine.get_ranked_bids_for_rfq(db, rfq_id)

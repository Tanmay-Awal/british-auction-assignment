from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc, asc
from typing import List, Optional
from uuid import UUID
from datetime import datetime, timezone
from decimal import Decimal

from app.core.database import get_db
from app.models.rfq import RFQ
from app.models.bid import Bid
from app.models.activity_log import RFQActivityLog
from app.models.enums import AuctionStatus, ActivityEventType
from app.schemas.rfq import RFQCreate, RFQListItem, RFQDetails
from app.services.auction_engine import evaluate_auction_status, is_in_trigger_window

router = APIRouter(prefix="/api/rfqs", tags=["RFQs"])


def build_rfq_list_item(rfq: RFQ, current_time: datetime, bids: Optional[List[Bid]] = None) -> RFQListItem:
    computed_status = evaluate_auction_status(rfq, current_time)
    
    # Calculate time remaining to close
    close_time_utc = rfq.bid_close_time if rfq.bid_close_time.tzinfo else rfq.bid_close_time.replace(tzinfo=timezone.utc)
    remaining_secs = max(0.0, (close_time_utc - current_time).total_seconds())

    # Find lowest bid from loaded bids if present
    lowest_bid_amount = None
    lowest_carrier = None
    bids_list = bids or []
    if bids_list:
        sorted_bids = sorted(bids_list, key=lambda b: (b.total_amount, b.created_at))
        if sorted_bids:
            lowest_bid_amount = sorted_bids[0].total_amount
            lowest_carrier = sorted_bids[0].carrier_name

    in_window = is_in_trigger_window(rfq, current_time) if computed_status == AuctionStatus.ACTIVE.value else False

    return RFQListItem(
        id=rfq.id,
        reference_id=rfq.reference_id,
        title=rfq.title,
        pickup_date=rfq.pickup_date,
        bid_start_time=rfq.bid_start_time,
        bid_close_time=rfq.bid_close_time,
        original_bid_close_time=rfq.original_bid_close_time,
        forced_bid_close_time=rfq.forced_bid_close_time,
        is_british_auction=rfq.is_british_auction,
        trigger_window_minutes=rfq.trigger_window_minutes,
        extension_duration_minutes=rfq.extension_duration_minutes,
        extension_trigger_type=rfq.extension_trigger_type,
        status=computed_status,
        current_lowest_bid=lowest_bid_amount,
        lowest_bidder_carrier=lowest_carrier,
        total_bids_count=len(bids_list),
        time_remaining_seconds=remaining_secs,
        in_trigger_window=in_window,
        created_at=rfq.created_at,
        updated_at=rfq.updated_at,
    )


@router.post("", response_model=RFQDetails, status_code=status.HTTP_201_CREATED)
async def create_rfq(payload: RFQCreate, db: AsyncSession = Depends(get_db)):
    """
    Creates an RFQ with British Auction configuration.
    Enforces that Forced Close Time >= Bid Close Time and Bid Close Time > Bid Start Time.
    """
    # Check for duplicate reference_id
    existing_stmt = select(RFQ).where(RFQ.reference_id == payload.reference_id)
    existing = await db.scalar(existing_stmt)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"RFQ with Reference ID '{payload.reference_id}' already exists."
        )

    now = datetime.now(timezone.utc)
    
    # Create RFQ instance
    new_rfq = RFQ(
        reference_id=payload.reference_id,
        title=payload.title,
        pickup_date=payload.pickup_date,
        bid_start_time=payload.bid_start_time,
        bid_close_time=payload.bid_close_time,
        original_bid_close_time=payload.bid_close_time,
        forced_bid_close_time=payload.forced_bid_close_time,
        is_british_auction=payload.is_british_auction,
        trigger_window_minutes=payload.trigger_window_minutes,
        extension_duration_minutes=payload.extension_duration_minutes,
        extension_trigger_type=payload.extension_trigger_type.value,
        status=evaluate_auction_status(
            RFQ(
                bid_start_time=payload.bid_start_time,
                bid_close_time=payload.bid_close_time,
                forced_bid_close_time=payload.forced_bid_close_time,
            ),
            now
        ),
        created_at=now,
        updated_at=now,
    )
    db.add(new_rfq)
    await db.flush()

    # Log initial creation event
    initial_log = RFQActivityLog(
        rfq_id=new_rfq.id,
        event_type=ActivityEventType.RFQ_CREATED.value,
        description=f"RFQ created: '{new_rfq.title}' ({new_rfq.reference_id}). British Auction: {new_rfq.is_british_auction}, Window: {new_rfq.trigger_window_minutes}m, Extension: {new_rfq.extension_duration_minutes}m, Trigger: {new_rfq.extension_trigger_type}.",
        actor="System",
        created_at=now,
    )
    db.add(initial_log)

    await db.commit()
    await db.refresh(new_rfq)

    return build_rfq_list_item(new_rfq, now, bids=[])


@router.get("", response_model=List[RFQListItem])
async def list_rfqs(
    status_filter: Optional[str] = Query(None, description="Filter by status: ACTIVE, CLOSED, FORCE_CLOSED, DRAFT"),
    db: AsyncSession = Depends(get_db)
):
    """
    Auction Listing Page endpoint (PDF Section 8).
    Returns list of RFQs with status, current lowest bid, and countdown metrics.
    """
    stmt = select(RFQ).order_by(desc(RFQ.created_at))
    result = await db.execute(stmt)
    rfqs = result.scalars().all()

    now = datetime.now(timezone.utc)
    items = []
    
    for rfq in rfqs:
        # Load bids for lowest quote computation
        bids_stmt = select(Bid).where(Bid.rfq_id == rfq.id).order_by(asc(Bid.total_amount), asc(Bid.created_at))
        bids_res = await db.execute(bids_stmt)
        bids_list = bids_res.scalars().all()

        computed_status = evaluate_auction_status(rfq, now)
        if rfq.status != computed_status:
            rfq.status = computed_status
            await db.flush()

        if status_filter and computed_status.upper() != status_filter.upper():
            continue

        items.append(build_rfq_list_item(rfq, now, bids=bids_list))

    await db.commit()
    return items


@router.get("/{rfq_id}", response_model=RFQDetails)
async def get_rfq_details(rfq_id: UUID, db: AsyncSession = Depends(get_db)):
    """
    Auction Details Page header information (PDF Section 8).
    """
    stmt = select(RFQ).where(RFQ.id == rfq_id)
    rfq = await db.scalar(stmt)
    if not rfq:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"RFQ with ID {rfq_id} not found."
        )

    now = datetime.now(timezone.utc)
    bids_stmt = select(Bid).where(Bid.rfq_id == rfq.id).order_by(asc(Bid.total_amount), asc(Bid.created_at))
    bids_res = await db.execute(bids_stmt)
    bids_list = bids_res.scalars().all()

    computed_status = evaluate_auction_status(rfq, now)
    if rfq.status != computed_status:
        rfq.status = computed_status
        await db.commit()
        await db.refresh(rfq)

    return build_rfq_list_item(rfq, now, bids=bids_list)


@router.delete("/{rfq_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_rfq(rfq_id: UUID, db: AsyncSession = Depends(get_db)):
    """
    Deletes an RFQ and cascades to associated bids and activity logs.
    """
    stmt = select(RFQ).where(RFQ.id == rfq_id)
    rfq = await db.scalar(stmt)
    if not rfq:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"RFQ with ID {rfq_id} not found."
        )
    await db.delete(rfq)
    await db.commit()
    return None

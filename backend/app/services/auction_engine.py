from datetime import datetime, timezone, timedelta
from typing import List, Optional, Tuple, Dict, Any
from decimal import Decimal
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, and_, desc, asc
from fastapi import HTTPException, status

from app.models.rfq import RFQ
from app.models.bid import Bid
from app.models.activity_log import RFQActivityLog
from app.models.enums import AuctionStatus, ActivityEventType, ExtensionTriggerType
from app.schemas.bid import BidCreate, BidSubmissionResult, BidResponse
from app.services.extension_strategies import (
    get_extension_strategy,
    StrategyEvaluationContext,
)


def evaluate_auction_status(rfq: RFQ, current_time: Optional[datetime] = None) -> str:
    """
    Evaluates dynamic status based on current UTC wall-clock time.
    """
    if current_time is None:
        current_time = datetime.now(timezone.utc)
    
    # Ensure timezone awareness
    if current_time.tzinfo is None:
        current_time = current_time.replace(tzinfo=timezone.utc)
    if rfq.bid_close_time.tzinfo is None:
        rfq.bid_close_time = rfq.bid_close_time.replace(tzinfo=timezone.utc)
    if rfq.forced_bid_close_time.tzinfo is None:
        rfq.forced_bid_close_time = rfq.forced_bid_close_time.replace(tzinfo=timezone.utc)
    if rfq.bid_start_time.tzinfo is None:
        rfq.bid_start_time = rfq.bid_start_time.replace(tzinfo=timezone.utc)

    if current_time < rfq.bid_start_time:
        return AuctionStatus.DRAFT.value

    # If already past forced close time -> FORCE_CLOSED
    if current_time >= rfq.forced_bid_close_time:
        return AuctionStatus.FORCE_CLOSED.value

    # If past dynamic close time -> CLOSED
    if current_time >= rfq.bid_close_time:
        return AuctionStatus.CLOSED.value

    return AuctionStatus.ACTIVE.value


def is_in_trigger_window(rfq: RFQ, current_time: datetime) -> bool:
    """
    Checks if current_time falls within [bid_close_time - X minutes, bid_close_time]
    """
    if not rfq.is_british_auction:
        return False

    trigger_window_delta = timedelta(minutes=float(rfq.trigger_window_minutes))
    trigger_start_time = rfq.bid_close_time - trigger_window_delta

    return trigger_start_time <= current_time <= rfq.bid_close_time


class AuctionEngine:
    @staticmethod
    async def get_rfq_with_lock(db: AsyncSession, rfq_id: UUID) -> RFQ:
        """
        Retrieves RFQ with a row-level lock (SELECT FOR UPDATE) to prevent concurrency races.
        """
        stmt = select(RFQ).where(RFQ.id == rfq_id).with_for_update()
        result = await db.execute(stmt)
        rfq = result.scalar_one_or_none()
        if not rfq:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"RFQ with ID {rfq_id} not found."
            )
        return rfq

    @staticmethod
    async def get_ranked_bids_for_rfq(db: AsyncSession, rfq_id: UUID) -> List[BidResponse]:
        """
        Returns all bids for an RFQ sorted by total_amount ASC, created_at ASC with L1, L2 ranks.
        """
        stmt = (
            select(Bid)
            .where(Bid.rfq_id == rfq_id)
            .order_by(asc(Bid.total_amount), asc(Bid.created_at))
        )
        result = await db.execute(stmt)
        bids = result.scalars().all()

        ranked_bids = []
        for idx, b in enumerate(bids):
            rank = idx + 1
            ranked_bids.append(
                BidResponse(
                    id=b.id,
                    rfq_id=b.rfq_id,
                    carrier_name=b.carrier_name,
                    freight_charges=b.freight_charges,
                    origin_charges=b.origin_charges,
                    destination_charges=b.destination_charges,
                    total_amount=b.total_amount,
                    transit_time_days=b.transit_time_days,
                    quote_validity=b.quote_validity,
                    rank_at_submission=b.rank_at_submission,
                    current_rank=rank,
                    rank_label=f"L{rank}",
                    created_at=b.created_at,
                )
            )
        return ranked_bids

    @staticmethod
    async def submit_quote(
        db: AsyncSession,
        rfq_id: UUID,
        quote_data: BidCreate,
        current_time: Optional[datetime] = None
    ) -> BidSubmissionResult:
        if current_time is None:
            current_time = datetime.now(timezone.utc)
        elif current_time.tzinfo is None:
            current_time = current_time.replace(tzinfo=timezone.utc)

        # 1. Acquire row lock on RFQ
        rfq = await AuctionEngine.get_rfq_with_lock(db, rfq_id)

        # 2. Synchronize and validate status
        current_status = evaluate_auction_status(rfq, current_time)
        if rfq.status != current_status:
            rfq.status = current_status
            await db.flush()

        if current_status != AuctionStatus.ACTIVE.value:
            if current_status == AuctionStatus.FORCE_CLOSED.value:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Cannot submit quote: Auction is FORCE_CLOSED (reached hard ceiling)."
                )
            elif current_status == AuctionStatus.CLOSED.value:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Cannot submit quote: Auction is CLOSED."
                )
            elif current_status == AuctionStatus.DRAFT.value:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Cannot submit quote: Auction has not started yet (starts at {rfq.bid_start_time.isoformat()})."
                )

        # 3. Calculate total amount
        total_quote = quote_data.freight_charges + quote_data.origin_charges + quote_data.destination_charges

        # 4. Fetch existing bids to evaluate rankings before inserting new bid
        existing_bids_stmt = (
            select(Bid)
            .where(Bid.rfq_id == rfq_id)
            .order_by(asc(Bid.total_amount), asc(Bid.created_at))
        )
        existing_bids_result = await db.execute(existing_bids_stmt)
        existing_bids = existing_bids_result.scalars().all()

        total_existing_bids = len(existing_bids)
        prev_l1_carrier = existing_bids[0].carrier_name if total_existing_bids > 0 else None
        prev_l1_total = existing_bids[0].total_amount if total_existing_bids > 0 else None

        # Check if this carrier submitted earlier and what their previous rank was
        prev_rank_of_carrier = None
        for idx, b in enumerate(existing_bids):
            if b.carrier_name.strip().lower() == quote_data.carrier_name.strip().lower():
                prev_rank_of_carrier = idx + 1
                break

        # Calculate what the new bid's rank would be
        # Lowest total_amount wins; earlier timestamp breaks ties
        new_rank = 1
        for b in existing_bids:
            if total_quote >= b.total_amount:
                new_rank += 1
            else:
                break

        # 5. Check British Auction Extension Trigger
        extended = False
        extension_reason = None
        forced_close_hit = False
        previous_close = rfq.bid_close_time

        in_window = is_in_trigger_window(rfq, current_time)

        if rfq.is_british_auction and in_window:
            strategy = get_extension_strategy(rfq.extension_trigger_type)
            eval_ctx = StrategyEvaluationContext(
                carrier_name=quote_data.carrier_name,
                new_bid_total=total_quote,
                new_rank=new_rank,
                previous_rank_of_carrier=prev_rank_of_carrier,
                previous_l1_carrier=prev_l1_carrier,
                previous_l1_total=prev_l1_total,
                total_existing_bids=total_existing_bids,
            )
            strat_result = strategy.evaluate(eval_ctx)

            if strat_result.should_extend:
                extension_delta = timedelta(minutes=float(rfq.extension_duration_minutes))
                proposed_new_close = rfq.bid_close_time + extension_delta

                # Section 7 Validation Rule:
                # "Auction extensions must never exceed the Forced Bid Close Time"
                if proposed_new_close >= rfq.forced_bid_close_time:
                    if rfq.bid_close_time < rfq.forced_bid_close_time:
                        rfq.bid_close_time = rfq.forced_bid_close_time
                        extended = True
                        forced_close_hit = True
                        extension_reason = f"{strat_result.reason} [Note: Extended and clamped to Forced Bid Close Time ceiling!]"
                    else:
                        extended = False
                        forced_close_hit = True
                        extension_reason = f"{strat_result.reason} [Note: Cannot extend further; already at Forced Bid Close Time ceiling!]"
                else:
                    rfq.bid_close_time = proposed_new_close
                    extended = True
                    extension_reason = f"{strat_result.reason} (Extended by {rfq.extension_duration_minutes} mins)."

                if extended:
                    # Log Extension Activity
                    ext_log = RFQActivityLog(
                        rfq_id=rfq.id,
                        event_type=ActivityEventType.AUCTION_EXTENDED.value,
                        description=extension_reason,
                        extension_minutes=rfq.extension_duration_minutes,
                        previous_close_time=previous_close,
                        new_close_time=rfq.bid_close_time,
                        actor=quote_data.carrier_name,
                        created_at=current_time,
                    )
                    db.add(ext_log)

        # 6. Save the new Bid
        new_bid = Bid(
            rfq_id=rfq.id,
            carrier_name=quote_data.carrier_name,
            freight_charges=quote_data.freight_charges,
            origin_charges=quote_data.origin_charges,
            destination_charges=quote_data.destination_charges,
            total_amount=total_quote,
            transit_time_days=quote_data.transit_time_days,
            quote_validity=quote_data.quote_validity,
            rank_at_submission=new_rank,
            created_at=current_time,
        )
        db.add(new_bid)

        # 7. Log the Bid Submission Event
        bid_log = RFQActivityLog(
            rfq_id=rfq.id,
            event_type=ActivityEventType.BID_SUBMITTED.value,
            description=f"Quote submitted by '{quote_data.carrier_name}': Freight ${quote_data.freight_charges:,.2f}, Origin ${quote_data.origin_charges:,.2f}, Dest ${quote_data.destination_charges:,.2f} -> Total: ${total_quote:,.2f} (Rank L{new_rank}, Transit {quote_data.transit_time_days} days).",
            actor=quote_data.carrier_name,
            created_at=current_time,
        )
        db.add(bid_log)

        await db.commit()
        await db.refresh(new_bid)
        await db.refresh(rfq)

        return BidSubmissionResult(
            bid=BidResponse(
                id=new_bid.id,
                rfq_id=new_bid.rfq_id,
                carrier_name=new_bid.carrier_name,
                freight_charges=new_bid.freight_charges,
                origin_charges=new_bid.origin_charges,
                destination_charges=new_bid.destination_charges,
                total_amount=new_bid.total_amount,
                transit_time_days=new_bid.transit_time_days,
                quote_validity=new_bid.quote_validity,
                rank_at_submission=new_rank,
                current_rank=new_rank,
                rank_label=f"L{new_rank}",
                created_at=new_bid.created_at,
            ),
            extended=extended,
            extension_reason=extension_reason,
            new_bid_close_time=rfq.bid_close_time,
            forced_close_hit=forced_close_hit,
            current_status=rfq.status,
        )

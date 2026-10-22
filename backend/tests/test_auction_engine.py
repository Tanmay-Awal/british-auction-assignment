import pytest
from datetime import datetime, timezone, timedelta
from decimal import Decimal
from uuid import uuid4

from app.core.database import AsyncSessionLocal, engine, Base
from app.models.rfq import RFQ
from app.models.bid import Bid
from app.models.enums import AuctionStatus, ExtensionTriggerType
from app.schemas.bid import BidCreate
from app.services.auction_engine import AuctionEngine, evaluate_auction_status
from app.services.extension_strategies import (
    BidReceivedStrategy,
    AnyRankChangeStrategy,
    L1RankChangeStrategy,
    StrategyEvaluationContext
)


@pytest.mark.asyncio
async def test_extension_strategies_unit():
    # 1. Test BidReceivedStrategy
    strat_a = BidReceivedStrategy()
    ctx_a = StrategyEvaluationContext(
        carrier_name="Carrier A",
        new_bid_total=Decimal("2000.00"),
        new_rank=2,
        total_existing_bids=2
    )
    res_a = strat_a.evaluate(ctx_a)
    assert res_a.should_extend is True
    assert "during active trigger window" in res_a.reason

    # 2. Test AnyRankChangeStrategy
    strat_b = AnyRankChangeStrategy()
    # Case: Carrier shifts rank from L2 to L1
    ctx_b1 = StrategyEvaluationContext(
        carrier_name="Carrier B",
        new_bid_total=Decimal("1800.00"),
        new_rank=1,
        previous_rank_of_carrier=2,
        total_existing_bids=3
    )
    res_b1 = strat_b.evaluate(ctx_b1)
    assert res_b1.should_extend is True
    assert "shifted from L2 to L1" in res_b1.reason

    # Case: Carrier submits higher or same bid, remains L3
    ctx_b2 = StrategyEvaluationContext(
        carrier_name="Carrier C",
        new_bid_total=Decimal("2500.00"),
        new_rank=3,
        previous_rank_of_carrier=3,
        total_existing_bids=3
    )
    res_b2 = strat_b.evaluate(ctx_b2)
    assert res_b2.should_extend is False

    # 3. Test L1RankChangeStrategy
    strat_c = L1RankChangeStrategy()
    # Case: New bid becomes L1
    ctx_c1 = StrategyEvaluationContext(
        carrier_name="Carrier D",
        new_bid_total=Decimal("1500.00"),
        new_rank=1,
        previous_l1_carrier="Carrier A",
        previous_l1_total=Decimal("1600.00"),
        total_existing_bids=2
    )
    res_c1 = strat_c.evaluate(ctx_c1)
    assert res_c1.should_extend is True
    assert "beat 'Carrier A'" in res_c1.reason

    # Case: New bid is L2 (does NOT beat L1)
    ctx_c2 = StrategyEvaluationContext(
        carrier_name="Carrier E",
        new_bid_total=Decimal("1700.00"),
        new_rank=2,
        previous_l1_carrier="Carrier A",
        previous_l1_total=Decimal("1600.00"),
        total_existing_bids=2
    )
    res_c2 = strat_c.evaluate(ctx_c2)
    assert res_c2.should_extend is False
    assert "Current L1 remains" in res_c2.reason


@pytest.mark.asyncio
async def test_forced_close_ceiling_clamping():
    """
    Test Section 7 validation rule:
    'Auction extensions must never exceed the Forced Bid Close Time'
    """
    now = datetime.now(timezone.utc)
    rfq_id = uuid4()

    async with AsyncSessionLocal() as db:
        # Create an RFQ where close is at now + 2 mins, and Forced Close is at now + 3 mins
        # Extension is 5 mins (which would push close to now + 7 mins, exceeding forced close)
        test_rfq = RFQ(
            id=rfq_id,
            reference_id=f"TEST-CLAMP-{uuid4().hex[:6]}",
            title="Test Clamping Ceiling Route",
            pickup_date=now + timedelta(days=10),
            bid_start_time=now - timedelta(hours=1),
            bid_close_time=now + timedelta(minutes=2),
            original_bid_close_time=now + timedelta(minutes=2),
            forced_bid_close_time=now + timedelta(minutes=3),  # Hard stop at +3 mins
            is_british_auction=True,
            trigger_window_minutes=Decimal("5.0"),  # Active trigger window
            extension_duration_minutes=Decimal("5.0"),  # 5 min extension
            extension_trigger_type=ExtensionTriggerType.BID_RECEIVED.value,
            status=AuctionStatus.ACTIVE.value,
            created_at=now,
            updated_at=now,
        )
        db.add(test_rfq)
        await db.commit()

        # Submit quote inside trigger window
        quote = BidCreate(
            carrier_name="Speedy Logistics",
            freight_charges=Decimal("1000.00"),
            origin_charges=Decimal("100.00"),
            destination_charges=Decimal("100.00"),
            transit_time_days=10,
            quote_validity=(now + timedelta(days=20)).date(),
        )

        res = await AuctionEngine.submit_quote(db=db, rfq_id=rfq_id, quote_data=quote, current_time=now)

        assert res.extended is True
        assert res.forced_close_hit is True
        # Verify close time was clamped exactly to forced_bid_close_time
        assert res.new_bid_close_time == test_rfq.forced_bid_close_time
        assert "clamped to Forced Bid Close Time" in res.extension_reason


@pytest.mark.asyncio
async def test_auction_status_evaluation():
    now = datetime.now(timezone.utc)
    rfq = RFQ(
        bid_start_time=now - timedelta(hours=2),
        bid_close_time=now - timedelta(minutes=5),
        forced_bid_close_time=now + timedelta(hours=1),
    )
    # Past close time -> CLOSED
    assert evaluate_auction_status(rfq, now) == AuctionStatus.CLOSED.value

    # Past forced close time -> FORCE_CLOSED
    rfq.forced_bid_close_time = now - timedelta(minutes=1)
    assert evaluate_auction_status(rfq, now) == AuctionStatus.FORCE_CLOSED.value

    # Future start time -> DRAFT
    rfq.bid_start_time = now + timedelta(hours=1)
    assert evaluate_auction_status(rfq, now) == AuctionStatus.DRAFT.value

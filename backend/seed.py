import asyncio
from datetime import datetime, timezone, timedelta
from decimal import Decimal
from uuid import uuid4

from app.core.database import AsyncSessionLocal, engine, Base
from app.models.rfq import RFQ
from app.models.bid import Bid
from app.models.activity_log import RFQActivityLog
from app.models.enums import AuctionStatus, ExtensionTriggerType, ActivityEventType


async def seed_data():
    print("Connecting to PostgreSQL and resetting schema...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)

    now = datetime.now(timezone.utc)
    print(f"Current UTC time: {now.isoformat()}")

    async with AsyncSessionLocal() as db:
        # -------------------------------------------------------------
        # 1. RFQ-1: ACTIVE (Trigger: BID_RECEIVED)
        # -------------------------------------------------------------
        rfq1_id = uuid4()
        rfq1 = RFQ(
            id=rfq1_id,
            reference_id="RFQ-MUM-ROT-001",
            title="Mumbai JNPT to Rotterdam 40ft High Cube Container",
            pickup_date=now + timedelta(days=14),
            bid_start_time=now - timedelta(hours=2),
            bid_close_time=now + timedelta(minutes=45),  # 45 mins active bidding time
            original_bid_close_time=now + timedelta(minutes=45),
            forced_bid_close_time=now + timedelta(minutes=120),  # Hard stop ceiling
            is_british_auction=True,
            trigger_window_minutes=Decimal("15.0"),
            extension_duration_minutes=Decimal("3.0"),
            extension_trigger_type=ExtensionTriggerType.BID_RECEIVED.value,
            status=AuctionStatus.ACTIVE.value,
            created_at=now - timedelta(hours=2),
            updated_at=now,
        )
        db.add(rfq1)

        rfq1_bids = [
            Bid(
                rfq_id=rfq1_id,
                carrier_name="Maersk Line",
                freight_charges=Decimal("1600.00"),
                origin_charges=Decimal("250.00"),
                destination_charges=Decimal("300.00"),
                total_amount=Decimal("2150.00"),
                transit_time_days=24,
                quote_validity=(now + timedelta(days=30)).date(),
                rank_at_submission=1,
                created_at=now - timedelta(minutes=45),
            ),
            Bid(
                rfq_id=rfq1_id,
                carrier_name="MSC Mediterranean Shipping",
                freight_charges=Decimal("1750.00"),
                origin_charges=Decimal("250.00"),
                destination_charges=Decimal("300.00"),
                total_amount=Decimal("2300.00"),
                transit_time_days=26,
                quote_validity=(now + timedelta(days=30)).date(),
                rank_at_submission=2,
                created_at=now - timedelta(minutes=30),
            ),
            Bid(
                rfq_id=rfq1_id,
                carrier_name="Hapag-Lloyd",
                freight_charges=Decimal("1850.00"),
                origin_charges=Decimal("275.00"),
                destination_charges=Decimal("325.00"),
                total_amount=Decimal("2450.00"),
                transit_time_days=25,
                quote_validity=(now + timedelta(days=30)).date(),
                rank_at_submission=3,
                created_at=now - timedelta(minutes=15),
            ),
        ]
        for b in rfq1_bids:
            db.add(b)

        db.add(RFQActivityLog(
            rfq_id=rfq1_id,
            event_type=ActivityEventType.RFQ_CREATED.value,
            description="RFQ created for Mumbai to Rotterdam route. British Auction activated with 15m window.",
            actor="System",
            created_at=now - timedelta(hours=2),
        ))
        db.add(RFQActivityLog(
            rfq_id=rfq1_id,
            event_type=ActivityEventType.BID_SUBMITTED.value,
            description="Maersk Line placed initial L1 bid of $2,150.00.",
            actor="Maersk Line",
            created_at=now - timedelta(minutes=45),
        ))

        # -------------------------------------------------------------
        # 2. RFQ-2: ACTIVE in Trigger Window (Trigger: L1_RANK_CHANGE)
        # -------------------------------------------------------------
        rfq2_id = uuid4()
        rfq2 = RFQ(
            id=rfq2_id,
            reference_id="RFQ-SHA-LAX-002",
            title="Shanghai to Los Angeles Transpacific 50x40ft FCL",
            pickup_date=now + timedelta(days=21),
            bid_start_time=now - timedelta(hours=3),
            bid_close_time=now + timedelta(minutes=7),  # Within 10m trigger window
            original_bid_close_time=now + timedelta(minutes=7),
            forced_bid_close_time=now + timedelta(minutes=30),
            is_british_auction=True,
            trigger_window_minutes=Decimal("10.0"),
            extension_duration_minutes=Decimal("5.0"),
            extension_trigger_type=ExtensionTriggerType.L1_RANK_CHANGE.value,
            status=AuctionStatus.ACTIVE.value,
            created_at=now - timedelta(hours=3),
            updated_at=now,
        )
        db.add(rfq2)

        rfq2_bids = [
            Bid(
                rfq_id=rfq2_id,
                carrier_name="COSCO Shipping",
                freight_charges=Decimal("1400.00"),
                origin_charges=Decimal("200.00"),
                destination_charges=Decimal("250.00"),
                total_amount=Decimal("1850.00"),
                transit_time_days=16,
                quote_validity=(now + timedelta(days=30)).date(),
                rank_at_submission=1,
                created_at=now - timedelta(minutes=50),
            ),
            Bid(
                rfq_id=rfq2_id,
                carrier_name="Ocean Network Express (ONE)",
                freight_charges=Decimal("1450.00"),
                origin_charges=Decimal("210.00"),
                destination_charges=Decimal("260.00"),
                total_amount=Decimal("1920.00"),
                transit_time_days=18,
                quote_validity=(now + timedelta(days=30)).date(),
                rank_at_submission=2,
                created_at=now - timedelta(minutes=35),
            ),
        ]
        for b in rfq2_bids:
            db.add(b)

        db.add(RFQActivityLog(
            rfq_id=rfq2_id,
            event_type=ActivityEventType.RFQ_CREATED.value,
            description="RFQ created for Shanghai to Los Angeles transpacific route.",
            actor="System",
            created_at=now - timedelta(hours=3),
        ))

        # -------------------------------------------------------------
        # 3. RFQ-3: CLOSED (Standard close time reached, not forced)
        # -------------------------------------------------------------
        rfq3_id = uuid4()
        rfq3 = RFQ(
            id=rfq3_id,
            reference_id="RFQ-SIN-HAM-003",
            title="Singapore to Hamburg 20x40ft Standard Dry Container",
            pickup_date=now + timedelta(days=10),
            bid_start_time=now - timedelta(hours=6),
            bid_close_time=now - timedelta(hours=1),  # Closed 1 hour ago
            original_bid_close_time=now - timedelta(hours=1),
            forced_bid_close_time=now + timedelta(hours=2),  # Ceiling was NOT reached
            is_british_auction=True,
            trigger_window_minutes=Decimal("10.0"),
            extension_duration_minutes=Decimal("3.0"),
            extension_trigger_type=ExtensionTriggerType.ANY_RANK_CHANGE.value,
            status=AuctionStatus.CLOSED.value,
            created_at=now - timedelta(hours=6),
            updated_at=now - timedelta(hours=1),
        )
        db.add(rfq3)

        rfq3_bids = [
            Bid(
                rfq_id=rfq3_id,
                carrier_name="Evergreen Marine",
                freight_charges=Decimal("1550.00"),
                origin_charges=Decimal("230.00"),
                destination_charges=Decimal("300.00"),
                total_amount=Decimal("2080.00"),
                transit_time_days=22,
                quote_validity=(now + timedelta(days=20)).date(),
                rank_at_submission=1,
                created_at=now - timedelta(hours=2),
            ),
            Bid(
                rfq_id=rfq3_id,
                carrier_name="Yang Ming Marine",
                freight_charges=Decimal("1650.00"),
                origin_charges=Decimal("250.00"),
                destination_charges=Decimal("320.00"),
                total_amount=Decimal("2220.00"),
                transit_time_days=24,
                quote_validity=(now + timedelta(days=20)).date(),
                rank_at_submission=2,
                created_at=now - timedelta(hours=3),
            ),
            Bid(
                rfq_id=rfq3_id,
                carrier_name="CMA CGM",
                freight_charges=Decimal("1750.00"),
                origin_charges=Decimal("260.00"),
                destination_charges=Decimal("340.00"),
                total_amount=Decimal("2350.00"),
                transit_time_days=23,
                quote_validity=(now + timedelta(days=20)).date(),
                rank_at_submission=3,
                created_at=now - timedelta(hours=4),
            ),
        ]
        for b in rfq3_bids:
            db.add(b)

        db.add(RFQActivityLog(
            rfq_id=rfq3_id,
            event_type=ActivityEventType.RFQ_CREATED.value,
            description="RFQ created for Singapore to Hamburg route.",
            actor="System",
            created_at=now - timedelta(hours=6),
        ))
        db.add(RFQActivityLog(
            rfq_id=rfq3_id,
            event_type=ActivityEventType.AUCTION_CLOSED.value,
            description="Auction ended normally at regular close time. Winning carrier: Evergreen Marine ($2,080.00).",
            actor="System",
            created_at=now - timedelta(hours=1),
        ))

        # -------------------------------------------------------------
        # 4. RFQ-4: FORCE_CLOSED (Hard ceiling reached)
        # -------------------------------------------------------------
        rfq4_id = uuid4()
        rfq4 = RFQ(
            id=rfq4_id,
            reference_id="RFQ-DXB-FRA-004",
            title="Dubai to Frankfurt Priority Air Freight Consignment",
            pickup_date=now - timedelta(days=1),
            bid_start_time=now - timedelta(hours=8),
            bid_close_time=now - timedelta(hours=2),
            original_bid_close_time=now - timedelta(hours=4),
            forced_bid_close_time=now - timedelta(hours=2),  # Clamped and terminated
            is_british_auction=True,
            trigger_window_minutes=Decimal("10.0"),
            extension_duration_minutes=Decimal("5.0"),
            extension_trigger_type=ExtensionTriggerType.BID_RECEIVED.value,
            status=AuctionStatus.FORCE_CLOSED.value,
            created_at=now - timedelta(hours=8),
            updated_at=now - timedelta(hours=2),
        )
        db.add(rfq4)

        rfq4_bids = [
            Bid(
                rfq_id=rfq4_id,
                carrier_name="Emirates SkyCargo",
                freight_charges=Decimal("3800.00"),
                origin_charges=Decimal("400.00"),
                destination_charges=Decimal("450.00"),
                total_amount=Decimal("4650.00"),
                transit_time_days=2,
                quote_validity=(now + timedelta(days=10)).date(),
                rank_at_submission=1,
                created_at=now - timedelta(hours=2, minutes=5),
            ),
            Bid(
                rfq_id=rfq4_id,
                carrier_name="Lufthansa Cargo",
                freight_charges=Decimal("4000.00"),
                origin_charges=Decimal("420.00"),
                destination_charges=Decimal("470.00"),
                total_amount=Decimal("4890.00"),
                transit_time_days=2,
                quote_validity=(now + timedelta(days=10)).date(),
                rank_at_submission=2,
                created_at=now - timedelta(hours=2, minutes=20),
            ),
        ]
        for b in rfq4_bids:
            db.add(b)

        db.add(RFQActivityLog(
            rfq_id=rfq4_id,
            event_type=ActivityEventType.AUCTION_FORCE_CLOSED.value,
            description="Auction reached Forced Bid Close Time ceiling. Final bidding terminated.",
            actor="System",
            created_at=now - timedelta(hours=2),
        ))

        await db.commit()
        print("[SUCCESS] Successfully seeded 4 realistic RFQs with live bids, logs, and all statuses (ACTIVE, CLOSED, FORCE_CLOSED)!")


if __name__ == "__main__":
    asyncio.run(seed_data())

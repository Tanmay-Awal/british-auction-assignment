import pytest
from httpx import AsyncClient, ASGITransport
from datetime import datetime, timezone, timedelta
from uuid import uuid4
from decimal import Decimal

from app.main import app


@pytest.mark.asyncio
async def test_health_check():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.get("/health")
        assert response.status_code == 200
        assert response.json() == {"status": "ok"}


@pytest.mark.asyncio
async def test_rfq_creation_and_listing():
    now = datetime.now(timezone.utc)
    ref_id = f"TEST-API-{uuid4().hex[:6]}"
    
    payload = {
        "reference_id": ref_id,
        "title": "API Integration Test Cargo Route",
        "pickup_date": (now + timedelta(days=15)).isoformat(),
        "bid_start_time": (now - timedelta(minutes=10)).isoformat(),
        "bid_close_time": (now + timedelta(minutes=20)).isoformat(),
        "forced_bid_close_time": (now + timedelta(minutes=45)).isoformat(),
        "is_british_auction": True,
        "trigger_window_minutes": 10.0,
        "extension_duration_minutes": 5.0,
        "extension_trigger_type": "BID_RECEIVED",
    }

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # Create RFQ
        res_create = await ac.post("/api/rfqs", json=payload)
        assert res_create.status_code == 201
        created_rfq = res_create.json()
        assert created_rfq["reference_id"] == ref_id
        assert created_rfq["status"] == "ACTIVE"

        rfq_id = created_rfq["id"]

        # List RFQs
        res_list = await ac.get("/api/rfqs")
        assert res_list.status_code == 200
        items = res_list.json()
        matching = [item for item in items if item["id"] == rfq_id]
        assert len(matching) == 1

        # Submit Quote
        quote_payload = {
            "carrier_name": "API Test Carrier",
            "freight_charges": 1500.0,
            "origin_charges": 200.0,
            "destination_charges": 300.0,
            "transit_time_days": 20,
            "quote_validity": (now + timedelta(days=30)).date().isoformat()
        }
        res_bid = await ac.post(f"/api/rfqs/{rfq_id}/bids", json=quote_payload)
        assert res_bid.status_code == 201
        bid_data = res_bid.json()
        assert float(bid_data["bid"]["total_amount"]) == 2000.0
        assert bid_data["bid"]["current_rank"] == 1

        # Fetch Bids
        res_bids = await ac.get(f"/api/rfqs/{rfq_id}/bids")
        assert res_bids.status_code == 200
        assert len(res_bids.json()) >= 1

        # Fetch Logs
        res_logs = await ac.get(f"/api/rfqs/{rfq_id}/logs")
        assert res_logs.status_code == 200
        assert len(res_logs.json()) >= 2  # Created + Bid Submitted

        # Duplicate RFQ Reference ID -> 409 Conflict
        res_dup = await ac.post("/api/rfqs", json=payload)
        assert res_dup.status_code == 409
        assert "already exists" in res_dup.json()["detail"]


@pytest.mark.asyncio
async def test_quote_submission_validation_errors():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        fake_id = str(uuid4())
        # Past quote validity -> 422 Unprocessable Entity
        yesterday = (datetime.now(timezone.utc) - timedelta(days=1)).date().isoformat()
        bad_payload = {
            "carrier_name": "Invalid Carrier",
            "freight_charges": 1000.0,
            "origin_charges": 100.0,
            "destination_charges": 100.0,
            "transit_time_days": 10,
            "quote_validity": yesterday
        }
        res = await ac.post(f"/api/rfqs/{fake_id}/bids", json=bad_payload)
        assert res.status_code == 422

        # Non-existent RFQ -> 404 Not Found
        tomorrow = (datetime.now(timezone.utc) + timedelta(days=5)).date().isoformat()
        good_payload = {
            "carrier_name": "Valid Carrier",
            "freight_charges": 1000.0,
            "origin_charges": 100.0,
            "destination_charges": 100.0,
            "transit_time_days": 10,
            "quote_validity": tomorrow
        }
        res_404 = await ac.post(f"/api/rfqs/{fake_id}/bids", json=good_payload)
        assert res_404.status_code == 404

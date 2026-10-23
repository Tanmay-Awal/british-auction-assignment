import pytest
from sqlalchemy import delete
from app.core.database import engine, AsyncSessionLocal
from app.models.rfq import RFQ


@pytest.fixture(autouse=True)
async def cleanup_test_records_and_connections():
    yield
    # Clean up test RFQs created by test runs to preserve database integrity
    try:
        async with AsyncSessionLocal() as session:
            stmt = delete(RFQ).where(RFQ.reference_id.like("TEST-%"))
            await session.execute(stmt)
            await session.commit()
    except Exception:
        pass
    await engine.dispose()

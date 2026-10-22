import pytest
import asyncio
from app.core.database import engine


@pytest.fixture(autouse=True)
async def cleanup_database_connections():
    yield
    await engine.dispose()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.core.config import settings
from app.core.database import engine, Base
from app.routers import rfqs, bids, activity_logs
import app.models  # ensure models are registered


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Auto-create tables on startup if they don't already exist
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    # Shutdown logic
    await engine.dispose()


app = FastAPI(
    title="GoComet British Auction RFQ Engine",
    description="High-performance backend API for Request for Quotation (RFQ) systems with dynamic British Auction extension capabilities.",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
)

# Enable CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins for local testing/demo
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Routers
app.include_router(rfqs.router)
app.include_router(bids.router)
app.include_router(activity_logs.router)


@app.get("/", tags=["Health"])
async def root():
    return {
        "status": "healthy",
        "service": "GoComet British Auction Engine",
        "version": "1.0.0",
        "docs": "/docs"
    }


@app.get("/health", tags=["Health"])
async def health_check():
    return {"status": "ok"}

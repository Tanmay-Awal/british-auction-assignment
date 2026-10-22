# GoComet Hiring Assignment: British Auction in RFQ System

> **A production-grade, full-stack procurement platform featuring dynamic British Auction extensions, concurrency locking, and auditability.**

Built with **Next.js 16 (App Router + Tailwind CSS)** on the frontend and **Python FastAPI + Asynchronous SQLAlchemy + PostgreSQL** on the backend.

---

## 📋 Deliverables Matrix

This repository fulfills all 4 deliverables specified in **Section 9 of the GoComet assignment specification**:

| Deliverable | Location | Description |
| :--- | :--- | :--- |
| **1. Simple HLD with Architecture Diagram** | [`docs/HLD.md`](docs/HLD.md) | High-Level Design containing Mermaid architecture, sequence diagrams, and design pattern specifications. |
| **2. Schema Design for Database Tables** | [`docs/SCHEMA.md`](docs/SCHEMA.md) | Comprehensive ER diagram, relational table schemas, indexes, check constraints, and raw PostgreSQL DDL. |
| **3. Backend Code** | [`backend/`](backend/) | FastAPI async service implementing the Auction Engine, Strategy Pattern extension rules, row-level locking, and REST APIs. |
| **4. Frontend Code** | [`frontend/`](frontend/) | Next.js 16 App Router application featuring real-time countdown tickers, live quote ranking (L1..Ln), and audit logs. |

---

## 🚀 Quick Start (Running Locally)

### Prerequisites
* **Node.js**: v18+ (tested on v24)
* **Python**: 3.11+ (tested on Python 3.13)
* **PostgreSQL**: 14+ running locally (or Neon connection string)

### 1. Database Setup
Ensure PostgreSQL is running and a database named `gocomet_auction` is created:
```sql
CREATE DATABASE gocomet_auction;
```

Configure your credentials in `backend/.env`:
```env
DB_USER=postgres
DB_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=5432
DB_NAME=gocomet_auction
DATABASE_URL=postgresql+asyncpg://postgres:your_password@localhost:5432/gocomet_auction
```

### 2. Start the Backend API
```bash
cd backend
python -m venv venv
# Windows:
.\venv\Scripts\activate
# Linux/macOS:
# source venv/bin/activate

pip install -r requirements.txt

# Seed realistic test RFQs, bids, and active countdowns:
python seed.py

# Start the FastAPI server on port 8000:
uvicorn app.main:app --reload --port 8000
```
* **Interactive Swagger UI**: `http://localhost:8000/docs`
* **Health Check**: `http://localhost:8000/health`

### 3. Start the Next.js Frontend
In a separate terminal:
```bash
cd frontend
npm install
npm run dev
```
* **Frontend App**: `http://localhost:3000`

---

## 🧠 Core Business Logic & Domain Mechanics

### 1. What is a Reverse British Auction?
In standard forward auctions (like eBay), buyers compete to push prices **UP**. 
In freight procurement (GoComet), carriers compete to push quotes **DOWN**.
* **L1**: The lowest bidder (current 1st-place winning quote).
* **L2, L3, ...**: Sequentially higher quotes.
* **The Sniping Problem**: Suppliers often wait until 2 seconds before auction close to drop their price, giving competitors zero time to respond.
* **The British Solution**: Any competitive action inside the **Trigger Window ($X$ minutes)** automatically pushes the deadline back by **Extension Duration ($Y$ minutes)**.

### 2. The Forced Bid Close Time (Hard Ceiling)
To prevent two aggressive carriers from extending an auction indefinitely:
$$\text{New Close Time} = \min(\text{Current Close Time} + Y, \;\text{Forced Bid Close Time})$$
* **Validation Rule**: `Forced Bid Close Time` must always be $\ge$ `Bid Close Time`.
* **Clamping Rule**: Extensions are capped at `Forced Bid Close Time`. Once this timestamp is reached, the status moves to **`FORCE_CLOSED`** and no further extensions or bids are permitted.

### 3. The 3 Extension Triggers (Implemented via Strategy Pattern)
The system supports all 3 extension triggers defined in Section 6.3 of the specification:

```
                         ┌─────────────────────────────┐
                         │    ExtensionRuleStrategy    │
                         ├─────────────────────────────┤
                         │    + should_extend(...)     │
                         └──────────────▲──────────────┘
                                        │
           ┌────────────────────────────┼────────────────────────────┐
           │                            │                            │
┌──────────────────────┐     ┌──────────────────────┐     ┌──────────────────────┐
│  BidReceivedStrategy │     │ AnyRankChangeStrategy│     │ L1RankChangeStrategy │
├──────────────────────┤     ├──────────────────────┤     ├──────────────────────┤
│ Extends if ANY valid │     │ Extends if ANY       │     │ Extends ONLY when a  │
│ bid arrives during   │     │ supplier changes     │     │ new carrier takes    │
│ the trigger window.  │     │ ranking position.    │     │ the #1 (L1) crown.   │
└──────────────────────┘     └──────────────────────┘     └──────────────────────┘
```

---

## ⚡ 60-Second Demo for Evaluators

When evaluating the application, you don't need to wait 10 minutes to test extensions:

1. Go to `http://localhost:3000/rfqs/create`.
2. Click the top-right button: **"⚡ Populate 2-Minute Demo Preset"**.
   * Automatically sets an auction closing in **90 seconds**, with a **60-second trigger window**, a **30-second extension**, and a **4-minute hard ceiling**.
3. Click **"Create RFQ & Launch Auction"**.
4. You are taken immediately into the **Live Auction Room**.
5. Observe the amber alert: *"⚡ Trigger Window Active"*.
6. Click any **Carrier Preset** (e.g. *CMA CGM $1,800.00*) and hit **Submit Carrier Quote**.
7. **Watch the live countdown immediately leap by +30 seconds**, while the Leaderboard recalculates ranks and the Activity Feed logs the exact justification!

---

## 🛡️ Concurrency & Architecture Highlights

1. **Race Condition Prevention**:
   * During the final seconds of an auction, hundreds of suppliers may submit bids simultaneously.
   * Handled via **PostgreSQL row-level locking**:
     ```python
     stmt = select(RFQ).where(RFQ.id == rfq_id).with_for_update()
     ```
   * All bid validations, ranking recalculations, close time updates, and audit log writes happen inside an **atomic database transaction**.
2. **Quote Charge Decomposition**:
   * Total quote is dynamically verified: $\text{Total} = \text{Freight} + \text{Origin} + \text{Destination}$.
3. **Deterministic Ranking & Tie-Breaking**:
   * Quotes are ranked strictly by `total_amount ASC, created_at ASC`. If two carriers submit identical quotes, the earlier submission wins L1.
4. **Immutable Audit Trail**:
   * Every quote and extension writes to `rfq_activity_logs` documenting previous close time, new close time, duration added, triggering carrier, and narrative reason.

---

## 🧪 Automated Test Suite

Run unit and integration tests verifying all 3 triggers, clamping, state transitions, and API endpoints:

```bash
cd backend
.\venv\Scripts\pytest -v
```

**Test Coverage**:
* `test_extension_strategies_unit`: Tests Bid Received, Any Rank Change, and L1 Dethroning logic.
* `test_forced_close_ceiling_clamping`: Proves that extensions exceeding the hard ceiling are strictly clamped to `forced_bid_close_time`.
* `test_auction_status_evaluation`: Tests dynamic transitions between `DRAFT`, `ACTIVE`, `CLOSED`, and `FORCE_CLOSED`.
* `test_health_check` & `test_rfq_creation_and_listing`: End-to-end FastAPI endpoint integration tests.

---

## 🎯 Interview Discussion & Design Defense

### Q1: Why use database-level extension evaluation instead of background cron jobs?
> **Answer**: Auctions are event-driven. Extensions only happen when bids are submitted. Evaluating the extension inside the bid submission transaction guarantees zero-latency updates and absolute consistency. Background workers or cron jobs are only needed for closing dormant auctions where no bids arrive.

### Q2: How would this architecture scale to 50,000 concurrent auctions?
> **Answer**: In high-throughput production, we would use **Redis Sorted Sets (ZSET)** for in-memory leaderboard ranking and **Redis TTL / Redlock** for lightweight distributed locking, persisting to PostgreSQL asynchronously via event queues (Apache Kafka or RabbitMQ) while maintaining sub-millisecond bidding latency.

### Q3: Live Code Modification: How would you add a "Minimum 1% Bid Decrement" rule?
> **Answer**: Because of the modular architecture, we simply add a single validation rule in `app/services/auction_engine.py`:
> ```python
> if prev_l1_total and (prev_l1_total - total_quote) < (prev_l1_total * Decimal("0.01")):
>     raise HTTPException(status_code=400, detail="Bid must be at least 1% lower than current L1 quote.")
> ```

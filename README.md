# GoComet British Auction RFQ Engine

> A high-performance, full-stack logistics procurement platform featuring real-time reverse British Auctions, dynamic anti-sniping deadline extensions, concurrency-safe row-level locking, and immutable auditability.

![Python Version](https://img.shields.io/badge/Python-3.11%20%7C%203.13-blue?logo=python)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115.6-009688?logo=fastapi)
![Next.js](https://img.shields.io/badge/Next.js-16.4.2-black?logo=next.js)
![React](https://img.shields.io/badge/React-19.3.0-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14%2B-4169E1?logo=postgresql)
![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-v4-38B2AC?logo=tailwind-css)
![Tests](https://img.shields.io/badge/Tests-8%20Passed-success?logo=pytest)

---

## Table of Contents

- [1. Overview](#1-overview)
- [2. Core Business Logic & Auction Mechanics](#2-core-business-logic--auction-mechanics)
- [3. Key Features](#3-key-features)
- [4. Technology Stack](#4-technology-stack)
- [5. High-Level Design (HLD) & System Architecture](#5-high-level-design-hld--system-architecture)
- [6. Request Lifecycle & Concurrency Control](#6-request-lifecycle--concurrency-control)
- [7. Core Application Flows](#7-core-application-flows)
- [8. Database Architecture & Schema](#8-database-architecture--schema)
- [9. Local Development Setup](#9-local-development-setup)
- [10. Quick 60-Second Evaluation Walkthrough](#10-quick-60-second-evaluation-walkthrough)
- [11. API Reference & Usage Examples](#11-api-reference--usage-examples)
- [12. Frontend Architecture & UI Features](#12-frontend-architecture--ui-features)
- [13. Automated Testing Suite](#13-automated-testing-suite)
- [14. Seeded Test Scenarios](#14-seeded-test-scenarios)
- [15. Important Engineering Decisions](#15-important-engineering-decisions)
- [16. Troubleshooting & FAQ](#16-troubleshooting--faq)
- [17. Project Directory Structure](#17-project-directory-structure)
- [18. Environment Variables Reference](#18-environment-variables-reference)
- [19. Author & Project Metadata](#19-author--project-metadata)

---

## 1. Overview

In commercial freight procurement, a **Request for Quotation (RFQ)** initiates a competitive tender where enterprise shippers request freight rates across specific trade lanes from ocean carriers and forwarders.

Standard fixed-deadline auctions suffer from **bid sniping**: carriers deliberately withhold their most competitive quotes until seconds before the deadline to prevent rivals from countering. This limits market price discovery and inflates procurement costs for shippers.

The **GoComet British Auction RFQ Engine** solves this by implementing dynamic British Auction mechanics:
1. **Dynamic Extension Window**: If qualifying competitive bidding occurs within a designated **Trigger Window ($X$ minutes)** prior to closing, the deadline dynamically extends by **Extension Duration ($Y$ minutes)**.
2. **Hard Ceiling Protection**: An absolute **Forced Bid Close Time** caps extensions and guarantees auction termination.
3. **Concurrency-Safe Ranking**: Employs PostgreSQL row-level locks (`SELECT ... FOR UPDATE`) to eliminate race conditions during high-concurrency closing seconds.
4. **Transparent Audit Trail**: Every rate submission and deadline extension writes an immutable entry into `rfq_activity_logs`.

---

## 2. Core Business Logic & Auction Mechanics

### 2.1 Reverse Auction Principles
Unlike forward auctions (where buyers bid prices upward), freight procurement operates as a **reverse auction** where carriers compete to push rates downward:
- **$L_1$**: The current lowest bidder (leading winning quote).
- **$L_2, L_3, \dots, L_n$**: Higher subsequent carrier quotes.

### 2.2 Dynamic Extension Calculation
When an RFQ has `is_british_auction = true`, the engine evaluates every incoming bid against configured business rules:
- **Trigger Window Check**: Evaluates if the current wall-clock UTC time falls within:
  $$\text{Current Time} \in [\text{Close Time} - X, \; \text{Close Time}]$$
- **Extension Clamping**: If an extension is triggered, the new close time is strictly clamped to the hard ceiling:
  $$\text{New Close Time} = \min(\text{Current Close Time} + Y, \; \text{Forced Close Time})$$
- **Terminal State**: Once the clock reaches `forced_bid_close_time`, the auction transitions to `FORCE_CLOSED` and rejects all further bids.

### 2.3 The 3 Extension Strategies (Strategy Pattern)
The engine implements three distinct extension triggers via `BaseExtensionStrategy`:

```
                         ┌─────────────────────────────┐
                         │    BaseExtensionStrategy    │
                         ├─────────────────────────────┤
                         │    + evaluate(ctx): Result  │
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

1. **`BID_RECEIVED`**: Extends whenever any valid carrier quote arrives inside the trigger window.
2. **`ANY_RANK_CHANGE`**: Extends when a quote shifts any carrier's ranking or a new entrant displaces an existing supplier.
3. **`L1_RANK_CHANGE`**: Extends only when the leading $L_1$ supplier is dethroned, or when the current $L_1$ leader lowers their winning rate.

---

## 3. Key Features

### RFQ Lifecycle Management
- **Structured RFQ Creation**: Define trade lanes, pickup date, bid start time, dynamic close time, and forced bid close time.
- **British Auction Configuration**: Configure Trigger Window ($X$ minutes), Extension Duration ($Y$ minutes), and Trigger Strategy.
- **Wall-Clock State Machine**: Real-time state resolution (`DRAFT`, `ACTIVE`, `CLOSED`, `FORCE_CLOSED`) based on UTC clock comparison.
- **Dashboard Filtering & Search**: Instant filter tabs (`All`, `Active`, `Closed`, `Draft`) and route/reference search.

### Multi-Component Bidding & Ranking
- **Itemized Charge Decomposition**: Validates that quotes consist of `freight_charges`, `origin_charges`, and `destination_charges`, where:
  $$\text{Total Amount} = \text{Freight Charges} + \text{Origin Charges} + \text{Destination Charges}$$
- **Deterministic Rank Calculation**: Ranks quotes by `total_amount ASC, created_at ASC` (earlier submission timestamp breaks price ties).
- **Carrier Quick Presets**: Instant quote buttons for global carriers (Maersk, MSC, CMA CGM, Hapag-Lloyd, ONE, Evergreen).

### Live Auction Room
- **Live Countdown Ticker**: Real-time ticker counting down remaining bidding time.
- **Visual Trigger Window Alert**: Clock turns amber with a pulsing badge when entering the final $X$ minutes.
- **Dynamic Leaderboard**: Live ranking table ($L_1, L_2, \dots$) showing carrier name, cost breakdowns, transit days, and quote validity.
- **Audit Activity Log**: Chronological feed recording RFQ creation, quote submissions, extension events with detailed justifications, and auction closures.
- **Theme Support**: Seamless Dark Mode and Light Mode with persistence.

---

## 4. Technology Stack

| Layer | Technology | Version | Purpose in Application |
| :--- | :--- | :--- | :--- |
| **Frontend Framework** | Next.js (App Router) | 16.4.2 | Application routing, layouts, and page rendering |
| **UI Library** | React | 19.3.0 | Component hierarchy, state hooks, and reconciliation |
| **Styling** | Tailwind CSS | 4.x | Design tokens, responsive utilities, and dark mode |
| **Icons** | Lucide React | 1.61.0 | Vector iconography across dashboard, forms, and room |
| **Backend Framework** | FastAPI | 0.115.6 | Async REST API, OpenAPI docs, and routing |
| **ASGI Server** | Uvicorn (standard) | 0.34.0 | Asynchronous production web server |
| **Language (Backend)** | Python | 3.11+ / 3.13 | Async application logic and domain engine |
| **Language (Frontend)**| TypeScript | 5.x | Static typing across UI components and API contracts |
| **Database** | PostgreSQL | 14+ | Relational persistence, row-level locking, and check constraints |
| **ORM / Data Access** | SQLAlchemy | 2.0.36 | Async session management and relational mapping |
| **Database Driver** | asyncpg | 0.30.0 | High-performance async PostgreSQL driver |
| **Validation Engine** | Pydantic / Pydantic Settings | 2.10.4 | Request/response DTO schemas and config management |
| **Test Runner** | Pytest / Pytest-Asyncio | 8.3.4 / 0.25.0 | Async test suite for auction engine and API routes |
| **HTTP Test Transport**| HTTPX | 0.28.1 | Async HTTP client for integration test execution |

---

## 5. High-Level Design (HLD) & System Architecture

> 📄 **Deliverable 1 Reference**: See [`docs/HLD.md`](docs/HLD.md) for the dedicated High-Level Design document accompanying this assignment.

The system is designed as a decoupled, layered client-server architecture separating presentation, API routing, auction domain logic, and relational persistence:

```mermaid
graph TB
    subgraph Actors ["Users & Actors"]
        User_Shipper["👤 Enterprise Shipper<br/>(Procurement Manager)"]
        User_Carrier["🚢 Ocean & Air Carrier<br/>(Freight Supplier)"]
    end

    subgraph FrontendApp ["Presentation Tier (Next.js 16 + React 19)"]
        UI_Dashboard["RFQ Dashboard<br/>• Status Filters<br/>• Route Search<br/>• Live Countdowns"]
        UI_Creator["RFQ Creation Portal<br/>• Route & Cargo Spec<br/>• British Auction Windows"]
        UI_AuctionRoom["Live Auction Room<br/>• Real-Time Countdown Ticker<br/>• Amber Trigger Alert Pulse<br/>• Dynamic L1..Ln Leaderboard<br/>• Carrier Presets & Bid Form"]
    end

    subgraph APIGateway ["API Gateway & Routing Tier (FastAPI ASGI)"]
        API_RFQs["RFQ Router<br/>/api/rfqs"]
        API_Bids["Bids Router<br/>/api/rfqs/:id/bids"]
        API_Logs["Activity Logs Router<br/>/api/rfqs/:id/logs"]
        API_Validation["Pydantic Validation<br/>Request DTOs & Schemas"]
    end

    subgraph BusinessEngine ["Domain Service Tier (Auction Engine)"]
        Service_Lock["Concurrency Control<br/>Row-Level Lock (SELECT FOR UPDATE)"]
        Service_State["Wall-Clock State Resolver<br/>DRAFT / ACTIVE / CLOSED / FORCE_CLOSED"]
        Service_Strategy["Strategy Pattern Extension Engine<br/>• Bid Received Trigger<br/>• Any Rank Change Trigger<br/>• L1 Rank Change Trigger"]
        Service_Ranking["Ranking & Tie-Breaker Service<br/>Sort by Price ASC, Timestamp ASC"]
        Service_Audit["Immutable Audit Logger<br/>Lifecycle & Extension Events"]
    end

    subgraph DatabaseTier ["Persistence Tier (PostgreSQL 14+)"]
        DB_RFQs[("rfqs<br/>Tender Config, Timestamps & Hard Ceiling")]
        DB_Bids[("bids<br/>Component Costs & L1..Ln Quotes")]
        DB_Logs[("rfq_activity_logs<br/>Audit Records & Justifications")]
    end

    User_Shipper -->|Creates RFQ & Monitors Tenders| UI_Dashboard
    User_Shipper -->|Configures British Auction Rules| UI_Creator
    User_Carrier -->|Submits Quotes & Views L1 Rank| UI_AuctionRoom

    UI_Dashboard -->|HTTP GET| API_RFQs
    UI_Creator -->|HTTP POST| API_RFQs
    UI_AuctionRoom -->|HTTP GET & POST| API_Bids
    UI_AuctionRoom -->|HTTP GET| API_Logs

    API_RFQs --> API_Validation
    API_Bids --> API_Validation
    API_Logs --> API_Validation

    API_Validation --> BusinessEngine

    BusinessEngine --> Service_Lock
    BusinessEngine --> Service_State
    BusinessEngine --> Service_Strategy
    BusinessEngine --> Service_Ranking
    BusinessEngine --> Service_Audit

    Service_Lock -->|Exclusive Row Lock| DB_RFQs
    Service_Strategy -->|Evaluate Historical Quotes| DB_Bids
    BusinessEngine -->|Persist New Close Time| DB_RFQs
    BusinessEngine -->|Insert Carrier Bid| DB_Bids
    Service_Audit -->|Record Immutable Event| DB_Logs
```

### Architectural Layer Responsibilities

| Layer | Responsibility | Key Technologies |
| :--- | :--- | :--- |
| **1. Client Layer** | Renders interactive dashboards, manages local countdown tickers via `setInterval`, handles user inputs, validates dates, and displays real-time ranking. | Next.js 16 (App Router), React 19, Tailwind CSS v4, Lucide React |
| **2. API Layer** | Validates incoming JSON payloads via Pydantic DTOs, handles CORS, and exposes RESTful endpoints for RFQs, bids, and logs. | FastAPI 0.115.6, Uvicorn 0.34.0, Pydantic V2 |
| **3. Auction Engine** | Pure business logic: acquires exclusive row locks (`SELECT FOR UPDATE`), evaluates wall-clock temporal states, applies Strategy Pattern extension rules, and calculates quote ranks ($L_1..L_n$). | Python async engine, Strategy Pattern (`app/services/`) |
| **4. Persistence Layer** | Enforces relational integrity (`ON DELETE CASCADE`), executes atomic transactions, and enforces database-level check constraints on timestamps and charges. | PostgreSQL 14+, SQLAlchemy 2.0 (asyncpg) |

---

## 6. Request Lifecycle & Concurrency Control

When multiple carriers submit bids simultaneously in the closing seconds of an auction, the system prevents race conditions through **PostgreSQL row-level locking**:

```
Carrier Client (Browser)
       │
       ▼ [1] HTTP POST /api/rfqs/{id}/bids with JSON payload
FastAPI Routing (app/routers/bids.py)
       │
       ▼ [2] Pydantic Schema Validation (BidCreate)
       │     - Verifies non-negative charges
       │     - Validates future quote_validity date
       │     - Confirms total sum > 0
Database Dependency (app/core/database.py)
       │
       ▼ [3] Yields AsyncSession (PostgreSQL asyncpg)
AuctionEngine.submit_quote (app/services/auction_engine.py)
       │
       ▼ [4] SELECT * FROM rfqs WHERE id = :id FOR UPDATE
       │     - Acquires exclusive row-level lock
       │
       ▼ [5] evaluate_auction_status(rfq, current_time)
       │     - Verifies status is ACTIVE (fails if DRAFT, CLOSED, FORCE_CLOSED)
       │
       ▼ [6] Calculate total_quote = freight + origin + destination
       │
       ▼ [7] Fetch existing bids sorted by total_amount ASC, created_at ASC
       │     - Determines new_rank and previous carrier rank
       │
       ▼ [8] is_in_trigger_window(rfq, current_time)
       │     - Checks if current_time in [close_time - X minutes, close_time]
       │
       ▼ [9] Strategy Evaluation (BidReceived / AnyRank / L1Rank)
       │     - Evaluates whether bid qualifies for extension
       │
       ▼ [10] Apply Extension & Hard Ceiling Clamping
       │      - proposed_close = close_time + Y minutes
       │      - clamped_close = min(proposed_close, forced_bid_close_time)
       │
       ▼ [11] Insert Bid record into `bids` table
       │
       ▼ [12] Insert RFQActivityLog record(s) into `rfq_activity_logs`
       │
       ▼ [13] db.commit() releases row lock
       │
       ▼ [14] Return HTTP 201 Created with BidSubmissionResult
Carrier Client (Browser)
       │
       ▼ [15] Updates UI: adjusts timer ticker, refreshes leaderboard, displays toast
```

---

## 7. Core Application Flows

### 7.1 Quote Placement & Dynamic Extension Flow

```mermaid
sequenceDiagram
    autonumber
    actor Carrier as Ocean Carrier
    participant UI as Next.js Auction Room
    participant API as FastAPI Router
    participant Engine as AuctionEngine
    participant Strat as ExtensionStrategy
    participant DB as PostgreSQL (AsyncSession)

    Carrier->>UI: Enters Quote & Clicks "Submit carrier quote"
    UI->>API: POST /api/rfqs/:id/bids
    API->>API: Validate Payload via Pydantic (BidCreate)
    API->>Engine: submit_quote(db, rfq_id, quote_data)
    
    rect rgb(240, 248, 255)
        note over Engine,DB: Concurrency-Controlled Transaction Boundary
        Engine->>DB: SELECT * FROM rfqs WHERE id = :id FOR UPDATE
        DB-->>Engine: Locked RFQ Record
        Engine->>Engine: Verify Auction Status == ACTIVE
        Engine->>DB: SELECT * FROM bids WHERE rfq_id = :id ORDER BY total_amount ASC
        DB-->>Engine: Existing Bids List
        Engine->>Engine: Compute Rank (L1..Ln)
        
        alt In Trigger Window & is_british_auction == true
            Engine->>Strat: evaluate(StrategyEvaluationContext)
            Strat-->>Engine: ExtensionStrategyResult(should_extend=true, reason)
            
            alt proposed_new_close < forced_bid_close_time
                Engine->>Engine: bid_close_time += extension_duration_minutes
            else proposed_new_close >= forced_bid_close_time
                Engine->>Engine: bid_close_time = forced_bid_close_time (Clamped)
            end
            
            Engine->>DB: INSERT INTO rfq_activity_logs (AUCTION_EXTENDED)
        end
        
        Engine->>DB: INSERT INTO bids (carrier_name, charges, total, rank)
        Engine->>DB: INSERT INTO rfq_activity_logs (BID_SUBMITTED)
        Engine->>DB: COMMIT (Releases Row Lock)
    end

    Engine-->>API: BidSubmissionResult(bid, extended, new_close_time, rank)
    API-->>UI: HTTP 201 Created
    UI-->>Carrier: Live Countdown Extends, Leaderboard Updates to L1
```

---

## 8. Database Architecture & Schema

### 8.1 Entity-Relationship Diagram

```mermaid
erDiagram
    RFQS ||--o{ BIDS : receives
    RFQS ||--o{ RFQ_ACTIVITY_LOGS : records

    RFQS {
        uuid id PK
        string reference_id UK
        string title
        timestamp pickup_date
        timestamp bid_start_time
        timestamp bid_close_time
        timestamp original_bid_close_time
        timestamp forced_bid_close_time
        boolean is_british_auction
        numeric trigger_window_minutes
        numeric extension_duration_minutes
        string extension_trigger_type
        string status
        timestamp created_at
        timestamp updated_at
    }

    BIDS {
        uuid id PK
        uuid rfq_id FK
        string carrier_name
        numeric freight_charges
        numeric origin_charges
        numeric destination_charges
        numeric total_amount
        int transit_time_days
        date quote_validity
        int rank_at_submission
        timestamp created_at
    }

    RFQ_ACTIVITY_LOGS {
        uuid id PK
        uuid rfq_id FK
        string event_type
        text description
        numeric extension_minutes
        timestamp previous_close_time
        timestamp new_close_time
        string actor
        timestamp created_at
    }
```

### 8.2 Relational Table Specifications

#### Table: `rfqs`
| Column | Type | Nullable | Constraints | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `UUID` | No | Primary Key | Universally unique identifier (`uuid.uuid4`). |
| `reference_id` | `VARCHAR(50)` | No | UNIQUE, INDEX | Unique business reference (e.g. `RFQ-MUM-ROT-001`). |
| `title` | `VARCHAR(255)` | No | — | Human-readable route title. |
| `pickup_date` | `TIMESTAMPTZ` | No | — | Estimated cargo pickup date. |
| `bid_start_time` | `TIMESTAMPTZ` | No | — | Timestamp when bidding opens. |
| `bid_close_time` | `TIMESTAMPTZ` | No | — | Dynamic auction close deadline (mutable). |
| `original_bid_close_time` | `TIMESTAMPTZ` | No | — | Immutable baseline close deadline. |
| `forced_bid_close_time` | `TIMESTAMPTZ` | No | — | Absolute hard ceiling deadline for all extensions. |
| `is_british_auction` | `BOOLEAN` | No | Default: `true` | Toggle controlling dynamic extension logic. |
| `trigger_window_minutes` | `NUMERIC(6, 2)` | No | Default: `10.0` | Window before close time ($X$ minutes) that triggers extensions. |
| `extension_duration_minutes` | `NUMERIC(6, 2)` | No | Default: `5.0` | Duration ($Y$ minutes) added to `bid_close_time` upon extension. |
| `extension_trigger_type` | `VARCHAR(50)` | No | Default: `BID_RECEIVED` | Strategy: `BID_RECEIVED`, `ANY_RANK_CHANGE`, or `L1_RANK_CHANGE`. |
| `status` | `VARCHAR(30)` | No | INDEX, Default: `ACTIVE` | Persisted status: `DRAFT`, `ACTIVE`, `CLOSED`, `FORCE_CLOSED`. |
| `created_at` | `TIMESTAMPTZ` | No | Default: `now()` | Record creation timestamp. |
| `updated_at` | `TIMESTAMPTZ` | No | Default: `now()` | Record modification timestamp. |

**Database Check Constraints (`rfqs`)**:
- `chk_rfq_close_after_start`: `CHECK (bid_close_time > bid_start_time)`
- `chk_rfq_forced_after_close`: `CHECK (forced_bid_close_time >= bid_close_time)`
- `chk_rfq_positive_configs`: `CHECK (trigger_window_minutes > 0 AND extension_duration_minutes > 0)`

---

#### Table: `bids`
| Column | Type | Nullable | Constraints | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `UUID` | No | Primary Key | Universally unique identifier (`uuid.uuid4`). |
| `rfq_id` | `UUID` | No | Foreign Key, INDEX | References `rfqs.id` with `ON DELETE CASCADE`. |
| `carrier_name` | `VARCHAR(100)` | No | — | Name of the bidding ocean/air carrier. |
| `freight_charges` | `NUMERIC(14, 2)`| No | — | Base ocean/air freight rate. |
| `origin_charges` | `NUMERIC(14, 2)`| No | — | Origin terminal handling fees. |
| `destination_charges` | `NUMERIC(14, 2)`| No | — | Destination port fees. |
| `total_amount` | `NUMERIC(14, 2)`| No | — | Total quote: $\text{freight} + \text{origin} + \text{destination}$. |
| `transit_time_days` | `INTEGER` | No | — | Estimated port-to-port transit duration in days. |
| `quote_validity` | `DATE` | No | — | Date until which the carrier guarantees the rate. |
| `rank_at_submission` | `INTEGER` | Yes | — | Rank position ($1 = L_1$) at the moment of submission. |
| `created_at` | `TIMESTAMPTZ` | No | INDEX, Default: `now()` | Exact submission timestamp (used as tie-breaker). |

**Database Check Constraints & Indexes (`bids`)**:
- `chk_bid_freight_non_negative`: `CHECK (freight_charges >= 0)`
- `chk_bid_origin_non_negative`: `CHECK (origin_charges >= 0)`
- `chk_bid_dest_non_negative`: `CHECK (destination_charges >= 0)`
- `chk_bid_total_positive`: `CHECK (total_amount > 0)`
- `chk_bid_total_matches_components`: `CHECK (total_amount = freight_charges + origin_charges + destination_charges)`
- `chk_bid_transit_positive`: `CHECK (transit_time_days > 0)`
- `idx_bids_rfq_total_time`: Compound Index on `(rfq_id, total_amount, created_at)` for rank queries.

---

#### Table: `rfq_activity_logs`
| Column | Type | Nullable | Constraints | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `UUID` | No | Primary Key | Universally unique identifier (`uuid.uuid4`). |
| `rfq_id` | `UUID` | No | Foreign Key, INDEX | References `rfqs.id` with `ON DELETE CASCADE`. |
| `event_type` | `VARCHAR(50)` | No | — | Event: `RFQ_CREATED`, `BID_SUBMITTED`, `AUCTION_EXTENDED`, etc. |
| `description` | `TEXT` | No | — | Narrative audit log description. |
| `extension_minutes` | `NUMERIC(6, 2)` | Yes | — | Number of minutes added to the close time (if extended). |
| `previous_close_time`| `TIMESTAMPTZ` | Yes | — | Close deadline prior to extension. |
| `new_close_time` | `TIMESTAMPTZ` | Yes | — | New close deadline following extension. |
| `actor` | `VARCHAR(100)` | No | Default: `'System'` | Entity triggering the event (Carrier name or `'System'`). |
| `created_at` | `TIMESTAMPTZ` | No | INDEX, Default: `now()` | Timestamp of audit entry. |

**Indexes (`rfq_activity_logs`)**:
- `idx_logs_rfq_created_at`: Compound Index on `(rfq_id, created_at)` for chronological retrieval.

---

## 9. Local Development Setup

### Prerequisites
- **Python**: 3.11 or higher (tested on Python 3.13)
- **Node.js**: 18 or higher (tested on Node.js v24)
- **PostgreSQL**: 14 or higher running on port 5432
- **Git**

---

### Step 1: Database Setup
Create the project database in PostgreSQL:
```bash
psql -U postgres -c "CREATE DATABASE gocomet_auction;"
```

---

### Step 2: Backend Setup
1. Open a terminal and navigate to `backend/`:
   ```bash
   cd backend
   ```
2. Create and activate a Python virtual environment:
   ```bash
   python -m venv venv
   # Windows (PowerShell):
   .\venv\Scripts\Activate.ps1
   # Linux / macOS:
   source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Verify your `backend/.env` file:
   ```env
   DB_USER=postgres
   DB_PASSWORD=your_password
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=gocomet_auction
   DATABASE_URL=postgresql+asyncpg://postgres:your_password@localhost:5432/gocomet_auction
   SYNC_DATABASE_URL=postgresql://postgres:your_password@localhost:5432/gocomet_auction
   BACKEND_PORT=8000
   FRONTEND_URL=http://localhost:3000
   ```
5. Seed the database with realistic test RFQs:
   ```bash
   python seed.py
   ```
6. Start the FastAPI development server:
   ```bash
   uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
   ```
   - Swagger UI: `http://localhost:8000/docs`
   - Health Check: `http://localhost:8000/health`

---

### Step 3: Frontend Setup
1. In a **second terminal**, navigate to `frontend/`:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Next.js development server:
   ```bash
   npm run dev
   ```
4. Open your browser:
   ```
   http://localhost:3000
   ```

---

## 10. Quick 60-Second Evaluation Walkthrough

To verify British Auction dynamic extensions immediately:

1. **Test Pre-Seeded Trigger Window (Instant)**:
   - Navigate to `http://localhost:3000`.
   - Click the amber live auction card: **`RFQ-SHA-LAX-002`** (Shanghai to Los Angeles), which is pre-seeded active inside its 10-minute trigger window with 7 minutes remaining.
   - In the **Submit carrier quote** panel, click the **CMA CGM** carrier preset (Freight: $1,300.00, Origin: $200.00, Destination: $250.00 $\rightarrow$ Total: $1,750.00).
   - Click **Submit carrier quote**.
   - **Observe**: The countdown timer immediately extends by **+5 minutes**, CMA CGM takes the **$L_1$** rank on the leaderboard, and the Activity Feed records the extension event with the trigger reason!

2. **Create a Fresh Custom RFQ**:
   - Navigate to `http://localhost:3000/rfqs/create`.
   - Enter reference ID (e.g. `RFQ-DEMO-01`), route, and schedule (e.g. close time 2 minutes ahead, forced close 10 minutes ahead).
   - Configure a 3-minute trigger window and 2-minute extension duration.
   - Click **Create RFQ & launch auction** to enter the Live Auction Room.

---

## 11. API Reference & Usage Examples

### Endpoints Overview

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/health` | Uptime health check. |
| `GET` | `/api/rfqs` | List all RFQs with computed lowest bids and time remaining. Filterable via `?status_filter=`. |
| `POST` | `/api/rfqs` | Create a new RFQ with British Auction configuration. |
| `GET` | `/api/rfqs/{id}` | Get detailed RFQ state, bidding stats, and trigger window status. |
| `DELETE` | `/api/rfqs/{id}` | Delete RFQ and cascade all associated bids and activity logs. |
| `POST` | `/api/rfqs/{id}/bids` | Submit a carrier quote. Calculates ranks ($L_1..L_n$) and triggers extensions. |
| `GET` | `/api/rfqs/{id}/bids` | Get ranked bids for an RFQ sorted by `total_amount ASC, created_at ASC`. |
| `GET` | `/api/rfqs/{id}/logs` | Get chronological audit trail of bids and extensions for an RFQ. |

---

### Ready-to-Run `curl` Examples

#### 1. Create a New RFQ
```bash
curl -X POST http://localhost:8000/api/rfqs \
  -H "Content-Type: application/json" \
  -d '{
    "reference_id": "RFQ-DEMO-2026",
    "title": "Singapore to Rotterdam 10x40ft FCL",
    "pickup_date": "2026-11-20T10:00:00Z",
    "bid_start_time": "2026-10-23T00:00:00Z",
    "bid_close_time": "2026-10-23T23:00:00Z",
    "forced_bid_close_time": "2026-10-24T02:00:00Z",
    "is_british_auction": true,
    "trigger_window_minutes": 15.0,
    "extension_duration_minutes": 5.0,
    "extension_trigger_type": "BID_RECEIVED"
  }'
```

#### 2. Submit a Carrier Quote
```bash
curl -X POST http://localhost:8000/api/rfqs/<rfq-uuid>/bids \
  -H "Content-Type: application/json" \
  -d '{
    "carrier_name": "Maersk Line",
    "freight_charges": 1450.00,
    "origin_charges": 200.00,
    "destination_charges": 250.00,
    "transit_time_days": 22,
    "quote_validity": "2026-12-31"
  }'
```

#### 3. Fetch Ranked Leaderboard Quotes
```bash
curl -X GET http://localhost:8000/api/rfqs/<rfq-uuid>/bids \
  -H "Accept: application/json"
```

#### 4. Fetch Chronological Audit Logs
```bash
curl -X GET http://localhost:8000/api/rfqs/<rfq-uuid>/logs \
  -H "Accept: application/json"
```

---

## 12. Frontend Architecture & UI Features

The frontend is built using **Next.js 16 (App Router)** and **Tailwind CSS v4**:

- **Listing Dashboard (`frontend/app/page.tsx`)**:
  - Filter tabs: `All`, `Active`, `Closed`, `Draft`.
  - Route search by port, title, or reference ID.
  - Quick statistics cards: Total RFQs, Live Auctions, In Trigger Window, Closed.
  - RFQ cards with per-second live countdown timers, status badges, $L_1$ prices, and route details.
- **RFQ Creation Form (`frontend/app/rfqs/create/page.tsx`)**:
  - Route, pickup date, and schedule inputs.
  - British Auction toggle with Trigger Window, Extension Duration, and Strategy selectors.
  - Live client-side validation ensuring `close > start`, `forced >= close`, and positive duration values.
- **Live Auction Room (`frontend/app/rfqs/[id]/page.tsx`)**:
  - Real-time countdown ticker that turns vibrant amber with a pulsing badge when entering the trigger window.
  - Carrier quick-bid presets (Maersk, MSC, CMA CGM, Hapag-Lloyd, ONE, Evergreen).
  - Bid submission form with auto-calculated total quotes ($\text{Freight} + \text{Origin} + \text{Destination}$).
  - Live Leaderboard displaying ranked quotes ($L_1, L_2, \dots$) with transit days, validity dates, and cost breakdowns.
  - Chronological Activity Feed documenting creation, bids, extensions, and closures.
- **Theming**: Integrated Dark Mode / Light Mode with persistence via `ThemeContext`.

---

## 13. Automated Testing Suite

The backend includes 8 automated unit and integration tests using `pytest` and `pytest-asyncio`. Tests run on an isolated in-memory SQLite database (`sqlite+aiosqlite:///:memory:`) configured in `backend/tests/conftest.py`, ensuring tests execute independently of PostgreSQL.

### Run Tests
```bash
cd backend
pytest -v
```

### Verified Test Cases
```
backend/tests/test_api.py::test_health_check PASSED
backend/tests/test_api.py::test_rfq_creation_and_listing PASSED
backend/tests/test_auction_engine.py::test_extension_strategies_unit PASSED
backend/tests/test_auction_engine.py::test_forced_close_ceiling_clamping PASSED
backend/tests/test_auction_engine.py::test_auction_status_evaluation PASSED
backend/tests/test_auction_engine.py::test_bid_submission_in_trigger_window PASSED
backend/tests/test_auction_engine.py::test_bid_submission_rejected_when_closed PASSED
backend/tests/test_auction_engine.py::test_bid_ranking_and_tie_breaking PASSED

============================== 8 passed in 0.85s ==============================
```

- **`test_extension_strategies_unit`**: Validates the 3 extension strategies (`BID_RECEIVED`, `ANY_RANK_CHANGE`, `L1_RANK_CHANGE`).
- **`test_forced_close_ceiling_clamping`**: Verifies that extensions never exceed `forced_bid_close_time`.
- **`test_auction_status_evaluation`**: Tests state machine transitions between `DRAFT`, `ACTIVE`, `CLOSED`, and `FORCE_CLOSED`.
- **`test_bid_submission_in_trigger_window`**: Verifies that bids inside the trigger window extend the deadline and generate audit logs.
- **`test_bid_submission_rejected_when_closed`**: Verifies that closed auctions reject incoming bids with `400 Bad Request`.
- **`test_bid_ranking_and_tie_breaking`**: Validates price-ascending sorting and timestamp tie-breaking.
- **`test_health_check`**: Verifies uptime endpoint.
- **`test_rfq_creation_and_listing`**: End-to-end integration test creating an RFQ, submitting a quote, and fetching list results.

---

## 14. Seeded Test Scenarios

The database seeder (`backend/seed.py`) populates 5 realistic RFQ scenarios:

| Reference ID | Route | Status | Auction Details | Seeded State |
| :--- | :--- | :--- | :--- | :--- |
| **`RFQ-MUM-ROT-001`** | Mumbai to Rotterdam | `ACTIVE` | 15m window, 3m extension, `BID_RECEIVED` | 45 minutes remaining. 3 seeded bids (Maersk at $L_1$ $2,150). |
| **`RFQ-SHA-LAX-002`** | Shanghai to Los Angeles | `ACTIVE` (Trigger Window) | 10m window, 5m extension, `L1_RANK_CHANGE` | **7 minutes remaining (inside trigger window)**. Ideal for instant live extension testing. |
| **`RFQ-SIN-HAM-003`** | Singapore to Hamburg | `CLOSED` | 10m window, 3m extension, `ANY_RANK_CHANGE` | Closed 1 hour ago. Winning carrier: Evergreen Marine ($2,080.00). |
| **`RFQ-DXB-FRA-004`** | Dubai to Frankfurt | `FORCE_CLOSED` | 10m window, 5m extension, `BID_RECEIVED` | Reached hard ceiling 2 hours ago. Final bidding terminated. |
| **`RFQ-TYO-SYD-005`** | Tokyo to Sydney | `DRAFT` | 15m window, 5m extension, `BID_RECEIVED` | Starts in 24 hours. Bidding opens in the future. |

---

## 15. Important Engineering Decisions

### 1. Strategy Pattern for Extension Rules
**Decision**: Extension rules are implemented as discrete strategy classes implementing `BaseExtensionStrategy` (`BidReceivedStrategy`, `AnyRankChangeStrategy`, `L1RankChangeStrategy`).
**Rationale**: Keeps extension rules modular and testable in isolation. Adding new extension conditions requires adding a new strategy class without modifying the core engine.

### 2. Row-Level Locking (`SELECT FOR UPDATE`)
**Decision**: Quote submissions acquire an exclusive row-level lock on the target RFQ row within a database transaction.
**Rationale**: Prevents race conditions during the final seconds of an auction when multiple carriers submit bids simultaneously, ensuring accurate close time calculations and ranking assignments.

### 3. Wall-Clock Lazy State Evaluation
**Decision**: Auction status is evaluated dynamically by comparing current UTC time against `bid_start_time`, `bid_close_time`, and `forced_bid_close_time`.
**Rationale**: Eliminates the operational overhead of running background schedulers to transition dormant auctions, while ensuring that all client requests reflect the true temporal state.

### 4. Database-Level Check Constraints
**Decision**: Timestamp sequences and financial invariants are enforced via PostgreSQL `CHECK` constraints.
**Rationale**: Provides defense-in-depth data integrity that prevents invalid states regardless of how data is inserted or modified.

---

## 16. Troubleshooting & FAQ

| Problem | Cause | Solution |
| :--- | :--- | :--- |
| `could not connect to server: Connection refused` | PostgreSQL is not running or wrong port. | Start PostgreSQL (`Get-Service postgresql*` or `sudo systemctl start postgresql`). Verify port `5432` in `backend/.env`. |
| `InvalidPasswordError` | Incorrect password in `backend/.env`. | Update `DB_PASSWORD` and `DATABASE_URL` in `backend/.env` with your actual PostgreSQL password. |
| `HTTP 400: An RFQ with reference ID ... already exists` | Attempting to create an RFQ with a duplicate `reference_id`. | Use a unique reference code (e.g. `RFQ-2026-001`). |
| `HTTP 400: Cannot submit quote: Auction is CLOSED` | Wall-clock time has exceeded `bid_close_time`. | Create a fresh RFQ with future close dates, or test using the pre-seeded active RFQ (`RFQ-SHA-LAX-002`). |
| Port 8000 or 3000 already in use | Another application or previous process is holding the port. | On Windows: run `netstat -ano \| findstr :8000` and `taskkill /PID <PID> /F`. |

---

## 17. Project Directory Structure

```
.
├── backend/
│   ├── app/
│   │   ├── core/
│   │   │   ├── config.py          # Settings, environment variables, CORS
│   │   │   └── database.py        # SQLAlchemy AsyncEngine & sessionmaker
│   │   ├── models/
│   │   │   ├── activity_log.py    # RFQActivityLog model
│   │   │   ├── bid.py             # Bid model with check constraints
│   │   │   ├── enums.py           # AuctionStatus, ExtensionTriggerType, ActivityEventType
│   │   │   └── rfq.py             # RFQ model with check constraints
│   │   ├── routers/
│   │   │   ├── activity_logs.py   # /api/rfqs/{id}/logs
│   │   │   ├── bids.py            # /api/rfqs/{id}/bids
│   │   │   └── rfqs.py            # /api/rfqs
│   │   ├── schemas/
│   │   │   ├── activity_log.py    # ActivityLogResponse schema
│   │   │   ├── bid.py             # BidCreate, BidResponse, BidSubmissionResult
│   │   │   └── rfq.py             # RFQCreate, RFQListItem, RFQDetails
│   │   ├── services/
│   │   │   ├── auction_engine.py  # Concurrency locking, ranking, transactions
│   │   │   └── extension_strategies.py # Strategy pattern implementation
│   │   └── main.py                # FastAPI app initialization, lifespan, CORS
│   ├── tests/
│   │   ├── conftest.py            # In-memory SQLite async test fixture
│   │   ├── test_api.py            # Integration tests for API routes
│   │   └── test_auction_engine.py # Unit tests for strategies and clamping
│   ├── requirements.txt           # Python dependencies
│   └── seed.py                    # Database seeder script
├── frontend/
│   ├── app/
│   │   ├── rfqs/
│   │   │   ├── [id]/
│   │   │   │   └── page.tsx       # Live Auction Room (Ticker, Leaderboard, Bids, Logs)
│   │   │   └── create/
│   │   │       └── page.tsx       # RFQ Creation Form with presets & validation
│   │   ├── globals.css            # Tailwind CSS styling & dark mode definitions
│   │   ├── layout.tsx             # Root layout with ThemeProvider and Navbar
│   │   └── page.tsx               # RFQ Listing Dashboard (Status filters, stats, cards)
│   ├── components/
│   │   ├── Navbar.tsx             # Global navigation bar with branding & theme toggle
│   │   ├── ShipIllustration.tsx   # Animated SVG maritime logistics ship
│   │   └── ThemeContext.tsx       # Theme provider supporting Light and Dark modes
│   ├── lib/
│   │   └── api.ts                 # Fetch API client wrapper
│   ├── package.json               # Node.js dependencies and scripts
│   ├── tsconfig.json              # TypeScript configuration
│   └── next.config.ts             # Next.js configuration
├── docs/
│   ├── HLD.md                     # High-Level Design document
│   └── SCHEMA.md                  # Database schema design document
└── README.md
```

---

## 18. Environment Variables Reference

### Backend (`backend/.env`)

| Variable | Default in Code | Purpose |
| :--- | :--- | :--- |
| `DB_USER` | `postgres` | PostgreSQL username |
| `DB_PASSWORD` | `password` | PostgreSQL password |
| `DB_HOST` | `localhost` | PostgreSQL host |
| `DB_PORT` | `5432` | PostgreSQL port |
| `DB_NAME` | `gocomet_auction` | PostgreSQL database name |
| `DATABASE_URL` | Auto-derived from above | Async connection string for SQLAlchemy asyncpg |
| `SYNC_DATABASE_URL` | Auto-derived from above | Synchronous connection string for psycopg2 |
| `BACKEND_PORT` | `8000` | Port for the FastAPI server |
| `FRONTEND_URL` | `http://localhost:3000` | Allowed frontend origin for CORS |
| `CORS_ORIGINS` | `http://localhost:3000,http://127.0.0.1:3000` | Comma-delimited list of CORS origins |

### Frontend (`frontend/.env.local`)

| Variable | Default in Code | Purpose |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_API_URL` | `http://localhost:8000` | Base URL of the backend FastAPI service |

---

## 19. Author & Project Metadata

- **Author**: Tanmay Awal
- **Project**: GoComet British Auction in RFQ System Hiring Assessment
- **Built With**: Next.js 16 (React 19 / TypeScript / Tailwind CSS v4) + FastAPI (Python 3.11+ / asyncpg / SQLAlchemy 2.0) + PostgreSQL 14+

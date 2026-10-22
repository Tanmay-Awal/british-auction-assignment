# High-Level Design (HLD): British Auction in RFQ System

## 1. Executive Summary & Problem Domain
In logistics and freight procurement, a **Request for Quotation (RFQ)** allows a shipper/buyer to request price quotes from multiple ocean/air carriers and logistics providers.
A standard fixed-deadline auction suffers from **bid sniping**—carriers hold their lowest quote until seconds before the deadline to prevent competitors from underbidding them. This limits price discovery and prevents buyers from obtaining the optimal market rate.

The **British Auction** solves this by:
1. Monitoring bidding activity during a **Trigger Window ($X$ minutes)** prior to the close time.
2. Dynamically extending the close time by **Extension Duration ($Y$ minutes)** whenever a qualifying bidding condition occurs.
3. Enforcing an absolute **Forced Bid Close Time** (hard ceiling) beyond which no extension is permitted, guaranteeing auction termination.

---

## 2. System Architecture

The system is architected as a decoupled, real-time-ready client-server system:

```mermaid
graph TB
    subgraph ClientLayer ["Client Layer (Next.js 14+ App Router)"]
        UI_List["Auction Listing Dashboard<br/>- Live Countdowns<br/>- Status Badges<br/>- Quick Stats"]
        UI_Create["RFQ Creator Form<br/>- Form Validations<br/>- Trigger Selector<br/>- Demo Presets"]
        UI_Room["Live Auction Room<br/>- Bid Submissions<br/>- Ranked Leaderboard<br/>- Audit Activity Log"]
    end

    subgraph APILayer ["API Layer (FastAPI ASGI)"]
        Router_RFQ["/api/rfqs<br/>CRUD & Lifecycle"]
        Router_Bid["/api/rfqs/{id}/bids<br/>Quote Submission"]
        Router_Log["/api/rfqs/{id}/logs<br/>Audit Activity Feed"]
    end

    subgraph EngineLayer ["Core Auction Engine (Domain Service)"]
        LockMgr["Concurrency Control<br/>Row Lock (SELECT FOR UPDATE)"]
        RankingEngine["Ranking Evaluator<br/>Total Quote & L1..Ln Ranks"]
        ExtEngine["Extension Evaluator<br/>(Strategy Pattern)"]
        StatusEngine["Auction State Machine<br/>(ACTIVE / CLOSED / FORCE_CLOSED)"]
        AuditLogger["Audit & Activity Logger<br/>Immutable Event Trail"]
    end

    subgraph StorageLayer ["Persistence Layer (PostgreSQL)"]
        T_RFQs[("rfqs<br/>Configuration & Timestamps")]
        T_Bids[("bids<br/>Quotes & Component Costs")]
        T_Logs[("rfq_activity_logs<br/>Audit Trail")]
    end

    ClientLayer -->|RESTful JSON / Polling| APILayer
    APILayer --> EngineLayer
    EngineLayer --> LockMgr
    LockMgr --> StorageLayer
    RankingEngine --> StorageLayer
    ExtEngine --> StorageLayer
    AuditLogger --> StorageLayer
```

---

## 3. Core Domain Workflows

### 3.1 Bid Placement & Dynamic Extension Sequence

```mermaid
sequenceDiagram
    autonumber
    actor Carrier as Carrier / Supplier
    participant API as FastAPI Router
    participant Engine as Auction Engine
    participant Strategy as Extension Strategy
    participant DB as PostgreSQL (Transaction)

    Carrier->>API: POST /api/rfqs/{id}/bids (Freight, Origin, Dest, Transit, Validity)
    API->>DB: BEGIN TRANSACTION
    API->>DB: SELECT * FROM rfqs WHERE id = ? FOR UPDATE
    Note over DB: Locks RFQ row to prevent concurrent race conditions
    
    Engine->>Engine: Validate Auction Status (Must be ACTIVE and now <= close_time)
    Engine->>DB: Query current bids to evaluate existing ranking
    Engine->>Engine: Compute Total Quote = Freight + Origin + Dest
    Engine->>Engine: Calculate new rankings (L1, L2, ...)
    
    alt In Trigger Window (now >= close_time - X)?
        Engine->>Strategy: evaluate(current_bids, new_bid, new_rank)
        Strategy-->>Engine: { should_extend: bool, reason: string }
        
        opt should_extend is TRUE
            Engine->>Engine: new_close = min(current_close + Y, forced_close)
            Engine->>Engine: Determine if clamped to Forced Close Time
            Engine->>DB: UPDATE rfqs SET bid_close_time = new_close
            Engine->>DB: INSERT INTO rfq_activity_logs (AUCTION_EXTENDED, reason)
        end
    end

    Engine->>DB: INSERT INTO bids (quote data, total_amount, rank)
    Engine->>DB: INSERT INTO rfq_activity_logs (BID_SUBMITTED)
    API->>DB: COMMIT TRANSACTION
    API-->>Carrier: 201 Created (Bid Details, New Close Time, Extension Applied)
```

---

## 4. Design Patterns Applied

### 4.1 Strategy Pattern for Extension Rules
The assignment defines 3 distinct extension triggers. We decouple these via the **Strategy Pattern** to ensure extensibility without modifying core engine logic (Open/Closed Principle):

```
                       ┌─────────────────────────┐
                       │ ExtensionRuleStrategy   │
                       ├─────────────────────────┤
                       │ + should_extend(...)    │
                       └────────────▲────────────┘
                                    │
         ┌──────────────────────────┼──────────────────────────┐
         │                          │                          │
┌────────────────────────┐ ┌────────────────────────┐ ┌────────────────────────┐
│ BidReceivedStrategy    │ │ AnyRankChangeStrategy  │ │ L1RankChangeStrategy   │
├────────────────────────┤ ├────────────────────────┤ ├────────────────────────┤
│ Extends if any valid   │ │ Extends if any carrier │ │ Extends ONLY if the L1 │
│ bid arrives in window  │ │ position changes       │ │ lowest bidder changes  │
└────────────────────────┘ └────────────────────────┘ └────────────────────────┘
```

### 4.2 State Machine for Auction Lifecycle
An auction moves through distinct states based on wall-clock time and bidding events:

```mermaid
stateDiagram-v2
    [*] --> DRAFT : RFQ Created (Future Start)
    DRAFT --> ACTIVE : now >= bid_start_time
    ACTIVE --> ACTIVE : Extension Triggered (close_time += Y <= forced_close)
    ACTIVE --> CLOSED : now >= bid_close_time (Natural Close)
    ACTIVE --> FORCE_CLOSED : now >= forced_bid_close_time (Hard Stop)
    CLOSED --> [*]
    FORCE_CLOSED --> [*]
```

---

## 5. Non-Functional Requirements & Scalability

1. **Concurrency & Race Conditions**:
   * Critical during high-frequency bidding near closing time.
   * Handled via PostgreSQL row-level locks (`SELECT FOR UPDATE`) on the target RFQ, guaranteeing strict serialization of rank calculation and time extensions.
2. **Precision & Timezones**:
   * All timestamps stored in **UTC (ISO-8601)** with millisecond precision to eliminate local timezone drift.
3. **Auditability**:
   * Every state mutation (creation, bid, extension, forced close) produces an immutable record in `rfq_activity_logs` with the exact actor, timestamps, and justification.
4. **Resilience**:
   * If an auction passes its close time, status transitions are dynamically evaluated on read queries even if background workers are momentarily delayed.

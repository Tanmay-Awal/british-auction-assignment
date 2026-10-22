const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface RFQItem {
  id: string;
  reference_id: string;
  title: string;
  pickup_date: string;
  bid_start_time: string;
  bid_close_time: string;
  original_bid_close_time: string;
  forced_bid_close_time: string;
  is_british_auction: boolean;
  trigger_window_minutes: number;
  extension_duration_minutes: number;
  extension_trigger_type: string;
  status: "DRAFT" | "ACTIVE" | "CLOSED" | "FORCE_CLOSED";
  current_lowest_bid?: number | null;
  lowest_bidder_carrier?: string | null;
  total_bids_count: number;
  time_remaining_seconds: number;
  in_trigger_window: boolean;
  created_at: string;
  updated_at: string;
}

export interface BidItem {
  id: string;
  rfq_id: string;
  carrier_name: string;
  freight_charges: number;
  origin_charges: number;
  destination_charges: number;
  total_amount: number;
  transit_time_days: number;
  quote_validity: string;
  rank_at_submission?: number;
  current_rank?: number;
  rank_label?: string;
  created_at: string;
}

export interface ActivityLogItem {
  id: string;
  rfq_id: string;
  event_type:
    | "RFQ_CREATED"
    | "BID_SUBMITTED"
    | "AUCTION_EXTENDED"
    | "AUCTION_CLOSED"
    | "AUCTION_FORCE_CLOSED"
    | "AUCTION_STARTED"
    | string;
  description: string;
  extension_minutes?: number | null;
  previous_close_time?: string | null;
  new_close_time?: string | null;
  actor: string;
  created_at: string;
}

export interface CreateRFQPayload {
  reference_id: string;
  title: string;
  pickup_date: string;
  bid_start_time: string;
  bid_close_time: string;
  forced_bid_close_time: string;
  is_british_auction: boolean;
  trigger_window_minutes: number;
  extension_duration_minutes: number;
  extension_trigger_type: string;
}

export interface SubmitBidPayload {
  carrier_name: string;
  freight_charges: number;
  origin_charges: number;
  destination_charges: number;
  transit_time_days: number;
  quote_validity: string;
}

export interface BidSubmissionResult {
  bid: BidItem;
  extended: boolean;
  extension_reason?: string | null;
  new_bid_close_time: string;
  forced_close_hit: boolean;
  current_status: string;
}

export async function getRFQs(statusFilter?: string): Promise<RFQItem[]> {
  const url = statusFilter && statusFilter !== "ALL"
    ? `${API_BASE_URL}/api/rfqs?status_filter=${statusFilter}`
    : `${API_BASE_URL}/api/rfqs`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch RFQs");
  return res.json();
}

export async function getRFQDetails(rfqId: string): Promise<RFQItem> {
  const res = await fetch(`${API_BASE_URL}/api/rfqs/${rfqId}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch RFQ details");
  return res.json();
}

export async function createRFQ(payload: CreateRFQPayload): Promise<RFQItem> {
  const res = await fetch(`${API_BASE_URL}/api/rfqs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || "Failed to create RFQ");
  }
  return res.json();
}

export async function getBids(rfqId: string): Promise<BidItem[]> {
  const res = await fetch(`${API_BASE_URL}/api/rfqs/${rfqId}/bids`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch bids");
  return res.json();
}

export async function submitQuote(rfqId: string, payload: SubmitBidPayload): Promise<BidSubmissionResult> {
  const res = await fetch(`${API_BASE_URL}/api/rfqs/${rfqId}/bids`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || "Failed to submit quote");
  }
  return res.json();
}

export async function getActivityLogs(rfqId: string): Promise<ActivityLogItem[]> {
  const res = await fetch(`${API_BASE_URL}/api/rfqs/${rfqId}/logs`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch activity logs");
  return res.json();
}

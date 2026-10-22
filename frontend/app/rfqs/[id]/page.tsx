"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { getRFQDetails, getBids, getActivityLogs, RFQItem, BidItem, ActivityLogItem } from "@/lib/api";
import CountdownTimer from "@/components/CountdownTimer";
import LeaderboardTable from "@/components/LeaderboardTable";
import ActivityFeed from "@/components/ActivityFeed";
import BidSubmissionModal from "@/components/BidSubmissionModal";
import {
  ArrowLeft,
  RefreshCw,
} from "lucide-react";

export default function AuctionDetailsPage() {
  const params = useParams();
  const rfqId = params.id as string;

  const [rfq, setRfq] = useState<RFQItem | null>(null);
  const [bids, setBids] = useState<BidItem[]>([]);
  const [logs, setLogs] = useState<ActivityLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);

  const loadAllData = async () => {
    try {
      const [rfqData, bidsData, logsData] = await Promise.all([
        getRFQDetails(rfqId),
        getBids(rfqId),
        getActivityLogs(rfqId),
      ]);
      setRfq(rfqData);
      setBids(bidsData);
      setLogs(logsData);
      setLastRefreshed(new Date());
    } catch (err: any) {
      setError(err.message || "Failed to load auction room data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
    const interval = setInterval(loadAllData, 3000);
    return () => clearInterval(interval);
  }, [rfqId]);

  if (loading && !rfq) {
    return (
      <div className="p-20 text-center bg-white rounded-2xl border border-slate-200 shadow-sm">
        <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-3" />
        <p className="text-sm font-semibold text-slate-600">Connecting to Live Auction Room...</p>
      </div>
    );
  }

  if (error || !rfq) {
    return (
      <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 shadow-sm">
        <h3 className="text-base font-bold text-red-600">Error Loading Auction</h3>
        <p className="text-xs text-slate-500 mt-1">{error || "RFQ not found"}</p>
        <Link href="/" className="inline-flex items-center space-x-2 mt-4 px-4 py-2 rounded-lg text-xs font-bold bg-blue-600 text-white shadow-sm">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </Link>
      </div>
    );
  }

  const getTriggerLabel = (type: string) => {
    switch (type) {
      case "BID_RECEIVED":
        return "Rule A: Any Bid Received in Window";
      case "ANY_RANK_CHANGE":
        return "Rule B: Any Supplier Rank Change";
      case "L1_RANK_CHANGE":
        return "Rule C: Lowest Bidder (L1) Change";
      default:
        return type;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Bar Navigation & Live Sync Pill */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <Link
          href="/"
          className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-slate-500" />
          <span>Back to Auctions Dashboard</span>
        </Link>

        <div className="flex items-center space-x-3 text-xs text-slate-500 font-mono">
          <span className="flex items-center space-x-1.5 bg-white px-3 py-1 rounded-lg border border-slate-200 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-semibold text-slate-700">Live Sync (3s)</span>
          </span>
          <button
            onClick={loadAllData}
            className="p-1.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 transition-colors shadow-2xs"
            title="Manual Refresh"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Auction Room Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2.5">
              <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded border border-blue-200">
                {rfq.reference_id}
              </span>
              <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
                Pickup: {new Date(rfq.pickup_date).toLocaleDateString()}
              </span>
              <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
                {getTriggerLabel(rfq.extension_trigger_type)}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {rfq.title}
            </h1>

            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-3 text-xs text-slate-600">
              <div>
                Trigger Window: <strong className="text-slate-900">{rfq.trigger_window_minutes} mins</strong>
              </div>
              <div>
                Extension Added: <strong className="text-slate-900">+{rfq.extension_duration_minutes} mins</strong>
              </div>
              <div>
                Original Close: <span className="font-mono font-bold text-slate-800">{new Date(rfq.original_bid_close_time).toLocaleTimeString([], { hour: "numeric", minute: "2-digit", hour12: true })}</span>
              </div>
              <div>
                Forced Close Ceiling: <span className="font-mono text-red-600 font-extrabold">{new Date(rfq.forced_bid_close_time).toLocaleTimeString([], { hour: "numeric", minute: "2-digit", hour12: true })}</span>
              </div>
            </div>
          </div>

          {/* Large Countdown Widget */}
          <div className="lg:w-96 shrink-0">
            <CountdownTimer
              bidCloseTime={rfq.bid_close_time}
              forcedBidCloseTime={rfq.forced_bid_close_time}
              triggerWindowMinutes={Number(rfq.trigger_window_minutes)}
              extensionDurationMinutes={Number(rfq.extension_duration_minutes)}
              status={rfq.status}
            />
          </div>
        </div>
      </div>

      {/* Main 2-Column Live Bid Room Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7 cols): Leaderboard & Quote Placement Form */}
        <div className="lg:col-span-7 space-y-6">
          <LeaderboardTable bids={bids} auctionStatus={rfq.status} />
          <BidSubmissionModal
            rfqId={rfq.id}
            auctionStatus={rfq.status}
            onBidSubmitted={loadAllData}
          />
        </div>

        {/* Right Column (5 cols): Live Activity & Extension Audit Log */}
        <div className="lg:col-span-5">
          <ActivityFeed logs={logs} />
        </div>
      </div>
    </div>
  );
}

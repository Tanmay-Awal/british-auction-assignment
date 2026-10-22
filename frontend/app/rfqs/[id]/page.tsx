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
  Anchor,
  Clock,
  ShieldCheck,
  Zap,
  RefreshCw,
  Calendar,
  Layers,
  Sparkles,
  Trophy
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
    // Auto-refresh auction room every 3 seconds for live updates
    const interval = setInterval(loadAllData, 3000);
    return () => clearInterval(interval);
  }, [rfqId]);

  if (loading && !rfq) {
    return (
      <div className="p-20 text-center">
        <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin mx-auto mb-3" />
        <p className="text-sm text-slate-400">Connecting to Live Auction Room...</p>
      </div>
    );
  }

  if (error || !rfq) {
    return (
      <div className="p-12 text-center bg-slate-900 rounded-3xl border border-slate-800">
        <h3 className="text-base font-bold text-rose-400">Error Loading Auction</h3>
        <p className="text-xs text-slate-400 mt-1">{error || "RFQ not found"}</p>
        <Link href="/" className="inline-flex items-center space-x-2 mt-4 px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 text-white">
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
          className="inline-flex items-center space-x-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Auctions Dashboard</span>
        </Link>

        <div className="flex items-center space-x-3 text-xs text-slate-400 font-mono">
          <span className="flex items-center space-x-1.5 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Live Sync (3s)</span>
          </span>
          <button
            onClick={loadAllData}
            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 transition-colors"
            title="Manual Refresh"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Auction Room Header Card */}
      <div className="bg-slate-900/90 rounded-3xl border border-slate-800 p-6 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="font-mono text-xs font-bold text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-md border border-indigo-500/20">
                {rfq.reference_id}
              </span>
              <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-slate-800 text-slate-300 border border-slate-700">
                Pickup: {new Date(rfq.pickup_date).toLocaleDateString()}
              </span>
              <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-purple-500/10 text-purple-300 border border-purple-500/20">
                {getTriggerLabel(rfq.extension_trigger_type)}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {rfq.title}
            </h1>

            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-3 text-xs text-slate-400">
              <div>
                Trigger Window: <strong className="text-slate-200">{rfq.trigger_window_minutes} mins</strong>
              </div>
              <div>
                Extension Added: <strong className="text-slate-200">+{rfq.extension_duration_minutes} mins</strong>
              </div>
              <div>
                Original Close: <span className="font-mono text-slate-300">{new Date(rfq.original_bid_close_time).toLocaleTimeString()}</span>
              </div>
              <div>
                Forced Close Ceiling: <span className="font-mono text-rose-400 font-bold">{new Date(rfq.forced_bid_close_time).toLocaleTimeString()}</span>
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

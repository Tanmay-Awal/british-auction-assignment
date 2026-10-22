"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getRFQs, RFQItem } from "@/lib/api";
import CountdownTimer from "@/components/CountdownTimer";
import {
  Anchor,
  PlusCircle,
  RefreshCw,
  Trophy,
  Clock,
  ShieldAlert,
  ArrowRight,
  Zap,
  Filter,
  CheckCircle2
} from "lucide-react";

export default function AuctionListingPage() {
  const [rfqs, setRfqs] = useState<RFQItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);

  const loadData = async () => {
    try {
      const data = await getRFQs(statusFilter);
      setRfqs(data);
      setLastRefreshed(new Date());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // Auto-refresh listing every 4 seconds to update countdowns and bids
    const interval = setInterval(loadData, 4000);
    return () => clearInterval(interval);
  }, [statusFilter]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return (
          <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>ACTIVE</span>
          </span>
        );
      case "FORCE_CLOSED":
        return (
          <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>FORCE CLOSED</span>
          </span>
        );
      case "CLOSED":
        return (
          <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-800 text-slate-400 border border-slate-700">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>CLOSED</span>
          </span>
        );
      case "DRAFT":
        return (
          <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
            <Clock className="w-3.5 h-3.5" />
            <span>UPCOMING / DRAFT</span>
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-800 text-slate-400">
            {status}
          </span>
        );
    }
  };

  const getTriggerLabel = (type: string) => {
    switch (type) {
      case "BID_RECEIVED":
        return "Any Bid in Window";
      case "ANY_RANK_CHANGE":
        return "Any Rank Change";
      case "L1_RANK_CHANGE":
        return "Lowest Bidder (L1) Change";
      default:
        return type;
    }
  };

  return (
    <div className="space-y-8">
      {/* Hero Banner with System Highlights */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-950/70 via-slate-900 to-slate-950 border border-slate-800 p-6 sm:p-8 shadow-2xl">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold mb-4">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>GoComet British Auction RFQ Engine</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
            Competitive Freight Procurement with Dynamic British Extensions
          </h1>
          <p className="mt-3 text-slate-300 text-sm sm:text-base leading-relaxed">
            Eliminate last-second bid sniping. Auctions automatically extend when competitive activity occurs in the trigger window, capped strictly by the hard Forced Close Time ceiling.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link
              href="/rfqs/create"
              className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl font-bold text-sm bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition-all hover:scale-102"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Create British RFQ</span>
            </Link>

            <button
              onClick={loadData}
              className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl font-medium text-sm bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 border border-slate-700/60 transition-colors"
            >
              <RefreshCw className="w-4 h-4 text-slate-400" />
              <span>Sync Dashboard</span>
            </button>
          </div>
        </div>

        {/* Decorative Grid Glow */}
        <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Filter and Metrics Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 mr-2">Filter:</span>
          {(["ALL", "ACTIVE", "CLOSED", "FORCE_CLOSED"] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                statusFilter === st
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                  : "bg-slate-800/60 text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        <div className="text-xs text-slate-500 font-mono">
          Last synced: {lastRefreshed ? lastRefreshed.toLocaleTimeString() : "Syncing..."} (Live 4s ticker)
        </div>
      </div>

      {/* RFQ Listing Grid */}
      {loading ? (
        <div className="p-16 text-center">
          <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin mx-auto mb-3" />
          <p className="text-sm text-slate-400">Loading British Auctions...</p>
        </div>
      ) : rfqs.length === 0 ? (
        <div className="p-16 text-center bg-slate-900/40 rounded-3xl border border-slate-800/60">
          <Anchor className="w-12 h-12 text-slate-700 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white">No RFQs Found</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            No auctions matching the filter. Create a new British RFQ to begin testing!
          </p>
          <Link
            href="/rfqs/create"
            className="inline-flex items-center space-x-2 mt-4 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 text-white"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Create First RFQ</span>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {rfqs.map((rfq) => (
            <div
              key={rfq.id}
              className="bg-slate-900/90 hover:bg-slate-900 rounded-2xl border border-slate-800 hover:border-slate-700 p-5 shadow-xl transition-all hover:shadow-indigo-500/5 flex flex-col justify-between group"
            >
              <div>
                {/* Header: Reference ID + Status Badge */}
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <span className="font-mono text-xs font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                      {rfq.reference_id}
                    </span>
                    <h2 className="text-lg font-bold text-white mt-1.5 tracking-tight group-hover:text-indigo-300 transition-colors">
                      {rfq.title}
                    </h2>
                  </div>
                  <div>{getStatusBadge(rfq.status)}</div>
                </div>

                {/* British Auction Config Pills */}
                {rfq.is_british_auction && (
                  <div className="flex flex-wrap items-center gap-1.5 my-3 text-[11px]">
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                      Window: <strong>{rfq.trigger_window_minutes}m</strong>
                    </span>
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                      Extend: <strong>+{rfq.extension_duration_minutes}m</strong>
                    </span>
                    <span className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20 font-medium">
                      Trigger: {getTriggerLabel(rfq.extension_trigger_type)}
                    </span>
                  </div>
                )}

                {/* Lowest Quote Display */}
                <div className="my-4 p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Trophy className="w-5 h-5 text-amber-400" />
                    <div>
                      <div className="text-[11px] font-semibold text-slate-400">Current Lowest Bid (L1)</div>
                      <div className="font-semibold text-xs text-slate-300">
                        {rfq.lowest_bidder_carrier || "No bids placed yet"}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono font-extrabold text-lg text-white">
                      {rfq.current_lowest_bid != null
                        ? `$${Number(rfq.current_lowest_bid).toLocaleString(undefined, { minimumFractionDigits: 2 })}`
                        : "—"}
                    </div>
                    <div className="text-[10px] text-slate-500">{rfq.total_bids_count} bids</div>
                  </div>
                </div>

                {/* Live Countdown & Ceilings */}
                <div className="space-y-1.5 text-xs text-slate-400 border-t border-slate-800/60 pt-3">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center space-x-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      <span>Countdown:</span>
                    </span>
                    <CountdownTimer
                      bidCloseTime={rfq.bid_close_time}
                      forcedBidCloseTime={rfq.forced_bid_close_time}
                      triggerWindowMinutes={Number(rfq.trigger_window_minutes)}
                      extensionDurationMinutes={Number(rfq.extension_duration_minutes)}
                      status={rfq.status}
                      compact={true}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-500">
                    <span>Dynamic Close:</span>
                    <span className="text-slate-300">{new Date(rfq.bid_close_time).toLocaleTimeString()}</span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-500">
                    <span>Forced Close Ceiling:</span>
                    <span className="text-rose-400/90">{new Date(rfq.forced_bid_close_time).toLocaleTimeString()}</span>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="mt-5 pt-3 border-t border-slate-800 flex items-center justify-end">
                <Link
                  href={`/rfqs/${rfq.id}`}
                  className="inline-flex items-center space-x-1.5 text-xs font-bold text-indigo-400 hover:text-indigo-300 group-hover:translate-x-1 transition-all"
                >
                  <span>Enter Live Auction Room</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

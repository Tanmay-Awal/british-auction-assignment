"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getRFQs, RFQItem } from "@/lib/api";
import CountdownTimer from "@/components/CountdownTimer";
import {
  PlusCircle,
  RefreshCw,
  Trophy,
  Clock,
  Lock,
  ArrowRight,
  Zap,
  Filter,
  CheckCircle2,
  Anchor
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
    const interval = setInterval(loadData, 4000);
    return () => clearInterval(interval);
  }, [statusFilter]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-600 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>ACTIVE</span>
          </span>
        );
      case "FORCE_CLOSED":
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-50 text-red-600 border border-red-200">
            <Lock className="w-3 h-3" />
            <span>FORCE CLOSED</span>
          </span>
        );
      case "CLOSED":
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
            <CheckCircle2 className="w-3 h-3" />
            <span>CLOSED</span>
          </span>
        );
      case "DRAFT":
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-600 border border-blue-200">
            <Clock className="w-3 h-3" />
            <span>UPCOMING / DRAFT</span>
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
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

  const formatHoursOrMins = (minutesVal: number) => {
    const mins = Number(minutesVal);
    if (mins >= 60) {
      return `${(mins / 60).toFixed(2)}hr`;
    }
    return `${mins.toFixed(2)}m`;
  };

  return (
    <div className="space-y-6">
      {/* Hero Banner with exact SVG Container Ship / Crane illustration */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-50/60 via-white to-blue-50/40 border border-slate-200/90 p-8 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-600 text-xs font-semibold mb-3">
            <Zap className="w-3.5 h-3.5 text-blue-600 fill-blue-600" />
            <span>GoComet British Auction RFQ Engine</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight mb-3">
            Competitive Freight Procurement with Dynamic British Extensions
          </h1>

          <p className="text-slate-600 text-sm leading-relaxed mb-6 max-w-xl">
            Eliminate last-second bid sniping. Auctions automatically extend when competitive activity occurs in the trigger window, capped strictly by the hard Forced Close Time ceiling.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/rfqs/create"
              className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-lg font-semibold text-sm bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Create British RFQ</span>
            </Link>

            <button
              onClick={loadData}
              className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-lg font-semibold text-sm bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-sm transition-colors"
            >
              <RefreshCw className="w-4 h-4 text-slate-500" />
              <span>Sync Dashboard</span>
            </button>
          </div>
        </div>

        {/* Cargo Ship & Crane Line Illustration matching Screenshot 1 */}
        <div className="shrink-0 w-72 h-44 hidden md:flex items-center justify-center opacity-85 select-none pointer-events-none">
          <svg viewBox="0 0 320 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
            {/* Background Clouds / Sun */}
            <circle cx="260" cy="50" r="28" fill="#dbeafe" opacity="0.6" />
            <path d="M220 70 C220 60, 235 55, 245 60 C250 50, 270 50, 280 60 C290 60, 295 70, 290 75 Z" fill="#eff6ff" />
            
            {/* Port Crane */}
            <path d="M290 160 L290 50 L240 50" stroke="#93c5fd" strokeWidth="3" strokeLinecap="round" />
            <path d="M290 50 L310 40" stroke="#93c5fd" strokeWidth="3" strokeLinecap="round" />
            <line x1="265" y1="50" x2="265" y2="80" stroke="#93c5fd" strokeWidth="2" strokeDasharray="3 3" />
            <rect x="257" y="80" width="16" height="10" rx="1" fill="#3b82f6" />
            <line x1="290" y1="160" x2="275" y2="160" stroke="#93c5fd" strokeWidth="3" />
            <line x1="290" y1="160" x2="305" y2="160" stroke="#93c5fd" strokeWidth="3" />

            {/* Container Ship Hull */}
            <path d="M220 160 L30 160 L45 130 L240 130 C240 130 250 145 235 155 Z" fill="#93c5fd" opacity="0.75" />
            <path d="M220 160 L25 160" stroke="#60a5fa" strokeWidth="3" strokeLinecap="round" />

            {/* Containers on Ship */}
            <rect x="60" y="112" width="24" height="18" rx="1" fill="#60a5fa" stroke="#ffffff" strokeWidth="1" />
            <rect x="84" y="112" width="24" height="18" rx="1" fill="#3b82f6" stroke="#ffffff" strokeWidth="1" />
            <rect x="108" y="112" width="24" height="18" rx="1" fill="#93c5fd" stroke="#ffffff" strokeWidth="1" />
            <rect x="132" y="112" width="24" height="18" rx="1" fill="#2563eb" stroke="#ffffff" strokeWidth="1" />
            <rect x="156" y="112" width="24" height="18" rx="1" fill="#60a5fa" stroke="#ffffff" strokeWidth="1" />
            <rect x="180" y="112" width="24" height="18" rx="1" fill="#3b82f6" stroke="#ffffff" strokeWidth="1" />

            {/* Stacked Containers Tier 2 */}
            <rect x="72" y="94" width="24" height="18" rx="1" fill="#3b82f6" stroke="#ffffff" strokeWidth="1" />
            <rect x="96" y="94" width="24" height="18" rx="1" fill="#2563eb" stroke="#ffffff" strokeWidth="1" />
            <rect x="120" y="94" width="24" height="18" rx="1" fill="#60a5fa" stroke="#ffffff" strokeWidth="1" />
            <rect x="144" y="94" width="24" height="18" rx="1" fill="#93c5fd" stroke="#ffffff" strokeWidth="1" />
            <rect x="168" y="94" width="24" height="18" rx="1" fill="#3b82f6" stroke="#ffffff" strokeWidth="1" />

            {/* Water Waves */}
            <path d="M10 165 C30 163, 40 167, 60 165 C80 163, 90 167, 110 165 C130 163, 140 167, 160 165 C180 163, 190 167, 210 165 C230 163, 240 167, 260 165 C280 163, 290 167, 310 165" stroke="#bfdbfe" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M25 172 C45 170, 55 174, 75 172 C95 170, 105 174, 125 172 C145 170, 155 174, 175 172 C195 170, 205 174, 225 172" stroke="#dbeafe" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>
      </div>

      {/* Filter and Metrics Bar matching Screenshot 1 */}
      <div className="bg-white rounded-xl border border-slate-200 p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-blue-600" />
          <span className="text-xs font-extrabold text-slate-800 tracking-wider mr-2">FILTER:</span>
          {(["ALL", "ACTIVE", "CLOSED", "FORCE_CLOSED"] as const).map((st) => {
            const isSelected = statusFilter === st;
            return (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-4 py-1 rounded-full text-xs font-bold transition-all ${
                  isSelected
                    ? "bg-blue-600 text-white shadow-sm"
                    : "bg-slate-100 hover:bg-slate-200 text-slate-600"
                }`}
              >
                {st.replace("_", " ")}
              </button>
            );
          })}
        </div>

        <div className="text-xs text-slate-500 font-mono flex items-center space-x-1.5">
          <span>Last synced: {lastRefreshed ? lastRefreshed.toLocaleTimeString([], { hour: "numeric", minute: "2-digit", second: "2-digit", hour12: true }) : "Syncing..."}</span>
          <span className="text-slate-400">(Live</span>
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-slate-400">4s ticker)</span>
        </div>
      </div>

      {/* RFQ Listing Grid */}
      {loading ? (
        <div className="p-16 text-center bg-white rounded-2xl border border-slate-200 shadow-sm">
          <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-600">Loading British Auctions...</p>
        </div>
      ) : rfqs.length === 0 ? (
        <div className="p-16 text-center bg-white rounded-2xl border border-slate-200 shadow-sm">
          <Anchor className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-900">No RFQs Found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            No auctions matching the filter. Create a new British RFQ to begin testing!
          </p>
          <Link
            href="/rfqs/create"
            className="inline-flex items-center space-x-2 mt-4 px-4 py-2 rounded-lg text-xs font-bold bg-blue-600 text-white shadow-sm"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Create First RFQ</span>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {rfqs.map((rfq) => (
            <div
              key={rfq.id}
              className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div>
                {/* Header: Reference ID + Status Badge */}
                <div className="flex items-start justify-between gap-3 mb-2.5">
                  <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded border border-blue-200">
                    {rfq.reference_id}
                  </span>
                  <div>{getStatusBadge(rfq.status)}</div>
                </div>

                {/* Title */}
                <h2 className="text-base font-extrabold text-slate-900 tracking-tight leading-snug mt-2 mb-3">
                  {rfq.title.startsWith("⚡") ? (
                    <span className="flex items-start space-x-1.5">
                      <Zap className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                      <span>{rfq.title.replace("⚡", "").trim()}</span>
                    </span>
                  ) : (
                    rfq.title
                  )}
                </h2>

                {/* British Auction Config Pills */}
                {rfq.is_british_auction && (
                  <div className="flex flex-wrap items-center gap-2 mb-4 text-xs font-medium">
                    <span className="px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                      Window: <strong>{formatHoursOrMins(Number(rfq.trigger_window_minutes))}</strong>
                    </span>
                    <span className="px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                      Extend: <strong>+{formatHoursOrMins(Number(rfq.extension_duration_minutes))}</strong>
                    </span>
                    <span className="px-2.5 py-1 rounded-md bg-purple-50 text-purple-700 border border-purple-200">
                      Trigger: {getTriggerLabel(rfq.extension_trigger_type)}
                    </span>
                  </div>
                )}

                {/* Lowest Quote Display Box */}
                <div className="p-3.5 rounded-xl bg-blue-50/50 border border-blue-100 flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                      <Trophy className="w-4 h-4 text-amber-600 fill-amber-500" />
                    </div>
                    <div>
                      <div className="text-[11px] font-semibold text-slate-500">Current Lowest Bid (L1)</div>
                      <div className="font-bold text-xs text-slate-900">
                        {rfq.lowest_bidder_carrier || "No bids placed yet"}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono font-extrabold text-lg text-slate-900">
                      {rfq.current_lowest_bid != null
                        ? `$${Number(rfq.current_lowest_bid).toLocaleString(undefined, { minimumFractionDigits: 2 })}`
                        : "—"}
                    </div>
                    <div className="text-[11px] text-slate-500">{rfq.total_bids_count} bids</div>
                  </div>
                </div>

                {/* Countdown & Schedule */}
                <div className="space-y-2 text-xs text-slate-600 border-t border-slate-100 pt-3.5">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center space-x-1.5 font-medium text-slate-500">
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

                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-500 font-sans">Dynamic Close:</span>
                    <span className="text-slate-900 font-bold">
                      {new Date(rfq.bid_close_time).toLocaleTimeString([], { hour: "numeric", minute: "2-digit", second: "2-digit", hour12: true })}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-500 font-sans">Forced Close Ceiling:</span>
                    <span className="text-slate-900 font-bold">
                      {new Date(rfq.forced_bid_close_time).toLocaleTimeString([], { hour: "numeric", minute: "2-digit", second: "2-digit", hour12: true })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-end">
                <Link
                  href={`/rfqs/${rfq.id}`}
                  className="inline-flex items-center space-x-1 text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors"
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

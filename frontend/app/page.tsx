"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { getRFQs, RFQItem } from "@/lib/api";
import ShipIllustration from "@/components/ShipIllustration";
import {
  PlusCircle,
  RefreshCw,
  Trophy,
  Clock,
  Lock,
  Zap,
  Filter,
  CheckCircle2,
  Anchor,
  Search,
  ChevronDown,
  MapPin,
  Calendar,
  Shield,
  Plus,
  X
} from "lucide-react";

export default function AuctionListingPage() {
  const [rfqs, setRfqs] = useState<RFQItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadData = useCallback(async (showRefreshIndicator = false) => {
    if (showRefreshIndicator) setIsRefreshing(true);
    try {
      const data = await getRFQs(statusFilter);
      setRfqs(data);
    } catch (err: unknown) {
      console.error("Failed to fetch RFQs:", err);
    } finally {
      setLoading(false);
      if (showRefreshIndicator) {
        setTimeout(() => setIsRefreshing(false), 500);
      }
    }
  }, [statusFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadData();
    }, 0);
    const interval = setInterval(() => loadData(false), 4000);
    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [loadData]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return (
          <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>ACTIVE</span>
          </span>
        );
      case "FORCE_CLOSED":
        return (
          <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800">
            <Lock className="w-3 h-3 text-red-600 dark:text-red-400" />
            <span>FORCE CLOSED</span>
          </span>
        );
      case "CLOSED":
        return (
          <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            <CheckCircle2 className="w-3 h-3 text-slate-500 dark:text-slate-400" />
            <span>CLOSED</span>
          </span>
        );
      case "DRAFT":
        return (
          <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
            <Clock className="w-3 h-3 text-blue-600 dark:text-blue-400" />
            <span>UPCOMING / DRAFT</span>
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            {status}
          </span>
        );
    }
  };

  const getTriggerLabel = (type: string) => {
    switch (type) {
      case "BID_RECEIVED":
        return "Any bid in window";
      case "ANY_RANK_CHANGE":
        return "Any rank change";
      case "L1_RANK_CHANGE":
        return "Lowest bidder (L1)";
      default:
        return type;
    }
  };

  const formatDurationValue = (minutesVal: number) => {
    const val = Number(minutesVal);
    if (isNaN(val)) return "-";
    if (val <= 5) {
      return `${val.toFixed(2)} min`;
    }
    return `${val.toFixed(2)} min`;
  };

  const formatCurrency = (val: number | string | null | undefined) => {
    if (val == null) return "—";
    const num = Number(val);
    if (isNaN(num)) return "—";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(num);
  };

  const formatTime = (timeStr?: string) => {
    if (!timeStr) return "—";
    try {
      const d = new Date(timeStr);
      if (isNaN(d.getTime())) return timeStr;
      return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit", second: "2-digit", hour12: true });
    } catch {
      return timeStr;
    }
  };

  // Helper to parse origin -> destination from route titles
  const parseRoute = (rawTitle: string) => {
    let clean = rawTitle.replace("⚡", "").trim();
    let prefix = "";

    if (clean.includes(":")) {
      const parts = clean.split(":");
      prefix = parts[0].trim();
      clean = parts[1].trim();
    }

    if (clean.toLowerCase().includes(" to ")) {
      const parts = clean.split(/ to /i);
      const origin = parts[0].trim();
      const destAndCargo = parts[1].trim();
      let dest = destAndCargo;
      let cargo = "";

      const words = destAndCargo.split(" ");
      if (words.length > 2) {
        dest = words[0];
        cargo = words.slice(1).join(" ");
      }

      let subtitle = cargo;
      if (prefix && prefix.toLowerCase().includes("demo")) {
        subtitle = cargo ? `${cargo} • ${prefix.toLowerCase()}` : prefix;
      }

      return {
        origin,
        dest,
        subtitle: subtitle || "Standard Freight Shipment",
      };
    }

    return {
      origin: clean,
      dest: "",
      subtitle: prefix || "Freight Shipment",
    };
  };

  const filteredRfqs = useMemo(() => {
    return rfqs.filter((rfq) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        rfq.reference_id.toLowerCase().includes(q) ||
        rfq.title.toLowerCase().includes(q) ||
        (rfq.lowest_bidder_carrier && rfq.lowest_bidder_carrier.toLowerCase().includes(q))
      );
    });
  }, [rfqs, searchQuery]);

  return (
    <div className="space-y-8">
      {/* Hero Banner with SVG Container Ship / Crane illustration */}
      <section
        aria-label="Overview Banner"
        className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-50/60 via-white to-blue-50/40 dark:from-slate-900/95 dark:via-slate-900/90 dark:to-blue-950/40 border border-slate-200/90 dark:border-slate-800 p-8 shadow-xs flex flex-col lg:flex-row items-center justify-between gap-6 transition-colors"
      >
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 text-xs font-semibold mb-3">
            <Zap className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 fill-blue-600 dark:fill-blue-400" />
            <span>GoComet British Auction RFQ Engine</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight mb-3">
            Competitive Freight Procurement with Dynamic British Extensions
          </h1>

          <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed mb-6 max-w-xl">
            Eliminate last-second bid sniping. Auctions automatically extend when competitive
            activity occurs in the trigger window, capped strictly by the hard Forced Close Time
            ceiling.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/rfqs/create"
              className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-lg font-semibold text-sm bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white shadow-xs transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-blue-600"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Create British RFQ</span>
            </Link>
          </div>
        </div>

        {/* Custom Port Crane and Container Ship Illustration */}
        <ShipIllustration />
      </section>

      {/* Section Header with "Live Auctions", Search & Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-2">
        <div className="flex items-start space-x-3">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-600 mt-2 shrink-0 animate-pulse" />
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Live Auctions
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Monitor bids, timing, and auction status in real time
            </p>
          </div>
        </div>

        {/* Controls Bar: Search & Status Filter */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Search Input Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              id="auction-search"
              type="text"
              aria-label="Search auctions by RFQ ID, route, or carrier"
              placeholder="Search by RFQ ID, route or company..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-8 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-blue-500 shadow-2xs w-64 sm:w-72 transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                aria-label="Clear search"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Status Select Dropdown */}
          <div className="relative">
            <label htmlFor="status-filter" className="sr-only">
              Filter auctions by status
            </label>
            <select
              id="status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="appearance-none pl-8 pr-8 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:border-blue-500 shadow-2xs cursor-pointer transition-colors"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="CLOSED">Closed</option>
              <option value="FORCE_CLOSED">Force Closed</option>
            </select>
            <Filter className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Refresh Action Button */}
          <button
            type="button"
            onClick={() => loadData(true)}
            title="Refresh auctions feed"
            aria-label="Refresh auctions feed"
            className="p-2 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 active:scale-[0.98] text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800 rounded-lg shadow-2xs transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-blue-600 flex items-center justify-center"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-blue-600 dark:text-blue-400" : "text-slate-500 dark:text-slate-400"}`} />
          </button>

          {/* + Create RFQ action button */}
          <Link
            href="/rfqs/create"
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white shadow-2xs transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-blue-600"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create RFQ</span>
          </Link>
        </div>
      </div>

      {/* RFQ Listing Grid */}
      {loading && rfqs.length === 0 ? (
        /* Zero Layout Shift Skeletons */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6" aria-busy="true" aria-label="Loading auctions">
          {[1, 2].map((i) => (
            <div key={i} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-xs animate-pulse space-y-4 rounded-2xl">
              <div className="flex justify-between items-center">
                <div className="h-5 w-28 bg-slate-200 dark:bg-slate-800 rounded" />
                <div className="h-5 w-20 bg-slate-200 dark:bg-slate-800 rounded-full" />
              </div>
              <div className="h-6 w-3/4 bg-slate-200 dark:bg-slate-800 rounded" />
              <div className="h-16 w-full bg-slate-100 dark:bg-slate-800/60 rounded-xl" />
              <div className="h-12 w-full bg-slate-100 dark:bg-slate-800/60 rounded-xl" />
              <div className="h-10 w-full bg-slate-200 dark:bg-slate-800 rounded-xl" />
            </div>
          ))}
        </div>
      ) : filteredRfqs.length === 0 ? (
        <div className="p-16 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <Anchor className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">No Auctions Found</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            {searchQuery
              ? `No auctions matching "${searchQuery}". Try clearing your search.`
              : "No auctions matching the selected filter."}
          </p>
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="mt-4 px-4 py-2 rounded-lg text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
            >
              Clear Search
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredRfqs.map((rfq) => {
            const route = parseRoute(rfq.title);
            return (
              <article
                key={rfq.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs hover:shadow-md dark:hover:border-slate-700 transition-all duration-200 hover:-translate-y-0.5 flex flex-col justify-between"
              >
                <div>
                  {/* Top row: Reference ID + Status Badge */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2.5 py-0.5 rounded border border-blue-200 dark:border-blue-800">
                      {rfq.reference_id}
                    </span>
                    <div>{getStatusBadge(rfq.status)}</div>
                  </div>

                  {/* Route with Origin / Destination Icons */}
                  <div className="my-2">
                    <div className="flex items-center space-x-2 flex-wrap">
                      <div className="flex items-center space-x-1.5">
                        <span className="w-3.5 h-3.5 rounded-full border-2 border-blue-600 dark:border-blue-500 flex items-center justify-center shrink-0">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-500" />
                        </span>
                        <span className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                          {route.origin}
                        </span>
                      </div>

                      {route.dest && (
                        <>
                          <span className="text-slate-400 dark:text-slate-500 text-sm font-bold mx-1" aria-hidden="true">→</span>
                          <div className="flex items-center space-x-1">
                            <MapPin className="w-4 h-4 text-blue-600 dark:text-blue-400 fill-blue-600 dark:fill-blue-400 shrink-0" />
                            <span className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                              {route.dest}
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
                      {route.subtitle}
                    </p>
                  </div>

                  {/* Current Lowest Bid (L1) Box */}
                  <div className="p-4 rounded-xl bg-blue-50/50 dark:bg-slate-800/60 border border-blue-100 dark:border-slate-800 flex items-center justify-between my-4">
                    <div className="flex items-center space-x-3.5">
                      <Trophy className="w-7 h-7 text-amber-500 fill-amber-400 shrink-0" />
                      <div>
                        <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                          Current Lowest Bid (L1)
                        </div>
                        <div className="font-extrabold text-sm text-slate-900 dark:text-white mt-0.5">
                          {rfq.lowest_bidder_carrier || "No bids placed yet"}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-black text-xl text-slate-900 dark:text-slate-100">
                        {formatCurrency(rfq.current_lowest_bid)}
                      </div>
                      <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                        {rfq.total_bids_count} {rfq.total_bids_count === 1 ? "bid" : "bids"}
                      </div>
                    </div>
                  </div>

                  {/* 3-Column Configuration Strip (Window, Extension, Trigger) */}
                  <div className="bg-slate-50/70 dark:bg-slate-800/50 rounded-xl p-3 border border-slate-100 dark:border-slate-800 grid grid-cols-3 divide-x divide-slate-200/80 dark:divide-slate-700/80 mb-4">
                    {/* Window Column */}
                    <div className="pr-2">
                      <div className="flex items-center space-x-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                        <Clock className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                        <span>Window</span>
                      </div>
                      <div className="text-xs font-black text-slate-900 dark:text-slate-100 mt-1">
                        {formatDurationValue(Number(rfq.trigger_window_minutes))}
                      </div>
                    </div>

                    {/* Extension Column */}
                    <div className="px-3">
                      <div className="flex items-center space-x-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                        <PlusCircle className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                        <span>Extension</span>
                      </div>
                      <div className="text-xs font-black text-slate-900 dark:text-slate-100 mt-1">
                        +{formatDurationValue(Number(rfq.extension_duration_minutes))}
                      </div>
                    </div>

                    {/* Trigger Column */}
                    <div className="pl-3">
                      <div className="flex items-center space-x-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                        <Zap className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 fill-blue-600 dark:fill-blue-400" />
                        <span>Trigger</span>
                      </div>
                      <div
                        className="text-xs font-black text-slate-900 dark:text-slate-100 mt-1 capitalize truncate"
                        title={getTriggerLabel(rfq.extension_trigger_type)}
                      >
                        {getTriggerLabel(rfq.extension_trigger_type)}
                      </div>
                    </div>
                  </div>

                  {/* Timestamps Row: Dynamic Close & Forced Close Ceiling */}
                  <div className="grid grid-cols-2 gap-4 text-xs text-slate-600 dark:text-slate-400 pt-1">
                    <div>
                      <div className="flex items-center space-x-1.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                        <Calendar className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                        <span>Dynamic Close</span>
                      </div>
                      <div className="font-mono font-extrabold text-xs text-slate-900 dark:text-slate-200 mt-1 pl-5">
                        {formatTime(rfq.bid_close_time)}
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center space-x-1.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                        <Shield className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                        <span>Forced Close Ceiling</span>
                      </div>
                      <div className="font-mono font-extrabold text-xs text-slate-900 dark:text-slate-200 mt-1 pl-5">
                        {formatTime(rfq.forced_bid_close_time)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Wide Bottom Action Button */}
                <Link
                  href={`/rfqs/${rfq.id}`}
                  className="w-full mt-5 py-2.5 px-4 rounded-xl font-bold text-xs bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white shadow-2xs transition-all flex items-center justify-center space-x-1.5 cursor-pointer focus-visible:ring-2 focus-visible:ring-blue-600"
                >
                  <span>View auction details</span>
                  <span aria-hidden="true">→</span>
                </Link>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

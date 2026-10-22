"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getRFQs, RFQItem } from "@/lib/api";
import ShipIllustration from "@/components/ShipIllustration";
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
  Anchor,
  Search,
  ChevronDown,
  MapPin,
  Calendar,
  Shield,
  Plus
} from "lucide-react";

export default function AuctionListingPage() {
  const [rfqs, setRfqs] = useState<RFQItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
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
    if (val <= 5) {
      return `${val.toFixed(2)} min`;
    }
    return `${val.toFixed(2)} hr`;
  };

  // Helper to parse origin -> destination from route titles matching the screenshot
  const parseRoute = (rawTitle: string) => {
    let clean = rawTitle.replace("⚡", "").trim();
    let isDemo = clean.toLowerCase().includes("demo");
    let prefix = "";

    if (clean.includes(":")) {
      const parts = clean.split(":");
      prefix = parts[0].trim();
      clean = parts[1].trim();
    }

    if (clean.toLowerCase().includes(" to ")) {
      const parts = clean.split(/ to /i);
      const origin = parts[0].trim();
      let destAndCargo = parts[1].trim();
      let dest = destAndCargo;
      let cargo = "";

      // Try splitting destination from cargo details
      const words = destAndCargo.split(" ");
      if (words.length > 2) {
        // e.g. "Jakarta Reefer Cargo" -> dest: "Jakarta", cargo: "Reefer Cargo"
        // e.g. "Rotterdam 40ft High Cube Container" -> dest: "Rotterdam", cargo: "40ft High Cube Container"
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

  const filteredRfqs = rfqs.filter((rfq) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      rfq.reference_id.toLowerCase().includes(q) ||
      rfq.title.toLowerCase().includes(q) ||
      (rfq.lowest_bidder_carrier && rfq.lowest_bidder_carrier.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-8">
      {/* Hero Banner with exact SVG Container Ship / Crane illustration */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-50/60 via-white to-blue-50/40 border border-slate-200/90 p-8 shadow-sm flex flex-col lg:flex-row items-center justify-between gap-6">
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

        {/* Custom Port Crane and Container Ship Illustration */}
        <ShipIllustration />
      </div>

      {/* Section Header with "Live Auctions", Search & Filters matching Screenshot */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-2">
        <div className="flex items-start space-x-3">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-600 mt-2 shrink-0 animate-pulse" />
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Live Auctions
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Monitor bids, timing, and auction status in real time
            </p>
          </div>
        </div>

        {/* Search, Status Dropdown, and + Create RFQ button */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by RFQ ID, route or company..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 shadow-xs w-64 sm:w-72"
            />
          </div>

          {/* Status Select Dropdown */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="appearance-none pl-8 pr-8 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:border-blue-500 shadow-xs cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="CLOSED">Closed</option>
              <option value="FORCE_CLOSED">Force Closed</option>
            </select>
            <Filter className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* + Create RFQ action button */}
          <Link
            href="/rfqs/create"
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create RFQ</span>
          </Link>
        </div>
      </div>

      {/* RFQ Listing Grid matching the new Card design */}
      {loading ? (
        <div className="p-16 text-center bg-white rounded-2xl border border-slate-200 shadow-sm">
          <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-600">Loading British Auctions...</p>
        </div>
      ) : filteredRfqs.length === 0 ? (
        <div className="p-16 text-center bg-white rounded-2xl border border-slate-200 shadow-sm">
          <Anchor className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-900">No Auctions Found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            No auctions matching your search or filter.
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
          {filteredRfqs.map((rfq) => {
            const route = parseRoute(rfq.title);
            return (
              <div
                key={rfq.id}
                className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div>
                  {/* Top row: Reference ID + Status Badge */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded border border-blue-200">
                      {rfq.reference_id}
                    </span>
                    <div>{getStatusBadge(rfq.status)}</div>
                  </div>

                  {/* Route with Origin / Destination Icons matching Screenshot */}
                  <div className="my-2">
                    <div className="flex items-center space-x-2 flex-wrap">
                      <div className="flex items-center space-x-1.5">
                        <span className="w-3.5 h-3.5 rounded-full border-2 border-blue-600 flex items-center justify-center shrink-0">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                        </span>
                        <span className="text-lg font-black text-slate-900 tracking-tight">
                          {route.origin}
                        </span>
                      </div>

                      {route.dest && (
                        <>
                          <span className="text-slate-400 text-sm font-bold mx-1">→</span>
                          <div className="flex items-center space-x-1">
                            <MapPin className="w-4 h-4 text-blue-600 fill-blue-600 shrink-0" />
                            <span className="text-lg font-black text-slate-900 tracking-tight">
                              {route.dest}
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 font-medium mt-1">
                      {route.subtitle}
                    </p>
                  </div>

                  {/* Current Lowest Bid (L1) Box matching Screenshot */}
                  <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-100 flex items-center justify-between my-4">
                    <div className="flex items-center space-x-3.5">
                      <Trophy className="w-7 h-7 text-amber-500 fill-amber-400 shrink-0" />
                      <div>
                        <div className="text-[11px] font-semibold text-slate-500">
                          Current Lowest Bid (L1)
                        </div>
                        <div className="font-extrabold text-sm text-slate-900 mt-0.5">
                          {rfq.lowest_bidder_carrier || "No bids placed yet"}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-black text-xl text-slate-900">
                        {rfq.current_lowest_bid != null
                          ? `$${Number(rfq.current_lowest_bid).toLocaleString(undefined, { minimumFractionDigits: 2 })}`
                          : "—"}
                      </div>
                      <div className="text-[11px] font-medium text-slate-500 mt-0.5">
                        {rfq.total_bids_count} {rfq.total_bids_count === 1 ? "bid" : "bids"}
                      </div>
                    </div>
                  </div>

                  {/* 3-Column Configuration Strip (Window, Extension, Trigger) matching Screenshot */}
                  <div className="bg-slate-50/70 rounded-xl p-3 border border-slate-100 grid grid-cols-3 divide-x divide-slate-200/80 mb-4">
                    {/* Window Column */}
                    <div className="pr-2">
                      <div className="flex items-center space-x-1 text-[11px] font-semibold text-slate-500">
                        <Clock className="w-3.5 h-3.5 text-blue-600" />
                        <span>Window</span>
                      </div>
                      <div className="text-xs font-black text-slate-900 mt-1">
                        {formatDurationValue(Number(rfq.trigger_window_minutes))}
                      </div>
                    </div>

                    {/* Extension Column */}
                    <div className="px-3">
                      <div className="flex items-center space-x-1 text-[11px] font-semibold text-slate-500">
                        <PlusCircle className="w-3.5 h-3.5 text-blue-600" />
                        <span>Extension</span>
                      </div>
                      <div className="text-xs font-black text-slate-900 mt-1">
                        +{formatDurationValue(Number(rfq.extension_duration_minutes))}
                      </div>
                    </div>

                    {/* Trigger Column */}
                    <div className="pl-3">
                      <div className="flex items-center space-x-1 text-[11px] font-semibold text-slate-500">
                        <Zap className="w-3.5 h-3.5 text-blue-600 fill-blue-600" />
                        <span>Trigger</span>
                      </div>
                      <div className="text-xs font-black text-slate-900 mt-1 capitalize truncate" title={getTriggerLabel(rfq.extension_trigger_type)}>
                        {getTriggerLabel(rfq.extension_trigger_type)}
                      </div>
                    </div>
                  </div>

                  {/* Timestamps Row: Dynamic Close & Forced Close Ceiling matching Screenshot */}
                  <div className="grid grid-cols-2 gap-4 text-xs text-slate-600 pt-1">
                    <div>
                      <div className="flex items-center space-x-1.5 text-[11px] font-semibold text-slate-500">
                        <Calendar className="w-3.5 h-3.5 text-blue-600" />
                        <span>Dynamic Close</span>
                      </div>
                      <div className="font-mono font-extrabold text-xs text-slate-900 mt-1 pl-5">
                        {new Date(rfq.bid_close_time).toLocaleTimeString([], { hour: "numeric", minute: "2-digit", second: "2-digit", hour12: true })}
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center space-x-1.5 text-[11px] font-semibold text-slate-500">
                        <Shield className="w-3.5 h-3.5 text-blue-600" />
                        <span>Forced Close Ceiling</span>
                      </div>
                      <div className="font-mono font-extrabold text-xs text-slate-900 mt-1 pl-5">
                        {new Date(rfq.forced_bid_close_time).toLocaleTimeString([], { hour: "numeric", minute: "2-digit", second: "2-digit", hour12: true })}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Wide Bottom Action Button matching Screenshot */}
                <Link
                  href={`/rfqs/${rfq.id}`}
                  className="w-full mt-5 py-2.5 px-4 rounded-xl font-bold text-xs bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors flex items-center justify-center space-x-1.5"
                >
                  <span>View auction details</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

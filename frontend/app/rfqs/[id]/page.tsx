"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  getRFQDetails,
  getBids,
  getActivityLogs,
  submitQuote,
  RFQItem,
  BidItem,
  ActivityLogItem,
  BidSubmissionResult
} from "@/lib/api";
import {
  ArrowLeft,
  Clock,
  Shield,
  Trophy,
  Crown,
  Calendar,
  Edit,
  User,
  Ship,
  MapPin,
  SlidersHorizontal,
  Lock,
  CheckCircle2,
  Gavel,
  Zap,
  FileText,
  ChevronRight,
  AlertCircle,
  Send,
  Anchor,
  PlayCircle
} from "lucide-react";

export default function AuctionDetailsPage() {
  const params = useParams();
  const rfqId = params.id as string;

  const [rfq, setRfq] = useState<RFQItem | null>(null);
  const [bids, setBids] = useState<BidItem[]>([]);
  const [logs, setLogs] = useState<ActivityLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form State for Submit Carrier Quote
  const [carrierName, setCarrierName] = useState("");
  const [freightCharges, setFreightCharges] = useState("");
  const [originCharges, setOriginCharges] = useState("");
  const [destinationCharges, setDestinationCharges] = useState("");
  const [transitTimeDays, setTransitTimeDays] = useState("");
  const [quoteValidity, setQuoteValidity] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [lastSubmissionResult, setLastSubmissionResult] = useState<BidSubmissionResult | null>(null);

  const loadAllData = useCallback(async () => {
    try {
      const [rfqData, bidsData, logsData] = await Promise.all([
        getRFQDetails(rfqId),
        getBids(rfqId),
        getActivityLogs(rfqId),
      ]);
      setRfq(rfqData);
      setBids(bidsData);
      setLogs(logsData);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load auction room data");
    } finally {
      setLoading(false);
    }
  }, [rfqId]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadAllData();
    }, 0);
    const interval = setInterval(loadAllData, 3000);
    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [loadAllData]);

  // Format Helpers
  const formatTime = (isoString?: string | null) => {
    if (!isoString) return "—";
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return String(isoString);
      return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit", hour12: true });
    } catch {
      return String(isoString);
    }
  };

  const formatDate = (isoString?: string | null) => {
    if (!isoString) return "—";
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return String(isoString);
      return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
    } catch {
      return String(isoString);
    }
  };

  const formatCurrency = (num: number | string | null | undefined) => {
    if (num == null) return "—";
    const val = Number(num);
    if (isNaN(val)) return "—";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(val);
  };

  // Preset Handlers
  const applyPreset = (preset: {
    carrier: string;
    freight: string;
    origin: string;
    dest: string;
    transit: string;
    validity: string;
  }) => {
    setCarrierName(preset.carrier);
    setFreightCharges(preset.freight);
    setOriginCharges(preset.origin);
    setDestinationCharges(preset.dest);
    setTransitTimeDays(preset.transit);
    setQuoteValidity(preset.validity);
  };

  const computedTotal = useMemo(() => {
    return (
      (parseFloat(freightCharges) || 0) +
      (parseFloat(originCharges) || 0) +
      (parseFloat(destinationCharges) || 0)
    );
  }, [freightCharges, originCharges, destinationCharges]);

  const handleSubmitQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rfq || rfq.status !== "ACTIVE") return;
    setSubmitError(null);
    setLastSubmissionResult(null);

    if (!carrierName.trim()) {
      setSubmitError("Please enter a Carrier / Supplier Name.");
      return;
    }
    if (computedTotal <= 0) {
      setSubmitError("Total quote amount must be greater than $0.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await submitQuote(rfqId, {
        carrier_name: carrierName.trim(),
        freight_charges: parseFloat(freightCharges) || 0,
        origin_charges: parseFloat(originCharges) || 0,
        destination_charges: parseFloat(destinationCharges) || 0,
        transit_time_days: parseInt(transitTimeDays, 10) || 1,
        quote_validity: quoteValidity || new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0],
      });
      setLastSubmissionResult(res);
      await loadAllData();
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : "Failed to submit quote");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && !rfq) {
    return (
      <div className="p-20 text-center bg-white rounded-2xl border border-slate-200 shadow-xs">
        <Clock className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-3" />
        <p className="text-sm font-semibold text-slate-600">Connecting to Live Auction Room...</p>
      </div>
    );
  }

  if (error || !rfq) {
    return (
      <div role="alert" className="p-12 text-center bg-white rounded-2xl border border-slate-200 shadow-xs">
        <h3 className="text-base font-bold text-red-600">Error Loading Auction</h3>
        <p className="text-xs text-slate-500 mt-1">{error || "RFQ not found"}</p>
        <Link
          href="/"
          className="inline-flex items-center space-x-2 mt-4 px-4 py-2 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white shadow-xs focus-visible:ring-2 focus-visible:ring-blue-600"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Auctions</span>
        </Link>
      </div>
    );
  }

  const isForceClosed = rfq.status === "FORCE_CLOSED";
  const isActive = rfq.status === "ACTIVE";

  // Calculate total extension minutes added
  const originalCloseMs = new Date(rfq.original_bid_close_time).getTime();
  const currentCloseMs = new Date(rfq.bid_close_time).getTime();
  const totalExtensionMinutes = Math.max(
    0,
    Math.round((currentCloseMs - originalCloseMs) / (60 * 1000))
  );

  return (
    <div className="w-full space-y-6">
      {/* ----------------- Top Header Bar ----------------- */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors focus-visible:ring-2 focus-visible:ring-blue-600 rounded"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Auctions</span>
          </Link>

          {/* Top Right Status Badge matching Screenshot */}
          {isForceClosed ? (
            <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 shadow-2xs">
              <span className="w-4 h-4 rounded-full bg-red-600 text-white flex items-center justify-center text-[10px] font-black leading-none">
                +
              </span>
              <span>FORCE CLOSED — Hard Stop Reached</span>
            </span>
          ) : isActive ? (
            <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>ACTIVE AUCTION — Live Bidding</span>
            </span>
          ) : (
            <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-slate-400" />
              <span>AUCTION CLOSED</span>
            </span>
          )}
        </div>

        {/* Title */}
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          {rfq.title}
        </h1>

        {/* Subheader Metadata Row with Vertical Dividers */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
          <span className="font-mono text-slate-700 dark:text-slate-300">RFQ ID: {rfq.reference_id}</span>
          <span className="text-slate-300 dark:text-slate-700" aria-hidden="true">|</span>
          <span>Pickup: <strong className="text-slate-800 dark:text-slate-200 font-semibold">{formatDate(rfq.pickup_date)}</strong></span>
          <span className="text-slate-300 dark:text-slate-700" aria-hidden="true">|</span>
          <span>
            Extension Added:{" "}
            <strong className="text-slate-800 dark:text-slate-200 font-semibold">
              +{totalExtensionMinutes.toFixed(2)} mins
            </strong>
          </span>
          <span className="text-slate-300 dark:text-slate-700" aria-hidden="true">|</span>
          <span>
            Original Close:{" "}
            <strong className="text-slate-800 dark:text-slate-200 font-semibold">{formatTime(rfq.original_bid_close_time)}</strong>
          </span>
          <span className="text-slate-300 dark:text-slate-700" aria-hidden="true">|</span>
          <span>
            Forced Close Ceiling:{" "}
            <strong className="text-red-600 dark:text-red-400 font-bold">{formatTime(rfq.forced_bid_close_time)}</strong>
          </span>
        </div>
      </div>

      {/* ----------------- 4-Column Metric Strip matching Screenshot ----------------- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Trigger Window */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-100 dark:border-blue-900/60 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <span className="block text-xs text-slate-500 dark:text-slate-400 font-medium">Trigger Window</span>
            <span className="text-sm font-bold text-slate-900 dark:text-white">
              {Number(rfq.trigger_window_minutes).toFixed(2)} mins
            </span>
          </div>
        </div>

        {/* Metric 2: Extension Added */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-100 dark:border-blue-900/60 flex items-center justify-center shrink-0">
            <Zap className="w-5 h-5 text-blue-600 dark:text-blue-400 fill-blue-500 dark:fill-blue-400" />
          </div>
          <div>
            <span className="block text-xs text-slate-500 dark:text-slate-400 font-medium">Extension Added</span>
            <span className="text-sm font-bold text-slate-900 dark:text-white">
              +{totalExtensionMinutes.toFixed(2)} mins
            </span>
          </div>
        </div>

        {/* Metric 3: Original Close */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-100 dark:border-blue-900/60 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <span className="block text-xs text-slate-500 dark:text-slate-400 font-medium">Original Close</span>
            <span className="text-sm font-bold text-slate-900 dark:text-white">
              {formatTime(rfq.original_bid_close_time)}
            </span>
          </div>
        </div>

        {/* Metric 4: Forced Close Ceiling */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-100 dark:border-blue-900/60 flex items-center justify-center shrink-0">
            <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <span className="block text-xs text-slate-500 dark:text-slate-400 font-medium">Forced Close Ceiling</span>
            <span className="text-sm font-bold text-slate-900 dark:text-white">
              {formatTime(rfq.forced_bid_close_time)}
            </span>
          </div>
        </div>
      </div>

      {/* ----------------- Full-Width Card: Supplier Quote Leaderboard ----------------- */}
      <section aria-label="Supplier Quote Leaderboard" className="w-full bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-start space-x-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-extrabold text-sm text-slate-900 dark:text-white">
                Supplier Quote Leaderboard
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Quotes reflect lowest total price first. Earlier timestamps break price ties.
              </p>
            </div>
          </div>

          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
            {bids.length} {bids.length === 1 ? "Bid" : "Bids"} Received
          </span>
        </div>

        {/* Leaderboard Table (Spans full page width, no scrollbar needed) */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 text-[11px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider">
                <th scope="col" className="py-3 px-6">RANK</th>
                <th scope="col" className="py-3 px-5">CARRIER / SUPPLIER</th>
                <th scope="col" className="py-3 px-5">FREIGHT SUPPLIES</th>
                <th scope="col" className="py-3 px-5">ORIGIN / DEST</th>
                <th scope="col" className="py-3 px-5">TOTAL QUOTE</th>
                <th scope="col" className="py-3 px-5">TRANSIT</th>
                <th scope="col" className="py-3 px-6">VALIDITY</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {bids.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400 font-medium">
                    No carrier quotes received yet. Submit a quote below to set L1.
                  </td>
                </tr>
              ) : (
                bids.map((bid, index) => {
                  const rank = bid.current_rank ?? index + 1;
                  const isL1 = rank === 1;

                  return (
                    <tr
                      key={bid.id}
                      className={`transition-colors ${
                        isL1
                          ? "bg-emerald-50/25 dark:bg-emerald-950/25 hover:bg-emerald-50/40 dark:hover:bg-emerald-950/40"
                          : "hover:bg-slate-50/60 dark:hover:bg-slate-800/60"
                      }`}
                    >
                      {/* Rank Column */}
                      <td className="py-3.5 px-6 whitespace-nowrap">
                        {isL1 ? (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-md text-xs font-black bg-emerald-100/80 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
                            <Crown className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                            <span>L1</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                            L{rank}
                          </span>
                        )}
                      </td>

                      {/* Carrier Column */}
                      <td className="py-3.5 px-5 font-bold text-slate-900 dark:text-white whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <span>{bid.carrier_name}</span>
                          {isL1 && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                              Current Winner
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Freight Charges */}
                      <td className="py-3.5 px-5 text-slate-700 dark:text-slate-300 font-medium whitespace-nowrap">
                        {formatCurrency(bid.freight_charges)}
                      </td>

                      {/* Origin / Dest */}
                      <td className="py-3.5 px-5 text-slate-500 dark:text-slate-400 font-medium whitespace-nowrap">
                        {formatCurrency(bid.origin_charges)} /{" "}
                        {formatCurrency(bid.destination_charges)}
                      </td>

                      {/* Total Quote */}
                      <td className="py-3.5 px-5 whitespace-nowrap">
                        <span
                          className={`text-sm font-extrabold ${
                            isL1 ? "text-emerald-600 dark:text-emerald-400" : "text-slate-900 dark:text-white"
                          }`}
                        >
                          {formatCurrency(bid.total_amount)}
                        </span>
                      </td>

                      {/* Transit Days */}
                      <td className="py-3.5 px-5 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                        <span className="inline-flex items-center space-x-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>{bid.transit_time_days} days</span>
                        </span>
                      </td>

                      {/* Validity Date */}
                      <td className="py-3.5 px-6 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                        <span className="inline-flex items-center space-x-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{formatDate(bid.quote_validity)}</span>
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* ----------------- 2-Column Section Below Full-Width Leaderboard ----------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (7 cols): Submit Carrier Quote */}
        <div className="lg:col-span-7 space-y-6">
          {/* Card 2: Submit Carrier Quote */}
          <section aria-label="Submit Carrier Quote Form" className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-5">
            {/* Header */}
            <div className="flex items-start space-x-3">
              <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                <Edit className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                  Submit Carrier Quote
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Submit a competitive bid to compete for the lowest (L1) rank.
                </p>
              </div>
            </div>

            {/* Quick Quote Presets (Total Quote) matching Screenshot */}
            <div className="p-4 rounded-xl bg-slate-50/70 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 space-y-3">
              <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-700 dark:text-slate-200">
                <Zap className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 fill-blue-600 dark:fill-blue-400" />
                <span>Quick Quote Presets (Total Quote)</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {/* Preset 1: Maersk */}
                <button
                  type="button"
                  disabled={isForceClosed}
                  title="Apply Maersk Line quotation preset ($2,150.00)"
                  onClick={() =>
                    applyPreset({
                      carrier: "Maersk Line",
                      freight: "1600.00",
                      origin: "250.00",
                      dest: "300.00",
                      transit: "24",
                      validity: "2025-05-12",
                    })
                  }
                  className="p-2.5 rounded-xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50/40 dark:bg-emerald-950/40 hover:bg-emerald-50/70 dark:hover:bg-emerald-950/60 active:scale-[0.98] text-left transition-all cursor-pointer disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-emerald-500"
                >
                  <div className="flex items-center space-x-1.5 text-[11px] font-bold text-slate-800 dark:text-slate-200">
                    <Crown className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 fill-emerald-500 dark:fill-emerald-400" />
                    <span>Maersk</span>
                  </div>
                  <div className="text-xs font-extrabold text-emerald-700 dark:text-emerald-400 mt-0.5">$2,150.00</div>
                </button>

                {/* Preset 2: MSC */}
                <button
                  type="button"
                  disabled={isForceClosed}
                  title="Apply MSC quotation preset ($2,300.00)"
                  onClick={() =>
                    applyPreset({
                      carrier: "MSC Mediterranean Shipping",
                      freight: "1750.00",
                      origin: "250.00",
                      dest: "300.00",
                      transit: "26",
                      validity: "2025-05-14",
                    })
                  }
                  className="p-2.5 rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50/40 dark:bg-blue-950/40 hover:bg-blue-50/70 dark:hover:bg-blue-950/60 active:scale-[0.98] text-left transition-all cursor-pointer disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-blue-500"
                >
                  <div className="flex items-center space-x-1.5 text-[11px] font-bold text-slate-800 dark:text-slate-200">
                    <Ship className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    <span>MSC</span>
                  </div>
                  <div className="text-xs font-extrabold text-blue-800 dark:text-blue-300 mt-0.5">$2,300.00</div>
                </button>

                {/* Preset 3: Hapag-Lloyd */}
                <button
                  type="button"
                  disabled={isForceClosed}
                  title="Apply Hapag-Lloyd quotation preset ($2,450.00)"
                  onClick={() =>
                    applyPreset({
                      carrier: "Hapag-Lloyd",
                      freight: "1850.00",
                      origin: "275.00",
                      dest: "325.00",
                      transit: "25",
                      validity: "2025-05-16",
                    })
                  }
                  className="p-2.5 rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50/40 dark:bg-blue-950/40 hover:bg-blue-50/70 dark:hover:bg-blue-950/60 active:scale-[0.98] text-left transition-all cursor-pointer disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-blue-500"
                >
                  <div className="flex items-center space-x-1.5 text-[11px] font-bold text-slate-800 dark:text-slate-200">
                    <Anchor className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    <span>Hapag-Lloyd</span>
                  </div>
                  <div className="text-xs font-extrabold text-blue-800 dark:text-blue-300 mt-0.5">$2,450.00</div>
                </button>

                {/* Preset 4: CMA CGM (aggressive) */}
                <button
                  type="button"
                  disabled={isForceClosed}
                  title="Apply aggressive CMA CGM quotation preset ($1,950.00)"
                  onClick={() =>
                    applyPreset({
                      carrier: "CMA CGM",
                      freight: "1500.00",
                      origin: "220.00",
                      dest: "230.00",
                      transit: "22",
                      validity: "2025-05-10",
                    })
                  }
                  className="p-2.5 rounded-xl border border-amber-300 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/40 hover:bg-amber-100/60 dark:hover:bg-amber-950/60 active:scale-[0.98] text-left transition-all cursor-pointer disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-amber-500"
                >
                  <div className="flex items-center space-x-1.5 text-[11px] font-bold text-slate-800 dark:text-slate-200">
                    <Trophy className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                    <span>CMA CGM</span>
                  </div>
                  <div className="text-xs font-extrabold text-amber-800 dark:text-amber-400 mt-0.5">
                    $1,950.00 <span className="text-[10px] font-normal text-amber-700 dark:text-amber-500">(aggressive)</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Error or Success Alerts */}
            {submitError && (
              <div role="alert" className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-xs flex items-center space-x-2.5">
                <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
                <span>{submitError}</span>
              </div>
            )}

            {lastSubmissionResult && (
              <div role="status" className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs flex items-start space-x-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">
                    Bid Placed! Rank: L{lastSubmissionResult.bid?.current_rank || lastSubmissionResult.bid?.rank_at_submission || 1}
                  </span>
                  {lastSubmissionResult.extended && (
                    <span className="block text-emerald-700 dark:text-emerald-300 mt-0.5">
                      ⚡ Dynamic Extension Triggered! New close time:{" "}
                      {formatTime(lastSubmissionResult.new_bid_close_time)}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Form Inputs matching Screenshot */}
            <form onSubmit={handleSubmitQuote} className="space-y-4">
              {/* Carrier / Supplier Name */}
              <div>
                <label htmlFor="quote-carrier" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Carrier / Supplier Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="quote-carrier"
                    type="text"
                    required
                    disabled={isForceClosed}
                    value={carrierName}
                    onChange={(e) => setCarrierName(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500 shadow-2xs disabled:bg-slate-50 dark:disabled:bg-slate-800/60 disabled:text-slate-400 dark:disabled:text-slate-600 transition-colors"
                    placeholder="Enter carrier or supplier name"
                  />
                </div>
              </div>

              {/* 3-Column Cost Inputs */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                {/* Freight Charges */}
                <div>
                  <label htmlFor="quote-freight" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Freight Charges ($)
                  </label>
                  <div className="relative">
                    <Ship className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="quote-freight"
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      disabled={isForceClosed}
                      value={freightCharges}
                      onChange={(e) => setFreightCharges(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500 shadow-2xs font-mono disabled:bg-slate-50 dark:disabled:bg-slate-800/60 disabled:text-slate-400 dark:disabled:text-slate-600 transition-colors"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                {/* Origin Charges */}
                <div>
                  <label htmlFor="quote-origin" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Origin Charges ($)
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="quote-origin"
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      disabled={isForceClosed}
                      value={originCharges}
                      onChange={(e) => setOriginCharges(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500 shadow-2xs font-mono disabled:bg-slate-50 dark:disabled:bg-slate-800/60 disabled:text-slate-400 dark:disabled:text-slate-600 transition-colors"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                {/* Destination Charges */}
                <div>
                  <label htmlFor="quote-dest" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Destination Charges ($)
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="quote-dest"
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      disabled={isForceClosed}
                      value={destinationCharges}
                      onChange={(e) => setDestinationCharges(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500 shadow-2xs font-mono disabled:bg-slate-50 dark:disabled:bg-slate-800/60 disabled:text-slate-400 dark:disabled:text-slate-600 transition-colors"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>

              {/* 2-Column: Transit Time & Quote Validity */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <div>
                  <label htmlFor="quote-transit" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Transit Time (Days)
                  </label>
                  <div className="relative">
                    <Clock className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="quote-transit"
                      type="number"
                      min="1"
                      required
                      disabled={isForceClosed}
                      value={transitTimeDays}
                      onChange={(e) => setTransitTimeDays(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500 shadow-2xs disabled:bg-slate-50 dark:disabled:bg-slate-800/60 disabled:text-slate-400 dark:disabled:text-slate-600 transition-colors"
                      placeholder="0"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="quote-validity" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Quote Validity Date
                  </label>
                  <div className="relative">
                    <input
                      id="quote-validity"
                      type="date"
                      required
                      disabled={isForceClosed}
                      value={quoteValidity}
                      onChange={(e) => setQuoteValidity(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500 shadow-2xs disabled:bg-slate-50 dark:disabled:bg-slate-800/60 disabled:text-slate-400 dark:disabled:text-slate-600 transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* Computed Total Quote Banner matching Screenshot */}
              <div className="p-3.5 rounded-xl bg-blue-50/50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/60 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Computed Total Quote:
                </span>
                <span className="text-xl font-black text-blue-600 dark:text-blue-400 font-mono">
                  {formatCurrency(computedTotal)}
                </span>
              </div>

              {/* Action Button */}
              {isForceClosed ? (
                <button
                  type="button"
                  disabled
                  className="w-full py-3 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs font-bold flex items-center justify-center space-x-2 cursor-not-allowed border border-slate-300/80 dark:border-slate-700/80"
                >
                  <Lock className="w-4 h-4" />
                  <span>Bidding unavailable — auction force closed</span>
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white text-xs font-bold flex items-center justify-center space-x-2 transition-all shadow-sm disabled:opacity-50 cursor-pointer focus-visible:ring-2 focus-visible:ring-blue-600"
                >
                  <Send className="w-4 h-4" />
                  <span>{submitting ? "Submitting Quote..." : "Submit Carrier Quote"}</span>
                </button>
              )}
            </form>
          </section>
        </div>

        {/* Right Column (5 cols): Activity Log & Auction Summary */}
        <div className="lg:col-span-5 space-y-6">
          {/* Card 1: Auction Activity & Extension Log */}
          <section aria-label="Auction Activity Log" className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-5">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3">
                <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                    Auction Activity & Extension Log
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Track all events and dynamic extensions for this auction.
                  </p>
                </div>
              </div>

              <div className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[11px] font-bold text-slate-700 dark:text-slate-300 shadow-2xs">
                <SlidersHorizontal className="w-3 h-3 text-slate-500 dark:text-slate-400" />
                <span>Events</span>
              </div>
            </div>

            {/* Vertical Timeline matching Screenshot */}
            <div className="relative pl-6 space-y-6 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
              {logs.length === 0 ? (
                <div className="text-xs text-slate-400 py-6 text-center">
                  No activity events recorded yet.
                </div>
              ) : (
                logs.slice(0, 10).map((log) => {
                  const isClosed =
                    log.event_type === "AUCTION_FORCE_CLOSED" ||
                    log.event_type === "AUCTION_CLOSED";
                  const isExtended = log.event_type === "AUCTION_EXTENDED";
                  const isBid = log.event_type === "BID_SUBMITTED";
                  const isStarted = log.event_type === "AUCTION_STARTED";

                  let badgeText = "EVENT";
                  let badgeBg = "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700";
                  let iconBg = "bg-blue-600 text-white";

                  if (isClosed) {
                    badgeText = "AUCTION CLOSED";
                    badgeBg = "bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800";
                    iconBg = "bg-blue-500 text-white";
                  } else if (isExtended) {
                    badgeText = "EXTENSION ADDED";
                    badgeBg = "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800";
                    iconBg = "bg-emerald-500 text-white";
                  } else if (isBid) {
                    badgeText = "BID PLACED";
                    badgeBg = "bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800";
                    iconBg = "bg-blue-600 text-white";
                  } else if (isStarted) {
                    badgeText = "AUCTION STARTED";
                    badgeBg = "bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800";
                    iconBg = "bg-blue-600 text-white";
                  } else {
                    badgeText = "RFQ CREATED";
                    badgeBg = "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700";
                    iconBg = "bg-slate-400 text-white";
                  }

                  return (
                    <div key={log.id} className="relative group">
                      {/* Timeline Dot Icon */}
                      <div
                        className={`absolute -left-[30px] top-0.5 w-6 h-6 rounded-full flex items-center justify-center shadow-xs ring-4 ring-white dark:ring-slate-900 ${iconBg}`}
                      >
                        {isClosed ? (
                          <Gavel className="w-3 h-3" />
                        ) : isExtended ? (
                          <Zap className="w-3 h-3 fill-white" />
                        ) : isBid ? (
                          <Ship className="w-3 h-3" />
                        ) : isStarted ? (
                          <PlayCircle className="w-3 h-3" />
                        ) : (
                          <FileText className="w-3 h-3" />
                        )}
                      </div>

                      {/* Header row with Badge and Time */}
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <span
                          className={`font-black text-[10px] tracking-wider uppercase px-2 py-0.5 rounded ${badgeBg}`}
                        >
                          {badgeText}
                        </span>
                        <span className="text-slate-400 dark:text-slate-500 font-mono text-[11px]">
                          {formatTime(log.created_at)}
                        </span>
                      </div>

                      {/* Event Title & Details */}
                      <div>
                        {isExtended && (
                          <h4 className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                            +{rfq.extension_duration_minutes} mins Extension
                          </h4>
                        )}
                        {isClosed && (
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                            Force Closed (Hard Stop Reached)
                          </h4>
                        )}
                        <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-snug mt-0.5">
                          {log.description ||
                            (isExtended
                              ? `Auction automatically extended by ${rfq.extension_duration_minutes} minutes due to last minute activity.`
                              : isClosed
                              ? `Auction was force closed as the hard stop time (${formatTime(
                                  rfq.forced_bid_close_time
                                )}) was reached. No further bids are accepted.`
                              : "Auction event recorded.")}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>

          {/* Card 2: Auction Summary matching Screenshot */}
          <section aria-label="Auction Summary" className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-xs font-bold text-slate-900 dark:text-white">
                <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <h3 className="text-sm font-bold">Auction Summary</h3>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </div>

            {/* 2-Column Info Grid */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-4 text-xs">
              {/* Left Column */}
              <div className="space-y-3">
                <div>
                  <span className="text-[11px] text-slate-400 block mb-0.5">Route</span>
                  <span className="font-semibold text-slate-900 dark:text-white block truncate" title={rfq.title}>
                    {rfq.title}
                  </span>
                </div>

                <div>
                  <span className="text-[11px] text-slate-400 block mb-0.5">Pickup Date</span>
                  <div className="flex items-center space-x-1 font-semibold text-slate-800 dark:text-slate-200">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>{formatDate(rfq.pickup_date)}</span>
                  </div>
                </div>

                <div>
                  <span className="text-[11px] text-slate-400 block mb-0.5">Original Close</span>
                  <div className="flex items-center space-x-1 font-semibold text-slate-800 dark:text-slate-200">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{formatTime(rfq.original_bid_close_time)}</span>
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-3">
                <div>
                  <span className="text-[11px] text-slate-400 block mb-0.5">Freight Window</span>
                  <div className="flex items-center space-x-1 font-semibold text-slate-800 dark:text-slate-200">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{Number(rfq.trigger_window_minutes).toFixed(2)} mins</span>
                  </div>
                </div>

                <div>
                  <span className="text-[11px] text-slate-400 block mb-0.5">Extension Added</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                    +{totalExtensionMinutes.toFixed(2)} mins
                  </span>
                </div>

                <div>
                  <span className="text-[11px] text-slate-400 block mb-0.5">Forced Close Ceiling</span>
                  <div className="flex items-center space-x-1 font-bold text-red-600 dark:text-red-400">
                    <Shield className="w-3.5 h-3.5 text-red-500" />
                    <span>{formatTime(rfq.forced_bid_close_time)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Callout Box */}
            <div className="p-3.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/60 flex items-start space-x-2.5">
              <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5 fill-blue-600 dark:fill-blue-500 text-white" />
              <div>
                <h4 className="text-xs font-bold text-blue-900 dark:text-blue-300">Hard Ceiling Enforced</h4>
                <p className="text-[11px] text-blue-700/90 dark:text-blue-300/80 mt-0.5 leading-snug">
                  The auction will automatically close at the forced close time, even if bids are still coming in.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

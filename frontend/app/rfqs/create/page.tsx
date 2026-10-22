"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createRFQ } from "@/lib/api";
import {
  ShieldCheck,
  Calendar,
  AlertCircle,
  HelpCircle,
  CheckCircle2,
  Users,
  BarChart2,
  Award,
  FileText,
  Settings,
  Send,
} from "lucide-react";

export default function CreateRFQPage() {
  const router = useRouter();

  const formatDisplayDate = (dStr: string) => {
    if (!dStr) return "—";
    try {
      const d = new Date(dStr);
      if (isNaN(d.getTime())) return dStr;
      return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
    } catch {
      return dStr;
    }
  };

  const formatDisplayDateTime = (dtStr: string) => {
    if (!dtStr) return "—";
    try {
      const d = new Date(dtStr);
      if (isNaN(d.getTime())) return dtStr;
      return d.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    } catch {
      return dtStr;
    }
  };

  const [referenceId, setReferenceId] = useState("");
  const [title, setTitle] = useState("");
  const [pickupDate, setPickupDate] = useState("");
  const [bidStartTime, setBidStartTime] = useState("");
  const [bidCloseTime, setBidCloseTime] = useState("");
  const [forcedBidCloseTime, setForcedBidCloseTime] = useState("");

  const [isBritishAuction, setIsBritishAuction] = useState(true);
  const [triggerWindowMinutes, setTriggerWindowMinutes] = useState("");
  const [extensionDurationMinutes, setExtensionDurationMinutes] = useState("");
  const [extensionTriggerType, setExtensionTriggerType] = useState<
    "BID_RECEIVED" | "ANY_RANK_CHANGE" | "L1_RANK_CHANGE"
  >("BID_RECEIVED");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!referenceId.trim()) {
      setError("Please provide an RFQ Reference ID.");
      return;
    }
    if (!title.trim()) {
      setError("Please provide an RFQ Title / Route description.");
      return;
    }
    if (!pickupDate) {
      setError("Please select a Pickup / Service Date.");
      return;
    }
    if (!bidStartTime) {
      setError("Please provide a Bid Start Date & Time.");
      return;
    }
    if (!bidCloseTime) {
      setError("Please provide a Bid Close Date & Time.");
      return;
    }
    if (!forcedBidCloseTime) {
      setError("Please provide a Forced Close Date & Time.");
      return;
    }

    const startDate = new Date(bidStartTime);
    const closeDate = new Date(bidCloseTime);
    const forcedDate = new Date(forcedBidCloseTime);

    if (closeDate <= startDate) {
      setError("Validation Error: Bid Close Time must be strictly later than Bid Start Time.");
      return;
    }
    if (forcedDate < closeDate) {
      setError("Validation Error: Forced Bid Close Time must be greater than or equal to Bid Close Time.");
      return;
    }
    if (isBritishAuction) {
      const tw = parseFloat(triggerWindowMinutes);
      const ed = parseFloat(extensionDurationMinutes);
      if (isNaN(tw) || tw <= 0 || isNaN(ed) || ed <= 0) {
        setError("Validation Error: Trigger Window and Extension Duration must be positive numbers.");
        return;
      }
    }

    setLoading(true);
    try {
      const created = await createRFQ({
        reference_id: referenceId.trim(),
        title: title.trim(),
        pickup_date: new Date(pickupDate).toISOString(),
        bid_start_time: startDate.toISOString(),
        bid_close_time: closeDate.toISOString(),
        forced_bid_close_time: forcedDate.toISOString(),
        is_british_auction: isBritishAuction,
        trigger_window_minutes: isBritishAuction ? parseFloat(triggerWindowMinutes) : 0,
        extension_duration_minutes: isBritishAuction ? parseFloat(extensionDurationMinutes) : 0,
        extension_trigger_type: extensionTriggerType,
      });

      router.push(`/rfqs/${created.id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create RFQ");
      setLoading(false);
    }
  };

  const getTriggerLabel = (type: string) => {
    switch (type) {
      case "BID_RECEIVED":
        return "Any bid in last X seconds";
      case "ANY_RANK_CHANGE":
        return "Bid price change";
      case "L1_RANK_CHANGE":
        return "Lowest bidder is in change";
      default:
        return type;
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Top Breadcrumb & Page Heading matching Screenshot */}
      <div>
        <nav aria-label="Breadcrumb" className="flex items-center space-x-1.5 text-xs text-slate-500 dark:text-slate-400 mb-1.5 font-medium">
          <Link href="/" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors focus-visible:ring-2 focus-visible:ring-blue-600 rounded">
            Auctions
          </Link>
          <span aria-hidden="true">/</span>
          <span className="text-slate-800 dark:text-slate-200" aria-current="page">Create RFQ</span>
        </nav>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Create freight RFQ
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          Configure your freight requirements, set the auction schedule, and define British auction rules.
        </p>
      </div>

      {error && (
        <div role="alert" className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-300 text-xs flex items-center space-x-3">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main 2-Column Grid matching Screenshot */}
      <form onSubmit={handleSubmit} noValidate>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column (Cards 1, 2, 3) */}
          <div className="lg:col-span-8 space-y-6">
            {/* Card 1: RFQ details */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs">
              <div className="flex items-center space-x-3 mb-5">
                <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                  1
                </span>
                <div>
                  <h2 className="font-extrabold text-sm text-slate-900 dark:text-white inline mr-2">RFQ details</h2>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    Provide the key details for your freight request.
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Reference ID */}
                <div>
                  <label htmlFor="ref-id" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    <span>Reference ID</span>
                    <span
                      title="Unique identifier code for tracking this procurement request"
                      className="cursor-help inline-flex items-center ml-1"
                    >
                      <HelpCircle className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                    </span>
                  </label>
                  <input
                    id="ref-id"
                    type="text"
                    required
                    value={referenceId}
                    onChange={(e) => setReferenceId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-white dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono text-xs focus:outline-none focus:border-blue-500 shadow-2xs transition-colors"
                    placeholder="e.g., RFQ-2025-0174"
                  />
                </div>

                {/* RFQ Title / Route */}
                <div>
                  <label htmlFor="rfq-title" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    RFQ Title / Route
                  </label>
                  <input
                    id="rfq-title"
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-white dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500 shadow-2xs transition-colors"
                    placeholder="New Delhi → Mumbai (NH48)"
                  />
                </div>

                {/* Pickup / Service Date */}
                <div>
                  <label htmlFor="pickup-date" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Pickup / Service Date
                  </label>
                  <div className="relative">
                    <input
                      id="pickup-date"
                      type="date"
                      required
                      value={pickupDate}
                      onChange={(e) => setPickupDate(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-lg bg-white dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500 shadow-2xs transition-colors"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2: Auction schedule */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs">
              <div className="flex items-center space-x-3 mb-5">
                <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                  2
                </span>
                <div>
                  <h2 className="font-extrabold text-sm text-slate-900 dark:text-white inline mr-2">
                    Auction schedule
                  </h2>
                  <span className="text-xs text-slate-500 dark:text-slate-400">Set the timeline for your auction.</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Bid start date & time */}
                <div>
                  <label htmlFor="bid-start-time" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Bid start date & time
                  </label>
                  <div className="relative">
                    <input
                      id="bid-start-time"
                      type="datetime-local"
                      required
                      value={bidStartTime}
                      onChange={(e) => setBidStartTime(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-lg bg-white dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500 shadow-2xs font-mono transition-colors"
                    />
                  </div>
                </div>

                {/* Bid close date & time */}
                <div>
                  <label htmlFor="bid-close-time" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Bid close date & time
                  </label>
                  <div className="relative">
                    <input
                      id="bid-close-time"
                      type="datetime-local"
                      required
                      value={bidCloseTime}
                      onChange={(e) => setBidCloseTime(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-lg bg-white dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500 shadow-2xs font-mono transition-colors"
                    />
                  </div>
                </div>

                {/* Forced close date & time */}
                <div>
                  <label htmlFor="forced-close-time" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Forced close date & time
                  </label>
                  <div className="relative">
                    <input
                      id="forced-close-time"
                      type="datetime-local"
                      required
                      value={forcedBidCloseTime}
                      onChange={(e) => setForcedBidCloseTime(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-lg bg-white dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500 shadow-2xs font-mono transition-colors"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Card 3: British auction rules */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center space-x-3">
                  <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                    3
                  </span>
                  <div>
                    <h2 className="font-extrabold text-sm text-slate-900 dark:text-white inline mr-2">
                      British auction rules
                    </h2>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      Enable British auction format and configure the settings.
                    </span>
                  </div>
                </div>

                {/* Toggle switch for British Auction */}
                <div className="flex items-center space-x-2.5">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={isBritishAuction}
                    aria-label="Toggle British auction format"
                    onClick={() => setIsBritishAuction(!isBritishAuction)}
                    className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors focus-visible:ring-2 focus-visible:ring-blue-600 ${
                      isBritishAuction ? "bg-blue-600" : "bg-slate-300 dark:bg-slate-700"
                    }`}
                  >
                    <div
                      className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                        isBritishAuction ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    British auction enabled
                  </span>
                </div>
              </div>

              {isBritishAuction && (
                <div className="space-y-6 pt-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Trigger window */}
                    <div>
                      <label htmlFor="trigger-window" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        <span>Trigger window (min)</span>
                        <span
                          title="Time window before close time where qualifying bids trigger extensions"
                          className="cursor-help inline-flex items-center ml-1"
                        >
                          <HelpCircle className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                        </span>
                      </label>
                      <div className="relative flex items-center">
                        <input
                          id="trigger-window"
                          type="number"
                          step="0.1"
                          required
                          min="0.1"
                          placeholder="e.g., 3"
                          value={triggerWindowMinutes}
                          onChange={(e) => setTriggerWindowMinutes(e.target.value)}
                          className="w-full px-3.5 py-2.5 pr-20 rounded-lg bg-white dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500 shadow-2xs transition-colors"
                        />
                        <span className="absolute right-3 text-xs text-slate-400 dark:text-slate-500 font-medium pointer-events-none">
                          minutes
                        </span>
                      </div>
                    </div>

                    {/* Extension duration */}
                    <div>
                      <label htmlFor="extension-duration" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        <span>Extension duration (per bid)</span>
                        <span
                          title="Minutes added to the auction close time when an extension is triggered"
                          className="cursor-help inline-flex items-center ml-1"
                        >
                          <HelpCircle className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                        </span>
                      </label>
                      <div className="relative flex items-center">
                        <input
                          id="extension-duration"
                          type="number"
                          step="0.1"
                          required
                          min="0.1"
                          placeholder="e.g., 2"
                          value={extensionDurationMinutes}
                          onChange={(e) => setExtensionDurationMinutes(e.target.value)}
                          className="w-full px-3.5 py-2.5 pr-20 rounded-lg bg-white dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500 shadow-2xs transition-colors"
                        />
                        <span className="absolute right-3 text-xs text-slate-400 dark:text-slate-500 font-medium pointer-events-none">
                          minutes
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 3 Selectable Trigger Cards matching Screenshot */}
                  <div role="radiogroup" aria-label="Select trigger condition for auction extension">
                    <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-3">
                      Select trigger condition for auction extension. (Choose one)
                    </label>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                      {/* Card 1: Any bid in last X seconds */}
                      <div
                        role="radio"
                        aria-checked={extensionTriggerType === "BID_RECEIVED"}
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === " " || e.key === "Enter") {
                            e.preventDefault();
                            setExtensionTriggerType("BID_RECEIVED");
                          }
                        }}
                        onClick={() => setExtensionTriggerType("BID_RECEIVED")}
                        className={`p-4 rounded-xl border cursor-pointer transition-all flex flex-col justify-between focus-visible:ring-2 focus-visible:ring-blue-600 ${
                          extensionTriggerType === "BID_RECEIVED"
                            ? "border-2 border-blue-600 bg-blue-50/30 dark:bg-blue-950/40 shadow-xs"
                            : "border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800/50 hover:border-slate-300 dark:hover:border-slate-600"
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <Users className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                              <span className="font-bold text-xs text-slate-900 dark:text-slate-100">
                                Any bid in last X seconds
                              </span>
                            </div>
                            {extensionTriggerType === "BID_RECEIVED" ? (
                              <CheckCircle2 className="w-4 h-4 text-blue-600 fill-blue-600 text-white shrink-0" />
                            ) : (
                              <div className="w-4 h-4 rounded-full border border-slate-300 dark:border-slate-600 shrink-0" />
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                            If any bid is placed in the last X seconds of the trigger window, extend
                            the auction.
                          </p>
                        </div>
                      </div>

                      {/* Card 2: Bid price change */}
                      <div
                        role="radio"
                        aria-checked={extensionTriggerType === "ANY_RANK_CHANGE"}
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === " " || e.key === "Enter") {
                            e.preventDefault();
                            setExtensionTriggerType("ANY_RANK_CHANGE");
                          }
                        }}
                        onClick={() => setExtensionTriggerType("ANY_RANK_CHANGE")}
                        className={`p-4 rounded-xl border cursor-pointer transition-all flex flex-col justify-between focus-visible:ring-2 focus-visible:ring-blue-600 ${
                          extensionTriggerType === "ANY_RANK_CHANGE"
                            ? "border-2 border-blue-600 bg-blue-50/30 dark:bg-blue-950/40 shadow-xs"
                            : "border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800/50 hover:border-slate-300 dark:hover:border-slate-600"
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <BarChart2 className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                              <span className="font-bold text-xs text-slate-900 dark:text-slate-100">
                                Bid price change
                              </span>
                            </div>
                            {extensionTriggerType === "ANY_RANK_CHANGE" ? (
                              <CheckCircle2 className="w-4 h-4 text-blue-600 fill-blue-600 text-white shrink-0" />
                            ) : (
                              <div className="w-4 h-4 rounded-full border border-slate-300 dark:border-slate-600 shrink-0" />
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                            If the leading bid price changes within the trigger window, extend the
                            auction.
                          </p>
                        </div>
                      </div>

                      {/* Card 3: Lowest bidder is in change */}
                      <div
                        role="radio"
                        aria-checked={extensionTriggerType === "L1_RANK_CHANGE"}
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === " " || e.key === "Enter") {
                            e.preventDefault();
                            setExtensionTriggerType("L1_RANK_CHANGE");
                          }
                        }}
                        onClick={() => setExtensionTriggerType("L1_RANK_CHANGE")}
                        className={`p-4 rounded-xl border cursor-pointer transition-all flex flex-col justify-between focus-visible:ring-2 focus-visible:ring-blue-600 ${
                          extensionTriggerType === "L1_RANK_CHANGE"
                            ? "border-2 border-blue-600 bg-blue-50/30 dark:bg-blue-950/40 shadow-xs"
                            : "border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800/50 hover:border-slate-300 dark:hover:border-slate-600"
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <Award className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                              <span className="font-bold text-xs text-slate-900 dark:text-slate-100">
                                Lowest bidder is in change
                              </span>
                            </div>
                            {extensionTriggerType === "L1_RANK_CHANGE" ? (
                              <CheckCircle2 className="w-4 h-4 text-blue-600 fill-blue-600 text-white shrink-0" />
                            ) : (
                              <div className="w-4 h-4 rounded-full border border-slate-300 dark:border-slate-600 shrink-0" />
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                            If the current lowest bidder changes within the trigger window, extend
                            the auction.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Auction summary (Sticky Sidebar) matching Screenshot */}
          <div className="lg:col-span-4">
            <aside aria-label="Live Auction Summary" className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs sticky top-20 space-y-6">
              {/* Summary Header */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight">
                    Auction summary
                  </h3>
                  <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900/50">
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    <span>British auction enabled</span>
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Review your auction details before launching. You can make changes anytime before the auction starts.
                </p>
              </div>

              {/* Section 1: RFQ details */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
                <div className="flex items-center space-x-2 text-xs font-bold text-slate-900 dark:text-slate-100">
                  <FileText className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                  <span>RFQ details</span>
                </div>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Reference ID</span>
                    <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                      {referenceId ? referenceId : "—"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Route</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200 max-w-[200px] text-right truncate">
                      {title ? title : "—"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Pickup / Service Date</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">
                      {pickupDate ? formatDisplayDate(pickupDate) : "—"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Section 2: Auction schedule */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
                <div className="flex items-center space-x-2 text-xs font-bold text-slate-900 dark:text-slate-100">
                  <Calendar className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                  <span>Auction schedule</span>
                </div>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Bid opens</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">
                      {bidStartTime ? formatDisplayDateTime(bidStartTime) : "—"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Bid closes</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">
                      {bidCloseTime ? formatDisplayDateTime(bidCloseTime) : "—"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Forced close</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">
                      {forcedBidCloseTime ? formatDisplayDateTime(forcedBidCloseTime) : "—"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Hard ceiling enforced Callout Box matching Screenshot */}
              <div className="p-3.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/40 flex items-start space-x-2.5">
                <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5 fill-blue-600 text-white" />
                <div>
                  <h4 className="text-xs font-bold text-blue-900 dark:text-blue-200">Hard ceiling enforced</h4>
                  <p className="text-[11px] text-blue-700/90 dark:text-blue-300/90 mt-0.5 leading-snug">
                    The auction will automatically close at the forced close time, even if bids are still coming in.
                  </p>
                </div>
              </div>

              {/* Section 3: British auction rules */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
                <div className="flex items-center space-x-2 text-xs font-bold text-slate-900 dark:text-slate-100">
                  <Settings className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                  <span>British auction rules</span>
                </div>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Trigger window</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">
                      {triggerWindowMinutes ? `${triggerWindowMinutes} minutes` : "—"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Extension duration</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">
                      {extensionDurationMinutes ? `${extensionDurationMinutes} minutes` : "—"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Trigger condition</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200 text-right">
                      {isBritishAuction ? getTriggerLabel(extensionTriggerType) : "—"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Bottom Action Buttons matching Screenshot */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center space-x-3">
                <Link
                  href="/"
                  className="px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 active:scale-[0.98] transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-blue-600 text-center"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 inline-flex items-center justify-center space-x-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white text-xs font-bold shadow-xs transition-all disabled:opacity-50 cursor-pointer focus-visible:ring-2 focus-visible:ring-blue-600"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{loading ? "Creating..." : "Create RFQ & launch auction"}</span>
                </button>
              </div>
            </aside>
          </div>
        </div>
      </form>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createRFQ } from "@/lib/api";
import {
  ArrowLeft,
  Sparkles,
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
  ChevronDown
} from "lucide-react";

export default function CreateRFQPage() {
  const router = useRouter();

  // Helper to format ISO strings for datetime-local input (YYYY-MM-DDTHH:mm)
  const formatDatetimeLocal = (date: Date) => {
    const pad = (n: number) => n.toString().padStart(2, "0");
    const year = date.getFullYear();
    const month = pad(date.getMonth() + 1);
    const day = pad(date.getDate());
    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const formatDisplayDate = (dStr: string) => {
    if (!dStr) return "-";
    try {
      const d = new Date(dStr);
      if (isNaN(d.getTime())) return dStr;
      return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
    } catch {
      return dStr;
    }
  };

  const formatDisplayDateTime = (dtStr: string) => {
    if (!dtStr) return "-";
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

  const [referenceId, setReferenceId] = useState("RFQ-2025-0174");
  const [title, setTitle] = useState("New Delhi → Mumbai (NH48)");
  const [pickupDate, setPickupDate] = useState("2025-05-12");
  const [bidStartTime, setBidStartTime] = useState("2025-05-12T10:00");
  const [bidCloseTime, setBidCloseTime] = useState("2025-05-12T16:00");
  const [forcedBidCloseTime, setForcedBidCloseTime] = useState("2025-05-12T18:00");

  const [isBritishAuction, setIsBritishAuction] = useState(true);
  const [triggerWindowMinutes, setTriggerWindowMinutes] = useState("3");
  const [extensionDurationMinutes, setExtensionDurationMinutes] = useState("2");
  const [extensionTriggerType, setExtensionTriggerType] = useState<
    "BID_RECEIVED" | "ANY_RANK_CHANGE" | "L1_RANK_CHANGE"
  >("BID_RECEIVED");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize client-side current timestamps on mount
  useEffect(() => {
    const t = new Date();
    setReferenceId(`RFQ-${Math.floor(1000 + Math.random() * 9000)}-0174`);
    setPickupDate(new Date(t.getTime() + 14 * 24 * 3600 * 1000).toISOString().split("T")[0]);
    setBidStartTime(formatDatetimeLocal(new Date(t.getTime() - 5 * 60 * 1000)));
    setBidCloseTime(formatDatetimeLocal(new Date(t.getTime() + 65 * 60 * 1000)));
    setForcedBidCloseTime(formatDatetimeLocal(new Date(t.getTime() + 125 * 60 * 1000)));
  }, []);

  // Quick Demo Preset Generator
  const loadDemoPreset = () => {
    const t = new Date();
    setReferenceId(`DEMO-${Math.floor(100 + Math.random() * 900)}-LIVE`);
    setTitle("⚡ 2-Minute Live Demo: Singapore to Jakarta Reefer Cargo");
    setBidStartTime(formatDatetimeLocal(new Date(t.getTime() - 60 * 1000))); // Started 1 min ago
    setBidCloseTime(formatDatetimeLocal(new Date(t.getTime() + 90 * 1000))); // 90 seconds from now
    setForcedBidCloseTime(formatDatetimeLocal(new Date(t.getTime() + 240 * 1000))); // 4 mins hard stop
    setIsBritishAuction(true);
    setTriggerWindowMinutes("1.5");
    setExtensionDurationMinutes("1.0");
    setExtensionTriggerType("BID_RECEIVED");
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const startDate = new Date(bidStartTime);
    const closeDate = new Date(bidCloseTime);
    const forcedDate = new Date(forcedBidCloseTime);

    // Section 7 Validation:
    if (closeDate <= startDate) {
      setError("Validation Error: Bid Close Time must be strictly later than Bid Start Time.");
      return;
    }
    if (forcedDate < closeDate) {
      setError("Validation Error: Forced Bid Close Time must be greater than or equal to Bid Close Time.");
      return;
    }
    if (parseFloat(triggerWindowMinutes) <= 0 || parseFloat(extensionDurationMinutes) <= 0) {
      setError("Validation Error: Trigger Window and Extension Duration must be positive numbers.");
      return;
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
        trigger_window_minutes: parseFloat(triggerWindowMinutes),
        extension_duration_minutes: parseFloat(extensionDurationMinutes),
        extension_trigger_type: extensionTriggerType,
      });

      router.push(`/rfqs/${created.id}`);
    } catch (err: any) {
      setError(err.message || "Failed to create RFQ");
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-1.5 text-xs text-slate-500 mb-1.5 font-medium">
            <Link href="/" className="hover:text-blue-600 transition-colors">
              Auctions
            </Link>
            <span>/</span>
            <span className="text-slate-800">Create RFQ</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Create freight RFQ
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Configure your freight requirements, set the auction schedule, and define British auction rules.
          </p>
        </div>

        {/* Demo Preset Button */}
        <button
          type="button"
          onClick={loadDemoPreset}
          className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 transition-all shadow-2xs self-start sm:self-auto"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-600 fill-amber-500" />
          <span>Populate 2-Minute Demo Preset</span>
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center space-x-3">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main 2-Column Grid matching Screenshot */}
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column (Cards 1, 2, 3) */}
          <div className="lg:col-span-8 space-y-6">
            {/* Card 1: RFQ details */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
              <div className="flex items-center space-x-3 mb-5">
                <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                  1
                </span>
                <div>
                  <h2 className="font-extrabold text-sm text-slate-900 inline mr-2">RFQ details</h2>
                  <span className="text-xs text-slate-500">
                    Provide the key details for your freight request.
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Reference ID */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    <span>Reference ID</span>
                    <HelpCircle className="w-3.5 h-3.5 text-slate-400 inline ml-1" />
                  </label>
                  <input
                    type="text"
                    required
                    value={referenceId}
                    onChange={(e) => setReferenceId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-white border border-slate-300 text-slate-900 font-mono text-xs focus:outline-none focus:border-blue-500 shadow-2xs"
                    placeholder="e.g., RFQ-2025-0174"
                  />
                </div>

                {/* RFQ Title / Route */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    RFQ Title / Route
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-white border border-slate-300 text-slate-900 text-xs focus:outline-none focus:border-blue-500 shadow-2xs"
                    placeholder="New Delhi → Mumbai (NH48)"
                  />
                </div>

                {/* Pickup / Service Date */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Pickup / Service Date
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      required
                      value={pickupDate}
                      onChange={(e) => setPickupDate(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-lg bg-white border border-slate-300 text-slate-900 text-xs focus:outline-none focus:border-blue-500 shadow-2xs"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2: Auction schedule */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
              <div className="flex items-center space-x-3 mb-5">
                <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                  2
                </span>
                <div>
                  <h2 className="font-extrabold text-sm text-slate-900 inline mr-2">
                    Auction schedule
                  </h2>
                  <span className="text-xs text-slate-500">Set the timeline for your auction.</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Bid start date & time */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Bid start date & time
                  </label>
                  <div className="relative">
                    <input
                      type="datetime-local"
                      required
                      value={bidStartTime}
                      onChange={(e) => setBidStartTime(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-lg bg-white border border-slate-300 text-slate-900 text-xs focus:outline-none focus:border-blue-500 shadow-2xs font-mono"
                    />
                  </div>
                </div>

                {/* Bid close date & time */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Bid close date & time
                  </label>
                  <div className="relative">
                    <input
                      type="datetime-local"
                      required
                      value={bidCloseTime}
                      onChange={(e) => setBidCloseTime(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-lg bg-white border border-slate-300 text-slate-900 text-xs focus:outline-none focus:border-blue-500 shadow-2xs font-mono"
                    />
                  </div>
                </div>

                {/* Forced close date & time */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Forced close date & time
                  </label>
                  <div className="relative">
                    <input
                      type="datetime-local"
                      required
                      value={forcedBidCloseTime}
                      onChange={(e) => setForcedBidCloseTime(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-lg bg-white border border-slate-300 text-slate-900 text-xs focus:outline-none focus:border-blue-500 shadow-2xs font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Card 3: British auction rules */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center space-x-3">
                  <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                    3
                  </span>
                  <div>
                    <h2 className="font-extrabold text-sm text-slate-900 inline mr-2">
                      British auction rules
                    </h2>
                    <span className="text-xs text-slate-500">
                      Enable British auction format and configure the settings.
                    </span>
                  </div>
                </div>

                {/* Toggle switch for British Auction */}
                <div className="flex items-center space-x-2.5">
                  <button
                    type="button"
                    onClick={() => setIsBritishAuction(!isBritishAuction)}
                    className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                      isBritishAuction ? "bg-blue-600" : "bg-slate-300"
                    }`}
                  >
                    <div
                      className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                        isBritishAuction ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                  <span className="text-xs font-semibold text-slate-700">
                    British auction enabled
                  </span>
                </div>
              </div>

              {isBritishAuction && (
                <div className="space-y-6 pt-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Trigger window */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        <span>Trigger window (min)</span>
                        <HelpCircle className="w-3.5 h-3.5 text-slate-400 inline ml-1" />
                      </label>
                      <div className="relative flex items-center">
                        <input
                          type="number"
                          step="0.1"
                          required
                          min="0.1"
                          value={triggerWindowMinutes}
                          onChange={(e) => setTriggerWindowMinutes(e.target.value)}
                          className="w-full px-3.5 py-2.5 pr-20 rounded-lg bg-white border border-slate-300 text-slate-900 text-xs focus:outline-none focus:border-blue-500 shadow-2xs"
                        />
                        <span className="absolute right-3 text-xs text-slate-400 font-medium pointer-events-none">
                          minutes
                        </span>
                      </div>
                    </div>

                    {/* Extension duration */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        <span>Extension duration (per bid)</span>
                        <HelpCircle className="w-3.5 h-3.5 text-slate-400 inline ml-1" />
                      </label>
                      <div className="relative flex items-center">
                        <input
                          type="number"
                          step="0.1"
                          required
                          min="0.1"
                          value={extensionDurationMinutes}
                          onChange={(e) => setExtensionDurationMinutes(e.target.value)}
                          className="w-full px-3.5 py-2.5 pr-20 rounded-lg bg-white border border-slate-300 text-slate-900 text-xs focus:outline-none focus:border-blue-500 shadow-2xs"
                        />
                        <span className="absolute right-3 text-xs text-slate-400 font-medium pointer-events-none">
                          minutes
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 3 Selectable Trigger Cards matching Screenshot */}
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-3">
                      Select trigger condition for auction extension. (Choose one)
                    </label>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                      {/* Card 1: Any bid in last X seconds */}
                      <div
                        onClick={() => setExtensionTriggerType("BID_RECEIVED")}
                        className={`p-4 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                          extensionTriggerType === "BID_RECEIVED"
                            ? "border-2 border-blue-600 bg-blue-50/20 shadow-xs"
                            : "border border-slate-200 bg-white hover:border-slate-300"
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <Users className="w-4 h-4 text-blue-600 shrink-0" />
                              <span className="font-bold text-xs text-slate-900">
                                Any bid in last X seconds
                              </span>
                            </div>
                            {extensionTriggerType === "BID_RECEIVED" ? (
                              <CheckCircle2 className="w-4 h-4 text-blue-600 fill-blue-600 text-white shrink-0" />
                            ) : (
                              <div className="w-4 h-4 rounded-full border border-slate-300 shrink-0" />
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 leading-snug">
                            If any bid is placed in the last X seconds of the trigger window, extend
                            the auction.
                          </p>
                        </div>
                      </div>

                      {/* Card 2: Bid price change */}
                      <div
                        onClick={() => setExtensionTriggerType("ANY_RANK_CHANGE")}
                        className={`p-4 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                          extensionTriggerType === "ANY_RANK_CHANGE"
                            ? "border-2 border-blue-600 bg-blue-50/20 shadow-xs"
                            : "border border-slate-200 bg-white hover:border-slate-300"
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <BarChart2 className="w-4 h-4 text-blue-600 shrink-0" />
                              <span className="font-bold text-xs text-slate-900">
                                Bid price change
                              </span>
                            </div>
                            {extensionTriggerType === "ANY_RANK_CHANGE" ? (
                              <CheckCircle2 className="w-4 h-4 text-blue-600 fill-blue-600 text-white shrink-0" />
                            ) : (
                              <div className="w-4 h-4 rounded-full border border-slate-300 shrink-0" />
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 leading-snug">
                            If the leading bid price changes within the trigger window, extend the
                            auction.
                          </p>
                        </div>
                      </div>

                      {/* Card 3: Lowest bidder is in change */}
                      <div
                        onClick={() => setExtensionTriggerType("L1_RANK_CHANGE")}
                        className={`p-4 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                          extensionTriggerType === "L1_RANK_CHANGE"
                            ? "border-2 border-blue-600 bg-blue-50/20 shadow-xs"
                            : "border border-slate-200 bg-white hover:border-slate-300"
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <Award className="w-4 h-4 text-blue-600 shrink-0" />
                              <span className="font-bold text-xs text-slate-900">
                                Lowest bidder is in change
                              </span>
                            </div>
                            {extensionTriggerType === "L1_RANK_CHANGE" ? (
                              <CheckCircle2 className="w-4 h-4 text-blue-600 fill-blue-600 text-white shrink-0" />
                            ) : (
                              <div className="w-4 h-4 rounded-full border border-slate-300 shrink-0" />
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 leading-snug">
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
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs sticky top-20 space-y-6">
              {/* Summary Header */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
                    Auction summary
                  </h3>
                  <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-600 border border-blue-200">
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                    <span>British auction enabled</span>
                  </span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Review your auction details before launching. You can make changes anytime before the auction starts.
                </p>
              </div>

              {/* Section 1: RFQ details */}
              <div className="pt-2 border-t border-slate-100 space-y-2.5">
                <div className="flex items-center space-x-2 text-xs font-bold text-slate-900">
                  <FileText className="w-3.5 h-3.5 text-slate-500" />
                  <span>RFQ details</span>
                </div>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Reference ID</span>
                    <span className="font-mono font-semibold text-slate-800">
                      {referenceId || "-"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Route</span>
                    <span className="font-medium text-slate-800 max-w-[200px] text-right truncate">
                      {title || "-"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Pickup / Service Date</span>
                    <span className="font-medium text-slate-800">
                      {formatDisplayDate(pickupDate)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Section 2: Auction schedule */}
              <div className="pt-4 border-t border-slate-100 space-y-2.5">
                <div className="flex items-center space-x-2 text-xs font-bold text-slate-900">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  <span>Auction schedule</span>
                </div>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Bid opens</span>
                    <span className="font-medium text-slate-800">
                      {formatDisplayDateTime(bidStartTime)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Bid closes</span>
                    <span className="font-medium text-slate-800">
                      {formatDisplayDateTime(bidCloseTime)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Forced close</span>
                    <span className="font-medium text-slate-800">
                      {formatDisplayDateTime(forcedBidCloseTime)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Hard ceiling enforced Callout Box matching Screenshot */}
              <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-100 flex items-start space-x-2.5">
                <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5 fill-blue-600 text-white" />
                <div>
                  <h4 className="text-xs font-bold text-blue-900">Hard ceiling enforced</h4>
                  <p className="text-[11px] text-blue-700/90 mt-0.5 leading-snug">
                    The auction will automatically close at the forced close time, even if bids are still coming in.
                  </p>
                </div>
              </div>

              {/* Section 3: British auction rules */}
              <div className="pt-4 border-t border-slate-100 space-y-2.5">
                <div className="flex items-center space-x-2 text-xs font-bold text-slate-900">
                  <Settings className="w-3.5 h-3.5 text-slate-500" />
                  <span>British auction rules</span>
                </div>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Trigger window</span>
                    <span className="font-medium text-slate-800">
                      {triggerWindowMinutes} minutes
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Extension duration</span>
                    <span className="font-medium text-slate-800">
                      {extensionDurationMinutes} minutes
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Trigger condition</span>
                    <span className="font-medium text-slate-800 text-right">
                      {getTriggerLabel(extensionTriggerType)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Bottom Action Buttons matching Screenshot */}
              <div className="pt-4 border-t border-slate-100 flex items-center space-x-3">
                <Link
                  href="/"
                  className="px-5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 inline-flex items-center justify-center space-x-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition-all disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{loading ? "Creating..." : "Create RFQ & launch auction"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

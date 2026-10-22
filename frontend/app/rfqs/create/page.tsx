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
  Clock,
  AlertCircle,
  HelpCircle,
  Copy,
  Check,
  Rocket
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

  const [referenceId, setReferenceId] = useState("RFQ-6892-SEA");
  const [title, setTitle] = useState("Nhava Sheva to Felixstowe 30x40ft Standard FCL");
  const [pickupDate, setPickupDate] = useState("2026-11-05");
  const [bidStartTime, setBidStartTime] = useState("2026-10-22T20:59");
  const [bidCloseTime, setBidCloseTime] = useState("2026-10-22T22:04");
  const [forcedBidCloseTime, setForcedBidCloseTime] = useState("2026-10-22T23:04");

  const [isBritishAuction, setIsBritishAuction] = useState(true);
  const [triggerWindowMinutes, setTriggerWindowMinutes] = useState("10.0");
  const [extensionDurationMinutes, setExtensionDurationMinutes] = useState("5.0");
  const [extensionTriggerType, setExtensionTriggerType] = useState<
    "BID_RECEIVED" | "ANY_RANK_CHANGE" | "L1_RANK_CHANGE"
  >("BID_RECEIVED");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Initialize client-side current timestamps on mount
  useEffect(() => {
    const t = new Date();
    setReferenceId(`RFQ-${Math.floor(1000 + Math.random() * 9000)}-SEA`);
    setPickupDate(new Date(t.getTime() + 14 * 24 * 3600 * 1000).toISOString().split("T")[0]);
    setBidStartTime(formatDatetimeLocal(new Date(t.getTime() - 5 * 60 * 1000)));
    setBidCloseTime(formatDatetimeLocal(new Date(t.getTime() + 65 * 60 * 1000)));
    setForcedBidCloseTime(formatDatetimeLocal(new Date(t.getTime() + 125 * 60 * 1000)));
  }, []);

  const copyRefId = () => {
    navigator.clipboard.writeText(referenceId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Quick Demo Preset Generator matching Screenshot 2
  const loadDemoPreset = () => {
    const t = new Date();
    setReferenceId(`DEMO-${Math.floor(100 + Math.random() * 900)}-LIVE`);
    setTitle("⚡ 2-Minute Live Demo: Singapore to Jakarta Reefer Cargo");
    setBidStartTime(formatDatetimeLocal(new Date(t.getTime() - 60 * 1000))); // Started 1 min ago
    setBidCloseTime(formatDatetimeLocal(new Date(t.getTime() + 90 * 1000))); // 90 seconds from now
    setForcedBidCloseTime(formatDatetimeLocal(new Date(t.getTime() + 240 * 1000))); // 4 mins hard stop
    setIsBritishAuction(true);
    setTriggerWindowMinutes("1.5"); // 90 seconds trigger window
    setExtensionDurationMinutes("1.0"); // 60s extension
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

  return (
    <div className="w-full space-y-6">
      {/* Top Header Bar with Back Link and Preset Button matching Screenshot 2 */}
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-slate-500" />
          <span>Back to Auctions Dashboard</span>
        </Link>

        <button
          type="button"
          onClick={loadDemoPreset}
          className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-lg text-xs font-bold bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 transition-all shadow-sm"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-600 fill-amber-500" />
          <span>Populate 2-Minute Demo Preset</span>
        </button>
      </div>

      {/* Main White Card matching Screenshot 2 */}
      <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
        {/* Title & Badge */}
        <div className="mb-8">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-600 text-xs font-semibold mb-3">
            <Clock className="w-3.5 h-3.5 text-blue-600" />
            <span>RFQ Creation Form</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Create Freight RFQ with British Auction
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Configure dynamic extension trigger windows, duration, and the mandatory forced close ceiling.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center space-x-3">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Step 1: General RFQ Details */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2.5">
              <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                1
              </span>
              <h2 className="font-extrabold text-sm text-slate-900">General RFQ Details</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
              <div className="sm:col-span-4">
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  RFQ Reference ID <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={referenceId}
                    onChange={(e) => setReferenceId(e.target.value)}
                    className="w-full px-3 py-2 pr-9 rounded-lg bg-white border border-slate-300 text-slate-900 font-mono text-sm focus:outline-none focus:border-blue-500 shadow-sm"
                    placeholder="e.g., RFQ-6892-SEA"
                  />
                  <button
                    type="button"
                    onClick={copyRefId}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                    title="Copy Reference ID"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="sm:col-span-8">
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  RFQ Title / Route Description <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 text-sm focus:outline-none focus:border-blue-500 shadow-sm"
                  placeholder="e.g., Nhava Sheva to Felixstowe 30x40ft Standard FCL"
                />
              </div>
            </div>

            <div className="sm:w-1/2">
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Pickup / Service Date <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="date"
                  required
                  value={pickupDate}
                  onChange={(e) => setPickupDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 text-sm focus:outline-none focus:border-blue-500 shadow-sm"
                />
              </div>
            </div>
          </div>

          {/* Step 2: Auction Timestamps & Ceiling Rule */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                  2
                </span>
                <h2 className="font-extrabold text-sm text-slate-900">
                  Auction Timestamps & Ceiling Rule
                </h2>
              </div>
              <span className="text-xs text-slate-500 font-medium">
                Rule: Forced Close must be later than Bid Close
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Bid Start Date & Time
                </label>
                <input
                  type="datetime-local"
                  required
                  value={bidStartTime}
                  onChange={(e) => setBidStartTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 font-mono text-xs focus:outline-none focus:border-blue-500 shadow-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Bid Close Date & Time
                </label>
                <input
                  type="datetime-local"
                  required
                  value={bidCloseTime}
                  onChange={(e) => setBidCloseTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 font-mono text-xs focus:outline-none focus:border-blue-500 shadow-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-amber-900 mb-1.5 flex items-center space-x-1">
                  <span>Forced Bid Close Date & Time</span>
                  <HelpCircle className="w-3.5 h-3.5 text-amber-600" />
                </label>
                <input
                  type="datetime-local"
                  required
                  value={forcedBidCloseTime}
                  onChange={(e) => setForcedBidCloseTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-amber-50/30 border-2 border-amber-400 text-slate-900 font-mono text-xs focus:outline-none focus:border-amber-500 shadow-sm"
                />
              </div>
            </div>

            {/* Amber Hard Ceiling Enforcement Banner matching Screenshot 2 */}
            <div className="p-3.5 bg-amber-50/70 rounded-xl border border-amber-200 text-xs text-amber-900 flex items-center space-x-2.5">
              <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                <strong>Hard Ceiling Enforcement:</strong> British Auction extensions will dynamically push back the close time, but the engine guarantees bidding strictly terminates at or before the Forced Close Time.
              </span>
            </div>
          </div>

          {/* Step 3: British Auction Configuration */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                  3
                </span>
                <h2 className="font-extrabold text-sm text-slate-900">
                  British Auction Configuration
                </h2>
              </div>

              {/* Blue Toggle Switch matching Screenshot 2 */}
              <label className="flex items-center space-x-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isBritishAuction}
                  onChange={(e) => setIsBritishAuction(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 relative"></div>
                <span className="text-xs font-bold text-slate-800">Enable British Auction</span>
              </label>
            </div>

            {isBritishAuction && (
              <div className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Trigger Window (X Minutes)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0.1"
                      required
                      value={triggerWindowMinutes}
                      onChange={(e) => setTriggerWindowMinutes(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 font-mono text-sm focus:outline-none focus:border-blue-500 shadow-sm"
                    />
                    <span className="text-[11px] text-slate-500 mt-1 block">
                      Activity within this window before close time triggers extension.
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Extension Duration (Y Minutes)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0.1"
                      required
                      value={extensionDurationMinutes}
                      onChange={(e) => setExtensionDurationMinutes(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 font-mono text-sm focus:outline-none focus:border-blue-500 shadow-sm"
                    />
                    <span className="text-[11px] text-slate-500 mt-1 block">
                      Minutes added to close time when trigger condition is met.
                    </span>
                  </div>
                </div>

                {/* Extension Trigger Condition (Select Rule) with 3 Radio Cards matching Screenshot 2 */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-2">
                    Extension Trigger Condition (Select Rule):
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* Card A */}
                    <div
                      onClick={() => setExtensionTriggerType("BID_RECEIVED")}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                        extensionTriggerType === "BID_RECEIVED"
                          ? "border-2 border-blue-600 bg-blue-50/30 shadow-sm"
                          : "border border-slate-200 bg-white hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-center space-x-2 font-bold text-xs text-slate-900 mb-1">
                        <div
                          className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                            extensionTriggerType === "BID_RECEIVED"
                              ? "border-blue-600 bg-white"
                              : "border-slate-300"
                          }`}
                        >
                          {extensionTriggerType === "BID_RECEIVED" && (
                            <div className="w-2 h-2 rounded-full bg-blue-600" />
                          )}
                        </div>
                        <span className="flex items-center space-x-1">
                          <span>Any Bid Received</span>
                          <HelpCircle className="w-3 h-3 text-slate-400" />
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 leading-snug pl-6">
                        Extends if any carrier submits a new valid bid during the trigger window.
                      </p>
                    </div>

                    {/* Card B */}
                    <div
                      onClick={() => setExtensionTriggerType("ANY_RANK_CHANGE")}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                        extensionTriggerType === "ANY_RANK_CHANGE"
                          ? "border-2 border-blue-600 bg-blue-50/30 shadow-sm"
                          : "border border-slate-200 bg-white hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-center space-x-2 font-bold text-xs text-slate-900 mb-1">
                        <div
                          className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                            extensionTriggerType === "ANY_RANK_CHANGE"
                              ? "border-blue-600 bg-white"
                              : "border-slate-300"
                          }`}
                        >
                          {extensionTriggerType === "ANY_RANK_CHANGE" && (
                            <div className="w-2 h-2 rounded-full bg-blue-600" />
                          )}
                        </div>
                        <span>Any Rank Change</span>
                      </div>
                      <p className="text-[11px] text-slate-500 leading-snug pl-6">
                        Extends only if supplier positions change (e.g., L3 jumps to L2).
                      </p>
                    </div>

                    {/* Card C */}
                    <div
                      onClick={() => setExtensionTriggerType("L1_RANK_CHANGE")}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                        extensionTriggerType === "L1_RANK_CHANGE"
                          ? "border-2 border-blue-600 bg-blue-50/30 shadow-sm"
                          : "border border-slate-200 bg-white hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-center space-x-2 font-bold text-xs text-slate-900 mb-1">
                        <div
                          className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                            extensionTriggerType === "L1_RANK_CHANGE"
                              ? "border-blue-600 bg-white"
                              : "border-slate-300"
                          }`}
                        >
                          {extensionTriggerType === "L1_RANK_CHANGE" && (
                            <div className="w-2 h-2 rounded-full bg-blue-600" />
                          )}
                        </div>
                        <span>Lowest Bidder (L1) Change</span>
                      </div>
                      <p className="text-[11px] text-slate-500 leading-snug pl-6">
                        Extends only when a new carrier takes the #1 winning lowest position.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Action Bar matching Screenshot 2 */}
          <div className="pt-6 border-t border-slate-100 flex items-center justify-end space-x-4">
            <Link
              href="/"
              className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl font-bold text-xs bg-blue-600 hover:bg-blue-700 text-white shadow-md transition-all disabled:opacity-50 inline-flex items-center space-x-2"
            >
              <Rocket className="w-4 h-4 fill-white" />
              <span>{loading ? "Creating British RFQ..." : "Create RFQ & Launch Auction"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

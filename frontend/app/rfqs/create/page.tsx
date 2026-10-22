"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createRFQ } from "@/lib/api";
import {
  ArrowLeft,
  Sparkles,
  Zap,
  ShieldCheck,
  Calendar,
  Clock,
  Layers,
  AlertCircle,
  HelpCircle,
  CheckCircle2
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

  const [referenceId, setReferenceId] = useState("RFQ-2026-SEA-001");
  const [title, setTitle] = useState("Nhava Sheva to Felixstowe 30x40ft Standard FCL");
  const [pickupDate, setPickupDate] = useState("2026-11-15");
  const [bidStartTime, setBidStartTime] = useState("2026-10-22T10:00");
  const [bidCloseTime, setBidCloseTime] = useState("2026-10-22T18:00");
  const [forcedBidCloseTime, setForcedBidCloseTime] = useState("2026-10-22T20:00");

  const [isBritishAuction, setIsBritishAuction] = useState(true);
  const [triggerWindowMinutes, setTriggerWindowMinutes] = useState("10.0");
  const [extensionDurationMinutes, setExtensionDurationMinutes] = useState("5.0");
  const [extensionTriggerType, setExtensionTriggerType] = useState<
    "BID_RECEIVED" | "ANY_RANK_CHANGE" | "L1_RANK_CHANGE"
  >("BID_RECEIVED");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize client-side current timestamps on mount
  useEffect(() => {
    const t = new Date();
    setReferenceId(`RFQ-${Math.floor(1000 + Math.random() * 9000)}-SEA`);
    setPickupDate(new Date(t.getTime() + 14 * 24 * 3600 * 1000).toISOString().split("T")[0]);
    setBidStartTime(formatDatetimeLocal(new Date(t.getTime() - 5 * 60 * 1000)));
    setBidCloseTime(formatDatetimeLocal(new Date(t.getTime() + 60 * 60 * 1000)));
    setForcedBidCloseTime(formatDatetimeLocal(new Date(t.getTime() + 120 * 60 * 1000)));
  }, []);

  // Quick Demo Preset Generator
  const loadDemoPreset = () => {
    const t = new Date();
    setReferenceId(`DEMO-${Math.floor(100 + Math.random() * 900)}-LIVE`);
    setTitle("⚡ Live Demo: Rotterdam to Newark Express Cargo");
    setBidStartTime(formatDatetimeLocal(new Date(t.getTime() - 60 * 1000))); // Started 1 min ago
    setBidCloseTime(formatDatetimeLocal(new Date(t.getTime() + 90 * 1000))); // 90 seconds from now
    setForcedBidCloseTime(formatDatetimeLocal(new Date(t.getTime() + 240 * 1000))); // 4 mins hard stop
    setIsBritishAuction(true);
    setTriggerWindowMinutes("1.0"); // 60s trigger window (currently active!)
    setExtensionDurationMinutes("0.5"); // 30s extension
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
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center space-x-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Auctions Dashboard</span>
        </Link>

        {/* Demo Preset Button */}
        <button
          type="button"
          onClick={loadDemoPreset}
          className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 transition-all shadow-sm shadow-amber-500/10"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>⚡ Populate 2-Minute Demo Preset</span>
        </button>
      </div>

      <div className="bg-slate-900/90 rounded-3xl border border-slate-800 p-6 sm:p-8 shadow-2xl">
        <div className="pb-6 border-b border-slate-800 mb-6">
          <div className="inline-flex items-center space-x-2 px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-2">
            <Zap className="w-3.5 h-3.5" />
            <span>RFQ Creation Form</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Create Freight RFQ with British Auction
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Configure dynamic extension trigger windows, duration, and the mandatory forced close ceiling.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center space-x-3">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: General RFQ Information */}
          <div className="space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center space-x-2">
              <Layers className="w-3.5 h-3.5" />
              <span>General RFQ Details</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  RFQ Reference ID <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={referenceId}
                  onChange={(e) => setReferenceId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-sm focus:outline-none focus:border-indigo-500"
                  placeholder="e.g., RFQ-2026-MUM"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  RFQ Title / Route Description <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-indigo-500"
                  placeholder="e.g., Shanghai to Hamburg 40ft High Cube"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Pickup / Service Date <span className="text-rose-400">*</span>
              </label>
              <input
                type="date"
                required
                value={pickupDate}
                onChange={(e) => setPickupDate(e.target.value)}
                className="w-full sm:w-1/3 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Section 2: Auction Schedule & Forced Close Rule */}
          <div className="space-y-4 pt-4 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center space-x-2">
                <Clock className="w-3.5 h-3.5" />
                <span>Auction Timestamps & Ceiling Rule</span>
              </h2>
              <span className="text-[11px] text-slate-400">
                Rule: Forced Close must be later than Bid Close
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Bid Start Date & Time
                </label>
                <input
                  type="datetime-local"
                  required
                  value={bidStartTime}
                  onChange={(e) => setBidStartTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Bid Close Date & Time
                </label>
                <input
                  type="datetime-local"
                  required
                  value={bidCloseTime}
                  onChange={(e) => setBidCloseTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-amber-300 mb-1 flex items-center space-x-1">
                  <span>Forced Bid Close Date & Time</span>
                  <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
                </label>
                <input
                  type="datetime-local"
                  required
                  value={forcedBidCloseTime}
                  onChange={(e) => setForcedBidCloseTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-amber-500/40 text-amber-200 font-mono text-xs focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            <div className="p-3 bg-amber-500/5 rounded-xl border border-amber-500/20 text-[11px] text-amber-300 flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                <strong>Hard Ceiling Enforcement:</strong> British Auction extensions will dynamically push back the close time, but the engine guarantees bidding strictly terminates at or before the Forced Close Time.
              </span>
            </div>
          </div>

          {/* Section 3: British Auction Configuration */}
          <div className="space-y-4 pt-4 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center space-x-2">
                <Zap className="w-3.5 h-3.5" />
                <span>British Auction Configuration</span>
              </h2>

              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isBritishAuction}
                  onChange={(e) => setIsBritishAuction(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 bg-slate-950 border-slate-800 focus:ring-0"
                />
                <span className="text-xs font-semibold text-slate-200">Enable British Auction</span>
              </label>
            </div>

            {isBritishAuction && (
              <div className="space-y-4 p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Trigger Window (X Minutes)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0.1"
                      required
                      value={triggerWindowMinutes}
                      onChange={(e) => setTriggerWindowMinutes(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white font-mono text-sm focus:outline-none focus:border-indigo-500"
                    />
                    <span className="text-[11px] text-slate-500 mt-1 block">
                      Activity within this window before close time triggers extension.
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Extension Duration (Y Minutes)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0.1"
                      required
                      value={extensionDurationMinutes}
                      onChange={(e) => setExtensionDurationMinutes(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white font-mono text-sm focus:outline-none focus:border-indigo-500"
                    />
                    <span className="text-[11px] text-slate-500 mt-1 block">
                      Minutes added to close time when trigger condition is met.
                    </span>
                  </div>
                </div>

                {/* Extension Triggers Selection (Section 6.3) */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-2">
                    Extension Trigger Condition (Select Rule):
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() => setExtensionTriggerType("BID_RECEIVED")}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        extensionTriggerType === "BID_RECEIVED"
                          ? "bg-indigo-600/10 border-indigo-500 text-white shadow-md shadow-indigo-600/10"
                          : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      <div className="font-bold text-xs flex items-center space-x-1.5 mb-1">
                        <span>a) Any Bid Received</span>
                        {extensionTriggerType === "BID_RECEIVED" && (
                          <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 leading-snug">
                        Extends if any carrier submits a new valid bid during the trigger window.
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setExtensionTriggerType("ANY_RANK_CHANGE")}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        extensionTriggerType === "ANY_RANK_CHANGE"
                          ? "bg-indigo-600/10 border-indigo-500 text-white shadow-md shadow-indigo-600/10"
                          : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      <div className="font-bold text-xs flex items-center space-x-1.5 mb-1">
                        <span>b) Any Rank Change</span>
                        {extensionTriggerType === "ANY_RANK_CHANGE" && (
                          <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 leading-snug">
                        Extends only if supplier positions change (e.g., L3 jumps to L2).
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setExtensionTriggerType("L1_RANK_CHANGE")}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        extensionTriggerType === "L1_RANK_CHANGE"
                          ? "bg-indigo-600/10 border-indigo-500 text-white shadow-md shadow-indigo-600/10"
                          : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      <div className="font-bold text-xs flex items-center space-x-1.5 mb-1">
                        <span>c) Lowest Bidder (L1) Change</span>
                        {extensionTriggerType === "L1_RANK_CHANGE" && (
                          <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 leading-snug">
                        Extends only when a new carrier takes the #1 winning lowest position.
                      </p>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="pt-6 border-t border-slate-800 flex items-center justify-end space-x-4">
            <Link
              href="/"
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-400 hover:text-white transition-colors"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl font-bold text-sm bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50"
            >
              {loading ? "Creating British RFQ..." : "Create RFQ & Launch Auction"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

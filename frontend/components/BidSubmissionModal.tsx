"use client";

import { useState } from "react";
import { submitQuote, BidSubmissionResult } from "@/lib/api";
import { Send, Sparkles, DollarSign, Timer, Calendar, CheckCircle, AlertCircle, Zap } from "lucide-react";

interface BidSubmissionModalProps {
  rfqId: string;
  auctionStatus: string;
  onBidSubmitted: () => void;
}

export default function BidSubmissionModal({ rfqId, auctionStatus, onBidSubmitted }: BidSubmissionModalProps) {
  const [carrierName, setCarrierName] = useState("Maersk Line");
  const [freightCharges, setFreightCharges] = useState("1800.00");
  const [originCharges, setOriginCharges] = useState("200.00");
  const [destinationCharges, setDestinationCharges] = useState("250.00");
  const [transitTimeDays, setTransitTimeDays] = useState("18");
  const [quoteValidity, setQuoteValidity] = useState(
    new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().split("T")[0]
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<BidSubmissionResult | null>(null);

  const totalAmount =
    (parseFloat(freightCharges) || 0) +
    (parseFloat(originCharges) || 0) +
    (parseFloat(destinationCharges) || 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLastResult(null);

    if (!carrierName.trim()) {
      setError("Please provide a carrier name.");
      return;
    }
    if (totalAmount <= 0) {
      setError("Total quote amount must be greater than $0.");
      return;
    }

    setLoading(true);
    try {
      const result = await submitQuote(rfqId, {
        carrier_name: carrierName.trim(),
        freight_charges: parseFloat(freightCharges) || 0,
        origin_charges: parseFloat(originCharges) || 0,
        destination_charges: parseFloat(destinationCharges) || 0,
        transit_time_days: parseInt(transitTimeDays, 10) || 1,
        quote_validity: quoteValidity,
      });

      setLastResult(result);
      onBidSubmitted();
    } catch (err: any) {
      setError(err.message || "Failed to submit quote");
    } finally {
      setLoading(false);
    }
  };

  const setPresetCarrier = (
    name: string,
    freight: number,
    origin: number,
    dest: number,
    days: number
  ) => {
    setCarrierName(name);
    setFreightCharges(freight.toFixed(2));
    setOriginCharges(origin.toFixed(2));
    setDestinationCharges(dest.toFixed(2));
    setTransitTimeDays(days.toString());
  };

  const isBiddingDisabled = auctionStatus !== "ACTIVE";

  return (
    <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 shadow-xl">
      <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
        <div>
          <h3 className="font-bold text-base text-white flex items-center space-x-2">
            <Send className="w-4 h-4 text-indigo-400" />
            <span>Carrier Quote Submission</span>
          </h3>
          <p className="text-xs text-slate-400">
            Submit a competitive bid to compete for the lowest (L1) rank.
          </p>
        </div>
      </div>

      {/* Preset simulation buttons for quick demoing */}
      <div className="mb-4 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
        <div className="flex items-center space-x-1.5 text-xs text-slate-400 mb-2">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span className="font-semibold text-slate-300">Quick Carrier Presets (1-Click Test):</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <button
            type="button"
            onClick={() => setPresetCarrier("Maersk Line", 1600, 200, 250, 18)}
            className="text-left px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-xs transition-colors"
          >
            <div className="font-semibold text-white">Maersk</div>
            <div className="text-[11px] text-amber-300 font-mono">$2,050.00</div>
          </button>
          <button
            type="button"
            onClick={() => setPresetCarrier("MSC Shipping", 1450, 200, 250, 20)}
            className="text-left px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-xs transition-colors"
          >
            <div className="font-semibold text-white">MSC</div>
            <div className="text-[11px] text-emerald-400 font-mono">$1,900.00 (Low)</div>
          </button>
          <button
            type="button"
            onClick={() => setPresetCarrier("Hapag-Lloyd", 1750, 220, 280, 16)}
            className="text-left px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-xs transition-colors"
          >
            <div className="font-semibold text-white">Hapag-Lloyd</div>
            <div className="text-[11px] text-slate-300 font-mono">$2,250.00</div>
          </button>
          <button
            type="button"
            onClick={() => setPresetCarrier("CMA CGM", 1380, 180, 240, 19)}
            className="text-left px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-xs transition-colors"
          >
            <div className="font-semibold text-white">CMA CGM</div>
            <div className="text-[11px] text-amber-400 font-mono">$1,800.00 (Aggressive)</div>
          </button>
        </div>
      </div>

      {lastResult && (
        <div
          className={`mb-4 p-3 rounded-xl border text-xs ${
            lastResult.extended
              ? "bg-amber-500/10 border-amber-500/30 text-amber-300"
              : "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
          }`}
        >
          <div className="flex items-center space-x-2 font-bold mb-1">
            {lastResult.extended ? (
              <>
                <Zap className="w-4 h-4 text-amber-400 animate-bounce" />
                <span>⚡ British Auction Extended!</span>
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <span>Quote Submitted (Rank {lastResult.bid.rank_label})</span>
              </>
            )}
          </div>
          <p className="text-slate-300 text-[11px]">{lastResult.extension_reason || "Quote recorded successfully."}</p>
          {lastResult.extended && (
            <p className="text-amber-200 font-mono text-[11px] mt-1">
              New Close Time: {new Date(lastResult.new_bid_close_time).toLocaleTimeString()}
            </p>
          )}
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">Carrier / Supplier Name</label>
          <input
            type="text"
            value={carrierName}
            onChange={(e) => setCarrierName(e.target.value)}
            disabled={isBiddingDisabled}
            required
            className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-indigo-500 disabled:opacity-50"
            placeholder="e.g., Maersk, COSCO, MSC..."
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Freight Charges ($)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={freightCharges}
              onChange={(e) => setFreightCharges(e.target.value)}
              disabled={isBiddingDisabled}
              required
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white font-mono text-sm focus:outline-none focus:border-indigo-500 disabled:opacity-50"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Origin Charges ($)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={originCharges}
              onChange={(e) => setOriginCharges(e.target.value)}
              disabled={isBiddingDisabled}
              required
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white font-mono text-sm focus:outline-none focus:border-indigo-500 disabled:opacity-50"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Destination Charges ($)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={destinationCharges}
              onChange={(e) => setDestinationCharges(e.target.value)}
              disabled={isBiddingDisabled}
              required
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white font-mono text-sm focus:outline-none focus:border-indigo-500 disabled:opacity-50"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Transit Time (Days)</label>
            <input
              type="number"
              min="1"
              value={transitTimeDays}
              onChange={(e) => setTransitTimeDays(e.target.value)}
              disabled={isBiddingDisabled}
              required
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-indigo-500 disabled:opacity-50"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Quote Validity Date</label>
            <input
              type="date"
              value={quoteValidity}
              onChange={(e) => setQuoteValidity(e.target.value)}
              disabled={isBiddingDisabled}
              required
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-indigo-500 disabled:opacity-50"
            />
          </div>
        </div>

        {/* Live Total preview bar */}
        <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-400">Computed Total Quote:</span>
          <span className="font-mono font-extrabold text-xl text-indigo-400">
            ${totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>

        <button
          type="submit"
          disabled={loading || isBiddingDisabled}
          className="w-full py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
        >
          {loading ? (
            <span>Evaluating Extension Strategy...</span>
          ) : isBiddingDisabled ? (
            <span>Bidding Unavailable ({auctionStatus})</span>
          ) : (
            <>
              <Send className="w-4 h-4" />
              <span>Submit Carrier Quote</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}

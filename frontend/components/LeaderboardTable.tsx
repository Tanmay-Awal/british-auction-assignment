"use client";

import { BidItem } from "@/lib/api";
import { Trophy, Medal, Award, Calendar, Timer, Ship } from "lucide-react";

interface LeaderboardTableProps {
  bids: BidItem[];
  auctionStatus: string;
}

export default function LeaderboardTable({ bids, auctionStatus }: LeaderboardTableProps) {
  const getRankBadge = (rank?: number) => {
    if (rank === 1) {
      return (
        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-50 text-amber-700 border border-amber-300 shadow-sm">
          <Trophy className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
          <span>L1 (Leader)</span>
        </span>
      );
    }
    if (rank === 2) {
      return (
        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-300">
          <Medal className="w-3.5 h-3.5 text-slate-500" />
          <span>L2</span>
        </span>
      );
    }
    if (rank === 3) {
      return (
        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50/80 text-amber-800 border border-amber-200">
          <Award className="w-3.5 h-3.5 text-amber-700" />
          <span>L3</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600">
        L{rank || "-"}
      </span>
    );
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
      <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h3 className="font-extrabold text-base text-slate-900 flex items-center space-x-2">
            <Ship className="w-4 h-4 text-blue-600" />
            <span>Supplier Quote Leaderboard</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Quotes ranked lowest total price first. Earlier timestamp breaks price ties.
          </p>
        </div>
        <div className="text-xs font-bold px-2.5 py-1 rounded-md bg-slate-100 text-slate-700">
          {bids.length} {bids.length === 1 ? "Bid" : "Bids"} Received
        </div>
      </div>

      {bids.length === 0 ? (
        <div className="p-12 text-center">
          <Ship className="w-10 h-10 text-slate-300 mx-auto mb-2.5" />
          <h4 className="text-xs font-bold text-slate-700">No Quotes Submitted Yet</h4>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Use the form below to simulate carrier bids and watch British Auction extensions trigger live!
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-700">
            <thead className="bg-slate-50/80 text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-200 font-bold">
              <tr>
                <th className="py-3 px-4">Rank</th>
                <th className="py-3 px-4">Carrier Name</th>
                <th className="py-3 px-4 text-right">Freight Charges</th>
                <th className="py-3 px-4 text-right">Origin / Dest</th>
                <th className="py-3 px-4 text-right">Total Quote</th>
                <th className="py-3 px-4 text-center">Transit</th>
                <th className="py-3 px-4 text-center">Validity</th>
                <th className="py-3 px-4 text-right">Bid Placed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {bids.map((bid, index) => {
                const isL1 = bid.current_rank === 1;
                return (
                  <tr
                    key={bid.id}
                    className={`transition-colors ${
                      isL1
                        ? "bg-amber-50/40 hover:bg-amber-50/70"
                        : index % 2 === 0
                        ? "bg-white hover:bg-slate-50/60"
                        : "bg-slate-50/30 hover:bg-slate-50/60"
                    }`}
                  >
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {getRankBadge(bid.current_rank)}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <span>{bid.carrier_name}</span>
                        {isL1 && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Current Winner
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-slate-700">
                      ${Number(bid.freight_charges).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-xs text-slate-500">
                      <span>${Number(bid.origin_charges).toFixed(0)}</span>
                      <span className="text-slate-300 mx-1">/</span>
                      <span>${Number(bid.destination_charges).toFixed(0)}</span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-extrabold text-base whitespace-nowrap">
                      <span className={isL1 ? "text-amber-700 font-extrabold" : "text-slate-900"}>
                        ${Number(bid.total_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center text-xs text-slate-600 whitespace-nowrap">
                      <div className="inline-flex items-center space-x-1">
                        <Timer className="w-3.5 h-3.5 text-slate-400" />
                        <span>{bid.transit_time_days} days</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-center text-xs text-slate-500 whitespace-nowrap">
                      <div className="inline-flex items-center space-x-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{bid.quote_validity}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right text-xs text-slate-500 font-mono whitespace-nowrap">
                      {new Date(bid.created_at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit", second: "2-digit", hour12: true })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

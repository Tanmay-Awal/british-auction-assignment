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
        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-black bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm shadow-amber-500/20">
          <Trophy className="w-3.5 h-3.5 text-amber-400" />
          <span>L1 (Leader)</span>
        </span>
      );
    }
    if (rank === 2) {
      return (
        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-300/10 text-slate-300 border border-slate-400/30">
          <Medal className="w-3.5 h-3.5 text-slate-300" />
          <span>L2</span>
        </span>
      );
    }
    if (rank === 3) {
      return (
        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-700/20 text-amber-400 border border-amber-700/30">
          <Award className="w-3.5 h-3.5 text-amber-600" />
          <span>L3</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-800 text-slate-400">
        L{rank || "-"}
      </span>
    );
  };

  return (
    <div className="bg-slate-900/90 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
      <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
        <div>
          <h3 className="font-bold text-lg text-white flex items-center space-x-2">
            <Ship className="w-5 h-5 text-indigo-400" />
            <span>Supplier Quote Leaderboard</span>
          </h3>
          <p className="text-xs text-slate-400">
            Quotes ranked lowest total price first. Tie-breaker: earlier submission timestamp.
          </p>
        </div>
        <div className="text-xs font-semibold px-2.5 py-1 rounded-md bg-slate-800 text-slate-300">
          {bids.length} {bids.length === 1 ? "Bid" : "Bids"} Received
        </div>
      </div>

      {bids.length === 0 ? (
        <div className="p-12 text-center">
          <Ship className="w-12 h-12 text-slate-700 mx-auto mb-3" />
          <h4 className="text-sm font-semibold text-slate-300">No Quotes Submitted Yet</h4>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Use the quote submission form to place bids as different carriers and watch the British Auction extension engine trigger live!
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950/60 text-xs uppercase tracking-wider text-slate-400 border-b border-slate-800 font-semibold">
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
            <tbody className="divide-y divide-slate-800/60">
              {bids.map((bid, index) => {
                const isL1 = bid.current_rank === 1;
                return (
                  <tr
                    key={bid.id}
                    className={`transition-colors ${
                      isL1
                        ? "bg-amber-500/5 hover:bg-amber-500/10"
                        : index % 2 === 0
                        ? "bg-transparent hover:bg-slate-800/40"
                        : "bg-slate-950/20 hover:bg-slate-800/40"
                    }`}
                  >
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {getRankBadge(bid.current_rank)}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-white whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <span>{bid.carrier_name}</span>
                        {isL1 && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            Current Winner
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-slate-300">
                      ${Number(bid.freight_charges).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-xs text-slate-400">
                      <span>${Number(bid.origin_charges).toFixed(0)}</span>
                      <span className="text-slate-600 mx-1">/</span>
                      <span>${Number(bid.destination_charges).toFixed(0)}</span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-base text-white whitespace-nowrap">
                      <span className={isL1 ? "text-amber-300 font-extrabold" : "text-white"}>
                        ${Number(bid.total_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center text-xs text-slate-300 whitespace-nowrap">
                      <div className="inline-flex items-center space-x-1">
                        <Timer className="w-3.5 h-3.5 text-slate-500" />
                        <span>{bid.transit_time_days} days</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-center text-xs text-slate-400 whitespace-nowrap">
                      <div className="inline-flex items-center space-x-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                        <span>{bid.quote_validity}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right text-xs text-slate-400 font-mono whitespace-nowrap">
                      {new Date(bid.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
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

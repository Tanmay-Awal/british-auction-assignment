"use client";

import { ActivityLogItem } from "@/lib/api";
import { Zap, Send, ShieldAlert, Sparkles, Clock } from "lucide-react";

interface ActivityFeedProps {
  logs: ActivityLogItem[];
  compact?: boolean;
}

export default function ActivityFeed({ logs, compact = false }: ActivityFeedProps) {
  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case "AUCTION_EXTENDED":
        return <Zap className="w-4 h-4 text-amber-400" />;
      case "BID_SUBMITTED":
        return <Send className="w-3.5 h-3.5 text-indigo-400" />;
      case "AUCTION_FORCE_CLOSED":
        return <ShieldAlert className="w-4 h-4 text-rose-400" />;
      case "RFQ_CREATED":
        return <Sparkles className="w-4 h-4 text-emerald-400" />;
      default:
        return <Clock className="w-4 h-4 text-slate-400" />;
    }
  };

  const getEventBadge = (eventType: string) => {
    switch (eventType) {
      case "AUCTION_EXTENDED":
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
            ⚡ Time Extended
          </span>
        );
      case "BID_SUBMITTED":
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
            Quote Placed
          </span>
        );
      case "AUCTION_FORCE_CLOSED":
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/30">
            Forced Close
          </span>
        );
      case "RFQ_CREATED":
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            RFQ Created
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider bg-slate-800 text-slate-400">
            {eventType}
          </span>
        );
    }
  };

  return (
    <div className="bg-slate-900/90 rounded-2xl border border-slate-800 overflow-hidden shadow-xl flex flex-col h-full">
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <div>
          <h3 className="font-bold text-base text-white flex items-center space-x-2">
            <Clock className="w-4 h-4 text-indigo-400" />
            <span>Auction Activity & Extension Log</span>
          </h3>
          <p className="text-xs text-slate-400">
            Immutable chronological audit feed of bid events and dynamic extensions.
          </p>
        </div>
        <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
          {logs.length} Events
        </span>
      </div>

      <div className="p-4 overflow-y-auto max-h-[540px] space-y-3 divide-y divide-slate-800/40">
        {logs.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-500">
            No activity logged yet.
          </div>
        ) : (
          logs.map((log) => {
            const isExtension = log.event_type === "AUCTION_EXTENDED";
            return (
              <div
                key={log.id}
                className={`pt-3 first:pt-0 rounded-lg p-2.5 transition-colors ${
                  isExtension ? "bg-amber-500/10 border border-amber-500/20" : "hover:bg-slate-800/30"
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div className="flex items-center space-x-2">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                        isExtension ? "bg-amber-500/20" : "bg-slate-800"
                      }`}
                    >
                      {getEventIcon(log.event_type)}
                    </div>
                    {getEventBadge(log.event_type)}
                    <span className="text-xs font-semibold text-slate-300 truncate max-w-[140px]">
                      {log.actor}
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-500 shrink-0">
                    {new Date(log.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                  </span>
                </div>

                <p className={`text-xs leading-relaxed ${isExtension ? "text-amber-200 font-medium" : "text-slate-300"}`}>
                  {log.description}
                </p>

                {isExtension && log.previous_close_time && log.new_close_time && (
                  <div className="mt-2 pt-2 border-t border-amber-500/20 flex items-center justify-between text-[11px] font-mono text-amber-300/90">
                    <span>Previous: {new Date(log.previous_close_time).toLocaleTimeString()}</span>
                    <span>→</span>
                    <span className="font-bold underline">New: {new Date(log.new_close_time).toLocaleTimeString()}</span>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

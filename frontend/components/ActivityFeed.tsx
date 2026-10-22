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
        return <Zap className="w-3.5 h-3.5 text-amber-600 fill-amber-500" />;
      case "BID_SUBMITTED":
        return <Send className="w-3 h-3 text-blue-600" />;
      case "AUCTION_FORCE_CLOSED":
        return <ShieldAlert className="w-3.5 h-3.5 text-red-600" />;
      case "RFQ_CREATED":
        return <Sparkles className="w-3.5 h-3.5 text-emerald-600 fill-emerald-500" />;
      default:
        return <Clock className="w-3.5 h-3.5 text-slate-500" />;
    }
  };

  const getEventBadge = (eventType: string) => {
    switch (eventType) {
      case "AUCTION_EXTENDED":
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-300">
            ⚡ Time Extended
          </span>
        );
      case "BID_SUBMITTED":
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200">
            Quote Placed
          </span>
        );
      case "AUCTION_FORCE_CLOSED":
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-red-50 text-red-700 border border-red-200">
            Forced Close
          </span>
        );
      case "RFQ_CREATED":
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
            RFQ Created
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider bg-slate-100 text-slate-600">
            {eventType}
          </span>
        );
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm flex flex-col h-full">
      <div className="p-4 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h3 className="font-extrabold text-base text-slate-900 flex items-center space-x-2">
            <Clock className="w-4 h-4 text-blue-600" />
            <span>Auction Activity & Extension Log</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Immutable chronological audit feed of bid events and dynamic extensions.
          </p>
        </div>
        <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
          {logs.length} Events
        </span>
      </div>

      <div className="p-4 overflow-y-auto max-h-[580px] space-y-2.5 divide-y divide-slate-100">
        {logs.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-400">
            No activity logged yet.
          </div>
        ) : (
          logs.map((log) => {
            const isExtension = log.event_type === "AUCTION_EXTENDED";
            return (
              <div
                key={log.id}
                className={`pt-2.5 first:pt-0 rounded-xl p-3 transition-colors ${
                  isExtension ? "bg-amber-50/60 border border-amber-200/80" : "bg-slate-50/50 hover:bg-slate-50"
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div className="flex items-center space-x-2">
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                        isExtension ? "bg-amber-100" : "bg-slate-200"
                      }`}
                    >
                      {getEventIcon(log.event_type)}
                    </div>
                    {getEventBadge(log.event_type)}
                    <span className="text-xs font-bold text-slate-900 truncate max-w-[140px]">
                      {log.actor}
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-400 shrink-0">
                    {new Date(log.created_at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit", second: "2-digit", hour12: true })}
                  </span>
                </div>

                <p className={`text-xs leading-relaxed ${isExtension ? "text-amber-950 font-medium" : "text-slate-700"}`}>
                  {log.description}
                </p>

                {isExtension && log.previous_close_time && log.new_close_time && (
                  <div className="mt-2 pt-2 border-t border-amber-200/60 flex items-center justify-between text-[11px] font-mono text-amber-900">
                    <span>Previous: {new Date(log.previous_close_time).toLocaleTimeString([], { hour: "numeric", minute: "2-digit", hour12: true })}</span>
                    <span>→</span>
                    <span className="font-extrabold underline">New: {new Date(log.new_close_time).toLocaleTimeString([], { hour: "numeric", minute: "2-digit", hour12: true })}</span>
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

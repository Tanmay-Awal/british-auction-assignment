"use client";

import { useEffect, useState } from "react";
import { Clock, Zap, AlertTriangle, CheckCircle2 } from "lucide-react";

interface CountdownTimerProps {
  bidCloseTime: string;
  forcedBidCloseTime: string;
  triggerWindowMinutes: number;
  extensionDurationMinutes: number;
  status: string;
  compact?: boolean;
}

export default function CountdownTimer({
  bidCloseTime,
  forcedBidCloseTime,
  triggerWindowMinutes,
  extensionDurationMinutes,
  status,
  compact = false,
}: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<{
    totalSeconds: number;
    hours: number;
    minutes: number;
    seconds: number;
    inTriggerWindow: boolean;
    isPastClose: boolean;
    isPastForcedClose: boolean;
  }>({
    totalSeconds: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    inTriggerWindow: false,
    isPastClose: false,
    isPastForcedClose: false,
  });

  useEffect(() => {
    const calculateTime = () => {
      const now = new Date().getTime();
      const closeTime = new Date(bidCloseTime).getTime();
      const forcedCloseTime = new Date(forcedBidCloseTime).getTime();
      const triggerWindowMs = triggerWindowMinutes * 60 * 1000;
      const triggerStart = closeTime - triggerWindowMs;

      const diff = Math.max(0, Math.floor((closeTime - now) / 1000));
      const inWindow = now >= triggerStart && now < closeTime;
      const isPast = now >= closeTime;
      const isPastForced = now >= forcedCloseTime;

      const hours = Math.floor(diff / 3600);
      const minutes = Math.floor((diff % 3600) / 60);
      const seconds = diff % 60;

      setTimeLeft({
        totalSeconds: diff,
        hours,
        minutes,
        seconds,
        inTriggerWindow: inWindow,
        isPastClose: isPast,
        isPastForcedClose: isPastForced,
      });
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [bidCloseTime, forcedBidCloseTime, triggerWindowMinutes]);

  const pad = (n: number) => n.toString().padStart(2, "0");

  if (status === "FORCE_CLOSED" || timeLeft.isPastForcedClose) {
    return (
      <div className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/30`}>
        <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
        <span>FORCE CLOSED (Hard Stop Reached)</span>
      </div>
    );
  }

  if (status === "CLOSED" || timeLeft.isPastClose) {
    return (
      <div className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-400 border border-slate-700`}>
        <CheckCircle2 className="w-3.5 h-3.5 text-slate-400" />
        <span>AUCTION CLOSED</span>
      </div>
    );
  }

  if (compact) {
    return (
      <div className="flex items-center space-x-2">
        <span
          className={`font-mono font-bold text-sm ${
            timeLeft.inTriggerWindow ? "text-amber-400 animate-pulse" : "text-slate-200"
          }`}
        >
          {timeLeft.hours > 0 && `${pad(timeLeft.hours)}:`}
          {pad(timeLeft.minutes)}:{pad(timeLeft.seconds)}
        </span>
        {timeLeft.inTriggerWindow && (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
            <Zap className="w-2.5 h-2.5 mr-0.5 text-amber-400" />
            TRIGGER WINDOW
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-slate-900/90 border border-slate-800 p-4 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              timeLeft.inTriggerWindow
                ? "bg-amber-500/20 text-amber-400 border border-amber-500/30 shadow-md shadow-amber-500/10 animate-pulse"
                : "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
            }`}
          >
            {timeLeft.inTriggerWindow ? <Zap className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
          </div>
          <div>
            <div className="text-xs uppercase tracking-wider font-semibold text-slate-400">
              {timeLeft.inTriggerWindow ? "Trigger Window Active" : "Time Remaining to Close"}
            </div>
            <div className="flex items-baseline space-x-1 font-mono font-black text-2xl sm:text-3xl tracking-tight text-white">
              {timeLeft.hours > 0 && (
                <>
                  <span>{pad(timeLeft.hours)}</span>
                  <span className="text-xs text-slate-500 font-sans pr-1">h</span>
                </>
              )}
              <span>{pad(timeLeft.minutes)}</span>
              <span className="text-xs text-slate-500 font-sans pr-1">m</span>
              <span className={timeLeft.inTriggerWindow ? "text-amber-400" : "text-indigo-400"}>
                {pad(timeLeft.seconds)}
              </span>
              <span className="text-xs text-slate-500 font-sans">s</span>
            </div>
          </div>
        </div>

        {timeLeft.inTriggerWindow ? (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg px-3 py-2 text-xs text-amber-300 flex items-center space-x-2">
            <Zap className="w-4 h-4 text-amber-400 shrink-0 animate-bounce" />
            <div>
              <p className="font-bold">⚡ Dynamic Extension Active</p>
              <p className="text-slate-400 text-[11px]">
                Valid bids will push close time back by <strong>+{extensionDurationMinutes} mins</strong> (never exceeding Forced Close).
              </p>
            </div>
          </div>
        ) : (
          <div className="text-xs text-slate-400 border border-slate-800 bg-slate-950/50 rounded-lg px-3 py-2">
            <div>
              Trigger Window: <strong className="text-slate-200">Last {triggerWindowMinutes} mins</strong>
            </div>
            <div>
              Extension Duration: <strong className="text-slate-200">+{extensionDurationMinutes} mins</strong>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

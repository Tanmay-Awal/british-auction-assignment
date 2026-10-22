"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Anchor, ShieldCheck, PlusCircle, LayoutDashboard, Terminal } from "lucide-react";

export default function Navbar() {
  const [apiOnline, setApiOnline] = useState<boolean | null>(null);

  useEffect(() => {
    fetch("http://localhost:8000/health")
      .then((res) => {
        if (res.ok) setApiOnline(true);
        else setApiOnline(false);
      })
      .catch(() => setApiOnline(false));
  }, []);

  return (
    <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25 group-hover:scale-105 transition-transform">
              <Anchor className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg text-white tracking-tight">GoComet</span>
                <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  British Auction
                </span>
              </div>
              <p className="text-xs text-slate-400">Dynamic RFQ Procurement System</p>
            </div>
          </Link>
        </div>

        <nav className="flex items-center space-x-4">
          <Link
            href="/"
            className="flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors"
          >
            <LayoutDashboard className="w-4 h-4 text-slate-400" />
            <span>Dashboard</span>
          </Link>

          <Link
            href="/rfqs/create"
            className="flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/25 transition-all hover:scale-102"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create British RFQ</span>
          </Link>

          <a
            href="http://localhost:8000/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden md:flex items-center space-x-2 px-3 py-2 rounded-lg text-xs font-mono text-slate-400 hover:text-slate-200 border border-slate-800 hover:border-slate-700 hover:bg-slate-900 transition-colors"
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Swagger /docs</span>
          </a>

          <div className="flex items-center space-x-2 pl-3 border-l border-slate-800 text-xs">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                apiOnline === true
                  ? "bg-emerald-400 shadow-sm shadow-emerald-400/50 animate-pulse"
                  : apiOnline === false
                  ? "bg-rose-500"
                  : "bg-amber-400"
              }`}
            />
            <span className="text-slate-400 hidden sm:inline">
              {apiOnline === true ? "FastAPI Online" : apiOnline === false ? "Offline" : "Connecting..."}
            </span>
          </div>
        </nav>
      </div>
    </header>
  );
}

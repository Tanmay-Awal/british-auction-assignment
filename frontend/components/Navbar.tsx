"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { PlusCircle, LayoutGrid, Code2, Anchor, User } from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();
  const [apiOnline, setApiOnline] = useState<boolean | null>(null);

  useEffect(() => {
    fetch("http://localhost:8000/health")
      .then((res) => {
        if (res.ok) setApiOnline(true);
        else setApiOnline(false);
      })
      .catch(() => setApiOnline(false));
  }, []);

  const isDashboard = pathname === "/" || pathname.startsWith("/rfqs/");

  return (
    <header className="border-b border-slate-200 bg-white sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <div className="flex items-center space-x-3">
          <Link href="/" className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm">
              <Anchor className="w-5 h-5 fill-white" />
            </div>
            <span className="font-extrabold text-xl text-slate-900 tracking-tight">GoComet</span>
          </Link>
          <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-blue-50 text-blue-600 border border-blue-200">
            British Auction
          </span>
        </div>

        {/* Navigation & Action Items matching screenshot */}
        <div className="flex items-center space-x-6">
          <Link
            href="/"
            className={`flex items-center space-x-1.5 text-sm font-semibold transition-colors relative py-5 ${
              isDashboard ? "text-slate-900 font-bold" : "text-slate-500 hover:text-slate-900"
            }`}
          >
            <LayoutGrid className="w-4 h-4 text-slate-600" />
            <span>Dashboard</span>
            {isDashboard && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />
            )}
          </Link>

          <Link
            href="/rfqs/create"
            className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-lg text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create British RFQ</span>
          </Link>

          <a
            href="http://localhost:8000/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden md:flex items-center space-x-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
          >
            <Code2 className="w-4 h-4 text-slate-500" />
            <span>Swagger Docs</span>
          </a>

          <div className="flex items-center space-x-1.5 text-xs font-semibold">
            <span
              className={`w-2 h-2 rounded-full ${
                apiOnline === true ? "bg-emerald-500" : apiOnline === false ? "bg-rose-500" : "bg-amber-400"
              }`}
            />
            <span className="text-slate-700 text-xs">
              {apiOnline === true ? "FastAPI Online" : apiOnline === false ? "Offline" : "Connecting..."}
            </span>
          </div>

          {/* User Avatar Circle from Screenshot */}
          <div className="w-8 h-8 rounded-full border border-slate-300 flex items-center justify-center text-slate-500 hover:text-slate-800 hover:border-slate-400 cursor-pointer transition-colors bg-slate-50">
            <User className="w-4 h-4" />
          </div>
        </div>
      </div>
    </header>
  );
}

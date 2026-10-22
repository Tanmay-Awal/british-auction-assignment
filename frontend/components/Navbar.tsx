"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PlusCircle, LayoutGrid, Anchor, User } from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();
  const isDashboard = pathname === "/" || pathname.startsWith("/rfqs/");

  return (
    <header className="border-b border-slate-200 bg-white sticky top-0 z-50">
      <div className="max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-10 h-16 flex items-center justify-between">
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

        {/* Navigation & Action Items */}
        <div className="flex items-center space-x-5">
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

          {/* User Avatar Circle */}
          <div className="w-8 h-8 rounded-full border border-slate-300 flex items-center justify-center text-slate-500 hover:text-slate-800 hover:border-slate-400 cursor-pointer transition-colors bg-slate-50">
            <User className="w-4 h-4" />
          </div>
        </div>
      </div>
    </header>
  );
}

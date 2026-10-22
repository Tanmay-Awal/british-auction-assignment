"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { PlusCircle, LayoutGrid, Anchor, Sun, Moon } from "lucide-react";

const subscribeTheme = (callback: () => void) => {
  const observer = new MutationObserver(callback);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  window.addEventListener("storage", callback);
  return () => {
    observer.disconnect();
    window.removeEventListener("storage", callback);
  };
};

const getThemeSnapshot = () => {
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
};

const getServerSnapshot = () => "light" as const;

export default function Navbar() {
  const pathname = usePathname();
  const isDashboard = pathname === "/" || pathname.startsWith("/rfqs/");
  const theme = useSyncExternalStore(subscribeTheme, getThemeSnapshot, getServerSnapshot);

  const toggleTheme = () => {
    const isDark = document.documentElement.classList.contains("dark");
    if (isDark) {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    } else {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    }
  };

  return (
    <header className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 sticky top-0 z-50 transition-colors">
      <div className="max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-10 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <div className="flex items-center space-x-3">
          <Link href="/" className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm">
              <Anchor className="w-5 h-5 fill-white" />
            </div>
            <span className="font-extrabold text-xl text-slate-900 dark:text-white tracking-tight">GoComet</span>
          </Link>
          <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
            British Auction
          </span>
        </div>

        {/* Navigation & Action Items */}
        <div className="flex items-center space-x-4 sm:space-x-5">
          <Link
            href="/"
            className={`flex items-center space-x-1.5 text-sm font-semibold transition-colors relative py-5 ${
              isDashboard
                ? "text-slate-900 dark:text-white font-bold"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
            }`}
          >
            <LayoutGrid className="w-4 h-4 text-slate-600 dark:text-slate-400" />
            <span>Dashboard</span>
            {isDashboard && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />
            )}
          </Link>

          {/* Theme Toggle Button */}
          <button
            type="button"
            onClick={toggleTheme}
            title={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
            aria-label="Toggle dark theme"
            className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-blue-600 flex items-center justify-center"
          >
            {theme === "dark" ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-slate-600" />
            )}
          </button>

          <Link
            href="/rfqs/create"
            className="inline-flex items-center space-x-1.5 px-3.5 sm:px-4 py-2 rounded-lg text-sm font-semibold bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white shadow-sm transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span className="hidden sm:inline">Create British RFQ</span>
            <span className="sm:hidden">Create</span>
          </Link>
        </div>
      </div>
    </header>
  );
}

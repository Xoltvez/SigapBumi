"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Search,
  Calendar,
  Flame,
  HeartPulse,
  Shield,
  LifeBuoy,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronDown,
  X,
} from "lucide-react";

interface AdminTopbarProps {
  isSidebarCollapsed: boolean;
  onToggleSidebar: () => void;
  activeUnit: string;
  onSelectUnit: (unit: string) => void;
  activeSosCount?: number;
  isLiveConnected?: boolean;
}

export function AdminTopbar({
  isSidebarCollapsed,
  onToggleSidebar,
  activeUnit,
  onSelectUnit,
}: AdminTopbarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlCari = searchParams.get("cari") || "";

  const [searchQuery, setSearchQuery] = useState(urlCari);
  const [formattedDate, setFormattedDate] = useState("1 Nov 2026");

  useEffect(() => {
    setSearchQuery(urlCari);
  }, [urlCari]);

  useEffect(() => {
    try {
      const now = new Date();
      const dateText = new Intl.DateTimeFormat("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }).format(now);
      setFormattedDate(dateText);
    } catch {
      // fallback
    }
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = searchQuery.trim();
    if (clean) {
      router.push(`/admin/laporan?cari=${encodeURIComponent(clean)}`);
    } else {
      router.push(`/admin/laporan`);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    router.push("/admin/laporan");
  };

  const getUnitIcon = (unit: string) => {
    switch (unit) {
      case "damkar":
        return <Flame className="w-3.5 h-3.5 text-orange-400" />;
      case "medis":
        return <HeartPulse className="w-3.5 h-3.5 text-rose-400" />;
      case "polisi":
        return <Shield className="w-3.5 h-3.5 text-sky-400" />;
      default:
        return <LifeBuoy className="w-3.5 h-3.5 text-amber-400" />;
    }
  };

  return (
    <header className="h-16 bg-[#131722] border-b border-slate-800 px-4 sm:px-6 flex items-center justify-between gap-3 sticky top-0 z-20 shadow-sm select-none font-sans">
      {/* Left: Mobile Toggle, Date Pill, Search Bar */}
      <div className="flex items-center gap-3 flex-1 max-w-2xl">
        {/* Mobile / Responsive Sidebar Toggle Button */}
        <button
          type="button"
          onClick={onToggleSidebar}
          aria-label={isSidebarCollapsed ? "Perluas Sidebar" : "Ciutkan Sidebar"}
          className="p-1.5 rounded-lg border border-slate-600/90 bg-slate-900/95 text-slate-300 hover:text-white hover:border-slate-400 transition-colors shrink-0 shadow-sm"
        >
          {isSidebarCollapsed ? (
            <PanelLeftOpen className="w-4 h-4" />
          ) : (
            <PanelLeftClose className="w-4 h-4" />
          )}
        </button>

        {/* Date Pill Badge with visible stroke */}
        <div className="hidden sm:inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/95 border border-slate-600/90 text-xs font-semibold text-slate-200 shrink-0 shadow-sm">
          <Calendar className="w-3.5 h-3.5 text-amber-400" />
          <span>{formattedDate}</span>
        </div>

        {/* Search Bar with visible prominent stroke */}
        <form onSubmit={handleSearchSubmit} className="relative w-full max-w-sm sm:max-w-md">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari bencana (contoh: banjir) atau daerah..."
            className="w-full h-9 pl-9 pr-8 rounded-full border border-slate-600/90 hover:border-slate-400 focus:border-amber-400 focus:ring-1 focus:ring-amber-400/40 bg-slate-900/95 text-xs text-white placeholder:text-slate-400 focus:outline-none transition-all font-sans shadow-sm"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-0.5"
              title="Hapus pencarian"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </form>
      </div>

      {/* Right: Agency Unit Selector with visible prominent stroke */}
      <div className="flex items-center">
        <div className="relative">
          <select
            value={activeUnit}
            onChange={(e) => onSelectUnit(e.target.value)}
            className="h-9 pl-8 pr-7 rounded-full border border-slate-600/90 hover:border-slate-400 bg-slate-900/95 text-xs font-semibold text-white focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/40 cursor-pointer appearance-none shadow-sm transition-all"
          >
            <option value="semua" className="bg-[#131722] text-white">
              Semua Posko
            </option>
            <option value="bnpb_bpbd" className="bg-[#131722] text-white">
              BNPB / BPBD
            </option>
            <option value="damkar" className="bg-[#131722] text-white">
              Dinas Damkar
            </option>
            <option value="medis" className="bg-[#131722] text-white">
              Medis / Dinkes
            </option>
            <option value="polisi" className="bg-[#131722] text-white">
              Polri
            </option>
          </select>
          <div className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
            {getUnitIcon(activeUnit)}
          </div>
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
            <ChevronDown className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>
    </header>
  );
}


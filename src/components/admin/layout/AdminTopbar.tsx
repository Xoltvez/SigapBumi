"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  Calendar,
  HelpCircle,
  Bell,
  Plus,
  Flame,
  HeartPulse,
  Shield,
  LifeBuoy,
  PanelLeftClose,
  PanelLeftOpen,
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
  activeSosCount = 0,
  isLiveConnected = true,
}: AdminTopbarProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [formattedDate, setFormattedDate] = useState("1 Nov 2026");

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
    const clean = searchQuery.trim().toUpperCase();
    if (clean) {
      router.push(`/admin/laporan?cari=${encodeURIComponent(clean)}`);
    }
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
    <header className="h-16 bg-[#131722] border-b border-slate-800 px-4 sm:px-6 flex items-center justify-between gap-3 sticky top-0 z-20 shadow-sm select-none">
      {/* Left: Mobile Toggle, Date Pill, Search Bar */}
      <div className="flex items-center gap-3 flex-1 max-w-2xl">
        {/* Mobile / Responsive Sidebar Toggle Button */}
        <button
          type="button"
          onClick={onToggleSidebar}
          aria-label={isSidebarCollapsed ? "Perluas Sidebar" : "Ciutkan Sidebar"}
          className="p-1.5 rounded-lg border border-slate-800 bg-slate-900/80 text-slate-400 hover:text-white hover:border-slate-700 transition-colors shrink-0"
        >
          {isSidebarCollapsed ? (
            <PanelLeftOpen className="w-4 h-4" />
          ) : (
            <PanelLeftClose className="w-4 h-4" />
          )}
        </button>

        {/* Date Pill Badge (like screenshot [ 📅 1 Nov 2026 ]) */}
        <div className="hidden sm:inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800 text-xs font-medium text-slate-300 shrink-0">
          <Calendar className="w-3.5 h-3.5 text-amber-400" />
          <span>{formattedDate}</span>
        </div>

        {/* Search Bar (like screenshot [ 🔍 Cari ... ]) */}
        <form onSubmit={handleSearchSubmit} className="relative w-full max-w-sm">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari kode laporan atau checklist darurat..."
            className="w-full h-9 pl-9 pr-3 rounded-lg border border-slate-800 bg-slate-900/60 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/30 transition-all font-sans"
          />
        </form>
      </div>

      {/* Right: Quick Action Button, Circle Icons, Unit Selector */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* Quick Action Button (like screenshot [+ Booking Baru] in amber) */}
        <Link
          href="/admin/laporan"
          className="inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-all shadow-sm shrink-0"
        >
          <Plus className="w-3.5 h-3.5 stroke-[3]" />
          <span>Laporan Baru</span>
        </Link>

        {/* Circular Help Button (like screenshot [?]) */}
        <button
          type="button"
          title="Bantuan & Panduan Posko"
          className="w-8 h-8 rounded-full bg-slate-900/80 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 flex items-center justify-center transition-all shrink-0"
        >
          <HelpCircle className="w-4 h-4" />
        </button>

        {/* Circular Bell Notification Button (like screenshot [🔔]) */}
        <Link
          href="/admin/sos"
          title="Notifikasi SOS & Laporan Baru"
          className="w-8 h-8 rounded-full bg-slate-900/80 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 flex items-center justify-center relative transition-all shrink-0"
        >
          <Bell className="w-4 h-4" />
          {activeSosCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 ring-2 ring-[#131722]" />
          )}
        </Link>

        {/* Agency Unit Selector */}
        <div className="hidden lg:flex items-center gap-1.5 pl-2 border-l border-slate-800">
          <div className="relative">
            <select
              value={activeUnit}
              onChange={(e) => onSelectUnit(e.target.value)}
              className="h-8 pl-7 pr-3 rounded-lg border border-slate-800 bg-slate-900/90 text-xs font-semibold text-slate-200 focus:outline-none focus:border-amber-500/50 cursor-pointer appearance-none"
            >
              <option value="semua">Semua Posko</option>
              <option value="bnpb_bpbd">BNPB / BPBD</option>
              <option value="damkar">Dinas Damkar</option>
              <option value="medis">Medis / Dinkes</option>
              <option value="polisi">Polri</option>
            </select>
            <div className="absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none">
              {getUnitIcon(activeUnit)}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}


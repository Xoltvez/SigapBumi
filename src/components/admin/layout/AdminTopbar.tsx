"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  FlaskConical,
  Radio,
  Flame,
  HeartPulse,
  Shield,
  LifeBuoy,
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
        return <Flame className="w-3.5 h-3.5 text-danger" />;
      case "medis":
        return <HeartPulse className="w-3.5 h-3.5 text-danger" />;
      case "polisi":
        return <Shield className="w-3.5 h-3.5 text-info" />;
      default:
        return <LifeBuoy className="w-3.5 h-3.5 text-primary" />;
    }
  };

  return (
    <header className="h-14 bg-surface border-b border-line px-4 flex items-center justify-between gap-4 sticky top-0 z-20 shadow-xs">
      {/* Left: Sidebar Toggle & Search Input */}
      <div className="flex items-center gap-3 flex-1 max-w-md">
        <button
          type="button"
          onClick={onToggleSidebar}
          aria-label={isSidebarCollapsed ? "Perluas Sidebar" : "Ciutkan Sidebar"}
          className="p-1.5 rounded-md hover:bg-bg text-ink-muted hover:text-ink transition-colors"
        >
          {isSidebarCollapsed ? (
            <PanelLeftOpen className="w-5 h-5" />
          ) : (
            <PanelLeftClose className="w-5 h-5" />
          )}
        </button>

        {/* Global Tracking Code Search */}
        <form onSubmit={handleSearchSubmit} className="relative w-full">
          <Search className="w-4 h-4 text-ink-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari kode laporan (LPR-XXXXXX)..."
            className="w-full h-9 pl-9 pr-3 rounded-md border border-line bg-bg text-xs font-mono uppercase placeholder:normal-case placeholder:font-sans text-ink focus-visible:outline-primary"
          />
        </form>
      </div>

      {/* Right: Status Indicators, Simulation Badge, SOS, Unit Selector */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* Connection Indicator */}
        <div className="hidden md:flex items-center gap-1.5 text-xs text-ink-soft">
          <span
            className={`w-2 h-2 rounded-full ${
              isLiveConnected ? "bg-success animate-pulse" : "bg-warning"
            }`}
          />
          <span className="font-medium text-[11px]">
            {isLiveConnected ? "Terhubung" : "Menyambung..."}
          </span>
        </div>

        {/* Mandatory Simulation Badge (agent-admin.md 1.4 & design-admin.md 6) */}
        <div
          title="Sistem ini adalah prototipe simulasi dashboard penanggulangan bencana dan belum terhubung ke sistem resmi BNPB."
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-warning-soft text-warning-text border border-warning/30 select-none"
        >
          <FlaskConical className="w-3.5 h-3.5 text-warning-text shrink-0" />
          <span>Simulasi</span>
        </div>

        {/* Active SOS Count Indicator */}
        <Link
          href="/admin/sos"
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold transition-all ${
            activeSosCount > 0
              ? "bg-danger text-white shadow-xs animate-pulse"
              : "bg-surface border border-line text-ink-muted hover:text-ink"
          }`}
        >
          <Radio className="w-3.5 h-3.5" />
          <span>SOS: {activeSosCount}</span>
        </Link>

        {/* Agency Unit Selector */}
        <div className="flex items-center gap-1.5 border-l border-line pl-2.5">
          <span className="hidden xl:inline text-[11px] font-semibold text-ink-muted">
            Unit:
          </span>
          <div className="relative">
            <select
              value={activeUnit}
              onChange={(e) => onSelectUnit(e.target.value)}
              className="h-8 pl-6 pr-2 rounded border border-line bg-surface text-xs font-semibold text-ink focus-visible:outline-primary cursor-pointer"
            >
              <option value="semua">Semua Posko Terpadu</option>
              <option value="bnpb_bpbd">BNPB / BPBD</option>
              <option value="damkar">Dinas Damkar</option>
              <option value="medis">Medis / Dinkes</option>
              <option value="polisi">Kepolisian (Polri)</option>
            </select>
            <div className="absolute left-1.5 top-1/2 -translate-y-1/2 pointer-events-none">
              {getUnitIcon(activeUnit)}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

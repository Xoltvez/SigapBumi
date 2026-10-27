"use client";

import React from "react";
import { ShieldCheck, Bell, UserCheck, Radio } from "lucide-react";

interface AdminTopbarProps {
  activeUnitName: string;
}

export function AdminTopbar({ activeUnitName }: AdminTopbarProps) {
  return (
    <header className="h-16 bg-surface border-b border-line px-6 flex items-center justify-between shrink-0">
      {/* Left: Agency Status Badge */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-success-soft border border-success/30 text-success-text text-xs font-bold">
          <span className="w-2 h-2 rounded-full bg-success animate-ping" />
          <span>Posko Siaga 24 Jam Aktif</span>
        </div>

        <div className="hidden sm:flex items-center gap-1.5 text-xs text-ink-muted">
          <span>Mode Unit:</span>
          <span className="font-bold text-ink bg-bg px-2 py-0.5 rounded border border-line">
            {activeUnitName}
          </span>
        </div>
      </div>

      {/* Right: Officer Profile & Actions */}
      <div className="flex items-center gap-4">
        {/* Quick Radio Live indicator */}
        <div className="flex items-center gap-1.5 text-xs font-semibold text-danger bg-danger-soft px-2.5 py-1 rounded-md border border-danger/20">
          <Radio className="w-3.5 h-3.5 animate-pulse" />
          <span className="hidden md:inline">Frekuensi Tanggap Darurat</span>
        </div>

        <button
          type="button"
          aria-label="Notifikasi Darurat"
          className="relative p-2 rounded-md hover:bg-bg text-ink-soft hover:text-ink transition-colors"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-danger" />
        </button>

        <div className="flex items-center gap-2 pl-3 border-l border-line text-left">
          <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold text-xs">
            <UserCheck className="w-4 h-4" />
          </div>
          <div className="hidden md:block">
            <p className="text-xs font-bold text-ink leading-tight">
              Piket Pusdalops
            </p>
            <p className="text-[11px] text-ink-muted flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-primary" />
              <span>Petugas BPBD</span>
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}

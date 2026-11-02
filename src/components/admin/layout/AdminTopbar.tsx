"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Calendar,
  ChevronDown,
  Bell,
  Volume2,
  VolumeX,
  Search,
} from "lucide-react";
import { useAdmin } from "@/components/layout/AdminShell";

interface AdminTopbarProps {
  isSidebarCollapsed?: boolean;
  onToggleSidebar?: () => void;
  activeUnit: string;
  onSelectUnit?: (unit: string) => void;
  activeSosCount?: number;
  isLiveConnected?: boolean;
  isSirenMuted?: boolean;
  onToggleSiren?: () => void;
  onTestSiren?: () => void;
}

export function AdminTopbar({
  activeUnit,
  onSelectUnit,
  isSirenMuted = false,
  onToggleSiren,
}: AdminTopbarProps) {
  const router = useRouter();
  const [urlCari, setUrlCari] = useState("");
  const { adminUser, logout } = useAdmin();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const q = new URLSearchParams(window.location.search).get("cari") || "";
      setUrlCari(q);
    }
  }, []);

  const [formattedDate, setFormattedDate] = useState("1 Nov 2026");
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

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

  return (
    <header className="h-20 bg-[#FAFBFC] border-b border-slate-200/90 px-6 sm:px-8 flex items-center justify-between gap-4 sticky top-0 z-20 shadow-[0_1px_3px_rgba(0,0,0,0.03)] select-none font-sans">
      {/* Left: Date Pill Dropdown & Search Bar positioned side by side */}
      <div className="flex items-center gap-3 sm:gap-3.5 flex-1 min-w-0">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-slate-200/90 shadow-2xs text-xs font-medium text-slate-700 hover:border-slate-300 transition-colors cursor-default shrink-0">
          <Calendar className="w-3.5 h-3.5 text-slate-500" />
          <span>{formattedDate}</span>
          <ChevronDown className="w-3 h-3 text-slate-400" />
        </div>

        {/* Global Search Pill directly next to date */}
        <div className="relative w-full max-w-sm lg:max-w-md hidden md:block">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            defaultValue={urlCari}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                const val = (e.target as HTMLInputElement).value;
                router.push(`/admin/laporan?cari=${encodeURIComponent(val)}`);
              }
            }}
            placeholder="Cari laporan berdasarkan lokasi, jenis, atau kata kunci..."
            className="w-full h-9 pl-9 pr-4 rounded-full border border-slate-200/90 bg-white text-xs placeholder:text-slate-400 text-slate-800 shadow-2xs focus:outline-none focus:ring-1 focus:ring-orange-500/30 transition-all"
          />
        </div>
      </div>

      {/* Right Controls: Siren Toggle, Unit Selector, Notification Bell, User Avatar */}
      <div className="flex items-center gap-3 sm:gap-4 shrink-0">
        {/* Siren Status & Mute/Unmute toggle */}
        {onToggleSiren && (
          <button
            type="button"
            onClick={onToggleSiren}
            title={
              isSirenMuted
                ? "Sirine Darurat Dibisukan (Klik untuk Mengaktifkan)"
                : "Sirine Darurat Aktif (Klik untuk Membisukan)"
            }
            className={`h-9 px-3 rounded-full border text-xs font-semibold inline-flex items-center gap-1.5 shadow-2xs transition-all ${
              isSirenMuted
                ? "border-slate-200 bg-white text-slate-400 hover:text-slate-600"
                : "border-red-200 bg-red-50 text-red-600 hover:bg-red-100"
            }`}
          >
            {isSirenMuted ? (
              <>
                <VolumeX className="w-3.5 h-3.5 text-slate-400" />
                <span className="hidden lg:inline">Sirine Mati</span>
              </>
            ) : (
              <>
                <Volume2 className="w-3.5 h-3.5 text-red-500 animate-pulse" />
                <span className="hidden lg:inline">Sirine Siaga</span>
              </>
            )}
          </button>
        )}

        {/* Agency Unit Badge (Terkunci sesuai role saat login, tidak bisa diganti di topbar) */}
        <div
          title={`Akses Terkunci: Masuk sebagai ${
            activeUnit === "damkar"
              ? "Dinas Pemadam Kebakaran"
              : activeUnit === "medis"
              ? "Dinas Kesehatan / Medis"
              : activeUnit === "polisi"
              ? "Kepolisian RI / Satgas Polri"
              : "BNPB / BPBD"
          }. Untuk mengganti instansi, silakan logout terlebih dahulu.`}
          className="h-9 px-3.5 rounded-full border border-slate-200/90 bg-white shadow-2xs flex items-center gap-2 text-xs font-semibold text-slate-800 select-none cursor-default"
        >
          <div className="w-5 h-5 rounded-full bg-linear-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-white text-[10px] shadow-2xs shrink-0">
            <span className="font-extrabold text-[9px] leading-none">▲</span>
          </div>
          <span>
            {activeUnit === "bnpb_bpbd"
              ? "BNPB / BPBD"
              : activeUnit === "damkar"
              ? "Dinas Damkar"
              : activeUnit === "medis"
              ? "Medis / Dinkes"
              : activeUnit === "polisi"
              ? "Polri"
              : "BNPB / BPBD"}
          </span>
        </div>

        {/* Admin Profile Pill */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsProfileMenuOpen((prev) => !prev)}
            className="flex items-center gap-2.5 p-1 pr-2.5 rounded-full hover:bg-slate-200/50 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-[#1E293B] text-white font-bold flex items-center justify-center text-xs shadow-xs">
              A
            </div>
            <span className="text-xs font-semibold text-slate-800 hidden sm:inline">
              {adminUser?.name?.split(" ")[0] || "Admin"}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {/* Profile Dropdown */}
          {isProfileMenuOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-lg py-1.5 z-50 text-xs">
              <div className="px-3.5 py-2 border-b border-slate-100">
                <p className="font-bold text-slate-800">{adminUser?.name || "Administrator"}</p>
                <p className="text-[11px] text-slate-400 truncate">{adminUser?.email || "admin@sigapbumi.id"}</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsProfileMenuOpen(false);
                  logout();
                }}
                className="w-full text-left px-3.5 py-2 text-red-600 hover:bg-red-50 font-medium transition-colors"
              >
                Keluar Sesi
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, MapPin, FileText, BookOpen } from "lucide-react";

export function BottomNav() {
  const pathname = usePathname();

  if (pathname.startsWith("/admin")) {
    return null;
  }

  const isHome = pathname === "/";
  const isPeta = pathname.startsWith("/peta");
  const isLapor = pathname.startsWith("/lapor");
  const isEdukasi = pathname.startsWith("/edukasi");

  const handleOpenSos = () => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("sigapbumi:open-sos"));
    }
  };

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 h-16 bg-surface border-t border-line px-2 flex items-center justify-around shadow-overlay">
      {/* 1. Beranda */}
      <Link
        href="/"
        className={`flex flex-col items-center justify-center w-14 h-full text-xs transition-colors ${
          isHome ? "text-primary font-bold" : "text-ink-soft hover:text-ink font-medium"
        }`}
      >
        <Home className="w-5 h-5 mb-0.5" />
        <span>Beranda</span>
        {isHome && <span className="w-1 h-1 rounded-full bg-primary mt-0.5" />}
      </Link>

      {/* 2. Peta */}
      <Link
        href="/peta"
        className={`flex flex-col items-center justify-center w-14 h-full text-xs transition-colors ${
          isPeta ? "text-primary font-bold" : "text-ink-soft hover:text-ink font-medium"
        }`}
      >
        <MapPin className="w-5 h-5 mb-0.5" />
        <span>Peta</span>
        {isPeta && <span className="w-1 h-1 rounded-full bg-primary mt-0.5" />}
      </Link>

      {/* 3. SOS Darurat (Center Prominent Button) */}
      <button
        type="button"
        onClick={handleOpenSos}
        aria-label="Panggilan Darurat SOS Warga"
        className="flex flex-col items-center justify-center -mt-5 cursor-pointer select-none group"
      >
        <div className="relative w-14 h-14 rounded-full bg-[#EF4444] text-white flex items-center justify-center shadow-[0_4px_16px_rgba(239,68,68,0.5)] border-2 border-white transition-transform group-hover:scale-105 group-active:scale-95">
          <span className="absolute inset-0 rounded-full bg-red-400 animate-ping opacity-35 pointer-events-none" />
          <span className="font-black text-sm tracking-wider font-mono">SOS</span>
        </div>
        <span className="text-[11px] mt-1 font-black text-red-600 tracking-wider">
          SOS
        </span>
      </button>

      {/* 4. Lapor (Menggantikan menu Lacak di Mobile) */}
      <Link
        href="/lapor"
        className={`flex flex-col items-center justify-center w-14 h-full text-xs transition-colors ${
          isLapor ? "text-primary font-bold" : "text-ink-soft hover:text-ink font-medium"
        }`}
      >
        <FileText className="w-5 h-5 mb-0.5" />
        <span>Lapor</span>
        {isLapor && <span className="w-1 h-1 rounded-full bg-primary mt-0.5" />}
      </Link>

      {/* 5. Edukasi */}
      <Link
        href="/edukasi"
        className={`flex flex-col items-center justify-center w-14 h-full text-xs transition-colors ${
          isEdukasi ? "text-primary font-bold" : "text-ink-soft hover:text-ink font-medium"
        }`}
      >
        <BookOpen className="w-5 h-5 mb-0.5" />
        <span>Edukasi</span>
        {isEdukasi && <span className="w-1 h-1 rounded-full bg-primary mt-0.5" />}
      </Link>
    </nav>
  );
}

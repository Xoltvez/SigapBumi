"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, MapPin, Plus, Search, BookOpen } from "lucide-react";

export function BottomNav() {
  const pathname = usePathname();

  const isHome = pathname === "/";
  const isPeta = pathname.startsWith("/peta");
  const isLapor = pathname.startsWith("/lapor");
  const isLacak = pathname.startsWith("/lacak");
  const isEdukasi = pathname.startsWith("/edukasi");

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 h-16 bg-surface border-t border-line px-2 flex items-center justify-around">
      <Link
        href="/"
        className={`flex flex-col items-center justify-center w-14 h-full text-xs font-medium transition-colors ${
          isHome ? "text-primary font-bold" : "text-ink-soft hover:text-ink"
        }`}
      >
        <Home className="w-5 h-5 mb-0.5" />
        <span>Beranda</span>
      </Link>

      <Link
        href="/peta"
        className={`flex flex-col items-center justify-center w-14 h-full text-xs font-medium transition-colors ${
          isPeta ? "text-primary font-bold" : "text-ink-soft hover:text-ink"
        }`}
      >
        <MapPin className="w-5 h-5 mb-0.5" />
        <span>Peta</span>
      </Link>

      {/* Center prominent Lapor button */}
      <Link
        href="/lapor"
        aria-label="Lapor Kejadian Bencana"
        className="flex flex-col items-center justify-center -mt-5"
      >
        <div
          className={`w-14 h-14 rounded-full bg-primary text-white flex items-center justify-center shadow-overlay transition-transform hover:scale-105 active:scale-95 ${
            isLapor ? "ring-4 ring-primary-soft" : ""
          }`}
        >
          <Plus className="w-7 h-7 stroke-[2.5]" />
        </div>
        <span
          className={`text-[11px] mt-1 font-semibold ${
            isLapor ? "text-primary" : "text-ink"
          }`}
        >
          Lapor
        </span>
      </Link>

      <Link
        href="/lacak"
        className={`flex flex-col items-center justify-center w-14 h-full text-xs font-medium transition-colors ${
          isLacak ? "text-primary font-bold" : "text-ink-soft hover:text-ink"
        }`}
      >
        <Search className="w-5 h-5 mb-0.5" />
        <span>Lacak</span>
      </Link>

      <Link
        href="/edukasi"
        className={`flex flex-col items-center justify-center w-14 h-full text-xs font-medium transition-colors ${
          isEdukasi ? "text-primary font-bold" : "text-ink-soft hover:text-ink"
        }`}
      >
        <BookOpen className="w-5 h-5 mb-0.5" />
        <span>Edukasi</span>
      </Link>
    </nav>
  );
}

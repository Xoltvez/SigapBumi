"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, MapPin, Plus, Search, BookOpen } from "lucide-react";

export function BottomNav() {
  const pathname = usePathname();

  if (pathname.startsWith("/admin")) {
    return null;
  }

  const isHome = pathname === "/";
  const isPeta = pathname.startsWith("/peta");
  const isLapor = pathname.startsWith("/lapor");
  const isLacak = pathname.startsWith("/lacak");
  const isEdukasi = pathname.startsWith("/edukasi");

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 h-16 bg-surface border-t border-line px-2 flex items-center justify-around shadow-overlay">
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

      {/* Center prominent Lapor button */}
      <Link
        href="/lapor"
        aria-label="Lapor Kejadian Bencana"
        className="flex flex-col items-center justify-center -mt-5"
      >
        <div
          className={`w-14 h-14 rounded-full bg-primary text-white flex items-center justify-center shadow-overlay transition-transform hover:scale-105 active:scale-95 ${
            isLapor ? "ring-4 ring-primary-soft scale-105" : ""
          }`}
        >
          <Plus className="w-7 h-7 stroke-[2.5]" />
        </div>
        <span
          className={`text-[11px] mt-1 font-semibold ${
            isLapor ? "text-primary font-bold" : "text-ink"
          }`}
        >
          Lapor
        </span>
      </Link>

      <Link
        href="/lacak"
        className={`flex flex-col items-center justify-center w-14 h-full text-xs transition-colors ${
          isLacak ? "text-primary font-bold" : "text-ink-soft hover:text-ink font-medium"
        }`}
      >
        <Search className="w-5 h-5 mb-0.5" />
        <span>Lacak</span>
        {isLacak && <span className="w-1 h-1 rounded-full bg-primary mt-0.5" />}
      </Link>

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

"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, MapPin, FileText, BookOpen } from "lucide-react";

export function BottomNav() {
  const pathname = usePathname();

  // Jangan tampilkan di seluruh dashboard posko/admin
  if (pathname.startsWith("/admin")) {
    return null;
  }

  const handleOpenSos = () => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("sigapbumi:open-sos"));
    }
  };

  const leftItems = [
    {
      href: "/",
      label: "Beranda",
      icon: Home,
      isActive: pathname === "/",
    },
    {
      href: "/peta",
      label: "Peta",
      icon: MapPin,
      isActive: pathname.startsWith("/peta"),
    },
  ];

  const rightItems = [
    {
      href: "/lapor",
      label: "Lapor",
      icon: FileText,
      isActive: pathname.startsWith("/lapor"),
    },
    {
      href: "/edukasi",
      label: "Edukasi",
      icon: BookOpen,
      isActive: pathname.startsWith("/edukasi"),
    },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 h-16 bg-surface/98 backdrop-blur-md border-t border-line px-1 flex items-center justify-around shadow-overlay select-none pb-[env(safe-area-inset-bottom)]">
      {/* Menu Kiri: Beranda & Peta */}
      {leftItems.map((item) => {
        const Icon = item.icon;
        const isActive = item.isActive;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center justify-center flex-1 h-full py-1 text-xs transition-colors ${
              isActive ? "text-primary font-bold" : "text-ink-soft hover:text-ink font-medium"
            }`}
          >
            <Icon className="w-5 h-5 mb-0.5 shrink-0 transition-transform" />
            <span className="text-[11px] leading-tight">{item.label}</span>
            <span
              className={`w-1 h-1 rounded-full mt-0.5 shrink-0 transition-all ${
                isActive ? "bg-primary opacity-100 scale-100" : "opacity-0 scale-0 pointer-events-none"
              }`}
            />
          </Link>
        );
      })}

      {/* Tombol SOS Darurat Tengah (Center Prominent Button) */}
      <div className="flex flex-col items-center justify-center flex-1 h-full relative">
        <button
          type="button"
          onClick={handleOpenSos}
          aria-label="Panggilan Darurat SOS Warga"
          className="flex flex-col items-center justify-center -mt-6 cursor-pointer select-none group"
        >
          <div className="relative w-13 h-13 rounded-full bg-[#EF4444] text-white flex items-center justify-center shadow-[0_4px_16px_rgba(239,68,68,0.45)] border-2 border-white transition-transform group-hover:scale-105 group-active:scale-95">
            <span className="absolute inset-0 rounded-full bg-red-400 animate-ping opacity-35 pointer-events-none" />
            <span className="font-black text-sm tracking-wider font-mono">SOS</span>
          </div>
          <span className="text-[10px] mt-0.5 font-black text-red-600 tracking-wider">
            SOS
          </span>
        </button>
      </div>

      {/* Menu Kanan: Lapor & Edukasi */}
      {rightItems.map((item) => {
        const Icon = item.icon;
        const isActive = item.isActive;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center justify-center flex-1 h-full py-1 text-xs transition-colors ${
              isActive ? "text-primary font-bold" : "text-ink-soft hover:text-ink font-medium"
            }`}
          >
            <Icon className="w-5 h-5 mb-0.5 shrink-0 transition-transform" />
            <span className="text-[11px] leading-tight">{item.label}</span>
            <span
              className={`w-1 h-1 rounded-full mt-0.5 shrink-0 transition-all ${
                isActive ? "bg-primary opacity-100 scale-100" : "opacity-0 scale-0 pointer-events-none"
              }`}
            />
          </Link>
        );
      })}
    </nav>
  );
}

"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  Bell,
  MapPin,
  BarChart2,
} from "lucide-react";
import { useAdmin } from "@/components/layout/AdminShell";

export function AdminBottomNav() {
  const pathname = usePathname();
  const { activeSosCount } = useAdmin();
  const [isNavigatingMap, setIsNavigatingMap] = useState(false);

  // Jangan tampilkan di halaman login admin
  const isLoginPage = pathname === "/admin/login";

  // Dengarkan event ketika mode navigasi taktis di peta aktif/nonaktif
  useEffect(() => {
    const handleNavState = (e: Event) => {
      const customEvt = e as CustomEvent<{ active: boolean }>;
      if (typeof customEvt?.detail?.active === "boolean") {
        setIsNavigatingMap(customEvt.detail.active);
      }
    };

    window.addEventListener("sigapbumi:live-nav-state", handleNavState);
    return () => {
      window.removeEventListener("sigapbumi:live-nav-state", handleNavState);
    };
  }, []);

  // Reset saat berpindah halaman
  useEffect(() => {
    setIsNavigatingMap(false);
  }, [pathname]);

  if (isLoginPage || isNavigatingMap) {
    return null;
  }

  // Daftar menu utama/penting admin (menu pengaturan tetap di drawer hamburger)
  const navItems = [
    {
      href: "/admin",
      label: "Dashboard",
      icon: LayoutDashboard,
      isActive: pathname === "/admin",
    },
    {
      href: "/admin/laporan",
      label: "Laporan",
      icon: FileText,
      isActive: pathname.startsWith("/admin/laporan"),
    },
    {
      href: "/admin/sos",
      label: "Monitor SOS",
      icon: Bell,
      isActive: pathname.startsWith("/admin/sos"),
      badge: activeSosCount > 0 ? activeSosCount : undefined,
    },
    {
      href: "/admin/peta",
      label: "Peta Taktis",
      icon: MapPin,
      isActive: pathname.startsWith("/admin/peta"),
    },
    {
      href: "/admin/statistik",
      label: "Rekap",
      icon: BarChart2,
      isActive: pathname.startsWith("/admin/statistik"),
    },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-lg border-t border-slate-200/90 px-1.5 flex items-center justify-around shadow-[0_-4px_24px_rgba(0,0,0,0.08)] select-none pt-1 pb-[max(env(safe-area-inset-bottom,0px),12px)] overflow-visible transform-gpu will-change-transform">
      <div className="h-14 w-full flex items-center justify-around relative overflow-visible">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.isActive;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center flex-1 h-full text-[10px] transition-all relative py-1 ${
                isActive
                  ? "text-[#F97316] font-bold"
                  : "text-slate-400 hover:text-slate-700 font-medium"
              }`}
            >
              <div className="relative flex items-center justify-center">
                <Icon
                  className={`w-5 h-5 transition-transform ${
                    isActive ? "scale-105 stroke-[2.4]" : "stroke-[1.8]"
                  }`}
                />

                {/* Badge SOS Aktif */}
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute -top-1.5 -right-2 px-1.5 py-0.2 min-w-[16px] h-4 rounded-full bg-[#EF4444] text-white text-[9px] font-black flex items-center justify-center shadow-xs animate-pulse">
                    {item.badge}
                  </span>
                )}
              </div>

              <span className="mt-1 leading-none tracking-tight text-center">{item.label}</span>

              {/* Indikator titik aktif di bawah menu */}
              {isActive ? (
                <span className="w-1.5 h-1.5 rounded-full bg-[#F97316] mt-1 shadow-xs animate-in fade-in zoom-in-75 duration-150" />
              ) : (
                <span className="w-1.5 h-1.5 mt-1 opacity-0 pointer-events-none" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

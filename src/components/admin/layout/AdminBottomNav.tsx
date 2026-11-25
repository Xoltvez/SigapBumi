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
  Activity,
  Users,
  ClipboardList,
  ShieldAlert,
  MoreHorizontal,
  X,
} from "lucide-react";
import { useAdmin } from "@/components/layout/AdminShell";
import { hasPermission, isPemerintahanUnit } from "@/lib/rbac";

export function AdminBottomNav() {
  const pathname = usePathname();
  const { activeSosCount, adminUser } = useAdmin();
  const [isNavigatingMap, setIsNavigatingMap] = useState(false);
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  const isPemerintahan = isPemerintahanUnit(adminUser?.unit);

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
    setIsMoreOpen(false);
  }, [pathname]);

  if (isLoginPage || isNavigatingMap) {
    return null;
  }

  // Daftar menu utama di bottom bar
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
    ...(!isPemerintahan
      ? [
          {
            href: "/admin/statistik",
            label: "Rekap",
            icon: BarChart2,
            isActive: pathname.startsWith("/admin/statistik"),
          },
        ]
      : []),
  ];

  // Menu tambahan khusus Pemerintahan (Rekap, Analitik Web, dan 3 menu enterprise)
  const extraItems = isPemerintahan
    ? [
        {
          href: "/admin/statistik",
          label: "Rekap & Statistik",
          icon: BarChart2,
          allowed: true,
        },
        {
          href: "/admin/analitik",
          label: "Analitik Web",
          icon: Activity,
          allowed: hasPermission("view_analytics", adminUser?.unit, adminUser?.role),
        },
        {
          href: "/admin/monitoring",
          label: "Monitoring Pengguna",
          icon: Users,
          allowed: hasPermission("view_user_monitoring", adminUser?.unit, adminUser?.role),
        },
        {
          href: "/admin/audit-logs",
          label: "Audit Trail",
          icon: ClipboardList,
          allowed: hasPermission("view_audit_logs", adminUser?.unit, adminUser?.role),
        },
        {
          href: "/admin/security",
          label: "Security Center",
          icon: ShieldAlert,
          allowed: hasPermission("view_security_center", adminUser?.unit, adminUser?.role),
        },
      ].filter((item) => item.allowed)
    : [];

  const isExtraActive = isPemerintahan && extraItems.some((item) => pathname.startsWith(item.href));

  return (
    <>
      {isPemerintahan && isMoreOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-[1px]" onClick={() => setIsMoreOpen(false)}>
          <div
            onClick={(e) => e.stopPropagation()}
            className="absolute bottom-[74px] inset-x-3 bg-white rounded-2xl border border-slate-200 shadow-xl p-3 animate-in fade-in slide-in-from-bottom-4 duration-150"
          >
            <div className="flex items-center justify-between px-2 pb-2 mb-2 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">Menu Lainnya</span>
              <button
                type="button"
                onClick={() => setIsMoreOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                aria-label="Tutup"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {extraItems.map((item) => {
                const Icon = item.icon;
                const active = pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMoreOpen(false)}
                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
                      active
                        ? "bg-orange-50 text-[#F97316] border border-orange-200"
                        : "bg-slate-50 text-slate-700 hover:bg-slate-100 border border-transparent"
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}

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

                {isActive ? (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#F97316] mt-1 shadow-xs animate-in fade-in zoom-in-75 duration-150" />
                ) : (
                  <span className="w-1.5 h-1.5 mt-1 opacity-0 pointer-events-none" />
                )}
              </Link>
            );
          })}

          {isPemerintahan && (
            <button
              type="button"
              onClick={() => setIsMoreOpen((v) => !v)}
              className={`flex flex-col items-center justify-center flex-1 h-full text-[10px] transition-all relative py-1 cursor-pointer ${
                isExtraActive || isMoreOpen
                  ? "text-[#F97316] font-bold"
                  : "text-slate-400 hover:text-slate-700 font-medium"
              }`}
            >
              <div className="relative flex items-center justify-center">
                <MoreHorizontal
                  className={`w-5 h-5 transition-transform ${
                    isExtraActive || isMoreOpen ? "scale-105 stroke-[2.4]" : "stroke-[1.8]"
                  }`}
                />
              </div>
              <span className="mt-1 leading-none tracking-tight text-center">Lainnya</span>
              {isExtraActive ? (
                <span className="w-1.5 h-1.5 rounded-full bg-[#F97316] mt-1 shadow-xs" />
              ) : (
                <span className="w-1.5 h-1.5 mt-1 opacity-0 pointer-events-none" />
              )}
            </button>
          )}
        </div>
      </nav>
    </>
  );
}

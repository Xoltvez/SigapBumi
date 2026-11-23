"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  Bell,
  MapPin,
  BarChart2,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  User,
  X,
} from "lucide-react";
import { useAdmin } from "@/components/layout/AdminShell";

interface AdminSidebarProps {
  isCollapsed: boolean;
  onToggleCollapse?: () => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
  activeSosCount?: number;
}

export function AdminSidebar({
  isCollapsed,
  onToggleCollapse,
  isMobileOpen = false,
  onCloseMobile,
  activeSosCount,
}: AdminSidebarProps) {
  const pathname = usePathname();
  const { logout, adminUser, activeSosCount: contextSosCount } = useAdmin();

  const effectiveSosCount = activeSosCount !== undefined ? activeSosCount : (contextSosCount || 0);

  const navItems = [
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/laporan", label: "Data Laporan", icon: FileText },
    {
      href: "/admin/sos",
      label: "Monitor SOS",
      icon: Bell,
      badge: effectiveSosCount > 0 ? `${effectiveSosCount}` : undefined,
    },
    { href: "/admin/peta", label: "Peta Operasional", icon: MapPin },
    { href: "/admin/statistik", label: "Rekap & Statistik", icon: BarChart2 },
  ];

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs md:hidden animate-in fade-in duration-200"
          aria-hidden="true"
        />
      )}

      <aside
        className={`bg-white text-slate-800 font-sans flex flex-col shrink-0 min-h-screen transition-all duration-300 border-r border-slate-200/80 shadow-[1px_0_10px_rgba(0,0,0,0.02)] select-none
          fixed md:relative inset-y-0 left-0 z-50 md:z-30
          ${isMobileOpen ? "translate-x-0 w-72" : "-translate-x-full md:translate-x-0"}
          ${isCollapsed ? "md:w-[76px]" : "md:w-64"}
        `}
      >
        {/* Brand & Logo Header */}
        <div
          className={`h-16 md:h-20 border-b border-slate-100 flex items-center justify-between gap-2 relative transition-all ${
            isCollapsed ? "px-2 md:justify-center" : "px-5 sm:px-6"
          }`}
        >
          <Link
            href="/admin"
            onClick={onCloseMobile}
            className={`flex items-center gap-3 overflow-hidden ${
              isCollapsed ? "md:justify-center md:w-full" : ""
            }`}
            title="Sigap Bumi Admin Panel"
          >
            {/* Logo Mark */}
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0">
              <Image
                src="/logo_sigapbumi.png"
                alt="Sigap Bumi"
                width={34}
                height={34}
                style={{ width: "auto" }}
                className="h-8 object-contain"
                priority
              />
            </div>

            {(!isCollapsed || isMobileOpen) && (
              <div className="truncate flex-1 font-sans">
                <span className="font-sans font-bold text-base text-slate-900 block leading-tight tracking-tight">
                  Sigap Bumi
                </span>
                <span className="font-sans text-[11px] text-slate-400 font-normal block mt-0.5">
                  Admin Panel
                </span>
              </div>
            )}
          </Link>

          {/* Close button for mobile drawer */}
          <button
            type="button"
            onClick={onCloseMobile}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 md:hidden transition-colors cursor-pointer"
            aria-label="Tutup Menu"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Circular Collapse/Expand Button positioned on border line for desktop */}
          {onToggleCollapse && (
            <button
              type="button"
              onClick={onToggleCollapse}
              title={isCollapsed ? "Perluas Sidebar" : "Ciutkan Sidebar"}
              className="hidden md:flex absolute -right-3 top-7 z-40 w-6 h-6 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 hover:text-slate-800 items-center justify-center text-xs shadow-sm transition-all cursor-pointer"
            >
              {isCollapsed ? (
                <ChevronRight className="w-3.5 h-3.5" />
              ) : (
                <ChevronLeft className="w-3.5 h-3.5" />
              )}
            </button>
          )}
        </div>

        {/* Main Navigation Menu (Hanya tampil di Desktop, di Mobile sudah ada di Bottom Navbar!) */}
        <nav
          className={`hidden md:block flex-1 py-5 md:py-6 space-y-1.5 overflow-y-auto ${
            isCollapsed ? "px-2" : "px-4"
          }`}
        >
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(item.href);

            const activeClasses = "bg-[#F97316] text-white font-semibold shadow-sm border border-[#F97316]";
            const iconActiveColor = "text-white";

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onCloseMobile}
                title={isCollapsed ? item.label : undefined}
                className={`group flex items-center rounded-xl text-[13px] transition-all relative border ${
                  isActive
                    ? activeClasses
                    : "border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-50 font-medium"
                } ${
                  isCollapsed
                    ? "md:justify-center md:h-11 md:w-11 md:mx-auto md:p-0"
                    : "gap-3.5 px-4 py-3"
                }`}
              >
                <Icon
                  className={`w-[18px] h-[18px] shrink-0 transition-colors ${
                    isActive
                      ? iconActiveColor
                      : "text-slate-400 group-hover:text-slate-600"
                  }`}
                />

                {(!isCollapsed || isMobileOpen) && (
                  <span className="flex-1 truncate">{item.label}</span>
                )}

                {(!isCollapsed || isMobileOpen) && item.badge && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-[11px] font-bold shadow-xs transition-colors ${
                      isActive
                        ? "text-[#F97316] bg-white font-bold"
                        : "text-white bg-[#EF4444]"
                    }`}
                  >
                    {item.badge}
                  </span>
                )}

                {/* Indikator dot pulsa saat collapsed jika ada sinyal aktif */}
                {isCollapsed && !isMobileOpen && item.badge && (
                  <span
                    className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-[#EF4444] ring-2 ring-white animate-pulse"
                    title={`${item.label}: ${item.badge} aktif`}
                  />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Mobile Drawer Body: Hanya Menu Pengaturan & Profil sesuai instruksi */}
        <div className="md:hidden flex-1 py-6 px-4 flex flex-col justify-between overflow-y-auto">
          <div className="space-y-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1 block">
              Menu Pengaturan
            </span>
            <Link
              href="/admin/pengaturan"
              onClick={onCloseMobile}
              className={`flex items-center gap-3.5 px-4 py-3 rounded-2xl text-[13px] transition-colors border ${
                pathname.startsWith("/admin/pengaturan")
                  ? "bg-[#F97316] text-white font-semibold shadow-sm border-[#F97316]"
                  : "border-slate-100 bg-slate-50 text-slate-700 hover:text-slate-900 hover:bg-slate-100 font-medium"
              }`}
            >
              <Settings
                className={`w-5 h-5 shrink-0 ${
                  pathname.startsWith("/admin/pengaturan") ? "text-white" : "text-slate-500"
                }`}
              />
              <span className="font-semibold text-sm">Pengaturan Posko</span>
            </Link>
          </div>

          <div className="space-y-2.5 pt-4 border-t border-slate-100">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1 block">
              Profil Petugas
            </span>
            <Link
              href="/admin/pengaturan"
              onClick={onCloseMobile}
              className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200/80 hover:bg-slate-100 transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-full bg-[#1E293B] text-white flex items-center justify-center text-sm font-bold shrink-0 shadow-xs">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-900 truncate leading-tight">
                    {adminUser?.unitName || "Pemerintahan"}
                  </p>
                  <p className="text-[11px] text-slate-500 truncate mt-0.5">
                    {adminUser?.name || "Drs. Tri Wahyudi (Koordinator Operasi)"}
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 group-hover:translate-x-0.5 transition-all shrink-0" />
            </Link>

            <button
              type="button"
              onClick={() => {
                if (onCloseMobile) onCloseMobile();
                logout("manual");
              }}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4 text-rose-500" />
              <span>Keluar Sesi</span>
            </button>
          </div>
        </div>

        {/* Subtle Topo Contour Lines Watermark at Bottom Left (Hanya saat expanded agar tidak bocor keluar sidebar) */}
        {!isCollapsed && (
          <div className="pointer-events-none absolute bottom-0 left-0 w-36 h-36 overflow-hidden opacity-35 z-0">
            <svg
              viewBox="0 0 160 160"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="w-full h-full text-amber-500/50"
            >
              <path
                d="M-20 160 C 20 120, 60 140, 100 110 C 130 90, 150 120, 180 80"
                stroke="currentColor"
                strokeWidth="1.5"
              />
              <path
                d="M-30 140 C 10 100, 50 120, 90 90 C 120 70, 140 100, 170 60"
                stroke="currentColor"
                strokeWidth="1.5"
              />
              <path
                d="M-40 120 C 0 80, 40 100, 80 70 C 110 50, 130 80, 160 40"
                stroke="currentColor"
                strokeWidth="1.5"
              />
              <path
                d="M-50 100 C -10 60, 30 80, 70 50 C 100 30, 120 60, 150 20"
                stroke="currentColor"
                strokeWidth="1.5"
              />
            </svg>
          </div>
        )}

        {/* Desktop Footer: Settings & Officer Profile Card */}
        <div
          className={`hidden md:block border-t border-slate-100 space-y-2 relative z-10 bg-white/95 transition-all ${
            isCollapsed ? "p-2" : "p-4"
          }`}
        >
          {/* Settings Item */}
          <Link
            href="/admin/pengaturan"
            onClick={onCloseMobile}
            title={isCollapsed ? "Pengaturan Posko" : undefined}
            className={`flex items-center rounded-xl text-[13px] transition-colors border ${
              pathname.startsWith("/admin/pengaturan")
                ? "bg-[#F97316] text-white font-semibold shadow-sm border-[#F97316]"
                : "border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-50 font-medium"
            } ${
              isCollapsed
                ? "md:justify-center md:h-11 md:w-11 md:mx-auto md:p-0"
                : "gap-3.5 px-4 py-2.5"
            }`}
          >
            <Settings
              className={`w-[18px] h-[18px] shrink-0 ${
                pathname.startsWith("/admin/pengaturan") ? "text-white" : "text-slate-400"
              }`}
            />
            {(!isCollapsed || isMobileOpen) && <span className="truncate">Pengaturan</span>}
          </Link>

          {/* Officer Profile Card / Compact Avatar */}
          {isCollapsed && !isMobileOpen ? (
            <Link
              href="/admin/pengaturan"
              onClick={onCloseMobile}
              title={`Profil: ${adminUser?.name || "Petugas Posko"} (${adminUser?.unitName || "Komando"})`}
              className="flex items-center justify-center w-11 h-11 mx-auto rounded-xl bg-slate-50 border border-slate-200/80 hover:bg-slate-100 transition-colors cursor-pointer group shadow-2xs"
            >
              <div className="w-8 h-8 rounded-full bg-[#1E293B] text-white flex items-center justify-center text-xs font-bold shrink-0">
                <User className="w-4 h-4 text-white" />
              </div>
            </Link>
          ) : (
            <Link
              href="/admin/pengaturan"
              onClick={onCloseMobile}
              className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-50/80 border border-slate-200/80 hover:bg-slate-100/80 transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-full bg-[#1E293B] text-white flex items-center justify-center text-xs font-bold shrink-0">
                  <User className="w-4 h-4 text-white" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-800 truncate leading-tight">
                    {adminUser?.unitName || "BPBD Komando"}
                  </p>
                  <p className="text-[10px] text-slate-400 truncate mt-0.5">
                    {adminUser?.name || "Kapten Hendra Gunawan"}
                  </p>
                </div>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 group-hover:translate-x-0.5 transition-all shrink-0" />
            </Link>
          )}
        </div>
      </aside>
    </>
  );
}

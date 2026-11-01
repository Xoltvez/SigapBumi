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
} from "lucide-react";
import { useAdmin } from "@/components/layout/AdminShell";

interface AdminSidebarProps {
  isCollapsed: boolean;
  onToggleCollapse?: () => void;
  activeSosCount?: number;
}

export function AdminSidebar({
  isCollapsed,
  onToggleCollapse,
  activeSosCount = 0,
}: AdminSidebarProps) {
  const pathname = usePathname();
  const { logout } = useAdmin();

  const navItems = [
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/laporan", label: "Data Laporan", icon: FileText },
    {
      href: "/admin/sos",
      label: "Monitor SOS",
      icon: Bell,
      badge: activeSosCount > 0 ? `${activeSosCount}` : undefined,
    },
    { href: "/admin/peta", label: "Peta Operasional", icon: MapPin },
    { href: "/admin/statistik", label: "Rekap & Statistik", icon: BarChart2 },
  ];

  return (
    <aside
      className={`bg-white text-slate-800 font-sans flex flex-col shrink-0 min-h-screen transition-all duration-300 border-r border-slate-200/80 shadow-[1px_0_10px_rgba(0,0,0,0.02)] relative z-30 select-none ${
        isCollapsed ? "w-[76px]" : "w-64"
      }`}
    >
      {/* Brand & Logo Header */}
      <div className="h-20 border-b border-slate-100 flex items-center px-6 justify-between gap-2 relative">
        <Link
          href="/admin"
          className={`flex items-center gap-3 overflow-hidden ${
            isCollapsed ? "justify-center w-full" : ""
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

          {!isCollapsed && (
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

        {/* Circular Collapse/Expand Button positioned on border line */}
        {onToggleCollapse && (
          <button
            type="button"
            onClick={onToggleCollapse}
            title={isCollapsed ? "Perluas Sidebar" : "Ciutkan Sidebar"}
            className="absolute -right-3 top-7 z-40 w-6 h-6 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 hover:text-slate-800 flex items-center justify-center text-xs shadow-sm transition-all cursor-pointer"
          >
            {isCollapsed ? (
              <ChevronRight className="w-3.5 h-3.5" />
            ) : (
              <ChevronLeft className="w-3.5 h-3.5" />
            )}
          </button>
        )}
      </div>

      {/* Main Navigation Menu */}
      <nav className="flex-1 py-6 px-4 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(item.href);

          const activeClasses = "bg-[#FFF4EC] text-[#EA580C] font-semibold";
          const iconActiveColor = "text-[#EA580C]";

          return (
            <Link
              key={item.href}
              href={item.href}
              title={isCollapsed ? item.label : undefined}
              className={`group flex items-center gap-3.5 px-4 py-3 rounded-xl text-[13px] transition-all relative ${
                isActive
                  ? activeClasses
                  : "text-slate-500 hover:text-slate-900 hover:bg-slate-50 font-medium"
              } ${isCollapsed ? "justify-center px-0" : ""}`}
            >
              <Icon
                className={`w-[18px] h-[18px] shrink-0 transition-colors ${
                  isActive
                    ? iconActiveColor
                    : "text-slate-400 group-hover:text-slate-600"
                }`}
              />

              {!isCollapsed && (
                <span className="flex-1 truncate">{item.label}</span>
              )}

              {!isCollapsed && item.badge && (
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold text-white bg-[#EF4444] shadow-xs">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Subtle Topo Contour Lines Watermark at Bottom Left */}
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

      {/* Footer: Settings & Officer Profile Card */}
      <div className="p-4 border-t border-slate-100 space-y-2 relative z-10 bg-white/90">
        {/* Settings Item */}
        <Link
          href="/admin"
          title={isCollapsed ? "Pengaturan" : undefined}
          className={`flex items-center gap-3.5 px-4 py-2 rounded-xl text-[13px] font-medium text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-colors ${
            isCollapsed ? "justify-center px-0" : ""
          }`}
        >
          <Settings className="w-[18px] h-[18px] shrink-0 text-slate-400" />
          {!isCollapsed && <span className="truncate">Pengaturan</span>}
        </Link>

        {/* Officer Card matching screenshot */}
        {!isCollapsed && (
          <div className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-50/80 border border-slate-200/80 hover:bg-slate-100/80 transition-colors cursor-pointer group">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-[#1E293B] text-white flex items-center justify-center text-xs font-bold shrink-0">
                <User className="w-4 h-4 text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-800 truncate leading-tight">
                  BPBD Komando
                </p>
                <p className="text-[10px] text-slate-400 truncate mt-0.5">
                  Kapten Hendra Gunawan
                </p>
              </div>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 group-hover:translate-x-0.5 transition-all shrink-0" />
          </div>
        )}
      </div>
    </aside>
  );
}

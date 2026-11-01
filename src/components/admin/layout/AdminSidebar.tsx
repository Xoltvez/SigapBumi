"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  Siren,
  Map,
  BarChart3,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  ShieldCheck,
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
  const { adminUser, logout } = useAdmin();

  const navItems = [
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/laporan", label: "Data Laporan", icon: FileText },
    {
      href: "/admin/sos",
      label: "Monitor SOS",
      icon: Siren,
      badge: activeSosCount > 0 ? `${activeSosCount}` : undefined,
    },
    { href: "/admin/peta", label: "Peta Operasional", icon: Map },
    { href: "/admin/statistik", label: "Rekap & Statistik", icon: BarChart3 },
  ];

  return (
    <aside
      className={`bg-[#131722] text-white font-sans flex flex-col shrink-0 min-h-screen transition-all duration-300 border-r border-slate-800 relative z-30 select-none ${
        isCollapsed ? "w-[76px]" : "w-64"
      }`}
    >
      {/* Brand & Logo Header */}
      <div className="h-16 border-b border-slate-800/80 flex items-center px-4 justify-between gap-2 relative">
        <Link
          href="/admin"
          className={`flex items-center gap-3 overflow-hidden ${
            isCollapsed ? "justify-center w-full" : ""
          }`}
          title="SigapBumi - Posko Terpadu"
        >
          {/* Circular Gold Emblem */}
          <div className="w-10 h-10 rounded-full border border-amber-500/60 p-1 flex items-center justify-center bg-black/50 shadow-inner shrink-0 group-hover:border-amber-400 transition-colors">
            <Image
              src="/logo_sigapbumi.png"
              alt="SigapBumi"
              width={26}
              height={26}
              style={{ width: "auto" }}
              className="h-6 object-contain"
            />
          </div>

          {!isCollapsed && (
            <div className="truncate flex-1 font-sans">
              <span className="font-sans font-extrabold tracking-[0.14em] text-xs sm:text-[13px] text-amber-200 block uppercase leading-tight">
                SIGAP BUMI
              </span>
              <span className="font-sans text-[9px] tracking-[0.2em] text-slate-400 uppercase font-semibold block mt-0.5">
                POSKO TERPADU
              </span>
            </div>
          )}
        </Link>

        {/* Single Circular Collapse/Expand Button exactly on border line */}
        {onToggleCollapse && (
          <button
            type="button"
            onClick={onToggleCollapse}
            title={isCollapsed ? "Perluas Sidebar" : "Ciutkan Sidebar"}
            className="absolute -right-3 top-5 z-40 w-6 h-6 rounded-full border border-amber-500/60 bg-[#131722] hover:bg-slate-800 text-amber-400 hover:text-amber-300 flex items-center justify-center text-xs shadow-md transition-all cursor-pointer"
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
      <nav className="flex-1 py-5 px-3 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              title={isCollapsed ? item.label : undefined}
              className={`group flex items-center gap-3.5 px-3.5 py-3 rounded-xl text-xs transition-all relative ${
                isActive
                  ? "bg-[#252018] border border-amber-500/40 text-amber-400 font-bold shadow-sm"
                  : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/40 font-medium border border-transparent"
              } ${isCollapsed ? "justify-center px-0" : ""}`}
            >
              <Icon
                className={`w-4 h-4 shrink-0 transition-colors ${
                  isActive
                    ? "text-amber-400"
                    : "text-slate-400 group-hover:text-slate-200"
                }`}
              />

              {!isCollapsed && (
                <span className="flex-1 truncate tracking-wide">{item.label}</span>
              )}

              {!isCollapsed && item.badge && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold text-white bg-red-500 animate-pulse">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer: Officer info & Settings & Logout Action */}
      <div className="p-3 border-t border-slate-800/80 space-y-2">
        {/* Settings Item */}
        <Link
          href="/admin"
          title={isCollapsed ? "Pengaturan" : undefined}
          className={`flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-xs font-medium text-slate-400 hover:text-slate-100 hover:bg-slate-800/40 transition-colors ${
            isCollapsed ? "justify-center px-0" : ""
          }`}
        >
          <Settings className="w-4 h-4 shrink-0 text-slate-400" />
          {!isCollapsed && <span className="truncate">Pengaturan</span>}
        </Link>

        {/* Officer Active Badge (if expanded) */}
        {!isCollapsed && adminUser && (
          <div className="px-3 py-2 rounded-xl bg-slate-900/60 border border-slate-800/80 mb-1">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-400">
              <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{adminUser.unitName}</span>
            </div>
            <div className="text-[11px] text-slate-200 font-medium truncate mt-0.5">
              {adminUser.name}
            </div>
          </div>
        )}

        {/* Portal Publik Link */}
        <Link
          href="/"
          title={isCollapsed ? "Portal Publik Warga" : undefined}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11px] text-slate-500 hover:text-slate-300 transition-colors ${
            isCollapsed ? "justify-center px-0" : ""
          }`}
        >
          <ExternalLink className="w-3.5 h-3.5 shrink-0" />
          {!isCollapsed && <span className="truncate">Portal Publik</span>}
        </Link>

        {/* Pill Keluar Button */}
        <button
          type="button"
          onClick={logout}
          title={isCollapsed ? "Keluar Sesi" : undefined}
          className={`w-full flex items-center justify-center gap-2 py-2 rounded-full border border-slate-700/80 bg-slate-900/40 hover:bg-slate-800 hover:border-amber-500/50 text-slate-300 hover:text-amber-400 text-xs font-semibold transition-all shadow-sm ${
            isCollapsed ? "px-2" : "px-4"
          }`}
        >
          <LogOut className="w-3.5 h-3.5 shrink-0" />
          {!isCollapsed && <span>Keluar</span>}
        </button>
      </div>
    </aside>
  );
}


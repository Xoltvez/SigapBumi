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
  ExternalLink,
} from "lucide-react";

interface AdminSidebarProps {
  isCollapsed: boolean;
  activeSosCount?: number;
}

export function AdminSidebar({
  isCollapsed,
  activeSosCount = 0,
}: AdminSidebarProps) {
  const pathname = usePathname();

  const navItems = [
    { href: "/admin", label: "Ringkasan", icon: LayoutDashboard },
    { href: "/admin/laporan", label: "Daftar Laporan", icon: FileText },
    {
      href: "/admin/sos",
      label: "Monitor SOS",
      icon: Siren,
      badge: activeSosCount > 0 ? `${activeSosCount}` : undefined,
      badgeColor: "bg-danger",
    },
    { href: "/admin/peta", label: "Peta Operasional", icon: Map },
    { href: "/admin/statistik", label: "Statistik", icon: BarChart3 },
  ];

  return (
    <aside
      className={`bg-ink text-white flex flex-col shrink-0 min-h-screen transition-all duration-200 border-r border-ink-soft/30 z-30 ${
        isCollapsed ? "w-[72px]" : "w-60"
      }`}
    >
      {/* Brand & Logo Header */}
      <div className="h-14 border-b border-ink-soft/40 flex items-center px-4 justify-between">
        <Link href="/admin" className="flex items-center gap-2.5 overflow-hidden">
          <Image
            src="/logo_sigapbumi.png"
            alt="SigapBumi"
            width={32}
            height={32}
            style={{ width: "auto" }}
            className="h-8 object-contain shrink-0"
          />
          {!isCollapsed && (
            <div className="truncate">
              <span className="font-bold text-sm block leading-none">
                Sigap<span className="text-primary">Bumi</span>
              </span>
              <span className="text-[10px] text-ink-muted uppercase tracking-wider font-semibold">
                Posko Petugas
              </span>
            </div>
          )}
        </Link>
      </div>

      {/* Main Navigation Menu */}
      <nav className="flex-1 py-4 px-2 space-y-1">
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
              className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-xs font-semibold transition-colors relative ${
                isActive
                  ? "bg-white/10 text-white font-bold"
                  : "text-ink-muted hover:text-white hover:bg-white/5"
              } ${isCollapsed ? "justify-center" : ""}`}
            >
              {/* 3px Left Active Indicator */}
              {isActive && (
                <span className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-primary rounded-r" />
              )}

              <Icon
                className={`w-4 h-4 shrink-0 ${
                  isActive ? "text-primary" : "text-ink-muted"
                }`}
              />

              {!isCollapsed && (
                <span className="flex-1 truncate">{item.label}</span>
              )}

              {!isCollapsed && item.badge && (
                <span
                  className={`px-1.5 py-0.5 rounded text-[10px] font-bold text-white ${
                    item.badgeColor || "bg-primary"
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer / Switch back to citizen portal */}
      <div className="p-3 border-t border-ink-soft/40">
        <Link
          href="/"
          title={isCollapsed ? "Portal Publik Warga" : undefined}
          className={`flex items-center gap-2 px-3 py-2 rounded text-xs text-ink-muted hover:text-white hover:bg-white/5 transition-colors ${
            isCollapsed ? "justify-center" : ""
          }`}
        >
          <ExternalLink className="w-4 h-4 shrink-0" />
          {!isCollapsed && <span className="truncate">Portal Publik Warga</span>}
        </Link>
      </div>
    </aside>
  );
}

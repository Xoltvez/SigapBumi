"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Radio,
  FileText,
  Map,
  ArrowLeft,
  Flame,
  HeartPulse,
  Shield,
  LifeBuoy,
} from "lucide-react";

interface AdminSidebarProps {
  activeUnit: string;
  onSelectUnit: (unit: string) => void;
}

export function AdminSidebar({ activeUnit, onSelectUnit }: AdminSidebarProps) {
  const pathname = usePathname();

  const navItems = [
    { href: "/admin", label: "Dashboard Ringkasan", icon: LayoutDashboard },
    { href: "/admin/sos", label: "Monitor SOS Radar", icon: Radio, badge: "Live" },
    { href: "/admin/laporan", label: "Daftar Laporan", icon: FileText },
    { href: "/admin/peta", label: "Peta Operasional", icon: Map },
  ];

  const units = [
    { id: "semua", name: "Posko Terpadu (Semua)", icon: LifeBuoy, color: "text-primary" },
    { id: "bnpb_bpbd", name: "BNPB / BPBD", icon: LifeBuoy, color: "text-primary" },
    { id: "damkar", name: "Dinas Damkar", icon: Flame, color: "text-danger" },
    { id: "medis", name: "Dinas Kesehatan / RS", icon: HeartPulse, color: "text-danger" },
    { id: "polisi", name: "Kepolisian (Polri)", icon: Shield, color: "text-info" },
  ];

  return (
    <aside className="w-64 bg-ink text-white flex flex-col shrink-0 min-h-screen border-r border-ink-soft/30 z-30">
      {/* Brand & Agency Header */}
      <div className="p-5 border-b border-ink-soft/40 flex items-center justify-between">
        <Link href="/admin" className="flex items-center gap-2.5">
          <Image
            src="/logo_sigapbumi.png"
            alt="SigapBumi"
            width={32}
            height={32}
            style={{ width: "auto" }}
            className="h-8 object-contain"
          />
          <div>
            <span className="font-bold text-base block leading-none">
              Sigap<span className="text-primary">Bumi</span>
            </span>
            <span className="text-[10px] text-ink-muted uppercase tracking-wider font-semibold">
              Dashboard Petugas
            </span>
          </div>
        </Link>
      </div>

      {/* Agency / Role Switcher (Simulasi Unit Penanggung Jawab) */}
      <div className="p-4 border-b border-ink-soft/30 bg-black/20">
        <span className="text-[10px] uppercase font-bold text-ink-muted block mb-2 tracking-wider">
          Instansi Penanggung Jawab:
        </span>
        <div className="space-y-1">
          {units.map((u) => {
            const Icon = u.icon;
            const isSelected = activeUnit === u.id;
            return (
              <button
                key={u.id}
                type="button"
                onClick={() => onSelectUnit(u.id)}
                className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs font-semibold text-left transition-colors ${
                  isSelected
                    ? "bg-primary text-white"
                    : "text-gray-300 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 shrink-0 ${isSelected ? "text-white" : u.color}`} />
                <span className="truncate">{u.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Navigation Links */}
      <nav className="flex-1 p-4 space-y-1.5">
        <span className="text-[10px] uppercase font-bold text-ink-muted block mb-2 tracking-wider">
          Menu Operasional
        </span>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-between px-3 py-2.5 rounded-md text-xs font-semibold transition-colors ${
                isActive
                  ? "bg-primary text-white shadow-sm"
                  : "text-gray-300 hover:bg-white/10 hover:text-white"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-danger text-white uppercase animate-pulse">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer / Switch back to citizen portal */}
      <div className="p-4 border-t border-ink-soft/40">
        <Link
          href="/"
          className="flex items-center gap-2 text-xs font-semibold text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Portal Warga</span>
        </Link>
      </div>
    </aside>
  );
}

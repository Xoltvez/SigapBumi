"use client";

import React, { useState } from "react";
import { Users, ClipboardList, ShieldAlert, Lock } from "lucide-react";
import { useAdmin } from "@/components/layout/AdminShell";
import { isPemerintahanUnit } from "@/lib/rbac";
import AdminMonitoringPage from "@/app/admin/monitoring/page";
import AdminAuditLogsPage from "@/app/admin/audit-logs/page";
import AdminSecurityPage from "@/app/admin/security/page";

type LainnyaTab = "monitoring" | "audit" | "security";

export default function AdminLainnyaPage() {
  const { adminUser } = useAdmin();
  const isPemerintahan = isPemerintahanUnit(adminUser?.unit);
  const [activeTab, setActiveTab] = useState<LainnyaTab>("monitoring");

  if (!isPemerintahan) {
    return (
      <div className="max-w-xl mx-auto mt-16 bg-white border border-slate-200 rounded-2xl p-8 text-center">
        <Lock className="w-10 h-10 text-[#F97316] mx-auto mb-3" />
        <h1 className="text-lg font-extrabold text-slate-900">Akses Menu Lainnya Dibatasi</h1>
        <p className="text-xs text-slate-500 mt-2">
          Modul Monitoring Pengguna, Audit Trail, dan Security Center hanya tersedia untuk akun unit Pemerintahan.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto font-sans pb-12">
      {/* Pill Sub-Menu Horizontal (mengikuti gaya Pengaturan Posko) */}
      <div className="flex items-center gap-1.5 p-1.5 bg-slate-100/80 rounded-2xl border border-slate-200/80 overflow-x-auto scrollbar-none">
        <button
          type="button"
          onClick={() => setActiveTab("monitoring")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
            activeTab === "monitoring"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
          }`}
        >
          <Users className="w-4 h-4 text-[#EA580C]" />
          <span>Monitoring Pengguna</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("audit")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
            activeTab === "audit"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
          }`}
        >
          <ClipboardList className="w-4 h-4 text-blue-600" />
          <span>Audit Trail</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("security")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
            activeTab === "security"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
          }`}
        >
          <ShieldAlert className="w-4 h-4 text-rose-500" />
          <span>Security Center</span>
        </button>
      </div>

      {/* Konten Sub-Menu Aktif */}
      <div>
        {activeTab === "monitoring" && <AdminMonitoringPage />}
        {activeTab === "audit" && <AdminAuditLogsPage />}
        {activeTab === "security" && <AdminSecurityPage />}
      </div>
    </div>
  );
}

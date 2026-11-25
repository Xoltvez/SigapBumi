"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Users,
  UserCheck,
  LogIn,
  ShieldAlert,
  RotateCw,
  Search,
  Activity,
  Monitor,
  Smartphone,
  Clock,
  Lock,
} from "lucide-react";
import { useAdmin } from "@/components/layout/AdminShell";
import { getEnterpriseAuthHeaders } from "@/lib/analytics/client";
import { hasPermission, type SystemRole } from "@/lib/rbac";

interface MonitoringResponse {
  summary: {
    totalAccounts: number;
    onlineUsers: number;
    loginSuccessToday: number;
    loginFailedToday: number;
  };
  roleDistribution: { role: string; count: number }[];
  unitDistribution: { unitName: string; count: number }[];
  usersTable: {
    userId: string;
    name: string;
    email: string;
    unit: string;
    unitName: string;
    role: SystemRole;
    isActive: boolean;
    status: "online" | "idle" | "offline";
    lastLoginAt: string | null;
    lastActivityAt: string | null;
    currentPath: string;
    deviceMeta: string;
    activeSessionsCount: number;
  }[];
  activeSessions: {
    sessionId: string;
    userId: string;
    userName: string;
    userEmail: string;
    role: string;
    unitName: string;
    ipAddress: string;
    deviceMeta: string;
    currentPath: string;
    loginAt: string;
    lastHeartbeatAt: string;
  }[];
  loginHistory: {
    id: string;
    userName: string;
    role: string;
    unitName: string;
    action: "LOGIN" | "LOGOUT" | "LOGIN_FAILED";
    ipAddress: string;
    deviceMeta: string;
    timestamp: string;
  }[];
}

function formatWib(iso: string | null): string {
  if (!iso) return "-";
  try {
    return (
      new Intl.DateTimeFormat("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        timeZone: "Asia/Jakarta",
      }).format(new Date(iso)) + " WIB"
    );
  } catch {
    return iso;
  }
}

export default function AdminMonitoringPage() {
  const { adminUser } = useAdmin();
  const [data, setData] = useState<MonitoringResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("semua");
  const [unitFilter, setUnitFilter] = useState("semua");
  const [statusFilter, setStatusFilter] = useState("semua");
  const [dateFilter, setDateFilter] = useState("");
  const [updatingEmail, setUpdatingEmail] = useState<string | null>(null);

  const canView = hasPermission("view_user_monitoring", adminUser?.unit, adminUser?.role);
  const canManageRoles = hasPermission("manage_roles", adminUser?.unit, adminUser?.role);

  const loadData = useCallback(async () => {
    if (!adminUser) return;
    setErrorMsg(null);
    try {
      const qs = new URLSearchParams({
        role: roleFilter,
        unit: unitFilter,
        status: statusFilter,
        date: dateFilter,
        search,
      });
      const res = await fetch(`/api/admin/monitoring?${qs.toString()}`, {
        headers: getEnterpriseAuthHeaders(adminUser),
        cache: "no-store",
      });
      if (res.status === 403) {
        setErrorMsg("Akses Ditolak (403): Peran Anda tidak memiliki kewenangan melihat Monitoring Pengguna.");
        setIsLoading(false);
        return;
      }
      if (!res.ok) throw new Error("Gagal memuat data monitoring");
      const json = (await res.json()) as MonitoringResponse;
      setData(json);
    } catch {
      setErrorMsg("Gagal terhubung ke layanan Monitoring Pengguna.");
    } finally {
      setIsLoading(false);
    }
  }, [adminUser, roleFilter, unitFilter, statusFilter, dateFilter, search]);

  useEffect(() => {
    loadData();
    const t = setInterval(loadData, 10000);
    return () => clearInterval(t);
  }, [loadData]);

  const handleRoleChange = async (email: string, newRole: SystemRole) => {
    if (!adminUser || !canManageRoles) return;
    setUpdatingEmail(email);
    try {
      const res = await fetch("/api/admin/monitoring", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...getEnterpriseAuthHeaders(adminUser),
        },
        body: JSON.stringify({ email, role: newRole }),
      });
      if (res.ok) {
        await loadData();
      }
    } finally {
      setUpdatingEmail(null);
    }
  };

  if (!canView) {
    return (
      <div className="max-w-xl mx-auto mt-12 bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-3">
        <div className="w-12 h-12 rounded-full bg-orange-50 border border-orange-200 flex items-center justify-center mx-auto text-orange-600">
          <Lock className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-extrabold text-slate-900">Akses Terbatas (RBAC)</h2>
        <p className="text-xs text-slate-500">
          Modul <strong>Monitoring Pengguna</strong> hanya dapat diakses oleh Super Admin atau Koordinator Wilayah.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto font-sans pb-12 select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
            Monitoring Pengguna &amp; Sesi Petugas
          </h1>
          <p className="text-xs md:text-sm text-slate-500 mt-1">
            Pemantauan status online berbasis heartbeat, distribusi role/instansi, dan riwayat login/logout • WIB
          </p>
        </div>
        <button
          type="button"
          onClick={loadData}
          className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 inline-flex items-center gap-2 self-start sm:self-auto cursor-pointer"
        >
          <RotateCw className="w-3.5 h-3.5 text-orange-600" />
          <span>Segarkan Status</span>
        </button>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 text-xs font-semibold">
          {errorMsg}
        </div>
      )}

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 flex items-center gap-3.5">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-600 shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] text-slate-500 font-semibold uppercase">Total Akun</p>
            <p className="text-2xl font-extrabold text-slate-900 tabular-nums">
              {isLoading ? "—" : data?.summary.totalAccounts ?? 0}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 flex items-center gap-3.5">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-600 shrink-0">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] text-slate-500 font-semibold uppercase">Pengguna Online</p>
            <p className="text-2xl font-extrabold text-orange-600 tabular-nums">
              {isLoading ? "—" : data?.summary.onlineUsers ?? 0}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 flex items-center gap-3.5">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-600 shrink-0">
            <LogIn className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] text-slate-500 font-semibold uppercase">Login Sukses Hari Ini</p>
            <p className="text-2xl font-extrabold text-slate-900 tabular-nums">
              {isLoading ? "—" : data?.summary.loginSuccessToday ?? 0}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 flex items-center gap-3.5">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-600 shrink-0">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] text-slate-500 font-semibold uppercase">Login Gagal Hari Ini</p>
            <p className="text-2xl font-extrabold text-slate-900 tabular-nums">
              {isLoading ? "—" : data?.summary.loginFailedToday ?? 0}
            </p>
          </div>
        </div>
      </div>

      {/* Distribusi Role & Instansi */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 space-y-4">
          <h2 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
            Distribusi Pengguna Berdasarkan Role
          </h2>
          <div className="space-y-3">
            {(data?.roleDistribution || []).map((r, idx) => {
              const total = Math.max(1, data?.summary.totalAccounts || 1);
              const pct = Math.round((r.count / total) * 100);
              return (
                <div key={idx} className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="font-bold text-slate-800">{r.role}</span>
                    <span className="font-extrabold text-orange-600 tabular-nums">
                      {r.count} akun ({pct}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-50 border border-slate-200 rounded-full h-2 overflow-hidden">
                    <div className="bg-orange-500 h-full rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 space-y-4">
          <h2 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
            Distribusi Pengguna Berdasarkan Instansi
          </h2>
          <div className="space-y-3">
            {(data?.unitDistribution || []).map((u, idx) => {
              const total = Math.max(1, data?.summary.totalAccounts || 1);
              const pct = Math.round((u.count / total) * 100);
              return (
                <div key={idx} className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="font-bold text-slate-800">{u.unitName}</span>
                    <span className="font-extrabold text-orange-600 tabular-nums">
                      {u.count} akun ({pct}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-50 border border-slate-200 rounded-full h-2 overflow-hidden">
                    <div className="bg-orange-500 h-full rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Filter & Tabel Pengguna */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
              Daftar Akun &amp; Status Online/Offline
            </h2>
            <p className="text-xs text-slate-400">
              Status diperbarui otomatis melalui heartbeat sesi aktif setiap 30 detik
            </p>
          </div>
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2">
            <div className="relative col-span-2 sm:w-48">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari nama / NIP..."
                className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none"
              />
            </div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              aria-label="Filter role"
              className="px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white font-medium"
            >
              <option value="semua">Semua Role</option>
              <option value="Super Admin">Super Admin</option>
              <option value="Koordinator Wilayah">Koordinator Wilayah</option>
              <option value="Auditor Keamanan">Auditor Keamanan</option>
              <option value="Operator Posko">Operator Posko</option>
            </select>
            <select
              value={unitFilter}
              onChange={(e) => setUnitFilter(e.target.value)}
              aria-label="Filter instansi"
              className="px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white font-medium"
            >
              <option value="semua">Semua Instansi</option>
              <option value="pemerintahan">Pemerintahan</option>
              <option value="bnpb_bpbd">BNPB</option>
              <option value="damkar">Dinas Damkar</option>
              <option value="medis">Medis / Dinkes</option>
              <option value="polisi">Polri</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Filter status"
              className="px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white font-medium"
            >
              <option value="semua">Semua Status</option>
              <option value="online">Online</option>
              <option value="idle">Idle</option>
              <option value="offline">Offline</option>
            </select>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              aria-label="Filter tanggal"
              className="px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white font-medium"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[760px]">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 uppercase text-[10px] tracking-wider">
                <th className="py-2.5 pr-4">Petugas</th>
                <th className="py-2.5 px-4">Instansi</th>
                <th className="py-2.5 px-4">Role RBAC</th>
                <th className="py-2.5 px-4">Status</th>
                <th className="py-2.5 px-4">Halaman &amp; Perangkat</th>
                <th className="py-2.5 pl-4 text-right">Last Activity (WIB)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(data?.usersTable || []).length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    Tidak ada akun yang cocok dengan filter.
                  </td>
                </tr>
              ) : (
                (data?.usersTable || []).map((u) => (
                  <tr key={u.email} className="hover:bg-orange-50/30 transition-colors">
                    <td className="py-3 pr-4">
                      <p className="font-bold text-slate-900">{u.name}</p>
                      <p className="text-[11px] text-slate-400">
                        {u.email} • NIP: {u.userId}
                      </p>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-700">{u.unitName}</td>
                    <td className="py-3 px-4">
                      {canManageRoles ? (
                        <select
                          value={u.role}
                          disabled={updatingEmail === u.email}
                          onChange={(e) => handleRoleChange(u.email, e.target.value as SystemRole)}
                          aria-label={`Ubah role ${u.name}`}
                          className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white text-[11px] font-bold text-slate-800 cursor-pointer"
                        >
                          <option value="Super Admin">Super Admin</option>
                          <option value="Koordinator Wilayah">Koordinator Wilayah</option>
                          <option value="Auditor Keamanan">Auditor Keamanan</option>
                          <option value="Operator Posko">Operator Posko</option>
                        </select>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-slate-700 text-[11px] font-bold">
                          {u.role}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                          u.status === "online"
                            ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                            : u.status === "idle"
                            ? "bg-amber-50 border-amber-200 text-amber-700"
                            : "bg-slate-100 border-slate-200 text-slate-500"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            u.status === "online"
                              ? "bg-emerald-500 animate-pulse"
                              : u.status === "idle"
                              ? "bg-amber-500"
                              : "bg-slate-400"
                          }`}
                        />
                        {u.status === "online" ? "Online" : u.status === "idle" ? "Idle" : "Offline"}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <code className="text-[11px] text-orange-600 font-mono block">{u.currentPath}</code>
                      <span className="text-[10px] text-slate-400">{u.deviceMeta}</span>
                    </td>
                    <td className="py-3 pl-4 text-right font-mono text-[11px] text-slate-600">
                      {formatWib(u.lastActivityAt)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sesi Aktif & Riwayat Login/Logout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Activity className="w-4 h-4 text-orange-600" />
              <span>Sesi Aktif Saat Ini ({data?.activeSessions.length ?? 0})</span>
            </h2>
          </div>
          {!data?.activeSessions.length ? (
            <p className="text-xs text-slate-400 py-6 text-center">Belum ada sesi aktif.</p>
          ) : (
            <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
              {data.activeSessions.map((s) => (
                <div
                  key={s.sessionId}
                  className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="min-w-0">
                    <p className="font-bold text-slate-900 truncate">
                      {s.userName} ({s.unitName})
                    </p>
                    <p className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                      {s.deviceMeta.includes("Mobile") ? (
                        <Smartphone className="w-3 h-3 text-orange-600" />
                      ) : (
                        <Monitor className="w-3 h-3 text-orange-600" />
                      )}
                      <span>{s.deviceMeta}</span>
                      <span>•</span>
                      <code className="text-orange-600">{s.currentPath}</code>
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[10px] font-mono text-slate-500 block">{s.ipAddress}</span>
                    <span className="text-[10px] font-bold text-orange-600 flex items-center gap-1 justify-end mt-0.5">
                      <Clock className="w-3 h-3" />
                      {formatWib(s.lastHeartbeatAt)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <LogIn className="w-4 h-4 text-orange-600" />
              <span>Riwayat Login &amp; Logout Terbaru</span>
            </h2>
          </div>
          {!data?.loginHistory.length ? (
            <p className="text-xs text-slate-400 py-6 text-center">Belum ada riwayat login tercatat.</p>
          ) : (
            <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
              {data.loginHistory.map((h) => (
                <div
                  key={h.id}
                  className="p-3.5 rounded-xl border border-slate-200 bg-white flex items-center justify-between gap-3 text-xs"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold border ${
                          h.action === "LOGIN"
                            ? "bg-orange-50 border-orange-200 text-orange-700"
                            : h.action === "LOGIN_FAILED"
                            ? "bg-rose-50 border-rose-200 text-rose-700"
                            : "bg-slate-100 border-slate-200 text-slate-600"
                        }`}
                      >
                        {h.action}
                      </span>
                      <span className="font-bold text-slate-900 truncate">{h.userName}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      {h.unitName} • {h.deviceMeta} • IP {h.ipAddress}
                    </p>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500 shrink-0">
                    {formatWib(h.timestamp)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

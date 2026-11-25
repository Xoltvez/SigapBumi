"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  ShieldAlert,
  Lock,
  KeyRound,
  UserCog,
  AlertTriangle,
  MonitorSmartphone,
  Settings,
  RotateCw,
} from "lucide-react";
import { useAdmin } from "@/components/layout/AdminShell";
import { getEnterpriseAuthHeaders } from "@/lib/analytics/client";
import { hasPermission } from "@/lib/rbac";

interface SecurityResponse {
  summary: {
    failedLoginCount: number;
    accessDeniedCount: number;
    roleChangesCount: number;
    unusualSessionsCount: number;
    suspiciousAccountsCount: number;
  };
  repeatedFailedLogins: { target: string; count: number; lastAt: string; ipAddress: string }[];
  unauthorizedAttempts: {
    id: string;
    userName: string;
    role: string;
    unitName: string;
    module: string;
    recordId: string;
    ipAddress: string;
    timestamp: string;
  }[];
  roleChanges: {
    id: string;
    actorName: string;
    targetEmail: string;
    before: Record<string, unknown> | null;
    after: Record<string, unknown> | null;
    timestamp: string;
  }[];
  unusualSessions: {
    email: string;
    userName: string;
    concurrentCount: number;
    devices: string[];
    lastActiveAt: string;
  }[];
  suspiciousAccounts: { account: string; reason: string; score: number; lastAt: string }[];
  configChanges: {
    id: string;
    userName: string;
    action: string;
    module: string;
    recordId: string;
    timestamp: string;
  }[];
}

function formatWib(iso: string): string {
  try {
    return (
      new Intl.DateTimeFormat("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Asia/Jakarta",
      }).format(new Date(iso)) + " WIB"
    );
  } catch {
    return iso;
  }
}

export default function AdminSecurityCenterPage() {
  const { adminUser } = useAdmin();
  const [data, setData] = useState<SecurityResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const canView = hasPermission("view_security_center", adminUser?.unit, adminUser?.role);

  const loadSecurity = useCallback(async () => {
    if (!adminUser) return;
    setErrorMsg(null);
    try {
      const res = await fetch("/api/admin/security", {
        headers: getEnterpriseAuthHeaders(adminUser),
        cache: "no-store",
      });
      if (res.status === 403) {
        setErrorMsg("Akses Ditolak (403): Peran Anda tidak memiliki izin membuka Security Center.");
        setIsLoading(false);
        return;
      }
      if (!res.ok) throw new Error("Gagal memuat Security Center");
      const json = (await res.json()) as SecurityResponse;
      setData(json);
    } catch {
      setErrorMsg("Gagal terhubung ke layanan Security Center.");
    } finally {
      setIsLoading(false);
    }
  }, [adminUser]);

  useEffect(() => {
    loadSecurity();
    const t = setInterval(loadSecurity, 15000);
    return () => clearInterval(t);
  }, [loadSecurity]);

  if (!canView) {
    return (
      <div className="max-w-xl mx-auto mt-12 bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-3">
        <div className="w-12 h-12 rounded-full bg-orange-50 border border-orange-200 flex items-center justify-center mx-auto text-orange-600">
          <Lock className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-extrabold text-slate-900">Akses Terbatas (RBAC)</h2>
        <p className="text-xs text-slate-500">
          Modul <strong>Security Center</strong> hanya dapat diakses oleh Super Admin atau Koordinator Wilayah.
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
            Security Center &amp; Deteksi Anomali
          </h1>
          <p className="text-xs md:text-sm text-slate-500 mt-1">
            Pemantauan percobaan akses tidak sah, login gagal berulang, mutasi role, dan sesi tidak wajar • WIB
          </p>
        </div>
        <button
          type="button"
          onClick={loadSecurity}
          className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 inline-flex items-center gap-2 self-start sm:self-auto cursor-pointer"
        >
          <RotateCw className="w-3.5 h-3.5 text-orange-600" />
          <span>Pindai Keamanan</span>
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
          <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-600 shrink-0">
            <KeyRound className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] text-slate-500 font-semibold uppercase">Login Gagal</p>
            <p className="text-2xl font-extrabold text-slate-900 tabular-nums">
              {isLoading ? "—" : data?.summary.failedLoginCount ?? 0}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-600 shrink-0">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] text-slate-500 font-semibold uppercase">Akses Ditolak</p>
            <p className="text-2xl font-extrabold text-orange-600 tabular-nums">
              {isLoading ? "—" : data?.summary.accessDeniedCount ?? 0}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-600 shrink-0">
            <UserCog className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] text-slate-500 font-semibold uppercase">Perubahan Role</p>
            <p className="text-2xl font-extrabold text-slate-900 tabular-nums">
              {isLoading ? "—" : data?.summary.roleChangesCount ?? 0}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-600 shrink-0">
            <MonitorSmartphone className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] text-slate-500 font-semibold uppercase">Sesi Tidak Wajar</p>
            <p className="text-2xl font-extrabold text-slate-900 tabular-nums">
              {isLoading ? "—" : data?.summary.unusualSessionsCount ?? 0}
            </p>
          </div>
        </div>
      </div>

      {/* Grid Security Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Login Gagal Berulang & Akun Mencurigakan */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 space-y-4">
          <h2 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-orange-600" />
            <span>Login Gagal Berulang &amp; Akun Mencurigakan</span>
          </h2>
          {!data?.repeatedFailedLogins.length && !data?.suspiciousAccounts.length ? (
            <p className="text-xs text-slate-400 py-6 text-center">
              Tidak ditemukan percobaan login gagal berulang atau aktivitas mencurigakan.
            </p>
          ) : (
            <div className="space-y-2.5">
              {data.repeatedFailedLogins.map((f, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 flex items-center justify-between text-xs"
                >
                  <div>
                    <p className="font-bold text-slate-900">{f.target}</p>
                    <p className="text-[11px] text-slate-500">IP {f.ipAddress} • {formatWib(f.lastAt)}</p>
                  </div>
                  <span className="px-2.5 py-1 rounded-md bg-rose-50 border border-rose-200 text-rose-700 font-extrabold">
                    {f.count}x Gagal
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Percobaan Akses Tidak Sah (ACCESS_DENIED) */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 space-y-4">
          <h2 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-orange-600" />
            <span>Percobaan Akses Tidak Sah (ACCESS_DENIED)</span>
          </h2>
          {!data?.unauthorizedAttempts.length ? (
            <p className="text-xs text-slate-400 py-6 text-center">
              Tidak ada percobaan akses tanpa hak akses yang tercatat.
            </p>
          ) : (
            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
              {data.unauthorizedAttempts.map((u) => (
                <div
                  key={u.id}
                  className="p-3.5 rounded-xl border border-rose-200 bg-rose-50/30 flex items-center justify-between text-xs"
                >
                  <div>
                    <p className="font-bold text-slate-900">
                      {u.userName} ({u.role})
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Modul: {u.module} • Izin: <code>{u.recordId}</code>
                    </p>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500 shrink-0">
                    {formatWib(u.timestamp)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Perubahan Role Admin & Sesi Tidak Wajar */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 space-y-4">
          <h2 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <UserCog className="w-4 h-4 text-orange-600" />
            <span>Riwayat Perubahan Role Administrator</span>
          </h2>
          {!data?.roleChanges.length ? (
            <p className="text-xs text-slate-400 py-6 text-center">
              Belum ada perubahan role administrator yang tercatat.
            </p>
          ) : (
            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
              {data.roleChanges.map((rc) => (
                <div
                  key={rc.id}
                  className="p-3.5 rounded-xl border border-slate-200 bg-white flex items-center justify-between text-xs"
                >
                  <div>
                    <p className="font-bold text-slate-900">{rc.targetEmail}</p>
                    <p className="text-[11px] text-slate-500">
                      Oleh {rc.actorName} •{" "}
                      <span className="text-slate-600">{String(rc.before?.role || "-")}</span> →{" "}
                      <span className="text-orange-600 font-bold">{String(rc.after?.role || "-")}</span>
                    </p>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 shrink-0">
                    {formatWib(rc.timestamp)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sesi Tidak Wajar & Perubahan Konfigurasi */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 space-y-4">
          <h2 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Settings className="w-4 h-4 text-orange-600" />
            <span>Sesi Paralel Tidak Wajar &amp; Mutasi Sensitif</span>
          </h2>
          {!data?.unusualSessions.length && !data?.configChanges.length ? (
            <p className="text-xs text-slate-400 py-6 text-center">
              Semua sesi aktif normal dan belum ada mutasi konfigurasi sensitif.
            </p>
          ) : (
            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
              {data.unusualSessions.map((us, idx) => (
                <div
                  key={`us-${idx}`}
                  className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/40 text-xs"
                >
                  <p className="font-bold text-slate-900">
                    Sesi Ganda Terdeteksi: {us.userName} ({us.concurrentCount} sesi aktif)
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Perangkat: {us.devices.join(", ")}
                  </p>
                </div>
              ))}
              {data.configChanges.map((cfg) => (
                <div
                  key={cfg.id}
                  className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center justify-between text-xs"
                >
                  <div>
                    <p className="font-bold text-slate-800">
                      {cfg.action} • {cfg.module}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Oleh {cfg.userName} ({cfg.recordId})
                    </p>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 shrink-0">
                    {formatWib(cfg.timestamp)}
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

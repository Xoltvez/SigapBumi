"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  ClipboardList,
  Search,
  Download,
  Archive,
  Eye,
  X,
  ChevronLeft,
  ChevronRight,
  Lock,
  ShieldCheck,
  RotateCw,
} from "lucide-react";
import { useAdmin } from "@/components/layout/AdminShell";
import { getEnterpriseAuthHeaders } from "@/lib/analytics/client";
import { hasPermission } from "@/lib/rbac";

interface AuditLogItem {
  id: string;
  userId: string;
  userName: string;
  role: string;
  unit: string;
  unitName: string;
  action: string;
  module: string;
  recordId: string;
  timestamp: string;
  ipAddress: string;
  deviceMeta: string;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
  archived?: boolean;
}

interface AuditLogsResponse {
  items: AuditLogItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  modules: string[];
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
        second: "2-digit",
        timeZone: "Asia/Jakarta",
      }).format(new Date(iso)) + " WIB"
    );
  } catch {
    return iso;
  }
}

export default function AdminAuditLogsPage() {
  const { adminUser } = useAdmin();
  const [data, setData] = useState<AuditLogsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("semua");
  const [moduleFilter, setModuleFilter] = useState("semua");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [includeArchived, setIncludeArchived] = useState(false);
  const [selectedLog, setSelectedLog] = useState<AuditLogItem | null>(null);
  const [archiveNotice, setArchiveNotice] = useState<string | null>(null);

  const canView = hasPermission("view_audit_logs", adminUser?.unit, adminUser?.role);
  const canExport = hasPermission("export_audit_logs", adminUser?.unit, adminUser?.role);
  const canManageRoles = hasPermission("manage_roles", adminUser?.unit, adminUser?.role);

  const loadLogs = useCallback(async () => {
    if (!adminUser) return;
    setErrorMsg(null);
    try {
      const qs = new URLSearchParams({
        page: String(page),
        limit: "15",
        action: actionFilter,
        module: moduleFilter,
        dateFrom,
        dateTo,
        includeArchived: String(includeArchived),
        search,
      });
      const res = await fetch(`/api/admin/audit-logs?${qs.toString()}`, {
        headers: getEnterpriseAuthHeaders(adminUser),
        cache: "no-store",
      });
      if (res.status === 403) {
        setErrorMsg("Akses Ditolak (403): Peran Anda tidak berwenang melihat Audit Trail.");
        setIsLoading(false);
        return;
      }
      if (!res.ok) throw new Error("Gagal memuat audit log");
      const json = (await res.json()) as AuditLogsResponse;
      setData(json);
    } catch {
      setErrorMsg("Gagal terhubung ke layanan Audit Trail.");
    } finally {
      setIsLoading(false);
    }
  }, [adminUser, page, actionFilter, moduleFilter, dateFrom, dateTo, includeArchived, search]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const handleExportCsv = async () => {
    if (!adminUser || !canExport) return;
    const qs = new URLSearchParams({
      format: "csv",
      action: actionFilter,
      module: moduleFilter,
      dateFrom,
      dateTo,
      includeArchived: String(includeArchived),
      search,
    });
    const res = await fetch(`/api/admin/audit-logs?${qs.toString()}`, {
      headers: getEnterpriseAuthHeaders(adminUser),
    });
    if (!res.ok) {
      setErrorMsg("Ekspor ditolak oleh kebijakan RBAC.");
      return;
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sigapbumi-audit-logs-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    loadLogs();
  };

  const handleArchiveOld = async () => {
    if (!adminUser || !canManageRoles) return;
    const res = await fetch("/api/admin/audit-logs", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getEnterpriseAuthHeaders(adminUser),
      },
      body: JSON.stringify({ archiveOlderThanDays: 30 }),
    });
    if (res.ok) {
      const json = (await res.json()) as { archivedCount: number };
      setArchiveNotice(`${json.archivedCount} log berusia >30 hari berhasil diarsipkan.`);
      loadLogs();
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
          Modul <strong>Audit Trail &amp; Security Log</strong> hanya dapat diakses oleh role berwenang.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto font-sans pb-12 select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
              Audit Trail &amp; Security Log
            </h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-orange-50 border border-orange-200 text-[11px] font-bold text-orange-700">
              <ShieldCheck className="w-3.5 h-3.5" />
              Immutable
            </span>
          </div>
          <p className="text-xs md:text-sm text-slate-500 mt-1">
            Rekam jejak permanen seluruh aktivitas penting sistem (terlindungi dari ubah/hapus) • WIB
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={loadLogs}
            className="px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 inline-flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCw className="w-3.5 h-3.5 text-orange-600" />
            <span>Segarkan</span>
          </button>

          {canManageRoles && (
            <button
              type="button"
              onClick={handleArchiveOld}
              className="px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 inline-flex items-center gap-1.5 cursor-pointer"
              title="Arsipkan log yang lebih lama dari 30 hari"
            >
              <Archive className="w-3.5 h-3.5 text-slate-500" />
              <span>Arsip &gt;30 Hari</span>
            </button>
          )}

          {canExport && (
            <button
              type="button"
              onClick={handleExportCsv}
              className="px-3.5 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Ekspor CSV</span>
            </button>
          )}
        </div>
      </div>

      {archiveNotice && (
        <div className="p-3.5 rounded-xl border border-orange-200 bg-orange-50 text-orange-800 text-xs font-semibold flex items-center justify-between">
          <span>{archiveNotice}</span>
          <button type="button" onClick={() => setArchiveNotice(null)} className="cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 text-xs font-semibold">
          {errorMsg}
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2.5">
          <div className="relative lg:col-span-2">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Cari user, role, record ID, IP..."
              className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none"
            />
          </div>

          <select
            value={actionFilter}
            onChange={(e) => {
              setActionFilter(e.target.value);
              setPage(1);
            }}
            aria-label="Filter aksi audit"
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white font-medium"
          >
            <option value="semua">Semua Action</option>
            <option value="LOGIN">LOGIN</option>
            <option value="LOGOUT">LOGOUT</option>
            <option value="LOGIN_FAILED">LOGIN_FAILED</option>
            <option value="CREATE">CREATE</option>
            <option value="UPDATE">UPDATE</option>
            <option value="DELETE">DELETE</option>
            <option value="CHANGE_STATUS">CHANGE_STATUS</option>
            <option value="CHANGE_ROLE">CHANGE_ROLE</option>
            <option value="EXPORT_DATA">EXPORT_DATA</option>
            <option value="ACCESS_DENIED">ACCESS_DENIED</option>
          </select>

          <select
            value={moduleFilter}
            onChange={(e) => {
              setModuleFilter(e.target.value);
              setPage(1);
            }}
            aria-label="Filter modul"
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white font-medium"
          >
            <option value="semua">Semua Modul</option>
            {(data?.modules || []).map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>

          <input
            type="date"
            value={dateFrom}
            onChange={(e) => {
              setDateFrom(e.target.value);
              setPage(1);
            }}
            aria-label="Tanggal mulai"
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white font-medium"
          />

          <input
            type="date"
            value={dateTo}
            onChange={(e) => {
              setDateTo(e.target.value);
              setPage(1);
            }}
            aria-label="Tanggal akhir"
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white font-medium"
          />
        </div>

        <label className="inline-flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
          <input
            type="checkbox"
            checked={includeArchived}
            onChange={(e) => {
              setIncludeArchived(e.target.checked);
              setPage(1);
            }}
            className="rounded border-slate-300 text-orange-600"
          />
          <span>Sertakan log yang sudah diarsipkan</span>
        </label>
      </div>

      {/* Tabel Audit Log */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[820px]">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 uppercase text-[10px] tracking-wider">
                <th className="py-2.5 pr-4">Waktu (WIB)</th>
                <th className="py-2.5 px-4">Pengguna &amp; Role</th>
                <th className="py-2.5 px-4">Instansi</th>
                <th className="py-2.5 px-4">Action</th>
                <th className="py-2.5 px-4">Modul &amp; Record ID</th>
                <th className="py-2.5 px-4">IP &amp; Perangkat</th>
                <th className="py-2.5 pl-4 text-right">Detail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Memuat rekaman audit trail...
                  </td>
                </tr>
              ) : (data?.items || []).length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Belum ada log aktivitas yang sesuai dengan filter.
                  </td>
                </tr>
              ) : (
                (data?.items || []).map((log) => (
                  <tr key={log.id} className="hover:bg-orange-50/30 transition-colors">
                    <td className="py-3 pr-4 font-mono text-[11px] text-slate-600 whitespace-nowrap">
                      {formatWib(log.timestamp)}
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-bold text-slate-900">{log.userName}</p>
                      <p className="text-[10px] text-slate-400">
                        {log.role} • ID: {log.userId}
                      </p>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-700 whitespace-nowrap">
                      {log.unitName}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold border ${
                          log.action === "ACCESS_DENIED" || log.action === "LOGIN_FAILED" || log.action === "DELETE"
                            ? "bg-rose-50 border-rose-200 text-rose-700"
                            : log.action === "CHANGE_ROLE" || log.action === "EXPORT_DATA"
                            ? "bg-amber-50 border-amber-200 text-amber-800"
                            : "bg-orange-50 border-orange-200 text-orange-700"
                        }`}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-bold text-slate-800">{log.module}</p>
                      <code className="text-[10px] text-slate-500 font-mono">{log.recordId}</code>
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-mono text-[11px] text-slate-600">{log.ipAddress}</p>
                      <p className="text-[10px] text-slate-400">{log.deviceMeta}</p>
                    </td>
                    <td className="py-3 pl-4 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedLog(log)}
                        className="px-2.5 py-1 rounded-lg border border-slate-200 hover:border-orange-300 bg-white text-slate-700 text-[11px] font-semibold inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5 text-orange-600" />
                        <span>Detail</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data && data.pagination.totalPages > 1 && (
          <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
            <span className="text-slate-500">
              Menampilkan halaman <strong>{data.pagination.page}</strong> dari{" "}
              <strong>{data.pagination.totalPages}</strong> ({data.pagination.total} log)
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="p-2 rounded-lg border border-slate-200 bg-white disabled:opacity-40 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                disabled={page >= data.pagination.totalPages}
                onClick={() => setPage((p) => Math.min(data.pagination.totalPages, p + 1))}
                className="p-2 rounded-lg border border-slate-200 bg-white disabled:opacity-40 cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Detail Log Before / After */}
      {selectedLog && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setSelectedLog(null)}
        >
          <div
            className="bg-white border border-slate-200 rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-orange-600" />
                <h3 className="text-sm font-extrabold text-slate-900">Detail Rekaman Audit</h3>
              </div>
              <button type="button" onClick={() => setSelectedLog(null)} className="cursor-pointer text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-400 block">ID Log</span>
                <code className="font-mono text-slate-800">{selectedLog.id}</code>
              </div>
              <div>
                <span className="text-slate-400 block">Waktu (WIB)</span>
                <span className="font-semibold text-slate-800">{formatWib(selectedLog.timestamp)}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Pengguna</span>
                <span className="font-bold text-slate-900">{selectedLog.userName}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Role / Instansi</span>
                <span className="font-semibold text-slate-800">
                  {selectedLog.role} ({selectedLog.unitName})
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] font-bold uppercase text-slate-500 block mb-1">
                  Data Sebelum (Before)
                </span>
                <pre className="text-[11px] font-mono text-slate-700 whitespace-pre-wrap break-all">
                  {selectedLog.before ? JSON.stringify(selectedLog.before, null, 2) : "—"}
                </pre>
              </div>
              <div className="p-3 rounded-xl bg-orange-50/40 border border-orange-200">
                <span className="text-[10px] font-bold uppercase text-orange-700 block mb-1">
                  Data Sesudah (After)
                </span>
                <pre className="text-[11px] font-mono text-slate-800 whitespace-pre-wrap break-all">
                  {selectedLog.after ? JSON.stringify(selectedLog.after, null, 2) : "—"}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

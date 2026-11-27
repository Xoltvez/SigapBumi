"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  Bell,
  CheckCircle2,
  Search,
  Clock,
  RefreshCw,
  CheckCheck,
  Radio,
  ShieldCheck,
  AlertTriangle,
} from "lucide-react";
import { BackButton } from "@/components/common/BackButton";
import DisasterIcon from "@/components/common/DisasterIcon";
import {
  fetchLiveReports,
  getCachedLiveReports,
  getMySubmittedCodes,
  parseReportTimestamp,
  type LiveReportItem,
} from "@/lib/services/reports";
import { getCurrentUser } from "@/lib/auth";
import { supabase } from "@/lib/supabase/client";

const NOTIF_READ_STORAGE_KEY = "sigapbumi_notif_read_keys";

function getReadKeys(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(NOTIF_READ_STORAGE_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? new Set(parsed) : new Set();
  } catch {
    return new Set();
  }
}

function saveReadKeys(keys: Set<string>): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(NOTIF_READ_STORAGE_KEY, JSON.stringify(Array.from(keys).slice(-200)));
    window.dispatchEvent(new CustomEvent("sigapbumi:notif-read"));
  } catch {}
}

interface NotificationItem {
  key: string;
  id: string;
  tracking_code: string;
  title: string;
  body: string;
  time: string;
  rawTime: number;
  status: LiveReportItem["status"];
  disaster_type: LiveReportItem["disaster_type"];
  isMine: boolean;
  unread: boolean;
}

function buildNotifTitleAndBody(r: LiveReportItem, isMine: boolean): { title: string; body: string } {
  const prefix = isMine ? "Laporan Anda" : "Laporan Masuk";
  if (r.status === "ditindaklanjuti") {
    return {
      title: `${prefix} Sedang Ditindaklanjuti: ${r.title}`,
      body: `Tim operasional telah dikerahkan ke ${r.address}. Pantau perkembangan langsung melalui menu Lacak.`,
    };
  }
  if (r.status === "diverifikasi") {
    return {
      title: `${prefix} Telah Diverifikasi: ${r.title}`,
      body: `Petugas posko telah memverifikasi laporan kejadian di ${r.address} dan menyiapkan penanganan.`,
    };
  }
  if (r.status === "selesai") {
    return {
      title: `Penanganan Selesai: ${r.title}`,
      body: `Kejadian di ${r.address} telah dinyatakan selesai ditangani oleh tim lapangan.`,
    };
  }
  if (r.status === "ditolak") {
    return {
      title: `Laporan Ditolak: ${r.title}`,
      body: `Laporan di ${r.address} tidak dapat diproses setelah peninjauan petugas posko.`,
    };
  }
  return {
    title: isMine ? `Laporan Anda Diterima Sistem: ${r.title}` : `Laporan Bencana Baru: ${r.title}`,
    body: `Kejadian dilaporkan di ${r.address}. Menunggu verifikasi dan tindak lanjut petugas posko.`,
  };
}

export function NotifikasiClient() {
  const [reports, setReports] = useState<LiveReportItem[]>(() => getCachedLiveReports() || []);
  const [isLoading, setIsLoading] = useState<boolean>(() => !getCachedLiveReports());
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [readKeys, setReadKeys] = useState<Set<string>>(() => getReadKeys());
  const [filterTab, setFilterTab] = useState<"semua" | "saya" | "ditindaklanjuti" | "selesai">("semua");
  const [myCodes, setMyCodes] = useState<Set<string>>(new Set());
  const [currentUserId, setCurrentUserId] = useState<string | undefined>(undefined);
  const [currentUserEmail, setCurrentUserEmail] = useState<string | undefined>(undefined);

  useEffect(() => {
    const codes = new Set(getMySubmittedCodes().map((c) => c.toUpperCase()));
    setMyCodes(codes);
    const user = getCurrentUser();
    if (user) {
      setCurrentUserId(user.id);
      setCurrentUserEmail(user.email?.toLowerCase());
    }
  }, []);

  const loadNotifications = useCallback(async (forceRefresh = false, background = false) => {
    if (!background) setIsLoading((prev) => (reports.length === 0 ? true : prev));
    else setIsRefreshing(true);

    try {
      const live = await fetchLiveReports(forceRefresh, { lean: true });
      setReports(live || []);
    } catch (err) {
      console.warn("Gagal memuat notifikasi live:", err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [reports.length]);

  useEffect(() => {
    loadNotifications(false, Boolean(getCachedLiveReports()));

    let debounceTimer: ReturnType<typeof setTimeout> | null = null;
    const scheduleRefresh = () => {
      setMyCodes(new Set(getMySubmittedCodes().map((c) => c.toUpperCase())));
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        loadNotifications(true, true);
      }, 300);
    };

    const handleVisibility = () => {
      if (document.visibilityState === "visible") scheduleRefresh();
    };

    if (typeof window !== "undefined") {
      window.addEventListener("sigapbumi:sos-created", scheduleRefresh);
      window.addEventListener("sigapbumi:sos-updated", scheduleRefresh);
      window.addEventListener("sigapbumi:report-updated", scheduleRefresh);
      window.addEventListener("sigapbumi:report-deleted", scheduleRefresh);
      window.addEventListener("storage", scheduleRefresh);
      document.addEventListener("visibilitychange", handleVisibility);
    }

    const channel = supabase
      .channel(`citizen_notifications_realtime_${Math.random().toString(36).slice(2, 8)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "reports" }, scheduleRefresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "report_status_logs" }, scheduleRefresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "sos_alerts" }, scheduleRefresh)
      .subscribe();

    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      if (typeof window !== "undefined") {
        window.removeEventListener("sigapbumi:sos-created", scheduleRefresh);
        window.removeEventListener("sigapbumi:sos-updated", scheduleRefresh);
        window.removeEventListener("sigapbumi:report-updated", scheduleRefresh);
        window.removeEventListener("sigapbumi:report-deleted", scheduleRefresh);
        window.removeEventListener("storage", scheduleRefresh);
        document.removeEventListener("visibilitychange", handleVisibility);
      }
      supabase.removeChannel(channel);
    };
  }, [loadNotifications]);

  const notifications = useMemo<NotificationItem[]>(() => {
    return (reports || [])
      .map((r) => {
        const codeUpper = (r.tracking_code || "").toUpperCase();
        const isMine = Boolean(
          myCodes.has(codeUpper) ||
            (currentUserId && r.reporter_id === currentUserId) ||
            (currentUserEmail && r.user_email?.toLowerCase() === currentUserEmail)
        );
        const key = `${r.id}:${r.status}`;
        const { title, body } = buildNotifTitleAndBody(r, isMine);
        return {
          key,
          id: r.id,
          tracking_code: r.tracking_code,
          title,
          body,
          time: r.created_at,
          rawTime: parseReportTimestamp(r.raw_created_at || r.created_at),
          status: r.status,
          disaster_type: r.disaster_type,
          isMine,
          unread: !readKeys.has(key),
        };
      })
      .sort((a, b) => b.rawTime - a.rawTime)
      .slice(0, 40);
  }, [reports, myCodes, currentUserId, currentUserEmail, readKeys]);

  const filteredNotifications = useMemo(() => {
    if (filterTab === "saya") return notifications.filter((n) => n.isMine);
    if (filterTab === "ditindaklanjuti") {
      return notifications.filter((n) => n.status === "ditindaklanjuti" || n.status === "diverifikasi");
    }
    if (filterTab === "selesai") return notifications.filter((n) => n.status === "selesai");
    return notifications;
  }, [notifications, filterTab]);

  const unreadCount = useMemo(
    () => notifications.filter((n) => n.unread).length,
    [notifications]
  );

  const markOneRead = (key: string) => {
    if (readKeys.has(key)) return;
    const next = new Set(readKeys);
    next.add(key);
    setReadKeys(next);
    saveReadKeys(next);
  };

  const markAllRead = () => {
    const next = new Set(readKeys);
    notifications.forEach((n) => next.add(n.key));
    setReadKeys(next);
    saveReadKeys(next);
  };

  return (
    <main className="flex-1 w-full max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10 pb-28 md:pb-12 space-y-6">
      {/* Breadcrumb & Header */}
      <div className="space-y-3">
        <BackButton href="/" label="Kembali ke Beranda" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-soft text-primary-hover flex items-center justify-center shrink-0">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl md:text-2xl font-extrabold text-ink tracking-tight">
                  Pusat Notifikasi Warga
                </h1>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-[10px] font-bold text-emerald-700">
                  <Radio className="w-2.5 h-2.5 animate-pulse" />
                  <span>Realtime</span>
                </span>
              </div>
              <p className="text-xs text-ink-soft mt-0.5">
                Pembaruan otomatis laporan bencana terbaru &amp; status tindak lanjut laporan Anda
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {unreadCount > 0 && (
              <span className="text-xs px-3 py-1.5 rounded-xl bg-orange-50 border border-orange-200 text-orange-700 font-bold">
                {unreadCount} Baru
              </span>
            )}
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 shadow-2xs cursor-pointer transition-colors"
              >
                <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Tandai Dibaca</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => loadNotifications(true, true)}
              disabled={isRefreshing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 shadow-2xs cursor-pointer transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-orange-600" : "text-slate-500"}`} />
              <span>Segarkan</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
        {[
          { id: "semua", label: `Semua (${notifications.length})` },
          { id: "saya", label: `Laporan Anda (${notifications.filter((n) => n.isMine).length})` },
          {
            id: "ditindaklanjuti",
            label: `Ditindaklanjuti (${notifications.filter((n) => n.status === "ditindaklanjuti" || n.status === "diverifikasi").length})`,
          },
          { id: "selesai", label: `Selesai (${notifications.filter((n) => n.status === "selesai").length})` },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setFilterTab(tab.id as typeof filterTab)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap border transition-all cursor-pointer ${
              filterTab === tab.id
                ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Notification List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="p-4 rounded-xl border border-slate-200 bg-white animate-pulse space-y-2">
                <div className="h-4 w-2/3 bg-slate-200 rounded" />
                <div className="h-3 w-full bg-slate-100 rounded" />
                <div className="h-3 w-1/3 bg-slate-100 rounded" />
              </div>
            ))}
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="p-10 rounded-2xl border border-slate-200 bg-white text-center space-y-2">
            <Bell className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-sm font-bold text-slate-700">Belum Ada Notifikasi</p>
            <p className="text-xs text-slate-500">
              {filterTab === "saya"
                ? "Anda belum mengirim laporan atau panggilan SOS dari perangkat ini."
                : "Notifikasi akan otomatis muncul begitu ada laporan baru atau perubahan status."}
            </p>
          </div>
        ) : (
          filteredNotifications.map((item) => (
            <div
              key={item.key}
              onClick={() => markOneRead(item.key)}
              className={`p-4 rounded-xl border transition-all ${
                item.unread
                  ? "bg-white border-orange-300 shadow-xs"
                  : "bg-white/85 border-slate-200/80"
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                      item.status === "ditindaklanjuti"
                        ? "bg-amber-50 text-amber-600 border border-amber-200"
                        : item.status === "selesai"
                        ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                        : item.status === "diverifikasi"
                        ? "bg-blue-50 text-blue-600 border border-blue-200"
                        : "bg-orange-50 text-orange-600 border border-orange-200"
                    }`}
                  >
                    <DisasterIcon type={item.disaster_type} size={18} />
                  </div>

                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-sm font-bold text-ink">{item.title}</h2>
                      {item.unread && (
                        <span className="w-2 h-2 rounded-full bg-orange-500 shrink-0" />
                      )}
                      {item.isMine && (
                        <span className="px-2 py-0.5 rounded-full bg-orange-100 text-orange-800 text-[10px] font-bold inline-flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3" />
                          <span>Laporan Anda</span>
                        </span>
                      )}
                      {item.status === "ditindaklanjuti" && (
                        <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                          Ditindaklanjuti
                        </span>
                      )}
                      {item.status === "selesai" && (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Selesai</span>
                        </span>
                      )}
                      {item.status === "ditolak" && (
                        <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-bold inline-flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          <span>Ditolak</span>
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-ink-soft leading-relaxed">{item.body}</p>
                    <div className="flex items-center gap-3 pt-1 text-[11px] text-ink-muted">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{item.time}</span>
                      </span>
                      <span>·</span>
                      <span className="font-mono font-bold text-primary">
                        {item.tracking_code}
                      </span>
                    </div>
                  </div>
                </div>

                <Link
                  href={`/lacak?kode=${encodeURIComponent(item.tracking_code)}`}
                  className="shrink-0 self-start px-3 py-1.5 rounded-xl border border-orange-200 bg-orange-50/70 hover:bg-orange-100 text-xs font-bold text-orange-700 inline-flex items-center gap-1.5 transition-colors"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>Lihat Lacak</span>
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </main>
  );
}

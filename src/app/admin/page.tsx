"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Radio,
  Clock,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Send,
  Flame,
  Waves,
  Mountain,
  AlertTriangle,
  Filter,
} from "lucide-react";
import { useAdmin } from "@/components/layout/AdminShell";
import type { ReportStatus, DisasterType, SosAssistanceType } from "@/types";
import { supabase } from "@/lib/supabase/client";
import { fetchLiveReports, updateReportStatusLive } from "@/lib/services/reports";

interface AdminReportItem {
  id: string;
  tracking_code: string;
  disaster_type: DisasterType;
  target_agency: SosAssistanceType;
  title: string;
  location: string;
  time: string;
  status: ReportStatus;
  priority: "tinggi" | "sedang" | "normal";
  confirmation_count: number;
}

interface SosAlertItem {
  id: string;
  sender_name: string;
  assistance_type: SosAssistanceType;
  location: string;
  coordinates: string;
  time: string;
  status: "aktif" | "ditangani";
}

const INITIAL_SOS_ALERTS: SosAlertItem[] = [
  {
    id: "sos-1",
    sender_name: "Warga Kalideres (via GPS)",
    assistance_type: "damkar",
    location: "Kelurahan Semanan, Kalideres, Jakarta Barat",
    coordinates: "-6.155, 106.723",
    time: "2 menit lalu",
    status: "aktif",
  },
  {
    id: "sos-2",
    sender_name: "Warga Cisarua (via GPS)",
    assistance_type: "medis",
    location: "Jalan Raya Puncak KM 82, Cisarua, Bogor",
    coordinates: "-6.698, 106.942",
    time: "8 menit lalu",
    status: "aktif",
  },
];

const INITIAL_REPORTS: AdminReportItem[] = [
  {
    id: "rep-1",
    tracking_code: "LPR-8F3K2Q",
    disaster_type: "banjir",
    target_agency: "damkar",
    title: "Banjir Luapan Kali Semanan 60 cm",
    location: "Kalideres, Jakarta Barat",
    time: "14:15 WIB",
    status: "ditindaklanjuti",
    priority: "tinggi",
    confirmation_count: 24,
  },
  {
    id: "rep-2",
    tracking_code: "LPR-4K9W1Z",
    disaster_type: "longsor",
    target_agency: "bnpb_bpbd",
    title: "Tebing Penahan Longsor Ambrol Menutup Jalan",
    location: "Cisarua, Kab. Bogor",
    time: "15:30 WIB",
    status: "diverifikasi",
    priority: "tinggi",
    confirmation_count: 12,
  },
  {
    id: "rep-3",
    tracking_code: "LPR-7N2V9Q",
    disaster_type: "banjir",
    target_agency: "medis",
    title: "Genangan Air Masuk Pemukiman Warga",
    location: "Jatinegara, Jakarta Timur",
    time: "15:02 WIB",
    status: "diterima",
    priority: "sedang",
    confirmation_count: 16,
  },
  {
    id: "rep-4",
    tracking_code: "LPR-2X7M9P",
    disaster_type: "kebakaran",
    target_agency: "damkar",
    title: "Kebakaran Pemukiman Padat Tambora",
    location: "Tambora, Jakarta Barat",
    time: "11:20 WIB",
    status: "selesai",
    priority: "tinggi",
    confirmation_count: 31,
  },
  {
    id: "rep-5",
    tracking_code: "LPR-9B2X7M",
    disaster_type: "gempa",
    target_agency: "polisi",
    title: "Kabar Hoaks Gempa Bumi Megathrust",
    location: "Pelabuhan Ratu, Sukabumi",
    time: "10:05 WIB",
    status: "ditolak",
    priority: "normal",
    confirmation_count: 0,
  },
];

export default function AdminDashboardPage() {
  const { activeUnit, activeUnitName } = useAdmin();
  const [reports, setReports] = useState<AdminReportItem[]>(INITIAL_REPORTS);
  const [sosAlerts, setSosAlerts] = useState<SosAlertItem[]>(INITIAL_SOS_ALERTS);
  const [isLiveConnected, setIsLiveConnected] = useState<boolean>(false);
  const [newReportNotice, setNewReportNotice] = useState<string | null>(null);

  // Muat data live dari Supabase dan pasang realtime subscription
  React.useEffect(() => {
    let isMounted = true;

    async function loadReports() {
      try {
        const live = await fetchLiveReports();
        if (isMounted && live && live.length > 0) {
          const formatted: AdminReportItem[] = live.map((r) => ({
            id: r.id,
            tracking_code: r.tracking_code,
            disaster_type: r.disaster_type,
            target_agency: r.target_agency,
            title: r.title,
            location: r.address,
            time: r.created_at,
            status: r.status,
            priority: r.priority,
            confirmation_count: r.confirmation_count,
          }));
          setReports(formatted);
          setIsLiveConnected(true);
        }
      } catch (err) {
        console.warn("Gagal memuat data live admin:", err);
      }
    }

    loadReports();

    // Pasang realtime subscription
    const channel = supabase
      .channel("admin_reports_realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "reports" },
        (payload) => {
          const newRow = payload.new as { tracking_code?: string; title?: string };
          setNewReportNotice(
            `Laporan baru masuk: [${newRow.tracking_code || "LPR"}] ${newRow.title || "Kejadian Bencana"}`
          );
          setTimeout(() => setNewReportNotice(null), 6000);
          loadReports();
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "reports" },
        () => {
          loadReports();
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  // Filter reports and SOS by active agency unit
  const filteredReports = reports.filter((r) => {
    if (activeUnit === "semua" || activeUnit === "bnpb_bpbd") return true;
    return r.target_agency === activeUnit;
  });

  const filteredSos = sosAlerts.filter((s) => {
    if (activeUnit === "semua" || activeUnit === "bnpb_bpbd") return true;
    return s.assistance_type === activeUnit;
  });

  const handleUpdateStatus = async (id: string, newStatus: ReportStatus) => {
    // 1. Optimistic update
    setReports((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r))
    );

    // 2. Simpan ke Supabase jika ada ID valid
    try {
      await updateReportStatusLive(id, newStatus, `Status diverifikasi oleh petugas ${activeUnitName}`);
    } catch (err) {
      console.warn("Gagal update status di database:", err);
    }
  };

  const handleHandleSos = (id: string) => {
    setSosAlerts((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status: "ditangani" } : s))
    );
  };

  const getDisasterIcon = (type: DisasterType) => {
    switch (type) {
      case "banjir":
        return <Waves className="w-4 h-4 text-info" />;
      case "longsor":
        return <Mountain className="w-4 h-4 text-ink" />;
      case "kebakaran":
        return <Flame className="w-4 h-4 text-danger" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-warning" />;
    }
  };

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      {/* Realtime Notification Banner if a new report arrives */}
      {newReportNotice && (
        <div className="p-4 rounded-lg bg-info-soft border-2 border-info text-info-text font-semibold text-sm flex items-center justify-between shadow-sm animate-bounce">
          <div className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-info animate-pulse" />
            <span>{newReportNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => setNewReportNotice(null)}
            className="text-xs px-2 py-1 rounded bg-info text-white font-bold"
          >
            Tutup
          </button>
        </div>
      )}

      {/* Top Welcome & Agency Context Banner */}
      <div className="bg-surface border border-line rounded-lg p-5 shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-success animate-pulse" />
            <h1 className="text-xl md:text-2xl font-bold text-ink">
              Pusat Komando & Kendali Bencana Terpadu
            </h1>
            {isLiveConnected && (
              <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-success-soft text-success-text border border-success/30">
                <span className="w-1.5 h-1.5 rounded-full bg-success animate-ping" />
                Live Sync Supabase
              </span>
            )}
          </div>
          <p className="text-xs text-ink-soft mt-1">
            Menampilkan data operasional untuk unit: <strong className="text-primary">{activeUnitName}</strong>.
          </p>
        </div>

        <Link
          href="/admin/sos"
          className="h-10 px-4 rounded-md bg-danger hover:bg-danger/90 text-white text-xs font-bold inline-flex items-center gap-2 transition-colors shadow-sm shrink-0"
        >
          <Radio className="w-4 h-4 animate-pulse" />
          <span>Buka Radar SOS Real-time</span>
        </Link>
      </div>

      {/* KPI Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-surface border border-line rounded-lg p-5 shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-ink-muted">
              Panggilan SOS Aktif
            </span>
            <span className="w-2.5 h-2.5 rounded-full bg-danger animate-ping" />
          </div>
          <p className="text-3xl font-extrabold text-danger mt-2 tabular-nums">
            {filteredSos.filter((s) => s.status === "aktif").length}
          </p>
          <p className="text-xs text-danger-text font-medium mt-1">
            Butuh penanganan armada darurat
          </p>
        </div>

        <div className="bg-surface border border-line rounded-lg p-5 shadow-card">
          <span className="text-xs font-semibold uppercase text-ink-muted block">
            Perlu Verifikasi
          </span>
          <p className="text-3xl font-extrabold text-warning-text mt-2 tabular-nums">
            {filteredReports.filter((r) => r.status === "diterima").length}
          </p>
          <p className="text-xs text-ink-muted mt-1 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-warning" />
            Laporan baru masuk dari warga
          </p>
        </div>

        <div className="bg-surface border border-line rounded-lg p-5 shadow-card">
          <span className="text-xs font-semibold uppercase text-ink-muted block">
            Sedang Ditangani
          </span>
          <p className="text-3xl font-extrabold text-info mt-2 tabular-nums">
            {filteredReports.filter((r) => r.status === "ditindaklanjuti").length}
          </p>
          <p className="text-xs text-info-text font-medium mt-1 flex items-center gap-1">
            <Send className="w-3.5 h-3.5" />
            Regu berada di lapangan
          </p>
        </div>

        <div className="bg-surface border border-line rounded-lg p-5 shadow-card">
          <span className="text-xs font-semibold uppercase text-ink-muted block">
            Selesai Ditangani
          </span>
          <p className="text-3xl font-extrabold text-success mt-2 tabular-nums">
            {filteredReports.filter((r) => r.status === "selesai").length}
          </p>
          <p className="text-xs text-success-text font-medium mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-success" />
            Laporan berhasil ditutup
          </p>
        </div>
      </div>

      {/* SOS Alert Action Bar (Realtime Inflow) */}
      {filteredSos.length > 0 && (
        <section aria-labelledby="sos-title" className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 id="sos-title" className="text-sm font-bold text-ink uppercase tracking-wider flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-danger animate-pulse" />
              <span>Panggilan Darurat SOS Masuk (Perlu Respons Instan)</span>
            </h2>
            <span className="text-xs text-ink-muted font-mono">Frekuensi Siaga 1</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredSos.map((sos) => {
              const isHandled = sos.status === "ditangani";
              return (
                <div
                  key={sos.id}
                  className={`p-4 rounded-lg border transition-all ${
                    isHandled
                      ? "bg-surface border-line"
                      : "bg-danger-soft/60 border-danger/40 shadow-sm"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-danger text-white">
                        SOS: {sos.assistance_type.toUpperCase()}
                      </span>
                      <span className="text-xs font-semibold text-ink">
                        {sos.sender_name}
                      </span>
                    </div>
                    <span className="text-xs text-ink-muted font-mono">{sos.time}</span>
                  </div>

                  <p className="text-xs text-ink font-medium mb-1">
                    📍 {sos.location}
                  </p>
                  <p className="text-[11px] text-ink-muted font-mono mb-4">
                    Koordinat: {sos.coordinates}
                  </p>

                  <div className="flex items-center justify-between pt-2 border-t border-line/60">
                    <span
                      className={`text-xs font-bold ${
                        isHandled ? "text-success-text" : "text-danger-text animate-pulse"
                      }`}
                    >
                      {isHandled ? "✓ Sedang Ditangani Regu" : "● Menunggu Tindakan Regu"}
                    </span>

                    {!isHandled ? (
                      <button
                        type="button"
                        onClick={() => handleHandleSos(sos.id)}
                        className="px-3 py-1.5 rounded bg-danger hover:bg-danger/90 text-white text-xs font-bold transition-colors"
                      >
                        Tugaskan Regu Penyelamat
                      </button>
                    ) : (
                      <span className="text-xs text-ink-muted font-medium">
                        Regu dalam perjalanan
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Main Reports Table (Petugas Queue) */}
      <section className="bg-surface border border-line rounded-lg shadow-card overflow-hidden">
        <div className="p-5 border-b border-line flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-ink">
              Daftar Laporan Bencana Masuk
            </h2>
            <p className="text-xs text-ink-soft">
              Verifikasi keabsahan laporan warga dan perbarui tahapan penanganan tim lapangan.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-ink-muted flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" />
              Menampilkan {filteredReports.length} laporan
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-bg font-semibold text-ink-muted uppercase border-b border-line">
              <tr>
                <th className="py-3 px-4">Kode / Jenis</th>
                <th className="py-3 px-4">Judul Kejadian & Lokasi</th>
                <th className="py-3 px-4">Target Unit</th>
                <th className="py-3 px-4">Konfirmasi</th>
                <th className="py-3 px-4">Status Saat Ini</th>
                <th className="py-3 px-4 text-right">Tindakan Petugas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {filteredReports.map((row) => (
                <tr key={row.id} className="hover:bg-bg/40 transition-colors">
                  {/* Kode & Jenis */}
                  <td className="py-3.5 px-4">
                    <span className="font-mono font-bold text-primary block">
                      {row.tracking_code}
                    </span>
                    <span className="capitalize text-[11px] text-ink-muted flex items-center gap-1 mt-0.5">
                      {getDisasterIcon(row.disaster_type)}
                      {row.disaster_type}
                    </span>
                  </td>

                  {/* Judul & Lokasi */}
                  <td className="py-3.5 px-4 max-w-xs">
                    <p className="font-semibold text-ink leading-snug">{row.title}</p>
                    <p className="text-ink-muted text-[11px] mt-0.5 truncate">
                      📍 {row.location} · {row.time}
                    </p>
                  </td>

                  {/* Target Unit */}
                  <td className="py-3.5 px-4">
                    <span className="uppercase text-[10px] font-bold px-2 py-0.5 rounded bg-bg border border-line text-ink">
                      {row.target_agency}
                    </span>
                  </td>

                  {/* Konfirmasi Warga */}
                  <td className="py-3.5 px-4">
                    <span className="font-semibold text-primary flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      {row.confirmation_count} Warga
                    </span>
                  </td>

                  {/* Status Badge */}
                  <td className="py-3.5 px-4">
                    {row.status === "diterima" && (
                      <span className="px-2 py-0.5 rounded-full bg-info-soft text-info-text font-semibold">
                        Diterima
                      </span>
                    )}
                    {row.status === "diverifikasi" && (
                      <span className="px-2 py-0.5 rounded-full bg-info-soft text-info-text font-bold border border-info/40">
                        Diverifikasi
                      </span>
                    )}
                    {row.status === "ditindaklanjuti" && (
                      <span className="px-2 py-0.5 rounded-full bg-warning-soft text-warning-text font-semibold">
                        Ditindaklanjuti
                      </span>
                    )}
                    {row.status === "selesai" && (
                      <span className="px-2 py-0.5 rounded-full bg-success-soft text-success-text font-bold">
                        Selesai
                      </span>
                    )}
                    {row.status === "ditolak" && (
                      <span className="px-2 py-0.5 rounded-full bg-danger-soft text-danger-text font-semibold">
                        Ditolak
                      </span>
                    )}
                  </td>

                  {/* Actions Petugas */}
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {row.status === "diterima" && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleUpdateStatus(row.id, "diverifikasi")}
                            className="px-2.5 py-1 rounded bg-info text-white font-semibold hover:bg-info/90 transition-colors"
                          >
                            Verifikasi
                          </button>
                          <button
                            type="button"
                            onClick={() => handleUpdateStatus(row.id, "ditolak")}
                            className="px-2 py-1 rounded border border-danger/40 text-danger-text hover:bg-danger-soft transition-colors"
                            title="Tolak jika laporan palsu/duplikat"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}

                      {row.status === "diverifikasi" && (
                        <button
                          type="button"
                          onClick={() => handleUpdateStatus(row.id, "ditindaklanjuti")}
                          className="px-2.5 py-1 rounded bg-warning text-white font-semibold hover:bg-warning/90 transition-colors"
                        >
                          Tugaskan Tim
                        </button>
                      )}

                      {row.status === "ditindaklanjuti" && (
                        <button
                          type="button"
                          onClick={() => handleUpdateStatus(row.id, "selesai")}
                          className="px-2.5 py-1 rounded bg-success text-white font-semibold hover:bg-success/90 transition-colors"
                        >
                          Tandai Selesai
                        </button>
                      )}

                      {row.status === "selesai" && (
                        <span className="text-success-text font-medium text-[11px] flex items-center justify-end gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Kasus Ditutup
                        </span>
                      )}

                      {row.status === "ditolak" && (
                        <span className="text-danger-text font-medium text-[11px]">
                          Laporan Palsu/Duplikat
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

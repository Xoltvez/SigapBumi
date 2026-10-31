"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Clock,
  CheckCircle2,
  Send,
  Flame,
  Waves,
  Mountain,
  AlertTriangle,
  Siren,
  ArrowRight,
  TrendingUp,
  MapPin,
  Radio,
  FileText,
} from "lucide-react";
import { useAdmin } from "@/components/layout/AdminShell";
import { PriorityBadge } from "@/components/admin/common/PriorityBadge";
import type { ReportStatus, DisasterType, SosAssistanceType, PriorityLabel } from "@/types";
import { supabase } from "@/lib/supabase/client";
import { fetchLiveReports, DEFAULT_MOCK_REPORTS } from "@/lib/services/reports";
import { fetchLiveSosAlerts, DEFAULT_MOCK_SOS } from "@/lib/services/sos";

interface AdminReportItem {
  id: string;
  tracking_code: string;
  disaster_type: DisasterType;
  target_agency: SosAssistanceType;
  title: string;
  location: string;
  time: string;
  status: ReportStatus;
  priority: PriorityLabel;
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

const INITIAL_SOS_ALERTS: SosAlertItem[] = DEFAULT_MOCK_SOS.filter(
  (s) => s.status !== "selesai"
).map((s) => ({
  id: s.id,
  sender_name: s.source,
  assistance_type: s.assistance_type,
  location: s.address,
  coordinates: s.coordinates,
  time: s.time_ago,
  status: s.status as "aktif" | "ditangani",
}));

const INITIAL_REPORTS: AdminReportItem[] = DEFAULT_MOCK_REPORTS.map((r) => {
  let pLabel: PriorityLabel = "Sedang";
  if (r.priority === "tinggi" || r.confirmation_count >= 20) pLabel = "Kritis";
  else if (r.confirmation_count >= 10) pLabel = "Tinggi";
  else if (r.status === "selesai") pLabel = "Rendah";

  return {
    id: r.id,
    tracking_code: r.tracking_code,
    disaster_type: r.disaster_type,
    target_agency: r.target_agency,
    title: r.title,
    location: r.address,
    time: r.created_at,
    status: r.status,
    priority: pLabel,
    confirmation_count: r.confirmation_count,
  };
});

export default function AdminRingkasanPage() {
  const { activeUnit, activeUnitName, setActiveSosCount, setIsLiveConnected } = useAdmin();
  const [reports, setReports] = useState<AdminReportItem[]>(INITIAL_REPORTS);
  const [sosAlerts, setSosAlerts] = useState<SosAlertItem[]>(INITIAL_SOS_ALERTS);
  const [newNotice, setNewNotice] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        const live = await fetchLiveReports();
        if (isMounted && live && live.length > 0) {
          const formatted: AdminReportItem[] = live.map((r) => {
            let pLabel: PriorityLabel = "Sedang";
            if (r.priority === "tinggi" || r.confirmation_count >= 20) pLabel = "Kritis";
            else if (r.confirmation_count >= 10) pLabel = "Tinggi";
            else if (r.status === "selesai") pLabel = "Rendah";

            return {
              id: r.id,
              tracking_code: r.tracking_code,
              disaster_type: r.disaster_type,
              target_agency: r.target_agency,
              title: r.title,
              location: r.address,
              time: r.created_at,
              status: r.status,
              priority: pLabel,
              confirmation_count: r.confirmation_count,
            };
          });
          setReports(formatted);
          setIsLiveConnected(true);
        }

        // Muat live SOS
        const liveSos = await fetchLiveSosAlerts();
        if (isMounted && liveSos && liveSos.length > 0) {
          const activeOnly = liveSos.filter((s) => s.status !== "selesai");
          setSosAlerts(
            activeOnly.map((s) => ({
              id: s.id,
              sender_name: s.source,
              assistance_type: s.assistance_type,
              location: s.address,
              coordinates: s.coordinates,
              time: s.time_ago,
              status: s.status as "aktif" | "ditangani",
            }))
          );
          setActiveSosCount(activeOnly.filter((s) => s.status === "aktif").length);
        }
      } catch (err) {
        console.warn("Gagal memuat ringkasan live:", err);
      }
    }

    const timer = setTimeout(() => {
      loadData();
    }, 0);

    // Realtime subscription
    const channel = supabase
      .channel("admin_ringkasan_realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "reports" },
        (payload) => {
          const newRow = payload.new as { tracking_code?: string; title?: string };
          setNewNotice(`Laporan Baru Masuk: [${newRow.tracking_code || "LPR"}] ${newRow.title || "Kejadian"}`);
          setTimeout(() => setNewNotice(null), 6000);
          loadData();
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "reports" },
        () => loadData()
      )
      .subscribe();

    return () => {
      isMounted = false;
      clearTimeout(timer);
      supabase.removeChannel(channel);
    };
  }, [setIsLiveConnected, setActiveSosCount]);

  // Sinkronisasi jumlah SOS ke Shell
  useEffect(() => {
    const activeCount = sosAlerts.filter((s) => s.status === "aktif").length;
    setActiveSosCount(activeCount);
  }, [sosAlerts, setActiveSosCount]);

  // Filter unit
  const filteredReports = reports.filter((r) => {
    if (activeUnit === "semua" || activeUnit === "bnpb_bpbd") return true;
    return r.target_agency === activeUnit;
  });

  const filteredSos = sosAlerts.filter((s) => {
    if (activeUnit === "semua" || activeUnit === "bnpb_bpbd") return true;
    return s.assistance_type === activeUnit;
  });

  // Laporan & SOS yang Perlu Perhatian Segera (Maksimal 10 item)
  const urgentReports = filteredReports.filter(
    (r) => r.status === "diterima" || r.priority === "Kritis" || r.priority === "Tinggi"
  );
  const activeSos = filteredSos.filter((s) => s.status === "aktif");

  const totalReportsCount = filteredReports.length || 1;
  const banjirCount = filteredReports.filter((r) => r.disaster_type === "banjir").length;
  const longsorCount = filteredReports.filter((r) => r.disaster_type === "longsor").length;
  const kebakaranCount = filteredReports.filter((r) => r.disaster_type === "kebakaran").length;
  const gempaCount = filteredReports.filter((r) => r.disaster_type === "gempa").length;
  const lainnyaCount = filteredReports.filter(
    (r) => r.disaster_type === "lainnya" || r.disaster_type === "karhutla" || r.disaster_type === "tsunami"
  ).length;

  const banjirPct = Math.round((banjirCount / totalReportsCount) * 100);
  const longsorPct = Math.round((longsorCount / totalReportsCount) * 100);
  const kebakaranPct = Math.round((kebakaranCount / totalReportsCount) * 100);
  const gempaPct = Math.round((gempaCount / totalReportsCount) * 100);
  const lainnyaPct = Math.round((lainnyaCount / totalReportsCount) * 100);

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
      {/* Toast Notice jika ada laporan baru */}
      {newNotice && (
        <div className="p-3.5 rounded-md bg-info-soft border border-info/30 text-info-text text-xs font-semibold flex items-center justify-between shadow-sm animate-pulse">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-info" />
            <span>{newNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => setNewNotice(null)}
            className="text-[11px] underline font-bold"
          >
            Tutup
          </button>
        </div>
      )}

      {/* Header Ringkasan Operasional */}
      <div className="bg-surface border border-line rounded-md p-5 shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-ink">
            Ringkasan Operasional Posko
          </h1>
          <p className="text-xs text-ink-soft mt-0.5">
            Unit penanganan: <strong className="text-primary-text">{activeUnitName}</strong> · Terhubung ke basis data Posko Komando Terpadu.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/admin/laporan"
            className="h-9 px-4 rounded-md bg-primary-action hover:bg-primary-action-hover text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Buka Antrean Laporan</span>
          </Link>

          <Link
            href="/admin/sos"
            className="h-9 px-3.5 rounded-md bg-danger hover:bg-danger/90 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <Siren className="w-3.5 h-3.5" />
            <span>Monitor SOS</span>
          </Link>
        </div>
      </div>

      {/* 4 Kartu Metrik KPI (design-admin.md 5.1 & prd-admin.md 6.1) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* SOS Aktif */}
        <div className="bg-surface border border-line rounded-md p-4 shadow-card flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-ink-muted tracking-wider">
              Panggilan SOS Aktif
            </span>
            <span className="w-2.5 h-2.5 rounded-full bg-danger animate-ping" />
          </div>
          <p className="text-3xl font-extrabold text-danger mt-2 tabular-nums">
            {activeSos.length}
          </p>
          <p className="text-[11px] text-danger-text font-medium mt-1">
            Butuh tanggapan &lt; 2 menit
          </p>
        </div>

        {/* Laporan Baru (Belum Diverifikasi) */}
        <div className="bg-surface border border-line rounded-md p-4 shadow-card flex flex-col justify-between">
          <span className="text-xs font-semibold uppercase text-ink-muted tracking-wider">
            Perlu Verifikasi
          </span>
          <p className="text-3xl font-extrabold text-warning-text mt-2 tabular-nums">
            {filteredReports.filter((r) => r.status === "diterima").length}
          </p>
          <p className="text-[11px] text-ink-muted mt-1 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-warning" />
            Laporan baru masuk warga
          </p>
        </div>

        {/* Sedang Ditindaklanjuti */}
        <div className="bg-surface border border-line rounded-md p-4 shadow-card flex flex-col justify-between">
          <span className="text-xs font-semibold uppercase text-ink-muted tracking-wider">
            Sedang Ditangani
          </span>
          <p className="text-3xl font-extrabold text-info mt-2 tabular-nums">
            {filteredReports.filter((r) => r.status === "ditindaklanjuti").length}
          </p>
          <p className="text-[11px] text-info-text font-medium mt-1 flex items-center gap-1">
            <Send className="w-3.5 h-3.5" />
            Regu berada di lapangan
          </p>
        </div>

        {/* Selesai / Waktu Respons */}
        <div className="bg-surface border border-line rounded-md p-4 shadow-card flex flex-col justify-between">
          <span className="text-xs font-semibold uppercase text-ink-muted tracking-wider">
            Rata-rata Respons
          </span>
          <p className="text-3xl font-extrabold text-success mt-2 tabular-nums">
            6.4 <span className="text-base font-normal text-ink-muted">mnt</span>
          </p>
          <p className="text-[11px] text-success-text font-medium mt-1 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5 text-success" />
            Lebih cepat dari target (15 mnt)
          </p>
        </div>
      </div>

      {/* Grid: Perlu Perhatian Segera (Kiri 60%) + Sebaran Bencana 7 Hari (Kanan 40%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Kolom Kiri: Daftar Perlu Perhatian (design-admin.md 5.1) */}
        <section className="lg:col-span-7 bg-surface border border-line rounded-md p-5 shadow-card space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-line">
            <div>
              <h2 className="text-sm font-bold text-ink uppercase tracking-wider">
                Perlu Perhatian Segera
              </h2>
            </div>
            <span className="text-xs text-ink-muted font-medium">
              {activeSos.length + urgentReports.length} kejadian prioritas
            </span>
          </div>

          <div className="divide-y divide-line">
            {/* 1. Item SOS yang belum ditangani (Selalu Paling Atas) */}
            {activeSos.map((sos) => (
              <div
                key={sos.id}
                className="py-3 px-3 rounded-md bg-danger-soft/50 border border-danger/20 mb-2 flex items-start justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-danger text-white">
                      SOS: {sos.assistance_type.toUpperCase()}
                    </span>
                    <span className="text-xs font-bold text-danger-text animate-pulse">
                      ● Belum Ditanggapi ({sos.time})
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-ink">{sos.location}</p>
                  <p className="text-[11px] text-ink-muted font-mono">{sos.coordinates}</p>
                </div>
                <Link
                  href="/admin/sos"
                  className="px-3 py-1.5 rounded bg-danger hover:bg-danger/90 text-white text-xs font-bold shrink-0 transition-colors"
                >
                  Tanggapi
                </Link>
              </div>
            ))}

            {/* 2. Laporan Bencana Kritis / Tinggi yang menunggu verifikasi */}
            {urgentReports.slice(0, 5).map((rep) => (
              <Link
                key={rep.id}
                href={`/admin/laporan/${rep.id}`}
                className="py-3 px-2 flex items-center justify-between gap-3 hover:bg-bg/60 rounded-md transition-colors group block"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <PriorityBadge priority={rep.priority} />
                    <span className="font-mono text-xs font-bold text-primary-text">
                      {rep.tracking_code}
                    </span>
                    <span className="text-[11px] text-ink-muted capitalize flex items-center gap-1">
                      {getDisasterIcon(rep.disaster_type)}
                      {rep.disaster_type}
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-ink truncate group-hover:text-primary-text transition-colors">
                    {rep.title}
                  </p>
                  <p className="text-[11px] text-ink-muted flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3 text-ink-muted" />
                    <span className="truncate">{rep.location}</span> · {rep.time}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-bg border border-line text-ink">
                    {rep.status}
                  </span>
                  <ArrowRight className="w-4 h-4 text-ink-muted group-hover:text-ink transition-transform group-hover:translate-x-0.5" />
                </div>
              </Link>
            ))}

            {activeSos.length === 0 && urgentReports.length === 0 && (
              <div className="py-8 text-center text-ink-muted text-xs">
                <CheckCircle2 className="w-8 h-8 text-success mx-auto mb-2" />
                <p className="font-semibold text-ink">Semua kejadian terkendali</p>
                <p>Tidak ada panggilan SOS tertunda atau laporan darurat yang belum ditangani.</p>
              </div>
            )}
          </div>

          <div className="pt-2 border-t border-line text-right">
            <Link
              href="/admin/laporan"
              className="text-xs font-semibold text-primary-text hover:underline inline-flex items-center gap-1"
            >
              <span>Lihat semua {filteredReports.length} laporan di antrean</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </section>

        {/* Kolom Kanan: Distribusi Bencana (design-admin.md 5.1) */}
        <section className="lg:col-span-5 bg-surface border border-line rounded-md p-5 shadow-card space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-line">
            <h2 className="text-sm font-bold text-ink uppercase tracking-wider">
              Distribusi Tipe Bencana
            </h2>
            <span className="text-xs text-ink-muted">
              {filteredReports.length} Laporan Posko
            </span>
          </div>

          <div className="space-y-3 pt-2">
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-medium text-ink flex items-center gap-1.5">
                  <Waves className="w-3.5 h-3.5 text-info" />
                  Banjir & Genangan Air
                </span>
                <span className="font-bold text-ink">
                  {banjirCount} laporan ({banjirPct}%)
                </span>
              </div>
              <div className="w-full bg-line rounded-full h-2 overflow-hidden">
                <div
                  className="bg-info h-full rounded-full transition-all"
                  style={{ width: `${banjirPct}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-medium text-ink flex items-center gap-1.5">
                  <Mountain className="w-3.5 h-3.5 text-ink" />
                  Tanah Longsor
                </span>
                <span className="font-bold text-ink">
                  {longsorCount} laporan ({longsorPct}%)
                </span>
              </div>
              <div className="w-full bg-line rounded-full h-2 overflow-hidden">
                <div
                  className="bg-ink h-full rounded-full transition-all"
                  style={{ width: `${longsorPct}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-medium text-ink flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-danger" />
                  Kebakaran Pemukiman
                </span>
                <span className="font-bold text-ink">
                  {kebakaranCount} laporan ({kebakaranPct}%)
                </span>
              </div>
              <div className="w-full bg-line rounded-full h-2 overflow-hidden">
                <div
                  className="bg-danger h-full rounded-full transition-all"
                  style={{ width: `${kebakaranPct}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-medium text-ink flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-warning" />
                  Gempa Bumi
                </span>
                <span className="font-bold text-ink">
                  {gempaCount} laporan ({gempaPct}%)
                </span>
              </div>
              <div className="w-full bg-line rounded-full h-2 overflow-hidden">
                <div
                  className="bg-warning h-full rounded-full transition-all"
                  style={{ width: `${gempaPct}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-medium text-ink flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-ink-muted" />
                  Lainnya / Karhutla
                </span>
                <span className="font-bold text-ink">
                  {lainnyaCount} laporan ({lainnyaPct}%)
                </span>
              </div>
              <div className="w-full bg-line rounded-full h-2 overflow-hidden">
                <div
                  className="bg-ink-muted h-full rounded-full transition-all"
                  style={{ width: `${lainnyaPct}%` }}
                />
              </div>
            </div>
          </div>

          <div className="p-3 bg-bg rounded-md border border-line text-xs text-ink-soft mt-4">
            <p className="leading-relaxed">
              <strong>Catatan Operasional Posko:</strong> Peningkatan intensitas curah hujan ekstrem memerlukan koordinasi cepat unit evakuasi dan logistik di titik rawan longsor serta bantaran sungai.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}

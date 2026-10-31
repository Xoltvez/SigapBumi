"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import { DEFAULT_MOCK_REPORTS } from "@/lib/services/reports";

export default function AdminStatistikPage() {
  const reports = DEFAULT_MOCK_REPORTS;
  const totalReports = reports.length; // 90
  const selesaiReports = reports.filter((r) => r.status === "selesai").length; // 38
  const ditindaklanjutiReports = reports.filter((r) => r.status === "ditindaklanjuti").length; // 37
  const diverifikasiReports = reports.filter((r) => r.status === "diverifikasi").length; // 13
  const diterimaReports = reports.filter((r) => r.status === "diterima").length; // 2
  const totalConfirmations = reports.reduce((acc, r) => acc + r.confirmation_count, 0); // 2514
  const resolutionRate = ((selesaiReports / totalReports) * 100).toFixed(1); // 42.2%

  // Agensi breakdown
  const agencyStats = useMemo(() => {
    const map: Record<string, { name: string; count: number; resolved: number }> = {
      bnpb_bpbd: { name: "BPBD / Penanggulangan Bencana", count: 0, resolved: 0 },
      damkar: { name: "Dinas Pemadam Kebakaran", count: 0, resolved: 0 },
      basarnas: { name: "Basarnas (SAR)", count: 0, resolved: 0 },
      medis: { name: "Dinkes & Relawan Medis", count: 0, resolved: 0 },
      polisi: { name: "Polri & Pengamanan Wilayah", count: 0, resolved: 0 },
    };

    reports.forEach((r) => {
      const key = r.target_agency || "bnpb_bpbd";
      if (map[key]) {
        map[key].count += 1;
        if (r.status === "selesai") {
          map[key].resolved += 1;
        }
      }
    });

    return Object.values(map);
  }, [reports]);

  // Provinsi breakdown
  const provinceStats = useMemo(() => {
    const map: Record<string, number> = {};
    reports.forEach((r) => {
      const prov = r.province || "Lainnya";
      map[prov] = (map[prov] || 0) + 1;
    });

    return Object.entries(map)
      .map(([name, count]) => ({
        name,
        count,
        pct: Math.round((count / totalReports) * 100),
      }))
      .sort((a, b) => b.count - a.count);
  }, [reports, totalReports]);

  // Jenis bencana breakdown
  const disasterStats = useMemo(() => {
    const map: Record<string, number> = {};
    reports.forEach((r) => {
      map[r.disaster_type] = (map[r.disaster_type] || 0) + 1;
    });

    return Object.entries(map)
      .map(([type, count]) => ({
        type,
        count,
        pct: Math.round((count / totalReports) * 100),
      }))
      .sort((a, b) => b.count - a.count);
  }, [reports, totalReports]);

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto pb-12">
      {/* Header */}
      <div className="bg-surface border border-line rounded-md p-5 shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-ink">
            Statistik Operasional & Efektivitas Posko
          </h1>
          <p className="text-xs text-ink-soft mt-0.5">
            Analitik performa mitigasi, waktu tanggap, dan efisiensi penyelesaian laporan lintas instansi.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/admin"
            className="h-9 px-3.5 rounded-md border border-line hover:bg-bg text-ink text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
          >
            <span>Ringkasan Harian</span>
          </Link>
          <Link
            href="/admin/laporan"
            className="h-9 px-3.5 rounded-md bg-primary-action hover:bg-primary-action-hover text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
          >
            <span>Kelola Laporan</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* 4 KPI Utama */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Laporan Masuk */}
        <div className="bg-surface border border-line rounded-md p-4 shadow-card">
          <span className="text-xs font-semibold uppercase text-ink-muted tracking-wider">
            Total Laporan Terpadu
          </span>
          <p className="text-3xl font-extrabold text-ink mt-2 tabular-nums">
            {totalReports}
          </p>
          <p className="text-[11px] text-ink-muted mt-1">
            Tersebar di 9 provinsi Indonesia
          </p>
        </div>

        {/* Tingkat Penyelesaian */}
        <div className="bg-surface border border-line rounded-md p-4 shadow-card">
          <span className="text-xs font-semibold uppercase text-ink-muted tracking-wider">
            Tingkat Penyelesaian
          </span>
          <p className="text-3xl font-extrabold text-success mt-2 tabular-nums">
            {resolutionRate}%
          </p>
          <p className="text-[11px] text-success-text font-medium mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-success" />
            {selesaiReports} kejadian teratasi penuh
          </p>
        </div>

        {/* Rata-rata Waktu Respons */}
        <div className="bg-surface border border-line rounded-md p-4 shadow-card">
          <span className="text-xs font-semibold uppercase text-ink-muted tracking-wider">
            Rata-rata Waktu Tanggap
          </span>
          <p className="text-3xl font-extrabold text-primary-text mt-2 tabular-nums">
            6.4 <span className="text-base font-normal text-ink-muted">menit</span>
          </p>
          <p className="text-[11px] text-primary-hover font-medium mt-1 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5 text-primary" />
            57% lebih cepat dari target 15 mnt
          </p>
        </div>

        {/* Partisipasi Warga */}
        <div className="bg-surface border border-line rounded-md p-4 shadow-card">
          <span className="text-xs font-semibold uppercase text-ink-muted tracking-wider">
            Validasi Komunitas
          </span>
          <p className="text-3xl font-extrabold text-ink mt-2 tabular-nums">
            {totalConfirmations.toLocaleString("id-ID")}
          </p>
          <p className="text-[11px] text-ink-muted mt-1">
            Konfirmasi validasi laporan warga
          </p>
        </div>
      </div>

      {/* Grid: Kinerja Instansi & Pipeline Status */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Kolom Kiri: Beban Kerja per Instansi (7 cols) */}
        <div className="lg:col-span-7 bg-surface border border-line rounded-md p-5 shadow-card space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-line">
            <h2 className="text-sm font-bold text-ink uppercase tracking-wider">
              Beban Penanganan per Instansi Terkait
            </h2>
            <span className="text-xs text-ink-muted">
              5 Unit Respons Cepat
            </span>
          </div>

          <div className="space-y-4">
            {agencyStats.map((agency, idx) => {
              const pct = Math.round((agency.count / totalReports) * 100);
              const resolvePct = agency.count > 0 ? Math.round((agency.resolved / agency.count) * 100) : 0;
              return (
                <div key={idx} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-ink">{agency.name}</span>
                    <span className="text-ink-soft">
                      <strong>{agency.count}</strong> kasus ({pct}%) ·{" "}
                      <span className="text-success font-semibold">{agency.resolved} selesai ({resolvePct}%)</span>
                    </span>
                  </div>
                  <div className="w-full bg-line rounded-full h-2 overflow-hidden flex">
                    <div
                      className="bg-primary h-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-3.5 bg-bg rounded-md border border-line text-xs text-ink-soft leading-relaxed mt-4">
            <p>
              <strong>Koordinasi Multisektoral:</strong> Distribusi laporan berjalan otomatis berdasarkan klasifikasi bencana dan kebutuhan mendesak yang dilaporkan oleh pelapor (medis, pemadaman, atau evakuasi SAR).
            </p>
          </div>
        </div>

        {/* Kolom Kanan: Pipeline Alur Laporan (5 cols) */}
        <div className="lg:col-span-5 bg-surface border border-line rounded-md p-5 shadow-card space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-line">
            <h2 className="text-sm font-bold text-ink uppercase tracking-wider">
              Status Pipeline Laporan
            </h2>
            <span className="text-xs text-ink-muted">Total 90 Laporan</span>
          </div>

          <div className="space-y-3 pt-1">
            <div className="p-3 rounded-md border border-line bg-bg flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase text-ink-muted block">
                  1. Diterima (Menunggu Verifikasi)
                </span>
                <span className="text-xs text-ink-soft">Verifikasi visual & koordinat</span>
              </div>
              <span className="text-lg font-extrabold text-ink tabular-nums">
                {diterimaReports}
              </span>
            </div>

            <div className="p-3 rounded-md border border-line bg-bg flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase text-info-text block">
                  2. Diverifikasi (Siap Disposisi)
                </span>
                <span className="text-xs text-ink-soft">Divalidasi operator posko</span>
              </div>
              <span className="text-lg font-extrabold text-info tabular-nums">
                {diverifikasiReports}
              </span>
            </div>

            <div className="p-3 rounded-md border border-warning/30 bg-warning-soft/30 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase text-warning-text block">
                  3. Ditindaklanjuti (Penanganan)
                </span>
                <span className="text-xs text-ink-soft">Regu berada di lapangan</span>
              </div>
              <span className="text-lg font-extrabold text-warning-text tabular-nums">
                {ditindaklanjutiReports}
              </span>
            </div>

            <div className="p-3 rounded-md border border-success/30 bg-success-soft/30 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase text-success-text block">
                  4. Selesai Ditangani
                </span>
                <span className="text-xs text-ink-soft">Verifikasi penutupan insiden</span>
              </div>
              <span className="text-lg font-extrabold text-success tabular-nums">
                {selesaiReports}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Grid: Sebaran Wilayah & Tipe Bencana */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Sebaran 9 Provinsi */}
        <div className="lg:col-span-6 bg-surface border border-line rounded-md p-5 shadow-card space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-line">
            <h2 className="text-sm font-bold text-ink uppercase tracking-wider">
              Sebaran Kejadian per Wilayah
            </h2>
            <span className="text-xs text-ink-muted">9 Provinsi</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {provinceStats.map((prov, idx) => (
              <div
                key={idx}
                className="p-3 rounded-md border border-line bg-bg flex items-center justify-between text-xs"
              >
                <span className="font-semibold text-ink">{prov.name}</span>
                <span className="font-bold text-primary-text tabular-nums">
                  {prov.count} lap ({prov.pct}%)
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Distribusi Tipe Bencana */}
        <div className="lg:col-span-6 bg-surface border border-line rounded-md p-5 shadow-card space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-line">
            <h2 className="text-sm font-bold text-ink uppercase tracking-wider">
              Distribusi Tipe Bencana Terlaporkan
            </h2>
            <span className="text-xs text-ink-muted">6 Kategori</span>
          </div>

          <div className="space-y-3">
            {disasterStats.map((d, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-ink capitalize">{d.type}</span>
                  <span className="font-bold text-ink tabular-nums">
                    {d.count} laporan ({d.pct}%)
                  </span>
                </div>
                <div className="w-full bg-line rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-primary-action h-full transition-all"
                    style={{ width: `${d.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

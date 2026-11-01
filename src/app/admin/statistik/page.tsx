"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import {
  BarChart3,
  CheckCircle2,
  Clock,
  Shield,
  RotateCw,
  TrendingUp,
  Layers,
  ArrowRight,
  Flame,
  Mountain,
  Waves,
  AlertTriangle,
  Building2,
  Users,
  Compass,
} from "lucide-react";
import { DEFAULT_MOCK_REPORTS } from "@/lib/services/reports";
import type { DisasterType } from "@/types";

export default function AdminStatistikPage() {
  const [isLoading, setIsLoading] = useState(false);
  const reports = DEFAULT_MOCK_REPORTS;

  const totalReports = 142;
  const selesaiReports = 47;
  const ditindaklanjutiReports = 67;
  const diverifikasiReports = 18;
  const diterimaReports = 10;
  const totalConfirmations = 2514;
  const resolutionRate = ((selesaiReports / totalReports) * 100).toFixed(1);

  const handleRefresh = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
    }, 600);
  };

  // Agensi breakdown
  const agencyStats = useMemo(() => {
    return [
      {
        name: "BPBD / Penanggulangan Bencana",
        count: 48,
        resolved: 24,
        pct: 34,
        resolvePct: 50,
        gradient: "from-blue-500 to-indigo-600",
        badge: "BPBD Komando",
      },
      {
        name: "Dinas Pemadam Kebakaran",
        count: 38,
        resolved: 16,
        pct: 27,
        resolvePct: 42,
        gradient: "from-amber-500 to-orange-600",
        badge: "Damkar",
      },
      {
        name: "Dinkes & Relawan Medis",
        count: 26,
        resolved: 14,
        pct: 18,
        resolvePct: 54,
        gradient: "from-rose-500 to-red-600",
        badge: "Medis",
      },
      {
        name: "Polri & Pengamanan Wilayah",
        count: 18,
        resolved: 10,
        pct: 13,
        resolvePct: 56,
        gradient: "from-sky-500 to-blue-700",
        badge: "Polri",
      },
      {
        name: "Basarnas (SAR & Evakuasi)",
        count: 12,
        resolved: 8,
        pct: 8,
        resolvePct: 67,
        gradient: "from-emerald-500 to-teal-600",
        badge: "Basarnas",
      },
    ];
  }, []);

  // Provinsi breakdown
  const provinceStats = useMemo(() => {
    return [
      { name: "Jawa Barat", count: 38, pct: 27 },
      { name: "DKI Jakarta", count: 28, pct: 20 },
      { name: "Jawa Tengah", count: 22, pct: 15 },
      { name: "Jawa Timur", count: 18, pct: 13 },
      { name: "DI Yogyakarta", count: 12, pct: 8 },
      { name: "Banten", count: 10, pct: 7 },
      { name: "Sumatera Barat", count: 6, pct: 4 },
      { name: "Bali", count: 5, pct: 4 },
      { name: "Sulawesi Selatan", count: 3, pct: 2 },
    ];
  }, []);

  // Jenis bencana breakdown
  const disasterStats = useMemo(() => {
    return [
      {
        type: "kebakaran",
        label: "Kebakaran Permukiman & Gedung",
        count: 42,
        pct: 30,
        icon: Flame,
        color: "text-red-500",
        barColor: "bg-red-500",
      },
      {
        type: "banjir",
        label: "Banjir & Genangan Air",
        count: 36,
        pct: 25,
        icon: Waves,
        color: "text-blue-500",
        barColor: "bg-blue-500",
      },
      {
        type: "longsor",
        label: "Tanah Longsor & Erosi",
        count: 24,
        pct: 17,
        icon: Mountain,
        color: "text-amber-500",
        barColor: "bg-amber-500",
      },
      {
        type: "gempa",
        label: "Gempa Bumi & Getaran",
        count: 18,
        pct: 13,
        icon: Compass,
        color: "text-emerald-500",
        barColor: "bg-emerald-500",
      },
      {
        type: "karhutla",
        label: "Kebakaran Hutan & Lahan",
        count: 14,
        pct: 10,
        icon: Flame,
        color: "text-orange-500",
        barColor: "bg-orange-500",
      },
      {
        type: "lainnya",
        label: "Bencana Lainnya",
        count: 8,
        pct: 5,
        icon: AlertTriangle,
        color: "text-purple-500",
        barColor: "bg-purple-500",
      },
    ];
  }, []);

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto font-sans pb-12 select-none">
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Rekap & Statistik Operasional
          </h1>
          <p className="text-xs md:text-sm text-slate-500 font-normal mt-0.5">
            Analitik performa mitigasi, waktu tanggap, dan efisiensi penyelesaian laporan bencana lintas instansi.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0 self-start sm:self-auto">
          {/* Live Data Badge */}
          <div className="px-3.5 py-1.5 rounded-full bg-[#ECFDF5] text-[#059669] border border-emerald-200/80 text-xs font-bold inline-flex items-center gap-1.5 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
            <span>Live Data</span>
          </div>

          {/* Segarkan Button */}
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isLoading}
            className="px-4 py-2 rounded-xl border border-slate-200/90 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 shadow-2xs transition-colors inline-flex items-center gap-2 cursor-pointer"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-orange-500" : "text-slate-500"}`} />
            <span>Segarkan Data</span>
          </button>
        </div>
      </div>

      {/* 2. 4 Kartu Metrik KPI (Row 1) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
        {/* Card 1: Total Laporan */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-[0_2px_12px_rgba(0,0,0,0.02)] flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-full bg-[#EFF6FF] flex items-center justify-center text-[#2563EB] shrink-0 font-bold">
            <BarChart3 className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Total Laporan Terpadu</p>
            <p className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight mt-0.5">
              {totalReports}
            </p>
            <p className="text-[11px] text-blue-600 font-semibold flex items-center gap-1 mt-0.5">
              <span>9 Provinsi</span>
              <span className="text-slate-400 font-normal">tercakup</span>
            </p>
          </div>
        </div>

        {/* Card 2: Tingkat Penyelesaian */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-[0_2px_12px_rgba(0,0,0,0.02)] flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-full bg-[#D1FAE5] flex items-center justify-center text-[#059669] shrink-0 font-bold">
            <CheckCircle2 className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Tingkat Penyelesaian</p>
            <p className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight mt-0.5">
              {resolutionRate}%
            </p>
            <p className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1 mt-0.5">
              <span>{selesaiReports} selesai</span>
              <span className="text-slate-400 font-normal">dari total</span>
            </p>
          </div>
        </div>

        {/* Card 3: Rata-rata Waktu Tanggap */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-[0_2px_12px_rgba(0,0,0,0.02)] flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-full bg-[#FEF3C7] flex items-center justify-center text-[#D97706] shrink-0 font-bold">
            <Clock className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Rata-rata Waktu Tanggap</p>
            <p className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight mt-0.5">
              6.4 <span className="text-xs font-normal text-slate-400">menit</span>
            </p>
            <p className="text-[11px] text-amber-600 font-semibold flex items-center gap-1 mt-0.5">
              <TrendingUp className="w-3 h-3 text-amber-500" />
              <span>57% lebih cepat</span>
            </p>
          </div>
        </div>

        {/* Card 4: Validasi Saksi Warga */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-[0_2px_12px_rgba(0,0,0,0.02)] flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-full bg-[#FEE2E2] flex items-center justify-center text-[#EF4444] shrink-0 font-bold">
            <Shield className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Partisipasi Warga</p>
            <p className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight mt-0.5">
              {totalConfirmations.toLocaleString("id-ID")}
            </p>
            <p className="text-[11px] text-rose-600 font-semibold mt-0.5">
              Konfirmasi saksi valid
            </p>
          </div>
        </div>
      </div>

      {/* 3. Grid: Kinerja Instansi & Pipeline Status */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 md:gap-6 items-start">
        {/* Kolom Kiri: Beban Kerja per Instansi (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-100 p-6 shadow-[0_2px_16px_rgba(0,0,0,0.02)] space-y-5">
          <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
                Beban Penanganan per Instansi Terkait
              </h2>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Alokasi disposisi tugas dan persentase keberhasilan penyelesaian
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-[11px] font-bold">
              5 Unit Respons
            </span>
          </div>

          <div className="space-y-4 pt-1">
            {agencyStats.map((agency, idx) => (
              <div key={idx} className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-800">{agency.name}</span>
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-semibold">
                      {agency.badge}
                    </span>
                  </div>
                  <span className="text-slate-500 font-medium">
                    <strong className="text-slate-800">{agency.count}</strong> kasus ({agency.pct}%) ·{" "}
                    <span className="text-emerald-600 font-bold">{agency.resolved} selesai ({agency.resolvePct}%)</span>
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden flex">
                  <div
                    className={`bg-linear-to-r ${agency.gradient} h-full transition-all duration-500 rounded-full`}
                    style={{ width: `${agency.pct * 2.5}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 bg-[#F8FAFC] rounded-xl border border-slate-100 text-xs text-slate-500 leading-relaxed mt-4 flex items-start gap-3">
            <Building2 className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            <p>
              <strong className="text-slate-700 font-semibold">Koordinasi Multisektoral Terpadu:</strong> Distribusi laporan berjalan secara otomatis berdasarkan klasifikasi bencana dan kebutuhan mendesak yang dilaporkan masyarakat (medis darurat, pemadaman api, penegakan hukum, atau evakuasi SAR).
            </p>
          </div>
        </div>

        {/* Kolom Kanan: Pipeline Alur Laporan (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-100 p-6 shadow-[0_2px_16px_rgba(0,0,0,0.02)] space-y-4">
          <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
                Status Pipeline Laporan
              </h2>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Distribusi progres insiden dari masuk hingga tuntas
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-[11px] font-bold">
              Total {totalReports}
            </span>
          </div>

          <div className="space-y-3 pt-1 font-sans">
            {/* Step 1 */}
            <div className="p-3.5 rounded-xl border border-blue-200/80 bg-[#EFF6FF] flex items-center justify-between shadow-2xs">
              <div>
                <span className="text-[11px] font-extrabold uppercase text-[#2563EB] tracking-wider block">
                  1. Diterima (Menunggu Verifikasi)
                </span>
                <span className="text-xs text-slate-500 font-medium">Verifikasi visual & geolokasi</span>
              </div>
              <span className="text-xl font-extrabold text-[#2563EB] tabular-nums">
                {diterimaReports}
              </span>
            </div>

            {/* Step 2 */}
            <div className="p-3.5 rounded-xl border border-purple-200/80 bg-[#FAF5FF] flex items-center justify-between shadow-2xs">
              <div>
                <span className="text-[11px] font-extrabold uppercase text-[#9333EA] tracking-wider block">
                  2. Diverifikasi (Siap Disposisi)
                </span>
                <span className="text-xs text-slate-500 font-medium">Tervalidasi operator posko</span>
              </div>
              <span className="text-xl font-extrabold text-[#9333EA] tabular-nums">
                {diverifikasiReports}
              </span>
            </div>

            {/* Step 3 */}
            <div className="p-3.5 rounded-xl border border-amber-200/80 bg-[#FFF7ED] flex items-center justify-between shadow-2xs">
              <div>
                <span className="text-[11px] font-extrabold uppercase text-[#EA580C] tracking-wider block">
                  3. Ditindaklanjuti (Penanganan)
                </span>
                <span className="text-xs text-slate-500 font-medium">Armada regu di lokasi kejadian</span>
              </div>
              <span className="text-xl font-extrabold text-[#EA580C] tabular-nums">
                {ditindaklanjutiReports}
              </span>
            </div>

            {/* Step 4 */}
            <div className="p-3.5 rounded-xl border border-emerald-200/80 bg-[#ECFDF5] flex items-center justify-between shadow-2xs">
              <div>
                <span className="text-[11px] font-extrabold uppercase text-[#059669] tracking-wider block">
                  4. Selesai Ditangani
                </span>
                <span className="text-xs text-slate-500 font-medium">Insiden teratasi dan ditutup aman</span>
              </div>
              <span className="text-xl font-extrabold text-[#059669] tabular-nums">
                {selesaiReports}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Grid: Sebaran Wilayah & Tipe Bencana (Grid 6 : 6) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 md:gap-6 items-start">
        {/* Sebaran Wilayah */}
        <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-100 p-6 shadow-[0_2px_16px_rgba(0,0,0,0.02)] space-y-4">
          <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
                Sebaran Kejadian per Wilayah
              </h2>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Konsentrasi laporan bencana terdaftar se-Indonesia
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-[11px] font-bold">
              9 Provinsi
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
            {provinceStats.map((prov, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl border border-slate-100 bg-[#F8FAFC] hover:bg-slate-100/70 transition-colors flex items-center justify-between text-xs"
              >
                <span className="font-bold text-slate-800">{prov.name}</span>
                <span className="font-extrabold text-blue-600 bg-blue-50 border border-blue-200/60 px-2 py-0.5 rounded-md tabular-nums">
                  {prov.count} lap ({prov.pct}%)
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Distribusi Tipe Bencana */}
        <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-100 p-6 shadow-[0_2px_16px_rgba(0,0,0,0.02)] space-y-4">
          <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
                Distribusi Tipe Bencana Terlaporkan
              </h2>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Klasifikasi kategori ancaman risiko bencana
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-[11px] font-bold">
              6 Kategori
            </span>
          </div>

          <div className="space-y-3 pt-1">
            {disasterStats.map((d, idx) => {
              const Icon = d.icon;
              return (
                <div key={idx} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <Icon className={`w-3.5 h-3.5 ${d.color}`} />
                      <span className="font-bold text-slate-800">{d.label}</span>
                    </div>
                    <span className="font-extrabold text-slate-700 tabular-nums">
                      {d.count} laporan ({d.pct}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className={`${d.barColor} h-full transition-all duration-500 rounded-full`}
                      style={{ width: `${d.pct * 2.8}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

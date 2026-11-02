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
  HeartPulse,
  Siren,
  Radio,
} from "lucide-react";
import { useAdmin } from "@/components/layout/AdminShell";

export default function AdminStatistikPage() {
  const { activeUnit, activeUnitName } = useAdmin();
  const [isLoading, setIsLoading] = useState(false);

  const handleRefresh = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
    }, 600);
  };

  // Metrik dan data statistik yang sepenuhnya terspesialisasi per role / instansi aktif
  const roleStats = useMemo(() => {
    if (activeUnit === "damkar") {
      return {
        title: "Statistik Operasional Dinas Pemadam Kebakaran & Penyelamatan",
        subtitle:
          "Analitik respons pemadaman kebakaran permukiman, gedung, karhutla, dan penyelamatan taktis sektor Damkar.",
        jurisdictionBadge: "Sektor Pemadam & Penyelamatan (Damkar)",
        totalReports: 56,
        totalReportsLabel: "Total Insiden Kebakaran",
        selesaiReports: 44,
        ditindaklanjutiReports: 6,
        diverifikasiReports: 4,
        diterimaReports: 2,
        responseTime: "5.2",
        responseComparison: "62% lebih cepat",
        fourthMetricLabel: "Unit Armada Diterjunkan",
        fourthMetricValue: "38 Armada",
        fourthMetricSub: "Truk damkar & water cannon",
        agencySectionTitle: "Beban Operasi per Sektor Damkar",
        agencySectionSub: "Disposisi armada pemadam dan tingkat penuntasan kebakaran per wilayah",
        agencyList: [
          {
            name: "Sektor Pusat & Gedung Bertingkat",
            count: 18,
            resolved: 15,
            pct: 32,
            resolvePct: 83,
            gradient: "from-amber-500 to-orange-600",
            badge: "Pusat Kota",
          },
          {
            name: "Sektor Permukiman Padat & Gang Sempit",
            count: 16,
            resolved: 13,
            pct: 29,
            resolvePct: 81,
            gradient: "from-orange-500 to-red-600",
            badge: "Regu Cepat",
          },
          {
            name: "Armada Penyelamatan (Animal & Rescue Khusus)",
            count: 12,
            resolved: 10,
            pct: 21,
            resolvePct: 83,
            gradient: "from-rose-500 to-pink-600",
            badge: "Rescue 113",
          },
          {
            name: "Satgas Pengendalian Karhutla (Manggala Agni)",
            count: 10,
            resolved: 6,
            pct: 18,
            resolvePct: 60,
            gradient: "from-red-600 to-orange-700",
            badge: "Karhutla",
          },
        ],
        provinces: [
          { name: "DKI Jakarta", count: 18, pct: 32 },
          { name: "Jawa Barat", count: 14, pct: 25 },
          { name: "Sumatera Selatan", count: 9, pct: 16 },
          { name: "Kalimantan Barat", count: 7, pct: 13 },
          { name: "Riau", count: 5, pct: 9 },
          { name: "Jawa Timur", count: 3, pct: 5 },
        ],
        disasters: [
          {
            type: "kebakaran",
            label: "Kebakaran Permukiman & Rumah Warga",
            count: 28,
            pct: 50,
            icon: Flame,
            color: "text-red-500",
            barColor: "bg-red-500",
          },
          {
            type: "karhutla",
            label: "Kebakaran Hutan & Lahan (Karhutla)",
            count: 14,
            pct: 25,
            icon: Flame,
            color: "text-orange-500",
            barColor: "bg-orange-500",
          },
          {
            type: "kebakaran",
            label: "Kebakaran Gedung Komersial & Industri",
            count: 10,
            pct: 18,
            icon: Flame,
            color: "text-rose-600",
            barColor: "bg-rose-600",
          },
          {
            type: "lainnya",
            label: "Penyelamatan Warga & Evakuasi Satwa",
            count: 4,
            pct: 7,
            icon: AlertTriangle,
            color: "text-amber-500",
            barColor: "bg-amber-500",
          },
        ],
      };
    }

    if (activeUnit === "medis") {
      return {
        title: "Statistik Layanan Medis Darurat & Bencana",
        subtitle:
          "Analitik penanganan gawat darurat, evakuasi medis, ambulans PSC 119, dan rumah sakit lapangan pasca-bencana.",
        jurisdictionBadge: "Dinkes & Pelayanan Medis Darurat (PSC 119)",
        totalReports: 44,
        totalReportsLabel: "Total Pasien / Kasus Medis",
        selesaiReports: 36,
        ditindaklanjutiReports: 5,
        diverifikasiReports: 2,
        diterimaReports: 1,
        responseTime: "4.8",
        responseComparison: "70% lebih cepat",
        fourthMetricLabel: "Pasien Tertangani Stabil",
        fourthMetricValue: "1.240 Jiwa",
        fourthMetricSub: "Triase darurat & perawatan intensif",
        agencySectionTitle: "Beban Pelayanan per Unit Medis Bencana",
        agencySectionSub: "Alokasi posko kesehatan dan penanganan triase darurat di lokasi insiden",
        agencyList: [
          {
            name: "PSC 119 Ambulans Reaksi Cepat",
            count: 18,
            resolved: 16,
            pct: 41,
            resolvePct: 89,
            gradient: "from-rose-500 to-red-600",
            badge: "Ambulans 119",
          },
          {
            name: "Instalasi Gawat Darurat & RS Rujukan Bencana",
            count: 14,
            resolved: 11,
            pct: 32,
            resolvePct: 79,
            gradient: "from-red-500 to-rose-700",
            badge: "RS Rujukan",
          },
          {
            name: "Posko Kesehatan Pengungsian & Lapangan",
            count: 8,
            resolved: 6,
            pct: 18,
            resolvePct: 75,
            gradient: "from-emerald-500 to-teal-600",
            badge: "Posko Tenda",
          },
          {
            name: "Tim Relawan Medis & Trauma Healing",
            count: 4,
            resolved: 3,
            pct: 9,
            resolvePct: 75,
            gradient: "from-sky-500 to-blue-600",
            badge: "Psikososial",
          },
        ],
        provinces: [
          { name: "Jawa Barat (Cianjur/Sukabumi)", count: 16, pct: 36 },
          { name: "DI Yogyakarta", count: 10, pct: 23 },
          { name: "Sumatera Barat", count: 8, pct: 18 },
          { name: "DKI Jakarta", count: 6, pct: 14 },
          { name: "Sulawesi Tengah", count: 4, pct: 9 },
        ],
        disasters: [
          {
            type: "gempa",
            label: "Penanganan Trauma Korban Gempa Bumi",
            count: 18,
            pct: 41,
            icon: HeartPulse,
            color: "text-rose-600",
            barColor: "bg-rose-600",
          },
          {
            type: "banjir",
            label: "Evakuasi Pasien Sakit Rentan Banjir",
            count: 12,
            pct: 27,
            icon: Waves,
            color: "text-blue-500",
            barColor: "bg-blue-500",
          },
          {
            type: "kebakaran",
            label: "Perawatan Luka Bakar & Sesak Asap",
            count: 8,
            pct: 18,
            icon: Flame,
            color: "text-amber-500",
            barColor: "bg-amber-500",
          },
          {
            type: "lainnya",
            label: "Kedaruratan Medis Warga Lainnya",
            count: 6,
            pct: 14,
            icon: AlertTriangle,
            color: "text-purple-500",
            barColor: "bg-purple-500",
          },
        ],
      };
    }

    if (activeUnit === "polisi") {
      return {
        title: "Statistik Satgas Kepolisian & Kamtibmas Bencana",
        subtitle:
          "Analitik pengamanan wilayah terdampak, rekayasa jalur evakuasi bencana, dan penanganan ketertiban publik.",
        jurisdictionBadge: "Satgas Kepolisian & Keamanan Bencana (Polri)",
        totalReports: 38,
        totalReportsLabel: "Total Titik Penugasan",
        selesaiReports: 31,
        ditindaklanjutiReports: 4,
        diverifikasiReports: 2,
        diterimaReports: 1,
        responseTime: "5.8",
        responseComparison: "55% lebih cepat",
        fourthMetricLabel: "Personel Kamtibmas Aktif",
        fourthMetricValue: "340 Personel",
        fourthMetricSub: "Brimob, Sabhara, & Polantas",
        agencySectionTitle: "Beban Operasi per Satuan Fungsi Polri",
        agencySectionSub: "Alokasi penugasan pengamanan jalur evakuasi, logistik, dan pencegahan penjarahan",
        agencyList: [
          {
            name: "Satlantas (Rekayasa Jalur Evakuasi)",
            count: 14,
            resolved: 13,
            pct: 37,
            resolvePct: 93,
            gradient: "from-blue-600 to-indigo-700",
            badge: "Lantas",
          },
          {
            name: "Sabhara (Patroli Pemukiman Ditinggal Mengungsi)",
            count: 12,
            resolved: 10,
            pct: 32,
            resolvePct: 83,
            gradient: "from-sky-500 to-blue-700",
            badge: "Patroli",
          },
          {
            name: "Brimob SAR & Pengamanan Posko Pengungsian",
            count: 8,
            resolved: 6,
            pct: 21,
            resolvePct: 75,
            gradient: "from-slate-700 to-slate-900",
            badge: "Brimob SAR",
          },
          {
            name: "Binmas (Penyuluhan & Penertiban Distribusi Logistik)",
            count: 4,
            resolved: 2,
            pct: 10,
            resolvePct: 50,
            gradient: "from-emerald-600 to-teal-700",
            badge: "Binmas",
          },
        ],
        provinces: [
          { name: "Jawa Barat", count: 12, pct: 32 },
          { name: "DKI Jakarta", count: 10, pct: 26 },
          { name: "Jawa Tengah", count: 8, pct: 21 },
          { name: "Banten", count: 5, pct: 13 },
          { name: "Jawa Timur", count: 3, pct: 8 },
        ],
        disasters: [
          {
            type: "lainnya",
            label: "Penyekatan & Pengaturan Akses Jalur Evakuasi",
            count: 15,
            pct: 39,
            icon: Shield,
            color: "text-blue-600",
            barColor: "bg-blue-600",
          },
          {
            type: "lainnya",
            label: "Patroli Pencegahan Penjarahan Rumah Korban",
            count: 12,
            pct: 32,
            icon: Shield,
            color: "text-indigo-600",
            barColor: "bg-indigo-600",
          },
          {
            type: "lainnya",
            label: "Pengamanan Distribusi Logistik & Pengungsian",
            count: 7,
            pct: 18,
            icon: Shield,
            color: "text-slate-700",
            barColor: "bg-slate-700",
          },
          {
            type: "lainnya",
            label: "Pengamanan Lokasi Kejadian Bencana Lainnya",
            count: 4,
            pct: 11,
            icon: AlertTriangle,
            color: "text-amber-500",
            barColor: "bg-amber-500",
          },
        ],
      };
    }

    if (activeUnit === "bnpb_bpbd") {
      return {
        title: "Statistik Operasional Pusdalops BNPB / BPBD",
        subtitle:
          "Analitik koordinasi kedaruratan hidrometeorologi dan geologi: banjir, tanah longsor, gempa bumi, dan tsunami.",
        jurisdictionBadge: "Komando Penanggulangan Bencana (BNPB / BPBD)",
        totalReports: 98,
        totalReportsLabel: "Total Bencana Alam",
        selesaiReports: 71,
        ditindaklanjutiReports: 16,
        diverifikasiReports: 7,
        diterimaReports: 4,
        responseTime: "6.8",
        responseComparison: "54% lebih cepat",
        fourthMetricLabel: "Warga Terbantu Evakuasi",
        fourthMetricValue: "3.820 Jiwa",
        fourthMetricSub: "Tercatat di posko pengungsian",
        agencySectionTitle: "Beban Operasi per Bidang BPBD",
        agencySectionSub: "Alokasi penugasan Tim Reaksi Cepat (TRC), logistik, dan operasi SAR",
        agencyList: [
          {
            name: "Tim Reaksi Cepat (TRC) Asesmen Lapangan",
            count: 34,
            resolved: 27,
            pct: 35,
            resolvePct: 79,
            gradient: "from-blue-500 to-indigo-600",
            badge: "TRC BPBD",
          },
          {
            name: "Pusdalops-PB (Komando Informasi & Komunikasi)",
            count: 28,
            resolved: 23,
            pct: 29,
            resolvePct: 82,
            gradient: "from-amber-500 to-orange-600",
            badge: "Pusdalops",
          },
          {
            name: "Bidang Logistik, Pengungsian & Dapur Umum",
            count: 22,
            resolved: 14,
            pct: 22,
            resolvePct: 64,
            gradient: "from-emerald-500 to-teal-600",
            badge: "Logistik",
          },
          {
            name: "Forum Relawan Gabungan & Destana",
            count: 14,
            resolved: 7,
            pct: 14,
            resolvePct: 50,
            gradient: "from-purple-500 to-indigo-600",
            badge: "Relawan",
          },
        ],
        provinces: [
          { name: "Jawa Barat", count: 28, pct: 29 },
          { name: "DKI Jakarta", count: 22, pct: 22 },
          { name: "Jawa Tengah", count: 18, pct: 18 },
          { name: "Jawa Timur", count: 14, pct: 14 },
          { name: "Sumatera Barat", count: 9, pct: 9 },
          { name: "Bali", count: 7, pct: 8 },
        ],
        disasters: [
          {
            type: "banjir",
            label: "Banjir & Luapan Aliran Sungai",
            count: 36,
            pct: 37,
            icon: Waves,
            color: "text-blue-500",
            barColor: "bg-blue-500",
          },
          {
            type: "longsor",
            label: "Tanah Longsor & Pergerakan Tanah",
            count: 24,
            pct: 24,
            icon: Mountain,
            color: "text-amber-500",
            barColor: "bg-amber-500",
          },
          {
            type: "gempa",
            label: "Gempa Bumi & Dampak Kerusakan Bangunan",
            count: 18,
            pct: 18,
            icon: Compass,
            color: "text-emerald-500",
            barColor: "bg-emerald-500",
          },
          {
            type: "tsunami",
            label: "Peringatan Tsunami & Gelombang Pasang",
            count: 12,
            pct: 12,
            icon: Waves,
            color: "text-cyan-600",
            barColor: "bg-cyan-600",
          },
          {
            type: "lainnya",
            label: "Cuaca Ekstrem & Angin Puting Beliung",
            count: 8,
            pct: 9,
            icon: AlertTriangle,
            color: "text-purple-500",
            barColor: "bg-purple-500",
          },
        ],
      };
    }

    // Default: Pemerintahan (Pusat / Seluruh Data Masuk)
    return {
      title: "Rekap & Statistik Operasional Nasional",
      subtitle:
        "Analitik terpadu mencakup seluruh laporan bencana, panggilan SOS darurat, dan kinerja multi-instansi se-Indonesia.",
      jurisdictionBadge: "Akses Penuh Seluruh Instansi RI (Pemerintahan)",
      totalReports: 142,
      totalReportsLabel: "Total Laporan Terpadu",
      selesaiReports: 47,
      ditindaklanjutiReports: 67,
      diverifikasiReports: 18,
      diterimaReports: 10,
      responseTime: "6.4",
      responseComparison: "57% lebih cepat",
      fourthMetricLabel: "Partisipasi Warga",
      fourthMetricValue: "2.514 Saksi",
      fourthMetricSub: "Konfirmasi saksi tervalidasi",
      agencySectionTitle: "Beban Penanganan Lintas 5 Instansi Terkait",
      agencySectionSub: "Alokasi disposisi tugas dan persentase keberhasilan penyelesaian se-Indonesia",
      agencyList: [
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
      ],
      provinces: [
        { name: "Jawa Barat", count: 38, pct: 27 },
        { name: "DKI Jakarta", count: 28, pct: 20 },
        { name: "Jawa Tengah", count: 22, pct: 15 },
        { name: "Jawa Timur", count: 18, pct: 13 },
        { name: "DI Yogyakarta", count: 12, pct: 8 },
        { name: "Banten", count: 10, pct: 7 },
        { name: "Sumatera Barat", count: 6, pct: 4 },
        { name: "Bali", count: 5, pct: 4 },
        { name: "Sulawesi Selatan", count: 3, pct: 2 },
      ],
      disasters: [
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
      ],
    };
  }, [activeUnit]);

  const resolutionRate = (
    (roleStats.selesaiReports / roleStats.totalReports) *
    100
  ).toFixed(1);

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto font-sans pb-12 select-none">
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-orange-100 text-orange-700 border border-orange-200">
              {roleStats.jurisdictionBadge}
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
            {roleStats.title}
          </h1>
          <p className="text-xs md:text-sm text-slate-500 font-normal mt-0.5">
            {roleStats.subtitle}
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
            <RotateCw
              className={`w-3.5 h-3.5 ${
                isLoading ? "animate-spin text-orange-500" : "text-slate-500"
              }`}
            />
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
            <p className="text-xs text-slate-400 font-medium">
              {roleStats.totalReportsLabel}
            </p>
            <p className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight mt-0.5">
              {roleStats.totalReports}
            </p>
            <p className="text-[11px] text-blue-600 font-semibold flex items-center gap-1 mt-0.5">
              <span>{roleStats.provinces.length} Wilayah</span>
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
            <p className="text-xs text-slate-400 font-medium">
              Tingkat Penuntasan
            </p>
            <p className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight mt-0.5">
              {resolutionRate}%
            </p>
            <p className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1 mt-0.5">
              <span>{roleStats.selesaiReports} selesai</span>
              <span className="text-slate-400 font-normal">
                dari {roleStats.totalReports} kasus
              </span>
            </p>
          </div>
        </div>

        {/* Card 3: Rata-rata Waktu Tanggap */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-[0_2px_12px_rgba(0,0,0,0.02)] flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-full bg-[#FEF3C7] flex items-center justify-center text-[#D97706] shrink-0 font-bold">
            <Clock className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">
              Rata-rata Waktu Tanggap
            </p>
            <p className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight mt-0.5">
              {roleStats.responseTime}{" "}
              <span className="text-xs font-normal text-slate-400">menit</span>
            </p>
            <p className="text-[11px] text-amber-600 font-semibold flex items-center gap-1 mt-0.5">
              <TrendingUp className="w-3 h-3 text-amber-500" />
              <span>{roleStats.responseComparison}</span>
            </p>
          </div>
        </div>

        {/* Card 4: Metrik Khusus Satuan */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-[0_2px_12px_rgba(0,0,0,0.02)] flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-full bg-[#FEE2E2] flex items-center justify-center text-[#EF4444] shrink-0 font-bold">
            <Shield className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">
              {roleStats.fourthMetricLabel}
            </p>
            <p className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight mt-0.5">
              {roleStats.fourthMetricValue}
            </p>
            <p className="text-[11px] text-rose-600 font-semibold mt-0.5">
              {roleStats.fourthMetricSub}
            </p>
          </div>
        </div>
      </div>

      {/* 3. Grid: Kinerja Instansi & Pipeline Status */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 md:gap-6 items-start">
        {/* Kolom Kiri: Beban Kerja per Satuan (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-100 p-6 shadow-[0_2px_16px_rgba(0,0,0,0.02)] space-y-5">
          <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
                {roleStats.agencySectionTitle}
              </h2>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {roleStats.agencySectionSub}
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-[11px] font-bold">
              {roleStats.agencyList.length} Divisi / Sektor
            </span>
          </div>

          <div className="space-y-4 pt-1">
            {roleStats.agencyList.map((agency, idx) => (
              <div key={idx} className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-800">
                      {agency.name}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-semibold">
                      {agency.badge}
                    </span>
                  </div>
                  <span className="text-slate-500 font-medium">
                    <strong className="text-slate-800">{agency.count}</strong>{" "}
                    kasus ({agency.pct}%) ·{" "}
                    <span className="text-emerald-600 font-bold">
                      {agency.resolved} tuntas ({agency.resolvePct}%)
                    </span>
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
              <strong className="text-slate-700 font-semibold">
                Sinergi Koordinasi Komando Terpadu:
              </strong>{" "}
              Seluruh data laporan dan panggilan darurat terfilter otomatis
              berdasarkan yurisdiksi dan kewenangan instansi Anda (
              <strong>{activeUnitName}</strong>), menjamin akuntabilitas dan
              kecepatan aksi tanggap darurat di lapangan.
            </p>
          </div>
        </div>

        {/* Kolom Kanan: Pipeline Alur Laporan (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-100 p-6 shadow-[0_2px_16px_rgba(0,0,0,0.02)] space-y-4">
          <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
                Status Pipeline Penanganan
              </h2>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Distribusi progres insiden dari masuk hingga tuntas
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-[11px] font-bold">
              Total {roleStats.totalReports}
            </span>
          </div>

          <div className="space-y-3 pt-1 font-sans">
            {/* Step 1 */}
            <div className="p-3.5 rounded-xl border border-blue-200/80 bg-[#EFF6FF] flex items-center justify-between shadow-2xs">
              <div>
                <span className="text-[11px] font-extrabold uppercase text-[#2563EB] tracking-wider block">
                  1. Masuk / Diterima
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  Menunggu verifikasi lapangan
                </span>
              </div>
              <span className="text-xl font-extrabold text-[#2563EB] tabular-nums">
                {roleStats.diterimaReports}
              </span>
            </div>

            {/* Step 2 */}
            <div className="p-3.5 rounded-xl border border-purple-200/80 bg-[#FAF5FF] flex items-center justify-between shadow-2xs">
              <div>
                <span className="text-[11px] font-extrabold uppercase text-[#9333EA] tracking-wider block">
                  2. Diverifikasi Posko
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  Tervalidasi & siap pengerahan armada
                </span>
              </div>
              <span className="text-xl font-extrabold text-[#9333EA] tabular-nums">
                {roleStats.diverifikasiReports}
              </span>
            </div>

            {/* Step 3 */}
            <div className="p-3.5 rounded-xl border border-amber-200/80 bg-[#FFF7ED] flex items-center justify-between shadow-2xs">
              <div>
                <span className="text-[11px] font-extrabold uppercase text-[#EA580C] tracking-wider block">
                  3. Dalam Penanganan Lapangan
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  Regu dan armada sedang beroperasi
                </span>
              </div>
              <span className="text-xl font-extrabold text-[#EA580C] tabular-nums">
                {roleStats.ditindaklanjutiReports}
              </span>
            </div>

            {/* Step 4 */}
            <div className="p-3.5 rounded-xl border border-emerald-200/80 bg-[#ECFDF5] flex items-center justify-between shadow-2xs">
              <div>
                <span className="text-[11px] font-extrabold uppercase text-[#059669] tracking-wider block">
                  4. Selesai Ditangani
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  Insiden teratasi dan ditutup aman
                </span>
              </div>
              <span className="text-xl font-extrabold text-[#059669] tabular-nums">
                {roleStats.selesaiReports}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Grid: Sebaran Wilayah & Tipe Kejadian (Grid 6 : 6) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 md:gap-6 items-start">
        {/* Sebaran Wilayah */}
        <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-100 p-6 shadow-[0_2px_16px_rgba(0,0,0,0.02)] space-y-4">
          <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
                Sebaran Kejadian per Wilayah
              </h2>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Konsentrasi laporan kejadian pada area yurisdiksi operasional
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-[11px] font-bold">
              {roleStats.provinces.length} Daerah
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
            {roleStats.provinces.map((prov, idx) => (
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

        {/* Distribusi Tipe Kejadian */}
        <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-100 p-6 shadow-[0_2px_16px_rgba(0,0,0,0.02)] space-y-4">
          <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
                Distribusi Klasifikasi Insiden
              </h2>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Kategori kedaruratan yang ditangani oleh instansi Anda
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-[11px] font-bold">
              {roleStats.disasters.length} Kategori
            </span>
          </div>

          <div className="space-y-3 pt-1">
            {roleStats.disasters.map((d, idx) => {
              const Icon = d.icon;
              return (
                <div key={idx} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <Icon className={`w-3.5 h-3.5 ${d.color}`} />
                      <span className="font-bold text-slate-800">
                        {d.label}
                      </span>
                    </div>
                    <span className="font-extrabold text-slate-700 tabular-nums">
                      {d.count} kasus ({d.pct}%)
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

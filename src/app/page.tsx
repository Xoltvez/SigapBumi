"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  MapPin,
  Search,
  Clock,
  Radio,
  ExternalLink,
  ChevronRight,
  Flame,
  Waves,
  Activity,
  Trees,
  Mountain,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  PhoneCall,
  Shield,
  ShieldCheck,
  CheckSquare,
  Square,
  Sparkles,
  Wind,
  HeartPulse,
  Building2,
  Layers,
  Compass,
} from "lucide-react";
import { DEFAULT_MOCK_REPORTS } from "@/lib/services/reports";
import type { DisasterType } from "@/types";

export default function HomePage() {
  const router = useRouter();

  // Search tracking state
  const [trackingInput, setTrackingInput] = useState("");
  const [selectedDisasterFilter, setSelectedDisasterFilter] = useState<string>("semua");
  const [activeHeroTab, setActiveHeroTab] = useState<"status" | "hotline">("status");

  // Interactive Tas Siaga Bencana (TSB) checklist state
  const [checkedTsb, setCheckedTsb] = useState<{ [key: string]: boolean }>({
    dokumen: true,
    p3k: true,
    senter: false,
    air: true,
    peluit: false,
  });

  const tsbItems = [
    { id: "dokumen", label: "Dokumen & Surat Berharga (Kantong Kedap Air)" },
    { id: "p3k", label: "Kotak P3K, Obat-obatan Khusus & Masker" },
    { id: "air", label: "Air Minum Bersih & Makanan Tahan Lama (3 Hari)" },
    { id: "senter", label: "Senter / Penerangan Darurat & Baterai Cadangan" },
    { id: "peluit", label: "Peluit Sinyal Darurat SOS & Powerbank" },
  ];

  const completedTsbCount = Object.values(checkedTsb).filter(Boolean).length;
  const tsbProgress = Math.round((completedTsbCount / tsbItems.length) * 100);

  const toggleTsbItem = (id: string) => {
    setCheckedTsb((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleTrackingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (trackingInput.trim()) {
      router.push(`/lacak?kode=${encodeURIComponent(trackingInput.trim().toUpperCase())}`);
    } else {
      router.push("/lacak");
    }
  };

  // Metrics
  const totalCount = DEFAULT_MOCK_REPORTS.length;
  const resolvedCount = DEFAULT_MOCK_REPORTS.filter((r) => r.status === "selesai").length;
  const resolvedRate = ((resolvedCount / totalCount) * 100).toFixed(1);

  // Filtered reports
  const filteredReports =
    selectedDisasterFilter === "semua"
      ? DEFAULT_MOCK_REPORTS.slice(0, 4)
      : DEFAULT_MOCK_REPORTS.filter((r) => r.disaster_type === selectedDisasterFilter).slice(0, 4);

  // Categories list with distinct thematic styling
  const categories: {
    type: DisasterType;
    label: string;
    desc: string;
    icon: React.ElementType;
    badgeColor: string;
    borderColor: string;
    bgAccent: string;
    iconColor: string;
  }[] = [
    {
      type: "banjir",
      label: "Banjir & Genangan",
      desc: "Luapan sungai, rob pantai, dan genangan air pemukiman",
      icon: Waves,
      badgeColor: "bg-blue-50 text-blue-700 border-blue-200",
      borderColor: "hover:border-blue-400 hover:shadow-blue-500/10",
      bgAccent: "group-hover:bg-blue-50/50",
      iconColor: "text-blue-600 bg-blue-100/70",
    },
    {
      type: "gempa",
      label: "Gempa Bumi & Tsunami",
      desc: "Guncangan tektonik, retakan tanah, dan peringatan gelombang",
      icon: Activity,
      badgeColor: "bg-amber-50 text-amber-700 border-amber-200",
      borderColor: "hover:border-amber-400 hover:shadow-amber-500/10",
      bgAccent: "group-hover:bg-amber-50/50",
      iconColor: "text-amber-600 bg-amber-100/70",
    },
    {
      type: "kebakaran",
      label: "Kebakaran Pemukiman",
      desc: "Insiden api perumahan, korsleting listrik, dan gedung publik",
      icon: Flame,
      badgeColor: "bg-red-50 text-red-700 border-red-200",
      borderColor: "hover:border-red-400 hover:shadow-red-500/10",
      bgAccent: "group-hover:bg-red-50/50",
      iconColor: "text-red-600 bg-red-100/70",
    },
    {
      type: "longsor",
      label: "Tanah Longsor",
      desc: "Gerakan lereng tebing, jalan terputus, dan material batuan",
      icon: Mountain,
      badgeColor: "bg-stone-50 text-stone-700 border-stone-200",
      borderColor: "hover:border-stone-400 hover:shadow-stone-500/10",
      bgAccent: "group-hover:bg-stone-50/50",
      iconColor: "text-stone-700 bg-stone-200/80",
    },
    {
      type: "karhutla",
      label: "Karhutla & Kabut Asap",
      desc: "Kebakaran lahan gambut, hutan lindung, dan titik api (hotspot)",
      icon: Trees,
      badgeColor: "bg-orange-50 text-orange-700 border-orange-200",
      borderColor: "hover:border-orange-400 hover:shadow-orange-500/10",
      bgAccent: "group-hover:bg-orange-50/50",
      iconColor: "text-orange-600 bg-orange-100/70",
    },
    {
      type: "lainnya",
      label: "Cuaca Ekstrem & Lainnya",
      desc: "Puting beliung, pohon tumbang, abrasi pantai, & darurat lain",
      icon: Wind,
      badgeColor: "bg-cyan-50 text-cyan-700 border-cyan-200",
      borderColor: "hover:border-cyan-400 hover:shadow-cyan-500/10",
      bgAccent: "group-hover:bg-cyan-50/50",
      iconColor: "text-cyan-600 bg-cyan-100/70",
    },
  ];

  return (
    <main className="flex-1 w-full max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 py-5 md:py-8 pb-28 md:pb-16 space-y-8 md:space-y-12">
      {/* 1. Hero Section: High Impact, Clean, Human-Centered, Action-Oriented */}
      <section className="relative overflow-hidden rounded-2xl border border-line bg-gradient-to-b from-white via-orange-50/20 to-white p-6 sm:p-8 lg:p-10 shadow-sm">
        {/* Soft Background Radial Glow Accents */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 -right-24 w-96 h-96 rounded-full bg-primary/10 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-amber-400/10 blur-3xl"
        />

        <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
          {/* Left Column: Headline, Description, Quick Tracking Form & Primary CTAs */}
          <div className="lg:col-span-7 flex flex-col items-start space-y-6">
            {/* Trust Pill */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-soft border border-primary/20 text-xs font-semibold text-primary-text shadow-xs">
              <ShieldCheck className="w-3.5 h-3.5 text-primary" />
              <span>Sistem Tanggap Bencana & Posko Terpadu Indonesia</span>
            </div>

            {/* Main Headline */}
            <div>
              <h1 className="text-3xl sm:text-4xl lg:text-[42px] font-extrabold text-ink leading-[1.18] tracking-tight">
                Setiap Detik Berarti. <br className="hidden sm:inline" />
                <span className="bg-gradient-to-r from-primary via-primary-hover to-amber-600 bg-clip-text text-transparent">
                  Laporkan Cepat.
                </span>{" "}
                Lindungi Bersama.
              </h1>
              <p className="text-ink-soft text-base sm:text-lg mt-3 leading-relaxed max-w-xl">
                Kirimkan laporan kejadian bencana, pantau status penanganan secara terbuka, dan akses informasi tanggap darurat resmi dalam satu pintu.
              </p>
            </div>

            {/* Direct Quick Tracking / Search Bar */}
            <form
              onSubmit={handleTrackingSubmit}
              className="w-full max-w-xl bg-surface border-2 border-line hover:border-primary/50 focus-within:border-primary rounded-xl p-1.5 shadow-sm transition-all flex flex-col sm:flex-row items-stretch gap-1.5"
            >
              <div className="flex items-center px-3 gap-2 flex-1 min-h-[44px]">
                <Search className="w-4 h-4 text-ink-muted shrink-0" />
                <input
                  type="text"
                  value={trackingInput}
                  onChange={(e) => setTrackingInput(e.target.value)}
                  placeholder="Masukkan Kode Lacak (cth: SB-2026-001) / Lokasi..."
                  className="w-full text-xs sm:text-sm bg-transparent text-ink placeholder:text-ink-muted focus:outline-none"
                  aria-label="Input kode pelacakan bencana"
                />
              </div>
              <button
                type="submit"
                className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg bg-ink hover:bg-ink-soft text-white text-xs sm:text-sm font-semibold transition-colors shrink-0 shadow-xs"
              >
                <span>Lacak Status</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </button>
            </form>

            {/* Main Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto pt-1">
              <Link
                href="/lapor"
                className="group relative inline-flex items-center justify-center h-12 px-6 rounded-xl bg-gradient-to-r from-primary to-primary-hover hover:from-primary-hover hover:to-primary-active text-white font-bold text-sm sm:text-base transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 min-h-[48px]"
              >
                <AlertTriangle className="w-4 h-4 mr-2 transition-transform group-hover:scale-110" />
                <span>Laporkan Kejadian Sekarang</span>
              </Link>

              <Link
                href="/peta"
                className="inline-flex items-center justify-center h-12 px-5 rounded-xl border border-line-strong bg-surface hover:bg-surface-hover hover:border-ink/20 text-ink font-semibold text-sm sm:text-base transition-all shadow-xs hover:shadow-sm min-h-[48px]"
              >
                <Compass className="w-4 h-4 mr-2 text-primary" />
                <span>Jelajahi Peta Situasi</span>
              </Link>
            </div>
          </div>

          {/* Right Column: Live Telemetry & Emergency Hotline Card */}
          <div className="lg:col-span-5 bg-surface border border-line rounded-2xl p-5 sm:p-6 shadow-card space-y-4">
            {/* Header with Interactive Tabs */}
            <div className="flex items-center justify-between border-b border-line pb-3">
              <div className="flex items-center gap-1 bg-bg p-1 rounded-lg border border-line">
                <button
                  type="button"
                  onClick={() => setActiveHeroTab("status")}
                  className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
                    activeHeroTab === "status"
                      ? "bg-surface text-ink shadow-xs"
                      : "text-ink-soft hover:text-ink"
                  }`}
                >
                  Status Terkini
                </button>
                <button
                  type="button"
                  onClick={() => setActiveHeroTab("hotline")}
                  className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
                    activeHeroTab === "hotline"
                      ? "bg-surface text-danger shadow-xs"
                      : "text-ink-soft hover:text-ink"
                  }`}
                >
                  Hotline Darurat
                </button>
              </div>
            </div>

            {/* Tab Content 1: Live Status Feed */}
            {activeHeroTab === "status" ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-ink-muted">
                  <span>Laporan Terverifikasi Terbaru</span>
                  <Link href="/lacak" className="text-primary hover:underline font-semibold">
                    Semua Laporan &rarr;
                  </Link>
                </div>

                <div className="space-y-2.5">
                  {DEFAULT_MOCK_REPORTS.slice(0, 2).map((item) => (
                    <Link
                      key={item.id}
                      href={`/lacak?kode=${item.tracking_code}`}
                      className="block p-3 rounded-xl border border-line bg-bg hover:bg-primary-soft/40 hover:border-primary/30 transition-all text-xs group"
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="font-mono font-bold text-primary group-hover:underline">
                          {item.tracking_code}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            item.status === "selesai"
                              ? "bg-success-soft text-success-text"
                              : "bg-warning-soft text-warning-text"
                          }`}
                        >
                          {item.status}
                        </span>
                      </div>
                      <p className="font-bold text-ink truncate group-hover:text-primary transition-colors">
                        {item.title}
                      </p>
                      <p className="text-ink-muted text-[11px] truncate mt-0.5 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-primary shrink-0" />
                        <span>{item.address}</span>
                      </p>
                    </Link>
                  ))}
                </div>

                {/* Progress bar info */}
                <div className="pt-2 border-t border-line">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-ink-soft font-medium">Tingkat Penanganan Posko</span>
                    <span className="font-bold text-success">{resolvedRate}% Selesai</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-line overflow-hidden">
                    <div
                      className="h-full bg-success rounded-full transition-all duration-500"
                      style={{ width: `${resolvedRate}%` }}
                    />
                  </div>
                </div>
              </div>
            ) : (
              /* Tab Content 2: Emergency Hotline Direct Calls */
              <div className="space-y-2.5">
                <p className="text-xs text-ink-soft">
                  Hubungi nomor panggilan darurat bebas pulsa resmi untuk situasi mengancam jiwa:
                </p>

                <div className="grid grid-cols-2 gap-2">
                  <a
                    href="tel:112"
                    className="p-3 rounded-xl border border-danger/30 bg-danger-soft hover:bg-danger/10 transition-colors flex flex-col justify-between"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-danger">Panggilan 112</span>
                      <PhoneCall className="w-3.5 h-3.5 text-danger" />
                    </div>
                    <span className="text-lg font-extrabold text-danger mt-1">112</span>
                    <span className="text-[10px] text-danger-text/80">Darurat Umum & BPBD</span>
                  </a>

                  <a
                    href="tel:115"
                    className="p-3 rounded-xl border border-orange-200 bg-orange-50 hover:bg-orange-100/60 transition-colors flex flex-col justify-between"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-orange-800">SAR Basarnas</span>
                      <PhoneCall className="w-3.5 h-3.5 text-orange-700" />
                    </div>
                    <span className="text-lg font-extrabold text-orange-900 mt-1">115</span>
                    <span className="text-[10px] text-orange-800/80">Penyelamatan & Evakuasi</span>
                  </a>

                  <a
                    href="tel:119"
                    className="p-3 rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100/60 transition-colors flex flex-col justify-between"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-blue-800">Medis 119</span>
                      <HeartPulse className="w-3.5 h-3.5 text-blue-700" />
                    </div>
                    <span className="text-lg font-extrabold text-blue-900 mt-1">119</span>
                    <span className="text-[10px] text-blue-800/80">Gawat Darurat & Ambulans</span>
                  </a>

                  <a
                    href="tel:113"
                    className="p-3 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100/60 transition-colors flex flex-col justify-between"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-red-800">Damkar 113</span>
                      <Flame className="w-3.5 h-3.5 text-red-700" />
                    </div>
                    <span className="text-lg font-extrabold text-red-900 mt-1">113</span>
                    <span className="text-[10px] text-red-800/80">Pemadam Kebakaran</span>
                  </a>
                </div>
              </div>
            )}

            {/* Quick Link Footer */}
            <div className="pt-2 border-t border-line flex items-center justify-between text-xs text-ink-muted">
              <Link href="/fasilitas" className="hover:text-primary transition-colors flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-primary" />
                <span>Cari Fasilitas Kesehatan Terdekat</span>
              </Link>
              <Link href="/kontak-darurat" className="text-primary hover:underline font-semibold">
                Daftar Lengkap &rarr;
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Official Weather & Early Warning Live Broadcast Strip */}
      <section
        aria-label="Peringatan Dini Cuaca & Gempa BMKG"
        className="relative overflow-hidden bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/5 border border-amber-300/60 rounded-xl p-3.5 sm:p-4 shadow-sm backdrop-blur-sm"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-start sm:items-center gap-3">
            <div className="relative flex items-center justify-center shrink-0">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-60"></span>
              <div className="relative w-9 h-9 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-xs">
                <Radio className="w-4 h-4 animate-pulse" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500 text-white">
                  Peringatan Dini BMKG
                </span>
                <span className="text-xs font-semibold text-amber-900">
                  Siaga Cuaca Ekstrem & Potensi Bencana Hidrometeorologi
                </span>
              </div>
              <p className="text-xs text-ink/80 mt-0.5 leading-relaxed">
                Waspada hujan lebat disertai angin kencang di pesisir Sumatera, Jawa, Bali, dan Kalimantan. Pantau aliran sungai terdekat.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
            <Link
              href="/cuaca"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface text-amber-900 hover:bg-amber-50 border border-amber-200/80 text-xs font-bold transition-all shadow-xs hover:shadow-sm"
            >
              <span>Radar Cuaca & InaTEWS</span>
              <ChevronRight className="w-3.5 h-3.5 text-amber-700" />
            </Link>
          </div>
        </div>
      </section>

      {/* 3. Kategori Kejadian Bencana Cepat (Modern Bento-Grid Cards) */}
      <section aria-labelledby="kategori-title" className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div>
            <h2 id="kategori-title" className="text-xl md:text-2xl font-bold text-ink">
              Kategori Kejadian Bencana
            </h2>
            <p className="text-xs sm:text-sm text-ink-soft mt-1">
              Pilih klasifikasi bencana untuk membuka formulir pelaporan dengan panduan evakuasi spesifik
            </p>
          </div>

          <Link
            href="/lapor"
            className="text-xs sm:text-sm font-bold text-primary hover:text-primary-hover inline-flex items-center gap-1 group self-start sm:self-auto"
          >
            <span>Buka Formulir Lengkap</span>
            <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
          {categories.map((cat) => {
            const IconComponent = cat.icon;
            return (
              <Link
                key={cat.type}
                href={`/lapor?tipe=${cat.type}`}
                className={`group relative p-5 bg-surface border border-line rounded-2xl transition-all duration-200 hover:-translate-y-1 hover:shadow-card flex flex-col justify-between ${cat.borderColor}`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3.5">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105 ${cat.iconColor}`}>
                      <IconComponent className="w-6 h-6" />
                    </div>
                    <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-md border ${cat.badgeColor}`}>
                      Siaga
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-ink group-hover:text-primary transition-colors">
                    {cat.label}
                  </h3>
                  <p className="text-xs text-ink-soft mt-1 leading-relaxed">
                    {cat.desc}
                  </p>
                </div>

                <div className="pt-4 mt-4 border-t border-line/70 flex items-center justify-between text-xs font-bold text-primary">
                  <span>Laporkan Sekarang</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* 4. Live Situation Feed & Filterable Incident Reports */}
      <section aria-labelledby="laporan-terkini-title" className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <h2 id="laporan-terkini-title" className="text-xl md:text-2xl font-bold text-ink">
              Laporan Kejadian Terkini
            </h2>
            <p className="text-xs sm:text-sm text-ink-soft mt-1">
              Data insiden terverifikasi posko terpadu dari seluruh penjuru Indonesia
            </p>
          </div>

          <Link
            href="/peta"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary-soft hover:bg-primary-soft/80 text-primary-text border border-primary/20 text-xs font-bold transition-all self-start sm:self-auto"
          >
            <Compass className="w-3.5 h-3.5 text-primary" />
            <span>Pantau 90+ Titik di Peta Interaktif</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs no-scrollbar">
          {[
            { id: "semua", label: "Semua Kategori" },
            { id: "banjir", label: "🌊 Banjir" },
            { id: "gempa", label: "🌋 Gempa" },
            { id: "kebakaran", label: "🔥 Kebakaran" },
            { id: "longsor", label: "⛰️ Tanah Longsor" },
            { id: "karhutla", label: "🌲 Karhutla" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSelectedDisasterFilter(tab.id)}
              className={`px-3.5 py-1.5 rounded-full font-semibold transition-all shrink-0 ${
                selectedDisasterFilter === tab.id
                  ? "bg-ink text-white shadow-xs"
                  : "bg-surface hover:bg-bg text-ink-soft border border-line"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredReports.map((report) => (
            <div
              key={report.id}
              className="bg-surface border border-line rounded-2xl p-5 shadow-xs hover:border-primary/40 hover:shadow-card transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-extrabold text-primary px-2.5 py-0.5 rounded-md bg-primary-soft border border-primary/20">
                      {report.tracking_code}
                    </span>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-bg text-ink-muted border border-line">
                      {report.province}
                    </span>
                  </div>

                  <span
                    className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full capitalize ${
                      report.status === "selesai"
                        ? "bg-success-soft text-success-text"
                        : report.status === "ditindaklanjuti"
                        ? "bg-warning-soft text-warning-text"
                        : "bg-info-soft text-info-text"
                    }`}
                  >
                    {report.status}
                  </span>
                </div>

                <h3 className="text-base font-bold text-ink leading-snug">
                  {report.title}
                </h3>

                <p className="text-xs text-ink-soft leading-relaxed line-clamp-2">
                  {report.description}
                </p>
              </div>

              <div className="pt-3 border-t border-line flex items-center justify-between text-xs text-ink-muted">
                <div className="flex items-center gap-1.5 min-w-0 pr-2">
                  <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                  <span className="truncate">{report.address}</span>
                </div>

                <Link
                  href={`/lacak?kode=${report.tracking_code}`}
                  className="font-bold text-primary hover:text-primary-hover inline-flex items-center gap-1 shrink-0 group min-h-[32px]"
                >
                  <span>Pantau Alur</span>
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 5. Statistik Transparansi & Efektivitas Tanggap Bencana */}
      <section aria-labelledby="stats-title" className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div>
            <h2 id="stats-title" className="text-xl md:text-2xl font-bold text-ink">
              Ringkasan Penanganan & Efektivitas Posko
            </h2>
            <p className="text-xs sm:text-sm text-ink-soft mt-1">
              Data agregat dihitung secara transparan dari laporan terverifikasi di seluruh Indonesia
            </p>
          </div>

          <Link
            href="/statistik"
            className="text-xs sm:text-sm font-bold text-primary hover:text-primary-hover inline-flex items-center gap-1 self-start sm:self-auto"
          >
            <span>Buka Analitik Lengkap</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1 */}
          <div className="bg-surface border border-line rounded-2xl p-5 shadow-xs flex flex-col justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-ink-muted">
              Total Laporan Terdata
            </span>
            <p className="text-3xl sm:text-4xl font-extrabold text-ink mt-3 tabular-nums">
              {totalCount}
            </p>
            <div className="mt-3 pt-2 border-t border-line text-xs font-semibold text-success flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-success" />
              <span>{resolvedRate}% Laporan Berhasil Ditangani</span>
            </div>
          </div>

          {/* Card 2 */}
          <div className="bg-surface border border-line rounded-2xl p-5 shadow-xs flex flex-col justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-ink-muted">
              Target Respons Awal
            </span>
            <p className="text-3xl sm:text-4xl font-extrabold text-ink mt-3 tabular-nums">
              18 <span className="text-base font-normal text-ink-soft">menit</span>
            </p>
            <div className="mt-3 pt-2 border-t border-line text-xs text-ink-soft flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-primary" />
              <span>Standar Verifikasi Posko Komando</span>
            </div>
          </div>

          {/* Card 3 */}
          <div className="bg-surface border border-line rounded-2xl p-5 shadow-xs flex flex-col justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-ink-muted">
              Cakupan Wilayah Siaga
            </span>
            <p className="text-3xl sm:text-4xl font-extrabold text-ink mt-3 tabular-nums">
              9 <span className="text-base font-normal text-ink-soft">provinsi</span>
            </p>
            <div className="mt-3 pt-2 border-t border-line text-xs text-ink-soft flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-primary" />
              <span>Jaringan Posko Terpadu Nasional</span>
            </div>
          </div>

          {/* Card 4 */}
          <div className="bg-gradient-to-br from-primary-soft to-orange-100/60 border border-primary/20 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-primary-text">
              Status Sistem Darurat
            </span>
            <p className="text-2xl sm:text-3xl font-extrabold text-primary-text mt-3">
              100% Aktif
            </p>
            <div className="mt-3 pt-2 border-t border-primary/20 text-xs font-bold text-primary-text flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-primary animate-pulse" />
              <span>Sinkronisasi Realtime Terhubung</span>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Citizen Preparedness Bento Grid: Interactive TSB & Steps */}
      <section aria-labelledby="edukasi-title" className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div>
            <h2 id="edukasi-title" className="text-xl md:text-2xl font-bold text-ink">
              Kesiapsiagaan & Mitigasi Mandiri
            </h2>
            <p className="text-xs sm:text-sm text-ink-soft mt-1">
              Bekali diri dan keluarga dengan langkah penyelamatan dan persiapan darurat sebelum bencana terjadi
            </p>
          </div>

          <Link
            href="/edukasi"
            className="text-xs sm:text-sm font-bold text-primary hover:text-primary-hover inline-flex items-center gap-1"
          >
            <span>Seluruh Panduan Edukasi</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Bento 1: Interactive Tas Siaga Bencana (TSB) Checklist (7 cols) */}
          <div className="lg:col-span-7 bg-surface border border-line rounded-2xl p-6 shadow-card space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-primary uppercase tracking-wider">
                  Checklist Interaktif
                </span>
                <h3 className="text-lg font-bold text-ink mt-0.5">
                  Tas Siaga Bencana (TSB) Keluarga
                </h3>
              </div>
              <div className="text-right">
                <span className="text-xl font-extrabold text-primary">{tsbProgress}%</span>
                <span className="text-[11px] text-ink-muted block font-semibold">Kesiapan</span>
              </div>
            </div>

            <p className="text-xs text-ink-soft leading-relaxed">
              Pastikan tas siaga berisi kebutuhan pokok bertahan hidup minimal untuk 72 jam pertama pasca bencana:
            </p>

            {/* Progress Bar */}
            <div className="w-full h-2 rounded-full bg-line overflow-hidden">
              <div
                className="h-full bg-success rounded-full transition-all duration-300"
                style={{ width: `${tsbProgress}%` }}
              />
            </div>

            {/* Checklist Items */}
            <div className="space-y-2.5 pt-1">
              {tsbItems.map((item) => {
                const isChecked = checkedTsb[item.id] || false;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => toggleTsbItem(item.id)}
                    className={`w-full p-3 rounded-xl border text-left flex items-center justify-between gap-3 transition-all ${
                      isChecked
                        ? "bg-success-soft/60 border-success/40 text-ink"
                        : "bg-bg border-line hover:border-line-strong text-ink-soft"
                    }`}
                  >
                    <span className="text-xs font-semibold">{item.label}</span>
                    {isChecked ? (
                      <CheckSquare className="w-4 h-4 text-success shrink-0" />
                    ) : (
                      <Square className="w-4 h-4 text-ink-muted shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>

            <div className="pt-2 flex items-center justify-between text-xs text-ink-soft">
              <span>{completedTsbCount} dari {tsbItems.length} perlengkapan siap</span>
              <Link href="/edukasi#tsb" className="font-bold text-primary hover:underline">
                Panduan Isi Tas Lengkap &rarr;
              </Link>
            </div>
          </div>

          {/* Bento 2: 3 Langkah Emas Tanggap Darurat (5 cols) */}
          <div className="lg:col-span-5 bg-gradient-to-br from-ink to-slate-900 text-white rounded-2xl p-6 shadow-card flex flex-col justify-between space-y-5">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 text-[11px] font-bold text-amber-300">
                <Sparkles className="w-3 h-3" />
                <span>Prosedur Keselamatan Warga</span>
              </div>
              <h3 className="text-lg font-bold mt-2">
                3 Langkah Emas Saat Bencana Tiba
              </h3>
              <p className="text-xs text-white/70 mt-1 leading-relaxed">
                Reaksi cepat yang tepat dapat menyelamatkan jiwa Anda dan keluarga.
              </p>
            </div>

            <div className="space-y-3.5">
              <div className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
                <div className="w-7 h-7 rounded-lg bg-primary text-white font-extrabold text-xs flex items-center justify-center shrink-0">
                  1
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Jangan Panik & Lindungi Kepala</h4>
                  <p className="text-[11px] text-white/70 mt-0.5">
                    Gunakan meja kuat atau bantal untuk melindungi organ vital saat gempa/reruntuhan.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
                <div className="w-7 h-7 rounded-lg bg-primary text-white font-extrabold text-xs flex items-center justify-center shrink-0">
                  2
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Putus Aliran Listrik & Gas</h4>
                  <p className="text-[11px] text-white/70 mt-0.5">
                    Cegah risiko kebakaran sekunder dengan mematikan MCB dan melepas regulator gas tabung.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
                <div className="w-7 h-7 rounded-lg bg-primary text-white font-extrabold text-xs flex items-center justify-center shrink-0">
                  3
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Evakuasi Menuju Titik Kumpul</h4>
                  <p className="text-[11px] text-white/70 mt-0.5">
                    Gunakan jalur evakuasi terbuka, jauhi bangunan tinggi/tiang listrik, dan aktifkan sinyal SOS.
                  </p>
                </div>
              </div>
            </div>

            <Link
              href="/edukasi"
              className="inline-flex items-center justify-center gap-1.5 w-full py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-bold transition-colors shadow-xs"
            >
              <span>Pelajari Semua Langkah Mitigasi</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* 7. Official Authorities, Trust Banner & Help Center */}
      <section className="bg-surface border border-line rounded-2xl p-6 sm:p-8 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-line pb-4">
          <div>
            <h2 className="text-base font-bold text-ink">
              Rujukan Resmi & Koordinasi Lintas Instansi
            </h2>
            <p className="text-xs text-ink-soft mt-0.5">
              SigapBumi terintegrasi dengan standar mitigasi bencana pemerintah Republik Indonesia
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-ink-muted">
            <Shield className="w-4 h-4 text-primary" />
            <span>Kanal Terbuka & Bebas Biaya</span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 pt-1">
          <a
            href="https://www.bmkg.go.id"
            target="_blank"
            rel="noopener noreferrer"
            className="p-3.5 rounded-xl border border-line bg-bg hover:bg-surface hover:border-primary/40 transition-all flex flex-col justify-between group"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-extrabold text-ink group-hover:text-primary transition-colors">BMKG</span>
              <ExternalLink className="w-3.5 h-3.5 text-ink-muted group-hover:text-primary" />
            </div>
            <span className="text-[11px] text-ink-soft">Meteorologi, Klimatologi, & Geofisika</span>
          </a>

          <a
            href="https://bnpb.go.id"
            target="_blank"
            rel="noopener noreferrer"
            className="p-3.5 rounded-xl border border-line bg-bg hover:bg-surface hover:border-primary/40 transition-all flex flex-col justify-between group"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-extrabold text-ink group-hover:text-primary transition-colors">BNPB</span>
              <ExternalLink className="w-3.5 h-3.5 text-ink-muted group-hover:text-primary" />
            </div>
            <span className="text-[11px] text-ink-soft">Badan Nasional Penanggulangan Bencana</span>
          </a>

          <a
            href="https://basarnas.go.id"
            target="_blank"
            rel="noopener noreferrer"
            className="p-3.5 rounded-xl border border-line bg-bg hover:bg-surface hover:border-primary/40 transition-all flex flex-col justify-between group"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-extrabold text-ink group-hover:text-primary transition-colors">BASARNAS</span>
              <ExternalLink className="w-3.5 h-3.5 text-ink-muted group-hover:text-primary" />
            </div>
            <span className="text-[11px] text-ink-soft">Pencarian & Pertolongan Nasional</span>
          </a>

          <Link
            href="/fasilitas"
            className="p-3.5 rounded-xl border border-line bg-bg hover:bg-surface hover:border-primary/40 transition-all flex flex-col justify-between group"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-extrabold text-ink group-hover:text-primary transition-colors">Faskes 119</span>
              <ChevronRight className="w-3.5 h-3.5 text-ink-muted group-hover:text-primary" />
            </div>
            <span className="text-[11px] text-ink-soft">Daftar RS Rujukan & Ambulans Evakuasi</span>
          </Link>

          <Link
            href="/kontak-darurat"
            className="p-3.5 rounded-xl border border-line bg-bg hover:bg-surface hover:border-primary/40 transition-all flex flex-col justify-between group"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-extrabold text-ink group-hover:text-primary transition-colors">Hotline 112</span>
              <ChevronRight className="w-3.5 h-3.5 text-ink-muted group-hover:text-primary" />
            </div>
            <span className="text-[11px] text-ink-soft">Direktori Kontak Bebas Pulsa Nasional</span>
          </Link>
        </div>
      </section>
    </main>
  );
}

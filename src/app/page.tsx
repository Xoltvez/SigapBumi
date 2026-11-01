"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
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
import { Interactive3DBag } from "@/components/home/Interactive3DBag";

export default function HomePage() {
  const router = useRouter();

  // Search tracking state
  const [trackingInput, setTrackingInput] = useState("");
  const [selectedDisasterFilter, setSelectedDisasterFilter] = useState<string>("semua");

  // Checklist Tas Siaga Bencana (TSB) standar BPBD
  const tsbItems = [
    {
      id: "dokumen",
      label: "Dokumen & Surat Berharga",
      desc: "KTP, KK, Ijazah, Buku Tabungan dalam kantong kedap air",
    },
    {
      id: "p3k",
      label: "Kotak P3K & Obat Medis",
      desc: "Obat pribadi, perban, plester luka, antiseptik, dan masker",
    },
    {
      id: "air",
      label: "Air Minum & Ransum Pangan",
      desc: "Minimal 3 liter per jiwa dan makanan instan/kaleng tahan 72 jam",
    },
    {
      id: "senter",
      label: "Senter & Baterai Cadangan",
      desc: "Penerangan darurat LED tahan air dan baterai ekstra",
    },
    {
      id: "peluit",
      label: "Peluit Darurat & Powerbank",
      desc: "Sinyal suara penolong SOS dan daya komunikasi ponsel",
    },
  ];

  const handleTrackingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (trackingInput.trim()) {
      router.push(`/lacak?kode=${encodeURIComponent(trackingInput.trim().toUpperCase())}`);
    } else {
      router.push("/lacak");
    }
  };

  // Metrics for hero status
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

          {/* Right Column: Interactive Quick-Report Bento Card (Compact) */}
          <div className="lg:col-span-5 relative max-w-[420px] mx-auto lg:max-w-none w-full">
            {/* Background Geometric Red/Orange Blob Accent */}
            <div
              aria-hidden="true"
              className="absolute -top-2 -right-2 w-28 h-28 rounded-full bg-gradient-to-br from-red-500/80 to-orange-500/80 blur-xs -z-10"
            />
            <div
              aria-hidden="true"
              className="absolute -bottom-3 -left-3 w-24 h-24 rounded-2xl bg-orange-600/25 blur-md -z-10"
            />

            {/* Dark Container Card */}
            <div className="bg-[#111622] border border-slate-800 rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-xl shadow-black/40 space-y-3 text-white">
              {/* Header Headline */}
              <div>
                <span className="text-[9px] font-extrabold uppercase tracking-wider text-orange-400 bg-orange-500/10 border border-orange-500/20 px-2 py-0.5 rounded-full inline-block mb-1.5">
                  Lapor Cepat 1-Klik
                </span>
                <h2 className="text-sm sm:text-base font-bold text-white tracking-tight leading-snug">
                  Laporkan kejadian darurat di sekitar Anda sekarang.
                </h2>
              </div>

              {/* Stacked White Card (Center Layer with Offset Card Shadow) */}
              <div className="relative my-1">
                {/* Offset Card Layer Behind */}
                <div
                  aria-hidden="true"
                  className="absolute inset-0 bg-white/35 rounded-xl rotate-2 translate-x-1.5 -translate-y-1 scale-[0.98] shadow pointer-events-none"
                />

                {/* Main Foreground White Card */}
                <div className="relative bg-white rounded-xl p-2.5 sm:p-3 shadow-lg text-slate-900 border border-slate-100">
                  <div className="flex items-center justify-between pb-1.5 mb-1 border-b border-slate-100 text-xs">
                    <span className="font-bold text-slate-800 text-[10px] uppercase tracking-wider">
                      Pilih Jenis Kejadian
                    </span>
                    <span className="text-[9px] font-semibold text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded-full">
                      Siaga 24/7
                    </span>
                  </div>

                  <div className="space-y-0.5">
                    {/* Item 1: Kebakaran */}
                    <Link
                      href="/lapor?tipe=kebakaran"
                      className="group flex items-center justify-between p-1.5 rounded-lg hover:bg-slate-50 transition-all border border-transparent hover:border-slate-200"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-7 h-7 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                          <Flame className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0 text-left">
                          <p className="text-[11px] font-bold text-slate-900 group-hover:text-red-600 transition-colors truncate">
                            Kebakaran Pemukiman / Lahan
                          </p>
                          <p className="text-[9px] text-slate-500 truncate">
                            Damkar 113 &middot; Pemadaman darurat
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-red-600 group-hover:translate-x-0.5 transition-all shrink-0 ml-1.5" />
                    </Link>

                    {/* Item 2: Banjir */}
                    <Link
                      href="/lapor?tipe=banjir"
                      className="group flex items-center justify-between p-1.5 rounded-lg hover:bg-slate-50 transition-all border border-transparent hover:border-slate-200"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                          <Waves className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0 text-left">
                          <p className="text-[11px] font-bold text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                            Banjir &amp; Luapan Air Sungai
                          </p>
                          <p className="text-[9px] text-slate-500 truncate">
                            Lapor tinggi genangan &amp; evakuasi
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all shrink-0 ml-1.5" />
                    </Link>

                    {/* Item 3: Gempa Bumi */}
                    <Link
                      href="/lapor?tipe=gempa"
                      className="group flex items-center justify-between p-1.5 rounded-lg hover:bg-slate-50 transition-all border border-transparent hover:border-slate-200"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-7 h-7 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                          <Activity className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0 text-left">
                          <p className="text-[11px] font-bold text-slate-900 group-hover:text-amber-600 transition-colors truncate">
                            Gempa Bumi &amp; Kerusakan
                          </p>
                          <p className="text-[9px] text-slate-500 truncate">
                            Dampak retakan &amp; posko aman
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-amber-600 group-hover:translate-x-0.5 transition-all shrink-0 ml-1.5" />
                    </Link>

                    {/* Item 4: Tanah Longsor & Cuaca */}
                    <Link
                      href="/lapor?tipe=longsor"
                      className="group flex items-center justify-between p-1.5 rounded-lg hover:bg-slate-50 transition-all border border-transparent hover:border-slate-200"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                          <Mountain className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0 text-left">
                          <p className="text-[11px] font-bold text-slate-900 group-hover:text-emerald-600 transition-colors truncate">
                            Tanah Longsor &amp; Tebing Runtuh
                          </p>
                          <p className="text-[9px] text-slate-500 truncate">
                            Akses jalan putus &amp; longsoran
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all shrink-0 ml-1.5" />
                    </Link>
                  </div>
                </div>
              </div>

              {/* Bottom Section: Overlapping Avatars + Report Count + Description */}
              <div className="pt-2 border-t border-slate-800/80">
                <div className="flex items-center gap-2.5">
                  {/* Overlapping Citizen Avatars */}
                  <div className="flex -space-x-2 overflow-hidden shrink-0">
                    <div className="relative inline-block h-7 w-7 rounded-full ring-2 ring-[#111622] overflow-hidden bg-slate-800 shadow-xs">
                      <Image
                        src="/avatars/avatar-1.svg"
                        alt="Foto Profil Warga Pelapor 1"
                        width={28}
                        height={28}
                        className="object-cover h-full w-full"
                      />
                    </div>
                    <div className="relative inline-block h-7 w-7 rounded-full ring-2 ring-[#111622] overflow-hidden bg-slate-800 shadow-xs">
                      <Image
                        src="/avatars/avatar-2.svg"
                        alt="Foto Profil Warga Pelapor 2"
                        width={28}
                        height={28}
                        className="object-cover h-full w-full"
                      />
                    </div>
                    <div className="relative inline-block h-7 w-7 rounded-full ring-2 ring-[#111622] overflow-hidden bg-slate-800 shadow-xs">
                      <Image
                        src="/avatars/avatar-3.svg"
                        alt="Foto Profil Warga Pelapor 3"
                        width={28}
                        height={28}
                        className="object-cover h-full w-full"
                      />
                    </div>
                    <div className="relative inline-block h-7 w-7 rounded-full ring-2 ring-[#111622] overflow-hidden bg-slate-800 shadow-xs">
                      <Image
                        src="/avatars/avatar-4.svg"
                        alt="Foto Profil Warga Pelapor 4"
                        width={28}
                        height={28}
                        className="object-cover h-full w-full"
                      />
                    </div>
                  </div>

                  {/* Report Count */}
                  <div className="min-w-0">
                    <div className="text-xs sm:text-sm font-black text-white tracking-tight flex items-center gap-1.5">
                      <span>1.420+ Warga Melaporkan</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    </div>
                    <p className="text-[10px] text-slate-400 truncate">
                      {totalCount} laporan darurat aktif terverifikasi posko
                    </p>
                  </div>
                </div>

                <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
                  Laporan Anda diteruskan langsung ke sistem posko BPBD dan tim evakuasi terdekat.
                </p>
              </div>
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
                  <div className="mb-3.5">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105 ${cat.iconColor}`}>
                      <IconComponent className="w-6 h-6" />
                    </div>
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
            { id: "semua", label: "Semua Kategori", icon: null },
            { id: "banjir", label: "Banjir", icon: Waves },
            { id: "gempa", label: "Gempa", icon: Activity },
            { id: "kebakaran", label: "Kebakaran", icon: Flame },
            { id: "longsor", label: "Tanah Longsor", icon: Mountain },
            { id: "karhutla", label: "Karhutla", icon: Trees },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedDisasterFilter(tab.id)}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full font-semibold transition-all shrink-0 ${
                  selectedDisasterFilter === tab.id
                    ? "bg-ink text-white shadow-xs"
                    : "bg-surface hover:bg-bg text-ink-soft border border-line"
                }`}
              >
                {Icon && <Icon className="w-3.5 h-3.5 shrink-0" />}
                <span>{tab.label}</span>
              </button>
            );
          })}
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

      {/* 5. Citizen Preparedness Bento Grid: Interactive TSB & Steps */}
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
          {/* Bento 1: Checklist Tas Siaga Bencana (TSB) Standar BPBD (7 cols) */}
          <div className="lg:col-span-7 bg-surface border border-line rounded-2xl p-6 shadow-card space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-primary uppercase tracking-wider">
                  Checklist Kesiapsiagaan
                </span>
                <h3 className="text-lg font-bold text-ink mt-0.5">
                  Tas Siaga Bencana (TSB) Keluarga
                </h3>
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80 text-xs font-bold">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Standar BPBD 72 Jam</span>
              </div>
            </div>

            <p className="text-xs text-ink-soft leading-relaxed">
              Pastikan tas siaga berisi kebutuhan pokok bertahan hidup minimal untuk 72 jam pertama pasca bencana:
            </p>

            {/* Checklist Items (Daftar Statis Biasa) */}
            <div className="space-y-2.5 pt-1">
              {tsbItems.map((item) => (
                <div
                  key={item.id}
                  className="w-full p-3 rounded-xl border border-line/80 bg-slate-50/70 flex items-start gap-3"
                >
                  <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-ink">{item.label}</p>
                    <p className="text-[11px] text-ink-muted mt-0.5 leading-snug">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2 flex items-center justify-between text-xs text-ink-soft">
              <span>Wajib disiapkan di dekat pintu keluar rumah</span>
              <Link href="/edukasi#tsb" className="font-bold text-primary hover:underline">
                Panduan Isi Tas Lengkap &rarr;
              </Link>
            </div>
          </div>

          {/* Bento 2: Objek 3D Interaktif Tas Siaga Bencana (TSB) Murni Tanpa Border/Box */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center">
            <Interactive3DBag />
          </div>
        </div>
      </section>
    </main>
  );
}

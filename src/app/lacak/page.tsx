"use client";

import React, { useState, useEffect, Suspense, useCallback } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Search,
  MapPin,
  Clock,
  AlertCircle,
  Copy,
  Check,
  Waves,
  Mountain,
  Flame,
  AlertTriangle,
  ExternalLink,
  ThumbsUp,
  Radio,
} from "lucide-react";
import { TimelineStatus, type TimelineStep } from "@/components/laporan/TimelineStatus";
import type { DisasterType, ReportStatus } from "@/types";
import { fetchReportDetail, vouchReportLive } from "@/lib/services/reports";

interface ReportDetail {
  id?: string;
  tracking_code: string;
  disaster_type: DisasterType;
  title: string;
  description: string;
  location: string;
  created_at: string;
  status: ReportStatus;
  confirmation_count: number;
  timeline: TimelineStep[];
  is_demo?: boolean;
}

const SAMPLE_REPORTS: Record<string, ReportDetail> = {
  "LPR-8F3K2Q": {
    tracking_code: "LPR-8F3K2Q",
    disaster_type: "banjir",
    title: "Banjir Luapan Kali Semanan Tinggi 50-70 cm",
    description:
      "Akses jalan utama warga terputus akibat luapan kali. Air terus naik sejak pukul 14.00 WIB. Terdapat sekitar 40 KK membutuhkan bantuan evakuasi lansia.",
    location: "Kelurahan Semanan, Kalideres, Jakarta Barat",
    created_at: "27 Okt 2026, 14:15 WIB",
    status: "ditindaklanjuti",
    confirmation_count: 24,
    is_demo: true,
    timeline: [
      {
        status: "diterima",
        label: "Laporan Diterima Sistem",
        timestamp: "27 Okt 2026, 14:15 WIB",
        note: "Laporan otomatis diverifikasi formatnya dan diteruskan ke antrean prioritas posko terpadu.",
      },
      {
        status: "diverifikasi",
        label: "Diverifikasi Relawan Posko",
        timestamp: "27 Okt 2026, 14:26 WIB",
        actor: "Relawan FPRB Kalideres",
        note: "Kondisi di lapangan terkonfirmasi benar. Ketinggian air rata-rata 60 cm, arus cukup deras.",
      },
      {
        status: "ditindaklanjuti",
        label: "Penanganan Operasional Berjalan",
        timestamp: "27 Okt 2026, 14:48 WIB",
        actor: "Regu Damkar & TRC BPBD Sektor Barat",
        note: "2 unit perahu karet evakuasi dan 1 pompa mobile telah tiba di lokasi. Warga lansia sedang dievakuasi ke musholla darurat.",
      },
    ],
  },
  "LPR-4K9W1Z": {
    tracking_code: "LPR-4K9W1Z",
    disaster_type: "longsor",
    title: "Tanah Longsor Menutup Sebagian Badan Jalan Desa",
    description:
      "Tebing penahan longsor setinggi 4 meter ambrol setelah hujan deras 3 jam berturut-turut. Tidak ada korban jiwa, namun kendaraan roda 4 belum bisa lewat.",
    location: "Desa Tugu Selatan, Cisarua, Kab. Bogor",
    created_at: "27 Okt 2026, 15:30 WIB",
    status: "diverifikasi",
    confirmation_count: 12,
    is_demo: true,
    timeline: [
      {
        status: "diterima",
        label: "Laporan Diterima Sistem",
        timestamp: "27 Okt 2026, 15:30 WIB",
        note: "Laporan masuk dengan koordinat GPS akurat dan 2 foto bukti lapangan.",
      },
      {
        status: "diverifikasi",
        label: "Diverifikasi BPBD Wilayah II",
        timestamp: "27 Okt 2026, 15:42 WIB",
        actor: "Petugas Piket Pusdalops",
        note: "Diverifikasi valid. Koordinasi dengan Dinas PUPR untuk pengiriman alat berat mini loader.",
      },
    ],
  },
  "LPR-2X7M9P": {
    tracking_code: "LPR-2X7M9P",
    disaster_type: "kebakaran",
    title: "Kebakaran Rumah Tinggal Padat Penduduk",
    description:
      "Dugaan korsleting listrik di lantai 2. Warga sempat mencoba memadamkan dengan APAR lokal sebelum petugas pemadam datang.",
    location: "Kecamatan Tambora, Jakarta Barat",
    created_at: "27 Okt 2026, 11:20 WIB",
    status: "selesai",
    confirmation_count: 31,
    is_demo: true,
    timeline: [
      {
        status: "diterima",
        label: "Laporan Diterima",
        timestamp: "27 Okt 2026, 11:20 WIB",
      },
      {
        status: "diverifikasi",
        label: "Diverifikasi Cepat",
        timestamp: "27 Okt 2026, 11:22 WIB",
        actor: "Command Center 112",
      },
      {
        status: "ditindaklanjuti",
        label: "Pemadaman Sektor Tambora",
        timestamp: "27 Okt 2026, 11:28 WIB",
        note: "8 unit damkar dikerahkan ke lokasi.",
      },
      {
        status: "selesai",
        label: "Api Berhasil Dipadamkan & Pendinginan Selesai",
        timestamp: "27 Okt 2026, 12:45 WIB",
        actor: "Kepala Pleton Damkar",
        note: "Api berhasil dilokalisir tanpa merambat ke rumah sekitar. Tidak ada korban jiwa.",
      },
    ],
  },
};

function LacakContent() {
  const searchParams = useSearchParams();
  const urlKode = searchParams.get("kode") || "";

  const [searchInput, setSearchInput] = useState(urlKode || "LPR-8F3K2Q");
  const [activeReport, setActiveReport] = useState<ReportDetail | null>(
    urlKode ? null : SAMPLE_REPORTS["LPR-8F3K2Q"]
  );
  const [hasSearched, setHasSearched] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isVouched, setIsVouched] = useState(false);

  const performSearch = useCallback(async (codeToSearch: string) => {
    const cleanCode = codeToSearch.trim().toUpperCase();
    if (!cleanCode) return;

    setIsLoading(true);
    setHasSearched(true);
    if (typeof window !== "undefined") {
      setIsVouched(Boolean(localStorage.getItem(`sigapbumi_vouched_${cleanCode}`)));
    }

    try {
      // 1. Coba ambil dari Supabase atau local cache via service
      const liveData = await fetchReportDetail(cleanCode);
      if (liveData) {
        setActiveReport({
          id: liveData.id,
          tracking_code: liveData.tracking_code,
          disaster_type: liveData.disaster_type,
          title: liveData.title,
          description: liveData.description,
          location: liveData.address,
          created_at: liveData.created_at,
          status: liveData.status,
          confirmation_count: liveData.confirmation_count,
          timeline: liveData.timeline || [],
          is_demo: liveData.is_demo,
        });
        return;
      }

      // 2. Fallback ke preset demo statis
      if (SAMPLE_REPORTS[cleanCode]) {
        setActiveReport(SAMPLE_REPORTS[cleanCode]);
      } else {
        setActiveReport(null);
      }
    } catch (err) {
      console.warn("Gagal mencari detail laporan:", err);
      if (SAMPLE_REPORTS[cleanCode]) {
        setActiveReport(SAMPLE_REPORTS[cleanCode]);
      } else {
        setActiveReport(null);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!urlKode) return;
    const timer = setTimeout(() => {
      setSearchInput(urlKode);
      performSearch(urlKode);
    }, 100);
    return () => clearTimeout(timer);
  }, [urlKode, performSearch]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch(searchInput);
  };

  const selectPreset = (code: string) => {
    setSearchInput(code);
    performSearch(code);
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleVouch = async () => {
    if (isVouched || !activeReport) return;
    setIsVouched(true);
    if (typeof window !== "undefined") {
      localStorage.setItem(`sigapbumi_vouched_${activeReport.tracking_code}`, "true");
    }

    const currentCount = activeReport.confirmation_count || 0;
    setActiveReport((prev) =>
      prev ? { ...prev, confirmation_count: currentCount + 1 } : null
    );

    await vouchReportLive(
      activeReport.id || "",
      activeReport.tracking_code,
      currentCount
    );
  };

  const getDisasterIcon = (type: DisasterType) => {
    switch (type) {
      case "banjir":
        return <Waves className="w-5 h-5 text-info" />;
      case "longsor":
        return <Mountain className="w-5 h-5 text-ink" />;
      case "kebakaran":
        return <Flame className="w-5 h-5 text-danger" />;
      default:
        return <AlertTriangle className="w-5 h-5 text-warning" />;
    }
  };

  const getStatusBadge = (status: ReportStatus) => {
    switch (status) {
      case "diterima":
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-info-soft text-info-text border border-info/30">
            Diterima
          </span>
        );
      case "diverifikasi":
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-info-soft text-info-text border border-info">
            Diverifikasi
          </span>
        );
      case "ditindaklanjuti":
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-warning-soft text-warning-text border border-warning">
            Sedang Ditindaklanjuti
          </span>
        );
      case "selesai":
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-success-soft text-success-text border border-success">
            Selesai Ditangani
          </span>
        );
      case "ditolak":
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-danger-soft text-danger-text border border-danger">
            Laporan Ditolak
          </span>
        );
    }
  };

  return (
    <main className="flex-1 w-full max-w-[900px] mx-auto px-4 md:px-8 py-6 md:py-10 pb-28 md:pb-12 space-y-8">
      {/* Search Header */}
      <section className="text-center max-w-xl mx-auto">
        <h1 className="text-2xl md:text-3xl font-bold text-ink mb-2">
          Lacak Perkembangan Laporan
        </h1>
        <p className="text-sm text-ink-soft mb-6">
          Masukkan kode tracking unik yang Anda peroleh saat mengirim laporan untuk melihat tahapan tindak lanjut petugas di lapangan secara transparan.
        </p>

        {/* Search Input Form */}
        <form onSubmit={handleSearch} className="flex gap-2 items-center">
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-ink-muted absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Contoh: LPR-8F3K2Q"
              className="w-full h-12 pl-12 pr-4 rounded-md border border-line bg-surface text-ink text-base font-mono uppercase placeholder:normal-case placeholder:font-sans focus-visible:outline-primary focus-visible:border-primary shadow-sm"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="h-12 px-6 rounded-md bg-primary hover:bg-primary-hover disabled:opacity-50 text-white font-semibold text-base transition-colors shadow-sm focus-visible:outline-primary shrink-0 min-h-[44px]"
          >
            {isLoading ? "Mencari..." : "Lacak"}
          </button>
        </form>

        {/* Demo Preset Codes */}
        <div className="mt-3 flex flex-wrap items-center justify-center gap-1.5 text-xs">
          <span className="text-ink-muted">Contoh kode demo:</span>
          <button
            type="button"
            onClick={() => selectPreset("LPR-8F3K2Q")}
            className="px-2.5 py-1 rounded border border-line bg-surface hover:border-primary font-mono text-ink text-[11px] min-h-[32px]"
          >
            LPR-8F3K2Q (Banjir)
          </button>
          <button
            type="button"
            onClick={() => selectPreset("LPR-4K9W1Z")}
            className="px-2.5 py-1 rounded border border-line bg-surface hover:border-primary font-mono text-ink text-[11px] min-h-[32px]"
          >
            LPR-4K9W1Z (Longsor)
          </button>
          <button
            type="button"
            onClick={() => selectPreset("LPR-2X7M9P")}
            className="px-2.5 py-1 rounded border border-line bg-surface hover:border-primary font-mono text-ink text-[11px] min-h-[32px]"
          >
            LPR-2X7M9P (Kebakaran)
          </button>
          <button
            type="button"
            onClick={() => selectPreset("LPR-8C3P5V")}
            className="px-2.5 py-1 rounded border border-line bg-surface hover:border-primary font-mono text-ink text-[11px] min-h-[32px]"
          >
            LPR-8C3P5V (Gempa)
          </button>
          <button
            type="button"
            onClick={() => selectPreset("LPR-2D7N4X")}
            className="px-2.5 py-1 rounded border border-line bg-surface hover:border-primary font-mono text-ink text-[11px] min-h-[32px]"
          >
            LPR-2D7N4X (Citarum)
          </button>
        </div>
      </section>

      {/* Result Section */}
      {isLoading ? (
        <section className="bg-surface border border-line rounded-lg p-10 text-center shadow-card animate-pulse space-y-3">
          <Radio className="w-8 h-8 text-primary mx-auto animate-spin" />
          <p className="text-sm font-semibold text-ink">Menghubungkan ke Sistem Pelacakan...</p>
          <p className="text-xs text-ink-muted">Mengambil data status dan catatan tindak lanjut terkini</p>
        </section>
      ) : hasSearched && activeReport ? (
        <section className="bg-surface border border-line rounded-lg p-6 md:p-8 shadow-card space-y-6">
          {/* Top Info Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-line">
            <div>
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <span className="text-xs font-semibold text-ink-muted uppercase tracking-wider">
                  Kode Tracking
                </span>
                <span className="text-lg font-bold font-mono text-primary">
                  {activeReport.tracking_code}
                </span>
                <button
                  type="button"
                  onClick={() => copyCode(activeReport.tracking_code)}
                  aria-label="Salin Kode"
                  className="p-1 rounded hover:bg-bg text-ink-muted hover:text-ink transition-colors"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-success" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
                {activeReport.is_demo ? (
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-primary-soft text-primary-hover border border-primary/20">
                    Data Demonstrasi
                  </span>
                ) : (
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-success-soft text-success-text border border-success/30">
                    Laporan Warga
                  </span>
                )}
              </div>

              <h2 className="text-xl md:text-2xl font-bold text-ink">
                {activeReport.title}
              </h2>
            </div>

            <div className="flex sm:flex-col items-start sm:items-end gap-2">
              {getStatusBadge(activeReport.status)}
              <span className="text-xs text-ink-muted flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {activeReport.created_at}
              </span>
            </div>
          </div>

          {/* Location & Details Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-bg p-4 rounded-md border border-line text-sm">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-ink-muted">
                Lokasi Kejadian
              </span>
              <p className="font-medium text-ink flex items-start gap-1.5">
                <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <span>{activeReport.location}</span>
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-xs font-semibold text-ink-muted">
                Kategori & Konfirmasi Warga
              </span>
              <div className="flex items-center gap-3">
                <span className="capitalize font-medium text-ink flex items-center gap-1">
                  {getDisasterIcon(activeReport.disaster_type)}
                  {activeReport.disaster_type}
                </span>
                <button
                  type="button"
                  onClick={handleVouch}
                  disabled={isVouched}
                  title="Konfirmasi bahwa kejadian ini benar terjadi"
                  className={`text-xs px-2.5 py-1 rounded border transition-colors flex items-center gap-1 font-semibold min-h-[36px] ${
                    isVouched
                      ? "bg-success-soft text-success-text border-success/30"
                      : "bg-surface border-line text-ink hover:border-primary"
                  }`}
                >
                  <ThumbsUp className="w-3.5 h-3.5 text-primary" />
                  <span>{activeReport.confirmation_count} Terkonfirmasi</span>
                  {isVouched && <span className="text-[10px] text-success font-normal">(Dikonfirmasi Anda)</span>}
                </button>
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <h3 className="text-sm font-bold text-ink mb-1.5">
              Deskripsi dari Pelapor
            </h3>
            <p className="text-sm text-ink-soft leading-relaxed bg-surface p-4 rounded-md border border-line">
              {activeReport.description}
            </p>
          </div>

          {/* Vertical Status Timeline */}
          <div>
            <h3 className="text-base font-bold text-ink mb-2">
              Timeline Tindak Lanjut Terbuka
            </h3>
            <TimelineStatus
              currentStatus={activeReport.status}
              logs={activeReport.timeline}
            />
          </div>

          {/* Action Footer */}
          <div className="pt-4 border-t border-line flex flex-wrap items-center justify-between gap-3">
            <Link
              href="/peta"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary-hover"
            >
              <span>Lihat Titik di Peta Bencana Publik</span>
              <ExternalLink className="w-4 h-4" />
            </Link>

            <Link
              href="/lapor"
              className="inline-flex items-center justify-center h-10 px-4 rounded-md bg-surface border border-line text-xs font-semibold text-ink hover:bg-bg transition-colors min-h-[44px]"
            >
              Kirim Laporan Baru
            </Link>
          </div>
        </section>
      ) : hasSearched ? (
        // Empty Search Result State
        <section className="bg-surface border border-line rounded-lg p-10 text-center shadow-card max-w-lg mx-auto">
          <div className="w-16 h-16 rounded-full bg-danger-soft text-danger flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-lg font-bold text-ink mb-1">
            Kode Tracking Tidak Ditemukan
          </h2>
          <p className="text-sm text-ink-soft mb-6 leading-relaxed">
            Tidak ada laporan bencana dengan kode <strong>&quot;{searchInput}&quot;</strong> di sistem. Pastikan format kode sudah benar (contoh: <code>LPR-8F3K2Q</code>) atau pilih salah satu kode contoh di atas.
          </p>
          <button
            type="button"
            onClick={() => selectPreset("LPR-8F3K2Q")}
            className="h-11 px-5 rounded-md bg-ink text-white font-semibold text-sm hover:bg-ink-soft transition-colors min-h-[44px]"
          >
            Tampilkan Contoh Laporan
          </button>
        </section>
      ) : null}
    </main>
  );
}

export default function LacakPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 w-full max-w-[900px] mx-auto px-4 py-16 text-center animate-pulse">
          <div className="w-12 h-12 rounded-full bg-primary/20 mx-auto mb-3" />
          <p className="text-sm font-semibold text-ink">Memuat Sistem Pelacakan...</p>
        </div>
      }
    >
      <LacakContent />
    </Suspense>
  );
}

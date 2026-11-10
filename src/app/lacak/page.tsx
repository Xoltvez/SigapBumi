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
  Camera,
  Maximize2,
  X,
  LifeBuoy,
  HeartPulse,
  Shield,
  Phone,
} from "lucide-react";
import { TimelineStatus, type TimelineStep } from "@/components/laporan/TimelineStatus";
import type { DisasterType, ReportStatus, SosAssistanceType } from "@/types";
import { fetchReportDetail, vouchReportLive } from "@/lib/services/reports";

interface ReportDetail {
  id?: string;
  tracking_code: string;
  disaster_type: DisasterType;
  target_agency?: SosAssistanceType;
  title: string;
  description: string;
  location: string;
  created_at: string;
  status: ReportStatus;
  confirmation_count: number;
  timeline: TimelineStep[];
  is_demo?: boolean;
  lat?: number;
  lng?: number;
  image_url?: string;
  phone_number?: string;
}

const SAMPLE_REPORTS: Record<string, ReportDetail> = {
  "SB-2026-8F3K": {
    id: "rep-1",
    tracking_code: "SB-2026-8F3K",
    disaster_type: "banjir",
    title: "Banjir Luapan Kali Semanan Tinggi 50-70 cm",
    description:
      "Akses jalan utama warga terputus akibat luapan kali. Air terus naik sejak pukul 14.00 WIB. Terdapat sekitar 40 KK membutuhkan bantuan evakuasi lansia.",
    location: "Kelurahan Semanan, Kalideres, Jakarta Barat",
    created_at: "27 Okt 2026, 14:15 WIB",
    status: "ditindaklanjuti",
    confirmation_count: 24,
    is_demo: true,
    lat: -6.155,
    lng: 106.723,
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
  "SB-2026-4K9W": {
    id: "rep-11",
    tracking_code: "SB-2026-4K9W",
    disaster_type: "longsor",
    title: "Tanah Longsor Menutup Sebagian Badan Jalan Desa",
    description:
      "Tebing penahan longsor setinggi 4 meter ambrol setelah hujan deras 3 jam berturut-turut. Tidak ada korban jiwa, namun kendaraan roda 4 belum bisa lewat.",
    location: "Desa Tugu Selatan, Cisarua, Kab. Bogor",
    created_at: "27 Okt 2026, 15:30 WIB",
    status: "diverifikasi",
    confirmation_count: 12,
    is_demo: true,
    lat: -6.698,
    lng: 106.942,
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
  "SB-2026-2X7M": {
    id: "rep-3",
    tracking_code: "SB-2026-2X7M",
    disaster_type: "kebakaran",
    title: "Kebakaran Rumah Tinggal Padat Penduduk",
    description:
      "Dugaan korsleting listrik di lantai 2. Warga sempat mencoba memadamkan dengan APAR lokal sebelum petugas pemadam datang.",
    location: "Kecamatan Tambora, Jakarta Barat",
    created_at: "27 Okt 2026, 11:20 WIB",
    status: "selesai",
    confirmation_count: 31,
    is_demo: true,
    lat: -6.149,
    lng: 106.804,
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

// Aliases kompatibilitas mundur untuk format lama
SAMPLE_REPORTS["LPR-8F3K2Q"] = SAMPLE_REPORTS["SB-2026-8F3K"];
SAMPLE_REPORTS["LPR-4K9W1Z"] = SAMPLE_REPORTS["SB-2026-4K9W"];
SAMPLE_REPORTS["LPR-2X7M9P"] = SAMPLE_REPORTS["SB-2026-2X7M"];

function LacakContent() {
  const searchParams = useSearchParams();
  const urlKode = searchParams.get("kode") || "";

  const [searchInput, setSearchInput] = useState(urlKode || "SB-2026-8F3K");
  const [activeReport, setActiveReport] = useState<ReportDetail | null>(
    urlKode ? null : SAMPLE_REPORTS["SB-2026-8F3K"]
  );
  const [hasSearched, setHasSearched] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isVouched, setIsVouched] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSelectedImage(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

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
        const photoMatch = liveData.description ? liveData.description.match(/\[Foto:\s*([^\]]+)\]/) : null;
        const imageUrl = liveData.image_url || (photoMatch ? photoMatch[1].trim() : undefined);
        const cleanDesc = (liveData.description || "").replace(/\[Foto:\s*[^\]]+\]/g, "").trim();

        setActiveReport({
          id: liveData.id,
          tracking_code: liveData.tracking_code,
          disaster_type: liveData.disaster_type,
          target_agency: liveData.target_agency,
          title: liveData.title,
          description: cleanDesc,
          location: liveData.address,
          created_at: liveData.created_at,
          status: liveData.status,
          confirmation_count: liveData.confirmation_count,
          timeline: liveData.timeline || [],
          is_demo: liveData.is_demo,
          lat: liveData.lat,
          lng: liveData.lng,
          image_url: imageUrl,
          phone_number: liveData.phone_number,
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

  const getSosAssistanceInfo = (agency?: SosAssistanceType, title?: string) => {
    const t = (title || "").toUpperCase();
    let type: SosAssistanceType = agency || "bnpb_bpbd";
    if (t.includes("BNPB") || t.includes("BPBD")) type = "bnpb_bpbd";
    else if (t.includes("DAMKAR") || t.includes("KEBAKARAN")) type = "damkar";
    else if (t.includes("MEDIS") || t.includes("AMBULANS")) type = "medis";
    else if (t.includes("POLISI") || t.includes("KEAMANAN")) type = "polisi";

    switch (type) {
      case "damkar":
        return {
          label: "Pemadam Kebakaran (Damkar)",
          icon: <Flame className="w-4 h-4 text-orange-500" />,
          badgeClass: "bg-orange-500/10 text-orange-700 border-orange-300 dark:border-orange-800 dark:text-orange-300",
        };
      case "medis":
        return {
          label: "Tenaga Medis & Ambulans",
          icon: <HeartPulse className="w-4 h-4 text-red-500" />,
          badgeClass: "bg-red-500/10 text-red-700 border-red-300 dark:border-red-800 dark:text-red-300",
        };
      case "polisi":
        return {
          label: "Keamanan & Kepolisian",
          icon: <Shield className="w-4 h-4 text-blue-500" />,
          badgeClass: "bg-blue-500/10 text-blue-700 border-blue-300 dark:border-blue-800 dark:text-blue-300",
        };
      case "bnpb_bpbd":
      default:
        return {
          label: "SAR / BNPB & BPBD",
          icon: <LifeBuoy className="w-4 h-4 text-cyan-600" />,
          badgeClass: "bg-cyan-500/10 text-cyan-700 border-cyan-300 dark:border-cyan-800 dark:text-cyan-300",
        };
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
    <main className="flex-1 w-full max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10 pb-28 md:pb-12 space-y-8">
      <div className="max-w-[900px] mx-auto space-y-8">
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
              placeholder="Contoh: SB-2026-8F3K atau LPR-8F3K2Q"
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
            onClick={() => selectPreset("SB-2026-8F3K")}
            className="px-2.5 py-1 rounded border border-line bg-surface hover:border-primary font-mono text-ink text-[11px] min-h-[32px]"
          >
            SB-2026-8F3K (Banjir)
          </button>
          <button
            type="button"
            onClick={() => selectPreset("SB-2026-4K9W")}
            className="px-2.5 py-1 rounded border border-line bg-surface hover:border-primary font-mono text-ink text-[11px] min-h-[32px]"
          >
            SB-2026-4K9W (Longsor)
          </button>
          <button
            type="button"
            onClick={() => selectPreset("SB-2026-2X7M")}
            className="px-2.5 py-1 rounded border border-line bg-surface hover:border-primary font-mono text-ink text-[11px] min-h-[32px]"
          >
            SB-2026-2X7M (Kebakaran)
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
          {(() => {
            const isSosReport = Boolean(
              activeReport.tracking_code?.toUpperCase().startsWith("SOS-") ||
              activeReport.title?.toUpperCase().includes("SOS")
            );

            return (
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

                {isSosReport ? (
                  <div className="space-y-1">
                    <span className="text-xs font-semibold text-ink-muted flex items-center gap-1.5">
                      <Radio className="w-3.5 h-3.5 text-danger animate-pulse" />
                      Jenis Bantuan
                    </span>
                    <div className="flex flex-wrap items-center gap-2 pt-0.5">
                      {(() => {
                        const sosInfo = getSosAssistanceInfo(activeReport.target_agency, activeReport.title);
                        return (
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold border ${sosInfo.badgeClass}`}>
                            {sosInfo.icon}
                            <span>{sosInfo.label}</span>
                          </span>
                        );
                      })()}
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-danger-soft text-danger border border-danger/30">
                        Sinyal Darurat Prioritas
                      </span>
                    </div>
                  </div>
                ) : (
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
                )}
              </div>
            );
          })()}

          {/* Foto Bukti Kejadian dari Kamera (Jika Ada) */}
          {activeReport.image_url && (
            <div className="bg-surface rounded-lg border border-line p-4 space-y-2.5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-ink flex items-center gap-1.5">
                  <Camera className="w-4 h-4 text-primary" />
                  Foto Bukti Kejadian (Kamera Warga)
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedImage(activeReport.image_url || null)}
                  className="text-xs text-primary hover:text-primary-hover font-semibold inline-flex items-center gap-1 transition-colors"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                  Perbesar Foto
                </button>
              </div>

              <div
                onClick={() => setSelectedImage(activeReport.image_url || null)}
                className="relative group rounded-md overflow-hidden border border-line cursor-zoom-in bg-black/5 max-h-80 flex items-center justify-center transition-all hover:border-primary/50"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={activeReport.image_url}
                  alt="Foto bukti lapangan kejadian"
                  className="w-full max-h-80 object-cover rounded transition-transform duration-300 group-hover:scale-[1.02]"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white font-medium text-xs">
                  <Maximize2 className="w-4 h-4" />
                  <span>Klik untuk melihat foto resolusi penuh</span>
                </div>
              </div>
            </div>
          )}

          {/* Description */}
          <div>
            <h3 className="text-sm font-bold text-ink mb-1.5">
              Deskripsi dari Pelapor
            </h3>
            <div className="text-sm text-ink-soft leading-relaxed bg-surface p-4 rounded-md border border-line space-y-2">
              <p>
                {activeReport.description
                  ? activeReport.description.replace(/\[Foto:\s*[^\]]+\]/g, "").trim()
                  : "Tidak ada rincian catatan tambahan dari pelapor."}
              </p>
              {activeReport.phone_number && (
                <div className="pt-2 border-t border-line/60 flex items-center gap-2 text-xs text-ink font-medium">
                  <Phone className="w-3.5 h-3.5 text-primary" />
                  <span>Nomor Kontak Pelapor: <strong>{activeReport.phone_number}</strong></span>
                </div>
              )}
            </div>
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
              href={
                activeReport.lat && activeReport.lng
                  ? `/peta?kode=${encodeURIComponent(activeReport.tracking_code)}&lat=${activeReport.lat}&lng=${activeReport.lng}`
                  : `/peta?kode=${encodeURIComponent(activeReport.tracking_code)}`
              }
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
            Tidak ada laporan bencana dengan kode <strong>&quot;{searchInput}&quot;</strong> di sistem. Pastikan format kode sudah benar (contoh: <code>SB-2026-8F3K</code> atau <code>LPR-8F3K2Q</code>) atau pilih salah satu kode contoh di atas.
          </p>
          <button
            type="button"
            onClick={() => selectPreset("SB-2026-8F3K")}
            className="h-11 px-5 rounded-md bg-ink text-white font-semibold text-sm hover:bg-ink-soft transition-colors min-h-[44px]"
          >
            Tampilkan Contoh Laporan
          </button>
        </section>
      ) : null}
      </div>

      {/* Lightbox Modal Fullscreen Image Preview */}
      {selectedImage && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setSelectedImage(null)}
        >
          <div
            className="relative max-w-4xl w-full max-h-[92vh] flex flex-col items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-full flex items-center justify-between mb-2 text-white px-1">
              <span className="text-xs sm:text-sm font-semibold flex items-center gap-2">
                <Camera className="w-4 h-4 text-primary" />
                Bukti Foto Kamera ({activeReport?.tracking_code || "Laporan"})
              </span>
              <button
                type="button"
                onClick={() => setSelectedImage(null)}
                className="p-1.5 rounded-full bg-white/10 hover:bg-white/25 text-white transition-colors"
                aria-label="Tutup gambar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={selectedImage}
              alt="Foto bukti lapangan ukuran penuh"
              className="max-h-[82vh] w-auto max-w-full object-contain rounded-lg border border-white/20 shadow-2xl"
            />
          </div>
        </div>
      )}
    </main>
  );
}

export default function LacakPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 w-full max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center animate-pulse">
          <div className="w-12 h-12 rounded-full bg-primary/20 mx-auto mb-3" />
          <p className="text-sm font-semibold text-ink">Memuat Sistem Pelacakan...</p>
        </div>
      }
    >
      <LacakContent />
    </Suspense>
  );
}

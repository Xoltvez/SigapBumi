"use client";

import React, { useState, useEffect, Suspense, useCallback } from "react";
import { createPortal } from "react-dom";
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
  Image as ImageIcon,
  LifeBuoy,
  HeartPulse,
  Shield,
  Phone,
  Share2,
  Navigation,
  ArrowLeft,
  ChevronRight,
  CheckCircle2,
} from "lucide-react";
import { TimelineStatus, type TimelineStep } from "@/components/laporan/TimelineStatus";
import type { DisasterType, ReportStatus, SosAssistanceType } from "@/types";
import {
  fetchReportDetail,
  fetchLiveReports,
  getCachedLiveReports,
  parseReportTimestamp,
  vouchReportLive,
  cleanReportDescription,
  extractPhotoFromDescription,
  type LiveReportItem,
} from "@/lib/services/reports";
import { supabase } from "@/lib/supabase/client";
import DisasterIcon, { getDisasterLabel } from "@/components/common/DisasterIcon";

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
  const urlKode = searchParams.get("kode") || searchParams.get("code") || "";

  const [searchInput, setSearchInput] = useState(urlKode || "");
  const [activeReport, setActiveReport] = useState<ReportDetail | null>(null);
  const [hasSearched, setHasSearched] = useState(Boolean(urlKode));
  const [isLoading, setIsLoading] = useState(false);
  const [allReports, setAllReports] = useState<LiveReportItem[]>(() => {
    const cached = getCachedLiveReports();
    if (!cached || cached.length === 0) return [];
    return cached
      .filter((r) => r.status !== "ditolak")
      .sort(
        (a, b) =>
          parseReportTimestamp(b.raw_created_at || b.created_at) -
          parseReportTimestamp(a.raw_created_at || a.created_at)
      );
  });
  const [listFilter, setListFilter] = useState<"belum_selesai" | "selesai" | "semua">("belum_selesai");
  const [isLoadingList, setIsLoadingList] = useState(() => {
    const cached = getCachedLiveReports();
    return !cached || cached.length === 0;
  });
  const [copied, setCopied] = useState(false);
  const [isVouched, setIsVouched] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const getShareUrl = (trackingCode: string) => {
    if (typeof window !== "undefined") {
      return `${window.location.origin}/lacak?kode=${encodeURIComponent(trackingCode)}`;
    }
    return `https://sigapbumi.id/lacak?kode=${encodeURIComponent(trackingCode)}`;
  };

  const handleCopyShareLink = (trackingCode: string) => {
    const url = getShareUrl(trackingCode);
    navigator.clipboard.writeText(url);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2200);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSelectedImage(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const performSearch = useCallback(async (codeToSearch: string, isSilent = false) => {
    const cleanCode = codeToSearch.trim().toUpperCase();
    if (!cleanCode) return;

    if (!isSilent) {
      setIsLoading(true);
    }
    setHasSearched(true);
    if (typeof window !== "undefined") {
      setIsVouched(Boolean(localStorage.getItem(`sigapbumi_vouched_${cleanCode}`)));
    }

    try {
      // 1. Coba ambil dari Supabase atau local cache via service (skipMedia saat silent refresh agar hemat egress)
      const liveData = await fetchReportDetail(cleanCode, { skipMedia: isSilent });
      if (liveData) {
        const imageUrl = liveData.image_url || extractPhotoFromDescription(liveData.description);
        const cleanDesc = cleanReportDescription(liveData.description);

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
      } else if (!isSilent) {
        setActiveReport(null);
      }
    } catch (err) {
      console.warn("Gagal mencari detail laporan:", err);
      if (SAMPLE_REPORTS[cleanCode]) {
        setActiveReport(SAMPLE_REPORTS[cleanCode]);
      } else if (!isSilent) {
        setActiveReport(null);
      }
    } finally {
      if (!isSilent) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadAllReports = async () => {
      try {
        const live = await fetchLiveReports(false, { lean: true });
        if (!isMounted) return;
        const validReports = (live || [])
          .filter((r) => r.status !== "ditolak")
          .sort(
            (a, b) =>
              parseReportTimestamp(b.raw_created_at || b.created_at) -
              parseReportTimestamp(a.raw_created_at || a.created_at)
          );
        setAllReports(validReports);
      } catch (err) {
        console.warn("Gagal memuat daftar laporan:", err);
      } finally {
        if (isMounted) setIsLoadingList(false);
      }
    };

    loadAllReports();

    let debounceTimer: ReturnType<typeof setTimeout> | null = null;
    const handleSyncList = () => {
      if (typeof document !== "undefined" && document.visibilityState === "hidden") return;
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        loadAllReports();
      }, 800);
    };

    window.addEventListener("sigapbumi:report-updated", handleSyncList);
    window.addEventListener("sigapbumi:sos-created", handleSyncList);
    window.addEventListener("sigapbumi:sos-updated", handleSyncList);
    window.addEventListener("storage", handleSyncList);

    const listChannel = supabase
      .channel("lacak_active_list_realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "reports" }, handleSyncList)
      .on("postgres_changes", { event: "*", schema: "public", table: "sos_alerts" }, handleSyncList)
      .subscribe();

    return () => {
      isMounted = false;
      if (debounceTimer) clearTimeout(debounceTimer);
      window.removeEventListener("sigapbumi:report-updated", handleSyncList);
      window.removeEventListener("sigapbumi:sos-created", handleSyncList);
      window.removeEventListener("sigapbumi:sos-updated", handleSyncList);
      window.removeEventListener("storage", handleSyncList);
      supabase.removeChannel(listChannel);
    };
  }, []);

  useEffect(() => {
    if (!urlKode) return;
    const timer = setTimeout(() => {
      setSearchInput(urlKode);
      performSearch(urlKode);
    }, 100);
    return () => clearTimeout(timer);
  }, [urlKode, performSearch]);

  // Sinkronisasi Realtime saat laporan di-update posko di dashboard
  useEffect(() => {
    if (!activeReport?.tracking_code) return;
    const currentCode = activeReport.tracking_code;

    let detailDebounce: ReturnType<typeof setTimeout> | null = null;
    const handleUpdate = () => {
      if (typeof document !== "undefined" && document.visibilityState === "hidden") return;
      if (detailDebounce) clearTimeout(detailDebounce);
      detailDebounce = setTimeout(() => {
        performSearch(currentCode, true);
      }, 600);
    };

    window.addEventListener("sigapbumi:report-updated", handleUpdate);
    window.addEventListener("sigapbumi:sos-updated", handleUpdate);
    window.addEventListener("storage", handleUpdate);

    const channel = supabase
      .channel(`lacak_realtime_${currentCode}_${Math.random().toString(36).substring(2, 7)}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "reports",
        },
        handleUpdate
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "report_status_logs",
        },
        handleUpdate
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "sos_alerts",
        },
        handleUpdate
      )
      .subscribe();

    // Polling cadangan berkala setiap 60 detik (hanya saat tab aktif) — sinkron utama mengandalkan Realtime
    const pollTimer = setInterval(() => {
      if (typeof document !== "undefined" && document.visibilityState !== "visible") return;
      performSearch(currentCode, true);
    }, 60000);

    return () => {
      clearInterval(pollTimer);
      if (detailDebounce) clearTimeout(detailDebounce);
      window.removeEventListener("sigapbumi:report-updated", handleUpdate);
      window.removeEventListener("sigapbumi:sos-updated", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
      supabase.removeChannel(channel);
    };
  }, [activeReport?.tracking_code, performSearch]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchInput.trim()) {
      setActiveReport(null);
      setHasSearched(false);
      return;
    }
    performSearch(searchInput);
  };

  const handleSelectFromList = (item: LiveReportItem) => {
    setSearchInput(item.tracking_code);
    performSearch(item.tracking_code);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleBackToList = () => {
    setActiveReport(null);
    setHasSearched(false);
    setSearchInput("");
  };

  const unfinishedCount = allReports.filter((r) => r.status !== "selesai").length;
  const finishedCount = allReports.filter((r) => r.status === "selesai").length;
  const displayedReports =
    listFilter === "belum_selesai"
      ? allReports.filter((r) => r.status !== "selesai")
      : listFilter === "selesai"
      ? allReports.filter((r) => r.status === "selesai")
      : allReports;

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
    return <DisasterIcon type={type} size={20} />;
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
          icon: <Flame className="w-4 h-4 text-orange-600" />,
          badgeClass: "bg-orange-50 text-orange-800 border-orange-200",
        };
      case "medis":
        return {
          label: "Tenaga Medis & Ambulans",
          icon: <HeartPulse className="w-4 h-4 text-red-600" />,
          badgeClass: "bg-red-50 text-red-800 border-red-200",
        };
      case "polisi":
        return {
          label: "Keamanan & Kepolisian",
          icon: <Shield className="w-4 h-4 text-blue-600" />,
          badgeClass: "bg-blue-50 text-blue-800 border-blue-200",
        };
      case "bnpb_bpbd":
      default:
        return {
          label: "SAR / BNPB & BPBD",
          icon: <LifeBuoy className="w-4 h-4 text-teal-600" />,
          badgeClass: "bg-teal-50 text-teal-800 border-teal-200",
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
            Dalam Proses / Menuju Lokasi
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
      </section>

      {/* Result Section / Active Reports List */}
      {isLoading ? (
        <section className="bg-surface border border-line rounded-lg p-10 text-center shadow-card animate-pulse space-y-3">
          <Radio className="w-8 h-8 text-primary mx-auto animate-spin" />
          <p className="text-sm font-semibold text-ink">Menghubungkan ke Sistem Pelacakan...</p>
          <p className="text-xs text-ink-muted">Mengambil data status dan catatan tindak lanjut terkini</p>
        </section>
      ) : hasSearched && activeReport ? (
        <div className="space-y-4">
          <button
            type="button"
            onClick={handleBackToList}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200/90 bg-white hover:bg-orange-50/80 hover:border-orange-300 text-xs font-bold text-slate-700 hover:text-orange-700 shadow-2xs transition-all cursor-pointer active:scale-[0.98]"
          >
            <ArrowLeft className="w-3.5 h-3.5 shrink-0" />
            <span>Kembali ke Daftar Laporan Bencana ({allReports.length})</span>
          </button>

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
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsShareModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-50 hover:bg-orange-100 text-[#EA580C] border border-orange-200/80 text-xs font-bold transition-all shadow-2xs hover:shadow-xs"
                  title="Bagikan Tautan Laporan ke Keluarga atau Grup WhatsApp"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Bagikan</span>
                </button>
                {getStatusBadge(activeReport.status)}
              </div>
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
            const coordMatch = activeReport.location?.match(/\((-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)\)/);
            const resolvedLat = activeReport.lat ?? (coordMatch ? parseFloat(coordMatch[1]) : undefined);
            const resolvedLng = activeReport.lng ?? (coordMatch ? parseFloat(coordMatch[2]) : undefined);
            const petaHref =
              resolvedLat !== undefined && resolvedLng !== undefined && !isNaN(resolvedLat) && !isNaN(resolvedLng)
                ? `/peta?kode=${encodeURIComponent(activeReport.tracking_code)}&lat=${resolvedLat}&lng=${resolvedLng}`
                : `/peta?kode=${encodeURIComponent(activeReport.tracking_code)}`;

            return (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-bg p-4 rounded-md border border-line text-sm">
                <div className="space-y-2">
                  <div className="space-y-1">
                    <span className="text-xs font-semibold text-ink-muted">
                      Lokasi Kejadian
                    </span>
                    <p className="font-medium text-ink flex items-start gap-1.5">
                      <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                      <span>{activeReport.location}</span>
                    </p>
                  </div>
                  <Link
                    href={petaHref}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-bold transition-all shadow-2xs hover:shadow-xs"
                    title="Buka titik kejadian ini langsung di Peta Bencana"
                  >
                    <Navigation className="w-3.5 h-3.5" />
                    <span>Lihat di Peta Bencana</span>
                  </Link>
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
                      <span className="capitalize font-medium text-ink flex items-center gap-2">
                        {getDisasterIcon(activeReport.disaster_type)}
                        <span>{getDisasterLabel(activeReport.disaster_type)}</span>
                      </span>
                      <button
                        type="button"
                        onClick={handleVouch}
                        disabled={isVouched}
                        title="Konfirmasi bahwa kejadian ini benar terjadi"
                        className={`text-xs px-2.5 py-1 rounded border transition-colors flex items-center gap-1.5 font-semibold min-h-[36px] ${
                          isVouched
                            ? "bg-success-soft text-success-text border-success/30"
                            : "bg-surface border-line text-ink hover:border-primary shadow-2xs"
                        }`}
                      >
                        <ThumbsUp className="w-3.5 h-3.5 text-orange-500" />
                        <span>{activeReport.confirmation_count} Terkonfirmasi</span>
                        {isVouched && <span className="text-[10px] text-success font-normal">(Dikonfirmasi Anda)</span>}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          {/* Foto Bukti Kejadian dari Kamera */}
          {activeReport.image_url ? (
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
          ) : (
            <div className="aspect-video w-full rounded-md bg-bg border border-line flex flex-col items-center justify-center text-ink-muted p-6 text-center">
              <ImageIcon className="w-12 h-12 text-ink-muted mb-2 opacity-50" />
              <p className="text-xs font-semibold text-ink">Belum Ada Foto Bukti Lapangan</p>
              <p className="text-[11px] text-ink-muted mt-0.5">
                Pelapor tidak melampirkan foto pada laporan ini.
              </p>
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
                  ? cleanReportDescription(activeReport.description)
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
          <div className="pt-4 border-t border-line flex items-center justify-end">
            <Link
              href="/lapor"
              className="inline-flex items-center justify-center h-10 px-4 rounded-md bg-surface border border-line text-xs font-semibold text-ink hover:bg-bg transition-colors min-h-[44px]"
            >
              Kirim Laporan Baru
            </Link>
          </div>
        </section>
        </div>
      ) : hasSearched ? (
        // Empty Search Result State
        <section className="bg-surface border border-line rounded-lg p-10 text-center shadow-card max-w-lg mx-auto">
          <div className="w-16 h-16 rounded-full bg-danger-soft text-danger flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-lg font-bold text-ink mb-1">
            Kode Tracking Tidak Ditemukan
          </h2>
          <p className="text-xs text-ink-soft mb-5 leading-relaxed">
            Pastikan kode tracking yang Anda masukkan sudah benar (contoh: <span className="font-mono font-semibold text-ink">LPR-...</span> atau <span className="font-mono font-semibold text-ink">SOS-...</span>).
          </p>
          <button
            type="button"
            onClick={handleBackToList}
            className="inline-flex items-center justify-center gap-1.5 h-10 px-4 rounded-md bg-primary hover:bg-primary-hover text-white text-xs font-bold transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Lihat Daftar Laporan Bencana</span>
          </button>
        </section>
      ) : (
        /* Daftar Laporan Bencana untuk Transparansi Publik dengan Filter Status */
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 pb-3 border-b border-line">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse shrink-0" />
                <h2 className="text-base md:text-lg font-bold text-ink">
                  Daftar Laporan Bencana
                </h2>
                <span className="text-[11px] font-bold bg-orange-100 text-orange-800 px-2.5 py-0.5 rounded-full">
                  {displayedReports.length} Kejadian
                </span>
              </div>
              <p className="text-xs text-ink-soft mt-0.5">
                Klik salah satu kejadian di bawah untuk melihat rincian kondisi, foto bukti, dan timeline penanganan petugas.
              </p>
            </div>

            {/* Filter Pills: Belum Selesai / Selesai / Semua */}
            <div className="flex items-center gap-1.5 flex-wrap shrink-0">
              <button
                type="button"
                onClick={() => setListFilter("belum_selesai")}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5 ${
                  listFilter === "belum_selesai"
                    ? "bg-primary text-white shadow-xs"
                    : "bg-surface border border-line text-ink-soft hover:border-primary/50 hover:text-ink"
                }`}
              >
                <span>Belum Selesai</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                    listFilter === "belum_selesai"
                      ? "bg-white/20 text-white"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {unfinishedCount}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setListFilter("selesai")}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5 ${
                  listFilter === "selesai"
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "bg-surface border border-line text-ink-soft hover:border-emerald-400 hover:text-ink"
                }`}
              >
                <span>Selesai</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                    listFilter === "selesai"
                      ? "bg-white/20 text-white"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {finishedCount}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setListFilter("semua")}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5 ${
                  listFilter === "semua"
                    ? "bg-slate-900 text-white shadow-xs"
                    : "bg-surface border border-line text-ink-soft hover:border-slate-400 hover:text-ink"
                }`}
              >
                <span>Semua</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                    listFilter === "semua"
                      ? "bg-white/20 text-white"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {allReports.length}
                </span>
              </button>
            </div>
          </div>

          {isLoadingList ? (
            <div className="space-y-3">
              {[1, 2, 3].map((n) => (
                <div
                  key={n}
                  className="bg-surface border border-line rounded-xl p-4 sm:p-5 shadow-2xs animate-pulse space-y-2.5"
                >
                  <div className="flex items-center gap-2">
                    <div className="h-5 w-24 bg-slate-200 rounded" />
                    <div className="h-5 w-28 bg-slate-100 rounded-full" />
                  </div>
                  <div className="h-5 w-2/3 bg-slate-200 rounded" />
                  <div className="h-4 w-1/2 bg-slate-100 rounded" />
                </div>
              ))}
            </div>
          ) : displayedReports.length === 0 ? (
            <div className="bg-surface border border-line rounded-xl p-10 text-center shadow-card space-y-2">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
              <h3 className="text-sm font-bold text-ink">
                {listFilter === "belum_selesai"
                  ? "Tidak Ada Laporan Bencana Aktif Saat Ini"
                  : listFilter === "selesai"
                  ? "Belum Ada Laporan yang Selesai Ditangani"
                  : "Belum Ada Data Laporan Bencana"}
              </h3>
              <p className="text-xs text-ink-soft max-w-md mx-auto">
                {listFilter === "belum_selesai"
                  ? "Seluruh laporan bencana telah selesai ditangani. Anda dapat melihat riwayatnya pada filter Selesai atau Semua."
                  : "Data laporan bencana warga akan muncul secara otomatis di sini secara real-time."}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {displayedReports.map((item) => {
                const isSos = Boolean(
                  item.tracking_code?.toUpperCase().startsWith("SOS-") ||
                    item.title?.toUpperCase().includes("SOS")
                );

                return (
                  <button
                    key={item.id || item.tracking_code}
                    type="button"
                    onClick={() => handleSelectFromList(item)}
                    className="w-full text-left bg-surface border border-line hover:border-primary/60 rounded-xl p-4 sm:p-5 shadow-2xs hover:shadow-card transition-all group cursor-pointer flex items-center justify-between gap-4"
                  >
                    <div className="min-w-0 flex-1 space-y-2">
                      {/* Baris Badge: SOS, Kode Tracking, Status */}
                      <div className="flex flex-wrap items-center gap-1.5">
                        {isSos && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-100 text-rose-700 border border-rose-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-ping" />
                            <span>SOS Darurat</span>
                          </span>
                        )}
                        <span className="px-2 py-0.5 rounded bg-orange-50 text-primary border border-orange-200/70 font-mono text-[11px] font-bold">
                          {item.tracking_code}
                        </span>
                        {getStatusBadge(item.status)}
                      </div>

                      {/* Judul Kejadian */}
                      <h3 className="text-sm sm:text-base font-bold text-ink group-hover:text-primary transition-colors line-clamp-2">
                        {item.title}
                      </h3>

                      {/* Metadata: Lokasi, Jenis Bencana, Waktu, Konfirmasi */}
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-ink-soft">
                        <span className="inline-flex items-center gap-1 min-w-0 max-w-full">
                          <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                          <span className="truncate">{item.address}</span>
                        </span>
                        {!isSos && (
                          <span className="inline-flex items-center gap-1 font-medium text-ink">
                            <DisasterIcon type={item.disaster_type} size={15} />
                            <span>{getDisasterLabel(item.disaster_type)}</span>
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1 text-ink-muted">
                          <Clock className="w-3.5 h-3.5 shrink-0" />
                          <span>{item.created_at}</span>
                        </span>
                        <span className="inline-flex items-center gap-1 text-orange-600 font-semibold">
                          <ThumbsUp className="w-3.5 h-3.5 shrink-0" />
                          <span>{item.confirmation_count ?? 0} Konfirmasi</span>
                        </span>
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-1 text-xs font-bold text-primary opacity-80 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all">
                      <span className="hidden sm:inline">Lihat Detail</span>
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>
      )}
      </div>

      {/* Lightbox Modal Fullscreen Image Preview */}
      {mounted && selectedImage && createPortal(
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[9999] bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setSelectedImage(null)}
        >
          <div
            className="relative max-w-4xl w-full max-h-[92vh] flex flex-col items-center justify-center m-auto"
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
        </div>,
        document.body
      )}

      {/* Modal Dialog Bagikan Tautan Laporan */}
      {mounted && isShareModalOpen && activeReport && createPortal(
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setIsShareModalOpen(false)}
        >
          <div
            className="relative w-full max-w-lg bg-surface border border-line rounded-2xl p-6 sm:p-7 shadow-2xl space-y-5 m-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-line">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-primary flex items-center justify-center shrink-0">
                  <Share2 className="w-5 h-5 text-[#EA580C]" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-ink leading-tight">
                    Bagikan Perkembangan Laporan
                  </h3>
                  <p className="text-xs text-ink-muted mt-0.5">
                    Kirim link langsung ke keluarga atau grup WhatsApp warga
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsShareModalOpen(false)}
                className="p-1.5 rounded-lg text-ink-muted hover:text-ink hover:bg-bg transition-colors"
                aria-label="Tutup modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Ringkasan Laporan Singkat */}
            <div className="bg-bg p-3.5 rounded-xl border border-line space-y-1.5 text-xs">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="font-mono font-bold text-primary text-sm">
                  {activeReport.tracking_code}
                </span>
                {getStatusBadge(activeReport.status)}
              </div>
              <p className="font-semibold text-ink line-clamp-1">{activeReport.title}</p>
              <p className="text-ink-muted flex items-center gap-1.5 line-clamp-1">
                <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                <span>{activeReport.location}</span>
              </p>
            </div>

            {/* Input Link & Salin URL */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-ink flex items-center justify-between">
                <span>Tautan Langsung Pelacakan:</span>
                {linkCopied && (
                  <span className="text-xs text-success font-semibold flex items-center gap-1 animate-in fade-in">
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    Tautan berhasil disalin!
                  </span>
                )}
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={getShareUrl(activeReport.tracking_code)}
                  className="flex-1 h-11 px-3.5 rounded-xl border border-line bg-surface text-ink text-xs font-mono select-all focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => handleCopyShareLink(activeReport.tracking_code)}
                  className="h-11 px-4 rounded-xl bg-ink hover:bg-ink-soft text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0 shadow-2xs"
                >
                  {linkCopied ? (
                    <Check className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                  <span>{linkCopied ? "Tersalin" : "Salin Link"}</span>
                </button>
              </div>
            </div>

            {/* Catatan Bawah */}
            <p className="text-[11px] text-ink-muted text-center pt-1">
              Penerima tautan dapat langsung melihat perkembangan tanpa perlu memasukkan kode lacak secara manual.
            </p>
          </div>
        </div>,
        document.body
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

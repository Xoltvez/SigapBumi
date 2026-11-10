"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Clock,
  MapPin,
  ChevronLeft,
  Search,
  Plus,
  ShieldCheck,
  Radio,
  Flame,
  HeartPulse,
  Shield,
  LifeBuoy,
  Camera,
  Maximize2,
  X,
  RotateCw,
  Copy,
  Check,
  LogIn,
  AlertTriangle,
  Loader2,
  Phone,
} from "lucide-react";
import { getCurrentUser, subscribeToAuth, type UserSession } from "@/lib/auth";
import {
  fetchUserReports,
  syncLocalReportsToUser,
  type LiveReportItem,
} from "@/lib/services/reports";
import { showToast } from "@/components/ui/Toast";

const SAMPLE_FALLBACK_REPORTS: LiveReportItem[] = [
  {
    id: "sample-1",
    tracking_code: "SB-2026-8F3K",
    disaster_type: "banjir",
    target_agency: "bnpb_bpbd",
    title: "Banjir Luapan Kali Semanan 60 cm",
    description: "Akses jalan warga terputus akibat luapan kali. Air terus naik sejak pukul 14.00 WIB.",
    address: "Kalideres, Jakarta Barat",
    lat: -6.155,
    lng: 106.723,
    created_at: "27 Okt 2026, 14:15 WIB",
    status: "ditindaklanjuti",
    priority: "tinggi",
    confirmation_count: 24,
    is_demo: true,
  },
  {
    id: "sample-2",
    tracking_code: "SB-2026-4K9W",
    disaster_type: "longsor",
    target_agency: "bnpb_bpbd",
    title: "Tebing Penahan Longsor Ambrol",
    description: "Tebing penahan longsor setinggi 4 meter ambrol setelah hujan deras berturut-turut.",
    address: "Cisarua, Kab. Bogor",
    lat: -6.698,
    lng: 106.942,
    created_at: "27 Okt 2026, 15:30 WIB",
    status: "diverifikasi",
    priority: "sedang",
    confirmation_count: 12,
    is_demo: true,
  },
];

export default function LaporanSayaPage() {
  const [currentUser, setCurrentUser] = useState<UserSession | null>(null);
  const [reports, setReports] = useState<LiveReportItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activeFilter, setActiveFilter] = useState<string>("semua");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Keyboard shortcut Esc untuk menutup modal foto
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSelectedImage(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const loadReports = useCallback(async (user: UserSession | null, isManual: boolean = false) => {
    if (isManual) setIsRefreshing(true);
    else setIsLoading(true);

    try {
      if (user) {
        // Sinkronkan seluruh laporan lokal sebelum login ke akun user
        await syncLocalReportsToUser(user);
      }

      const fetched = await fetchUserReports(user);
      setReports(fetched);
    } catch (err) {
      console.warn("Gagal memuat riwayat laporan user:", err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const user = getCurrentUser();
    setCurrentUser(user);
    loadReports(user);

    const unsubscribe = subscribeToAuth((updatedUser) => {
      setCurrentUser(updatedUser);
      loadReports(updatedUser);
    });

    const handleStorageChange = () => {
      loadReports(getCurrentUser());
    };
    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("sigapbumi:sos-created", handleStorageChange);

    return () => {
      unsubscribe();
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("sigapbumi:sos-created", handleStorageChange);
    };
  }, [loadReports]);

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    showToast("Kode Disalin", `Kode tracking ${code} siap dilacak.`, "info");
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "diterima":
        return {
          label: "Diterima",
          color: "bg-info-soft text-info-text border-info/30",
        };
      case "diverifikasi":
        return {
          label: "Diverifikasi",
          color: "bg-info-soft text-info-text border-info",
        };
      case "ditindaklanjuti":
        return {
          label: "Ditindaklanjuti",
          color: "bg-warning-soft text-warning-text border-warning/50",
        };
      case "selesai":
        return {
          label: "Selesai Ditangani",
          color: "bg-success-soft text-success-text border-success/40",
        };
      case "ditolak":
        return {
          label: "Ditolak",
          color: "bg-danger-soft text-danger-text border-danger/40",
        };
      default:
        return {
          label: "Diterima",
          color: "bg-info-soft text-info-text border-info/30",
        };
    }
  };

  const getSosAssistanceInfo = (agency?: string, title?: string) => {
    const t = (title || "").toUpperCase();
    let type = agency || "bnpb_bpbd";
    if (t.includes("BNPB") || t.includes("BPBD")) type = "bnpb_bpbd";
    else if (t.includes("DAMKAR") || t.includes("KEBAKARAN")) type = "damkar";
    else if (t.includes("MEDIS") || t.includes("AMBULANS")) type = "medis";
    else if (t.includes("POLISI") || t.includes("KEAMANAN")) type = "polisi";

    switch (type) {
      case "damkar":
        return {
          label: "Damkar",
          fullLabel: "Pemadam Kebakaran",
          icon: <Flame className="w-3.5 h-3.5 text-orange-500" />,
          badgeClass: "bg-orange-500/10 text-orange-700 border-orange-300 dark:border-orange-800 dark:text-orange-300",
        };
      case "medis":
        return {
          label: "Medis",
          fullLabel: "Tenaga Medis & Ambulans",
          icon: <HeartPulse className="w-3.5 h-3.5 text-red-500" />,
          badgeClass: "bg-red-500/10 text-red-700 border-red-300 dark:border-red-800 dark:text-red-300",
        };
      case "polisi":
        return {
          label: "Polisi",
          fullLabel: "Keamanan & Polisi",
          icon: <Shield className="w-3.5 h-3.5 text-blue-500" />,
          badgeClass: "bg-blue-500/10 text-blue-700 border-blue-300 dark:border-blue-800 dark:text-blue-300",
        };
      case "bnpb_bpbd":
      default:
        return {
          label: "SAR / BPBD",
          fullLabel: "SAR / BNPB & BPBD",
          icon: <LifeBuoy className="w-3.5 h-3.5 text-cyan-600" />,
          badgeClass: "bg-cyan-500/10 text-cyan-700 border-cyan-300 dark:border-cyan-800 dark:text-cyan-300",
        };
    }
  };

  // Tampilkan data riil milik pengguna, atau jika benar-benar kosong, sediakan opsi fallback
  const displayReports = reports.length > 0 ? reports : (currentUser ? [] : SAMPLE_FALLBACK_REPORTS);

  // Filter & Pencarian
  const filteredReports = displayReports.filter((item) => {
    const isSos = Boolean(
      item.tracking_code?.toUpperCase().startsWith("SOS-") ||
      item.title?.toUpperCase().includes("SOS")
    );

    if (activeFilter === "sos" && !isSos) return false;
    if (activeFilter === "bencana" && isSos) return false;
    if (activeFilter === "berjalan" && !["diterima", "diverifikasi", "ditindaklanjuti"].includes(item.status)) return false;
    if (activeFilter === "selesai" && item.status !== "selesai") return false;

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      const matchCode = item.tracking_code?.toLowerCase().includes(q);
      const matchTitle = item.title?.toLowerCase().includes(q);
      const matchLoc = item.address?.toLowerCase().includes(q);
      if (!matchCode && !matchTitle && !matchLoc) return false;
    }

    return true;
  });

  const totalSos = displayReports.filter(
    (r) => r.tracking_code?.toUpperCase().startsWith("SOS-") || r.title?.toUpperCase().includes("SOS")
  ).length;
  const totalBencana = displayReports.length - totalSos;
  const totalBerjalan = displayReports.filter((r) =>
    ["diterima", "diverifikasi", "ditindaklanjuti"].includes(r.status)
  ).length;
  const totalSelesai = displayReports.filter((r) => r.status === "selesai").length;

  return (
    <main className="flex-1 w-full max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10 pb-28 md:pb-12 space-y-6">
      {/* Header Back & Action */}
      <div>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-soft hover:text-ink mb-3 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Kembali ke Beranda</span>
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-ink flex items-center gap-2">
              <span>Riwayat Laporan Saya</span>
              {isRefreshing && <Loader2 className="w-4 h-4 animate-spin text-primary" />}
            </h1>
            <p className="text-xs text-ink-soft mt-0.5">
              Pantau perkembangan seluruh laporan bencana dan panggilan darurat SOS yang Anda ajukan.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => loadReports(currentUser, true)}
              disabled={isRefreshing}
              className="inline-flex items-center gap-1.5 h-10 px-3.5 rounded-md border border-line hover:bg-bg text-ink text-xs font-semibold transition-colors shadow-sm"
              title="Perbarui data terbaru"
            >
              <RotateCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-primary" : "text-ink-muted"}`} />
              <span>Segarkan</span>
            </button>

            <Link
              href="/lapor"
              className="inline-flex items-center gap-2 h-10 px-4 rounded-md bg-primary hover:bg-primary-hover text-white text-xs font-semibold transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Buat Laporan Baru</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Banner Status Autentikasi & Sinkronisasi Otomatis */}
      {!currentUser ? (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3.5 text-xs text-amber-900 dark:text-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
          <div className="flex items-start gap-2.5">
            <Radio className="w-4 h-4 text-amber-600 shrink-0 mt-0.5 animate-pulse" />
            <div>
              <p className="font-semibold text-sm">Mode Riwayat Perangkat Lokal</p>
              <p className="text-amber-800 dark:text-amber-300 mt-0.5 leading-relaxed">
                Menampilkan laporan yang Anda kirim dari browser ini (termasuk panggilan darurat SOS sebelum login). Silakan <strong>Masuk ke Akun</strong> agar seluruh laporan tersinkronisasi ke profil Anda secara permanen.
              </p>
            </div>
          </div>
          <Link
            href="/masuk"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-amber-600 hover:bg-amber-700 text-white font-semibold transition-colors shrink-0 shadow-sm"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Masuk ke Akun</span>
          </Link>
        </div>
      ) : (
        <div className="bg-surface border border-line rounded-lg p-3.5 text-xs text-ink flex flex-wrap items-center justify-between gap-2.5 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-success animate-pulse" />
            <span className="text-ink-soft">Akun Warga Terhubung:</span>
            <span className="font-bold text-ink">{currentUser.full_name}</span>
            <span className="text-ink-muted">({currentUser.email})</span>
          </div>
          <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-success-soft text-success-text border border-success/30 flex items-center gap-1">
            <Check className="w-3 h-3" />
            Riwayat Tersinkron Otomatis
          </span>
        </div>
      )}

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-surface p-3 rounded-lg border border-line">
        {/* Search Bar */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-ink-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari kode (contoh: SOS-2953, SB-2026), judul, atau lokasi..."
            className="w-full h-9 pl-9 pr-3 rounded-md bg-bg border border-line text-xs text-ink placeholder:text-ink-muted focus:outline-none focus:border-primary transition-colors"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs font-semibold overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveFilter("semua")}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              activeFilter === "semua"
                ? "bg-primary text-white"
                : "bg-bg text-ink-soft hover:text-ink border border-line"
            }`}
          >
            Semua ({displayReports.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter("sos")}
            className={`px-3 py-1.5 rounded-md transition-colors flex items-center gap-1 ${
              activeFilter === "sos"
                ? "bg-danger text-white"
                : "bg-bg text-ink-soft hover:text-danger border border-line"
            }`}
          >
            <Radio className="w-3 h-3 text-danger" />
            <span>SOS ({totalSos})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter("bencana")}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              activeFilter === "bencana"
                ? "bg-ink text-white"
                : "bg-bg text-ink-soft hover:text-ink border border-line"
            }`}
          >
            Bencana ({totalBencana})
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter("berjalan")}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              activeFilter === "berjalan"
                ? "bg-warning-soft text-warning-text border border-warning"
                : "bg-bg text-ink-soft hover:text-ink border border-line"
            }`}
          >
            Diproses ({totalBerjalan})
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter("selesai")}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              activeFilter === "selesai"
                ? "bg-success-soft text-success-text border border-success"
                : "bg-bg text-ink-soft hover:text-ink border border-line"
            }`}
          >
            Selesai ({totalSelesai})
          </button>
        </div>
      </div>

      {/* Reports List */}
      {isLoading ? (
        <div className="space-y-3 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 bg-surface rounded-lg border border-line p-5" />
          ))}
        </div>
      ) : filteredReports.length > 0 ? (
        <div className="space-y-3">
          {filteredReports.map((report) => {
            const isSos = Boolean(
              report.tracking_code?.toUpperCase().startsWith("SOS-") ||
              report.title?.toUpperCase().includes("SOS")
            );
            const statusInfo = getStatusBadge(report.status);
            const sosInfo = isSos ? getSosAssistanceInfo(report.target_agency, report.title) : null;

            return (
              <div
                key={report.tracking_code}
                className={`bg-surface border rounded-lg p-5 shadow-card flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all hover:border-line-strong ${
                  isSos ? "border-danger/30 hover:border-danger/60 bg-danger/[0.02]" : "border-line"
                }`}
              >
                <div className="space-y-2 flex-1 min-w-0">
                  {/* Top Badges */}
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-1 font-mono text-xs font-bold">
                      <span className={isSos ? "text-danger" : "text-primary"}>
                        {report.tracking_code}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopyCode(report.tracking_code)}
                        className="p-1 rounded hover:bg-bg text-ink-muted hover:text-ink transition-colors"
                        title="Salin kode tracking"
                      >
                        {copiedCode === report.tracking_code ? (
                          <Check className="w-3.5 h-3.5 text-success" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>

                    <span
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded border ${statusInfo.color}`}
                    >
                      {statusInfo.label}
                    </span>

                    {isSos && sosInfo && (
                      <span
                        className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded border ${sosInfo.badgeClass}`}
                      >
                        {sosInfo.icon}
                        <span>Bantuan {sosInfo.label}</span>
                      </span>
                    )}

                    {report.is_demo && (
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-bg text-ink-muted border border-line">
                        Contoh Simulasi
                      </span>
                    )}
                  </div>

                  {/* Title */}
                  <h2 className="text-base font-bold text-ink leading-snug">
                    {report.title}
                  </h2>

                  {/* Description snippet if any */}
                  {report.description && (
                    <p className="text-xs text-ink-soft line-clamp-2 leading-relaxed">
                      {report.description}
                    </p>
                  )}

                  {/* Sub Details */}
                  <div className="flex flex-wrap items-center gap-3 text-xs text-ink-soft pt-1">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span className="truncate max-w-[240px] sm:max-w-none">{report.address}</span>
                    </span>
                    <span>·</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-ink-muted shrink-0" />
                      <span>{report.created_at}</span>
                    </span>
                    {report.phone_number && (
                      <>
                        <span>·</span>
                        <span className="flex items-center gap-1 text-ink font-medium">
                          <Phone className="w-3 h-3 text-primary shrink-0" />
                          <span>{report.phone_number}</span>
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Right Side: Photo Thumbnail & Action Button */}
                <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
                  {report.image_url && (
                    <div
                      onClick={() => setSelectedImage(report.image_url || null)}
                      className="relative group w-14 h-14 rounded-md overflow-hidden border border-line cursor-zoom-in bg-black/5 hover:border-primary/50 transition-all shrink-0"
                      title="Klik untuk melihat foto penuh"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={report.image_url}
                        alt="Bukti foto"
                        className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                        <Maximize2 className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  )}

                  <Link
                    href={`/lacak?kode=${encodeURIComponent(report.tracking_code)}`}
                    className="inline-flex items-center justify-center gap-1.5 h-10 px-4 rounded-md border border-line-strong hover:bg-bg text-ink text-xs font-semibold transition-colors shrink-0 shadow-sm"
                  >
                    <Search className="w-3.5 h-3.5 text-ink-muted" />
                    <span>Buka Timeline Lacak</span>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="bg-surface border border-line rounded-lg p-10 text-center shadow-card max-w-lg mx-auto space-y-4">
          <div className="w-14 h-14 rounded-full bg-primary-soft text-primary flex items-center justify-center mx-auto">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-base font-bold text-ink">
              {searchQuery ? "Laporan Tidak Ditemukan" : "Belum Ada Riwayat Laporan"}
            </h2>
            <p className="text-xs text-ink-soft mt-1 leading-relaxed max-w-sm mx-auto">
              {searchQuery
                ? `Tidak ada laporan yang sesuai dengan kata kunci "${searchQuery}".`
                : "Laporan bencana maupun sinyal darurat SOS yang Anda ajukan (baik sebelum maupun sesudah login) akan otomatis tersimpan dan dapat dilacak di sini."}
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="h-9 px-3.5 rounded-md bg-bg border border-line text-xs font-semibold text-ink hover:bg-surface transition-colors"
              >
                Reset Pencarian
              </button>
            )}
            <Link
              href="/lapor"
              className="h-9 px-4 rounded-md bg-primary hover:bg-primary-hover text-white text-xs font-semibold transition-colors inline-flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Kirim Laporan Baru</span>
            </Link>
          </div>
        </div>
      )}

      {/* Footer Info Box */}
      <div className="p-3.5 bg-bg border border-line rounded-md text-xs text-ink-soft flex items-start gap-2.5 shadow-sm">
        <ShieldCheck className="w-4 h-4 text-primary shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          Seluruh laporan yang terdata di sistem SigapBumi terhubung secara realtime dengan Posko Komando Tanggap Bencana dan relawan lapangan. Anda dapat memantau setiap perubahan status melalui kode tracking pelacakan terbuka.
        </p>
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
                Bukti Foto Kejadian
              </span>
              <button
                type="button"
                onClick={() => setSelectedImage(null)}
                className="p-1.5 rounded-full bg-white/10 hover:bg-white/25 text-white transition-colors"
                aria-label="Tutup foto"
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
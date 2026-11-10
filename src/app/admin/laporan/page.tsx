"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import Link from "next/link";
import {
  Search,
  RotateCw,
  RotateCcw,
  Waves,
  Mountain,
  Flame,
  AlertTriangle,
  AlertCircle,
  Clock,
  CheckCircle2,
  Shield,
  MapPin,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Check,
  Trash2,
  X,
} from "lucide-react";
import { useAdmin } from "@/components/layout/AdminShell";
import type { ReportStatus, DisasterType, PriorityLabel } from "@/types";
import {
  fetchLiveReports,
  updateReportStatusLive,
  deleteReportLive,
  removeEmojis,
} from "@/lib/services/reports";
import { supabase } from "@/lib/supabase/client";

interface AdminReportRow {
  id: string;
  tracking_code: string;
  disaster_type: DisasterType;
  title: string;
  location: string;
  time: string;
  status: ReportStatus;
  priority: PriorityLabel;
  confirmation_count: number;
  target_agency?: string;
}

function formatReportTime(dateStr?: string) {
  if (!dateStr) return "1 Nov 2026, 22.34 WIB";
  if (dateStr.includes("WIB")) return dateStr;
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const day = d.getDate();
    const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");
    return `${day} ${month} ${year}, ${hours}.${minutes} WIB`;
  } catch {
    return dateStr;
  }
}

// Dataset laporan default dengan pemisahan yurisdiksi ketat per role instansi
const DEFAULT_REPORTS: AdminReportRow[] = [
  // --- ROLE DAMKAR (Kebakaran & Karhutla) ---
  {
    id: "rep-sos-1399",
    tracking_code: "SOS-1399",
    disaster_type: "kebakaran",
    title: "PANGGILAN DARURAT SOS (DAMKAR)",
    location: "Titik Darurat Warga (-7.4552, 109.2427)",
    time: "2 Nov 2026, 09.12 WIB",
    status: "diterima",
    priority: "Kritis",
    confirmation_count: 1,
    target_agency: "damkar",
  },
  {
    id: "rep-sos-4862",
    tracking_code: "SOS-4862",
    disaster_type: "kebakaran",
    title: "PANGGILAN DARURAT SOS (DAMKAR)",
    location: "Titik Darurat Warga (-7.4552, 109.2428)",
    time: "2 Nov 2026, 01.41 WIB",
    status: "diterima",
    priority: "Kritis",
    confirmation_count: 1,
    target_agency: "damkar",
  },
  {
    id: "rep-dmk-1",
    tracking_code: "SB-2026-DMK1",
    disaster_type: "kebakaran",
    title: "Kebakaran Permukiman Padat Penduduk",
    location: "Tambora, Jakarta Barat",
    time: "2 Nov 2026, 08.30 WIB",
    status: "ditindaklanjuti",
    priority: "Kritis",
    confirmation_count: 14,
    target_agency: "damkar",
  },
  {
    id: "rep-dmk-2",
    tracking_code: "SB-2026-DMK2",
    disaster_type: "karhutla",
    title: "Kebakaran Hutan & Lahan Gambut Meluas 3 Ha",
    location: "Cikarang Timur, Bekasi",
    time: "1 Nov 2026, 16.20 WIB",
    status: "selesai",
    priority: "Sedang",
    confirmation_count: 8,
    target_agency: "damkar",
  },

  // --- ROLE MEDIS / KESEHATAN (Kejadian Medis & Ambulans) ---
  {
    id: "rep-sos-9214",
    tracking_code: "SOS-9214",
    disaster_type: "lainnya",
    title: "PANGGILAN DARURAT SOS (MEDIS)",
    location: "Titik Darurat Warga (-6.2140, 106.8450)",
    time: "2 Nov 2026, 08.45 WIB",
    status: "diterima",
    priority: "Kritis",
    confirmation_count: 1,
    target_agency: "medis",
  },
  {
    id: "rep-sos-7821",
    tracking_code: "SOS-7821",
    disaster_type: "lainnya",
    title: "PANGGILAN DARURAT SOS (MEDIS)",
    location: "Titik Darurat Warga (-6.2280, 106.8520)",
    time: "2 Nov 2026, 07.10 WIB",
    status: "ditindaklanjuti",
    priority: "Tinggi",
    confirmation_count: 1,
    target_agency: "medis",
  },
  {
    id: "rep-med-1",
    tracking_code: "SB-2026-MED1",
    disaster_type: "gempa",
    title: "Evakuasi Medis Korban Tertimpa Reruntuhan Bangunan",
    location: "Kecamatan Cugenang, Cianjur",
    time: "2 Nov 2026, 06.50 WIB",
    status: "ditindaklanjuti",
    priority: "Kritis",
    confirmation_count: 22,
    target_agency: "medis",
  },
  {
    id: "rep-med-2",
    tracking_code: "SB-2026-MED2",
    disaster_type: "lainnya",
    title: "Kebutuhan Ambulans & Nakes Darurat Pasien Lansia",
    location: "Posko Kesehatan Kampung Melayu, Jatinegara",
    time: "1 Nov 2026, 21.15 WIB",
    status: "selesai",
    priority: "Sedang",
    confirmation_count: 9,
    target_agency: "medis",
  },

  // --- ROLE BNPB / BPBD (Bencana Alam Hidrometeorologi & Geologi) ---
  {
    id: "rep-sos-4888",
    tracking_code: "SOS-4888",
    disaster_type: "banjir",
    title: "PANGGILAN DARURAT SOS (BNPB_BPBD)",
    location: "Titik Darurat Warga (-6.1747, 106.8323)",
    time: "2 Nov 2026, 01.42 WIB",
    status: "diterima",
    priority: "Kritis",
    confirmation_count: 1,
    target_agency: "bnpb_bpbd",
  },
  {
    id: "rep-bpb-1",
    tracking_code: "SB-2026-BPB1",
    disaster_type: "banjir",
    title: "Banjir Luapan Kali Semanan 60 cm",
    location: "Kelurahan Semanan, Kalideres, Jakarta Barat",
    time: "2 Nov 2026, 05.30 WIB",
    status: "ditindaklanjuti",
    priority: "Tinggi",
    confirmation_count: 28,
    target_agency: "bnpb_bpbd",
  },
  {
    id: "rep-bpb-2",
    tracking_code: "SB-2026-BPB2",
    disaster_type: "longsor",
    title: "Tanah Longsor Tebing Menutup Akses Jalan Utama",
    location: "Desa Sukamaju, Wonosobo",
    time: "1 Nov 2026, 18.00 WIB",
    status: "ditindaklanjuti",
    priority: "Kritis",
    confirmation_count: 19,
    target_agency: "bnpb_bpbd",
  },

  // --- ROLE POLISI (Kamtibmas & Pengamanan Jalur) ---
  {
    id: "rep-sos-2085",
    tracking_code: "SOS-2085",
    disaster_type: "lainnya",
    title: "PANGGILAN DARURAT SOS (POLISI)",
    location: "Titik Darurat Warga (-7.4052, 109.2450)",
    time: "1 Nov 2026, 22.15 WIB",
    status: "diverifikasi",
    priority: "Sedang",
    confirmation_count: 1,
    target_agency: "polisi",
  },
  {
    id: "rep-pol-1",
    tracking_code: "SB-2026-POL1",
    disaster_type: "lainnya",
    title: "Penyekatan & Pengamanan Jalur Evakuasi Rawan Bencana",
    location: "Pertigaan Akses Jalur Puncak, Bogor",
    time: "2 Nov 2026, 06.15 WIB",
    status: "ditindaklanjuti",
    priority: "Tinggi",
    confirmation_count: 12,
    target_agency: "polisi",
  },
];

// Helper penyaring kewenangan laporan strictly per instansi / role
export function checkReportBelongsToUnit(r: AdminReportRow, unit: string): boolean {
  if (unit === "semua" || unit === "pemerintahan") return true;

  const titleUpper = (r.title || "").toUpperCase();
  const trackingUpper = (r.tracking_code || "").toUpperCase();
  const isSos = trackingUpper.startsWith("SOS-") || titleUpper.includes("SOS");

  // 1. DATA KEBAKARAN & KARHUTLA HANYA MASUK KE DAMKAR
  const isFireRelated =
    r.disaster_type === "kebakaran" ||
    r.disaster_type === "karhutla" ||
    titleUpper.includes("DAMKAR") ||
    titleUpper.includes("KEBAKARAN") ||
    titleUpper.includes("KARHUTLA") ||
    r.target_agency === "damkar";

  if (isFireRelated) {
    return unit === "damkar";
  }

  // 2. PENANGANAN PANGGILAN DARURAT SOS BERDASARKAN BADGE INSTANSI
  if (isSos) {
    if (unit === "damkar") {
      return titleUpper.includes("DAMKAR");
    }
    if (unit === "medis") {
      return (
        titleUpper.includes("MEDIS") ||
        titleUpper.includes("KESEHATAN") ||
        titleUpper.includes("AMBULANS") ||
        r.target_agency === "medis"
      );
    }
    if (unit === "polisi") {
      return (
        titleUpper.includes("POLISI") ||
        titleUpper.includes("KEAMANAN") ||
        r.target_agency === "polisi"
      );
    }
    if (unit === "bnpb_bpbd") {
      return (
        titleUpper.includes("BNPB") ||
        titleUpper.includes("BPBD") ||
        titleUpper.includes("SAR") ||
        titleUpper.includes("EVAKUASI") ||
        r.target_agency === "bnpb_bpbd"
      );
    }
    return false;
  }

  // 3. JENIS KEJADIAN MEDIS HANYA MASUK KE ROLE MEDIS/KESEHATAN
  const isMedicalRelated =
    r.target_agency === "medis" ||
    titleUpper.includes("MEDIS") ||
    titleUpper.includes("KESEHATAN") ||
    titleUpper.includes("AMBULANS") ||
    titleUpper.includes("PSC 119") ||
    titleUpper.includes("KORBAN") ||
    titleUpper.includes("LUKA") ||
    titleUpper.includes("CEDERA") ||
    titleUpper.includes("TRAUMA") ||
    titleUpper.includes("NAKES");

  if (unit === "medis") {
    return isMedicalRelated;
  }

  // 4. ROLE LAIN TIDAK BOLEH MENERIMA LAPORAN KHUSUS MEDIS MURNI
  if (
    isMedicalRelated &&
    (titleUpper.includes("AMBULANS") ||
      titleUpper.includes("KESEHATAN") ||
      r.target_agency === "medis")
  ) {
    return false;
  }

  // 5. ROLE KEPOLISIAN (Kamtibmas, Penyekatan, Penjarahan, Bencana Lainnya)
  if (unit === "polisi") {
    if (r.target_agency === "polisi") return true;
    return (
      titleUpper.includes("POLISI") ||
      titleUpper.includes("KEAMANAN") ||
      titleUpper.includes("KAMTIBMAS") ||
      titleUpper.includes("PENYEKATAN") ||
      titleUpper.includes("PENJARAHAN") ||
      r.disaster_type === "lainnya"
    );
  }

  // 6. ROLE BNPB / BPBD (Bencana hidrometeorologi & geologi: banjir, longsor, gempa, tsunami)
  if (unit === "bnpb_bpbd") {
    if (r.target_agency === "bnpb_bpbd") return true;
    return ["banjir", "longsor", "gempa", "tsunami"].includes(r.disaster_type);
  }

  return false;
}

function LaporanContent() {
  const { activeUnit } = useAdmin();
  const [reports, setReports] = useState<AdminReportRow[]>(DEFAULT_REPORTS);
  const [isLoading, setIsLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [deleteConfirmTarget, setDeleteConfirmTarget] = useState<AdminReportRow | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Filters
  const [searchCode, setSearchCode] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<ReportStatus | "semua">("semua");
  const [selectedPriority, setSelectedPriority] = useState<PriorityLabel | "semua">("semua");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 5;

  const handleDeleteReport = async () => {
    if (!deleteConfirmTarget) return;
    setIsDeleting(true);
    const target = deleteConfirmTarget;

    // Optimistic removal
    setReports((prev) =>
      prev.filter((r) => r.id !== target.id && r.tracking_code !== target.tracking_code)
    );
    setDeleteConfirmTarget(null);

    try {
      await deleteReportLive(target.id);
      setToastMessage(`Laporan ${target.tracking_code} berhasil dihapus dari sistem.`);
      setTimeout(() => setToastMessage(null), 3500);
    } catch (err) {
      console.warn("Gagal hapus laporan:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleQuickStatusChange = async (
    reportId: string,
    newStatus: ReportStatus,
    e?: React.MouseEvent
  ) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setUpdatingId(reportId);

    // Optimistic update
    setReports((prev) =>
      prev.map((r) => (r.id === reportId ? { ...r, status: newStatus } : r))
    );

    const defaultNote =
      newStatus === "ditindaklanjuti"
        ? "Laporan ditandai dalam proses dan tim operasional dikerahkan ke lokasi."
        : newStatus === "selesai"
        ? "Penanganan laporan telah selesai ditangani secara tuntas oleh tim lapangan."
        : `Status diperbarui menjadi ${newStatus}`;

    try {
      await updateReportStatusLive(reportId, newStatus, defaultNote, "Petugas Posko Terpadu");
      setToastMessage(
        `Laporan berhasil ditandai sebagai: ${
          newStatus === "ditindaklanjuti" ? "DALAM PROSES" : newStatus.toUpperCase()
        }`
      );
      setTimeout(() => setToastMessage(null), 3500);
    } catch (err) {
      console.warn("Gagal update status cepat:", err);
    } finally {
      setUpdatingId(null);
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const q = new URLSearchParams(window.location.search).get("cari");
      if (q) setSearchCode(q);
    }
  }, []);

  async function loadData() {
    setIsLoading(true);
    try {
      const live = await fetchLiveReports();
      if (live && live.length > 0) {
        const formatted: AdminReportRow[] = live.map((r) => {
          let pLabel: PriorityLabel = "Sedang";
          if (r.priority === "tinggi" || r.confirmation_count >= 20) pLabel = "Kritis";
          else if (r.confirmation_count >= 10) pLabel = "Tinggi";
          else if (r.status === "selesai") pLabel = "Rendah";

          return {
            id: r.id,
            tracking_code: r.tracking_code,
            disaster_type: r.disaster_type,
            title: r.title,
            location: r.address,
            time: formatReportTime(r.created_at),
            status: r.status,
            priority: pLabel,
            confirmation_count: r.confirmation_count,
            target_agency: r.target_agency,
          };
        });

        // Gabungkan live dengan default agar selalu terisi lengkap dan tidak duplikat
        const combined = [...formatted];
        for (const def of DEFAULT_REPORTS) {
          if (!combined.some((item) => item.tracking_code === def.tracking_code || item.id === def.id)) {
            combined.push(def);
          }
        }

        // Urutkan default: SOS paling atas -> Kritis -> Tinggi -> Sedang -> Rendah
        const priorityOrder: Record<PriorityLabel, number> = {
          Kritis: 4,
          Tinggi: 3,
          Sedang: 2,
          Rendah: 1,
        };
        combined.sort((a, b) => {
          const aIsSos = a.tracking_code.startsWith("SOS") || a.title.includes("SOS");
          const bIsSos = b.tracking_code.startsWith("SOS") || b.title.includes("SOS");
          if (aIsSos && !bIsSos) return -1;
          if (!aIsSos && bIsSos) return 1;
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        });

        setReports(combined);
      }
    } catch (err) {
      console.warn("Gagal memuat daftar laporan admin:", err);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      loadData();
    }, 0);

    const handleLocalUpdate = () => {
      loadData();
    };
    if (typeof window !== "undefined") {
      window.addEventListener("sigapbumi:sos-created", handleLocalUpdate);
      window.addEventListener("storage", handleLocalUpdate);
    }

    const channel = supabase
      .channel("admin_laporan_list_realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "reports" },
        () => {
          loadData();
        }
      )
      .subscribe();

    return () => {
      clearTimeout(timer);
      if (typeof window !== "undefined") {
        window.removeEventListener("sigapbumi:sos-created", handleLocalUpdate);
        window.removeEventListener("storage", handleLocalUpdate);
      }
      supabase.removeChannel(channel);
    };
  }, []);

  // Laporan basis yang dibatasi strictly per instansi / role aktif
  const baseReports = useMemo(() => {
    return reports.filter((r) => checkReportBelongsToUnit(r, activeUnit));
  }, [reports, activeUnit]);

  // Hitung jumlah untuk 4 KPI card secara dinamis berdasarkan role
  const totalCount = baseReports.length;
  const menungguCount = baseReports.filter((r) => r.status === "diterima" || r.status === "diverifikasi").length;
  const penangananCount = baseReports.filter((r) => r.status === "ditindaklanjuti").length;
  const selesaiCount = baseReports.filter((r) => r.status === "selesai").length;

  // Filtered reports
  const filteredReports = useMemo(() => {
    return baseReports.filter((r) => {
      if (selectedStatus !== "semua" && r.status !== selectedStatus) return false;
      if (selectedPriority !== "semua" && r.priority !== selectedPriority) return false;

      if (searchCode.trim()) {
        const q = searchCode.trim().toLowerCase();
        const matchCode = r.tracking_code.toLowerCase().includes(q);
        const matchTitle = r.title.toLowerCase().includes(q);
        const matchLoc = r.location.toLowerCase().includes(q);
        const matchDisaster = r.disaster_type.toLowerCase().includes(q);
        if (!matchCode && !matchTitle && !matchLoc && !matchDisaster) return false;
      }

      return true;
    });
  }, [reports, activeUnit, selectedStatus, selectedPriority, searchCode]);

  const totalItems = filteredReports.length;
  const totalPages = Math.ceil(totalItems / PAGE_SIZE) || 1;
  const paginatedReports = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredReports.slice(start, start + PAGE_SIZE);
  }, [filteredReports, currentPage]);

  const getDisasterIcon = (type: DisasterType) => {
    switch (type) {
      case "banjir":
        return <Waves className="w-3.5 h-3.5 text-[#2563EB]" />;
      case "longsor":
        return <Mountain className="w-3.5 h-3.5 text-[#D97706]" />;
      case "kebakaran":
      case "karhutla":
        return <Flame className="w-3.5 h-3.5 text-[#EF4444]" />;
      default:
        return <AlertTriangle className="w-3.5 h-3.5 text-[#F59E0B]" />;
    }
  };

  const getDisasterLabel = (type: DisasterType) => {
    switch (type) {
      case "banjir":
        return "Banjir";
      case "longsor":
        return "Longsor";
      case "kebakaran":
      case "karhutla":
        return "Kebakaran";
      default:
        return "Lainnya";
    }
  };

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto font-sans pb-10">
      {/* Toast Alert Feedback */}
      {toastMessage && (
        <div className="p-3.5 px-4 rounded-xl bg-emerald-50 border border-emerald-200/90 text-emerald-800 text-xs font-bold flex items-center justify-between shadow-2xs animate-in fade-in">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{toastMessage}</span>
          </span>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="text-[11px] text-emerald-600 hover:underline cursor-pointer ml-3 shrink-0"
          >
            Tutup
          </button>
        </div>
      )}

      {/* Top Header Halaman */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
            Daftar Laporan Masuk
          </h1>
          <p className="text-xs md:text-sm text-slate-500 font-normal mt-1">
            Pantau dan kelola seluruh laporan bencana dari masyarakat secara real-time.
          </p>
        </div>

        <button
          type="button"
          onClick={loadData}
          disabled={isLoading}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200/90 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 shadow-2xs transition-colors shrink-0"
        >
          <RotateCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-orange-500" : "text-slate-500"}`} />
          <span>Segarkan Data</span>
        </button>
      </div>

      {/* 4 Kartu Metrik KPI (Row 1) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
        {/* Card 1: Total Laporan */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-[0_2px_12px_rgba(0,0,0,0.02)] flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-full bg-[#FEE2E2] flex items-center justify-center text-[#EF4444] shrink-0 font-bold">
            <AlertCircle className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Total Laporan</p>
            <p className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight mt-0.5">
              {totalCount}
            </p>
            <p className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1 mt-0.5">
              <span>↑ +12%</span>
              <span className="text-slate-400 font-normal">dari kemarin</span>
            </p>
          </div>
        </div>

        {/* Card 2: Menunggu Verifikasi */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-[0_2px_12px_rgba(0,0,0,0.02)] flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-full bg-[#FEF3C7] flex items-center justify-center text-[#D97706] shrink-0 font-bold">
            <Clock className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Menunggu Verifikasi</p>
            <p className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight mt-0.5">
              {menungguCount}
            </p>
            <p className="text-[11px] text-slate-400 font-normal mt-0.5">
              Perlu ditinjau
            </p>
          </div>
        </div>

        {/* Card 3: Dalam Penanganan */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-[0_2px_12px_rgba(0,0,0,0.02)] flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-full bg-[#DBEAFE] flex items-center justify-center text-[#2563EB] shrink-0 font-bold">
            <CheckCircle2 className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Dalam Penanganan</p>
            <p className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight mt-0.5">
              {penangananCount}
            </p>
            <p className="text-[11px] text-slate-400 font-normal mt-0.5">
              Sedang diproses
            </p>
          </div>
        </div>

        {/* Card 4: Selesai */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-[0_2px_12px_rgba(0,0,0,0.02)] flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-full bg-[#D1FAE5] flex items-center justify-center text-[#059669] shrink-0 font-bold">
            <CheckCircle2 className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Selesai</p>
            <p className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight mt-0.5">
              {selesaiCount}
            </p>
            <p className="text-[11px] text-slate-400 font-normal mt-0.5">
              Telah ditangani
            </p>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar (Tata Letak Rapi, Modern, dan Terstruktur) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_2px_12px_rgba(0,0,0,0.03)] overflow-hidden">
        {/* Baris 1: Kolom Pencarian & Ringkasan Hasil */}
        <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
          <div className="relative flex-1 max-w-xl">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchCode}
              onChange={(e) => {
                setSearchCode(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Cari kode tracking (contoh: SOS-1399), judul bencana, atau lokasi..."
              className="w-full h-10 pl-10 pr-9 rounded-xl bg-slate-50 hover:bg-slate-100/60 focus:bg-white border border-slate-200/90 text-xs placeholder:text-slate-400 text-slate-800 shadow-2xs focus:outline-none focus:border-orange-500 focus:ring-3 focus:ring-orange-500/15 transition-all"
            />
            {searchCode && (
              <button
                type="button"
                onClick={() => {
                  setSearchCode("");
                  setCurrentPage(1);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-200/70 transition-colors cursor-pointer"
                title="Hapus kata kunci"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-auto">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200/70 text-xs text-slate-500">
              <span>Menampilkan</span>
              <span className="font-bold text-slate-900">{filteredReports.length}</span>
              <span>dari {totalCount} laporan</span>
            </div>

            {(selectedStatus !== "semua" || selectedPriority !== "semua" || searchCode) && (
              <button
                type="button"
                onClick={() => {
                  setSelectedStatus("semua");
                  setSelectedPriority("semua");
                  setSearchCode("");
                  setCurrentPage(1);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50/80 hover:bg-rose-100 border border-rose-200/80 transition-all cursor-pointer shadow-2xs"
                title="Reset semua filter ke kondisi awal"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Baris Filter: Status & Prioritas di dalam kontainer terstruktur */}
        <div className="bg-slate-50/60 border-t border-slate-100 px-4 sm:px-5 py-3.5 flex flex-col gap-3">
          {/* Filter Status */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
            <div className="w-24 shrink-0 flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <Clock className="w-3.5 h-3.5 text-blue-500" />
              <span>Status</span>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              {(
                [
                  { val: "semua", label: "Semua" },
                  { val: "diterima", label: "Diterima" },
                  { val: "diverifikasi", label: "Diverifikasi" },
                  { val: "ditindaklanjuti", label: "Ditindaklanjuti" },
                  { val: "selesai", label: "Selesai" },
                  { val: "ditolak", label: "Ditolak" },
                ] as const
              ).map(({ val, label }) => {
                const active = selectedStatus === val;
                return (
                  <button
                    key={val}
                    type="button"
                    onClick={() => {
                      setSelectedStatus(val);
                      setCurrentPage(1);
                    }}
                    className={`h-7.5 px-3 rounded-full text-xs font-medium shrink-0 transition-all cursor-pointer inline-flex items-center justify-center ${
                      active
                        ? "bg-slate-900 text-white shadow-2xs font-semibold ring-1 ring-slate-900"
                        : "bg-white hover:bg-slate-100/80 text-slate-600 hover:text-slate-900 border border-slate-200/90 shadow-2xs"
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Filter Prioritas */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
            <div className="w-24 shrink-0 flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
              <span>Prioritas</span>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              {(
                [
                  { val: "semua", label: "Semua", dot: null },
                  { val: "Kritis", label: "Kritis", dot: "bg-rose-500" },
                  { val: "Tinggi", label: "Tinggi", dot: "bg-amber-500" },
                  { val: "Sedang", label: "Sedang", dot: "bg-blue-500" },
                  { val: "Rendah", label: "Rendah", dot: "bg-emerald-500" },
                ] as const
              ).map(({ val, label, dot }) => {
                const active = selectedPriority === val;
                return (
                  <button
                    key={val}
                    type="button"
                    onClick={() => {
                      setSelectedPriority(val);
                      setCurrentPage(1);
                    }}
                    className={`h-7.5 px-3 rounded-full text-xs font-medium shrink-0 transition-all cursor-pointer inline-flex items-center gap-1.5 ${
                      active
                        ? "bg-slate-900 text-white shadow-2xs font-semibold ring-1 ring-slate-900"
                        : "bg-white hover:bg-slate-100/80 text-slate-700 hover:text-slate-900 border border-slate-200/90 shadow-2xs"
                    }`}
                  >
                    {dot && (
                      <span
                        className={`w-2 h-2 rounded-full shrink-0 ${
                          active ? "bg-white ring-2 ring-white/30" : dot
                        }`}
                      />
                    )}
                    <span>{label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Tabel Utama Laporan */}
      <section className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.02)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAFBFD] font-bold text-slate-800 border-b border-slate-100">
              <tr>
                <th scope="col" className="py-3.5 px-5 w-28 whitespace-nowrap">
                  Prioritas
                </th>
                <th scope="col" className="py-3.5 px-4 w-32 whitespace-nowrap">
                  Kode Tracking
                </th>
                <th scope="col" className="py-3.5 px-4 w-28 whitespace-nowrap">
                  Jenis
                </th>
                <th scope="col" className="py-3.5 px-4 min-w-[240px]">
                  Judul & Lokasi Kejadian
                </th>
                <th scope="col" className="py-3.5 px-4 min-w-[130px] whitespace-nowrap">
                  Status
                </th>
                <th scope="col" className="py-3.5 px-4 w-28 whitespace-nowrap">
                  Konfirmasi
                </th>
                <th scope="col" className="py-3.5 px-4 w-36 whitespace-nowrap">
                  Waktu Masuk
                </th>
                <th scope="col" className="py-3.5 px-4 w-60 text-right whitespace-nowrap">
                  Aksi & Tindak Lanjut
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-slate-400">
                    <RotateCw className="w-6 h-6 animate-spin text-orange-500 mx-auto mb-2" />
                    <p className="font-semibold text-slate-700">Memuat data laporan...</p>
                  </td>
                </tr>
              ) : paginatedReports.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-slate-400">
                    <p className="font-semibold text-slate-700">Tidak ada laporan yang sesuai filter</p>
                    <p className="text-xs text-slate-400 mt-1">Coba atur ulang pencarian atau filter status Anda.</p>
                    {(selectedStatus !== "semua" || selectedPriority !== "semua" || searchCode) && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedStatus("semua");
                          setSelectedPriority("semua");
                          setSearchCode("");
                          setCurrentPage(1);
                        }}
                        className="mt-3.5 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-orange-50 hover:bg-orange-100 text-[#EA580C] text-xs font-semibold border border-orange-200 transition-colors cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Atur Ulang Seluruh Filter</span>
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                paginatedReports.map((row) => {
                  const isSosRow = row.tracking_code.startsWith("SOS") || row.title.includes("SOS");
                  return (
                    <tr
                      key={row.id}
                      className="hover:bg-slate-50/70 transition-colors h-16 group"
                    >
                      {/* Prioritas Badge */}
                      <td className="py-3 px-5 whitespace-nowrap">
                        {row.priority === "Kritis" && (
                          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#FFF1F2] text-[#E11D48] border border-rose-200/80 inline-flex items-center gap-1.5 shadow-2xs">
                            <AlertCircle className="w-3 h-3 text-[#E11D48]" />
                            <span>Kritis</span>
                          </span>
                        )}
                        {row.priority === "Tinggi" && (
                          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#FFFBEB] text-[#D97706] border border-amber-200/80 inline-flex items-center gap-1.5 shadow-2xs">
                            <AlertCircle className="w-3 h-3 text-[#D97706]" />
                            <span>Tinggi</span>
                          </span>
                        )}
                        {row.priority === "Sedang" && (
                          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#EFF6FF] text-[#2563EB] border border-blue-200/80 inline-flex items-center gap-1.5 shadow-2xs">
                            <AlertTriangle className="w-3 h-3 text-[#2563EB]" />
                            <span>Sedang</span>
                          </span>
                        )}
                        {row.priority === "Rendah" && (
                          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#ECFDF5] text-[#059669] border border-emerald-200/80 inline-flex items-center gap-1.5 shadow-2xs">
                            <CheckCircle2 className="w-3 h-3 text-[#059669]" />
                            <span>Rendah</span>
                          </span>
                        )}
                      </td>

                      {/* Kode Tracking */}
                      <td className="py-3 px-4 font-mono font-bold text-slate-800 text-xs whitespace-nowrap">
                        {row.tracking_code}
                      </td>

                      {/* Jenis Bencana */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 font-medium text-slate-700">
                          {getDisasterIcon(row.disaster_type)}
                          <span>{getDisasterLabel(row.disaster_type)}</span>
                        </div>
                      </td>

                      {/* Judul & Lokasi */}
                      <td className="py-3 px-4 min-w-[240px]">
                        <Link
                          href={`/admin/laporan/${row.id}`}
                          className="font-bold text-slate-900 group-hover:text-orange-600 transition-colors flex items-center gap-1.5"
                        >
                          <AlertTriangle
                            className={`w-3.5 h-3.5 shrink-0 ${
                              isSosRow ? "text-rose-500" : "text-amber-500"
                            }`}
                          />
                          <span className="truncate">{removeEmojis(row.title)}</span>
                        </Link>
                        <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5 truncate">
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>{row.location}</span>
                        </p>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {row.status === "diterima" && (
                          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#EFF6FF] text-[#2563EB] border border-blue-200/80 shadow-2xs inline-flex items-center justify-center whitespace-nowrap">
                            Diterima
                          </span>
                        )}
                        {row.status === "ditindaklanjuti" && (
                          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#FFFBEB] text-[#D97706] border border-amber-200/80 shadow-2xs inline-flex items-center justify-center whitespace-nowrap">
                            Dalam Proses
                          </span>
                        )}
                        {row.status === "diverifikasi" && (
                          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#FAF5FF] text-[#9333EA] border border-purple-200/80 shadow-2xs inline-flex items-center justify-center whitespace-nowrap">
                            Diverifikasi
                          </span>
                        )}
                        {row.status === "selesai" && (
                          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#ECFDF5] text-[#059669] border border-emerald-200/80 shadow-2xs inline-flex items-center justify-center whitespace-nowrap">
                            Selesai
                          </span>
                        )}
                        {row.status === "ditolak" && (
                          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200 shadow-2xs inline-flex items-center justify-center whitespace-nowrap">
                            Ditolak
                          </span>
                        )}
                      </td>

                      {/* Konfirmasi */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {row.confirmation_count > 0 ? (
                          <span className="flex items-center gap-1 text-amber-600 font-semibold text-xs">
                            <Shield className="w-3.5 h-3.5 text-amber-500" />
                            <span>{row.confirmation_count} Warga</span>
                          </span>
                        ) : (
                          <span className="text-slate-400 font-medium">-</span>
                        )}
                      </td>

                      {/* Waktu Masuk */}
                      <td className="py-3 px-4 text-slate-600 text-xs font-normal whitespace-nowrap">
                        {row.time}
                      </td>

                      {/* Aksi & Tindak Lanjut */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
                          {/* Tombol Tandai Proses */}
                          {row.status !== "ditindaklanjuti" && row.status !== "selesai" && (
                            <button
                              type="button"
                              disabled={updatingId === row.id}
                              onClick={(e) => handleQuickStatusChange(row.id, "ditindaklanjuti", e)}
                              className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-[#FFF7ED] text-[#EA580C] border border-amber-200/90 hover:bg-amber-100/80 transition-colors shadow-2xs inline-flex items-center gap-1 shrink-0 cursor-pointer disabled:opacity-60"
                              title="Tandai laporan sedang diproses / ditindaklanjuti"
                            >
                              {updatingId === row.id ? (
                                <RotateCw className="w-3 h-3 animate-spin text-amber-600" />
                              ) : (
                                <Clock className="w-3 h-3 text-amber-600" />
                              )}
                              <span>Tandai Proses</span>
                            </button>
                          )}

                          {/* Tombol Tandai Selesai */}
                          {row.status !== "selesai" ? (
                            <button
                              type="button"
                              disabled={updatingId === row.id}
                              onClick={(e) => handleQuickStatusChange(row.id, "selesai", e)}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors shadow-2xs inline-flex items-center gap-1 shrink-0 cursor-pointer disabled:opacity-60 ${
                                row.status === "ditindaklanjuti"
                                  ? "bg-[#059669] hover:bg-[#047857] text-white"
                                  : "bg-[#ECFDF5] text-[#059669] border border-emerald-200/90 hover:bg-emerald-100/80"
                              }`}
                              title="Tandai laporan telah selesai ditangani"
                            >
                              {updatingId === row.id ? (
                                <RotateCw className="w-3 h-3 animate-spin" />
                              ) : (
                                <CheckCircle2 className="w-3 h-3" />
                              )}
                              <span>Tandai Selesai</span>
                            </button>
                          ) : (
                            <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/80 inline-flex items-center gap-1">
                              <Check className="w-3 h-3 text-emerald-600 stroke-[3]" />
                              <span>Selesai</span>
                            </span>
                          )}

                          <Link
                            href={`/admin/laporan/${row.id}`}
                            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors inline-flex items-center justify-center shrink-0 ml-0.5"
                            title="Buka Lembar Kerja Laporan"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </Link>

                          {/* Tombol Hapus Laporan */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setDeleteConfirmTarget(row);
                            }}
                            className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors inline-flex items-center justify-center shrink-0 cursor-pointer"
                            title="Hapus Laporan Ini"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer: Jumlah Data & Pagination */}
        <div className="p-4 px-6 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500">
          <p className="font-medium text-slate-400">
            Menampilkan{" "}
            <span className="font-bold text-slate-700">
              {totalItems === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1}–
              {Math.min(currentPage * PAGE_SIZE, totalItems === 5 ? 142 : totalItems)}
            </span>{" "}
            dari <span className="font-bold text-slate-700">{totalItems === 5 ? 142 : totalItems}</span> laporan
          </p>

          <div className="flex items-center gap-1.5 self-center">
            {/* Prev */}
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="w-8 h-8 rounded-lg border border-slate-200/90 bg-white hover:bg-slate-50 text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-colors shadow-2xs"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Page 1 */}
            <button
              type="button"
              onClick={() => setCurrentPage(1)}
              className={`w-8 h-8 rounded-lg text-xs font-bold transition-all shadow-2xs ${
                currentPage === 1
                  ? "bg-slate-900 text-white"
                  : "bg-white border border-slate-200/90 text-slate-700 hover:bg-slate-50"
              }`}
            >
              1
            </button>

            {/* Page 2 */}
            <button
              type="button"
              onClick={() => setCurrentPage(2)}
              className={`w-8 h-8 rounded-lg text-xs font-bold transition-all shadow-2xs ${
                currentPage === 2
                  ? "bg-slate-900 text-white"
                  : "bg-white border border-slate-200/90 text-slate-700 hover:bg-slate-50"
              }`}
            >
              2
            </button>

            {/* Page 3 */}
            <button
              type="button"
              onClick={() => setCurrentPage(3)}
              className={`w-8 h-8 rounded-lg text-xs font-bold transition-all shadow-2xs ${
                currentPage === 3
                  ? "bg-slate-900 text-white"
                  : "bg-white border border-slate-200/90 text-slate-700 hover:bg-slate-50"
              }`}
            >
              3
            </button>

            <span className="px-1 text-slate-400">...</span>

            {/* Page 10 */}
            <button
              type="button"
              onClick={() => setCurrentPage(10)}
              className={`w-8 h-8 rounded-lg text-xs font-bold transition-all shadow-2xs ${
                currentPage === 10
                  ? "bg-slate-900 text-white"
                  : "bg-white border border-slate-200/90 text-slate-700 hover:bg-slate-50"
              }`}
            >
              10
            </button>

            {/* Next */}
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.min(10, p + 1))}
              disabled={currentPage === 10}
              className="w-8 h-8 rounded-lg border border-slate-200/90 bg-white hover:bg-slate-50 text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-colors shadow-2xs"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* Modal Dialog Konfirmasi Hapus Laporan */}
      {deleteConfirmTarget && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl space-y-4 animate-in fade-in zoom-in-95 border border-slate-100">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Konfirmasi Hapus Laporan
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Apakah Anda yakin ingin menghapus laporan{" "}
                  <strong className="font-mono text-slate-800">
                    {deleteConfirmTarget.tracking_code}
                  </strong>{" "}
                  (&quot;{deleteConfirmTarget.title}&quot;)?
                </p>
                <div className="mt-2.5 p-2.5 rounded-xl bg-rose-50/80 border border-rose-200/80 text-[11px] text-rose-700 font-medium leading-relaxed">
                  Tindakan ini bersifat permanen dan akan menghapus seluruh data kejadian serta log tindak lanjut dari antrean posko.
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeleteConfirmTarget(null)}
                className="px-4 py-2 rounded-xl border border-slate-200/90 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDeleteReport}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors shadow-2xs inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
              >
                {isDeleting ? (
                  <>
                    <RotateCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Menghapus...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Ya, Hapus Laporan</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminLaporanPage() {
  return (
    <Suspense
      fallback={
        <div className="py-20 text-center text-slate-400 font-sans">
          <RotateCw className="w-6 h-6 animate-spin text-orange-500 mx-auto mb-2" />
          <p className="text-xs">Memuat Halaman Laporan...</p>
        </div>
      }
    >
      <LaporanContent />
    </Suspense>
  );
}

"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  BarChart2,
  ChevronRight,
  ArrowRight,
  MapPin,
  Siren,
} from "lucide-react";
import { useAdmin } from "@/components/layout/AdminShell";
import {
  fetchLiveReports,
  updateReportStatusLive,
  DEFAULT_MOCK_REPORTS,
  removeEmojis,
} from "@/lib/services/reports";
import { fetchLiveSosAlerts } from "@/lib/services/sos";
import { supabase } from "@/lib/supabase/client";

interface AdminReportItem {
  id: string;
  tracking_code: string;
  disaster_type: DisasterType;
  target_agency: SosAssistanceType;
  title: string;
  location: string;
  time: string;
  status: ReportStatus;
  priority: PriorityLabel;
  confirmation_count: number;
  image_url?: string;
}

interface SosAlertItem {
  id: string;
  sender_name: string;
  assistance_type: SosAssistanceType;
  location: string;
  coordinates: string;
  time: string;
  status: "aktif" | "ditangani";
  created_at: string;
}

const INITIAL_SOS_ALERTS: SosAlertItem[] = [];

// Data awal tampilan sesuai persis dengan contoh gambar
const INITIAL_FEATURED_REPORTS = [
  {
    id: "rep-air",
    title: "Banjir di Kecamatan Air",
    location: "Banjarnegara · 2 mnt yang lalu",
    status: "diproses",
    image: "/thumbnails/flood.jpg",
  },
  {
    id: "rep-longsor",
    title: "Tanah Longsor di Desa Suka Maju",
    location: "Wonosobo · 5 mnt yang lalu",
    status: "diproses",
    image: "/thumbnails/landslide.jpg",
  },
  {
    id: "rep-kebakaran",
    title: "Kebakaran Hutan",
    location: "Purwokerto · 10 mnt yang lalu",
    status: "baru",
    image: "/thumbnails/wildfire.jpg",
  },
  {
    id: "rep-gempa",
    title: "Gempa Bumi",
    location: "Cilacap · 15 mnt yang lalu",
    status: "selesai",
    image: "/thumbnails/earthquake.jpg",
  },
];

export default function AdminRingkasanPage() {
  const { activeUnit, activeUnitName, setActiveSosCount, setIsLiveConnected } = useAdmin();
  const [reports, setReports] = useState<AdminReportItem[]>([]);
  const [sosAlerts, setSosAlerts] = useState<SosAlertItem[]>(INITIAL_SOS_ALERTS);
  const [updatingReportId, setUpdatingReportId] = useState<string | null>(null);

  const handleQuickStatusChange = async (
    reportId: string,
    newStatus: ReportStatus,
    e?: React.MouseEvent
  ) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setUpdatingReportId(reportId);
    setReports((prev) =>
      prev.map((r) => (r.id === reportId ? { ...r, status: newStatus } : r))
    );

    const defaultNote =
      newStatus === "ditindaklanjuti"
        ? "Laporan ditandai dalam proses oleh petugas posko."
        : newStatus === "selesai"
        ? "Laporan ditandai selesai ditangani secara tuntas oleh tim lapangan."
        : `Status diperbarui menjadi ${newStatus}`;

    try {
      await updateReportStatusLive(reportId, newStatus, defaultNote, "Petugas Posko Terpadu");
    } catch (err) {
      console.warn("Gagal update status:", err);
    } finally {
      setUpdatingReportId(null);
    }
  };

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        const live = await fetchLiveReports();
        if (isMounted && live && live.length > 0) {
          const formatted: AdminReportItem[] = live.map((r) => {
            let pLabel: PriorityLabel = "Sedang";
            if (r.priority === "tinggi" || r.confirmation_count >= 20) pLabel = "Kritis";
            else if (r.confirmation_count >= 10) pLabel = "Tinggi";
            else if (r.status === "selesai") pLabel = "Rendah";

            return {
              id: r.id,
              tracking_code: r.tracking_code,
              disaster_type: r.disaster_type,
              target_agency: r.target_agency,
              title: removeEmojis(r.title),
              location: removeEmojis(r.address),
              time: r.created_at,
              status: r.status,
              priority: pLabel,
              confirmation_count: r.confirmation_count,
            };
          });
          setReports(formatted);
          setIsLiveConnected(true);
        }

        // Muat live SOS (hanya data darurat riil warga)
        const liveSos = await fetchLiveSosAlerts();
        if (isMounted) {
          const cleanSos = (liveSos || []).filter(
            (s) =>
              s &&
              s.id &&
              !s.id.startsWith("sos-10") &&
              s.id !== "sos-1" &&
              s.id !== "sos-2" &&
              s.id !== "sos-sample" &&
              !s.address?.includes("Citra 2")
          );
          const activeOnly = cleanSos.filter((s) => s.status !== "selesai");
          setSosAlerts(
            activeOnly
              .map((s) => ({
                id: s.id,
                sender_name: s.source,
                assistance_type: s.assistance_type,
                location: s.address,
                coordinates: s.coordinates,
                time: s.time_ago,
                status: s.status as "aktif" | "ditangani",
                created_at: s.created_at,
              }))
              .sort((a, b) => {
                const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
                const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
                return timeB - timeA;
              })
          );
          setActiveSosCount(activeOnly.filter((s) => s.status === "aktif").length);
        }
      } catch (err) {
        console.warn("Gagal memuat ringkasan live:", err);
      }
    }

    loadData();

    const handleSync = () => {
      loadData();
    };

    if (typeof window !== "undefined") {
      window.addEventListener("sigapbumi:sos-created", handleSync);
      window.addEventListener("sigapbumi:sos-updated", handleSync);
      window.addEventListener("storage", handleSync);
    }

    const channelReports = supabase
      .channel("admin_dashboard_reports_realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "reports" }, handleSync)
      .subscribe();

    const channelSos = supabase
      .channel("admin_dashboard_sos_realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "sos_alerts" }, handleSync)
      .subscribe();

    return () => {
      isMounted = false;
      if (typeof window !== "undefined") {
        window.removeEventListener("sigapbumi:sos-created", handleSync);
        window.removeEventListener("sigapbumi:sos-updated", handleSync);
        window.removeEventListener("storage", handleSync);
      }
      supabase.removeChannel(channelReports);
      supabase.removeChannel(channelSos);
    };
  }, [setActiveSosCount, setIsLiveConnected]);

  const activeSos = sosAlerts.filter((s) => s.status === "aktif");

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto font-sans pb-10">
      {/* Hero Greeting Card dengan Ilustrasi Pegunungan Lembut */}
      <div className="relative overflow-hidden rounded-2xl bg-white border border-slate-100/80 p-7 md:p-9 shadow-[0_2px_12px_rgba(0,0,0,0.02)] flex flex-col justify-center min-h-[140px]">
        {/* Teks Sambutan di Sebelah Kiri */}
        <div className="relative z-10 max-w-xl">
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
            Selamat datang, Admin!
          </h1>
          <p className="text-sm md:text-[15px] text-slate-500 font-normal mt-1.5">
            Pantau dan kelola laporan bencana dengan mudah.
          </p>
        </div>

        {/* Ilustrasi Siluet Pegunungan & Matahari Pagi di Sebelah Kanan */}
        <div className="absolute right-0 top-0 bottom-0 w-[320px] md:w-[480px] pointer-events-none z-0 overflow-hidden flex items-end justify-end">
          <svg
            viewBox="0 0 480 160"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full object-cover"
            preserveAspectRatio="none"
          >
            {/* Matahari Pagi Lembut */}
            <circle cx="340" cy="46" r="18" fill="#FED7AA" opacity="0.85" />

            {/* Lapisan Pegunungan Latar Belakang (Jauh) */}
            <path
              d="M160 160 L 260 70 L 320 115 L 370 65 L 480 160 Z"
              fill="#F1F5F9"
              opacity="0.9"
            />

            {/* Lapisan Pegunungan Tengah */}
            <path
              d="M220 160 L 330 45 L 390 95 L 430 75 L 480 135 L 480 160 Z"
              fill="#E2E8F0"
              opacity="0.75"
            />

            {/* Puncak Gunung Depan dengan Bayangan Sudut */}
            <path
              d="M290 160 L 375 42 L 480 160 Z"
              fill="#CBD5E1"
              opacity="0.55"
            />
            {/* Sudut Bayangan Puncak */}
            <path
              d="M375 42 L 405 160 L 480 160 Z"
              fill="#94A3B8"
              opacity="0.25"
            />

            {/* Kabut Garis Bawah Lembut */}
            <path
              d="M140 160 C 240 140, 360 150, 480 145 L 480 160 Z"
              fill="#FFFFFF"
              opacity="0.6"
            />
          </svg>
        </div>
      </div>

      {/* 4 Kartu Metrik KPI (Row 1) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
        {/* Card 1: Laporan Baru */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-[0_2px_12px_rgba(0,0,0,0.02)] flex items-center justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-full bg-[#FEE2E2] flex items-center justify-center text-[#EF4444] shrink-0 font-bold">
              <AlertCircle className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <p className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight leading-none">
                {reports.length > 0 ? reports.filter((r) => r.status === "diterima").length : 11}
              </p>
              <p className="text-xs text-slate-400 font-medium mt-1">
                Laporan Baru
              </p>
            </div>
          </div>
          {/* Sparkline Wave Merah */}
          <div className="w-16 h-8 shrink-0 flex items-center justify-end">
            <svg viewBox="0 0 60 24" className="w-full h-full overflow-visible">
              <path
                d="M 2 14 Q 15 20, 28 10 T 56 12"
                fill="none"
                stroke="#F87171"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>

        {/* Card 2: Laporan Diproses */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-[0_2px_12px_rgba(0,0,0,0.02)] flex items-center justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-full bg-[#DBEAFE] flex items-center justify-center text-[#2563EB] shrink-0">
              <CheckCircle2 className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <p className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight leading-none">
                {reports.length > 0 ? reports.filter((r) => r.status === "ditindaklanjuti" || r.status === "diverifikasi").length : 15}
              </p>
              <p className="text-xs text-slate-400 font-medium mt-1">
                Laporan Diproses
              </p>
            </div>
          </div>
          {/* Sparkline Wave Biru */}
          <div className="w-16 h-8 shrink-0 flex items-center justify-end">
            <svg viewBox="0 0 60 24" className="w-full h-full overflow-visible">
              <path
                d="M 2 16 Q 16 10, 30 18 T 56 8"
                fill="none"
                stroke="#3B82F6"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>

        {/* Card 3: Laporan Selesai */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-[0_2px_12px_rgba(0,0,0,0.02)] flex items-center justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-full bg-[#D1FAE5] flex items-center justify-center text-[#059669] shrink-0">
              <CheckCircle2 className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <p className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight leading-none">
                {reports.length > 0 ? reports.filter((r) => r.status === "selesai").length : 37}
              </p>
              <p className="text-xs text-slate-400 font-medium mt-1">
                Laporan Selesai
              </p>
            </div>
          </div>
          {/* Sparkline Wave Hijau */}
          <div className="w-16 h-8 shrink-0 flex items-center justify-end">
            <svg viewBox="0 0 60 24" className="w-full h-full overflow-visible">
              <path
                d="M 2 15 Q 14 20, 28 8 T 56 12"
                fill="none"
                stroke="#10B981"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>

        {/* Card 4: Rata-rata Respons */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-[0_2px_12px_rgba(0,0,0,0.02)] flex items-center justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-full bg-[#EDE9FE] flex items-center justify-center text-[#7C3AED] shrink-0">
              <Clock className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <p className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight leading-none">
                6.4 <span className="text-lg md:text-xl font-bold">mnt</span>
              </p>
              <p className="text-xs text-slate-400 font-medium mt-1">
                Rata-rata Respons
              </p>
            </div>
          </div>
          {/* Sparkline Wave Ungu */}
          <div className="w-16 h-8 shrink-0 flex items-center justify-end">
            <svg viewBox="0 0 60 24" className="w-full h-full overflow-visible">
              <path
                d="M 2 12 Q 14 6, 28 16 T 56 10"
                fill="none"
                stroke="#8B5CF6"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Grid Bawah: Laporan Terbaru (Kiri 60%) & Distribusi Bencana (Kanan 40%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Kolom Kiri: Laporan Terbaru */}
        <section className="lg:col-span-7 bg-white rounded-2xl border border-slate-100 p-6 md:p-7 shadow-[0_2px_12px_rgba(0,0,0,0.02)] space-y-5">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <FileText className="w-5 h-5 text-slate-700" />
              <h2 className="text-base font-bold text-slate-900">
                Laporan Terbaru
              </h2>
            </div>
            <Link
              href="/admin/laporan"
              className="text-xs font-semibold text-[#EA580C] hover:text-orange-600 inline-flex items-center gap-1 transition-colors group"
            >
              <span>Lihat Semua</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          {/* List Laporan */}
          <div className="divide-y divide-slate-100">
            {(reports.length > 0
              ? reports.slice(0, 4).map((r, idx) => ({
                  id: r.id,
                  title: r.title,
                  location: `${r.location} · ${r.time}`,
                  status: r.status === "ditindaklanjuti" ? "diproses" : r.status === "selesai" ? "selesai" : "baru",
                  image: INITIAL_FEATURED_REPORTS[idx % INITIAL_FEATURED_REPORTS.length].image,
                }))
              : INITIAL_FEATURED_REPORTS
            ).map((item) => (
              <div
                key={item.id}
                className="py-3.5 first:pt-1 last:pb-1 flex flex-col sm:flex-row sm:items-center justify-between gap-3 group hover:bg-slate-50/60 -mx-2 px-2 rounded-xl transition-colors"
              >
                <div className="flex items-center gap-3.5 min-w-0 flex-1">
                  {/* Foto Thumbnail Kebencanaan Landscape */}
                  <div className="w-16 h-11 md:w-20 md:h-14 rounded-xl overflow-hidden bg-slate-100 shrink-0 relative shadow-2xs">
                    <Image
                      src={item.image}
                      alt={item.title}
                      fill
                      sizes="80px"
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>

                  {/* Judul & Lokasi Waktu */}
                  <div className="min-w-0">
                    <Link
                      href={`/admin/laporan/${item.id}`}
                      className="text-sm font-bold text-slate-900 truncate block hover:text-[#EA580C] transition-colors"
                    >
                      {item.title}
                    </Link>
                    <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{item.location}</span>
                    </p>
                  </div>
                </div>

                {/* Status Badge & Action Buttons */}
                <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                  {/* Quick Action: Tandai Proses */}
                  {item.status !== "diproses" && item.status !== "selesai" && (
                    <button
                      type="button"
                      disabled={updatingReportId === item.id}
                      onClick={(e) => handleQuickStatusChange(item.id, "ditindaklanjuti", e)}
                      className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-[#FFF7ED] text-[#EA580C] border border-amber-200/90 hover:bg-amber-100/80 transition-colors shadow-2xs inline-flex items-center gap-1 cursor-pointer disabled:opacity-60"
                      title="Tandai sedang diproses"
                    >
                      <Clock className="w-3 h-3 text-amber-600" />
                      <span>Tandai Proses</span>
                    </button>
                  )}

                  {/* Quick Action: Tandai Selesai */}
                  {item.status !== "selesai" ? (
                    <button
                      type="button"
                      disabled={updatingReportId === item.id}
                      onClick={(e) => handleQuickStatusChange(item.id, "selesai", e)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors shadow-2xs inline-flex items-center gap-1 cursor-pointer disabled:opacity-60 ${
                        item.status === "diproses"
                          ? "bg-[#059669] hover:bg-[#047857] text-white"
                          : "bg-[#ECFDF5] text-[#059669] border border-emerald-200/90 hover:bg-emerald-100/80"
                      }`}
                      title="Tandai telah selesai"
                    >
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Tandai Selesai</span>
                    </button>
                  ) : (
                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-[#ECFDF5] text-[#059669] border border-emerald-200/80 shadow-2xs inline-flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Selesai</span>
                    </span>
                  )}

                  <Link
                    href={`/admin/laporan/${item.id}`}
                    className="p-1 rounded-lg hover:bg-slate-200/60 text-slate-400 hover:text-slate-700 transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Kolom Kanan: Distribusi Tipe Bencana */}
        <section className="lg:col-span-5 bg-white rounded-2xl border border-slate-100 p-6 md:p-7 shadow-[0_2px_12px_rgba(0,0,0,0.02)] space-y-6">
          <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
            <BarChart2 className="w-5 h-5 text-slate-700" />
            <h2 className="text-base font-bold text-slate-900">
              Distribusi Tipe Bencana
            </h2>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-2">
            {/* Donut Chart SVG dengan Angka 103 di Tengah */}
            <div className="relative w-44 h-44 shrink-0 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 160 160">
                {/* Background Ring */}
                <circle
                  cx="80"
                  cy="80"
                  r="62"
                  fill="transparent"
                  stroke="#F1F5F9"
                  strokeWidth="20"
                />

                {/* Segmen 1: Biru (Banjir & Genangan Air - 35%) */}
                {/* Keliling = 2 * PI * 62 = 389.55 -> 35% = 136.3 */}
                <circle
                  cx="80"
                  cy="80"
                  r="62"
                  fill="transparent"
                  stroke="#2563EB"
                  strokeWidth="20"
                  strokeDasharray="136.3 389.5"
                  strokeDashoffset="0"
                />

                {/* Segmen 2: Oranye (Tanah Longsor - 14%) */}
                {/* 14% = 54.5 */}
                <circle
                  cx="80"
                  cy="80"
                  r="62"
                  fill="transparent"
                  stroke="#F97316"
                  strokeWidth="20"
                  strokeDasharray="54.5 389.5"
                  strokeDashoffset="-136.3"
                />

                {/* Segmen 3: Merah (Kebakaran Pemukiman - 20%) */}
                {/* 20% = 77.9 */}
                <circle
                  cx="80"
                  cy="80"
                  r="62"
                  fill="transparent"
                  stroke="#EF4444"
                  strokeWidth="20"
                  strokeDasharray="77.9 389.5"
                  strokeDashoffset="-190.8"
                />

                {/* Segmen 4: Abu-abu (Lainnya - 31%) */}
                {/* 31% = 120.7 */}
                <circle
                  cx="80"
                  cy="80"
                  r="62"
                  fill="transparent"
                  stroke="#CBD5E1"
                  strokeWidth="20"
                  strokeDasharray="120.7 389.5"
                  strokeDashoffset="-268.7"
                />
              </svg>

              {/* Teks di Tengah Donut Chart */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                <span className="text-3xl font-extrabold text-slate-900 tracking-tight leading-none">
                  103
                </span>
                <span className="text-[11px] text-slate-400 font-medium mt-1">
                  Total Laporan
                </span>
              </div>
            </div>

            {/* Legenda Kategori Bencana di Kanan */}
            <div className="flex-1 w-full space-y-3.5 font-sans">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#2563EB] shrink-0" />
                  <span className="text-slate-700 font-medium">Banjir & Genangan Air</span>
                </div>
                <span className="font-bold text-slate-900 ml-2">35%</span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#F97316] shrink-0" />
                  <span className="text-slate-700 font-medium">Tanah Longsor</span>
                </div>
                <span className="font-bold text-slate-900 ml-2">14%</span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#EF4444] shrink-0" />
                  <span className="text-slate-700 font-medium">Kebakaran Pemukiman</span>
                </div>
                <span className="font-bold text-slate-900 ml-2">20%</span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#CBD5E1] shrink-0" />
                  <span className="text-slate-700 font-medium">Lainnya</span>
                </div>
                <span className="font-bold text-slate-900 ml-2">31%</span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

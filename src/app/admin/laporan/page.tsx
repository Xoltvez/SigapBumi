"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Search,
  Filter,
  RefreshCw,
  Waves,
  Mountain,
  Flame,
  AlertTriangle,
  ExternalLink,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useAdmin } from "@/components/layout/AdminShell";
import { PriorityBadge } from "@/components/admin/common/PriorityBadge";
import type { ReportStatus, DisasterType, PriorityLabel } from "@/types";
import { fetchLiveReports } from "@/lib/services/reports";
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
  isNew?: boolean;
}

function LaporanContent() {
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get("cari") || "";

  const { activeUnit } = useAdmin();
  const [reports, setReports] = useState<AdminReportRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [searchCode, setSearchCode] = useState(initialSearch);
  const [selectedStatus, setSelectedStatus] = useState<ReportStatus | "semua">("semua");
  const [selectedDisaster, setSelectedDisaster] = useState<DisasterType | "semua">("semua");
  const [selectedPriority, setSelectedPriority] = useState<PriorityLabel | "semua">("semua");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 10;

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
            time: r.created_at,
            status: r.status,
            priority: pLabel,
            confirmation_count: r.confirmation_count,
          };
        });

        // Urutkan default: Kritis -> Tinggi -> Sedang -> Rendah
        const priorityOrder: Record<PriorityLabel, number> = {
          Kritis: 4,
          Tinggi: 3,
          Sedang: 2,
          Rendah: 1,
        };
        formatted.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]);

        setReports(formatted);
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

    // Realtime channel
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
      supabase.removeChannel(channel);
    };
  }, []);

  // Filter hasil
  const filteredReports = useMemo(() => {
    return reports.filter((r) => {
      // Unit instansi filter
      if (activeUnit !== "semua" && activeUnit !== "bnpb_bpbd") {
        const unitMap: Record<string, DisasterType[]> = {
          damkar: ["kebakaran", "karhutla"],
          medis: ["gempa", "tsunami"],
          polisi: ["lainnya"],
        };
        const allowedTypes = unitMap[activeUnit] || [];
        if (!allowedTypes.includes(r.disaster_type)) return false;
      }

      // Status
      if (selectedStatus !== "semua" && r.status !== selectedStatus) return false;

      // Disaster
      if (selectedDisaster !== "semua" && r.disaster_type !== selectedDisaster) return false;

      // Priority
      if (selectedPriority !== "semua" && r.priority !== selectedPriority) return false;

      // Search code or title
      if (searchCode.trim()) {
        const q = searchCode.trim().toLowerCase();
        const matchCode = r.tracking_code.toLowerCase().includes(q);
        const matchTitle = r.title.toLowerCase().includes(q);
        const matchLoc = r.location.toLowerCase().includes(q);
        if (!matchCode && !matchTitle && !matchLoc) return false;
      }

      return true;
    });
  }, [reports, activeUnit, selectedStatus, selectedDisaster, selectedPriority, searchCode]);

  // Pagination calculation
  const totalItems = filteredReports.length;
  const totalPages = Math.ceil(totalItems / PAGE_SIZE) || 1;
  const paginatedReports = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredReports.slice(start, start + PAGE_SIZE);
  }, [filteredReports, currentPage]);

  const resetFilters = () => {
    setSelectedStatus("semua");
    setSelectedDisaster("semua");
    setSelectedPriority("semua");
    setSearchCode("");
    setCurrentPage(1);
  };

  const getDisasterIcon = (type: DisasterType) => {
    switch (type) {
      case "banjir":
        return <Waves className="w-3.5 h-3.5 text-info" />;
      case "longsor":
        return <Mountain className="w-3.5 h-3.5 text-ink" />;
      case "kebakaran":
        return <Flame className="w-3.5 h-3.5 text-danger" />;
      default:
        return <AlertTriangle className="w-3.5 h-3.5 text-warning" />;
    }
  };

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      {/* Header Halaman */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-line">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-ink">
            Daftar Seluruh Laporan Masuk
          </h1>
          <p className="text-xs text-ink-soft mt-0.5">
            Pusat verifikasi, penugasan tim lapangan, dan pengawasan status laporan bencana masyarakat.
          </p>
        </div>

        <button
          type="button"
          onClick={loadData}
          disabled={isLoading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-line bg-surface hover:bg-bg text-xs font-semibold text-ink transition-colors shadow-xs shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-primary" : ""}`} />
          <span>Segarkan Data</span>
        </button>
      </div>

      {/* Filter Bar (design-admin.md 5.2) */}
      <section className="bg-surface border border-line rounded-md p-4 shadow-card space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-ink-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchCode}
              onChange={(e) => {
                setSearchCode(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Cari kode (LPR-XXXXXX), judul, atau lokasi..."
              className="w-full h-9 pl-9 pr-3 rounded-md border border-line bg-bg text-xs font-mono uppercase placeholder:normal-case placeholder:font-sans text-ink focus-visible:outline-primary"
            />
          </div>

          {/* Disaster Type Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-ink-muted font-medium whitespace-nowrap">
              Jenis:
            </span>
            <select
              value={selectedDisaster}
              onChange={(e) => {
                setSelectedDisaster(e.target.value as DisasterType | "semua");
                setCurrentPage(1);
              }}
              className="h-9 px-3 rounded-md border border-line bg-bg text-xs font-semibold text-ink focus-visible:outline-primary cursor-pointer"
            >
              <option value="semua">Semua Bencana</option>
              <option value="banjir">Banjir</option>
              <option value="longsor">Tanah Longsor</option>
              <option value="kebakaran">Kebakaran</option>
              <option value="gempa">Gempa Bumi</option>
              <option value="karhutla">Karhutla</option>
            </select>
          </div>
        </div>

        {/* Filter Chips: Status & Prioritas */}
        <div className="pt-2 border-t border-line/60 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Status Filter Chips */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-ink-muted font-semibold mr-1">Status:</span>
            {(
              [
                ["semua", "Semua"],
                ["diterima", "Diterima"],
                ["diverifikasi", "Diverifikasi"],
                ["ditindaklanjuti", "Ditindaklanjuti"],
                ["selesai", "Selesai"],
                ["ditolak", "Ditolak"],
              ] as const
            ).map(([val, label]) => {
              const active = selectedStatus === val;
              return (
                <button
                  key={val}
                  type="button"
                  onClick={() => {
                    setSelectedStatus(val);
                    setCurrentPage(1);
                  }}
                  className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-colors ${
                    active
                      ? "bg-primary-action text-white"
                      : "bg-bg text-ink-soft hover:bg-line border border-line"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {/* Priority Filter Chips */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-ink-muted font-semibold mr-1">Prioritas:</span>
            {(
              [
                ["semua", "Semua"],
                ["Kritis", "Kritis"],
                ["Tinggi", "Tinggi"],
                ["Sedang", "Sedang"],
                ["Rendah", "Rendah"],
              ] as const
            ).map(([pVal, pLabel]) => {
              const active = selectedPriority === pVal;
              return (
                <button
                  key={pVal}
                  type="button"
                  onClick={() => {
                    setSelectedPriority(pVal);
                    setCurrentPage(1);
                  }}
                  className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-colors ${
                    active
                      ? "bg-ink text-white"
                      : "bg-bg text-ink-soft hover:bg-line border border-line"
                  }`}
                >
                  {pLabel}
                </button>
              );
            })}

            {/* Reset Button */}
            {(selectedStatus !== "semua" ||
              selectedDisaster !== "semua" ||
              selectedPriority !== "semua" ||
              searchCode) && (
              <button
                type="button"
                onClick={resetFilters}
                className="ml-2 text-primary-text font-semibold hover:underline text-xs"
              >
                Atur Ulang
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Tabel Laporan Utama (design-admin.md 5.2 & 7.9) */}
      <section className="bg-surface border border-line rounded-md shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-bg font-semibold text-ink-muted uppercase border-b border-line">
              <tr>
                <th scope="col" className="py-3 px-4 w-28">
                  Prioritas
                </th>
                <th scope="col" className="py-3 px-4 w-32">
                  Kode Tracking
                </th>
                <th scope="col" className="py-3 px-4 w-32">
                  Jenis
                </th>
                <th scope="col" className="py-3 px-4">
                  Judul & Lokasi Kejadian
                </th>
                <th scope="col" className="py-3 px-4 w-28">
                  Status
                </th>
                <th scope="col" className="py-3 px-4 w-28">
                  Konfirmasi
                </th>
                <th scope="col" className="py-3 px-4 w-32">
                  Waktu Masuk
                </th>
                <th scope="col" className="py-3 px-4 w-28 text-right">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-ink-muted">
                    <RefreshCw className="w-6 h-6 animate-spin text-primary mx-auto mb-2" />
                    <p className="font-semibold text-ink">Memuat Laporan dari Supabase...</p>
                  </td>
                </tr>
              ) : paginatedReports.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-ink-muted">
                    <Filter className="w-8 h-8 text-ink-muted mx-auto mb-2 opacity-60" />
                    <p className="font-semibold text-ink">Tidak ada laporan yang sesuai filter</p>
                    <p className="text-xs text-ink-soft mt-1">Coba atur ulang filter pencarian Anda.</p>
                    <button
                      type="button"
                      onClick={resetFilters}
                      className="mt-3 px-3 py-1.5 rounded-md bg-ink text-white font-semibold text-xs"
                    >
                      Atur Ulang Filter
                    </button>
                  </td>
                </tr>
              ) : (
                paginatedReports.map((row) => (
                  <tr
                    key={row.id}
                    className="hover:bg-bg/60 transition-colors h-14"
                  >
                    {/* Prioritas */}
                    <td className="py-3 px-4">
                      <PriorityBadge priority={row.priority} />
                    </td>

                    {/* Kode Tracking */}
                    <td className="py-3 px-4 font-mono font-bold text-primary-text">
                      {row.tracking_code}
                    </td>

                    {/* Jenis Bencana */}
                    <td className="py-3 px-4">
                      <span className="capitalize font-semibold text-ink flex items-center gap-1.5">
                        {getDisasterIcon(row.disaster_type)}
                        {row.disaster_type}
                      </span>
                    </td>

                    {/* Judul & Lokasi */}
                    <td className="py-3 px-4 max-w-xs sm:max-w-md">
                      <p className="font-semibold text-ink truncate leading-snug">
                        {row.title}
                      </p>
                      <p className="text-[11px] text-ink-muted truncate mt-0.5">
                        📍 {row.location}
                      </p>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                          row.status === "diterima"
                            ? "bg-info-soft text-info-text border border-info/30"
                            : row.status === "diverifikasi"
                            ? "bg-info-soft text-info-text font-extrabold border border-info"
                            : row.status === "ditindaklanjuti"
                            ? "bg-warning-soft text-warning-text border border-warning"
                            : row.status === "selesai"
                            ? "bg-success-soft text-success-text border border-success"
                            : "bg-danger-soft text-danger-text border border-danger"
                        }`}
                      >
                        {row.status}
                      </span>
                    </td>

                    {/* Konfirmasi Warga */}
                    <td className="py-3 px-4">
                      <span className="font-semibold text-primary flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        {row.confirmation_count} Warga
                      </span>
                    </td>

                    {/* Waktu Masuk */}
                    <td className="py-3 px-4 text-ink-muted text-[11px]">
                      {row.time}
                    </td>

                    {/* Aksi -> Buka Detail /admin/laporan/[id] */}
                    <td className="py-3 px-4 text-right">
                      <Link
                        href={`/admin/laporan/${row.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-primary-action hover:bg-primary-action-hover text-white font-semibold text-xs transition-colors shadow-xs"
                      >
                        <span>Kelola</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Paginasi Bawah (design-admin.md 5.2) */}
        {!isLoading && totalItems > 0 && (
          <div className="p-4 border-t border-line flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-ink-muted">
            <p>
              Menampilkan{" "}
              <strong className="text-ink">
                {(currentPage - 1) * PAGE_SIZE + 1} -{" "}
                {Math.min(currentPage * PAGE_SIZE, totalItems)}
              </strong>{" "}
              dari <strong className="text-ink">{totalItems}</strong> laporan
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 rounded-md border border-line bg-surface hover:bg-bg disabled:opacity-40 disabled:hover:bg-surface font-semibold text-ink inline-flex items-center gap-1 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Sebelumnya</span>
              </button>
              <span className="font-bold text-ink px-2">
                {currentPage} / {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 rounded-md border border-line bg-surface hover:bg-bg disabled:opacity-40 disabled:hover:bg-surface font-semibold text-ink inline-flex items-center gap-1 transition-colors"
              >
                <span>Berikutnya</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

export default function AdminLaporanPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[400px] text-ink-muted text-sm">
          <p>Memuat Antrean Laporan Bencana...</p>
        </div>
      }
    >
      <LaporanContent />
    </Suspense>
  );
}

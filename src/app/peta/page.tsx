"use client";

import React, { useState, useMemo, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import {
  MapPin,
  Layers,
  List,
  Map as MapIcon,
  Clock,
  AlertCircle,
  ExternalLink,
  Search,
  Navigation,
  ArrowUpDown,
  ThumbsUp,
  Waves,
  Mountain,
  Flame,
  AlertTriangle,
} from "lucide-react";
import { MapFilter } from "@/components/peta/MapFilter";
import type { MapPoint } from "@/components/peta/DisasterMap";
import type { DisasterType, ReportStatus } from "@/types";
import { supabase } from "@/lib/supabase/client";
import {
  fetchLiveReports,
  reportsToMapPoints,
  DEFAULT_MOCK_REPORTS,
} from "@/lib/services/reports";
import { fetchLiveSosAlerts } from "@/lib/services/sos";

// Dynamic import for Leaflet client component (avoid SSR window error)
const DisasterMap = dynamic(() => import("@/components/peta/DisasterMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[550px] md:h-[650px] rounded-lg bg-bg border border-line flex flex-col items-center justify-center text-ink-muted animate-pulse">
      <MapPin className="w-8 h-8 mb-2 text-primary" />
      <p className="text-sm font-semibold text-ink">Memuat Peta Kejadian Bencana...</p>
      <p className="text-xs text-ink-muted mt-1">Mengunduh data geospasial OpenStreetMap</p>
    </div>
  ),
});

const INITIAL_POINTS: MapPoint[] = reportsToMapPoints(DEFAULT_MOCK_REPORTS);

function PetaContent() {
  const searchParams = useSearchParams();
  const urlKode = searchParams.get("kode");
  const urlLat = searchParams.get("lat");
  const urlLng = searchParams.get("lng");

  const [points, setPoints] = useState<MapPoint[]>(INITIAL_POINTS);
  const [isLiveConnected, setIsLiveConnected] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<"peta" | "daftar">("peta");
  const [selectedCategory, setSelectedCategory] = useState<DisasterType | "semua">("semua");
  const [selectedStatus, setSelectedStatus] = useState<ReportStatus | "semua">("semua");
  const [selectedRegion, setSelectedRegion] = useState<string>("Semua Wilayah");
  const [showSos, setShowSos] = useState<boolean>(true);
  const [selectedPoint, setSelectedPoint] = useState<MapPoint | null>(null);

  // State untuk pencarian & pengurutan di Tampilan Daftar
  const [listSearch, setListSearch] = useState<string>("");
  const [listSort, setListSort] = useState<"terbaru" | "vouch">("terbaru");

  // Fokus otomatis ke titik jika terdapat query param kode/koordinat
  useEffect(() => {
    if (!urlKode && !urlLat) return;

    let target = points.find(
      (p) => urlKode && p.tracking_code?.toUpperCase() === urlKode.toUpperCase()
    );

    if (!target && urlLat && urlLng) {
      const latNum = parseFloat(urlLat);
      const lngNum = parseFloat(urlLng);
      if (!isNaN(latNum) && !isNaN(lngNum)) {
        target = points.find(
          (p) => Math.abs(p.lat - latNum) < 0.002 && Math.abs(p.lng - lngNum) < 0.002
        );
        if (!target) {
          const focusedPoint: MapPoint = {
            id: `focus-${urlKode || "target"}`,
            tracking_code: urlKode || "TITIK-BENCANA",
            disaster_type: "banjir",
            title: `Lokasi Kejadian Laporan (${urlKode || "Terpantau"})`,
            location_name: "Titik Lokasi Bencana",
            lat: latNum,
            lng: lngNum,
            status: "ditindaklanjuti",
            created_at: "Terpantau",
            confirmation_count: 1,
            is_demo: false,
          };
          setPoints((prev) => [focusedPoint, ...prev]);
          target = focusedPoint;
        }
      }
    }

    if (target) {
      setSelectedPoint(target);
      setViewMode("peta");
      if (selectedCategory !== "semua" && target.disaster_type !== selectedCategory) {
        setSelectedCategory("semua");
      }
      if (selectedStatus !== "semua" && target.status !== selectedStatus) {
        setSelectedStatus("semua");
      }
      if (selectedRegion !== "Semua Wilayah" && target.province && target.province !== selectedRegion) {
        setSelectedRegion("Semua Wilayah");
      }
    }
  }, [urlKode, urlLat, urlLng, points, selectedCategory, selectedStatus, selectedRegion]);

  // Ambil data live dari Supabase/service dan pasang realtime listener
  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        const liveReports = await fetchLiveReports();
        const liveSos = await fetchLiveSosAlerts();

        const reportPoints = (liveReports && liveReports.length > 0)
          ? reportsToMapPoints(liveReports)
          : INITIAL_POINTS;

        // Map live SOS alerts into MapPoints
        const activeSos: MapPoint[] = (liveSos || [])
          .filter((s) => s.status === "aktif")
          .map((s) => ({
            id: s.id,
            tracking_code: s.id.startsWith("SOS") ? s.id : `SOS-${s.id.slice(0, 4).toUpperCase()}`,
            disaster_type: (s.assistance_type === "damkar" ? "kebakaran" : "lainnya") as DisasterType,
            title: `Panggilan Darurat: Bantuan ${s.assistance_type.toUpperCase()}`,
            location_name: s.address,
            lat: s.lat,
            lng: s.lng,
            status: "ditindaklanjuti" as ReportStatus,
            created_at: s.time_ago || "Baru saja",
            confirmation_count: 1,
            is_sos: true,
            is_demo: false,
            province: s.address.includes("Jakarta") ? "DKI Jakarta" : "Jawa Barat",
          }));

        // Gabungkan tanpa duplikasi ID atau tracking code
        const merged: MapPoint[] = [...activeSos];
        for (const pt of reportPoints) {
          if (!merged.some((m) => m.id === pt.id || (m.tracking_code && pt.tracking_code && m.tracking_code === pt.tracking_code))) {
            merged.push(pt);
          }
        }

        if (isMounted) {
          setPoints(merged);
          setIsLiveConnected(true);
        }
      } catch (err) {
        console.warn("Gagal memuat data live peta:", err);
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
      .channel("public_peta_reports_realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "reports" }, handleSync)
      .subscribe();

    const channelSos = supabase
      .channel("public_peta_sos_realtime")
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
  }, []);

  // Filter points based on category, status, region, and SOS toggle
  const filteredPoints = useMemo(() => {
    return points.filter((pt) => {
      if (pt.is_sos && !showSos) return false;
      if (!pt.is_sos) {
        if (selectedCategory !== "semua" && pt.disaster_type !== selectedCategory) {
          return false;
        }
        if (selectedStatus !== "semua" && pt.status !== selectedStatus) {
          return false;
        }
        if (selectedRegion !== "Semua Wilayah" && pt.province !== selectedRegion) {
          return false;
        }
      }
      return true;
    });
  }, [points, selectedCategory, selectedStatus, selectedRegion, showSos]);

  // Data terfilter untuk Mode Tampilan Daftar (pencarian kata kunci + sortir)
  const displayedListPoints = useMemo(() => {
    let list = [...filteredPoints];
    if (listSearch.trim()) {
      const q = listSearch.toLowerCase().trim();
      list = list.filter(
        (p) =>
          p.title?.toLowerCase().includes(q) ||
          p.location_name?.toLowerCase().includes(q) ||
          p.tracking_code?.toLowerCase().includes(q) ||
          p.disaster_type?.toLowerCase().includes(q)
      );
    }
    if (listSort === "vouch") {
      list.sort((a, b) => (b.confirmation_count || 0) - (a.confirmation_count || 0));
    }
    return list;
  }, [filteredPoints, listSearch, listSort]);

  // Pada tampilan mobile (< 768px), pastikan selalu menggunakan tampilan peta yang rapi dan interaktif
  useEffect(() => {
    const handleResize = () => {
      if (typeof window !== "undefined" && window.innerWidth < 768) {
        setViewMode("peta");
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Navigasi langsung dari Daftar Kejadian ke Titik Peta
  const handleOpenInMap = (item: MapPoint) => {
    setSelectedPoint(item);
    setViewMode("peta");
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 120, behavior: "smooth" });
    }
  };

  const getStatusBadge = (status: ReportStatus) => {
    switch (status) {
      case "diterima":
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-info-soft text-info-text">Diterima</span>;
      case "diverifikasi":
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-info-soft text-info-text">Diverifikasi</span>;
      case "ditindaklanjuti":
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-warning-soft text-warning-text">Ditindaklanjuti</span>;
      case "selesai":
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-success-soft text-success-text">Selesai</span>;
      case "ditolak":
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-danger-soft text-danger-text">Ditolak</span>;
    }
  };

  return (
    <main className="flex-1 w-full max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-6 pb-28 md:pb-12 flex flex-col space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-line">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl md:text-2xl font-bold text-ink flex items-center gap-2">
              <Layers className="w-6 h-6 text-primary" />
              <span>Peta Bencana Publik Terbuka</span>
            </h1>
            <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded bg-amber-500/10 text-amber-700 border border-amber-300">
              MODE DEMO / DATA SIMULASI
            </span>
          </div>
          <p className="text-xs text-ink-soft mt-0.5">
            Sebaran informasi kebencanaan dan titik panggilan darurat SOS secara interaktif dan real-time.
          </p>
        </div>

        {/* View Mode Switcher (Peta vs Daftar) - Disembunyikan di mobile agar tampilan peta tetap fokus dan rapi */}
        <div className="hidden md:flex items-center gap-2">
          <div
            role="tablist"
            aria-label="Mode Tampilan Peta atau Daftar"
            className="flex items-center p-1 bg-surface border border-line rounded-lg text-xs font-semibold shadow-sm"
          >
            <button
              type="button"
              role="tab"
              aria-selected={viewMode === "peta"}
              onClick={() => setViewMode("peta")}
              className={`h-9 px-3.5 rounded-md flex items-center gap-1.5 transition-all min-h-[36px] ${
                viewMode === "peta"
                  ? "bg-primary text-white shadow-sm font-bold"
                  : "text-ink-soft hover:text-ink hover:bg-bg"
              }`}
            >
              <MapIcon className="w-4 h-4" />
              <span>Tampilan Peta</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={viewMode === "daftar"}
              onClick={() => setViewMode("daftar")}
              className={`h-9 px-3.5 rounded-md flex items-center gap-1.5 transition-all min-h-[36px] ${
                viewMode === "daftar"
                  ? "bg-primary text-white shadow-sm font-bold"
                  : "text-ink-soft hover:text-ink hover:bg-bg"
              }`}
            >
              <List className="w-4 h-4" />
              <span>Tampilan Daftar ({filteredPoints.length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Filter Sidebar + Content (Map / List) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Left Filter Sidebar (Desktop 3 cols, Mobile 1 col) */}
        <div className="lg:col-span-3 space-y-4">
          <MapFilter
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            selectedStatus={selectedStatus}
            onSelectStatus={setSelectedStatus}
            selectedRegion={selectedRegion}
            onSelectRegion={setSelectedRegion}
            showSos={showSos}
            onToggleSos={() => setShowSos((prev) => !prev)}
            totalVisible={filteredPoints.length}
          />

          {/* Selected Point Quick Details card */}
          {selectedPoint && viewMode === "peta" && (
            <div className="bg-surface border border-line rounded-lg p-4 shadow-card">
              <span className="text-[11px] font-bold uppercase tracking-wider text-ink-muted">
                Titik Terpilih
              </span>
              <h4 className="text-sm font-bold text-ink mt-1">
                {selectedPoint.title}
              </h4>
              <p className="text-xs text-ink-soft mt-1 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                <span>{selectedPoint.location_name}</span>
              </p>
              <div className="mt-3 pt-2 border-t border-line flex items-center justify-between">
                <span className="text-xs font-mono text-primary font-bold">
                  {selectedPoint.tracking_code}
                </span>
                {!selectedPoint.is_sos && (
                  <Link
                    href={`/lacak?kode=${selectedPoint.tracking_code}`}
                    className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1"
                  >
                    <span>Detail Lacak</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Content Container (Desktop 9 cols) */}
        <div className="lg:col-span-9">
          {viewMode === "peta" ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-ink-muted px-1">
                <span className="flex items-center gap-1 font-medium">
                  <MapPin className="w-3.5 h-3.5 text-primary" />
                  <span>Klik pada pin di peta untuk membuka ringkasan status kejadian</span>
                </span>
                <button
                  type="button"
                  onClick={() => setViewMode("daftar")}
                  className="hidden md:flex text-primary hover:underline font-semibold items-center gap-1 shrink-0"
                >
                  <List className="w-3.5 h-3.5" />
                  <span>Beralih ke Tampilan Daftar</span>
                </button>
              </div>

              <div className="h-[550px] md:h-[650px] rounded-lg overflow-hidden border border-line shadow-card">
                <DisasterMap
                  points={filteredPoints}
                  selectedPointId={selectedPoint?.id}
                  onSelectPoint={(pt) => setSelectedPoint(pt)}
                />
              </div>
            </div>
          ) : (
            // LIST VIEW ALTERNATIVE (Hanya aktif di desktop jika viewMode === "daftar")
            <div className="hidden md:block space-y-4">
              {/* Header List Controls: Search & Sort */}
              <div className="bg-surface border border-line rounded-lg p-3.5 shadow-card space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-ink-muted absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={listSearch}
                      onChange={(e) => setListSearch(e.target.value)}
                      placeholder="Cari judul, lokasi, atau kode laporan (contoh: Semanan, LPR-...)"
                      className="w-full h-10 pl-9 pr-3 text-xs md:text-sm bg-bg border border-line rounded-md text-ink placeholder:text-ink-muted focus:outline-none focus:border-primary"
                    />
                    {listSearch && (
                      <button
                        type="button"
                        onClick={() => setListSearch("")}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-ink-muted hover:text-ink"
                      >
                        Batal
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-ink-muted flex items-center gap-1">
                      <ArrowUpDown className="w-3.5 h-3.5" />
                      <span>Urutkan:</span>
                    </span>
                    <select
                      value={listSort}
                      onChange={(e) => setListSort(e.target.value as "terbaru" | "vouch")}
                      className="h-10 px-2.5 text-xs bg-bg border border-line rounded-md text-ink font-semibold focus:outline-none focus:border-primary"
                    >
                      <option value="terbaru">Terbaru Masuk</option>
                      <option value="vouch">Konfirmasi Warga Terbanyak</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-ink-muted pt-2 border-t border-line">
                  <span>
                    Menampilkan <strong>{displayedListPoints.length}</strong> dari {filteredPoints.length} kejadian bencana
                  </span>
                  <button
                    type="button"
                    onClick={() => setViewMode("peta")}
                    className="text-primary hover:underline font-semibold flex items-center gap-1 shrink-0"
                  >
                    <MapIcon className="w-3.5 h-3.5" />
                    <span>Kembali ke Tampilan Peta</span>
                  </button>
                </div>
              </div>

              {/* List Cards Grid */}
              {displayedListPoints.length === 0 ? (
                <div className="p-12 text-center bg-surface border border-line rounded-lg space-y-3">
                  <AlertCircle className="w-9 h-9 text-ink-muted mx-auto" />
                  <p className="text-sm font-bold text-ink">Tidak ada kejadian yang cocok</p>
                  <p className="text-xs text-ink-soft max-w-sm mx-auto">
                    {listSearch
                      ? `Tidak ditemukan hasil pencarian untuk "${listSearch}". Coba gunakan kata kunci lain.`
                      : "Coba sesuaikan filter kategori, status, atau wilayah di bilah sebelah kiri."}
                  </p>
                  {listSearch && (
                    <button
                      type="button"
                      onClick={() => setListSearch("")}
                      className="px-4 py-2 text-xs font-semibold bg-primary text-white rounded-md hover:bg-primary-hover transition-colors"
                    >
                      Bersihkan Pencarian
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {displayedListPoints.map((item) => (
                    <div
                      key={item.id}
                      className="bg-surface border border-line rounded-lg p-4 shadow-card hover:border-primary/50 transition-all flex flex-col justify-between space-y-3.5"
                    >
                      <div className="space-y-2.5">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-mono text-xs font-bold text-primary">
                              {item.tracking_code}
                            </span>
                            {item.is_demo && (
                              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-primary-soft text-primary-hover">
                                Demo
                              </span>
                            )}
                            {item.is_sos && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-danger-soft text-danger animate-pulse">
                                Darurat SOS
                              </span>
                            )}
                            <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-bg text-ink-soft border border-line uppercase">
                              {item.disaster_type}
                            </span>
                          </div>
                          {getStatusBadge(item.status)}
                        </div>

                        <h3 className="text-sm font-bold text-ink leading-snug">
                          {item.title}
                        </h3>

                        <p className="text-xs text-ink-soft flex items-start gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                          <span className="line-clamp-2">{item.location_name}</span>
                        </p>
                      </div>

                      <div className="pt-3 border-t border-line space-y-2">
                        <div className="flex items-center justify-between text-xs text-ink-muted">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>{item.created_at}</span>
                          </span>
                          {item.confirmation_count ? (
                            <span className="flex items-center gap-1 font-semibold text-ink">
                              <ThumbsUp className="w-3 h-3 text-primary" />
                              <span>{item.confirmation_count} Warga Mengonfirmasi</span>
                            </span>
                          ) : null}
                        </div>

                        {/* Card Action Buttons */}
                        <div className="flex items-center justify-between gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => handleOpenInMap(item)}
                            className="h-8 px-3 rounded-md text-xs font-semibold border border-primary/30 text-primary hover:bg-primary-soft transition-colors flex items-center gap-1.5 min-h-[32px]"
                          >
                            <MapPin className="w-3.5 h-3.5" />
                            <span>Lihat di Peta</span>
                          </button>

                          {!item.is_sos ? (
                            <Link
                              href={`/lacak?kode=${item.tracking_code}`}
                              className="h-8 px-3 rounded-md text-xs font-semibold bg-primary hover:bg-primary-hover text-white transition-colors inline-flex items-center gap-1.5 min-h-[32px]"
                            >
                              <span>Detail &amp; Lacak</span>
                              <ExternalLink className="w-3 h-3" />
                            </Link>
                          ) : (
                            <span className="text-xs font-bold text-danger px-2 py-1 rounded bg-danger-soft">
                              Panggilan Darurat
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

export default function PetaPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full h-96 flex flex-col items-center justify-center text-ink-muted">
          <MapPin className="w-8 h-8 mb-2 text-primary animate-bounce" />
          <p className="text-sm font-semibold text-ink">Menyiapkan Peta Bencana...</p>
        </div>
      }
    >
      <PetaContent />
    </Suspense>
  );
}

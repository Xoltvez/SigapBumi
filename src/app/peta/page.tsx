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
  Compass,
  Crosshair,
  SlidersHorizontal,
  Plus,
  Minus,
  Sun,
  ChevronDown,
  ChevronUp,
  X,
  RotateCw,
  CheckCircle2,
  Building2,
  Phone,
  Share2,
  Maximize2,
  ShieldCheck,
  Siren,
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
import DisasterIcon, { getDisasterLabel } from "@/components/common/DisasterIcon";

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

  // State khusus drawer & filter mobile
  const [isMobileSheetOpen, setIsMobileSheetOpen] = useState(false);

  // State khusus tampilan desktop modern sesuai referensi
  const [desktopSearch, setDesktopSearch] = useState<string>("");
  const [desktopFilterCategory, setDesktopFilterCategory] = useState<"semua" | "posko" | "laporan" | "sos">("semua");
  const [isDesktopPanelOpen, setIsDesktopPanelOpen] = useState<boolean>(true);

  // Helper trigger action peta Leaflet di mobile / desktop
  const triggerZoomIn = () => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("sigapbumi:map-zoom-in"));
    }
  };
  const triggerZoomOut = () => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("sigapbumi:map-zoom-out"));
    }
  };
  const triggerLocate = () => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("sigapbumi:map-locate"));
    }
  };
  const triggerCompass = () => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("sigapbumi:map-reset-view"));
    }
  };

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

  // Data terfilter untuk Mode Desktop Modern (sesuai referensi desain)
  const desktopPoints = useMemo(() => {
    let list = [...points];

    if (desktopFilterCategory === "sos") {
      list = list.filter((p) => p.is_sos);
    } else if (desktopFilterCategory === "posko") {
      list = list.filter(
        (p) =>
          p.title.toLowerCase().includes("posko") ||
          p.location_name.toLowerCase().includes("balai") ||
          p.location_name.toLowerCase().includes("gor") ||
          p.location_name.toLowerCase().includes("masjid") ||
          p.location_name.toLowerCase().includes("pos") ||
          p.location_name.toLowerCase().includes("kantor")
      );
    } else if (desktopFilterCategory === "laporan") {
      list = list.filter((p) => !p.is_sos);
    }

    if (desktopSearch.trim()) {
      const q = desktopSearch.toLowerCase().trim();
      list = list.filter(
        (p) =>
          p.title?.toLowerCase().includes(q) ||
          p.location_name?.toLowerCase().includes(q) ||
          p.tracking_code?.toLowerCase().includes(q) ||
          p.disaster_type?.toLowerCase().includes(q)
      );
    }

    return list;
  }, [points, desktopFilterCategory, desktopSearch]);

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
    <>
      {/* ========================================================= */}
      {/* 1. TAMPILAN MOBILE: EDGE-TO-EDGE FULL SCREEN MAP + BOTTOM SHEET */}
      {/* ========================================================= */}
      <div className="md:hidden fixed inset-0 bottom-16 z-10 w-full overflow-hidden bg-slate-100 select-none">
        {/* Peta Layar Penuh */}
        <div className="absolute inset-0 w-full h-full z-0">
          <DisasterMap
            className="w-full h-full"
            points={filteredPoints}
            selectedPointId={selectedPoint?.id}
            onSelectPoint={(pt) => {
              setSelectedPoint(pt);
              setIsMobileSheetOpen(true);
            }}
            showLegend={false}
          />
        </div>

        {/* Floating Right Control Stack (Kompas, Lokasi Saya, Filter, Zoom) */}
        <div className="absolute top-3 right-3 z-30 flex flex-col items-center gap-2 pointer-events-auto">
          {/* Kompas */}
          <button
            type="button"
            onClick={triggerCompass}
            className="w-10 h-10 rounded-full bg-white/95 backdrop-blur-xs text-slate-700 shadow-md border border-slate-200/90 flex items-center justify-center active:scale-95 transition-transform cursor-pointer"
            title="Reset Arah Kompas & Tampilan"
          >
            <Compass className="w-5 h-5 text-red-500" />
          </button>

          {/* Lokasi Saya */}
          <button
            type="button"
            onClick={triggerLocate}
            className="w-10 h-10 rounded-full bg-white/95 backdrop-blur-xs text-slate-700 shadow-md border border-slate-200/90 flex items-center justify-center active:scale-95 transition-transform cursor-pointer"
            title="Pusatkan ke Lokasi Saya"
          >
            <Crosshair className="w-5 h-5 text-blue-600" />
          </button>

          {/* Toggle Filter Bottom Sheet */}
          <button
            type="button"
            onClick={() => setIsMobileSheetOpen((prev) => !prev)}
            className={`w-10 h-10 rounded-full shadow-md border flex items-center justify-center active:scale-95 transition-transform cursor-pointer ${
              selectedCategory !== "semua" || selectedStatus !== "semua" || selectedRegion !== "Semua Wilayah"
                ? "bg-orange-500 text-white border-orange-600"
                : "bg-white/95 backdrop-blur-xs text-slate-700 border-slate-200/90"
            }`}
            title="Buka / Tutup Filter Peta"
          >
            <SlidersHorizontal className="w-4.5 h-4.5" />
          </button>

          {/* Zoom In & Zoom Out Stack */}
          <div className="flex flex-col rounded-xl overflow-hidden shadow-md border border-slate-200/90 bg-white/95 backdrop-blur-xs">
            <button
              type="button"
              onClick={triggerZoomIn}
              className="w-10 h-10 flex items-center justify-center text-slate-700 hover:bg-slate-50 border-b border-slate-100 active:scale-95 transition-transform cursor-pointer"
              title="Perbesar Peta"
            >
              <Plus className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={triggerZoomOut}
              className="w-10 h-10 flex items-center justify-center text-slate-700 hover:bg-slate-50 active:scale-95 transition-transform cursor-pointer"
              title="Perkecil Peta"
            >
              <Minus className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Floating Weather Widget (Kiri Bawah di atas Bottom Sheet) */}
        <div
          className={`absolute left-3 z-30 transition-all duration-300 pointer-events-auto ${
            isMobileSheetOpen ? "bottom-72" : "bottom-24"
          }`}
        >
          <div className="bg-white/95 backdrop-blur-md rounded-2xl p-2.5 px-3.5 shadow-lg border border-slate-200/80 flex flex-col">
            <div className="flex items-center gap-1.5 text-amber-500 font-extrabold text-sm leading-none">
              <Sun className="w-4 h-4 text-amber-500 fill-amber-400" />
              <span className="text-slate-900 font-extrabold">32°C</span>
            </div>
            <span className="text-[10px] text-slate-500 font-medium mt-1 leading-none">
              Cerah Berawan
            </span>
          </div>
        </div>

        {/* Floating Bottom Sheet (Filter & Info Titik di Bawah) */}
        <div
          className={`absolute inset-x-0 bottom-0 z-30 bg-white rounded-t-3xl shadow-[0_-8px_24px_rgba(0,0,0,0.14)] border-t border-slate-200/80 transition-all duration-300 flex flex-col ${
            isMobileSheetOpen ? "max-h-[68vh]" : "max-h-[76px]"
          }`}
        >
          {/* Handle Bar Drag Pill */}
          <div
            onClick={() => setIsMobileSheetOpen((prev) => !prev)}
            className="pt-2 pb-1 flex flex-col items-center cursor-pointer select-none"
          >
            <div className="w-11 h-1.5 bg-slate-300 rounded-full" />
          </div>

          {/* Header Bottom Sheet */}
          <div className="px-4 py-2 flex items-center justify-between gap-3 border-b border-slate-100">
            {selectedPoint ? (
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="text-[10px] font-bold font-mono px-2 py-0.5 bg-slate-100 text-slate-800 rounded">
                    {selectedPoint.tracking_code}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      selectedPoint.is_sos
                        ? "bg-rose-100 text-rose-700"
                        : selectedPoint.status === "selesai"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {selectedPoint.is_sos ? "SOS DARURAT" : selectedPoint.status}
                  </span>
                </div>
                <h4 className="text-xs font-bold text-slate-900 truncate">
                  {selectedPoint.title}
                </h4>
                <p className="text-[10px] text-slate-500 truncate flex items-center gap-1">
                  <MapPin className="w-3 h-3 shrink-0 text-slate-400" />
                  <span>{selectedPoint.location_name}</span>
                </p>
                {!selectedPoint.is_sos && (
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] font-semibold text-slate-700 flex items-center gap-1">
                      <DisasterIcon type={selectedPoint.disaster_type} size={14} />
                      <span>{getDisasterLabel(selectedPoint.disaster_type)}</span>
                    </span>
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded border border-slate-200 bg-white text-[9px] font-semibold text-slate-700">
                      <ThumbsUp className="w-2.5 h-2.5 text-orange-500" />
                      <span>{selectedPoint.confirmation_count} Terkonfirmasi</span>
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold text-slate-900">
                    Filter Peta Kejadian
                  </h4>
                  <span className="text-[10px] font-bold bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
                    {filteredPoints.length} Titik
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 truncate mt-0.5">
                  {selectedCategory !== "semua" ? `Bencana: ${selectedCategory}` : "Semua Kategori"} • {selectedRegion}
                </p>
              </div>
            )}

            <div className="flex items-center gap-1 shrink-0">
              {selectedPoint && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedPoint(null);
                  }}
                  className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer"
                  title="Tutup Titik Terpilih"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsMobileSheetOpen((prev) => !prev)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-600 cursor-pointer"
                title={isMobileSheetOpen ? "Tutup Sheet" : "Buka Sheet"}
              >
                {isMobileSheetOpen ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronUp className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Body Konten Bottom Sheet (Saat Di-expand) */}
          <div className={`overflow-y-auto p-4 space-y-3.5 ${isMobileSheetOpen ? "block" : "hidden"}`}>
            {selectedPoint && (
              <div className="space-y-2 pb-2 border-b border-slate-100">
                <a
                  href={`https://www.google.com/maps?q=${selectedPoint.lat},${selectedPoint.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full h-9 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold inline-flex items-center justify-center gap-1.5 shadow-2xs"
                >
                  <Navigation className="w-3.5 h-3.5 text-blue-600" />
                  <span>Buka Navigasi Rute Google Maps</span>
                </a>

                {!selectedPoint.is_sos && (
                  <Link
                    href={`/lacak?kode=${selectedPoint.tracking_code}`}
                    className="w-full h-8.5 rounded-xl border border-primary/30 bg-primary-soft text-primary text-xs font-semibold inline-flex items-center justify-center gap-1.5"
                  >
                    <span>Detail &amp; Lacak Laporan</span>
                    <ExternalLink className="w-3.5 h-3.5 text-primary" />
                  </Link>
                )}
              </div>
            )}

            {/* Panel Filter Geospasial Mobile */}
            <div className="space-y-2.5">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Saring Kategori &amp; Wilayah
              </span>

              <div className="grid grid-cols-2 gap-2">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value as DisasterType | "semua")}
                  className="h-8.5 px-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-700"
                >
                  <option value="semua">Semua Bencana</option>
                  <option value="banjir">Banjir</option>
                  <option value="longsor">Tanah Longsor</option>
                  <option value="kebakaran">Kebakaran</option>
                  <option value="gempa">Gempa Bumi</option>
                  <option value="karhutla">Karhutla</option>
                  <option value="lainnya">Lainnya</option>
                </select>

                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value as ReportStatus | "semua")}
                  className="h-8.5 px-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-700"
                >
                  <option value="semua">Semua Status</option>
                  <option value="diterima">Diterima</option>
                  <option value="diverifikasi">Diverifikasi</option>
                  <option value="ditindaklanjuti">Ditindaklanjuti</option>
                  <option value="selesai">Selesai</option>
                </select>
              </div>

              <select
                value={selectedRegion}
                onChange={(e) => setSelectedRegion(e.target.value)}
                className="w-full h-8.5 px-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-700"
              >
                <option value="Semua Wilayah">Semua Wilayah</option>
                <option value="DKI Jakarta">DKI Jakarta</option>
                <option value="Jawa Barat">Jawa Barat</option>
                <option value="Jawa Tengah">Jawa Tengah</option>
                <option value="Jawa Timur">Jawa Timur</option>
                <option value="DI Yogyakarta">DI Yogyakarta</option>
                <option value="Banten">Banten</option>
                <option value="Bali">Bali</option>
                <option value="Sumatera Barat">Sumatera Barat</option>
                <option value="Sulawesi Selatan">Sulawesi Selatan</option>
              </select>

              {/* Toggle SOS Darurat */}
              <label className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
                <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping" />
                  <span>Tampilkan Sinyal SOS Darurat</span>
                </span>
                <input
                  type="checkbox"
                  checked={showSos}
                  onChange={(e) => setShowSos(e.target.checked)}
                  className="w-4 h-4 accent-rose-600 rounded"
                />
              </label>

              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategory("semua");
                    setSelectedStatus("semua");
                    setSelectedRegion("Semua Wilayah");
                    setShowSos(true);
                  }}
                  className="text-xs font-bold text-orange-600 hover:underline cursor-pointer"
                >
                  Reset Filter
                </button>
                <span className="text-xs font-semibold text-slate-500">
                  {filteredPoints.length} titik aktif
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 2. TAMPILAN DESKTOP (MD KE ATAS): INTERACTIVE COMMAND MAP  */}
      {/* ========================================================= */}
      <main className="hidden md:block relative w-full h-[calc(100vh-4rem)] overflow-hidden bg-slate-900 select-none">
        {/* Kanvas Peta Layar Penuh */}
        <div className="absolute inset-0 w-full h-full z-0">
          <DisasterMap
            className="w-full h-full"
            points={desktopPoints}
            selectedPointId={selectedPoint?.id}
            onSelectPoint={(pt) => setSelectedPoint(pt)}
            showLegend={false}
          />
        </div>

        {/* Kiri Atas: Floating Search Bar & Quick Filter Chips */}
        <div className="absolute top-5 left-6 z-20 space-y-2.5">
          {/* Search Bar Melayang */}
          <div className="bg-white/95 backdrop-blur-md shadow-lg border border-slate-200/90 rounded-full px-4 py-2.5 flex items-center gap-2.5 w-[380px] lg:w-[420px]">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              type="text"
              value={desktopSearch}
              onChange={(e) => setDesktopSearch(e.target.value)}
              placeholder="Cari posko, balai desa, atau jalan di sekitar..."
              className="w-full bg-transparent text-xs lg:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none"
            />
            {desktopSearch ? (
              <button
                type="button"
                onClick={() => setDesktopSearch("")}
                className="text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            ) : (
              <SlidersHorizontal className="w-4 h-4 text-slate-400" />
            )}
          </div>

          {/* Quick Filter Chips Horizontal */}
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-0.5 max-w-[420px]">
            <button
              type="button"
              onClick={() => setDesktopFilterCategory("semua")}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 shrink-0 cursor-pointer ${
                desktopFilterCategory === "semua"
                  ? "bg-[#1E4D48] text-white ring-2 ring-emerald-600/30"
                  : "bg-white/95 text-slate-700 hover:bg-slate-50 border border-slate-200/80"
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Semua Posko Aktif</span>
            </button>

            <button
              type="button"
              onClick={() => setDesktopFilterCategory("posko")}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 shrink-0 cursor-pointer ${
                desktopFilterCategory === "posko"
                  ? "bg-[#1E4D48] text-white ring-2 ring-emerald-600/30"
                  : "bg-white/95 text-slate-700 hover:bg-slate-50 border border-slate-200/80"
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Posko Saya</span>
            </button>

            <button
              type="button"
              onClick={() => setDesktopFilterCategory("laporan")}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 shrink-0 cursor-pointer ${
                desktopFilterCategory === "laporan"
                  ? "bg-[#1E4D48] text-white ring-2 ring-emerald-600/30"
                  : "bg-white/95 text-slate-700 hover:bg-slate-50 border border-slate-200/80"
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
              <span>Laporan &amp; Genangan</span>
            </button>

            <button
              type="button"
              onClick={() => setDesktopFilterCategory("sos")}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 shrink-0 cursor-pointer ${
                desktopFilterCategory === "sos"
                  ? "bg-rose-600 text-white ring-2 ring-rose-400"
                  : "bg-white/95 text-rose-600 hover:bg-rose-50 border border-rose-200"
              }`}
            >
              <Siren className="w-3.5 h-3.5" />
              <span>Panggilan SOS</span>
            </button>
          </div>
        </div>

        {/* Kiri Tengah: Floating Cards Drawer Panel */}
        <div className="absolute top-28 left-6 z-20 w-[380px] lg:w-[420px] max-h-[calc(100vh-9.5rem)] flex flex-col bg-white/98 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-200/90 overflow-hidden select-none">
          {/* Header Panel */}
          <div className="p-3.5 px-4 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                <Building2 className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h3 className="text-xs font-extrabold text-slate-900 truncate">
                  {desktopFilterCategory === "posko"
                    ? "Posko &amp; Penampungan Siaga"
                    : desktopFilterCategory === "sos"
                    ? "Panggilan Darurat SOS Aktif"
                    : desktopFilterCategory === "laporan"
                    ? "Laporan Kejadian Bencana"
                    : `Semua Posko Aktif (${desktopPoints.length})`}
                </h3>
                <p className="text-[10px] text-slate-500 truncate">
                  {desktopPoints.length} titik geospasial terverifikasi
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsDesktopPanelOpen((prev) => !prev)}
              className="p-1 rounded-lg hover:bg-slate-200/70 text-slate-500 transition-colors cursor-pointer"
              title={isDesktopPanelOpen ? "Minimalkan Panel" : "Buka Panel"}
            >
              {isDesktopPanelOpen ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
          </div>

          {/* Body List Kartu Titik */}
          {isDesktopPanelOpen && (
            <>
              {/* Highlight Titik Terpilih jika ada */}
              {selectedPoint && (
                <div className="p-3 bg-amber-50/70 border-b border-amber-200/80 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-900 bg-amber-200/70 px-2 py-0.5 rounded-md">
                      Titik Sedang Dilihat
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedPoint(null)}
                      className="text-[11px] font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Tutup Fokus</span>
                    </button>
                  </div>
                  <h4 className="text-xs font-extrabold text-slate-900 leading-snug">
                    {selectedPoint.title}
                  </h4>
                  <p className="text-[11px] text-slate-600 flex items-center gap-1 truncate">
                    <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span>{selectedPoint.location_name}</span>
                  </p>
                  <div className="flex items-center gap-2 pt-1">
                    <a
                      href={`https://www.google.com/maps?q=${selectedPoint.lat},${selectedPoint.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 h-8 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-[11px] inline-flex items-center justify-center gap-1.5 shadow-2xs transition-colors"
                    >
                      <Navigation className="w-3 h-3 text-blue-600" />
                      <span>Rute Google Maps</span>
                    </a>
                    {!selectedPoint.is_sos && (
                      <Link
                        href={`/lacak?kode=${selectedPoint.tracking_code}`}
                        className="px-3 h-8 rounded-lg bg-primary hover:bg-primary-hover text-white font-bold text-[11px] inline-flex items-center justify-center gap-1 shadow-2xs transition-colors"
                      >
                        <span>Lacak</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    )}
                  </div>
                </div>
              )}

              {/* Scrollable Items List */}
              <div className="overflow-y-auto divide-y divide-slate-100 max-h-[50vh] p-1.5 space-y-1 scrollbar-thin">
                {desktopPoints.length === 0 ? (
                  <div className="py-12 px-4 text-center text-slate-400">
                    <MapPin className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-400" />
                    <p className="text-xs font-bold text-slate-700">Tidak ada titik ditemukan</p>
                    <p className="text-[11px] mt-0.5">Coba ubah kata kunci pencarian atau filter Anda.</p>
                  </div>
                ) : (
                  desktopPoints.map((pt) => {
                    const isSelected = selectedPoint?.id === pt.id;
                    const isFire =
                      pt.disaster_type === "kebakaran" ||
                      pt.disaster_type === "karhutla";
                    const isPosko =
                      pt.title.toLowerCase().includes("posko") ||
                      pt.location_name.toLowerCase().includes("balai") ||
                      pt.location_name.toLowerCase().includes("gor") ||
                      pt.location_name.toLowerCase().includes("masjid");

                    return (
                      <div
                        key={pt.id}
                        onClick={() => setSelectedPoint(pt)}
                        className={`p-3 rounded-xl transition-all cursor-pointer flex items-center justify-between gap-3 ${
                          isSelected
                            ? "bg-orange-50/80 ring-1 ring-orange-400"
                            : "hover:bg-slate-50"
                        }`}
                      >
                        {/* Kiri: Detail Informasi Posko / Kejadian */}
                        <div className="min-w-0 flex-1">
                          <h4 className="text-xs font-bold text-slate-900 truncate leading-snug">
                            {pt.title}
                          </h4>

                          {/* Badges Info */}
                          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                            <span
                              className={`text-[9px] font-bold px-2 py-0.5 rounded inline-flex items-center gap-1 ${
                                pt.is_sos
                                  ? "bg-rose-100 text-rose-700 font-mono"
                                  : isPosko
                                  ? "bg-emerald-100 text-emerald-800"
                                  : isFire
                                  ? "bg-red-100 text-red-700"
                                  : "bg-blue-100 text-blue-700"
                              }`}
                            >
                              {!pt.is_sos && !isPosko && (
                                <DisasterIcon type={pt.disaster_type} size={12} />
                              )}
                              <span>
                                {pt.is_sos
                                  ? "PANGGILAN SOS"
                                  : isPosko
                                  ? "POSKO TERDEKAT"
                                  : getDisasterLabel(pt.disaster_type).toUpperCase()}
                              </span>
                            </span>

                            {!pt.is_sos && !isPosko && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded border border-slate-200 bg-white text-[10px] font-semibold text-slate-700 shadow-2xs">
                                <ThumbsUp className="w-3 h-3 text-orange-500" />
                                <span>{pt.confirmation_count} Terkonfirmasi</span>
                              </span>
                            )}

                            <span className="text-[10px] text-slate-400">
                              •
                            </span>

                            <span className="text-[10px] text-slate-500 font-medium truncate">
                              {isPosko ? "Siaga 24 Jam • Kapasitas: 200/450 Jiwa" : pt.created_at}
                            </span>
                          </div>

                          {/* Lokasi Alamat & Jarak */}
                          <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1 truncate">
                            <Navigation className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="truncate">{pt.location_name}</span>
                          </p>

                          {/* Action Buttons Row */}
                          <div className="flex items-center gap-1.5 mt-2.5">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedPoint(pt);
                              }}
                              className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 inline-flex items-center gap-1 transition-colors"
                            >
                              <Phone className="w-3 h-3 text-emerald-600" />
                              <span>Hubungi PJ</span>
                            </button>

                            <a
                              href={`https://www.google.com/maps?q=${pt.lat},${pt.lng}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 inline-flex items-center gap-1 transition-colors"
                            >
                              <Navigation className="w-3 h-3 text-blue-600" />
                              <span>Rute</span>
                            </a>

                            {!pt.is_sos && (
                              <Link
                                href={`/lacak?kode=${pt.tracking_code}`}
                                onClick={(e) => e.stopPropagation()}
                                className="px-2 py-1 rounded-md text-[10px] font-bold text-primary hover:bg-primary-soft transition-colors"
                              >
                                <span>Detail</span>
                              </Link>
                            )}
                          </div>
                        </div>

                        {/* Kanan: Thumbnail Foto */}
                        <div className="w-18 h-18 rounded-xl bg-slate-100 border border-slate-200/80 overflow-hidden shrink-0 flex items-center justify-center p-1">
                          {isPosko ? (
                            <div className="w-full h-full bg-emerald-50 rounded-lg flex flex-col items-center justify-center text-emerald-600">
                              <Building2 className="w-7 h-7" />
                              <span className="text-[8px] font-bold mt-0.5">POSKO</span>
                            </div>
                          ) : pt.is_sos ? (
                            <div className="w-full h-full bg-rose-50 rounded-lg flex flex-col items-center justify-center text-rose-600">
                              <Siren className="w-7 h-7 animate-pulse" />
                              <span className="text-[8px] font-bold mt-0.5">SOS</span>
                            </div>
                          ) : (
                            <div className="w-full h-full bg-slate-50 rounded-lg flex flex-col items-center justify-center p-1">
                              <DisasterIcon type={pt.disaster_type} size={30} />
                              <span className="text-[8px] font-bold mt-0.5 text-slate-700 capitalize truncate max-w-[60px]">
                                {getDisasterLabel(pt.disaster_type)}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Footer Panel */}
              <div className="p-3 bg-slate-50/90 border-t border-slate-100 text-center">
                <span className="text-[11px] font-bold text-slate-600">
                  Lihat Posko Lainnya ({desktopPoints.length} Posko Tersedia) →
                </span>
              </div>
            </>
          )}
        </div>

        {/* Kanan Atas: Widget Cuaca Mengambang */}
        <div className="absolute top-5 right-6 z-20">
          <div className="bg-white/95 backdrop-blur-md rounded-2xl p-3 px-4 shadow-lg border border-slate-200/90 flex flex-col items-center">
            <div className="flex items-center gap-1.5 text-amber-500 font-extrabold text-base leading-none">
              <Sun className="w-5 h-5 text-amber-500 fill-amber-400" />
              <span className="text-slate-900 font-extrabold text-lg">32°C</span>
            </div>
            <span className="text-[11px] text-slate-500 font-medium mt-1 leading-none">
              Cerah Berawan
            </span>
          </div>
        </div>

        {/* Kanan Bawah: Stack Floating Action Controls (Kompas, Lokasi Saya, Layers, Zoom) */}
        <div className="absolute bottom-8 right-6 z-20 flex flex-col items-center gap-2">
          {/* Kompas */}
          <button
            type="button"
            onClick={triggerCompass}
            className="w-10 h-10 rounded-full bg-white/95 backdrop-blur-xs text-slate-700 shadow-md border border-slate-200/90 flex items-center justify-center active:scale-95 transition-transform cursor-pointer hover:bg-slate-50"
            title="Reset Arah Kompas &amp; Tampilan"
          >
            <Compass className="w-5 h-5 text-red-500" />
          </button>

          {/* Lokasi Saya */}
          <button
            type="button"
            onClick={triggerLocate}
            className="w-10 h-10 rounded-full bg-white/95 backdrop-blur-xs text-slate-700 shadow-md border border-slate-200/90 flex items-center justify-center active:scale-95 transition-transform cursor-pointer hover:bg-slate-50"
            title="Pusatkan ke Lokasi Saya"
          >
            <Crosshair className="w-5 h-5 text-blue-600" />
          </button>

          {/* Pin Marker Toggle */}
          <button
            type="button"
            onClick={() => {
              if (desktopPoints.length > 0) {
                setSelectedPoint(desktopPoints[0]);
              }
            }}
            className="w-10 h-10 rounded-full bg-white/95 backdrop-blur-xs text-slate-700 shadow-md border border-slate-200/90 flex items-center justify-center active:scale-95 transition-transform cursor-pointer hover:bg-slate-50"
            title="Fokus Titik Terdekat"
          >
            <MapPin className="w-5 h-5 text-emerald-600" />
          </button>

          {/* Toggle Panel Kiri */}
          <button
            type="button"
            onClick={() => setIsDesktopPanelOpen((prev) => !prev)}
            className="w-10 h-10 rounded-full bg-white/95 backdrop-blur-xs text-slate-700 shadow-md border border-slate-200/90 flex items-center justify-center active:scale-95 transition-transform cursor-pointer hover:bg-slate-50"
            title="Buka / Tutup Panel Titik"
          >
            <Layers className="w-5 h-5 text-slate-700" />
          </button>

          {/* Zoom In & Zoom Out Stack */}
          <div className="flex flex-col rounded-xl overflow-hidden shadow-md border border-slate-200/90 bg-white/95 backdrop-blur-xs">
            <button
              type="button"
              onClick={triggerZoomIn}
              className="w-10 h-10 flex items-center justify-center text-slate-700 hover:bg-slate-50 border-b border-slate-100 active:scale-95 transition-transform cursor-pointer"
              title="Perbesar Peta"
            >
              <Plus className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={triggerZoomOut}
              className="w-10 h-10 flex items-center justify-center text-slate-700 hover:bg-slate-50 active:scale-95 transition-transform cursor-pointer"
              title="Perkecil Peta"
            >
              <Minus className="w-5 h-5" />
            </button>
          </div>
        </div>
      </main>
    </>
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

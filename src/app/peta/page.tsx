"use client";

import React, { useState, useMemo, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import {
  MapPin,
  List,
  Map as MapIcon,
  Clock,
  AlertCircle,
  ExternalLink,
  Search,
  SlidersHorizontal,
  Target,
  X,
  Navigation,
  CheckCircle2,
  Flame,
  Waves,
  Mountain,
  Siren,
  ChevronDown,
  RotateCcw,
} from "lucide-react";
import type { MapPoint } from "@/components/peta/DisasterMap";
import type { DisasterType, ReportStatus } from "@/types";
import { supabase } from "@/lib/supabase/client";
import {
  fetchLiveReports,
  reportsToMapPoints,
  DEFAULT_MOCK_REPORTS,
} from "@/lib/services/reports";

// Dynamic import for Leaflet client component
const DisasterMap = dynamic(() => import("@/components/peta/DisasterMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-slate-100 flex flex-col items-center justify-center text-slate-400 animate-pulse">
      <MapPin className="w-10 h-10 mb-2 text-orange-500 animate-bounce" />
      <p className="text-sm font-bold text-slate-700">Memuat Peta Kejadian Bencana...</p>
      <p className="text-xs text-slate-500 mt-1">Mengunduh data spasial OpenStreetMap</p>
    </div>
  ),
});

const SOS_SAMPLE_POINT: MapPoint = {
  id: "sos-1",
  tracking_code: "SOS-DARURAT-01",
  disaster_type: "banjir",
  title: "Panggilan Darurat: Butuh Evakuasi Lansia & Bayi",
  location_name: "Duri Kosambi, Cengkareng, Jakarta Barat",
  lat: -6.168,
  lng: 106.719,
  status: "ditindaklanjuti",
  created_at: "5 menit lalu",
  confirmation_count: 8,
  is_sos: true,
  is_demo: true,
  province: "DKI Jakarta",
  regency: "Jakarta Barat",
  description: "Ketinggian air banjir mencapai 1.2 meter di pemukiman padat. Dibutuhkan perahu karet dan tim medis untuk evakuasi 3 lansia dan 1 bayi secepatnya.",
};

const INITIAL_POINTS: MapPoint[] = [
  SOS_SAMPLE_POINT,
  ...reportsToMapPoints(DEFAULT_MOCK_REPORTS),
];

const PROVINCE_LIST = [
  "Semua Wilayah",
  "DKI Jakarta",
  "Jawa Barat",
  "Banten",
  "Jawa Tengah",
  "DI Yogyakarta",
  "Jawa Timur",
  "Sumatera Barat",
  "Bali",
  "Sulawesi Selatan",
];

const DISASTER_CATEGORIES: { key: DisasterType | "semua"; label: string }[] = [
  { key: "semua", label: "Semua Kategori" },
  { key: "banjir", label: "Banjir" },
  { key: "longsor", label: "Tanah Longsor" },
  { key: "kebakaran", label: "Kebakaran" },
  { key: "gempa", label: "Gempa Bumi" },
  { key: "karhutla", label: "Karhutla" },
  { key: "lainnya", label: "Lainnya" },
];

const STATUS_LIST: { key: ReportStatus | "semua"; label: string }[] = [
  { key: "semua", label: "Semua Status" },
  { key: "diterima", label: "Diterima" },
  { key: "diverifikasi", label: "Diverifikasi" },
  { key: "ditindaklanjuti", label: "Ditindaklanjuti" },
  { key: "selesai", label: "Selesai" },
];

function PetaContent() {
  const searchParams = useSearchParams();
  const urlKode = searchParams.get("kode");
  const urlLat = searchParams.get("lat");
  const urlLng = searchParams.get("lng");

  const [points, setPoints] = useState<MapPoint[]>(INITIAL_POINTS);
  const [viewMode, setViewMode] = useState<"peta" | "daftar">("peta");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<DisasterType | "semua">("semua");
  const [selectedStatus, setSelectedStatus] = useState<ReportStatus | "semua">("semua");
  const [selectedRegion, setSelectedRegion] = useState<string>("Semua Wilayah");
  const [showSos, setShowSos] = useState<boolean>(true);
  const [selectedPoint, setSelectedPoint] = useState<MapPoint | null>(null);
  const [showFilterDrawer, setShowFilterDrawer] = useState<boolean>(false);
  const [mapCenterKey, setMapCenterKey] = useState<number>(0);

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
            description: "Titik kejadian bencana yang dilaporkan warga.",
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
        if (isMounted && liveReports && liveReports.length > 0) {
          const mapPoints = reportsToMapPoints(liveReports);
          setPoints([SOS_SAMPLE_POINT, ...mapPoints]);
        }
      } catch (err) {
        console.warn("Gagal memuat data live peta:", err);
      }
    }

    loadData();

    const channel = supabase
      .channel("public_peta_reports")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "reports" },
        () => {
          loadData();
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  // Filter points based on category, status, region, search query, and SOS toggle
  const filteredPoints = useMemo(() => {
    return points.filter((pt) => {
      if (pt.is_sos && !showSos) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const matchTitle = pt.title.toLowerCase().includes(q);
        const matchLoc = pt.location_name.toLowerCase().includes(q);
        const matchType = pt.disaster_type.toLowerCase().includes(q);
        const matchCode = pt.tracking_code.toLowerCase().includes(q);
        const matchProv = pt.province?.toLowerCase().includes(q) || false;
        if (!matchTitle && !matchLoc && !matchType && !matchCode && !matchProv) return false;
      }

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
  }, [points, selectedCategory, selectedStatus, selectedRegion, searchQuery, showSos]);

  const hasActiveFilters =
    selectedCategory !== "semua" ||
    selectedStatus !== "semua" ||
    selectedRegion !== "Semua Wilayah" ||
    !showSos ||
    searchQuery.trim() !== "";

  const resetAllFilters = () => {
    setSelectedCategory("semua");
    setSelectedStatus("semua");
    setSelectedRegion("Semua Wilayah");
    setShowSos(true);
    setSearchQuery("");
  };

  const getDisasterIcon = (type: DisasterType) => {
    switch (type) {
      case "banjir":
        return <Waves className="w-5 h-5 text-sky-500" />;
      case "longsor":
        return <Mountain className="w-5 h-5 text-amber-600" />;
      case "kebakaran":
      case "karhutla":
        return <Flame className="w-5 h-5 text-red-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-orange-500" />;
    }
  };

  const getStatusBadge = (status: ReportStatus, isSos: boolean = false) => {
    if (isSos) {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-100 text-red-700 border border-red-300 animate-pulse">
          SOS Darurat
        </span>
      );
    }
    switch (status) {
      case "diterima":
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">Diterima</span>;
      case "diverifikasi":
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">Diverifikasi</span>;
      case "ditindaklanjuti":
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">Ditindaklanjuti</span>;
      case "selesai":
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">Selesai</span>;
      case "ditolak":
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-50 text-red-700 border border-red-200">Ditolak</span>;
    }
  };

  return (
    <div className="w-full h-[calc(100vh-64px)] relative overflow-hidden bg-slate-100 flex flex-col font-sans select-none">
      {/* 1. Full Screen Interactive Map */}
      {viewMode === "peta" ? (
        <div key={mapCenterKey} className="absolute inset-0 w-full h-full z-0">
          <DisasterMap
            points={filteredPoints}
            selectedPointId={selectedPoint?.id}
            onSelectPoint={(pt) => setSelectedPoint(pt)}
            showLegend={false}
            className="w-full h-full rounded-none border-none shadow-none"
          />
        </div>
      ) : (
        /* 2. Alternative List View Mode */
        <div className="relative z-10 w-full h-full overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-[1400px] mx-auto space-y-4 pt-20">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div>
              <h2 className="text-lg font-bold text-slate-800">
                Daftar Laporan Bencana Publik ({filteredPoints.length})
              </h2>
              <p className="text-xs text-slate-500">
                Data kejadian bencana dan laporan darurat yang aktif terverifikasi.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setViewMode("peta")}
              className="px-3.5 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-sm transition-all"
            >
              <MapIcon className="w-3.5 h-3.5" />
              <span>Buka Tampilan Peta</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPoints.map((item) => (
              <div
                key={item.id}
                onClick={() => {
                  setSelectedPoint(item);
                  setViewMode("peta");
                }}
                className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-sm hover:border-orange-500/80 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between space-y-3"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-mono text-xs font-bold text-orange-600">
                      {item.tracking_code}
                    </span>
                    {getStatusBadge(item.status, item.is_sos)}
                  </div>
                  <h3 className="text-sm font-bold text-slate-800 leading-snug line-clamp-2">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-500 flex items-start gap-1">
                    <MapPin className="w-3.5 h-3.5 text-orange-500 shrink-0 mt-0.5" />
                    <span className="line-clamp-1">{item.location_name}</span>
                  </p>
                </div>
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{item.created_at}</span>
                  </span>
                  <span className="text-orange-600 font-semibold hover:underline">
                    Lihat di Peta &rarr;
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. Floating Symmetric Top Bar (Rata Kanan & Rata Kiri Serasi) */}
      <div className="absolute top-4 left-4 right-4 sm:left-6 sm:right-6 z-[400] flex items-center justify-between pointer-events-none gap-3">
        {/* Sisi Kiri: Search Bar, Tombol Filter, Switch Peta/Daftar */}
        <div className="pointer-events-auto flex items-center gap-2 sm:gap-2.5 flex-wrap">
          {/* Search Box */}
          <div className="relative">
            <div className="bg-white/95 backdrop-blur-md border border-slate-300/80 hover:border-slate-400 focus-within:border-orange-500 focus-within:ring-2 focus-within:ring-orange-500/20 shadow-md rounded-xl h-10 px-3.5 flex items-center gap-2 w-56 sm:w-72 transition-all">
              <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari bencana atau daerah..."
                className="w-full text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none bg-transparent font-sans"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="text-slate-400 hover:text-slate-600 p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Toggle Filter Button */}
          <button
            type="button"
            onClick={() => setShowFilterDrawer((prev) => !prev)}
            className={`h-10 px-3.5 rounded-xl border backdrop-blur-md text-xs font-bold flex items-center gap-1.5 shadow-md transition-all cursor-pointer ${
              showFilterDrawer || hasActiveFilters
                ? "bg-orange-600 text-white border-orange-600 shadow-orange-500/20"
                : "bg-white/95 text-slate-700 border-slate-300/80 hover:border-orange-400 hover:text-orange-600"
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Filter</span>
            {hasActiveFilters && (
              <span className="w-2 h-2 rounded-full bg-white ml-0.5" />
            )}
          </button>

          {/* Switch Mode Peta vs Daftar */}
          <div className="bg-white/95 backdrop-blur-md border border-slate-300/80 shadow-md rounded-xl h-10 p-1 flex items-center text-xs font-semibold text-slate-600">
            <button
              type="button"
              onClick={() => setViewMode("peta")}
              className={`h-8 px-2.5 rounded-lg flex items-center gap-1 transition-all ${
                viewMode === "peta"
                  ? "bg-orange-500 text-white font-bold shadow-xs"
                  : "hover:text-slate-900"
              }`}
            >
              <MapIcon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Peta</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("daftar")}
              className={`h-8 px-2.5 rounded-lg flex items-center gap-1 transition-all ${
                viewMode === "daftar"
                  ? "bg-orange-500 text-white font-bold shadow-xs"
                  : "hover:text-slate-900"
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>Daftar ({filteredPoints.length})</span>
            </button>
          </div>
        </div>

        {/* Sisi Kanan: Pusatkan Peta & Total Kejadian Aktif */}
        <div className="pointer-events-auto flex items-center gap-2">
          {/* Tombol Pusatkan Peta */}
          <button
            type="button"
            onClick={() => {
              setSelectedPoint(null);
              setMapCenterKey((prev) => prev + 1);
            }}
            title="Pusatkan Peta ke Seluruh Wilayah"
            className="h-10 px-3.5 rounded-xl bg-white/95 hover:bg-white backdrop-blur-md border border-slate-300/80 hover:border-slate-400 text-slate-700 hover:text-orange-600 shadow-md text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Target className="w-3.5 h-3.5 text-orange-500" />
            <span className="hidden md:inline">Pusatkan Peta</span>
          </button>

          {/* Badge Total Laporan */}
          <div className="h-10 px-3.5 rounded-xl bg-white/95 backdrop-blur-md border border-slate-300/80 shadow-md text-xs font-bold text-slate-800 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
            <span>{filteredPoints.length} Kejadian</span>
          </div>
        </div>
      </div>

      {/* 4. Floating Filter Popover / Panel (Sisi Kiri, Serasi dengan Detail di Kanan) */}
      {showFilterDrawer && (
        <div className="absolute top-16 left-4 sm:left-6 z-[400] w-80 max-w-[calc(100vw-2rem)] max-h-[calc(100vh-6rem)] overflow-y-auto bg-white/98 backdrop-blur-md border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-2xl pointer-events-auto space-y-4 animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-orange-600" />
              <h3 className="font-bold text-sm text-slate-800">Filter Bencana</h3>
            </div>
            <button
              type="button"
              onClick={() => setShowFilterDrawer(false)}
              className="text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Kategori Bencana */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Kategori Bencana</label>
            <div className="flex flex-wrap gap-1.5">
              {DISASTER_CATEGORIES.map((cat) => (
                <button
                  key={cat.key}
                  type="button"
                  onClick={() => setSelectedCategory(cat.key)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                    selectedCategory === cat.key
                      ? "bg-orange-600 text-white font-bold shadow-xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Status Penanganan */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Status Penanganan</label>
            <div className="flex flex-wrap gap-1.5">
              {STATUS_LIST.map((st) => (
                <button
                  key={st.key}
                  type="button"
                  onClick={() => setSelectedStatus(st.key)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                    selectedStatus === st.key
                      ? "bg-slate-900 text-white font-bold"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>
          </div>

          {/* Wilayah / Provinsi */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Wilayah Provinsi</label>
            <div className="relative">
              <select
                value={selectedRegion}
                onChange={(e) => setSelectedRegion(e.target.value)}
                className="w-full h-9 pl-3 pr-8 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-800 focus:outline-none focus:border-orange-500 cursor-pointer appearance-none"
              >
                {PROVINCE_LIST.map((prov) => (
                  <option key={prov} value={prov}>
                    {prov}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Toggle SOS Darurat */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
              <Siren className="w-3.5 h-3.5 text-red-500" />
              <span>Titik Darurat SOS</span>
            </div>
            <button
              type="button"
              onClick={() => setShowSos((prev) => !prev)}
              className={`w-10 h-5 flex items-center rounded-full p-0.5 transition-colors ${
                showSos ? "bg-red-500" : "bg-slate-300"
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                  showSos ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* Reset Action */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetAllFilters}
              className="w-full py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 hover:text-orange-600 flex items-center justify-center gap-1.5 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Semua Filter</span>
            </button>
          )}
        </div>
      )}

      {/* 5. Floating Disaster Detail Card (Sisi Kanan, Sesuai Gambar Contoh!) */}
      {selectedPoint && (
        <div className="absolute top-16 sm:top-16 right-4 sm:right-6 z-[400] w-full sm:w-[450px] max-w-[calc(100vw-2rem)] max-h-[calc(100vh-6rem)] overflow-y-auto bg-white/98 backdrop-blur-md border border-slate-200/90 rounded-2xl p-5 shadow-2xl pointer-events-auto space-y-4 animate-in slide-in-from-right duration-200">
          {/* Header Kartu: Ikon, Jenis Bencana & Tombol Tutup */}
          <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center shrink-0">
                {getDisasterIcon(selectedPoint.disaster_type)}
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900 capitalize leading-tight">
                  {selectedPoint.disaster_type === "karhutla"
                    ? "Kebakaran Hutan & Lahan"
                    : selectedPoint.disaster_type === "longsor"
                    ? "Tanah Longsor"
                    : selectedPoint.disaster_type}
                </h3>
                <span className="font-mono text-[11px] font-bold text-orange-600">
                  {selectedPoint.tracking_code}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSelectedPoint(null)}
              className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Bagian Lokasi & Tombol Menuju Lokasi */}
          <div className="space-y-1">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Lokasi Kejadian
              </span>
              <Link
                href={`/lacak?kode=${encodeURIComponent(selectedPoint.tracking_code)}`}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-orange-600 hover:text-orange-700 transition-colors"
              >
                <Navigation className="w-3 h-3" />
                <span>Menuju Lokasi / Lacak</span>
              </Link>
            </div>
            <p className="text-xs font-semibold text-slate-800 leading-snug">
              {selectedPoint.location_name}
            </p>
          </div>

          {/* Grid: Hari/Tanggal & Waktu Kejadian */}
          <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
            <div>
              <span className="text-[10px] font-semibold text-slate-400 block uppercase">
                Waktu Terpantau
              </span>
              <span className="font-bold text-slate-800 mt-0.5 block">
                {selectedPoint.created_at || "Hari ini"}
              </span>
            </div>
            <div>
              <span className="text-[10px] font-semibold text-slate-400 block uppercase">
                Status Posko
              </span>
              <div className="mt-1">
                {getStatusBadge(selectedPoint.status, selectedPoint.is_sos)}
              </div>
            </div>
          </div>

          {/* Kronologi / Rincian Kejadian */}
          <div className="space-y-1 text-xs">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Rincian Kejadian & Kronologi
            </span>
            <p className="text-slate-700 leading-relaxed bg-slate-50/70 p-3 rounded-xl border border-slate-100">
              {selectedPoint.description ||
                `${selectedPoint.title}. Telah diverifikasi oleh posko tanggap darurat dan diteruskan ke tim satuan tugas lapangan untuk penanganan segera.`}
            </p>
          </div>

          {/* Validasi Warga / Dampak */}
          <div className="space-y-1.5 text-xs">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Validasi & Dampak Warga
            </span>
            <div className="flex items-center gap-2 text-slate-700 text-xs bg-orange-50/60 p-2.5 rounded-xl border border-orange-100">
              <CheckCircle2 className="w-4 h-4 text-orange-600 shrink-0" />
              <span>
                <strong>{selectedPoint.confirmation_count} Warga</strong> telah mengonfirmasi dan memverifikasi laporan ini di titik lokasi.
              </span>
            </div>
          </div>

          {/* Tombol Lacak Progres */}
          <div className="pt-2 border-t border-slate-100">
            <Link
              href={`/lacak?kode=${encodeURIComponent(selectedPoint.tracking_code)}`}
              className="w-full h-10 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
            >
              <span>Pantau Status Realtime di Halaman Lacak</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}

      {/* 6. Floating Status Legend (Bawah Kiri, Rata Kiri Serasi) */}
      <div className="absolute bottom-4 left-4 sm:left-6 z-[400] bg-white/95 backdrop-blur-md border border-slate-300/80 rounded-xl p-3 shadow-md pointer-events-auto text-xs space-y-1.5 max-w-[260px]">
        <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-1">
          <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
            Legenda Status Titik
          </span>
          <span className="text-[10px] text-slate-400 font-medium">
            {filteredPoints.length} Titik
          </span>
        </div>
        <div className="space-y-1 text-[11px] text-slate-600">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#2563EB] shrink-0" />
            <span>Diterima / Diverifikasi</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B] shrink-0" />
            <span>Ditindaklanjuti</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#16A34A] shrink-0" />
            <span>Selesai Teratasi</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#DC2626] shrink-0 animate-pulse" />
            <span className="font-bold text-red-600">Panggilan Darurat SOS</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PetaPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full h-[calc(100vh-64px)] bg-slate-100 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <PetaContent />
    </Suspense>
  );
}

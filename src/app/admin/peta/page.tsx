"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  MapPin,
  RotateCw,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  Clock,
  Layers,
  ChevronDown,
  ChevronUp,
  Navigation,
  ExternalLink,
  Siren,
  Flame,
  Mountain,
  Waves,
  AlertTriangle,
  Shield,
  Activity,
  ArrowRight,
  Menu,
  Crosshair,
  Maximize2,
  X,
  SlidersHorizontal,
  Plus,
  Minus,
  Route,
  ArrowUp,
  CornerUpLeft,
  CornerUpRight,
  RotateCcw,
} from "lucide-react";
import type { MapPoint } from "@/components/peta/DisasterMap";
import type { DisasterType, ReportStatus } from "@/types";
import {
  DEFAULT_MOCK_REPORTS,
  reportsToMapPoints,
  fetchLiveReports,
  updateReportStatusLive,
} from "@/lib/services/reports";
import { fetchLiveSosAlerts, updateSosAlertStatus } from "@/lib/services/sos";
import { calculateRoute, type RouteResult } from "@/lib/services/routing";
import { supabase } from "@/lib/supabase/client";
import DisasterIcon from "@/components/common/DisasterIcon";
import { useAdmin } from "@/components/layout/AdminShell";

// Dynamic import for Leaflet client component
const DisasterMap = dynamic(() => import("@/components/peta/DisasterMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[380px] sm:h-[480px] lg:h-[600px] rounded-xl bg-slate-100/70 border border-slate-200/80 flex flex-col items-center justify-center text-slate-400 animate-pulse font-sans">
      <MapPin className="w-8 h-8 mb-2 text-blue-500 animate-bounce" />
      <p className="text-sm font-bold text-slate-700">Memuat Peta Situasi Taktis...</p>
      <p className="text-xs text-slate-400 mt-0.5">Mengunduh layer koordinat geospasial</p>
    </div>
  ),
});

const PROVINCE_OPTIONS = [
  "Semua Provinsi",
  "DKI Jakarta",
  "Jawa Barat",
  "Jawa Tengah",
  "Jawa Timur",
  "DI Yogyakarta",
  "Banten",
  "Bali",
  "Sumatera Barat",
  "Sulawesi Selatan",
];

export default function AdminPetaPage() {
  const { activeUnit, activeUnitName, toggleMobileSidebar, activeSosCount } = useAdmin();
  const [points, setPoints] = useState<MapPoint[]>(() => {
    return reportsToMapPoints(DEFAULT_MOCK_REPORTS);
  });

  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPointId, setSelectedPointId] = useState<string | undefined>(undefined);
  const [selectedProvince, setSelectedProvince] = useState<string>("Semua Provinsi");
  const [selectedDisaster, setSelectedDisaster] = useState<DisasterType | "semua">("semua");
  const [selectedStatus, setSelectedStatus] = useState<ReportStatus | "sos" | "semua">("semua");
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // State khusus drawer & filter mobile
  const [isMobileSheetOpen, setIsMobileSheetOpen] = useState(false);

  // State navigasi rute OSRM & mode kemudi langsung di peta
  const [activeRoute, setActiveRoute] = useState<RouteResult | null>(null);
  const [isCalculatingRoute, setIsCalculatingRoute] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isLiveNavigating, setIsLiveNavigating] = useState(false);

  // Pantau lokasi GPS petugas secara real-time di background
  useEffect(() => {
    if (typeof window === "undefined" || !navigator.geolocation) return;

    // 1. Baca koordinat tersimpan
    try {
      const cached = localStorage.getItem("sigapbumi_user_last_coords");
      if (cached) {
        const p = JSON.parse(cached);
        if (typeof p.lat === "number" && typeof p.lng === "number") {
          setUserLocation({ lat: p.lat, lng: p.lng });
        }
      }
    } catch { }

    // 2. Watch position GPS real-time
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setUserLocation({ lat: latitude, lng: longitude });
      },
      () => { },
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 10000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  // Handler tutup detail informasi titik & otomatis zoom out fokus ke seluruh Indonesia
  const handleCloseDetail = useCallback((e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    setSelectedPointId(undefined);
    setActiveRoute(null);
    setIsLiveNavigating(false);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("sigapbumi:map-focus-indonesia"));
    }
  }, []);

  // Mulai navigasi rute tercepat OSRM dari posisi petugas ke lokasi kejadian
  const handleStartNavigation = async (destPoint: MapPoint) => {
    setIsCalculatingRoute(true);
    try {
      let startLat = userLocation?.lat || -6.2088;
      let startLng = userLocation?.lng || 106.8456;

      if (!userLocation && typeof window !== "undefined") {
        const cached = localStorage.getItem("sigapbumi_user_last_coords");
        if (cached) {
          try {
            const p = JSON.parse(cached);
            if (p.lat && p.lng) {
              startLat = p.lat;
              startLng = p.lng;
            }
          } catch { }
        }
      }

      const res = await calculateRoute(startLat, startLng, destPoint.lat, destPoint.lng);
      setActiveRoute(res);
    } catch (err) {
      console.warn("Gagal menghitung rute navigasi:", err);
    } finally {
      setIsCalculatingRoute(false);
    }
  };

  // Masuk ke Mode Navigasi Langsung di Peta (seperti Google Maps In-App Driving)
  const handleStartLiveNavigation = () => {
    setIsLiveNavigating(true);
    setIsMobileSheetOpen(false);
    if (userLocation && typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("sigapbumi:map-locate-me", {
          detail: { lat: userLocation.lat, lng: userLocation.lng },
        })
      );
    }
  };

  // Keluar dari Mode Navigasi Langsung
  const handleExitLiveNavigation = () => {
    setIsLiveNavigating(false);
  };

  const handleClearRoute = () => {
    setActiveRoute(null);
    setIsLiveNavigating(false);
  };

  // Helper render ikon manuver belokan navigasi
  const renderManeuverIcon = (modifier?: string) => {
    const mod = (modifier || "").toLowerCase();
    if (mod.includes("sharp left") || mod.includes("slight left") || mod.includes("left")) {
      return <CornerUpLeft className="w-6 h-6 text-white stroke-[2.5]" />;
    }
    if (mod.includes("sharp right") || mod.includes("slight right") || mod.includes("right")) {
      return <CornerUpRight className="w-6 h-6 text-white stroke-[2.5]" />;
    }
    if (mod.includes("uturn")) {
      return <RotateCcw className="w-6 h-6 text-white stroke-[2.5]" />;
    }
    return <ArrowUp className="w-6 h-6 text-white stroke-[2.5]" />;
  };

  // Helper trigger action peta Leaflet di mobile
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

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const liveReports = await fetchLiveReports();
      const liveSos = await fetchLiveSosAlerts();

      if (liveReports && liveReports.length > 0) {
        const reportPoints = reportsToMapPoints(liveReports);
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

        setPoints(merged);
      }
    } catch (err) {
      console.warn("Gagal memuat koordinat peta admin:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
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
      .channel("admin_peta_reports_realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "reports" }, handleSync)
      .subscribe();

    const channelSos = supabase
      .channel("admin_peta_sos_realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "sos_alerts" }, handleSync)
      .subscribe();

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("sigapbumi:sos-created", handleSync);
        window.removeEventListener("sigapbumi:sos-updated", handleSync);
        window.removeEventListener("storage", handleSync);
      }
      supabase.removeChannel(channelReports);
      supabase.removeChannel(channelSos);
    };
  }, [loadData]);

  // Titik basis yang disaring berdasarkan hak akses instansi aktif
  const basePoints = useMemo(() => {
    if (activeUnit === "semua" || activeUnit === "pemerintahan") return points;
    return points.filter((pt) => {
      const titleLower = pt.title.toLowerCase();
      const isFire =
        pt.disaster_type === "kebakaran" ||
        pt.disaster_type === "karhutla" ||
        titleLower.includes("damkar") ||
        titleLower.includes("kebakaran") ||
        titleLower.includes("karhutla");

      // 1. Data kebakaran hanya masuk ke damkar
      if (isFire) {
        return activeUnit === "damkar";
      }

      if (pt.is_sos) {
        if (activeUnit === "damkar") {
          return titleLower.includes("damkar");
        }
        if (activeUnit === "medis") {
          return (
            titleLower.includes("medis") ||
            titleLower.includes("kesehatan") ||
            titleLower.includes("ambulans")
          );
        }
        if (activeUnit === "polisi") {
          return titleLower.includes("keamanan") || titleLower.includes("polisi");
        }
        if (activeUnit === "bnpb_bpbd") {
          return (
            titleLower.includes("bnpb") ||
            titleLower.includes("bpbd") ||
            titleLower.includes("sar") ||
            titleLower.includes("evakuasi")
          );
        }
        return false;
      }

      // 2. Kejadian Medis hanya masuk ke role medis
      const isMedical =
        titleLower.includes("medis") ||
        titleLower.includes("kesehatan") ||
        titleLower.includes("ambulans") ||
        titleLower.includes("korban") ||
        titleLower.includes("cedera");

      if (activeUnit === "medis") {
        return isMedical;
      }
      if (
        isMedical &&
        (titleLower.includes("ambulans") || titleLower.includes("kesehatan"))
      ) {
        return false;
      }

      if (activeUnit === "polisi") {
        return (
          titleLower.includes("polisi") ||
          titleLower.includes("keamanan") ||
          pt.disaster_type === "lainnya"
        );
      }

      if (activeUnit === "bnpb_bpbd") {
        return ["banjir", "longsor", "gempa", "tsunami"].includes(pt.disaster_type);
      }

      return false;
    });
  }, [points, activeUnit]);

  // Filtered points
  const filteredPoints = useMemo(() => {
    return basePoints.filter((pt) => {
      if (selectedProvince !== "Semua Provinsi" && pt.province !== selectedProvince) {
        return false;
      }
      if (selectedDisaster !== "semua" && pt.disaster_type !== selectedDisaster) {
        return false;
      }
      if (selectedStatus === "sos") {
        if (!pt.is_sos) return false;
      } else if (selectedStatus !== "semua" && pt.status !== selectedStatus) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = pt.title.toLowerCase().includes(q);
        const matchLoc = pt.location_name.toLowerCase().includes(q);
        const matchCode = pt.tracking_code?.toLowerCase().includes(q);
        if (!matchTitle && !matchLoc && !matchCode) return false;
      }
      return true;
    });
  }, [basePoints, selectedProvince, selectedDisaster, selectedStatus, searchQuery]);

  const selectedPoint = useMemo(() => {
    return basePoints.find((p) => p.id === selectedPointId);
  }, [basePoints, selectedPointId]);

  // Handle local and remote status transition
  const handleUpdateStatus = async (newStatus: ReportStatus) => {
    if (!selectedPointId) return;
    setPoints((prev) =>
      prev.map((pt) => (pt.id === selectedPointId ? { ...pt, status: newStatus } : pt))
    );
    const readable = newStatus === "ditindaklanjuti" ? "Diproses" : newStatus === "selesai" ? "Selesai" : newStatus;
    setActionNotice(`Status kejadian berhasil diperbarui menjadi "${readable}".`);
    setTimeout(() => setActionNotice(null), 3500);

    try {
      const pt = points.find((p) => p.id === selectedPointId);
      if (pt?.is_sos) {
        await updateSosAlertStatus(selectedPointId, newStatus === "selesai" ? "selesai" : "ditangani");
      } else {
        const note =
          newStatus === "ditindaklanjuti"
            ? "Status diperbarui menjadi diproses oleh posko melalui peta operasional taktis."
            : newStatus === "selesai"
            ? "Kejadian bencana telah ditangani dan dinyatakan selesai."
            : `Status diperbarui menjadi ${newStatus}`;
        await updateReportStatusLive(selectedPointId, newStatus, note, "Petugas Pusdalops Peta");
      }
    } catch (err) {
      console.warn("Gagal update status di peta:", err);
    }
  };

  // KPI Metrics riil tanpa fallback palsu berdasarkan yurisdiksi aktif
  const totalTitik = basePoints.length;
  const sosTotal = basePoints.filter((p) => p.is_sos).length;
  const prosesTotal = basePoints.filter((p) => !p.is_sos && p.status === "ditindaklanjuti").length;
  const selesaiTotal = basePoints.filter((p) => !p.is_sos && p.status === "selesai").length;

  const getDisasterIcon = (type: DisasterType) => {
    return <DisasterIcon type={type} size={16} />;
  };

  return (
    <>
      {/* ============================================================== */}
      {/* 1. TAMPILAN MOBILE: EDGE-TO-EDGE FULL SCREEN MAP + BOTTOM SHEET */}
      {/* ============================================================== */}
      <div className="md:hidden relative w-full h-[100dvh] overflow-hidden bg-slate-900 select-none">
        {/* Peta Layar Penuh */}
        <div className="absolute inset-0 w-full h-full z-0">
          <DisasterMap
            className="w-full h-full"
            points={filteredPoints}
            selectedPointId={selectedPointId}
            onSelectPoint={(pt) => {
              setSelectedPointId(pt.id);
              setIsMobileSheetOpen(false); // Tetap di bawah (peek mode) agar peta tidak tertutup!
            }}
            showLegend={false}
            disablePopup={true}
            routeCoords={activeRoute?.coordinates || null}
            isLiveNavigating={isLiveNavigating}
            userLocationCoords={userLocation ? [userLocation.lat, userLocation.lng] : null}
          />
        </div>

        {/* ============================================================== */}
        {/* BANNER NAVIGASI BELOKAN HIJAU (MOBILE IN-APP GPS DRIVING)      */}
        {/* ============================================================== */}
        {isLiveNavigating && activeRoute && (
          <div className="absolute top-4 left-3 right-3 z-40 bg-[#1e5346] text-white rounded-2xl shadow-[0_12px_36px_rgba(0,0,0,0.35)] p-3.5 flex items-center gap-3.5 border border-emerald-500/40 animate-in slide-in-from-top-4 duration-300 pointer-events-auto">
            <div className="w-12 h-12 rounded-full bg-emerald-800/90 border border-emerald-400/50 flex items-center justify-center shrink-0 shadow-inner">
              {renderManeuverIcon(activeRoute.steps?.[0]?.modifier)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xl font-black text-white leading-tight tracking-tight">
                {activeRoute.steps?.[0]?.distanceFormatted || activeRoute.distanceFormatted}
              </div>
              <div className="text-xs font-semibold text-emerald-100/95 truncate mt-0.5">
                {activeRoute.steps?.[0]?.instruction || `Menuju ${selectedPoint?.location_name || "Lokasi Kejadian"}`}
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* FLOATING BOTTOM BAR NAVIGASI (MOBILE IN-APP GPS DRIVING)       */}
        {/* ============================================================== */}
        {isLiveNavigating && activeRoute && (
          <div className="absolute bottom-6 left-4 right-4 z-40 flex justify-center pointer-events-none">
            <div className="bg-white rounded-full shadow-[0_12px_36px_rgba(0,0,0,0.25)] border border-slate-100 px-5 py-2.5 flex items-center justify-between gap-4 w-full max-w-sm select-none animate-in slide-in-from-bottom-4 duration-300 pointer-events-auto">
              <div className="flex flex-col items-start min-w-[120px]">
                <div className="text-base font-black text-slate-900 tracking-tight flex items-center gap-1.5">
                  <span className="text-emerald-700 font-extrabold">{activeRoute.durationFormattedShort} mnt</span>
                  <span className="text-slate-300">•</span>
                  <span className="text-slate-800 font-bold">{activeRoute.distanceKm} km</span>
                </div>
                <div className="text-[11px] font-semibold text-slate-400">
                  {activeRoute.arrivalTimeFormatted}
                </div>
              </div>

              <button
                type="button"
                onClick={handleExitLiveNavigation}
                className="px-3.5 py-1.5 rounded-full border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs active:scale-95 shrink-0"
              >
                <X className="w-3.5 h-3.5 text-rose-600 stroke-[2.5]" />
                <span>Keluar</span>
              </button>
            </div>
          </div>
        )}

        {/* Floating Top Controls: Hanya tampil jika TIDAK sedang live navigasi */}
        {!isLiveNavigating && (
          <div className="absolute top-3 left-3 z-30 flex items-center gap-2 pointer-events-auto">
            <button
              type="button"
              onClick={toggleMobileSidebar}
              className="w-10 h-10 rounded-full bg-white/95 backdrop-blur-xs text-slate-800 shadow-md border border-slate-200/90 flex items-center justify-center active:scale-95 transition-transform cursor-pointer"
              title="Buka Navigasi Menu Admin"
            >
              <Menu className="w-5 h-5 text-slate-700" />
            </button>

            <div className="px-3 py-1.5 rounded-full bg-white/95 backdrop-blur-xs text-slate-800 text-[11px] font-bold shadow-md border border-slate-200/90 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse shrink-0" />
              <span className="max-w-[120px] truncate">{activeUnitName}</span>
            </div>
          </div>
        )}

        {/* Floating Action Controls Stack di Sisi Kanan: Hanya tampil jika TIDAK sedang live navigasi */}
        {!isLiveNavigating && (
          <div className="absolute top-3 right-3 z-30 flex flex-col items-center gap-2 pointer-events-auto">
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
                selectedDisaster !== "semua" || selectedProvince !== "Semua Provinsi" || searchQuery.trim() !== ""
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
        )}

        {/* Floating Bottom Sheet (Filter & Info Titik di Bawah Peta Mobile) */}
        {!isLiveNavigating && (
        <div
          className={`absolute inset-x-0 bottom-0 z-30 bg-white rounded-t-3xl shadow-[0_-8px_24px_rgba(0,0,0,0.14)] border-t border-slate-200/80 transition-all duration-300 flex flex-col ${
            isMobileSheetOpen ? "max-h-[85vh]" : "max-h-[74px]"
          }`}
        >
          {/* Handle Bar Drag Pill */}
          <div
            onClick={() => setIsMobileSheetOpen((prev) => !prev)}
            className="pt-2 pb-1 flex flex-col items-center cursor-pointer select-none"
          >
            <div className="w-12 h-1.5 bg-slate-300 rounded-full" />
          </div>

          {/* Header Bottom Sheet */}
          <div
            onClick={() => {
              if (!isMobileSheetOpen) {
                setIsMobileSheetOpen(true);
              }
            }}
            className="px-4 py-2 flex items-center justify-between gap-3 border-b border-slate-100 cursor-pointer select-none"
          >
            {selectedPoint ? (
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="text-[10px] font-bold font-mono px-2 py-0.5 bg-slate-100 text-slate-800 rounded">
                    {selectedPoint.tracking_code}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      selectedPoint.is_sos
                        ? "bg-rose-100 text-rose-700 font-extrabold"
                        : selectedPoint.status === "selesai"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {selectedPoint.is_sos ? "SOS DARURAT" : selectedPoint.status.toUpperCase()}
                  </span>
                </div>
                {!isMobileSheetOpen && (
                  <h4 className="text-xs font-bold text-slate-900 truncate">
                    {selectedPoint.title}
                  </h4>
                )}
              </div>
            ) : (
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold text-slate-900">
                    Filter & Titik Operasional
                  </h4>
                  <span className="text-[10px] font-bold bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
                    {filteredPoints.length} Titik
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 truncate mt-0.5">
                  {selectedDisaster !== "semua" ? `Bencana: ${selectedDisaster}` : "Semua Bencana"} • {selectedProvince}
                </p>
              </div>
            )}

            <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
              {selectedPoint && (
                <button
                  type="button"
                  onClick={handleCloseDetail}
                  className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer"
                  title="Tutup Titik Terpilih & Zoom Out ke Indonesia"
                >
                  <X className="w-4 h-4" />
                </button>
              )}

              {selectedPoint ? (
                isMobileSheetOpen ? (
                  <button
                    type="button"
                    onClick={() => setIsMobileSheetOpen(false)}
                    className="p-1.5 rounded-full hover:bg-slate-100 text-slate-600 cursor-pointer"
                    title="Lipat ke Bawah"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsMobileSheetOpen(true)}
                    className="p-1 px-2.5 rounded-full bg-orange-50 hover:bg-orange-100 text-orange-600 font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer"
                    title="Buka Detail Informasi"
                  >
                    <span className="text-[11px] font-bold">Detail</span>
                    <ChevronUp className="w-3.5 h-3.5" />
                  </button>
                )
              ) : (
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
              )}
            </div>
          </div>

          {/* Body Konten Bottom Sheet (Saat Di-expand) */}
          <div className={`overflow-y-auto px-4 py-3 space-y-3.5 ${isMobileSheetOpen ? "block" : "hidden"}`}>
            {selectedPoint ? (
              <div className="space-y-3 pb-1">
                {/* Judul & Lokasi Detail */}
                <div>
                  <h3 className="text-sm font-bold text-slate-900 leading-snug">
                    {selectedPoint.title}
                  </h3>
                  <p className="text-xs text-slate-600 mt-1 flex items-start gap-1.5 leading-relaxed">
                    <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                    <span>{selectedPoint.location_name}</span>
                  </p>
                </div>

                {/* Grid Spesifikasi Data (2x2) Lengkap di Mobile */}
                <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50/90 p-3 rounded-xl border border-slate-100">
                  <div>
                    <span className="text-slate-400 block text-[10px] font-medium">Jenis Bencana</span>
                    <span className="font-bold text-slate-800 capitalize flex items-center gap-1.5 mt-0.5 text-xs">
                      {getDisasterIcon(selectedPoint.disaster_type)}
                      <span>{selectedPoint.disaster_type}</span>
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] font-medium">Waktu Masuk</span>
                    <span className="font-bold text-slate-800 mt-0.5 block text-xs">{selectedPoint.created_at}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] font-medium">Koordinat GPS</span>
                    <span className="font-mono text-[10px] font-bold text-slate-800 mt-0.5 block">
                      {selectedPoint.lat.toFixed(4)}, {selectedPoint.lng.toFixed(4)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] font-medium">Konfirmasi Warga</span>
                    <span className="font-bold text-amber-600 flex items-center gap-1 mt-0.5 text-xs">
                      <Shield className="w-3.5 h-3.5 text-amber-500" />
                      <span>{selectedPoint.confirmation_count} Saksi</span>
                    </span>
                  </div>
                </div>

                {/* Action Buttons Lengkap */}
                <div className="space-y-2 pt-0.5">
                  {/* Widget Rute Navigasi Aktif dengan Estimasi Waktu */}
                  {activeRoute ? (
                    <div className="p-3 bg-gradient-to-br from-blue-50 to-indigo-50/90 rounded-xl border border-blue-200/90 shadow-2xs space-y-2 animate-in fade-in duration-200">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-extrabold text-blue-800 flex items-center gap-1.5">
                          <Route className="w-3.5 h-3.5 text-blue-600 animate-pulse" />
                          <span>Navigasi Langsung di Peta</span>
                        </span>
                        <button
                          type="button"
                          onClick={handleClearRoute}
                          className="text-[10px] font-bold text-slate-500 hover:text-slate-800 px-2 py-0.5 rounded bg-white/90 border border-slate-200 cursor-pointer shadow-2xs"
                        >
                          Tutup Rute
                        </button>
                      </div>

                      {/* Baris Metrik Jarak & Estimasi Waktu */}
                      <div className="grid grid-cols-2 gap-2">
                        <div className="bg-white/95 p-2 rounded-lg border border-blue-100 shadow-2xs">
                          <span className="text-[9px] text-slate-400 font-medium block">Jarak Tempuh</span>
                          <span className="text-sm font-extrabold text-blue-900 block mt-0.5 leading-none">
                            {activeRoute.distanceFormatted}
                          </span>
                        </div>
                        <div className="bg-white/95 p-2 rounded-lg border border-blue-100 shadow-2xs">
                          <span className="text-[9px] text-slate-400 font-medium block">Estimasi Tiba</span>
                          <span className="text-sm font-extrabold text-emerald-600 block mt-0.5 leading-none">
                            {activeRoute.durationFormatted}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={handleStartLiveNavigation}
                        className="w-full h-9 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold inline-flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer active:scale-98"
                      >
                        <Navigation className="w-3.5 h-3.5 text-white fill-white" />
                        <span>Mulai Rute</span>
                      </button>

                      <a
                        href={`https://www.google.com/maps/dir/?api=1&destination=${selectedPoint.lat},${selectedPoint.lng}&travelmode=driving`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] text-slate-400 hover:text-slate-600 font-medium inline-flex items-center justify-center gap-1 text-center w-full pt-0.5"
                      >
                        <span>Buka panduan eksternal Google Maps</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <button
                        type="button"
                        onClick={() => handleStartNavigation(selectedPoint)}
                        disabled={isCalculatingRoute}
                        className="w-full h-9 px-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold inline-flex items-center justify-center gap-2 shadow-2xs transition-all cursor-pointer active:scale-98"
                      >
                        {isCalculatingRoute ? (
                          <>
                            <RotateCw className="w-3.5 h-3.5 animate-spin text-white" />
                            <span>Menghitung Rute Tercepat...</span>
                          </>
                        ) : (
                          <>
                            <Route className="w-3.5 h-3.5 text-white" />
                            <span>Tampilkan Rute & Estimasi Waktu</span>
                          </>
                        )}
                      </button>

                      <a
                        href={`https://www.google.com/maps?q=${selectedPoint.lat},${selectedPoint.lng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full h-8 px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold inline-flex items-center justify-center gap-1.5 shadow-2xs transition-colors"
                      >
                        <ExternalLink className="w-3 h-3 text-slate-400" />
                        <span>Buka Titik di Google Maps</span>
                      </a>
                    </div>
                  )}

                  {selectedPoint.status !== "selesai" && (
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus("ditindaklanjuti")}
                        className="h-8.5 px-3 rounded-xl border border-amber-200 bg-[#FFF7ED] text-[#EA580C] hover:bg-amber-100 text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
                      >
                        <Clock className="w-3.5 h-3.5" />
                        <span>Diproses</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus("selesai")}
                        className="h-8.5 px-3 rounded-xl bg-[#059669] hover:bg-[#047857] text-white text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                        <span>Selesai</span>
                      </button>
                    </div>
                  )}

                  <Link
                    href={selectedPoint.is_sos ? "/admin/sos" : `/admin/laporan/${selectedPoint.id}`}
                    className="w-full h-8.5 rounded-xl border border-slate-200/90 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold inline-flex items-center justify-center gap-1.5 shadow-2xs transition-colors"
                  >
                    <span>Lihat Lembar Kerja Lengkap</span>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                  </Link>
                </div>

                {/* Tombol kembali ke Filter Peta */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={handleCloseDetail}
                    className="text-xs text-orange-600 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>← Tutup detail titik & fokus ke Indonesia</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Panel Filter Geospasial Mobile (Jika tidak ada titik yang dipilih) */
              <div className="space-y-2.5 pb-2">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Filter & Pencarian Bencana
                </span>

                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari lokasi atau kode laporan..."
                    className="w-full h-8.5 pl-8 pr-3 rounded-xl bg-slate-50 border border-slate-200 text-xs placeholder:text-slate-400 text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-orange-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={selectedDisaster}
                    onChange={(e) => setSelectedDisaster(e.target.value as DisasterType | "semua")}
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
                    onChange={(e) => setSelectedStatus(e.target.value as ReportStatus | "sos" | "semua")}
                    className="h-8.5 px-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-700"
                  >
                    <option value="semua">Semua Status</option>
                    <option value="diterima">Diterima</option>
                    <option value="ditindaklanjuti">Diproses</option>
                    <option value="selesai">Selesai</option>
                    <option value="sos">Khusus SOS</option>
                  </select>
                </div>

                <select
                  value={selectedProvince}
                  onChange={(e) => setSelectedProvince(e.target.value)}
                  className="w-full h-8.5 px-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-700"
                >
                  {PROVINCE_OPTIONS.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>

                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedProvince("Semua Provinsi");
                      setSelectedDisaster("semua");
                      setSelectedStatus("semua");
                      setSearchQuery("");
                    }}
                    className="text-xs font-bold text-orange-600 hover:underline cursor-pointer"
                  >
                    Reset Filter
                  </button>
                  <button
                    type="button"
                    onClick={loadData}
                    className="text-xs font-bold text-slate-600 flex items-center gap-1.5 px-3 py-1 bg-slate-100 rounded-lg hover:bg-slate-200 cursor-pointer"
                  >
                    <RotateCw className="w-3 h-3" />
                    <span>Segarkan</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        )}
      </div>

      {/* ============================================================== */}
      {/* 2. TAMPILAN DESKTOP (MD KE ATAS): DASHBOARD OPERASIONAL LENGKAP */}
      {/* ============================================================== */}
      <div className="hidden md:block space-y-6 w-full max-w-[1400px] mx-auto font-sans pb-12 select-none">
        {/* 1. Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-orange-100 text-orange-700 border border-orange-200">
                Yurisdiksi: {activeUnitName}
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Peta Operasional Taktis
            </h1>
            <p className="text-xs md:text-sm text-slate-500 font-normal mt-0.5">
              Pantau sebaran titik bencana, panggilan darurat SOS, dan armada darurat secara geospasial real-time.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0 self-start sm:self-auto">
            {/* Segarkan Data Button */}
            <button
              type="button"
              onClick={loadData}
              disabled={isLoading}
              className="px-4 py-2 rounded-xl border border-slate-200/90 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 shadow-2xs transition-colors inline-flex items-center gap-2 cursor-pointer"
            >
              <RotateCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-orange-500" : "text-slate-500"}`} />
              <span>Segarkan Data</span>
            </button>
          </div>
        </div>

        {/* 2. 4 Kartu Metrik KPI (Row 1) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
          {/* Card 1: Total Titik */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-[0_2px_12px_rgba(0,0,0,0.02)] flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-full bg-[#EFF6FF] flex items-center justify-center text-[#2563EB] shrink-0 font-bold">
              <Layers className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">Total Titik Terdata</p>
              <p className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight mt-0.5">
                {totalTitik}
              </p>
              <p className="text-[11px] text-blue-600 font-semibold flex items-center gap-1 mt-0.5">
                <span>9 Provinsi</span>
                <span className="text-slate-400 font-normal">tercakup</span>
              </p>
            </div>
          </div>

          {/* Card 2: SOS Aktif */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-[0_2px_12px_rgba(0,0,0,0.02)] flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-full bg-[#FEE2E2] flex items-center justify-center text-[#EF4444] shrink-0 font-bold">
              <AlertCircle className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">Sinyal SOS Aktif</p>
              <p className="text-2xl md:text-3xl font-extrabold text-rose-600 tracking-tight leading-tight mt-0.5">
                {sosTotal}
              </p>
              <p className="text-[11px] text-rose-600 font-semibold mt-0.5">
                Perlu tanggap cepat
              </p>
            </div>
          </div>

          {/* Card 3: Dalam Penanganan */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-[0_2px_12px_rgba(0,0,0,0.02)] flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-full bg-[#FEF3C7] flex items-center justify-center text-[#D97706] shrink-0 font-bold">
              <Clock className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">Dalam Penanganan</p>
              <p className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight mt-0.5">
                {prosesTotal}
              </p>
              <p className="text-[11px] text-slate-400 font-normal mt-0.5">
                Regu di lapangan
              </p>
            </div>
          </div>

          {/* Card 4: Selesai */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-[0_2px_12px_rgba(0,0,0,0.02)] flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-full bg-[#D1FAE5] flex items-center justify-center text-[#059669] shrink-0 font-bold">
              <CheckCircle2 className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">Selesai Ditangani</p>
              <p className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight mt-0.5">
                {selesaiTotal}
              </p>
              <p className="text-[11px] text-emerald-600 font-semibold mt-0.5">
                Telah dievakuasi
              </p>
            </div>
          </div>
        </div>

        {/* 3. Filter Bar Horizontal */}
        <div className="pt-1">
          <div className="flex items-center justify-between gap-3 sm:gap-4 overflow-x-auto pb-1 scrollbar-none w-full">
            {/* Search Input Box */}
            <div className="relative w-48 sm:w-60 shrink-0">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari lokasi atau kode..."
                className="w-full h-8.5 pl-9 pr-3 rounded-full bg-white border border-slate-200/90 text-xs placeholder:text-slate-400 text-slate-800 shadow-2xs focus:outline-none focus:ring-1 focus:ring-orange-500/30 transition-all"
              />
            </div>

            {/* Filter Pills Controls */}
            <div className="flex items-center gap-2.5 sm:gap-3 text-xs shrink-0 whitespace-nowrap">
              {/* Filter Provinsi */}
              <div className="relative shrink-0">
                <select
                  value={selectedProvince}
                  onChange={(e) => setSelectedProvince(e.target.value)}
                  className="h-8.5 pl-3 pr-7 rounded-full border border-slate-200/90 bg-white hover:border-slate-300 text-xs font-semibold text-slate-700 shadow-2xs focus:outline-none cursor-pointer appearance-none transition-all"
                >
                  {PROVINCE_OPTIONS.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
                <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                  <ChevronDown className="w-3 h-3" />
                </div>
              </div>

              {/* Filter Bencana */}
              <div className="relative shrink-0">
                <select
                  value={selectedDisaster}
                  onChange={(e) => setSelectedDisaster(e.target.value as DisasterType | "semua")}
                  className="h-8.5 pl-3 pr-7 rounded-full border border-slate-200/90 bg-white hover:border-slate-300 text-xs font-semibold text-slate-700 shadow-2xs focus:outline-none cursor-pointer appearance-none transition-all"
                >
                  <option value="semua">Semua Bencana</option>
                  <option value="banjir">Banjir</option>
                  <option value="longsor">Tanah Longsor</option>
                  <option value="kebakaran">Kebakaran</option>
                  <option value="gempa">Gempa Bumi</option>
                  <option value="karhutla">Karhutla</option>
                  <option value="lainnya">Lainnya</option>
                </select>
                <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                  <ChevronDown className="w-3 h-3" />
                </div>
              </div>

              {/* Filter Status */}
              <div className="relative shrink-0">
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value as ReportStatus | "sos" | "semua")}
                  className="h-8.5 pl-3 pr-7 rounded-full border border-slate-200/90 bg-white hover:border-slate-300 text-xs font-semibold text-slate-700 shadow-2xs focus:outline-none cursor-pointer appearance-none transition-all"
                >
                  <option value="semua">Semua Status</option>
                  <option value="diterima">Status: Diterima</option>
                  <option value="diverifikasi">Status: Diverifikasi</option>
                  <option value="ditindaklanjuti">Status: Ditindaklanjuti</option>
                  <option value="selesai">Status: Selesai</option>
                  <option value="sos">Khusus Sinyal SOS Darurat</option>
                </select>
                <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                  <ChevronDown className="w-3 h-3" />
                </div>
              </div>

              {/* Reset Button */}
              {(selectedProvince !== "Semua Provinsi" ||
                selectedDisaster !== "semua" ||
                selectedStatus !== "semua" ||
                searchQuery.trim() !== "") && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedProvince("Semua Provinsi");
                    setSelectedDisaster("semua");
                    setSelectedStatus("semua");
                    setSearchQuery("");
                  }}
                  className="text-xs font-bold text-orange-600 hover:text-orange-700 hover:underline px-2 py-1 cursor-pointer"
                >
                  Reset Filter
                </button>
              )}
            </div>
          </div>
        </div>

        {actionNotice && (
          <div className="p-3 px-4 bg-emerald-50 border border-emerald-200/80 rounded-xl text-emerald-700 text-xs font-semibold flex items-center gap-2 shadow-2xs animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{actionNotice}</span>
          </div>
        )}

        {/* 4. Full-Width Tactical Map Container (Sesuai Batas Margin Dashboard) */}
        <div className="w-full bg-white rounded-2xl border border-slate-100 p-3.5 sm:p-4 shadow-[0_2px_16px_rgba(0,0,0,0.02)] flex flex-col justify-between relative overflow-hidden">
          <div className="w-full h-[540px] sm:h-[620px] lg:h-[700px] xl:h-[740px] relative rounded-xl overflow-hidden border border-slate-100">
            <DisasterMap
              className="w-full h-full"
              points={filteredPoints}
              selectedPointId={selectedPointId}
              onSelectPoint={(pt) => setSelectedPointId(pt.id)}
              showLegend={false}
              disablePopup={true}
              routeCoords={activeRoute?.coordinates || null}
              isLiveNavigating={isLiveNavigating}
              userLocationCoords={userLocation ? [userLocation.lat, userLocation.lng] : null}
            />

            {/* ============================================================== */}
            {/* BANNER NAVIGASI BELOKAN HIJAU (DESKTOP IN-APP GPS DRIVING)     */}
            {/* ============================================================== */}
            {isLiveNavigating && activeRoute && (
              <div className="absolute top-4 left-4 z-[550] bg-[#1e5346] text-white rounded-2xl shadow-[0_12px_36px_rgba(0,0,0,0.35)] p-4 flex items-center gap-4 border border-emerald-500/40 max-w-[380px] animate-in slide-in-from-top-4 duration-300 pointer-events-auto select-none">
                <div className="w-13 h-13 rounded-full bg-emerald-800/90 border border-emerald-400/50 flex items-center justify-center shrink-0 shadow-inner">
                  {renderManeuverIcon(activeRoute.steps?.[0]?.modifier)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-2xl font-black text-white leading-tight tracking-tight">
                    {activeRoute.steps?.[0]?.distanceFormatted || activeRoute.distanceFormatted}
                  </div>
                  <div className="text-xs font-semibold text-emerald-100/95 truncate mt-0.5">
                    {activeRoute.steps?.[0]?.instruction || `Menuju ${selectedPoint?.location_name || "Lokasi Kejadian"}`}
                  </div>
                </div>
              </div>
            )}

            {/* ============================================================== */}
            {/* FLOATING BOTTOM BAR NAVIGASI (DESKTOP IN-APP GPS DRIVING)      */}
            {/* ============================================================== */}
            {isLiveNavigating && activeRoute && (
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[550] bg-white rounded-full shadow-[0_12px_36px_rgba(0,0,0,0.22)] border border-slate-100 px-7 py-3 flex items-center gap-8 select-none animate-in slide-in-from-bottom-4 duration-300 pointer-events-auto">
                <div className="flex flex-col items-start min-w-[140px]">
                  <div className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
                    <span className="text-emerald-700 font-extrabold">{activeRoute.durationFormattedShort} mnt</span>
                    <span className="text-slate-300">•</span>
                    <span className="text-slate-800 font-bold">{activeRoute.distanceKm} km</span>
                  </div>
                  <div className="text-xs font-semibold text-slate-400">
                    {activeRoute.arrivalTimeFormatted}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleExitLiveNavigation}
                  className="px-4 py-1.5 rounded-full border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs active:scale-95 shrink-0"
                >
                  <X className="w-3.5 h-3.5 text-rose-600 stroke-[2.5]" />
                  <span>Keluar</span>
                </button>
              </div>
            )}

            {/* Hint Terapung jika belum ada titik yang diklik */}
            {!selectedPoint && !isLiveNavigating && (
              <div className="absolute top-3.5 left-3.5 z-20 bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-xl border border-slate-200/90 shadow-sm text-xs font-semibold text-slate-700 flex items-center gap-2 pointer-events-none animate-in fade-in duration-200">
                <MapPin className="w-4 h-4 text-orange-500" />
                <span>Klik pin bencana pada peta untuk menampilkan lembar kerja taktis</span>
              </div>
            )}

            {/* Floating Tactical Overlay Card (Menimpa di Atas Peta Sisi Kanan) */}
            {selectedPoint && !isLiveNavigating && (
              <div className="absolute top-3.5 right-3.5 z-[500] w-[calc(100%-1.75rem)] sm:w-[380px] max-w-[420px] bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-[0_12px_36px_rgba(0,0,0,0.18)] space-y-4 animate-in fade-in zoom-in-95 duration-200 max-h-[calc(100%-1.75rem)] overflow-y-auto">
                <div className="flex items-start justify-between pb-3 border-b border-slate-100">
                  <div>
                    <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
                      Panel Kendali Taktis
                    </h2>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Inspeksi detail titik kejadian & disposisi armada
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleCloseDetail}
                    className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer shrink-0 ml-2"
                    title="Tutup Panel & Zoom Out ke Indonesia"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Point Header */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2.5 py-0.5 rounded-md">
                      {selectedPoint.tracking_code}
                    </span>
                    <span
                      className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 ${
                        selectedPoint.is_sos
                          ? "bg-[#FFF1F2] text-[#E11D48] border border-rose-200"
                          : selectedPoint.status === "selesai"
                          ? "bg-[#ECFDF5] text-[#059669] border border-emerald-200"
                          : selectedPoint.status === "ditindaklanjuti"
                          ? "bg-[#FFF7ED] text-[#EA580C] border border-amber-200"
                          : "bg-[#EFF6FF] text-[#2563EB] border border-blue-200"
                      }`}
                    >
                      {selectedPoint.is_sos && (
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse" />
                      )}
                      <span>
                        {selectedPoint.is_sos
                          ? "PANGGILAN SOS"
                          : selectedPoint.status.toUpperCase()}
                      </span>
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 leading-snug">
                    {selectedPoint.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1.5 flex items-start gap-1.5 leading-relaxed">
                    <MapPin className="w-4 h-4 text-slate-600 shrink-0 mt-0.5" />
                    <span>{selectedPoint.location_name}</span>
                  </p>
                </div>

                {/* Data Specs Grid */}
                <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50/90 p-3 rounded-xl border border-slate-100">
                  <div>
                    <span className="text-slate-400 block text-[10px] font-medium">Jenis Bencana</span>
                    <span className="font-bold text-slate-800 capitalize flex items-center gap-1.5 mt-0.5 text-xs">
                      {getDisasterIcon(selectedPoint.disaster_type)}
                      <span>{selectedPoint.disaster_type}</span>
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] font-medium">Waktu Masuk</span>
                    <span className="font-bold text-slate-800 mt-0.5 block text-xs">{selectedPoint.created_at}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] font-medium">Koordinat GPS</span>
                    <span className="font-mono text-[10px] font-bold text-slate-800 mt-0.5 block">
                      {selectedPoint.lat.toFixed(4)}, {selectedPoint.lng.toFixed(4)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] font-medium">Konfirmasi Warga</span>
                    <span className="font-bold text-amber-600 flex items-center gap-1 mt-0.5 text-xs">
                      <Shield className="w-3.5 h-3.5 text-amber-500" />
                      <span>{selectedPoint.confirmation_count} Saksi</span>
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-2 pt-1">
                  {/* Widget Rute Navigasi Aktif dengan Estimasi Waktu */}
                  {activeRoute ? (
                    <div className="p-3 bg-gradient-to-br from-blue-50 to-indigo-50/90 rounded-xl border border-blue-200/90 shadow-2xs space-y-2.5 animate-in fade-in duration-200">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-extrabold text-blue-800 flex items-center gap-1.5">
                          <Route className="w-4 h-4 text-blue-600 animate-pulse" />
                          <span>Navigasi Taktis di Peta</span>
                        </span>
                        <button
                          type="button"
                          onClick={handleClearRoute}
                          className="text-[11px] font-bold text-slate-500 hover:text-slate-800 px-2 py-0.5 rounded bg-white/90 border border-slate-200 cursor-pointer shadow-2xs"
                        >
                          Tutup Rute
                        </button>
                      </div>

                      {/* Baris Metrik Jarak & Estimasi Waktu */}
                      <div className="grid grid-cols-2 gap-2">
                        <div className="bg-white/95 p-2.5 rounded-lg border border-blue-100 shadow-2xs">
                          <span className="text-[10px] text-slate-400 font-medium block">Jarak Tempuh</span>
                          <span className="text-base font-extrabold text-blue-900 block mt-0.5 leading-none">
                            {activeRoute.distanceFormatted}
                          </span>
                        </div>
                        <div className="bg-white/95 p-2.5 rounded-lg border border-blue-100 shadow-2xs">
                          <span className="text-[10px] text-slate-400 font-medium block">Estimasi Waktu</span>
                          <span className="text-base font-extrabold text-emerald-600 block mt-0.5 leading-none">
                            {activeRoute.durationFormatted}
                          </span>
                        </div>
                      </div>

                      <p className="text-[11px] text-blue-800 font-medium flex items-center gap-1.5">
                        <span>🚗</span>
                        <span>{activeRoute.summary}</span>
                      </p>

                      <button
                        type="button"
                        onClick={handleStartLiveNavigation}
                        className="w-full h-9.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold inline-flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer active:scale-98"
                      >
                        <Navigation className="w-4 h-4 text-white fill-white" />
                        <span>Mulai Rute</span>
                      </button>

                      <a
                        href={`https://www.google.com/maps/dir/?api=1&destination=${selectedPoint.lat},${selectedPoint.lng}&travelmode=driving`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] text-slate-400 hover:text-slate-600 font-medium inline-flex items-center justify-center gap-1 text-center w-full pt-0.5"
                      >
                        <span>Buka panduan eksternal Google Maps</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <button
                        type="button"
                        onClick={() => handleStartNavigation(selectedPoint)}
                        disabled={isCalculatingRoute}
                        className="w-full h-9.5 px-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold inline-flex items-center justify-center gap-2 shadow-2xs transition-all cursor-pointer active:scale-98"
                      >
                        {isCalculatingRoute ? (
                          <>
                            <RotateCw className="w-3.5 h-3.5 animate-spin text-white" />
                            <span>Menghitung Rute Tercepat...</span>
                          </>
                        ) : (
                          <>
                            <Route className="w-4 h-4 text-white" />
                            <span>Tampilkan Rute & Estimasi Waktu</span>
                          </>
                        )}
                      </button>

                      <a
                        href={`https://www.google.com/maps?q=${selectedPoint.lat},${selectedPoint.lng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full h-8 px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold inline-flex items-center justify-center gap-1.5 shadow-2xs transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                        <span>Buka Titik di Google Maps</span>
                      </a>
                    </div>
                  )}

                  {selectedPoint.status !== "selesai" && (
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus("ditindaklanjuti")}
                        className="h-8.5 px-3 rounded-xl border border-amber-200 bg-[#FFF7ED] text-[#EA580C] hover:bg-amber-100 text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
                      >
                        <Clock className="w-3.5 h-3.5" />
                        <span>Diproses</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus("selesai")}
                        className="h-8.5 px-3 rounded-xl bg-[#059669] hover:bg-[#047857] text-white text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                        <span>Selesai</span>
                      </button>
                    </div>
                  )}

                  <Link
                    href={
                      selectedPoint.is_sos
                        ? "/admin/sos"
                        : `/admin/laporan/${selectedPoint.id}`
                    }
                    className="w-full h-8.5 rounded-xl border border-slate-200/90 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold inline-flex items-center justify-center gap-1.5 shadow-2xs transition-colors"
                  >
                    <span>Lihat Lembar Kerja Lengkap</span>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Quick Legend Bar under Map */}
          <div className="pt-3 px-1 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-bold text-slate-700 text-[11px] uppercase tracking-wider">
                Legenda Peta:
              </span>
              <span className="inline-flex items-center gap-1.5 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                <span>Banjir</span>
              </span>
              <span className="inline-flex items-center gap-1.5 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span>Longsor</span>
              </span>
              <span className="inline-flex items-center gap-1.5 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                <span>Kebakaran</span>
              </span>
              <span className="inline-flex items-center gap-1.5 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span>Gempa</span>
              </span>
              <span className="inline-flex items-center gap-1.5 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-ping" />
                <span>Panggilan SOS</span>
              </span>
            </div>

            <span className="font-semibold text-slate-600">
              {filteredPoints.length} titik aktif
            </span>
          </div>
        </div>
      </div>
    </>
  );
}

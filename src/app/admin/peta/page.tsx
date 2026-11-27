"use client";

import React, { useState, useMemo, useEffect, useCallback, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
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
  ChevronRight,
  ChevronLeft,
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
  Car,
  ArrowUp,
  ArrowUpRight,
  ArrowUpLeft,
  CornerUpLeft,
  CornerUpRight,
  RotateCcw,
  Sun,
  Moon,
  Satellite,
} from "lucide-react";
import type { MapPoint } from "@/components/peta/DisasterMap";
import type { DisasterType, ReportStatus } from "@/types";
import {
  DEFAULT_MOCK_REPORTS,
  reportsToMapPoints,
  fetchLiveReports,
  getCachedLiveReports,
  updateReportStatusLive,
} from "@/lib/services/reports";
import { fetchLiveSosAlerts, updateSosAlertStatus } from "@/lib/services/sos";
import { calculateRoute, type RouteResult } from "@/lib/services/routing";
import { getAdminSettings, saveAdminSettings } from "@/lib/services/settings";
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

function AdminPetaContent() {
  const searchParams = useSearchParams();
  const urlId = searchParams?.get("id");
  const urlKode = searchParams?.get("kode");
  const urlLat = searchParams?.get("lat");
  const urlLng = searchParams?.get("lng");

  const { activeUnit, activeUnitName, toggleMobileSidebar, activeSosCount } = useAdmin();
  const [points, setPoints] = useState<MapPoint[]>(() => {
    const cached = getCachedLiveReports();
    if (cached && cached.length > 0) {
      return reportsToMapPoints(cached);
    }
    return reportsToMapPoints(DEFAULT_MOCK_REPORTS);
  });

  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPointId, setSelectedPointId] = useState<string | undefined>(() => {
    return urlId || urlKode || undefined;
  });
  const [selectedProvince, setSelectedProvince] = useState<string>("Semua Provinsi");
  const [selectedDisaster, setSelectedDisaster] = useState<DisasterType | "semua">("semua");
  const [selectedStatus, setSelectedStatus] = useState<ReportStatus | "sos" | "semua">("semua");
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Tangani parameter navigasi langsung dari Monitor SOS atau menu lain (?id=...&kode=...&lat=...&lng=...)
  useEffect(() => {
    if (!urlId && !urlKode && !urlLat) return;

    const targetKey = urlId || urlKode;

    let matched = points.find(
      (p) =>
        (targetKey && (p.id === targetKey || p.tracking_code === targetKey)) ||
        (urlLat && urlLng && Math.abs(p.lat - parseFloat(urlLat)) < 0.0001 && Math.abs(p.lng - parseFloat(urlLng)) < 0.0001)
    );

    if (!matched && urlLat && urlLng) {
      const latNum = parseFloat(urlLat);
      const lngNum = parseFloat(urlLng);
      if (!isNaN(latNum) && !isNaN(lngNum)) {
        const instantPt: MapPoint = {
          id: urlId || `sos-${Date.now()}`,
          tracking_code: urlKode || "SOS",
          disaster_type: "kebakaran",
          title: `Panggilan Darurat SOS: ${urlKode || "Warga"}`,
          location_name: `Titik Darurat Warga (${latNum.toFixed(4)}, ${lngNum.toFixed(4)})`,
          lat: latNum,
          lng: lngNum,
          status: "diterima",
          created_at: "Baru saja",
          confirmation_count: 1,
          is_sos: true,
          is_demo: false,
        };
        setPoints((prev) => [instantPt, ...prev.filter((p) => p.id !== instantPt.id && p.tracking_code !== instantPt.tracking_code)]);
        matched = instantPt;
      }
    }

    if (matched) {
      setSelectedPointId(matched.id);
      setIsMobileSheetOpen(false);
    } else if (targetKey) {
      setSelectedPointId(targetKey);
      setIsMobileSheetOpen(false);
    }
  }, [urlId, urlKode, urlLat, urlLng, points]);

  // State khusus drawer & filter mobile
  const [isMobileSheetOpen, setIsMobileSheetOpen] = useState(false);

  // State navigasi rute OSRM & mode kemudi langsung di peta
  const [activeRoute, setActiveRoute] = useState<RouteResult | null>(null);
  const [isCalculatingRoute, setIsCalculatingRoute] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isLiveNavigating, setIsLiveNavigating] = useState(false);

  // Preferensi gaya layer peta (Terang, Gelap, Satelit) tersinkronisasi dengan Pengaturan Posko
  const [mapLayer, setMapLayer] = useState<"light" | "dark" | "satellite">(() => {
    return typeof window !== "undefined" ? getAdminSettings().defaultMapLayer || "light" : "light";
  });

  useEffect(() => {
    const handleSettingsUpdated = (e: any) => {
      if (e.detail?.defaultMapLayer) {
        setMapLayer(e.detail.defaultMapLayer);
      }
    };
    window.addEventListener("sigapbumi:settings-updated", handleSettingsUpdated);
    return () => window.removeEventListener("sigapbumi:settings-updated", handleSettingsUpdated);
  }, []);

  const handleSwitchLayer = (layer: "light" | "dark" | "satellite") => {
    setMapLayer(layer);
    saveAdminSettings({ defaultMapLayer: layer });
  };

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
      window.dispatchEvent(
        new CustomEvent("sigapbumi:live-nav-state", { detail: { active: false } })
      );
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

      const res = await calculateRoute(
        startLat,
        startLng,
        destPoint.lat,
        destPoint.lng,
        destPoint.location_name
      );
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
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("sigapbumi:live-nav-state", { detail: { active: true } })
      );
      // Pusatkan awal ke lokasi armada saat rute pertama kali dibuka
      if (userLocation) {
        window.dispatchEvent(
          new CustomEvent("sigapbumi:map-locate", {
            detail: { lat: userLocation.lat, lng: userLocation.lng },
          })
        );
      } else {
        window.dispatchEvent(new CustomEvent("sigapbumi:map-locate"));
      }
    }
  };

  // Keluar dari Mode Navigasi Langsung
  const handleExitLiveNavigation = () => {
    setIsLiveNavigating(false);
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("sigapbumi:live-nav-state", { detail: { active: false } })
      );
    }
  };

  const handleClearRoute = () => {
    setActiveRoute(null);
    setIsLiveNavigating(false);
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("sigapbumi:live-nav-state", { detail: { active: false } })
      );
    }
  };

  // Helper render ikon manuver belokan navigasi (belok kiri/kanan, lurus, menyamping/serong)
  const renderManeuverIcon = (modifier?: string, instruction?: string) => {
    const text = `${modifier || ""} ${instruction || ""}`.toLowerCase();
    if (text.includes("putar") || text.includes("uturn") || text.includes("u-turn")) {
      return <RotateCcw className="w-5 h-5 text-white stroke-[2.5]" />;
    }
    if (text.includes("serong kiri") || text.includes("slight left") || text.includes("menyamping kiri")) {
      return <ArrowUpLeft className="w-5 h-5 text-white stroke-[2.5]" />;
    }
    if (text.includes("serong kanan") || text.includes("slight right") || text.includes("menyamping kanan")) {
      return <ArrowUpRight className="w-5 h-5 text-white stroke-[2.5]" />;
    }
    if (text.includes("kiri") || text.includes("left")) {
      return <CornerUpLeft className="w-5 h-5 text-white stroke-[2.5]" />;
    }
    if (text.includes("kanan") || text.includes("right")) {
      return <CornerUpRight className="w-5 h-5 text-white stroke-[2.5]" />;
    }
    if (text.includes("menyamping") || text.includes("slight")) {
      return <ArrowUpRight className="w-5 h-5 text-white stroke-[2.5]" />;
    }
    return <ArrowUp className="w-5 h-5 text-white stroke-[2.5]" />;
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

  const loadData = useCallback(async (forceRefresh = false) => {
    try {
      const [liveReports, liveSos] = await Promise.all([
        fetchLiveReports(forceRefresh, { lean: true }),
        fetchLiveSosAlerts(forceRefresh, { lean: true }),
      ]);

      if (liveReports && liveReports.length > 0) {
        const reportPoints = reportsToMapPoints(liveReports);
        // Map live SOS alerts into MapPoints
        const activeSos: MapPoint[] = (liveSos || [])
          .filter((s) => s.status === "aktif" || s.status === "ditangani")
          .map((s) => ({
            id: s.id,
            tracking_code: s.tracking_code || (s.id.startsWith("SOS") ? s.id : `SOS-${s.id.slice(0, 4).toUpperCase()}`),
            disaster_type: (s.assistance_type === "damkar" ? "kebakaran" : "lainnya") as DisasterType,
            title: `Panggilan Darurat: Bantuan ${s.assistance_type.toUpperCase()}`,
            location_name: s.address,
            lat: s.lat,
            lng: s.lng,
            status: (s.status === "ditangani" ? "ditindaklanjuti" : "diterima") as ReportStatus,
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

    let debounceTimer: ReturnType<typeof setTimeout> | null = null;
    const handleSync = () => {
      if (typeof document !== "undefined" && document.visibilityState === "hidden") return;
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        loadData();
      }, 800);
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
      if (debounceTimer) clearTimeout(debounceTimer);
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
      // Jika titik ini adalah target navigasi terpilih, SELALU tampilkan
      if (selectedPointId && (pt.id === selectedPointId || (pt.tracking_code && pt.tracking_code === selectedPointId))) {
        return true;
      }

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
      // Jika titik ini adalah target navigasi terpilih, SELALU tampilkan
      if (selectedPointId && (pt.id === selectedPointId || (pt.tracking_code && pt.tracking_code === selectedPointId))) {
        return true;
      }

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
  }, [basePoints, selectedProvince, selectedDisaster, selectedStatus, searchQuery, selectedPointId]);

  const selectedPoint = useMemo(() => {
    return (
      basePoints.find((p) => p.id === selectedPointId || (p.tracking_code && p.tracking_code === selectedPointId)) ||
      points.find((p) => p.id === selectedPointId || (p.tracking_code && p.tracking_code === selectedPointId))
    );
  }, [basePoints, points, selectedPointId]);

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
      <div className="md:hidden fixed inset-0 bottom-16 z-10 w-full overflow-hidden bg-slate-900 select-none overscroll-none">
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
            mapLayer={mapLayer}
          />
        </div>

        {/* Mobile Quick Layer Switcher */}
        {!isLiveNavigating && (
          <div className="absolute top-3 left-3 z-30 flex items-center gap-1 p-1 bg-white/95 backdrop-blur-md rounded-xl border border-slate-200/90 shadow-md text-[10px] font-bold pointer-events-auto">
            <button
              type="button"
              onClick={() => handleSwitchLayer("light")}
              className={`px-2 py-0.5 rounded-lg transition-all ${
                mapLayer === "light"
                  ? "bg-slate-900 text-white"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
              title="Terang (OpenStreetMap)"
            >
              <Sun className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => handleSwitchLayer("dark")}
              className={`px-2 py-0.5 rounded-lg transition-all ${
                mapLayer === "dark"
                  ? "bg-slate-900 text-white"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
              title="Mode Malam Taktis (Dark Canvas)"
            >
              <Moon className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => handleSwitchLayer("satellite")}
              className={`px-2 py-0.5 rounded-lg transition-all ${
                mapLayer === "satellite"
                  ? "bg-slate-900 text-white"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
              title="Citra Satelit"
            >
              <Satellite className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* ============================================================== */}
        {/* HUD NAVIGASI TAKTIS PUSDALOPS SIGAPBUMI (MOBILE)               */}
        {/* ============================================================== */}
        {isLiveNavigating && activeRoute && (
          <>
            {/* Top Tactical HUD Panel */}
            <div className="absolute top-3 left-3 right-3 z-40 bg-[#F97316] rounded-2xl border border-[#F97316] shadow-[0_12px_36px_rgba(234,88,12,0.35)] p-3 text-white animate-in slide-in-from-top-3 duration-300 pointer-events-auto">
              {/* Header Navigasi Bersih */}
              <div className="flex items-center gap-2 pb-2 mb-2 border-b border-[#F97316]/60 min-w-0">
                <span className="w-2 h-2 rounded-full bg-white animate-pulse shrink-0" />
                <span className="text-[11px] text-orange-50 font-medium truncate min-w-0 flex-1">
                  {selectedPoint?.location_name || "Menuju Titik Lokasi"}
                </span>
              </div>

              {/* Manuver Navigasi Utama */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#F97316]/60 border border-orange-400/50 text-white flex items-center justify-center shrink-0 shadow-inner">
                  {renderManeuverIcon(activeRoute.steps?.[0]?.modifier, activeRoute.steps?.[0]?.instruction)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-xl font-black text-white tracking-tight leading-none">
                      {activeRoute.steps?.[0]?.distanceFormatted || activeRoute.distanceFormatted}
                    </span>
                    <span className="text-[10px] text-orange-200 font-bold uppercase tracking-wider">
                      Manuver
                    </span>
                  </div>
                  <p className="text-xs font-bold text-white truncate mt-1">
                    {activeRoute.steps?.[0]?.instruction || `Menuju ${selectedPoint?.location_name || "Titik Kejadian"}`}
                  </p>
                </div>
              </div>
            </div>

            {/* Bottom Tactical Mission Dock (Mobile) */}
            <div className="absolute bottom-3 left-3 right-3 z-40 bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200/90 shadow-[0_12px_36px_rgba(0,0,0,0.18)] p-3 text-slate-900 select-none animate-in slide-in-from-bottom-3 duration-300 pointer-events-auto">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="bg-emerald-50 border border-emerald-200/80 rounded-xl px-2.5 py-1.5 flex flex-col items-center justify-center min-w-[70px]">
                    <span className="text-[9px] font-extrabold text-emerald-600 uppercase tracking-wider leading-none">Estimasi</span>
                    <span className="text-xs font-black text-emerald-700 leading-tight mt-0.5 text-center">
                      {activeRoute.durationFormattedShort}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-black text-slate-900">{activeRoute.distanceKm} km</span>
                      <span className="text-slate-300">•</span>
                      <span className="text-[11px] font-bold text-slate-600">{activeRoute.arrivalTimeFormatted}</span>
                    </div>
                    <p className="text-[10px] text-slate-400 truncate mt-0.5">
                      Target: {selectedPoint?.title || "Titik Kejadian Bencana"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={triggerLocate}
                    className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
                    title="Pusatkan Kamera ke Armada"
                  >
                    <Crosshair className="w-4 h-4 text-blue-600" />
                  </button>
                  <button
                    type="button"
                    onClick={handleExitLiveNavigation}
                    className="h-9 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <span>Selesai</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Floating Zoom Controls Khusus Mode Navigasi (Mobile): Bebas Zoom In & Zoom Out */}
            <div className="absolute top-36 right-3 z-40 flex flex-col rounded-xl overflow-hidden shadow-lg border border-slate-200/90 bg-white/95 backdrop-blur-md pointer-events-auto">
              <button
                type="button"
                onClick={triggerZoomIn}
                className="w-10 h-10 flex items-center justify-center text-slate-700 hover:bg-slate-100 border-b border-slate-100 active:scale-95 transition-transform cursor-pointer"
                title="Perbesar Peta"
              >
                <Plus className="w-5 h-5 text-slate-800" />
              </button>
              <button
                type="button"
                onClick={triggerZoomOut}
                className="w-10 h-10 flex items-center justify-center text-slate-700 hover:bg-slate-100 active:scale-95 transition-transform cursor-pointer"
                title="Perkecil Peta"
              >
                <Minus className="w-5 h-5 text-slate-800" />
              </button>
            </div>
          </>
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
            isMobileSheetOpen
              ? "max-h-[380px]"
              : selectedPoint
              ? "max-h-[82px]"
              : "max-h-[58px]"
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
            onClick={() => setIsMobileSheetOpen((prev) => !prev)}
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

                {/* Grid Spesifikasi Data Lengkap di Mobile */}
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
                  <div className="col-span-2 pt-1 border-t border-slate-200/60 flex items-center justify-between">
                    <span className="text-slate-400 text-[10px] font-medium">Konfirmasi Warga</span>
                    <span className="font-bold text-amber-600 text-xs">
                      {selectedPoint.confirmation_count} Saksi
                    </span>
                  </div>
                </div>

                {/* Action Buttons Lengkap */}
                <div className="space-y-2 pt-0.5">
                  {/* Widget Rute Navigasi Aktif dengan Estimasi Waktu */}
                  {activeRoute ? (
                    <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs space-y-2 animate-in fade-in duration-200">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-extrabold text-slate-800 flex items-center gap-1.5">
                          <Route className="w-3.5 h-3.5 text-blue-600 animate-pulse" />
                          <span>Navigasi Langsung di Peta</span>
                        </span>
                        <button
                          type="button"
                          onClick={handleClearRoute}
                          className="text-[10px] font-bold text-slate-500 hover:text-slate-800 px-2.5 py-1 rounded-xl bg-white border border-slate-200 cursor-pointer shadow-2xs hover:bg-slate-50 transition-colors"
                        >
                          Tutup Rute
                        </button>
                      </div>

                      {/* Baris Metrik Jarak & Estimasi Waktu */}
                      <div className="grid grid-cols-2 gap-2">
                        <div className="bg-slate-50/80 p-2 rounded-lg border border-slate-200 shadow-2xs">
                          <span className="text-[9px] text-slate-500 font-medium block">Jarak Tempuh</span>
                          <span className="text-sm font-extrabold text-slate-900 block mt-0.5 leading-none">
                            {activeRoute.distanceFormatted}
                          </span>
                        </div>
                        <div className="bg-slate-50/80 p-2 rounded-lg border border-slate-200 shadow-2xs">
                          <span className="text-[9px] text-slate-500 font-medium block">Estimasi Tiba</span>
                          <span className="text-sm font-extrabold text-emerald-600 block mt-0.5 leading-none">
                            {activeRoute.durationFormatted}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={handleStartLiveNavigation}
                        className="w-full h-9 px-3 rounded-xl bg-[#F97316] hover:bg-orange-700 active:bg-orange-800 text-white text-xs font-bold inline-flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer active:scale-98"
                      >
                        <Navigation className="w-3.5 h-3.5 text-white fill-white" />
                        <span>Mulai Rute</span>
                      </button>
                    </div>
                  ) : (
                    <div>
                      <button
                        type="button"
                        onClick={() => handleStartNavigation(selectedPoint)}
                        disabled={isCalculatingRoute}
                        className="w-full h-9 px-3 rounded-xl bg-orange-600 hover:bg-orange-700 active:bg-orange-800 text-white text-xs font-bold inline-flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer active:scale-98"
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
                    onClick={() => loadData(true)}
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
      {/* 2. TAMPILAN DESKTOP (MD KE ATAS): FULLSCREEN TACTICAL MAP DENGAN FLOATING LAYER */}
      {/* ============================================================== */}
      <div className="hidden md:block w-full h-full relative overflow-hidden font-sans select-none">
        {actionNotice && (
          <div className="absolute top-3.5 left-1/2 -translate-x-1/2 z-[600] p-2.5 px-4 bg-emerald-50/95 backdrop-blur-md border border-emerald-200/90 rounded-xl text-emerald-700 text-xs font-semibold flex items-center gap-2 shadow-lg animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{actionNotice}</span>
          </div>
        )}

        <DisasterMap
          className="w-full h-full !rounded-none !border-0 !shadow-none"
          points={filteredPoints}
          selectedPointId={selectedPointId}
          onSelectPoint={(pt) => setSelectedPointId(pt.id)}
          showLegend={false}
          disablePopup={true}
          routeCoords={activeRoute?.coordinates || null}
          isLiveNavigating={isLiveNavigating}
          userLocationCoords={userLocation ? [userLocation.lat, userLocation.lng] : null}
          mapLayer={mapLayer}
        />

            {/* ============================================================== */}
            {/* FLOATING LAYER ATAS: MINI KPI & FILTER TAKTIS (BERSIH)        */}
            {/* ============================================================== */}
            {!isLiveNavigating && (
              <div className="absolute top-3.5 left-3.5 z-20 max-w-[calc(100%-1.75rem)] pointer-events-none flex flex-col items-start gap-2.5 animate-in fade-in duration-300">
                {/* 1. Bar Mini KPI & Tombol Segarkan */}
                <div className="flex items-center gap-2 pointer-events-auto flex-wrap">
                  <div className="bg-white/95 backdrop-blur-md p-1.5 rounded-2xl border border-slate-200/90 shadow-[0_4px_20px_rgba(0,0,0,0.08)] flex items-center gap-1.5">
                    {/* Tombol Segarkan Data */}
                    <button
                      type="button"
                      onClick={() => loadData(true)}
                      disabled={isLoading}
                      className="px-3 py-1.5 rounded-xl border border-slate-200/80 hover:bg-slate-100 text-xs font-bold text-slate-700 transition-colors inline-flex items-center gap-1.5 cursor-pointer shadow-2xs"
                      title="Segarkan data titik bencana"
                    >
                      <RotateCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-orange-500" : "text-slate-500"}`} />
                      <span className="text-[11px]">Segarkan Data</span>
                    </button>

                    <div className="h-4 w-px bg-slate-200 mx-0.5" />

                    {/* Badge 1: Total Titik */}
                    <div className="px-2.5 py-1 rounded-xl bg-blue-50 text-blue-700 flex items-center gap-1.5 text-xs font-bold">
                      <Layers className="w-3.5 h-3.5 text-blue-600" />
                      <span>{totalTitik}</span>
                      <span className="text-[10px] font-medium text-blue-600/80 hidden xl:inline">Titik</span>
                    </div>

                    {/* Badge 2: SOS Aktif */}
                    <div className="px-2.5 py-1 rounded-xl bg-rose-50 text-rose-700 flex items-center gap-1.5 text-xs font-bold">
                      <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                      <span>{sosTotal}</span>
                      <span className="text-[10px] font-medium text-rose-600/80">SOS</span>
                    </div>

                    {/* Badge 3: Ditangani */}
                    <div className="px-2.5 py-1 rounded-xl bg-amber-50 text-amber-700 flex items-center gap-1.5 text-xs font-bold">
                      <Clock className="w-3.5 h-3.5 text-amber-600" />
                      <span>{prosesTotal}</span>
                      <span className="text-[10px] font-medium text-amber-600/80">Proses</span>
                    </div>

                    {/* Badge 4: Selesai */}
                    <div className="px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-700 flex items-center gap-1.5 text-xs font-bold">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{selesaiTotal}</span>
                      <span className="text-[10px] font-medium text-emerald-600/80">Selesai</span>
                    </div>
                  </div>
                </div>

                {/* 2. Filter Bar Floating Layer (Ringkas & Menyesuaikan Lebar Konten) */}
                <div className="w-fit max-w-full bg-white/95 backdrop-blur-md p-1.5 rounded-2xl border border-slate-200/90 shadow-[0_4px_20px_rgba(0,0,0,0.08)] inline-flex items-center gap-1.5 pointer-events-auto transition-all duration-200">
                  {/* Search Input Box */}
                  <div className="relative w-44 sm:w-52 shrink-0">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Cari lokasi atau kode..."
                      className="w-full h-8 pl-8.5 pr-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs placeholder:text-slate-400 text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-orange-500/30 transition-all"
                    />
                  </div>

                  {/* Tombol Tanda Panah Buka/Tutup Filter */}
                  <button
                    type="button"
                    onClick={() => setIsFilterExpanded((prev) => !prev)}
                    className={`h-8 px-2 rounded-xl border transition-all flex items-center justify-center gap-1 text-xs font-bold cursor-pointer shadow-2xs ${
                      isFilterExpanded
                        ? "bg-orange-50 border-orange-200 text-orange-600"
                        : (selectedProvince !== "Semua Provinsi" || selectedDisaster !== "semua" || selectedStatus !== "semua")
                        ? "bg-orange-50/80 border-orange-200 text-orange-600"
                        : "bg-slate-50 hover:bg-slate-100 border-slate-200/80 text-slate-600"
                    }`}
                    title={isFilterExpanded ? "Sembunyikan filter" : "Buka filter (Semua Provinsi, Semua Bencana, Semua Status)"}
                  >
                    <ChevronRight
                      className={`w-4 h-4 transition-transform duration-200 ${
                        isFilterExpanded ? "rotate-180" : ""
                      }`}
                    />
                    {(selectedProvince !== "Semua Provinsi" || selectedDisaster !== "semua" || selectedStatus !== "semua") && !isFilterExpanded && (
                      <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
                    )}
                  </button>

                  {/* Dropdown Filter (Hanya tampil ketika dibuka) */}
                  {isFilterExpanded && (
                    <div className="flex items-center gap-1.5 animate-in fade-in slide-in-from-left-2 duration-200">
                      <div className="h-4 w-px bg-slate-200 mx-0.5" />

                      {/* Filter Provinsi */}
                      <div className="relative shrink-0">
                        <select
                          value={selectedProvince}
                          onChange={(e) => setSelectedProvince(e.target.value)}
                          className="h-8 pl-2.5 pr-6 rounded-xl border border-slate-200/80 bg-slate-50 hover:bg-white text-xs font-bold text-slate-700 focus:outline-none cursor-pointer appearance-none transition-all"
                        >
                          {PROVINCE_OPTIONS.map((p) => (
                            <option key={p} value={p}>
                              {p}
                            </option>
                          ))}
                        </select>
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                          <ChevronDown className="w-3 h-3" />
                        </div>
                      </div>

                      {/* Filter Bencana */}
                      <div className="relative shrink-0">
                        <select
                          value={selectedDisaster}
                          onChange={(e) => setSelectedDisaster(e.target.value as DisasterType | "semua")}
                          className="h-8 pl-2.5 pr-6 rounded-xl border border-slate-200/80 bg-slate-50 hover:bg-white text-xs font-bold text-slate-700 focus:outline-none cursor-pointer appearance-none transition-all"
                        >
                          <option value="semua">Semua Bencana</option>
                          <option value="banjir">Banjir</option>
                          <option value="longsor">Tanah Longsor</option>
                          <option value="kebakaran">Kebakaran</option>
                          <option value="gempa">Gempa Bumi</option>
                          <option value="karhutla">Karhutla</option>
                          <option value="lainnya">Lainnya</option>
                        </select>
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                          <ChevronDown className="w-3 h-3" />
                        </div>
                      </div>

                      {/* Filter Status */}
                      <div className="relative shrink-0">
                        <select
                          value={selectedStatus}
                          onChange={(e) => setSelectedStatus(e.target.value as ReportStatus | "sos" | "semua")}
                          className="h-8 pl-2.5 pr-6 rounded-xl border border-slate-200/80 bg-slate-50 hover:bg-white text-xs font-bold text-slate-700 focus:outline-none cursor-pointer appearance-none transition-all"
                        >
                          <option value="semua">Semua Status</option>
                          <option value="diterima">Status: Diterima</option>
                          <option value="diverifikasi">Status: Diverifikasi</option>
                          <option value="ditindaklanjuti">Status: Ditindaklanjuti</option>
                          <option value="selesai">Status: Selesai</option>
                          <option value="sos">Khusus Sinyal SOS Darurat</option>
                        </select>
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                          <ChevronDown className="w-3 h-3" />
                        </div>
                      </div>
                    </div>
                  )}

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
                      Reset
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* ============================================================== */}
            {/* HUD NAVIGASI TAKTIS PUSDALOPS SIGAPBUMI (DESKTOP)              */}
            {/* ============================================================== */}
            {isLiveNavigating && activeRoute && (
              <>
                {/* Top Left: Tactical Emergency Command HUD (Tema Oranye dengan Ikon Sign Manuver Belok/Lurus) */}
                <div className="absolute top-3.5 left-3.5 z-[550] bg-orange-600 rounded-2xl border border-[#F97316] shadow-[0_12px_32px_rgba(234,88,12,0.35)] p-3 text-white w-[290px] sm:w-[320px] animate-in slide-in-from-top-4 duration-300 pointer-events-auto select-none">
                  {/* Operation Status Bar Bersih */}
                  <div className="flex items-center gap-2 pb-2 mb-2.5 border-b border-[#F97316]/60 min-w-0">
                    <span className="w-2 h-2 rounded-full bg-white animate-pulse shrink-0" />
                    <span className="text-xs text-orange-50 font-semibold truncate min-w-0 flex-1">
                      {selectedPoint?.location_name || "Menuju Titik Sasaran"}
                    </span>
                  </div>

                  {/* Turn-by-Turn Instruction dengan Ikon Sign Belokan */}
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#F97316]/60 border border-orange-400/50 text-white flex items-center justify-center shrink-0 shadow-inner">
                      {renderManeuverIcon(activeRoute.steps?.[0]?.modifier, activeRoute.steps?.[0]?.instruction)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-xl font-black text-white tracking-tight leading-none">
                          {activeRoute.steps?.[0]?.distanceFormatted || activeRoute.distanceFormatted}
                        </span>
                        <span className="text-[10px] text-orange-200 font-bold uppercase tracking-wider">
                          Manuver
                        </span>
                      </div>
                      <p className="text-xs font-bold text-white truncate mt-1">
                        {activeRoute.steps?.[0]?.instruction || `Menuju ${selectedPoint?.location_name || "Lokasi Kejadian"}`}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Bottom Center: Tactical Telemetry Dock (Desain Terpadu, Responsif & Rapi dalam 1 Kapsul) */}
                <div className="absolute bottom-4 sm:bottom-5 inset-x-3 sm:inset-x-4 z-[550] flex justify-center pointer-events-none">
                  <div className="bg-white/95 backdrop-blur-xl rounded-2xl sm:rounded-full border border-slate-200/90 shadow-[0_12px_36px_rgba(0,0,0,0.18)] py-2 px-3.5 sm:px-5 flex flex-wrap sm:flex-nowrap items-center justify-center gap-2.5 sm:gap-3.5 select-none animate-in slide-in-from-bottom-4 duration-300 pointer-events-auto max-w-full">
                    {/* Telemetri Waktu & ETA */}
                    <div className="flex items-center gap-2 sm:gap-2.5 sm:border-r border-slate-200 sm:pr-3.5 shrink-0">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-orange-50 border border-orange-200 flex items-center justify-center shrink-0">
                        <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-orange-600" />
                      </div>
                      <div className="shrink-0">
                        <span className="text-[8px] sm:text-[9px] text-slate-400 font-bold uppercase tracking-wider block">
                          Estimasi Tiba
                        </span>
                        <div className="flex items-baseline gap-1 sm:gap-1.5 mt-0.5">
                          <span className="text-xs sm:text-sm font-black text-orange-600 leading-none">
                            {activeRoute.durationFormattedShort}
                          </span>
                          <span className="text-[10px] sm:text-[11px] font-semibold text-slate-500 hidden sm:inline">
                            ({activeRoute.arrivalTimeFormatted})
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Telemetri Jarak & Rute */}
                    <div className="flex items-center gap-2 sm:gap-2.5 sm:border-r border-slate-200 sm:pr-3.5 shrink-0">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-orange-50 border border-orange-200 flex items-center justify-center shrink-0">
                        <Route className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-orange-600" />
                      </div>
                      <div className="shrink-0">
                        <span className="text-[8px] sm:text-[9px] text-slate-400 font-bold uppercase tracking-wider block">
                          Jarak Tempuh
                        </span>
                        <div className="flex items-baseline gap-0.5 sm:gap-1 mt-0.5">
                          <span className="text-xs sm:text-sm font-black text-slate-900 leading-none">
                            {activeRoute.distanceKm}
                          </span>
                          <span className="text-[9px] sm:text-[10px] text-slate-500 font-bold">km</span>
                        </div>
                      </div>
                    </div>

                    {/* Tombol Aksi Armada (Di dalam satu kapsul rapi, tidak keluar shape) */}
                    <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={triggerLocate}
                        className="h-7 sm:h-8 px-2.5 sm:px-3 rounded-full border border-slate-200/90 bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-700 text-[11px] sm:text-xs font-bold inline-flex items-center gap-1 sm:gap-1.5 transition-colors cursor-pointer shadow-2xs whitespace-nowrap shrink-0"
                        title="Pusatkan Kamera ke Posisi Armada"
                      >
                        <Crosshair className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-orange-600" />
                        <span className="whitespace-nowrap">Fokus Armada</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleExitLiveNavigation}
                        className="h-7 sm:h-8 px-2.5 sm:px-3.5 rounded-full bg-rose-50 hover:bg-rose-100 active:bg-rose-200 border border-rose-200 text-rose-600 text-[11px] sm:text-xs font-bold inline-flex items-center gap-1 sm:gap-1.5 transition-colors cursor-pointer shadow-2xs active:scale-95 whitespace-nowrap shrink-0"
                        title="Akhiri Navigasi Rute"
                      >
                        <X className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-rose-600 stroke-[2.5]" />
                        <span className="whitespace-nowrap">Akhiri</span>
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Hint Terapung dihapus agar tampilan peta bersih dan lega */}

            {/* Quick Layer Switcher Pill Desktop (Terang, Mode Malam, Satelit) */}
            {!isLiveNavigating && (
              <div className="absolute bottom-4 left-4 z-20 flex items-center gap-1 p-1 bg-white/95 backdrop-blur-md rounded-xl border border-slate-200/90 shadow-sm text-[11px] font-bold">
                <button
                  type="button"
                  onClick={() => handleSwitchLayer("light")}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                    mapLayer === "light"
                      ? "bg-slate-900 text-white shadow-2xs"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                  title="Gaya OpenStreetMap Terang"
                >
                  <Sun className="w-3.5 h-3.5" />
                  <span>Terang</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSwitchLayer("dark")}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                    mapLayer === "dark"
                      ? "bg-slate-900 text-white shadow-2xs"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                  title="Gaya Mode Malam Taktis (Dark Canvas)"
                >
                  <Moon className="w-3.5 h-3.5" />
                  <span>Malam</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSwitchLayer("satellite")}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                    mapLayer === "satellite"
                      ? "bg-slate-900 text-white shadow-2xs"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                  title="Citra Satelit Topografi"
                >
                  <Satellite className="w-3.5 h-3.5" />
                  <span>Satelit</span>
                </button>
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
                  <div className="col-span-2 pt-1 border-t border-slate-200/60 flex items-center justify-between">
                    <span className="text-slate-400 text-[10px] font-medium">Konfirmasi Warga</span>
                    <span className="font-bold text-amber-600 text-xs">
                      {selectedPoint.confirmation_count} Saksi
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-2 pt-1">
                  {/* Widget Rute Navigasi Aktif dengan Estimasi Waktu */}
                  {activeRoute ? (
                    <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs space-y-2.5 animate-in fade-in duration-200">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                          <Route className="w-4 h-4 text-blue-600 animate-pulse" />
                          <span>Navigasi Taktis di Peta</span>
                        </span>
                        <button
                          type="button"
                          onClick={handleClearRoute}
                          className="text-[11px] font-bold text-slate-500 hover:text-slate-800 px-2.5 py-1 rounded-xl bg-white border border-slate-200 cursor-pointer shadow-2xs hover:bg-slate-50 transition-colors"
                        >
                          Tutup Rute
                        </button>
                      </div>

                      {/* Baris Metrik Jarak & Estimasi Waktu */}
                      <div className="grid grid-cols-2 gap-2">
                        <div className="bg-slate-50/80 p-2.5 rounded-lg border border-slate-200 shadow-2xs">
                          <span className="text-[10px] text-slate-500 font-medium block">Jarak Tempuh</span>
                          <span className="text-base font-extrabold text-slate-900 block mt-0.5 leading-none">
                            {activeRoute.distanceFormatted}
                          </span>
                        </div>
                        <div className="bg-slate-50/80 p-2.5 rounded-lg border border-slate-200 shadow-2xs">
                          <span className="text-[10px] text-slate-500 font-medium block">Estimasi Waktu</span>
                          <span className="text-base font-extrabold text-emerald-600 block mt-0.5 leading-none">
                            {activeRoute.durationFormatted}
                          </span>
                        </div>
                      </div>

                      <p className="text-[11px] text-slate-600 font-medium flex items-center gap-1.5">
                        <Car className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <span>{activeRoute.summary}</span>
                      </p>

                      <button
                        type="button"
                        onClick={handleStartLiveNavigation}
                        className="w-full h-10 px-4 rounded-xl bg-orange-600 hover:bg-orange-700 active:bg-orange-800 text-white text-xs font-bold inline-flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer active:scale-98"
                      >
                        <Navigation className="w-4 h-4 text-white fill-white" />
                        <span>Mulai Rute</span>
                      </button>
                    </div>
                  ) : (
                    <div>
                      <button
                        type="button"
                        onClick={() => handleStartNavigation(selectedPoint)}
                        disabled={isCalculatingRoute}
                        className="w-full h-10 px-4 rounded-xl bg-orange-600 hover:bg-orange-700 active:bg-orange-800 text-white text-xs font-bold inline-flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer active:scale-98"
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
        {/* Floating Compact Legend Pill Desktop (Bottom Right) */}
        {!isLiveNavigating && (
          <div className="absolute bottom-9 right-4 z-20 hidden lg:flex items-center gap-3 px-3 py-1.5 bg-white/95 backdrop-blur-md rounded-xl border border-slate-200/90 shadow-sm text-[11px] text-slate-600">
            <span className="inline-flex items-center gap-1.5 font-medium">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              <span>Banjir</span>
            </span>
            <span className="inline-flex items-center gap-1.5 font-medium">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span>Longsor</span>
            </span>
            <span className="inline-flex items-center gap-1.5 font-medium">
              <span className="w-2 h-2 rounded-full bg-red-500" />
              <span>Kebakaran</span>
            </span>
            <span className="inline-flex items-center gap-1.5 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Gempa</span>
            </span>
            <span className="inline-flex items-center gap-1.5 font-medium">
              <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping" />
              <span>SOS</span>
            </span>
            <span className="h-3.5 w-px bg-slate-200" />
            <span className="font-bold text-slate-700">
              {filteredPoints.length} titik
            </span>
          </div>
        )}
      </div>
    </>
  );
}

export default function AdminPetaPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full h-[600px] rounded-xl bg-slate-100 flex flex-col items-center justify-center text-slate-400 font-sans">
          <RotateCw className="w-8 h-8 animate-spin text-orange-500 mb-2" />
          <p className="text-sm font-bold text-slate-700">Memuat Peta Operasional...</p>
        </div>
      }
    >
      <AdminPetaContent />
    </Suspense>
  );
}

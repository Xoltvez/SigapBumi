"use client";

import React, { useState, useMemo, useEffect, useRef, useCallback, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import gsap from "gsap";
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
  Crosshair,
  SlidersHorizontal,
  Plus,
  Minus,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
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
  getCachedLiveReports,
} from "@/lib/services/reports";
import { fetchLiveSosAlerts } from "@/lib/services/sos";
import DisasterIcon, { getDisasterLabel } from "@/components/common/DisasterIcon";

// Dynamic import for Leaflet client component (avoid SSR window error)
const DisasterMap = dynamic(() => import("@/components/peta/DisasterMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[500px] md:min-h-[600px] rounded-lg bg-slate-900/10 dark:bg-slate-900 border border-line/60 flex flex-col items-center justify-center text-slate-500 backdrop-blur-xs select-none">
      <div className="relative mb-3 flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
        <MapPin className="w-5 h-5 text-primary absolute" />
      </div>
      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Menyiapkan Peta Kejadian...</p>
      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Memuat geospasial & sinkronisasi koordinat</p>
    </div>
  ),
});

const INITIAL_POINTS: MapPoint[] = reportsToMapPoints(DEFAULT_MOCK_REPORTS);

function PetaContent() {
  const searchParams = useSearchParams();
  const urlKode = searchParams.get("kode");
  const urlLat = searchParams.get("lat");
  const urlLng = searchParams.get("lng");

  const [points, setPoints] = useState<MapPoint[]>(() => {
    const cached = getCachedLiveReports();
    if (cached && cached.length > 0) {
      return reportsToMapPoints(cached);
    }
    return INITIAL_POINTS;
  });
  const [isLiveConnected, setIsLiveConnected] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<"peta" | "daftar">("peta");
  const [selectedCategory, setSelectedCategory] = useState<DisasterType | "semua">("semua");
  const [selectedStatus, setSelectedStatus] = useState<ReportStatus | "semua">("semua");
  const [selectedRegion, setSelectedRegion] = useState<string>("Semua Wilayah");
  const [showSos, setShowSos] = useState<boolean>(true);
  const [selectedPoint, setSelectedPoint] = useState<MapPoint | null>(null);

  // State & Ref khusus drawer & filter mobile dengan gestur drag / swipe GSAP
  const [isMobileSheetOpen, setIsMobileSheetOpen] = useState(false);
  const mobileSheetRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef<number>(0);
  const touchCurrentY = useRef<number>(0);
  const isDragging = useRef<boolean>(false);

  // Tinggi sheet saat diciutkan (minimized peek height yang presisi tanpa ruang kosong di bawah)
  const collapsedHeight = selectedPoint ? 88 : 58;

  // Tinggi sheet saat dibuka (kompak dan presisi membungkus isi filter tanpa ruang kosong agar peta terlihat leluasa)
  const getExpandedHeight = useCallback(() => {
    if (typeof window === "undefined") return selectedPoint ? 370 : 275;
    return selectedPoint
      ? Math.min(370, window.innerHeight * 0.5)
      : Math.min(275, window.innerHeight * 0.38);
  }, [selectedPoint]);

  // Animasi GSAP pembukaan & penutupan Mobile Bottom Sheet
  useEffect(() => {
    if (!mobileSheetRef.current) return;
    if (isMobileSheetOpen) {
      gsap.to(mobileSheetRef.current, {
        height: getExpandedHeight(),
        duration: 0.35,
        ease: "power2.out",
        overwrite: "auto",
      });

      const contentEl = mobileSheetRef.current.querySelector(".mobile-sheet-content");
      if (contentEl) {
        gsap.fromTo(
          contentEl,
          { opacity: 0, y: 10 },
          { opacity: 1, y: 0, duration: 0.25, delay: 0.05, ease: "power2.out", overwrite: "auto" }
        );
      }
    } else {
      gsap.to(mobileSheetRef.current, {
        height: collapsedHeight,
        duration: 0.3,
        ease: "power2.inOut",
        overwrite: "auto",
      });
    }
  }, [isMobileSheetOpen, collapsedHeight, getExpandedHeight]);

  // Touch gesture handlers untuk membuka & menutup sheet dengan drag / swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
    touchCurrentY.current = e.touches[0].clientY;
    isDragging.current = true;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current || !mobileSheetRef.current) return;
    touchCurrentY.current = e.touches[0].clientY;
    const deltaY = touchCurrentY.current - touchStartY.current;
    const maxH = getExpandedHeight();

    // Respon interaktif visual saat ditarik secara realtime
    if (!isMobileSheetOpen && deltaY < 0) {
      const targetHeight = Math.min(collapsedHeight + Math.abs(deltaY) * 0.9, maxH);
      gsap.set(mobileSheetRef.current, { height: targetHeight });
    } else if (isMobileSheetOpen && deltaY > 0) {
      const targetHeight = Math.max(collapsedHeight, maxH - deltaY * 0.9);
      gsap.set(mobileSheetRef.current, { height: targetHeight });
    }
  };

  const handleTouchEnd = () => {
    if (!isDragging.current) return;
    isDragging.current = false;
    const deltaY = touchCurrentY.current - touchStartY.current;
    const maxH = getExpandedHeight();

    if (!isMobileSheetOpen && deltaY < -25) {
      setIsMobileSheetOpen(true);
    } else if (isMobileSheetOpen && deltaY > 25) {
      setIsMobileSheetOpen(false);
    } else if (mobileSheetRef.current) {
      gsap.to(mobileSheetRef.current, {
        height: isMobileSheetOpen ? maxH : collapsedHeight,
        duration: 0.25,
        ease: "power2.out",
      });
    }
  };

  // Mouse gesture handlers (untuk testing drag di desktop browser inspect mode)
  const handleMouseDown = (e: React.MouseEvent) => {
    touchStartY.current = e.clientY;
    touchCurrentY.current = e.clientY;
    isDragging.current = true;
    const maxH = getExpandedHeight();

    const onMouseMove = (moveEvent: MouseEvent) => {
      if (!isDragging.current || !mobileSheetRef.current) return;
      touchCurrentY.current = moveEvent.clientY;
      const deltaY = touchCurrentY.current - touchStartY.current;

      if (!isMobileSheetOpen && deltaY < 0) {
        const targetHeight = Math.min(collapsedHeight + Math.abs(deltaY) * 0.9, maxH);
        gsap.set(mobileSheetRef.current, { height: targetHeight });
      } else if (isMobileSheetOpen && deltaY > 0) {
        const targetHeight = Math.max(collapsedHeight, maxH - deltaY * 0.9);
        gsap.set(mobileSheetRef.current, { height: targetHeight });
      }
    };

    const onMouseUp = () => {
      isDragging.current = false;
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      const deltaY = touchCurrentY.current - touchStartY.current;

      if (!isMobileSheetOpen && deltaY < -25) {
        setIsMobileSheetOpen(true);
      } else if (isMobileSheetOpen && deltaY > 25) {
        setIsMobileSheetOpen(false);
      } else if (mobileSheetRef.current) {
        gsap.to(mobileSheetRef.current, {
          height: isMobileSheetOpen ? maxH : collapsedHeight,
          duration: 0.25,
          ease: "power2.out",
        });
      }
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  };

  // Handler saat konten di-swipe ke bawah ketika scroll berada di paling atas
  const handleContentTouchStart = (e: React.TouchEvent) => {
    const el = e.currentTarget;
    if (el.scrollTop <= 0) {
      touchStartY.current = e.touches[0].clientY;
      touchCurrentY.current = e.touches[0].clientY;
      isDragging.current = true;
    }
  };

  const handleContentTouchMove = (e: React.TouchEvent) => {
    const el = e.currentTarget;
    if (!isDragging.current || el.scrollTop > 0 || !mobileSheetRef.current) return;
    touchCurrentY.current = e.touches[0].clientY;
    const deltaY = touchCurrentY.current - touchStartY.current;
    if (deltaY > 0) {
      const maxH = getExpandedHeight();
      const targetHeight = Math.max(collapsedHeight, maxH - deltaY * 0.9);
      gsap.set(mobileSheetRef.current, { height: targetHeight });
    }
  };

  const handleContentTouchEnd = () => {
    if (!isDragging.current) return;
    isDragging.current = false;
    const deltaY = touchCurrentY.current - touchStartY.current;
    if (deltaY > 25) {
      setIsMobileSheetOpen(false);
    } else if (mobileSheetRef.current) {
      gsap.to(mobileSheetRef.current, {
        height: getExpandedHeight(),
        duration: 0.25,
        ease: "power2.out",
      });
    }
  };

  // State khusus tampilan desktop modern sesuai referensi
  const [desktopSearch, setDesktopSearch] = useState<string>("");
  const [desktopFilterCategory, setDesktopFilterCategory] = useState<"semua" | "posko" | "laporan" | "sos">("semua");
  const [isDesktopPanelOpen, setIsDesktopPanelOpen] = useState<boolean>(false);
  const desktopPanelRef = useRef<HTMLDivElement>(null);
  const desktopTriggerContainerRef = useRef<HTMLDivElement>(null);
  const desktopDetailCardRef = useRef<HTMLDivElement>(null);
  const isFirstRender = useRef<boolean>(true);

  // Animasi halus saat titik kejadian dipilih / berganti titik via GSAP
  useEffect(() => {
    if (selectedPoint && desktopDetailCardRef.current) {
      gsap.fromTo(
        desktopDetailCardRef.current,
        { x: -35, opacity: 0, scale: 0.96 },
        { x: 0, opacity: 1, scale: 1, duration: 0.35, ease: "power3.out" }
      );
    }
  }, [selectedPoint]);

  // Animasi halus Maximize & Minimize panel filter desktop via GSAP (Smooth Scale & Bloom)
  useEffect(() => {
    const panel = desktopPanelRef.current;
    const trigger = desktopTriggerContainerRef.current;
    if (!panel || !trigger) return;

    if (isFirstRender.current) {
      isFirstRender.current = false;
      if (isDesktopPanelOpen) {
        gsap.set(panel, { opacity: 1, scale: 1, y: 0, x: 0, pointerEvents: "auto", display: "flex", transformOrigin: "top left" });
        gsap.set(trigger, { opacity: 0, scale: 0.96, y: 0, x: 0, pointerEvents: "none", display: "none", transformOrigin: "top left" });
      } else {
        gsap.set(panel, { opacity: 0, scale: 0.95, y: -6, x: 0, pointerEvents: "none", display: "none", transformOrigin: "top left" });
        gsap.set(trigger, { opacity: 1, scale: 1, y: 0, x: 0, pointerEvents: "auto", display: "block", transformOrigin: "top left" });
      }
      return;
    }

    if (isDesktopPanelOpen) {
      gsap.killTweensOf([panel, trigger]);

      // 1. Sembunyikan trigger pill secara halus di tempatnya
      gsap.to(trigger, {
        opacity: 0,
        scale: 0.96,
        duration: 0.16,
        ease: "power2.inOut",
        onComplete: () => {
          gsap.set(trigger, { display: "none", pointerEvents: "none" });
        },
      });

      // 2. Tampilkan panel dengan efek bloom/scale expansion natural dari posisi tombol (tanpa geser kaku dari kiri ke kanan)
      gsap.set(panel, { display: "flex", pointerEvents: "auto", transformOrigin: "top left" });
      gsap.fromTo(
        panel,
        { opacity: 0, scale: 0.95, y: -8, x: 0 },
        {
          opacity: 1,
          scale: 1,
          y: 0,
          x: 0,
          duration: 0.36,
          ease: "power3.out",
        }
      );
    } else {
      gsap.killTweensOf([panel, trigger]);

      // 1. Sembunyikan panel dengan menciut lembut kembali ke posisi pill
      gsap.to(panel, {
        opacity: 0,
        scale: 0.96,
        y: -6,
        duration: 0.22,
        ease: "power2.inOut",
        onComplete: () => {
          gsap.set(panel, { display: "none", pointerEvents: "none" });
        },
      });

      // 2. Munculkan kembali tombol trigger pill dengan transisi mulus
      gsap.set(trigger, { display: "block", pointerEvents: "auto", transformOrigin: "top left" });
      gsap.fromTo(
        trigger,
        { opacity: 0, scale: 0.96, y: -4, x: 0 },
        {
          opacity: 1,
          scale: 1,
          y: 0,
          x: 0,
          duration: 0.28,
          ease: "power3.out",
          delay: 0.04,
        }
      );
    }
  }, [isDesktopPanelOpen]);

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
        const [liveReports, liveSos] = await Promise.all([
          fetchLiveReports(),
          fetchLiveSosAlerts(),
        ]);

        const reportPoints = (liveReports && liveReports.length > 0)
          ? reportsToMapPoints(liveReports)
          : INITIAL_POINTS;

        // Map live SOS alerts into MapPoints
        const activeSos: MapPoint[] = (liveSos || [])
          .filter((s) => s.status === "aktif" || s.status === "ditangani")
          .map((s) => {
            const rawLat = Number(s.lat);
            const rawLng = Number(s.lng);
            const validLat = !isNaN(rawLat) && isFinite(rawLat) ? rawLat : -6.3276;
            const validLng = !isNaN(rawLng) && isFinite(rawLng) ? rawLng : 108.3249;
            const resolvedStatus: ReportStatus =
              s.status === "ditangani" ? "ditindaklanjuti" : "diterima";

            return {
              id: s.id,
              tracking_code:
                s.tracking_code ||
                (s.id.startsWith("SOS") ? s.id : `SOS-${s.id.slice(0, 4).toUpperCase()}`),
              disaster_type: (s.assistance_type === "damkar" ? "kebakaran" : "lainnya") as DisasterType,
              title: `Panggilan Darurat: Bantuan ${s.assistance_type.toUpperCase()}`,
              location_name: s.address,
              lat: validLat,
              lng: validLng,
              status: resolvedStatus,
              created_at: s.time_ago || "Baru saja",
              confirmation_count: 1,
              is_sos: true,
              is_demo: false,
              province: s.address.includes("Jakarta") ? "DKI Jakarta" : "Jawa Barat",
            };
          });

        // Gabungkan tanpa duplikasi ID atau tracking code (utamakan data dari reports agar status & konfirmasi riil terjaga)
        const merged: MapPoint[] = [...reportPoints];
        for (const sosPt of activeSos) {
          if (
            !merged.some(
              (m) =>
                m.id === sosPt.id ||
                (m.tracking_code &&
                  sosPt.tracking_code &&
                  m.tracking_code.toUpperCase() === sosPt.tracking_code.toUpperCase())
            )
          ) {
            merged.unshift(sosPt);
          }
        }

        const safePoints = merged.filter(
          (p) =>
            typeof p.lat === "number" &&
            !isNaN(p.lat) &&
            isFinite(p.lat) &&
            typeof p.lng === "number" &&
            !isNaN(p.lng) &&
            isFinite(p.lng)
        );

        if (isMounted) {
          setPoints(safePoints);
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

  // Data terfilter untuk Mode Desktop Modern (sinkron dengan filter peta)
  const desktopPoints = useMemo(() => {
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
      if (desktopSearch.trim()) {
        const q = desktopSearch.toLowerCase().trim();
        const matchTitle = pt.title?.toLowerCase().includes(q);
        const matchLoc = pt.location_name?.toLowerCase().includes(q);
        const matchCode = pt.tracking_code?.toLowerCase().includes(q);
        const matchType = pt.disaster_type?.toLowerCase().includes(q);
        if (!matchTitle && !matchLoc && !matchCode && !matchType) return false;
      }
      return true;
    });
  }, [points, selectedCategory, selectedStatus, selectedRegion, showSos, desktopSearch]);

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

        {/* Floating Right Control Stack (Lokasi Saya, Filter, Zoom) */}
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

        {/* Floating Bottom Sheet (Filter & Info Titik di Bawah dengan Gestur Drag / Swipe GSAP) */}
        <div
          ref={mobileSheetRef}
          className="absolute inset-x-0 bottom-0 z-30 bg-white rounded-t-3xl shadow-[0_-8px_24px_rgba(0,0,0,0.14)] border-t border-slate-200/80 flex flex-col overflow-hidden will-change-[height]"
          style={{ height: isMobileSheetOpen ? getExpandedHeight() : collapsedHeight }}
        >
          {/* Handle Bar Drag Area (Mendukung sentuhan / scroll tarik ke atas dan ke bawah) */}
          <div
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onMouseDown={handleMouseDown}
            onClick={() => setIsMobileSheetOpen((prev) => !prev)}
            className="pt-2.5 pb-1 flex flex-col items-center cursor-grab active:cursor-grabbing select-none"
            title="Geser atau klik untuk membuka / menutup filter"
          >
            <div className="w-12 h-1.5 bg-slate-300 hover:bg-slate-400 rounded-full transition-colors active:scale-95" />
          </div>

          {/* Header Bottom Sheet */}
          <div
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onClick={() => setIsMobileSheetOpen((prev) => !prev)}
            className="px-4 py-2 flex items-center justify-between gap-3 border-b border-slate-100 select-none cursor-pointer"
          >
            {selectedPoint ? (
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-1.5 mb-0.5">
                  {selectedPoint.is_sos && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700">
                      SOS DARURAT
                    </span>
                  )}
                  <span className="text-[10px] font-bold font-mono px-2 py-0.5 bg-slate-100 text-slate-800 rounded">
                    {selectedPoint.tracking_code}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${
                      selectedPoint.status === "selesai"
                        ? "bg-emerald-100 text-emerald-700"
                        : selectedPoint.status === "ditindaklanjuti"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    {selectedPoint.status}
                  </span>
                </div>
                <h4 className="text-xs font-bold text-slate-900 truncate">
                  {selectedPoint.title}
                </h4>
                <p className="text-[10px] text-slate-500 truncate flex items-center gap-1">
                  <MapPin className="w-3 h-3 shrink-0 text-slate-400" />
                  <span>{selectedPoint.location_name}</span>
                </p>
                <div className="flex items-center gap-2 mt-1">
                  {!selectedPoint.is_sos && (
                    <span className="text-[10px] font-semibold text-slate-700 flex items-center gap-1">
                      <DisasterIcon type={selectedPoint.disaster_type} size={14} />
                      <span>{getDisasterLabel(selectedPoint.disaster_type)}</span>
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded border border-slate-200 bg-white text-[9px] font-semibold text-slate-700">
                    <ThumbsUp className="w-2.5 h-2.5 text-orange-500" />
                    <span>{selectedPoint.confirmation_count ?? 0} Terkonfirmasi</span>
                  </span>
                </div>
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

          {/* Body Konten Bottom Sheet (Saat Di-expand dengan GSAP & gestur scroll) */}
          <div
            onTouchStart={handleContentTouchStart}
            onTouchMove={handleContentTouchMove}
            onTouchEnd={handleContentTouchEnd}
            className={`mobile-sheet-content flex-1 overflow-y-auto px-4 pt-3 pb-3.5 space-y-3 touch-pan-y ${
              isMobileSheetOpen ? "block" : "hidden"
            }`}
          >
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

                {selectedPoint.tracking_code && (
                  <Link
                    href={`/lacak?kode=${encodeURIComponent(selectedPoint.tracking_code)}`}
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

        {/* Kiri Atas: Trigger Pill Minimized */}
        <div
          ref={desktopTriggerContainerRef}
          className="absolute top-5 left-6 z-20"
        >
          <button
            type="button"
            onClick={() => setIsDesktopPanelOpen(true)}
            className="group bg-white/95 backdrop-blur-md shadow-xl border border-slate-200/90 rounded-2xl px-4 py-3 flex items-center gap-3 hover:bg-slate-50 transition-colors text-slate-800 cursor-pointer hover:shadow-2xl select-none"
            title="Buka Filter Peta Kejadian"
          >
            <div className="w-8 h-8 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-2xs">
              <SlidersHorizontal className="w-4 h-4" />
            </div>
            <div className="text-left">
              <div className="flex items-center gap-2">
                <span className="text-xs font-extrabold text-slate-900">
                  Filter Peta Kejadian
                </span>
                <span className="text-[10px] font-bold bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
                  {desktopPoints.length} Titik
                </span>
              </div>
              <p className="text-[10px] text-slate-400">Klik untuk membuka filter &amp; cari kejadian</p>
            </div>
            <div className="w-7 h-7 rounded-lg bg-slate-100 group-hover:bg-orange-50 text-slate-400 group-hover:text-orange-600 flex items-center justify-center transition-colors shrink-0 ml-1">
              <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
            </div>
          </button>
        </div>

        {/* Kiri Atas: Panel Filter Lengkap Maximized */}
        <div
          ref={desktopPanelRef}
          className="absolute top-5 left-6 z-20 w-[380px] lg:w-[410px] max-h-[calc(100vh-6.5rem)] flex flex-col bg-white/98 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-200/90 overflow-hidden select-none"
        >
          {/* Header Panel */}
          <div className="p-3.5 px-4 bg-slate-50/90 border-b border-slate-100 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center shrink-0 shadow-2xs">
                <SlidersHorizontal className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-extrabold text-slate-900 truncate">
                    Filter Peta Kejadian
                  </h3>
                  <span className="text-[10px] font-bold bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full shrink-0">
                    {desktopPoints.length} Titik
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 truncate mt-0.5">
                  Saring sebaran laporan bencana &amp; darurat
                </p>
              </div>
            </div>

            {/* Tombol Minimize (Hanya Icon Chevron Left tanpa teks Minimize) */}
            <button
              type="button"
              onClick={() => setIsDesktopPanelOpen(false)}
              className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-600 hover:text-slate-900 flex items-center justify-center transition-all cursor-pointer shadow-2xs active:scale-95"
              title="Kecilkan Panel"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>

          {/* Body Konten Filter Desktop */}
          <div className="overflow-y-auto p-4 space-y-4 max-h-[calc(100vh-11rem)] scrollbar-thin">
                {/* Search Bar Terintegrasi Langsung dalam Filter */}
                <div className="relative">
                  <div className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 flex items-center gap-2 focus-within:border-orange-500 focus-within:ring-2 focus-within:ring-orange-200/60 transition-all shadow-2xs">
                    <Search className="w-4 h-4 text-slate-400 shrink-0" />
                    <input
                      type="text"
                      value={desktopSearch}
                      onChange={(e) => setDesktopSearch(e.target.value)}
                      placeholder="Cari titik kejadian, wilayah, atau jalan..."
                      className="w-full bg-transparent text-xs text-slate-800 placeholder:text-slate-400 border-none outline-none focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0"
                    />
                    {desktopSearch && (
                      <button
                        type="button"
                        onClick={() => setDesktopSearch("")}
                        className="text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                        title="Hapus kata kunci pencarian"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              {/* 1. Filter Wilayah / Provinsi */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Wilayah / Provinsi
                </span>
                <select
                  value={selectedRegion}
                  onChange={(e) => setSelectedRegion(e.target.value)}
                  className="w-full h-9 px-3 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-800 focus:outline-none focus:border-orange-500 cursor-pointer shadow-2xs"
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
              </div>

              {/* 2. Filter Jenis Bencana (Chips warna oranye saat aktif) */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Jenis Bencana
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { key: "semua", label: "Semua Kategori" },
                    { key: "banjir", label: "Banjir" },
                    { key: "gempa", label: "Gempa" },
                    { key: "kebakaran", label: "Kebakaran" },
                    { key: "longsor", label: "Longsor" },
                    { key: "karhutla", label: "Karhutla" },
                    { key: "lainnya", label: "Lainnya" },
                  ].map((cat) => {
                    const isSelected = selectedCategory === cat.key;
                    return (
                      <button
                        key={cat.key}
                        type="button"
                        onClick={() => setSelectedCategory(cat.key as DisasterType | "semua")}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer shadow-2xs ${
                          isSelected
                            ? "bg-orange-600 text-white ring-2 ring-orange-300/40 shadow-xs"
                            : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                        }`}
                      >
                        {cat.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 3. Filter Status Penanganan */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Status Penanganan
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { key: "semua", label: "Semua Status" },
                    { key: "diterima", label: "Diterima" },
                    { key: "diverifikasi", label: "Diverifikasi" },
                    { key: "ditindaklanjuti", label: "Ditindaklanjuti" },
                    { key: "selesai", label: "Selesai" },
                  ].map((st) => {
                    const isSelected = selectedStatus === st.key;
                    return (
                      <button
                        key={st.key}
                        type="button"
                        onClick={() => setSelectedStatus(st.key as ReportStatus | "semua")}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer shadow-2xs ${
                          isSelected
                            ? "bg-slate-900 text-white ring-2 ring-slate-400/30 shadow-xs"
                            : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                        }`}
                      >
                        {st.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 4. Toggle Sinyal SOS Darurat */}
              <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100/70 border border-slate-200/90 cursor-pointer transition-colors shadow-2xs">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-ping" />
                  <span>Tampilkan Sinyal SOS Darurat</span>
                </span>
                <input
                  type="checkbox"
                  checked={showSos}
                  onChange={(e) => setShowSos(e.target.checked)}
                  className="w-4 h-4 accent-rose-600 rounded cursor-pointer"
                />
              </label>

              {/* 5. Tombol Reset Filter */}
              {(selectedCategory !== "semua" ||
                selectedStatus !== "semua" ||
                selectedRegion !== "Semua Wilayah" ||
                !showSos ||
                desktopSearch) && (
                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCategory("semua");
                      setSelectedStatus("semua");
                      setSelectedRegion("Semua Wilayah");
                      setShowSos(true);
                      setDesktopSearch("");
                    }}
                    className="text-xs font-bold text-orange-600 hover:text-orange-700 hover:underline cursor-pointer"
                  >
                    Reset Semua Filter
                  </button>
                  <span className="text-[11px] font-semibold text-slate-500">
                    {desktopPoints.length} titik aktif
                  </span>
                </div>
              )}
            </div>
          </div>

        {/* Kiri: Kartu Informasi Detail Titik Kejadian Terpisah dengan Animasi GSAP */}
        {selectedPoint && (
          <div
            ref={desktopDetailCardRef}
            className={`absolute z-30 w-[360px] lg:w-[390px] bg-white/98 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-200/90 overflow-hidden select-none transition-all duration-300 ease-out ${
              isDesktopPanelOpen
                ? "left-[400px] lg:left-[430px] top-5 max-h-[calc(100vh-6.5rem)]"
                : "left-6 top-24 max-h-[calc(100vh-10rem)]"
            }`}
          >
            {/* Header Kartu Detail */}
            <div className="p-3.5 px-4 bg-slate-50/90 border-b border-slate-100 flex items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-1.5 min-w-0">
                {selectedPoint.is_sos && (
                  <span className="text-[10px] font-black uppercase tracking-wider text-rose-700 bg-rose-100 border border-rose-200 px-2 py-0.5 rounded-full flex items-center gap-1.5 shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-ping" />
                    <span>SOS Darurat</span>
                  </span>
                )}
                {selectedPoint.tracking_code && (
                  <span className="text-[10px] font-bold font-mono px-2 py-0.5 bg-orange-100 text-orange-800 rounded-md shrink-0">
                    {selectedPoint.tracking_code}
                  </span>
                )}
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize shrink-0 ${
                    selectedPoint.status === "selesai"
                      ? "bg-emerald-100 text-emerald-700"
                      : selectedPoint.status === "ditindaklanjuti"
                      ? "bg-amber-100 text-amber-700"
                      : "bg-blue-100 text-blue-700"
                  }`}
                >
                  {selectedPoint.status}
                </span>
              </div>

              <button
                type="button"
                onClick={() => setSelectedPoint(null)}
                className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200/80 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer"
                title="Tutup Informasi Kejadian"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Konten Detail Kejadian */}
            <div className="p-4 overflow-y-auto space-y-3.5 max-h-[calc(100vh-16rem)] scrollbar-thin">
              {/* Judul & Waktu */}
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 leading-snug">
                  {selectedPoint.title}
                </h3>
                <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-500">
                  {!selectedPoint.is_sos && (
                    <span className="flex items-center gap-1 font-semibold text-slate-700">
                      <DisasterIcon type={selectedPoint.disaster_type} size={14} />
                      <span>{getDisasterLabel(selectedPoint.disaster_type)}</span>
                    </span>
                  )}
                  {!selectedPoint.is_sos && <span>•</span>}
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{selectedPoint.created_at || "Baru saja"}</span>
                  </span>
                </div>
              </div>

              {/* Lokasi */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-orange-600" />
                  <span>Lokasi Kejadian</span>
                </div>
                <p className="text-xs font-semibold text-slate-800 leading-relaxed">
                  {selectedPoint.location_name}
                </p>
                <p className="text-[10px] font-mono text-slate-400">
                  GPS: {selectedPoint.lat.toFixed(5)}, {selectedPoint.lng.toFixed(5)}
                </p>
              </div>

              {/* Konfirmasi Warga */}
              <div className="flex items-center gap-2 text-xs font-bold text-orange-600 bg-orange-50/70 border border-orange-100 p-2.5 rounded-xl">
                <ThumbsUp className="w-4 h-4 shrink-0" />
                <span>{selectedPoint.confirmation_count ?? 0} Warga Mengonfirmasi Kejadian Ini</span>
              </div>

              {/* Tombol Aksi */}
              <div className="flex items-center gap-2 pt-1">
                <a
                  href={`https://www.google.com/maps?q=${selectedPoint.lat},${selectedPoint.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 h-9 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-800 font-bold text-xs inline-flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
                >
                  <Navigation className="w-3.5 h-3.5 text-blue-600" />
                  <span>Rute Maps</span>
                </a>

                {selectedPoint.tracking_code && (
                  <Link
                    href={`/lacak?kode=${encodeURIComponent(selectedPoint.tracking_code)}`}
                    className="flex-1 h-9 rounded-xl bg-primary hover:bg-primary-hover text-white font-bold text-xs inline-flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
                  >
                    <span>Lacak Detail</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}

      {/* Kanan Bawah: Stack Floating Action Controls (Lokasi Saya, Filter, Zoom) - dinaikkan agar tidak menabrak SOS */}
      <div className="absolute bottom-28 right-6 z-20 flex flex-col items-center gap-2">
        {/* Lokasi Saya */}
        <button
          type="button"
          onClick={triggerLocate}
          className="w-10 h-10 rounded-full bg-white/95 backdrop-blur-xs text-slate-700 shadow-md border border-slate-200/90 flex items-center justify-center active:scale-95 transition-transform cursor-pointer hover:bg-slate-50"
          title="Pusatkan ke Lokasi Saya"
        >
          <Crosshair className="w-5 h-5 text-blue-600" />
        </button>

        {/* Toggle Panel Kiri (Buka / Tutup Filter) */}
        <button
          type="button"
          onClick={() => setIsDesktopPanelOpen((prev) => !prev)}
          className={`w-10 h-10 rounded-full backdrop-blur-xs shadow-md border flex items-center justify-center active:scale-95 transition-transform cursor-pointer ${
            isDesktopPanelOpen
              ? "bg-orange-600 text-white border-orange-500 shadow-orange-500/20"
              : "bg-white/95 text-slate-700 border-slate-200/90 hover:bg-slate-50"
          }`}
          title={isDesktopPanelOpen ? "Tutup Filter" : "Buka Filter"}
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

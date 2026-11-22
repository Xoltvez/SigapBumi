"use client";

import React, { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { DisasterType, ReportStatus } from "@/types";

export interface MapPoint {
  id: string;
  tracking_code: string;
  disaster_type: DisasterType;
  title: string;
  location_name: string;
  lat: number;
  lng: number;
  status: ReportStatus;
  created_at: string;
  confirmation_count: number;
  is_sos?: boolean;
  is_demo?: boolean;
  province?: string;
  regency?: string;
}

interface DisasterMapProps {
  points: MapPoint[];
  selectedPointId?: string;
  onSelectPoint?: (point: MapPoint) => void;
  showLegend?: boolean;
  className?: string;
  disablePopup?: boolean;
  routeCoords?: [number, number][] | null;
}

// Validasi keamanan koordinat geospasial agar tidak menyebabkan runtime exception Leaflet NaN
function isValidCoord(lat: unknown, lng: unknown): boolean {
  if (lat === null || lat === undefined || lng === null || lng === undefined) return false;
  const nLat = Number(lat);
  const nLng = Number(lng);
  return (
    typeof nLat === "number" &&
    typeof nLng === "number" &&
    !isNaN(nLat) &&
    !isNaN(nLng) &&
    isFinite(nLat) &&
    isFinite(nLng) &&
    nLat >= -90 &&
    nLat <= 90 &&
    nLng >= -180 &&
    nLng <= 180
  );
}

// Navigasi aman ke koordinat tanpa risiko exception Invalid LatLng (NaN, NaN) pada Leaflet
function safeNavigateMap(
  map: L.Map | null | undefined,
  lat: number,
  lng: number,
  zoom: number = 15,
  useFly: boolean = true
): void {
  if (!map || !isValidCoord(lat, lng)) return;
  const latNum = Number(lat);
  const lngNum = Number(lng);

  try {
    try {
      map.invalidateSize({ pan: false });
    } catch { }

    let canFly = false;
    if (useFly) {
      try {
        const c = map.getCenter();
        const s = map.getSize();
        canFly = Boolean(
          c &&
          isValidCoord(c.lat, c.lng) &&
          s &&
          s.x > 0 &&
          s.y > 0 &&
          !isNaN(s.x) &&
          !isNaN(s.y)
        );
      } catch {
        canFly = false;
      }
    }

    if (canFly) {
      map.flyTo([latNum, lngNum], zoom, {
        duration: 1.4,
        easeLinearity: 0.2,
      });
    } else {
      map.setView([latNum, lngNum], zoom);
    }
  } catch (err) {
    try {
      map.setView([latNum, lngNum], zoom);
    } catch {
      // Abaikan jika map sedang unmounting
    }
  }
}

// Generate custom DivIcon based on status, emergency SOS, and selected state
function createPinIcon(
  status: ReportStatus,
  isSos: boolean = false,
  isSelected: boolean = false,
  trackingCode?: string
) {
  if (isSos) {
    if (isSelected) {
      return L.divIcon({
        className: "custom-sos-pin-selected",
        html: `
          <div style="position: relative; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; cursor: pointer;">
            <!-- Outer Pulsing Radar Ring -->
            <div style="position: absolute; width: 100%; height: 100%; border-radius: 9999px; background-color: rgba(220, 38, 38, 0.45); animation: ping 1.2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
            <!-- Floating Indicator Badge Label -->
            <div style="position: absolute; bottom: calc(100% + 5px); left: 50%; transform: translateX(-50%); background: #0F172A; color: #FFFFFF; font-size: 10px; font-weight: 800; padding: 2.5px 8px; border-radius: 6px; box-shadow: 0 4px 14px rgba(0,0,0,0.4); border: 1.5px solid #EF4444; white-space: nowrap; pointer-events: none; display: flex; align-items: center; gap: 4px; z-index: 100;">
              <span style="width: 6px; height: 6px; border-radius: 9999px; background: #EF4444; animation: ping 1s infinite;"></span>
              <span>${trackingCode || "SOS AKTIF"}</span>
            </div>
            <!-- Core Selected SOS Pin -->
            <div style="width: 26px; height: 26px; border-radius: 9999px; background-color: #DC2626; border: 3px solid #FFFFFF; box-shadow: 0 0 0 3px #DC2626, 0 6px 16px rgba(220,38,38,0.7); display: flex; align-items: center; justify-content: center; color: white; font-weight: 900; font-size: 10px;">SOS</div>
          </div>
        `,
        iconSize: [44, 44],
        iconAnchor: [22, 22],
        popupAnchor: [0, -22],
      });
    }

    return L.divIcon({
      className: "custom-sos-pin",
      html: `
        <div style="position: relative; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center; cursor: pointer;">
          <div style="position: absolute; width: 100%; height: 100%; border-radius: 9999px; background-color: rgba(220, 38, 38, 0.45); animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
          <div style="width: 22px; height: 22px; border-radius: 9999px; background-color: #DC2626; border: 2.5px solid #FFFFFF; box-shadow: 0 4px 10px rgba(220,38,38,0.5); display: flex; align-items: center; justify-content: center; color: white; font-weight: 800; font-size: 9px;">SOS</div>
        </div>
      `,
      iconSize: [34, 34],
      iconAnchor: [17, 17],
      popupAnchor: [0, -17],
    });
  }

  let bgHex = "#2563EB"; // info default
  if (status === "ditindaklanjuti") bgHex = "#F59E0B";
  else if (status === "selesai") bgHex = "#16A34A";
  else if (status === "ditolak") bgHex = "#DC2626";

  if (isSelected) {
    return L.divIcon({
      className: "custom-report-pin-selected",
      html: `
        <div style="position: relative; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; cursor: pointer;">
          <!-- Outer Pulsing Radar Ring -->
          <div style="position: absolute; width: 100%; height: 100%; border-radius: 9999px; background-color: ${bgHex}; opacity: 0.4; animation: ping 1.3s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
          <!-- Floating Indicator Badge Label -->
          <div style="position: absolute; bottom: calc(100% + 5px); left: 50%; transform: translateX(-50%); background: #0F172A; color: #FFFFFF; font-size: 10px; font-weight: 800; padding: 2.5px 8px; border-radius: 6px; box-shadow: 0 4px 14px rgba(0,0,0,0.4); border: 1.5px solid ${bgHex}; white-space: nowrap; pointer-events: none; display: flex; align-items: center; gap: 4px; z-index: 100;">
            <span style="width: 6px; height: 6px; border-radius: 9999px; background-color: ${bgHex};"></span>
            <span>${trackingCode || "TERPILIH"}</span>
          </div>
          <!-- Core Selected Pin -->
          <div style="width: 22px; height: 22px; border-radius: 9999px; background-color: ${bgHex}; border: 3px solid #FFFFFF; box-shadow: 0 0 0 3px ${bgHex}, 0 4px 14px rgba(0,0,0,0.45);"></div>
        </div>
      `,
      iconSize: [40, 40],
      iconAnchor: [20, 20],
      popupAnchor: [0, -20],
    });
  }

  return L.divIcon({
    className: "custom-report-pin",
    html: `
      <div style="position: relative; width: 26px; height: 26px; display: flex; align-items: center; justify-content: center; cursor: pointer;">
        <div style="width: 18px; height: 18px; border-radius: 9999px; background-color: ${bgHex}; border: 2.5px solid #FFFFFF; box-shadow: 0 2px 6px rgba(31,41,55,0.3);"></div>
      </div>
    `,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
    popupAnchor: [0, -13],
  });
}

export default function DisasterMap({
  points,
  selectedPointId,
  onSelectPoint,
  showLegend = true,
  className = "",
  disablePopup = false,
  routeCoords = null,
}: DisasterMapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const markersMapRef = useRef<Map<string, L.Marker>>(new Map());
  const userLocationMarkerRef = useRef<L.Marker | null>(null);
  const prevSelectedPointIdRef = useRef<string | undefined>(undefined);
  const routeLayerRef = useRef<L.Polyline | null>(null);
  const routeCasingLayerRef = useRef<L.Polyline | null>(null);

  // Injeksi style animasi ping jika belum ada di document
  useEffect(() => {
    if (typeof document === "undefined") return;
    const styleId = "sigapbumi-map-styles";
    if (!document.getElementById(styleId)) {
      const style = document.createElement("style");
      style.id = styleId;
      style.innerHTML = `
        @keyframes ping {
          75%, 100% {
            transform: scale(2.2);
            opacity: 0;
          }
        }
        .leaflet-popup-content-wrapper {
          border-radius: 12px !important;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1) !important;
          padding: 4px !important;
        }
        .leaflet-control-zoom {
          display: none !important;
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  // Initialize Map Once
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    // Indonesia archipelago default view dengan animasi mulus (anti-glitch)
    const map = L.map(mapContainerRef.current, {
      center: [-2.5, 118.0],
      zoom: 5,
      zoomControl: false,
      fadeAnimation: true,
      zoomAnimation: true,
      markerZoomAnimation: true,
      inertia: true,
      inertiaDeceleration: 3000,
      easeLinearity: 0.2,
      worldCopyJump: false,
    });

    // Ubin peta OpenStreetMap resmi (100% gratis, tanpa API Key, tanpa watermark)
    const osmLayer = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> kontributor',
      maxZoom: 19,
      subdomains: ["a", "b", "c"],
    });

    osmLayer.on("tileerror", (error: L.TileEvent) => {
      // Fallback mulus ke mirror OpenStreetMap jika server utama lambat
      const tileImg = error.tile as HTMLImageElement;
      if (tileImg && !tileImg.dataset.fallback) {
        tileImg.dataset.fallback = "1";
        const coords = error.coords;
        if (coords) {
          tileImg.src = `https://a.tile.openstreetmap.fr/osmfr/${coords.z}/${coords.x}/${coords.y}.png`;
        }
      }
    });

    osmLayer.addTo(map);

    const markersGroup = L.layerGroup().addTo(map);
    markersLayerRef.current = markersGroup;
    mapInstanceRef.current = map;

    // Helper merender titik marker GPS Lokasi Saya (titik biru berdenyut khas Google Maps dengan label Lokasi Anda)
    const renderUserLocation = (lat: number, lng: number, flyTo: boolean = false, openPopup: boolean = false) => {
      if (!mapInstanceRef.current) return;
      if (!isValidCoord(lat, lng)) return;
      const latNum = Number(lat);
      const lngNum = Number(lng);

      if (flyTo) {
        safeNavigateMap(mapInstanceRef.current, latNum, lngNum, 15, true);
      }

      if (userLocationMarkerRef.current) {
        userLocationMarkerRef.current.setLatLng([latNum, lngNum]);
      } else {
        const userIcon = L.divIcon({
          className: "custom-user-gps-pin",
          html: `
            <div style="display: flex; flex-direction: column; align-items: center; cursor: pointer; pointer-events: auto;">
              <div style="background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(4px); border: 1.5px solid #3b82f6; border-radius: 9999px; padding: 2px 8px; box-shadow: 0 2px 8px rgba(37,99,235,0.25); font-size: 11px; font-weight: 800; color: #1e40af; white-space: nowrap; margin-bottom: 2px; display: flex; align-items: center; gap: 4px;">
                <span style="width: 6px; height: 6px; border-radius: 50%; background: #2563eb; display: inline-block;"></span>
                <span>Lokasi Anda</span>
              </div>
              <div style="position: relative; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center;">
                <div style="position: absolute; width: 100%; height: 100%; border-radius: 9999px; background-color: rgba(37, 99, 235, 0.35); animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
                <div style="width: 16px; height: 16px; border-radius: 9999px; background-color: #2563EB; border: 3px solid #FFFFFF; box-shadow: 0 2px 10px rgba(37,99,235,0.6); display: flex; align-items: center; justify-content: center;">
                  <div style="width: 4px; height: 4px; border-radius: 9999px; background-color: #FFFFFF;"></div>
                </div>
              </div>
            </div>
          `,
          iconSize: [80, 58],
          iconAnchor: [40, 52],
          popupAnchor: [0, -52],
        });

        const marker = L.marker([latNum, lngNum], {
          icon: userIcon,
          zIndexOffset: 1200,
        }).addTo(mapInstanceRef.current);

        marker.bindPopup(`
          <div style="padding: 2px; font-family: system-ui, -apple-system, sans-serif;">
            <div style="display:flex;align-items:center;gap:6px;font-weight:800;color:#1e293b;font-size:12px;">
              <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#2563eb;"></span>
              <span>Lokasi Warga Terkini</span>
            </div>
            <p style="margin:3px 0 0 14px;font-size:10px;color:#64748b;">GPS Aktif &amp; Terdeteksi</p>
          </div>
        `);
        userLocationMarkerRef.current = marker;
      }

      if (openPopup && userLocationMarkerRef.current) {
        setTimeout(() => {
          userLocationMarkerRef.current?.openPopup();
        }, 400);
      }
    };

    // Inisialisasi otomatis: Tampilkan tanda lokasi warga terkini di peta sejak awal
    let initialLocationRendered = false;
    try {
      const cached = localStorage.getItem("sigapbumi_user_last_coords");
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed && typeof parsed.lat === "number" && typeof parsed.lng === "number") {
          renderUserLocation(parsed.lat, parsed.lng, false, false);
          initialLocationRendered = true;
        }
      }
    } catch { }

    // Default lokasi warga jika GPS belum tersedia (Indramayu / Jawa Barat)
    if (!initialLocationRendered) {
      renderUserLocation(-6.3276, 108.3249, false, false);
    }

    // Deteksi otomatis GPS riil di background saat peta pertama kali dibuka
    if (typeof window !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude, accuracy } = pos.coords;
          try {
            localStorage.setItem(
              "sigapbumi_user_last_coords",
              JSON.stringify({ lat: latitude, lng: longitude, accuracy })
            );
          } catch { }
          renderUserLocation(latitude, longitude, false, false);
        },
        () => { },
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 30000 }
      );
    }

    // Pusatkan ke lokasi saya dengan akurasi GPS tinggi
    const handleLocate = (e?: Event) => {
      const customEvt = e as CustomEvent<{ lat?: number; lng?: number }>;
      if (customEvt?.detail?.lat && customEvt?.detail?.lng) {
        renderUserLocation(customEvt.detail.lat, customEvt.detail.lng, true, true);
        return;
      }

      // 1. Coba baca posisi terakhir yang pernah tersimpan
      try {
        const cached = localStorage.getItem("sigapbumi_user_last_coords");
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed && typeof parsed.lat === "number" && typeof parsed.lng === "number") {
            renderUserLocation(parsed.lat, parsed.lng, true, true);
          }
        }
      } catch { }

      // 2. Ambil koordinat presisi langsung dari browser geolocation
      if (typeof window !== "undefined" && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const { latitude, longitude, accuracy } = pos.coords;
            try {
              localStorage.setItem(
                "sigapbumi_user_last_coords",
                JSON.stringify({ lat: latitude, lng: longitude, accuracy })
              );
            } catch { }
            renderUserLocation(latitude, longitude, true, true);
          },
          (err) => {
            console.warn("GPS error, mencoba Leaflet locate fallback:", err);
            map.locate({ setView: true, maxZoom: 15 });
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0,
          }
        );
      } else {
        map.locate({ setView: true, maxZoom: 15 });
      }
    };

    // Event listener Leaflet saat lokasi berhasil/gagal ditemukan
    map.on("locationfound", (e: L.LocationEvent) => {
      renderUserLocation(e.latlng.lat, e.latlng.lng, true, true);
    });

    const handleZoomIn = () => map.zoomIn();
    const handleZoomOut = () => map.zoomOut();
    const handleFocusIndonesia = () => {
      if (mapInstanceRef.current) {
        safeNavigateMap(mapInstanceRef.current, -2.5, 118.0, 5, true);
      }
    };

    if (typeof window !== "undefined") {
      window.addEventListener("sigapbumi:map-zoom-in", handleZoomIn);
      window.addEventListener("sigapbumi:map-zoom-out", handleZoomOut);
      window.addEventListener("sigapbumi:map-locate", handleLocate);
      window.addEventListener("sigapbumi:map-focus-indonesia", handleFocusIndonesia);
    }

    // Pastikan ukuran viewport peta segera dihitung secara presisi
    const t1 = setTimeout(() => map.invalidateSize(), 100);
    const t2 = setTimeout(() => map.invalidateSize(), 350);
    const t3 = setTimeout(() => map.invalidateSize(), 800);

    // ResizeObserver otomatis memanggil invalidateSize setiap kali dimensi container berubah
    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined" && mapContainerRef.current) {
      resizeObserver = new ResizeObserver(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize({ pan: false });
        }
      });
      resizeObserver.observe(mapContainerRef.current);
    }

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      resizeObserver?.disconnect();
      if (typeof window !== "undefined") {
        window.removeEventListener("sigapbumi:map-zoom-in", handleZoomIn);
        window.removeEventListener("sigapbumi:map-zoom-out", handleZoomOut);
        window.removeEventListener("sigapbumi:map-locate", handleLocate);
        window.removeEventListener("sigapbumi:map-focus-indonesia", handleFocusIndonesia);
      }
      if (routeLayerRef.current) {
        try { map.removeLayer(routeLayerRef.current); } catch { }
        routeLayerRef.current = null;
      }
      if (routeCasingLayerRef.current) {
        try { map.removeLayer(routeCasingLayerRef.current); } catch { }
        routeCasingLayerRef.current = null;
      }
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Pan to selected point and open popup when selectedPointId changes with smooth flight animation
  useEffect(() => {
    if (!selectedPointId) {
      // Jika sebelumnya ada titik yang dipilih lalu petugas menutupnya, otomatis zoom out ke seluruh Indonesia
      if (prevSelectedPointIdRef.current && mapInstanceRef.current) {
        safeNavigateMap(mapInstanceRef.current, -2.5, 118.0, 5, true);
      }
      prevSelectedPointIdRef.current = undefined;
      return;
    }

    prevSelectedPointIdRef.current = selectedPointId;
    if (!mapInstanceRef.current) return;
    const pt = points.find((p) => p.id === selectedPointId);
    if (pt && isValidCoord(pt.lat, pt.lng)) {
      const latNum = Number(pt.lat);
      const lngNum = Number(pt.lng);

      // Beri sedikit jeda agar DOM Leaflet stabil jika baru di-mount
      const timer = setTimeout(() => {
        if (!mapInstanceRef.current) return;
        safeNavigateMap(mapInstanceRef.current, latNum, lngNum, 15, true);

        // Buka popup titik kejadian secara otomatis jika tidak di-disable
        if (!disablePopup) {
          const marker = markersMapRef.current.get(pt.id);
          if (marker) {
            setTimeout(() => {
              try {
                marker.openPopup();
              } catch { }
            }, 350);
          }
        }
      }, 50);

      return () => clearTimeout(timer);
    }
  }, [selectedPointId, points]);

  // Update visual indikator marker terpilih secara instan (animasi ring radar & badge kode)
  useEffect(() => {
    markersMapRef.current.forEach((marker, id) => {
      const pt = points.find((p) => p.id === id);
      if (pt) {
        const isSelected = id === selectedPointId;
        marker.setIcon(createPinIcon(pt.status, pt.is_sos, isSelected, pt.tracking_code));
        marker.setZIndexOffset(isSelected ? 1000 : 0);
      }
    });
  }, [selectedPointId, points]);

  // Render polyline rute navigasi jalan raya riil (OSRM) di peta
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Bersihkan rute lama jika ada
    if (routeLayerRef.current) {
      try {
        map.removeLayer(routeLayerRef.current);
      } catch { }
      routeLayerRef.current = null;
    }
    if (routeCasingLayerRef.current) {
      try {
        map.removeLayer(routeCasingLayerRef.current);
      } catch { }
      routeCasingLayerRef.current = null;
    }

    if (routeCoords && routeCoords.length >= 2) {
      // 1. Casing luar tebal (Border navy biru tua)
      const casing = L.polyline(routeCoords, {
        color: "#1E3A8A",
        weight: 7,
        opacity: 0.85,
        lineCap: "round",
        lineJoin: "round",
      }).addTo(map);

      // 2. Garis utama rute (Neon Blue navigasi GPS)
      const line = L.polyline(routeCoords, {
        color: "#3B82F6",
        weight: 4.5,
        opacity: 1,
        lineCap: "round",
        lineJoin: "round",
      }).addTo(map);

      routeCasingLayerRef.current = casing;
      routeLayerRef.current = line;

      // Fit bounds agar seluruh rute dari posisi petugas ke lokasi kejadian terlihat utuh
      try {
        map.fitBounds(casing.getBounds(), {
          padding: [60, 60],
          maxZoom: 16,
          animate: true,
        });
      } catch { }
    }
  }, [routeCoords]);

  // Update Markers secara cerdas (diffing) saat points berubah: Tanpa glitch, tanpa flicker, dan tidak mereset zoom peta
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersGroup = markersLayerRef.current;
    if (!map || !markersGroup) return;

    const validPoints = points.filter((p) => isValidCoord(p.lat, p.lng));
    const currentMarkers = markersMapRef.current;
    const incomingIds = new Set(validPoints.map((p) => p.id));

    // 1. Hapus marker yang sudah tidak ada di data terbaru
    for (const [id, marker] of currentMarkers.entries()) {
      if (!incomingIds.has(id)) {
        markersGroup.removeLayer(marker);
        currentMarkers.delete(id);
      }
    }

    // 2. Tambah atau perbarui marker yang sudah ada secara mulus
    validPoints.forEach((pt) => {
      const latNum = Number(pt.lat);
      const lngNum = Number(pt.lng);

      // Construct popup HTML (tanpa emoji, mematuhi Anti-Slop R-01)
      const popupHtml = `
        <div style="font-family: system-ui, sans-serif; font-size: 12px; color: #1F2937; min-width: 190px; max-width: 250px; padding: 2px;">
          ${pt.is_sos
          ? `<div style="background-color: #FEE2E2; color: #991B1B; font-weight: 700; font-size: 10px; padding: 2px 6px; border-radius: 4px; display: inline-block; margin-bottom: 4px;">PANGGILAN DARURAT SOS</div>`
          : `<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                  <span style="font-family: monospace; font-weight: bold; color: #EF6806;">${pt.tracking_code}</span>
                  <span style="font-size: 10px; text-transform: capitalize; background: #F6F7F8; padding: 1px 6px; border-radius: 4px; border: 1px solid #E5E7EB;">${pt.status}</span>
                </div>`
        }
          ${pt.is_demo
          ? `<div style="background: #FEF0E6; color: #A74904; font-size: 9px; font-weight: 700; padding: 1px 5px; border-radius: 3px; display: inline-block; margin-bottom: 4px;">DATA DEMONSTRASI</div>`
          : ""
        }
          <div style="font-weight: 700; font-size: 13px; line-height: 1.3; margin-bottom: 4px;">${pt.title}</div>
          <div style="color: #4B5563; font-size: 11px; margin-bottom: 6px;">Lokasi: ${pt.location_name}</div>
          <div style="display: flex; justify-content: space-between; font-size: 10px; color: #6B7280; padding-top: 4px; border-top: 1px solid #E5E7EB;">
            <span>Waktu: ${pt.created_at}</span>
            ${!pt.is_sos ? `<span style="color: #EF6806; font-weight: 600;">${pt.confirmation_count} konfirmasi</span>` : ""}
          </div>
          ${!pt.is_sos
          ? `<a href="/lacak?kode=${pt.tracking_code}" style="display: block; text-align: center; background-color: #EF6806; color: white; text-decoration: none; padding: 6px 8px; border-radius: 6px; font-weight: 600; font-size: 11px; margin-top: 8px;">Lacak Status & Detail</a>`
          : ""
        }
        </div>
      `;

      const existingMarker = currentMarkers.get(pt.id);
      if (existingMarker) {
        // Cek update koordinat jika bergeser
        const curLatLng = existingMarker.getLatLng();
        if (Math.abs(curLatLng.lat - latNum) > 0.00001 || Math.abs(curLatLng.lng - lngNum) > 0.00001) {
          existingMarker.setLatLng([latNum, lngNum]);
        }
        const isSelected = pt.id === selectedPointId;
        // Perbarui icon jika status/sos berubah
        existingMarker.setIcon(createPinIcon(pt.status, pt.is_sos, isSelected, pt.tracking_code));
        existingMarker.setZIndexOffset(isSelected ? 1000 : 0);
        // Perbarui isi popup jika popup diaktifkan
        if (!disablePopup) {
          existingMarker.setPopupContent(popupHtml);
        }
      } else {
        const isSelected = pt.id === selectedPointId;
        // Buat marker baru
        const marker = L.marker([latNum, lngNum], {
          icon: createPinIcon(pt.status, pt.is_sos, isSelected, pt.tracking_code),
          zIndexOffset: isSelected ? 1000 : 0,
        });

        if (!disablePopup) {
          marker.bindPopup(popupHtml);
        }

        marker.on("click", () => {
          if (mapInstanceRef.current && isValidCoord(latNum, lngNum)) {
            safeNavigateMap(mapInstanceRef.current, latNum, lngNum, 15, true);
          }
          if (onSelectPoint) {
            onSelectPoint(pt);
          }
        });

        markersGroup.addLayer(marker);
        currentMarkers.set(pt.id, marker);
      }
    });

    // PENTING: map.fitBounds sengaja TIDAK dipanggil saat loading data agar peta tetap tenang dan tidak zoom mendadak / glitch!
  }, [points, onSelectPoint]);

  const sosCount = points.filter((p) => p.is_sos).length;
  const reportCount = points.filter((p) => !p.is_sos).length;

  return (
    <div
      className={`w-full h-full min-h-[500px] md:min-h-[600px] relative rounded-lg overflow-hidden border border-line shadow-card bg-slate-100 ${className}`}
    >
      <div
        ref={mapContainerRef}
        className="w-full h-full min-h-[500px] md:min-h-[600px] z-10"
      />

      {showLegend && (
        <div className="absolute bottom-4 left-4 z-[400] max-w-[280px] bg-surface/95 backdrop-blur-sm border border-line rounded-lg p-3 shadow-card text-xs pointer-events-auto">
          <div className="flex items-center justify-between gap-2 mb-2 pb-1.5 border-b border-line">
            <span className="font-bold text-ink uppercase tracking-wider text-[10px]">
              Legenda Status
            </span>
            <span className="text-[10px] text-ink-muted font-medium">
              Total {points.length} Titik ({reportCount} Lap + {sosCount} SOS)
            </span>
          </div>
          <div className="space-y-1.5 text-[11px] text-ink-soft">
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
              <span className="font-bold text-danger">Panggilan SOS Darurat ({sosCount})</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

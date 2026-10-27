"use client";

import React, { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import {
  MapPin,
  ShieldAlert,
  Layers,
} from "lucide-react";
import { MapFilter } from "@/components/peta/MapFilter";
import type { MapPoint } from "@/components/peta/DisasterMap";
import type { DisasterType, ReportStatus } from "@/types";
import { supabase } from "@/lib/supabase/client";
import { fetchLiveReports, reportsToMapPoints } from "@/lib/services/reports";

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

const STATIC_FALLBACK_POINTS: MapPoint[] = [
  {
    id: "p1",
    tracking_code: "LPR-8F3K2Q",
    disaster_type: "banjir",
    title: "Banjir Luapan Kali Semanan 60 cm",
    location_name: "Kalideres, Jakarta Barat",
    lat: -6.155,
    lng: 106.723,
    status: "ditindaklanjuti",
    created_at: "27 Okt 2026, 14:15 WIB",
    confirmation_count: 24,
  },
  {
    id: "p2",
    tracking_code: "LPR-7N2V9Q",
    disaster_type: "banjir",
    title: "Genangan Air Akses Jalan Kampung Melayu",
    location_name: "Jatinegara, Jakarta Timur",
    lat: -6.226,
    lng: 106.862,
    status: "diverifikasi",
    created_at: "27 Okt 2026, 15:02 WIB",
    confirmation_count: 16,
  },
  {
    id: "p3",
    tracking_code: "LPR-4K9W1Z",
    disaster_type: "longsor",
    title: "Tebing Penahan Longsor Ambrol",
    location_name: "Cisarua, Kab. Bogor",
    lat: -6.698,
    lng: 106.942,
    status: "diverifikasi",
    created_at: "27 Okt 2026, 15:30 WIB",
    confirmation_count: 12,
  },
  {
    id: "p4",
    tracking_code: "LPR-2X7M9P",
    disaster_type: "kebakaran",
    title: "Kebakaran Pemukiman Tambora",
    location_name: "Tambora, Jakarta Barat",
    lat: -6.149,
    lng: 106.804,
    status: "selesai",
    created_at: "27 Okt 2026, 11:20 WIB",
    confirmation_count: 31,
  },
  {
    id: "p5",
    tracking_code: "LPR-5M1Q8L",
    disaster_type: "karhutla",
    title: "Titik Asap Lahan Kering Perbukitan",
    location_name: "Rumpin, Kab. Bogor",
    lat: -6.442,
    lng: 106.637,
    status: "ditindaklanjuti",
    created_at: "27 Okt 2026, 13:40 WIB",
    confirmation_count: 9,
  },
  {
    id: "p6",
    tracking_code: "LPR-3T8K4W",
    disaster_type: "gempa",
    title: "Getaran Gempa M 4.3 Terasa Nyata",
    location_name: "Kecamatan Pelabuhan Ratu, Sukabumi",
    lat: -6.987,
    lng: 106.551,
    status: "diterima",
    created_at: "27 Okt 2026, 16:10 WIB",
    confirmation_count: 42,
  },
  {
    id: "sos-1",
    tracking_code: "SOS-DARURAT-01",
    disaster_type: "banjir",
    title: "Panggilan Darurat: Butuh Evakuasi Lansia & Bayi",
    location_name: "Duri Kosambi, Jakarta Barat",
    lat: -6.168,
    lng: 106.719,
    status: "ditindaklanjuti",
    created_at: "5 menit lalu",
    confirmation_count: 0,
    is_sos: true,
  },
];

export default function PetaPage() {
  const [points, setPoints] = useState<MapPoint[]>(STATIC_FALLBACK_POINTS);
  const [isLiveConnected, setIsLiveConnected] = useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] = useState<DisasterType | "semua">("semua");
  const [selectedStatus, setSelectedStatus] = useState<ReportStatus | "semua">("semua");
  const [showSos, setShowSos] = useState<boolean>(true);
  const [selectedPoint, setSelectedPoint] = useState<MapPoint | null>(null);

  // Ambil data live dari Supabase dan pasang realtime subscription
  React.useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        const liveReports = await fetchLiveReports();
        if (isMounted && liveReports && liveReports.length > 0) {
          const mapPoints = reportsToMapPoints(liveReports);
          // Tambahkan titik SOS darurat aktif
          const sosPoints = STATIC_FALLBACK_POINTS.filter((p) => p.is_sos);
          setPoints([...sosPoints, ...mapPoints]);
          setIsLiveConnected(true);
        }
      } catch (err) {
        console.warn("Gagal memuat data live peta:", err);
      }
    }

    loadData();

    // Pasang listener realtime Supabase
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

  // Filter points based on category, status, and SOS toggle
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
      }
      return true;
    });
  }, [points, selectedCategory, selectedStatus, showSos]);

  return (
    <main className="flex-1 w-full max-w-[1400px] mx-auto px-4 md:px-8 py-4 md:py-6 flex flex-col space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-line">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl md:text-2xl font-bold text-ink flex items-center gap-2">
              <Layers className="w-6 h-6 text-primary" />
              <span>Peta Bencana Publik Terbuka</span>
            </h1>
            {isLiveConnected && (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-success-soft text-success-text border border-success/30">
                <span className="w-1.5 h-1.5 rounded-full bg-success animate-ping" />
                Live Sync Supabase
              </span>
            )}
          </div>
          <p className="text-xs text-ink-soft mt-0.5">
            Peta sebaran laporan kebencanaan dan titik panggilan darurat SOS terverifikasi di seluruh wilayah.
          </p>
        </div>

        {/* Legend pills */}
        <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-info-soft text-info-text border border-info/20">
            <span className="w-2 h-2 rounded-full bg-info" />
            Diterima & Diverifikasi
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-warning-soft text-warning-text border border-warning/20">
            <span className="w-2 h-2 rounded-full bg-warning" />
            Ditindaklanjuti
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-success-soft text-success-text border border-success/20">
            <span className="w-2 h-2 rounded-full bg-success" />
            Selesai
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-danger-soft text-danger-text border border-danger/20">
            <span className="w-2 h-2 rounded-full bg-danger animate-pulse" />
            SOS Darurat
          </span>
        </div>
      </div>

      {/* Main Grid: Filter Sidebar + Interactive Map */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Left / Top Filter Sidebar (Desktop 4 cols, Mobile 1 col) */}
        <div className="lg:col-span-3 space-y-4">
          <MapFilter
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            selectedStatus={selectedStatus}
            onSelectStatus={setSelectedStatus}
            showSos={showSos}
            onToggleSos={() => setShowSos((prev) => !prev)}
            totalVisible={filteredPoints.length}
          />

          {/* Selected Point Quick Details card */}
          {selectedPoint && (
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
                  <a
                    href={`/lacak?kode=${selectedPoint.tracking_code}`}
                    className="text-xs font-semibold text-primary hover:underline"
                  >
                    Detail Lacak
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Privacy Notice Banner */}
          <div className="p-3 bg-bg rounded-md border border-line text-xs text-ink-soft flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>Privasi Terjamin:</strong> Data pribadi pelapor (nama dan nomor telepon) disamarkan demi keamanan dan pencegahan penyalahgunaan data.
            </p>
          </div>
        </div>

        {/* Map Container (Desktop 9 cols, Mobile 1 col) */}
        <div className="lg:col-span-9 h-[550px] md:h-[650px]">
          <DisasterMap
            points={filteredPoints}
            selectedPointId={selectedPoint?.id}
            onSelectPoint={(pt) => setSelectedPoint(pt)}
          />
        </div>
      </div>
    </main>
  );
}

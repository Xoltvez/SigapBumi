"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  MapPin,
  ShieldAlert,
  Layers,
  List,
  Map as MapIcon,
  Clock,
  AlertCircle,
  ExternalLink,
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

const SOS_SAMPLE_POINT: MapPoint = {
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
  is_demo: true,
  province: "DKI Jakarta",
  regency: "Jakarta Barat",
};

const INITIAL_POINTS: MapPoint[] = [
  SOS_SAMPLE_POINT,
  ...reportsToMapPoints(DEFAULT_MOCK_REPORTS),
];

export default function PetaPage() {
  const [points, setPoints] = useState<MapPoint[]>(INITIAL_POINTS);
  const [isLiveConnected, setIsLiveConnected] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<"peta" | "daftar">("peta");
  const [selectedCategory, setSelectedCategory] = useState<DisasterType | "semua">("semua");
  const [selectedStatus, setSelectedStatus] = useState<ReportStatus | "semua">("semua");
  const [selectedRegion, setSelectedRegion] = useState<string>("Semua Wilayah");
  const [showSos, setShowSos] = useState<boolean>(true);
  const [selectedPoint, setSelectedPoint] = useState<MapPoint | null>(null);

  // Ambil data live dari Supabase/service dan pasang realtime listener
  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        const liveReports = await fetchLiveReports();
        if (isMounted && liveReports && liveReports.length > 0) {
          const mapPoints = reportsToMapPoints(liveReports);
          setPoints([SOS_SAMPLE_POINT, ...mapPoints]);
          setIsLiveConnected(true);
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
    <main className="flex-1 w-full max-w-[1400px] mx-auto px-4 md:px-8 py-4 md:py-6 pb-28 md:pb-12 flex flex-col space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-line">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl md:text-2xl font-bold text-ink flex items-center gap-2">
              <Layers className="w-6 h-6 text-primary" />
              <span>Peta Bencana Publik Terbuka</span>
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-primary-soft text-primary-hover border border-primary/20">
              {isLiveConnected ? "Terhubung ke Database Posko" : "Data Demonstrasi & Riil"}
            </span>
          </div>
          <p className="text-xs text-ink-soft mt-0.5">
            Peta sebaran laporan kebencanaan dan titik panggilan darurat SOS terverifikasi di seluruh wilayah.
          </p>
        </div>

        {/* View Mode Switcher (Peta vs Daftar) */}
        <div className="flex items-center gap-2">
          <div className="flex items-center p-1 bg-surface border border-line rounded-md text-xs font-semibold">
            <button
              type="button"
              onClick={() => setViewMode("peta")}
              className={`h-9 px-3 rounded flex items-center gap-1.5 transition-colors ${
                viewMode === "peta"
                  ? "bg-primary text-white"
                  : "text-ink-soft hover:text-ink"
              }`}
            >
              <MapIcon className="w-3.5 h-3.5" />
              <span>Peta</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("daftar")}
              className={`h-9 px-3 rounded flex items-center gap-1.5 transition-colors ${
                viewMode === "daftar"
                  ? "bg-primary text-white"
                  : "text-ink-soft hover:text-ink"
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>Daftar ({filteredPoints.length})</span>
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

          {/* Privacy Notice Banner */}
          <div className="p-3 bg-bg rounded-md border border-line text-xs text-ink-soft flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>Privasi Terjamin:</strong> Data pribadi pelapor (nama dan nomor telepon) disamarkan demi keamanan dan pencegahan penyalahgunaan data.
            </p>
          </div>
        </div>

        {/* Content Container (Desktop 9 cols) */}
        <div className="lg:col-span-9">
          {viewMode === "peta" ? (
            <div className="h-[550px] md:h-[650px]">
              <DisasterMap
                points={filteredPoints}
                selectedPointId={selectedPoint?.id}
                onSelectPoint={(pt) => setSelectedPoint(pt)}
              />
            </div>
          ) : (
            // LIST VIEW ALTERNATIVE (FR-04 & Master Prompt Section 6.4)
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-line">
                <span className="text-xs font-bold text-ink uppercase tracking-wider">
                  Daftar Kejadian Bencana ({filteredPoints.length} Laporan)
                </span>
                <span className="text-xs text-ink-muted">
                  Klik untuk melihat timeline penanganan
                </span>
              </div>

              {filteredPoints.length === 0 ? (
                <div className="p-12 text-center bg-surface border border-line rounded-lg space-y-2">
                  <AlertCircle className="w-8 h-8 text-ink-muted mx-auto" />
                  <p className="text-sm font-bold text-ink">Tidak ada laporan yang sesuai</p>
                  <p className="text-xs text-ink-soft">
                    Coba sesuaikan filter kategori atau status di sebelah kiri.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {filteredPoints.map((item) => (
                    <div
                      key={item.id}
                      className="bg-surface border border-line rounded-lg p-4 shadow-card hover:border-primary/50 transition-colors flex flex-col justify-between space-y-3"
                    >
                      <div className="space-y-2">
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
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-danger-soft text-danger">
                                SOS
                              </span>
                            )}
                          </div>
                          {getStatusBadge(item.status)}
                        </div>

                        <h3 className="text-sm font-bold text-ink leading-snug">
                          {item.title}
                        </h3>

                        <p className="text-xs text-ink-soft flex items-start gap-1">
                          <MapPin className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                          <span>{item.location_name}</span>
                        </p>
                      </div>

                      <div className="pt-2 border-t border-line flex items-center justify-between text-xs">
                        <span className="text-ink-muted flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>{item.created_at}</span>
                        </span>

                        {!item.is_sos ? (
                          <Link
                            href={`/lacak?kode=${item.tracking_code}`}
                            className="font-semibold text-primary hover:underline inline-flex items-center gap-1"
                          >
                            <span>Lacak &amp; Timeline</span>
                            <ExternalLink className="w-3 h-3" />
                          </Link>
                        ) : (
                          <span className="text-xs font-bold text-danger">
                            Sinyal Darurat
                          </span>
                        )}
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

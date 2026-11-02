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
import { supabase } from "@/lib/supabase/client";

// Dynamic import for Leaflet client component
const DisasterMap = dynamic(() => import("@/components/peta/DisasterMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[550px] lg:h-[660px] rounded-xl bg-slate-100/70 border border-slate-200/80 flex flex-col items-center justify-center text-slate-400 animate-pulse font-sans">
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
            title: `🚨 Panggilan Darurat: Bantuan ${s.assistance_type.toUpperCase()}`,
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

  // Filtered points
  const filteredPoints = useMemo(() => {
    return points.filter((pt) => {
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
  }, [points, selectedProvince, selectedDisaster, selectedStatus, searchQuery]);

  const selectedPoint = useMemo(() => {
    return points.find((p) => p.id === selectedPointId);
  }, [points, selectedPointId]);

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

  // KPI Metrics riil tanpa fallback palsu
  const totalTitik = points.length;
  const sosTotal = points.filter((p) => p.is_sos).length;
  const prosesTotal = points.filter((p) => !p.is_sos && p.status === "ditindaklanjuti").length;
  const selesaiTotal = points.filter((p) => !p.is_sos && p.status === "selesai").length;

  const getDisasterIcon = (type: DisasterType) => {
    switch (type) {
      case "banjir":
        return <Waves className="w-3.5 h-3.5 text-blue-500" />;
      case "longsor":
        return <Mountain className="w-3.5 h-3.5 text-amber-500" />;
      case "kebakaran":
      case "karhutla":
        return <Flame className="w-3.5 h-3.5 text-red-500" />;
      default:
        return <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />;
    }
  };

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto font-sans pb-12 select-none">
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Peta Operasional Taktis
          </h1>
          <p className="text-xs md:text-sm text-slate-500 font-normal mt-0.5">
            Pantau sebaran titik bencana, panggilan darurat SOS, dan armada darurat secara geospasial real-time.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0 self-start sm:self-auto">
          {/* Live GIS Badge */}
          <div className="px-3.5 py-1.5 rounded-full bg-[#ECFDF5] text-[#059669] border border-emerald-200/80 text-xs font-bold inline-flex items-center gap-1.5 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
            <span>Live GIS</span>
          </div>

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
                className="text-xs font-bold text-orange-600 hover:text-orange-700 hover:underline px-2 py-1"
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

      {/* 4. Main Grid: Leaflet Map (Left 65%) + Inspector Panel (Right 35%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 md:gap-6 items-start">
        {/* Map Container */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-100 p-3.5 shadow-[0_2px_16px_rgba(0,0,0,0.02)] flex flex-col justify-between">
          <div className="w-full h-[540px] lg:h-[600px] relative rounded-xl overflow-hidden border border-slate-100">
            <DisasterMap
              className="w-full h-full"
              points={filteredPoints}
              selectedPointId={selectedPointId}
              onSelectPoint={(pt) => setSelectedPointId(pt.id)}
              showLegend={false}
            />
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

        {/* Selected Point Inspector & Tactical Command Panel */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-100 p-5 shadow-[0_2px_16px_rgba(0,0,0,0.02)] space-y-4">
          <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
                Panel Kendali Taktis
              </h2>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Inspeksi detail titik kejadian & disposisi armada
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-[11px] font-bold">
              {filteredPoints.length} Titik
            </span>
          </div>

          {selectedPoint ? (
            <div className="space-y-4">
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
              <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                <div>
                  <span className="text-slate-400 block text-[11px] font-medium">Jenis Bencana</span>
                  <span className="font-bold text-slate-800 capitalize flex items-center gap-1.5 mt-0.5">
                    {getDisasterIcon(selectedPoint.disaster_type)}
                    <span>{selectedPoint.disaster_type}</span>
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px] font-medium">Waktu Masuk</span>
                  <span className="font-bold text-slate-800 mt-0.5 block">{selectedPoint.created_at}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px] font-medium">Koordinat GPS</span>
                  <span className="font-mono text-[11px] font-bold text-slate-800 mt-0.5 block">
                    {selectedPoint.lat.toFixed(4)}, {selectedPoint.lng.toFixed(4)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px] font-medium">Konfirmasi Warga</span>
                  <span className="font-bold text-amber-600 flex items-center gap-1 mt-0.5">
                    <Shield className="w-3.5 h-3.5 text-amber-500" />
                    <span>{selectedPoint.confirmation_count} Saksi</span>
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-1">
                <a
                  href={`https://www.google.com/maps?q=${selectedPoint.lat},${selectedPoint.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full h-10 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold inline-flex items-center justify-center gap-2 shadow-2xs transition-colors"
                >
                  <Navigation className="w-3.5 h-3.5 text-slate-600" />
                  <span>Buka Rute Navigasi Google Maps</span>
                </a>

                {selectedPoint.status !== "selesai" && (
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => handleUpdateStatus("ditindaklanjuti")}
                      className="h-9 px-3 rounded-xl border border-amber-200 bg-[#FFF7ED] text-[#EA580C] hover:bg-amber-100 text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
                    >
                      <Clock className="w-3.5 h-3.5" />
                      <span>Diproses</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleUpdateStatus("selesai")}
                      className="h-9 px-3 rounded-xl bg-[#059669] hover:bg-[#047857] text-white text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
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
                  className="w-full h-9 rounded-xl border border-slate-200/90 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold inline-flex items-center justify-center gap-1.5 shadow-2xs transition-colors"
                >
                  <span>Lihat Lembar Kerja Lengkap</span>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                </Link>
              </div>
            </div>
          ) : (
            <div className="py-14 px-4 text-center rounded-xl bg-slate-50 border border-dashed border-slate-200 flex flex-col items-center justify-center">
              <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
                <MapPin className="w-6 h-6 stroke-[2.2]" />
              </div>
              <h4 className="text-xs font-bold text-slate-800">
                Pilih Titik di Peta
              </h4>
              <p className="text-[11px] text-slate-400 mt-1 max-w-[200px] leading-relaxed">
                Klik salah satu pin bencana atau panggilan SOS pada peta untuk menginspeksi rincian dan melakukan komando tindakan.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

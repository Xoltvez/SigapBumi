"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  MapPin,
  Filter,
  CheckCircle2,
  ArrowRight,
  ExternalLink,
  Siren,
  Send,
} from "lucide-react";
import type { MapPoint } from "@/components/peta/DisasterMap";
import type { DisasterType, ReportStatus } from "@/types";
import {
  DEFAULT_MOCK_REPORTS,
  reportsToMapPoints,
  fetchLiveReports,
} from "@/lib/services/reports";
import { DEFAULT_MOCK_SOS, fetchLiveSosAlerts } from "@/lib/services/sos";

// Dynamic import for Leaflet client component
const DisasterMap = dynamic(() => import("@/components/peta/DisasterMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[550px] md:h-[650px] rounded-lg bg-bg border border-line flex flex-col items-center justify-center text-ink-muted animate-pulse">
      <MapPin className="w-8 h-8 mb-2 text-primary" />
      <p className="text-sm font-semibold text-ink">Memuat Peta Situasi Taktis...</p>
      <p className="text-xs text-ink-muted mt-1">Mengunduh layer koordinat geospasial</p>
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
    const reportPoints = reportsToMapPoints(DEFAULT_MOCK_REPORTS);
    const sosPoints: MapPoint[] = DEFAULT_MOCK_SOS.filter((s) => s.status === "aktif").map((s) => ({
      id: s.id,
      tracking_code: `SOS-${s.id.toUpperCase()}`,
      disaster_type: "banjir",
      title: `Panggilan Darurat: Bantuan ${s.assistance_type.toUpperCase()}`,
      location_name: s.address,
      lat: s.lat,
      lng: s.lng,
      status: "ditindaklanjuti" as ReportStatus,
      created_at: s.time_ago,
      confirmation_count: 1,
      is_sos: true,
      is_demo: true,
      province: s.address.includes("Jakarta") ? "DKI Jakarta" : "Jawa Barat",
    }));
    return [...sosPoints, ...reportPoints];
  });

  const [selectedPointId, setSelectedPointId] = useState<string | undefined>(undefined);
  const [selectedProvince, setSelectedProvince] = useState<string>("Semua Provinsi");
  const [selectedDisaster, setSelectedDisaster] = useState<DisasterType | "semua">("semua");
  const [selectedStatus, setSelectedStatus] = useState<ReportStatus | "sos" | "semua">("semua");
  const [actionSuccessNotice, setActionSuccessNotice] = useState<string | null>(null);

  // Sync live data on mount
  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        const liveReports = await fetchLiveReports();
        const liveSos = await fetchLiveSosAlerts();

        if (isMounted && liveReports && liveReports.length > 0) {
          const reportPoints = reportsToMapPoints(liveReports);
          const activeSos = (liveSos || DEFAULT_MOCK_SOS).filter((s) => s.status === "aktif");
          const sosPoints: MapPoint[] = activeSos.map((s) => ({
            id: s.id,
            tracking_code: `SOS-${s.id.toUpperCase()}`,
            disaster_type: "banjir",
            title: `Panggilan Darurat: Bantuan ${s.assistance_type.toUpperCase()}`,
            location_name: s.address,
            lat: s.lat,
            lng: s.lng,
            status: "ditindaklanjuti" as ReportStatus,
            created_at: s.time_ago,
            confirmation_count: 1,
            is_sos: true,
            is_demo: true,
            province: s.address.includes("Jakarta") ? "DKI Jakarta" : "Jawa Barat",
          }));
          setPoints([...sosPoints, ...reportPoints]);
        }
      } catch (err) {
        console.warn("Gagal memuat koordinat peta admin:", err);
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

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
        return pt.is_sos === true;
      }
      if (selectedStatus !== "semua" && pt.status !== selectedStatus) {
        return false;
      }
      return true;
    });
  }, [points, selectedProvince, selectedDisaster, selectedStatus]);

  const selectedPoint = useMemo(() => {
    return points.find((p) => p.id === selectedPointId);
  }, [points, selectedPointId]);

  // Handle local status transition for demonstration
  const handleUpdateStatus = (newStatus: ReportStatus) => {
    if (!selectedPointId) return;
    setPoints((prev) =>
      prev.map((pt) => (pt.id === selectedPointId ? { ...pt, status: newStatus } : pt))
    );
    setActionSuccessNotice(`Status kejadian berhasil diperbarui menjadi "${newStatus}".`);
    setTimeout(() => setActionSuccessNotice(null), 4000);
  };

  const sosTotal = points.filter((p) => p.is_sos).length;
  const selesaiTotal = points.filter((p) => !p.is_sos && p.status === "selesai").length;
  const prosesTotal = points.filter((p) => !p.is_sos && p.status === "ditindaklanjuti").length;

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="bg-surface border border-line rounded-md p-5 shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="mb-1.5">
            <span className="inline-block px-2.5 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-primary-soft text-primary-hover border border-primary/20">
              Mode Demonstrasi Posko Terpadu — WIA 2026
            </span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-ink">
            Peta Situasi & Kendali Operasi
          </h1>
          <p className="text-xs text-ink-soft mt-0.5">
            Pemantauan geospasial real-time {points.length} titik kejadian bencana dan sinyal SOS darurat di seluruh Indonesia.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/admin/laporan"
            className="h-9 px-3.5 rounded-md border border-line hover:bg-bg text-ink text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
          >
            <span>Daftar Antrean</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
          <Link
            href="/admin/sos"
            className="h-9 px-3.5 rounded-md bg-danger hover:bg-danger/90 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
          >
            <Siren className="w-3.5 h-3.5" />
            <span>Monitor SOS ({sosTotal})</span>
          </Link>
        </div>
      </div>

      {/* KPI mini bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-surface border border-line rounded-md p-3 shadow-card">
          <p className="text-[11px] font-semibold uppercase text-ink-muted tracking-wider">
            Total Titik Terdata
          </p>
          <p className="text-2xl font-extrabold text-ink mt-1 tabular-nums">{points.length}</p>
          <p className="text-[11px] text-ink-muted mt-0.5">9 provinsi nasional</p>
        </div>
        <div className="bg-surface border border-line rounded-md p-3 shadow-card">
          <p className="text-[11px] font-semibold uppercase text-ink-muted tracking-wider">
            Sinyal SOS Aktif
          </p>
          <p className="text-2xl font-extrabold text-danger mt-1 tabular-nums">{sosTotal}</p>
          <p className="text-[11px] text-danger-text font-medium mt-0.5">Butuh tanggapan &lt; 2 mnt</p>
        </div>
        <div className="bg-surface border border-line rounded-md p-3 shadow-card">
          <p className="text-[11px] font-semibold uppercase text-ink-muted tracking-wider">
            Sedang Ditangani
          </p>
          <p className="text-2xl font-extrabold text-warning-text mt-1 tabular-nums">{prosesTotal}</p>
          <p className="text-[11px] text-ink-muted mt-0.5">Regu berada di lapangan</p>
        </div>
        <div className="bg-surface border border-line rounded-md p-3 shadow-card">
          <p className="text-[11px] font-semibold uppercase text-ink-muted tracking-wider">
            Selesai Ditangani
          </p>
          <p className="text-2xl font-extrabold text-success mt-1 tabular-nums">{selesaiTotal}</p>
          <p className="text-[11px] text-success-text font-medium mt-0.5">42.2% tingkat solusi</p>
        </div>
      </div>

      {/* Filter Control Bar */}
      <div className="bg-surface border border-line rounded-md p-4 shadow-card flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-ink-muted shrink-0 mr-1">
          <Filter className="w-4 h-4 text-primary" />
          <span>Filter Peta:</span>
        </div>

        {/* Filter Provinsi */}
        <select
          value={selectedProvince}
          onChange={(e) => setSelectedProvince(e.target.value)}
          className="h-9 px-3 rounded-md border border-line bg-surface text-xs font-medium text-ink focus:border-primary focus:outline-none"
        >
          {PROVINCE_OPTIONS.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>

        {/* Filter Bencana */}
        <select
          value={selectedDisaster}
          onChange={(e) => setSelectedDisaster(e.target.value as DisasterType | "semua")}
          className="h-9 px-3 rounded-md border border-line bg-surface text-xs font-medium text-ink focus:border-primary focus:outline-none"
        >
          <option value="semua">Semua Bencana</option>
          <option value="banjir">Banjir</option>
          <option value="longsor">Tanah Longsor</option>
          <option value="kebakaran">Kebakaran</option>
          <option value="gempa">Gempa Bumi</option>
          <option value="karhutla">Karhutla</option>
          <option value="lainnya">Lainnya</option>
        </select>

        {/* Filter Status */}
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value as ReportStatus | "sos" | "semua")}
          className="h-9 px-3 rounded-md border border-line bg-surface text-xs font-medium text-ink focus:border-primary focus:outline-none"
        >
          <option value="semua">Semua Status</option>
          <option value="diterima">Status: Diterima</option>
          <option value="diverifikasi">Status: Diverifikasi</option>
          <option value="ditindaklanjuti">Status: Ditindaklanjuti</option>
          <option value="selesai">Status: Selesai</option>
          <option value="sos">Khusus Sinyal SOS Darurat</option>
        </select>

        {(selectedProvince !== "Semua Provinsi" ||
          selectedDisaster !== "semua" ||
          selectedStatus !== "semua") && (
          <button
            type="button"
            onClick={() => {
              setSelectedProvince("Semua Provinsi");
              setSelectedDisaster("semua");
              setSelectedStatus("semua");
            }}
            className="text-xs font-semibold text-primary-text hover:underline ml-auto"
          >
            Reset Filter
          </button>
        )}
      </div>

      {actionSuccessNotice && (
        <div className="p-3 bg-success-soft border border-success/30 rounded-md text-success-text text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-success" />
          <span>{actionSuccessNotice}</span>
        </div>
      )}

      {/* Main Grid: Leaflet Map (Left 65%) + Inspector Panel (Right 35%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Map Container */}
        <div className="lg:col-span-8 bg-surface border border-line rounded-md p-2 shadow-card min-h-[550px] lg:min-h-[650px] flex flex-col">
          <div className="flex-1 w-full relative">
            <DisasterMap
              points={filteredPoints}
              selectedPointId={selectedPointId}
              onSelectPoint={(pt) => setSelectedPointId(pt.id)}
            />
          </div>
        </div>

        {/* Selected Point Inspector & Quick Action Panel */}
        <div className="lg:col-span-4 bg-surface border border-line rounded-md p-5 shadow-card space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-line">
            <h2 className="text-sm font-bold text-ink uppercase tracking-wider">
              Panel Kendali Taktis
            </h2>
            <span className="text-xs text-ink-muted">
              {filteredPoints.length} titik tampil
            </span>
          </div>

          {selectedPoint ? (
            <div className="space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="font-mono text-xs font-bold text-primary-text">
                    {selectedPoint.tracking_code}
                  </span>
                  <span
                    className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                      selectedPoint.is_sos
                        ? "bg-danger text-white"
                        : "bg-bg border border-line text-ink"
                    }`}
                  >
                    {selectedPoint.is_sos ? "PANGGILAN SOS" : selectedPoint.status}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-ink leading-snug">
                  {selectedPoint.title}
                </h3>
                <p className="text-xs text-ink-soft mt-1 flex items-start gap-1">
                  <MapPin className="w-3.5 h-3.5 text-ink-muted shrink-0 mt-0.5" />
                  <span>{selectedPoint.location_name}</span>
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs bg-bg p-3 rounded-md border border-line">
                <div>
                  <span className="text-ink-muted block text-[11px]">Jenis Bencana</span>
                  <span className="font-semibold text-ink capitalize">
                    {selectedPoint.disaster_type}
                  </span>
                </div>
                <div>
                  <span className="text-ink-muted block text-[11px]">Waktu Masuk</span>
                  <span className="font-semibold text-ink">{selectedPoint.created_at}</span>
                </div>
                <div>
                  <span className="text-ink-muted block text-[11px]">Koordinat GPS</span>
                  <span className="font-mono text-[11px] text-ink">
                    {selectedPoint.lat.toFixed(4)}, {selectedPoint.lng.toFixed(4)}
                  </span>
                </div>
                <div>
                  <span className="text-ink-muted block text-[11px]">Konfirmasi Warga</span>
                  <span className="font-semibold text-primary-text">
                    {selectedPoint.confirmation_count} warga
                  </span>
                </div>
              </div>

              {/* Status Action Buttons for Posko */}
              <div className="space-y-2 pt-2 border-t border-line">
                <p className="text-[11px] font-bold uppercase text-ink-muted tracking-wider">
                  Tindakan Cepat Posko:
                </p>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleUpdateStatus("ditindaklanjuti")}
                    disabled={selectedPoint.status === "ditindaklanjuti"}
                    className="h-9 px-3 rounded-md bg-warning text-white text-xs font-semibold hover:bg-warning/90 disabled:opacity-50 flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Tindak Lanjuti</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleUpdateStatus("selesai")}
                    disabled={selectedPoint.status === "selesai"}
                    className="h-9 px-3 rounded-md bg-success text-white text-xs font-semibold hover:bg-success/90 disabled:opacity-50 flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Selesaikan</span>
                  </button>
                </div>

                {!selectedPoint.is_sos && (
                  <Link
                    href={`/admin/laporan/${selectedPoint.id}`}
                    className="w-full h-9 rounded-md border border-line hover:bg-bg text-ink text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors mt-2"
                  >
                    <span>Buka Rekam Kasus Lengkap</span>
                    <ExternalLink className="w-3.5 h-3.5 text-ink-muted" />
                  </Link>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="p-3 bg-bg rounded-md text-xs text-ink-soft border border-line">
                <p>Klik salah satu marker pada peta untuk melihat data teknis dan menjalankan tindakan operasional posko.</p>
              </div>

              <div className="pt-2">
                <p className="text-[11px] font-bold uppercase text-ink-muted tracking-wider mb-2">
                  Kejadian Kritis Terkini:
                </p>
                <div className="divide-y divide-line">
                  {filteredPoints.slice(0, 5).map((pt) => (
                    <button
                      key={pt.id}
                      type="button"
                      onClick={() => setSelectedPointId(pt.id)}
                      className="w-full py-2.5 px-2 text-left hover:bg-bg rounded transition-colors group flex items-start justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="font-mono text-[11px] font-bold text-primary-text">
                            {pt.tracking_code}
                          </span>
                          <span className="text-[10px] text-ink-muted capitalize">
                            · {pt.disaster_type}
                          </span>
                        </div>
                        <p className="text-xs font-semibold text-ink truncate group-hover:text-primary-text">
                          {pt.title}
                        </p>
                        <p className="text-[11px] text-ink-muted truncate">
                          {pt.location_name}
                        </p>
                      </div>
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-bg border border-line shrink-0 text-ink">
                        {pt.status}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

"use client";

import React, { useState } from "react";
import { Filter, AlertCircle, ChevronDown, ChevronUp, MapPin } from "lucide-react";
import type { DisasterType, ReportStatus } from "@/types";

interface MapFilterProps {
  selectedCategory: DisasterType | "semua";
  onSelectCategory: (category: DisasterType | "semua") => void;
  selectedStatus: ReportStatus | "semua";
  onSelectStatus: (status: ReportStatus | "semua") => void;
  selectedRegion: string;
  onSelectRegion: (region: string) => void;
  showSos: boolean;
  onToggleSos: () => void;
  totalVisible: number;
}

export function MapFilter({
  selectedCategory,
  onSelectCategory,
  selectedStatus,
  onSelectStatus,
  selectedRegion,
  onSelectRegion,
  showSos,
  onToggleSos,
  totalVisible,
}: MapFilterProps) {
  const [isMobileExpanded, setIsMobileExpanded] = useState(false);

  const categories: { key: DisasterType | "semua"; label: string }[] = [
    { key: "semua", label: "Semua Kategori" },
    { key: "banjir", label: "Banjir" },
    { key: "gempa", label: "Gempa" },
    { key: "kebakaran", label: "Kebakaran" },
    { key: "longsor", label: "Longsor" },
    { key: "karhutla", label: "Karhutla" },
    { key: "lainnya", label: "Lainnya" },
  ];

  const statuses: { key: ReportStatus | "semua"; label: string }[] = [
    { key: "semua", label: "Semua Status" },
    { key: "diterima", label: "Diterima" },
    { key: "diverifikasi", label: "Diverifikasi" },
    { key: "ditindaklanjuti", label: "Ditindaklanjuti" },
    { key: "selesai", label: "Selesai" },
  ];

  const regions: string[] = [
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

  const hasActiveFilters =
    selectedCategory !== "semua" ||
    selectedStatus !== "semua" ||
    selectedRegion !== "Semua Wilayah" ||
    !showSos;

  const handleResetFilters = () => {
    onSelectCategory("semua");
    onSelectStatus("semua");
    onSelectRegion("Semua Wilayah");
    if (!showSos) onToggleSos();
  };

  return (
    <div className="bg-surface border border-line rounded-lg shadow-card overflow-hidden">
      {/* Header filter & count */}
      <div className="p-4 flex items-center justify-between pb-3 border-b border-line">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-bold text-ink">Filter Peta Kejadian</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-primary-soft text-primary-hover font-semibold">
            {totalVisible} Titik
          </span>
          {/* Mobile toggle button */}
          <button
            type="button"
            onClick={() => setIsMobileExpanded(!isMobileExpanded)}
            className="lg:hidden p-1 rounded hover:bg-bg text-ink-soft transition-colors"
            aria-label={isMobileExpanded ? "Tutup Filter" : "Buka Filter"}
          >
            {isMobileExpanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Filter Body (Always visible on lg, collapsible on mobile) */}
      <div className={`p-4 space-y-4 ${isMobileExpanded ? "block" : "hidden lg:block"}`}>
        {/* Filter Wilayah / Provinsi */}
        <div>
          <label className="block text-xs font-semibold text-ink-muted uppercase tracking-wider mb-2 flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-primary" />
            <span>Wilayah / Provinsi</span>
          </label>
          <select
            value={selectedRegion}
            onChange={(e) => onSelectRegion(e.target.value)}
            className="w-full text-xs font-medium p-2.5 rounded-md border border-line bg-surface text-ink focus:border-primary focus:outline-none"
          >
            {regions.map((reg) => (
              <option key={reg} value={reg}>
                {reg}
              </option>
            ))}
          </select>
        </div>

        {/* Filter Kategori */}
        <div>
          <label className="block text-xs font-semibold text-ink-muted uppercase tracking-wider mb-2">
            Jenis Bencana
          </label>
          <div className="flex flex-wrap gap-1.5">
            {categories.map((c) => (
              <button
                key={c.key}
                type="button"
                onClick={() => onSelectCategory(c.key)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                  selectedCategory === c.key
                    ? "bg-primary text-white font-semibold"
                    : "bg-bg text-ink border border-line hover:border-line-strong"
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Filter Status */}
        <div>
          <label className="block text-xs font-semibold text-ink-muted uppercase tracking-wider mb-2">
            Status Penanganan
          </label>
          <div className="flex flex-wrap gap-1.5">
            {statuses.map((s) => (
              <button
                key={s.key}
                type="button"
                onClick={() => onSelectStatus(s.key)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                  selectedStatus === s.key
                    ? "bg-ink text-white font-semibold"
                    : "bg-bg text-ink border border-line hover:border-line-strong"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Toggle Layer SOS Darurat */}
        <div className="pt-2 border-t border-line">
          <label className="flex items-center justify-between cursor-pointer py-1">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-danger animate-pulse" />
              <span className="text-xs font-semibold text-ink flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 text-danger" />
                Tampilkan Sinyal SOS
              </span>
            </div>
            <input
              type="checkbox"
              checked={showSos}
              onChange={onToggleSos}
              className="w-4 h-4 rounded text-danger focus:ring-danger border-line accent-danger cursor-pointer"
            />
          </label>
        </div>

        {/* Reset Filter Button */}
        {hasActiveFilters && (
          <button
            type="button"
            onClick={handleResetFilters}
            className="w-full py-1.5 text-xs text-ink-muted hover:text-danger font-semibold border border-dashed border-line rounded-md hover:border-danger/40 transition-colors"
          >
            Reset Semua Filter
          </button>
        )}
      </div>
    </div>
  );
}

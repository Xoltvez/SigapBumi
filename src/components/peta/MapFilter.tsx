"use client";

import React from "react";
import { Filter, AlertCircle } from "lucide-react";
import type { DisasterType, ReportStatus } from "@/types";

interface MapFilterProps {
  selectedCategory: DisasterType | "semua";
  onSelectCategory: (category: DisasterType | "semua") => void;
  selectedStatus: ReportStatus | "semua";
  onSelectStatus: (status: ReportStatus | "semua") => void;
  showSos: boolean;
  onToggleSos: () => void;
  totalVisible: number;
}

export function MapFilter({
  selectedCategory,
  onSelectCategory,
  selectedStatus,
  onSelectStatus,
  showSos,
  onToggleSos,
  totalVisible,
}: MapFilterProps) {
  const categories: { key: DisasterType | "semua"; label: string }[] = [
    { key: "semua", label: "Semua Kategori" },
    { key: "banjir", label: "Banjir" },
    { key: "gempa", label: "Gempa" },
    { key: "kebakaran", label: "Kebakaran" },
    { key: "longsor", label: "Longsor" },
    { key: "karhutla", label: "Karhutla" },
  ];

  const statuses: { key: ReportStatus | "semua"; label: string }[] = [
    { key: "semua", label: "Semua Status" },
    { key: "diterima", label: "Diterima" },
    { key: "diverifikasi", label: "Diverifikasi" },
    { key: "ditindaklanjuti", label: "Ditindaklanjuti" },
    { key: "selesai", label: "Selesai" },
  ];

  return (
    <div className="bg-surface border border-line rounded-lg p-4 shadow-card space-y-4">
      {/* Header filter & count */}
      <div className="flex items-center justify-between pb-3 border-b border-line">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-bold text-ink">Filter Peta Kejadian</h3>
        </div>
        <span className="text-xs px-2 py-0.5 rounded-full bg-primary-soft text-primary-hover font-semibold">
          {totalVisible} Titik Aktif
        </span>
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
              Tampilkan Titik Sinyal SOS
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
    </div>
  );
}

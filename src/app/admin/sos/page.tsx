"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Volume2,
  VolumeX,
  Flame,
  HeartPulse,
  Shield,
  LifeBuoy,
  CheckCircle2,
  ArrowLeft,
  Navigation,
} from "lucide-react";
import { useAdmin } from "@/components/layout/AdminShell";
import type { SosAssistanceType } from "@/types";

interface SosEmergency {
  id: string;
  source: string;
  assistance_type: SosAssistanceType;
  address: string;
  coordinates: string;
  time_ago: string;
  battery_level?: string;
  status: "aktif" | "ditangani" | "selesai";
  dispatched_team?: string;
}

const INITIAL_EMERGENCIES: SosEmergency[] = [
  {
    id: "sos-101",
    source: "Ponsel Warga (GPS Sensor)",
    assistance_type: "damkar",
    address: "Perumahan Citra 2 Blok B4, Kalideres, Jakarta Barat",
    coordinates: "-6.1552, 106.7231",
    time_ago: "1 menit lalu",
    battery_level: "34%",
    status: "aktif",
  },
  {
    id: "sos-102",
    source: "Ponsel Warga (GPS Sensor)",
    assistance_type: "medis",
    address: "Jalan Puncak Raya KM 82, Desa Tugu Selatan, Bogor",
    coordinates: "-6.6984, 106.9425",
    time_ago: "6 menit lalu",
    battery_level: "68%",
    status: "aktif",
  },
  {
    id: "sos-103",
    source: "Ponsel Warga (GPS Sensor)",
    assistance_type: "polisi",
    address: "Akses Jembatan Kali Sunter, Jakarta Utara",
    coordinates: "-6.1492, 106.8041",
    time_ago: "15 menit lalu",
    battery_level: "82%",
    status: "ditangani",
    dispatched_team: "Patroli Polsek Tanjung Priok",
  },
];

export default function AdminSosPage() {
  const { activeUnit, activeUnitName } = useAdmin();
  const [emergencies, setEmergencies] = useState<SosEmergency[]>(INITIAL_EMERGENCIES);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  const filteredEmergencies = emergencies.filter((e) => {
    if (activeUnit === "semua" || activeUnit === "bnpb_bpbd") return true;
    return e.assistance_type === activeUnit;
  });

  const handleDispatch = (id: string, team: string) => {
    setEmergencies((prev) =>
      prev.map((e) =>
        e.id === id ? { ...e, status: "ditangani", dispatched_team: team } : e
      )
    );
  };

  const handleResolve = (id: string) => {
    setEmergencies((prev) =>
      prev.map((e) => (e.id === id ? { ...e, status: "selesai" } : e))
    );
  };

  const getAgencyIcon = (type: SosAssistanceType) => {
    switch (type) {
      case "damkar":
        return <Flame className="w-5 h-5 text-danger" />;
      case "medis":
        return <HeartPulse className="w-5 h-5 text-danger" />;
      case "polisi":
        return <Shield className="w-5 h-5 text-info" />;
      case "bnpb_bpbd":
        return <LifeBuoy className="w-5 h-5 text-primary" />;
    }
  };

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      {/* Top Header & Alarm Status */}
      <div className="bg-surface border border-line rounded-lg p-5 shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Link
              href="/admin"
              className="p-1 rounded hover:bg-bg text-ink-muted hover:text-ink mr-1"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="w-3 h-3 rounded-full bg-danger animate-ping" />
            <h1 className="text-xl md:text-2xl font-bold text-ink">
              Monitor Radar SOS Real-Time
            </h1>
          </div>
          <p className="text-xs text-ink-soft mt-1">
            Pantauan instan panggilan darurat masuk untuk instansi: <strong className="text-primary">{activeUnitName}</strong>.
          </p>
        </div>

        {/* Audio Mute/Unmute toggle */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsMuted((prev) => !prev)}
            className={`h-10 px-4 rounded-md border text-xs font-semibold inline-flex items-center gap-2 transition-colors ${
              isMuted
                ? "border-line bg-surface text-ink hover:bg-bg"
                : "border-danger bg-danger-soft text-danger-text animate-pulse"
            }`}
          >
            {isMuted ? (
              <>
                <VolumeX className="w-4 h-4 text-ink-muted" />
                <span>Sirine Disenyapkan</span>
              </>
            ) : (
              <>
                <Volume2 className="w-4 h-4 text-danger" />
                <span>Sirine Siaga Aktif</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Emergency Radar Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredEmergencies.map((emg) => {
          const isPending = emg.status === "aktif";
          const isHandling = emg.status === "ditangani";
          const isFinished = emg.status === "selesai";

          return (
            <div
              key={emg.id}
              className={`rounded-lg border p-6 shadow-card transition-all ${
                isPending
                  ? "bg-danger-soft/30 border-danger/40 ring-2 ring-danger/20"
                  : isHandling
                  ? "bg-surface border-warning"
                  : "bg-surface border-line opacity-75"
              }`}
            >
              {/* Header card */}
              <div className="flex items-start justify-between gap-3 pb-4 border-b border-line">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-surface border border-line flex items-center justify-center shadow-sm">
                    {getAgencyIcon(emg.assistance_type)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-danger text-white">
                        BANTUAN: {emg.assistance_type.toUpperCase()}
                      </span>
                      <span className="text-xs text-ink-muted font-mono">
                        {emg.time_ago}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-ink mt-0.5">
                      Panggilan Darurat #{emg.id}
                    </h3>
                  </div>
                </div>

                <div className="text-right">
                  {isPending && (
                    <span className="px-2.5 py-1 rounded-full text-xs font-extrabold bg-danger text-white animate-pulse">
                      SIAGA MERAH
                    </span>
                  )}
                  {isHandling && (
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-warning-soft text-warning-text border border-warning">
                      Sedang Ditangani
                    </span>
                  )}
                  {isFinished && (
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-success-soft text-success-text">
                      Evakuasi Berhasil
                    </span>
                  )}
                </div>
              </div>

              {/* Location & GPS Specs */}
              <div className="py-4 space-y-2 text-xs">
                <div>
                  <span className="text-ink-muted block mb-0.5 font-semibold">
                    Lokasi Pemancar Sinyal:
                  </span>
                  <p className="font-semibold text-ink text-sm">
                    📍 {emg.address}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-[11px]">
                  <div className="p-2 bg-bg rounded border border-line">
                    <span className="text-ink-muted block">Koordinat GPS:</span>
                    <span className="font-bold text-ink">{emg.coordinates}</span>
                  </div>
                  <div className="p-2 bg-bg rounded border border-line">
                    <span className="text-ink-muted block">Sumber Sinyal:</span>
                    <span className="font-bold text-ink">{emg.source}</span>
                  </div>
                </div>

                {emg.dispatched_team && (
                  <div className="p-3 rounded-md bg-info-soft border border-info/30 text-info-text text-xs">
                    <strong>Regu yang Ditugaskan:</strong> {emg.dispatched_team}
                  </div>
                )}
              </div>

              {/* Action Buttons for Dispatching Forces */}
              <div className="pt-4 border-t border-line flex flex-wrap items-center justify-between gap-2">
                <a
                  href={`https://maps.google.com/?q=${emg.coordinates}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-2 rounded-md border border-line bg-surface hover:bg-bg text-ink text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
                >
                  <Navigation className="w-3.5 h-3.5 text-primary" />
                  <span>Buka Navigasi GPS</span>
                </a>

                {isPending && (
                  <button
                    type="button"
                    onClick={() =>
                      handleDispatch(
                        emg.id,
                        emg.assistance_type === "damkar"
                          ? "Armada Damkar Sektor Barat"
                          : emg.assistance_type === "medis"
                          ? "Ambulans Gawat Darurat 119"
                          : "Patroli Reaksi Cepat"
                      )
                    }
                    className="px-4 py-2 rounded-md bg-danger hover:bg-danger/90 text-white text-xs font-bold transition-colors shadow-sm"
                  >
                    Kirim Armada & Tangani Sekarang
                  </button>
                )}

                {isHandling && (
                  <button
                    type="button"
                    onClick={() => handleResolve(emg.id)}
                    className="px-4 py-2 rounded-md bg-success hover:bg-success/90 text-white text-xs font-bold transition-colors shadow-sm inline-flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Tandai Selesai / Aman</span>
                  </button>
                )}

                {isFinished && (
                  <span className="text-xs text-success-text font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4 text-success" />
                    <span>Penanganan Ditutup</span>
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

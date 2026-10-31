"use client";

import React, { useState, useEffect, useCallback } from "react";
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
  Phone,
  PhoneCall,
  MessageSquare,
  AlertTriangle,
  Ban,
} from "lucide-react";
import { useAdmin } from "@/components/layout/AdminShell";
import type { SosAssistanceType } from "@/types";
import { fetchLiveSosAlerts, updateSosAlertStatus, DEFAULT_MOCK_SOS, type LiveSosItem } from "@/lib/services/sos";
import { supabase } from "@/lib/supabase/client";

export default function AdminSosPage() {
  const { activeUnit, activeUnitName, setActiveSosCount } = useAdmin();
  const [emergencies, setEmergencies] = useState<LiveSosItem[]>(DEFAULT_MOCK_SOS);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [filterTab, setFilterTab] = useState<"semua" | "aktif" | "ditangani" | "palsu">("semua");

  const loadData = useCallback(async () => {
    try {
      const live = await fetchLiveSosAlerts();
      if (live && live.length > 0) {
        setEmergencies(live);
        const activeCount = live.filter((e) => e.status === "aktif").length;
        setActiveSosCount(activeCount);
      }
    } catch (err) {
      console.warn("Gagal memuat panggilan SOS:", err);
    }
  }, [setActiveSosCount]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadData();
    }, 0);

    // Realtime channel listener
    const channel = supabase
      .channel("admin_sos_page_realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "sos_alerts" },
        () => {
          loadData();
        }
      )
      .subscribe();

    const interval = setInterval(loadData, 5000);

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [loadData]);

  const filteredEmergencies = emergencies.filter((e) => {
    // 1. Filter unit
    if (activeUnit !== "semua" && activeUnit !== "bnpb_bpbd") {
      if (e.assistance_type !== activeUnit) return false;
    }
    // 2. Filter tab
    if (filterTab === "aktif") return e.status === "aktif";
    if (filterTab === "ditangani") return e.status === "ditangani";
    if (filterTab === "palsu") return e.status === "palsu";
    return true;
  });

  const handleDispatch = async (id: string, team: string) => {
    setEmergencies((prev) =>
      prev.map((e) =>
        e.id === id ? { ...e, status: "ditangani", dispatched_team: team } : e
      )
    );
    await updateSosAlertStatus(id, "ditangani", team);
    loadData();
  };

  const handleResolve = async (id: string) => {
    setEmergencies((prev) =>
      prev.map((e) => (e.id === id ? { ...e, status: "selesai" } : e))
    );
    await updateSosAlertStatus(id, "selesai");
    loadData();
  };

  const handleMarkFake = async (id: string) => {
    if (
      !window.confirm(
        "Tandai panggilan SOS ini sebagai PALSU / FALSE ALARM? Sinyal akan diabaikan dan armada tidak diberangkatkan."
      )
    ) {
      return;
    }
    setEmergencies((prev) =>
      prev.map((e) => (e.id === id ? { ...e, status: "palsu" } : e))
    );
    await updateSosAlertStatus(id, "palsu");
    loadData();
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
            Pantauan instan panggilan darurat masuk untuk instansi: <strong className="text-primary">{activeUnitName}</strong>. Lakukan verifikasi telepon (*call-back*) sebelum dispatch armada.
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

      {/* Filter Tabs Status */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setFilterTab("semua")}
          className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${
            filterTab === "semua"
              ? "bg-ink text-white"
              : "bg-surface border border-line text-ink hover:bg-bg"
          }`}
        >
          Semua Radar ({emergencies.length})
        </button>
        <button
          type="button"
          onClick={() => setFilterTab("aktif")}
          className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${
            filterTab === "aktif"
              ? "bg-danger text-white"
              : "bg-surface border border-line text-danger-text hover:bg-danger-soft"
          }`}
        >
          Belum Ditangani ({emergencies.filter((e) => e.status === "aktif").length})
        </button>
        <button
          type="button"
          onClick={() => setFilterTab("ditangani")}
          className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${
            filterTab === "ditangani"
              ? "bg-warning text-white"
              : "bg-surface border border-line text-warning-text hover:bg-warning-soft"
          }`}
        >
          Sedang Ditangani ({emergencies.filter((e) => e.status === "ditangani").length})
        </button>
        <button
          type="button"
          onClick={() => setFilterTab("palsu")}
          className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${
            filterTab === "palsu"
              ? "bg-ink-muted text-white"
              : "bg-surface border border-line text-ink-muted hover:bg-bg"
          }`}
        >
          Palsu / False Alarm ({emergencies.filter((e) => e.status === "palsu").length})
        </button>
      </div>

      {/* Emergency Radar Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredEmergencies.map((emg) => {
          const isPending = emg.status === "aktif";
          const isHandling = emg.status === "ditangani";
          const isFinished = emg.status === "selesai";
          const isFake = emg.status === "palsu";

          const cleanPhoneDigits = emg.phone_number ? emg.phone_number.replace(/\D/g, "") : "";
          const waPhone = cleanPhoneDigits.startsWith("0")
            ? `62${cleanPhoneDigits.slice(1)}`
            : cleanPhoneDigits;

          return (
            <div
              key={emg.id}
              className={`rounded-lg border p-6 shadow-card transition-all ${
                isPending
                  ? "bg-danger-soft/30 border-danger/40 ring-2 ring-danger/20"
                  : isHandling
                  ? "bg-surface border-warning"
                  : isFake
                  ? "bg-surface border-line opacity-60 line-through-none"
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
                  {isFake && (
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-bg border border-line text-ink-muted">
                      Palsu / False Alarm
                    </span>
                  )}
                </div>
              </div>

              {/* Location & GPS Specs */}
              <div className="py-4 space-y-3 text-xs">
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

                {/* Info Kontak Pelapor & Verifikasi Call-Back */}
                {emg.phone_number ? (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-md flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-emerald-600 shrink-0" />
                      <div>
                        <span className="text-[10px] text-emerald-800 font-bold uppercase block tracking-wider">
                          Nomor Kontak Pelapor (Siap Ditelepon):
                        </span>
                        <span className="font-mono text-sm font-bold text-ink">
                          {emg.phone_number}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <a
                        href={`tel:${cleanPhoneDigits}`}
                        className="px-3 py-1.5 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold inline-flex items-center gap-1 shadow-xs transition-colors"
                      >
                        <PhoneCall className="w-3.5 h-3.5" />
                        <span>Panggil Telepon</span>
                      </a>
                      <a
                        href={`https://wa.me/${waPhone}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 rounded bg-surface border border-emerald-300 text-emerald-700 hover:bg-emerald-100 text-xs font-bold inline-flex items-center gap-1 transition-colors"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Chat WA</span>
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="p-2.5 bg-amber-50/70 border border-amber-200 rounded-md flex items-center justify-between gap-2 text-xs">
                    <div className="flex items-start gap-2 text-amber-800">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold block text-[11px]">
                          Pelapor Anonim (Tanpa Kontak No. HP)
                        </span>
                        <span className="text-[10px] text-amber-700">
                          Harap waspada false alarm. Verifikasi kluster laporan sekitar atau tugaskan patroli cek titik.
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {emg.dispatched_team && (
                  <div className="p-3 rounded-md bg-info-soft border border-info/30 text-info-text text-xs">
                    <strong>Regu yang Ditugaskan:</strong> {emg.dispatched_team}
                  </div>
                )}
              </div>

              {/* Action Buttons for Dispatching Forces */}
              <div className="pt-4 border-t border-line flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <a
                    href={`https://maps.google.com/?q=${emg.coordinates}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-2 rounded-md border border-line bg-surface hover:bg-bg text-ink text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
                  >
                    <Navigation className="w-3.5 h-3.5 text-primary" />
                    <span>Navigasi GPS</span>
                  </a>

                  {/* Tombol Tandai Palsu / Spam jika status belum selesai */}
                  {(isPending || isHandling) && (
                    <button
                      type="button"
                      onClick={() => handleMarkFake(emg.id)}
                      className="px-3 py-2 rounded-md border border-danger/30 bg-surface hover:bg-danger-soft text-danger text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
                      title="Tandai sebagai panggilan palsu / iseng"
                    >
                      <Ban className="w-3.5 h-3.5" />
                      <span>Tandai Palsu</span>
                    </button>
                  )}
                </div>

                <div>
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
                      Kirim Armada & Tangani
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

                  {isFake && (
                    <span className="text-xs text-ink-muted font-bold flex items-center gap-1">
                      <Ban className="w-4 h-4 text-ink-muted" />
                      <span>Dibatalkan (Panggilan Palsu)</span>
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  RotateCw,
  HeartPulse,
  Flame,
  Shield,
  AlertTriangle,
  ChevronRight,
  MapPin,
  Phone,
  MessageSquare,
  Navigation,
  CheckCircle2,
  Pause,
  Plus,
} from "lucide-react";
import { useAdmin } from "@/components/layout/AdminShell";
import type { SosAssistanceType } from "@/types";
import { fetchLiveSosAlerts, updateSosAlertStatus, type LiveSosItem } from "@/lib/services/sos";
import { playSosSiren } from "@/lib/audio/siren";
import { supabase } from "@/lib/supabase/client";

interface DisplaySosItem {
  id: string;
  displayCode: string;
  type: SosAssistanceType;
  title: string;
  address: string;
  coordinates: string;
  timeAgo: string;
  status: "aktif" | "ditangani" | "selesai" | "palsu";
  phoneNumber: string;
  source: string;
}

const DEFAULT_SOS_ITEMS: DisplaySosItem[] = [
  {
    id: "sos-102",
    displayCode: "SOS #102",
    type: "medis",
    title: "Bantuan Medis",
    address: "Jalan Puncak Raya KM 82, Desa Tugu Selatan, Bogor",
    coordinates: "-6.6984, 106.9425",
    timeAgo: "6 menit lalu",
    status: "aktif",
    phoneNumber: "0857-1234-9876",
    source: "Ponsel Warga (GPS Sensor)",
  },
  {
    id: "sos-101",
    displayCode: "SOS #101",
    type: "damkar",
    title: "Bantuan Damkar",
    address: "Perumahan Citra 2 Blok B4, Kalideres, Jakarta Barat",
    coordinates: "-6.1552, 106.7231",
    timeAgo: "1 menit lalu",
    status: "ditangani",
    phoneNumber: "0812-8877-6655",
    source: "Ponsel Warga (GPS Sensor)",
  },
];

export default function AdminSosPage() {
  const { activeUnit, setActiveSosCount, isSirenMuted } = useAdmin();
  const [sosList, setSosList] = useState<DisplaySosItem[]>(DEFAULT_SOS_ITEMS);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const knownIdsRef = React.useRef<Set<string>>(new Set());
  const isFirstLoadRef = React.useRef<boolean>(true);

  // Category counts
  const countMedis = 14;
  const countKebakaran = 11;
  const countKeamanan = 2;
  const countLainnya = 3;

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const live = await fetchLiveSosAlerts();
      const mappedLive: DisplaySosItem[] = (live || []).map((e, index) => {
        let type: SosAssistanceType = e.assistance_type || "damkar";
        let title = "Bantuan Darurat";
        if (type === "medis") title = "Bantuan Medis";
        else if (type === "damkar") title = "Bantuan Damkar";
        else if (type === "polisi") title = "Bantuan Keamanan";
        else title = "Bantuan SAR / Lainnya";

        return {
          id: e.id,
          displayCode: e.id.startsWith("SOS") ? e.id : `SOS #${100 + index + 3}`,
          type,
          title,
          address: e.address || "Titik Darurat Warga",
          coordinates: e.coordinates || "-6.2088, 106.8456",
          timeAgo: e.time_ago || "Baru saja",
          status: e.status || "aktif",
          phoneNumber: e.phone_number || "0812-3456-7890",
          source: e.source || "Ponsel Warga (GPS Sensor)",
        };
      });

      // Trigger siren if incoming new active SOS
      const hasNewActive = mappedLive.some(
        (item) => item.status === "aktif" && !knownIdsRef.current.has(item.id)
      );
      if (!isFirstLoadRef.current && hasNewActive && !isSirenMuted) {
        playSosSiren(4, 0.4);
      }
      mappedLive.forEach((item) => knownIdsRef.current.add(item.id));
      isFirstLoadRef.current = false;

      // Gabungkan data live dan default agar data tidak hilang saat status berubah
      const combined = [...mappedLive];
      for (const def of DEFAULT_SOS_ITEMS) {
        if (!combined.some((item) => item.id === def.id)) {
          combined.push(def);
        }
      }

      // Sort: Active first, then by status
      combined.sort((a, b) => {
        if (a.status === "aktif" && b.status !== "aktif") return -1;
        if (a.status !== "aktif" && b.status === "aktif") return 1;
        return 0;
      });

      setSosList(combined);
      const activeCount = combined.filter((e) => e.status === "aktif").length;
      setActiveSosCount(activeCount);
    } catch (err) {
      console.warn("Gagal sinkronisasi data SOS:", err);
    } finally {
      setIsLoading(false);
    }
  }, [setActiveSosCount, isSirenMuted]);

  useEffect(() => {
    loadData();

    const handleLocalUpdate = () => loadData();
    if (typeof window !== "undefined") {
      window.addEventListener("sigapbumi:sos-created", handleLocalUpdate);
      window.addEventListener("sigapbumi:sos-updated", handleLocalUpdate);
      window.addEventListener("storage", handleLocalUpdate);
    }

    const channel = supabase
      .channel("admin_sos_page_realtime_sync")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "sos_alerts" },
        () => {
          loadData();
        }
      )
      .subscribe();

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("sigapbumi:sos-created", handleLocalUpdate);
        window.removeEventListener("sigapbumi:sos-updated", handleLocalUpdate);
        window.removeEventListener("storage", handleLocalUpdate);
      }
      supabase.removeChannel(channel);
    };
  }, [loadData]);

  // Actions
  const handleMarkProcessing = async (id: string) => {
    setSosList((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: "ditangani" } : item))
    );
    try {
      await updateSosAlertStatus(id, "ditangani", "Tim Siaga Posko");
    } catch {
      // Local fallback
    }
  };

  const handleMarkResolved = async (id: string) => {
    setSosList((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: "selesai" } : item))
    );
    try {
      await updateSosAlertStatus(id, "selesai");
    } catch {
      // Local fallback
    }
  };

  // Filter based on active agency unit
  const visibleSosList = useMemo(() => {
    if (activeUnit === "semua" || activeUnit === "bnpb_bpbd") {
      return sosList;
    }
    return sosList.filter((item) => {
      if (activeUnit === "damkar") return item.type === "damkar";
      if (activeUnit === "medis") return item.type === "medis";
      if (activeUnit === "polisi") return item.type === "polisi";
      return true;
    });
  }, [sosList, activeUnit]);

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto font-sans pb-12 select-none">
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Monitor SOS Real-Time
          </h1>
          <p className="text-xs md:text-sm text-slate-500 font-normal mt-0.5">
            Pantau laporan darurat dari masyarakat secara langsung dan tindak lanjuti dengan cepat.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0 self-start sm:self-auto">
          {/* Live Badge */}
          <div className="px-3.5 py-1.5 rounded-full bg-[#ECFDF5] text-[#059669] border border-emerald-200/80 text-xs font-bold inline-flex items-center gap-1.5 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
            <span>Live</span>
          </div>

          {/* Segarkan Button */}
          <button
            type="button"
            onClick={loadData}
            disabled={isLoading}
            className="px-4 py-2 rounded-xl border border-slate-200/90 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 shadow-2xs transition-colors inline-flex items-center gap-2 cursor-pointer"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-orange-500" : "text-slate-500"}`} />
            <span>Segarkan</span>
          </button>
        </div>
      </div>

      {/* 2. Category Metric Cards (Row 1) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
        {/* Card 1: SOS Medis */}
        <div className="bg-white rounded-2xl border border-slate-100 p-4 px-5 shadow-[0_2px_12px_rgba(0,0,0,0.02)] flex items-center justify-between hover:shadow-md transition-shadow cursor-pointer">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-full bg-[#FEE2E2] flex items-center justify-center text-[#EF4444] shrink-0 font-bold">
              <Plus className="w-6 h-6 stroke-[3]" />
            </div>
            <div>
              <p className="text-2xl font-extrabold text-slate-900 tracking-tight leading-none">
                {countMedis}
              </p>
              <p className="text-xs text-slate-500 font-medium mt-1">
                SOS Medis
              </p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
        </div>

        {/* Card 2: SOS Kebakaran */}
        <div className="bg-white rounded-2xl border border-slate-100 p-4 px-5 shadow-[0_2px_12px_rgba(0,0,0,0.02)] flex items-center justify-between hover:shadow-md transition-shadow cursor-pointer">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-full bg-[#FFEDD5] flex items-center justify-center text-[#EA580C] shrink-0 font-bold">
              <Flame className="w-6 h-6 fill-[#EA580C]" />
            </div>
            <div>
              <p className="text-2xl font-extrabold text-slate-900 tracking-tight leading-none">
                {countKebakaran}
              </p>
              <p className="text-xs text-slate-500 font-medium mt-1">
                SOS Kebakaran
              </p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
        </div>

        {/* Card 3: SOS Keamanan */}
        <div className="bg-white rounded-2xl border border-slate-100 p-4 px-5 shadow-[0_2px_12px_rgba(0,0,0,0.02)] flex items-center justify-between hover:shadow-md transition-shadow cursor-pointer">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-full bg-[#DBEAFE] flex items-center justify-center text-[#2563EB] shrink-0 font-bold">
              <Shield className="w-6 h-6 fill-[#2563EB]" />
            </div>
            <div>
              <p className="text-2xl font-extrabold text-slate-900 tracking-tight leading-none">
                {countKeamanan}
              </p>
              <p className="text-xs text-slate-500 font-medium mt-1">
                SOS Keamanan
              </p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
        </div>

        {/* Card 4: SOS Lainnya */}
        <div className="bg-white rounded-2xl border border-slate-100 p-4 px-5 shadow-[0_2px_12px_rgba(0,0,0,0.02)] flex items-center justify-between hover:shadow-md transition-shadow cursor-pointer">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-full bg-[#D1FAE5] flex items-center justify-center text-[#059669] shrink-0 font-bold">
              <AlertTriangle className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <p className="text-2xl font-extrabold text-slate-900 tracking-tight leading-none">
                {countLainnya}
              </p>
              <p className="text-xs text-slate-500 font-medium mt-1">
                SOS Lainnya
              </p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
        </div>
      </div>

      {/* 3. Emergency SOS Cards (2 Columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 md:gap-6 pt-1">
        {visibleSosList.map((item) => {
          const isMedis = item.type === "medis";
          const isDamkar = item.type === "damkar";
          const isAktif = item.status === "aktif";
          const isHandling = item.status === "ditangani";
          const isResolved = item.status === "selesai";

          // Card outline styling
          const cardBorderColor = isMedis
            ? "border-rose-400 ring-1 ring-rose-200/50"
            : isDamkar
            ? "border-amber-400 ring-1 ring-amber-200/50"
            : "border-slate-200";

          const cleanPhoneDigits = item.phoneNumber ? item.phoneNumber.replace(/\D/g, "") : "";
          const waPhone = cleanPhoneDigits.startsWith("0")
            ? `62${cleanPhoneDigits.slice(1)}`
            : cleanPhoneDigits;

          return (
            <div
              key={item.id}
              className={`bg-white rounded-2xl border p-5 sm:p-6 shadow-[0_2px_16px_rgba(0,0,0,0.03)] flex flex-col justify-between gap-5 transition-all relative overflow-hidden ${cardBorderColor}`}
            >
              <div className="space-y-4">
                {/* Top Info Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3.5">
                    {/* Category Icon Circle */}
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${
                        isMedis
                          ? "bg-[#FEE2E2] text-[#EF4444]"
                          : isDamkar
                          ? "bg-[#FFEDD5] text-[#EA580C]"
                          : "bg-[#DBEAFE] text-[#2563EB]"
                      }`}
                    >
                      {isMedis && <HeartPulse className="w-6 h-6 stroke-[2.2]" />}
                      {isDamkar && <Flame className="w-6 h-6 fill-[#EA580C]" />}
                      {!isMedis && !isDamkar && <Shield className="w-6 h-6 fill-[#2563EB]" />}
                    </div>

                    <div>
                      <h3 className="text-base font-bold text-slate-900 tracking-tight leading-snug">
                        {item.title}
                      </h3>
                      <p className="text-xs text-slate-400 font-normal mt-0.5">
                        <span className="font-semibold text-slate-500">{item.displayCode}</span>
                        <span className="mx-1.5">•</span>
                        <span>{item.timeAgo}</span>
                      </p>
                    </div>
                  </div>

                  {/* Status Pill Badge */}
                  <div>
                    {isAktif && (
                      <span className="px-3 py-1 rounded-full bg-[#FFF1F2] text-[#E11D48] border border-rose-200/80 text-xs font-bold inline-flex items-center gap-1.5 shadow-2xs">
                        <span className="w-2 h-2 rounded-full bg-[#E11D48] animate-pulse" />
                        <span>Aktif</span>
                      </span>
                    )}
                    {isHandling && (
                      <span className="px-3 py-1 rounded-full bg-[#FFF7ED] text-[#EA580C] border border-amber-200/80 text-xs font-bold inline-flex items-center gap-1.5 shadow-2xs">
                        <span className="w-2 h-2 rounded-full bg-[#EA580C]" />
                        <span>Sedang Ditangani</span>
                      </span>
                    )}
                    {isResolved && (
                      <span className="px-3 py-1 rounded-full bg-[#ECFDF5] text-[#059669] border border-emerald-200/80 text-xs font-bold inline-flex items-center gap-1.5 shadow-2xs">
                        <span className="w-2 h-2 rounded-full bg-[#059669]" />
                        <span>Selesai / Aman</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Location Address */}
                <div className="flex items-start gap-2 pt-1">
                  <MapPin className="w-4 h-4 text-slate-700 shrink-0 mt-0.5" />
                  <p className="font-semibold text-slate-800 text-xs sm:text-sm leading-snug">
                    {item.address}
                  </p>
                </div>

                {/* Mini Geolocation Card */}
                <div className="bg-[#F8FAFC] rounded-xl border border-slate-100 p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {/* Mini Map Canvas Mock with Red Marker */}
                    <div className="w-24 h-14 rounded-lg bg-linear-to-tr from-slate-200 to-slate-100 border border-slate-200/80 relative overflow-hidden flex items-center justify-center shrink-0">
                      {/* Streets decorative lines */}
                      <svg
                        className="absolute inset-0 w-full h-full text-slate-300 opacity-60"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 100 60"
                      >
                        <path d="M-10 20 H110" stroke="currentColor" strokeWidth="2.5" />
                        <path d="M30 -10 V70" stroke="currentColor" strokeWidth="2.5" />
                        <path d="M70 -10 V70" stroke="currentColor" strokeWidth="2.5" />
                        <path d="M-10 45 Q50 30 110 50" stroke="currentColor" strokeWidth="2" />
                      </svg>
                      {/* Red Marker */}
                      <div className="relative z-10 flex flex-col items-center">
                        <MapPin className="w-5 h-5 text-red-600 fill-red-600 animate-bounce drop-shadow-sm" />
                      </div>
                    </div>

                    <div>
                      <span className="text-[11px] text-slate-400 block font-normal">
                        Koordinat GPS
                      </span>
                      <span className="text-xs sm:text-[13px] font-bold text-slate-800 font-mono">
                        {item.coordinates}
                      </span>
                    </div>
                  </div>

                  <div className="sm:border-l sm:border-slate-200 sm:pl-4">
                    <span className="text-[11px] text-slate-400 block font-normal">
                      Sumber Sinyal
                    </span>
                    <span className="text-xs sm:text-[13px] font-bold text-slate-800">
                      {item.source}
                    </span>
                  </div>
                </div>

                {/* Contact Phone & WhatsApp Buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  <a
                    href={`tel:${cleanPhoneDigits}`}
                    className={`h-10 rounded-xl text-xs font-bold inline-flex items-center justify-center gap-2 transition-all shadow-2xs ${
                      isMedis
                        ? "bg-[#FFF1F2] text-[#E11D48] border border-rose-200/80 hover:bg-rose-100/70"
                        : "bg-[#FFF7ED] text-[#EA580C] border border-amber-200/80 hover:bg-amber-100/70"
                    }`}
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>{item.phoneNumber}</span>
                  </a>

                  <a
                    href={`https://wa.me/${waPhone}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`h-10 rounded-xl text-xs font-bold inline-flex items-center justify-center gap-2 transition-all shadow-2xs ${
                      isMedis
                        ? "bg-white text-[#E11D48] border border-rose-200 hover:bg-rose-50"
                        : "bg-white text-[#EA580C] border border-amber-200 hover:bg-amber-50"
                    }`}
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Chat WA</span>
                  </a>
                </div>
              </div>

              {/* Bottom Action Buttons: Navigasi GPS & Process/Resolve */}
              <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-100">
                <a
                  href={`https://www.google.com/maps?q=${encodeURIComponent(item.coordinates)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-9 px-3.5 rounded-xl border border-slate-200/90 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold inline-flex items-center gap-2 shadow-2xs transition-colors"
                >
                  <Navigation className="w-3.5 h-3.5 text-slate-600" />
                  <span>Navigasi GPS</span>
                </a>

                <div>
                  {isAktif && (
                    <button
                      type="button"
                      onClick={() => handleMarkProcessing(item.id)}
                      className="h-9 px-3.5 rounded-xl border border-slate-200/90 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold inline-flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                    >
                      <Pause className="w-3.5 h-3.5 text-slate-500" />
                      <span>Tandai Diproses</span>
                    </button>
                  )}

                  {!isAktif && !isResolved && (
                    <button
                      type="button"
                      onClick={() => handleMarkResolved(item.id)}
                      className="h-9 px-4 rounded-xl bg-[#059669] hover:bg-[#047857] text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                      <span>Tandai Selesai / Aman</span>
                    </button>
                  )}

                  {isResolved && (
                    <span className="text-xs font-bold text-emerald-600 inline-flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Telah Ditangani</span>
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

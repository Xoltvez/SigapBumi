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
  Trash2,
  Clock,
  Layers,
  Filter,
} from "lucide-react";
import { useAdmin } from "@/components/layout/AdminShell";
import type { SosAssistanceType } from "@/types";
import {
  fetchLiveSosAlerts,
  updateSosAlertStatus,
  deleteSosAlertLive,
  getDeletedSosIds,
  type LiveSosItem,
} from "@/lib/services/sos";
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

  // Modal & Toast states for delete
  const [deleteConfirmTarget, setDeleteConfirmTarget] = useState<DisplaySosItem | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Kategori Filter Status
  const [statusFilter, setStatusFilter] = useState<"semua" | "aktif" | "ditangani" | "selesai">("semua");

  // Dynamic Category counts
  const countMedis = useMemo(() => sosList.filter((x) => x.type === "medis").length, [sosList]);
  const countKebakaran = useMemo(() => sosList.filter((x) => x.type === "damkar").length, [sosList]);
  const countKeamanan = useMemo(() => sosList.filter((x) => x.type === "polisi").length, [sosList]);
  const countLainnya = useMemo(() => sosList.filter((x) => x.type === "bnpb_bpbd" || (x.type as string) === "lainnya").length, [sosList]);

  // Status Filter counts
  const countAktif = useMemo(() => sosList.filter((x) => x.status === "aktif").length, [sosList]);
  const countDitangani = useMemo(() => sosList.filter((x) => x.status === "ditangani").length, [sosList]);
  const countSelesai = useMemo(() => sosList.filter((x) => x.status === "selesai" || x.status === "palsu").length, [sosList]);
  const countTotal = sosList.length;

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

      // Filter out deleted items
      const deletedSos = getDeletedSosIds();
      const filteredLive = mappedLive.filter(
        (item) => !deletedSos.has(item.id) && !deletedSos.has(item.displayCode)
      );

      // Trigger siren if incoming new active SOS
      const hasNewActive = filteredLive.some(
        (item) => item.status === "aktif" && !knownIdsRef.current.has(item.id)
      );
      if (!isFirstLoadRef.current && hasNewActive && !isSirenMuted) {
        playSosSiren(4, 0.4);
      }
      filteredLive.forEach((item) => knownIdsRef.current.add(item.id));
      isFirstLoadRef.current = false;

      // Gabungkan data live dan default agar data tidak hilang saat status berubah (kecuali yang sudah dihapus)
      const combined = [...filteredLive];
      for (const def of DEFAULT_SOS_ITEMS) {
        if (
          !deletedSos.has(def.id) &&
          !deletedSos.has(def.displayCode) &&
          !combined.some((item) => item.id === def.id)
        ) {
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
      window.addEventListener("sigapbumi:sos-deleted", handleLocalUpdate);
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
        window.removeEventListener("sigapbumi:sos-deleted", handleLocalUpdate);
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

  const handleConfirmDelete = async () => {
    if (!deleteConfirmTarget) return;
    const target = deleteConfirmTarget;
    setIsDeleting(true);

    // Optimistic UI removal
    setSosList((prev) => prev.filter((item) => item.id !== target.id));
    setActiveSosCount((prev) => Math.max(0, prev - (target.status === "aktif" ? 1 : 0)));

    try {
      await deleteSosAlertLive(target.id, "Petugas Posko Terpadu");
      setToastMessage(`Panggilan darurat ${target.displayCode} (${target.title}) berhasil dihapus.`);
      setTimeout(() => setToastMessage(null), 4000);
    } catch (err) {
      console.error("Gagal menghapus SOS:", err);
      alert("Terjadi kendala saat menghapus SOS.");
    } finally {
      setIsDeleting(false);
      setDeleteConfirmTarget(null);
    }
  };

  // Filter based on active agency unit and status category
  const visibleSosList = useMemo(() => {
    return sosList.filter((item) => {
      // 1. Filter Instansi Unit
      if (activeUnit !== "semua" && activeUnit !== "bnpb_bpbd" && activeUnit !== "pemerintahan") {
        if (activeUnit === "damkar" && item.type !== "damkar") return false;
        if (activeUnit === "medis" && item.type !== "medis") return false;
        if (activeUnit === "polisi" && item.type !== "polisi") return false;
      }

      // 2. Filter Kategori Status
      if (statusFilter === "aktif") {
        return item.status === "aktif";
      }
      if (statusFilter === "ditangani") {
        return item.status === "ditangani";
      }
      if (statusFilter === "selesai") {
        return item.status === "selesai" || item.status === "palsu";
      }

      return true;
    });
  }, [sosList, activeUnit, statusFilter]);

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto font-sans pb-12 select-none">
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center justify-between shadow-xs">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            {toastMessage}
          </span>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="text-[11px] underline text-emerald-700 cursor-pointer"
          >
            Tutup
          </button>
        </div>
      )}

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

      {/* 2.5 Filter Bar Kategori Status */}
      <div className="bg-white rounded-2xl border border-slate-100 p-2 sm:p-2.5 shadow-[0_2px_12px_rgba(0,0,0,0.02)] flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          {/* Tab Semua */}
          <button
            type="button"
            onClick={() => setStatusFilter("semua")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all inline-flex items-center gap-2 cursor-pointer shrink-0 ${
              statusFilter === "semua"
                ? "bg-slate-900 text-white shadow-sm"
                : "bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Semua</span>
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${
                statusFilter === "semua"
                  ? "bg-slate-800 text-slate-200"
                  : "bg-slate-200/80 text-slate-600"
              }`}
            >
              {countTotal}
            </span>
          </button>

          {/* Tab Belum Diproses */}
          <button
            type="button"
            onClick={() => setStatusFilter("aktif")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all inline-flex items-center gap-2 cursor-pointer shrink-0 ${
              statusFilter === "aktif"
                ? "bg-rose-600 text-white shadow-sm ring-2 ring-rose-200"
                : "bg-rose-50/80 text-rose-700 hover:bg-rose-100/70 border border-rose-100"
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                statusFilter === "aktif" ? "bg-white" : "bg-rose-500"
              } ${countAktif > 0 ? "animate-pulse" : ""}`}
            />
            <span>Belum Diproses</span>
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${
                statusFilter === "aktif"
                  ? "bg-rose-700 text-white"
                  : "bg-rose-200/80 text-rose-800"
              }`}
            >
              {countAktif}
            </span>
          </button>

          {/* Tab Sedang Ditangani */}
          <button
            type="button"
            onClick={() => setStatusFilter("ditangani")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all inline-flex items-center gap-2 cursor-pointer shrink-0 ${
              statusFilter === "ditangani"
                ? "bg-amber-600 text-white shadow-sm ring-2 ring-amber-200"
                : "bg-amber-50/80 text-amber-700 hover:bg-amber-100/70 border border-amber-100"
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Sedang Ditangani</span>
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${
                statusFilter === "ditangani"
                  ? "bg-amber-700 text-white"
                  : "bg-amber-200/80 text-amber-800"
              }`}
            >
              {countDitangani}
            </span>
          </button>

          {/* Tab Selesai */}
          <button
            type="button"
            onClick={() => setStatusFilter("selesai")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all inline-flex items-center gap-2 cursor-pointer shrink-0 ${
              statusFilter === "selesai"
                ? "bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-200"
                : "bg-emerald-50/80 text-emerald-700 hover:bg-emerald-100/70 border border-emerald-100"
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Selesai</span>
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${
                statusFilter === "selesai"
                  ? "bg-emerald-700 text-white"
                  : "bg-emerald-200/80 text-emerald-800"
              }`}
            >
              {countSelesai}
            </span>
          </button>
        </div>

        {/* Counter keterangan */}
        <div className="text-[11px] text-slate-500 font-medium px-2 shrink-0 flex items-center gap-1.5">
          <Filter className="w-3 h-3 text-slate-400" />
          <span>
            Menampilkan <strong className="text-slate-800 font-bold">{visibleSosList.length}</strong> dari {sosList.length} panggilan
          </span>
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

              {/* Bottom Action Buttons: Navigasi GPS, Hapus, & Process/Resolve */}
              <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-100">
                <div className="flex items-center gap-2">
                  <a
                    href={`https://www.google.com/maps?q=${encodeURIComponent(item.coordinates)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="h-9 px-3.5 rounded-xl border border-slate-200/90 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold inline-flex items-center gap-2 shadow-2xs transition-colors"
                  >
                    <Navigation className="w-3.5 h-3.5 text-slate-600" />
                    <span>Navigasi GPS</span>
                  </a>

                  <button
                    type="button"
                    onClick={() => setDeleteConfirmTarget(item)}
                    className="h-9 px-2.5 rounded-xl border border-rose-200 bg-white hover:bg-rose-50 text-rose-600 text-xs font-semibold inline-flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                    title="Hapus panggilan SOS ini"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Hapus</span>
                  </button>
                </div>

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

        {/* Empty State */}
        {visibleSosList.length === 0 && (
          <div className="col-span-full py-16 bg-white rounded-2xl border border-slate-100 text-center space-y-2 shadow-xs">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
            <p className="text-sm font-bold text-slate-800">
              {statusFilter === "aktif"
                ? "Tidak Ada Panggilan SOS Belum Diproses"
                : statusFilter === "ditangani"
                ? "Tidak Ada Panggilan SOS Sedang Ditangani"
                : statusFilter === "selesai"
                ? "Belum Ada Panggilan SOS Selesai"
                : "Tidak Ada Panggilan Darurat SOS"}
            </p>
            <p className="text-xs text-slate-400">
              {statusFilter === "aktif"
                ? "Seluruh sinyal darurat warga telah ditindaklanjuti oleh petugas posko."
                : statusFilter === "ditangani"
                ? "Tidak ada panggilan darurat yang sedang berjalan di lapangan saat ini."
                : statusFilter === "selesai"
                ? "Belum ada panggilan darurat yang ditandai selesai."
                : "Semua panggilan darurat telah dibersihkan atau ditangani secara tuntas."}
            </p>
            {statusFilter !== "semua" && (
              <button
                type="button"
                onClick={() => setStatusFilter("semua")}
                className="mt-2 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs cursor-pointer"
              >
                <span>Lihat Semua Status</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Modal Dialog Konfirmasi Hapus SOS */}
      {deleteConfirmTarget && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-rose-200 rounded-2xl p-6 max-w-sm w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-full bg-rose-100 text-rose-600 shrink-0 mt-0.5">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Konfirmasi Hapus SOS</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Apakah Anda yakin ingin menghapus panggilan darurat{" "}
                  <strong className="text-slate-800">
                    {deleteConfirmTarget.displayCode} ({deleteConfirmTarget.title})
                  </strong>
                  ? Tindakan ini akan menghapus sinyal darurat dari pantauan posko terpadu.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeleteConfirmTarget(null)}
                disabled={isDeleting}
                className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                {isDeleting ? "Menghapus..." : "Ya, Hapus SOS"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Waves,
  Activity,
  Flame,
  Mountain,
  Trees,
  AlertTriangle,
  MapPin,
  UploadCloud,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Send,
  X,
  Plus,
  ShieldAlert,
  Loader2,
  LocateFixed,
  FileCheck2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { generateTrackingCode } from "@/lib/tracking";
import {
  saveLocalReport,
  inferAgencyFromDisaster,
  registerMyReportTrackingCode,
  type LiveReportItem,
} from "@/lib/services/reports";
import { getCurrentUser } from "@/lib/auth";
import { WILAYAH_INDONESIA, PROVINSI_INDONESIA } from "@/lib/data/wilayah-indonesia";
import type { DisasterType, PriorityLabel } from "@/types";

interface FormData {
  disaster_type: DisasterType;
  priority: PriorityLabel;
  title: string;
  description: string;
  address: string;
  province: string;
  regency: string;
  latitude: number;
  longitude: number;
  reporter_name: string;
  reporter_phone: string;
  urgent_needs: string[];
}

function generateReportUUID(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Perkecil foto (maks 1280px sisi terpanjang, JPEG 0.8) agar ringan disimpan
 * sebagai data URL di localStorage maupun kolom report_media.media_url.
 */
function compressImageDataUrl(dataUrl: string, maxSide = 1280, quality = 0.8): Promise<string> {
  return new Promise((resolve) => {
    const img = new window.Image();
    img.onload = () => {
      const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext("2d");
      if (!ctx) return resolve(dataUrl);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

function LaporForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Initial disaster type from query param if available
  const initialType = (searchParams.get("tipe") as DisasterType) || "banjir";

  const [step, setStep] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [locationLoading, setLocationLoading] = useState<boolean>(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFileName, setPhotoFileName] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  // Bertambah setiap validasi gagal agar scroll tetap jalan walau pesan sama
  const [errorNonce, setErrorNonce] = useState<number>(0);
  const errorRef = useRef<HTMLDivElement>(null);
  const [customNeed, setCustomNeed] = useState<string>("");
  const [customNeedError, setCustomNeedError] = useState<string | null>(null);

  const [formData, setFormData] = useState<FormData>({
    disaster_type: initialType,
    priority: "Sedang",
    title: "",
    description: "",
    address: "",
    province: "DKI Jakarta",
    regency: "Kota Jakarta Barat",
    latitude: -6.2088,
    longitude: 106.8456,
    reporter_name: "",
    reporter_phone: "",
    urgent_needs: [],
  });

  const priorityOptions: {
    key: "Tinggi" | "Sedang" | "Rendah";
    label: string;
    dotColor: string;
    borderActive: string;
    bgActive: string;
    textColor: string;
  }[] = [
    {
      key: "Tinggi",
      label: "Tinggi",
      dotColor: "bg-orange-500",
      borderActive: "border-orange-500 ring-2 ring-orange-400/30",
      bgActive: "bg-orange-50 text-orange-950 font-bold",
      textColor: "text-orange-600",
    },
    {
      key: "Sedang",
      label: "Sedang",
      dotColor: "bg-blue-500",
      borderActive: "border-blue-500 ring-2 ring-blue-400/30",
      bgActive: "bg-blue-50 text-blue-950 font-bold",
      textColor: "text-blue-600",
    },
    {
      key: "Rendah",
      label: "Rendah",
      dotColor: "bg-emerald-500",
      borderActive: "border-emerald-500 ring-2 ring-emerald-400/30",
      bgActive: "bg-emerald-50 text-emerald-950 font-bold",
      textColor: "text-emerald-600",
    },
  ];

  const categories: { key: DisasterType; label: string; icon?: React.ElementType; iconUrl?: string; color: string }[] = [
    { key: "banjir", label: "Tsunami & Banjir", iconUrl: "/icon%20bencana/banjir.png", icon: Waves, color: "text-info" },
    { key: "gempa", label: "Gempa Bumi", iconUrl: "/icon%20bencana/gempa%20bumi.png", icon: Activity, color: "text-warning" },
    { key: "kebakaran", label: "Kebakaran", iconUrl: "/icon%20bencana/house-fire.png", icon: Flame, color: "text-danger" },
    { key: "longsor", label: "Tanah Longsor", iconUrl: "/icon%20bencana/avalanche.png", icon: Mountain, color: "text-ink" },
    { key: "karhutla", label: "Karhutla", iconUrl: "/icon%20bencana/fire.png", icon: Trees, color: "text-warning" },
    { key: "lainnya", label: "Lainnya", iconUrl: "/icon%20bencana/disaster-management.png", icon: AlertTriangle, color: "text-ink-muted" },
  ];

  const urgentOptions = [
    "Evakuasi Lansia & Bayi",
    "Perahu Karet / Pelampung",
    "Makanan & Air Bersih",
    "Pertolongan Medis Darurat",
    "Tenda Darurat / Terpal",
  ];

  const provinceOptions = PROVINSI_INDONESIA;
  const regencyOptions = WILAYAH_INDONESIA[formData.province] ?? [];

  // Geolocation handler with user permission request
  const handleGetLocation = () => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      alert("Browser Anda tidak mendukung deteksi lokasi otomatis.");
      return;
    }

    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData((prev) => ({
          ...prev,
          latitude: Number(position.coords.latitude.toFixed(6)),
          longitude: Number(position.coords.longitude.toFixed(6)),
        }));
        setLocationLoading(false);
      },
      (error) => {
        console.warn("Geolocation error:", error);
        setLocationLoading(false);
        alert("Izin lokasi tidak diberikan atau GPS belum aktif. Anda tetap dapat mengisi alamat lokasi secara manual.");
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // Photo upload handler with 10MB limit validation
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert("Ukuran file maksimal 10 MB");
        return;
      }
      setPhotoFileName(file.name);
      const reader = new FileReader();
      reader.onloadend = async () => {
        const raw = reader.result as string;
        // Kompres agar muat di localStorage & kolom media_url database
        setPhotoPreview(await compressImageDataUrl(raw));
      };
      reader.readAsDataURL(file);
    }
  };

  const removePhoto = () => {
    setPhotoPreview(null);
    setPhotoFileName(null);
  };

  const toggleUrgentNeed = (need: string) => {
    setFormData((prev) => {
      const exists = prev.urgent_needs.includes(need);
      return {
        ...prev,
        urgent_needs: exists
          ? prev.urgent_needs.filter((item) => item !== need)
          : [...prev.urgent_needs, need],
      };
    });
  };

  const MAX_URGENT_NEEDS = 10;
  const MAX_CUSTOM_NEED_LENGTH = 40;

  // Tambah kebutuhan custom yang diketik warga
  const addCustomNeed = () => {
    const value = customNeed.trim().replace(/\s+/g, " ");
    if (!value) return;

    const isDuplicate = formData.urgent_needs.some(
      (n) => n.toLowerCase() === value.toLowerCase()
    );
    if (isDuplicate) {
      setCustomNeedError("Kebutuhan ini sudah ada di daftar.");
      return;
    }
    if (formData.urgent_needs.length >= MAX_URGENT_NEEDS) {
      setCustomNeedError(`Maksimal ${MAX_URGENT_NEEDS} kebutuhan per laporan.`);
      return;
    }

    setFormData((prev) => ({ ...prev, urgent_needs: [...prev.urgent_needs, value] }));
    setCustomNeed("");
    setCustomNeedError(null);
  };

  const removeUrgentNeed = (need: string) => {
    setFormData((prev) => ({
      ...prev,
      urgent_needs: prev.urgent_needs.filter((n) => n !== need),
    }));
  };

  // Step navigation validation (Alur 3 Tahap)
  const showValidationError = (message: string) => {
    setErrorMessage(message);
    setErrorNonce((n) => n + 1);
  };

  const handleNext = () => {
    setErrorMessage(null);
    if (step === 1 && !formData.address.trim()) {
      showValidationError("Silakan isi alamat, nama jalan, atau patokan lokasi kejadian.");
      return;
    }
    if (step === 2) {
      if (!formData.title.trim()) {
        showValidationError("Judul laporan singkat wajib diisi.");
        return;
      }
      if (!formData.description.trim()) {
        showValidationError("Deskripsi kondisi kejadian wajib diisi agar posko dapat menindaklanjuti.");
        return;
      }
    }
    setStep((prev) => prev + 1);
  };

  // Gulir ke pesan error setiap kali validasi gagal agar langsung terlihat
  useEffect(() => {
    if (errorNonce === 0 || !errorRef.current) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    errorRef.current.scrollIntoView({
      behavior: reduceMotion ? "auto" : "smooth",
      block: "center",
    });
  }, [errorNonce]);

  const handlePrev = () => {
    setErrorMessage(null);
    setStep((prev) => Math.max(1, prev - 1));
  };

  // Final submit handler with double-submit prevention & local resilience
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    const trackingCode = generateTrackingCode();
    const reportId = generateReportUUID();

    // 1. Selalu simpan di penyimpanan lokal perangkat (Zero-loss offline resilience)
    const currentUser = getCurrentUser();
    const isUuid = Boolean(
      currentUser?.id &&
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(currentUser.id)
    );

    const priorityScoreMap: Record<PriorityLabel, number> = {
      Kritis: 95,
      Tinggi: 75,
      Sedang: 50,
      Rendah: 20,
    };
    const calculatedScore = priorityScoreMap[formData.priority] ?? 50;

    const localReportItem: LiveReportItem = {
      id: reportId,
      tracking_code: trackingCode,
      disaster_type: formData.disaster_type,
      target_agency: inferAgencyFromDisaster(formData.disaster_type),
      title: formData.title,
      description: formData.description,
      address: formData.address,
      province: formData.province,
      regency: formData.regency,
      lat: formData.latitude,
      lng: formData.longitude,
      status: "diterima",
      priority: formData.priority.toLowerCase() as "kritis" | "tinggi" | "sedang" | "rendah",
      priority_label: formData.priority,
      confirmation_count: 0,
      created_at: "Baru saja",
      image_url: photoPreview || undefined,
      is_demo: false,
      reporter_id: currentUser?.id,
      user_email: currentUser?.email,
      timeline: [
        {
          status: "diterima",
          label: "Laporan Diterima Sistem",
          timestamp: "Baru saja",
          note: `Laporan tercatat dengan tingkat prioritas ${formData.priority}.`,
        },
      ],
    };

    saveLocalReport(localReportItem);
    registerMyReportTrackingCode(trackingCode, currentUser?.email);

    // 2. Coba simpan ke Supabase jika database/jaringan tersedia
    let isSavedRemote = false;
    try {
      const supabase = createClient();
      const insertPayload: Record<string, unknown> = {
        id: reportId,
        tracking_code: trackingCode,
        disaster_type: formData.disaster_type,
        title: formData.title,
        description: formData.description,
        location: `POINT(${formData.longitude} ${formData.latitude})`,
        address: formData.address,
        province: formData.province,
        regency: formData.regency,
        status: "diterima",
        confirmation_count: 0,
        priority_score: calculatedScore,
      };

      if (isUuid && currentUser) {
        insertPayload.reporter_id = currentUser.id;
      }

      const { error } = await supabase.from("reports").insert(insertPayload);

      if (!error) {
        isSavedRemote = true;

        // Simpan foto bukti lapangan ke tabel report_media
        if (photoPreview) {
          const { error: mediaErr } = await supabase.from("report_media").insert({
            report_id: reportId,
            media_url: photoPreview,
            media_type: "image",
          });
          if (mediaErr) {
            console.warn("Supabase report_media insert notice:", mediaErr.message);
          }
        }
      } else {
        console.warn("Supabase insert notice:", error.message);
      }
    } catch (err) {
      console.warn("Supabase insert network notice:", err);
    } finally {
      setIsSubmitting(false);
    }

    const saveStatus = isSavedRemote ? "saved" : "local";
    router.push(
      `/lapor/sukses?kode=${trackingCode}&tipe=${formData.disaster_type}&status=${saveStatus}`
    );
  };

  return (
    <main className="flex-1 w-full max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10 pb-28 md:pb-12">
      <div className="max-w-[800px] mx-auto">
      {/* Header Form */}
      <div className="text-center mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-ink">
          Formulir Pelaporan Bencana
        </h1>
        <p className="text-sm text-ink-soft mt-1">
          Laporan Anda diverifikasi oleh posko terpadu dan diteruskan ke instansi penanggulangan terdekat.
        </p>
      </div>

      {/* 3-Step Clean Progress Indicator */}
      <div className="bg-surface border border-line rounded-lg p-4 md:p-6 shadow-card mb-6">
        <div className="flex items-center justify-between mb-3 text-xs md:text-sm font-semibold text-ink">
          <span className={step >= 1 ? "text-primary font-bold flex items-center gap-1.5" : "text-ink-muted"}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${
              step >= 1 ? "bg-primary text-white" : "bg-line text-ink-muted"
            }`}>1</span>
            <span>Lokasi Kejadian</span>
          </span>
          <span className={step >= 2 ? "text-primary font-bold flex items-center gap-1.5" : "text-ink-muted"}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${
              step >= 2 ? "bg-primary text-white" : "bg-line text-ink-muted"
            }`}>2</span>
            <span>Jenis & Deskripsi</span>
          </span>
          <span className={step >= 3 ? "text-primary font-bold flex items-center gap-1.5" : "text-ink-muted"}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${
              step >= 3 ? "bg-primary text-white" : "bg-line text-ink-muted"
            }`}>3</span>
            <span>Pemeriksaan & Kirim</span>
          </span>
        </div>
        <div className="w-full bg-line rounded-full h-2">
          <div
            className="bg-primary h-2 rounded-full transition-all duration-300"
            style={{ width: `${(step / 3) * 100}%` }}
          />
        </div>
      </div>

      {/* Form Card Content */}
      <div className="bg-surface border border-line rounded-lg p-6 md:p-8 shadow-card">
        {errorMessage && (
          <div
            key={errorNonce}
            ref={errorRef}
            role="alert"
            className="mb-6 scroll-mt-24 animate-[shake_0.35s_ease-in-out] motion-reduce:animate-none p-4 rounded-md bg-danger-soft border border-danger/20 text-xs font-semibold text-danger-text flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-danger" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAHAP 1: LOKASI KEJADIAN                                       */}
        {/* ============================================================== */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-ink">1. Tentukan Lokasi Kejadian</h2>
              <p className="text-xs text-ink-soft mt-1">
                Gunakan GPS otomatis perangkat atau tentukan wilayah dan patokan alamat secara manual.
              </p>
            </div>

            {/* GPS Detection Box */}
            <div className="bg-bg border border-line rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <MapPin className="w-5 h-5 text-primary shrink-0" />
                <div className="text-xs">
                  <span className="font-semibold text-ink block">
                    Koordinat GPS Terdeteksi:
                  </span>
                  <span className="font-mono text-ink-muted">
                    {formData.latitude.toFixed(6)}, {formData.longitude.toFixed(6)}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleGetLocation}
                disabled={locationLoading}
                className="h-10 px-4 rounded-md bg-surface border border-line-strong hover:bg-bg text-ink text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors shrink-0 disabled:opacity-50 min-h-[44px]"
              >
                {locationLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Mendeteksi Lokasi...</span>
                  </>
                ) : (
                  <>
                    <LocateFixed className="w-3.5 h-3.5 text-primary" />
                    <span>Deteksi Lokasi GPS Saya</span>
                  </>
                )}
              </button>
            </div>

            {/* Provinsi & Kota Selection */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-ink mb-1.5">
                  Provinsi Kejadian <span className="text-danger">*</span>
                </label>
                <select
                  value={formData.province}
                  onChange={(e) => {
                    const province = e.target.value;
                    // Reset kota/kabupaten ke pilihan pertama provinsi baru
                    setFormData((prev) => ({
                      ...prev,
                      province,
                      regency: WILAYAH_INDONESIA[province]?.[0] ?? "",
                    }));
                  }}
                  className="w-full h-11 px-3.5 rounded-md border border-line bg-surface text-sm text-ink focus:border-primary focus:outline-none"
                >
                  {provinceOptions.map((prov) => (
                    <option key={prov} value={prov}>
                      {prov}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1.5">
                  Kota / Kabupaten <span className="text-danger">*</span>
                </label>
                <select
                  value={formData.regency}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, regency: e.target.value }))
                  }
                  className="w-full h-11 px-3.5 rounded-md border border-line bg-surface text-sm text-ink focus:border-primary focus:outline-none"
                >
                  {regencyOptions.map((reg) => (
                    <option key={reg} value={reg}>
                      {reg}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Manual Address Input */}
            <div>
              <label className="block text-xs font-semibold text-ink mb-1.5">
                Alamat Lengkap / Patokan Lokasi <span className="text-danger">*</span>
              </label>
              <textarea
                rows={3}
                value={formData.address}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, address: e.target.value }))
                }
                placeholder="Contoh: Jl. Semanan Raya RT 03 RW 02, Dekat musholla Al-Ikhlas, Kelurahan Semanan"
                className="w-full p-3.5 rounded-md border border-line bg-surface text-sm text-ink focus:border-primary focus:outline-none"
              />
              <p className="text-[11px] text-ink-muted mt-1">
                Tuliskan patokan bangunan atau arah agar tim evakuasi mudah menemukan titik lokasi di lapangan.
              </p>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAHAP 2: JENIS KEJADIAN & DESKRIPSI + FOTO                    */}
        {/* ============================================================== */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-ink">2. Jenis Kejadian & Deskripsi</h2>
              <p className="text-xs text-ink-soft mt-1">
                Pilih kategori bencana, jelaskan situasi lapangan, dan lampirkan bukti foto jika tersedia.
              </p>
            </div>

            {/* Kategori Bencana Grid */}
            <div>
              <label className="block text-xs font-semibold text-ink mb-2">
                Pilih Kategori Bencana <span className="text-danger">*</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {categories.map((cat) => {
                  const Icon = cat.icon;
                  const isSelected = formData.disaster_type === cat.key;
                  return (
                    <button
                      key={cat.key}
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({ ...prev, disaster_type: cat.key }))
                      }
                      className={`flex flex-col items-center justify-center p-4 rounded-lg border text-center transition-all min-h-[44px] ${
                        isSelected
                          ? "border-primary bg-primary-soft/50 ring-2 ring-primary text-primary-hover font-bold shadow-sm"
                          : "border-line bg-surface hover:border-line-strong text-ink font-semibold"
                      }`}
                    >
                      {cat.iconUrl ? (
                        <div className="relative w-11 h-11 mb-2 flex items-center justify-center">
                          <Image
                            src={cat.iconUrl}
                            alt={cat.label}
                            width={42}
                            height={42}
                            className="object-contain"
                          />
                        </div>
                      ) : Icon ? (
                        <Icon className={`w-9 h-9 mb-2 ${cat.color}`} />
                      ) : null}
                      <span className="text-xs">{cat.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Tingkat Prioritas Penanganan Bencana */}
            <div>
              <label className="block text-xs font-semibold text-ink mb-2">
                Tingkat Prioritas Penanganan <span className="text-danger">*</span>
              </label>

              {/* Grid 3 Kartu Prioritas: Tinggi, Sedang, Rendah */}
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                {priorityOptions.map((opt) => {
                  const isSelected = formData.priority === opt.key;
                  return (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({ ...prev, priority: opt.key }))
                      }
                      className={`px-3 py-2.5 sm:px-4 sm:py-3 rounded-xl border text-left transition-all flex items-center justify-between cursor-pointer shadow-2xs ${
                        isSelected
                          ? `${opt.borderActive} ${opt.bgActive} shadow-sm`
                          : "border-line bg-surface hover:border-slate-300 hover:bg-slate-50/50 text-ink"
                      }`}
                    >
                      <span className="flex items-center gap-2 text-xs font-bold truncate">
                        <span
                          className={`w-2.5 h-2.5 rounded-full ${opt.dotColor} shrink-0 ring-2 ring-white shadow-xs`}
                        />
                        <span>{opt.label}</span>
                      </span>
                      {isSelected ? (
                        <CheckCircle2 className={`w-4 h-4 ${opt.textColor} shrink-0`} />
                      ) : (
                        <span className="w-3.5 h-3.5 rounded-full border border-slate-300 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Judul & Deskripsi */}
            <div>
              <label className="block text-xs font-semibold text-ink mb-1.5">
                Judul Laporan Singkat <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, title: e.target.value }))
                }
                placeholder="Contoh: Luapan Kali Semanan Ketinggian 60 cm"
                className="w-full h-11 px-3.5 rounded-md border border-line bg-surface text-sm text-ink focus:border-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink mb-1.5">
                Deskripsi Lengkap Kondisi <span className="text-danger">*</span>
              </label>
              <textarea
                rows={4}
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, description: e.target.value }))
                }
                placeholder="Jelaskan ketinggian air / luasan api / material longsor, jumlah warga terdampak, dan kondisi akses jalan."
                className="w-full p-3.5 rounded-md border border-line bg-surface text-sm text-ink focus:border-primary focus:outline-none"
              />
            </div>

            {/* Unggah Foto Bukti */}
            <div>
              <label className="block text-xs font-semibold text-ink mb-1.5">
                Unggah Bukti Foto Lapangan (Opsional)
              </label>

              {!photoPreview ? (
                <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-line rounded-lg cursor-pointer bg-bg/50 hover:bg-bg transition-colors">
                  <UploadCloud className="w-8 h-8 text-ink-muted mb-2" />
                  <span className="text-xs font-semibold text-ink">
                    Klik untuk memilih foto dari galeri/kamera
                  </span>
                  <span className="text-[11px] text-ink-muted mt-1">
                    Format JPG, PNG, atau WEBP (Maksimal 10 MB)
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </label>
              ) : (
                <div className="relative rounded-lg overflow-hidden border border-line bg-bg p-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={photoPreview}
                      alt="Pratinjau Bukti"
                      className="w-16 h-16 object-cover rounded"
                    />
                    <div>
                      <span className="text-xs font-semibold text-ink block truncate max-w-[200px]">
                        {photoFileName || "Foto Terlampir"}
                      </span>
                      <span className="text-[11px] text-success font-medium">
                        Siap dilampirkan
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={removePhoto}
                    aria-label="Hapus Foto"
                    className="p-1.5 rounded-md text-ink-muted hover:text-danger hover:bg-danger-soft transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>

            {/* Kebutuhan Mendesak: pilihan cepat + input custom */}
            <div>
              <div className="flex items-baseline justify-between gap-2 mb-1">
                <label htmlFor="custom-need" className="block text-xs font-semibold text-ink">
                  Kebutuhan Mendesak Warga di Lokasi (Opsional)
                </label>
                <span className="text-[11px] text-ink-muted tabular-nums">
                  {formData.urgent_needs.length}/{MAX_URGENT_NEEDS}
                </span>
              </div>
              <p className="text-[11px] text-ink-muted mb-2.5">
                Pilih yang sesuai, atau tulis sendiri jika kebutuhan tidak ada di daftar.
              </p>

              {/* Pilihan cepat */}
              <div className="flex flex-wrap gap-2">
                {urgentOptions.map((opt) => {
                  const isChecked = formData.urgent_needs.includes(opt);
                  const isFull = !isChecked && formData.urgent_needs.length >= MAX_URGENT_NEEDS;
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => toggleUrgentNeed(opt)}
                      disabled={isFull}
                      aria-pressed={isChecked}
                      className={`min-h-[36px] px-3 py-1.5 rounded-full border text-xs font-medium inline-flex items-center gap-1.5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                        isChecked
                          ? "border-primary bg-primary-soft text-primary-hover font-semibold"
                          : "border-line bg-surface text-ink hover:border-line-strong"
                      }`}
                    >
                      {isChecked ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                      ) : (
                        <Plus className="w-3.5 h-3.5 text-ink-muted" />
                      )}
                      <span>{opt}</span>
                    </button>
                  );
                })}
              </div>

              {/* Input kebutuhan custom */}
              <div className="mt-3 flex gap-2">
                <input
                  id="custom-need"
                  type="text"
                  value={customNeed}
                  maxLength={MAX_CUSTOM_NEED_LENGTH}
                  onChange={(e) => {
                    setCustomNeed(e.target.value);
                    if (customNeedError) setCustomNeedError(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault(); // jangan submit form
                      addCustomNeed();
                    }
                  }}
                  placeholder="Contoh: Popok bayi, Obat asma, Genset"
                  className="flex-1 min-w-0 h-10 px-3.5 rounded-md border border-line bg-surface text-sm text-ink focus:border-primary focus:outline-none"
                />
                <button
                  type="button"
                  onClick={addCustomNeed}
                  disabled={!customNeed.trim() || formData.urgent_needs.length >= MAX_URGENT_NEEDS}
                  className="h-10 px-4 rounded-md bg-primary-hover hover:bg-primary-active text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah</span>
                </button>
              </div>
              {customNeedError && (
                <p className="text-[11px] text-danger mt-1.5" role="alert">
                  {customNeedError}
                </p>
              )}

              {/* Kebutuhan custom yang sudah ditambahkan */}
              {formData.urgent_needs.some((n) => !urgentOptions.includes(n)) && (
                <div className="mt-3">
                  <span className="text-[11px] font-semibold text-ink-muted block mb-1.5">
                    Kebutuhan tambahan:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {formData.urgent_needs
                      .filter((n) => !urgentOptions.includes(n))
                      .map((n) => (
                        <span
                          key={n}
                          className="min-h-[32px] pl-3 pr-1 py-1 rounded-full border border-primary bg-primary-soft text-primary-hover text-xs font-semibold inline-flex items-center gap-1"
                        >
                          <span className="break-all">{n}</span>
                          <button
                            type="button"
                            onClick={() => removeUrgentNeed(n)}
                            aria-label={`Hapus kebutuhan ${n}`}
                            className="p-1 rounded-full hover:bg-primary/15 transition-colors"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </span>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAHAP 3: PEMERIKSAAN & PENGIRIMAN LAPORAN                      */}
        {/* ============================================================== */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-ink">3. Pemeriksaan & Pengiriman Laporan</h2>
              <p className="text-xs text-ink-soft mt-1">
                Tinjau kembali ringkasan laporan sebelum mengirimkannya ke sistem posko terpadu.
              </p>
            </div>

            {/* Summary Review Card */}
            <div className="bg-bg border border-line rounded-lg p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-line pb-2.5">
                <span className="text-xs font-bold uppercase tracking-wider text-ink-muted flex items-center gap-1.5">
                  <FileCheck2 className="w-4 h-4 text-primary" />
                  <span>Ringkasan Laporan</span>
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2.5 py-0.5 rounded bg-primary-soft text-primary-hover font-bold capitalize">
                    {formData.disaster_type}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-0.5 rounded-full border shadow-2xs ${
                      formData.priority === "Tinggi"
                        ? "bg-orange-50 border-orange-300 text-orange-800"
                        : formData.priority === "Sedang"
                        ? "bg-blue-50 border-blue-300 text-blue-800"
                        : "bg-emerald-50 border-emerald-300 text-emerald-800"
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        formData.priority === "Tinggi"
                          ? "bg-orange-500"
                          : formData.priority === "Sedang"
                          ? "bg-blue-500"
                          : "bg-emerald-500"
                      }`}
                    />
                    <span>Prioritas {formData.priority}</span>
                  </span>
                </div>
              </div>

              <div>
                <span className="text-xs text-ink-muted block">Judul Kejadian:</span>
                <p className="text-sm font-bold text-ink">{formData.title}</p>
              </div>

              <div>
                <span className="text-xs text-ink-muted block">Lokasi & Wilayah:</span>
                <p className="text-xs font-medium text-ink">
                  {formData.address} ({formData.regency}, {formData.province})
                </p>
                <p className="text-[11px] font-mono text-ink-muted mt-0.5">
                  Koordinat: {formData.latitude.toFixed(6)}, {formData.longitude.toFixed(6)}
                </p>
              </div>

              <div>
                <span className="text-xs text-ink-muted block">Deskripsi Kondisi:</span>
                <p className="text-xs text-ink-soft leading-relaxed">{formData.description}</p>
              </div>

              {formData.urgent_needs.length > 0 && (
                <div>
                  <span className="text-xs text-ink-muted block mb-1">Kebutuhan Mendesak:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {formData.urgent_needs.map((n) => (
                      <span key={n} className="px-2 py-0.5 rounded bg-warning-soft text-warning-text text-[11px] font-semibold">
                        {n}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {photoPreview && (
                <div>
                  <span className="text-xs text-ink-muted block mb-1">Bukti Foto:</span>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photoPreview}
                    alt="Pratinjau Bukti"
                    className="w-20 h-20 object-cover rounded border border-line"
                  />
                </div>
              )}
            </div>

            {/* Reporter Contact Info (Optional) */}
            <div className="space-y-4 pt-2">
              <div className="p-3 bg-primary-soft/40 border border-primary/20 rounded-md text-xs text-ink-soft flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  <strong>Jaminan Perlindungan Data:</strong> Identitas pelapor dirahasiakan dan disamarkan di peta publik. Nomor telepon hanya digunakan oleh posko untuk verifikasi jika dibutuhkan.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1.5">
                    Nama Pelapor (Opsional)
                  </label>
                  <input
                    type="text"
                    value={formData.reporter_name}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, reporter_name: e.target.value }))
                    }
                    placeholder="Warga Peduli"
                    className="w-full h-11 px-3.5 rounded-md border border-line bg-surface text-sm text-ink focus:border-primary focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-ink mb-1.5">
                    Nomor WhatsApp / HP (Opsional)
                  </label>
                  <input
                    type="tel"
                    value={formData.reporter_phone}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, reporter_phone: e.target.value }))
                    }
                    placeholder="0812xxxxxxxx"
                    className="w-full h-11 px-3.5 rounded-md border border-line bg-surface text-sm text-ink focus:border-primary focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step Navigation Bottom Bar */}
        <div className="mt-8 pt-5 border-t border-line flex items-center justify-between gap-3">
          {step > 1 ? (
            <button
              type="button"
              onClick={handlePrev}
              className="h-11 px-4 rounded-md border border-line bg-surface hover:bg-bg text-ink text-xs font-semibold inline-flex items-center gap-1.5 transition-colors min-h-[44px]"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Sebelumnya</span>
            </button>
          ) : (
            <div />
          )}

          {step < 3 ? (
            <button
              type="button"
              onClick={handleNext}
              className="h-11 px-6 rounded-md bg-primary hover:bg-primary-hover text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors shadow-sm min-h-[44px]"
            >
              <span>Lanjutkan ke Tahap {step + 1}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="h-11 px-6 rounded-md bg-primary hover:bg-primary-hover text-white text-xs font-bold inline-flex items-center gap-2 transition-colors shadow-sm disabled:opacity-50 min-h-[44px]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Mengirim Laporan...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Kirim Laporan</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
      </div>
    </main>
  );
}

export default function LaporPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 p-12 text-center text-ink-muted">
          Memuat formulir pelaporan...
        </div>
      }
    >
      <LaporForm />
    </Suspense>
  );
}

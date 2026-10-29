"use client";

import React, { useState, Suspense } from "react";
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
  type LiveReportItem,
} from "@/lib/services/reports";
import type { DisasterType } from "@/types";

interface FormData {
  disaster_type: DisasterType;
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

  const [formData, setFormData] = useState<FormData>({
    disaster_type: initialType,
    title: "",
    description: "",
    address: "",
    province: "DKI Jakarta",
    regency: "Jakarta Barat",
    latitude: -6.2088,
    longitude: 106.8456,
    reporter_name: "",
    reporter_phone: "",
    urgent_needs: [],
  });

  const categories: { key: DisasterType; label: string; icon: React.ElementType; color: string }[] = [
    { key: "banjir", label: "Banjir", icon: Waves, color: "text-info" },
    { key: "gempa", label: "Gempa Bumi", icon: Activity, color: "text-warning" },
    { key: "kebakaran", label: "Kebakaran", icon: Flame, color: "text-danger" },
    { key: "longsor", label: "Tanah Longsor", icon: Mountain, color: "text-ink" },
    { key: "karhutla", label: "Karhutla", icon: Trees, color: "text-warning" },
    { key: "lainnya", label: "Lainnya", icon: AlertTriangle, color: "text-ink-muted" },
  ];

  const urgentOptions = [
    "Evakuasi Lansia & Bayi",
    "Perahu Karet / Pelampung",
    "Makanan & Air Bersih",
    "Pertolongan Medis Darurat",
    "Tenda Darurat / Terpal",
  ];

  const provinceOptions = [
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
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
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

  // Step navigation validation (Alur 3 Tahap)
  const handleNext = () => {
    setErrorMessage(null);
    if (step === 1 && !formData.address.trim()) {
      setErrorMessage("Silakan isi alamat, nama jalan, atau patokan lokasi kejadian.");
      return;
    }
    if (step === 2) {
      if (!formData.title.trim()) {
        setErrorMessage("Judul laporan singkat wajib diisi.");
        return;
      }
      if (!formData.description.trim()) {
        setErrorMessage("Deskripsi kondisi kejadian wajib diisi agar posko dapat menindaklanjuti.");
        return;
      }
    }
    setStep((prev) => prev + 1);
  };

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

    // 1. Selalu simpan di penyimpanan lokal perangkat (Zero-loss offline resilience)
    const localReportItem: LiveReportItem = {
      id: `rep-user-${Date.now()}`,
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
      priority: formData.urgent_needs.length > 0 ? "tinggi" : "normal",
      confirmation_count: 0,
      created_at: "Baru saja",
      is_demo: false,
      timeline: [
        {
          status: "diterima",
          label: "Laporan Diterima Sistem",
          timestamp: "Baru saja",
          note: "Laporan tercatat dalam antrean verifikasi posko penanggulangan bencana.",
        },
      ],
    };

    saveLocalReport(localReportItem);

    // 2. Coba simpan ke Supabase jika database/jaringan tersedia
    let isSavedRemote = false;
    try {
      const supabase = createClient();
      const { error } = await supabase.from("reports").insert({
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
        priority_score: formData.urgent_needs.length > 0 ? 25 : 10,
      });

      if (!error) {
        isSavedRemote = true;
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
    <main className="flex-1 w-full max-w-[800px] mx-auto px-4 md:px-8 py-6 md:py-10 pb-28 md:pb-12">
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
          <div className="mb-6 p-4 rounded-md bg-danger-soft border border-danger/20 text-xs font-semibold text-danger-text flex items-center gap-2">
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
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, province: e.target.value }))
                  }
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
                <input
                  type="text"
                  value={formData.regency}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, regency: e.target.value }))
                  }
                  placeholder="Contoh: Jakarta Barat / Kab. Bogor"
                  className="w-full h-11 px-3.5 rounded-md border border-line bg-surface text-sm text-ink focus:border-primary focus:outline-none"
                />
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
                      <Icon className={`w-7 h-7 mb-2 ${cat.color}`} />
                      <span className="text-xs">{cat.label}</span>
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

            {/* Kebutuhan Mendesak Checklist */}
            <div>
              <label className="block text-xs font-semibold text-ink mb-2">
                Kebutuhan Mendesak Warga di Lokasi:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {urgentOptions.map((opt) => {
                  const isChecked = formData.urgent_needs.includes(opt);
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => toggleUrgentNeed(opt)}
                      className={`min-h-[40px] px-3 py-2 rounded-md border text-xs font-medium text-left flex items-center justify-between transition-colors ${
                        isChecked
                          ? "border-primary bg-primary-soft text-primary-hover font-semibold"
                          : "border-line bg-surface text-ink hover:border-line-strong"
                      }`}
                    >
                      <span>{opt}</span>
                      {isChecked && <CheckCircle2 className="w-4 h-4 text-primary" />}
                    </button>
                  );
                })}
              </div>
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
                <span className="text-xs px-2 py-0.5 rounded bg-primary-soft text-primary-hover font-bold capitalize">
                  {formData.disaster_type}
                </span>
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
                  <span>Mengirim Laporan Resmi...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Kirim Laporan Resmi</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </main>
  );
}

export default function LaporPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 max-w-[800px] mx-auto p-12 text-center text-ink-muted">
          Memuat formulir pelaporan...
        </div>
      }
    >
      <LaporForm />
    </Suspense>
  );
}

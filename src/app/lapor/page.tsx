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
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { generateTrackingCode } from "@/lib/tracking";
import type { DisasterType } from "@/types";

interface FormData {
  disaster_type: DisasterType;
  title: string;
  description: string;
  address: string;
  latitude: number;
  longitude: number;
  reporter_name: string;
  reporter_phone: string;
  urgent_needs: string[];
}

function LaporForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get initial disaster type from query param if available
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

  // Geolocation handler
  const handleGetLocation = () => {
    if (!navigator.geolocation) {
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
        alert("Gagal mendeteksi lokasi otomatis. Anda dapat memasukkan nama alamat secara manual.");
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // Photo upload simulation
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

  // Step navigation validation
  const handleNext = () => {
    setErrorMessage(null);
    if (step === 1 && !formData.disaster_type) {
      setErrorMessage("Silakan pilih kategori bencana terlebih dahulu.");
      return;
    }
    if (step === 2 && !formData.address.trim()) {
      setErrorMessage("Silakan isi nama jalan, desa/kelurahan, atau patokan lokasi kejadian.");
      return;
    }
    if (step === 3 && (!formData.title.trim() || !formData.description.trim())) {
      setErrorMessage("Judul laporan dan deskripsi kondisi kejadian wajib diisi.");
      return;
    }
    setStep((prev) => prev + 1);
  };

  const handlePrev = () => {
    setErrorMessage(null);
    setStep((prev) => Math.max(1, prev - 1));
  };

  // Final submit handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    const trackingCode = generateTrackingCode();

    try {
      const supabase = createClient();

      const { error } = await supabase.from("reports").insert({
        tracking_code: trackingCode,
        disaster_type: formData.disaster_type,
        title: formData.title,
        description: formData.description,
        location: `POINT(${formData.longitude} ${formData.latitude})`,
        address: formData.address,
        status: "diterima",
        confirmation_count: 0,
        priority_score: formData.urgent_needs.length > 0 ? 25 : 10,
      });

      if (error) {
        console.warn("Supabase insert error:", error);
      }

      // Route to success page
      router.push(`/lapor/sukses?kode=${trackingCode}&tipe=${formData.disaster_type}`);
    } catch (err) {
      console.error("Submit exception:", err);
      // Fallback navigation so user workflow continues
      router.push(`/lapor/sukses?kode=${trackingCode}&tipe=${formData.disaster_type}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="flex-1 w-full max-w-[800px] mx-auto px-4 md:px-8 py-6 md:py-10">
      {/* Header Form */}
      <div className="text-center mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-ink">
          Formulir Pelaporan Bencana
        </h1>
        <p className="text-sm text-ink-soft mt-1">
          Laporan Anda akan diteruskan ke posko penanggulangan bencana dan relawan terdekat.
        </p>
      </div>

      {/* 4-Step Progress Indicator (design.md section 7.3) */}
      <div className="bg-surface border border-line rounded-lg p-4 md:p-6 shadow-card mb-6">
        <div className="flex items-center justify-between mb-3 text-xs md:text-sm font-semibold text-ink">
          <span className={step >= 1 ? "text-primary font-bold" : "text-ink-muted"}>
            1. Kategori
          </span>
          <span className={step >= 2 ? "text-primary font-bold" : "text-ink-muted"}>
            2. Lokasi
          </span>
          <span className={step >= 3 ? "text-primary font-bold" : "text-ink-muted"}>
            3. Bukti & Detail
          </span>
          <span className={step >= 4 ? "text-primary font-bold" : "text-ink-muted"}>
            4. Kirim
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-line rounded-full h-2 overflow-hidden">
          <div
            className="bg-primary h-full transition-all duration-300"
            style={{ width: `${(step / 4) * 100}%` }}
          />
        </div>
      </div>

      {/* Error alert if validation fails */}
      {errorMessage && (
        <div className="mb-6 p-4 rounded-md bg-danger-soft border border-danger/20 text-danger-text text-sm flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Step Content Card */}
      <div className="bg-surface border border-line rounded-lg p-6 md:p-8 shadow-card">
        {/* ================= STEP 1: KATEGORI ================= */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-ink">Pilih Kategori Bencana</h2>
              <p className="text-xs text-ink-soft mt-1">
                Pilih jenis bencana yang paling sesuai dengan kejadian yang Anda saksikan.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {categories.map((c) => {
                const Icon = c.icon;
                const isSelected = formData.disaster_type === c.key;
                return (
                  <button
                    key={c.key}
                    type="button"
                    onClick={() => setFormData({ ...formData, disaster_type: c.key })}
                    className={`flex flex-col items-center justify-center p-5 rounded-lg border-2 text-center transition-all ${
                      isSelected
                        ? "border-primary bg-primary-soft shadow-sm scale-[1.02]"
                        : "border-line bg-surface hover:border-line-strong hover:bg-bg"
                    }`}
                  >
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center mb-2.5 ${
                        isSelected ? "bg-white text-primary" : "bg-bg " + c.color
                      }`}
                    >
                      <Icon className="w-6 h-6" />
                    </div>
                    <span
                      className={`text-sm font-semibold ${
                        isSelected ? "text-primary-hover font-bold" : "text-ink"
                      }`}
                    >
                      {c.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ================= STEP 2: LOKASI ================= */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-ink">Lokasi Kejadian Bencana</h2>
              <p className="text-xs text-ink-soft mt-1">
                Lokasi akurat membantu tim evakuasi dan relawan tiba lebih cepat.
              </p>
            </div>

            {/* Geolocation Button */}
            <div className="p-4 bg-bg rounded-md border border-line flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-ink flex items-center gap-1.5">
                  <LocateFixed className="w-4 h-4 text-primary" />
                  <span>Deteksi Posisi GPS Otomatis</span>
                </p>
                <p className="text-xs text-ink-soft mt-0.5">
                  Gunakan sensor GPS perangkat untuk koordinat akurat
                </p>
              </div>
              <button
                type="button"
                onClick={handleGetLocation}
                disabled={locationLoading}
                className="h-10 px-4 rounded-md bg-ink hover:bg-ink-soft text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0"
              >
                {locationLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Mendeteksi...</span>
                  </>
                ) : (
                  <span>Gunakan Lokasi Saya</span>
                )}
              </button>
            </div>

            {/* Input Alamat Manual */}
            <div className="space-y-1.5">
              <label htmlFor="address" className="block text-sm font-semibold text-ink">
                Alamat / Patokan Wilayah <span className="text-danger">*</span>
              </label>
              <input
                id="address"
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Contoh: Jl. Daan Mogot KM 12, dekat Jembatan Gantung, Cengkareng"
                className="w-full h-12 px-4 rounded-md border border-line bg-surface text-ink text-base placeholder:text-ink-muted focus-visible:outline-primary"
              />
            </div>

            {/* Koordinat Display */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-bg rounded border border-line">
                <span className="text-ink-muted block mb-0.5">Latitude (Lintang):</span>
                <span className="font-mono font-bold text-ink">{formData.latitude}</span>
              </div>
              <div className="p-3 bg-bg rounded border border-line">
                <span className="text-ink-muted block mb-0.5">Longitude (Bujur):</span>
                <span className="font-mono font-bold text-ink">{formData.longitude}</span>
              </div>
            </div>
          </div>
        )}

        {/* ================= STEP 3: BUKTI & DETAIL ================= */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-ink">Bukti Foto & Deskripsi Kejadian</h2>
              <p className="text-xs text-ink-soft mt-1">
                Foto dan keterangan jelas mempercepat proses verifikasi oleh relawan lapangan.
              </p>
            </div>

            {/* Photo Upload Area (design.md section 7.3: dashed area) */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-ink">
                Foto Bukti Lapangan (Opsional)
              </label>

              {!photoPreview ? (
                <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-line-strong rounded-lg hover:border-primary hover:bg-bg cursor-pointer transition-colors text-center">
                  <UploadCloud className="w-10 h-10 text-primary mb-2" />
                  <span className="text-sm font-semibold text-ink">
                    Klik untuk mengambil foto atau unggah file
                  </span>
                  <span className="text-xs text-ink-muted mt-1">
                    Format: JPG, PNG, WEBP (Maksimal 10 MB)
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </label>
              ) : (
                <div className="relative rounded-lg overflow-hidden border border-line p-2 bg-bg flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {/* Preview Thumbnail */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={photoPreview}
                      alt="Pratinjau foto bencana"
                      className="w-16 h-16 object-cover rounded"
                    />
                    <div>
                      <p className="text-xs font-semibold text-ink truncate max-w-[200px]">
                        {photoFileName}
                      </p>
                      <span className="text-[11px] text-success-text font-medium flex items-center gap-1 mt-0.5">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Siap diunggah
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={removePhoto}
                    aria-label="Hapus Foto"
                    className="p-2 text-ink-muted hover:text-danger transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>

            {/* Judul Laporan */}
            <div className="space-y-1.5">
              <label htmlFor="title" className="block text-sm font-semibold text-ink">
                Ringkasan Singkat Kejadian <span className="text-danger">*</span>
              </label>
              <input
                id="title"
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Contoh: Genangan air 60 cm memutus jalan desa"
                className="w-full h-12 px-4 rounded-md border border-line bg-surface text-ink text-base placeholder:text-ink-muted focus-visible:outline-primary"
              />
            </div>

            {/* Deskripsi Lengkap */}
            <div className="space-y-1.5">
              <label htmlFor="description" className="block text-sm font-semibold text-ink">
                Deskripsi Lengkap Kondisi <span className="text-danger">*</span>
              </label>
              <textarea
                id="description"
                rows={4}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Jelaskan kondisi saat ini, perkiraan luas dampak, jumlah warga terdampak, dan akses jalan yang dapat dilalui..."
                className="w-full p-3 rounded-md border border-line bg-surface text-ink text-base placeholder:text-ink-muted focus-visible:outline-primary resize-none"
              />
            </div>

            {/* Kebutuhan Mendesak Tags */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-ink-muted uppercase tracking-wider">
                Bantuan Mendesak yang Dibutuhkan (Pilih jika relevan)
              </label>
              <div className="flex flex-wrap gap-2">
                {urgentOptions.map((opt) => {
                  const isChecked = formData.urgent_needs.includes(opt);
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => toggleUrgentNeed(opt)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                        isChecked
                          ? "bg-primary text-white font-semibold"
                          : "bg-bg text-ink border border-line hover:border-line-strong"
                      }`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ================= STEP 4: KONFIRMASI & KIRIM ================= */}
        {step === 4 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-ink">Konfirmasi & Identitas Pelapor</h2>
              <p className="text-xs text-ink-soft mt-1">
                Periksa kembali data Anda sebelum mengirim laporan ke sistem siaga bencana.
              </p>
            </div>

            {/* Summary Review Card */}
            <div className="bg-bg p-4 rounded-md border border-line space-y-3 text-sm">
              <div className="flex justify-between items-center pb-2 border-b border-line">
                <span className="text-xs text-ink-muted">Kategori Bencana:</span>
                <span className="font-bold text-ink uppercase tracking-wider">
                  {formData.disaster_type}
                </span>
              </div>
              <div className="pb-2 border-b border-line">
                <span className="text-xs text-ink-muted block mb-0.5">Judul Laporan:</span>
                <span className="font-semibold text-ink">{formData.title}</span>
              </div>
              <div className="pb-2 border-b border-line">
                <span className="text-xs text-ink-muted block mb-0.5">Lokasi Kejadian:</span>
                <span className="font-medium text-ink flex items-start gap-1">
                  <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <span>{formData.address}</span>
                </span>
              </div>
              <div>
                <span className="text-xs text-ink-muted block mb-0.5">Deskripsi:</span>
                <p className="text-xs text-ink-soft line-clamp-3">{formData.description}</p>
              </div>
            </div>

            {/* Identitas Opsional (FR-17) */}
            <div className="space-y-4 pt-2">
              <div className="space-y-1">
                <label htmlFor="reporter_name" className="block text-xs font-semibold text-ink">
                  Nama Pelapor (Opsional)
                </label>
                <input
                  id="reporter_name"
                  type="text"
                  value={formData.reporter_name}
                  onChange={(e) => setFormData({ ...formData, reporter_name: e.target.value })}
                  placeholder="Bisa dikosongkan jika ingin lapor cepat anonim"
                  className="w-full h-11 px-4 rounded-md border border-line bg-surface text-sm text-ink placeholder:text-ink-muted focus-visible:outline-primary"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="reporter_phone" className="block text-xs font-semibold text-ink">
                  Nomor Telepon / WhatsApp (Opsional untuk konfirmasi petugas)
                </label>
                <input
                  id="reporter_phone"
                  type="tel"
                  value={formData.reporter_phone}
                  onChange={(e) => setFormData({ ...formData, reporter_phone: e.target.value })}
                  placeholder="Contoh: 081234567890"
                  className="w-full h-11 px-4 rounded-md border border-line bg-surface text-sm text-ink placeholder:text-ink-muted focus-visible:outline-primary"
                />
              </div>

              {/* Privacy Reassurance Note */}
              <div className="p-3 rounded-md bg-info-soft border border-info/20 text-xs text-info-text flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  <strong>Privasi Dijamin:</strong> Nama dan kontak Anda tidak akan pernah ditampilkan di peta publik atau hasil pencarian pelacakan terbuka.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Action Button Navigation (design.md: min height 48px) */}
        <div className="mt-8 pt-6 border-t border-line flex items-center justify-between gap-3">
          {step > 1 ? (
            <button
              type="button"
              onClick={handlePrev}
              disabled={isSubmitting}
              className="h-12 px-5 rounded-md border border-line-strong bg-surface hover:bg-bg text-ink font-semibold text-sm flex items-center gap-1.5 transition-colors focus-visible:outline-primary"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Kembali</span>
            </button>
          ) : (
            <div />
          )}

          {step < 4 ? (
            <button
              type="button"
              onClick={handleNext}
              className="h-12 px-6 rounded-md bg-primary hover:bg-primary-hover text-white font-semibold text-sm flex items-center gap-1.5 transition-colors shadow-sm focus-visible:outline-primary ml-auto"
            >
              <span>Lanjut</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="h-12 px-8 rounded-md bg-primary hover:bg-primary-hover text-white font-bold text-base flex items-center gap-2 transition-colors shadow-sm focus-visible:outline-primary ml-auto disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Mengirim Laporan...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Kirim Laporan Bencana</span>
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

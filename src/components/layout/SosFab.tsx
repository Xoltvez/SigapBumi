"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { usePathname } from "next/navigation";
import {
  Flame,
  HeartPulse,
  Shield,
  LifeBuoy,
  Phone,
  AlertCircle,
  X,
  CheckCircle2,
  AlertTriangle,
  MapPin,
  RefreshCw,
} from "lucide-react";
import type { SosAssistanceType } from "@/types";
import {
  sendSosAlert,
  updateSosPhone,
  updateSosAssistanceType,
  updateSosLocation,
} from "@/lib/services/sos";

export function SosFab() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isSent, setIsSent] = useState(false);
  const [selectedAssistance, setSelectedAssistance] =
    useState<SosAssistanceType | null>(null);
  const [activeSosId, setActiveSosId] = useState<string | null>(null);
  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const [isPhoneSaved, setIsPhoneSaved] = useState<boolean>(false);
  
  // Posisi default & status pelacakan GPS
  const [currentCoords, setCurrentCoords] = useState<{ lat: number; lng: number }>({
    lat: -6.2088,
    lng: 106.8456,
  });
  const [gpsStatus, setGpsStatus] = useState<"idle" | "acquiring" | "locked" | "error">("idle");
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);
  const [isLocationRefined, setIsLocationRefined] = useState<boolean>(false);

  const watchIdRef = useRef<number | null>(null);
  const activeSosIdRef = useRef<string | null>(null);
  const hasTriggeredRef = useRef<boolean>(false);

  // Stop GPS watch helper
  const stopGpsTracking = useCallback(() => {
    if (watchIdRef.current !== null && typeof window !== "undefined" && "geolocation" in navigator) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  }, []);

  // Handler pelacakan GPS akurat (high accuracy tanpa cache usang)
  const startGpsTracking = useCallback(() => {
    if (typeof window === "undefined" || !("geolocation" in navigator)) {
      setGpsStatus("error");
      return;
    }

    setGpsStatus("acquiring");

    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    const onLocationSuccess = (pos: GeolocationPosition) => {
      const { latitude, longitude, accuracy } = pos.coords;
      setCurrentCoords({ lat: latitude, lng: longitude });
      setGpsAccuracy(accuracy);
      setGpsStatus("locked");

      // Simpan koordinat akurat ke local storage agar siap saat offline/refresh
      try {
        localStorage.setItem(
          "sigapbumi_user_last_coords",
          JSON.stringify({ lat: latitude, lng: longitude, accuracy })
        );
      } catch {}

      // Jika SOS sudah terkirim (aktif), otomatis perbarui koordinat di Supabase dan posko admin!
      if (activeSosIdRef.current) {
        updateSosLocation(activeSosIdRef.current, latitude, longitude, accuracy);
        setIsLocationRefined(true);
      }
    };

    const onLocationError = (err: GeolocationPositionError) => {
      console.warn("GPS tracking warning:", err.message);
      setGpsStatus((prev) => (prev === "locked" ? prev : "error"));
    };

    // 1. Ambil posisi saat ini secara instan dengan fresh data
    navigator.geolocation.getCurrentPosition(onLocationSuccess, onLocationError, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    });

    // 2. Pasang watchPosition untuk terus menyempurnakan akurasi selama jendela SOS terbuka
    try {
      watchIdRef.current = navigator.geolocation.watchPosition(
        onLocationSuccess,
        onLocationError,
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0,
        }
      );
    } catch {}
  }, []);

  // Inisialisasi: pulihkan nomor HP, koordinat riil terakhir, dan pre-warm GPS
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedPhone = localStorage.getItem("sigapbumi_user_phone");
      if (savedPhone) setPhoneNumber(savedPhone);

      const savedCoords = localStorage.getItem("sigapbumi_user_last_coords");
      if (savedCoords) {
        try {
          const parsed = JSON.parse(savedCoords);
          if (parsed && typeof parsed.lat === "number" && typeof parsed.lng === "number") {
            setCurrentCoords({ lat: parsed.lat, lng: parsed.lng });
            if (parsed.accuracy) setGpsAccuracy(parsed.accuracy);
            setGpsStatus("locked");
          }
        } catch {}
      }

      // Pre-warm GPS di latar belakang jika browser sudah pernah diberi izin lokasi
      if ("geolocation" in navigator && "permissions" in navigator) {
        navigator.permissions
          .query({ name: "geolocation" as PermissionName })
          .then((result) => {
            if (result.state === "granted") {
              navigator.geolocation.getCurrentPosition(
                (pos) => {
                  setCurrentCoords({
                    lat: pos.coords.latitude,
                    lng: pos.coords.longitude,
                  });
                  setGpsAccuracy(pos.coords.accuracy);
                  setGpsStatus("locked");
                  try {
                    localStorage.setItem(
                      "sigapbumi_user_last_coords",
                      JSON.stringify({
                        lat: pos.coords.latitude,
                        lng: pos.coords.longitude,
                        accuracy: pos.coords.accuracy,
                      })
                    );
                  } catch {}
                },
                () => {},
                { enableHighAccuracy: true, timeout: 8000, maximumAge: 30000 }
              );
            }
          })
          .catch(() => {});
      }
    }
  }, []);

  // Cleanup watch saat unmount
  useEffect(() => {
    return () => {
      stopGpsTracking();
    };
  }, [stopGpsTracking]);

  // Countdown timer decrement
  useEffect(() => {
    if (pathname.startsWith("/admin")) return;
    if (countdown === null) return;

    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown((c) => (c !== null ? c - 1 : null));
      }, 1000);
      return () => clearTimeout(timer);
    }

    // Trigger kirim SOS tepat SATU KALI saat countdown mencapai 0
    if (countdown === 0 && !hasTriggeredRef.current) {
      hasTriggeredRef.current = true;
      setIsSent(true);

      const savedPhone =
        typeof window !== "undefined"
          ? localStorage.getItem("sigapbumi_user_phone") || undefined
          : undefined;
      const phoneToSend = phoneNumber.trim() || savedPhone;

      sendSosAlert({
        lat: currentCoords.lat,
        lng: currentCoords.lng,
        assistanceType: selectedAssistance || "damkar",
        note: `Panggilan Darurat SOS Warga (Realtime)${
          gpsAccuracy ? ` [Akurasi GPS: ±${Math.round(gpsAccuracy)}m]` : ""
        }`,
        phoneNumber: phoneToSend,
      }).then((res) => {
        if (res.id) {
          setActiveSosId(res.id);
          activeSosIdRef.current = res.id;

          // Jika saat mengirim posisi GPS akurat sudah siap, perbarui segera
          if (gpsStatus === "locked") {
            updateSosLocation(res.id, currentCoords.lat, currentCoords.lng, gpsAccuracy || undefined);
          }
        }
      });
    }
  }, [countdown, pathname, currentCoords, selectedAssistance, phoneNumber, gpsAccuracy, gpsStatus]);

  const handleStartSos = useCallback(() => {
    hasTriggeredRef.current = false;
    setActiveSosId(null);
    activeSosIdRef.current = null;
    setIsLocationRefined(false);
    setIsOpen(true);
    setCountdown(3);
    setIsSent(false);
    setSelectedAssistance(null);
    setIsPhoneSaved(false);
    startGpsTracking();
  }, [startGpsTracking]);

  // Listen to open-sos event triggered by Header SOS button or other emergency CTAs
  useEffect(() => {
    const handleCustomSos = () => {
      handleStartSos();
    };
    if (typeof window !== "undefined") {
      window.addEventListener("sigapbumi:open-sos", handleCustomSos);
    }
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("sigapbumi:open-sos", handleCustomSos);
      }
    };
  }, [handleStartSos]);

  // Mengubah tipe bantuan: HANYA memperbarui SOS yang sudah ada (tidak membuat duplikasi baru)
  const handleSelectAssistance = (type: SosAssistanceType) => {
    setSelectedAssistance(type);
    if (activeSosId) {
      updateSosAssistanceType(activeSosId, type);
    }
  };

  // Menyimpan nomor HP: HANYA memperbarui catatan kontak pada SOS yang sedang aktif
  const handleSavePhone = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanPhone = phoneNumber.trim();
    if (!cleanPhone) return;

    if (typeof window !== "undefined") {
      localStorage.setItem("sigapbumi_user_phone", cleanPhone);
    }
    if (activeSosId) {
      await updateSosPhone(activeSosId, cleanPhone);
    }
    setIsPhoneSaved(true);
  };

  const handleCancel = () => {
    stopGpsTracking();
    hasTriggeredRef.current = false;
    setCountdown(null);
    setIsOpen(false);
    setIsSent(false);
    setActiveSosId(null);
    activeSosIdRef.current = null;
    setIsLocationRefined(false);
  };

  if (pathname.startsWith("/admin")) {
    return null;
  }

  return (
    <>
      {/* Tombol Mengambang (FAB) SOS di Pojok Kanan Bawah */}
      {!isOpen && (
        <button
          type="button"
          onClick={handleStartSos}
          aria-label="Panggilan Darurat SOS"
          className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-40 w-12 h-12 md:w-13 md:h-13 rounded-full bg-danger text-white font-black text-sm tracking-wider flex items-center justify-center shadow-lg border-2 border-white hover:bg-danger/90 hover:scale-105 active:scale-95 transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-danger"
        >
          SOS
        </button>
      )}

      {/* SOS Modal Overlay */}
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="sos-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/75 p-4 backdrop-blur-sm"
        >
          <div className="w-full max-w-md max-h-[88vh] overflow-y-auto bg-surface rounded-2xl p-5 sm:p-6 shadow-overlay text-center relative border border-line">
            {!isSent ? (
              // Countdown State
              <div>
                <div className="flex justify-center mb-4">
                  <div className="w-16 h-16 rounded-full bg-danger-soft flex items-center justify-center text-danger">
                    <AlertCircle className="w-8 h-8" />
                  </div>
                </div>

                <div className="inline-block px-2.5 py-0.5 rounded-full bg-warning-soft text-warning-text text-[11px] font-bold mb-2">
                  Mode Simulasi Posko Terpadu
                </div>

                <h2
                  id="sos-title"
                  className="text-xl md:text-2xl font-bold text-ink mb-2"
                >
                  Mengirim Sinyal Darurat SOS
                </h2>
                <p className="text-ink-soft text-xs mb-3 leading-relaxed">
                  Lokasi koordinat darurat Anda akan dicatat di monitor operasional posko dalam:
                </p>

                {/* Countdown display */}
                <div
                  aria-live="assertive"
                  className="w-24 h-24 mx-auto mb-3 rounded-full border-4 border-danger flex items-center justify-center shadow-inner"
                >
                  <span className="text-4xl font-extrabold text-danger tabular-nums">
                    {countdown}
                  </span>
                </div>

                {/* Indikator Status GPS saat countdown */}
                <div className="mb-5 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium border border-line bg-bg">
                  {gpsStatus === "locked" ? (
                    <>
                      <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
                      <span className="text-ink font-semibold">GPS Terkunci</span>
                      <span className="text-ink-muted">
                        ({currentCoords.lat.toFixed(4)}, {currentCoords.lng.toFixed(4)}
                        {gpsAccuracy ? ` ±${Math.round(gpsAccuracy)}m` : ""})
                      </span>
                    </>
                  ) : gpsStatus === "acquiring" ? (
                    <>
                      <RefreshCw className="w-3 h-3 text-warning animate-spin shrink-0" />
                      <span className="text-ink-soft">Mengunci GPS riil rumah...</span>
                    </>
                  ) : (
                    <>
                      <MapPin className="w-3 h-3 text-warning shrink-0" />
                      <span className="text-ink-soft">
                        Koordinat ({currentCoords.lat.toFixed(4)}, {currentCoords.lng.toFixed(4)})
                      </span>
                    </>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleCancel}
                  className="w-full h-12 rounded-md bg-ink text-white font-semibold text-base transition-colors hover:bg-ink-soft"
                >
                  Batalkan
                </button>
              </div>
            ) : (
              // Sent & Assistance Choice State
              <div>
                <button
                  type="button"
                  onClick={handleCancel}
                  aria-label="Tutup"
                  className="absolute top-4 right-4 text-ink-muted hover:text-ink"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="flex justify-center mb-3">
                  <div className="w-14 h-14 rounded-full bg-success-soft flex items-center justify-center text-success">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                </div>

                <div className="inline-block px-2.5 py-0.5 rounded-full bg-primary-soft text-primary-hover text-[11px] font-bold mb-1">
                  Tercatat di Monitor Posko
                </div>

                <h2
                  id="sos-title"
                  className="text-xl font-bold text-ink mb-1"
                >
                  Sinyal SOS Tersimpan di Sistem
                </h2>
                <p className="text-ink-soft text-xs mb-3">
                  Koordinat posisi darurat Anda telah masuk ke daftar radar posko. Pilih jenis bantuan jika memungkinkan:
                </p>

                {/* Status Koordinat GPS Terkirim */}
                <div className="p-3 mb-3 rounded-lg bg-bg border border-line text-left flex items-center justify-between gap-2">
                  <div className="flex items-start gap-2 min-w-0">
                    <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[11px] font-bold text-ink">Titik Koordinat:</span>
                        {isLocationRefined ? (
                          <span className="text-[9px] font-bold text-success bg-success-soft px-1.5 py-0.5 rounded">
                            Disempurnakan Otomatis
                          </span>
                        ) : gpsStatus === "locked" ? (
                          <span className="text-[9px] font-bold text-success bg-success-soft px-1.5 py-0.5 rounded">
                            Akurat (GPS)
                          </span>
                        ) : null}
                      </div>
                      <p className="text-[11px] font-mono text-ink-soft truncate">
                        {currentCoords.lat.toFixed(5)}, {currentCoords.lng.toFixed(5)}
                        {gpsAccuracy ? ` (±${Math.round(gpsAccuracy)}m)` : ""}
                      </p>
                      {gpsStatus === "acquiring" && (
                        <p className="text-[10px] text-warning flex items-center gap-1 mt-0.5">
                          <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                          Menyempurnakan ke titik satelit terdekat...
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => startGpsTracking()}
                    title="Perbarui koordinat GPS sekarang"
                    className="p-1.5 px-2 rounded-md border border-line bg-surface hover:bg-line text-ink text-xs flex items-center gap-1 shrink-0 transition-colors"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${gpsStatus === "acquiring" ? "animate-spin text-primary" : "text-ink-soft"}`} />
                    <span className="text-[10px] font-semibold">Perbarui</span>
                  </button>
                </div>

                {/* Dispatch Disclaimer Notice */}
                <div className="p-3 mb-4 rounded-md bg-warning-soft border border-warning/30 text-left text-[11px] text-warning-text flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-warning" />
                  <p className="leading-relaxed">
                    <strong>Penting:</strong> Platform ini adalah sistem pelaporan prototipe WIA 2026 dan belum terhubung ke sistem dispatch darurat nasional. Untuk ancaman keselamatan jiwa, segera hubungi <strong>112</strong>.
                  </p>
                </div>

                {/* Tipe Bantuan SOS */}
                <div className="grid grid-cols-2 gap-2.5 mb-5 text-left">
                  <button
                    type="button"
                    onClick={() => handleSelectAssistance("damkar")}
                    className={`min-h-[48px] p-3 rounded-md border text-xs font-semibold flex items-center gap-2 transition-colors ${
                      selectedAssistance === "damkar"
                        ? "border-primary bg-primary-soft text-primary-hover ring-1 ring-primary"
                        : "border-line bg-surface text-ink hover:border-line-strong"
                    }`}
                  >
                    <Flame className="w-4 h-4 text-danger shrink-0" />
                    <span>Damkar</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelectAssistance("medis")}
                    className={`min-h-[48px] p-3 rounded-md border text-xs font-semibold flex items-center gap-2 transition-colors ${
                      selectedAssistance === "medis"
                        ? "border-primary bg-primary-soft text-primary-hover ring-1 ring-primary"
                        : "border-line bg-surface text-ink hover:border-line-strong"
                    }`}
                  >
                    <HeartPulse className="w-4 h-4 text-danger shrink-0" />
                    <span>Medis / RS</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelectAssistance("polisi")}
                    className={`min-h-[48px] p-3 rounded-md border text-xs font-semibold flex items-center gap-2 transition-colors ${
                      selectedAssistance === "polisi"
                        ? "border-primary bg-primary-soft text-primary-hover ring-1 ring-primary"
                        : "border-line bg-surface text-ink hover:border-line-strong"
                    }`}
                  >
                    <Shield className="w-4 h-4 text-info shrink-0" />
                    <span>Polisi</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelectAssistance("bnpb_bpbd")}
                    className={`min-h-[48px] p-3 rounded-md border text-xs font-semibold flex items-center gap-2 transition-colors ${
                      selectedAssistance === "bnpb_bpbd"
                        ? "border-primary bg-primary-soft text-primary-hover ring-1 ring-primary"
                        : "border-line bg-surface text-ink hover:border-line-strong"
                    }`}
                  >
                    <LifeBuoy className="w-4 h-4 text-primary shrink-0" />
                    <span>BNPB / BPBD</span>
                  </button>
                </div>

                {/* Input Nomor HP / WhatsApp untuk Verifikasi Posko */}
                <div className="mb-4 p-3 rounded-lg bg-bg border border-line text-left">
                  <div className="flex items-center justify-between mb-1">
                    <label htmlFor="sos-phone-input" className="text-[11px] font-bold text-ink flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-primary" />
                      <span>No. HP / WhatsApp Anda (Opsional)</span>
                    </label>
                    {isPhoneSaved && (
                      <span className="text-[10px] font-bold text-success flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        Tersimpan di Posko
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-ink-muted mb-2 leading-tight">
                    Petugas posko akan melakukan verifikasi via telepon/WA sebelum armada meluncur ke titik Anda.
                  </p>
                  <form onSubmit={handleSavePhone} className="flex gap-2">
                    <input
                      id="sos-phone-input"
                      type="tel"
                      placeholder="Contoh: 081234567890"
                      value={phoneNumber}
                      onChange={(e) => {
                        setPhoneNumber(e.target.value);
                        setIsPhoneSaved(false);
                      }}
                      className="flex-1 px-3 py-1.5 text-xs rounded-md border border-line bg-surface text-ink placeholder:text-ink-muted focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                    <button
                      type="submit"
                      className="px-3 py-1.5 rounded-md bg-ink text-white text-xs font-semibold hover:bg-ink-soft transition-colors shrink-0"
                    >
                      {isPhoneSaved ? "Tersimpan" : "Kirim No. HP"}
                    </button>
                  </form>
                </div>

                {/* Direct Emergency Calls */}
                <div className="border-t border-line pt-3 text-left">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-ink-muted mb-2">
                    Hubungi Panggilan Darurat Resmi Langsung:
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    <a
                      href="tel:112"
                      className="min-h-[44px] flex items-center justify-center gap-1.5 px-2 rounded-md bg-danger text-white text-xs font-bold hover:bg-danger/90 transition-colors shadow-sm"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      112
                    </a>
                    <a
                      href="tel:115"
                      className="min-h-[44px] flex items-center justify-center gap-1.5 px-2 rounded-md bg-surface border border-line text-xs font-bold text-ink hover:bg-bg transition-colors"
                    >
                      <Phone className="w-3.5 h-3.5 text-primary" />
                      115 SAR
                    </a>
                    <a
                      href="tel:113"
                      className="min-h-[44px] flex items-center justify-center gap-1.5 px-2 rounded-md bg-surface border border-line text-xs font-bold text-ink hover:bg-bg transition-colors"
                    >
                      <Phone className="w-3.5 h-3.5 text-danger" />
                      113 Damkar
                    </a>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleCancel}
                  className="w-full mt-4 h-11 rounded-md bg-ink text-white font-semibold text-xs transition-colors hover:bg-ink-soft"
                >
                  Tutup Dialog
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

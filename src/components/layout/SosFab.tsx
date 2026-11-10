"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
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
  Copy,
  Check,
  ExternalLink,
  Radio,
  Clock,
  Navigation,
  ArrowRight,
  Camera,
  UploadCloud,
  ShieldAlert,
  Smartphone,
  Eye,
} from "lucide-react";
import type { SosAssistanceType } from "@/types";
import {
  sendSosAlert,
  updateSosPhone,
  updateSosAssistanceType,
  updateSosLocation,
} from "@/lib/services/sos";
import { supabase } from "@/lib/supabase/client";
import {
  stampPhotoWithGpsTimestamp,
  getReverseGeocode,
  type ReverseGeocodeResult,
} from "@/lib/cameraStamp";

export function SosFab() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isSent, setIsSent] = useState(false);
  const [trackingCode, setTrackingCode] = useState<string | null>(null);
  const [activeSosId, setActiveSosId] = useState<string | null>(null);
  const [sosStatus, setSosStatus] = useState<"aktif" | "ditangani" | "selesai">("aktif");
  const [dispatchedTeam, setDispatchedTeam] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isTrackingOpen, setIsTrackingOpen] = useState(false);

  const [selectedAssistance, setSelectedAssistance] =
    useState<SosAssistanceType | null>("damkar");
  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const [isPhoneSaved, setIsPhoneSaved] = useState<boolean>(false);
  const [phoneError, setPhoneError] = useState<string>("");

  // Foto kamera riil berstempel GPS & Waktu
  const [cameraPhotoUrl, setCameraPhotoUrl] = useState<string | null>(null);
  const [isProcessingPhoto, setIsProcessingPhoto] = useState<boolean>(false);
  const [isPhotoFullscreen, setIsPhotoFullscreen] = useState<boolean>(false);
  const [photoError, setPhotoError] = useState<string>("");
  const cameraInputRef = useRef<HTMLInputElement | null>(null);

  // Posisi default & status pelacakan GPS, Kompas, Ketinggian & Alamat
  const [currentCoords, setCurrentCoords] = useState<{ lat: number; lng: number }>({
    lat: -6.2088,
    lng: 106.8456,
  });
  const [gpsStatus, setGpsStatus] = useState<"idle" | "acquiring" | "locked" | "error">("idle");
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);
  const [gpsAltitude, setGpsAltitude] = useState<number | null>(null);
  const [gpsSpeed, setGpsSpeed] = useState<number | null>(null);
  const [compassHeading, setCompassHeading] = useState<number>(286);
  const [resolvedAddress, setResolvedAddress] = useState<ReverseGeocodeResult | null>(null);
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
      const { latitude, longitude, accuracy, altitude, speed, heading } = pos.coords;
      setCurrentCoords({ lat: latitude, lng: longitude });
      setGpsAccuracy(accuracy);
      if (altitude !== null) setGpsAltitude(altitude);
      if (speed !== null) setGpsSpeed(speed);
      if (heading !== null && !isNaN(heading)) setCompassHeading(Math.round(heading));
      setGpsStatus("locked");

      try {
        localStorage.setItem(
          "sigapbumi_user_last_coords",
          JSON.stringify({ lat: latitude, lng: longitude, accuracy })
        );
      } catch {}

      // Jika SOS sudah aktif, otomatis perbarui koordinat di Supabase dan radar posko
      if (activeSosIdRef.current) {
        updateSosLocation(activeSosIdRef.current, latitude, longitude, accuracy);
        setIsLocationRefined(true);
      }
    };

    const onLocationError = (err: GeolocationPositionError) => {
      console.warn("GPS tracking warning:", err.message);
      setGpsStatus((prev) => (prev === "locked" ? prev : "error"));
    };

    navigator.geolocation.getCurrentPosition(onLocationSuccess, onLocationError, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    });

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

  // Inisialisasi: pulihkan nomor HP, koordinat riil terakhir, dan sesi pelacakan SOS aktif jika ada
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedPhone = localStorage.getItem("sigapbumi_user_phone");
      if (savedPhone) {
        setPhoneNumber(savedPhone);
      } else {
        try {
          const userRaw = localStorage.getItem("sigapbumi_current_user");
          if (userRaw) {
            const u = JSON.parse(userRaw);
            if (u?.phone_number) setPhoneNumber(u.phone_number);
          }
        } catch {}
      }

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

      // Pulihkan status SOS aktif dalam 3 jam terakhir
      try {
        const savedSession = localStorage.getItem("sigapbumi_active_sos_tracking");
        if (savedSession) {
          const parsed = JSON.parse(savedSession);
          if (parsed && parsed.code && parsed.time && Date.now() - parsed.time < 3 * 3600 * 1000) {
            setTrackingCode(parsed.code);
            setActiveSosId(parsed.id);
            activeSosIdRef.current = parsed.id;
            if (parsed.assistance) setSelectedAssistance(parsed.assistance);
            if (parsed.phone) setPhoneNumber(parsed.phone);
            if (parsed.photo) setCameraPhotoUrl(parsed.photo);
            setIsSent(true);
            setIsMinimized(true);
          }
        }
      } catch {}

      // Pre-warm GPS
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

  const lastGeocodedCoordRef = useRef<{ lat: number; lng: number } | null>(null);
  const resolvedAddressRef = useRef<ReverseGeocodeResult | null>(null);

  useEffect(() => {
    if (resolvedAddress) {
      resolvedAddressRef.current = resolvedAddress;
    }
  }, [resolvedAddress]);

  // Reverse Geocoding otomatis saat koordinat GPS terkunci (debounced & guarded)
  useEffect(() => {
    if (!currentCoords.lat || !currentCoords.lng) return;

    if (lastGeocodedCoordRef.current) {
      const dLat = Math.abs(lastGeocodedCoordRef.current.lat - currentCoords.lat);
      const dLng = Math.abs(lastGeocodedCoordRef.current.lng - currentCoords.lng);
      // Jika pergerakan kurang dari ~25m dan sudah ada alamat valid, tidak perlu spam fetch ulang
      if (dLat < 0.00025 && dLng < 0.00025 && resolvedAddress) {
        return;
      }
    }

    const timer = setTimeout(() => {
      lastGeocodedCoordRef.current = { lat: currentCoords.lat, lng: currentCoords.lng };
      getReverseGeocode(currentCoords.lat, currentCoords.lng)
        .then((res) => {
          if (res) {
            setResolvedAddress(res);
            resolvedAddressRef.current = res;
          }
        })
        .catch(() => {});
    }, 300);

    return () => clearTimeout(timer);
  }, [currentCoords.lat, currentCoords.lng, resolvedAddress]);

  // Pantau sensor kompas / orientasi perangkat warga
  useEffect(() => {
    if (!isOpen) return;

    const handleOrientation = (e: DeviceOrientationEvent) => {
      // @ts-expect-error webkitCompassHeading exists on iOS Safari
      const heading = e.webkitCompassHeading !== undefined ? e.webkitCompassHeading : (e.alpha !== null ? 360 - e.alpha : null);
      if (heading !== null && !isNaN(heading)) {
        setCompassHeading(Math.round(heading));
      }
    };

    if (typeof window !== "undefined" && "DeviceOrientationEvent" in window) {
      window.addEventListener("deviceorientation", handleOrientation, true);
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("deviceorientation", handleOrientation, true);
      }
    };
  }, [isOpen]);

  // Dukungan tombol Escape untuk menutup foto layar penuh
  useEffect(() => {
    if (!isPhotoFullscreen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsPhotoFullscreen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isPhotoFullscreen]);

  // Cleanup watch saat unmount
  useEffect(() => {
    return () => {
      stopGpsTracking();
    };
  }, [stopGpsTracking]);

  // Dengarkan pembaruan real-time dari posko untuk sinyal SOS aktif
  useEffect(() => {
    if (!activeSosId) return;

    const channel = supabase
      .channel(`sos_live_citizen_${activeSosId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "sos_alerts" },
        (payload) => {
          if (payload.new?.id === activeSosId) {
            if (payload.new.status) setSosStatus(payload.new.status);
            if (payload.new.acknowledged_by) setDispatchedTeam(payload.new.acknowledged_by);
          }
        }
      )
      .subscribe();

    const handleLocalUpdate = () => {
      try {
        const raw = localStorage.getItem("sigapbumi_sos_alerts_cache");
        if (raw) {
          const list = JSON.parse(raw);
          const found = list.find((x: { id: string; status?: "aktif" | "ditangani" | "selesai"; dispatched_team?: string }) => x.id === activeSosId);
          if (found) {
            if (found.status) setSosStatus(found.status);
            if (found.dispatched_team) setDispatchedTeam(found.dispatched_team);
          }
        }
      } catch {}
    };

    if (typeof window !== "undefined") {
      window.addEventListener("sigapbumi:sos-updated", handleLocalUpdate);
      window.addEventListener("storage", handleLocalUpdate);
    }

    return () => {
      supabase.removeChannel(channel);
      if (typeof window !== "undefined") {
        window.removeEventListener("sigapbumi:sos-updated", handleLocalUpdate);
        window.removeEventListener("storage", handleLocalUpdate);
      }
    };
  }, [activeSosId]);

  // Hitung mundur timer (delay 3 detik). Saat mencapai 0, langsung kirim SOS & tampilkan pop-up pelacakan
  useEffect(() => {
    if (pathname.startsWith("/admin")) return;
    if (countdown === null) return;

    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown((c) => (c !== null ? c - 1 : null));
      }, 1000);
      return () => clearTimeout(timer);
    }

    // Trigger kirim SOS tepat saat countdown mencapai 0 (setelah delay 3 detik)
    if (countdown === 0 && !hasTriggeredRef.current) {
      hasTriggeredRef.current = true;
      setCountdown(null); // Segera reset timer agar tidak pernah membeku di angka 0 dan tidak memicu pengiriman ganda

      const savedPhone =
        typeof window !== "undefined"
          ? localStorage.getItem("sigapbumi_user_phone") || undefined
          : undefined;
      const phoneToSend = phoneNumber.trim() || savedPhone;

      // Proteksi ketat: HANYA kirim jika benar-benar ada bukti foto dan nomor telepon valid
      if (!phoneToSend || !cameraPhotoUrl) {
        setIsSent(false);
        setIsOpen(true);
        if (!phoneToSend) setPhoneError("Nomor telepon/WhatsApp wajib diisi minimal 10 digit.");
        if (!cameraPhotoUrl) setPhotoError("Wajib mengambil foto bukti kejadian langsung dari kamera.");
        return;
      }

      setIsSent(true);

      sendSosAlert({
        lat: currentCoords.lat,
        lng: currentCoords.lng,
        assistanceType: selectedAssistance || "damkar",
        note: `Panggilan Darurat SOS Warga (Realtime)${
          gpsAccuracy ? ` [Akurasi GPS: ±${Math.round(gpsAccuracy)}m]` : ""
        }`,
        phoneNumber: phoneToSend,
        photoUrl: cameraPhotoUrl,
      }).then((res) => {
        if (res.id) {
          setActiveSosId(res.id);
          activeSosIdRef.current = res.id;
          const code = res.trackingCode || `SOS-${res.id.slice(-4).toUpperCase()}`;
          setTrackingCode(code);
          setIsMinimized(false);
          setIsOpen(true);

          try {
            localStorage.setItem(
              "sigapbumi_active_sos_tracking",
              JSON.stringify({
                id: res.id,
                code,
                assistance: selectedAssistance || "damkar",
                phone: phoneToSend,
                photo: cameraPhotoUrl,
                time: Date.now(),
              })
            );
          } catch {}

          if (gpsStatus === "locked") {
            updateSosLocation(res.id, currentCoords.lat, currentCoords.lng, gpsAccuracy || undefined);
          }
        }
      });
    }
  }, [countdown, pathname, currentCoords, selectedAssistance, phoneNumber, cameraPhotoUrl, gpsAccuracy, gpsStatus]);

  // Membuka dialog form verifikasi darurat SOS (HANYA membuka form, SAMA SEKALI TIDAK mengirim laporan)
  const handleStartSos = useCallback(() => {
    hasTriggeredRef.current = false;
    setPhoneError("");
    setPhotoError("");
    setActiveSosId(null);
    activeSosIdRef.current = null;
    setIsLocationRefined(false);
    setIsOpen(true);
    setIsMinimized(false);
    setCountdown(null); // Form verifikasi dibuka, timer belum aktif
    setIsSent(false);
    setSelectedAssistance((prev) => prev || "damkar");
    setIsPhoneSaved(false);
    setSosStatus("aktif");
    setDispatchedTeam(null);
    try {
      localStorage.removeItem("sigapbumi_active_sos_tracking");
    } catch {}
    startGpsTracking();
  }, [startGpsTracking]);

  // Handler pengambilan foto langsung dari sensor kamera ponsel
  const handleCaptureCamera = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPhotoError("");
    setIsProcessingPhoto(true);

    try {
      const stamped = await stampPhotoWithGpsTimestamp(file, {
        lat: currentCoords.lat,
        lng: currentCoords.lng,
        accuracy: gpsAccuracy,
        altitude: gpsAltitude,
        speed: gpsSpeed,
        heading: compassHeading,
        addressDetails: (resolvedAddress || resolvedAddressRef.current)
          ? {
              road: (resolvedAddress || resolvedAddressRef.current)!.road,
              subdistrict: (resolvedAddress || resolvedAddressRef.current)!.subdistrict,
              city: (resolvedAddress || resolvedAddressRef.current)!.city,
              province: (resolvedAddress || resolvedAddressRef.current)!.province,
            }
          : undefined,
        timestamp: new Date(),
      });
      setCameraPhotoUrl(stamped);
    } catch (err) {
      console.error("Gagal menstempel foto kamera:", err);
      const reader = new FileReader();
      reader.onload = (ev) => {
        setCameraPhotoUrl((ev.target?.result as string) || null);
      };
      reader.readAsDataURL(file);
    } finally {
      setIsProcessingPhoto(false);
      if (e.target) e.target.value = "";
    }
  };

  const handleRetakePhoto = () => {
    setCameraPhotoUrl(null);
    if (cameraInputRef.current) {
      cameraInputRef.current.click();
    }
  };

  const cleanPhoneDigits = phoneNumber.replace(/\D/g, "");
  const isPhoneValid = cleanPhoneDigits.length >= 10;
  const isFormValid = isPhoneValid && Boolean(cameraPhotoUrl) && !isProcessingPhoto;

  const handleSubmitSos = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setPhoneError("");
    setPhotoError("");

    if (!isPhoneValid) {
      setPhoneError("Nomor telepon/WhatsApp wajib diisi minimal 10 digit angka aktif.");
      return;
    }
    if (!cameraPhotoUrl) {
      setPhotoError("Wajib mengambil foto bukti kejadian langsung dari kamera.");
      return;
    }

    if (typeof window !== "undefined") {
      localStorage.setItem("sigapbumi_user_phone", phoneNumber.trim());
    }

    hasTriggeredRef.current = false;
    setCountdown(3);
  };

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

  // Mengubah tipe bantuan: HANYA memperbarui SOS yang sudah ada secara live
  const handleSelectAssistance = (type: SosAssistanceType) => {
    setSelectedAssistance(type);
    if (activeSosId) {
      updateSosAssistanceType(activeSosId, type);
    }
  };

  // Menyimpan nomor kontak untuk posko
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

  // Batalkan saat hitung mundur (sebelum sinyal terkirim)
  const handleCancelCountdown = () => {
    stopGpsTracking();
    hasTriggeredRef.current = false;
    setCountdown(null);
    setIsOpen(false);
    setIsSent(false);
    setActiveSosId(null);
    activeSosIdRef.current = null;
    setIsLocationRefined(false);
  };

  // Minimalkan pop-up pelacakan (tetap aktif di background dengan mini-tracker floating)
  const handleMinimizeTracking = () => {
    setIsOpen(false);
    setIsMinimized(true);
  };

  // Salin kode pelacakan
  const handleCopyCode = (code: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  if (pathname.startsWith("/admin")) {
    return null;
  }

  return (
    <>
      {/* 1. Tombol Mengambang (FAB) SOS di Pojok Kanan Bawah */}
      {!isOpen && !countdown && (
        <button
          type="button"
          onClick={handleStartSos}
          aria-label="Panggilan Darurat SOS"
          className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-40 w-13 h-13 md:w-14 md:h-14 rounded-full bg-[#EF4444] text-white font-black text-sm tracking-wider flex items-center justify-center shadow-2xl border-2 border-white hover:bg-red-700 hover:scale-105 active:scale-95 transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500 cursor-pointer animate-pulse"
        >
          SOS
        </button>
      )}

      {/* 2. Floating Mini-Tracker saat pop up diminimalkan */}
      {isSent && isMinimized && !isOpen && !isTrackingOpen && trackingCode && (
        <aside
          aria-label="Status Pelacakan SOS Aktif"
          className="fixed bottom-20 md:bottom-6 right-20 md:right-24 z-40 bg-slate-900/95 text-white p-2.5 sm:p-3 rounded-2xl shadow-2xl border border-slate-700/90 backdrop-blur-md flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300 select-none"
        >
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping shrink-0 ml-1" />
          <div className="text-left">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-400">
                SOS Aktif Terpantau
              </span>
              <span className="text-[9px] bg-slate-800 text-slate-300 px-1 rounded font-mono">
                {sosStatus.toUpperCase()}
              </span>
            </div>
            <p className="text-xs font-mono font-black text-white tracking-wide">
              {trackingCode}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setIsTrackingOpen(true);
              setIsMinimized(false);
            }}
            className="px-3 py-1.5 bg-orange-600 hover:bg-orange-500 active:scale-95 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer ml-1 inline-flex items-center gap-1"
          >
            <span>Lacak</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </aside>
      )}

      {/* 3. Modal Dialog (Countdown & Pop Up Lacak Pelaporan SOS) */}
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="sos-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-xs"
        >
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white rounded-3xl p-5 sm:p-6 shadow-2xl text-left relative border border-slate-100 font-sans">
            {countdown !== null && countdown > 0 ? (
              /* FASE 1: COUNTDOWN 3 DETIK (DELAY DENGAN OPSI BATALKAN) */
              <div className="text-center py-4">
                <div className="flex justify-center mb-4">
                  <div className="w-16 h-16 rounded-full bg-red-50 border border-red-200 flex items-center justify-center text-red-600">
                    <AlertCircle className="w-8 h-8 animate-pulse" />
                  </div>
                </div>

                <div className="inline-block px-3 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[11px] font-bold mb-2">
                  Peringatan Panggilan Darurat WIA
                </div>

                <h2
                  id="sos-modal-title"
                  className="text-xl md:text-2xl font-black text-slate-900 mb-2 tracking-tight"
                >
                  Memancarkan Sinyal Darurat SOS
                </h2>
                <p className="text-slate-500 text-xs mb-4 leading-relaxed max-w-sm mx-auto">
                  Koordinat GPS dan titik darurat Anda akan langsung dipancarkan ke monitor radar posko siaga dalam:
                </p>

                {/* Lingkaran Angka Hitung Mundur 3 Detik */}
                <div
                  aria-live="assertive"
                  className="w-24 h-24 mx-auto mb-4 rounded-full border-4 border-red-500 bg-red-50/50 flex items-center justify-center shadow-inner"
                >
                  <span className="text-5xl font-black text-red-600 tabular-nums animate-bounce">
                    {countdown}
                  </span>
                </div>

                {/* Status GPS saat hitung mundur */}
                <div className="mb-6 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium border border-slate-200 bg-slate-50">
                  {gpsStatus === "locked" ? (
                    <>
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-slate-800 font-bold">GPS Terkunci:</span>
                      <span className="text-slate-500 font-mono text-[11px]">
                        {currentCoords.lat.toFixed(4)}, {currentCoords.lng.toFixed(4)}
                        {gpsAccuracy ? ` (±${Math.round(gpsAccuracy)}m)` : ""}
                      </span>
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 text-orange-500 animate-spin shrink-0" />
                      <span className="text-slate-600">Mengunci satelit posisi Anda...</span>
                    </>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleCancelCountdown}
                  className="w-full h-11 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm transition-colors cursor-pointer shadow-sm"
                >
                  Batalkan Panggilan
                </button>
              </div>
            ) : isSent ? (
              /* FASE 2: POPUP SOS BERHASIL DIKIRIM */
              <div>
                {/* Header SOS Dikirim */}
                <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shrink-0">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                        <span>Sinyal Darurat Terpancar</span>
                      </div>
                      <h2
                        id="sos-modal-title"
                        className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight"
                      >
                        Panggilan SOS Diterima Posko
                      </h2>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleMinimizeTracking}
                    title="Tutup dialog"
                    className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer shrink-0"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Card Status Pelaporan dengan Button untuk Memunculkan Popup Pelacakan */}
                <div className="mt-4 p-4 rounded-2xl bg-linear-to-r from-orange-50 via-amber-50 to-orange-50 border border-orange-200">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-extrabold text-orange-800 uppercase tracking-wider">
                      Kode Pelaporan Darurat
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                      Aktif di Radar Posko
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="font-mono text-2xl font-black text-slate-900 tracking-tight">
                      {trackingCode || "MEMUAT..."}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopyCode(trackingCode || "")}
                      className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 shadow-2xs transition-colors inline-flex items-center gap-1 cursor-pointer"
                    >
                      {copied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-700">Tersalin</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-slate-500" />
                          <span>Salin</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* BUTTON KHUSUS: MEMUNCULKAN POPUP PELACAKAN TERPISAH */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsOpen(false);
                      setIsTrackingOpen(true);
                    }}
                    className="w-full h-11 sm:h-12 rounded-xl bg-orange-600 hover:bg-orange-500 active:scale-[0.99] text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-orange-600/25 transition-all cursor-pointer"
                  >
                    <Radio className="w-4 h-4 animate-pulse text-amber-200" />
                    <span>Lacak Status Pelaporan SOS</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

                {/* Dispatch Disclaimer Notice */}
                <div className="mt-3 p-3 rounded-xl bg-amber-50/70 border border-amber-200 text-left text-[11px] text-amber-900 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
                  <p className="leading-relaxed">
                    <strong>Penting:</strong> Platform prototipe WIA 2026. Untuk situasi kritis mengancam nyawa, segera hubungi <strong>112</strong> bebas pulsa.
                  </p>
                </div>

                {/* Titik Lokasi GPS Terkini */}
                <div className="mt-3 p-3 rounded-2xl bg-white border border-slate-200 text-xs flex items-center justify-between gap-2 shadow-2xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <MapPin className="w-4 h-4 text-orange-600 shrink-0" />
                    <div className="min-w-0">
                      <span className="font-bold text-slate-800 text-[11px] block">
                        Titik Koordinat Terpancar:
                      </span>
                      <p className="font-mono text-slate-500 text-[11px] truncate">
                        {currentCoords.lat.toFixed(5)}, {currentCoords.lng.toFixed(5)}
                        {gpsAccuracy ? ` (±${Math.round(gpsAccuracy)}m)` : ""}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => startGpsTracking()}
                    title="Perbarui koordinat GPS sekarang"
                    className="p-1.5 px-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-[11px] font-semibold flex items-center gap-1 shrink-0 transition-colors cursor-pointer"
                  >
                    <RefreshCw className={`w-3 h-3 ${gpsStatus === "acquiring" ? "animate-spin text-orange-600" : "text-slate-500"}`} />
                    <span>Perbarui</span>
                  </button>
                </div>

                {/* Pilih / Sesuaikan Jenis Bantuan Darurat */}
                <div className="mt-3">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5">
                    Instansi Bantuan yang Dihubungi:
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <button
                      type="button"
                      onClick={() => handleSelectAssistance("damkar")}
                      className={`p-2.5 rounded-xl border text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                        selectedAssistance === "damkar"
                          ? "border-orange-500 bg-orange-50 text-orange-800 ring-2 ring-orange-500/20"
                          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <Flame className="w-4 h-4 text-red-500 shrink-0" />
                      <span>Damkar</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSelectAssistance("medis")}
                      className={`p-2.5 rounded-xl border text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                        selectedAssistance === "medis"
                          ? "border-orange-500 bg-orange-50 text-orange-800 ring-2 ring-orange-500/20"
                          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <HeartPulse className="w-4 h-4 text-rose-500 shrink-0" />
                      <span>Medis</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSelectAssistance("polisi")}
                      className={`p-2.5 rounded-xl border text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                        selectedAssistance === "polisi"
                          ? "border-orange-500 bg-orange-50 text-orange-800 ring-2 ring-orange-500/20"
                          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <Shield className="w-4 h-4 text-blue-600 shrink-0" />
                      <span>Polisi</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSelectAssistance("bnpb_bpbd")}
                      className={`p-2.5 rounded-xl border text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                        selectedAssistance === "bnpb_bpbd"
                          ? "border-orange-500 bg-orange-50 text-orange-800 ring-2 ring-orange-500/20"
                          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <LifeBuoy className="w-4 h-4 text-orange-600 shrink-0" />
                      <span>BNPB</span>
                    </button>
                  </div>
                </div>

                {/* Input No. HP / WhatsApp Verifikasi Posko */}
                <div className="mt-3 p-3 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <label htmlFor="sos-phone-field" className="font-bold text-slate-800 flex items-center gap-1.5 text-[11px]">
                      <Phone className="w-3.5 h-3.5 text-orange-600" />
                      <span>Nomor Telepon / WhatsApp Anda:</span>
                    </label>
                    {isPhoneSaved && (
                      <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        Tersimpan
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-500 mb-2">
                    Petugas posko akan menghubungi nomor ini untuk memandu evakuasi langsung.
                  </p>
                  <form onSubmit={handleSavePhone} className="flex gap-2">
                    <input
                      id="sos-phone-field"
                      type="tel"
                      placeholder="Contoh: 0812-3456-7890"
                      value={phoneNumber}
                      onChange={(e) => {
                        setPhoneNumber(e.target.value);
                        setIsPhoneSaved(false);
                      }}
                      className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                    />
                    <button
                      type="submit"
                      className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors shrink-0 cursor-pointer"
                    >
                      {isPhoneSaved ? "Tersimpan" : "Simpan Kontak"}
                    </button>
                  </form>
                </div>

                {/* Panggilan Darurat Bebas Pulsa */}
                <div className="mt-3 pt-3 border-t border-slate-100">
                  <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-2">
                    Panggilan Suara Langsung (Bebas Pulsa):
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    <a
                      href="tel:112"
                      className="h-9 flex items-center justify-center gap-1.5 px-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-colors shadow-2xs"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>112 Darurat</span>
                    </a>
                    <a
                      href="tel:113"
                      className="h-9 flex items-center justify-center gap-1.5 px-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 text-xs font-bold transition-colors"
                    >
                      <Phone className="w-3.5 h-3.5 text-red-600" />
                      <span>113 Damkar</span>
                    </a>
                    <a
                      href="tel:115"
                      className="h-9 flex items-center justify-center gap-1.5 px-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 text-xs font-bold transition-colors"
                    >
                      <Phone className="w-3.5 h-3.5 text-orange-600" />
                      <span>115 SAR</span>
                    </a>
                  </div>
                </div>

                {/* Tombol Tutup Modal SOS */}
                <div className="mt-4">
                  <button
                    type="button"
                    onClick={handleMinimizeTracking}
                    className="w-full h-11 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors cursor-pointer"
                  >
                    Tutup Dialog
                  </button>
                </div>
              </div>
            ) : (
              /* FASE 0: FORM VERIFIKASI WAJIB NO. HP & FOTO KAMERA LANGSUNG */
              <div>
                {/* Header Modal */}
                <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-full bg-red-100 border border-red-300 flex items-center justify-center text-red-600 shrink-0 shadow-2xs">
                      <ShieldAlert className="w-6 h-6 animate-pulse" />
                    </div>
                    <div>
                      <h2
                        id="sos-modal-title"
                        className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight"
                      >
                        Panggilan Darurat SOS
                      </h2>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setIsOpen(false);
                      setCountdown(null);
                    }}
                    title="Tutup dialog"
                    className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer shrink-0"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Subtitle & Warning Hukum */}
                <div className="mt-3.5 p-3 rounded-2xl bg-amber-50/80 border border-amber-200/80 text-amber-900 text-xs flex items-start gap-2.5 leading-relaxed">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                  <div>
                    <p className="font-bold text-[11px] uppercase tracking-wide text-amber-800">
                      Wajib Nomor Kontak & Bukti Kamera
                    </p>
                    <p className="text-[11px] text-amber-800/90 mt-0.5">
                      Untuk mencegah laporan palsu, posko mewajibkan nomor WhatsApp aktif dan foto kejadian langsung dari kamera. Sesuai Pasal 220 KUHP, laporan palsu dapat ditindak pidana.
                    </p>
                  </div>
                </div>

                {/* Status GPS Terkunci */}
                <div className="mt-3 p-2.5 px-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                    <span className="font-bold text-slate-700 text-[11px]">GPS Terkunci:</span>
                    <span className="font-mono text-slate-500 text-[11px] truncate">
                      {currentCoords.lat.toFixed(5)}, {currentCoords.lng.toFixed(5)}
                      {gpsAccuracy ? ` (±${Math.round(gpsAccuracy)}m)` : ""}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => startGpsTracking()}
                    title="Perbarui koordinat GPS"
                    className="p-1 px-2 rounded-lg bg-white border border-slate-200 text-slate-600 text-[10px] font-semibold flex items-center gap-1 hover:bg-slate-100 transition-colors shrink-0 cursor-pointer"
                  >
                    <RefreshCw className={`w-3 h-3 ${gpsStatus === "acquiring" ? "animate-spin text-orange-600" : ""}`} />
                    <span>Perbarui</span>
                  </button>
                </div>

                {/* Pilih Instansi Bantuan */}
                <div className="mt-3.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 block mb-1.5">
                    Pilih Jenis Bantuan Utama:
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedAssistance("damkar")}
                      className={`p-2.5 rounded-xl border text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                        selectedAssistance === "damkar"
                          ? "border-orange-500 bg-orange-50 text-orange-800 ring-2 ring-orange-500/20"
                          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <Flame className="w-4 h-4 text-red-500 shrink-0" />
                      <span>Damkar</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedAssistance("medis")}
                      className={`p-2.5 rounded-xl border text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                        selectedAssistance === "medis"
                          ? "border-orange-500 bg-orange-50 text-orange-800 ring-2 ring-orange-500/20"
                          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <HeartPulse className="w-4 h-4 text-rose-500 shrink-0" />
                      <span>Medis</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedAssistance("polisi")}
                      className={`p-2.5 rounded-xl border text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                        selectedAssistance === "polisi"
                          ? "border-orange-500 bg-orange-50 text-orange-800 ring-2 ring-orange-500/20"
                          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <Shield className="w-4 h-4 text-blue-600 shrink-0" />
                      <span>Polisi</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedAssistance("bnpb_bpbd")}
                      className={`p-2.5 rounded-xl border text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                        selectedAssistance === "bnpb_bpbd"
                          ? "border-orange-500 bg-orange-50 text-orange-800 ring-2 ring-orange-500/20"
                          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <LifeBuoy className="w-4 h-4 text-orange-600 shrink-0" />
                      <span>SAR BPBD</span>
                    </button>
                  </div>
                </div>

                {/* Form Wajib 1: Nomor Telepon / WhatsApp */}
                <div className="mt-3.5">
                  <div className="flex items-center justify-between mb-1.5">
                    <label
                      htmlFor="sos-verify-phone"
                      className="block text-xs font-bold text-slate-800 flex items-center gap-1.5"
                    >
                      <Phone className="w-3.5 h-3.5 text-orange-600" />
                      <span>Nomor Telepon / WhatsApp Anda</span>
                      <span className="text-red-500 font-black">*</span>
                    </label>
                    <span className="text-[10px] text-red-600 bg-red-50 px-2 py-0.5 rounded-full font-bold">
                      Wajib Diisi
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      id="sos-verify-phone"
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => {
                        setPhoneNumber(e.target.value);
                        setPhoneError("");
                      }}
                      placeholder="Contoh: 081234567890 atau +62812..."
                      className={`w-full h-11 pl-3.5 pr-10 rounded-xl border text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none transition-all ${
                        phoneError
                          ? "border-red-500 ring-2 ring-red-500/20 bg-red-50/20"
                          : isPhoneValid
                          ? "border-emerald-500 bg-emerald-50/10"
                          : "border-slate-200 bg-slate-50/50 focus:bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                      }`}
                    />
                    {isPhoneValid && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    )}
                  </div>
                  {phoneError ? (
                    <p className="text-[11px] text-red-600 font-semibold mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 shrink-0" />
                      <span>{phoneError}</span>
                    </p>
                  ) : (
                    <p className="text-[11px] text-slate-500 mt-1">
                      Petugas posko akan langsung menelepon/WhatsApp nomor ini dalam 30 detik untuk panduan evakuasi.
                    </p>
                  )}
                </div>

                {/* Form Wajib 2: Foto Kejadian Nyata dari Sensor Kamera */}
                <div className="mt-3.5">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Camera className="w-3.5 h-3.5 text-orange-600" />
                      <span>Foto Kejadian Nyata dari Kamera</span>
                      <span className="text-red-500 font-black">*</span>
                    </label>
                  </div>

                  {/* Input File Camera (capture=environment memaksa kamera belakang ponsel) */}
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    ref={cameraInputRef}
                    onChange={handleCaptureCamera}
                    className="hidden"
                    id="sos-camera-capture-input"
                  />

                  {isProcessingPhoto ? (
                    <div className="p-6 rounded-2xl border-2 border-dashed border-orange-300 bg-orange-50/40 text-center flex flex-col items-center justify-center gap-2">
                      <RefreshCw className="w-6 h-6 text-orange-600 animate-spin" />
                      <p className="text-xs font-bold text-slate-800">
                        Mencap Stempel GPS & Waktu Resmi...
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Menanamkan koordinat satelit dan tanggal permanen pada foto
                      </p>
                    </div>
                  ) : cameraPhotoUrl ? (
                    /* Pratinjau Foto Kamera Berstempel */
                    <div className="rounded-2xl border border-slate-200 overflow-hidden bg-slate-950 relative shadow-sm group">
                      <div
                        onClick={() => setIsPhotoFullscreen(true)}
                        className="relative aspect-video max-h-56 w-full flex items-center justify-center overflow-hidden bg-black cursor-pointer"
                        title="Klik untuk melihat foto layar penuh"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={cameraPhotoUrl}
                          alt="Bukti Kamera Berstempel"
                          className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                        />
                        {/* Overlay petunjuk klik fullscreen */}
                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                          <span className="bg-black/75 text-white text-xs px-3 py-1.5 rounded-xl font-bold backdrop-blur-xs flex items-center gap-1.5 shadow-lg">
                            <Eye className="w-4 h-4 text-emerald-400" />
                            Klik untuk Layar Penuh
                          </span>
                        </div>
                        {/* Badge indikator di pojok */}
                        <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-xs text-white text-[10px] px-2 py-1 rounded-lg font-semibold flex items-center gap-1 pointer-events-none">
                          <Eye className="w-3 h-3 text-emerald-400" />
                          <span>Layar Penuh</span>
                        </div>
                      </div>
                      <div className="p-3 bg-white border-t border-slate-200 flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => setIsPhotoFullscreen(true)}
                          className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-800 transition-colors cursor-pointer text-left"
                        >
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>Foto Kamera Valid • Lihat Detail</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleRetakePhoto}
                          className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                        >
                          Ulangi Foto
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Tombol Ambil Foto Kamera */
                    <button
                      type="button"
                      onClick={() => cameraInputRef.current?.click()}
                      className="w-full p-5 rounded-2xl border-2 border-dashed border-orange-300 hover:border-orange-500 bg-orange-50/50 hover:bg-orange-50/80 transition-all text-center flex flex-col items-center justify-center gap-2 group cursor-pointer"
                    >
                      <div className="w-12 h-12 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center group-hover:scale-110 transition-transform shadow-xs">
                        <Camera className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-800">
                          Ambil Foto Bukti Langsung dari Kamera
                        </p>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Kamera akan langsung mencap stempel lokasi GPS dan waktu riil secara otomatis
                        </p>
                      </div>
                    </button>
                  )}

                  {photoError && (
                    <p className="text-[11px] text-red-600 font-semibold mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 shrink-0" />
                      <span>{photoError}</span>
                    </p>
                  )}
                </div>

                {/* Tombol Aksi Kirim SOS */}
                <div className="mt-5 space-y-2.5 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={handleSubmitSos}
                    disabled={!isFormValid}
                    className={`w-full h-12 rounded-2xl font-black text-sm tracking-wide flex items-center justify-center gap-2 shadow-lg transition-all ${
                      isFormValid
                        ? "bg-red-600 hover:bg-red-700 active:scale-[0.99] text-white shadow-red-600/30 cursor-pointer animate-pulse"
                        : "bg-slate-200 text-slate-400 border border-slate-300 cursor-not-allowed"
                    }`}
                  >
                    <Radio className="w-4 h-4 text-white" />
                    <span>KIRIM LAPORAN SOS</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsOpen(false);
                      setCountdown(null);
                    }}
                    className="w-full h-11 rounded-2xl border border-slate-300 hover:border-slate-400 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 transition-all cursor-pointer shadow-2xs"
                  >
                    Batal
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. POPUP KEDUA: MODAL PELACAKAN SOS TERPISAH */}
      {isTrackingOpen && trackingCode && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="tracking-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-xs animate-in fade-in duration-200"
        >
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white rounded-3xl p-5 sm:p-6 shadow-2xl text-left relative border border-slate-100 font-sans">
            {/* Header Pelacakan */}
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold mb-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Sinyal SOS Aktif & Terpantau Posko</span>
                </div>
                <h2
                  id="tracking-modal-title"
                  className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight"
                >
                  Pelacakan Sinyal Darurat SOS
                </h2>
                <p className="text-slate-500 text-xs mt-0.5">
                  Panggilan Anda terhubung ke radar tanggap darurat posko secara real-time.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsTrackingOpen(false);
                  setIsMinimized(true);
                }}
                title="Tutup pelacakan"
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Kartu Kode Lacak Utama (Persis Screenshot) */}
            <div className="mt-4 p-3.5 sm:p-4 rounded-2xl bg-linear-to-r from-orange-50 via-amber-50 to-orange-50 border border-orange-200/80 flex items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-extrabold text-orange-700 uppercase tracking-wider block">
                  KODE PELACAKAN DARURAT
                </span>
                <span className="font-mono text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  {trackingCode}
                </span>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => handleCopyCode(trackingCode)}
                  className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 shadow-2xs transition-colors inline-flex items-center gap-1 cursor-pointer"
                  title="Salin Kode Pelacakan"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700">Tersalin</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-500" />
                      <span>Salin</span>
                    </>
                  )}
                </button>

                <Link
                  href={`/lacak?kode=${encodeURIComponent(trackingCode)}`}
                  onClick={() => setIsTrackingOpen(false)}
                  className="px-3 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold shadow-2xs transition-colors inline-flex items-center gap-1"
                >
                  <span>Lacak Penuh</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            </div>

            {/* Live Step-by-Step Progress Tracker (Persis Screenshot) */}
            <div className="mt-4 p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/70">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-3">
                PROGRES PENANGANAN OPERASIONAL:
              </span>

              <div className="space-y-3 relative before:absolute before:left-3.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
                {/* Step 1 */}
                <div className="flex items-start gap-3 relative">
                  <div className="w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs shrink-0 shadow-xs z-10">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <p className="text-xs font-bold text-slate-900">Sinyal SOS Dipancarkan</p>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                        Terkirim
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Koordinat GPS akurat & data darurat telah dikirim dari ponsel Anda.
                    </p>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="flex items-start gap-3 relative">
                  <div className="w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs shrink-0 shadow-xs z-10">
                    <Radio className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <p className="text-xs font-bold text-slate-900">Diterima di Radar Posko</p>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                        Terpantau
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Terkoneksi langsung ke dasbor siaga instansi terkait.
                    </p>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="flex items-start gap-3 relative">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs shrink-0 shadow-xs z-10 ${
                      sosStatus === "ditangani" || sosStatus === "selesai"
                        ? "bg-emerald-500 text-white"
                        : "bg-orange-500 text-white animate-pulse"
                    }`}
                  >
                    <Clock className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <p className="text-xs font-bold text-slate-900">Validasi & Penugasan Regu</p>
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          sosStatus === "ditangani" || sosStatus === "selesai"
                            ? "text-emerald-700 bg-emerald-100"
                            : "text-orange-700 bg-orange-100 animate-pulse"
                        }`}
                      >
                        {sosStatus === "ditangani" || sosStatus === "selesai" ? "Ditugaskan" : "Dalam Proses"}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {sosStatus === "ditangani" || sosStatus === "selesai"
                        ? `Regu penyelamat ditugaskan: ${dispatchedTeam || "Tim Reaksi Cepat Posko"}.`
                        : "Petugas posko sedang memvalidasi lokasi dan menugaskan armada siaga terdekat."}
                    </p>
                  </div>
                </div>

                {/* Step 4 */}
                <div className="flex items-start gap-3 relative">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs shrink-0 shadow-xs z-10 ${
                      sosStatus === "selesai"
                        ? "bg-emerald-500 text-white"
                        : sosStatus === "ditangani"
                        ? "bg-blue-600 text-white animate-pulse"
                        : "bg-slate-200 text-slate-500"
                    }`}
                  >
                    <Navigation className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <p className="text-xs font-bold text-slate-900">Armada Menuju Titik Anda</p>
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          sosStatus === "selesai"
                            ? "text-emerald-700 bg-emerald-100"
                            : sosStatus === "ditangani"
                            ? "text-blue-700 bg-blue-100 animate-pulse"
                            : "text-slate-500 bg-slate-200"
                        }`}
                      >
                        {sosStatus === "selesai"
                          ? "Selesai"
                          : sosStatus === "ditangani"
                          ? "Dalam Perjalanan"
                          : "Siaga"}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {sosStatus === "selesai"
                        ? "Penanganan operasional darurat telah selesai dilakukan di lokasi."
                        : sosStatus === "ditangani"
                        ? "Armada sedang meluncur ke titik koordinat darurat Anda. Pastikan ponsel tetap aktif."
                        : "Menunggu instruksi komando pengerahan unit dari posko."}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Titik Lokasi GPS Terkini */}
            <div className="mt-3.5 p-3 rounded-2xl bg-white border border-slate-200 text-xs flex items-center justify-between gap-2 shadow-2xs">
              <div className="flex items-center gap-2 min-w-0">
                <MapPin className="w-4 h-4 text-orange-600 shrink-0" />
                <div className="min-w-0">
                  <span className="font-bold text-slate-800 text-[11px] block">
                    Titik Koordinat Terpancar:
                  </span>
                  <p className="font-mono text-slate-500 text-[11px] truncate">
                    {currentCoords.lat.toFixed(5)}, {currentCoords.lng.toFixed(5)}
                    {gpsAccuracy ? ` (±${Math.round(gpsAccuracy)}m)` : ""}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => startGpsTracking()}
                title="Perbarui koordinat GPS sekarang"
                className="p-1.5 px-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-[11px] font-semibold flex items-center gap-1 shrink-0 transition-colors cursor-pointer"
              >
                <RefreshCw className={`w-3 h-3 ${gpsStatus === "acquiring" ? "animate-spin text-orange-600" : "text-slate-500"}`} />
                <span>Perbarui</span>
              </button>
            </div>

            {/* Tombol Aksi Bawah Pop Up Pelacakan */}
            <div className="mt-5 flex flex-col sm:flex-row items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsTrackingOpen(false);
                  setIsOpen(true);
                }}
                className="w-full sm:flex-1 h-11 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <span>Lihat Detail SOS & Kontak</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsTrackingOpen(false);
                  setIsMinimized(true);
                }}
                className="w-full sm:w-auto px-5 h-11 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors cursor-pointer"
              >
                Tutup Pelacakan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. POPUP KETIGA: LIGHTBOX FULLSCREEN FOTO BUKTI KAMERA */}
      {isPhotoFullscreen && cameraPhotoUrl && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-100 bg-black/95 backdrop-blur-md flex flex-col justify-between p-3 sm:p-5 select-none animate-in fade-in duration-200"
          onClick={() => setIsPhotoFullscreen(false)}
        >
          {/* Header Lightbox */}
          <div
            className="flex items-center justify-between text-white max-w-5xl mx-auto w-full pb-2 shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2">
              <Camera className="w-4 h-4 text-emerald-400" />
              <span className="text-xs sm:text-sm font-bold">
                Bukti Foto Kamera Riil (Stempel GPS, Kompas & Waktu)
              </span>
              <span className="hidden sm:inline-block px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                Otentik
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsPhotoFullscreen(false)}
              className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer flex items-center gap-1 text-xs font-semibold"
              title="Tutup (Esc)"
            >
              <X className="w-5 h-5" />
              <span className="hidden sm:inline">Tutup</span>
            </button>
          </div>

          {/* Area Foto Fullscreen Tengah */}
          <div
            className="flex-1 flex items-center justify-center p-1 sm:p-4 overflow-auto max-h-[82vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={cameraPhotoUrl}
              alt="Bukti Foto Kamera Layar Penuh"
              className="max-w-full max-h-[80vh] object-contain rounded-xl shadow-2xl border border-white/10"
            />
          </div>

          {/* Footer Lightbox */}
          <div
            className="flex flex-col sm:flex-row items-center justify-between gap-2 max-w-5xl mx-auto w-full pt-2 text-[11px] text-slate-400 border-t border-white/10 shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="text-center sm:text-left">
              🛡️ Stempel kompas dial, mini map, dan koordinat tercetak permanen langsung dari kamera perangkat warga.
            </span>
            <button
              type="button"
              onClick={() => setIsPhotoFullscreen(false)}
              className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-colors cursor-pointer shrink-0"
            >
              Kembali ke Formulir
            </button>
          </div>
        </div>
      )}
    </>
  );
}

"use client";

import React, { useState, useEffect, useCallback } from "react";
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
} from "lucide-react";
import type { SosAssistanceType } from "@/types";
import { sendSosAlert, updateSosPhone } from "@/lib/services/sos";

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
  const [currentCoords, setCurrentCoords] = useState<{ lat: number; lng: number }>({
    lat: -6.2088,
    lng: 106.8456,
  });

  // Ambil nomor HP tersimpan jika ada
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("sigapbumi_user_phone");
      if (saved) setPhoneNumber(saved);
    }
  }, []);

  // Ambil lokasi GPS riil warga saat pertama kali menekan SOS
  const fetchCurrentLocation = useCallback(() => {
    if (typeof window !== "undefined" && "geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCurrentCoords({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          });
        },
        (err) => {
          console.warn("Geolocation denied/unavailable, using fallback coords:", err.message);
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    }
  }, []);

  useEffect(() => {
    if (pathname.startsWith("/admin")) return;
    if (countdown === null) return;
    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown((prev) => {
          if (prev === 1) {
            // Trigger kirim SOS nyata ke Supabase
            const savedPhone = typeof window !== "undefined" ? localStorage.getItem("sigapbumi_user_phone") || undefined : undefined;
            const phoneToSend = phoneNumber.trim() || savedPhone;

            sendSosAlert({
              lat: currentCoords.lat,
              lng: currentCoords.lng,
              assistanceType: selectedAssistance || "damkar",
              note: "Panggilan Darurat SOS Warga (Realtime)",
              phoneNumber: phoneToSend,
            }).then((res) => {
              if (res.id) setActiveSosId(res.id);
            });

            setIsSent(true);
            return null;
          }
          return prev !== null ? prev - 1 : null;
        });
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown, pathname, currentCoords, selectedAssistance, phoneNumber]);

  const handleStartSos = useCallback(() => {
    fetchCurrentLocation();
    setIsOpen(true);
    setCountdown(3);
    setIsSent(false);
    setSelectedAssistance(null);
    setIsPhoneSaved(false);
  }, [fetchCurrentLocation]);

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

  const handleSelectAssistance = (type: SosAssistanceType) => {
    setSelectedAssistance(type);
    const cleanPhone = phoneNumber.trim();
    // Kirim pembaruan tipe bantuan nyata
    sendSosAlert({
      lat: currentCoords.lat,
      lng: currentCoords.lng,
      assistanceType: type,
      phoneNumber: cleanPhone || undefined,
      note: `Panggilan Darurat Warga - Butuh Bantuan ${type.toUpperCase()}`,
    }).then((res) => {
      if (res.id) setActiveSosId(res.id);
    });
  };

  const handleSavePhone = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanPhone = phoneNumber.trim();
    if (!cleanPhone) return;

    if (typeof window !== "undefined") {
      localStorage.setItem("sigapbumi_user_phone", cleanPhone);
    }
    if (activeSosId) {
      await updateSosPhone(activeSosId, cleanPhone);
    } else {
      // Jika belum ada ID, kirim update dengan note berisi phone
      sendSosAlert({
        lat: currentCoords.lat,
        lng: currentCoords.lng,
        assistanceType: selectedAssistance || "damkar",
        phoneNumber: cleanPhone,
        note: `Panggilan Darurat Warga [Kontak: ${cleanPhone}]`,
      }).then((res) => {
        if (res.id) setActiveSosId(res.id);
      });
    }

    setIsPhoneSaved(true);
  };

  const handleCancel = () => {
    setCountdown(null);
    setIsOpen(false);
    setIsSent(false);
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
          <div className="w-full max-w-md bg-surface rounded-lg p-6 shadow-overlay text-center relative border border-line">
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
                <p className="text-ink-soft text-xs mb-5 leading-relaxed">
                  Lokasi koordinat darurat Anda akan dicatat di monitor operasional posko dalam:
                </p>

                {/* Countdown display */}
                <div
                  aria-live="assertive"
                  className="w-24 h-24 mx-auto mb-6 rounded-full border-4 border-danger flex items-center justify-center"
                >
                  <span className="text-4xl font-extrabold text-danger tabular-nums">
                    {countdown}
                  </span>
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

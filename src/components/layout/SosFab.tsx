"use client";

import React, { useState, useEffect } from "react";
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
} from "lucide-react";
import type { SosAssistanceType } from "@/types";

export function SosFab() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isSent, setIsSent] = useState(false);
  const [selectedAssistance, setSelectedAssistance] =
    useState<SosAssistanceType | null>(null);

  useEffect(() => {
    if (pathname.startsWith("/admin")) return;
    if (countdown === null) return;
    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown((prev) => {
          if (prev === 1) {
            setIsSent(true);
            return null;
          }
          return prev !== null ? prev - 1 : null;
        });
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown, pathname]);

  const handleStartSos = () => {
    setIsOpen(true);
    setCountdown(3);
    setIsSent(false);
    setSelectedAssistance(null);
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
      {/* Floating Action Button (FAB) */}
      <div className="fixed bottom-20 right-4 md:bottom-8 md:right-8 z-40">
        <button
          type="button"
          onClick={handleStartSos}
          aria-label="Tombol Darurat SOS"
          className="w-16 h-16 md:w-[72px] md:h-[72px] rounded-full bg-danger text-white font-bold text-xl md:text-2xl shadow-overlay flex items-center justify-center transition-transform hover:scale-105 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-danger"
        >
          SOS
        </button>
      </div>

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

                <h2
                  id="sos-title"
                  className="text-xl md:text-2xl font-bold text-ink mb-2"
                >
                  Mengirim Sinyal SOS Darurat
                </h2>
                <p className="text-ink-soft text-sm mb-6">
                  Lokasi darurat Anda akan dikirim ke tim siaga bencana dalam:
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

                <h2
                  id="sos-title"
                  className="text-xl font-bold text-ink mb-1"
                >
                  Sinyal SOS Terkirim
                </h2>
                <p className="text-ink-soft text-sm mb-5">
                  Posisi Anda telah diteruskan ke petugas piket. Pilih jenis bantuan jika memungkinkan:
                </p>

                {/* Tipe Bantuan SOS */}
                <div className="grid grid-cols-2 gap-3 mb-6 text-left">
                  <button
                    type="button"
                    onClick={() => setSelectedAssistance("damkar")}
                    className={`p-3 rounded-md border text-sm font-medium flex items-center gap-2 transition-colors ${
                      selectedAssistance === "damkar"
                        ? "border-primary bg-primary-soft text-primary-hover"
                        : "border-line bg-surface text-ink hover:border-line-strong"
                    }`}
                  >
                    <Flame className="w-5 h-5 text-danger shrink-0" />
                    <span>Damkar</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedAssistance("medis")}
                    className={`p-3 rounded-md border text-sm font-medium flex items-center gap-2 transition-colors ${
                      selectedAssistance === "medis"
                        ? "border-primary bg-primary-soft text-primary-hover"
                        : "border-line bg-surface text-ink hover:border-line-strong"
                    }`}
                  >
                    <HeartPulse className="w-5 h-5 text-danger shrink-0" />
                    <span>Medis / RS</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedAssistance("polisi")}
                    className={`p-3 rounded-md border text-sm font-medium flex items-center gap-2 transition-colors ${
                      selectedAssistance === "polisi"
                        ? "border-primary bg-primary-soft text-primary-hover"
                        : "border-line bg-surface text-ink hover:border-line-strong"
                    }`}
                  >
                    <Shield className="w-5 h-5 text-info shrink-0" />
                    <span>Polisi</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedAssistance("bnpb_bpbd")}
                    className={`p-3 rounded-md border text-sm font-medium flex items-center gap-2 transition-colors ${
                      selectedAssistance === "bnpb_bpbd"
                        ? "border-primary bg-primary-soft text-primary-hover"
                        : "border-line bg-surface text-ink hover:border-line-strong"
                    }`}
                  >
                    <LifeBuoy className="w-5 h-5 text-primary shrink-0" />
                    <span>BNPB / BPBD</span>
                  </button>
                </div>

                {/* Panggilan Cepat */}
                <div className="border-t border-line pt-4 text-left">
                  <p className="text-xs font-semibold uppercase tracking-wider text-ink-muted mb-2">
                    Panggilan Darurat Langsung
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <a
                      href="tel:112"
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md bg-bg border border-line text-xs font-semibold text-ink hover:bg-line"
                    >
                      <Phone className="w-3.5 h-3.5 text-danger" />
                      112 (Darurat)
                    </a>
                    <a
                      href="tel:115"
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md bg-bg border border-line text-xs font-semibold text-ink hover:bg-line"
                    >
                      <Phone className="w-3.5 h-3.5 text-primary" />
                      115 (SAR / Basarnas)
                    </a>
                    <a
                      href="tel:113"
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md bg-bg border border-line text-xs font-semibold text-ink hover:bg-line"
                    >
                      <Phone className="w-3.5 h-3.5 text-danger" />
                      113 (Damkar)
                    </a>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleCancel}
                  className="w-full mt-5 h-11 rounded-md bg-ink text-white font-semibold text-sm transition-colors hover:bg-ink-soft"
                >
                  Tutup
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

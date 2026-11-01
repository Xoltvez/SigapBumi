"use client";

import React, { useState, useEffect, useCallback } from "react";
import { CheckCircle2, LogOut, AlertCircle, Info, X } from "lucide-react";

export interface ToastItem {
  id: string;
  title: string;
  message?: string;
  type: "success" | "info" | "warning" | "error";
  duration?: number;
}

const TOAST_EVENT = "sigapbumi_toast_event";
const PENDING_STORAGE_KEY = "sigapbumi_pending_toast";

export function showToast(
  title: string,
  message?: string,
  type: "success" | "info" | "warning" | "error" = "success"
) {
  if (typeof window === "undefined") return;

  const payload: ToastItem = {
    id: `toast-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    title,
    message,
    type,
    duration: 4000,
  };

  // Simpan juga ke sessionStorage agar tetap tampil jika halaman redirect
  try {
    sessionStorage.setItem(PENDING_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // ignore
  }

  window.dispatchEvent(new CustomEvent(TOAST_EVENT, { detail: payload }));
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const addToast = useCallback((toast: ToastItem) => {
    setToasts((prev) => [...prev.slice(-3), toast]); // Maksimal tampil 3 toast sekaligus

    const timer = setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== toast.id));
    }, toast.duration || 4000);

    return () => clearTimeout(timer);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  useEffect(() => {
    // 1. Cek apakah ada pending toast dari navigasi sebelumnya
    try {
      const pendingRaw = sessionStorage.getItem(PENDING_STORAGE_KEY);
      if (pendingRaw) {
        sessionStorage.removeItem(PENDING_STORAGE_KEY);
        const pending = JSON.parse(pendingRaw) as ToastItem;
        addToast(pending);
      }
    } catch {
      // ignore
    }

    // 2. Dengarkan custom event toast
    const handleToastEvent = (e: Event) => {
      const customEvent = e as CustomEvent<ToastItem>;
      if (customEvent.detail) {
        // Hapus dari pending storage karena sudah diterima langsung
        try {
          sessionStorage.removeItem(PENDING_STORAGE_KEY);
        } catch {
          // ignore
        }
        addToast(customEvent.detail);
      }
    };

    window.addEventListener(TOAST_EVENT, handleToastEvent);
    return () => {
      window.removeEventListener(TOAST_EVENT, handleToastEvent);
    };
  }, [addToast]);

  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="fixed top-4 right-4 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-3 sm:px-0"
    >
      {toasts.map((toast) => {
        const isSuccess = toast.type === "success";
        const isInfo = toast.type === "info";
        const isError = toast.type === "error";

        return (
          <div
            key={toast.id}
            role="alert"
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-xl backdrop-blur-md transition-all duration-300 animate-in slide-in-from-top-3 fade-in ${
              isSuccess
                ? "bg-surface/95 border-emerald-500/30 text-ink"
                : isInfo
                ? "bg-surface/95 border-primary/30 text-ink"
                : isError
                ? "bg-surface/95 border-danger/30 text-ink"
                : "bg-surface/95 border-line text-ink"
            }`}
          >
            {/* Icon */}
            <div className="shrink-0 mt-0.5">
              {isSuccess && (
                <div className="w-8 h-8 rounded-full bg-emerald-500/15 text-emerald-600 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                </div>
              )}
              {isInfo && (
                <div className="w-8 h-8 rounded-full bg-primary/15 text-primary flex items-center justify-center">
                  <LogOut className="w-4 h-4 stroke-[2.5]" />
                </div>
              )}
              {isError && (
                <div className="w-8 h-8 rounded-full bg-danger/15 text-danger flex items-center justify-center">
                  <AlertCircle className="w-4 h-4 stroke-[2.5]" />
                </div>
              )}
              {!isSuccess && !isInfo && !isError && (
                <div className="w-8 h-8 rounded-full bg-ink/10 text-ink flex items-center justify-center">
                  <Info className="w-4 h-4 stroke-[2.5]" />
                </div>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 pr-1">
              <p className="text-xs sm:text-sm font-bold text-ink leading-snug">
                {toast.title}
              </p>
              {toast.message && (
                <p className="text-[11px] sm:text-xs text-ink-soft mt-0.5 leading-relaxed">
                  {toast.message}
                </p>
              )}
            </div>

            {/* Close Button */}
            <button
              type="button"
              onClick={() => removeToast(toast.id)}
              className="shrink-0 p-1 rounded-md text-ink-muted hover:text-ink hover:bg-bg transition-colors"
              aria-label="Tutup notifikasi"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}

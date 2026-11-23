"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  recordUserActivity,
  logoutUser,
  IDLE_TIMEOUT_MS,
  LAST_ACTIVITY_KEY,
} from "@/lib/auth";

const USER_STORAGE_KEY = "sigapbumi_current_user";

/**
 * IdleSessionManager
 * Memantau aktivitas interaksi warga (klik, ketik, scroll, touch, gerak mouse).
 * Jika warga telah login dan tidak ada aktivitas selama 1 jam (IDLE_TIMEOUT_MS),
 * sesi akun otomatis di-logout demi keamanan dengan notifikasi toast informatif.
 */
export function IdleSessionManager() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Fungsi pengecekan apakah sesi telah melewati batas idle timeout
    const checkIdleTimeout = () => {
      try {
        const userRaw = localStorage.getItem(USER_STORAGE_KEY);
        if (!userRaw) return; // Pengguna belum login, abaikan

        const lastActiveStr = localStorage.getItem(LAST_ACTIVITY_KEY);
        if (!lastActiveStr) {
          // Inisialisasi awal jika belum tercatat
          recordUserActivity();
          return;
        }

        const lastActive = parseInt(lastActiveStr, 10);
        if (!isNaN(lastActive) && Date.now() - lastActive >= IDLE_TIMEOUT_MS) {
          // Sesi idle kadaluarsa -> logout otomatis
          logoutUser(true);

          // Jika berada di rute privat, arahkan ke halaman masuk
          if (pathname?.startsWith("/laporan-saya")) {
            router.push("/masuk?session_expired=1");
          }
        }
      } catch (err) {
        console.warn("Gagal mengecek idle session timeout:", err);
      }
    };

    // Handler event interaksi pengguna
    const handleUserActivity = () => {
      // Hanya rekam jika pengguna sedang dalam status login
      const userRaw = localStorage.getItem(USER_STORAGE_KEY);
      if (userRaw) {
        recordUserActivity();
      }
    };

    // Pasang listener interaksi dengan opsi passive agar performa rendering 60 FPS tetap maksimal
    const eventOptions: AddEventListenerOptions = { passive: true };
    const activityEvents = [
      "mousedown",
      "mousemove",
      "keydown",
      "touchstart",
      "scroll",
      "click",
    ];

    activityEvents.forEach((evt) => {
      window.addEventListener(evt, handleUserActivity, eventOptions);
    });

    // Pengecekan berkala setiap 30 detik
    const intervalId = window.setInterval(checkIdleTimeout, 30000);

    // Cek langsung saat tab browser kembali aktif (pengguna beralih tab atau menghidupkan layar hp)
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        checkIdleTimeout();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", checkIdleTimeout);

    // Initial check saat mount
    checkIdleTimeout();

    return () => {
      activityEvents.forEach((evt) => {
        window.removeEventListener(evt, handleUserActivity);
      });
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", checkIdleTimeout);
    };
  }, [pathname, router]);

  return null;
}

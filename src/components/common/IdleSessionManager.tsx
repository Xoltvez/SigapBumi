"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  recordUserActivity,
  logoutUser,
  IDLE_TIMEOUT_MS,
  LAST_ACTIVITY_KEY,
  type UserSession,
} from "@/lib/auth";
import { showToast } from "@/components/ui/Toast";

const USER_STORAGE_KEY = "sigapbumi_current_user";

/**
 * IdleSessionManager
 * 1. Memantau aktivitas interaksi warga (klik, ketik, scroll, touch, gerak mouse).
 *    Jika tidak ada aktivitas selama 1 jam (IDLE_TIMEOUT_MS), akun otomatis di-logout.
 * 2. Mengirim heartbeat berkala ke server untuk memastikan sesi email tetap unik & aktif.
 *    Jika email dimasuki di sesi lain, sesi di tab ini otomatis dinonaktifkan.
 */
export function IdleSessionManager() {
  const router = useRouter();
  const pathname = usePathname();
  const lastHeartbeatRef = useRef<number>(0);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Fungsi verifikasi heartbeat ke server
    const sendHeartbeat = async () => {
      try {
        const userRaw = localStorage.getItem(USER_STORAGE_KEY);
        if (!userRaw) return;
        const user: UserSession = JSON.parse(userRaw);
        if (!user.email || !user.sessionId) return;

        const now = Date.now();
        // Throttle heartbeat minimal interval 45 detik
        if (now - lastHeartbeatRef.current < 45000) return;
        lastHeartbeatRef.current = now;

        const res = await fetch("/api/auth/active-session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "heartbeat",
            email: user.email,
            sessionId: user.sessionId,
            userId: user.id,
            userName: user.full_name,
          }),
        });

        if (res.ok) {
          const json = await res.json();
          if (json.valid === false) {
            // Sesi konflik / telah digantikan di perangkat lain
            logoutUser();
            showToast(
              "Sesi Dinonaktifkan",
              "Akun Anda telah dinonaktifkan karena email ini digunakan di sesi atau perangkat lain.",
              "warning"
            );
            if (pathname?.startsWith("/laporan-saya")) {
              router.push("/masuk?conflict=1");
            }
          }
        }
      } catch (err) {
        // Network error diabaikan agar tidak mengganggu pengalaman offline
      }
    };

    // Fungsi pengecekan apakah sesi telah melewati batas idle timeout
    const checkIdleTimeout = () => {
      try {
        const userRaw = localStorage.getItem(USER_STORAGE_KEY);
        if (!userRaw) return; // Pengguna belum login, abaikan

        const lastActiveStr = localStorage.getItem(LAST_ACTIVITY_KEY);
        if (!lastActiveStr) {
          // Inisialisasi awal jika belum tercatat
          recordUserActivity();
          sendHeartbeat();
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
          return;
        }

        // Jalankan heartbeat berkala jika masih aktif
        sendHeartbeat();
      } catch (err) {
        console.warn("Gagal mengecek idle session timeout:", err);
      }
    };

    // Handler event interaksi pengguna
    const handleUserActivity = () => {
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

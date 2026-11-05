"use client";

export interface AdminAuthSession {
  nip: string;
  name: string;
  email: string;
  unit: string;
  unitName: string;
  role: string;
  loginAt: string;
}

export const ADMIN_AUTH_KEY = "sigapbumi_admin_auth";
export const ADMIN_SESSION_TOKEN_KEY = "sigapbumi_admin_session_token";
export const ADMIN_LAST_ACTIVITY_KEY = "sigapbumi_admin_last_activity";
export const DEFAULT_IDLE_TIMEOUT_MINUTES = 15;

/**
 * Memeriksa apakah sesi admin saat ini valid dan aktif.
 * Mengembalikan null jika:
 * 1. Pengguna keluar/menutup browser/tab (sessionStorage token hilang).
 * 2. Tidak ada data sesi yang tersimpan.
 * 3. Waktu idle melebihi batas (inactivity timeout).
 */
export function getAdminSession(timeoutMinutes: number = DEFAULT_IDLE_TIMEOUT_MINUTES): AdminAuthSession | null {
  if (typeof window === "undefined") return null;

  try {
    // 1. Verifikasi penanda sesi browser (hilang otomatis saat tab/browser ditutup)
    const sessionToken = sessionStorage.getItem(ADMIN_SESSION_TOKEN_KEY);
    if (!sessionToken) {
      // Tab/browser pernah ditutup atau dibuka dari jendela baru tanpa sesi aktif
      clearAdminSession();
      return null;
    }

    // 2. Baca data sesi dari sessionStorage (utama) atau localStorage (sinkron)
    const raw = sessionStorage.getItem(ADMIN_AUTH_KEY) || localStorage.getItem(ADMIN_AUTH_KEY);
    if (!raw) {
      clearAdminSession();
      return null;
    }

    // 3. Verifikasi waktu inaktivitas (Idle Check)
    const lastActivityStr = sessionStorage.getItem(ADMIN_LAST_ACTIVITY_KEY) || localStorage.getItem(ADMIN_LAST_ACTIVITY_KEY);
    if (lastActivityStr) {
      const lastActivity = parseInt(lastActivityStr, 10);
      if (!isNaN(lastActivity)) {
        const elapsedMinutes = (Date.now() - lastActivity) / (60 * 1000);
        if (elapsedMinutes >= timeoutMinutes) {
          // Melebihi batas idle -> logout otomatis
          clearAdminSession();
          return null;
        }
      }
    }

    const session = JSON.parse(raw) as AdminAuthSession;
    return session;
  } catch (err) {
    console.warn("Gagal memvalidasi sesi admin:", err);
    clearAdminSession();
    return null;
  }
}

/**
 * Menyimpan data login sesi admin baru.
 * Menggunakan sessionStorage agar otomatis terhapus saat pengguna keluar dari website (menutup tab/browser).
 */
export function setAdminSession(session: AdminAuthSession): void {
  if (typeof window === "undefined") return;

  try {
    const token = `adm_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    const now = Date.now().toString();

    // Sesi aktif browser
    sessionStorage.setItem(ADMIN_SESSION_TOKEN_KEY, token);
    sessionStorage.setItem(ADMIN_AUTH_KEY, JSON.stringify(session));
    sessionStorage.setItem(ADMIN_LAST_ACTIVITY_KEY, now);

    // Sinkronisasi pendukung untuk tab dalam sesi yang sama
    localStorage.setItem(ADMIN_AUTH_KEY, JSON.stringify(session));
    localStorage.setItem(ADMIN_LAST_ACTIVITY_KEY, now);
  } catch (err) {
    console.warn("Gagal menyimpan sesi admin:", err);
  }
}

/**
 * Memperbarui timestamp aktivitas terakhir pengguna (mouse, keyboard, scroll, sentuhan).
 */
export function updateAdminActivity(): void {
  if (typeof window === "undefined") return;

  try {
    const now = Date.now().toString();
    sessionStorage.setItem(ADMIN_LAST_ACTIVITY_KEY, now);
    localStorage.setItem(ADMIN_LAST_ACTIVITY_KEY, now);
  } catch {
    // Abaikan jika storage penuh/private mode
  }
}

/**
 * Mengambil selisih milidetik tersisa sebelum waktu idle habis.
 * Mengembalikan angka positif (ms tersisa) atau 0/negatif jika sudah expired.
 */
export function getTimeUntilIdleExpire(timeoutMinutes: number = DEFAULT_IDLE_TIMEOUT_MINUTES): number {
  if (typeof window === "undefined") return 0;

  try {
    const lastActivityStr = sessionStorage.getItem(ADMIN_LAST_ACTIVITY_KEY) || localStorage.getItem(ADMIN_LAST_ACTIVITY_KEY);
    if (!lastActivityStr) return 0;

    const lastActivity = parseInt(lastActivityStr, 10);
    if (isNaN(lastActivity)) return 0;

    const maxIdleMs = timeoutMinutes * 60 * 1000;
    const elapsed = Date.now() - lastActivity;
    return Math.max(0, maxIdleMs - elapsed);
  } catch {
    return 0;
  }
}

/**
 * Menghapus seluruh jejak autentikasi admin di sessionStorage & localStorage.
 */
export function clearAdminSession(): void {
  if (typeof window === "undefined") return;

  try {
    sessionStorage.removeItem(ADMIN_SESSION_TOKEN_KEY);
    sessionStorage.removeItem(ADMIN_AUTH_KEY);
    sessionStorage.removeItem(ADMIN_LAST_ACTIVITY_KEY);

    localStorage.removeItem(ADMIN_AUTH_KEY);
    localStorage.removeItem(ADMIN_LAST_ACTIVITY_KEY);
  } catch (err) {
    console.warn("Gagal membersihkan sesi admin:", err);
  }
}


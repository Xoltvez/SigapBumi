/**
 * Service untuk mengelola Konfigurasi & Pengaturan Posko Siaga Bencana (Admin Settings)
 * Tersimpan di LocalStorage dengan sinkronisasi reaktif ke seluruh komponen.
 */

export interface AdminSettingsConfig {
  // Profil & Stasiun Komando Posko
  stationName: string;
  stationCode: string;
  radioFrequency: string;
  dispatchCallsign: string;
  stationLat: number;
  stationLng: number;

  // Audio & Sirene SOS Darurat
  autoPlaySiren: boolean;
  sirenVolume: number; // 0.1 - 1.0 (default 0.4)
  sirenCycles: number; // 2, 4, 8
  chimeOnNewReport: boolean;

  // Radar & Geofencing
  geofenceRadiusKm: number; // 5, 10, 25, 50, 0 (Semua)
  targetSlaMinutes: number; // target respons (e.g. 15 mnt)
  autoFilterByUnit: boolean;
  highPriorityThreshold: number; // e.g. 75

  // Integrasi & Kanal Dispatch
  enableDesktopNotifications: boolean;
  whatsappDispatcherNumber: string;
  emergencyWebhookUrl: string;
  autoAcknowledgeSos: boolean;

  // Tampilan Peta & Operasional
  defaultMapLayer: "light" | "dark" | "satellite";
  autoRefreshIntervalSec: number; // 10, 15, 30, 60
  showHeatmapDefault: boolean;

  // Mode Simulasi / Pelatihan
  simulationMode: boolean;

  // Keamanan Sesi & Auto-Logout
  sessionIdleTimeoutMinutes: number; // 5, 10, 15, 30, 60 (default 15)
  autoLogoutOnClose: boolean; // default true
}

export const DEFAULT_ADMIN_SETTINGS: AdminSettingsConfig = {
  stationName: "Pusdalops PB BPBD Posko Terpadu",
  stationCode: "POSKO-IND-01",
  radioFrequency: "143.550 MHz VHF",
  dispatchCallsign: "KOMANDO-01",
  stationLat: -6.1754,
  stationLng: 106.8272,

  autoPlaySiren: true,
  sirenVolume: 0.4,
  sirenCycles: 4,
  chimeOnNewReport: true,

  geofenceRadiusKm: 25,
  targetSlaMinutes: 15,
  autoFilterByUnit: false,
  highPriorityThreshold: 75,

  enableDesktopNotifications: true,
  whatsappDispatcherNumber: "0811-9876-5432",
  emergencyWebhookUrl: "",
  autoAcknowledgeSos: false,

  defaultMapLayer: "light",
  autoRefreshIntervalSec: 15,
  showHeatmapDefault: false,

  simulationMode: true,

  sessionIdleTimeoutMinutes: 15,
  autoLogoutOnClose: true,
};

const SETTINGS_STORAGE_KEY = "sigapbumi_admin_settings_v1";

/**
 * Mengambil pengaturan admin terkini dari LocalStorage
 */
export function getAdminSettings(): AdminSettingsConfig {
  if (typeof window === "undefined") return DEFAULT_ADMIN_SETTINGS;
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return DEFAULT_ADMIN_SETTINGS;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_ADMIN_SETTINGS, ...parsed };
  } catch {
    return DEFAULT_ADMIN_SETTINGS;
  }
}

/**
 * Menyimpan pengaturan admin baru ke LocalStorage dan broadcast custom event
 */
export function saveAdminSettings(
  updated: Partial<AdminSettingsConfig>
): AdminSettingsConfig {
  const current = getAdminSettings();
  const next: AdminSettingsConfig = { ...current, ...updated };

  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(next));
      window.dispatchEvent(new CustomEvent("sigapbumi:settings-updated", { detail: next }));
      window.dispatchEvent(new Event("storage"));
    } catch (e) {
      console.warn("Gagal menyimpan admin settings:", e);
    }
  }

  return next;
}

/**
 * Mengembalikan seluruh pengaturan ke nilai default pabrik
 */
export function resetAdminSettings(): AdminSettingsConfig {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(DEFAULT_ADMIN_SETTINGS));
      window.dispatchEvent(new CustomEvent("sigapbumi:settings-updated", { detail: DEFAULT_ADMIN_SETTINGS }));
      window.dispatchEvent(new Event("storage"));
    } catch {}
  }
  return DEFAULT_ADMIN_SETTINGS;
}

import { supabase } from "@/lib/supabase/client";
import { parsePostGISPoint } from "@/lib/geo";
import type { SosAssistanceType } from "@/types";

export interface LiveSosItem {
  id: string;
  source: string;
  assistance_type: SosAssistanceType;
  address: string;
  coordinates: string;
  lat: number;
  lng: number;
  time_ago: string;
  battery_level?: string;
  status: "aktif" | "ditangani" | "selesai";
  dispatched_team?: string;
  note?: string;
  created_at: string;
}

export const DEFAULT_MOCK_SOS: LiveSosItem[] = [
  {
    id: "sos-101",
    source: "Ponsel Warga (GPS Sensor)",
    assistance_type: "damkar",
    address: "Perumahan Citra 2 Blok B4, Kalideres, Jakarta Barat",
    coordinates: "-6.1552, 106.7231",
    lat: -6.1552,
    lng: 106.7231,
    time_ago: "1 menit lalu",
    battery_level: "34%",
    status: "aktif",
    created_at: new Date(Date.now() - 60000).toISOString(),
  },
  {
    id: "sos-102",
    source: "Ponsel Warga (GPS Sensor)",
    assistance_type: "medis",
    address: "Jalan Puncak Raya KM 82, Desa Tugu Selatan, Bogor",
    coordinates: "-6.6984, 106.9425",
    lat: -6.6984,
    lng: 106.9425,
    time_ago: "6 menit lalu",
    battery_level: "68%",
    status: "aktif",
    created_at: new Date(Date.now() - 360000).toISOString(),
  },
  {
    id: "sos-103",
    source: "Ponsel Warga (GPS Sensor)",
    assistance_type: "polisi",
    address: "Akses Jembatan Kali Sunter, Jakarta Utara",
    coordinates: "-6.1492, 106.8041",
    lat: -6.1492,
    lng: 106.8041,
    time_ago: "15 menit lalu",
    battery_level: "82%",
    status: "ditangani",
    dispatched_team: "Patroli Polsek Tanjung Priok",
    created_at: new Date(Date.now() - 900000).toISOString(),
  },
];

const LOCAL_STORAGE_SOS_KEY = "sigapbumi_sos_alerts_cache";

/**
 * Mengambil daftar sinyal SOS dari cache lokal
 */
function getLocalSosCache(): LiveSosItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_SOS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Menyimpan daftar sinyal SOS ke cache lokal
 */
function saveLocalSosCache(items: LiveSosItem[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LOCAL_STORAGE_SOS_KEY, JSON.stringify(items));
  } catch {
    // Ignore storage quota errors
  }
}

/**
 * Menghitung waktu lampau dalam bahasa Indonesia
 */
export function timeAgo(dateString: string): string {
  try {
    const past = new Date(dateString).getTime();
    const now = Date.now();
    const diffSec = Math.floor((now - past) / 1000);

    if (diffSec < 60) return "Baru saja";
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin} menit lalu`;
    const diffHour = Math.floor(diffMin / 60);
    if (diffHour < 24) return `${diffHour} jam lalu`;
    const diffDay = Math.floor(diffHour / 24);
    return `${diffDay} hari lalu`;
  } catch {
    return "Baru saja";
  }
}

/**
 * Mengirim sinyal SOS darurat dari warga ke Supabase
 */
export async function sendSosAlert(params: {
  lat: number;
  lng: number;
  assistanceType?: SosAssistanceType;
  note?: string;
  senderName?: string;
}): Promise<{ success: boolean; id?: string; error?: string }> {
  const generatedId = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `sos-${Date.now()}`;
  const nowIso = new Date().toISOString();

  const newItem: LiveSosItem = {
    id: generatedId,
    source: params.senderName || "Ponsel Warga (GPS Sensor)",
    assistance_type: params.assistanceType || "damkar",
    address: `Koordinat GPS: ${params.lat.toFixed(4)}, ${params.lng.toFixed(4)}`,
    coordinates: `${params.lat.toFixed(4)}, ${params.lng.toFixed(4)}`,
    lat: params.lat,
    lng: params.lng,
    time_ago: "Baru saja",
    battery_level: "100%",
    status: "aktif",
    note: params.note,
    created_at: nowIso,
  };

  // 1. Simpan di cache lokal terlebih dahulu agar langsung tersedia di browser
  const currentCache = getLocalSosCache();
  saveLocalSosCache([newItem, ...currentCache.filter((x) => x.id !== generatedId)]);

  // 2. Kirim ke Supabase
  try {
    const { error } = await supabase.from("sos_alerts").insert({
      id: generatedId,
      location: `POINT(${params.lng} ${params.lat})`,
      assistance_type: params.assistanceType || "damkar",
      status: "aktif",
      note: params.note || "Panggilan Darurat SOS Warga",
      created_at: nowIso,
    });

    if (error) {
      console.warn("sendSosAlert Supabase warning:", error.message);
    }
  } catch (err) {
    console.warn("sendSosAlert network error:", err);
  }

  return { success: true, id: generatedId };
}

/**
 * Mengambil daftar panggilan SOS live dari Supabase dan sinkron dengan mock/cache
 */
export async function fetchLiveSosAlerts(): Promise<LiveSosItem[]> {
  const localItems = getLocalSosCache();
  let supabaseItems: LiveSosItem[] = [];

  try {
    const { data, error } = await supabase
      .from("sos_alerts")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data && data.length > 0) {
      supabaseItems = data.map((row) => {
        const coords = parsePostGISPoint(row.location) || { lat: -6.155, lng: 106.723 };
        return {
          id: row.id,
          source: "Ponsel Warga (GPS Sensor)",
          assistance_type: (row.assistance_type as SosAssistanceType) || "damkar",
          address: row.note ? `${row.note}` : `Lokasi GPS (${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)})`,
          coordinates: `${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`,
          lat: coords.lat,
          lng: coords.lng,
          time_ago: timeAgo(row.created_at),
          battery_level: "85%",
          status: (row.status as "aktif" | "ditangani" | "selesai") || "aktif",
          dispatched_team: row.acknowledged_by || undefined,
          note: row.note || undefined,
          created_at: row.created_at,
        };
      });
    }
  } catch (err) {
    console.warn("fetchLiveSosAlerts Supabase error:", err);
  }

  // Gabungkan hasil: Supabase live + Local Cache + Default Mock
  const mergedMap = new Map<string, LiveSosItem>();

  // 1. Masukkan default mock
  DEFAULT_MOCK_SOS.forEach((item) => mergedMap.set(item.id, item));

  // 2. Timpa dengan local items
  localItems.forEach((item) => mergedMap.set(item.id, item));

  // 3. Timpa dengan supabase items (ground truth jika ada)
  supabaseItems.forEach((item) => mergedMap.set(item.id, item));

  return Array.from(mergedMap.values()).sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

/**
 * Memperbarui status penanganan panggilan SOS (Tugaskan Tim atau Selesaikan)
 */
export async function updateSosAlertStatus(
  id: string,
  newStatus: "aktif" | "ditangani" | "selesai",
  dispatchedTeam?: string
): Promise<{ success: boolean; error?: string }> {
  // Update local cache
  const localItems = getLocalSosCache();
  const existing = localItems.find((x) => x.id === id);
  if (existing) {
    existing.status = newStatus;
    if (dispatchedTeam) existing.dispatched_team = dispatchedTeam;
    saveLocalSosCache(localItems);
  } else {
    // Cari dari default mock jika belum di cache
    const mockFound = DEFAULT_MOCK_SOS.find((x) => x.id === id);
    if (mockFound) {
      const updated = {
        ...mockFound,
        status: newStatus,
        dispatched_team: dispatchedTeam || mockFound.dispatched_team,
      };
      saveLocalSosCache([updated, ...localItems]);
    }
  }

  // Coba update ke Supabase
  try {
    const updatePayload: Record<string, unknown> = {
      status: newStatus,
    };
    if (newStatus === "ditangani" && dispatchedTeam) {
      updatePayload.acknowledged_by = dispatchedTeam;
      updatePayload.acknowledged_at = new Date().toISOString();
    }
    if (newStatus === "selesai") {
      updatePayload.resolved_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from("sos_alerts")
      .update(updatePayload)
      .eq("id", id);

    if (error) {
      console.warn("updateSosAlertStatus Supabase warning:", error.message);
    }
  } catch (err) {
    console.warn("updateSosAlertStatus network error:", err);
  }

  return { success: true };
}

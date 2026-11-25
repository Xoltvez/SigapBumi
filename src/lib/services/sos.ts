import { supabase } from "@/lib/supabase/client";
import { parsePostGISPoint } from "@/lib/geo";
import type { SosAssistanceType } from "@/types";
import {
  removeEmojis,
  saveLocalReport,
  getLocalReports,
  registerMyReportTrackingCode,
  cleanReportDescription,
  updateReportStatusLive,
} from "@/lib/services/reports";
import { getCurrentUser } from "@/lib/auth";

export interface LiveSosItem {
  id: string;
  tracking_code?: string;
  source: string;
  assistance_type: SosAssistanceType;
  address: string;
  coordinates: string;
  lat: number;
  lng: number;
  time_ago: string;
  battery_level?: string;
  status: "aktif" | "ditangani" | "selesai" | "palsu";
  phone_number?: string;
  photo_url?: string;
  dispatched_team?: string;
  note?: string;
  created_at: string;
}

export const DEFAULT_MOCK_SOS: LiveSosItem[] = [];

const LOCAL_STORAGE_SOS_KEY = "sigapbumi_sos_alerts_cache";

/**
 * Mengambil daftar sinyal SOS dari cache lokal (hanya data riil dari warga)
 */
function getLocalSosCache(): LiveSosItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_SOS_KEY);
    if (!raw) return [];
    const parsed: LiveSosItem[] = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const deleted = getDeletedSosIds();
    return parsed.filter(
      (s) =>
        s &&
        !deleted.has(s.id) &&
        !s.id.startsWith("sos-10") &&
        s.id !== "sos-1" &&
        s.id !== "sos-2" &&
        s.id !== "sos-sample" &&
        !s.address?.includes("Citra 2")
    );
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

export const LOCAL_STORAGE_DELETED_SOS_KEY = "sigapbumi_deleted_sos";

const PURGED_SOS_LEGACY_IDS = new Set([
  "f7257756-b1ae-48d9-8e49-1f3bf6bd14d7",
  "57735c09-b0e8-45a5-8e74-bfb4f530a68f",
  "SOS-7111",
  "SOS-9233",
]);

/**
 * Mengambil ID sinyal SOS yang telah dihapus oleh admin
 */
export function getDeletedSosIds(): Set<string> {
  const baseSet = new Set(PURGED_SOS_LEGACY_IDS);
  if (typeof window === "undefined") return baseSet;
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_DELETED_SOS_KEY);
    if (raw) {
      const parsed: string[] = JSON.parse(raw);
      parsed.forEach((id) => baseSet.add(id));
    }
    return baseSet;
  } catch {
    return baseSet;
  }
}

/**
 * Menandai sinyal SOS sebagai dihapus pada cache lokal
 */
export function markSosAsDeleted(id: string): void {
  if (typeof window === "undefined") return;
  try {
    const current = getDeletedSosIds();
    current.add(id);
    localStorage.setItem(LOCAL_STORAGE_DELETED_SOS_KEY, JSON.stringify(Array.from(current)));
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

function generateUUID(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
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
  phoneNumber?: string;
  photoUrl?: string;
}): Promise<{ success: boolean; id: string; trackingCode: string; error?: string }> {
  const generatedId = generateUUID();
  const nowIso = new Date().toISOString();
  const trackingCode = `SOS-${Date.now().toString().slice(-4)}`;

  const noteParts = [
    `[Kode: ${trackingCode}]`,
    params.note || "Panggilan Darurat SOS Warga (Realtime)",
    params.phoneNumber ? `[Kontak: ${params.phoneNumber}]` : "",
    params.photoUrl ? `[Foto: ${params.photoUrl}]` : "",
  ].filter(Boolean);
  const formattedNote = noteParts.join(" ");

  const newItem: LiveSosItem = {
    id: generatedId,
    tracking_code: trackingCode,
    source: params.senderName || "Ponsel Warga (GPS Sensor)",
    assistance_type: params.assistanceType || "damkar",
    address: `Koordinat GPS: ${params.lat.toFixed(4)}, ${params.lng.toFixed(4)}`,
    coordinates: `${params.lat.toFixed(4)}, ${params.lng.toFixed(4)}`,
    lat: params.lat,
    lng: params.lng,
    time_ago: "Baru saja",
    battery_level: "100%",
    status: "aktif",
    phone_number: params.phoneNumber,
    photo_url: params.photoUrl,
    note: formattedNote,
    created_at: nowIso,
  };

  // 1. Simpan di cache lokal terlebih dahulu agar langsung tersedia di browser
  const currentCache = getLocalSosCache();
  saveLocalSosCache([newItem, ...currentCache.filter((x) => x.id !== generatedId)]);

  // Dispatch custom event & storage event agar tab lain/admin langsung reaktif seketika
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("sigapbumi:sos-created", { detail: newItem }));
    window.dispatchEvent(new Event("storage"));
  }

  const currentUser = typeof window !== "undefined" ? getCurrentUser() : null;
  const isUuid = Boolean(
    currentUser?.id &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(currentUser.id)
  );
  const disasterType =
    params.assistanceType === "damkar"
      ? "kebakaran"
      : params.assistanceType === "medis"
      ? "lainnya"
      : params.assistanceType === "polisi"
      ? "lainnya"
      : "banjir";
  const sosTitle = `PANGGILAN DARURAT SOS (${(params.assistanceType || "damkar").toUpperCase()})`;
  const sosAddress = `Titik Darurat Warga (${params.lat.toFixed(4)}, ${params.lng.toFixed(4)})`;

  // 2. Kirim via server API /api/sos (menggunakan Service Role agar tidak terblokir RLS)
  let savedViaApi = false;
  try {
    const apiRes = await fetch("/api/sos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: generatedId,
        tracking_code: trackingCode,
        lat: params.lat,
        lng: params.lng,
        assistance_type: params.assistanceType || "damkar",
        note: formattedNote,
        photo_url: params.photoUrl,
        disaster_type: disasterType,
        title: sosTitle,
        description: formattedNote,
        address: sosAddress,
        reporter_id: isUuid && currentUser ? currentUser.id : undefined,
        created_at: nowIso,
      }),
    });
    if (apiRes.ok) {
      const apiJson = await apiRes.json();
      if (apiJson?.success) savedViaApi = true;
    }
  } catch (err) {
    console.warn("sendSosAlert /api/sos warning:", err);
  }

  // Fallback direct Supabase client jika API server gagal
  if (!savedViaApi) {
    try {
      const { error: sosError } = await supabase.from("sos_alerts").insert({
        id: generatedId,
        location: `POINT(${params.lng} ${params.lat})`,
        assistance_type: params.assistanceType || "damkar",
        status: "aktif",
        note: formattedNote,
        created_at: nowIso,
      });
      if (sosError) {
        console.warn("sendSosAlert sos_alerts info:", sosError.message);
      }
    } catch (err) {
      console.warn("sendSosAlert sos_alerts network error:", err);
    }

    if (params.photoUrl) {
      try {
        const { error: mediaErr } = await supabase.from("report_media").insert({
          report_id: generatedId,
          media_url: params.photoUrl,
          media_type: "image",
          created_at: nowIso,
        });
        if (mediaErr) {
          console.warn("sendSosAlert report_media insert error:", mediaErr.message);
        }
      } catch (err) {
        console.warn("sendSosAlert report_media exception:", err);
      }
    }

    try {
      const reportInsertPayload: Record<string, unknown> = {
        id: generatedId,
        tracking_code: trackingCode,
        disaster_type: disasterType,
        title: sosTitle,
        description: formattedNote,
        location: `POINT(${params.lng} ${params.lat})`,
        address: sosAddress,
        status: "diterima",
        confirmation_count: 1,
        priority_score: 99,
        created_at: nowIso,
        updated_at: nowIso,
      };

      if (isUuid && currentUser) {
        reportInsertPayload.reporter_id = currentUser.id;
      }

      const { error: repError } = await supabase.from("reports").insert(reportInsertPayload);
      if (repError) {
        console.warn("sendSosAlert reports insert info:", repError.message);
      }
    } catch (err) {
      console.warn("sendSosAlert reports network error:", err);
    }
  }

  // Daftarkan kode tracking ini sebagai laporan yang diajukan oleh browser/user ini
  registerMyReportTrackingCode(trackingCode, currentUser?.email);

  try {
    saveLocalReport({
      id: generatedId,
      tracking_code: trackingCode,
      disaster_type: disasterType,
      target_agency: params.assistanceType || "damkar",
      title: sosTitle,
      description: cleanReportDescription(formattedNote),
      address: sosAddress,
      lat: params.lat,
      lng: params.lng,
      status: "diterima",
      priority: "kritis",
      priority_label: "Kritis",
      confirmation_count: 1,
      image_url: params.photoUrl,
      phone_number: params.phoneNumber,
      created_at: "Baru saja",
      is_demo: false,
      reporter_id: currentUser?.id,
      user_email: currentUser?.email,
    });
  } catch {}

  return { success: true, id: generatedId, trackingCode };
}

/**
 * Memperbarui nomor telepon kontak pada sinyal SOS aktif
 */
export async function updateSosPhone(
  id: string,
  phoneNumber: string
): Promise<{ success: boolean }> {
  const localItems = getLocalSosCache();
  const existing = localItems.find((x) => x.id === id);
  if (existing) {
    existing.phone_number = phoneNumber;
    if (!existing.note?.includes("[Kontak:")) {
      existing.note = `${existing.note || "Panggilan Darurat SOS Warga"} [Kontak: ${phoneNumber}]`;
    }
    saveLocalSosCache(localItems);
  }

  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("storage"));
  }

  try {
    const formattedNote = `Panggilan Darurat SOS Warga [Kontak: ${phoneNumber}]`;
    await supabase
      .from("sos_alerts")
      .update({ note: formattedNote })
      .eq("id", id);
  } catch (err) {
    console.warn("updateSosPhone sos_alerts network error:", err);
  }

  try {
    const formattedNote = `Panggilan Darurat SOS Warga [Kontak: ${phoneNumber}]`;
    await supabase
      .from("reports")
      .update({ description: formattedNote, updated_at: new Date().toISOString() })
      .eq("id", id);
  } catch (err) {
    console.warn("updateSosPhone reports network error:", err);
  }

  return { success: true };
}

/**
 * Memperbarui jenis bantuan pada sinyal SOS aktif yang sudah terkirim (tanpa membuat duplikasi)
 */
export async function updateSosAssistanceType(
  id: string,
  assistanceType: SosAssistanceType
): Promise<{ success: boolean }> {
  // 1. Update di local cache
  const localItems = getLocalSosCache();
  const existing = localItems.find((x) => x.id === id);
  if (existing) {
    existing.assistance_type = assistanceType;
    existing.note = `Panggilan Darurat Warga - Butuh Bantuan ${assistanceType.toUpperCase()}${
      existing.phone_number ? ` [Kontak: ${existing.phone_number}]` : ""
    }`;
    saveLocalSosCache(localItems);
  }

  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("storage"));
    window.dispatchEvent(new CustomEvent("sigapbumi:sos-updated", { detail: { id, assistanceType } }));
  }

  // 2. Update di tabel sos_alerts
  try {
    await supabase
      .from("sos_alerts")
      .update({
        assistance_type: assistanceType,
        note: existing?.note || `Panggilan Darurat Warga - Butuh Bantuan ${assistanceType.toUpperCase()}`,
      })
      .eq("id", id);
  } catch (err) {
    console.warn("updateSosAssistanceType sos_alerts error:", err);
  }

  // 3. Update di tabel reports
  try {
    const disasterType =
      assistanceType === "damkar"
        ? "kebakaran"
        : assistanceType === "medis"
        ? "lainnya"
        : assistanceType === "polisi"
        ? "lainnya"
        : "banjir";

    await supabase
      .from("reports")
      .update({
        disaster_type: disasterType,
        title: `PANGGILAN DARURAT SOS (${assistanceType.toUpperCase()})`,
        description: existing?.note || `Panggilan Darurat Warga - Butuh Bantuan ${assistanceType.toUpperCase()}`,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);
  } catch (err) {
    console.warn("updateSosAssistanceType reports error:", err);
  }

  return { success: true };
}

/**
 * Memperbarui titik koordinat GPS pada sinyal SOS aktif (auto-refine setelah GPS lock)
 */
export async function updateSosLocation(
  id: string,
  lat: number,
  lng: number,
  accuracy?: number
): Promise<{ success: boolean }> {
  const localItems = getLocalSosCache();
  const existing = localItems.find((x) => x.id === id);
  const formattedCoords = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  const formattedAddress = `Koordinat GPS: ${formattedCoords}${
    accuracy ? ` (±${Math.round(accuracy)}m)` : ""
  }`;

  if (existing) {
    existing.lat = lat;
    existing.lng = lng;
    existing.coordinates = formattedCoords;
    existing.address = formattedAddress;
    saveLocalSosCache(localItems);
  }

  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("storage"));
    window.dispatchEvent(
      new CustomEvent("sigapbumi:sos-updated", {
        detail: { id, lat, lng, coordinates: formattedCoords, address: formattedAddress },
      })
    );
  }

  // 1. Update di tabel sos_alerts
  try {
    await supabase
      .from("sos_alerts")
      .update({
        location: `POINT(${lng} ${lat})`,
      })
      .eq("id", id);
  } catch (err) {
    console.warn("updateSosLocation sos_alerts error:", err);
  }

  // 2. Update di tabel reports
  try {
    await supabase
      .from("reports")
      .update({
        location: `POINT(${lng} ${lat})`,
        address: formattedAddress,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);
  } catch (err) {
    console.warn("updateSosLocation reports error:", err);
  }

  return { success: true };
}


let cachedLiveSosAlerts: LiveSosItem[] | null = null;
let cachedLiveSosAlertsTime = 0;
let inFlightSosPromise: Promise<LiveSosItem[]> | null = null;
const SOS_CACHE_TTL_MS = 12000; // Cache in-memory 12 detik

export function getCachedLiveSosAlerts(): LiveSosItem[] | null {
  return cachedLiveSosAlerts;
}

export function invalidateLiveSosCache(): void {
  cachedLiveSosAlerts = null;
  cachedLiveSosAlertsTime = 0;
  inFlightSosPromise = null;
}

/**
 * Mengambil daftar panggilan SOS live dari Supabase dan sinkron dengan mock/cache
 */
export async function fetchLiveSosAlerts(forceRefresh = false): Promise<LiveSosItem[]> {
  // SWR: Jika data cache memori masih segar (< 12 detik) dan tidak dipaksa refresh, kembalikan seketika (0ms)
  if (!forceRefresh && cachedLiveSosAlerts && Date.now() - cachedLiveSosAlertsTime < SOS_CACHE_TTL_MS) {
    return cachedLiveSosAlerts;
  }

  // Deduplikasi panggilan paralel
  if (inFlightSosPromise) {
    return inFlightSosPromise;
  }

  inFlightSosPromise = (async () => {
    const localItems = getLocalSosCache();
    let supabaseItems: LiveSosItem[] = [];

    // 1 & 2. Ambil dari server API /api/sos (Service Role) + fallback client Supabase
    try {
      let sosRowsData: any[] | null = null;
      let repRowsData: any[] | null = null;

      if (typeof window !== "undefined") {
        try {
          const apiRes = await fetch("/api/sos", { cache: "no-store" });
          if (apiRes.ok) {
            const apiJson = await apiRes.json();
            if (apiJson?.success) {
              sosRowsData = apiJson.sosAlerts || [];
              repRowsData = apiJson.reports || [];
            }
          }
        } catch {}
      }

      if (sosRowsData === null || repRowsData === null) {
        const [sosRes, repRes] = await Promise.all([
          supabase
            .from("sos_alerts")
            .select("*")
            .order("created_at", { ascending: false }),
          supabase
            .from("reports")
            .select("*, report_media(*)")
            .or("tracking_code.ilike.SOS-%,title.ilike.%SOS%")
            .order("created_at", { ascending: false }),
        ]);
        if (sosRowsData === null && !sosRes.error) sosRowsData = sosRes.data || [];
        if (repRowsData === null && !repRes.error) repRowsData = repRes.data || [];
      }

      const data = sosRowsData;
      if (data && data.length > 0) {
        supabaseItems = data.map((row) => {
          const coords = parsePostGISPoint(row.location) || { lat: -6.155, lng: 106.723 };
          const phoneMatch = row.note ? (row.note as string).match(/\[Kontak:\s*([^\]]+)\]/) : null;
          const extractedPhone = phoneMatch ? phoneMatch[1].trim() : undefined;
          const photoMatch = row.note ? (row.note as string).match(/\[Foto:\s*([^\]]+)\]/) : null;
          const extractedPhoto = photoMatch ? photoMatch[1].trim() : (row.photo_url || undefined);
          const codeMatch = row.note ? (row.note as string).match(/\[Kode:\s*([^\]]+)\]/) : null;
          const extractedCode = codeMatch ? codeMatch[1].trim() : (row.note ? (row.note as string).match(/SOS-\d+/)?.[0] : undefined);

          const isHoax = Boolean(
            (row as any).closing_note?.includes("HOAKS") ||
            (row as any).closing_note?.includes("PALSU") ||
            row.note?.includes("HOAKS") ||
            row.note?.includes("PALSU") ||
            row.status === "palsu"
          );
          const statusVal: "aktif" | "ditangani" | "selesai" | "palsu" = isHoax
            ? "palsu"
            : (row.status as "aktif" | "ditangani" | "selesai") || "aktif";

          return {
            id: row.id,
            tracking_code: extractedCode,
            source: "Ponsel Warga (GPS Sensor)",
            assistance_type: (row.assistance_type as SosAssistanceType) || "damkar",
            address: row.note ? `${row.note.replace(/\[(Kontak|Foto|Kode):[^\]]+\]/g, "").trim()}` : `Lokasi GPS (${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)})`,
            coordinates: `${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`,
            lat: coords.lat,
            lng: coords.lng,
            time_ago: timeAgo(row.created_at),
            battery_level: "85%",
            status: statusVal,
            phone_number: extractedPhone,
            photo_url: extractedPhoto,
            dispatched_team: row.acknowledged_by || undefined,
            note: row.note || undefined,
            created_at: row.created_at,
          };
        });
      }

      const repData = repRowsData;
      if (repData && repData.length > 0) {
      repData.forEach((row) => {
        // Cek apakah sinyal SOS ini sudah ada di supabaseItems agar tidak duplikat
        const existingIdx = supabaseItems.findIndex(
          (item) => item.id === row.id || (item.tracking_code && row.tracking_code && item.tracking_code === row.tracking_code) || (item.note && row.tracking_code && item.note.includes(row.tracking_code))
        );

        const coords = parsePostGISPoint(row.location) || { lat: -6.2088, lng: 106.8456 };
        const phoneMatch = row.description ? (row.description as string).match(/\[Kontak:\s*([^\]]+)\]/) : null;
        const extractedPhone = phoneMatch ? phoneMatch[1].trim() : undefined;

        const photoMatch = row.description ? (row.description as string).match(/\[Foto:\s*([^\]]+)\]/) : null;
        const mediaPhoto = Array.isArray(row.report_media) && row.report_media.length > 0 ? row.report_media[0].media_url : undefined;
        const extractedPhoto = mediaPhoto || (photoMatch ? photoMatch[1].trim() : undefined) || row.image_url || undefined;

        if (existingIdx >= 0) {
          const existing = supabaseItems[existingIdx];
          // Sinkronkan tracking_code jika belum ada
          if (!existing.tracking_code && row.tracking_code) {
            existing.tracking_code = row.tracking_code;
          }
          // Sinkronisasi status dua arah (jika di data laporan sudah berubah, monitor SOS otomatis mengikuti)
          if (row.status === "ditindaklanjuti") {
            existing.status = "ditangani";
          } else if (row.status === "selesai") {
            existing.status = "selesai";
          } else if (row.status === "ditolak") {
            existing.status = "palsu";
          } else if (row.status === "diterima" && existing.status !== "ditangani" && existing.status !== "selesai") {
            existing.status = "aktif";
          }
          // Gabungkan foto & kontak jika item yang ada belum lengkap
          if (!existing.photo_url && extractedPhoto) {
            existing.photo_url = extractedPhoto;
          }
          if (!existing.phone_number && extractedPhone) {
            existing.phone_number = extractedPhone;
          }
          return;
        }

        let aType: SosAssistanceType = "bnpb_bpbd";
        const titleUpper = (row.title || "").toUpperCase();
        if (titleUpper.includes("DAMKAR") || row.disaster_type === "kebakaran" || row.disaster_type === "karhutla") {
          aType = "damkar";
        } else if (titleUpper.includes("MEDIS") || titleUpper.includes("KESEHATAN") || titleUpper.includes("AMBULANS")) {
          aType = "medis";
        } else if (titleUpper.includes("POLISI") || titleUpper.includes("KEAMANAN")) {
          aType = "polisi";
        } else if (titleUpper.includes("BNPB") || titleUpper.includes("BPBD") || titleUpper.includes("EVAKUASI") || titleUpper.includes("SAR")) {
          aType = "bnpb_bpbd";
        }

        supabaseItems.push({
          id: row.id,
          tracking_code: row.tracking_code,
          source: "Ponsel Warga (GPS Sensor)",
          assistance_type: aType,
          address: row.address || `Koordinat GPS (${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)})`,
          coordinates: `${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`,
          lat: coords.lat,
          lng: coords.lng,
          time_ago: timeAgo(row.created_at),
          battery_level: "95%",
          status: row.status === "selesai" ? "selesai" : row.status === "ditindaklanjuti" ? "ditangani" : row.status === "ditolak" ? "palsu" : "aktif",
          phone_number: extractedPhone,
          photo_url: extractedPhoto,
          note: row.description || undefined,
          created_at: row.created_at,
        });
      });
    }
  } catch (err) {
    console.warn("fetchLiveSosAlerts from reports error:", err);
  }

  // Gabungkan hasil: Supabase live + Local Cache
  const mergedMap = new Map<string, LiveSosItem>();

  const localReports = getLocalReports();
  const reportImageMap = new Map<string, string>();
  localReports.forEach((r) => {
    if (r.image_url) {
      reportImageMap.set(r.id, r.image_url);
      reportImageMap.set(r.tracking_code, r.image_url);
    }
  });

  // 1. Masukkan sinyal dari local cache (sebagai baseline awal)
  localItems.forEach((item) => {
    if (item && item.id) {
      const fallbackPhoto = reportImageMap.get(item.id);
      mergedMap.set(item.id, {
        ...item,
        photo_url: item.photo_url || fallbackPhoto,
      });
    }
  });

  // 2. TIMPA DENGAN DATA SUPABASE PUSAT (Supabase adalah Single Source of Truth utama antar-browser!)
  supabaseItems.forEach((item) => {
    if (item && item.id) {
      const prev = mergedMap.get(item.id);
      const fallbackPhoto = reportImageMap.get(item.id);
      mergedMap.set(item.id, {
        ...(prev || {}),
        ...item,
        photo_url: item.photo_url || prev?.photo_url || fallbackPhoto,
        phone_number: item.phone_number || prev?.phone_number,
        // Status dari database pusat mutlak menjadi acuan utama
        status: item.status,
      });
    }
  });

  // 3. Sinkronkan kembali cache lokal di browser ini agar data lokal tidak basi
  try {
    const updatedLocal = localItems.map((local) => {
      const serverMatch = supabaseItems.find(
        (s) => s.id === local.id || (s.tracking_code && local.note?.includes(s.tracking_code))
      );
      if (serverMatch) {
        return {
          ...local,
          status: serverMatch.status,
          dispatched_team: serverMatch.dispatched_team || local.dispatched_team,
        };
      }
      return local;
    });
    saveLocalSosCache(updatedLocal);
  } catch {}

  const sorted = Array.from(mergedMap.values()).sort((a, b) => {
    const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
    const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
    return timeB - timeA;
  });

  // Hapus duplikasi sinyal yang berasal dari nomor telepon atau lokasi yang sama dalam waktu berdekatan (< 3 menit)
  const deduplicated: LiveSosItem[] = [];
  for (const item of sorted) {
    const cleanItemPhone = item.phone_number ? item.phone_number.replace(/\D/g, "") : "";
    const duplicateIdx = deduplicated.findIndex((existing) => {
      const sameId = existing.id === item.id;
      const cleanExistingPhone = existing.phone_number ? existing.phone_number.replace(/\D/g, "") : "";
      const samePhone = Boolean(cleanItemPhone && cleanExistingPhone && cleanItemPhone === cleanExistingPhone);
      const sameCoords = Math.abs(existing.lat - item.lat) < 0.001 && Math.abs(existing.lng - item.lng) < 0.001;
      const timeDiff = Math.abs(
        (new Date(existing.created_at).getTime() || 0) - (new Date(item.created_at).getTime() || 0)
      );
      return sameId || ((samePhone || sameCoords) && timeDiff < 180000);
    });

    if (duplicateIdx === -1) {
      deduplicated.push(item);
    } else {
      // Jika salah satu item memiliki foto bukti kamera valid, pertahankan foto dan status terbaik
      const existing = deduplicated[duplicateIdx];
      if (!existing.photo_url && item.photo_url) {
        deduplicated[duplicateIdx] = {
          ...item,
          status: existing.status === "aktif" ? item.status : existing.status,
        };
      }
    }
  }

    const deletedIds = getDeletedSosIds();
    const finalSos = deduplicated.filter(
      (item) =>
        !deletedIds.has(item.id) &&
        !Array.from(deletedIds).some((delId) => item.note && item.note.includes(delId))
    );

    // Simpan ke cache in-memory untuk akses instan berikutnya
    cachedLiveSosAlerts = finalSos;
    cachedLiveSosAlertsTime = Date.now();
    inFlightSosPromise = null;

    return finalSos;
  })();

  return inFlightSosPromise;
}

/**
 * Memperbarui status penanganan panggilan SOS (Tugaskan Tim, Selesaikan, atau Tandai Palsu)
 */
export async function updateSosAlertStatus(
  id: string,
  newStatus: "aktif" | "ditangani" | "selesai" | "palsu",
  dispatchedTeam?: string,
  trackingCode?: string
): Promise<{ success: boolean; error?: string }> {
  invalidateLiveSosCache();
  // Update local cache — HANYA update jika ada, jangan buat entri baru kosong
  const localItems = getLocalSosCache();
  const existingIndex = localItems.findIndex(
    (x) => x.id === id || (trackingCode && (x.tracking_code === trackingCode || x.note?.includes(trackingCode)))
  );
  if (existingIndex >= 0) {
    localItems[existingIndex].status = newStatus;
    if (dispatchedTeam) localItems[existingIndex].dispatched_team = dispatchedTeam;
    saveLocalSosCache(localItems);
  }
  // JANGAN push item dummy baru ke cache SOS: ini yang menyebabkan laporan kosong muncul di data laporan

  // Map ke status laporan resmi: aktif -> diterima, ditangani -> ditindaklanjuti, selesai -> selesai, palsu -> ditolak
  const reportStatus: "diterima" | "diverifikasi" | "ditindaklanjuti" | "selesai" | "ditolak" =
    newStatus === "selesai" || newStatus === "palsu"
      ? (newStatus === "palsu" ? "ditolak" : "selesai")
      : newStatus === "ditangani"
      ? "ditindaklanjuti"
      : "diterima";

  const note =
    newStatus === "ditangani"
      ? "Tim operasional siaga dan unit penolong telah dikerahkan ke lokasi darurat warga."
      : newStatus === "selesai"
      ? "Penanganan panggilan darurat SOS telah selesai ditangani secara tuntas oleh posko."
      : newStatus === "palsu"
      ? "Laporan SOS ditolak (terindikasi panggilan palsu / prank)."
      : "Panggilan darurat SOS diterima oleh posko siaga.";

  // 1. Update tabel sos_alerts Supabase
  try {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
    const sosPayload: Record<string, unknown> = {
      status: newStatus === "palsu" ? "selesai" : newStatus,
    };
    if (newStatus === "selesai" || newStatus === "palsu") {
      sosPayload.resolved_at = new Date().toISOString();
    } else {
      sosPayload.resolved_at = null;
    }
    if (newStatus === "palsu") {
      sosPayload.closing_note = "HOAX / PALSU";
    }

    if (isUuid) {
      await supabase
        .from("sos_alerts")
        .update(sosPayload)
        .eq("id", id);
    }
    if (trackingCode) {
      await supabase
        .from("sos_alerts")
        .update(sosPayload)
        .ilike("note", `%${trackingCode}%`);
    }
  } catch (err) {
    console.warn("updateSosAlertStatus sos_alerts error:", err);
  }

  // 2. Sinkronkan ke tabel reports, report_status_logs, dan cache laporan warga
  try {
    await updateReportStatusLive(id, reportStatus, note, dispatchedTeam || "Tim Siaga Posko");
  } catch (err) {
    console.warn("updateReportStatusLive from sos by id error:", err);
  }

  if (trackingCode && trackingCode !== id) {
    try {
      await updateReportStatusLive(trackingCode, reportStatus, note, dispatchedTeam || "Tim Siaga Posko");
    } catch {}
  }

  // 3. Broadcast update ke seluruh tab & browser
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("storage"));
    window.dispatchEvent(
      new CustomEvent("sigapbumi:sos-updated", {
        detail: { id, trackingCode, status: newStatus },
      })
    );
    window.dispatchEvent(
      new CustomEvent("sigapbumi:report-updated", {
        detail: { id, trackingCode, status: reportStatus },
      })
    );
  }

  return { success: true };
}

/**
 * Menghapus panggilan darurat SOS secara live (Supabase, local cache, dan sinkronisasi real-time)
 */
export async function deleteSosAlertLive(
  id: string,
  actorName: string = "Petugas Pusdalops"
): Promise<{ success: boolean; error?: string }> {
  // 1. Ambil snapshot lokal sebelum dihapus untuk Kotak Sampah
  const localCache = getLocalSosCache();
  const localSnap = localCache.find((x) => x.id === id);
  const filtered = localCache.filter((x) => x.id !== id);
  saveLocalSosCache(filtered);

  // 2. Tandai di cache deleted
  markSosAsDeleted(id);

  // 3. Dispatch event agar seluruh layar dan tab segera sinkron
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("storage"));
    window.dispatchEvent(new CustomEvent("sigapbumi:sos-updated", { detail: { id } }));
    window.dispatchEvent(new CustomEvent("sigapbumi:sos-deleted", { detail: { id } }));
  }

  // 4. Arsipkan ke Kotak Sampah & hapus di backend via /api/admin/trash
  try {
    const trashRes = await fetch("/api/admin/trash", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "archive_and_delete",
        reportId: id,
        kind: "sos",
        actorName,
        clientSnapshot: localSnap
          ? {
              id: localSnap.id,
              tracking_code: localSnap.tracking_code,
              title: `Panggilan Darurat SOS (${String(localSnap.assistance_type || "darurat").toUpperCase()})`,
              address: localSnap.address,
              status: localSnap.status,
              photo_url: localSnap.photo_url,
            }
          : undefined,
      }),
    });
    if (trashRes.ok && typeof window !== "undefined") {
      const trashJson = await trashRes.json();
      if (trashJson?.archivedItems?.length > 0) {
        const prevRaw = localStorage.getItem("sigapbumi_admin_trash");
        const prev = prevRaw ? JSON.parse(prevRaw) : [];
        const archivedIds = new Set(trashJson.archivedItems.map((a: any) => a.id));
        localStorage.setItem(
          "sigapbumi_admin_trash",
          JSON.stringify([...trashJson.archivedItems, ...prev.filter((p: any) => !archivedIds.has(p.id))].slice(0, 100))
        );
        window.dispatchEvent(new CustomEvent("sigapbumi:trash-updated"));
      }
    }
  } catch (err) {
    console.warn("deleteSosAlertLive API call error:", err);
  }

  // 5. Coba langsung hapus dari Supabase
  try {
    await supabase.from("sos_alerts").delete().eq("id", id);
    await supabase.from("reports").delete().or(`id.eq.${id},tracking_code.eq.${id}`);
  } catch (err) {
    console.warn("deleteSosAlertLive Supabase error:", err);
  }

  return { success: true };
}

/**
 * Menghapus SELURUH data panggilan SOS (sos_alerts Supabase, cache lokal, dan sesi tracking)
 * dan menyimpannya terlebih dahulu ke Kotak Sampah agar dapat dipulihkan.
 */
export async function clearAllSosAlerts(): Promise<{ success: boolean; error?: string }> {
  // 1. Kosongkan local cache SOS
  saveLocalSosCache([]);

  if (typeof window !== "undefined") {
    localStorage.removeItem("sigapbumi_active_sos_tracking");
    localStorage.removeItem("sigapbumi_sos_alerts_cache");
    localStorage.removeItem("sigapbumi_deleted_sos_ids");
    window.dispatchEvent(new Event("storage"));
    window.dispatchEvent(new CustomEvent("sigapbumi:sos-updated", { detail: {} }));
    window.dispatchEvent(new CustomEvent("sigapbumi:sos-deleted", { detail: {} }));
  }

  // 2. Arsipkan seluruh SOS ke Kotak Sampah & hapus dari database
  try {
    const trashRes = await fetch("/api/admin/trash", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "archive_and_delete", clearAllSos: true, kind: "sos" }),
    });
    if (trashRes.ok && typeof window !== "undefined") {
      const trashJson = await trashRes.json();
      if (trashJson?.archivedItems?.length > 0) {
        const prevRaw = localStorage.getItem("sigapbumi_admin_trash");
        const prev = prevRaw ? JSON.parse(prevRaw) : [];
        const archivedIds = new Set(trashJson.archivedItems.map((a: any) => a.id));
        localStorage.setItem(
          "sigapbumi_admin_trash",
          JSON.stringify([...trashJson.archivedItems, ...prev.filter((p: any) => !archivedIds.has(p.id))].slice(0, 100))
        );
        window.dispatchEvent(new CustomEvent("sigapbumi:trash-updated"));
      }
    }
  } catch (err) {
    console.warn("clearAllSosAlerts API call error:", err);
  }

  // 3. Hapus langsung di Supabase client jika izin RLS tersedia
  try {
    await supabase.from("sos_alerts").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await supabase.from("reports").delete().or("tracking_code.ilike.SOS-%,title.ilike.%SOS%");
  } catch (err) {
    console.warn("clearAllSosAlerts Supabase client error:", err);
  }

  return { success: true };
}

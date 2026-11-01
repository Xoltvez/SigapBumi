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
  status: "aktif" | "ditangani" | "selesai" | "palsu";
  phone_number?: string;
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
    // Hapus data demo/mock agar hanya data darurat riil yang tersimpan
    const realOnly = parsed.filter(
      (item) =>
        item &&
        item.id &&
        !item.id.startsWith("sos-10") &&
        item.id !== "sos-1" &&
        item.id !== "sos-2" &&
        item.id !== "sos-sample" &&
        !item.address?.includes("Citra 2")
    );
    if (realOnly.length !== parsed.length) {
      localStorage.setItem(LOCAL_STORAGE_SOS_KEY, JSON.stringify(realOnly));
    }
    return realOnly;
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
}): Promise<{ success: boolean; id: string; trackingCode: string; error?: string }> {
  const generatedId = generateUUID();
  const nowIso = new Date().toISOString();
  const trackingCode = `SOS-${Date.now().toString().slice(-4)}`;

  const formattedNote = params.phoneNumber
    ? `${params.note || "Panggilan Darurat SOS Warga"} [Kontak: ${params.phoneNumber}]`
    : (params.note || "Panggilan Darurat SOS Warga");

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
    phone_number: params.phoneNumber,
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

  // 2. Kirim ke tabel sos_alerts Supabase (jika izin RLS tersedia)
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

  // 3. SELALU kirim ke tabel reports Supabase (agar realtime langsung muncul di antrean laporan & dashboard admin)
  try {
    const disasterType =
      params.assistanceType === "damkar"
        ? "kebakaran"
        : params.assistanceType === "medis"
        ? "lainnya"
        : params.assistanceType === "polisi"
        ? "lainnya"
        : "banjir";

    const { error: repError } = await supabase.from("reports").insert({
      id: generatedId,
      tracking_code: trackingCode,
      disaster_type: disasterType,
      title: `🚨 PANGGILAN DARURAT SOS (${(params.assistanceType || "damkar").toUpperCase()})`,
      description: formattedNote,
      location: `POINT(${params.lng} ${params.lat})`,
      address: `Titik Darurat Warga (${params.lat.toFixed(4)}, ${params.lng.toFixed(4)})`,
      status: "diterima",
      confirmation_count: 1,
      priority_score: 99,
      created_at: nowIso,
      updated_at: nowIso,
    });
    if (repError) {
      console.warn("sendSosAlert reports insert info:", repError.message);
    }
  } catch (err) {
    console.warn("sendSosAlert reports network error:", err);
  }

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
        title: `🚨 PANGGILAN DARURAT SOS (${assistanceType.toUpperCase()})`,
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
 * Mengambil daftar panggilan SOS live dari Supabase dan sinkron dengan mock/cache
 */
export async function fetchLiveSosAlerts(): Promise<LiveSosItem[]> {
  const localItems = getLocalSosCache();
  let supabaseItems: LiveSosItem[] = [];

  // 1. Ambil dari tabel sos_alerts
  try {
    const { data, error } = await supabase
      .from("sos_alerts")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data && data.length > 0) {
      supabaseItems = data.map((row) => {
        const coords = parsePostGISPoint(row.location) || { lat: -6.155, lng: 106.723 };
        const phoneMatch = row.note ? (row.note as string).match(/\[Kontak:\s*([^\]]+)\]/) : null;
        const extractedPhone = phoneMatch ? phoneMatch[1].trim() : undefined;

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
          status: (row.status as "aktif" | "ditangani" | "selesai" | "palsu") || "aktif",
          phone_number: extractedPhone,
          dispatched_team: row.acknowledged_by || undefined,
          note: row.note || undefined,
          created_at: row.created_at,
        };
      });
    }
  } catch (err) {
    console.warn("fetchLiveSosAlerts Supabase error:", err);
  }

  // 2. Ambil juga dari tabel reports (laporan darurat dengan kode/judul SOS)
  try {
    const { data: repData } = await supabase
      .from("reports")
      .select("*")
      .or("tracking_code.ilike.SOS-%,title.ilike.%SOS%")
      .order("created_at", { ascending: false });

    if (repData && repData.length > 0) {
      repData.forEach((row) => {
        const coords = parsePostGISPoint(row.location) || { lat: -6.2088, lng: 106.8456 };
        const phoneMatch = row.description ? (row.description as string).match(/\[Kontak:\s*([^\]]+)\]/) : null;
        const extractedPhone = phoneMatch ? phoneMatch[1].trim() : undefined;
        let aType: SosAssistanceType = "damkar";
        if (row.title?.includes("MEDIS")) aType = "medis";
        else if (row.title?.includes("POLISI")) aType = "polisi";
        else if (row.title?.includes("BNPB") || row.title?.includes("BPBD")) aType = "bnpb_bpbd";

        supabaseItems.push({
          id: row.id,
          source: "Ponsel Warga (GPS Sensor)",
          assistance_type: aType,
          address: row.address || `Koordinat GPS (${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)})`,
          coordinates: `${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`,
          lat: coords.lat,
          lng: coords.lng,
          time_ago: timeAgo(row.created_at),
          battery_level: "95%",
          status: row.status === "selesai" ? "selesai" : row.status === "ditindaklanjuti" ? "ditangani" : "aktif",
          phone_number: extractedPhone,
          note: row.description || undefined,
          created_at: row.created_at,
        });
      });
    }
  } catch (err) {
    console.warn("fetchLiveSosAlerts from reports error:", err);
  }

  // Gabungkan hasil: Supabase live + Local Cache (HANYA DATA RIIL WARGA)
  const mergedMap = new Map<string, LiveSosItem>();

  // 1. Masukkan sinyal darurat riil dari local cache
  localItems.forEach((item) => {
    if (
      item &&
      item.id &&
      !item.id.startsWith("sos-10") &&
      item.id !== "sos-1" &&
      item.id !== "sos-2" &&
      item.id !== "sos-sample" &&
      !item.address?.includes("Citra 2")
    ) {
      mergedMap.set(item.id, item);
    }
  });

  // 2. Timpa dengan sinyal darurat riil dari Supabase
  supabaseItems.forEach((item) => {
    if (
      item &&
      item.id &&
      !item.id.startsWith("sos-10") &&
      item.id !== "sos-1" &&
      item.id !== "sos-2" &&
      item.id !== "sos-sample" &&
      !item.address?.includes("Citra 2")
    ) {
      const prev = mergedMap.get(item.id);
      mergedMap.set(item.id, {
        ...item,
        phone_number: item.phone_number || prev?.phone_number,
      });
    }
  });

  const sorted = Array.from(mergedMap.values()).sort((a, b) => {
    const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
    const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
    return timeB - timeA;
  });

  // Hapus duplikasi sinyal yang berasal dari titik lokasi & kontak yang sama dalam selang waktu dekat (< 15 detik)
  const deduplicated: LiveSosItem[] = [];
  for (const item of sorted) {
    const isDuplicate = deduplicated.some((existing) => {
      const sameCoords = Math.abs(existing.lat - item.lat) < 0.0001 && Math.abs(existing.lng - item.lng) < 0.0001;
      const samePhone = Boolean(item.phone_number && existing.phone_number && item.phone_number === existing.phone_number);
      const timeDiff = Math.abs(
        (new Date(existing.created_at).getTime() || 0) - (new Date(item.created_at).getTime() || 0)
      );
      return (sameCoords || samePhone) && timeDiff < 15000;
    });

    if (!isDuplicate) {
      deduplicated.push(item);
    }
  }

  return deduplicated;
}

/**
 * Memperbarui status penanganan panggilan SOS (Tugaskan Tim, Selesaikan, atau Tandai Palsu)
 */
export async function updateSosAlertStatus(
  id: string,
  newStatus: "aktif" | "ditangani" | "selesai" | "palsu",
  dispatchedTeam?: string
): Promise<{ success: boolean; error?: string }> {
  // Update local cache
  const localItems = getLocalSosCache();
  const existing = localItems.find((x) => x.id === id);
  if (existing) {
    existing.status = newStatus;
    if (dispatchedTeam) existing.dispatched_team = dispatchedTeam;
    saveLocalSosCache(localItems);
  }

  // Coba update ke Supabase
  try {
    const updatePayload: Record<string, unknown> = {
      status: newStatus === "palsu" ? "selesai" : newStatus,
    };
    if (newStatus === "ditangani" && dispatchedTeam) {
      updatePayload.acknowledged_by = dispatchedTeam;
      updatePayload.acknowledged_at = new Date().toISOString();
    }
    if (newStatus === "selesai" || newStatus === "palsu") {
      updatePayload.resolved_at = new Date().toISOString();
      if (newStatus === "palsu") {
        updatePayload.closing_note = "Ditolak: Terindikasi Panggilan Palsu / False Alarm";
      }
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

  // Juga sinkronkan status ke tabel reports
  try {
    const reportStatus =
      newStatus === "selesai" || newStatus === "palsu"
        ? (newStatus === "palsu" ? "ditolak" : "selesai")
        : newStatus === "ditangani"
        ? "ditindaklanjuti"
        : "diterima";

    await supabase
      .from("reports")
      .update({ status: reportStatus, updated_at: new Date().toISOString() })
      .eq("id", id);
  } catch (err) {
    console.warn("updateSosAlertStatus reports update error:", err);
  }

  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("storage"));
    window.dispatchEvent(new CustomEvent("sigapbumi:sos-updated", { detail: { id, status: newStatus } }));
  }

  return { success: true };
}

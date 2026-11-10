import { supabase } from "@/lib/supabase/client";
import { parsePostGISPoint } from "@/lib/geo";
import type { SosAssistanceType } from "@/types";
import { removeEmojis, saveLocalReport, getLocalReports, registerMyReportTrackingCode } from "@/lib/services/reports";
import { getCurrentUser } from "@/lib/auth";

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
    return Array.isArray(parsed) ? parsed : [];
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

/**
 * Mengambil ID sinyal SOS yang telah dihapus oleh admin
 */
export function getDeletedSosIds(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_DELETED_SOS_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
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
    params.note || "Panggilan Darurat SOS Warga (Realtime)",
    params.phoneNumber ? `[Kontak: ${params.phoneNumber}]` : "",
    params.photoUrl ? `[Foto: ${params.photoUrl}]` : "",
  ].filter(Boolean);
  const formattedNote = noteParts.join(" ");

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

  // 3. Simpan juga bukti foto ke tabel report_media Supabase
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

  // 4. SELALU kirim ke tabel reports Supabase (agar realtime langsung muncul di antrean laporan & dashboard admin)
  try {
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

    const reportInsertPayload: Record<string, unknown> = {
      id: generatedId,
      tracking_code: trackingCode,
      disaster_type: disasterType,
      title: `PANGGILAN DARURAT SOS (${(params.assistanceType || "damkar").toUpperCase()})`,
      description: formattedNote,
      location: `POINT(${params.lng} ${params.lat})`,
      address: `Titik Darurat Warga (${params.lat.toFixed(4)}, ${params.lng.toFixed(4)})`,
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

    // Daftarkan kode tracking ini sebagai laporan yang diajukan oleh browser/user ini
    registerMyReportTrackingCode(trackingCode, currentUser?.email);

    try {
      saveLocalReport({
        id: generatedId,
        tracking_code: trackingCode,
        disaster_type: disasterType,
        target_agency: params.assistanceType || "damkar",
        title: `PANGGILAN DARURAT SOS (${(params.assistanceType || "damkar").toUpperCase()})`,
        description: formattedNote,
        address: `Titik Darurat Warga (${params.lat.toFixed(4)}, ${params.lng.toFixed(4)})`,
        lat: params.lat,
        lng: params.lng,
        status: "diterima",
        priority: "tinggi",
        confirmation_count: 1,
        image_url: params.photoUrl,
        phone_number: params.phoneNumber,
        created_at: "Baru saja",
        is_demo: false,
        reporter_id: currentUser?.id,
        user_email: currentUser?.email,
      });
    } catch {}
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
        const photoMatch = row.note ? (row.note as string).match(/\[Foto:\s*([^\]]+)\]/) : null;
        const extractedPhoto = photoMatch ? photoMatch[1].trim() : (row.photo_url || undefined);

        return {
          id: row.id,
          source: "Ponsel Warga (GPS Sensor)",
          assistance_type: (row.assistance_type as SosAssistanceType) || "damkar",
          address: row.note ? `${row.note.replace(/\[(Kontak|Foto):[^\]]+\]/g, "").trim()}` : `Lokasi GPS (${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)})`,
          coordinates: `${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`,
          lat: coords.lat,
          lng: coords.lng,
          time_ago: timeAgo(row.created_at),
          battery_level: "85%",
          status: (row.status as "aktif" | "ditangani" | "selesai" | "palsu") || "aktif",
          phone_number: extractedPhone,
          photo_url: extractedPhoto,
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
      .select("*, report_media(*)")
      .or("tracking_code.ilike.SOS-%,title.ilike.%SOS%")
      .order("created_at", { ascending: false });

    if (repData && repData.length > 0) {
      repData.forEach((row) => {
        // Cek apakah sinyal SOS ini sudah ada di supabaseItems agar tidak duplikat
        const existingIdx = supabaseItems.findIndex(
          (item) => item.id === row.id || (item.note && row.tracking_code && item.note.includes(row.tracking_code))
        );

        const coords = parsePostGISPoint(row.location) || { lat: -6.2088, lng: 106.8456 };
        const phoneMatch = row.description ? (row.description as string).match(/\[Kontak:\s*([^\]]+)\]/) : null;
        const extractedPhone = phoneMatch ? phoneMatch[1].trim() : undefined;

        const photoMatch = row.description ? (row.description as string).match(/\[Foto:\s*([^\]]+)\]/) : null;
        const mediaPhoto = Array.isArray(row.report_media) && row.report_media.length > 0 ? row.report_media[0].media_url : undefined;
        const extractedPhoto = mediaPhoto || (photoMatch ? photoMatch[1].trim() : undefined) || row.image_url || undefined;

        if (existingIdx >= 0) {
          // Gabungkan foto & kontak jika item yang ada belum lengkap
          if (!supabaseItems[existingIdx].photo_url && extractedPhoto) {
            supabaseItems[existingIdx].photo_url = extractedPhoto;
          }
          if (!supabaseItems[existingIdx].phone_number && extractedPhone) {
            supabaseItems[existingIdx].phone_number = extractedPhone;
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

  // 1. Masukkan sinyal dari Supabase
  supabaseItems.forEach((item) => {
    if (item && item.id) {
      const fallbackPhoto = reportImageMap.get(item.id);
      mergedMap.set(item.id, {
        ...item,
        photo_url: item.photo_url || fallbackPhoto,
      });
    }
  });

  // 2. Masukkan / timpa dengan sinyal dari local cache (agar status lokal selalu terbaru)
  localItems.forEach((item) => {
    if (item && item.id) {
      const prev = mergedMap.get(item.id);
      const fallbackPhoto = reportImageMap.get(item.id);
      mergedMap.set(item.id, {
        ...(prev || {}),
        ...item,
        photo_url: item.photo_url || prev?.photo_url || fallbackPhoto,
        phone_number: item.phone_number || prev?.phone_number,
      });
    }
  });

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
  return deduplicated.filter((item) => !deletedIds.has(item.id));
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
  const existingIndex = localItems.findIndex((x) => x.id === id);
  if (existingIndex >= 0) {
    localItems[existingIndex].status = newStatus;
    if (dispatchedTeam) localItems[existingIndex].dispatched_team = dispatchedTeam;
  } else {
    localItems.push({
      id,
      source: "Ponsel Warga (GPS Sensor)",
      assistance_type: "damkar",
      address: "Titik Darurat Warga",
      coordinates: "-6.2088, 106.8456",
      lat: -6.2088,
      lng: 106.8456,
      time_ago: "Baru saja",
      status: newStatus,
      dispatched_team: dispatchedTeam,
      created_at: new Date().toISOString(),
    });
  }
  saveLocalSosCache(localItems);

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

/**
 * Menghapus panggilan darurat SOS secara live (Supabase, local cache, dan sinkronisasi real-time)
 */
export async function deleteSosAlertLive(
  id: string,
  actorName: string = "Petugas Pusdalops"
): Promise<{ success: boolean; error?: string }> {
  // 1. Tandai di cache deleted
  markSosAsDeleted(id);

  // 2. Hapus dari local SOS cache
  const localCache = getLocalSosCache();
  const filtered = localCache.filter((x) => x.id !== id);
  saveLocalSosCache(filtered);

  // 3. Dispatch event agar seluruh layar dan tab segera sinkron
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("storage"));
    window.dispatchEvent(new CustomEvent("sigapbumi:sos-updated", { detail: { id } }));
    window.dispatchEvent(new CustomEvent("sigapbumi:sos-deleted", { detail: { id } }));
  }

  // 4. Panggil DELETE API backend
  try {
    await fetch("/api/admin/status", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reportId: id, actorName, isSos: true }),
    });
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
 * TANPA menghapus data laporan bencana umum.
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

  // 2. Panggil API backend untuk membersihkan database
  try {
    await fetch("/api/admin/status", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clearAllSos: true }),
    });
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

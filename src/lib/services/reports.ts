import { supabase } from "@/lib/supabase/client";
import { parsePostGISPoint } from "@/lib/geo";
import type { DisasterType, ReportStatus, SosAssistanceType, PriorityLabel } from "@/types";
import type { MapPoint } from "@/components/peta/DisasterMap";
import type { TimelineStep } from "@/components/laporan/TimelineStatus";
import { MASTER_MOCK_REPORTS } from "@/lib/data/mock-reports";

export interface LiveReportItem {
  id: string;
  tracking_code: string;
  disaster_type: DisasterType;
  target_agency: SosAssistanceType;
  title: string;
  description: string;
  address: string;
  province?: string;
  regency?: string;
  lat: number;
  lng: number;
  status: ReportStatus;
  priority: "kritis" | "tinggi" | "sedang" | "rendah" | "normal";
  priority_label?: PriorityLabel;
  confirmation_count: number;
  created_at: string;
  raw_created_at?: string;
  image_url?: string;
  phone_number?: string;
  timeline?: TimelineStep[];
  is_demo?: boolean;
  reporter_id?: string;
  user_email?: string;
}

export interface LiveSosAlertItem {
  id: string;
  sender_name: string;
  assistance_type: SosAssistanceType;
  location: string;
  coordinates: string;
  lat: number;
  lng: number;
  time: string;
  status: "aktif" | "ditangani";
}

const LOCAL_STORAGE_REPORTS_KEY = "sigapbumi_local_reports";

/**
 * Mengambil daftar laporan warga yang tersimpan di browser lokal
 */
export function getLocalReports(): LiveReportItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_REPORTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Menghapus segala bentuk emoticon / emoji dari string
 */
export function removeEmojis(str: string): string {
  if (!str) return "";
  return str
    .replace(
      /[\p{Extended_Pictographic}\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E6}-\u{1F1FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\uFE0E\uFE0F\u200D]/gu,
      ""
    )
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Ekstraksi URL atau base64 foto dari teks deskripsi (format: [Foto: <url_atau_base64>])
 */
export function extractPhotoFromDescription(rawDesc?: string): string | undefined {
  if (!rawDesc) return undefined;
  const match = rawDesc.match(/\[Foto:\s*([\s\S]*?)\]/i);
  if (match && match[1]) {
    const val = match[1].trim();
    return val.length > 0 ? val : undefined;
  }
  return undefined;
}

/**
 * Ekstraksi nomor telepon kontak dari teks deskripsi (format: [Kontak: <nomor>])
 */
export function extractPhoneFromDescription(rawDesc?: string): string | undefined {
  if (!rawDesc) return undefined;
  const match = rawDesc.match(/\[Kontak:\s*([\s\S]*?)\]/i);
  if (match && match[1]) {
    const val = match[1].trim();
    return val.length > 0 ? val : undefined;
  }
  return undefined;
}

/**
 * Ekstraksi akurasi GPS dari teks deskripsi (format: [Akurasi GPS: <akurasi>])
 */
export function extractGpsAccuracyFromDescription(rawDesc?: string): string | undefined {
  if (!rawDesc) return undefined;
  const match = rawDesc.match(/\[Akurasi GPS:\s*([\s\S]*?)\]/i);
  if (match && match[1]) {
    const val = match[1].trim();
    return val.length > 0 ? val : undefined;
  }
  return undefined;
}

/**
 * Membersihkan teks deskripsi laporan dari tag teknis [Foto: ...], [Kontak: ...], [Akurasi GPS: ...] serta emoji
 */
export function cleanReportDescription(rawDesc?: string): string {
  if (!rawDesc) return "";
  let cleaned = rawDesc;

  // Hapus tag [Foto: ...] baik base64 panjang maupun URL (termasuk multiline)
  cleaned = cleaned.replace(/\[Foto:\s*[\s\S]*?\]/gi, "");

  // Hapus tag [Kontak: ...]
  cleaned = cleaned.replace(/\[Kontak:\s*[\s\S]*?\]/gi, "");

  // Hapus tag [Akurasi GPS: ...]
  cleaned = cleaned.replace(/\[Akurasi GPS:\s*[\s\S]*?\]/gi, "");

  // Hapus emoji
  cleaned = removeEmojis(cleaned);

  // Rapikan spasi
  cleaned = cleaned.replace(/\s+/g, " ").trim();

  // Jika setelah dibersihkan teksnya kosong (karena hanya berisi tag teknis), beri teks default informatif
  if (!cleaned) {
    return "Panggilan Darurat SOS Warga (Realtime)";
  }

  return cleaned;
}

/**
 * Menyimpan laporan baru warga ke cache lokal perangkat
 */
export function saveLocalReport(report: LiveReportItem): void {
  if (typeof window === "undefined") return;
  try {
    const existing = getLocalReports();
    const filtered = existing.filter(
      (r) => r.tracking_code !== report.tracking_code && r.id !== report.id
    );
    localStorage.setItem(
      LOCAL_STORAGE_REPORTS_KEY,
      JSON.stringify([report, ...filtered])
    );
  } catch {
    // Ignore quota error
  }
}

export const LOCAL_STORAGE_DELETED_KEY = "sigapbumi_deleted_reports";

/**
 * Mengambil ID dan kode tracking laporan yang telah dihapus admin
 */
export function getDeletedReportIds(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_DELETED_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

/**
 * Menandai ID / kode tracking laporan sebagai dihapus di local storage
 */
export function markReportAsDeleted(idOrCode: string): void {
  if (typeof window === "undefined") return;
  try {
    const current = getDeletedReportIds();
    current.add(idOrCode);
    localStorage.setItem(LOCAL_STORAGE_DELETED_KEY, JSON.stringify(Array.from(current)));
  } catch {
    // Ignore quota error
  }
}

export const LOCAL_STORAGE_MY_CODES_KEY = "sigapbumi_my_submitted_codes";
export const LOCAL_STORAGE_USER_REPORTS_PREFIX = "sigapbumi_user_reports_";

/**
 * Mengambil daftar kode tracking yang pernah dibuat oleh browser/perangkat ini
 */
export function getMySubmittedCodes(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_MY_CODES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Mendaftarkan kode tracking baru yang dibuat dari perangkat ini (baik saat login maupun sebelum login)
 */
export function registerMyReportTrackingCode(trackingCode: string, userEmail?: string): void {
  if (typeof window === "undefined" || !trackingCode) return;
  try {
    const clean = trackingCode.trim().toUpperCase();
    const current = getMySubmittedCodes();
    if (!current.includes(clean)) {
      const updated = [clean, ...current];
      localStorage.setItem(LOCAL_STORAGE_MY_CODES_KEY, JSON.stringify(updated));
    }

    // Jika pengguna sedang login, langsung tautkan juga ke memori profil user
    if (userEmail) {
      const userKey = `${LOCAL_STORAGE_USER_REPORTS_PREFIX}${userEmail.trim().toLowerCase()}`;
      const rawUserCodes = localStorage.getItem(userKey);
      const userCodes: string[] = rawUserCodes ? JSON.parse(rawUserCodes) : [];
      if (!userCodes.includes(clean)) {
        localStorage.setItem(userKey, JSON.stringify([clean, ...userCodes]));
      }
    }
  } catch {
    // Ignore quota error
  }
}

/**
 * Menghubungkan seluruh laporan lokal/anonim yang dibuat di perangkat sebelum login ke akun warga yang baru login
 */
export async function syncLocalReportsToUser(user: { id: string; email: string; phone_number?: string }): Promise<void> {
  if (typeof window === "undefined" || !user?.email) return;

  try {
    const userEmailKey = `${LOCAL_STORAGE_USER_REPORTS_PREFIX}${user.email.trim().toLowerCase()}`;
    const myDeviceCodes = getMySubmittedCodes();
    const localReports = getLocalReports();

    // Gabungkan kode tracking dari device dan localReports
    const allCodesToSync = new Set<string>(myDeviceCodes);
    localReports.forEach((r) => {
      if (r.tracking_code) allCodesToSync.add(r.tracking_code.toUpperCase());
    });

    // Simpan ke key profil user
    const rawUserCodes = localStorage.getItem(userEmailKey);
    const existingUserCodes: string[] = rawUserCodes ? JSON.parse(rawUserCodes) : [];
    existingUserCodes.forEach((c) => allCodesToSync.add(c.toUpperCase()));
    const finalCodes = Array.from(allCodesToSync);

    localStorage.setItem(userEmailKey, JSON.stringify(finalCodes));

    // Update field reporter_id & user_email di localReports agar tercatat sebagai milik user
    const updatedLocalReports = localReports.map((r) => {
      if (finalCodes.includes(r.tracking_code.toUpperCase())) {
        return {
          ...r,
          reporter_id: user.id,
          user_email: user.email,
        };
      }
      return r;
    });
    localStorage.setItem(LOCAL_STORAGE_REPORTS_KEY, JSON.stringify(updatedLocalReports));

    // Sinkronisasi ke Supabase database jika ID berupa UUID yang valid
    const isUuid = Boolean(user.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(user.id));
    if (isUuid && finalCodes.length > 0) {
      try {
        await supabase
          .from("reports")
          .update({ reporter_id: user.id })
          .in("tracking_code", finalCodes);
      } catch (dbErr) {
        console.warn("syncLocalReportsToUser Supabase update notice:", dbErr);
      }
    }
  } catch (err) {
    console.warn("Gagal sinkronisasi laporan ke profil user:", err);
  }
}

/**
 * Mengambil seluruh riwayat laporan milik pengguna yang sedang login (termasuk SOS yang dikirim sebelum login)
 */
export async function fetchUserReports(user: { id: string; email: string; phone_number?: string } | null): Promise<LiveReportItem[]> {
  const result: LiveReportItem[] = [];
  const seenCodes = new Set<string>();

  // 1. Ambil kode tracking yang terafiliasi dengan user atau perangkat ini
  const relevantCodes = new Set<string>(getMySubmittedCodes());
  if (user?.email) {
    try {
      const userKey = `${LOCAL_STORAGE_USER_REPORTS_PREFIX}${user.email.trim().toLowerCase()}`;
      const rawUserCodes = localStorage.getItem(userKey);
      if (rawUserCodes) {
        const parsed: string[] = JSON.parse(rawUserCodes);
        parsed.forEach((c) => relevantCodes.add(c.toUpperCase()));
      }
    } catch {}
  }

  // 2. Ambil dari Supabase (berdasarkan reporter_id atau tracking_code)
  try {
    const isUuid = Boolean(user?.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(user.id));
    const codesArray = Array.from(relevantCodes);

    let query = supabase.from("reports").select("*, report_status_logs(*), report_media(*)");

    if (isUuid && codesArray.length > 0) {
      query = query.or(`reporter_id.eq.${user!.id},tracking_code.in.(${codesArray.join(",")})`);
    } else if (isUuid) {
      query = query.eq("reporter_id", user!.id);
    } else if (codesArray.length > 0) {
      query = query.in("tracking_code", codesArray);
    } else {
      query = query.eq("id", "00000000-0000-0000-0000-000000000000"); // No items
    }

    const { data, error } = await query.order("created_at", { ascending: false });

    if (!error && Array.isArray(data)) {
      for (const row of data) {
        const code = (row.tracking_code || "").toUpperCase();
        if (!code || seenCodes.has(code)) continue;
        seenCodes.add(code);

        const coords = parsePostGISPoint(row.location) || { lat: -6.2088, lng: 106.8456 };
        const disaster = row.disaster_type as DisasterType;
        let agency = inferAgencyFromDisaster(disaster);

        const isSos = Boolean(code.startsWith("SOS-") || row.title?.toUpperCase().includes("SOS"));
        if (isSos) {
          const t = (row.title || "").toUpperCase();
          if (t.includes("BNPB") || t.includes("BPBD")) agency = "bnpb_bpbd";
          else if (t.includes("DAMKAR") || t.includes("KEBAKARAN")) agency = "damkar";
          else if (t.includes("MEDIS") || t.includes("AMBULANS")) agency = "medis";
          else if (t.includes("POLISI") || t.includes("KEAMANAN")) agency = "polisi";
        }

        const mediaPhoto = Array.isArray(row.report_media) && row.report_media.length > 0
          ? row.report_media[0].media_url
          : undefined;
        const imageUrl = extractPhotoFromDescription(row.description) || mediaPhoto || row.image_url || undefined;
        const cleanDescription = cleanReportDescription(row.description);

        const isSosReport = isSos || Boolean(
          row.title?.toUpperCase().includes("SOS") ||
          (row.tracking_code || "").toUpperCase().startsWith("SOS-") ||
          (row.priority_score && row.priority_score >= 95)
        );

        const calculatedPriority: "kritis" | "tinggi" | "sedang" | "rendah" | "normal" =
          isSosReport || row.priority_score >= 90
            ? "kritis"
            : row.priority_score >= 70
            ? "tinggi"
            : row.priority_score >= 35
            ? "sedang"
            : "rendah";

        result.push({
          id: row.id,
          tracking_code: row.tracking_code,
          disaster_type: disaster,
          target_agency: agency,
          title: removeEmojis(row.title),
          description: cleanDescription,
          address: removeEmojis(row.address) || "Lokasi Koordinat GPS",
          lat: coords.lat,
          lng: coords.lng,
          status: row.status as ReportStatus,
          priority: calculatedPriority,
          priority_label: isSosReport || calculatedPriority === "kritis" ? "Kritis" : calculatedPriority === "tinggi" ? "Tinggi" : calculatedPriority === "sedang" ? "Sedang" : "Rendah",
          confirmation_count: row.confirmation_count || 0,
          created_at: formatReportTime(row.created_at),
          image_url: imageUrl,
          reporter_id: row.reporter_id || undefined,
          is_demo: false,
        });
      }
    }
  } catch (err) {
    console.warn("fetchUserReports Supabase warning:", err);
  }

  // 3. Gabungkan dengan laporan dari cache lokal perangkat (jika belum masuk dari Supabase)
  const localReports = getLocalReports();
  for (const local of localReports) {
    const code = (local.tracking_code || "").toUpperCase();
    if (!code || seenCodes.has(code)) continue;

    // Sertakan jika kode ada di relevantCodes atau milik user ini
    const isMatch = relevantCodes.has(code) || (user?.id && local.reporter_id === user.id) || (user?.email && local.user_email === user.email);
    if (isMatch) {
      seenCodes.add(code);
      const imageUrl = extractPhotoFromDescription(local.description) || local.image_url;
      const cleanDesc = cleanReportDescription(local.description);

      result.push({
        ...local,
        description: cleanDesc,
        image_url: imageUrl,
      });
    }
  }

  return result;
}

// Dataset awal: kosong secara default agar murni membaca Supabase live
export const DEFAULT_MOCK_REPORTS: LiveReportItem[] = [];

export const DEFAULT_MOCK_SOS: LiveSosAlertItem[] = [];

/**
 * Menghapus seluruh cache laporan & SOS lokal di browser pengguna
 */
export function clearAllLocalReportsAndCaches(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(LOCAL_STORAGE_REPORTS_KEY);
    localStorage.removeItem(LOCAL_STORAGE_DELETED_KEY);
    localStorage.removeItem(LOCAL_STORAGE_MY_CODES_KEY);
    localStorage.removeItem("sigapbumi_sos_alerts_cache");
    localStorage.removeItem("sigapbumi_deleted_sos");
    window.dispatchEvent(new Event("storage"));
    window.dispatchEvent(new CustomEvent("sigapbumi:sos-updated", { detail: {} }));
    window.dispatchEvent(new CustomEvent("sigapbumi:report-deleted", { detail: {} }));
  } catch {}
}

/**
 * Menentukan instansi terkait berdasarkan tipe bencana
 */
export function inferAgencyFromDisaster(disasterType: DisasterType): SosAssistanceType {
  switch (disasterType) {
    case "kebakaran":
    case "karhutla":
      return "damkar";
    case "banjir":
    case "longsor":
    case "tsunami":
      return "bnpb_bpbd";
    case "gempa":
      return "medis";
    default:
      return "polisi";
  }
}

/**
 * Memformat tanggal created_at ke format lokal WIB
 */
export function formatReportTime(dateString: string): string {
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return "Baru saja";
    return (
      d.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }) + " WIB"
    );
  } catch {
    return "Baru saja";
  }
}

/**
 * Mengonversi tanggal/string waktu laporan ke timestamp milidetik untuk pengurutan
 */
export function parseReportTimestamp(dateStr?: string): number {
  if (!dateStr) return 0;
  if (dateStr === "Baru saja") return Date.now();

  const parsed = Date.parse(dateStr);
  if (!isNaN(parsed)) return parsed;

  const match = dateStr.match(/(\d{1,2})\s+([A-Za-z]{3})\s+(\d{4}),?\s+(\d{1,2})[.:](\d{2})/);
  if (match) {
    const day = parseInt(match[1], 10);
    const monthStr = match[2].toLowerCase();
    const year = parseInt(match[3], 10);
    const hour = parseInt(match[4], 10);
    const minute = parseInt(match[5], 10);

    const monthMap: Record<string, number> = {
      jan: 0, feb: 1, mar: 2, apr: 3, mei: 4, may: 4, jun: 5,
      jul: 6, agu: 7, aug: 7, sep: 8, okt: 9, oct: 9, nov: 10, des: 11, dec: 11
    };
    const month = monthMap[monthStr] ?? 0;
    return new Date(year, month, day, hour, minute).getTime();
  }

  return 0;
}

/**
 * Mengambil daftar laporan: menggabungkan data Supabase live, local cache perangkat, dan data demo
 */
export async function fetchLiveReports(): Promise<LiveReportItem[]> {
  const localReports = getLocalReports();
  let liveItems: LiveReportItem[] = [];

  try {
    const { data, error } = await supabase
      .from("reports")
      .select("*, report_media(*)")
      .order("created_at", { ascending: false });

    if (!error && data && data.length > 0) {
      liveItems = data.map((row) => {
        const coords = parsePostGISPoint(row.location) || { lat: -6.2088, lng: 106.8456 };
        const disaster = row.disaster_type as DisasterType;
        const agency = inferAgencyFromDisaster(disaster);
        const isSosReport = Boolean(
          row.title?.toUpperCase().includes("SOS") ||
          (row.tracking_code || "").toUpperCase().startsWith("SOS-") ||
          (row.priority_score && row.priority_score >= 95)
        );

        const priority: "kritis" | "tinggi" | "sedang" | "rendah" | "normal" =
          isSosReport || row.priority_score >= 90
            ? "kritis"
            : row.priority_score >= 70
            ? "tinggi"
            : row.priority_score >= 35
            ? "sedang"
            : "rendah";

        const rawDesc = row.description || "";
        const mediaPhoto = Array.isArray(row.report_media) && row.report_media.length > 0
          ? row.report_media[0].media_url
          : undefined;
        const extractedPhoto = extractPhotoFromDescription(rawDesc) || mediaPhoto || row.image_url || undefined;
        const extractedPhone = extractPhoneFromDescription(rawDesc) || row.phone_number || undefined;
        const cleanDesc = cleanReportDescription(rawDesc);

        return {
          id: row.id,
          tracking_code: row.tracking_code,
          disaster_type: disaster,
          target_agency: agency,
          title: removeEmojis(row.title),
          description: cleanDesc,
          address: removeEmojis(row.address) || "Lokasi Koordinat GPS Terdeteksi",
          lat: coords.lat,
          lng: coords.lng,
          status: row.status as ReportStatus,
          priority,
          confirmation_count: row.confirmation_count || 0,
          created_at: formatReportTime(row.created_at),
          raw_created_at: row.created_at,
          image_url: extractedPhoto,
          phone_number: extractedPhone,
          is_demo: false,
        };
      });
    }
  } catch (err) {
    console.warn("fetchLiveReports Supabase warning:", err);
  }

  // Gabungkan laporan: Mock bawaan + Supabase live + Local Reports perangkat (status lokal selalu menang)
  const mergedMap = new Map<string, LiveReportItem>();

  // 1. Data default demonstrasi
  DEFAULT_MOCK_REPORTS.forEach((item) => {
    mergedMap.set(item.tracking_code, item);
    mergedMap.set(item.id, item);
  });

  // 2. Data database Supabase riil
  liveItems.forEach((item) => {
    mergedMap.set(item.tracking_code, item);
    mergedMap.set(item.id, item);
  });

  // 3. Data lokal perangkat pengguna (laporan baru atau status yang diperbarui)
  localReports.forEach((item) => {
    const rawDesc = item.description || "";
    const extractedPhoto = extractPhotoFromDescription(rawDesc) || item.image_url;
    const extractedPhone = extractPhoneFromDescription(rawDesc) || item.phone_number;
    const cleanDesc = cleanReportDescription(rawDesc);

    const sanitized: LiveReportItem = {
      ...item,
      description: cleanDesc,
      image_url: extractedPhoto,
      phone_number: extractedPhone,
    };
    mergedMap.set(item.tracking_code, sanitized);
    mergedMap.set(item.id, sanitized);
  });

  const deletedIds = getDeletedReportIds();
  const allReports = Array.from(new Set(mergedMap.values())).filter(
    (item) => !deletedIds.has(item.id) && !deletedIds.has(item.tracking_code)
  );

  // Selalu urutkan daftar laporan dari data yang paling baru ke terlama
  allReports.sort((a, b) => {
    const timeA = parseReportTimestamp(a.raw_created_at || a.created_at);
    const timeB = parseReportTimestamp(b.raw_created_at || b.created_at);
    return timeB - timeA;
  });

  return allReports;
}

/**
 * Konversi daftar LiveReportItem ke format MapPoint untuk Leaflet
 */
export function reportsToMapPoints(reports: LiveReportItem[]): MapPoint[] {
  return reports.map((r) => {
    const isSos = Boolean(
      r.tracking_code?.toUpperCase().startsWith("SOS-") ||
      r.title?.toUpperCase().includes("SOS") ||
      r.description?.toUpperCase().includes("SOS")
    );
    return {
      id: r.id,
      tracking_code: r.tracking_code,
      disaster_type: r.disaster_type,
      title: r.title,
      location_name: r.address,
      lat: r.lat,
      lng: r.lng,
      status: r.status,
      created_at: r.created_at,
      confirmation_count: r.confirmation_count,
      is_sos: isSos,
      is_demo: r.is_demo,
      province: r.province,
      regency: r.regency,
    };
  });
}

/**
 * Mengambil detail laporan spesifik berdasarkan kode pelacakan
 */
export async function fetchReportDetail(trackingCode: string): Promise<LiveReportItem | null> {
  const code = trackingCode.trim().toUpperCase();

  // 1. Coba ambil dari database Supabase
  try {
    const { data, error } = await supabase
      .from("reports")
      .select("*, report_status_logs(*), report_media(*)")
      .eq("tracking_code", code)
      .maybeSingle();

    if (!error && data) {
      const coords = parsePostGISPoint(data.location) || { lat: -6.2088, lng: 106.8456 };
      const disaster = data.disaster_type as DisasterType;
      let agency = inferAgencyFromDisaster(disaster);

      // Deteksi bantuan SOS spesifik dari judul atau tracking code
      const isSos = Boolean(
        data.tracking_code?.toUpperCase().startsWith("SOS-") ||
        data.title?.toUpperCase().includes("SOS")
      );
      if (isSos) {
        const titleUpper = (data.title || "").toUpperCase();
        if (titleUpper.includes("BNPB") || titleUpper.includes("BPBD")) {
          agency = "bnpb_bpbd";
        } else if (titleUpper.includes("DAMKAR") || titleUpper.includes("KEBAKARAN")) {
          agency = "damkar";
        } else if (titleUpper.includes("MEDIS") || titleUpper.includes("AMBULANS")) {
          agency = "medis";
        } else if (titleUpper.includes("POLISI") || titleUpper.includes("KEAMANAN")) {
          agency = "polisi";
        }
      }

      // Ekstraksi foto bukti dari report_media, regex [Foto: ...], atau field bawaan
      const mediaPhoto = Array.isArray(data.report_media) && data.report_media.length > 0
        ? data.report_media[0].media_url
        : undefined;
      const imageUrl = mediaPhoto || extractPhotoFromDescription(data.description) || data.image_url || undefined;

      // Ekstraksi kontak jika ada
      const phoneNumber = data.reporter_phone || extractPhoneFromDescription(data.description) || data.phone_number || undefined;

      // Bersihkan deskripsi dari string base64 / tag foto / metadata teknis
      const cleanDescription = cleanReportDescription(data.description);

      const logs = (data.report_status_logs || []) as Array<{
        status: ReportStatus;
        note?: string;
        created_at: string;
      }>;

      const timeline: TimelineStep[] =
        logs.length > 0
          ? logs.map((log) => ({
              status: log.status,
              label:
                log.status === "diterima"
                  ? "Laporan Diterima Sistem"
                  : log.status === "diverifikasi"
                  ? "Diverifikasi Petugas"
                  : log.status === "ditindaklanjuti"
                  ? "Penanganan Operasional Berjalan"
                  : log.status === "selesai"
                  ? "Penanganan Selesai"
                  : "Laporan Ditolak",
              timestamp: formatReportTime(log.created_at),
              note: log.note || "Status diperbarui oleh sistem posko.",
            }))
          : [
              {
                status: data.status as ReportStatus,
                label:
                  data.status === "diterima"
                    ? "Laporan Diterima Sistem"
                    : "Status Terkini",
                timestamp: formatReportTime(data.created_at),
                note: "Laporan tersimpan di database SigapBumi.",
              },
            ];

      const isSosReport = Boolean(
        data.title?.toUpperCase().includes("SOS") ||
        (data.tracking_code || "").toUpperCase().startsWith("SOS-") ||
        (data.priority_score && data.priority_score >= 95)
      );

      return {
        id: data.id,
        tracking_code: data.tracking_code,
        disaster_type: disaster,
        target_agency: agency,
        title: removeEmojis(data.title),
        description: cleanDescription,
        address: removeEmojis(data.address) || "Lokasi Koordinat GPS",
        lat: coords.lat,
        lng: coords.lng,
        status: data.status as ReportStatus,
        priority: isSosReport || data.priority_score >= 90 ? "kritis" : data.priority_score >= 70 ? "tinggi" : data.priority_score >= 35 ? "sedang" : "rendah",
        priority_label: isSosReport || data.priority_score >= 90 ? "Kritis" : data.priority_score >= 70 ? "Tinggi" : data.priority_score >= 35 ? "Sedang" : "Rendah",
        confirmation_count: data.confirmation_count || 0,
        created_at: formatReportTime(data.created_at),
        timeline,
        image_url: imageUrl,
        phone_number: phoneNumber,
        is_demo: false,
      };
    }
  } catch (err) {
    console.warn("fetchReportDetail Supabase warning:", err);
  }

  // 2. Cek apakah ada di cache lokal perangkat
  const localItems = getLocalReports();
  const localFound = localItems.find((r) => r.tracking_code === code);
  if (localFound) {
    const imageUrl = localFound.image_url || extractPhotoFromDescription(localFound.description);
    const cleanDescription = cleanReportDescription(localFound.description);

    return {
      ...localFound,
      description: cleanDescription,
      image_url: imageUrl,
    };
  }

  // 3. Fallback ke DEFAULT_MOCK_REPORTS jika ini laporan sampel demonstrasi
  const mockFound = DEFAULT_MOCK_REPORTS.find((r) => r.tracking_code === code);
  return mockFound || null;
}

/**
 * Memperbarui status laporan di database & cache lokal
 */
export async function updateReportStatusLive(
  reportId: string,
  newStatus: ReportStatus,
  note?: string,
  actorName: string = "Petugas Posko",
  version?: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const cleanNote = note?.trim() || `Status diperbarui menjadi ${newStatus}`;

    // Update data lokal jika ini laporan di cache browser atau buat jika belum ada
    const localItems = getLocalReports();
    let localMatch = localItems.find(
      (r) => r.id === reportId || r.tracking_code === reportId
    );

    // Update mock in-memory
    const mockItem = DEFAULT_MOCK_REPORTS.find(
      (r) => r.id === reportId || r.tracking_code === reportId
    );
    if (mockItem) {
      mockItem.status = newStatus;
      if (!mockItem.timeline) mockItem.timeline = [];
      mockItem.timeline.push({
        status: newStatus,
        label:
          newStatus === "diverifikasi"
            ? "Diverifikasi Petugas"
            : newStatus === "ditindaklanjuti"
            ? "Tim Operasional Ditugaskan"
            : newStatus === "selesai"
            ? "Penanganan Selesai"
            : "Laporan Ditolak",
        timestamp: "Baru saja",
        note: cleanNote,
        actor: actorName,
      });
    }

    if (!localMatch && mockItem) {
      localMatch = { ...mockItem };
    } else if (!localMatch) {
      localMatch = {
        id: reportId,
        tracking_code: reportId.startsWith("LPR") || reportId.startsWith("SOS") ? reportId : `LPR-${reportId.slice(0, 6).toUpperCase()}`,
        disaster_type: "kebakaran",
        target_agency: "damkar",
        title: "Laporan Bencana",
        description: cleanNote,
        address: "Lokasi Kejadian",
        lat: -7.4052,
        lng: 109.2452,
        status: newStatus,
        priority: "sedang",
        confirmation_count: 1,
        created_at: "Baru saja",
        timeline: [],
      };
    }

    localMatch.status = newStatus;
    if (!localMatch.timeline) localMatch.timeline = [];
    localMatch.timeline.push({
      status: newStatus,
      label:
        newStatus === "diverifikasi"
          ? "Diverifikasi Petugas"
          : newStatus === "ditindaklanjuti"
          ? "Tim Operasional Ditugaskan"
          : newStatus === "selesai"
          ? "Penanganan Selesai"
          : "Laporan Ditolak",
      timestamp: "Baru saja",
      note: cleanNote,
      actor: actorName,
    });
    saveLocalReport(localMatch);

    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("sigapbumi:report-updated", { detail: { id: reportId, status: newStatus } }));
      window.dispatchEvent(new Event("storage"));
    }

    // 1. Coba update via server API route
    try {
      const apiRes = await fetch("/api/admin/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportId,
          status: newStatus,
          note: cleanNote,
          actorName,
        }),
      });
      if (apiRes.ok) return { success: true };
    } catch {
      // Lanjut fallback ke client Supabase
    }

    // 2. Coba RPC resmi jika tersedia
    try {
      const { data: rpcData, error: rpcErr } = await supabase.rpc(
        "change_report_status",
        {
          p_report_id: reportId,
          p_new_status: newStatus,
          p_note: cleanNote,
          p_actor_name: actorName,
          p_version: version || null,
        }
      );
      if (!rpcErr && (rpcData as { success?: boolean })?.success) {
        return { success: true };
      }
    } catch {
      // Lanjut direct update
    }

    // 3. Direct update
    try {
      await supabase
        .from("reports")
        .update({
          status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .or(`id.eq.${reportId},tracking_code.eq.${reportId}`);
    } catch {
      // Ignore
    }

    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal memperbarui status";
    return { success: false, error: message };
  }
}

/**
 * Menghapus laporan dari database Supabase dan cache lokal
 */
export async function deleteReportLive(
  reportId: string,
  actorName: string = "Petugas Posko Terpadu"
): Promise<{ success: boolean; error?: string }> {
  try {
    // 1. Tandai ID / kode tracking sebagai dihapus di local storage agar tidak muncul lagi
    markReportAsDeleted(reportId);

    // 2. Hapus dari local storage reports
    if (typeof window !== "undefined") {
      try {
        const local = getLocalReports();
        const filtered = local.filter((r) => r.id !== reportId && r.tracking_code !== reportId);
        localStorage.setItem(LOCAL_STORAGE_REPORTS_KEY, JSON.stringify(filtered));
      } catch {
        // Ignore quota error
      }
    }

    // 3. Hapus dari mock in-memory jika ada
    const mockIdx = DEFAULT_MOCK_REPORTS.findIndex((r) => r.id === reportId || r.tracking_code === reportId);
    if (mockIdx >= 0) {
      DEFAULT_MOCK_REPORTS.splice(mockIdx, 1);
    }

    // 4. Panggil API Route DELETE internal /api/admin/status
    try {
      await fetch("/api/admin/status", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportId }),
      });
    } catch {
      // Fallback ke Supabase langsung
    }

    // 5. Coba hapus langsung dari client Supabase jika terhubung
    try {
      await supabase
        .from("reports")
        .delete()
        .or(`id.eq.${reportId},tracking_code.eq.${reportId}`);
    } catch {
      // Ignore
    }

    // 6. Broadcast event agar semua komponen/tab langsung reaktif
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("sigapbumi:report-deleted", { detail: { id: reportId } }));
      window.dispatchEvent(new Event("storage"));
    }

    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal menghapus laporan";
    return { success: false, error: message };
  }
}

/**
 * Mencatat tindakan petugas ke tabel audit_logs
 */
export async function recordAuditLog(
  action: string,
  entity: string,
  entityId: string,
  meta?: Record<string, unknown>,
  actorName: string = "Petugas Posko"
): Promise<void> {
  try {
    await supabase.from("audit_logs").insert({
      actor_name: actorName,
      action,
      entity,
      entity_id: entityId,
      meta,
    });
  } catch (err) {
    console.warn("recordAuditLog warning:", err);
  }
}

/**
 * Menambahkan konfirmasi warga (+1) ke laporan bencana
 */
export async function vouchReportLive(
  reportId: string,
  trackingCode: string,
  currentCount: number
): Promise<{ success: boolean; newCount: number }> {
  let newCount = currentCount + 1;

  // 1. Coba update via API Route internal /api/reports/vouch
  try {
    const res = await fetch("/api/reports/vouch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reportId, trackingCode }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.newCount) newCount = data.newCount;
    }
  } catch {
    // Lanjut fallback ke client Supabase
  }

  // 2. Update local reports cache jika tersimpan di browser
  const localItems = getLocalReports();
  const localMatch = localItems.find(
    (r) => r.id === reportId || r.tracking_code === trackingCode
  );
  if (localMatch) {
    localMatch.confirmation_count = newCount;
    saveLocalReport(localMatch);
  }

  // 3. Update mock memory jika mock report
  const mockItem = DEFAULT_MOCK_REPORTS.find(
    (r) => r.id === reportId || r.tracking_code === trackingCode
  );
  if (mockItem) {
    mockItem.confirmation_count = newCount;
  }

  return { success: true, newCount };
}

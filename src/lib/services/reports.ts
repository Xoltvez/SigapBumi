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
  reporter_name?: string;
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
    if (!raw) return [];
    const items: LiveReportItem[] = JSON.parse(raw);
    if (!Array.isArray(items)) return [];
    const deleted = getDeletedReportIds();
    return items.filter(
      (r) =>
        r &&
        !deleted.has(r.id) &&
        !deleted.has(r.tracking_code) &&
        !r.id?.startsWith("rep-mock") &&
        !r.id?.startsWith("mock-")
    );
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
 * Ekstraksi nama pelapor dari teks deskripsi (format: [Pelapor: <nama>])
 */
export function extractReporterNameFromDescription(rawDesc?: string): string | undefined {
  if (!rawDesc) return undefined;
  const match = rawDesc.match(/\[Pelapor:\s*([\s\S]*?)\]/i);
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
 * Membersihkan teks deskripsi laporan dari tag teknis [Foto: ...], [Kontak: ...], [Pelapor: ...], [Akurasi GPS: ...] serta emoji
 */
export function cleanReportDescription(rawDesc?: string): string {
  if (!rawDesc) return "";
  let cleaned = rawDesc;

  // Hapus tag [Foto: ...] baik base64 panjang maupun URL (termasuk multiline)
  cleaned = cleaned.replace(/\[Foto:\s*[\s\S]*?\]/gi, "");

  // Hapus tag [Kontak: ...]
  cleaned = cleaned.replace(/\[Kontak:\s*[\s\S]*?\]/gi, "");

  // Hapus tag [Pelapor: ...]
  cleaned = cleaned.replace(/\[Pelapor:\s*[\s\S]*?\]/gi, "");

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

// Daftar ID & kode tracking data uji coba lama yang telah dibersihkan secara permanen
export const PURGED_LEGACY_IDS = new Set([
  "f7257756-b1ae-48d9-8e49-1f3bf6bd14d7",
  "57735c09-b0e8-45a5-8e74-bfb4f530a68f",
  "SOS-7111",
  "SOS-9233",
]);

/**
 * Mengambil ID dan kode tracking laporan yang telah dihapus admin
 */
export function getDeletedReportIds(): Set<string> {
  const baseSet = new Set(PURGED_LEGACY_IDS);
  if (typeof window === "undefined") return baseSet;
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_DELETED_KEY);
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

        const isSosReport = Boolean(
          isSos ||
          (row.tracking_code || "").toUpperCase().startsWith("SOS-") ||
          row.title?.toUpperCase().includes("SOS")
        );

        const calculatedPriority: "kritis" | "tinggi" | "sedang" | "rendah" | "normal" =
          isSosReport
            ? "kritis"
            : row.status === "selesai"
            ? "rendah"
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
 * Menghapus seluruh cache laporan, sinyal SOS, dan data sementara lokal di browser pengguna
 */
export function clearAllLocalReportsAndCaches(): void {
  if (typeof window === "undefined") return;
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (
        key &&
        (key.startsWith("sigapbumi_") ||
          key.includes("sos") ||
          key.includes("report") ||
          key.includes("coords"))
      ) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k));

    try {
      sessionStorage.clear();
    } catch {}

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
 * Inferensi nama provinsi dan kabupaten/kota dari teks alamat laporan
 */
export function inferRegionFromAddress(address?: string): { province?: string; regency?: string } {
  if (!address) return {};
  const addr = address.toLowerCase();
  let province: string | undefined;
  let regency: string | undefined;

  if (
    addr.includes("jawa barat") ||
    addr.includes("bandung") ||
    addr.includes("sumedang") ||
    addr.includes("bogor") ||
    addr.includes("bekasi") ||
    addr.includes("depok") ||
    addr.includes("cirebon") ||
    addr.includes("indramayu")
  ) {
    province = "Jawa Barat";
  } else if (addr.includes("jakarta")) {
    province = "DKI Jakarta";
  } else if (
    addr.includes("yogyakarta") ||
    addr.includes("jogja") ||
    addr.includes("bantul") ||
    addr.includes("sleman") ||
    addr.includes("kulon progo") ||
    addr.includes("gunungkidul")
  ) {
    province = "DI Yogyakarta";
  } else if (
    addr.includes("jawa timur") ||
    addr.includes("surabaya") ||
    addr.includes("malang") ||
    addr.includes("sidoarjo") ||
    addr.includes("gresik") ||
    addr.includes("banyuwangi")
  ) {
    province = "Jawa Timur";
  } else if (
    addr.includes("jawa tengah") ||
    addr.includes("semarang") ||
    addr.includes("solo") ||
    addr.includes("surakarta") ||
    addr.includes("banyumas") ||
    addr.includes("cilacap") ||
    addr.includes("purwokerto")
  ) {
    province = "Jawa Tengah";
  } else if (addr.includes("banten") || addr.includes("tangerang") || addr.includes("serang")) {
    province = "Banten";
  } else if (addr.includes("bali") || addr.includes("denpasar")) {
    province = "Bali";
  }

  const regencyMatch = address.match(/(Kabupaten\s+[\w\s]+|Kota\s+[\w\s]+|Jakarta\s+\w+)/i);
  if (regencyMatch) {
    regency = regencyMatch[1].split(",")[0].trim();
  }

  return { province, regency };
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
          (row.tracking_code || "").toUpperCase().startsWith("SOS-") ||
          row.title?.toUpperCase().includes("SOS")
        );

        const priority: "kritis" | "tinggi" | "sedang" | "rendah" | "normal" =
          isSosReport
            ? "kritis"
            : row.status === "selesai"
            ? "rendah"
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
        const extractedReporter = extractReporterNameFromDescription(rawDesc) || (row as any).reporter_name || undefined;
        const cleanDesc = cleanReportDescription(rawDesc);
        const { province: inferredProv, regency: inferredReg } = inferRegionFromAddress(row.address);

        return {
          id: row.id,
          tracking_code: row.tracking_code,
          disaster_type: disaster,
          target_agency: agency,
          title: removeEmojis(row.title),
          description: cleanDesc,
          address: removeEmojis(row.address) || "Lokasi Koordinat GPS Terdeteksi",
          province: row.province || inferredProv,
          regency: row.regency || inferredReg,
          lat: coords.lat,
          lng: coords.lng,
          status: row.status as ReportStatus,
          priority,
          confirmation_count: row.confirmation_count || 0,
          created_at: formatReportTime(row.created_at),
          raw_created_at: row.created_at,
          image_url: extractedPhoto,
          phone_number: extractedPhone,
          reporter_name: extractedReporter,
          is_demo: false,
        };
      });
    }
  } catch (err) {
    console.warn("fetchLiveReports Supabase warning:", err);
  }

  // 1b. Cek dan sinkronkan status dari tabel sos_alerts Supabase jika ada sinyal SOS yang sudah diproses
  try {
    const { data: sosRows } = await supabase
      .from("sos_alerts")
      .select("id, status, note, created_at");
    if (sosRows && sosRows.length > 0) {
      sosRows.forEach((s) => {
        const match = liveItems.find(
          (r) => r.id === s.id || (s.note && s.note.includes(r.tracking_code))
        );
        if (match) {
          if (s.status === "ditangani" && match.status === "diterima") {
            match.status = "ditindaklanjuti";
          } else if (s.status === "selesai" && match.status !== "selesai") {
            match.status = "selesai";
          } else if (s.status === "palsu" && match.status !== "ditolak") {
            match.status = "ditolak";
          }
        }
      });
    }
  } catch (err) {
    console.warn("fetchLiveReports sos_alerts sync warning:", err);
  }

  // Coba ambil dari endpoint sinkronisasi lintas browser /api/reports
  if (typeof window !== "undefined") {
    try {
      const apiRes = await fetch("/api/reports", { cache: "no-store" });
      if (apiRes.ok) {
        const apiJson = await apiRes.json();
        if (apiJson.success && Array.isArray(apiJson.reports)) {
          apiJson.reports.forEach((row: any) => {
            const coords = parsePostGISPoint(row.location) || {
              lat: typeof row.lat === "number" ? row.lat : -6.2088,
              lng: typeof row.lng === "number" ? row.lng : 106.8456,
            };
            const disaster = (row.disaster_type || "lainnya") as DisasterType;
            const agency = inferAgencyFromDisaster(disaster);
            const rawDesc = row.description || "";
            const extractedPhoto = extractPhotoFromDescription(rawDesc) || row.image_url;
            const extractedPhone = extractPhoneFromDescription(rawDesc) || row.phone_number;
            const extractedReporter = extractReporterNameFromDescription(rawDesc) || row.reporter_name;
            const cleanDesc = cleanReportDescription(rawDesc);
            const { province: inferredProv, regency: inferredReg } = inferRegionFromAddress(row.address);

            const isSos = Boolean(
              (row.tracking_code || "").toUpperCase().startsWith("SOS-") ||
              row.title?.toUpperCase().includes("SOS")
            );

            const priority = isSos
              ? "kritis"
              : row.status === "selesai"
              ? "rendah"
              : (row.priority_score || 0) >= 70
              ? "tinggi"
              : (row.priority_score || 0) >= 35
              ? "sedang"
              : "rendah";

            const apiItem: LiveReportItem = {
              id: row.id,
              tracking_code: row.tracking_code,
              disaster_type: disaster,
              target_agency: agency,
              title: removeEmojis(row.title || "Laporan Warga"),
              description: cleanDesc,
              address: removeEmojis(row.address) || "Lokasi Koordinat GPS Terdeteksi",
              province: row.province || inferredProv,
              regency: row.regency || inferredReg,
              lat: coords.lat,
              lng: coords.lng,
              status: (row.status || "diterima") as ReportStatus,
              priority,
              confirmation_count: row.confirmation_count || 0,
              created_at: formatReportTime(row.created_at || new Date().toISOString()),
              raw_created_at: row.created_at || new Date().toISOString(),
              image_url: extractedPhoto,
              phone_number: extractedPhone,
              reporter_name: extractedReporter,
              is_demo: false,
            };

            // Tambahkan jika belum ada di liveItems
            if (!liveItems.some((x) => x.tracking_code === apiItem.tracking_code || x.id === apiItem.id)) {
              liveItems.push(apiItem);
            }
          });
        }
      }
    } catch (apiErr) {
      console.warn("fetchLiveReports /api/reports fallback notice:", apiErr);
    }
  }

  // Gabungkan laporan: Mock baseline -> Local Reports baseline -> Supabase live (Database pusat SELALU menang)
  const mergedMap = new Map<string, LiveReportItem>();

  // 1. Data default demonstrasi
  DEFAULT_MOCK_REPORTS.forEach((item) => {
    mergedMap.set(item.tracking_code, item);
    mergedMap.set(item.id, item);
  });

  // 2. Data lokal perangkat pengguna (laporan baru offline/draft)
  localReports.forEach((item) => {
    const rawDesc = item.description || "";
    const extractedPhoto = extractPhotoFromDescription(rawDesc) || item.image_url;
    const extractedPhone = extractPhoneFromDescription(rawDesc) || item.phone_number;
    const extractedReporter = extractReporterNameFromDescription(rawDesc) || item.reporter_name;
    const cleanDesc = cleanReportDescription(rawDesc);

    const sanitized: LiveReportItem = {
      ...item,
      description: cleanDesc,
      image_url: extractedPhoto,
      phone_number: extractedPhone,
      reporter_name: extractedReporter,
    };
    mergedMap.set(item.tracking_code, sanitized);
    mergedMap.set(item.id, sanitized);
  });

  // 3. Data database Supabase riil (MUTLAK MENIMPA data lokal & mock agar status selalu sinkron antar-browser)
  liveItems.forEach((item) => {
    const prev = mergedMap.get(item.tracking_code) || mergedMap.get(item.id);
    const resolved: LiveReportItem = {
      ...(prev || {}),
      ...item,
      status: item.status, // Status dari database pusat mutlak menjadi acuan
    };
    mergedMap.set(item.tracking_code, resolved);
    mergedMap.set(item.id, resolved);
  });

  // 4. Sinkronkan kembali cache lokal di browser ini agar data lokal tidak basi
  try {
    const updatedLocal = localReports.map((local) => {
      const serverMatch = liveItems.find(
        (s) => s.id === local.id || s.tracking_code === local.tracking_code
      );
      if (serverMatch) {
        return {
          ...local,
          status: serverMatch.status,
          confirmation_count: serverMatch.confirmation_count,
        };
      }
      return local;
    });
    if (typeof window !== "undefined") {
      localStorage.setItem("sigapbumi_local_reports", JSON.stringify(updatedLocal));
    }
  } catch {}

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
    const rawLat = Number(r.lat);
    const rawLng = Number(r.lng);
    const lat = !isNaN(rawLat) && isFinite(rawLat) ? rawLat : -6.2088;
    const lng = !isNaN(rawLng) && isFinite(rawLng) ? rawLng : 106.8456;

    return {
      id: r.id,
      tracking_code: r.tracking_code,
      disaster_type: r.disaster_type,
      title: r.title,
      location_name: r.address,
      lat,
      lng,
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
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(code);
    let query = supabase
      .from("reports")
      .select("*, report_status_logs(*), report_media(*)");
    if (isUuid) {
      query = query.or(`id.eq.${code},tracking_code.eq.${code}`);
    } else {
      query = query.or(`tracking_code.eq.${code},tracking_code.ilike.${code}`);
    }
    const { data, error } = await query.maybeSingle();

    if (!error && data) {
      // Sinkronkan status dari tabel sos_alerts jika lebih lanjut
      try {
        const { data: sosAlert } = await supabase
          .from("sos_alerts")
          .select("status")
          .eq("id", data.id)
          .maybeSingle();
        if (sosAlert) {
          if (sosAlert.status === "ditangani" && data.status === "diterima") {
            data.status = "ditindaklanjuti";
          } else if (sosAlert.status === "selesai" && data.status !== "selesai") {
            data.status = "selesai";
          } else if (sosAlert.status === "palsu" && data.status !== "ditolak") {
            data.status = "ditolak";
          }
        }
      } catch {}

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

      // Ekstraksi kontak & nama pelapor jika ada
      const phoneNumber = data.reporter_phone || extractPhoneFromDescription(data.description) || data.phone_number || undefined;
      const reporterName = (data as any).reporter_name || extractReporterNameFromDescription(data.description) || undefined;

      // Bersihkan deskripsi dari string base64 / tag foto / metadata teknis
      const cleanDescription = cleanReportDescription(data.description);

      const logs = (data.report_status_logs || []) as Array<{
        status: ReportStatus;
        note?: string;
        created_at: string;
      }>;

      let timeline: TimelineStep[] = [];
      if (logs.length > 0) {
        timeline = logs.map((log) => ({
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
        }));

        // Pastikan status saat ini tercantum di timeline
        if (data.status === "ditindaklanjuti" && !timeline.some((t) => t.status === "ditindaklanjuti")) {
          timeline.push({
            status: "ditindaklanjuti",
            label: "Penanganan Operasional Berjalan",
            timestamp: formatReportTime(data.updated_at || new Date().toISOString()),
            note: "Tim operasional siaga dan unit penolong telah dikerahkan ke lokasi darurat warga.",
          });
        } else if (data.status === "selesai" && !timeline.some((t) => t.status === "selesai")) {
          if (!timeline.some((t) => t.status === "ditindaklanjuti")) {
            timeline.push({
              status: "ditindaklanjuti",
              label: "Penanganan Operasional Berjalan",
              timestamp: formatReportTime(data.updated_at || new Date().toISOString()),
              note: "Tim operasional dikerahkan ke lokasi darurat warga.",
            });
          }
          timeline.push({
            status: "selesai",
            label: "Penanganan Selesai",
            timestamp: formatReportTime(data.updated_at || new Date().toISOString()),
            note: "Penanganan insiden telah selesai ditangani secara tuntas oleh posko.",
          });
        }
      } else {
        timeline = [
          {
            status: "diterima",
            label: "Laporan Diterima Sistem",
            timestamp: formatReportTime(data.created_at),
            note: "Laporan baru diterima oleh sistem.",
          },
        ];
        if (data.status === "diverifikasi") {
          timeline.push({
            status: "diverifikasi",
            label: "Diverifikasi Petugas",
            timestamp: formatReportTime(data.updated_at || data.created_at),
            note: "Laporan telah diverifikasi oleh petugas posko.",
          });
        } else if (data.status === "ditindaklanjuti") {
          timeline.push({
            status: "ditindaklanjuti",
            label: "Penanganan Operasional Berjalan",
            timestamp: formatReportTime(data.updated_at || data.created_at),
            note: "Tim operasional siaga dan unit penolong telah dikerahkan ke lokasi darurat warga.",
          });
        } else if (data.status === "selesai") {
          timeline.push({
            status: "ditindaklanjuti",
            label: "Penanganan Operasional Berjalan",
            timestamp: formatReportTime(data.updated_at || data.created_at),
            note: "Tim operasional telah dikerahkan ke lokasi.",
          });
          timeline.push({
            status: "selesai",
            label: "Penanganan Selesai",
            timestamp: formatReportTime(data.updated_at || data.created_at),
            note: "Penanganan insiden telah selesai ditangani secara tuntas oleh posko.",
          });
        } else if (data.status === "ditolak") {
          timeline.push({
            status: "ditolak",
            label: "Laporan Ditolak",
            timestamp: formatReportTime(data.updated_at || data.created_at),
            note: "Laporan ditolak setelah peninjauan posko operasional.",
          });
        }
      }

      const isSosReport = Boolean(
        (data.tracking_code || "").toUpperCase().startsWith("SOS-") ||
        data.title?.toUpperCase().includes("SOS")
      );

      const { province: inferredProv, regency: inferredReg } = inferRegionFromAddress(data.address);
      const priority = isSosReport
        ? "kritis"
        : data.status === "selesai"
        ? "rendah"
        : data.priority_score >= 70
        ? "tinggi"
        : data.priority_score >= 35
        ? "sedang"
        : "rendah";

      const priority_label = isSosReport
        ? "Kritis"
        : priority === "tinggi"
        ? "Tinggi"
        : priority === "rendah"
        ? "Rendah"
        : "Sedang";

      return {
        id: data.id,
        tracking_code: data.tracking_code,
        disaster_type: disaster,
        target_agency: agency,
        title: removeEmojis(data.title),
        description: cleanDescription,
        address: removeEmojis(data.address) || "Lokasi Koordinat GPS",
        province: data.province || inferredProv,
        regency: data.regency || inferredReg,
        lat: coords.lat,
        lng: coords.lng,
        status: data.status as ReportStatus,
        priority,
        priority_label,
        confirmation_count: data.confirmation_count || 0,
        created_at: formatReportTime(data.created_at),
        timeline,
        image_url: imageUrl,
        phone_number: phoneNumber,
        reporter_name: reporterName,
        is_demo: false,
      };
    }
  } catch (err) {
    console.warn("fetchReportDetail Supabase warning:", err);
  }

  // 2. Cek ke endpoint sinkronisasi API server terpusat /api/reports?code=...
  if (typeof window !== "undefined") {
    try {
      const apiRes = await fetch(`/api/reports?code=${encodeURIComponent(code)}`, { cache: "no-store" });
      if (apiRes.ok) {
        const apiJson = await apiRes.json();
        if (apiJson.success && apiJson.report) {
          const row = apiJson.report;
          const coords = parsePostGISPoint(row.location) || {
            lat: typeof row.lat === "number" ? row.lat : -6.2088,
            lng: typeof row.lng === "number" ? row.lng : 106.8456,
          };
          const disaster = (row.disaster_type || "lainnya") as DisasterType;
          let agency = inferAgencyFromDisaster(disaster);

          const isSos = Boolean(
            (row.tracking_code || "").toUpperCase().startsWith("SOS-") ||
            (row.title || "").toUpperCase().includes("SOS")
          );

          const rawDesc = row.description || "";
          const photoUrl =
            (Array.isArray(row.report_media) && row.report_media.length > 0
              ? row.report_media[0].media_url
              : undefined) ||
            extractPhotoFromDescription(rawDesc) ||
            row.image_url;

          const phoneNumber =
            row.reporter_phone ||
            extractPhoneFromDescription(rawDesc) ||
            row.phone_number ||
            undefined;
          const reporterName =
            row.reporter_name ||
            extractReporterNameFromDescription(rawDesc) ||
            undefined;
          const cleanDesc = cleanReportDescription(rawDesc);

          const logs = (row.report_status_logs || []) as Array<{
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
                    status: (row.status || "diterima") as ReportStatus,
                    label:
                      row.status === "diterima"
                        ? "Laporan Diterima Sistem"
                        : "Status Terkini",
                    timestamp: formatReportTime(row.created_at || new Date().toISOString()),
                    note: "Laporan tersimpan di database SigapBumi.",
                  },
                ];

          const { province: inferredProv, regency: inferredReg } = inferRegionFromAddress(row.address);
          const priority = isSos
            ? "kritis"
            : row.status === "selesai"
            ? "rendah"
            : (row.priority_score || 0) >= 70
            ? "tinggi"
            : (row.priority_score || 0) >= 35
            ? "sedang"
            : "rendah";

          const priority_label = isSos
            ? "Kritis"
            : priority === "tinggi"
            ? "Tinggi"
            : priority === "sedang"
            ? "Sedang"
            : "Rendah";

          return {
            id: row.id,
            tracking_code: row.tracking_code,
            disaster_type: disaster,
            target_agency: agency,
            title: removeEmojis(row.title || "Laporan Warga"),
            description: cleanDesc,
            address: removeEmojis(row.address) || "Lokasi Koordinat GPS Terdeteksi",
            province: row.province || inferredProv,
            regency: row.regency || inferredReg,
            lat: coords.lat,
            lng: coords.lng,
            status: (row.status || "diterima") as ReportStatus,
            priority,
            priority_label,
            confirmation_count: row.confirmation_count || 0,
            created_at: formatReportTime(row.created_at || new Date().toISOString()),
            timeline,
            image_url: photoUrl,
            phone_number: phoneNumber,
            reporter_name: reporterName,
            is_demo: false,
          };
        }
      }
    } catch (apiErr) {
      console.warn("fetchReportDetail /api/reports fallback notice:", apiErr);
    }
  }

  // 3. Cek apakah ada di cache lokal perangkat
  const localItems = getLocalReports();
  const localFound = localItems.find((r) => r.tracking_code === code);
  if (localFound) {
    const imageUrl = localFound.image_url || extractPhotoFromDescription(localFound.description);
    const cleanDescription = cleanReportDescription(localFound.description);
    const reporterName = localFound.reporter_name || extractReporterNameFromDescription(localFound.description);
    const phoneNum = localFound.phone_number || extractPhoneFromDescription(localFound.description);

    return {
      ...localFound,
      description: cleanDescription,
      image_url: imageUrl,
      reporter_name: reporterName,
      phone_number: phoneNum,
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
      window.dispatchEvent(new CustomEvent("sigapbumi:sos-updated", { detail: { id: reportId, status: newStatus } }));
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
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(reportId);
      await supabase
        .from("reports")
        .update({
          status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .or(`id.eq.${reportId},tracking_code.eq.${reportId}`);

      let targetUuid = isUuid ? reportId : null;
      if (!targetUuid) {
        const { data: rep } = await supabase
          .from("reports")
          .select("id")
          .eq("tracking_code", reportId)
          .maybeSingle();
        if (rep?.id) targetUuid = rep.id;
      }

      if (targetUuid) {
        try {
          await supabase.from("report_status_logs").insert({
            report_id: targetUuid,
            status: newStatus,
            note: cleanNote,
            created_at: new Date().toISOString(),
          });
        } catch {}

        try {
          const sosStatus =
            newStatus === "ditolak"
              ? "selesai"
              : newStatus === "ditindaklanjuti"
              ? "ditangani"
              : newStatus === "selesai"
              ? "selesai"
              : "aktif";
          const sosPayload: Record<string, unknown> = { status: sosStatus };
          if (newStatus === "selesai" || newStatus === "ditolak") {
            sosPayload.resolved_at = new Date().toISOString();
          }
          await supabase
            .from("sos_alerts")
            .update(sosPayload)
            .eq("id", targetUuid);
        } catch {}
      }
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

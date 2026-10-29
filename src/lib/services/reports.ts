import { supabase } from "@/lib/supabase/client";
import { parsePostGISPoint } from "@/lib/geo";
import type { DisasterType, ReportStatus, SosAssistanceType } from "@/types";
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
  priority: "tinggi" | "sedang" | "normal";
  confirmation_count: number;
  created_at: string;
  timeline?: TimelineStep[];
  is_demo?: boolean;
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

// Dataset awal terstruktur 90 kejadian bencana di seluruh Indonesia
export const DEFAULT_MOCK_REPORTS: LiveReportItem[] = MASTER_MOCK_REPORTS;

export const DEFAULT_MOCK_SOS: LiveSosAlertItem[] = [
  {
    id: "sos-1",
    sender_name: "Warga Kalideres (via GPS)",
    assistance_type: "damkar",
    location: "Kelurahan Semanan, Kalideres, Jakarta Barat",
    coordinates: "-6.155, 106.723",
    lat: -6.155,
    lng: 106.723,
    time: "2 menit lalu",
    status: "aktif",
  },
  {
    id: "sos-2",
    sender_name: "Warga Cisarua (via GPS)",
    assistance_type: "medis",
    location: "Jalan Raya Puncak KM 82, Cisarua, Bogor",
    coordinates: "-6.698, 106.942",
    lat: -6.698,
    lng: 106.942,
    time: "8 menit lalu",
    status: "aktif",
  },
];

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
 * Mengambil daftar laporan: menggabungkan data Supabase live, local cache perangkat, dan data demo
 */
export async function fetchLiveReports(): Promise<LiveReportItem[]> {
  const localReports = getLocalReports();
  let liveItems: LiveReportItem[] = [];

  try {
    const { data, error } = await supabase
      .from("reports")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data && data.length > 0) {
      liveItems = data.map((row) => {
        const coords = parsePostGISPoint(row.location) || { lat: -6.2088, lng: 106.8456 };
        const disaster = row.disaster_type as DisasterType;
        const agency = inferAgencyFromDisaster(disaster);
        const priority: "tinggi" | "sedang" | "normal" =
          row.priority_score >= 80 ? "tinggi" : row.priority_score >= 30 ? "sedang" : "normal";

        return {
          id: row.id,
          tracking_code: row.tracking_code,
          disaster_type: disaster,
          target_agency: agency,
          title: row.title,
          description: row.description,
          address: row.address || "Lokasi Koordinat GPS Terdeteksi",
          lat: coords.lat,
          lng: coords.lng,
          status: row.status as ReportStatus,
          priority,
          confirmation_count: row.confirmation_count || 0,
          created_at: formatReportTime(row.created_at),
          is_demo: false,
        };
      });
    }
  } catch (err) {
    console.warn("fetchLiveReports Supabase warning:", err);
  }

  // Gabungkan laporan Supabase + Laporan Lokal Pengguna + Demo bawaan
  const mergedMap = new Map<string, LiveReportItem>();

  // 1. Data default demonstrasi
  DEFAULT_MOCK_REPORTS.forEach((item) => mergedMap.set(item.tracking_code, item));

  // 2. Data lokal perangkat pengguna (laporan baru yang dikirim di sesi ini)
  localReports.forEach((item) => mergedMap.set(item.tracking_code, item));

  // 3. Data database Supabase riil
  liveItems.forEach((item) => mergedMap.set(item.tracking_code, item));

  return Array.from(mergedMap.values());
}

/**
 * Konversi daftar LiveReportItem ke format MapPoint untuk Leaflet
 */
export function reportsToMapPoints(reports: LiveReportItem[]): MapPoint[] {
  return reports.map((r) => ({
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
    is_demo: r.is_demo,
    province: r.province,
    regency: r.regency,
  }));
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
      .select("*, report_status_logs(*)")
      .eq("tracking_code", code)
      .maybeSingle();

    if (!error && data) {
      const coords = parsePostGISPoint(data.location) || { lat: -6.2088, lng: 106.8456 };
      const disaster = data.disaster_type as DisasterType;
      const agency = inferAgencyFromDisaster(disaster);

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

      return {
        id: data.id,
        tracking_code: data.tracking_code,
        disaster_type: disaster,
        target_agency: agency,
        title: data.title,
        description: data.description,
        address: data.address || "Lokasi Koordinat GPS",
        lat: coords.lat,
        lng: coords.lng,
        status: data.status as ReportStatus,
        priority: data.priority_score >= 80 ? "tinggi" : "sedang",
        confirmation_count: data.confirmation_count || 0,
        created_at: formatReportTime(data.created_at),
        timeline,
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
    return localFound;
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

    // Update data lokal jika ini laporan di cache browser
    const localItems = getLocalReports();
    const localMatch = localItems.find(
      (r) => r.id === reportId || r.tracking_code === reportId
    );
    if (localMatch) {
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
    }

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

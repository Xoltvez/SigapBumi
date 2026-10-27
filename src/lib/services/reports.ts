import { supabase } from "@/lib/supabase/client";
import { parsePostGISPoint } from "@/lib/geo";
import type { DisasterType, ReportStatus, SosAssistanceType } from "@/types";
import type { MapPoint } from "@/components/peta/DisasterMap";
import type { TimelineStep } from "@/components/laporan/TimelineStatus";

export interface LiveReportItem {
  id: string;
  tracking_code: string;
  disaster_type: DisasterType;
  target_agency: SosAssistanceType;
  title: string;
  description: string;
  address: string;
  lat: number;
  lng: number;
  status: ReportStatus;
  priority: "tinggi" | "sedang" | "normal";
  confirmation_count: number;
  created_at: string;
  timeline?: TimelineStep[];
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

// Data awal sebagai demo fallback agar tampilan tetap informatif saat database kosong
export const DEFAULT_MOCK_REPORTS: LiveReportItem[] = [
  {
    id: "rep-1",
    tracking_code: "LPR-8F3K2Q",
    disaster_type: "banjir",
    target_agency: "damkar",
    title: "Banjir Luapan Kali Semanan 60 cm",
    description:
      "Akses jalan utama terputus akibat luapan kali. Air terus naik sejak pukul 14.00 WIB. Terdapat sekitar 40 KK membutuhkan bantuan evakuasi lansia.",
    address: "Kalideres, Jakarta Barat",
    lat: -6.155,
    lng: 106.723,
    status: "ditindaklanjuti",
    priority: "tinggi",
    confirmation_count: 24,
    created_at: "27 Okt 2026, 14:15 WIB",
    timeline: [
      {
        status: "diterima",
        label: "Laporan Diterima Sistem",
        timestamp: "27 Okt 2026, 14:15 WIB",
        note: "Laporan masuk dengan foto bukti genangan air dan diteruskan ke posko terpadu.",
      },
      {
        status: "diverifikasi",
        label: "Diverifikasi Relawan Posko",
        timestamp: "27 Okt 2026, 14:26 WIB",
        actor: "Relawan FPRB Kalideres",
        note: "Kondisi di lapangan terkonfirmasi benar. Arus air cukup deras.",
      },
      {
        status: "ditindaklanjuti",
        label: "Penanganan Operasional Berjalan",
        timestamp: "27 Okt 2026, 14:48 WIB",
        actor: "Regu Damkar & TRC BPBD Sektor Barat",
        note: "2 unit perahu karet evakuasi dan 1 pompa mobile telah tiba di lokasi.",
      },
    ],
  },
  {
    id: "rep-2",
    tracking_code: "LPR-4K9W1Z",
    disaster_type: "longsor",
    target_agency: "bnpb_bpbd",
    title: "Tebing Penahan Longsor Ambrol",
    description:
      "Tebing setinggi 4 meter ambrol setelah hujan deras. Menutup sebagian badan jalan akses antar desa.",
    address: "Cisarua, Kab. Bogor",
    lat: -6.698,
    lng: 106.942,
    status: "diverifikasi",
    priority: "tinggi",
    confirmation_count: 12,
    created_at: "27 Okt 2026, 15:30 WIB",
    timeline: [
      {
        status: "diterima",
        label: "Laporan Diterima Sistem",
        timestamp: "27 Okt 2026, 15:30 WIB",
        note: "Laporan masuk dengan koordinat GPS akurat.",
      },
      {
        status: "diverifikasi",
        label: "Diverifikasi BPBD Wilayah II",
        timestamp: "27 Okt 2026, 15:42 WIB",
        actor: "Petugas Piket Pusdalops",
        note: "Diverifikasi valid. Koordinasi dengan Dinas PUPR untuk alat berat mini loader.",
      },
    ],
  },
  {
    id: "rep-3",
    tracking_code: "LPR-7N2V9Q",
    disaster_type: "banjir",
    target_agency: "medis",
    title: "Genangan Air Masuk Pemukiman Warga",
    description:
      "Genangan air setinggi 30 cm merendam pemukiman warga RT 04 RW 02. Beberapa lansia membutuhkan obat-obatan rutin.",
    address: "Jatinegara, Jakarta Timur",
    lat: -6.226,
    lng: 106.862,
    status: "diterima",
    priority: "sedang",
    confirmation_count: 16,
    created_at: "27 Okt 2026, 15:02 WIB",
    timeline: [
      {
        status: "diterima",
        label: "Laporan Diterima Sistem",
        timestamp: "27 Okt 2026, 15:02 WIB",
        note: "Laporan tercatat dalam antrean penanganan posko medis.",
      },
    ],
  },
  {
    id: "rep-4",
    tracking_code: "LPR-2X7M9P",
    disaster_type: "kebakaran",
    target_agency: "damkar",
    title: "Kebakaran Pemukiman Padat Tambora",
    description:
      "Dugaan korsleting listrik di lantai 2. Warga sempat memadamkan dengan APAR lokal sebelum petugas damkar tiba.",
    address: "Tambora, Jakarta Barat",
    lat: -6.149,
    lng: 106.804,
    status: "selesai",
    priority: "tinggi",
    confirmation_count: 31,
    created_at: "27 Okt 2026, 11:20 WIB",
    timeline: [
      {
        status: "diterima",
        label: "Laporan Diterima Sistem",
        timestamp: "27 Okt 2026, 11:20 WIB",
        note: "Sistem menerima sinyal darurat kebakaran.",
      },
      {
        status: "diverifikasi",
        label: "Diverifikasi Command Center Damkar",
        timestamp: "27 Okt 2026, 11:23 WIB",
        actor: "Piket 112 Jakarta Barat",
        note: "6 unit armada pemadam terdekat dikerahkan ke lokasi.",
      },
      {
        status: "ditindaklanjuti",
        label: "Operasi Pemadaman & Pendinginan",
        timestamp: "27 Okt 2026, 11:35 WIB",
        actor: "Sektor Tambora",
        note: "Api berhasil dilokalisir agar tidak merembet ke bangunan lain.",
      },
      {
        status: "selesai",
        label: "Situasi Padam Total & Aman",
        timestamp: "27 Okt 2026, 12:40 WIB",
        actor: "Perwira Piket Damkar",
        note: "Operasi dinyatakan selesai. Tidak ada korban jiwa.",
      },
    ],
  },
  {
    id: "rep-5",
    tracking_code: "LPR-5M1Q8L",
    disaster_type: "karhutla",
    target_agency: "bnpb_bpbd",
    title: "Titik Asap Lahan Kering Perbukitan",
    description:
      "Asap tebal mengepul dari semak belukar lereng bukit. Dikhawatirkan merembet ke perkebunan warga jika tertiup angin.",
    address: "Rumpin, Kab. Bogor",
    lat: -6.442,
    lng: 106.637,
    status: "ditindaklanjuti",
    priority: "sedang",
    confirmation_count: 9,
    created_at: "27 Okt 2026, 13:40 WIB",
    timeline: [
      {
        status: "diterima",
        label: "Laporan Diterima Sistem",
        timestamp: "27 Okt 2026, 13:40 WIB",
        note: "Laporan masuk via GPS relawan peduli api.",
      },
      {
        status: "ditindaklanjuti",
        label: "Pemadaman Darat Berjalan",
        timestamp: "27 Okt 2026, 14:10 WIB",
        actor: "Regu Manggala Agni & Warga",
        note: "Penyekatan sekat bakar sedang dilakukan.",
      },
    ],
  },
];

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
    return d.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }) + " WIB";
  } catch {
    return "Baru saja";
  }
}

/**
 * Mengambil daftar laporan langsung dari Supabase
 * dan menggabungkannya secara pintar dengan data bawaan.
 */
export async function fetchLiveReports(): Promise<LiveReportItem[]> {
  try {
    const { data, error } = await supabase
      .from("reports")
      .select("*")
      .order("created_at", { ascending: false });

    if (error || !data || data.length === 0) {
      return DEFAULT_MOCK_REPORTS;
    }

    const liveItems: LiveReportItem[] = data.map((row) => {
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
      };
    });

    // Gabungkan laporan live dari Supabase dengan data default yang belum ada di Supabase
    // agar demo selalu kaya data
    const liveCodes = new Set(liveItems.map((item) => item.tracking_code));
    const merged = [
      ...liveItems,
      ...DEFAULT_MOCK_REPORTS.filter((item) => !liveCodes.has(item.tracking_code)),
    ];

    return merged;
  } catch (err) {
    console.warn("fetchLiveReports error, using mock:", err);
    return DEFAULT_MOCK_REPORTS;
  }
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
  }));
}

/**
 * Mengambil detail laporan spesifik berdasarkan kode pelacakan
 */
export async function fetchReportDetail(trackingCode: string): Promise<LiveReportItem | null> {
  const code = trackingCode.trim().toUpperCase();

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

      // Raw logs dari database
      const logs = (data.report_status_logs || []) as Array<{
        status: ReportStatus;
        note?: string;
        created_at: string;
      }>;

      // Bentuk timeline dari log atau generate default step jika log belum ada
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
      };
    }
  } catch (err) {
    console.warn("fetchReportDetail Supabase error:", err);
  }

  // Fallback ke DEFAULT_MOCK_REPORTS jika tidak ada di database
  const mockFound = DEFAULT_MOCK_REPORTS.find((r) => r.tracking_code === code);
  return mockFound || null;
}

/**
 * Memperbarui status laporan di Supabase
 */
export async function updateReportStatusLive(
  reportId: string,
  newStatus: ReportStatus,
  note?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Jalankan update ke tabel reports
    const { error: repErr } = await supabase
      .from("reports")
      .update({
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", reportId);

    if (repErr) {
      console.warn("updateReportStatusLive note:", repErr.message);
      return { success: false, error: repErr.message };
    }

    // Catat log manual jika trigger RLS tidak mengizinkan trigger
    try {
      await supabase.from("report_status_logs").insert({
        report_id: reportId,
        status: newStatus,
        note: note || `Status diperbarui menjadi ${newStatus}`,
      });
    } catch {
      // Abaikan jika trigger otomatis sudah menangani
    }

    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal memperbarui status";
    return { success: false, error: message };
  }
}

export type UserRole = "warga" | "relawan" | "petugas";

export type ReportStatus =
  | "diterima"
  | "diverifikasi"
  | "ditindaklanjuti"
  | "selesai"
  | "ditolak";

export type DisasterType =
  | "banjir"
  | "gempa"
  | "kebakaran"
  | "longsor"
  | "tsunami"
  | "karhutla"
  | "lainnya";

export type SosAssistanceType = "damkar" | "medis" | "polisi" | "bnpb_bpbd";

export interface Profile {
  id: string;
  full_name: string;
  phone_number?: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface Report {
  id: string;
  tracking_code: string;
  disaster_type: DisasterType;
  title: string;
  description: string;
  latitude: number;
  longitude: number;
  address?: string;
  status: ReportStatus;
  confirmation_count: number;
  priority_score: number;
  reporter_id?: string;
  created_at: string;
  updated_at: string;
}

export interface ReportMedia {
  id: string;
  report_id: string;
  media_url: string;
  media_type: "image" | "video";
  created_at: string;
}

export interface ReportStatusLog {
  id: string;
  report_id: string;
  status: ReportStatus;
  note?: string;
  created_by?: string;
  created_at: string;
}

export interface ReportConfirmation {
  id: string;
  report_id: string;
  user_id: string;
  created_at: string;
}

export interface SosAlert {
  id: string;
  user_id?: string;
  latitude: number;
  longitude: number;
  assistance_type?: SosAssistanceType;
  status: "aktif" | "ditangani" | "selesai";
  note?: string;
  created_at: string;
  resolved_at?: string;
}

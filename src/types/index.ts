export type UserRole = "warga" | "relawan" | "petugas" | "koordinator";

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

export type PriorityLabel = "Kritis" | "Tinggi" | "Sedang" | "Rendah";

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
  priority_label?: PriorityLabel;
  version?: number;
  reporter_id?: string;
  reporter_name?: string;
  reporter_phone?: string;
  verified_at?: string;
  resolved_at?: string;
  duplicate_of?: string;
  regency?: string;
  province?: string;
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
  actor_name?: string;
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
  status: "aktif" | "ditangani" | "selesai" | "palsu";
  note?: string;
  closing_note?: string;
  acknowledged_by?: string;
  acknowledged_at?: string;
  created_at: string;
  resolved_at?: string;
}

export interface AuditLog {
  id: string;
  actor_id?: string;
  actor_name: string;
  action: string;
  entity: string;
  entity_id?: string;
  meta?: Record<string, unknown>;
  created_at: string;
}

export interface NotificationItem {
  id: string;
  user_id?: string;
  report_id?: string;
  tracking_code: string;
  title: string;
  body: string;
  read_at?: string;
  created_at: string;
}

import type { DisasterType, ReportStatus, SosAssistanceType } from "@/types";
import type { TimelineStep } from "@/components/laporan/TimelineStatus";

export interface MasterReportItem {
  id: string;
  tracking_code: string;
  disaster_type: DisasterType;
  target_agency: SosAssistanceType;
  title: string;
  description: string;
  province: string;
  regency: string;
  address: string;
  lat: number;
  lng: number;
  status: ReportStatus;
  priority: "tinggi" | "sedang" | "normal";
  confirmation_count: number;
  created_at: string;
  timeline: TimelineStep[];
  is_demo: boolean;
}

/**
 * Dataset Master Laporan Kebencanaan - Bersih tanpa data dummy/mock (murni data riil)
 */
export const MASTER_MOCK_REPORTS: MasterReportItem[] = [];

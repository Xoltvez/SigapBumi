-- Migration: Dashboard & Reports Performance Indexes (Non-destructive)
-- Hanya menambahkan B-Tree index pada kolom yang sering digunakan oleh WHERE & ORDER BY

CREATE INDEX IF NOT EXISTS idx_reports_created_at_desc
  ON public.reports (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_reports_status_created_at
  ON public.reports (status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_reports_tracking_code
  ON public.reports (tracking_code);

CREATE INDEX IF NOT EXISTS idx_sos_alerts_created_at_desc
  ON public.sos_alerts (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_sos_alerts_status
  ON public.sos_alerts (status);

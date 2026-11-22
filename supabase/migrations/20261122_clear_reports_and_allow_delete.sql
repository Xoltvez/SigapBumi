-- ==============================================================================
-- SIGAPBUMI: Pembersihan Seluruh Data Laporan (Data Akun Tetap Utuh)
-- ==============================================================================

-- 1. Bersihkan seluruh data laporan dan tabel turunannya
TRUNCATE TABLE 
  public.report_status_logs, 
  public.report_media, 
  public.report_confirmations, 
  public.reports, 
  public.sos_alerts 
CASCADE;

-- Catatan Keamanan Akun:
-- Tabel public.profiles dan auth.users SAMA SEKALI TIDAK DISENTUH sehingga
-- seluruh akun warga/petugas tetap tersimpan dengan aman dan dapat login normal.

-- 2. Tambahkan Kebijakan RLS DELETE agar posko/admin dapat mengelola & menghapus data laporan
DROP POLICY IF EXISTS "Petugas posko dapat menghapus laporan" ON public.reports;
CREATE POLICY "Petugas posko dapat menghapus laporan"
  ON public.reports FOR DELETE
  USING (true);

DROP POLICY IF EXISTS "Petugas posko dapat menghapus log status" ON public.report_status_logs;
CREATE POLICY "Petugas posko dapat menghapus log status"
  ON public.report_status_logs FOR DELETE
  USING (true);

DROP POLICY IF EXISTS "Petugas posko dapat menghapus sos_alerts" ON public.sos_alerts;
CREATE POLICY "Petugas posko dapat menghapus sos_alerts"
  ON public.sos_alerts FOR DELETE
  USING (true);

DROP POLICY IF EXISTS "Petugas posko dapat menghapus media laporan" ON public.report_media;
CREATE POLICY "Petugas posko dapat menghapus media laporan"
  ON public.report_media FOR DELETE
  USING (true);

DROP POLICY IF EXISTS "Petugas posko dapat menghapus konfirmasi laporan" ON public.report_confirmations;
CREATE POLICY "Petugas posko dapat menghapus konfirmasi laporan"
  ON public.report_confirmations FOR DELETE
  USING (true);

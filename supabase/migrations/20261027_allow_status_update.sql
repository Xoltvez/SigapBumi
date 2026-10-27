-- ==============================================================================
-- SIGAPBUMI: Pembaruan Kebijakan RLS & Fungsi RPC Update Status Petugas
-- ==============================================================================

-- 1. Buat Fungsi RPC Update Status (Bypass RLS dengan SECURITY DEFINER)
-- Fungsi ini memungkinkan posko petugas memperbarui status laporan dan mencatat timeline secara atomik.
CREATE OR REPLACE FUNCTION public.update_report_status_public(
  p_report_id UUID,
  p_new_status report_status,
  p_note TEXT DEFAULT 'Pembaruan status oleh posko komando'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_updated_report RECORD;
BEGIN
  -- Perbarui status laporan
  UPDATE public.reports
  SET
    status = p_new_status,
    updated_at = NOW()
  WHERE id = p_report_id
  RETURNING * INTO v_updated_report;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Laporan tidak ditemukan');
  END IF;

  -- Catat log ke tabel report_status_logs jika belum ditangani oleh trigger
  INSERT INTO public.report_status_logs (report_id, status, note, created_at)
  VALUES (p_report_id, p_new_status, p_note, NOW());

  RETURN jsonb_build_object(
    'success', true,
    'id', v_updated_report.id,
    'tracking_code', v_updated_report.tracking_code,
    'status', v_updated_report.status
  );
END;
$$;

-- Berikan izin akses eksekusi RPC ke pengguna anon dan authenticated
GRANT EXECUTE ON FUNCTION public.update_report_status_public(UUID, report_status, TEXT) TO anon, authenticated;

-- 2. Perbarui Kebijakan RLS UPDATE pada tabel reports agar posko komando dapat mengubah status
DROP POLICY IF EXISTS "Hanya petugas yang dapat mengubah status laporan" ON public.reports;
CREATE POLICY "Petugas posko dapat memperbarui status laporan"
  ON public.reports FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- 3. Kebijakan INSERT pada tabel report_status_logs
DROP POLICY IF EXISTS "Semua orang dapat mencatat log status" ON public.report_status_logs;
CREATE POLICY "Semua orang dapat mencatat log status"
  ON public.report_status_logs FOR INSERT
  WITH CHECK (true);

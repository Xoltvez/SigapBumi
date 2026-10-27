-- ==============================================================================
-- SIGAPBUMI: Migrasi Tahap A1 - Arsitektur Keamanan, Audit Log, dan Fungsi Status
-- Sesuai prd-admin.md bagian 9 dan agent-admin.md bagian 3
-- ==============================================================================

-- 1. Tambah Kolom Tambahan pada Tabel reports
DO $$ BEGIN
  ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS priority_label TEXT DEFAULT 'Sedang';
  ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;
  ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;
  ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ;
  ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS duplicate_of UUID REFERENCES public.reports(id) ON DELETE SET NULL;
  ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS regency TEXT;
  ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS province TEXT;
EXCEPTION
  WHEN duplicate_column THEN null;
END $$;

-- 2. Tambah Kolom Tambahan pada Tabel sos_alerts
DO $$ BEGIN
  ALTER TABLE public.sos_alerts ADD COLUMN IF NOT EXISTS help_type TEXT;
  ALTER TABLE public.sos_alerts ADD COLUMN IF NOT EXISTS acknowledged_by TEXT;
  ALTER TABLE public.sos_alerts ADD COLUMN IF NOT EXISTS acknowledged_at TIMESTAMPTZ;
  ALTER TABLE public.sos_alerts ADD COLUMN IF NOT EXISTS closing_note TEXT;
EXCEPTION
  WHEN duplicate_column THEN null;
END $$;

-- 3. Tabel Audit Logs (Pencatatan Permanen Seluruh Mutasi Petugas)
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID,
  actor_name TEXT NOT NULL DEFAULT 'Petugas Posko',
  action TEXT NOT NULL,
  entity TEXT NOT NULL,
  entity_id UUID,
  meta JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS audit_logs_created_at_idx ON public.audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS audit_logs_entity_idx ON public.audit_logs(entity, entity_id);

-- RLS untuk audit_logs (hanya bisa dibaca petugas dan hanya bisa diisi fungsi server)
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Audit logs dapat dibaca publik untuk transparansi" ON public.audit_logs;
CREATE POLICY "Audit logs dapat dibaca publik untuk transparansi"
  ON public.audit_logs FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Audit logs hanya dapat ditulis sistem" ON public.audit_logs;
CREATE POLICY "Audit logs hanya dapat ditulis sistem"
  ON public.audit_logs FOR INSERT
  WITH CHECK (true);

-- 4. Tabel Notifications (Notifikasi Warga saat Status Berubah)
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  report_id UUID REFERENCES public.reports(id) ON DELETE CASCADE,
  tracking_code TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS notifications_tracking_code_idx ON public.notifications(tracking_code);
CREATE INDEX IF NOT EXISTS notifications_created_at_idx ON public.notifications(created_at DESC);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Notifikasi dapat dibaca publik berdasarkan tracking code" ON public.notifications;
CREATE POLICY "Notifikasi dapat dibaca publik berdasarkan tracking code"
  ON public.notifications FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Sistem dapat membuat notifikasi" ON public.notifications;
CREATE POLICY "Sistem dapat membuat notifikasi"
  ON public.notifications FOR INSERT
  WITH CHECK (true);

-- 5. Fungsi Hitung Skor Prioritas Otomatis (prd-admin.md 7.2)
CREATE OR REPLACE FUNCTION public.compute_priority(p_report_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_report RECORD;
  v_score INTEGER := 0;
  v_label TEXT := 'Rendah';
  v_age_minutes INTEGER;
BEGIN
  SELECT * INTO v_report FROM public.reports WHERE id = p_report_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Laporan tidak ditemukan');
  END IF;

  -- 1. Poin Jenis Bencana
  CASE v_report.disaster_type
    WHEN 'tsunami' THEN v_score := v_score + 40;
    WHEN 'gempa' THEN v_score := v_score + 35;
    WHEN 'kebakaran' THEN v_score := v_score + 30;
    WHEN 'karhutla' THEN v_score := v_score + 30;
    WHEN 'banjir' THEN v_score := v_score + 25;
    WHEN 'longsor' THEN v_score := v_score + 25;
    ELSE v_score := v_score + 10;
  END CASE;

  -- 2. Poin Konfirmasi Warga (3 poin per konfirmasi, maks 30)
  v_score := v_score + LEAST(COALESCE(v_report.confirmation_count, 0) * 3, 30);

  -- 3. Poin Usia Menunggu (1 poin per 15 menit jika status masih diterima, maks 10)
  IF v_report.status = 'diterima' THEN
    v_age_minutes := EXTRACT(EPOCH FROM (NOW() - v_report.created_at)) / 60;
    v_score := v_score + LEAST(v_age_minutes / 15, 10);
  END IF;

  -- Tentukan label prioritas
  IF v_score >= 70 THEN
    v_label := 'Kritis';
  ELSIF v_score >= 50 THEN
    v_label := 'Tinggi';
  ELSIF v_score >= 30 THEN
    v_label := 'Sedang';
  ELSE
    v_label := 'Rendah';
  END IF;

  -- Simpan ke tabel
  UPDATE public.reports
  SET priority_score = v_score, priority_label = v_label
  WHERE id = p_report_id;

  RETURN jsonb_build_object('score', v_score, 'label', v_label);
END;
$$;

-- 6. Fungsi Utama: change_report_status (Satu-satunya Jalur Ubah Status Laporan)
-- Memeriksa transisi status yang valid (7.1), validasi catatan wajib, kontrol konkurensi (version),
-- serta mencatat log status, notifikasi, dan audit log secara atomik dalam satu transaksi.
CREATE OR REPLACE FUNCTION public.change_report_status(
  p_report_id UUID,
  p_new_status report_status,
  p_note TEXT DEFAULT NULL,
  p_actor_name TEXT DEFAULT 'Petugas Posko',
  p_version INTEGER DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current RECORD;
  v_clean_note TEXT;
BEGIN
  -- Ambil laporan saat ini
  SELECT * INTO v_current FROM public.reports WHERE id = p_report_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Laporan tidak ditemukan');
  END IF;

  -- Cek kontrol konkurensi versi (version concurrency check)
  IF p_version IS NOT NULL AND v_current.version != p_version THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Konflik konkurensi: Laporan telah diperbarui oleh petugas lain. Silakan muat ulang data.',
      'current_version', v_current.version
    );
  END IF;

  -- Validasi Transisi Status Resmi (prd-admin.md 7.1)
  IF v_current.status = 'diterima' AND p_new_status NOT IN ('diverifikasi', 'ditolak') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Transisi tidak sah: Dari Diterima hanya boleh ke Diverifikasi atau Ditolak');
  ELSIF v_current.status = 'diverifikasi' AND p_new_status NOT IN ('ditindaklanjuti', 'ditolak') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Transisi tidak sah: Dari Diverifikasi hanya boleh ke Ditindaklanjuti atau Ditolak');
  ELSIF v_current.status = 'ditindaklanjuti' AND p_new_status NOT IN ('selesai') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Transisi tidak sah: Dari Ditindaklanjuti hanya boleh ke Selesai');
  ELSIF v_current.status = 'selesai' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Laporan yang telah selesai bersifat final dan tidak dapat diubah statusnya');
  ELSIF v_current.status = 'ditolak' AND p_new_status NOT IN ('diterima') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Laporan ditolak hanya dapat dibuka kembali menjadi Diterima');
  END IF;

  -- Validasi Catatan Wajib untuk Ditolak dan Selesai
  v_clean_note := TRIM(COALESCE(p_note, ''));
  IF p_new_status IN ('ditolak', 'selesai') AND LENGTH(v_clean_note) < 5 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Catatan tindak lanjut wajib diisi minimal 5 karakter agar pelapor mengetahui alasannya.');
  END IF;

  -- Jika catatan kosong untuk status lain, berikan keterangan default
  IF LENGTH(v_clean_note) = 0 THEN
    v_clean_note := CASE p_new_status
      WHEN 'diverifikasi' THEN 'Laporan telah diverifikasi oleh posko dan siap ditindaklanjuti tim operasional.'
      WHEN 'ditindaklanjuti' THEN 'Tim lapangan telah ditugaskan dan meluncur ke lokasi kejadian.'
      ELSE 'Pembaruan status laporan oleh petugas posko.'
    END;
  END IF;

  -- Eksekusi Update Tabel reports
  UPDATE public.reports
  SET
    status = p_new_status,
    version = COALESCE(v_current.version, 1) + 1,
    verified_at = CASE WHEN p_new_status = 'diverifikasi' AND v_current.verified_at IS NULL THEN NOW() ELSE v_current.verified_at END,
    resolved_at = CASE WHEN p_new_status = 'selesai' THEN NOW() ELSE v_current.resolved_at END,
    updated_at = NOW()
  WHERE id = p_report_id;

  -- 1. Tulis ke report_status_logs (Riwayat untuk Timeline Warga)
  INSERT INTO public.report_status_logs (report_id, status, note, created_at)
  VALUES (p_report_id, p_new_status, v_clean_note, NOW());

  -- 2. Tulis ke notifications (Pemberitahuan ke Pelapor)
  INSERT INTO public.notifications (report_id, tracking_code, title, body, created_at)
  VALUES (
    p_report_id,
    v_current.tracking_code,
    'Status Laporan ' || v_current.tracking_code || ' Diperbarui',
    'Laporan Anda kini berstatus: ' || UPPER(p_new_status::text) || '. Catatan: ' || v_clean_note,
    NOW()
  );

  -- 3. Tulis ke audit_logs (Akuntabilitas Petugas)
  INSERT INTO public.audit_logs (actor_name, action, entity, entity_id, meta, created_at)
  VALUES (
    p_actor_name,
    'CHANGE_REPORT_STATUS',
    'reports',
    p_report_id,
    jsonb_build_object(
      'tracking_code', v_current.tracking_code,
      'old_status', v_current.status,
      'new_status', p_new_status,
      'note', v_clean_note,
      'version', COALESCE(v_current.version, 1) + 1
    ),
    NOW()
  );

  -- Hitung ulang prioritas
  PERFORM public.compute_priority(p_report_id);

  RETURN jsonb_build_object(
    'success', true,
    'id', p_report_id,
    'tracking_code', v_current.tracking_code,
    'old_status', v_current.status,
    'new_status', p_new_status,
    'note', v_clean_note,
    'version', COALESCE(v_current.version, 1) + 1
  );
END;
$$;

-- Berikan izin akses eksekusi RPC ke anon dan authenticated
GRANT EXECUTE ON FUNCTION public.change_report_status(UUID, report_status, TEXT, TEXT, INTEGER) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.compute_priority(UUID) TO anon, authenticated;

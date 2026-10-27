-- ==============================================================================
-- SIGAPLAPOR: Database Schema, PostGIS, Functions, Triggers, & RLS Policies
-- Subtema: Civic Reporting & Accountability
-- ==============================================================================

-- 1. Ekstensi PostGIS dan UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS postgis;

-- 2. Tipe Data Enum
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('warga', 'relawan', 'petugas');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE report_status AS ENUM ('diterima', 'diverifikasi', 'ditindaklanjuti', 'selesai', 'ditolak');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE disaster_type AS ENUM ('banjir', 'gempa', 'kebakaran', 'longsor', 'tsunami', 'karhutla', 'lainnya');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE sos_assistance_type AS ENUM ('damkar', 'medis', 'polisi', 'bnpb_bpbd');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 3. Tabel Profiles (Pengguna & Peran)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone_number TEXT,
  role user_role NOT NULL DEFAULT 'warga',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Tabel Reports (Laporan Bencana)
CREATE TABLE IF NOT EXISTS public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tracking_code TEXT UNIQUE NOT NULL,
  disaster_type disaster_type NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  location GEOGRAPHY(Point, 4326) NOT NULL,
  address TEXT,
  status report_status NOT NULL DEFAULT 'diterima',
  confirmation_count INTEGER NOT NULL DEFAULT 0,
  priority_score INTEGER NOT NULL DEFAULT 0,
  reporter_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indeks Geospasial PostGIS dan Pencarian Laporan
CREATE INDEX IF NOT EXISTS reports_location_gist ON public.reports USING GIST(location);
CREATE INDEX IF NOT EXISTS reports_tracking_code_idx ON public.reports(tracking_code);
CREATE INDEX IF NOT EXISTS reports_status_idx ON public.reports(status);
CREATE INDEX IF NOT EXISTS reports_created_at_idx ON public.reports(created_at DESC);

-- 5. Tabel Report Media (Foto / Video Bukti Kejadian)
CREATE TABLE IF NOT EXISTS public.report_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
  media_url TEXT NOT NULL,
  media_type TEXT NOT NULL DEFAULT 'image',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Tabel Report Status Logs (Timeline Riwayat Tindak Lanjut)
CREATE TABLE IF NOT EXISTS public.report_status_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
  status report_status NOT NULL,
  note TEXT,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS report_status_logs_report_idx ON public.report_status_logs(report_id, created_at ASC);

-- 7. Tabel Report Confirmations (Konfirmasi Laporan oleh Warga)
CREATE TABLE IF NOT EXISTS public.report_confirmations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT one_confirmation_per_user_report UNIQUE (report_id, user_id)
);

-- 8. Tabel SOS Alerts (Panggilan Darurat)
CREATE TABLE IF NOT EXISTS public.sos_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  location GEOGRAPHY(Point, 4326) NOT NULL,
  assistance_type sos_assistance_type,
  status TEXT NOT NULL DEFAULT 'aktif' CHECK (status IN ('aktif', 'ditangani', 'selesai')),
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS sos_alerts_location_gist ON public.sos_alerts USING GIST(location);
CREATE INDEX IF NOT EXISTS sos_alerts_status_idx ON public.sos_alerts(status);

-- ==============================================================================
-- FUNGSI & TRIGGER OTOMATIS
-- ==============================================================================

-- Fungsi Pembuatan Profil Otomatis saat Warga Mendaftar via Auth Supabase
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Warga Sigap'),
    'warga'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger Pencatatan Otomatis Log Status ketika Laporan Dibuat atau Diubah
CREATE OR REPLACE FUNCTION public.handle_report_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') OR (OLD.status IS DISTINCT FROM NEW.status) THEN
    INSERT INTO public.report_status_logs (report_id, status, note, created_by)
    VALUES (
      NEW.id,
      NEW.status,
      CASE
        WHEN TG_OP = 'INSERT' THEN 'Laporan baru diterima oleh sistem.'
        WHEN NEW.status = 'diverifikasi' THEN 'Laporan telah diverifikasi keabsahannya oleh tim posko.'
        WHEN NEW.status = 'ditindaklanjuti' THEN 'Regu tanggap darurat telah ditugaskan ke lokasi.'
        WHEN NEW.status = 'selesai' THEN 'Penanganan bencana di lokasi telah selesai diselesaikan.'
        WHEN NEW.status = 'ditolak' THEN 'Laporan ditolak setelah verifikasi lapangan (tidak valid atau duplikat).'
        ELSE 'Perubahan status laporan.'
      END,
      auth.uid()
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_report_status_changed ON public.reports;
CREATE TRIGGER on_report_status_changed
  AFTER INSERT OR UPDATE OF status ON public.reports
  FOR EACH ROW EXECUTE FUNCTION public.handle_report_status_change();

-- Trigger Pembaruan Jumlah Konfirmasi & Prioritas Otomatis
CREATE OR REPLACE FUNCTION public.handle_new_confirmation()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.reports
  SET
    confirmation_count = confirmation_count + 1,
    priority_score = priority_score + 5,
    updated_at = NOW()
  WHERE id = NEW.report_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_confirmation_added ON public.report_confirmations;
CREATE TRIGGER on_confirmation_added
  AFTER INSERT ON public.report_confirmations
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_confirmation();

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_status_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_confirmations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sos_alerts ENABLE ROW LEVEL SECURITY;

-- 1. Kebijakan Tabel Profiles
CREATE POLICY "Profiles dapat dibaca oleh publik"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Pengguna hanya dapat mengubah profilnya sendiri"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id AND role = (SELECT role FROM public.profiles WHERE id = auth.uid()));

-- 2. Kebijakan Tabel Reports
CREATE POLICY "Laporan bencana dapat dibaca publik"
  ON public.reports FOR SELECT
  USING (true);

CREATE POLICY "Pengguna terautentikasi dapat membuat laporan"
  ON public.reports FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Hanya petugas yang dapat mengubah status laporan"
  ON public.reports FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'petugas'
    )
  );

-- 3. Kebijakan Tabel Report Media
CREATE POLICY "Media laporan dapat dilihat publik"
  ON public.report_media FOR SELECT
  USING (true);

CREATE POLICY "Pengguna dapat mengunggah bukti media"
  ON public.report_media FOR INSERT
  WITH CHECK (true);

-- 4. Kebijakan Tabel Report Status Logs
CREATE POLICY "Timeline status dapat dibaca publik"
  ON public.report_status_logs FOR SELECT
  USING (true);

-- 5. Kebijakan Tabel Report Confirmations
CREATE POLICY "Konfirmasi laporan dapat dilihat publik"
  ON public.report_confirmations FOR SELECT
  USING (true);

CREATE POLICY "Warga dapat mengonfirmasi laporan"
  ON public.report_confirmations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 6. Kebijakan Tabel SOS Alerts
CREATE POLICY "Semua orang dapat mengirim sinyal SOS"
  ON public.sos_alerts FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Hanya petugas dan pengirim yang dapat melihat SOS"
  ON public.sos_alerts FOR SELECT
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'petugas'
    )
  );

CREATE POLICY "Hanya petugas yang dapat memperbarui status penanganan SOS"
  ON public.sos_alerts FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'petugas'
    )
  );

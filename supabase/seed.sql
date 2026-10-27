-- ==============================================================================
-- SIGAPLAPOR: Seed Data Demonstrasi
-- Digunakan untuk mengisi data awal laporan terverifikasi dan sinyal SOS
-- ==============================================================================

-- 1. Contoh Laporan 1: Banjir Kalideres
INSERT INTO public.reports (
  id,
  tracking_code,
  disaster_type,
  title,
  description,
  location,
  address,
  status,
  confirmation_count,
  priority_score
) VALUES (
  '11111111-1111-1111-1111-111111111111',
  'LPR-8F3K2Q',
  'banjir',
  'Banjir Luapan Kali Semanan 60 cm',
  'Akses jalan utama terputus akibat luapan kali. Air terus naik sejak pukul 14.00 WIB. Terdapat sekitar 40 KK membutuhkan bantuan evakuasi lansia.',
  ST_SetSRID(ST_MakePoint(106.723, -6.155), 4326),
  'Kelurahan Semanan, Kalideres, Jakarta Barat',
  'ditindaklanjuti',
  24,
  120
) ON CONFLICT (tracking_code) DO NOTHING;

-- Log Tindak Lanjut Laporan 1
INSERT INTO public.report_status_logs (report_id, status, note)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'diterima', 'Laporan masuk dengan foto bukti genangan air.'),
  ('11111111-1111-1111-1111-111111111111', 'diverifikasi', 'Diverifikasi oleh Relawan FPRB Kalideres.'),
  ('11111111-1111-1111-1111-111111111111', 'ditindaklanjuti', '2 perahu karet dan pompa mobile telah meluncur ke lokasi.');

-- 2. Contoh Laporan 2: Longsor Cisarua
INSERT INTO public.reports (
  id,
  tracking_code,
  disaster_type,
  title,
  description,
  location,
  address,
  status,
  confirmation_count,
  priority_score
) VALUES (
  '22222222-2222-2222-2222-222222222222',
  'LPR-4K9W1Z',
  'longsor',
  'Tebing Penahan Longsor Ambrol',
  'Tebing setinggi 4 meter ambrol setelah hujan deras. Menutup sebagian badan jalan akses antar desa.',
  ST_SetSRID(ST_MakePoint(106.942, -6.698), 4326),
  'Desa Tugu Selatan, Cisarua, Kab. Bogor',
  'diverifikasi',
  12,
  60
) ON CONFLICT (tracking_code) DO NOTHING;

INSERT INTO public.report_status_logs (report_id, status, note)
VALUES
  ('22222222-2222-2222-2222-222222222222', 'diterima', 'Laporan otomatis diterima.'),
  ('22222222-2222-2222-2222-222222222222', 'diverifikasi', 'Petugas BPBD Wilayah II memverifikasi lokasi dan berkoordinasi dengan Dinas PUPR.');

-- 3. Contoh Laporan 3: Kebakaran Tambora
INSERT INTO public.reports (
  id,
  tracking_code,
  disaster_type,
  title,
  description,
  location,
  address,
  status,
  confirmation_count,
  priority_score
) VALUES (
  '33333333-3333-3333-3333-333333333333',
  'LPR-2X7M9P',
  'kebakaran',
  'Kebakaran Pemukiman Tambora',
  'Dugaan korsleting listrik di lantai 2 rumah warga. Berhasil dilokalisir oleh petugas pemadam kebakaran.',
  ST_SetSRID(ST_MakePoint(106.804, -6.149), 4326),
  'Kecamatan Tambora, Jakarta Barat',
  'selesai',
  31,
  155
) ON CONFLICT (tracking_code) DO NOTHING;

INSERT INTO public.report_status_logs (report_id, status, note)
VALUES
  ('33333333-3333-3333-3333-333333333333', 'diterima', 'Laporan diterima dari warga.'),
  ('33333333-3333-3333-3333-333333333333', 'ditindaklanjuti', '8 unit armada damkar dikerahkan.'),
  ('33333333-3333-3333-3333-333333333333', 'selesai', 'Api padam sepenuhnya dan pendinginan selesai.');

-- 4. Contoh Panggilan SOS Aktif
INSERT INTO public.sos_alerts (
  id,
  location,
  assistance_type,
  status,
  note
) VALUES (
  '44444444-4444-4444-4444-444444444444',
  ST_SetSRID(ST_MakePoint(106.719, -6.168), 4326),
  'damkar',
  'aktif',
  'Warga terjebak banjir butuh perahu evakuasi darurat'
);

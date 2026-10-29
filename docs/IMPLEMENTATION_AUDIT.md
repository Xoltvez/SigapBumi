# IMPLEMENTATION AUDIT — SIGAPBUMI
**Tanggal Audit:** 28 Oktober 2026  
**Auditor:** Antigravity (Gemini 3.8 Flash)  
**Status Sesi:** Slice A Baseline Audit (Read-Only)  
**Aturan Berlaku:** GEMINI.md, AGENTS.md, SIGAPBUMI_ANTIGRAVITY_MASTER_PROMPT.md, Anti-Slop DURING

---

## 1. Kondisi Git & Working Tree
- **Branch Aktif:** `main` (sinkron dengan `origin/main`).
- **Status Working Tree:** Bersih (`git status --short --branch` tidak menunjukkan perubahan lokal uncommitted).
- **Integritas:** Tidak ada operasi destruktif (`reset`, `clean`, `checkout --`, `rebase`, `force-push`). Semua file dan commit tim (Faiz, Yossika, Wahyu) dipertahankan utuh.

---

## 2. Hasil Baseline Pengujian Otomatis

| Perintah | Hasil | Bukti Aktual Output |
|---|---|---|
| `npx tsc --noEmit` | **PASS** | Exit code 0, 0 error TypeScript. |
| `npm run lint` | **PASS** | Exit code 0, ESLint 9 lolos tanpa error. |
| `npm run build` | **FAIL** | Exit code 1. Crash saat prerender static page `/_not-found`. Penyebab: `src/lib/supabase/client.ts` baris 11 melakukan inisialisasi singleton eager `export const supabase = createClient()` pada level modul tanpa validasi ketersediaan environment variable, menyebabkan `@supabase/ssr` throw error fatal: `Error: @supabase/ssr: Your project's URL and API key are required to create a Supabase client!`. |
| Pengujian Unit/E2E | **NOT RUN** | Belum ada script test otomatis (misal Jest/Playwright/Vitest) di `package.json`. |

---

## 3. Inventaris Struktur Rute & Navigasi

### 3.1 Rute yang Ada & Status Render
| Path | File | Status Render | Catatan Fungsional & Temuan |
|---|---|---|---|
| `/` | `src/app/page.tsx` | Renders | Berisi klaim statistik statis ("142 Laporan", "94% selesai", "18 menit respons"), klaim "Diperbarui 10 menit lalu", dan tautan ke rute 404. |
| `/peta` | `src/app/peta/page.tsx` | Renders | Leaflet map interaktif. Memiliki filter kategori dan status, tetapi **tidak ada tampilan alternatif daftar (list view)** (pelanggaran FR-04 & Master Prompt 6.4). Terdapat tautan `<a>` biasa ke detail lacak. |
| `/lapor` | `src/app/lapor/page.tsx` | Renders | Form wizard 4 langkah. Deteksi GPS berfungsi jika diizinkan browser. Upload foto hanya simulasi lokal `readAsDataURL` (belum ke Supabase Storage). Jika query insert ke Supabase gagal, error ditelan diam-diam dan pengguna tetap diarahkan ke halaman sukses dengan kode tracking yang tidak tersimpan. |
| `/lapor/sukses` | `src/app/lapor/sukses/page.tsx` | Renders | Menampilkan kode tracking, tombol salin clipboard, tombol navigasi ke Lacak dan Peta. |
| `/lacak` | `src/app/lacak/page.tsx` | Renders | Pencarian kode tracking. Jika kode tidak ada di Supabase, fallback ke hardcoded `SAMPLE_REPORTS`. Belum ada label bahwa data sampel adalah data demo. |
| `/statistik` | `src/app/statistik/page.tsx` | Renders | Seluruh grafik (Recharts) menggunakan data konstanta statis (`MONTHLY_DATA`, `DISASTER_DISTRIBUTION`, `REGIONAL_STATS`) tanpa label demo dan tanpa kalkulasi dari database. Fitur ekspor CSV bekerja untuk data statis tersebut. |
| `/edukasi` | `src/app/edukasi/page.tsx` | Renders | Panduan mitigasi bencana 4 kategori (Gempa, Banjir, Kebakaran, Longsor), daftar nomor darurat, dan checklist tas siaga bencana. |
| `/admin` | `src/app/admin/page.tsx` | Renders | Dashboard ringkasan petugas: antrean laporan, panggilan SOS darurat, dan metrik operasional. Mengambil data dari Supabase dengan fallback mock. |
| `/admin/laporan` | `src/app/admin/laporan/page.tsx` | Renders | Tabel laporan bencana dengan filter status dan unit instansi. |
| `/admin/laporan/[id]` | `src/app/admin/laporan/[id]/page.tsx` | Renders | Lembar kerja detail laporan, verifikasi bukti, penyamaran PII, dialog transisi status atomik, dan pencatatan audit log. Memiliki `generateStaticParams` dengan ID statis `rep-1` s.d. `rep-4`. |
| `/admin/sos` | `src/app/admin/sos/page.tsx` | Renders | Radar monitor panggilan darurat SOS, audio alert synthesizer, penugasan tim armada, dan penyelesaian panggilan. |
| `/admin/peta` | `src/app/admin/peta/page.tsx` | Renders | Peta operasional taktis Leaflet khusus posko dengan layer titik bencana dan SOS aktif. |
| `/admin/statistik` | `src/app/admin/statistik/page.tsx` | Renders | Statistik respon operasional petugas posko terpadu. |
| `/api/admin/status` | `src/app/api/admin/status/route.ts` | Renders | Endpoint POST pengubahan status laporan. **VULNERABLE:** Tidak ada autentikasi atau pengecekan session role petugas. Siapa pun dapat mengubah status laporan melalui API ini. |
| `/api/reports/vouch` | `src/app/api/reports/vouch/route.ts` | Renders | Endpoint POST konfirmasi warga. **VULNERABLE:** Tidak ada proteksi autentikasi, menerima nilai `newCount` arbitrer dari client tanpa batasan satu akun satu konfirmasi. |

### 3.2 Tautan Rusak / Rute Belum Ada (404)
Tautan berikut muncul di antarmuka publik tetapi file halamannya belum ada:
1. `/masuk` — Tampil di Header (`src/components/layout/Header.tsx:84`). Menghasilkan 404.
2. `/notifikasi` — Tampil di Header (`src/components/layout/Header.tsx:77`). Menghasilkan 404.
3. `/cuaca` — Tampil di Banner Beranda (`src/app/page.tsx:46`). Menghasilkan 404.
4. `/fasilitas` — Tampil di Footer Beranda (`src/app/page.tsx:338`). Menghasilkan 404.
5. `/kontak-darurat` — Tampil di Footer Beranda (`src/app/page.tsx:345`). Menghasilkan 404.
6. `/daftar`, `/laporan-saya`, `/profil`, `/tentang` — Disebutkan dalam sitemap konsep namun belum memiliki file rute.

---

## 4. Audit Supabase, Skema Database, & Keamanan RLS

### 4.1 Environment Variables
File `.env.example` mencantumkan:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server-only)
File `.env` atau `.env.local` tidak di-commit (sesuai best practice keamanan).

### 4.2 Skema Tabel & Migrasi
Terdapat 3 file migrasi di `supabase/migrations/`:
1. `20261027_initial_schema.sql`:
   - Enum: `user_role`, `report_status`, `disaster_type`, `sos_assistance_type`.
   - Tabel: `profiles`, `reports`, `report_media`, `report_status_logs`, `report_confirmations`, `sos_alerts`.
   - Indeks GIST geospasial pada `reports(location)` dan `sos_alerts(location)`.
   - Trigger `on_auth_user_created`, `on_report_status_changed`, `on_confirmation_added`.
2. `20261027_allow_status_update.sql`:
   - Membuat fungsi RPC `update_report_status_public`.
   - **PERINGATAN KEAMANAN:** Menimpa policy RLS dengan `CREATE POLICY "Petugas posko dapat memperbarui status laporan" ON public.reports FOR UPDATE USING (true) WITH CHECK (true);` dan memberikan `GRANT EXECUTE` ke role `anon`. Ini membuka izin update status untuk publik tanpa login.
3. `20261027_admin_stage_a1.sql`:
   - Menambahkan kolom `priority_label`, `version`, `verified_at`, `resolved_at`, `duplicate_of`, `regency`, `province` ke tabel `reports`.
   - Menambahkan tabel `audit_logs` dan `notifications`.
   - Membuat fungsi RPC `change_report_status` dengan validasi transisi status dan kontrol konkurensi versi.
   - **PERINGATAN KEAMANAN:** `GRANT EXECUTE ON FUNCTION public.change_report_status(...) TO anon, authenticated;` tanpa verifikasi apakah `auth.uid()` memiliki peran `petugas`.

### 4.3 Autentikasi & Proteksi Akses
- **Ketiadaan Middleware:** Tidak ada file `middleware.ts` di root repositori maupun di `src/`.
- **Halaman `/admin/*`:** Dapat diakses langsung oleh siapa pun tanpa login atau verifikasi role petugas.

---

## 5. Audit Data Truthfulness & Anti-Slop (Prinsip Kejujuran Data)

1. **Beranda (`src/app/page.tsx`):**
   - Angka "142 Laporan Terverifikasi", "94% telah selesai ditindaklanjuti", "18 Menit waktu respons", "3 wilayah peringatan siaga", dan teks peringatan cuaca "Diperbarui 10 menit lalu" adalah nilai statis murni yang ditulis langsung di JSX. Tidak ada query data aktual dan tidak ada label "Data demonstrasi".
   - Klaim "Terverifikasi BPBD" disajikan sebagai fakta tanpa integrasi resmi.
2. **Halaman Statistik (`src/app/statistik/page.tsx`):**
   - Menggunakan array konstanta `MONTHLY_DATA`, `DISASTER_DISTRIBUTION`, dan `REGIONAL_STATS` tanpa menghubungkan ke tabel `reports` dan tanpa label demo.
3. **Panggilan SOS (`SosFab.tsx` & `src/lib/services/sos.ts`):**
   - Menampilkan teks "Posisi Anda telah diteruskan ke petugas piket" tanpa penanda bahwa ini adalah simulasi dan tanpa instruksi tegas untuk tetap menghubungi panggilan darurat 112 jika dalam bahaya nyata.
   - Jika Supabase insert gagal, fungsi tetap mengembalikan `{ success: true }`, memberikan ilusi palsu kepada pelapor bahwa data tersimpan.
4. **Formulir Lapor (`src/app/lapor/page.tsx`):**
   - Jika pengiriman laporan gagal (misal koneksi terputus atau Supabase offline), blok `catch` tetap memanggil `router.push('/lapor/sukses')` dengan kode tracking fiktif.

---

## 6. Lima Masalah dengan Dampak Tertinggi (Top 5 High-Impact Issues)

| No | Kategori | Masalah | Dampak | Rekomendasi Solusi P0 |
|---|---|---|---|---|
| **1** | **Keamanan & Otorisasi** | Area admin (`/admin/*`), endpoint API (`/api/admin/status`), dan RPC fungsi status di database terbuka untuk publik/anon tanpa otentikasi role `petugas`. Policy RLS di-set `USING (true)`. | Siapa pun dapat membuka dashboard petugas, melihat data internal, dan mengubah status laporan bencana secara sembarangan. | Buat server-side auth guard / middleware atau session validation; amankan endpoint `/api/admin/status`; pastikan role petugas diverifikasi. Sediakan demo login cepat/petugas yang aman. |
| **2** | **Stabilitas Build** | `npm run build` gagal total (crash) akibat eager client initialization `export const supabase = createClient()` di `src/lib/supabase/client.ts` saat build static generation tanpa env vars. | Proyek tidak dapat di-build untuk production deployment. CI/CD atau Vercel build akan gagal. | Refactor `client.ts` agar `createClient()` menggunakan fallback aman atau lazy initialization yang tidak throw error fatal saat build static prerender. |
| **3** | **Kejujuran Data & Anti-Slop** | Metrik di Beranda, Peta, Lacak, dan Statistik menampilkan angka statis palsu dan klaim "Live Update / Diperbarui 10 menit lalu" tanpa label demo. | Menyesatkan publik dan melanggar aturan utama kompetisi WIA serta Anti-Slop core (FR-20, KPI, Delivery Gate). | Berikan label eksplisit `[Data Demonstrasi]` pada data seed/mock; integrasikan query agregat nyata jika data database tersedia; sediakan fallback state yang jujur. |
| **4** | **Integritas Pelaporan & Silent Failure** | `src/app/lapor/page.tsx` menelan error Supabase secara diam-diam dan menampilkan pesan sukses palsu; bukti foto tidak diunggah ke Storage; `/api/reports/vouch` mengizinkan manipulasi jumlah konfirmasi tanpa batas. | Warga mengira laporannya terkirim padahal hilang; data bukti foto tidak tersimpan; sistem konfirmasi rawan spam. | Tampilkan state error/retry yang jujur jika insert gagal; simpan media dengan benar jika bucket tersedia; batasi vouching 1 konfirmasi per pengguna. |
| **5** | **Navigasi Rusak & Kekurangan Tampilan** | Tautan navigasi utama mengarah ke 404 (`/masuk`, `/notifikasi`, `/cuaca`, `/fasilitas`, `/kontak-darurat`), dan `/peta` tidak memiliki alternatif tampilan daftar (list view). | Pengalaman pengguna rusak (dead ends), tidak memenuhi kriteria aksesibilitas dan kemudahan penggunaan di perangkat bergerak. | Sediakan halaman/komponen tujuan yang valid atau tautan resmi yang aman; lengkapi `/peta` dengan toggle tampilan Peta dan Daftar Kejadian. |

---

## 7. Pemetaan Kebutuhan Konsep (Concept Matrix)

| ID | Fitur Konsep | Status Aktual | Catatan |
|---|---|---|---|
| FR-01 | Form Lapor Bencana (Jenis, Deskripsi, Foto, GPS/Manual) | **Partial** | Form 4 langkah ada, tapi upload foto belum ke storage, insert menelan error diam-diam. |
| FR-02 | Kode Tracking Unik | **Implemented & Verified** | Fungsi `generateTrackingCode()` menghasilkan format `LPR-XXXXXX`. |
| FR-03 | Timeline Status Laporan (5 status) | **Implemented & Verified** | Komponen `TimelineStatus.tsx` dan struktur data timeline sudah ada. |
| FR-04 | Peta Publik + Filter + Tampilan Daftar | **Partial** | Peta Leaflet & filter kategori/status ada; **tampilan daftar belum ada**. |
| FR-05 | Tombol SOS Melayang + Hitung Mundur 3s | **Partial** | `SosFab.tsx` ada; klaim dispatch belum jujur; error penanganan belum ada. |
| FR-06 | Dashboard Petugas (Ringkasan, Detail, Verifikasi) | **Implemented but Unverified** | UI lengkap (`/admin`), namun otorisasi server/database belum terkunci. |
| FR-07 | Autentikasi & Pembagian Peran (Warga, Petugas) | **Missing** | Halaman `/masuk` belum ada, proteksi middleware belum ada. |
| FR-08 | Konfirmasi Laporan oleh Warga (1 akun 1 konfirmasi) | **Partial** | UI vouching ada, tapi API tidak memvalidasi user atau batasan 1 konfirmasi. |
| FR-09 | Monitor SOS Real-Time untuk Petugas | **Implemented & Verified** | `/admin/sos` memiliki radar, audio alert synthesizer, dan penugasan tim. |
| FR-10 | Notifikasi Perubahan Status | **Missing** | Tabel `notifications` ada di migrasi, tetapi UI `/notifikasi` belum ada. |
| FR-11 | Halaman Statistik & Waktu Respons | **Partial** | UI grafik Recharts ada di `/statistik`, tapi data masih statis tanpa label demo. |
| FR-12 | Edukasi Mitigasi & Kontak Darurat | **Implemented & Verified** | `/edukasi` menyajikan panduan terstruktur 4 jenis bencana dan kontak darurat. |
| FR-18 | Tipe Bantuan SOS (Damkar, Medis, Polisi, BPBD) | **Implemented & Verified** | Pilihan tipe bantuan tersedia di `SosFab` dan `/admin/sos`. |
| FR-19 | Fasilitas Kesehatan Terdekat | **Missing** | Rute `/fasilitas` belum dibuat. |
| FR-20 | Cuaca & Peringatan BMKG dengan Atribusi | **Partial** | Banner ada di beranda, tetapi rute `/cuaca` 404 dan banner belum menampilkan data aktual / label demo. |
| FR-22 | Fitur Donasi | **Deferred** | Ditunda sesuai aturan kompetisi dan persetujuan pengembang. |

---

## 8. Rencana Implementasi Slices Berikutnya (P0 Hardening)

1. **Slice B (Trust & Data Correctness):**
   - Perbaiki `src/lib/supabase/client.ts` agar `npm run build` lolos tanpa crash pada environment apapun (lazy initialization / safe fallback).
   - Perbaiki Beranda (`src/app/page.tsx`): tambahkan badge `[Data Demonstrasi]` pada data simulasi, hubungkan penghitungan statistik jika Supabase terhubung, dan hapus klaim palsu "Diperbarui 10 menit lalu / Terverifikasi BPBD".
   - Perbaiki Statistik (`src/app/statistik/page.tsx`): beri label jelas bahwa angka merupakan data demonstrasi dan hitung ringkasan dinamis dari data laporan yang ada.
   - Perbaiki halaman / modal SOS (`SosFab.tsx`): tambahkan teks kejujuran operasional bahwa ini adalah sistem simulasi dan pelapor wajib menghubungi 112 untuk panggilan darurat nyata.

2. **Slice C (End-to-End Report, Storage, & Tracking):**
   - Perbaiki `src/app/lapor/page.tsx`: hentikan silent error swallowing. Jika penyimpanan gagal, tampilkan pesan error yang jelas dan opsi simpan ulang / retry.
   - Sediakan penanganan unggahan media yang aman atau simpan data URI/placeholder secara transparan bila storage belum terkonfigurasi.
   - Amankan API `/api/reports/vouch` agar mencegah manipulasi nilai konfirmasi arbitrer.
   - Pastikan `/lacak` menampilkan status timeline riil dan memberi label data demo pada sampel data.

3. **Slice D (Staff Workflow & Otorisasi):**
   - Buat halaman `/masuk` untuk autentikasi warga dan akses petugas posko terpadu.
   - Pasang proteksi akses pada rute `/admin/*` dan API `/api/admin/status` agar hanya petugas terautentikasi yang dapat mengubah status laporan.
   - Perbaiki `generateStaticParams` pada `/admin/laporan/[id]` agar mendukung pemuatan dinamis UUID laporan baru yang dibuat warga.

4. **Slice E (Peta Bencana Publik & Tampilan Daftar):**
   - Lengkapi `/peta` dengan toggle tampilan Peta dan Daftar Laporan (List View) agar ramah pengguna mobile dan dapat diakses tanpa bergantung pada peta saja.
   - Perbaiki link `<a>` menjadi Next.js `<Link>`.
   - Sediakan halaman fallback atau halaman informasi untuk tautan 404: `/kontak-darurat`, `/cuaca` (dengan rujukan resmi BMKG), dan `/fasilitas`.

5. **Slice G & H (Responsive QA & Delivery Gate Anti-Slop):**
   - Uji viewport mobile (360px, 390px) dan desktop (1024px, 1280px).
   - Jalankan `npm run lint`, `npx tsc --noEmit`, dan `npm run build` untuk memverifikasi kelulusan 100%.
   - Jalankan evaluasi Anti-Slop Delivery Gate.

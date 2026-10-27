# AGENT.md: Aturan Kerja untuk AI Agent / Developer

Dokumen ini wajib dibaca dan dipatuhi oleh setiap AI agent (vibe coding) dan developer yang bekerja di repositori ini.

**Dokumen rujukan (baca sebelum bekerja):**

- `prd.md`: fitur, sitemap, user journey, peran, database, rencana tahap
- `design.md`: gaya visual, warna, komponen, aksesibilitas

---

## 1. Aturan Utama (Tidak Boleh Dilanggar)

### 1.1 Setiap perubahan langsung di-push ke GitHub

- Setelah satu perubahan selesai dan berjalan, **langsung `commit` lalu `push`** ke GitHub. Jangan menumpuk banyak perubahan dalam satu commit.
- Satu perubahan logis = satu commit. Pesan commit mengikuti format Conventional Commits:
  - `feat: tambah form laporan bencana`
  - `fix: perbaiki hitung mundur SOS`
  - `style: sesuaikan badge status dengan design.md`
  - `docs: perbarui prd.md`
  - `refactor:`, `chore:`, `test:`
- Pastikan sebelum push: `npm run lint` dan `npm run build` berhasil. Jika gagal, perbaiki dahulu, jangan push kode rusak.
- Jangan pernah meng-commit rahasia (`.env.local`, kunci API, `service_role` key).
- Push ke branch yang sedang dipakai tim (default: `main`, kecuali developer menetapkan branch lain). Jangan memakai `git push --force` tanpa izin tertulis developer.

### 1.2 Tunggu persetujuan developer sebelum mengubah apa pun

Urutan kerja yang wajib:

1. **Pahami** permintaan developer.
2. **Ajukan rencana singkat**: file apa yang akan diubah/dibuat dan apa dampaknya.
3. **Tunggu persetujuan eksplisit** ("setuju", "lanjut", atau sejenisnya).
4. **Kerjakan** sesuai rencana yang disetujui.
5. **Commit dan push** (aturan 1.1), lalu laporkan hasilnya.

Jika ada hal yang di luar rencana ternyata perlu diubah, **berhenti dan minta persetujuan lagi**. Jika permintaan ambigu, ajukan satu pertanyaan klarifikasi, jangan menebak.

Pengecualian: pertanyaan yang hanya meminta penjelasan atau membaca kode tidak memerlukan persetujuan karena tidak mengubah file.

### 1.3 Kerjakan hanya yang diminta (scope lock)

> Kerjakan **hanya** yang diminta pengguna pada perintah saat ini.

- Jika diminta mengubah **bagian A**, jangan mengubah bagian B, struktur folder, nama file, dependensi, konfigurasi, atau gaya komponen lain.
- Jangan melakukan refactor, rename, format ulang massal, pembaruan dependensi, atau "perbaikan sekalian" yang tidak diminta.
- Jika menemukan bug atau perbaikan di bagian lain, **laporkan saja** sebagai saran, jangan langsung diperbaiki.
- Jangan menambah fitur di luar `prd.md` dan jangan menghapus fitur yang sudah ada tanpa persetujuan.
- Perubahan yang diminta harus sekecil mungkin (minimal diff) dan mudah di-review.

### 1.4 Ikuti gaya desain yang sudah dibuat

- Seluruh UI baru maupun perubahan UI **wajib mengikuti `design.md`**: palet (`#EF6806`, `#1F2937`, latar `#F6F7F8`, merah/kuning/biru semantik), tipografi, spasi, komponen, dan aksesibilitas.
- Gunakan token Tailwind dan komponen yang sudah ada sebelum membuat yang baru. Jangan menulis hex atau gaya baru di luar palet.
- Tanpa emoji di UI. Gunakan ikon `lucide-react`.
- Jika perubahan memerlukan gaya yang belum ada di `design.md`, **minta persetujuan** dan perbarui `design.md` sebagai bagian dari perubahan yang disetujui.
- Pastikan tampilan bekerja di mobile (360 px), tablet, dan desktop.

### 1.5 Fitur donasi dikunci

Fitur donasi dan laporan penggunaan dana (FR-22, FR-23, rute `/donasi`) berada di **tahap akhir** dan **tidak boleh dimulai** sebelum developer memberi persetujuan eksplisit. Jangan membuat file, tabel, atau rute untuk donasi sebelum itu.

---

## 2. Tumpukan Teknologi (sesuai `prd.md`)

| Bagian | Teknologi |
| --- | --- |
| Runtime | Node.js (LTS, minimal 20) dan npm |
| Frontend | Next.js (React, App Router) + TypeScript + Tailwind CSS |
| PWA | Service worker (dapat dipasang dan mendukung antrean offline) |
| Peta | Leaflet + OpenStreetMap (`react-leaflet`) |
| Backend dan database | Supabase: PostgreSQL + PostGIS, Auth, Storage, Realtime |
| Grafik | Recharts (atau Chart.js, pilih satu dan konsisten) |
| Ikon | lucide-react |
| Deploy | Vercel (frontend) + Supabase (backend) |
| Data eksternal | BMKG (cuaca, peringatan, gempa); OpenStreetMap/Overpass (fasilitas kesehatan) |
| Versi kontrol | Git + GitHub |

Jangan menambah framework, library UI besar, atau layanan lain di luar tabel ini tanpa persetujuan developer.

---

## 3. Struktur Proyek

Gunakan struktur berikut. Jangan mengubah struktur yang sudah ada tanpa persetujuan.

```
/
├── prd.md
├── design.md
├── agent.md
├── public/
│   ├── manifest.webmanifest
│   └── icons/
├── supabase/
│   ├── migrations/          # SQL schema, RLS, trigger, indeks PostGIS
│   └── seed.sql
├── src/
│   ├── app/
│   │   ├── (publik)/        # /, /peta, /lapor, /lacak, /statistik, /edukasi, /fasilitas, /cuaca, ...
│   │   ├── (auth)/          # /masuk, /daftar
│   │   ├── (warga)/         # /laporan-saya, /notifikasi, /profil
│   │   ├── admin/           # /admin/*  (khusus petugas)
│   │   ├── api/             # route handler (proxy BMKG/Overpass, cache)
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── ui/              # Button, Input, Card, Badge, Sheet, Toast, ...
│   │   ├── layout/          # Header, BottomNav, Sidebar, SosFab
│   │   ├── laporan/         # form lapor, kartu laporan, timeline
│   │   ├── peta/            # komponen Leaflet
│   │   └── admin/
│   ├── lib/
│   │   ├── supabase/        # client.ts, server.ts, middleware helper
│   │   ├── offline/         # antrean laporan offline (IndexedDB)
│   │   ├── bmkg.ts
│   │   ├── overpass.ts
│   │   └── utils.ts
│   ├── hooks/
│   ├── types/               # tipe TypeScript (report, profile, sos, ...)
│   └── middleware.ts        # proteksi rute berdasarkan peran
├── .env.example
├── tailwind.config.ts
└── package.json
```

---

## 4. Konvensi Kode

- **TypeScript ketat** (`strict: true`). Hindari `any`.
- Komponen React fungsional; Server Component secara default, gunakan `"use client"` hanya bila perlu (peta, form interaktif, hook browser).
- Leaflet dimuat dengan `dynamic(..., { ssr: false })`.
- Nama file komponen `PascalCase.tsx`; fungsi/variabel `camelCase`; tabel dan kolom database `snake_case`.
- Teks UI dalam Bahasa Indonesia; nama kode, variabel, dan komentar teknis boleh Bahasa Inggris atau Indonesia, tetapi konsisten.
- Validasi input di sisi client **dan** server (misalnya dengan `zod`). Jika `zod` belum ada, minta persetujuan sebelum menambahkan.
- Penanganan galat: tampilkan pesan ramah sesuai `design.md` (state galat/kosong/memuat/offline), jangan hanya `console.log`.
- Hindari komentar yang menjelaskan hal jelas; beri komentar untuk keputusan non-obvious.

### Perintah standar

```bash
npm install
npm run dev       # pengembangan
npm run lint
npm run build
npm run start
```

---

## 5. Keamanan dan Privasi

- Aktifkan **Row Level Security (RLS)** pada semua tabel Supabase.
  - `reports`: dapat dibaca publik (tanpa data pribadi pelapor); insert oleh pengguna terautentikasi (atau jalur lapor cepat/OTP terbatas); update status **hanya** role petugas.
  - `profiles`: pengguna hanya dapat mengubah profilnya sendiri; **kolom `role` tidak dapat diubah oleh pengguna sendiri**.
  - `report_confirmations`: satu akun satu konfirmasi per laporan (unique constraint `report_id + user_id`).
  - `sos_alerts`: insert oleh pengguna; baca dan tangani hanya petugas (pemilik dapat membaca SOS miliknya).
  - `report_status_logs`: hanya terisi lewat trigger/fungsi server.
- Akun petugas dibuat **manual** (bukan lewat pendaftaran publik).
- Kunci `service_role` **tidak boleh** ada di kode client atau repositori. Hanya `NEXT_PUBLIC_SUPABASE_URL` dan `NEXT_PUBLIC_SUPABASE_ANON_KEY` yang boleh diekspos ke client.
- Nama dan nomor HP pelapor tidak ditampilkan di peta atau halaman publik.
- Terapkan **rate limit** untuk pengiriman laporan dan SOS.
- Unggahan media: batasi tipe (jpg, png, webp, mp4) dan ukuran; kompres gambar di sisi client sebelum unggah.
- Gunakan HTTPS dan proteksi rute lewat `middleware.ts` berdasarkan peran (`/admin/*` hanya petugas).

### Variabel lingkungan (`.env.example`)

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
# Hanya dipakai di server (jangan diawali NEXT_PUBLIC_):
SUPABASE_SERVICE_ROLE_KEY=
```

`.env.local` harus ada di `.gitignore`.

---

## 6. Basis Data

Tabel utama (lihat `prd.md` bagian 16): `profiles`, `reports`, `report_media`, `report_status_logs`, `report_confirmations`, `sos_alerts`.

- Lokasi disimpan sebagai `geography(Point, 4326)` dengan **indeks GIST**.
- Perubahan skema **selalu lewat file migrasi** di `supabase/migrations/` (jangan mengubah lewat dashboard tanpa mencatat migrasi).
- Trigger otomatis: buat profil saat pendaftaran, hitung ulang jumlah konfirmasi dan prioritas, catat riwayat status ke `report_status_logs`.
- Kode tracking: unik, singkat, mudah dibaca (contoh `LPR-8F3K2Q`).
- Status laporan yang valid: `diterima`, `diverifikasi`, `ditindaklanjuti`, `selesai`, `ditolak`.
- Tipe bantuan SOS: `damkar`, `medis`, `polisi`, `bnpb_bpbd` (opsional).

---

## 7. Fitur Khusus yang Perlu Diperhatikan

- **Tombol SOS** (`SosFab`) ada di layout global, tampil di semua halaman, hitung mundur 3 detik dengan tombol batal.
- **Mode offline (PWA):** laporan disimpan ke IndexedDB dan dikirim otomatis saat online (`online` event / background sync). Tampilkan badge "Menunggu kirim".
- **Realtime:** gunakan Supabase Realtime untuk Monitor SOS petugas dan pembaruan timeline status.
- **Data eksternal:** panggil BMKG dan Overpass lewat route handler server dengan **cache** (revalidate), tampilkan atribusi sumber dan waktu pembaruan, serta tampilkan pesan ramah bila gagal dimuat.
- **Peta:** atribusi OpenStreetMap wajib terlihat.
- **Berita:** hanya tautan ke sumber resmi, bukan konten editorial buatan sendiri.

---

## 8. Alur Kerja Git

1. Pastikan working tree bersih dan sinkron: `git pull`.
2. Setelah rencana disetujui, kerjakan perubahan (hanya cakupan yang disetujui).
3. Jalankan `npm run lint` dan `npm run build`.
4. Tinjau diff: `git diff` (pastikan tidak ada file di luar cakupan).
5. Commit dengan pesan Conventional Commits.
6. `git push`.
7. Laporkan ke developer: apa yang diubah, file yang tersentuh, dan cara memeriksanya.

Jika `git push` gagal (konflik atau akses), **jangan memaksa**. Laporkan masalah ke developer.

---

## 9. Format Laporan Setelah Bekerja

Setelah selesai, balas singkat dengan format:

```
Selesai: <ringkasan satu kalimat>
File diubah: <daftar file>
Commit: <hash atau pesan commit> (sudah di-push)
Cara cek: <langkah singkat>
Catatan/saran (tidak dikerjakan): <opsional>
```

---

## 10. Daftar Periksa Agent Sebelum Mengakhiri Tugas

- [ ] Rencana sudah disetujui developer sebelum mengubah file
- [ ] Hanya mengubah yang diminta, tidak menyentuh bagian/struktur lain
- [ ] UI mengikuti `design.md` (warna, tipografi, komponen, tanpa emoji)
- [ ] Tidak ada rahasia di kode atau commit
- [ ] RLS dan pembatasan peran tidak dilemahkan
- [ ] `lint` dan `build` lolos
- [ ] Sudah di-commit dan di-push ke GitHub
- [ ] Fitur donasi tidak disentuh tanpa persetujuan
- [ ] Laporan hasil kerja sudah diberikan ke developer

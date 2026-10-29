# SigapBumi — Platform Pelaporan Bencana Terpadu & Akuntabilitas Publik

[![Next.js](https://img.shields.io/badge/Next.js-16.4.3-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.3.0-blue?logo=react)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL%20%2B%20PostGIS-3ECF8E?logo=supabase)](https://supabase.com/)
[![Leaflet](https://img.shields.io/badge/Leaflet-OpenStreetMap-199900?logo=leaflet)](https://leafletjs.com/)

**SigapBumi** adalah platform layanan pelaporan bencana berbasis masyarakat (*civic reporting*) yang dirancang untuk mempercepat alur informasi dari warga ke posko penanggulangan bencana, memberikan kode pelacakan unik (*public service tracking*), menyajikan peta geospasial terbuka (*open government data*), dan mendukung keputusan penanganan berbasis data nyata (*data-driven decision support*).

Dikembangkan untuk kompetisi **Web In Action (WIA), Multimedia In Action 2026** dengan subtema utama: **Civic Reporting & Accountability**.

---

## 1. Pemetaan ke 4 Subtema Lomba

| Subtema | Implementasi Nyata di SigapBumi | Rute Utama |
|---|---|---|
| **Civic Reporting & Accountability** *(Utama)* | Formulir lapor cepat 4 tahap dengan lokasi GPS otomatis, lembar kerja verifikasi petugas posko terpadu, penolakan laporan palsu berpenjelasan, dan log audit mutasi status. | `/lapor`, `/admin/laporan/[id]` |
| **Public Service Tracking** | Kode pelacakan unik acak (misal `LPR-8F3K2Q`), timeline vertikal status bertahap (*Diterima &rarr; Diverifikasi &rarr; Ditindaklanjuti &rarr; Selesai*), dan riwayat laporan warga. | `/lacak`, `/laporan-saya` |
| **Open Government Data** | Peta bencana geospasial Leaflet (OpenStreetMap) interaktif, alternatif tampilan daftar (*List View*), filter kategori dan status, serta rujukan resmi BMKG. | `/peta`, `/cuaca` |
| **Data-Driven Decision Support** | Dashboard metrik operasional posko, perbandingan kecepatan waktu respons per wilayah, dan radar monitor panggilan darurat SOS real-time. | `/admin`, `/admin/sos`, `/statistik` |

---

## 2. Tumpukan Teknologi (Tech Stack)

- **Framework Frontend:** Next.js 16.4.3 (App Router, Turbopack, Server Components + Client Boundaries)
- **Library UI & Gaya:** React 19.3.0, Tailwind CSS v4 (`@theme` token di `globals.css`)
- **Peta Geospasial:** Leaflet 1.9.4 & React-Leaflet 5.0.0 (OpenStreetMap Tiles & PostGIS EWKB Decoder)
- **Backend & Database:** Supabase (PostgreSQL + PostGIS, Row Level Security, Auth, Storage, Realtime)
- **Visualisasi Data:** Recharts 3.10.1 (Grafik Tren Bulanan & Donut Distribusi Bencana)
- **Ikonografi:** Lucide React (Tanpa emoji di antarmuka, mematuhi standar Anti-Slop R-01)

---

## 3. Panduan Instalasi Lokal

### Prasyarat
- Node.js LTS (versi 20 atau lebih baru)
- npm (versi 10 atau lebih baru)

### Langkah Pemasangan
1. Clone repositori:
   ```bash
   git clone https://github.com/Xoltvez/SigapBumi.git
   cd SigapBumi
   ```

2. Pasang dependensi:
   ```bash
   npm ci
   ```

3. Konfigurasi Environment Variables:
   Salin `.env.example` menjadi `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
   Isi konfigurasi Supabase Anda (tersedia di Dashboard Supabase &rarr; Settings &rarr; API):
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://proyek-anda.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJh...
   # Hanya dipakai di server (jangan diawali NEXT_PUBLIC_):
   SUPABASE_SERVICE_ROLE_KEY=eyJh...
   ```
   > **Catatan:** Aplikasi memiliki *safe fallback* sehingga tetap dapat di-build dan dijalankan dalam mode demo lokal tanpa kredensial Supabase.

4. Jalankan Server Pengembangan:
   ```bash
   npm run dev
   ```
   Buka [http://localhost:3000](http://localhost:3000) di peramban Anda.

5. Uji Produksi (Build & Lint):
   ```bash
   npx tsc --noEmit
   npm run lint
   npm run build
   ```

---

## 4. Struktur Rute Aplikasi

```
src/app/
├── (Publik)
│   ├── page.tsx               # Beranda layanan publik & banner siaga BMKG
│   ├── peta/page.tsx          # Peta bencana publik + toggle tampilan daftar
│   ├── lapor/page.tsx         # Form pelaporan bencana wizard 4 langkah
│   ├── lapor/sukses/page.tsx  # Halaman sukses kirim & kode tracking
│   ├── lacak/page.tsx         # Pelacakan status laporan & timeline tindak lanjut
│   ├── statistik/page.tsx     # Analitik laporan, sebaran bencana, ekspor CSV
│   ├── edukasi/page.tsx       # Panduan mitigasi bencana & tas siaga
│   ├── kontak-darurat/        # Daftar nomor darurat resmi nasional (112, 113, 115, dsb)
│   ├── cuaca/                 # Rujukan peringatan dini cuaca & gempa BMKG
│   └── fasilitas/             # Rujukan rumah sakit rujukan & puskesmas siaga
├── (Area Warga)
│   ├── masuk/page.tsx         # Portal masuk warga & petugas posko
│   ├── notifikasi/page.tsx    # Pusat notifikasi pembaruan status laporan
│   └── laporan-saya/page.tsx  # Riwayat laporan yang diajukan oleh pengguna
├── (Area Posko Petugas)
│   ├── admin/layout.tsx       # Shell tata letak posko (sidebar gelap + topbar)
│   ├── admin/page.tsx         # Dashboard ringkasan kejadian & antrean
│   ├── admin/laporan/page.tsx # Manajemen antrean laporan bencana
│   ├── admin/laporan/[id]/    # Lembar kerja verifikasi & transisi status
│   ├── admin/sos/page.tsx     # Radar monitor SOS real-time & audio alarm
│   ├── admin/peta/page.tsx    # Peta taktis operasional plotting armada
│   └── admin/statistik/       # Laporan kinerja dan kecepatan respons posko
└── api/
    ├── admin/status/route.ts  # Endpoint pembaruan status resmi
    └── reports/vouch/route.ts # Endpoint konfirmasi warga (+1)
```

---

## 5. Skenario Demo untuk Juri & Evaluator (Happy Path)

1. **Eksplorasi Beranda (`/`):**
   - Periksa kejelasan aksi utama: *Lapor Bencana*, *Pantau Peta*, *Lacak Laporan*.
   - Amati keterbukaan label `[Data Demonstrasi]` pada data skenario WIA 2026.
2. **Kirim Laporan Bencana (`/lapor`):**
   - Pilih jenis bencana (misal: *Banjir*).
   - Klik *Deteksi Lokasi GPS Saya* atau ketik alamat spesifik.
   - Isi judul dan deskripsi kondisi, lampirkan foto bukti.
   - Kirim laporan dan catat kode tracking yang diberikan (misal: `LPR-XXXXXX`).
3. **Lacak Status Laporan (`/lacak`):**
   - Masukkan kode tracking yang baru dibuat.
   - Amati timeline status awal: *Diterima*.
   - Coba tombol *Konfirmasi Laporan* untuk melihat validasi warga.
4. **Masuk ke Posko Petugas (`/admin`):**
   - Buka `/admin` atau pilih *Masuk Petugas Posko* dari `/masuk`.
   - Buka menu *Daftar Laporan* dan pilih laporan yang baru dibuat.
   - Pada lembar kerja, lakukan verifikasi: ubah status ke *Diverifikasi* &rarr; *Ditindaklanjuti*.
5. **Verifikasi Akuntabilitas Publik:**
   - Kembali ke `/lacak` dengan kode yang sama, amati bahwa status timeline dan catatan posko telah diperbarui secara persisten.
6. **Uji Radar SOS Darurat (`/admin/sos`):**
   - Tekan tombol melayang **SOS** di pojok kanan bawah.
   - Amati hitung mundur 3 detik dengan tombol batal.
   - Buka Monitor SOS di `/admin/sos`, amati titik radar merah baru, dan lakukan penugasan armada evakuasi.

---

## 6. Keterbukaan Data & Batasan Sistem (Data Truthfulness)

- **Simulasi Integrasi BNPB/BPBD:** Sisi posko penanggulangan saat ini berfungsi sebagai prototipe simulasi posko terpadu untuk kompetisi WIA 2026. Integrasi resmi dua arah ke sistem Pusdalops BNPB direncanakan pada roadmap lanjutan.
- **Panggilan Darurat SOS:** Tombol SOS menyimpan data koordinat darurat ke monitor posko SigapBumi. Sistem secara tegas menginstruksikan pelapor untuk tetap menghubungi **112 (Bebas Pulsa)** jika berada dalam ancaman keselamatan jiwa mendesak.
- **Atribusi Data Resmi:** Peringatan cuaca dan data gempa merujuk langsung ke portal resmi **BMKG**. Peta geospasial menggunakan ubin data **OpenStreetMap Contributors** di bawah lisensi ODbL.
- **Perlindungan Privasi:** Data kontak pribadi pelapor (nama dan nomor telepon) disamarkan di seluruh tampilan publik dan hanya dapat diakses pada lembar kerja verifikasi petugas terotorisasi.

---

## 7. Lisensi & Tim Pengembang

Proyek ini dikembangkan oleh **Tim SigapBumi** untuk kompetisi Multimedia In Action (MIA) 2026.
- **Ketua Tim & Pengembang:** Faiz
- **Pengembang & QA Lead:** Yossika
- **Verifikator Konten & Dokumentasi:** Wahyu

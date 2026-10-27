# DESIGN.md: Panduan Desain

Panduan visual untuk seluruh halaman website pelaporan bencana. Semua komponen baru **wajib** mengikuti dokumen ini agar tampilan tetap serasi dan selaras. Fitur dan alur ada di `prd.md`.

---

## 1. Prinsip Desain

1. **Bersih dan fokus.** Satu tujuan utama per layar. Ruang kosong secukupnya, tanpa dekorasi berlebihan.
2. **Cepat dipahami saat panik.** Aksi utama (Lapor, SOS) selalu besar, jelas, dan mudah dijangkau ibu jari.
3. **Mobile first.** Rancang untuk layar 360 px dahulu, lalu perluas ke tablet dan desktop.
4. **Warna punya makna.** Warna status dan peringatan konsisten di seluruh halaman, dan tidak pernah menjadi satu-satunya penanda (selalu ada teks atau ikon).
5. **Tanpa emoji.** Gunakan ikon garis (outline) dan teks. Emoji tidak dipakai di UI, notifikasi, maupun judul.
6. **Konsisten.** Gunakan token dan komponen yang sudah ada sebelum membuat yang baru.

---

## 2. Palet Warna

### 2.1 Warna Merek

| Token | Hex | Penggunaan |
| --- | --- | --- |
| `primary` | `#EF6806` | Tombol utama, tautan aktif, fokus, aksen merek |
| `primary-hover` | `#C75405` | Hover/pressed tombol utama, teks tautan di atas putih |
| `primary-soft` | `#FEF0E6` | Latar lembut untuk badge/penanda terpilih |
| `ink` | `#1F2937` | Teks utama, judul, header gelap, tombol sekunder |
| `ink-soft` | `#4B5563` | Teks sekunder, label, deskripsi |
| `ink-muted` | `#6B7280` | Placeholder, keterangan kecil |

### 2.2 Latar dan Netral

| Token | Hex | Penggunaan |
| --- | --- | --- |
| `bg` | `#F6F7F8` | Latar halaman |
| `surface` | `#FFFFFF` | Kartu, form, modal, header |
| `border` | `#E5E7EB` | Garis pemisah, border kartu dan input |
| `border-strong` | `#D1D5DB` | Border input saat hover |
| `disabled` | `#9CA3AF` | Teks/ikon nonaktif |

### 2.3 Warna Semantik

| Makna | Token | Hex | Latar lembut | Penggunaan |
| --- | --- | --- | --- | --- |
| Bahaya / darurat | `danger` | `#DC2626` | `#FEE2E2` | SOS, status Ditolak, error, peringatan tingkat tinggi |
| Waspada | `warning` | `#F59E0B` | `#FEF3C7` | Siaga, perlu perhatian, status Ditindaklanjuti |
| Normal / informasi | `info` | `#2563EB` | `#DBEAFE` | Informasi, status Diterima dan Diverifikasi, kondisi normal |
| Berhasil | `success` | `#16A34A` | `#DCFCE7` | Status Selesai, konfirmasi berhasil |

Catatan teks di atas latar lembut: gunakan versi lebih gelap agar terbaca, yaitu `danger-text #991B1B`, `warning-text #92400E`, `info-text #1E40AF`, `success-text #166534`.

### 2.4 Pemetaan Status Laporan

| Status | Warna | Ikon (lucide) |
| --- | --- | --- |
| Diterima | `info` | `inbox` |
| Diverifikasi | `info` (tebal/outline) | `badge-check` |
| Ditindaklanjuti | `warning` | `loader` / `wrench` |
| Selesai | `success` | `check-circle-2` |
| Ditolak | `danger` | `x-circle` |

### 2.5 Aturan Pemakaian Warna

- `primary` hanya untuk **aksi utama dan aksen merek**. Jangan dipakai untuk status bahaya.
- Tombol **SOS** selalu `danger` agar tidak tertukar dengan aksi biasa.
- Teks putih di atas `primary` harus **semibold 16 px atau lebih** (rasio kontras sekitar 4,5:1). Untuk teks oranye kecil di atas putih, pakai `primary-hover`.
- Jangan memakai gradasi mencolok, bayangan berwarna, atau lebih dari satu warna aksen dalam satu komponen.

---

## 3. Tipografi

- **Font:** `Inter` (fallback: `system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`). Muat lewat `next/font`.
- Angka tabel/statistik: aktifkan `font-variant-numeric: tabular-nums`.

| Peran | Mobile | Desktop | Berat | Line height |
| --- | --- | --- | --- | --- |
| Display (hero beranda) | 28 px | 40 px | 700 | 1.2 |
| H1 | 24 px | 32 px | 700 | 1.25 |
| H2 | 20 px | 24 px | 600 | 1.3 |
| H3 | 18 px | 20 px | 600 | 1.35 |
| Body | 16 px | 16 px | 400 | 1.6 |
| Body kecil | 14 px | 14 px | 400 | 1.5 |
| Caption | 12 px | 12 px | 500 | 1.4 |

Aturan: ukuran teks isi minimal 14 px, input minimal 16 px (mencegah zoom otomatis di iOS), panjang baris maksimal sekitar 70 karakter.

---

## 4. Spasi, Radius, Bayangan

Skala spasi kelipatan 4 px: `4, 8, 12, 16, 24, 32, 48, 64`.

| Elemen | Nilai |
| --- | --- |
| Padding halaman | 16 px (mobile), 24 px (tablet), 32 px (desktop) |
| Padding kartu | 16 px (mobile), 20-24 px (desktop) |
| Jarak antar kartu | 12-16 px |
| Radius kecil (input, badge) | 8 px |
| Radius sedang (kartu, tombol) | 12 px |
| Radius besar (modal, sheet) | 16 px |
| Radius penuh (chip, FAB SOS) | 9999 px |
| Bayangan kartu | `0 1px 2px rgba(31,41,55,0.06)` |
| Bayangan overlay/modal | `0 8px 24px rgba(31,41,55,0.12)` |

Gaya dasar kartu: latar `surface`, border 1 px `border`, radius 12 px, bayangan tipis. Hindari bayangan tebal.

---

## 5. Tata Letak dan Responsif

| Breakpoint | Lebar | Perilaku |
| --- | --- | --- |
| Default | < 640 px | Satu kolom, navigasi bawah (bottom nav) |
| `sm` | 640 px | Kartu 2 kolom bila sesuai |
| `md` | 768 px | Tablet, form lebih lebar |
| `lg` | 1024 px | Navigasi atas penuh, sidebar admin muncul |
| `xl` | 1280 px | Lebar konten maksimum 1200 px, di tengah |

Pola navigasi:

- **Mobile:** header ringkas (logo, notifikasi, profil) dan **bottom navigation** 4-5 item: Beranda, Peta, Lapor (tengah, menonjol), Lacak, Menu.
- **Desktop:** header atas dengan menu horizontal; Area Admin memakai **sidebar kiri** tetap (lebar 240 px) yang bisa diciutkan.
- Halaman peta memakai tampilan penuh; filter dalam bottom sheet di mobile dan panel samping di desktop.
- Tidak ada scroll horizontal pada halaman. Tabel lebar dibungkus kontainer yang dapat digulir, atau diubah menjadi daftar kartu di mobile.

---

## 6. Ikon dan Ilustrasi

- Pustaka ikon: **lucide-react**, gaya garis, ketebalan stroke 1.75-2, ukuran 20 px (default), 24 px (navigasi), 16 px (inline).
- Warna ikon mengikuti warna teks (`currentColor`) kecuali ikon status.
- **Tanpa emoji** di seluruh antarmuka.
- Ikon jenis bencana: banjir `waves`, gempa `activity`, kebakaran `flame`, longsor `mountain`, tsunami `waves` dengan label, karhutla `trees`, lainnya `alert-triangle`. Selalu disertai label teks.
- Ilustrasi opsional, sederhana, monokrom atau memakai palet merek. Tidak ada foto stok dekoratif.

---

## 7. Komponen

### 7.1 Tombol

| Varian | Tampilan | Pemakaian |
| --- | --- | --- |
| Primary | Latar `primary`, teks putih, semibold | Aksi utama (Lapor Bencana, Kirim) |
| Secondary | Latar `ink`, teks putih | Aksi penting kedua |
| Outline | Latar putih, border `border-strong`, teks `ink` | Aksi pendukung |
| Ghost | Tanpa latar, teks `ink` | Aksi ringan, navigasi |
| Danger | Latar `danger`, teks putih | SOS, tolak laporan, hapus |

Ketentuan: tinggi minimal **48 px** (area sentuh minimal 44 x 44 px), radius 12 px, padding horizontal 20 px. Di mobile, tombol aksi utama pada form berlebar penuh. Status: hover (gelapkan), pressed, disabled (`disabled`, tanpa bayangan), loading (spinner, teks tetap).

### 7.2 Tombol SOS (FAB)

- Bentuk bulat, diameter 64 px (mobile) / 72 px (desktop), latar `danger`, teks "SOS" putih tebal.
- Posisi tetap di kanan bawah, di atas bottom nav (jarak 16 px dari tepi dan 80 px dari bawah di mobile). Muncul di **semua halaman**.
- Setelah ditekan: layar penuh dengan **hitung mundur 3 detik** (angka besar, lingkaran progres), tombol "Batalkan" besar di bawah. Setelah terkirim: tampil konfirmasi, pilihan tipe bantuan (opsional), dan tombol telepon 112, SAR, Damkar.
- Tipe bantuan tampil sebagai kartu pilihan besar dengan ikon dan label: Damkar (`flame`), Medis (`heart-pulse`), Polisi (`shield`), BNPB/BPBD (`life-buoy`).

### 7.3 Input dan Form

- Tinggi input 48 px, border 1 px `border`, radius 8 px, teks 16 px.
- Fokus: ring 2 px `primary` dengan offset 2 px. Error: border `danger` dan pesan error di bawah dengan ikon.
- Label selalu tampil di atas input (bukan hanya placeholder).
- Form lapor dibagi **maksimal 4 langkah** dengan indikator langkah di atas (angka dan judul langkah, bar progres `primary`).
- Pemilih jenis bencana: kisi kartu ikon (2 kolom di mobile, 3-4 di desktop), item terpilih memakai border `primary` dan latar `primary-soft`.
- Unggah foto: area putus-putus (dashed) dengan pratinjau; tampilkan ukuran dan tombol hapus.
- Pemilih lokasi: peta mini dengan pin dapat digeser, tombol "Gunakan lokasi saya".

### 7.4 Kartu

- Kartu laporan: gambar mini (opsional), judul jenis bencana, lokasi singkat, waktu relatif, badge status, jumlah konfirmasi.
- Kartu statistik: angka besar (H1), label kecil, indikator perubahan.
- Seluruh kartu yang dapat diklik punya state hover (border `border-strong`) dan fokus yang terlihat.

### 7.5 Badge Status dan Peringatan

- Badge: radius penuh, tinggi 24 px, teks 12 px semibold, latar lembut dan teks gelap sesuai warna semantik, disertai ikon 14 px.
- Banner peringatan (cuaca/siaga): latar lembut semantik, border kiri 4 px berwarna semantik, ikon, judul, deskripsi, sumber (BMKG) dan waktu pembaruan.

### 7.6 Timeline Status

- Vertikal, garis 2 px `border`, titik 12 px. Langkah selesai memakai warna status, langkah saat ini diberi ring, langkah berikutnya abu-abu.
- Tiap langkah menampilkan nama status, waktu, dan catatan petugas.

### 7.7 Peta

- Leaflet + OpenStreetMap, atribusi sumber selalu terlihat.
- Penanda berbentuk pin dengan warna sesuai status laporan (lihat 2.4). SOS aktif berwarna `danger` dengan animasi denyut halus.
- Klaster penanda memakai lingkaran `ink` dengan angka putih.
- Kontrol zoom di kanan, tombol "lokasi saya" berukuran besar.
- Popup memuat jenis, status, waktu, dan tautan ke detail. Data pribadi pelapor tidak ditampilkan.

### 7.8 Navigasi

- Bottom nav: tinggi 64 px, latar `surface`, border atas `border`. Item aktif berwarna `primary` dengan label tebal. Item **Lapor** di tengah berbentuk lingkaran `primary` yang menonjol.
- Header: tinggi 56 px (mobile) / 64 px (desktop), latar `surface`, border bawah `border`.
- Sidebar admin: latar `ink`, teks putih, item aktif dengan penanda `primary`.

### 7.9 Tabel dan Daftar (Admin)

- Header tabel latar `bg`, teks 12 px huruf kapital semibold `ink-soft`. Baris 56 px, garis pemisah `border`.
- Kolom prioritas memakai badge. Filter di atas tabel (chip dan pencarian).
- Di mobile, tabel berubah menjadi daftar kartu.

### 7.10 Grafik

- Chart.js atau Recharts. Warna seri: `primary`, `ink`, `info`, `warning`, `success`, `danger` (gunakan seperlunya).
- Grid garis tipis `border`, label 12 px `ink-soft`, tooltip latar `ink`.
- Selalu sertakan judul, satuan, dan alternatif teks/tabel ringkas.

### 7.11 Modal, Sheet, Toast

- Di mobile, dialog tampil sebagai **bottom sheet** (radius atas 16 px, pegangan di tengah). Di desktop sebagai modal tengah lebar maksimum 480 px dengan overlay `rgba(31,41,55,0.5)`.
- Toast muncul di atas (mobile) atau kanan atas (desktop), otomatis hilang 4 detik, memakai ikon dan warna semantik.

### 7.12 Status Kosong, Memuat, Galat, Offline

- **Kosong:** ikon garis besar, judul singkat, satu kalimat penjelasan, satu tombol aksi.
- **Memuat:** skeleton abu-abu (`border`) menyerupai bentuk konten, bukan spinner layar penuh.
- **Galat:** banner `danger` dengan tombol "Coba lagi".
- **Offline:** banner `warning` di atas halaman: "Anda sedang offline. Laporan disimpan dan dikirim otomatis saat online." Laporan tertunda diberi badge "Menunggu kirim".

---

## 8. Gaya Penulisan (UI Copy)

- Bahasa Indonesia, singkat, lugas, ramah. Hindari istilah teknis.
- Tombol berupa kata kerja: "Kirim Laporan", "Lacak", "Konfirmasi".
- Pesan error menjelaskan masalah dan solusi: "Lokasi belum aktif. Aktifkan GPS atau geser pin di peta."
- Tanpa emoji, tanpa tanda seru berlebihan. Nada tenang dan meyakinkan, terutama di alur SOS.
- Tanggal dan waktu format Indonesia (contoh: 27 Okt 2026, 14.05 WIB), dengan waktu relatif di daftar ("5 menit lalu").

---

## 9. Aksesibilitas

- Kontras teks minimal 4,5:1 (teks besar 3:1).
- Semua elemen interaktif dapat dioperasikan dengan keyboard, dengan fokus yang jelas terlihat.
- Area sentuh minimal 44 x 44 px, jarak antar target minimal 8 px.
- Gambar bermakna punya `alt`; ikon dekoratif `aria-hidden`; tombol ikon punya `aria-label`.
- Status tidak hanya dibedakan oleh warna (selalu ada teks/ikon).
- Hormati `prefers-reduced-motion`: matikan animasi denyut dan transisi besar.
- Hitung mundur SOS diumumkan melalui `aria-live`.
- Formulir memiliki label, pesan error terhubung ke input (`aria-describedby`).

## 10. Gerak (Motion)

- Durasi 150-250 ms, easing `ease-out`. Hanya untuk umpan balik (hover, buka sheet, toast).
- Satu-satunya animasi berulang: denyut halus penanda SOS aktif dan lingkaran hitung mundur.
- Tidak ada animasi dekoratif yang menghambat tugas.

## 11. Kinerja Visual

- Gambar diunggah dikompres dan ditampilkan dengan `next/image` (lazy load, ukuran responsif).
- Font dimuat sekali lewat `next/font`, hanya bobot 400, 500, 600, 700.
- Skeleton untuk konten yang dimuat dari jaringan agar tata letak tidak bergeser.

---

## 12. Token Tailwind

Tambahkan ke `tailwind.config.ts` (atau `@theme` pada Tailwind v4) agar seluruh tim memakai nilai yang sama:

```ts
// tailwind.config.ts
import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: "#EF6806", hover: "#C75405", soft: "#FEF0E6" },
        ink: { DEFAULT: "#1F2937", soft: "#4B5563", muted: "#6B7280" },
        bg: "#F6F7F8",
        surface: "#FFFFFF",
        line: { DEFAULT: "#E5E7EB", strong: "#D1D5DB" },
        danger: { DEFAULT: "#DC2626", soft: "#FEE2E2", text: "#991B1B" },
        warning: { DEFAULT: "#F59E0B", soft: "#FEF3C7", text: "#92400E" },
        info: { DEFAULT: "#2563EB", soft: "#DBEAFE", text: "#1E40AF" },
        success: { DEFAULT: "#16A34A", soft: "#DCFCE7", text: "#166534" },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
      },
      borderRadius: { sm: "8px", md: "12px", lg: "16px" },
      boxShadow: {
        card: "0 1px 2px rgba(31,41,55,0.06)",
        overlay: "0 8px 24px rgba(31,41,55,0.12)",
      },
      maxWidth: { page: "1200px" },
    },
  },
};
export default config;
```

CSS global minimum:

```css
body { background: #F6F7F8; color: #1F2937; }
:focus-visible { outline: 2px solid #EF6806; outline-offset: 2px; }
@media (prefers-reduced-motion: reduce) { * { animation: none !important; transition: none !important; } }
```

---

## 13. Boleh dan Tidak Boleh

| Boleh | Tidak boleh |
| --- | --- |
| Memakai token warna dan komponen yang ada | Menulis hex baru di luar palet tanpa persetujuan developer |
| Ikon garis lucide dengan label teks | Emoji di UI, judul, atau notifikasi |
| Satu aksi utama per layar | Banyak tombol `primary` bersaing di satu layar |
| Warna `danger` untuk SOS dan bahaya | Warna `primary` untuk status bahaya |
| Kartu bersih dengan border tipis | Bayangan tebal, gradasi mencolok, dekorasi berlebihan |
| Mobile first dengan area sentuh besar | Elemen kecil yang sulit ditekan saat panik |
| Teks Indonesia singkat dan jelas | Istilah teknis dan nada panik |

## 14. Daftar Periksa Sebelum Menyerahkan UI

- [ ] Hanya memakai token warna, tipografi, dan spasi dari dokumen ini
- [ ] Tampil benar di lebar 360 px, 768 px, dan 1280 px
- [ ] Tidak ada emoji
- [ ] Area sentuh minimal 44 px, kontras memenuhi 4,5:1
- [ ] Ada state memuat, kosong, galat, dan offline bila relevan
- [ ] Status memakai warna, ikon, dan teks sekaligus
- [ ] Fokus keyboard terlihat, ikon tombol memiliki `aria-label`
- [ ] Tombol SOS tetap tampil dan tidak tertutup elemen lain

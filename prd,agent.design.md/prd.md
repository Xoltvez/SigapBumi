# PRD: Website Pelaporan Bencana Terpadu

> Sitemap, User Journey, PRD, dan Fitur | Subtema: Civic Reporting & Accountability
> Dokumen ini adalah sumber kebenaran untuk **apa** yang dibangun. Untuk **bagaimana tampilannya** lihat `design.md`. Untuk **aturan kerja developer/agent** lihat `agent.md`.

**Nama kerja:** (isi sesuai kelompok, contoh: SigapLapor / LaporSiaga)

---

## 1. Ringkasan Proyek

Platform pelaporan bencana berbasis masyarakat. Warga melaporkan kejadian bencana (gempa bumi, tsunami, banjir, karhutla, kebakaran, tanah longsor, dan lainnya) beserta lokasi dan bukti foto/video. Laporan diverifikasi, diteruskan ke instansi penanggulangan bencana (BNPB/BPBD), dan statusnya dapat dilacak secara transparan oleh pelapor maupun publik. Tersedia tombol **SOS** untuk kondisi darurat.

Sisi instansi disebut **simulasi dashboard petugas BNPB/BPBD**. Integrasi resmi ke sistem BNPB adalah rencana pengembangan lanjutan.

## 2. Latar Belakang dan Permasalahan

Indonesia berada di wilayah cincin api dan rawan berbagai bencana. Dalam praktiknya:

- Laporan kejadian tersebar di media sosial, grup pesan, dan telepon sehingga tercecer.
- Informasi awal sulit diverifikasi, rawan hoaks dan laporan ganda.
- Pelapor tidak tahu apakah laporannya sudah diterima dan ditindaklanjuti.
- Instansi kesulitan memprioritaskan laporan karena tidak ada data terpusat dan terstruktur.
- Saat bencana, sinyal dan waktu terbatas, sehingga pelaporan harus cepat dan ringan.

## 3. Tujuan dan Sasaran

**Tujuan utama:** mempercepat arus informasi bencana dari masyarakat ke instansi berwenang secara terverifikasi, transparan, dan dapat dilacak.

**Sasaran terukur:**

- Pelapor dapat mengirim laporan dalam waktu kurang dari 2 menit.
- Setiap laporan memiliki status yang dapat dilacak sampai selesai.
- Laporan dengan banyak konfirmasi warga otomatis naik prioritas.
- Data kejadian tersaji terbuka dalam bentuk peta dan statistik.

## 4. Pemetaan ke Subtema Lomba

| Subtema | Wujud dalam website |
| --- | --- |
| Civic Reporting & Accountability (utama) | Form lapor bencana, verifikasi petugas/relawan, tindak lanjut, penolakan laporan palsu |
| Public Service Tracking | Kode tracking, timeline status laporan, notifikasi perubahan status |
| Open Government Data | Peta bencana publik, statistik terbuka, integrasi data gempa BMKG |
| Data-Driven Decision Support | Dashboard tren bencana per wilayah, waktu respons rata-rata, sebaran kejadian |

## 5. Target Pengguna (Persona)

**Persona 1: Warga (pelapor)**
Usia 17-55 tahun, memakai ponsel, sering berada di lokasi kejadian. Kebutuhan: cara cepat melapor, kepastian laporan diterima, info bencana di sekitar. Hambatan: panik, sinyal lemah, tidak tahu harus lapor ke siapa.

**Persona 2: Relawan lokal**
Pengurus RT/RW, anggota komunitas tanggap bencana. Kebutuhan: membantu memverifikasi kejadian di lapangan. Hambatan: tidak ada jalur resmi menyampaikan kondisi lapangan.

**Persona 3: Petugas BNPB/BPBD**
Memantau dan menindaklanjuti laporan. Kebutuhan: data terpusat, prioritas jelas, lokasi akurat, alat menugaskan tim. Hambatan: banjir informasi tidak terverifikasi.

**Persona 4: Pengunjung umum / peneliti / jurnalis**
Kebutuhan: melihat data kebencanaan terbuka tanpa login.

---

## 6. Ruang Lingkup

**Dalam cakupan (versi lomba/MVP):**

- Pelaporan bencana dengan lokasi otomatis dan unggah foto/video
- Tombol SOS
- Pelacakan status laporan
- Peta bencana publik
- Verifikasi dan tindak lanjut oleh petugas
- Konfirmasi laporan oleh warga
- Statistik dasar dan edukasi mitigasi
- Tipe bantuan SOS (Damkar, Medis, Polisi, BNPB/BPBD)
- Informasi fasilitas kesehatan terdekat
- Cuaca dan peringatan harian dari sumber resmi (BMKG)

**Di luar cakupan (pengembangan lanjutan):**

- Integrasi resmi dua arah dengan sistem BNPB
- Aplikasi mobile native
- Pengiriman SMS massal dan peringatan dini berbasis sensor
- Analitik prediktif berbasis AI
- Fitur donasi (tahap pengembangan akhir, **harus mendapat persetujuan developer**)

## 7. User Stories

| ID | Sebagai | Saya ingin | Agar |
| --- | --- | --- | --- |
| US-01 | Warga | melaporkan bencana dengan foto dan lokasi otomatis | petugas cepat mengetahui kejadian |
| US-02 | Warga | menekan tombol SOS | bantuan darurat segera mengetahui posisi saya |
| US-03 | Warga | melacak status laporan dengan kode | saya yakin laporan ditindaklanjuti |
| US-04 | Warga | menerima notifikasi saat status berubah | tidak perlu mengecek berulang |
| US-05 | Warga | mengonfirmasi laporan orang lain | laporan yang benar cepat naik prioritas |
| US-06 | Relawan | memberi verifikasi awal dari lapangan | laporan lebih dapat dipercaya |
| US-07 | Petugas | melihat daftar laporan terurut prioritas | saya menangani yang paling mendesak dahulu |
| US-08 | Petugas | mengubah status dan mencatat tindak lanjut | proses tercatat dan transparan |
| US-09 | Petugas | menolak laporan palsu/duplikat | data tetap bersih |
| US-10 | Petugas | melihat dan merespons SOS secara real-time | korban tertangani cepat |
| US-11 | Publik | melihat peta dan statistik bencana | saya mengetahui kondisi daerah saya |
| US-12 | Warga | melapor meski sinyal buruk | laporan tetap terkirim saat sinyal kembali |
| US-13 | Warga | memilih tipe bantuan SOS (Damkar, Medis, Polisi, BNPB/BPBD) | SOS diarahkan ke bantuan yang tepat |
| US-14 | Warga | melihat rumah sakit dan fasilitas kesehatan terdekat | saya tahu ke mana harus menuju saat darurat |
| US-15 | Warga | membaca cuaca dan peringatan harian dari sumber resmi | saya dapat bersiap sebelum bencana terjadi |
| US-16 | Warga | berdonasi dan melihat laporan penggunaan dana (tahap akhir) | bantuan tersalurkan secara transparan |

## 8. Kebutuhan Fungsional

Prioritas: **P0** = wajib ada di demo, **P1** = penting, **P2** = nilai tambah, **Akhir** = tahap pengembangan akhir, memerlukan persetujuan developer.

| ID | Kebutuhan | Prioritas |
| --- | --- | --- |
| FR-01 | Form laporan: jenis bencana, deskripsi, foto/video, lokasi GPS otomatis dengan opsi geser pin manual | P0 |
| FR-02 | Sistem menghasilkan kode tracking unik tiap laporan | P0 |
| FR-03 | Timeline status: Diterima, Diverifikasi, Ditindaklanjuti, Selesai, Ditolak | P0 |
| FR-04 | Peta publik berisi titik laporan dengan filter jenis, status, dan wilayah | P0 |
| FR-05 | Tombol SOS melayang di semua halaman dengan hitung mundur 3 detik sebelum terkirim | P0 |
| FR-06 | Dashboard petugas: daftar laporan, detail, ubah status, catatan tindak lanjut | P0 |
| FR-07 | Autentikasi dan pembagian peran (warga, relawan, petugas) | P0 |
| FR-08 | Konfirmasi laporan oleh warga (satu akun satu konfirmasi) dan kenaikan prioritas otomatis | P1 |
| FR-09 | Monitor SOS real-time untuk petugas | P1 |
| FR-10 | Notifikasi perubahan status kepada pelapor | P1 |
| FR-11 | Halaman statistik: tren, sebaran per wilayah, waktu respons rata-rata | P1 |
| FR-12 | Edukasi mitigasi per jenis bencana dan daftar kontak darurat | P1 |
| FR-13 | Mode offline: laporan disimpan lokal dan dikirim otomatis saat online (PWA) | P2 |
| FR-14 | Integrasi data gempa terkini dari BMKG | P2 |
| FR-15 | Ekspor data laporan (CSV) untuk petugas | P2 |
| FR-16 | Deteksi laporan duplikat berdasarkan jarak dan waktu | P2 |
| FR-17 | Pelaporan cepat tanpa daftar penuh (anonim/OTP) | P2 |
| FR-18 | Tipe bantuan SOS: Damkar, Medis/Rumah Sakit, Polisi, BNPB/BPBD; tipe masuk ke Monitor SOS petugas sebagai label | P1 |
| FR-19 | Informasi fasilitas kesehatan terdekat (rumah sakit, puskesmas) di peta, lengkap dengan jarak dan jam buka dari data OpenStreetMap | P1 |
| FR-20 | Cuaca dan peringatan harian di beranda dari data resmi BMKG, dengan atribusi sumber | P1 |
| FR-21 | Berita cuaca/kebencanaan berupa tautan ke sumber resmi (bukan konten editorial buatan sendiri) | P2 |
| FR-22 | Donasi: daftar kampanye bencana dari lembaga mitra terverifikasi, tombol donasi mengarah ke kanal resmi lembaga. **Harus mendapat persetujuan developer.** | Akhir |
| FR-23 | Laporan penggunaan dana donasi (jumlah terkumpul, penyaluran, bukti). **Harus mendapat persetujuan developer.** | Akhir |

## 9. Kebutuhan Non-Fungsional

| Aspek | Kebutuhan |
| --- | --- |
| Performa | Halaman utama termuat di bawah 3 detik pada jaringan 4G; unggahan media dikompres otomatis |
| Ketersediaan | Mendukung mode low-signal dan offline untuk fitur lapor |
| Keamanan | Row Level Security di database, role tidak dapat diubah sendiri oleh pengguna, HTTPS, kunci rahasia tidak ada di kode client |
| Privasi | Data pribadi pelapor (nama, nomor HP) tidak ditampilkan di peta publik |
| Aksesibilitas | Responsif (mobile first), kontras warna baik, tombol besar untuk kondisi panik |
| Keandalan data | Pencegahan hoaks lewat verifikasi, konfirmasi warga, dan rate limit |
| Skalabilitas | Indeks geospasial agar pencarian laporan berdasarkan lokasi tetap cepat |

## 10. Indikator Keberhasilan (KPI)

- Rata-rata waktu dari laporan masuk hingga diverifikasi
- Persentase laporan yang berstatus selesai
- Jumlah laporan terverifikasi dibanding yang ditolak
- Waktu rata-rata pengisian form laporan
- Jumlah konfirmasi warga per laporan

## 11. Risiko dan Mitigasi

| Risiko | Mitigasi |
| --- | --- |
| Laporan palsu/hoaks | Verifikasi petugas dan relawan, konfirmasi warga, rate limit, riwayat pelapor |
| Salah tekan SOS | Hitung mundur 3 detik dengan opsi batal |
| Sinyal buruk saat bencana | PWA dengan antrean offline |
| Penyalahgunaan akun petugas | Akun petugas dibuat manual, bukan lewat pendaftaran publik |
| Belum terhubung resmi dengan BNPB | Dinyatakan sebagai simulasi, dengan rencana integrasi dan koordinasi BPBD |
| Free tier Supabase menjeda project tidak aktif | Aktifkan kembali sebelum presentasi |
| Donasi rawan penipuan dan berisiko hukum penggalangan dana | Ditempatkan di tahap akhir; platform tidak menampung dana, hanya mengarahkan ke lembaga mitra resmi terverifikasi; wajib persetujuan developer sebelum dikembangkan |
| Data cuaca atau fasilitas tidak lengkap atau usang | Cantumkan sumber dan waktu pembaruan; gunakan cache dan tampilkan pesan jika data gagal dimuat |

---

## 12. Daftar Fitur

### 12.1 Fitur untuk Warga

- **Lapor Bencana**: pilih jenis lewat ikon, foto/video, deskripsi singkat, lokasi otomatis.
- **Tombol SOS**: kirim lokasi darurat sekali tekan, dengan akses telepon cepat ke 112, SAR, dan damkar.
- **Lacak Laporan**: cari dengan kode atau lihat di Laporan Saya.
- **Konfirmasi Laporan**: tandai laporan orang lain sebagai benar.
- **Notifikasi**: pembaruan status dan peringatan kejadian di sekitar lokasi.
- **Peta dan Statistik Publik**: tanpa perlu login.
- **Edukasi Mitigasi**: panduan sebelum, saat, dan sesudah bencana.
- **Tipe Bantuan SOS**: Damkar, Medis/Rumah Sakit, Polisi, atau BNPB/BPBD; opsional agar SOS tetap cepat.
- **Informasi Fasilitas Kesehatan**: peta dan daftar rumah sakit terdekat beserta jarak, jam buka, dan tombol arah.
- **Cuaca dan Peringatan Harian**: ringkasan cuaca dan status siaga dari BMKG dan sumber resmi lain, tampil di beranda.
- **Donasi (tahap akhir)**: kampanye dari lembaga mitra terverifikasi dan laporan penggunaan dana. Harus mendapat persetujuan developer.

### 12.2 Fitur untuk Relawan

- Semua fitur warga.
- Memberi verifikasi awal lapangan pada laporan di wilayahnya.

### 12.3 Fitur untuk Petugas/Admin

- Dashboard ringkasan: jumlah laporan baru, SOS aktif, laporan per status.
- Daftar laporan dengan prioritas otomatis dan filter.
- Detail laporan: foto, peta, konfirmasi, riwayat.
- Ubah status, tugaskan tim, tulis catatan tindak lanjut, tolak laporan.
- Monitor SOS real-time dengan penanda dan alarm.
- Peta operasional.
- Manajemen pengguna dan peran.
- Statistik dan ekspor data.

### 12.4 Fitur Pendukung Sistem

- Trigger otomatis: buat profil saat daftar, hitung konfirmasi, catat riwayat status.
- Pencarian laporan terdekat berbasis PostGIS.
- Penyimpanan media di Supabase Storage dengan batas ukuran dan tipe file.
- Pengambilan data eksternal: cuaca dari BMKG dan fasilitas kesehatan dari OpenStreetMap, disimpan sementara (cache) agar ringan.

## 13. Peran dan Hak Akses

| Fitur | Pengunjung | Warga | Relawan | Petugas |
| --- | --- | --- | --- | --- |
| Lihat peta, statistik, edukasi | Ya | Ya | Ya | Ya |
| Lacak laporan dengan kode | Ya | Ya | Ya | Ya |
| Buat laporan | Terbatas (cepat/OTP) | Ya | Ya | Ya |
| Kirim SOS | Terbatas | Ya | Ya | Ya |
| Konfirmasi laporan | Tidak | Ya | Ya | Ya |
| Verifikasi awal lapangan | Tidak | Tidak | Ya | Ya |
| Ubah status dan tindak lanjut | Tidak | Tidak | Tidak | Ya |
| Lihat dan tangani SOS | Tidak | Tidak | Tidak | Ya |
| Kelola pengguna dan ekspor data | Tidak | Tidak | Tidak | Ya |

## 14. Sitemap

```
Beranda (/)
├── Peta Bencana (/peta)
│   └── Detail Laporan (/laporan/[id])
├── Lapor Bencana (/lapor)
│   └── Berhasil + kode tracking (/lapor/sukses)
├── SOS (/sos)  [tombol melayang di semua halaman, termasuk Beranda]
│   └── Pilih Tipe Bantuan (Damkar, Medis, Polisi, BNPB/BPBD)
├── Cek Status Laporan (/lacak)
├── Statistik (/statistik)
├── Edukasi Mitigasi (/edukasi)
│   └── Panduan per bencana (/edukasi/[jenis])
├── Kontak Darurat (/kontak-darurat)
├── Fasilitas Kesehatan (/fasilitas)
├── Cuaca dan Peringatan (/cuaca)
├── Donasi (/donasi)  [tahap akhir, perlu persetujuan developer]
│   └── Laporan Penggunaan Dana (/donasi/laporan)
├── Tentang (/tentang)
│
├── Auth
│   ├── Masuk (/masuk)
│   └── Daftar (/daftar)
│
├── Area Warga (login)
│   ├── Laporan Saya (/laporan-saya)
│   ├── Notifikasi (/notifikasi)
│   └── Profil (/profil)
│
└── Area Petugas/Admin (/admin, khusus role petugas)
    ├── Dashboard Ringkasan (/admin)
    ├── Daftar Laporan (/admin/laporan)
    │   └── Detail + Tindak Lanjut (/admin/laporan/[id])
    ├── Peta Operasional (/admin/peta)
    ├── Monitor SOS (/admin/sos)
    ├── Manajemen Pengguna (/admin/pengguna)
    └── Statistik dan Ekspor (/admin/statistik)
```

## 15. User Journey

### 15.1 Warga melaporkan bencana

| Tahap | Aksi pengguna | Halaman | Perasaan | Solusi sistem |
| --- | --- | --- | --- | --- |
| Sadar | Melihat banjir di depan rumah | Beranda | Panik, bingung harus lapor ke mana | Tombol Lapor Bencana besar dan jelas |
| Lapor | Pilih jenis, foto, deskripsi singkat | /lapor | Takut ribet | Form maksimal 4 langkah, GPS otomatis, pilih jenis lewat ikon |
| Kirim | Tekan kirim | /lapor/sukses | Ragu apakah terkirim | Konfirmasi dan kode tracking; jika offline, disimpan lalu dikirim otomatis |
| Menunggu | Cek perkembangan | /lacak, /laporan-saya | Cemas | Timeline status yang jelas |
| Notifikasi | Menerima update | /notifikasi | Merasa didengar | Notifikasi setiap perubahan status beserta catatan petugas |
| Selesai | Laporan ditutup | /laporan/[id] | Lega | Bukti tindak lanjut dan opsi penilaian |

### 15.2 Kondisi darurat (SOS)

| Langkah | Aksi | Respons sistem |
| --- | --- | --- |
| 1 | Tekan tombol SOS | Konfirmasi dengan hitung mundur 3 detik, bisa dibatalkan |
| 2 | Lokasi terkirim otomatis | Masuk ke Monitor SOS petugas dengan penanda merah dan alarm |
| 3 | Opsi: pilih tipe bantuan (Damkar, Medis, Polisi, BNPB/BPBD) atau tulis pesan | Tidak wajib agar cepat; tipe tampil sebagai label di Monitor SOS petugas |
| 4 | Lihat nomor darurat | Tombol telepon langsung ke 112, SAR, damkar |
| 5 | Petugas merespons | Status berubah menjadi ditangani dan pengguna diberi notifikasi |

### 15.3 Petugas menindaklanjuti laporan

| Tahap | Aksi | Halaman |
| --- | --- | --- |
| Masuk | Login sebagai petugas | /masuk lalu /admin |
| Pantau | Melihat laporan baru dan SOS, terurut prioritas | /admin |
| Verifikasi | Cek foto, lokasi, konfirmasi warga/relawan; tolak jika hoaks | /admin/laporan/[id] |
| Tindak lanjut | Ubah status, tugaskan tim, tulis catatan | /admin/laporan/[id] |
| Evaluasi | Melihat waktu respons dan sebaran bencana | /admin/statistik |

### 15.4 Pengunjung umum

Buka beranda, lihat peta bencana terkini, cek statistik, lalu baca panduan mitigasi. Saat ingin melapor, sistem menawarkan masuk atau lapor cepat.

## 16. Arsitektur dan Teknologi

| Bagian | Teknologi | Alasan |
| --- | --- | --- |
| Frontend | Next.js (React) + Tailwind CSS | Cepat dikembangkan, mendukung routing dan proteksi halaman |
| PWA | Service worker | Dapat dipasang seperti aplikasi dan mendukung mode offline |
| Peta | Leaflet + OpenStreetMap | Gratis dan ringan |
| Backend dan database | Supabase (PostgreSQL + PostGIS, Auth, Storage, Realtime) | Satu paket, tanpa membangun backend dari nol |
| Grafik | Chart.js atau Recharts | Visualisasi statistik |
| Deploy | Vercel + Supabase | Mudah dan gratis untuk demo |
| Sumber data eksternal | BMKG (cuaca, peringatan, gempa); OpenStreetMap/Overpass (fasilitas kesehatan) | Data resmi dan gratis; atribusi sumber ditampilkan |

### Tabel Database Utama

| Tabel | Fungsi |
| --- | --- |
| profiles | Data pengguna dan peran (warga, relawan, petugas) |
| reports | Laporan bencana beserta lokasi (geography point), status, jumlah konfirmasi |
| report_media | Foto/video terkait laporan |
| report_status_logs | Riwayat perubahan status untuk timeline tracking |
| report_confirmations | Konfirmasi warga, satu akun satu konfirmasi per laporan |
| sos_alerts | Data SOS beserta lokasi, tipe bantuan, dan status penanganan |

**Keamanan (Row Level Security):** laporan dapat dibaca publik, tetapi hanya petugas yang boleh mengubah status; user tidak dapat mengubah role-nya sendiri.

## 17. Rencana Pengembangan

| Tahap | Cakupan |
| --- | --- |
| Tahap 1 (MVP lomba) | Auth dan role, form lapor, peta publik, tracking status, dashboard petugas, SOS dasar |
| Tahap 2 | Konfirmasi warga, notifikasi, statistik, edukasi, mode offline PWA, tipe bantuan SOS, info fasilitas kesehatan, cuaca dan peringatan harian |
| Tahap 3 | Integrasi BMKG, deteksi duplikat, ekspor data, peran relawan penuh |
| Tahap 4 (jangka panjang) | Integrasi resmi BNPB/BPBD, aplikasi mobile, peringatan dini, analitik prediktif |
| Tahap Akhir | Fitur donasi dan laporan penggunaan dana |

> **Catatan:** Fitur donasi pada tahap pengembangan akhir harus mendapat persetujuan developer. Pengembangannya tidak dimulai sebelum persetujuan tersebut diberikan.

## 18. Alur Demo yang Disarankan (Happy Path)

1. Warga membuka beranda dan melihat peta bencana.
2. Warga membuat laporan banjir lengkap dengan foto dan lokasi, lalu menerima kode tracking.
3. Petugas membuka dashboard, melihat laporan baru, memverifikasi, dan mengubah status.
4. Warga melihat timeline dan notifikasi status berubah secara real-time.
5. Tampilkan halaman statistik sebagai bukti dukungan keputusan berbasis data.
6. Demonstrasikan tombol SOS muncul di Monitor SOS petugas.

## 19. Penutup

Website ini menjawab kebutuhan pelaporan bencana yang cepat, terverifikasi, dan transparan. Dengan satu alur utama yang matang (lapor, verifikasi, tindak lanjut, tracking) dan dukungan data terbuka serta statistik, ide ini menyentuh empat subtema sekaligus dengan fokus utama pada Civic Reporting & Accountability.

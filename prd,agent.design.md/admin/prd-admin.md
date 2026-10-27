# PRD Admin: Dashboard Petugas Pelaporan Bencana Terpadu

> Dokumen ini adalah sumber kebenaran untuk **apa** yang dibangun pada **area admin (`/admin/*`)**.
> Pelengkap dari `prd.md` (produk sisi warga). Tampilan: `design-admin.md`. Aturan kerja agent/developer: `agent-admin.md`.
> Jika ada pertentangan, aturan produk sisi warga mengikuti `prd.md`, dan hal yang khusus admin mengikuti dokumen ini. Pertentangan yang tidak jelas **ditanyakan ke developer**, tidak ditebak.

**Nama kerja:** (isi sesuai kelompok)
**Status instansi:** seluruh sisi petugas adalah **simulasi dashboard BNPB/BPBD**. Belum terhubung ke sistem resmi.

---

## 1. Ringkasan

Dashboard admin adalah ruang kerja petugas untuk memantau laporan dan SOS dari masyarakat, memverifikasi, menugaskan tim, menindaklanjuti sampai selesai, dan membaca data untuk mengambil keputusan. Setiap tindakan petugas tercatat dan langsung tampil sebagai timeline publik bagi pelapor, sehingga dashboard ini adalah inti subtema **Civic Reporting & Accountability** dan **Public Service Tracking**.

## 2. Tujuan dan Sasaran

**Tujuan utama:** petugas dapat melihat apa yang paling mendesak, menindaklanjutinya dengan bukti, dan akuntabel atas setiap keputusan.

**Sasaran terukur:**

- Laporan baru dan SOS muncul di dashboard dalam waktu kurang dari 3 detik tanpa muat ulang halaman.
- Petugas dapat memverifikasi dan mengubah status satu laporan dalam kurang dari 1 menit.
- 100% perubahan status, penugasan, dan perubahan peran tercatat di audit log.
- SOS yang belum ditanggapi lebih dari 2 menit ditandai eskalasi visual.
- Data pribadi pelapor hanya terlihat oleh petugas, dan setiap pembukaan kontak tercatat.

## 3. Pengguna Admin

| Peran | Siapa | Tanggung jawab |
| --- | --- | --- |
| `petugas` | Operator BPBD/BNPB (simulasi) | Memantau, memverifikasi, mengubah status, menugaskan tim, menangani SOS |
| `koordinator` (usulan, lihat keputusan terbuka K-1) | Supervisor | Semua hak petugas + kelola pengguna dan peran, buka kembali laporan ditolak, ekspor data, lihat audit log |

Akun admin **dibuat manual**, tidak lewat pendaftaran publik. Relawan dan warga **tidak** mengakses `/admin`.

## 4. Ruang Lingkup

**Dalam cakupan (versi lomba):**

- Dashboard ringkasan dengan angka dan daftar mendesak
- Daftar laporan dengan prioritas otomatis, filter, pencarian
- Detail laporan dan tindak lanjut (ubah status dengan catatan)
- Monitor SOS real-time dengan alarm
- Peta operasional
- Penugasan tim ke laporan/SOS
- Verifikasi laporan oleh petugas dan melihat verifikasi relawan
- Statistik dan ekspor CSV
- Manajemen pengguna dan peran
- Audit log
- Notifikasi otomatis ke pelapor saat status berubah

**Di luar cakupan (pengembangan lanjutan):**

- Integrasi dua arah dengan sistem BNPB/BPBD nyata
- Aplikasi mobile native untuk petugas
- Dispatch otomatis berbasis rute/kendaraan
- Analitik prediktif berbasis AI
- Chat langsung petugas dengan pelapor
- Fitur donasi (terkunci, lihat `agent.md` bagian 1.5)

## 5. User Stories

| ID | Sebagai | Saya ingin | Agar |
| --- | --- | --- | --- |
| AD-01 | Petugas | melihat ringkasan laporan baru, SOS aktif, dan laporan per status | tahu kondisi terkini sekilas |
| AD-02 | Petugas | melihat daftar laporan terurut prioritas dan dapat memfilter | menangani yang paling mendesak dahulu |
| AD-03 | Petugas | membuka detail laporan lengkap dengan foto, peta, konfirmasi, dan riwayat | menilai kebenaran laporan |
| AD-04 | Petugas | mengubah status dengan catatan | proses transparan bagi pelapor |
| AD-05 | Petugas | menolak laporan dengan alasan | laporan palsu atau duplikat tidak mencemari data |
| AD-06 | Petugas | menggabungkan laporan duplikat | satu kejadian ditangani satu kali |
| AD-07 | Petugas | menugaskan tim ke laporan | ada penanggung jawab yang jelas |
| AD-08 | Petugas | melihat SOS masuk secara real-time dengan alarm | korban tertangani cepat |
| AD-09 | Petugas | menandai SOS sebagai ditanggapi, ditangani, selesai, atau alarm palsu | rekan tahu SOS sudah diurus |
| AD-10 | Petugas | melihat semua kejadian di peta operasional | memahami sebaran dan klaster |
| AD-11 | Petugas | melihat verifikasi relawan di lokasi | lebih yakin laporan benar |
| AD-12 | Koordinator | melihat statistik tren, sebaran, dan waktu respons | mengambil keputusan berbasis data |
| AD-13 | Koordinator | mengekspor data laporan (CSV) tanpa data pribadi | dipakai analisis dan data terbuka |
| AD-14 | Koordinator | mengelola akun petugas dan peran | akses terkendali |
| AD-15 | Koordinator | membaca audit log | akuntabilitas internal terjaga |
| AD-16 | Petugas | tidak menimpa pekerjaan rekan saat mengedit laporan yang sama | data tidak rusak |

## 6. Kebutuhan Fungsional

Prioritas: **P0** = wajib ada di demo, **P1** = penting, **P2** = nilai tambah.

### 6.1 Dashboard Ringkasan (`/admin`)

| ID | Kebutuhan | Prioritas |
| --- | --- | --- |
| FR-AD-01 | Kartu angka: laporan baru (belum diverifikasi), SOS aktif, laporan per status, rata-rata waktu respons hari ini | P0 |
| FR-AD-02 | Daftar "Perlu perhatian": SOS belum ditanggapi dan laporan berprioritas Kritis/Tinggi, maksimal 10 | P0 |
| FR-AD-03 | Pembaruan real-time (laporan/SOS baru muncul tanpa muat ulang) dengan indikator status koneksi | P0 |
| FR-AD-04 | Grafik singkat laporan 7 hari terakhir per jenis | P1 |

### 6.2 Daftar Laporan (`/admin/laporan`)

| ID | Kebutuhan | Prioritas |
| --- | --- | --- |
| FR-AD-05 | Tabel: prioritas, kode, jenis, lokasi (kab/kota), status, konfirmasi, waktu, penanggung jawab | P0 |
| FR-AD-06 | Urutan bawaan: skor prioritas menurun, lalu waktu terbaru | P0 |
| FR-AD-07 | Filter: status, jenis, prioritas, wilayah, rentang tanggal, penanggung jawab; pencarian kode | P0 |
| FR-AD-08 | Paginasi sisi server (25 baris per halaman) | P0 |
| FR-AD-09 | Aksi massal terbatas: tolak sebagai duplikat/hoaks (wajib alasan) | P2 |

### 6.3 Detail dan Tindak Lanjut (`/admin/laporan/[id]`)

| ID | Kebutuhan | Prioritas |
| --- | --- | --- |
| FR-AD-10 | Tampilkan deskripsi, galeri foto/video, peta mini, jumlah konfirmasi, verifikasi relawan, riwayat status | P0 |
| FR-AD-11 | Ubah status hanya lewat transisi yang valid (lihat 7.1), catatan wajib untuk Ditolak dan Selesai | P0 |
| FR-AD-12 | Catatan tindak lanjut tampil di timeline yang dilihat pelapor | P0 |
| FR-AD-13 | Penugasan tim dan penanggung jawab | P1 |
| FR-AD-14 | Info pelapor tersamarkan secara bawaan; tombol "Tampilkan kontak" mencatat ke audit log | P1 |
| FR-AD-15 | Penanda laporan serupa di sekitar (radius dan waktu) dan opsi gabung sebagai duplikat | P1 |
| FR-AD-16 | Kontrol konkurensi: peringatan jika data berubah oleh petugas lain sebelum simpan | P1 |
| FR-AD-17 | Buka kembali laporan Ditolak (khusus koordinator) dengan alasan | P2 |

### 6.4 Monitor SOS (`/admin/sos`)

| ID | Kebutuhan | Prioritas |
| --- | --- | --- |
| FR-AD-18 | Daftar SOS real-time dengan lokasi, waktu, tipe bantuan (label), pesan, usia SOS | P0 |
| FR-AD-19 | Alarm suara dan visual untuk SOS baru; kontrol bisukan dan aktifkan alarm | P0 |
| FR-AD-20 | Alur status SOS: Baru, Ditanggapi, Ditangani, Selesai, Alarm palsu | P0 |
| FR-AD-21 | Eskalasi visual bila SOS Baru belum ditanggapi lebih dari 2 menit | P1 |
| FR-AD-22 | Peta SOS dengan penanda denyut dan tombol arah | P1 |
| FR-AD-23 | Penugasan tim ke SOS | P1 |

### 6.5 Peta Operasional (`/admin/peta`)

| ID | Kebutuhan | Prioritas |
| --- | --- | --- |
| FR-AD-24 | Peta semua laporan dan SOS aktif; pin berwarna status dengan ikon jenis bencana | P0 |
| FR-AD-25 | Filter jenis, status, prioritas, rentang waktu; klaster penanda | P1 |
| FR-AD-26 | Lapisan bantu: fasilitas kesehatan terdekat dari titik terpilih | P2 |

### 6.6 Statistik dan Ekspor (`/admin/statistik`)

| ID | Kebutuhan | Prioritas |
| --- | --- | --- |
| FR-AD-27 | Tren laporan per periode dan per jenis | P1 |
| FR-AD-28 | Sebaran per kabupaten/kota | P1 |
| FR-AD-29 | Waktu respons: rata-rata dan median dari Diterima ke Diverifikasi, dan ke Selesai | P1 |
| FR-AD-30 | Rasio Diverifikasi vs Ditolak | P1 |
| FR-AD-31 | Ekspor CSV hasil filter, tanpa data pribadi, batas 10.000 baris, tercatat di audit log | P2 |
| FR-AD-32 | Dataset publik teranonimkan (untuk `/statistik` publik dan subtema Open Government Data) | P2 |

### 6.7 Manajemen Pengguna dan Audit (`/admin/pengguna`, `/admin/audit`)

| ID | Kebutuhan | Prioritas |
| --- | --- | --- |
| FR-AD-33 | Daftar pengguna dengan pencarian dan filter peran | P1 |
| FR-AD-34 | Ubah peran dan nonaktifkan akun (koordinator saja); tidak dapat mengubah diri sendiri; selalu tersisa minimal satu koordinator | P1 |
| FR-AD-35 | Buat akun petugas oleh koordinator (undangan/manual) | P1 |
| FR-AD-36 | Audit log: siapa, kapan, apa, objek; hanya baca, tidak dapat diubah atau dihapus | P1 |
| FR-AD-37 | Autentikasi dua langkah (MFA) untuk akun admin | P2 |
| FR-AD-38 | Batas waktu sesi tidak aktif (30 menit) | P2 |

### 6.8 Notifikasi ke Pelapor

| ID | Kebutuhan | Prioritas |
| --- | --- | --- |
| FR-AD-39 | Setiap perubahan status dan catatan petugas otomatis membuat notifikasi untuk pelapor | P0 |
| FR-AD-40 | Notifikasi push (Web Push) | P2 |

## 7. Aturan Bisnis

### 7.1 Transisi Status Laporan

| Dari | Ke yang diizinkan | Catatan wajib |
| --- | --- | --- |
| Diterima | Diverifikasi, Ditolak | Ditolak: ya |
| Diverifikasi | Ditindaklanjuti, Ditolak | Ditolak: ya |
| Ditindaklanjuti | Selesai | Selesai: ya (bukti tindak lanjut disarankan) |
| Selesai | (final) | |
| Ditolak | Diterima (buka kembali, koordinator, P2) | ya |

Status tidak boleh lompat atau mundur di luar tabel ini. Validasi dilakukan **di database**, bukan hanya di UI.

### 7.2 Skor Prioritas Otomatis

Dihitung di database (fungsi server), bukan di client. Nilai awal dapat dikalibrasi.

| Komponen | Poin |
| --- | --- |
| Jenis bencana | tsunami 40, gempa 35, karhutla 30, kebakaran 30, banjir 25, longsor 25, lainnya 10 |
| Konfirmasi warga | 3 poin per konfirmasi, maksimal 30 |
| Verifikasi relawan | 15 poin |
| Klaster (3 laporan atau lebih dalam radius 1 km dan 30 menit) | 15 poin |
| Usia belum ditangani | 1 poin per 15 menit status Diterima, maksimal 10 |

Label: **Kritis** (70 ke atas), **Tinggi** (50 sampai 69), **Sedang** (30 sampai 49), **Rendah** (di bawah 30). Skor dihitung ulang saat konfirmasi, verifikasi, atau status berubah.

### 7.3 Alur Status SOS

Baru, lalu Ditanggapi (petugas menerima), lalu Ditangani, lalu Selesai. Dari Baru atau Ditanggapi, dapat ditandai Alarm palsu dengan alasan. SOS Baru yang lewat 2 menit tanpa tanggapan mendapat eskalasi visual.

### 7.4 Duplikat

Laporan duplikat digabung ke laporan induk. Laporan yang digabung tidak dihapus: statusnya Ditolak dengan alasan "duplikat" dan tertaut ke induk; konfirmasinya ditambahkan ke induk.

### 7.5 Penghapusan

Laporan dan SOS **tidak pernah dihapus permanen** lewat dashboard. Hanya perubahan status dengan alasan.

## 8. Peran dan Hak Akses (Admin)

| Aksi | Petugas | Koordinator |
| --- | --- | --- |
| Lihat dashboard, laporan, SOS, peta | Ya | Ya |
| Ubah status, catatan, penugasan | Ya | Ya |
| Lihat kontak pelapor (tercatat) | Ya | Ya |
| Gabung duplikat | Ya | Ya |
| Buka kembali laporan Ditolak | Tidak | Ya |
| Statistik | Ya | Ya |
| Ekspor CSV | Tidak | Ya |
| Kelola pengguna dan peran | Tidak | Ya |
| Baca audit log | Tidak | Ya |

Jika developer memutuskan hanya satu peran admin (K-1), seluruh kolom Koordinator menjadi hak `petugas`.

## 9. Tambahan Basis Data

Perubahan **hanya lewat file migrasi** di `supabase/migrations/`. Melengkapi enam tabel di `prd.md`.

| Objek | Jenis | Fungsi |
| --- | --- | --- |
| `reports` (kolom baru) | kolom | `tracking_code`, `priority_score`, `priority_label`, `province`, `regency`, `verified_at`, `resolved_at`, `duplicate_of`, `version` |
| `sos_alerts` (kolom baru) | kolom | `help_type`, `status`, `acknowledged_by`, `acknowledged_at`, `resolved_at`, `closing_note` (menggantikan `handled boolean`) |
| `notifications` | tabel | notifikasi per pengguna: `user_id`, `report_id`, `title`, `body`, `read_at` |
| `response_teams` | tabel | daftar tim (nama, instansi, wilayah, kontak) |
| `report_assignments` | tabel | penugasan laporan atau SOS ke tim, dengan penanggung jawab |
| `volunteer_verifications` | tabel | verifikasi lapangan oleh relawan (`report_id`, `volunteer_id`, `note`, `photo`) |
| `report_ratings` | tabel | penilaian pelapor setelah Selesai (opsional) |
| `audit_logs` | tabel | `actor_id`, `action`, `entity`, `entity_id`, `meta`, `created_at`; hanya insert |
| `public_reports` | view | data laporan untuk publik **tanpa** `reporter_id` dan data pribadi |
| `change_report_status(...)` | fungsi | satu-satunya jalur ubah status: cek peran, transisi, catatan, tulis `report_status_logs`, `notifications`, `audit_logs` |
| `change_sos_status(...)` | fungsi | jalur ubah status SOS dengan pola yang sama |
| `compute_priority(...)` | fungsi | hitung skor dan label prioritas |

**Ketentuan RLS dan keamanan:**

- Peran dibaca dari tabel `profiles`, **bukan** dari `user_metadata` (dapat diubah pengguna).
- Publik membaca laporan **hanya lewat view `public_reports`**; akses langsung anon ke tabel `reports` dicabut. View publik hanya memuat laporan berstatus Diverifikasi ke atas, dan laporan belum diverifikasi tampil dengan label eksplisit bila developer memutuskannya (K-2).
- `audit_logs` hanya dapat diisi lewat fungsi server dan tidak dapat diubah atau dihapus.
- Fungsi `SECURITY DEFINER` wajib memakai `set search_path = ''` dan memeriksa peran di dalamnya.
- Unique constraint pada konfirmasi dan verifikasi relawan (satu akun satu kali per laporan).

## 10. Kebutuhan Non-Fungsional

| Aspek | Kebutuhan |
| --- | --- |
| Keamanan | Otorisasi di server pada setiap halaman dan aksi admin (bukan sekadar menyembunyikan menu), RLS aktif, `service_role` tidak ada di client |
| Privasi | Nama dan kontak pelapor tersamarkan di daftar; pembukaan kontak tercatat; ekspor tanpa data pribadi |
| Performa | Muat awal `/admin` kurang dari 3 detik di 4G; paginasi sisi server; tidak memakai `select *` pada tabel besar |
| Real-time | Laporan/SOS baru tampil kurang dari 3 detik; indikator koneksi; sambung ulang otomatis |
| Keandalan | Perubahan status atomik (satu transaksi); kontrol konkurensi lewat kolom `version` |
| Aksesibilitas | Mengikuti `design.md` dan `design-admin.md` (kontras 4,5:1, keyboard, `aria-live` untuk SOS baru) |
| Responsif | Desktop dahulu; tablet dapat dipakai penuh; ponsel minimal untuk Monitor SOS dan detail laporan |
| Auditabilitas | Setiap mutasi menghasilkan satu baris audit |

## 11. Indikator Keberhasilan (KPI)

- Median waktu Diterima ke Diverifikasi
- Median waktu SOS Baru ke Ditanggapi
- Persentase SOS yang ditanggapi dalam 2 menit
- Persentase laporan berstatus Selesai
- Rasio Diverifikasi terhadap Ditolak
- Jumlah laporan Kritis yang belum ditangani

## 12. Risiko dan Mitigasi

| Risiko | Mitigasi |
| --- | --- |
| Akun petugas diambil alih | Akun dibuat manual, MFA (P2), batas sesi, audit log |
| Petugas menimpa pekerjaan rekan | Kolom `version` dan peringatan konflik |
| Perubahan status tidak sah lewat API | Hanya fungsi database yang boleh mengubah status; UPDATE langsung ke tabel dicabut |
| Kebocoran data pelapor | View publik tanpa data pribadi, penyamaran, audit pembukaan kontak |
| Alarm tidak terdengar (browser memblokir audio otomatis) | Tombol "Aktifkan alarm" di awal sesi, indikator visual kuat sebagai cadangan |
| Koneksi real-time putus tanpa disadari | Banner koneksi terputus, polling cadangan tiap 30 detik |
| Data demo tampak tidak realistis | `seed.sql` dengan data dummy bervariasi (tanpa data pribadi nyata) |
| Dianggap sistem resmi | Label "Simulasi" yang terlihat di header admin |

## 13. Rencana Pengembangan Admin

| Tahap | Cakupan |
| --- | --- |
| A1 (wajib untuk demo) | Auth dan proteksi `/admin`, tabel laporan, detail, ubah status via fungsi database, timeline, notifikasi pelapor, dashboard ringkasan |
| A2 | Monitor SOS real-time dengan alarm, peta operasional, skor prioritas, penugasan tim |
| A3 | Statistik, ekspor CSV, manajemen pengguna, audit log, duplikat |
| A4 | MFA, batas sesi, Web Push, dataset publik, aksi massal |

## 14. Alur Demo Admin (Happy Path)

1. Petugas masuk dan melihat dashboard dengan angka dan daftar "Perlu perhatian".
2. Warga mengirim laporan banjir dari perangkat lain; laporan muncul di daftar tanpa muat ulang.
3. Petugas membuka detail, memeriksa foto, peta, dan konfirmasi, lalu mengubah status ke Diverifikasi dengan catatan.
4. Petugas menugaskan tim dan mengubah status ke Ditindaklanjuti.
5. Di perangkat warga, timeline dan notifikasi berubah langsung.
6. Warga menekan SOS; alarm berbunyi di Monitor SOS, petugas menandai Ditanggapi.
7. Petugas membuka statistik untuk menunjukkan waktu respons dan sebaran.

## 15. Keputusan Terbuka (Perlu Persetujuan Developer)

| ID | Pertanyaan | Usulan bawaan |
| --- | --- | --- |
| K-1 | Satu peran admin atau dua tingkat (`petugas` dan `koordinator`)? Menambah nilai pada enum peran | Mulai satu peran (`petugas`), tambah `koordinator` di A3 |
| K-2 | Apakah peta publik menampilkan laporan belum diverifikasi? | Tidak ditampilkan; hanya Diverifikasi ke atas |
| K-3 | Notifikasi: hanya in-app (Realtime) atau juga Web Push? | In-app dahulu; Web Push di A4 |
| K-4 | Bobot skor prioritas pada 7.2 sudah sesuai? | Pakai nilai awal, kalibrasi setelah uji dengan data seed |
| K-5 | Apakah tim penugasan diisi manual (seed) atau dikelola lewat UI? | Seed untuk demo, UI pengelolaan di A3 |

# DESIGN Admin: Panduan Desain Dashboard Petugas

Melengkapi `design.md`. Semua aturan di `design.md` (prinsip, tipografi, spasi, ikon, komponen, aksesibilitas, tanpa emoji) **tetap berlaku**. Dokumen ini hanya menambah dan mengoreksi hal yang khusus area `/admin/*`. Fitur dan alur ada di `prd-admin.md`.

Jika ada pertentangan dengan `design.md`, **dokumen ini menang untuk area admin**. Koreksi pada bagian 2 sebaiknya juga diterapkan ke `design.md` (minta persetujuan developer).

---

## 1. Prinsip Khusus Admin

1. **Padat tetapi terbaca.** Petugas bekerja berjam-jam; tampilkan banyak informasi tanpa terasa sesak.
2. **Yang mendesak selalu paling menonjol.** SOS dan prioritas Kritis harus terlihat dalam hitungan detik.
3. **Tindakan berdampak butuh kepastian.** Tolak, selesai, dan ubah peran memakai konfirmasi dan catatan.
4. **Desktop dahulu.** Optimal di 1280 px; tetap dapat dipakai di tablet (768 px). Ponsel hanya untuk Monitor SOS dan detail laporan.
5. **Real-time terasa hidup tetapi tenang.** Item baru muncul dengan sorotan singkat, bukan animasi besar.
6. **Label "Simulasi" selalu terlihat** agar tidak dikira sistem resmi.

## 2. Koreksi Warna (Kontras)

Rasio kontras `#EF6806` dengan putih adalah **3,16:1**, di bawah 4,5:1 untuk teks normal. Di admin, teks dan tombol berisi teks **tidak** memakai `primary` mentah.

| Token baru | Hex | Kontras | Penggunaan |
| --- | --- | --- | --- |
| `primary-action` | `#BF5305` | 4,71:1 dengan putih | Latar tombol primary berteks putih |
| `primary-action-hover` | `#A74904` | 5,84:1 dengan putih | Hover/pressed tombol primary |
| `primary-text` | `#A74904` | 5,23:1 di atas `primary-soft`, 5,84:1 di atas putih | Teks/tautan oranye dan item aktif |
| `primary` (lama) | `#EF6806` | 3,16:1 | **Hanya** elemen non-teks: ikon, garis, indikator, fokus ring, pin (batas 3:1 untuk komponen UI) |

Aturan tambahan:

- Teks putih di atas `success` (#16A34A) hanya 3,30:1. Badge dan tombol sukses memakai latar `success-soft` dengan teks `success-text`.
- `disabled` (#9CA3AF) pada putih hanya 2,54:1. Itu wajar untuk elemen nonaktif, tetapi jangan dipakai untuk teks yang harus dibaca.
- Tambahkan token ke `tailwind.config.ts` dengan persetujuan developer:

```ts
primary: { DEFAULT: "#EF6806", action: "#BF5305", "action-hover": "#A74904", text: "#A74904", hover: "#C75405", soft: "#FEF0E6" },
```

## 3. Warna Prioritas

Prioritas berbeda dari status. Selalu tampil sebagai badge dengan **ikon dan teks**.

| Prioritas | Gaya | Ikon (lucide) |
| --- | --- | --- |
| Kritis | Latar `danger` solid, teks putih (4,83:1) | `siren` |
| Tinggi | Latar `warning-soft`, teks `warning-text`, border `warning` | `arrow-up` |
| Sedang | Latar `info-soft`, teks `info-text` | `minus` |
| Rendah | Latar `bg`, teks `ink-soft`, border `border` | `arrow-down` |

Status laporan tetap mengikuti `design.md` bagian 2.4. Bedakan Diterima dan Diverifikasi dengan **ikon dan label** (`inbox` vs `badge-check`), bukan hanya ketebalan warna.

## 4. Tata Letak Admin

| Area | Spesifikasi |
| --- | --- |
| Sidebar | Lebar 240 px, dapat diciutkan ke 72 px (hanya ikon dengan tooltip). Latar `ink`, teks putih, item aktif dengan penanda kiri 3 px `primary` dan latar `rgba(255,255,255,0.08)` |
| Topbar | Tinggi 56 px, latar `surface`, border bawah `border`. Isi: tombol ciutkan sidebar, pencarian kode laporan, indikator koneksi, penghitung SOS aktif, lencana "Simulasi", menu profil |
| Konten | Latar `bg`, padding 24 px (lg) / 16 px (md), lebar maksimum 1440 px |
| Di bawah 1024 px | Sidebar menjadi laci (drawer) dari kiri; tabel menjadi daftar kartu |
| Di bawah 768 px | Hanya Monitor SOS dan Detail Laporan yang dioptimalkan; halaman lain menampilkan versi sederhana |

Menu sidebar, urutan tetap:

1. Ringkasan (`layout-dashboard`) `/admin`
2. Laporan (`file-text`) `/admin/laporan`
3. Monitor SOS (`siren`) `/admin/sos`, dengan badge angka SOS aktif
4. Peta Operasional (`map`) `/admin/peta`
5. Statistik (`bar-chart-3`) `/admin/statistik`
6. Pengguna (`users`) `/admin/pengguna` (hanya koordinator)
7. Audit Log (`scroll-text`) `/admin/audit` (hanya koordinator)

Item yang tidak berhak diakses **tidak ditampilkan**, tetapi akses tetap diblokir di server.

## 5. Halaman

### 5.1 Ringkasan (`/admin`)

```
+----------------------------------------------------------+
| [Baru: 12] [SOS aktif: 2] [Ditindaklanjuti: 8] [Resp: 6m]|  kartu statistik
+--------------------------------+-------------------------+
| Perlu perhatian                | Laporan 7 hari          |
|  - SOS belum ditanggapi (merah)|  grafik batang per jenis|
|  - Laporan Kritis/Tinggi       |                         |
+--------------------------------+-------------------------+
| Aktivitas terbaru (timeline petugas)                     |
+----------------------------------------------------------+
```

- Kartu statistik: angka H1 (tabular), label caption, indikator perubahan dibanding kemarin (ikon + teks).
- "Perlu perhatian": SOS selalu di atas laporan. Setiap baris dapat diklik penuh.

### 5.2 Daftar Laporan (`/admin/laporan`)

- Bilah filter di atas tabel: chip status, jenis, prioritas, wilayah, rentang tanggal, dan pencarian kode. Filter aktif tampil sebagai chip yang dapat dihapus, dengan tombol "Atur ulang".
- Kolom berurutan: **Prioritas, Kode, Jenis (ikon + label), Lokasi, Status, Konfirmasi, Waktu relatif, Penanggung jawab**. Baris 56 px.
- Urutan bawaan: prioritas menurun lalu waktu terbaru. Kolom dapat diurutkan, dengan ikon panah di header.
- Baris laporan baru yang masuk real-time diberi sorotan latar `info-soft` selama 3 detik, lalu normal.
- Paginasi di bawah: "Menampilkan 1-25 dari 143", tombol Sebelumnya/Berikutnya.
- Di tablet ke bawah: tiap baris menjadi kartu laporan dengan badge prioritas dan status di atas.

### 5.3 Detail Laporan (`/admin/laporan/[id]`)

```
+------------------------------------------------------------+
| < Kembali   LPR-8F3K2Q   [Kritis] [Diverifikasi]   [aksi]  |
+--------------------------------+---------------------------+
| Galeri foto/video              | Panel Tindakan            |
| Deskripsi                      |  Ubah status (+catatan)   |
| Peta mini + koordinat          |  Tugaskan tim            |
| Info pelapor (tersamarkan)     | Timeline status           |
| Konfirmasi warga: 7            | Verifikasi relawan        |
| Laporan serupa di sekitar      |                           |
+--------------------------------+---------------------------+
```

- Kolom kiri 2/3, kolom kanan 1/3 (di bawah 1024 px menumpuk, panel tindakan di atas).
- Panel tindakan memakai satu tombol primary yang sesuai langkah berikutnya (contoh: "Verifikasi laporan"), tombol "Tolak laporan" bergaya `danger` outline.
- **Info pelapor:** nama dan kontak berbintang secara bawaan (contoh: `Budi S***`, `08** **** 1234`). Tombol "Tampilkan kontak" meminta konfirmasi ringan dan menampilkan toast "Pembukaan kontak dicatat".
- Timeline mengikuti `design.md` 7.6, ditambah nama petugas dan catatan pada setiap langkah.
- Banner konflik bila data berubah oleh orang lain: banner `warning` dengan tombol "Muat ulang data".

### 5.4 Monitor SOS (`/admin/sos`)

```
+---------------------------------------------+------------+
| Daftar SOS (kiri, 40%)                      | Peta (60%) |
|  [BARU 01:12] Medis  Kec. X   [Tanggapi]    |  pin denyut|
|  [DITANGANI] Damkar  Kec. Y                 |            |
+---------------------------------------------+------------+
```

- Kartu SOS: usia (stopwatch yang berjalan), tipe bantuan sebagai label berikon (`flame`, `heart-pulse`, `shield`, `life-buoy`), pesan, lokasi, tombol aksi sesuai status.
- Status Baru: border kiri 4 px `danger`, latar `danger-soft`. Setelah 2 menit tanpa tanggapan: eskalasi dengan ikon `alert-octagon` dan teks "Belum ditanggapi", bukan hanya warna.
- Urutan: Baru yang paling lama di atas, lalu Ditanggapi, Ditangani, lalu Selesai.
- **Alarm:** saat sesi dimulai tampil tombol "Aktifkan alarm" (browser memblokir audio otomatis). Ada kontrol bisukan di topbar, dan alarm tidak diulang tanpa henti (bunyi 3 kali per SOS baru). Setiap alarm juga muncul sebagai toast persisten dan diumumkan lewat `aria-live="assertive"`.
- Denyut pada pin SOS dinonaktifkan oleh `prefers-reduced-motion`; status tetap terbaca lewat label dan ikon.

### 5.5 Peta Operasional (`/admin/peta`)

- Peta penuh dengan panel filter di sisi kiri (lg ke atas) atau bottom sheet (di bawah lg).
- **Pin:** bentuk pin dengan **ikon jenis bencana di dalamnya**, warna sesuai status (`design.md` 2.4). Dengan begitu pin tidak hanya dibedakan lewat warna.
- SOS aktif: pin `danger` dengan ikon `siren` dan denyut halus.
- Kontrol zoom dan "lokasi saya" di **kiri atas**, agar tidak bertabrakan dengan tombol SOS atau panel aksi di kanan bawah.
- Klaster: lingkaran `ink` berangka putih. Popup menampilkan jenis, status, prioritas, waktu, dan tautan "Buka detail".
- Atribusi OpenStreetMap selalu terlihat.

### 5.6 Statistik (`/admin/statistik`)

- Pemilih periode (7 hari, 30 hari, kustom) dan wilayah di atas.
- Grafik garis untuk tren, batang untuk per jenis, batang horizontal untuk sebaran kab/kota, kartu untuk median waktu respons dan rasio verifikasi/penolakan.
- Setiap grafik punya judul, satuan, tabel ringkas yang dapat dibuka (alternatif teks), dan tombol "Unduh CSV" (koordinator).

### 5.7 Pengguna dan Audit

- Tabel pengguna: nama, email tersamarkan sebagian, peran (badge), status akun, terakhir aktif.
- Ubah peran lewat dialog: menampilkan peran lama dan baru, alasan wajib, tombol "Simpan perubahan". Baris milik sendiri menonaktifkan aksi ubah peran dengan tooltip penjelasan.
- Audit log: tabel hanya baca dengan kolom Waktu, Petugas, Aksi, Objek, Ringkasan; filter aksi, petugas, tanggal. Tidak ada tombol hapus atau ubah.

## 6. Komponen Khusus Admin

| Komponen | Spesifikasi |
| --- | --- |
| Badge prioritas | Lihat bagian 3. Tinggi 24 px, radius penuh |
| Kartu statistik | Latar `surface`, border `border`, angka H1, label caption, perubahan dengan ikon `trending-up`/`trending-down` dan teks |
| Indikator koneksi | Di topbar: titik `success` + "Terhubung" / titik `warning` + "Menyambung ulang" / titik `danger` + "Terputus". Saat terputus tampil banner `warning` di atas konten dengan tombol "Muat ulang data" |
| Lencana Simulasi | Pil kecil di topbar: ikon `flask-conical` + "Simulasi", latar `warning-soft`, teks `warning-text` |
| Dialog konfirmasi | Modal tengah (maks 480 px). Judul menyebut aksi, isi menyebut objek (kode laporan), kolom catatan bila wajib. Tombol aksi bergaya sesuai dampak (`danger` untuk tolak). Fokus awal pada kolom catatan atau tombol Batal |
| Kolom catatan | Teks area minimal 3 baris, penghitung karakter, pesan error bila wajib dan kosong: "Catatan wajib diisi agar pelapor mengetahui alasannya." |
| Pemilih tim | Combobox dengan pencarian, menampilkan nama tim dan wilayah |
| Banner konflik | `warning`, border kiri 4 px, tombol "Muat ulang data" |
| Chip filter | Radius penuh, tinggi 32 px (area sentuh tetap 44 px lewat padding), tombol hapus berlabel |

## 7. Pola Interaksi

- **Konfirmasi:** semua aksi yang mengubah status, peran, atau membuka kontak pelapor melewati konfirmasi. Aksi ringan (menyaring, mengurutkan) tidak.
- **Umpan balik:** toast setelah berhasil ("Status diubah menjadi Diverifikasi") dan banner galat bila gagal, dengan tombol "Coba lagi". Toast galat tidak hilang otomatis.
- **Real-time:** item baru disorot 3 detik. Jangan menggeser baris yang sedang dibaca; tampilkan pil "3 laporan baru, tampilkan" di atas tabel bila pengguna sedang menggulir.
- **Keadaan memuat:** skeleton tabel dan kartu. Tombol aksi menampilkan spinner dan dinonaktifkan sampai selesai agar tidak terkirim dua kali.
- **Kosong:** "Belum ada laporan yang sesuai filter" dengan tombol "Atur ulang filter".
- **Pintasan keyboard (P2):** `/` fokus pencarian, `g` lalu `l` ke Laporan, `g` lalu `s` ke SOS. Tampilkan daftar pintasan di menu bantuan.

## 8. Gaya Penulisan Admin

- Bahasa Indonesia lugas dan netral, tanpa emoji dan tanda seru.
- Tombol berupa kata kerja: "Verifikasi laporan", "Tolak laporan", "Tugaskan tim", "Tanggapi SOS", "Tandai selesai".
- Pesan galat menjelaskan masalah dan langkah: "Status tidak dapat diubah karena laporan sudah diperbarui petugas lain. Muat ulang data lalu coba lagi."
- Format waktu `27 Okt 2026, 14.05 WIB`; waktu relatif di daftar ("5 menit lalu"); durasi SOS `02:15`.

## 9. Aksesibilitas Admin

- Seluruh tabel memakai elemen tabel semantik dengan `<th scope>`, keterangan, dan urutan fokus yang logis.
- Perubahan real-time diumumkan lewat wilayah `aria-live`: `polite` untuk laporan baru, `assertive` hanya untuk SOS baru.
- Dialog menjebak fokus, dapat ditutup dengan `Esc`, dan mengembalikan fokus ke pemicu.
- Sidebar yang diciutkan tetap memiliki `aria-label` dan tooltip pada setiap ikon.
- Pin peta dapat dijangkau keyboard, atau tersedia daftar teks sebagai alternatif.
- Seluruh pasangan warna teks memenuhi 4,5:1 sesuai bagian 2.

## 10. Token dan Kelas (Ringkas)

Gunakan token `design.md` bagian 12 beserta tambahan bagian 2. Contoh pemakaian:

| Kebutuhan | Kelas Tailwind |
| --- | --- |
| Tombol primary admin | `bg-primary-action hover:bg-primary-action-hover text-white font-semibold rounded-md h-12 px-5` |
| Teks tautan oranye | `text-primary-text` |
| Kartu | `bg-surface border border-line rounded-md shadow-card p-4 lg:p-5` |
| Sidebar | `bg-ink text-white w-60` (ciut: `w-[72px]`) |
| Badge Kritis | `bg-danger text-white rounded-full h-6 px-2 text-xs font-semibold` |

## 11. Boleh dan Tidak Boleh (Admin)

| Boleh | Tidak boleh |
| --- | --- |
| `primary-action` untuk tombol berteks putih | Teks putih di atas `#EF6806` |
| Prioritas dengan ikon dan teks | Prioritas hanya dibedakan warna |
| Konfirmasi dan catatan untuk aksi berdampak | Mengubah status dengan satu klik tanpa catatan pada Tolak/Selesai |
| Info pelapor tersamarkan secara bawaan | Menampilkan kontak pelapor di daftar atau di peta |
| Alarm dengan kontrol bisukan | Audio berulang tanpa henti atau otomatis tanpa interaksi pengguna |
| Pin dengan ikon jenis bencana | Pin yang hanya dibedakan warna |
| Kontrol peta di kiri atas | Menaruh kontrol peta di area tombol SOS |
| Label "Simulasi" yang selalu terlihat | Tampilan yang menyiratkan terhubung ke sistem BNPB asli |

## 12. Daftar Periksa Sebelum Menyerahkan UI Admin

- [ ] Hanya memakai token `design.md` dan `design-admin.md`; tidak ada hex baru
- [ ] Tombol berteks putih memakai `primary-action`, bukan `primary`
- [ ] Tampil benar di 1280 px dan 768 px; Monitor SOS dan detail laporan tampil di 360 px
- [ ] Prioritas dan status memakai warna, ikon, dan teks sekaligus
- [ ] Ada state memuat, kosong, galat, terputus, dan konflik data
- [ ] Aksi berdampak memiliki dialog konfirmasi; catatan wajib divalidasi
- [ ] Kontak pelapor tersamarkan secara bawaan
- [ ] Pengumuman `aria-live` untuk SOS baru dan fokus keyboard terlihat
- [ ] Alarm dapat diaktifkan, dibisukan, dan tidak berulang tanpa batas
- [ ] Lencana "Simulasi" terlihat di topbar
- [ ] Tidak ada emoji

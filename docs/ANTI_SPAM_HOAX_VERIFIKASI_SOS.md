# Dokumen Strategi & SOP: Penanganan Data Palsu, Hoaks, dan Spam Tombol SOS
**Platform:** SigapBumi (Sistem Informasi Geospasial & Tanggap Bencana Terpadu)  
**Dokumen:** Spesifikasi Desain & Teknis Anti-Spam / Anti-Hoaks  
**Tanggal:** November 2026  
**Status:** Draf Rekomendasi Arsitektur & SOP  

---

## 1. Latar Belakang & Urgensi Masalah

Dalam sistem tanggap darurat kebencanaan (*Emergency Response System*), data palsu (*fake report*) dan penekanan tombol SOS secara iseng (*prank*) membawa risiko fatal:
1. **Pemborosan Sumber Daya Kritis:** Armada penyelamat (mobil damkar, ambulans PSC 119, tim SAR) meluncur ke titik palsu, sementara korban di titik lain tidak tertolong.
2. **Alarm Fatigue pada Operator:** Terlalu banyak sirene/notifikasi palsu menurunkan kewaspadaan petugas posko.
3. **Penyumbatan Jalur Komando:** Server dan peta operasional dibanjiri data sampah (*spam overload*).

### Prinsip Emas Desain Darurat (*Emergency UX Golden Rule*)
> *"Jangan pernah mempersulit korban sungguhan yang sedang panik di detik-detik genting, tetapi buat pelaku iseng berpikir dua kali dan mudah disaring oleh sistem secara otomatis."*

---

## 2. Arsitektur Pertahanan 4 Lapis (Multi-Layer Defense)

```
                       +-----------------------------------+
                       |        Pengguna / Warga           |
                       +-----------------------------------+
                                         |
               [LAPIS 1: UI UX]          v
   +---------------------------------------------------------------+
   | • Hold-to-Activate (Tahan 3 Detik)                            |
   | • Grace Period 5 Detik ("Batalkan - Saya Salah Tekan")       |
   | • Peringatan Pidana KUHP & UU ITE                             |
   | • Alur 2 Tahap (Kirim Darurat Dulu, Lengkapi Foto/HP Nanti)   |
   +---------------------------------------------------------------+
                                         |
               [LAPIS 2: BOT & AI]       v
   +---------------------------------------------------------------+
   | • Bot WA/SMS Callback Otomatis (Konfirmasi 1-Ketuk)          |
   | • AI Vision: Periksa Metadata Foto Asli vs Comotan Internet   |
   | • Rate Limiting: 1 Sinyal Aktif per Perangkat/30 Menit        |
   +---------------------------------------------------------------+
                                         |
               [LAPIS 3: ALGORITMA]      v
   +---------------------------------------------------------------+
   | • Mesin Skor Kepercayaan Laporan (Credibility Score 0 - 100)  |
   | • Geofence Clustering (Korelasi Laporan Serupa di Radius 1km) |
   | • Crowd-Vouching (Konfirmasi Saksi Warga Sekitar di Peta)     |
   +---------------------------------------------------------------+
                                         |
               [LAPIS 4: POSKO ADMIN]    v
   +---------------------------------------------------------------+
   | • SOP Two-Step Dispatch (Verifikasi Telepon Cepat 30 Detik)   |
   | • Fitur "Tandai Prank / Palsu" & Blacklist Perangkat          |
   | • Filter Klasifikasi: Terverifikasi vs Butuh Validasi         |
   +---------------------------------------------------------------+
```

---

## 3. Rincian Implementasi per Lapisan

### LAPIS 1: Antarmuka Warga (Mencegah Kepencet & Iseng Spontan)

#### A. Mekanisme Hold-to-Activate (Tekan & Tahan 3 Detik)
* **Masalah:** Tombol sekali klik (*single-tap*) sering terpencet tidak sengaja saat ponsel di kantong atau dimainkan anak kecil.
* **Solusi:** Pengguna wajib menekan dan menahan tombol SOS selama 3 detik.
* **Elemen Visual:**
  * Lingkaran pengisi animasi (*radial progress bar*) bertambah seiring tombol ditahan.
  * Umpan balik getaran (*haptic vibration*) di perangkat seluler setiap detik penahanan.
  * Jika jari dilepas sebelum 3 detik, proses dibatalkan otomatis tanpa mengirim data apapun.

#### B. Jeda Pembatalan 5 Detik (*Grace Period Countdown*)
* Setelah tombol berhasil ditahan 3 detik, layar menampilkan hitung mundur 5 detik dengan tombol mencolok:
  > **[ BATALKAN SINYAL - SAYA SALAH TEKAN ]**
* Sirene posko baru dipicu setelah detik ke-0 berakhir. Ini memotong hingga 80% insiden salah pencet.

#### C. Peringatan Hukum Tegas (*Legal Deterrent*)
* Pada jendela konfirmasi SOS dan halaman lapor, tampilkan teks hukum resmi:
  > *"Panggilan darurat terhubung langsung ke Posko Terpadu BPBD/TNI/Polri. Berdasarkan Pasal 220 KUHP dan UU ITE Pasal 28, pembuatan laporan palsu atau panggilan darurat bohong dapat dilacak dan diancam pidana penjara hingga 1 tahun 4 bulan."*
* Efek psikologis dari peringatan hukum terbukti menurunkan niat jahil secara signifikan.

#### D. Alur 2 Tahap: Progressive Disclosure (Tidak Menghambat Korban Kritis)
* **Mengapa tidak mewajibkan form/video di awal?**  
  Korban yang terjebak reruntuhan gempa, tenggelam, atau sesak nafas tidak memiliki kemampuan mengetik atau merekam video.
* **Pola yang Tepat:**
  1. **Detik ke-0:** Koordinat GPS fisik + Jenis Bantuan darurat (Damkar/Medis/Polisi) langsung terkirim seketika.
  2. **Detik ke-3 s/d 30 (Layar Pelacakan Terbuka):** Muncul form pelengkap ringkas:
     - Kolom Nomor Telepon (otomatis terisi jika pernah login/tersimpan di browser).
     - Tombol 1-Ketuk: *"Ambil Foto Cepat Lapangan (Kamera Langsung)"*.

---

### LAPIS 2: Otomasi Bot & Verifikasi Cerdas

#### A. Bot WhatsApp / SMS Interaktif Kilat (Instant Call-Back Bot)
1. Begitu nomor HP tercatat saat tombol SOS ditekan, bot API (misal via Twilio/Fonnte/Waba) mengirim pesan otomatis dalam 2 detik:
   > *"Halo, Posko SigapBumi mendeteksi panggilan SOS dari perangkat Anda di sekitar [Nama Lokasi]. Apakah Anda benar membutuhkan pertolongan evakuasi?*  
   > *Balas: **1** untuk YA, BENAR.*  
   > *Balas: **2** jika SALAH PENCET/TIDAK SENGAJA."*
2. **Jika membalas 1:** Status di dashboard posko berubah menjadi **"TERKONFIRMASI PELAPOR"** (Lencana Hijau).
3. **Jika membalas 2:** Sinyal SOS dibatalkan otomatis dan log dicatat sebagai *false alarm*.
4. **Jika tidak membalas dalam 30 detik:** Operator posko langsung melakukan panggilan suara manual.
*Pelaku iseng akan panik dan membatalkan laporan saat nomor WhatsApp pribadinya langsung menerima notifikasi resmi penegak hukum/posko.*

#### B. Bot AI Vision & Deteksi Gambar Comotan Internet
Untuk laporan warga di menu `/lapor` yang menyertakan foto bencana:
1. **Pemeriksaan EXIF Kamera:**
   * Memvalidasi apakah file foto diambil langsung dari sensor kamera saat kejadian, atau file hasil *screenshot* / unduhan browser.
2. **Reverse Image Search & Hash Matching:**
   * Bot memeriksa apakah gambar tersebut adalah foto lawas (misal foto banjir Jakarta 2020 atau gempa Palu 2018 yang diambil dari Google/Twitter).
3. **AI Vision Classifier (Gemini / Vision Model):**
   * Memastikan gambar memuat objek bencana (air menggenang, kobaran api, reruntuhan gedung), bukan gambar layar gelap, meme, atau selfie.

#### C. Rate Limiting Ketat (Batas Frekuensi)
* 1 Alamat IP / Nomor HP / Fingerprint Perangkat hanya diizinkan memicu **maksimal 1 panggilan SOS aktif per 30 menit**.
* Tombol SOS akan masuk mode *cooldown* untuk mencegah *spam bot flooding*.

---

### LAPIS 3: Algoritma Skor Kepercayaan (*Credibility Score Engine*)

Setiap sinyal SOS dan laporan bencana dinilai dengan skor otomatis **0 s/d 100 Poin**:

| Indikator Validitas | Bobot Poin | Keterangan |
| :--- | :---: | :--- |
| **GPS Terkunci Nyata** | **+25** | Akurasi GPS `< 30 meter`, bukan VPN atau koordinat default null. |
| **Kontak Valid / Login Warga** | **+25** | Nomor telepon terisi atau pelapor login dengan akun warga terverifikasi. |
| **Foto Bukti dari Kamera Asli** | **+20** | Melampirkan foto dengan metadata kamera segar (bukan comotan). |
| **Korelasi Geospasial (Clustering)**| **+20** | Terdapat minimal 2 laporan sejenis dalam radius 1 km dalam waktu 1 jam. |
| **Konfirmasi Warga (*Vouched*)** | **+10** | Dikonfirmasi oleh warga lain di sekitar titik lokasi via peta. |

#### Klasifikasi Tindakan Sistem Berdasarkan Skor:
* **Skor 70 – 100 (Tinggi / Kritis):**
  * Sirene posko berbunyi penuh, lencana **"VALID & PRIORITAS TINGGI"**. Petugas langsung menyiapkan dispatch armada.
* **Skor 40 – 69 (Sedang / Perlu Validasi):**
  * Sirene berbunyi lembut, lencana **"PERLU VERIFIKASI KONTAK"**. Operator melakukan telepon konfirmasi sebelum meluncurkan tim.
* **Skor < 40 (Rendah / Diduga Iseng):**
  * Sirene posko dibisukan (*silent queue*). Masuk antrean review manual tanpa mengganggu kanal utama.

---

### LAPIS 4: SOP Posko Admin & Mekanisme Blacklist

#### A. SOP Two-Step Dispatch (Aturan Konfirmasi 30 Detik)
* Armada rescue tidak diluncurkan hanya berdasarkan 1 klik SOS mentah dari nomor anonim.
* Operator posko memanfaatkan tombol **"Hubungi Pelapor"** di dashboard untuk berbicara selama 15–30 detik memastikan korban sadar, jumlah orang terjebak, dan rute akses jalan.

#### B. Fitur "Tandai Hoaks / Prank" & Blacklist Perangkat
* Pada dashboard [`/admin/sos`](file:///d:/MIA%20Web/src/app/admin/sos) dan [`/admin/laporan`](file:///d:/MIA%20Web/src/app/admin/laporan):
  * Disediakan tombol aksi: **"Tandai Laporan Palsu / Hoaks"**.
  * Saat tombol ditekan:
    1. Sinyal seketika dihapus dari radar darurat aktif.
    2. Nomor HP, ID sesi, dan sidik jari perangkat dimasukkan ke tabel `blacklist_offenders`.
    3. Pelanggar yang masuk daftar hitam akan kehilangan kemampuan memicu sirene darurat di masa mendatang (laporan mereka otomatis ditandai prioritas rendah).

---

## 4. Matriks Perbandingan: Tombol SOS vs Form Lapor Biasa

| Aspek | Tombol SOS (`SosFab.tsx`) | Form Laporan Warga (`/lapor`) |
| :--- | :--- | :--- |
| **Sifat Kondisi** | Kritis, darurat jiwa, detik-per-detik | Informasi situasi, pasca-kejadian, infrastruktur |
| **Form di Awal** | **DILARANG** (Hanya Hold 3 Detik) | **WAJIB** (Judul, deskripsi, jenis bencana) |
| **Nomor HP** | Opsional/Otomatis tersimpan | **Wajib diisi** |
| **Lampiran Foto/Video**| Opsional setelah sinyal terkirim | **Wajib minimal 1 foto bukti** |
| **Sirene Posko** | Berbunyi otomatis real-time | Hanya notifikasi masuk tanpa sirene darurat |

---

## 5. Rencana Penerapan Bertahap (Roadmap)

### Fase 1 (Prioritas Utama - Frontend & UX)
- [x] Tombol SOS mengambang aktif.
- [ ] Terapkan mekanisme **Hold-to-activate 3 detik** pada `SosFab.tsx` dengan progress melingkar.
- [ ] Tambahkan **Grace Period 5 detik** ("Batalkan, saya salah tekan").
- [ ] Tampilkan **Peringatan Sanksi Pidana Pasal 220 KUHP** di modal SOS.
- [ ] Tambahkan tombol **"Tandai Hoaks / Prank"** di panel admin SOS.

### Fase 2 (Data & Algoritma)
- [ ] Kalkulasi **Credibility Score (0-100)** di database Supabase saat laporan masuk.
- [ ] Tampilkan lencana skor kredibilitas (*High Confidence / Unverified*) di dashboard admin.
- [ ] Fitur *Blacklist IP / Nomor HP* di tabel posko.

### Fase 3 (Integrasi Cerdas)
- [ ] Integrasi WhatsApp Webhook / SMS Gateway untuk bot callback konfirmasi 1-ketuk.
- [ ] Integrasi AI Vision API untuk validasi foto asli vs comotan internet.

---

*Dokumen ini dirancang untuk memastikan kesiapan sistem SigapBumi dalam menghadapi implementasi skala riil dengan perlindungan komprehensif terhadap gangguan data palsu.*


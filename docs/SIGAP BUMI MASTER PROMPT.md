# MASTER PROMPT --- SIGAP BUMI

Dokumen implementasi untuk Faiz dan Antigravity.

## Tujuan

Audit, perbaiki, dan matangkan aplikasi SIGAP BUMI yang sudah ada.
Jangan membangun ulang dari nol tanpa alasan teknis.

## Sumber

-   Website: https://sigap-bumi.vercel.app/
-   Repository: https://github.com/Xoltvez/SigapBumi

## Aturan utama

1.  Periksa workspace, Git status, seluruh source code, README, PRD,
    `agent.design.md`, migrations, seed, konfigurasi, dan dokumentasi.
2.  Pertahankan bagian yang sudah baik. Jangan menghapus fitur atau data
    sebelum memahami dependensinya.
3.  Verifikasi stack aktual melalui `package.json`, lockfile, dan source
    code. Jangan mengganti teknologi hanya demi mengejar versi terbaru.
4.  Jangan mengarang integrasi dengan BPBD, BMKG, BNPB, rumah sakit,
    atau layanan darurat.
5.  Jangan mengklaim fitur, data, integrasi, keamanan, maupun pengujian
    berhasil tanpa bukti.
6.  Implementasikan perubahan langsung, bertahap, dan uji setiap tahap.
7.  Jangan pernah mengekspos secrets, token, service-role key, atau data
    pribadi.
8.  Jika akses layanan eksternal tidak tersedia, gunakan adapter dan
    simulasi yang diberi label jelas.
9.  Pertahankan identitas visual existing, tetapi tingkatkan kualitas
    UI/UX.
10. Jangan berhenti pada rekomendasi; selesaikan implementasi yang dapat
    dilakukan di workspace.

## Arah produk

SIGAP BUMI adalah platform digital kesiapsiagaan dan informasi
kebencanaan berbasis masyarakat Indonesia. Produk menghubungkan
informasi, edukasi, pelaporan, verifikasi, koordinasi, dan pemulihan
dengan alur yang mudah dipahami masyarakat umum.

Prinsip: human-centered, mobile-first, clarity-first,
privacy-by-default, accessible-by-default, evidence-based, dan scalable.

## Kondisi demo

Saat ini data masih dummy/simulasi untuk kompetisi. Seluruh angka,
laporan, peringatan, lokasi, dan aktivitas simulasi harus diberi label
**MODE DEMO / DATA SIMULASI**. Jangan menampilkan seolah-olah laporan
telah diterima instansi sungguhan. Siapkan mekanisme seed dan reset
demo, serta pisahkan sumber data demo dari sumber data produksi.

Gunakan pola data provider/adaptor agar UI tidak bergantung pada
hardcoded data. Siapkan jalur migrasi menuju Supabase dan integrasi
sumber resmi di masa depan, tanpa mengklaim integrasi tersebut sudah
berjalan.

## Prioritas

P0: keamanan, privasi, integritas data, dan informasi keselamatan yang
tidak menyesatkan. P1: pelaporan, pelacakan, peta, dan dashboard
operasional. P2: UX, aksesibilitas, dokumentasi, performa. P3: fitur
tambahan yang tidak mengganggu fokus produk.

------------------------------------------------------------------------

# 1. AUDIT SOURCE CODE DAN PRODUK

Audit seluruh source code dan alur nyata. Periksa `package.json`,
lockfile, struktur folder, semua route, page, component, hooks, CSS,
design tokens, Supabase config, migrations, seed, RLS, Storage policies,
authentication, session, authorization, middleware, API routes, server
actions, validasi input, error handling, sumber data setiap halaman,
komponen peta, grafik, formulir, upload, notifikasi, admin panel,
environment references, deployment config, CI/CD, testing, logging,
README, PRD, dan `agent.design.md`.

Uji landing page, navigasi desktop/mobile, peta, detail kejadian,
pelaporan, upload, penentuan lokasi, tracking, edukasi, statistik,
login, registrasi, reset password, dashboard semua role, filter,
pencarian, pagination, empty/loading/error state, validasi, dan logout.

Cari tombol mati, tautan salah, form yang tidak menyimpan data, data
hardcoded, halaman kosong, route tanpa proteksi, komponen duplikat,
layout mobile rusak, istilah teknis yang tidak jelas, serta fitur yang
tidak memberi manfaat.

Buat `docs/AUDIT_REPORT.md` dengan tabel: \| Fitur \| Status saat ini \|
Bukti pemeriksaan \| Masalah \| Rekomendasi \| Prioritas \|

Status: berfungsi, berfungsi sebagian, simulasi, belum tersedia, rusak,
tidak relevan, atau perlu verifikasi.

Prioritas: - P0 Critical: keamanan, privasi, kehilangan data, atau
informasi darurat menyesatkan. - P1 High: fitur utama tidak berjalan. -
P2 Medium: UX, aksesibilitas, kelengkapan, performa. - P3 Low:
penyempurnaan non-esensial.

Sertakan bukti dari kode atau pengujian. Catat hal yang tidak dapat
diperiksa.

# 2. UI/UX DAN DESIGN SYSTEM

Pertahankan karakter visual SIGAP BUMI dan dokumen desain yang ada
sebagai titik awal. Tingkatkan menjadi produk yang simple, elegan,
premium, modern, profesional, dan mudah dipahami. Baca logo, CSS,
tokens, dan PRD sebelum menetapkan palette final.

Buat design tokens terpusat untuk primary, secondary, accent,
background, surface, text, border, focus ring, status, chart, dan marker
peta. Warna status harus konsisten.

Hindari tampilan dashboard generik, terlalu banyak
gradient/glassmorphism/shadow, teks kecil, kontras rendah, kartu
statistik yang tidak mendukung keputusan, ikon tanpa label untuk aksi
penting, dan layout padat.

Desktop: navigasi jelas, header ringkas, konten memiliki lebar baca
nyaman, sidebar hanya untuk area operasional yang memerlukannya.

Mobile: mobile-first, tanpa horizontal overflow, form satu kolom, tombol
mudah dijangkau, aksi pelaporan tetap terlihat, peta memiliki alternatif
daftar, dan informasi penting muncul lebih dahulu.

Rapikan atau buat komponen reusable: button, input, textarea, select,
checkbox, radio, dialog, drawer, toast, tooltip, badge, status
indicator, tabs, dropdown, search, filter, pagination, data table, card,
empty/loading/error state, confirmation dialog, file upload, location
picker, map legend, timeline, alert banner, dan form stepper.

Setiap komponen memiliki state normal, hover, focus, active, disabled,
loading, error, dan success jika relevan. Gunakan microinteraction yang
memberi feedback, bukan animasi dekoratif. Hormati
`prefers-reduced-motion`.

Targetkan WCAG 2.2 AA sejauh dapat diuji: kontras memadai, keyboard
navigation, focus ring, label dan error form jelas, heading hierarchy,
screen reader labels, status tidak hanya dibedakan warna, target sentuh
memadai, dan alternatif daftar untuk peta.

# 3. FITUR PUBLIK UNTUK MASYARAKAT

## 3.1 Beranda

Beranda harus menjawab: informasi bencana apa yang tersedia, tindakan
apa yang perlu dilakukan, dan bagaimana cara melapor atau mencari
informasi.

Prioritaskan status informasi kebencanaan, tombol **Laporkan Kejadian**,
**Lihat Peta Bencana**, peringatan aktif jika sumber dan waktu pembaruan
jelas, ringkasan kejadian terbaru, panduan tindakan singkat, informasi
posko/fasilitas jika tersedia, edukasi pilihan, dan penjelasan singkat
produk. Jangan membuat hero terlalu besar.

## 3.2 Peta situasi bencana

Fitur: marker kejadian, kategori, tingkat dampak berdasarkan definisi
jelas, filter jenis dan waktu, pencarian wilayah, detail marker,
legenda, alternatif daftar, waktu pembaruan, sumber data, serta label
MODE DEMO jika data simulasi.

Bedakan kategori kejadian, tingkat dampak, status verifikasi, dan
tingkat urgensi. Jangan mengarang probabilitas atau tingkat bahaya.
Jangan menampilkan lokasi korban secara presisi kepada publik. Fasilitas
evakuasi hanya ditampilkan dengan sumber dan status yang jelas; data
demo harus diberi label simulasi.

## 3.3 Pelaporan kejadian

Buat form bertahap: jenis kejadian, lokasi, waktu kejadian/perkiraan,
deskripsi, dampak terlihat, kebutuhan bantuan, foto opsional, kontak
pelapor jika diperlukan, dan persetujuan penggunaan data.

Gunakan bahasa sehari-hari, contoh pengisian, indikator langkah,
validasi frontend dan server, ringkasan sebelum submit, pencegahan
duplikasi, nomor referensi unik, konfirmasi, serta instruksi berikutnya.
Jangan meminta data berlebihan. Jelaskan bahwa platform bukan pengganti
layanan darurat resmi dan jangan menjanjikan pertolongan atau waktu
respons.

## 3.4 Pelacakan laporan

Gunakan kode referensi yang tidak mudah ditebak. Tampilkan nomor
laporan, waktu dibuat, kategori, wilayah umum, status, timeline, catatan
yang boleh dilihat pelapor, dan pihak/status verifikasi.

Jangan tampilkan nama, nomor telepon, alamat rinci, foto sensitif, atau
informasi pelapor kepada publik.

Status yang disarankan: diterima sistem, menunggu verifikasi, sedang
diverifikasi, terverifikasi oleh tim platform, diteruskan/ditugaskan
jika benar terjadi, dalam penanganan, selesai, ditolak/duplikat dengan
alasan. Jangan menggunakan istilah "terverifikasi BPBD" tanpa proses
resmi.

## 3.5 Informasi kejadian

Tampilkan ringkasan, lokasi umum, waktu kejadian, waktu pembaruan,
status verifikasi, dampak yang diketahui, sumber informasi, instruksi
keselamatan, dan riwayat pembaruan. Bedakan informasi terkonfirmasi dari
laporan awal. Jangan berspekulasi mengenai korban, kerusakan, atau
kondisi lapangan.

## 3.6 Edukasi kebencanaan

Kategori: sebelum/saat/setelah bencana, kesiapsiagaan keluarga, tas
siaga, evakuasi, pertolongan pertama dasar, kelompok rentan, serta
panduan per jenis bencana.

Setiap artikel memiliki judul sederhana, ringkasan, langkah praktis,
ilustrasi seperlunya, referensi, tanggal peninjauan, dan penanda demo
bila materi simulasi. Materi keselamatan harus bersumber dan ditinjau;
jangan mengarang instruksi medis.

## 3.7 Checklist tas siaga keluarga

Sediakan checklist air, makanan tahan lama, obat pribadi, P3K, senter,
baterai/power bank, peluit, dokumen kedap air, pakaian, kebutuhan
bayi/lansia/disabilitas, dan uang tunai secukupnya. Pengguna dapat
menandai item yang tersedia. Simpan secara lokal atau di akun dengan
kontrol privasi yang tepat.

## 3.8 Fasilitas dan titik evakuasi

Siapkan data posko, tempat evakuasi, fasilitas kesehatan, titik kumpul,
akses jalan, dan fasilitas umum relevan. Setiap entri memiliki nama,
jenis, lokasi, status, sumber, waktu pembaruan, dan status verifikasi.
Jangan menyatakan fasilitas buka atau tersedia tanpa data terbaru. Data
demo harus berlabel simulasi.

## 3.9 PWA dan koneksi terbatas

Evaluasi PWA jika sesuai: installable, cache asset statis dan edukasi
aman, offline fallback, dan sinkronisasi yang jelas. Jangan menyimpan
data pribadi sensitif dalam cache publik. Jika laporan dibuat offline,
tampilkan "belum terkirim" sampai server mengonfirmasi penerimaan.
Sinkronisasi harus mencegah duplikasi. PWA bukan pengganti sistem
komunikasi darurat.

# 4. AKUN DAN DASHBOARD PENGGUNA

Guest dapat membaca informasi publik dan edukasi tanpa wajib mendaftar.
Pertimbangkan pelaporan tamu dengan anti-spam dan privasi memadai.

Akun masyarakat: profil minimal, riwayat laporan sendiri, tracking,
preferensi notifikasi, pengaturan privasi, permintaan
koreksi/penghapusan sesuai kebijakan, logout, dan manajemen sesi. Jangan
meminta NIK jika tidak ada kebutuhan dan dasar yang jelas.

Dashboard masyarakat: laporan milik sendiri, status terbaru, aksi cepat
membuat laporan, riwayat, checklist kesiapsiagaan, dan edukasi relevan.
Jangan tampilkan metrik internal operasional.

# 5. RELAWAN, VERIFIKATOR, DAN OPERATOR

## 5.1 Relawan

Sediakan profil dan status verifikasi, daftar tugas yang ditugaskan,
detail tugas/lokasi sesuai kebutuhan, status tugas, pembaruan progres,
unggah bukti, riwayat penugasan, dan kanal komunikasi koordinator.
Relawan hanya melihat data minimum yang dibutuhkan untuk tugasnya.

## 5.2 Verifikator

Sediakan antrean laporan, filter kategori/wilayah/waktu/status, detail
dan bukti, pemeriksaan duplikasi, catatan internal, keputusan
valid/perlu informasi/duplikat/ditolak, alasan, riwayat status, dan
eskalasi operator. Semua tindakan tercatat. Jangan mengesankan
verifikasi platform sebagai pengesahan lembaga pemerintah.

## 5.3 Operator posko

Sediakan ringkasan insiden, laporan terverifikasi, penugasan relawan,
kebutuhan bantuan, status penanganan, catatan operasional, timeline,
peta operasional sesuai hak akses, dan rekap aktivitas. Perubahan harus
memiliki audit trail.

# 6. ADMINISTRATOR PANEL

Buat area admin terpisah, misalnya `/admin`, sesuai routing existing.

## 6.1 Dashboard overview

Tampilkan total laporan demo, laporan baru, menunggu verifikasi, valid,
ditolak/duplikat, insiden aktif, pengguna, relawan, aktivitas terbaru,
grafik berdasarkan waktu/kategori/wilayah, status integrasi, dan health
indicator jika tersedia. Semua angka dummy berlabel MODE DEMO. Hindari
vanity metrics.

## 6.2 Manajemen laporan

Daftar, pencarian, filter, detail, pemeriksaan bukti, perubahan status
sesuai permission, catatan, penandaan duplikat, pengarsipan sesuai
kebijakan, dan riwayat. Jangan menghapus bukti atau audit history secara
diam-diam.

## 6.3 Manajemen pengguna dan role

Daftar, pencarian, detail terbatas, status akun, aktivasi/nonaktifkan,
role dan permission, reset akses melalui alur aman, riwayat aktivitas,
dan status MFA untuk akun istimewa.

Perubahan role membutuhkan permission khusus, konfirmasi, dan audit log.
Admin tidak boleh menaikkan role sendiri jika tidak memiliki hak.

## 6.4 Manajemen relawan

Daftar relawan, status verifikasi, keahlian, wilayah, ketersediaan,
riwayat penugasan, status akun, penugasan, dan pencabutan tugas. Jangan
tampilkan data pribadi relawan kepada publik.

## 6.5 Manajemen konten

Buat, edit, preview, publish, dan arsipkan artikel; kelola kategori,
editor, sumber, tanggal review, status draft/review/published, dan
riwayat revisi. Konten keselamatan perlu review sebelum publikasi.

## 6.6 Manajemen data peta

Kelola kategori marker, fasilitas, titik evakuasi, status publikasi,
sumber, tanggal pembaruan, status verifikasi, dan import/export
tervalidasi. Perubahan lokasi/status memiliki audit trail.

## 6.7 Audit log

Catat login/logout dan kegagalan autentikasi, perubahan role/permission,
status laporan, konten, konfigurasi, akun, ekspor data, dan tindakan
sensitif.

Minimal: actor, action, resource type/id, timestamp, result, dan
metadata relevan. Jangan menyimpan secret atau data sensitif yang tidak
diperlukan. Log harus tidak dapat diubah oleh role biasa.

## 6.8 Pengaturan sistem

Kelola mode demo, kategori laporan, konten, notifikasi demo, retensi,
status integrasi, dan konfigurasi non-secret. Secret dikelola melalui
environment/secret manager, bukan ditampilkan di UI.

------------------------------------------------------------------------

# 7. INDUSTRIAL-GRADE APPLICATION SECURITY --- WAJIB

## 7.1 Sasaran dan standar

Terapkan Security by Design, Privacy by Design, Least Privilege, Defense
in Depth, Secure Defaults, dan Zero Trust sesuai konteks aplikasi.

Referensi: - OWASP Application Security Verification Standard (ASVS),
target Level 2 sebagai baseline. - OWASP Top 10 dan OWASP API Security
Top 10. - OWASP Cheat Sheet Series. - NIST Secure Software Development
Framework (SSDF). - NIST Cybersecurity Framework sebagai referensi
pengelolaan risiko. - ISO/IEC 27001:2022 sebagai referensi tata
kelola. - UU No. 27 Tahun 2022 tentang Pelindungan Data Pribadi.

Jangan mengklaim tersertifikasi ISO, memenuhi seluruh ASVS, atau 100%
aman hanya karena beberapa kontrol diterapkan. Buat matriks kontrol,
bukti pengujian, dan daftar pengecualian. Untuk fungsi berisiko tinggi,
evaluasi kontrol tambahan setara ASVS Level 3.

## 7.2 Threat modeling

Buat `docs/THREAT_MODEL.md`. Identifikasi aset, data sensitif, aktor,
role, trust boundary, entry point, alur data, ancaman, dampak, mitigasi,
dan residual risk. Gunakan STRIDE sebagai metode bantu.

Prioritaskan risiko laporan palsu, pengambilalihan akun, akses laporan
milik orang lain, manipulasi status, penyalahgunaan lokasi, kebocoran
foto, eskalasi hak akses, spam, denial-of-service, dan manipulasi data
operasional.

## 7.3 Authentication

-   Gunakan Supabase Auth jika sesuai dengan arsitektur existing.
-   Terapkan session management yang aman.
-   Cookie sesi menggunakan HttpOnly, Secure, dan SameSite sesuai
    kebutuhan.
-   Jangan menyimpan token sensitif sembarangan di
    localStorage/sessionStorage.
-   Terapkan expiry, refresh, revocation, dan logout yang benar.
-   Rate limit login, registrasi, reset password, dan endpoint sensitif.
-   Lindungi dari brute-force dan credential stuffing.
-   Pesan error login tidak boleh mengungkap apakah email terdaftar.
-   Reset password menggunakan token sekali pakai dengan masa berlaku.
-   Terapkan verifikasi email sesuai kebutuhan.
-   Wajibkan MFA untuk administrator, super administrator, dan akun
    istimewa jika didukung.
-   Sediakan pencabutan sesi/perangkat.
-   Jangan membuat akun admin default dengan password hardcoded.
-   Akun demo terpisah dari akun produksi dan tidak memiliki hak
    produksi.

## 7.4 Authorization dan RBAC

Role yang disiapkan: Guest/Public, Registered User, Volunteer, Verifier,
Operator Posko, Administrator, dan Super Administrator.

Terapkan Least Privilege, deny-by-default, server-side authorization,
permission terperinci, pemisahan tugas untuk aksi kritis, proteksi
privilege escalation, validasi kepemilikan resource, dan audit log
perubahan role.

Jangan mempercayai role yang dikirim browser atau disimpan di
client-side state. Gunakan sumber otoritatif yang diverifikasi
server/database. Menyembunyikan menu bukan kontrol keamanan.

## 7.5 Database security --- Supabase

Periksa seluruh tabel, view, function, trigger, bucket, dan policy.

-   Aktifkan RLS pada seluruh tabel yang dapat diakses melalui API.
-   Buat policy SELECT, INSERT, UPDATE, DELETE secara eksplisit dan
    terpisah.
-   Batasi akses berdasarkan identitas, kepemilikan, dan permission.
-   Uji bahwa user A tidak dapat membaca/mengubah laporan user B.
-   Uji bahwa pengguna tidak dapat mengubah role sendiri.
-   Lindungi profil, kontak, bukti, penugasan, audit log, dan
    konfigurasi.
-   Terapkan Storage policies.
-   Gunakan foreign key, unique/check/not-null constraint sesuai
    kebutuhan.
-   Gunakan transaksi untuk operasi multi-langkah yang perlu
    konsistensi.
-   Gunakan index berdasarkan query aktual.
-   Gunakan parameterized query.
-   Buat migration versioned dan reviewable.
-   Sediakan backup dan prosedur restore.

**Supabase Service Role Key** hanya boleh berada di server/secret
manager, tidak boleh menggunakan prefix `NEXT_PUBLIC_`, tidak boleh
dikirim ke browser, source code, Git, atau log. Batasi penggunaan untuk
operasi server yang benar-benar memerlukan bypass RLS, dengan validasi
dan otorisasi ketat.

**Supabase anon/publishable key** bukan pengganti RLS. Semua akses tetap
harus dilindungi policy.

Buat test matrix RLS untuk setiap role dan operasi. Jangan menyatakan
RLS aman sebelum uji negatif berhasil.

## 7.6 API security

Seluruh API route, server action, webhook, dan endpoint backend harus
memverifikasi autentikasi dan authorization, memvalidasi input dengan
schema, melakukan sanitasi output sesuai konteks, menggunakan
parameterized query, menerapkan rate limit, membatasi ukuran
request/upload, timeout, validasi Content-Type, pagination, error
handling aman, dan proteksi IDOR/BOLA, mass assignment, SSRF, path
traversal, open redirect, serta replay jika relevan.

Gunakan Zod atau validator setara jika cocok dengan stack. Validasi
frontend hanya untuk UX; validasi server adalah kontrol keamanan.

Jangan mengembalikan stack trace, SQL internal, credential, environment
variable, file path internal, atau konfigurasi sensitif.

## 7.7 Web application security

Lindungi dari XSS, CSRF, SQL Injection, Broken Access Control, SSRF,
IDOR/BOLA, clickjacking, session hijacking, path traversal, command
injection, open redirect, insecure deserialization, security
misconfiguration, dan information disclosure.

Konfigurasikan: - Content-Security-Policy (CSP) sesuai resource yang
benar-benar dibutuhkan. - Strict-Transport-Security (HSTS) untuk domain
HTTPS produksi. - X-Content-Type-Options: nosniff. - Referrer-Policy. -
Permissions-Policy. - CSP `frame-ancestors` untuk proteksi framing. -
Cache-Control tepat untuk data sensitif.

Konfigurasikan CORS dengan origin eksplisit. Jangan gunakan wildcard
untuk endpoint dengan credentials. Gunakan HTTPS. Hindari inline script
yang tidak perlu. Jangan melonggarkan CSP hanya agar fitur berjalan;
allowlist sumber daya yang diperlukan.

## 7.8 File upload security

-   Validasi ekstensi, MIME type, dan magic bytes.
-   Batasi ukuran, jumlah, dan dimensi file.
-   Gunakan nama file acak buatan server.
-   Jangan gunakan nama file pengguna sebagai path.
-   Tolak executable dan format aktif yang tidak dibutuhkan.
-   Tolak HTML/SVG jika tidak diperlukan atau sanitasi dengan benar.
-   Pertimbangkan malware scanning pada produksi.
-   Bersihkan EXIF yang dapat mengungkap lokasi/identitas.
-   Simpan bukti pribadi di private bucket.
-   Gunakan signed URL berumur pendek.
-   Periksa authorization sebelum akses file.
-   Jangan membuka bukti privat melalui URL publik permanen.
-   Terapkan retensi dan penghapusan sesuai kebijakan.

Gambar publik yang disetujui sebaiknya berupa salinan terproses tanpa
metadata sensitif.

## 7.9 Privacy dan perlindungan data pribadi

Buat `docs/DATA_PRIVACY.md` dan data inventory.

Klasifikasikan data:

**Public:** artikel edukasi, informasi kebencanaan yang disetujui untuk
publikasi, statistik agregat, dan informasi fasilitas publik yang boleh
dibagikan.

**Internal:** laporan belum diverifikasi, catatan verifikator, data
operasional posko, penugasan relawan, dan catatan tindak lanjut.

**Sensitive/personal:** nama dan kontak pelapor, email, nomor telepon,
alamat rinci, koordinat individu, foto korban/warga, identitas korban,
data kesehatan/kebutuhan khusus, dan dokumen identitas.

Terapkan data minimization, purpose limitation, retention limitation,
privacy notice yang jelas, consent atau dasar pemrosesan yang sesuai,
pembatasan akses berdasarkan tugas, enkripsi saat transit dan tersimpan
sesuai kemampuan layanan, masking di UI/log, penghapusan atau
anonimisasi sesuai jadwal, mekanisme permintaan
akses/koreksi/penghapusan, pencatatan akses data sensitif, dan evaluasi
dampak perlindungan data untuk pemrosesan berisiko tinggi.

Jangan tampilkan nomor telepon pelapor kepada publik. Jangan
publikasikan koordinat presisi korban atau rumah warga. Gunakan lokasi
agregat/generalized untuk tampilan publik. Jangan meminta NIK, foto
identitas, atau data kesehatan jika tidak benar-benar diperlukan dan
tidak memiliki dasar pemrosesan yang jelas. Jangan menyimpan data
pribadi demo yang menyerupai data orang nyata.

## 7.10 Encryption dan secret management

-   Gunakan HTTPS/TLS untuk seluruh komunikasi.
-   Gunakan enkripsi at-rest yang disediakan database, storage, dan
    cloud provider.
-   Pertimbangkan field-level encryption hanya jika kebutuhan dan
    pengelolaan key jelas.
-   Simpan secrets di environment secret manager, bukan source code.
-   Sediakan `.env.example` tanpa nilai rahasia.
-   Pisahkan development, staging, dan production.
-   Rotasi secret jika terindikasi bocor.
-   Batasi akses secret berdasarkan role dan kebutuhan.
-   Jangan mencetak token, password, signed URL sensitif, atau personal
    data ke log.
-   Pastikan `.gitignore` melindungi `.env*`, credential, file backup,
    dan artefak sensitif.

Jika ditemukan secret pernah ter-commit, jangan hanya menghapus dari
file terbaru. Dokumentasikan insiden, lakukan rotasi/revoke, dan
evaluasi riwayat repository.

## 7.11 Rate limiting dan anti-abuse

Terapkan proteksi pada login, reset password, pembuatan laporan,
pencarian publik, upload, form kontak, dan endpoint rawan.

Gunakan rate limiting server-side/distributed yang sesuai deployment.
Jangan mengandalkan limit browser atau memori satu instance serverless.

Tambahkan batas request per IP/account sesuai risiko, validasi ukuran
payload, duplicate submission protection, idempotency untuk operasi
relevan, CAPTCHA/challenge adaptif jika diperlukan, deteksi spam, dan
mekanisme block/appeal proporsional. Jangan membuat anti-spam
menghalangi pengguna dengan kebutuhan aksesibilitas.

## 7.12 Logging, monitoring, dan alerting

Log secara terstruktur: authentication events, authorization failures,
API errors, database failures, rate limit events, upload failures, admin
actions, perubahan status laporan, perubahan permission, dan health
checks.

Jangan log password, access/refresh token, secret, isi dokumen
identitas, atau personal data yang tidak diperlukan.

Monitor error rate, latency, availability, database/storage errors, auth
failures, dan lonjakan trafik. Alert harus memiliki severity dan
prosedur tindak lanjut.

Pisahkan audit log bisnis dari application log. Lindungi integritas dan
akses audit log.

## 7.13 Backup dan disaster recovery

Rancang jadwal backup database, retensi, akses terbatas, enkripsi,
prosedur restore, pengujian restore berkala, dan target RPO/RTO yang
realistis setelah kebutuhan operasional ditentukan.

Jangan mengklaim backup berhasil hanya karena fitur backup provider
tersedia. Buktikan restore dapat dilakukan pada lingkungan uji.
Dokumentasikan prosedur ketika database, storage, atau deployment gagal.

## 7.14 Infrastructure dan deployment security

Untuk Vercel/Supabase atau platform aktual: - Pisahkan environment
development, preview/staging, dan production. - Batasi siapa yang dapat
deploy production. - Lindungi environment variables. - Aktifkan HTTPS. -
Review domain dan redirect. - Terapkan security headers. - Batasi akses
database dan storage sesuai kebutuhan. - Jangan membuka dashboard admin
tanpa autentikasi. - Preview deployment tidak boleh memakai data
produksi sensitif. - Hindari merekam personal data berlebihan pada
log/analytics. - Jangan mempublikasikan source map sensitif jika
mengungkap kode internal.

## 7.15 Dependency dan supply-chain security

Audit dependency langsung dan transitive, advisories/CVE, paket tidak
terpakai, paket tidak terpelihara, dan script dependency yang tidak
dipercaya. Gunakan lockfile. Pertimbangkan Dependabot/Renovate, SAST,
dependency scanning, dan secret scanning. Review setiap perubahan
package dan lockfile.

## 7.16 Secure development lifecycle

Terapkan keamanan pada requirement/threat modeling, design review,
secure coding, code review, static analysis, dependency scanning, secret
scanning, security testing, deployment approval, monitoring, dan
patching.

Buat `docs/SECURITY_BASELINE.md` berisi kontrol, status, bukti,
pengecualian, residual risk, dan tindak lanjut.

## 7.17 Incident response

Buat `docs/SECURITY_INCIDENT_RESPONSE.md` yang menjelaskan pelaporan
insiden, klasifikasi severity, penanggung jawab, isolasi sistem,
pencabutan sesi/token/secret, pengamanan bukti/log, pemulihan, evaluasi
dampak data pribadi, komunikasi sesuai kewajiban, dan post-incident
review.

Jangan menghapus log atau bukti insiden.

------------------------------------------------------------------------

# 8. ROLE DAN PERMISSION MATRIX

Buat `docs/ACCESS_CONTROL_MATRIX.md`.

Role: Guest, Registered User, Volunteer, Verifier, Operator,
Administrator, dan Super Administrator.

Tentukan permission untuk: - Read public incident. - Create report. -
Read own report. - Read assigned task. - Update assigned task. - Verify
report. - Assign volunteer. - Update incident. - Manage content. -
Manage user. - Manage role. - View audit log. - Manage system
configuration. - Export data.

Gunakan deny-by-default. Aksi sensitif membutuhkan permission spesifik
dan audit log. Jangan memberikan superuser otomatis atau melalui
registrasi publik.

------------------------------------------------------------------------

# 9. DATABASE DAN DATA MODEL

Periksa skema existing terlebih dahulu. Jangan membuat tabel duplikat
jika entitas serupa sudah ada. Sesuaikan nama tabel dengan konvensi
project.

Entitas konseptual yang mungkin dibutuhkan: - profiles/users. - roles
dan permissions. - user_role_assignments. - incidents/reports. -
incident_categories. - report_attachments. - report_status_history. -
verification_records. - incident_updates. - facilities. -
evacuation_points. - volunteer_profiles. - volunteer_assignments. -
assistance_needs. - educational_articles. - article_categories. -
notifications. - audit_logs. - system_settings.

Tentukan primary key, foreign key, unique constraints, check
constraints, indexes, created_at, updated_at, created_by, status, dan
soft delete jika benar-benar dibutuhkan. Terapkan migration versioned
dan seed demo yang terpisah.

Jangan menyimpan satu status saja jika dibutuhkan riwayat perubahan.
Jangan membuat duplikasi data pribadi di banyak tabel tanpa alasan.

Buat diagram ERD dan dokumentasi skema di `docs/DATABASE_DESIGN.md`.
Sertakan hubungan tabel dan kebijakan aksesnya.

------------------------------------------------------------------------

# 10. MODE DEMO, SEED, DAN RESET DATA

Implementasikan mode demo yang konsisten dan aman: - Satu sumber data
demo terpusat. - Seed fiktif yang realistis dan konsisten
antarhalaman. - Penanda MODE DEMO pada seluruh data simulasi. - Akun
demo per role dengan akses terbatas. - Tidak ada secret produksi dalam
seed. - Data demo tidak tercampur dengan data produksi. - Reset demo
hanya tersedia di lingkungan demo dan untuk role berwenang. - Reset
memerlukan konfirmasi eksplisit, idempotent, dan terdokumentasi. - Reset
tidak boleh menghapus database produksi. - Dataset cukup untuk menguji
filter, pencarian, pagination, peta, grafik, dan status.

Buat `docs/DEMO_MODE.md` tentang aktivasi demo, akun/role demo, seed,
reset, dan batasan simulasi.

# 11. INTEGRASI EKSTERNAL DAN REAL-TIME DI MASA DEPAN

Integrasi eksternal boleh belum aktif untuk lomba. Siapkan
interface/adaptor terpisah untuk: - Sumber informasi/peringatan resmi. -
Informasi cuaca. - Informasi gempa atau kejadian geologi. - Peta dan
geocoding. - Notifikasi email/SMS/push. - Mitra/instansi berotorisasi. -
Analitik agregat.

Jangan scraping atau menggunakan endpoint tidak resmi tanpa menilai
ketentuan penggunaan, stabilitas, dan izin.

Setiap integrasi memiliki provider, dokumentasi sumber, status
aktif/nonaktif, waktu sinkronisasi terakhir, health status, timeout,
retry/backoff, error handling, cache, batas request, penanda data stale,
dan fallback.

Jangan menyebut data real-time jika pembaruannya periodik atau tidak
diketahui. Tampilkan timestamp dan sumber data. Jangan mengarang API key
atau mengklaim integrasi aktif tanpa kredensial dan pengujian.

Notifikasi harus memiliki kategori/prioritas, preferensi pengguna,
retry/error state, pencegahan duplikasi, dan tidak mengirim informasi
sensitif berlebihan. Pada demo, gunakan notifikasi simulasi yang jelas.

## 11.1 AI dan fitur modern

AI bukan fitur wajib. Jangan menambahkan chatbot hanya agar terlihat
modern.

Jika berguna, AI dapat membantu menyederhanakan bahasa edukasi,
mengelompokkan laporan untuk pemeriksaan manusia, pencarian artikel,
atau merangkum laporan internal untuk petugas berwenang.

AI tidak boleh menetapkan laporan terverifikasi tanpa manusia,
mengeluarkan peringatan resmi, menentukan rute evakuasi tanpa data dan
otoritas valid, memberi diagnosis/instruksi medis tidak tervalidasi,
mengambil keputusan keselamatan otomatis, atau mengarang informasi
bencana.

Jika AI digunakan, tandai hasil sebagai bantuan otomatis, tampilkan
sumber jika tersedia, dan sediakan pemeriksaan manusia.

# 12. FITUR PEMBEDA SIGAP BUMI

Prioritaskan manfaat, bukan jumlah fitur.

## 12.1 Pusat Kesiapsiagaan Keluarga

-   Checklist tas siaga.
-   Kontak darurat pribadi yang disimpan privat.
-   Titik kumpul keluarga yang privat/lokal.
-   Panduan sebelum, saat, dan setelah bencana.
-   Pengingat meninjau kesiapan.

Jangan publikasikan data keluarga.

## 12.2 Pelaporan berbasis lokasi dengan privasi

Minta izin lokasi secara eksplisit, sediakan input manual, jelaskan
tujuan penggunaan, jangan mengaktifkan tracking terus-menerus, dan
generalisasikan lokasi publik jika presisi tidak diperlukan.

## 12.3 Peta dua mode

-   Mode Publik: kejadian dan fasilitas yang aman dibagikan.
-   Mode Operasional: detail tambahan hanya bagi role petugas berwenang.

Jangan tampilkan informasi operasional sensitif di peta publik.

## 12.4 Timeline transparansi

Pelapor melihat perkembangan laporannya dengan bahasa sederhana, waktu
pembaruan, dan informasi tindak lanjut yang boleh dibagikan. Jangan
tampilkan catatan internal atau data pihak lain.

## 12.5 Edukasi kontekstual

Tampilkan edukasi sesuai kategori bencana yang sedang dilihat atau
wilayah yang dipilih. Jangan menyimpulkan risiko personal tanpa data dan
metodologi sah.

# 13. FITUR YANG TIDAK PERLU DIPAKSAKAN

Tunda atau hindari: - Chatbot AI yang menjawab kondisi darurat tanpa
sumber terverifikasi. - Prediksi bencana tanpa model, data, dan validasi
ilmiah. - Live tracking relawan terus-menerus. - Social feed umum yang
rawan rumor. - Komentar publik di setiap laporan. - Donasi/transaksi
keuangan sebelum tata kelola, mitra, dan legalitas jelas. - Gamification
yang mengalihkan fokus keselamatan. - Peta 3D yang memperlambat
perangkat. - Dashboard berulang dengan metrik sama. - Pengumpulan data
pribadi berlebihan. - Integrasi tanpa izin atau akses resmi. - Klaim
respons otomatis atau pengiriman bantuan yang belum nyata.

Setiap fitur baru harus menjawab: masalah pengguna apa yang
diselesaikan, siapa yang menggunakannya, alur penggunaannya, data yang
dibutuhkan, risiko keselamatan, dan cara mengujinya.

# 14. ARSITEKTUR DAN KUALITAS KODE

Ikuti arsitektur existing selama masih layak. Terapkan separation of
concerns, reusable components, typed data contracts, centralized
validation, server-side authorization, error handling konsisten, data
access layer/repository jika sesuai, adapter provider eksternal,
konfigurasi environment terpusat, dan pemisahan business logic dari
komponen presentasi.

Hindari duplikasi query/validasi, penggunaan `any` tanpa alasan,
hardcoded credentials, dan overengineering. Jangan memindahkan seluruh
project ke arsitektur baru hanya karena preferensi pribadi.
Dokumentasikan alasan perubahan arsitektur besar.

# 15. PERFORMANCE DAN RELIABILITY

Targetkan pengalaman cepat pada perangkat dan jaringan umum di
Indonesia.

Periksa bundle size, dynamic import untuk komponen berat seperti peta,
image optimization, font loading, cache policy, query database,
pagination server-side, debounce pencarian, fetch berulang, render
ulang, jumlah marker, loading skeleton, error/retry state, layout shift,
dan performa perangkat low-end.

Gunakan Core Web Vitals sebagai indikator. Jangan mengklaim skor tanpa
pengukuran. Untuk peta, gunakan clustering atau pembatasan marker jika
dataset besar. Sediakan daftar alternatif ketika peta lambat/tidak
tersedia.

# 16. TESTING DAN QUALITY ASSURANCE

Gunakan test framework yang sesuai dengan stack existing.

## 16.1 Unit tests

Uji validator, helper, status transition, permission logic, dan business
rules.

## 16.2 Integration tests

Uji API, server actions, database access, RLS, Storage policy, dan role
permissions.

## 16.3 End-to-end tests

Uji: - Guest membuka informasi publik. - User membuat laporan. - User
melacak laporan. - User tidak dapat membaca laporan user lain. -
Verifier memeriksa laporan. - Operator memperbarui status/penugasan. -
Admin mengelola konten. - Role tanpa izin ditolak. - Upload tidak valid
ditolak. - Logout mengakhiri sesi. - Mode demo memiliki label jelas.

## 16.4 Security tests

Jalankan SAST, dependency vulnerability scan, secret scan, DAST pada
lingkungan yang diizinkan, RLS negative tests, authorization/IDOR tests,
rate-limit tests, input validation tests, file upload tests, dan
security headers check.

Jangan melakukan penetration testing destruktif terhadap production atau
sistem pihak ketiga. Gunakan staging/local yang diizinkan.

## 16.5 UI tests

Periksa desktop, tablet, mobile, keyboard, focus, contrast,
empty/loading/error state, form validation, modal/drawer, peta, dan
alternatif daftar.

## 16.6 Regression tests

Setiap perubahan tidak boleh merusak fitur yang sudah berfungsi.
Jalankan lint, typecheck, test, dan build sesuai script. Catat hasil
aktual dan error yang belum terselesaikan.

# 17. DEPLOYMENT DAN PRODUCTION READINESS

Untuk tahap kompetisi: - Pertahankan deployment existing jika masih
sehat. - Gunakan environment demo terpisah. - Pastikan data simulasi
diberi label. - Pastikan admin demo terlindungi. - Jangan memasukkan
secrets ke repository. - Pastikan build dan runtime berhasil. - Periksa
domain, HTTPS, security headers, dan error deployment. - Sediakan 404
dan error state yang layak. - Periksa desktop dan mobile.

Jangan aktifkan produksi nyata sebelum sumber data resmi/berizin
tersedia, pemilik data dan tanggung jawab operasional jelas, RLS dan
permission diuji, kebijakan privasi/retensi disusun, backup/restore
diuji, monitoring dan incident response siap, SOP verifikasi/eskalasi
disepakati, serta persetujuan/kemitraan yang diperlukan tersedia.

Jangan mengklaim SIGAP BUMI menggantikan kanal darurat resmi.

# 18. README DAN DOKUMENTASI PROJECT

Ganti README bawaan create-next-app dengan dokumentasi SIGAP BUMI
profesional.

README minimal: 1. Nama dan deskripsi. 2. Latar belakang masalah. 3.
Tujuan dan manfaat. 4. Target pengguna. 5. Daftar fitur. 6. Screenshot
beranda dan dashboard. 7. Teknologi aktual yang digunakan. 8. Arsitektur
sistem. 9. Prasyarat instalasi. 10. Cara menjalankan aplikasi. 11. Nama
environment variables (tanpa nilai rahasia). 12. Struktur direktori. 13.
Role pengguna. 14. Mode demo dan batasannya. 15. Cara seed/reset demo.
16. Testing dan build commands. 17. Keamanan dan privasi. 18. Roadmap.
19. Kontributor/tim.

Buat atau perbarui dokumentasi berikut. Jangan membuat duplikat jika
dokumen setara sudah tersedia: - `docs/AUDIT_REPORT.md` -
`docs/THREAT_MODEL.md` - `docs/SECURITY_BASELINE.md` -
`docs/ACCESS_CONTROL_MATRIX.md` - `docs/DATA_PRIVACY.md` -
`docs/DATABASE_DESIGN.md` - `docs/DEMO_MODE.md` - `docs/DEPLOYMENT.md` -
`docs/TEST_PLAN.md` - `docs/ROADMAP.md`

# 19. ROADMAP IMPLEMENTASI

Kerjakan secara bertahap. Jangan mengerjakan semua fitur sekaligus tanpa
validasi.

## Fase 0 --- Discovery dan baseline

-   Periksa workspace dan Git status.
-   Baca seluruh dokumen existing.
-   Pahami arsitektur.
-   Jalankan aplikasi.
-   Catat fitur yang berfungsi.
-   Buat audit report dan threat model awal.

Output: audit dan backlog terurut.

## Fase 1 --- P0 security dan stabilitas

-   Perbaiki kebocoran secret.
-   Periksa auth/session.
-   Periksa RBAC.
-   Audit RLS dan Storage.
-   Perbaiki API authorization.
-   Validasi upload dan input.
-   Terapkan security headers.
-   Tambahkan audit logging untuk aksi penting.
-   Perbaiki error kritis.

Output: baseline keamanan dan aplikasi stabil.

## Fase 2 --- Core user journey

-   Beranda.
-   Peta dan daftar kejadian.
-   Detail kejadian.
-   Form pelaporan.
-   Tracking laporan.
-   Status/timeline.
-   Edukasi dan checklist.

Output: alur masyarakat yang utuh dan dapat diuji.

## Fase 3 --- Dashboard operasional

-   Verifier queue.
-   Operator workspace.
-   Volunteer tasks.
-   Admin overview.
-   Manajemen laporan, user, role, konten, dan data peta.
-   Audit log.

Output: alur internal dengan permission sesuai role.

## Fase 4 --- Design system dan responsive polish

-   Rapikan tokens.
-   Konsistensi komponen.
-   Mobile-first.
-   Aksesibilitas.
-   Loading/empty/error state.
-   Microinteraction.
-   Perbaikan visual akhir.

Output: UI matang dan konsisten.

## Fase 5 --- Demo data dan presentasi lomba

-   Seed demo.
-   Reset demo yang aman.
-   Penanda simulasi.
-   Akun demo per role dengan akses terbatas.
-   Dataset konsisten.
-   Skenario presentasi end-to-end.

Output: demonstrasi realistis tanpa klaim palsu.

## Fase 6 --- QA dan deployment

-   Unit/integration/E2E.
-   Security tests.
-   Responsive checks.
-   Lint/typecheck/build.
-   Perbaikan bug.
-   README dan dokumentasi.
-   Deploy jika diminta/diizinkan dan kredensial tersedia.

Output: release candidate dan laporan pengujian.

# 20. ACCEPTANCE CRITERIA --- SYARAT SELESAI

Project belum dianggap selesai hanya karena tampilannya bagus.

## Produk

-   Pengunjung memahami tujuan SIGAP BUMI.
-   Informasi penting mudah ditemukan.
-   Pelaporan memiliki alur jelas.
-   Nomor referensi tersedia.
-   Pengguna melacak laporan sesuai hak akses.
-   Status dan timeline konsisten.
-   Data demo selalu ditandai.
-   Tidak ada klaim integrasi palsu.

## Admin dan role

-   Dashboard admin terpisah dan terlindungi.
-   Role dan permission diuji.
-   Verifier hanya melakukan tindakan yang diizinkan.
-   Operator hanya mengakses data sesuai tugas.
-   Relawan hanya melihat tugas yang ditugaskan.
-   Perubahan penting tercatat di audit log.

## UI/UX

-   Responsif desktop, tablet, mobile.
-   Tidak ada horizontal overflow.
-   Form memiliki validasi dan error message.
-   Loading, empty, success, dan error state tersedia.
-   Keyboard navigation dan focus state berjalan.
-   Peta memiliki alternatif daftar.
-   Kontras dan label aksesibel diperiksa.

## Security

-   Tidak ada secret di source code/client bundle.
-   RLS aktif dan diuji pada tabel yang terekspos.
-   API melakukan authorization server-side.
-   Pengguna tidak dapat membaca/mengubah data pengguna lain.
-   Upload tervalidasi dan file privat terlindungi.
-   Admin dilindungi MFA jika didukung.
-   Rate limiting tersedia pada endpoint sensitif.
-   Security headers diperiksa.
-   Dependency dan secret scanning dijalankan.
-   Risiko yang belum ditangani didokumentasikan.

## Engineering

-   Lint berjalan.
-   Typecheck berjalan.
-   Test berjalan.
-   Build berhasil.
-   Tidak ada error kritis yang diketahui.
-   Migration dan seed terdokumentasi.
-   README sesuai project.
-   Cara menjalankan dan menguji aplikasi jelas.

## Deployment

-   Preview/production deployment sesuai environment.
-   HTTPS aktif.
-   Environment variables aman.
-   Data demo tidak tercampur produksi.
-   Kredensial demo tidak terekspos.

# 21. OUTPUT AKHIR UNTUK FAIZ

Setelah implementasi, berikan laporan akhir: 1. Ringkasan kondisi awal.
2. Fitur existing yang dipertahankan. 3. Fitur yang diperbaiki. 4. Fitur
baru yang diimplementasikan. 5. Fitur yang ditunda beserta alasannya. 6.
Perubahan UI/UX. 7. Perubahan arsitektur/database. 8. Perubahan
keamanan. 9. Hasil lint, typecheck, unit, integration, E2E, dan build.
10. Hasil responsive/accessibility check. 11. Risiko yang masih terbuka.
12. Nama environment variables yang perlu disiapkan (jangan tampilkan
nilainya). 13. Cara menjalankan project. 14. Cara reset demo. 15. Cara
deployment. 16. Roadmap menuju integrasi data nyata.

Laporkan secara jujur mana yang benar-benar selesai, mana yang simulasi,
mana yang membutuhkan kredensial/mitra, dan mana yang belum diuji.
Jangan mengklaim pekerjaan selesai jika acceptance criteria belum
terpenuhi.

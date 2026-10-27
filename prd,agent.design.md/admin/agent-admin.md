# AGENT-ADMIN.md: Aturan Kerja Agent untuk Area Admin (`/admin/*`)

Melengkapi `agent.md`. **Semua aturan di `agent.md` tetap berlaku** (push ke GitHub setiap perubahan, tunggu persetujuan developer, scope lock, ikuti desain, donasi terkunci, format laporan, git flow). Dokumen ini hanya menambah aturan khusus dashboard petugas.

Jika ada pertentangan dengan `agent.md`, **dokumen ini menang untuk area admin**. Pertentangan yang tidak jelas **ditanyakan ke developer**, tidak ditebak.

**Dokumen rujukan (baca sebelum bekerja di area admin):**

- `prd-admin.md`: fitur, aturan bisnis, basis data, hak akses, tahap A1 sampai A4
- `design-admin.md`: tampilan dashboard (melengkapi `design.md`)
- `prd.md` dan `design.md`: konteks produk dan gaya dasar
- `agent.md`: aturan kerja umum

---

## 1. Aturan Utama Admin

### 1.1 Batas area kerja

- Saat mengerjakan permintaan admin, **hanya sentuh** `src/app/admin/`, `src/components/admin/`, dan objek basis data yang disebut di `prd-admin.md` bagian 9.
- Jangan mengubah halaman warga, publik, atau auth, layout global, `SosFab`, atau komponen `ui/` bersama **kecuali diminta dan disetujui**. Jika admin butuh perubahan pada komponen bersama, ajukan dulu sebagai rencana terpisah.
- Jangan mengubah `tailwind.config.ts`, `package.json`, `middleware.ts`, atau migrasi lama tanpa persetujuan eksplisit.

### 1.2 Jangan memutuskan keputusan terbuka

Keputusan K-1 sampai K-5 di `prd-admin.md` bagian 15 **milik developer**. Agent memakai usulan bawaan hanya setelah developer menyetujuinya, dan tidak pernah memutuskan sendiri:

| ID | Tema | Larangan sebelum disetujui |
| --- | --- | --- |
| K-1 | Satu atau dua peran admin | Jangan menambah nilai `koordinator` ke enum peran, dan jangan membuat halaman/aksi khusus koordinator |
| K-2 | Laporan belum diverifikasi di peta publik | Jangan membuka laporan berstatus Diterima ke view publik |
| K-3 | Web Push | Jangan membuat service worker push atau langganan push |
| K-4 | Bobot skor prioritas | Pakai nilai awal di `prd-admin.md` 7.2, jangan mengubah bobot sendiri |
| K-5 | Pengelolaan tim | Isi tim lewat `seed.sql`, jangan membuat UI pengelolaan tim sebelum tahap A3 disetujui |

### 1.3 Ikuti tahap A1 sampai A4

Kerjakan sesuai urutan `prd-admin.md` bagian 13. Jangan mengerjakan fitur tahap berikutnya sebelum developer menyetujui. Tahap A1 harus selesai dan berjalan sebelum A2 dimulai.

### 1.4 Label "Simulasi" selalu terlihat

Seluruh area admin adalah simulasi dashboard BNPB/BPBD. Lencana "Simulasi" di topbar **tidak boleh dihapus atau disembunyikan**. Jangan menulis teks atau tampilan yang menyiratkan sistem terhubung ke BNPB asli.

### 1.5 Donasi tetap terkunci

Tidak ada UI atau tabel donasi di area admin. Lihat `agent.md` bagian 1.5.

---

## 2. Otorisasi dan Keamanan (Wajib)

1. **Otorisasi di server, bukan hanya menyembunyikan menu.** Setiap halaman `/admin/*`, route handler, dan server action memeriksa sesi dan peran di server. Menu yang disembunyikan di UI tidak dianggap sebagai keamanan.
2. **Peran dibaca dari tabel `profiles`**, bukan dari `user_metadata` atau klaim yang bisa diubah pengguna.
3. **Jangan pernah memakai `SUPABASE_SERVICE_ROLE_KEY` di client** atau mengeksposnya lewat `NEXT_PUBLIC_*`. Pemakaian di server dibatasi pada keperluan yang memang butuh (misalnya membuat akun petugas) dan harus diminta persetujuan.
4. **Akun admin dibuat manual**, bukan lewat form daftar publik. Jangan menambah jalur pendaftaran admin.
5. Pengguna tidak dapat mengubah perannya sendiri, dan harus selalu tersisa minimal satu akun dengan hak kelola pengguna.
6. Pembukaan kontak pelapor wajib mencatat ke `audit_logs` sebelum data ditampilkan.
7. Ekspor CSV tidak memuat data pribadi, dibatasi 10.000 baris, dan tercatat di audit log.
8. Jangan menampilkan nama atau kontak pelapor di daftar, peta, atau ekspor. Bawaannya tersamarkan.
9. Jangan menulis data pribadi nyata di `seed.sql`; pakai data dummy.

---

## 3. Aturan Basis Data (Admin)

Semua perubahan **hanya lewat file migrasi baru** di `supabase/migrations/`. Jangan mengedit migrasi yang sudah di-push dan jangan mengubah skema lewat dashboard Supabase tanpa mencatat migrasi.

- **Status berubah hanya lewat fungsi database** `change_report_status(...)` dan `change_sos_status(...)`. Fungsi ini memeriksa peran, validasi transisi (`prd-admin.md` 7.1 dan 7.3), catatan wajib, lalu menulis `report_status_logs`, `notifications`, dan `audit_logs` dalam satu transaksi.
- **Cabut hak UPDATE langsung** ke kolom status pada `reports` dan `sos_alerts` untuk semua peran klien. Jangan membuat `supabase.from('reports').update({ status })` di kode.
- Skor prioritas dihitung di database lewat `compute_priority(...)`, bukan di client. Hitung ulang saat konfirmasi, verifikasi, atau status berubah.
- Fungsi `SECURITY DEFINER` wajib memakai `set search_path = ''`, memakai nama skema lengkap, dan memeriksa peran di dalam fungsi.
- `audit_logs` hanya dapat di-INSERT lewat fungsi server; tidak ada UPDATE atau DELETE.
- Laporan dan SOS **tidak pernah dihapus permanen** lewat dashboard. Hanya perubahan status dengan alasan.
- Duplikat digabung dengan status Ditolak (alasan "duplikat") dan kolom `duplicate_of`; konfirmasi dipindahkan ke induk. Jangan menghapus baris.
- Publik membaca data **hanya lewat view `public_reports`**. Jangan menambah akses anon ke tabel `reports`, dan jangan memasukkan `reporter_id` atau data pribadi ke view.
- Kontrol konkurensi: kolom `version` pada `reports`. Pembaruan menyertakan versi terakhir yang dilihat; bila tidak cocok, tolak dan tampilkan banner konflik.
- Hindari `select *` pada tabel besar. Paginasi sisi server 25 baris per halaman. Pastikan indeks GIST dan indeks kolom filter (status, prioritas, waktu) tersedia.
- Uji kebijakan RLS dengan minimal tiga peran: anon, warga, petugas. Jangan melemahkan RLS demi membuat UI jalan.

> Catatan sinkronisasi: `agent.md` bagian 5 menyebut `reports` dapat dibaca publik. Untuk area admin, `prd-admin.md` bagian 9 menetapkan akses publik hanya lewat view `public_reports`. Tanyakan ke developer apakah `agent.md` perlu diperbarui sebelum menyentuh kebijakan RLS `reports`.

---

## 4. Real-time, Alarm, dan Keandalan

- Gunakan **Supabase Realtime** untuk laporan baru, SOS baru, dan perubahan status di dashboard. Hentikan langganan saat komponen dilepas.
- Tampilkan indikator koneksi (Terhubung, Menyambung ulang, Terputus) dan siapkan **polling cadangan tiap 30 detik** bila koneksi terputus.
- Item baru disorot singkat. Jangan menggeser baris yang sedang dibaca; pakai pil "N laporan baru, tampilkan" saat pengguna sedang menggulir.
- **Alarm SOS:** audio tidak boleh diputar otomatis tanpa interaksi. Sediakan tombol "Aktifkan alarm" di awal sesi dan kontrol bisukan. Bunyi 3 kali per SOS baru, bukan berulang tanpa henti. Setiap alarm juga muncul sebagai toast persisten dan diumumkan lewat `aria-live="assertive"`.
- Eskalasi visual bila SOS Baru belum ditanggapi lebih dari 2 menit, dengan ikon dan teks, bukan hanya warna.
- Tombol aksi menampilkan spinner dan dinonaktifkan sampai selesai agar tidak terkirim dua kali.

---

## 5. Aturan UI Admin

- Ikuti `design.md` dan `design-admin.md`. **Dokumen admin menang** bila ada pertentangan di area admin.
- Tombol dan teks oranye di admin memakai `primary-action` / `primary-text` (kontras 4,5:1), **bukan** `#EF6806` mentah. `#EF6806` hanya untuk ikon, garis, indikator, fokus ring, dan pin.
- Token baru dari `design-admin.md` bagian 2 ditambahkan ke `tailwind.config.ts` **hanya setelah persetujuan developer**. Jangan menulis hex baru di luar token.
- Prioritas dan status selalu memakai **warna, ikon, dan teks sekaligus**. Pin peta memuat ikon jenis bencana.
- Aksi yang mengubah status, peran, atau membuka kontak pelapor memakai dialog konfirmasi. Catatan wajib divalidasi untuk Ditolak dan Selesai, dengan pesan galat sesuai `design-admin.md` bagian 6.
- Wajib ada state memuat (skeleton), kosong, galat, terputus, dan konflik data.
- Tata letak desktop dahulu (1280 px), tablet 768 px dapat dipakai, ponsel 360 px minimal untuk Monitor SOS dan Detail Laporan.
- Tanpa emoji. Ikon dari `lucide-react`.
- Kontrol peta di kiri atas, atribusi OpenStreetMap selalu terlihat.
- Teks UI Bahasa Indonesia lugas, tombol berupa kata kerja, tanpa tanda seru.

---

## 6. Struktur Berkas Admin

Gunakan struktur berikut di dalam struktur `agent.md` bagian 3. Jangan mengubah struktur yang sudah ada tanpa persetujuan.

```
src/
├── app/admin/
│   ├── layout.tsx            # sidebar, topbar, pemeriksaan peran di server
│   ├── page.tsx              # /admin  (Ringkasan)
│   ├── laporan/
│   │   ├── page.tsx          # daftar laporan
│   │   └── [id]/page.tsx     # detail dan tindak lanjut
│   ├── sos/page.tsx          # Monitor SOS
│   ├── peta/page.tsx         # Peta Operasional
│   ├── statistik/page.tsx
│   ├── pengguna/page.tsx     # menunggu keputusan K-1
│   └── audit/page.tsx        # menunggu keputusan K-1
├── components/admin/
│   ├── layout/               # AdminSidebar, AdminTopbar, ConnectionIndicator, SimulationBadge
│   ├── ringkasan/            # StatCard, AttentionList
│   ├── laporan/              # ReportTable, ReportFilters, ReportActions, StatusDialog
│   ├── sos/                  # SosList, SosCard, AlarmControl
│   ├── peta/                 # OperationalMap
│   └── common/               # PriorityBadge, ConflictBanner, ConfirmDialog, NoteField
├── lib/admin/
│   ├── queries.ts            # query laporan, SOS, statistik (paginasi sisi server)
│   ├── actions.ts            # server action: ubah status, tugaskan, buka kontak
│   ├── realtime.ts           # langganan Supabase Realtime
│   └── permissions.ts        # pemeriksaan peran di server
supabase/migrations/          # file migrasi baru untuk tabel dan fungsi admin
```

---

## 7. Konvensi Kode (Tambahan)

- Halaman admin adalah **Server Component** untuk pengambilan data dan otorisasi; bagian interaktif (tabel real-time, alarm, peta) memakai `"use client"`.
- Mutasi lewat **server action** atau route handler yang memanggil fungsi database, bukan menulis langsung dari client.
- Validasi input di client dan server dengan `zod` (minta persetujuan bila `zod` belum terpasang).
- Jangan menyimpan atau mencatat data pribadi pelapor ke `console.log`.
- Komentar hanya untuk keputusan yang tidak jelas, misalnya alasan aturan bisnis.
- Waktu ditampilkan dengan format `27 Okt 2026, 14.05 WIB`, waktu relatif di daftar, durasi SOS `02:15`.

---

## 8. Alur Kerja Perubahan Admin

Mengikuti `agent.md` bagian 1.1, 1.2, dan 8, dengan tambahan:

1. Sebutkan **ID kebutuhan** yang dikerjakan (contoh: `FR-AD-11`) di rencana dan pesan commit.
2. Jika perubahan menyentuh basis data, rencana harus memuat: nama file migrasi, objek yang berubah, dan dampak pada RLS.
3. Sebelum push: `npm run lint` dan `npm run build` lolos, dan perubahan basis data sudah diuji pada skenario peran berbeda.
4. Contoh pesan commit:
   - `feat(admin): tambah tabel daftar laporan (FR-AD-05)`
   - `feat(db): tambah fungsi change_report_status (FR-AD-11)`
   - `style(admin): sesuaikan badge prioritas dengan design-admin.md`

### Format laporan setelah bekerja

```
Selesai: <ringkasan satu kalimat>
Kebutuhan: <ID FR-AD yang dikerjakan>
File diubah: <daftar file, termasuk migrasi bila ada>
Commit: <hash atau pesan commit> (sudah di-push)
Cara cek: <langkah singkat, sebutkan peran yang dipakai untuk menguji>
Catatan/saran (tidak dikerjakan): <opsional>
```

---

## 9. Daftar Periksa Agent Admin

- [ ] Rencana sudah disetujui developer sebelum mengubah file
- [ ] Hanya menyentuh area admin dan objek yang diminta
- [ ] Tidak memutuskan K-1 sampai K-5 tanpa persetujuan
- [ ] Otorisasi diperiksa di server (halaman dan aksi), bukan hanya menu
- [ ] Status berubah hanya lewat fungsi database; UPDATE langsung tidak dipakai
- [ ] Perubahan basis data lewat file migrasi baru; RLS tidak dilemahkan
- [ ] Setiap mutasi menghasilkan satu baris `audit_logs`
- [ ] Tidak ada data pribadi pelapor di daftar, peta, ekspor, atau log
- [ ] Tidak ada rahasia atau `service_role` di client maupun commit
- [ ] UI memakai `primary-action` untuk tombol berteks putih; tidak ada hex baru
- [ ] Prioritas dan status memakai warna, ikon, dan teks; tanpa emoji
- [ ] State memuat, kosong, galat, terputus, dan konflik tersedia
- [ ] Lencana "Simulasi" tetap terlihat
- [ ] Alarm bisa diaktifkan, dibisukan, dan tidak berulang tanpa batas
- [ ] `lint` dan `build` lolos; sudah di-commit dan di-push
- [ ] Donasi tidak disentuh; laporan hasil kerja diberikan ke developer

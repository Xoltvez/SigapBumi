# SIGAP-BUMI — AI Disaster Image Verification (starter)

Starter feature untuk Next.js App Router (Vercel). Mengklasifikasi relevansi visual foto, kemudian mencocokkannya dengan kategori pelaporan. **Ini bukan verifikasi kejadian, lokasi, tanggal, atau keaslian foto.**

## 1. Instal

Di direktori project Next.js yang sudah ada:

```bash
npm install @google/genai zod@^4 file-type
```

Copy berkas:

- `app/api/verify-disaster/route.ts` → path yang sama di project (atau `src/app/api/verify-disaster/route.ts` bila project memakai `src/`).
- `components/DisasterPhotoVerifier.tsx` → path komponen project.

Buat `.env.local` dari `.env.example`. Dapatkan `GEMINI_API_KEY` pada https://aistudio.google.com/apikey. Masukkan environment variable yang sama di Vercel (Production dan Preview jika diperlukan). Jangan commit `.env.local`.

Model default yang dicontohkan ialah `gemini-3.8-flash`. Jika akses akun berbeda, pilih model multimodal terbaru yang tersedia dan mendukung structured outputs, lalu isi `GEMINI_MODEL`.

## 2. Pakai di halaman Next.js

```tsx
import { DisasterPhotoVerifier } from "@/components/DisasterPhotoVerifier";

export default function ReportPage() {
  return <DisasterPhotoVerifier />;
}
```

Jika halaman sudah memiliki flow submit laporan, gunakan callback `onPassed` untuk meneruskan file dan kategori ke flow Anda. **Jangan pernah mempercayai hasil pemeriksaan di client sebagai bukti lolos pada endpoint final**; endpoint final wajib melakukan verifikasi ulang atau menggunakan token keputusan yang disimpan secara server-side, dikaitkan ke hash berkas + user + masa berlaku.

## 3. Konvensi kategori

- `banjir_tsunami`: menerima bukti visual banjir atau tsunami; tidak dapat memastikan penyebab air hanya dari satu foto.
- `gempa`: menerima indikasi kerusakan struktur sebagai relevansi visual, **bukan bukti bahwa gempa adalah penyebabnya**.
- `lainnya`: menerima longsor, kebakaran, erupsi, atau cuaca ekstrem. Kasus lain diarahkan ke review.

Sesuaikan label dengan skema kategori aktual project. Untuk kategori `lainnya`, direkomendasikan menambahkan `subkategori` di form produksi agar tidak terlalu luas.

## 4. Keputusan dan perlindungan laporan darurat

- `lolos_foto`: foto menunjukkan indikasi visual yang relevan dengan kategori; laporan kejadian tetap perlu verifikasi lanjutan.
- `ditolak`: foto jelas tidak terkait bencana atau kategori tidak cocok. Tampilkan alasan dan izinkan memilih ulang kategori/unggah ulang.
- `perlu_review`: indikasi tidak pasti; jangan menghalangi pelaporan darurat. Buat alur pengajuan untuk moderasi petugas.

Bila API gagal, tampilkan opsi pengajuan manual/pending. Komponen ini menampilkan pesan tersebut, tetapi **jalur pengajuan pending harus dihubungkan ke sistem pelaporan project oleh developer**.

## 5. Keamanan untuk integrasi produksi

1. Tambahkan autentikasi, rate limiting per user/IP, CAPTCHA dan logging audit; endpoint demo ini belum memiliki rate limit.
2. Validasi ulang berkas & kategori pada endpoint final. Lindungi foto asli di private storage; batasi retensi.
3. Gunakan file sniffing (starter sudah memakai `file-type`) dan pembatasan ukuran file (starter: 3MB); pertimbangkan normalisasi gambar dan batas dimensi.
4. Foto terindikasi dibuat AI, screenshot, foto lama, atau foto lokasi lain tidak dapat dipastikan hanya dengan vision classification. Tambahkan duplicate perceptual hashing, metadata yang ditandai 'tidak tepercaya', waktu/lokasi yang dikirim user, bukti pendukung, dan moderasi.
5. Jangan menampilkan status `kejadian terverifikasi` hanya karena `lolos_foto`.
6. Evaluasi dengan data berlabel nyata, termasuk negative examples dan kasus mirip, sebelum menetapkan kebijakan auto-reject. Ukur precision/recall per kategori dan false rejection untuk kasus bencana sungguhan.

## 6. Batasan platform

Vercel request-body default 4.5MB. Sejak 20 November 2026 tersedia opt-in public beta untuk 20MiB dengan persyaratan khusus; starter ini sengaja membatasi berkas sampai 3MB agar tidak perlu mengaktifkan beta. Compress image di browser bila diperlukan.

## 7. Referensi

- https://ai.google.dev/gemini-api/docs/image-understanding
- https://ai.google.dev/gemini-api/docs/structured-output
- https://vercel.com/docs/errors/function_payload_too_large
- https://vercel.com/changelog/vercel-functions-now-support-request-bodies-up-to-20mib

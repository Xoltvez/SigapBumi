import React from "react";
import Link from "next/link";
import { Lock } from "lucide-react";
import { LegalDocument, type LegalSection } from "@/components/legal/LegalDocument";

export const metadata = {
  title: "Kebijakan Privasi - SigapBumi",
  description:
    "Bagaimana SigapBumi mengumpulkan, menggunakan, dan melindungi data pribadi pengguna.",
};

const SECTIONS: LegalSection[] = [
  {
    id: "pendahuluan",
    title: "Pendahuluan",
    content: (
      <p>
        SigapBumi menghargai privasi Anda. Kebijakan ini menjelaskan data apa yang kami kumpulkan, untuk apa data tersebut digunakan, dan bagaimana kami melindunginya, sejalan dengan Undang-Undang Nomor 27 Tahun 2022 tentang Pelindungan Data Pribadi (UU PDP).
      </p>
    ),
  },
  {
    id: "data",
    title: "Data yang Kami Kumpulkan",
    content: (
      <>
        <p><strong>Data yang Anda berikan:</strong></p>
        <ul>
          <li>Nama lengkap, nomor telepon, dan email saat mendaftar atau mengirim laporan.</li>
          <li>Isi laporan: jenis bencana, deskripsi, alamat, wilayah administratif, dan kebutuhan mendesak.</li>
          <li>Foto atau video kejadian yang Anda unggah.</li>
        </ul>
        <p><strong>Data yang dikumpulkan secara otomatis:</strong></p>
        <ul>
          <li>Lokasi GPS perangkat saat Anda mengirim laporan atau sinyal SOS (hanya dengan izin Anda).</li>
          <li>Data teknis dasar seperti jenis peramban dan waktu akses untuk keperluan keamanan.</li>
          <li>Kode pelacakan laporan yang disimpan di penyimpanan lokal peramban Anda.</li>
        </ul>
      </>
    ),
  },
  {
    id: "penggunaan",
    title: "Penggunaan Data",
    content: (
      <>
        <p>Data Anda digunakan untuk:</p>
        <ul>
          <li>Memverifikasi dan menindaklanjuti laporan bencana serta sinyal SOS.</li>
          <li>Menghubungi Anda bila petugas memerlukan informasi tambahan.</li>
          <li>Mengirim notifikasi perkembangan status laporan.</li>
          <li>Menyusun peta sebaran dan statistik bencana secara agregat.</li>
          <li>Mencegah penyalahgunaan seperti laporan palsu atau duplikat.</li>
        </ul>
        <p>Kami <strong>tidak menjual</strong> data pribadi Anda kepada pihak mana pun.</p>
      </>
    ),
  },
  {
    id: "berbagi",
    title: "Pembagian Data",
    content: (
      <>
        <p>Data dapat dibagikan secara terbatas kepada:</p>
        <ul>
          <li><strong>Instansi penanggulangan bencana</strong> (BNPB, BPBD, BASARNAS, Damkar, layanan medis, dan kepolisian) untuk keperluan penanganan.</li>
          <li><strong>Penyedia infrastruktur</strong> seperti layanan basis data dan penyimpanan berkas yang memproses data atas nama kami.</li>
          <li><strong>Publik</strong>, hanya berupa informasi laporan yang telah diverifikasi (jenis bencana, lokasi umum, status) tanpa nama dan nomor telepon pelapor.</li>
          <li><strong>Aparat penegak hukum</strong> apabila diwajibkan oleh peraturan perundang-undangan.</li>
        </ul>
      </>
    ),
  },
  {
    id: "lokasi",
    title: "Data Lokasi",
    content: (
      <p>
        Akses lokasi hanya diminta saat Anda membuat laporan atau menekan tombol SOS. Anda dapat menolak atau mencabut izin lokasi melalui pengaturan peramban, namun hal ini dapat menghambat petugas menemukan lokasi kejadian dengan cepat.
      </p>
    ),
  },
  {
    id: "penyimpanan",
    title: "Penyimpanan & Keamanan",
    content: (
      <ul>
        <li>Data disimpan pada server terenkripsi dengan kontrol akses berbasis peran: hanya petugas berwenang yang dapat melihat identitas pelapor.</li>
        <li>Setiap tindakan petugas terhadap laporan dicatat dalam log audit.</li>
        <li>Data laporan disimpan selama diperlukan untuk penanganan, pelaporan, dan evaluasi kebencanaan, kemudian dianonimkan atau dihapus.</li>
      </ul>
    ),
  },
  {
    id: "hak",
    title: "Hak Anda",
    content: (
      <>
        <p>Sesuai UU PDP, Anda berhak untuk:</p>
        <ul>
          <li>Mengakses dan memperoleh salinan data pribadi Anda.</li>
          <li>Memperbaiki data yang tidak akurat.</li>
          <li>Meminta penghapusan akun dan data pribadi, kecuali yang wajib disimpan untuk kepentingan penanganan bencana atau hukum.</li>
          <li>Menarik kembali persetujuan pemrosesan data.</li>
        </ul>
        <p>
          Ajukan permintaan melalui <a href="mailto:kontak@sigapbumi.id">kontak@sigapbumi.id</a>.
        </p>
      </>
    ),
  },
  {
    id: "anak",
    title: "Privasi Anak",
    content: (
      <p>
        Layanan ini tidak ditujukan untuk anak di bawah 17 tahun tanpa pendampingan orang tua atau wali. Namun, dalam keadaan darurat, siapa pun tetap dapat mengirim laporan atau sinyal SOS.
      </p>
    ),
  },
  {
    id: "perubahan",
    title: "Perubahan Kebijakan",
    content: (
      <p>
        Kebijakan ini dapat diperbarui untuk menyesuaikan perkembangan layanan atau regulasi. Lihat juga{" "}
        <Link href="/syarat-ketentuan">Syarat &amp; Ketentuan</Link> yang berlaku.
      </p>
    ),
  },
  {
    id: "kontak",
    title: "Hubungi Kami",
    content: (
      <p>
        Pertanyaan atau keluhan terkait privasi dapat dikirim ke{" "}
        <a href="mailto:kontak@sigapbumi.id">kontak@sigapbumi.id</a>.
      </p>
    ),
  },
];

export default function KebijakanPrivasiPage() {
  return (
    <LegalDocument
      title="Kebijakan Privasi"
      intro="Data yang Anda kirim melalui SigapBumi membantu petugas menyelamatkan nyawa. Kami berkomitmen menggunakannya hanya untuk penanganan bencana dan menjaganya dengan aman."
      updatedAt="22 November 2026"
      icon={Lock}
      sections={SECTIONS}
      related={{ href: "/syarat-ketentuan", label: "Baca Syarat & Ketentuan" }}
    />
  );
}

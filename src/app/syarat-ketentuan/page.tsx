import React from "react";
import Link from "next/link";
import { FileText } from "lucide-react";
import { LegalDocument, type LegalSection } from "@/components/legal/LegalDocument";

export const metadata = {
  title: "Syarat & Ketentuan - SigapBumi",
  description:
    "Syarat dan ketentuan penggunaan platform pelaporan dan tanggap bencana SigapBumi.",
};

const SECTIONS: LegalSection[] = [
  {
    id: "penerimaan",
    title: "Penerimaan Ketentuan",
    content: (
      <p>
        Dengan mengakses atau menggunakan SigapBumi, Anda menyatakan telah membaca, memahami, dan menyetujui Syarat &amp; Ketentuan ini beserta{" "}
        <Link href="/kebijakan-privasi">Kebijakan Privasi</Link> kami. Jika Anda tidak menyetujui sebagian atau seluruh ketentuan, mohon untuk tidak menggunakan layanan ini.
      </p>
    ),
  },
  {
    id: "layanan",
    title: "Deskripsi Layanan",
    content: (
      <>
        <p>SigapBumi adalah platform digital yang membantu masyarakat dan petugas dalam:</p>
        <ul>
          <li>Melaporkan kejadian bencana beserta lokasi, foto, dan kebutuhan mendesak.</li>
          <li>Melacak status penanganan laporan menggunakan kode pelacakan.</li>
          <li>Mengirim sinyal darurat (SOS) ke petugas yang bertugas.</li>
          <li>Melihat peta bencana, peringatan cuaca, fasilitas posko, dan materi edukasi kebencanaan.</li>
        </ul>
        <p>
          <strong>SigapBumi bukan pengganti layanan darurat resmi.</strong> Dalam kondisi yang mengancam jiwa, segera hubungi{" "}
          <Link href="/kontak-darurat">Nomor Darurat 112</Link> atau instansi terkait.
        </p>
      </>
    ),
  },
  {
    id: "akun",
    title: "Akun Pengguna",
    content: (
      <ul>
        <li>Sebagian fitur dapat digunakan tanpa akun, namun fitur tertentu (misalnya riwayat laporan) memerlukan pendaftaran.</li>
        <li>Anda wajib memberikan informasi yang benar dan menjaga kerahasiaan kredensial akun Anda.</li>
        <li>Anda bertanggung jawab atas seluruh aktivitas yang terjadi melalui akun Anda.</li>
        <li>Akun petugas hanya diberikan kepada personel yang ditunjuk oleh instansi berwenang dan tidak boleh dipindahtangankan.</li>
      </ul>
    ),
  },
  {
    id: "kewajiban",
    title: "Kewajiban Pelapor",
    content: (
      <>
        <p>Saat mengirim laporan atau sinyal SOS, Anda setuju untuk:</p>
        <ul>
          <li>Hanya melaporkan kejadian yang benar-benar terjadi dan Anda saksikan atau ketahui secara langsung.</li>
          <li>Menyertakan lokasi dan deskripsi seakurat mungkin.</li>
          <li>Mengunggah foto atau video asli yang relevan dengan kejadian.</li>
          <li>Menghormati privasi korban, termasuk tidak mengunggah konten yang mempertontonkan korban secara tidak layak.</li>
        </ul>
      </>
    ),
  },
  {
    id: "larangan",
    title: "Penggunaan yang Dilarang",
    content: (
      <>
        <p>Pengguna dilarang untuk:</p>
        <ul>
          <li>Mengirim laporan palsu, hoax, atau sinyal SOS iseng yang dapat mengalihkan sumber daya penanganan darurat.</li>
          <li>Mengunggah konten yang mengandung SARA, pornografi, kekerasan berlebihan, atau melanggar hukum.</li>
          <li>Menyalahgunakan data pribadi pengguna lain yang terlihat di platform.</li>
          <li>Mengganggu, meretas, atau membebani sistem SigapBumi secara sengaja.</li>
        </ul>
        <p>
          Penyebaran informasi bohong dapat dikenai sanksi sesuai Undang-Undang Informasi dan Transaksi Elektronik (UU ITE) dan peraturan perundang-undangan yang berlaku.
        </p>
      </>
    ),
  },
  {
    id: "konten",
    title: "Konten Laporan",
    content: (
      <ul>
        <li>Anda tetap memiliki hak atas konten yang Anda unggah.</li>
        <li>Dengan mengirim laporan, Anda memberikan izin kepada SigapBumi dan instansi penanggulangan bencana untuk menggunakan, menampilkan, dan meneruskan konten tersebut demi keperluan penanganan bencana.</li>
        <li>Laporan yang telah diverifikasi dapat ditampilkan di peta publik dengan data identitas pelapor yang disamarkan.</li>
        <li>Petugas berhak menolak, menggabungkan laporan duplikat, atau menghapus laporan yang melanggar ketentuan.</li>
      </ul>
    ),
  },
  {
    id: "batasan",
    title: "Batasan Tanggung Jawab",
    content: (
      <>
        <p>
          SigapBumi berupaya menyajikan informasi yang akurat, namun data cuaca, peta, dan status laporan bergantung pada sumber pihak ketiga serta kontribusi pengguna. Oleh karena itu:
        </p>
        <ul>
          <li>Layanan disediakan &ldquo;sebagaimana adanya&rdquo; tanpa jaminan ketersediaan tanpa gangguan.</li>
          <li>Kami tidak menjamin waktu respons tertentu atas laporan atau sinyal SOS.</li>
          <li>Kami tidak bertanggung jawab atas kerugian yang timbul dari keputusan yang diambil semata-mata berdasarkan informasi di platform.</li>
        </ul>
      </>
    ),
  },
  {
    id: "penangguhan",
    title: "Penangguhan & Penghentian",
    content: (
      <p>
        Kami berhak membatasi, menangguhkan, atau menghentikan akses pengguna yang melanggar ketentuan ini, termasuk melaporkan pelanggaran serius kepada aparat penegak hukum.
      </p>
    ),
  },
  {
    id: "perubahan",
    title: "Perubahan Ketentuan",
    content: (
      <p>
        Syarat &amp; Ketentuan ini dapat diperbarui sewaktu-waktu. Perubahan akan ditandai dengan tanggal pembaruan di bagian atas halaman. Dengan tetap menggunakan layanan setelah perubahan, Anda dianggap menyetujui ketentuan yang baru.
      </p>
    ),
  },
  {
    id: "hukum",
    title: "Hukum yang Berlaku",
    content: (
      <p>
        Ketentuan ini diatur dan ditafsirkan berdasarkan hukum Negara Kesatuan Republik Indonesia. Setiap perselisihan akan diupayakan diselesaikan secara musyawarah terlebih dahulu.
      </p>
    ),
  },
  {
    id: "kontak",
    title: "Hubungi Kami",
    content: (
      <p>
        Pertanyaan mengenai ketentuan ini dapat dikirim ke{" "}
        <a href="mailto:kontak@sigapbumi.id">kontak@sigapbumi.id</a>.
      </p>
    ),
  },
];

export default function SyaratKetentuanPage() {
  return (
    <LegalDocument
      title="Syarat & Ketentuan"
      intro="Ketentuan berikut mengatur penggunaan platform SigapBumi oleh warga, relawan, dan petugas. Mohon dibaca dengan saksama sebelum mengirim laporan atau menggunakan fitur lainnya."
      updatedAt="22 November 2026"
      icon={FileText}
      sections={SECTIONS}
      related={{ href: "/kebijakan-privasi", label: "Baca Kebijakan Privasi" }}
    />
  );
}

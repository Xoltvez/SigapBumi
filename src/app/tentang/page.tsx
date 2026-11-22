import React from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ChevronLeft,
  MapPinned,
  Siren,
  BadgeCheck,
  BarChart3,
  CloudSun,
  Send,
  ShieldCheck,
  Truck,
  CheckCircle2,
  Mail,
  PhoneCall,
} from "lucide-react";

export const metadata = {
  title: "Tentang SigapBumi - Platform Tanggap Bencana Terpadu",
  description:
    "Mengenal SigapBumi: visi, misi, fitur, dan cara kerja platform pelaporan dan tanggap bencana berbasis partisipasi warga.",
};

const FEATURES = [
  {
    icon: Send,
    title: "Pelaporan Bencana",
    description: "Warga melapor kejadian lengkap dengan foto, titik lokasi, dan kebutuhan mendesak dalam hitungan menit.",
  },
  {
    icon: Siren,
    title: "Tombol SOS",
    description: "Sinyal darurat dengan lokasi GPS langsung masuk ke dashboard petugas secara realtime.",
  },
  {
    icon: MapPinned,
    title: "Peta Bencana",
    description: "Sebaran laporan terverifikasi divisualisasikan di peta interaktif berbasis OpenStreetMap.",
  },
  {
    icon: BadgeCheck,
    title: "Verifikasi Warga",
    description: "Konfirmasi dari warga sekitar membantu menyaring laporan palsu dan menentukan prioritas.",
  },
  {
    icon: CloudSun,
    title: "Peringatan Cuaca",
    description: "Informasi peringatan dini cuaca untuk membantu warga bersiap sebelum bencana datang.",
  },
  {
    icon: BarChart3,
    title: "Statistik & Edukasi",
    description: "Data agregat untuk pengambilan keputusan dan materi edukasi kesiapsiagaan bencana.",
  },
];

const STEPS = [
  { icon: Send, title: "Warga Melapor", description: "Kirim laporan atau SOS dan dapatkan kode pelacakan." },
  { icon: ShieldCheck, title: "Petugas Memverifikasi", description: "Laporan dicek, diberi skor prioritas, dan digabung bila duplikat." },
  { icon: Truck, title: "Bantuan Dikirim", description: "Tim terkait dikoordinasikan ke lokasi sesuai kebutuhan." },
  { icon: CheckCircle2, title: "Status Diperbarui", description: "Pelapor memantau perkembangan hingga penanganan selesai." },
];

export default function TentangPage() {
  return (
    <main className="flex-1 w-full max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10 pb-28 md:pb-12 space-y-10">
      {/* Breadcrumb */}
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-soft hover:text-ink transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
        <span>Kembali ke Beranda</span>
      </Link>

      {/* Hero */}
      <section className="bg-[#131722] text-white rounded-lg p-6 md:p-10 grid grid-cols-1 md:grid-cols-12 gap-6 items-center overflow-hidden">
        <div className="md:col-span-8 space-y-4">
          <span className="inline-block text-[11px] font-bold uppercase tracking-wider text-orange-400 bg-orange-500/10 border border-orange-500/30 px-2.5 py-1 rounded">
            Tentang Kami
          </span>
          <h1 className="text-2xl md:text-4xl font-bold leading-tight">
            Menghubungkan warga dan petugas saat setiap detik berarti.
          </h1>
          <p className="text-sm md:text-base text-slate-300 leading-relaxed max-w-2xl">
            SigapBumi adalah platform tanggap bencana terpadu yang mempercepat alur informasi dari lokasi kejadian ke meja koordinasi: mulai dari pelaporan warga, verifikasi, hingga distribusi bantuan.
          </p>
        </div>
        <div className="md:col-span-4 flex justify-center">
          <div className="w-32 h-32 md:w-40 md:h-40 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center p-5">
            <Image
              src="/logo_sigapbumi.png"
              alt="Logo SigapBumi"
              width={120}
              height={120}
              className="object-contain w-full h-auto"
            />
          </div>
        </div>
      </section>

      {/* Latar Belakang */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <div className="space-y-3">
          <h2 className="text-xl md:text-2xl font-bold text-ink">Mengapa SigapBumi?</h2>
          <p className="text-sm text-ink-soft leading-relaxed">
            Indonesia berada di kawasan Cincin Api Pasifik dan menghadapi ribuan kejadian bencana setiap tahun, mulai dari banjir, tanah longsor, gempa bumi, hingga kebakaran hutan dan lahan.
          </p>
          <p className="text-sm text-ink-soft leading-relaxed">
            Di masa tanggap darurat, informasi sering tersebar di banyak kanal, sulit diverifikasi, dan terlambat sampai ke petugas. SigapBumi hadir untuk menyatukan laporan warga dalam satu sistem yang terstruktur, terverifikasi, dan mudah dipantau.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-surface border border-line rounded-lg p-5 shadow-card space-y-2">
            <h3 className="font-bold text-ink">Visi</h3>
            <p className="text-xs text-ink-soft leading-relaxed">
              Mewujudkan masyarakat Indonesia yang tangguh bencana melalui informasi yang cepat, akurat, dan terbuka.
            </p>
          </div>
          <div className="bg-surface border border-line rounded-lg p-5 shadow-card space-y-2">
            <h3 className="font-bold text-ink">Misi</h3>
            <ul className="text-xs text-ink-soft leading-relaxed list-disc pl-4 space-y-1">
              <li>Memudahkan warga melapor kejadian bencana.</li>
              <li>Mempercepat verifikasi dan prioritisasi penanganan.</li>
              <li>Memperkuat koordinasi antarinstansi dan relawan.</li>
              <li>Meningkatkan literasi kesiapsiagaan bencana.</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Fitur */}
      <section className="space-y-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-ink">Apa yang Bisa Dilakukan</h2>
          <p className="text-sm text-ink-soft mt-1">Fitur utama yang tersedia untuk warga dan petugas.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map((feature) => {
            const Icon = feature.icon;
            return (
              <div key={feature.title} className="bg-surface border border-line rounded-lg p-5 shadow-card space-y-2">
                <div className="w-10 h-10 rounded-md bg-primary-soft text-primary flex items-center justify-center">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-ink">{feature.title}</h3>
                <p className="text-xs text-ink-soft leading-relaxed">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Cara Kerja */}
      <section className="space-y-4">
        <h2 className="text-xl md:text-2xl font-bold text-ink">Cara Kerja</h2>
        <ol className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {STEPS.map((step, index) => {
            const Icon = step.icon;
            return (
              <li key={step.title} className="relative bg-surface border border-line rounded-lg p-5 shadow-card space-y-2">
                <span className="absolute top-4 right-4 font-mono text-2xl font-bold text-line-strong">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div className="w-10 h-10 rounded-full bg-ink text-white flex items-center justify-center">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-ink">{step.title}</h3>
                <p className="text-xs text-ink-soft leading-relaxed">{step.description}</p>
              </li>
            );
          })}
        </ol>
      </section>

      {/* CTA & Kontak */}
      <section className="bg-primary-soft border border-primary/20 rounded-lg p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <h2 className="text-lg md:text-xl font-bold text-ink">Melihat kejadian bencana di sekitar Anda?</h2>
          <p className="text-sm text-ink-soft">
            Laporkan sekarang atau hubungi kami di{" "}
            <a href="mailto:kontak@sigapbumi.id" className="inline-flex items-center gap-1 font-semibold text-primary-hover hover:underline">
              <Mail className="w-3.5 h-3.5" />
              kontak@sigapbumi.id
            </a>
          </p>
        </div>
        <div className="flex flex-wrap gap-3 shrink-0">
          <Link
            href="/lapor"
            className="inline-flex items-center gap-2 h-11 px-5 rounded-md bg-primary hover:bg-primary-hover text-white text-sm font-bold transition-colors shadow-sm"
          >
            <Send className="w-4 h-4" />
            Lapor Bencana
          </Link>
          <Link
            href="/kontak-darurat"
            className="inline-flex items-center gap-2 h-11 px-5 rounded-md bg-surface border border-line hover:bg-surface-hover text-ink text-sm font-bold transition-colors"
          >
            <PhoneCall className="w-4 h-4" />
            Kontak Darurat
          </Link>
        </div>
      </section>
    </main>
  );
}

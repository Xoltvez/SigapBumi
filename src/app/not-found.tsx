import type { Metadata } from "next";
import Link from "next/link";
import { Home, MapPin, FileText, BookOpen, Phone, Compass } from "lucide-react";
import { BackButton404 } from "@/components/common/BackButton404";

export const metadata: Metadata = {
  title: "404 - Halaman Tidak Ditemukan | SigapBumi",
  description: "Halaman yang Anda cari tidak tersedia atau sudah dipindahkan.",
};

const quickLinks = [
  { href: "/peta", label: "Peta Bencana", desc: "Pantau kejadian terkini", icon: MapPin },
  { href: "/lapor", label: "Lapor Bencana", desc: "Kirim laporan kejadian", icon: FileText },
  { href: "/edukasi", label: "Edukasi", desc: "Panduan siaga bencana", icon: BookOpen },
  { href: "/kontak-darurat", label: "Kontak Darurat", desc: "Nomor penting & posko", icon: Phone },
];

export default function NotFound() {
  return (
    <main className="flex-1 w-full px-4 py-12 md:py-20">
      <div className="max-w-[720px] mx-auto flex flex-col items-center text-center">
        {/* Ilustrasi: kompas tersesat + garis seismograf */}
        <div className="relative mb-6" aria-hidden="true">
          <div className="absolute inset-0 rounded-full bg-primary/20 blur-2xl scale-125" />
          <div className="relative w-24 h-24 rounded-full bg-primary-soft border-2 border-primary/30 flex items-center justify-center">
            <Compass className="w-12 h-12 text-primary animate-[spin_6s_ease-in-out_infinite]" strokeWidth={1.75} />
          </div>
        </div>

        <p className="text-[80px] md:text-[112px] leading-none font-extrabold tracking-tight bg-gradient-to-br from-orange-500 via-amber-500 to-red-500 bg-clip-text text-transparent select-none">
          404
        </p>

        {/* Garis seismograf dekoratif */}
        <svg
          viewBox="0 0 240 24"
          className="w-48 h-6 my-3 text-primary/60"
          fill="none"
          aria-hidden="true"
        >
          <polyline
            points="0,12 70,12 80,4 90,20 100,2 110,22 120,8 130,16 140,12 240,12"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>

        <h1 className="text-2xl md:text-3xl font-bold text-ink">Halaman Tidak Ditemukan</h1>
        <p className="mt-3 max-w-[460px] text-ink-soft text-sm md:text-base leading-relaxed">
          Sepertinya Anda keluar dari jalur evakuasi. Halaman yang Anda cari tidak tersedia,
          sudah dipindahkan, atau alamatnya salah ketik.
        </p>

        <div className="mt-7 flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 h-11 px-5 rounded-md bg-primary text-white font-semibold text-sm shadow-sm hover:bg-primary-hover active:bg-primary-active active:scale-[0.98]"
          >
            <Home className="w-4 h-4" aria-hidden="true" />
            Ke Beranda
          </Link>
          <BackButton404 />
        </div>

        <div className="mt-12 w-full">
          <p className="text-xs font-semibold uppercase tracking-wider text-ink-muted mb-4">
            Atau coba halaman ini
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
            {quickLinks.map(({ href, label, desc, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="group flex items-center gap-3 p-4 rounded-lg bg-surface border border-line shadow-card hover:border-primary/40 hover:shadow-overlay"
              >
                <span className="w-10 h-10 shrink-0 rounded-md bg-primary-soft text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
                  <Icon className="w-5 h-5" aria-hidden="true" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-ink">{label}</span>
                  <span className="block text-xs text-ink-soft truncate">{desc}</span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}

"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  MapPin,
  Mail,
  Phone,
  Send,
  ShieldCheck,
} from "lucide-react";

function InstagramIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

function TikTokIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.298-.002.595.042.88.13V9.4a6.33 6.33 0 0 0-1-.08A6.34 6.34 0 0 0 3 15.66a6.34 6.34 0 0 0 10.82 4.5 6.3 6.3 0 0 0 1.87-4.49V8.65a8.28 8.28 0 0 0 4.9 1.58V6.78a4.85 4.85 0 0 1-1-.09z"/>
    </svg>
  );
}

export function Footer() {
  const pathname = usePathname();

  // Jangan tampilkan footer di area dashboard admin
  if (pathname.startsWith("/admin")) {
    return null;
  }

  return (
    <footer className="w-full bg-[#EA580C] text-white">
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-8">
        {/* Main Grid: Brand, Menu, Layanan, Kontak */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-10">
          {/* Kolom 1: Brand & Keterangan Singkat (4 Cols) */}
          <div className="lg:col-span-4 space-y-4">
            <Link href="/" className="inline-flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-lg bg-white p-1 flex items-center justify-center shadow-sm">
                <Image
                  src="/logo_sigapbumi.png"
                  alt="Logo SigapBumi"
                  width={32}
                  height={32}
                  className="object-contain h-7 w-auto"
                />
              </div>
              <span className="text-xl font-bold tracking-tight text-white">
                SigapBumi.
              </span>
            </Link>

            <p className="text-xs sm:text-sm text-white/85 leading-relaxed max-w-sm">
              SigapBumi adalah solusi digital yang membantu Anda secara terstruktur dalam mewujudkan pelaporan bencana, tanggap darurat posko, verifikasi data warga, dan koordinasi bantuan.
            </p>
          </div>

          {/* Kolom 2: Menu (2 Cols) */}
          <div className="lg:col-span-2 space-y-3">
            <h3 className="text-sm font-bold text-white tracking-wide">
              Menu
            </h3>
            <ul className="space-y-2 text-xs sm:text-sm text-white/85 font-medium">
              <li>
                <Link href="/" className="hover:text-white hover:underline transition-colors">
                  Beranda
                </Link>
              </li>
              <li>
                <Link href="/peta" className="hover:text-white hover:underline transition-colors">
                  Peta Bencana
                </Link>
              </li>
              <li>
                <Link href="/lacak" className="hover:text-white hover:underline transition-colors">
                  Lacak Laporan
                </Link>
              </li>
              <li>
                <Link href="/statistik" className="hover:text-white hover:underline transition-colors">
                  Statistik
                </Link>
              </li>
              <li>
                <Link href="/edukasi" className="hover:text-white hover:underline transition-colors">
                  Edukasi
                </Link>
              </li>
            </ul>
          </div>

          {/* Kolom 3: Layanan (3 Cols) */}
          <div className="lg:col-span-3 space-y-3">
            <h3 className="text-sm font-bold text-white tracking-wide">
              Layanan
            </h3>
            <ul className="space-y-2 text-xs sm:text-sm text-white/85 font-medium">
              <li>
                <Link href="/lapor" className="hover:text-white hover:underline transition-colors">
                  Pelaporan Bencana Warga
                </Link>
              </li>
              <li>
                <Link href="/laporan-saya" className="hover:text-white hover:underline transition-colors">
                  Status & Riwayat Laporan
                </Link>
              </li>
              <li>
                <Link href="/cuaca" className="hover:text-white hover:underline transition-colors">
                  Peringatan Dini Cuaca BMKG
                </Link>
              </li>
              <li>
                <Link href="/fasilitas" className="hover:text-white hover:underline transition-colors">
                  Daftar Posko & Rumah Sakit
                </Link>
              </li>
              <li>
                <Link href="/kontak-darurat" className="hover:text-white hover:underline transition-colors">
                  Nomor Darurat Nasional 112
                </Link>
              </li>
            </ul>
          </div>

          {/* Kolom 4: Kontak (3 Cols) */}
          <div className="lg:col-span-3 space-y-3">
            <h3 className="text-sm font-bold text-white tracking-wide">
              Kontak
            </h3>
            <ul className="space-y-2.5 text-xs sm:text-sm text-white/90">
              <li className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-white shrink-0 mt-0.5" />
                <span>Indonesia</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-white shrink-0" />
                <a
                  href="mailto:kontak@sigapbumi.id"
                  className="hover:underline transition-colors"
                >
                  kontak@sigapbumi.id
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-white shrink-0" />
                <a
                  href="tel:112"
                  className="hover:underline transition-colors"
                >
                  +62 822-3484-1594 (Posko 112)
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <InstagramIcon className="w-4 h-4 text-white shrink-0" />
                <span className="hover:underline cursor-pointer">
                  @sigapbumi
                </span>
              </li>
              <li className="flex items-center gap-2.5">
                <Send className="w-4 h-4 text-white shrink-0" />
                <span className="hover:underline cursor-pointer">
                  t.me/sigapbumi
                </span>
              </li>
              <li className="flex items-center gap-2.5">
                <TikTokIcon className="w-4 h-4 text-white shrink-0" />
                <span className="hover:underline cursor-pointer">
                  @sigapbumi
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Separator Line */}
        <div className="border-t border-white/20 mt-12 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-white/80">
          <p className="text-center sm:text-left">
            &copy; {new Date().getFullYear()} SigapBumi – Platform Tanggap Bencana Terpadu
          </p>

          <div className="flex items-center gap-4 text-center">
            <span className="hover:text-white cursor-pointer transition-colors">
              Terms &amp; Conditions
            </span>
            <span>&bull;</span>
            <span className="hover:text-white cursor-pointer transition-colors">
              Privacy Policy
            </span>
            <span>&bull;</span>
            <Link
              href="/admin/login"
              className="inline-flex items-center gap-1 hover:text-white font-semibold underline underline-offset-2 transition-colors"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Portal Petugas</span>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

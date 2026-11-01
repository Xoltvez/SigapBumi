"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  MapPin,
  Mail,
  Phone,
  ShieldCheck,
} from "lucide-react";

export function Footer() {
  const pathname = usePathname();

  // Jangan tampilkan footer di area dashboard admin atau peta bencana
  if (pathname.startsWith("/admin") || pathname.startsWith("/peta")) {
    return null;
  }

  return (
    <footer className="w-full bg-[#131722] text-white border-t border-slate-800">
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-8">
        {/* Main Grid: Brand, Menu, Layanan, Kontak */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-10">
          {/* Kolom 1: Brand & Keterangan Singkat (4 Cols) */}
          <div className="lg:col-span-4 space-y-4">
            <Link href="/" className="inline-flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-lg bg-slate-800 border border-slate-700 p-1 flex items-center justify-center shadow-sm">
                <Image
                  src="/logo_sigapbumi.png"
                  alt="Logo SigapBumi"
                  width={32}
                  height={32}
                  className="object-contain h-7 w-auto"
                />
              </div>
              <span className="text-xl font-bold tracking-tight text-white">
                SigapBumi<span className="text-orange-500">.</span>
              </span>
            </Link>

            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-sm">
              SigapBumi adalah solusi digital yang membantu Anda secara terstruktur dalam mewujudkan pelaporan bencana, tanggap darurat posko, verifikasi data warga, dan koordinasi bantuan.
            </p>
          </div>

          {/* Kolom 2: Menu (2 Cols) */}
          <div className="lg:col-span-2 space-y-3">
            <h3 className="text-sm font-bold text-white tracking-wide">
              Menu
            </h3>
            <ul className="space-y-2 text-xs sm:text-sm text-slate-400 font-medium">
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
            <ul className="space-y-2 text-xs sm:text-sm text-slate-400 font-medium">
              <li>
                <Link href="/lapor" className="hover:text-white hover:underline transition-colors">
                  Pelaporan Bencana Warga
                </Link>
              </li>
              <li>
                <Link href="/laporan-saya" className="hover:text-white hover:underline transition-colors">
                  Status &amp; Riwayat Laporan
                </Link>
              </li>
              <li>
                <Link href="/cuaca" className="hover:text-white hover:underline transition-colors">
                  Peringatan Dini Cuaca BMKG
                </Link>
              </li>
              <li>
                <Link href="/fasilitas" className="hover:text-white hover:underline transition-colors">
                  Daftar Posko &amp; Rumah Sakit
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
            <ul className="space-y-2.5 text-xs sm:text-sm text-slate-300">
              <li className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                <span>Indonesia</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-orange-500 shrink-0" />
                <a
                  href="mailto:kontak@sigapbumi.id"
                  className="hover:text-white hover:underline transition-colors"
                >
                  kontak@sigapbumi.id
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-orange-500 shrink-0" />
                <a
                  href="tel:112"
                  className="hover:text-white hover:underline transition-colors"
                >
                  +62 822-3484-1594 (Posko 112)
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Separator Line */}
        <div className="border-t border-slate-800 mt-12 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <p className="text-center sm:text-left">
            &copy; {new Date().getFullYear()} SigapBumi – Platform Tanggap Bencana Terpadu
          </p>

          <div className="flex items-center gap-4 text-center">
            <span className="hover:text-slate-300 cursor-pointer transition-colors">
              Terms &amp; Conditions
            </span>
            <span>&bull;</span>
            <span className="hover:text-slate-300 cursor-pointer transition-colors">
              Privacy Policy
            </span>
            <span>&bull;</span>
            <Link
              href="/admin/login"
              className="inline-flex items-center gap-1 text-orange-400 hover:text-orange-300 font-semibold underline underline-offset-2 transition-colors"
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

"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  PhoneCall,
  MapPin,
  ShieldCheck,
  ExternalLink,
  ChevronRight,
  Flame,
  HeartPulse,
  Compass,
  Radio,
  Building2,
  FileText,
} from "lucide-react";

export function Footer() {
  const pathname = usePathname();

  // Jangan tampilkan footer di area dashboard admin
  if (pathname.startsWith("/admin")) {
    return null;
  }

  return (
    <footer className="relative bg-gradient-to-b from-[#EA580C] via-[#C2410C] to-[#9A3412] text-white overflow-hidden border-t-4 border-amber-400">
      {/* Decorative Background Glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 -right-40 w-96 h-96 rounded-full bg-white/10 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-amber-300/10 blur-3xl"
      />

      <div className="relative max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-24 md:pb-12 space-y-10">
        {/* Baris Atas: Brand Identity & Emergency Quick Dial Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center border-b border-white/20 pb-8">
          {/* Brand Info */}
          <div className="lg:col-span-5 space-y-3">
            <Link href="/" className="inline-flex items-center gap-2.5 group">
              <div className="w-10 h-10 rounded-xl bg-white/95 p-1.5 flex items-center justify-center shadow-md transition-transform group-hover:scale-105">
                <Image
                  src="/logo_sigapbumi.png"
                  alt="Logo SigapBumi"
                  width={36}
                  height={36}
                  style={{ width: "auto", height: "auto" }}
                  className="object-contain h-7"
                />
              </div>
              <span className="text-2xl font-black tracking-tight text-white">
                Sigap<span className="text-amber-200">Bumi</span>
              </span>
            </Link>
            <p className="text-xs sm:text-sm text-white/90 leading-relaxed max-w-md">
              Platform pelaporan bencana terpadu dan tanggap darurat berbasis masyarakat. Cepat, terverifikasi, transparan, dan terhubung langsung ke posko penanggulangan BPBD di seluruh Indonesia.
            </p>
            <div className="flex items-center gap-2 text-xs font-semibold text-amber-100 pt-1">
              <ShieldCheck className="w-4 h-4 text-amber-200" />
              <span>Layanan Terbuka untuk Publik · Bebas Biaya 24 Jam</span>
            </div>
          </div>

          {/* Quick Hotline Direct Dial */}
          <div className="lg:col-span-7">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-100 flex items-center gap-1.5">
                <PhoneCall className="w-3.5 h-3.5" />
                Panggilan Darurat Bebas Pulsa Nasional:
              </span>
              <span className="text-[11px] text-white/80 font-medium">Siaga 24/7</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <a
                href="tel:112"
                className="p-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 transition-all flex flex-col justify-between group"
              >
                <div className="flex items-center justify-between text-[11px] font-bold text-amber-200">
                  <span>Darurat 112</span>
                  <PhoneCall className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                </div>
                <span className="text-xl font-black text-white mt-1">112</span>
                <span className="text-[10px] text-white/80 leading-tight">Posko BPBD & Umum</span>
              </a>

              <a
                href="tel:115"
                className="p-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 transition-all flex flex-col justify-between group"
              >
                <div className="flex items-center justify-between text-[11px] font-bold text-amber-200">
                  <span>SAR Basarnas</span>
                  <PhoneCall className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                </div>
                <span className="text-xl font-black text-white mt-1">115</span>
                <span className="text-[10px] text-white/80 leading-tight">Penyelamatan & Evakuasi</span>
              </a>

              <a
                href="tel:119"
                className="p-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 transition-all flex flex-col justify-between group"
              >
                <div className="flex items-center justify-between text-[11px] font-bold text-amber-200">
                  <span>Medis 119</span>
                  <HeartPulse className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                </div>
                <span className="text-xl font-black text-white mt-1">119</span>
                <span className="text-[10px] text-white/80 leading-tight">Gawat Darurat & Ambulans</span>
              </a>

              <a
                href="tel:113"
                className="p-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 transition-all flex flex-col justify-between group"
              >
                <div className="flex items-center justify-between text-[11px] font-bold text-amber-200">
                  <span>Damkar 113</span>
                  <Flame className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                </div>
                <span className="text-xl font-black text-white mt-1">113</span>
                <span className="text-[10px] text-white/80 leading-tight">Pemadam Kebakaran</span>
              </a>
            </div>
          </div>
        </div>

        {/* Baris Tengah: Tautan Navigasi, Faskes, dan Rujukan Resmi */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-xs">
          {/* Kolom 1: Layanan Utama */}
          <div className="space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-amber-200">
              Layanan Warga
            </h3>
            <ul className="space-y-2">
              <li>
                <Link href="/lapor" className="text-white/85 hover:text-white hover:underline transition-colors flex items-center gap-1">
                  <ChevronRight className="w-3 h-3 text-amber-300" />
                  <span>Laporkan Kejadian Bencana</span>
                </Link>
              </li>
              <li>
                <Link href="/lacak" className="text-white/85 hover:text-white hover:underline transition-colors flex items-center gap-1">
                  <ChevronRight className="w-3 h-3 text-amber-300" />
                  <span>Lacak Progres Laporan</span>
                </Link>
              </li>
              <li>
                <Link href="/peta" className="text-white/85 hover:text-white hover:underline transition-colors flex items-center gap-1">
                  <ChevronRight className="w-3 h-3 text-amber-300" />
                  <span>Peta Sebaran Bencana</span>
                </Link>
              </li>
              <li>
                <Link href="/statistik" className="text-white/85 hover:text-white hover:underline transition-colors flex items-center gap-1">
                  <ChevronRight className="w-3 h-3 text-amber-300" />
                  <span>Statistik & Analitik Posko</span>
                </Link>
              </li>
              <li>
                <Link href="/edukasi" className="text-white/85 hover:text-white hover:underline transition-colors flex items-center gap-1">
                  <ChevronRight className="w-3 h-3 text-amber-300" />
                  <span>Panduan Kesiapsiagaan Mandiri</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Kolom 2: Fasilitas & Mitigasi */}
          <div className="space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-amber-200">
              Fasilitas & Siaga
            </h3>
            <ul className="space-y-2">
              <li>
                <Link href="/cuaca" className="text-white/85 hover:text-white hover:underline transition-colors flex items-center gap-1">
                  <Radio className="w-3 h-3 text-amber-300" />
                  <span>Radar Cuaca & InaTEWS BMKG</span>
                </Link>
              </li>
              <li>
                <Link href="/fasilitas" className="text-white/85 hover:text-white hover:underline transition-colors flex items-center gap-1">
                  <Building2 className="w-3 h-3 text-amber-300" />
                  <span>Fasilitas Kesehatan Terdekat</span>
                </Link>
              </li>
              <li>
                <Link href="/kontak-darurat" className="text-white/85 hover:text-white hover:underline transition-colors flex items-center gap-1">
                  <PhoneCall className="w-3 h-3 text-amber-300" />
                  <span>Direktori Kontak Bebas Pulsa</span>
                </Link>
              </li>
              <li>
                <Link href="/edukasi#tsb" className="text-white/85 hover:text-white hover:underline transition-colors flex items-center gap-1">
                  <FileText className="w-3 h-3 text-amber-300" />
                  <span>Checklist Tas Siaga Bencana</span>
                </Link>
              </li>
              <li>
                <Link href="/daftar" className="text-white/85 hover:text-white hover:underline transition-colors flex items-center gap-1">
                  <ChevronRight className="w-3 h-3 text-amber-300" />
                  <span>Daftar Akun Relawan / Warga</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Kolom 3: Rujukan Instansi Resmi */}
          <div className="space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-amber-200">
              Instansi Penanggulangan
            </h3>
            <ul className="space-y-2">
              <li>
                <a
                  href="https://www.bmkg.go.id"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white/85 hover:text-white hover:underline transition-colors inline-flex items-center gap-1.5"
                >
                  <span>Portal Resmi BMKG</span>
                  <ExternalLink className="w-3 h-3 text-amber-300" />
                </a>
              </li>
              <li>
                <a
                  href="https://bnpb.go.id"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white/85 hover:text-white hover:underline transition-colors inline-flex items-center gap-1.5"
                >
                  <span>Portal Resmi BNPB</span>
                  <ExternalLink className="w-3 h-3 text-amber-300" />
                </a>
              </li>
              <li>
                <a
                  href="https://basarnas.go.id"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white/85 hover:text-white hover:underline transition-colors inline-flex items-center gap-1.5"
                >
                  <span>Portal Resmi BASARNAS</span>
                  <ExternalLink className="w-3 h-3 text-amber-300" />
                </a>
              </li>
              <li>
                <a
                  href="https://kemensos.go.id"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white/85 hover:text-white hover:underline transition-colors inline-flex items-center gap-1.5"
                >
                  <span>Kementerian Sosial RI</span>
                  <ExternalLink className="w-3 h-3 text-amber-300" />
                </a>
              </li>
            </ul>
          </div>

          {/* Kolom 4: Pusat Komando & Evaluasi */}
          <div className="space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-amber-200">
              Akses Petugas & Posko
            </h3>
            <p className="text-[11px] text-white/80 leading-relaxed">
              Pusat komando verifikasi laporan, manajemen logistik bantuan, dan koordinasi tim rescue lapangan.
            </p>
            <div className="pt-1">
              <Link
                href="/admin/login"
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white text-orange-700 hover:bg-amber-100 font-bold text-xs transition-all shadow-sm"
              >
                <Compass className="w-3.5 h-3.5" />
                <span>Masuk Dashboard Petugas</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Baris Bawah: Hak Cipta & Sumpah Transparansi */}
        <div className="pt-8 border-t border-white/20 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-white/80">
          <p>
            &copy; {new Date().getFullYear()} <strong>SigapBumi</strong>. Sistem Pelaporan Tanggap Bencana Terpadu Indonesia. Seluruh hak cipta dilindungi.
          </p>
          <div className="flex items-center gap-4 text-white/90">
            <span>Standar Layanan Publik Terbuka</span>
            <span>&middot;</span>
            <span>Kesiapsiagaan Menyelamatkan Jiwa</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

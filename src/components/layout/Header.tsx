import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Bell, User } from "lucide-react";

export function Header() {
  return (
    <header className="sticky top-0 z-30 h-14 md:h-16 bg-surface border-b border-line px-4 md:px-8">
      <div className="max-w-[1200px] h-full mx-auto flex items-center justify-between">
        {/* Brand Logo */}
        <Link
          href="/"
          className="flex items-center gap-2.5 font-bold text-lg md:text-xl text-ink focus-visible:outline-primary group"
        >
          <div className="relative w-8 h-8 md:w-9 md:h-9 shrink-0 flex items-center justify-center">
            <Image
              src="/logo_sigapbumi.png"
              alt="Logo SigapBumi"
              width={36}
              height={36}
              style={{ width: "auto" }}
              className="object-contain h-8 md:h-9 transition-transform group-hover:scale-105"
              priority
            />
          </div>
          <span>
            Sigap<span className="text-primary">Bumi</span>
          </span>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-ink-soft">
          <Link
            href="/"
            className="hover:text-primary transition-colors focus-visible:outline-primary"
          >
            Beranda
          </Link>
          <Link
            href="/peta"
            className="hover:text-primary transition-colors focus-visible:outline-primary"
          >
            Peta Bencana
          </Link>
          <Link
            href="/lacak"
            className="hover:text-primary transition-colors focus-visible:outline-primary"
          >
            Lacak Laporan
          </Link>
          <Link
            href="/statistik"
            className="hover:text-primary transition-colors focus-visible:outline-primary"
          >
            Statistik
          </Link>
          <Link
            href="/edukasi"
            className="hover:text-primary transition-colors focus-visible:outline-primary"
          >
            Edukasi
          </Link>
        </nav>

        {/* Action / Auth icons */}
        <div className="flex items-center gap-3">
          <Link
            href="/notifikasi"
            aria-label="Notifikasi"
            className="w-10 h-10 rounded-md flex items-center justify-center text-ink-soft hover:bg-bg hover:text-ink transition-colors focus-visible:outline-primary"
          >
            <Bell className="w-5 h-5" />
          </Link>
          <Link
            href="/masuk"
            aria-label="Akun Pengguna"
            className="inline-flex items-center gap-1.5 h-10 px-3.5 rounded-md border border-line text-sm font-medium text-ink hover:border-line-strong hover:bg-bg transition-colors focus-visible:outline-primary"
          >
            <User className="w-4 h-4 text-ink-soft" />
            <span className="hidden sm:inline">Masuk</span>
          </Link>
        </div>
      </div>
    </header>
  );
}

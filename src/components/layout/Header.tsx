"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Bell, User } from "lucide-react";

export function Header() {
  const pathname = usePathname();

  if (pathname.startsWith("/admin")) {
    return null;
  }

  const navLinks = [
    { href: "/", label: "Beranda", exact: true },
    { href: "/peta", label: "Peta Bencana" },
    { href: "/lacak", label: "Lacak Laporan" },
    { href: "/statistik", label: "Statistik" },
    { href: "/edukasi", label: "Edukasi" },
  ];

  const isNotifActive = pathname.startsWith("/notifikasi");
  const isAuthActive = pathname.startsWith("/masuk") || pathname.startsWith("/daftar");

  return (
    <header className="sticky top-0 z-30 h-14 md:h-16 bg-surface/95 backdrop-blur-md border-b border-line px-4 md:px-8 shadow-xs">
      <div className="max-w-[1240px] h-full mx-auto flex items-center justify-between">
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
              style={{ width: "auto", height: "auto" }}
              className="object-contain h-8 md:h-9 transition-transform group-hover:scale-105"
              priority
            />
          </div>
          <span>
            Sigap<span className="text-primary">Bumi</span>
          </span>
        </Link>

        {/* Desktop Navigation Links with Active Highlight */}
        <nav className="hidden md:flex items-center gap-1.5 lg:gap-2 text-sm font-medium">
          {navLinks.map((item) => {
            const isActive = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative px-3.5 py-1.5 rounded-lg text-xs lg:text-sm transition-all focus-visible:outline-primary ${
                  isActive
                    ? "font-bold text-primary bg-primary-soft border border-primary/25 shadow-xs"
                    : "text-ink-soft hover:text-ink hover:bg-bg border border-transparent font-medium"
                }`}
              >
                <span>{item.label}</span>
                {isActive && (
                  <span className="sr-only">(Halaman aktif)</span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Action / Auth */}
        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/notifikasi"
            aria-label="Notifikasi"
            className={`w-9 h-9 md:w-10 md:h-10 rounded-lg flex items-center justify-center transition-all focus-visible:outline-primary ${
              isNotifActive
                ? "bg-primary-soft text-primary border border-primary/25 shadow-xs font-bold"
                : "text-ink-soft hover:bg-bg hover:text-ink border border-transparent"
            }`}
          >
            <Bell className="w-4 h-4 md:w-5 md:h-5" />
          </Link>

          <Link
            href="/masuk"
            aria-label="Akun Pengguna"
            className={`inline-flex items-center gap-1.5 h-9 md:h-10 px-3 md:px-3.5 rounded-lg text-xs md:text-sm transition-all focus-visible:outline-primary ${
              isAuthActive
                ? "border-2 border-primary bg-primary-soft text-primary font-bold shadow-xs"
                : "border border-line font-medium text-ink hover:border-line-strong hover:bg-bg"
            }`}
          >
            <User className={`w-4 h-4 ${isAuthActive ? "text-primary" : "text-ink-soft"}`} />
            <span className="hidden sm:inline">Masuk</span>
          </Link>
        </div>
      </div>
    </header>
  );
}

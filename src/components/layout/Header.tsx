"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  Bell,
  User,
  ChevronDown,
  Clock,
  PlusCircle,
  LogOut,
  CheckCircle2,
} from "lucide-react";
import {
  getCurrentUser,
  subscribeToAuth,
  logoutUser,
  UserSession,
} from "@/lib/auth";

export function Header() {
  const pathname = usePathname();
  const [currentUser, setCurrentUser] = useState<UserSession | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCurrentUser(getCurrentUser());
    const unsubscribe = subscribeToAuth((user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }
    if (isMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMenuOpen]);

  const handleLogout = () => {
    logoutUser();
    setIsMenuOpen(false);
  };

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
    <header className="sticky top-0 z-30 h-14 md:h-16 bg-surface/95 backdrop-blur-md border-b border-line shadow-xs">
      <div className="max-w-[1240px] h-full mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
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
                className={`px-3 py-1.5 text-xs lg:text-sm transition-colors focus-visible:outline-primary ${
                  isActive
                    ? "font-bold text-primary"
                    : "text-ink-soft hover:text-primary font-medium"
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
        <div className="flex items-center gap-2 sm:gap-2.5">
          <Link
            href="/notifikasi"
            aria-label="Notifikasi"
            className={`w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-lg flex items-center justify-center transition-colors focus-visible:outline-primary ${
              isNotifActive
                ? "text-primary"
                : "text-ink-soft hover:text-primary hover:bg-bg"
            }`}
          >
            <Bell className="w-4 h-4 md:w-5 md:h-5" />
          </Link>

          {currentUser ? (
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="flex items-center gap-2 h-8 sm:h-9 md:h-10 px-2 sm:px-2.5 rounded-lg border border-primary/25 bg-primary-soft/40 hover:bg-primary-soft text-ink transition-all text-xs font-semibold focus-visible:outline-primary cursor-pointer"
                aria-label="Menu Akun Warga"
              >
                <div className="relative">
                  <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-primary text-white flex items-center justify-center text-[10px] sm:text-xs font-bold uppercase">
                    {currentUser.full_name?.charAt(0) || "W"}
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-success ring-1 ring-surface" />
                </div>
                <div className="hidden sm:flex flex-col text-left leading-tight">
                  <span className="text-xs font-bold text-ink max-w-[90px] truncate">
                    {currentUser.full_name?.split(" ")[0]}
                  </span>
                  <span className="text-[10px] text-primary font-medium">
                    Warga Aktif
                  </span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-ink-soft hidden sm:inline" />
              </button>

              {/* Dropdown Menu */}
              {isMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-surface border border-line rounded-xl shadow-card py-2 z-50 text-xs">
                  <div className="px-3.5 py-2 border-b border-line">
                    <p className="font-bold text-ink truncate">{currentUser.full_name}</p>
                    <p className="text-[11px] text-ink-muted truncate">{currentUser.email}</p>
                    <span className="inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded text-[10px] font-bold bg-success-soft text-success">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Sedang Masuk</span>
                    </span>
                  </div>
                  <Link
                    href="/laporan-saya"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center gap-2 px-3.5 py-2.5 text-ink hover:bg-bg font-medium transition-colors"
                  >
                    <Clock className="w-4 h-4 text-ink-soft" />
                    <span>Riwayat Laporan Saya</span>
                  </Link>
                  <Link
                    href="/lapor"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center gap-2 px-3.5 py-2.5 text-ink hover:bg-bg font-medium transition-colors"
                  >
                    <PlusCircle className="w-4 h-4 text-ink-soft" />
                    <span>Kirim Laporan Baru</span>
                  </Link>
                  <div className="border-t border-line mt-1 pt-1">
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-3.5 py-2.5 text-danger hover:bg-danger-soft font-semibold text-left transition-colors cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Keluar Akun</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/masuk"
              aria-label="Akun Pengguna"
              className={`inline-flex items-center gap-1.5 h-8 sm:h-9 md:h-10 px-2.5 sm:px-3 md:px-3.5 rounded-lg text-xs md:text-sm transition-all focus-visible:outline-primary ${
                isAuthActive
                  ? "border-2 border-primary bg-primary-soft text-primary font-bold shadow-xs"
                  : "border border-line font-medium text-ink hover:border-line-strong hover:bg-bg"
              }`}
            >
              <User className={`w-4 h-4 ${isAuthActive ? "text-primary" : "text-ink-soft"}`} />
              <span className="hidden sm:inline">Masuk</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

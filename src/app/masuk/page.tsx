"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  ArrowRight,
  ChevronLeft,
  Eye,
  EyeOff,
} from "lucide-react";

export default function MasukPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    router.push("/laporan-saya");
  };

  return (
    <main className="flex-1 w-full max-w-[480px] mx-auto px-4 py-8 md:py-16 pb-28 md:pb-16">
      <div className="bg-surface border border-line rounded-lg p-6 md:p-8 shadow-card space-y-6">
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-soft hover:text-ink mb-4 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Kembali ke Beranda</span>
          </Link>
          <h1 className="text-2xl font-bold text-ink">Masuk ke SigapBumi</h1>
          <p className="text-xs text-ink-soft mt-1">
            Akses pelacakan laporan bencana warga dan informasi penanganan terkini.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          <div>
            <label className="block text-xs font-semibold text-ink mb-1.5">
              Alamat Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nama@email.com"
              className="w-full h-11 px-3.5 rounded-md border border-line bg-surface text-sm text-ink focus:border-primary focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink mb-1.5">
              Kata Sandi
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full h-11 pl-3.5 pr-10 rounded-md border border-line bg-surface text-sm text-ink focus:border-primary focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-soft hover:text-ink transition-colors p-1"
                aria-label={showPassword ? "Sembunyikan kata sandi" : "Lihat kata sandi"}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full h-11 rounded-md bg-primary hover:bg-primary-hover text-white text-sm font-semibold transition-colors shadow-sm"
          >
            Masuk
          </button>

          <div className="text-center pt-1">
            <p className="text-xs text-ink-soft">
              Belum memiliki akun warga?{" "}
              <Link href="/daftar" className="font-bold text-primary hover:underline">
                Daftar Akun Baru
              </Link>
            </p>
          </div>
        </form>

        {/* Portal Petugas Link */}
        <div className="pt-4 border-t border-line space-y-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-primary" />
            <span className="text-xs font-bold text-ink">
              Petugas Posko atau Relawan Lapangan?
            </span>
          </div>
          <p className="text-[11px] text-ink-muted leading-relaxed">
            Untuk akses dashboard komando dan verifikasi laporan lapangan, silakan gunakan portal komando resmi:
          </p>

          <Link
            href="/admin/login"
            className="w-full h-10 px-3 rounded-md border border-line-strong hover:bg-bg text-ink text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
          >
            <span>Masuk ke Portal Petugas Posko</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </main>
  );
}

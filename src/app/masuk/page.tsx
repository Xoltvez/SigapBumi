"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  User,
  ArrowRight,
  ChevronLeft,
  LifeBuoy,
} from "lucide-react";

export default function MasukPage() {
  const router = useRouter();
  const [role, setRole] = useState<"warga" | "petugas">("warga");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleDemoLogin = (targetRole: "warga" | "petugas") => {
    if (targetRole === "petugas") {
      // Masuk langsung ke area posko admin
      router.push("/admin");
    } else {
      // Masuk ke beranda warga
      router.push("/laporan-saya");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (role === "petugas") {
      router.push("/admin");
    } else {
      router.push("/laporan-saya");
    }
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
          <div className="mb-2">
            <span className="inline-block px-2.5 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-primary-soft text-primary-hover border border-primary/20">
              Mode Demonstrasi — Akses Evaluator WIA 2026
            </span>
          </div>
          <h1 className="text-2xl font-bold text-ink">Masuk ke SigapBumi</h1>
          <p className="text-xs text-ink-soft mt-1">
            Akses pelacakan laporan bencana warga dan sistem verifikasi posko komando.
          </p>
        </div>

        {/* Role Selector Tabs */}
        <div className="grid grid-cols-2 p-1 bg-bg border border-line rounded-md text-xs font-semibold">
          <button
            type="button"
            onClick={() => setRole("warga")}
            className={`py-2 rounded transition-colors flex items-center justify-center gap-1.5 ${
              role === "warga"
                ? "bg-surface text-ink shadow-sm font-bold"
                : "text-ink-soft hover:text-ink"
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Warga / Relawan</span>
          </button>
          <button
            type="button"
            onClick={() => setRole("petugas")}
            className={`py-2 rounded transition-colors flex items-center justify-center gap-1.5 ${
              role === "petugas"
                ? "bg-surface text-primary font-bold shadow-sm"
                : "text-ink-soft hover:text-ink"
            }`}
          >
            <LifeBuoy className="w-3.5 h-3.5" />
            <span>Petugas Posko</span>
          </button>
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
              placeholder={
                role === "petugas"
                  ? "petugas@sigapbumi.id"
                  : "nama@email.com"
              }
              className="w-full h-11 px-3.5 rounded-md border border-line bg-surface text-sm text-ink focus:border-primary focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink mb-1.5">
              Kata Sandi
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full h-11 px-3.5 rounded-md border border-line bg-surface text-sm text-ink focus:border-primary focus:outline-none"
            />
          </div>

          <button
            type="submit"
            className="w-full h-11 rounded-md bg-primary hover:bg-primary-hover text-white text-sm font-semibold transition-colors shadow-sm"
          >
            Masuk
          </button>
        </form>

        {/* Quick Demo Login Box */}
        <div className="pt-4 border-t border-line space-y-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-primary" />
            <span className="text-xs font-bold text-ink">
              Jalur Pintas Demo Evaluator WIA 2026:
            </span>
          </div>
          <p className="text-[11px] text-ink-muted leading-relaxed">
            Untuk kemudahan peninjauan sistem tanpa perlu mengetik kata sandi:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleDemoLogin("petugas")}
              className="h-10 px-3 rounded-md bg-ink hover:bg-ink-soft text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
            >
              <span>Masuk Petugas Posko</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <Link
              href="/admin"
              className="h-10 px-3 rounded-md border border-line-strong hover:bg-bg text-ink text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
            >
              <span>Buka Dashboard /admin</span>
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

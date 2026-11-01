"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ShieldCheck,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ChevronLeft,
  LifeBuoy,
  Flame,
  HeartPulse,
  Shield,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Building2,
  Sparkles,
} from "lucide-react";

interface UnitOption {
  id: string;
  name: string;
  shortName: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  badgeBg: string;
  demoNip: string;
  demoOfficer: string;
}

const UNIT_OPTIONS: UnitOption[] = [
  {
    id: "bnpb_bpbd",
    name: "BNPB / BPBD (Badan Penanggulangan Bencana)",
    shortName: "BPBD Komando",
    icon: LifeBuoy,
    color: "text-amber-500",
    badgeBg: "bg-amber-500/10 border-amber-500/30 text-amber-600",
    demoNip: "BPBD-JKT-042",
    demoOfficer: "Kapten Hendra Gunawan",
  },
  {
    id: "damkar",
    name: "Dinas Pemadam Kebakaran & Penyelamatan",
    shortName: "Damkar Rescue",
    icon: Flame,
    color: "text-red-500",
    badgeBg: "bg-red-500/10 border-red-500/30 text-red-600",
    demoNip: "DMK-OPS-113",
    demoOfficer: "Danru Rian Pratama",
  },
  {
    id: "medis",
    name: "Dinas Kesehatan / PSC 119 & Ambulans",
    shortName: "Medis & Evakuasi",
    icon: HeartPulse,
    color: "text-emerald-500",
    badgeBg: "bg-emerald-500/10 border-emerald-500/30 text-emerald-600",
    demoNip: "PSC-MED-119",
    demoOfficer: "dr. Sarah Anindita",
  },
  {
    id: "polisi",
    name: "Kepolisian RI / Satgas Pengamanan Bencana",
    shortName: "Satgas Polri",
    icon: Shield,
    color: "text-blue-500",
    badgeBg: "bg-blue-500/10 border-blue-500/30 text-blue-600",
    demoNip: "POL-OPS-088",
    demoOfficer: "Iptu Bambang Wijaya",
  },
];

function AdminLoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get("redirect") || "/admin";

  const [selectedUnit, setSelectedUnit] = useState<string>("bnpb_bpbd");
  const [nip, setNip] = useState<string>("BPBD-JKT-042");
  const [password, setPassword] = useState<string>("admin123");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [rememberMe, setRememberMe] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [successMsg, setSuccessMsg] = useState<string>("");

  // Sync default demo NIP when unit changes
  const handleUnitSelect = (unitId: string) => {
    setSelectedUnit(unitId);
    const targetUnit = UNIT_OPTIONS.find((u) => u.id === unitId);
    if (targetUnit) {
      setNip(targetUnit.demoNip);
    }
    setErrorMsg("");
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!nip.trim()) {
      setErrorMsg("Harap masukkan NIP atau ID Petugas Posko.");
      return;
    }

    if (!password.trim()) {
      setErrorMsg("Harap masukkan kata sandi akses komando.");
      return;
    }

    setIsLoading(true);

    const activeUnitData =
      UNIT_OPTIONS.find((u) => u.id === selectedUnit) || UNIT_OPTIONS[0];

    // Simulate verification
    setTimeout(() => {
      const sessionPayload = {
        nip: nip.trim(),
        name: activeUnitData.demoOfficer,
        email: `${selectedUnit}@sigapbumi.go.id`,
        unit: selectedUnit,
        unitName: activeUnitData.shortName,
        role: "Petugas Posko Terpadu",
        loginAt: new Date().toISOString(),
      };

      try {
        localStorage.setItem(
          "sigapbumi_admin_auth",
          JSON.stringify(sessionPayload)
        );
        if (rememberMe) {
          localStorage.setItem("sigapbumi_remember_unit", selectedUnit);
        }
      } catch (err) {
        console.warn("Storage error", err);
      }

      setSuccessMsg(
        `Kredensial diverifikasi. Mengalihkan ke Ruang Komando (${activeUnitData.shortName})...`
      );

      setTimeout(() => {
        router.push(redirectPath);
      }, 700);
    }, 600);
  };

  // Instant 1-Click Demo Login bypass
  const handleQuickDemoLogin = (unitId: string = "bnpb_bpbd") => {
    const targetUnit =
      UNIT_OPTIONS.find((u) => u.id === unitId) || UNIT_OPTIONS[0];
    setSelectedUnit(targetUnit.id);
    setNip(targetUnit.demoNip);
    setPassword("admin123");
    setIsLoading(true);
    setErrorMsg("");

    setTimeout(() => {
      const sessionPayload = {
        nip: targetUnit.demoNip,
        name: targetUnit.demoOfficer,
        email: `${targetUnit.id}@sigapbumi.go.id`,
        unit: targetUnit.id,
        unitName: targetUnit.shortName,
        role: "Petugas Posko Terpadu",
        loginAt: new Date().toISOString(),
      };

      try {
        localStorage.setItem(
          "sigapbumi_admin_auth",
          JSON.stringify(sessionPayload)
        );
      } catch (err) {
        console.warn("Storage error", err);
      }

      setSuccessMsg(`Otorisasi diterima! Mengalihkan ke Dashboard...`);
      setTimeout(() => {
        router.push(redirectPath);
      }, 400);
    }, 400);
  };

  return (
    <div className="min-h-screen w-full bg-[#0F172A] text-slate-100 flex flex-col justify-between selection:bg-orange-500 selection:text-white relative overflow-hidden">
      {/* Decorative Atmospheric Radial Glows */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-gradient-to-b from-orange-600/20 via-amber-600/10 to-transparent blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 right-0 w-96 h-96 bg-blue-600/10 blur-3xl"
      />

      {/* Top Bar with Return Link */}
      <header className="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-6 py-6 flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors group px-3 py-1.5 rounded-lg hover:bg-slate-800/60 border border-transparent hover:border-slate-700"
        >
          <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
          <span>Kembali ke Portal Publik Warga</span>
        </Link>

        <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-400 bg-slate-800/80 px-3 py-1 rounded-full border border-slate-700/80">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Server Posko Online</span>
        </div>
      </header>

      {/* Main Login Card Container */}
      <main className="relative z-10 w-full max-w-[500px] mx-auto px-4 py-4 sm:py-8 my-auto">
        <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl shadow-black/60 space-y-6">
          {/* Brand Identity & Header */}
          <div className="text-center space-y-2.5">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 p-2 shadow-lg shadow-orange-500/25 mx-auto ring-4 ring-orange-500/10">
              <Image
                src="/logo_sigapbumi.png"
                alt="Logo SigapBumi"
                width={40}
                height={40}
                className="object-contain"
                priority
              />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-orange-500/15 text-orange-400 border border-orange-500/30 mb-1.5">
                <ShieldCheck className="w-3 h-3" />
                Pusat Komando & Dispatch
              </div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                Masuk Sistem Petugas
              </h1>
              <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed mt-1">
                Akses terverifikasi untuk personel BPBD, Basarnas, Damkar, Tim Medis, dan Satgas Kebencanaan.
              </p>
            </div>
          </div>

          {/* Alert Messages */}
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-red-500/15 border border-red-500/30 text-red-200 text-xs flex items-start gap-2.5 animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-200 text-xs flex items-start gap-2.5 animate-in fade-in duration-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            {/* Pilihan Instansi / Unit Tugas */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center justify-between">
                <span>Pilih Instansi / Satuan Tugas</span>
                <span className="text-[10px] font-normal text-slate-400">Wajib dipilih</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {UNIT_OPTIONS.map((unit) => {
                  const Icon = unit.icon;
                  const isSelected = selectedUnit === unit.id;
                  return (
                    <button
                      key={unit.id}
                      type="button"
                      onClick={() => handleUnitSelect(unit.id)}
                      className={`p-2.5 rounded-xl border text-left transition-all flex items-center gap-2.5 ${
                        isSelected
                          ? "bg-slate-800 border-orange-500/80 shadow-sm ring-1 ring-orange-500/40 text-white"
                          : "bg-slate-950/50 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-850"
                      }`}
                    >
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                          isSelected ? "bg-orange-500/20 text-orange-400" : "bg-slate-800 text-slate-400"
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-[11px] font-bold truncate leading-tight">
                          {unit.shortName}
                        </div>
                        <div className="text-[9px] text-slate-400 truncate mt-0.5">
                          {unit.demoNip}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Input NIP / ID Petugas */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                NIP / ID Registrasi Personel
              </label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                  <KeyRound className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={nip}
                  onChange={(e) => {
                    setNip(e.target.value);
                    setErrorMsg("");
                  }}
                  placeholder="Contoh: BPBD-JKT-042"
                  className="w-full h-11 pl-10 pr-3.5 rounded-xl border border-slate-700 bg-slate-950/80 text-sm font-mono text-white placeholder:font-sans placeholder:text-slate-500 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 focus:outline-none transition-all uppercase"
                />
              </div>
            </div>

            {/* Input Kata Sandi */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-300">
                  Kata Sandi Akses Komando
                </label>
                <span className="text-[10px] text-orange-400/90 font-medium">
                  Default Demo: <code className="bg-slate-800 px-1 py-0.5 rounded text-white font-mono">admin123</code>
                </span>
              </div>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setErrorMsg("");
                  }}
                  placeholder="••••••••"
                  className="w-full h-11 pl-10 pr-10 rounded-xl border border-slate-700 bg-slate-950/80 text-sm font-mono text-white placeholder:font-sans placeholder:text-slate-500 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 focus:outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors p-0.5"
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

            {/* Remember Me */}
            <div className="flex items-center justify-between pt-1">
              <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-orange-600 focus:ring-0 focus:ring-offset-0 cursor-pointer"
                />
                <span className="text-xs text-slate-400">Ingat sesi di posko ini</span>
              </label>

              <span className="text-[11px] text-slate-400 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                TLS 256-Bit
              </span>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 active:scale-[0.99] text-white font-bold text-sm transition-all shadow-lg shadow-orange-600/30 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Memverifikasi Akses...</span>
                </>
              ) : (
                <>
                  <span>Masuk ke Ruang Komando</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Access Bar */}
          <div className="pt-4 border-t border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Mode Peninjauan / Reviewer:</span>
              </div>
              <span className="text-[10px] text-slate-400">1-Klik Akses Cepat</span>
            </div>

            <button
              type="button"
              onClick={() => handleQuickDemoLogin(selectedUnit)}
              disabled={isLoading}
              className="w-full h-10 px-3.5 rounded-xl border border-slate-700 hover:border-orange-500/50 bg-slate-800/70 hover:bg-slate-800 text-xs font-semibold text-slate-200 transition-all flex items-center justify-between group"
            >
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-orange-400" />
                <span>Akses Instan Demo ({UNIT_OPTIONS.find((u) => u.id === selectedUnit)?.shortName})</span>
              </div>
              <span className="text-orange-400 font-bold group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                Buka Langsung
                <ArrowRight className="w-3 h-3" />
              </span>
            </button>
          </div>
        </div>

        {/* Security Notice Footer */}
        <p className="text-center text-[11px] text-slate-500 mt-5 leading-relaxed">
          Sistem SigapBumi dilindungi protokol keamanan tanggap bencana darurat nasional.
          <br />
          Semua aktivitas login dan dispatch tercatat dalam audit log posko.
        </p>
      </main>

      {/* Page Footer */}
      <footer className="relative z-10 w-full py-4 text-center text-[11px] text-slate-400 border-t border-slate-800/60">
        SigapBumi &copy; {new Date().getFullYear()} — Dashboard Terpadu Petugas Penanggulangan Bencana
      </footer>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen w-full bg-[#0F172A] flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <AdminLoginContent />
    </React.Suspense>
  );
}

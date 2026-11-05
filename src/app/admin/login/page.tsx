"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Lock,
  Eye,
  EyeOff,
  KeyRound,
  ArrowRight,
  ChevronLeft,
  AlertCircle,
  CheckCircle2,
  Building2,
  Clock,
  ShieldAlert,
  Shield,
} from "lucide-react";
import { setAdminSession, type AdminAuthSession } from "@/lib/adminAuth";

interface UnitOption {
  id: string;
  name: string;
  shortName: string;
  demoNip: string;
  demoOfficer: string;
}

const UNIT_OPTIONS: UnitOption[] = [
  {
    id: "pemerintahan",
    name: "Pemerintahan (Mencakup Semua Data Masuk)",
    shortName: "Pemerintahan",
    demoNip: "PEMDA-PST-001",
    demoOfficer: "Drs. Tri Wahyudi (Koordinator Operasi)",
  },
  {
    id: "bnpb_bpbd",
    name: "BNPB / BPBD (Badan Penanggulangan Bencana)",
    shortName: "BPBD Komando",
    demoNip: "BPBD-JKT-042",
    demoOfficer: "Kapten Hendra Gunawan",
  },
  {
    id: "damkar",
    name: "Dinas Pemadam Kebakaran & Penyelamatan",
    shortName: "Damkar Rescue",
    demoNip: "DMK-OPS-113",
    demoOfficer: "Danru Rian Pratama",
  },
  {
    id: "medis",
    name: "Dinas Kesehatan / PSC 119 & Ambulans",
    shortName: "Medis & Evakuasi",
    demoNip: "PSC-MED-119",
    demoOfficer: "dr. Sarah Anindita",
  },
  {
    id: "polisi",
    name: "Kepolisian RI / Satgas Kebencanaan",
    shortName: "Satgas Polri",
    demoNip: "POL-OPS-088",
    demoOfficer: "Iptu Bambang Wijaya",
  },
];

function AdminLoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get("redirect") || "/admin";
  const reason = searchParams.get("reason");

  const [selectedUnit, setSelectedUnit] = useState<string>("pemerintahan");
  const [nip, setNip] = useState<string>("PEMDA-PST-001");
  const [password, setPassword] = useState<string>("admin123");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [rememberMe, setRememberMe] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [successMsg, setSuccessMsg] = useState<string>("");

  // Muat pilihan instansi yang sebelumnya diingat jika ada
  React.useEffect(() => {
    try {
      const savedUnit = localStorage.getItem("sigapbumi_remember_unit");
      if (savedUnit && UNIT_OPTIONS.some((u) => u.id === savedUnit)) {
        setSelectedUnit(savedUnit);
        const target = UNIT_OPTIONS.find((u) => u.id === savedUnit);
        if (target) {
          setNip(target.demoNip);
        }
      }
    } catch {}
  }, []);

  const handleUnitChange = (unitId: string) => {
    setSelectedUnit(unitId);
    const target = UNIT_OPTIONS.find((u) => u.id === unitId);
    if (target) {
      setNip(target.demoNip);
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

    setTimeout(() => {
      const sessionPayload: AdminAuthSession = {
        nip: nip.trim(),
        name: activeUnitData.demoOfficer,
        email: `${selectedUnit}@sigapbumi.go.id`,
        unit: selectedUnit,
        unitName: activeUnitData.shortName,
        role: "Petugas Posko Terpadu",
        loginAt: new Date().toISOString(),
      };

      try {
        setAdminSession(sessionPayload);
        if (rememberMe) {
          localStorage.setItem("sigapbumi_remember_unit", selectedUnit);
        } else {
          localStorage.removeItem("sigapbumi_remember_unit");
        }
      } catch (err) {
        console.warn("Storage error", err);
      }

      setSuccessMsg(`Berhasil diverifikasi. Mengalihkan ke dashboard posko...`);
      setTimeout(() => {
        router.push(redirectPath);
      }, 400);
    }, 350);
  };

  return (
    <div className="min-h-screen w-full bg-slate-50 text-slate-800 flex flex-col justify-between font-sans">
      {/* Top Header / Back Link */}
      <header className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-6 flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-orange-600 transition-colors group"
        >
          <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
          <span>Kembali ke Beranda</span>
        </Link>
      </header>

      {/* Main Login Card */}
      <main className="w-full max-w-[420px] mx-auto px-4 py-8 my-auto">
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
          {/* Logo & Heading */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-orange-50 border border-orange-100 p-2 mx-auto">
              <Image
                src="/logo_sigapbumi.png"
                alt="Logo SigapBumi"
                width={36}
                height={36}
                className="object-contain"
                priority
              />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Masuk Petugas Posko
            </h1>
            <p className="text-xs text-slate-500 leading-relaxed">
              Silakan masuk ke sistem posko komando SigapBumi
            </p>
          </div>

          {/* Security & Reason Alerts */}
          {reason === "idle" && !errorMsg && !successMsg && (
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5 shadow-2xs">
              <Clock className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
              <div className="space-y-0.5">
                <p className="font-bold">Sesi Berakhir Otomatis (Idle)</p>
                <p className="text-[11px] text-amber-700 leading-normal">
                  Sesi posko Anda ditutup otomatis karena tidak ada aktivitas (inactivity timeout) demi menjaga keamanan komando. Silakan masuk kembali.
                </p>
              </div>
            </div>
          )}

          {reason === "left" && !errorMsg && !successMsg && (
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs flex items-start gap-2.5 shadow-2xs">
              <ShieldAlert className="w-4 h-4 shrink-0 text-slate-600 mt-0.5" />
              <div className="space-y-0.5">
                <p className="font-bold">Sesi Telah Berakhir</p>
                <p className="text-[11px] text-slate-600 leading-normal">
                  Sesi aktif telah terputus saat jendela atau peramban ditutup. Silakan masuk kembali untuk melanjutkan tugas posko.
                </p>
              </div>
            </div>
          )}

          {reason === "unauthorized" && !errorMsg && !successMsg && (
            <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs flex items-start gap-2.5 shadow-2xs">
              <Shield className="w-4 h-4 shrink-0 text-blue-600 mt-0.5" />
              <div className="space-y-0.5">
                <p className="font-bold">Akses Terproteksi</p>
                <p className="text-[11px] text-blue-700 leading-normal">
                  Halaman pusat komando memerlukan verifikasi akun petugas posko. Silakan lakukan otentikasi login.
                </p>
              </div>
            </div>
          )}

          {reason === "manual" && !errorMsg && !successMsg && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span className="font-medium">Anda telah berhasil keluar dari posko komando.</span>
            </div>
          )}

          {/* Feedback Alerts */}
          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            {/* Instansi / Unit Dropdown (Pilihan Role Akses) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  Pilih Role / Instansi Penugasan
                </label>
                <span className="text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 font-semibold">
                  Wajib Dipilih
                </span>
              </div>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                  <Building2 className="w-4 h-4" />
                </div>
                <select
                  value={selectedUnit}
                  onChange={(e) => handleUnitChange(e.target.value)}
                  className="w-full h-11 pl-10 pr-3.5 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-800 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 focus:outline-none transition-all cursor-pointer"
                >
                  {UNIT_OPTIONS.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                </select>
              </div>
              <p className="text-[11px] text-slate-500 mt-1.5 leading-normal">
                Role instansi terkunci selama sesi komando berlangsung. Penggantian instansi hanya dapat dilakukan melalui menu Logout.
              </p>
            </div>

            {/* NIP / ID Input */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                NIP / ID Petugas
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
                  className="w-full h-11 pl-10 pr-3.5 rounded-xl border border-slate-200 bg-white text-xs font-mono uppercase text-slate-800 placeholder:text-slate-400 placeholder:font-sans focus:border-orange-500 focus:ring-1 focus:ring-orange-500 focus:outline-none transition-all"
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-700">
                  Kata Sandi
                </label>
                <span className="text-[11px] text-slate-400">
                  Default: <code className="text-slate-600 font-mono">admin123</code>
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
                  className="w-full h-11 pl-10 pr-10 rounded-xl border border-slate-200 bg-white text-xs font-mono text-slate-800 placeholder:text-slate-400 placeholder:font-sans focus:border-orange-500 focus:ring-1 focus:ring-orange-500 focus:outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-0.5"
                  aria-label={showPassword ? "Sembunyikan sandi" : "Lihat sandi"}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Remember Unit Preference */}
            <div className="flex items-center justify-between pt-1">
              <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-orange-600 focus:ring-orange-500 cursor-pointer"
                />
                <span className="text-xs text-slate-600">Ingat pilihan instansi di perangkat ini</span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 rounded-xl bg-orange-600 hover:bg-orange-700 active:scale-[0.99] text-white font-semibold text-xs transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-60 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Memverifikasi...</span>
                </>
              ) : (
                <>
                  <span>Masuk ke Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </main>

      {/* Simple Footer */}
      <footer className="w-full py-4 text-center text-xs text-slate-400">
        SigapBumi &copy; {new Date().getFullYear()} — Posko Terpadu Penanggulangan Bencana
      </footer>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen w-full bg-white flex items-center justify-center">
          <div className="w-7 h-7 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <AdminLoginContent />
    </React.Suspense>
  );
}

"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  ArrowRight,
  ChevronLeft,
  Eye,
  EyeOff,
  CheckCircle2,
  LogOut,
  Loader2,
  AlertCircle,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import {
  getCurrentUser,
  setCurrentUser,
  logoutUser,
  subscribeToAuth,
  getFirstName,
  UserSession,
} from "@/lib/auth";
import { supabase } from "@/lib/supabase/client";
import { syncLocalReportsToUser } from "@/lib/services/reports";

export default function MasukPage() {
  const router = useRouter();
  const [currentUser, setCurrentUserSession] = useState<UserSession | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [sessionConflict, setSessionConflict] = useState<{
    email: string;
    message: string;
    detail: string;
  } | null>(null);
  const [shakeKey, setShakeKey] = useState(0);

  useEffect(() => {
    setCurrentUserSession(getCurrentUser());
    const unsubscribe = subscribeToAuth((user) => {
      setCurrentUserSession(user);
    });
    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e?: React.FormEvent, force = false) => {
    if (e) e.preventDefault();

    const errors: typeof fieldErrors = {};
    if (!email.trim()) {
      errors.email = "Alamat email wajib diisi.";
    } else if (!email.includes("@") || !email.includes(".")) {
      errors.email = "Format alamat email tidak valid.";
    }
    if (!password) {
      errors.password = "Kata sandi wajib diisi.";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setShakeKey((prev) => prev + 1);
      return;
    }

    setFieldErrors({});
    setSessionConflict(null);
    setLoading(true);

    let assignedSessionId = `session_${Date.now()}`;

    try {
      // 1. Verifikasi Keunikan Sesi Aktif: Cek apakah email sedang digunakan di sesi/perangkat lain
      try {
        const claimRes = await fetch("/api/auth/active-session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: force ? "force_claim" : "claim",
            email: email.trim(),
            force: force,
          }),
        });

        const claimJson = await claimRes.json();

        // Jika email sedang aktif login di sesi lain dan bukan force take-over
        if (!claimRes.ok || !claimJson.success) {
          if (claimJson.inUse) {
            setFieldErrors({
              email: "Email ini sedang aktif digunakan di sesi lain.",
            });
            setSessionConflict({
              email: email.trim(),
              message:
                claimJson.message ||
                "Email ini sedang aktif login di website pada perangkat/sesi lain. Demi keamanan akun, satu akun tidak dapat digunakan secara bersamaan.",
              detail:
                "Silakan keluar dari sesi sebelumnya terlebih dahulu atau tunggu hingga sesi tersebut otomatis kadaluarsa (idle 1 jam).",
            });
            setShakeKey((prev) => prev + 1);
            setLoading(false);
            return;
          }
        }

        if (claimJson.sessionId) {
          assignedSessionId = claimJson.sessionId;
        }
      } catch (claimErr) {
        console.warn("Gagal cek server active session:", claimErr);
      }

      // 2. Coba login via Supabase Auth jika tersedia
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });

      if (authError) {
        console.warn("Supabase auth login fallback/notice:", authError.message);
      }

      // Cari nama resmi warga: 1) Metadata Supabase, 2) DB Profiles, 3) localStorage, 4) Bersihkan email
      let resolvedName = authData?.user?.user_metadata?.full_name;

      if (!resolvedName && authData?.user?.id) {
        try {
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name")
            .eq("id", authData.user.id)
            .maybeSingle();
          if (profile?.full_name) {
            resolvedName = profile.full_name;
          }
        } catch {
          // ignore
        }
      }

      if (!resolvedName && typeof window !== "undefined") {
        try {
          const stored = localStorage.getItem("sigapbumi_current_user");
          if (stored) {
            const parsed = JSON.parse(stored);
            if (parsed.email === email.trim() && parsed.full_name) {
              resolvedName = parsed.full_name;
            }
          }
        } catch {
          // ignore
        }
      }

      if (!resolvedName) {
        resolvedName = email.split("@")[0].replace(/[0-9]/g, "").replace(/[._-]/g, " ").trim();
        resolvedName = resolvedName ? resolvedName.charAt(0).toUpperCase() + resolvedName.slice(1) : "Warga";
      }

      const userSession: UserSession = {
        id: authData?.user?.id || `warga-${Date.now()}`,
        full_name: resolvedName,
        email: email.trim(),
        role: "warga",
        sessionId: assignedSessionId,
        loginAt: new Date().toISOString(),
      };

      setCurrentUser(userSession);
      try {
        await syncLocalReportsToUser(userSession);
      } catch {}
      router.push("/laporan-saya");
    } catch (err) {
      console.error("Login error:", err);
      // Fallback tetap izinkan sesi login tersimpan
      const cleanEmailName = email.split("@")[0].replace(/[0-9]/g, "").replace(/[._-]/g, " ").trim();
      const fallbackName = cleanEmailName ? cleanEmailName.charAt(0).toUpperCase() + cleanEmailName.slice(1) : "Warga";
      const userSession: UserSession = {
        id: `warga-${Date.now()}`,
        full_name: fallbackName,
        email: email.trim(),
        role: "warga",
        sessionId: `session_${Date.now()}`,
        loginAt: new Date().toISOString(),
      };
      setCurrentUser(userSession);
      try {
        await syncLocalReportsToUser(userSession);
      } catch {}
      router.push("/laporan-saya");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logoutUser();
    setEmail("");
    setPassword("");
  };

  return (
    <main className="flex-1 w-full max-w-[480px] mx-auto px-4 py-8 md:py-16 pb-28 md:pb-16">
      <div className="bg-surface border border-line rounded-lg p-6 md:p-8 shadow-card space-y-6">
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200/90 bg-white hover:bg-orange-50/80 hover:border-orange-300 text-xs font-bold text-slate-700 hover:text-orange-700 shadow-2xs transition-all mb-4 active:scale-[0.98]"
          >
            <ChevronLeft className="w-3.5 h-3.5 shrink-0" />
            <span>Kembali ke Beranda</span>
          </Link>
          <h1 className="text-2xl font-bold text-ink">
            {currentUser ? "Status Akun Anda" : "Masuk ke SigapBumi"}
          </h1>
          <p className="text-xs text-ink-soft mt-1">
            {currentUser
              ? "Informasi sesi login akun warga Anda yang sedang aktif."
              : "Akses pelacakan laporan bencana warga dan informasi penanganan terkini."}
          </p>
        </div>

        {currentUser ? (
          /* Tampilan jika sudah login - Mencegah form meminta login lagi */
          <div className="border border-success/30 bg-success-soft/30 rounded-xl p-5 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-success-soft text-success mx-auto flex items-center justify-center border border-success/30">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            <div>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-success text-white mb-2">
                ● Sedang Masuk
              </span>
              <h2 className="text-base font-bold text-ink">
                Halo, {getFirstName(currentUser.full_name)}!
              </h2>
              <p className="text-xs text-ink-soft mt-1">
                Anda telah masuk dengan email:{" "}
                <span className="font-semibold text-ink">{currentUser.email}</span>
              </p>
            </div>

            <div className="space-y-2.5 pt-2">
              <Link
                href="/laporan-saya"
                className="w-full h-10 px-4 rounded-md bg-primary hover:bg-primary-hover text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors shadow-sm"
              >
                <span>Buka Riwayat Laporan Saya</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <Link
                href="/"
                className="w-full h-10 px-4 rounded-md border border-line bg-surface hover:bg-bg text-ink text-xs font-semibold flex items-center justify-center transition-colors"
              >
                Kembali ke Beranda
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="w-full h-9 text-xs font-semibold text-danger hover:underline pt-1 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Ganti Akun / Keluar</span>
              </button>
            </div>
          </div>
        ) : (
          /* Form Login jika belum masuk */
          <form
            noValidate
            onSubmit={(e) => handleSubmit(e, false)}
            className="space-y-4 text-left"
          >
            {/* Alert Konflik Sesi Aktif: Email sedang login di tempat lain */}
            {sessionConflict && (
              <div className="p-4 rounded-xl border border-warning/40 bg-warning-soft/30 space-y-2.5 animate-in fade-in slide-in-from-top-2">
                <div className="flex items-start gap-2.5">
                  <AlertTriangle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-ink">
                      Email Ini Sedang Digunakan di Sesi Lain
                    </p>
                    <p className="text-[11px] text-ink-soft leading-relaxed">
                      {sessionConflict.message}
                    </p>
                    <p className="text-[11px] text-ink-soft leading-relaxed">
                      {sessionConflict.detail}
                    </p>
                  </div>
                </div>

                <div className="pt-1.5 border-t border-warning/20 flex flex-col sm:flex-row items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleSubmit(undefined, true)}
                    disabled={loading}
                    className="w-full sm:w-auto px-3 py-1.5 rounded-lg bg-warning hover:bg-warning/90 text-white text-[11px] font-bold inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Keluarkan Sesi Lama &amp; Masuk di Sini</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSessionConflict(null)}
                    className="text-[11px] text-ink-soft hover:text-ink font-semibold"
                  >
                    Batal
                  </button>
                </div>
              </div>
            )}

            <div key={fieldErrors.email ? `email-${shakeKey}` : "email-field"} className={fieldErrors.email ? "animate-shake" : ""}>
              <label className="block text-xs font-semibold text-ink mb-1.5">
                Alamat Email <span className="text-danger">*</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: undefined }));
                  if (sessionConflict) setSessionConflict(null);
                }}
                placeholder="nama@email.com"
                className={`w-full h-11 px-3.5 rounded-md border bg-surface text-sm text-ink focus:outline-none transition-all ${
                  fieldErrors.email
                    ? "border-danger focus:border-danger ring-1 ring-danger/20"
                    : "border-line focus:border-primary"
                }`}
              />
              {fieldErrors.email && (
                <p className="text-[11px] text-danger font-medium flex items-center gap-1 mt-1.5 animate-in fade-in">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{fieldErrors.email}</span>
                </p>
              )}
            </div>

            <div key={fieldErrors.password ? `pass-${shakeKey}` : "pass-field"} className={fieldErrors.password ? "animate-shake" : ""}>
              <label className="block text-xs font-semibold text-ink mb-1.5">
                Kata Sandi <span className="text-danger">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: undefined }));
                  }}
                  placeholder="••••••••"
                  className={`w-full h-11 pl-3.5 pr-10 rounded-md border bg-surface text-sm text-ink focus:outline-none transition-all ${
                    fieldErrors.password
                      ? "border-danger focus:border-danger ring-1 ring-danger/20"
                      : "border-line focus:border-primary"
                  }`}
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
              {fieldErrors.password && (
                <p className="text-[11px] text-danger font-medium flex items-center gap-1 mt-1.5 animate-in fade-in">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{fieldErrors.password}</span>
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-md bg-primary hover:bg-primary-hover text-white text-sm font-semibold transition-colors shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{loading ? "Memproses..." : "Masuk"}</span>
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
        )}

        {/* Portal Petugas Link */}
        <div className="pt-4 border-t border-line space-y-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-primary" />
            <span className="text-xs font-bold text-ink">
              Petugas Posko atau Tim Lapangan?
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

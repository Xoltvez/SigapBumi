"use client";

import React, { useState, useEffect, useCallback, createContext, useContext, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Siren, Volume2, VolumeX, X, Clock, ShieldAlert, AlertTriangle } from "lucide-react";
import { AdminSidebar } from "@/components/admin/layout/AdminSidebar";
import { AdminTopbar } from "@/components/admin/layout/AdminTopbar";
import { playSosSiren, stopSosSiren } from "@/lib/audio/siren";
import { supabase } from "@/lib/supabase/client";
import { fetchLiveSosAlerts } from "@/lib/services/sos";
import {
  getAdminSession,
  setAdminSession,
  updateAdminActivity,
  getTimeUntilIdleExpire,
  clearAdminSession,
  type AdminAuthSession,
} from "@/lib/adminAuth";
import { getAdminSettings } from "@/lib/services/settings";

export type { AdminAuthSession };

interface AdminContextType {
  activeUnit: string;
  setActiveUnit: (unit: string) => void;
  activeUnitName: string;
  activeSosCount: number;
  setActiveSosCount: React.Dispatch<React.SetStateAction<number>>;
  isLiveConnected: boolean;
  setIsLiveConnected: React.Dispatch<React.SetStateAction<boolean>>;
  isSirenMuted: boolean;
  setIsSirenMuted: React.Dispatch<React.SetStateAction<boolean>>;
  triggerSiren: () => void;
  adminUser: AdminAuthSession | null;
  updateAdminUser: (updated: Partial<AdminAuthSession>) => void;
  logout: (reason?: "manual" | "idle" | "left" | "unauthorized") => void;
}

const AdminContext = createContext<AdminContextType>({
  activeUnit: "semua",
  setActiveUnit: () => {},
  activeUnitName: "Posko Terpadu (Semua)",
  activeSosCount: 0,
  setActiveSosCount: () => {},
  isLiveConnected: true,
  setIsLiveConnected: () => {},
  isSirenMuted: false,
  setIsSirenMuted: () => {},
  triggerSiren: () => {},
  adminUser: null,
  updateAdminUser: () => {},
  logout: () => {},
});

export const useAdmin = () => useContext(AdminContext);

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const isLoginPage = pathname === "/admin/login";

  const [activeUnit, setActiveUnit] = useState<string>("bnpb_bpbd");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [activeSosCount, setActiveSosCount] = useState<number>(0);
  const [isLiveConnected, setIsLiveConnected] = useState<boolean>(true);
  const [isSirenMuted, setIsSirenMuted] = useState<boolean>(false);
  const [emergencyNotice, setEmergencyNotice] = useState<{
    id: string;
    text: string;
    time: string;
  } | null>(null);
  const [adminUser, setAdminUser] = useState<AdminAuthSession | null>(null);
  const [isVerifyingAuth, setIsVerifyingAuth] = useState<boolean>(!isLoginPage);
  const [idleWarningSeconds, setIdleWarningSeconds] = useState<number | null>(null);
  const lastThrottleRef = useRef<number>(0);

  const logout = useCallback(
    (reason: "manual" | "idle" | "left" | "unauthorized" = "manual") => {
      stopSosSiren();
      clearAdminSession();
      setAdminUser(null);
      setIsVerifyingAuth(false);
      setIdleWarningSeconds(null);
      router.replace(`/admin/login?reason=${reason}`);
    },
    [router]
  );

  // Verifikasi Sesi Admin Aktif Saat Membuka Halaman Admin
  useEffect(() => {
    if (isLoginPage) {
      setIsVerifyingAuth(false);
      return;
    }

    const settings = getAdminSettings();
    const timeoutMin = settings.sessionIdleTimeoutMinutes || 15;
    const session = getAdminSession(timeoutMin);

    if (session) {
      setAdminUser(session);
      if (session.unit && session.unit !== "semua") {
        setActiveUnit(session.unit);
      }
      setIsVerifyingAuth(false);
      updateAdminActivity();
    } else {
      setIsVerifyingAuth(true);
      logout("unauthorized");
    }
  }, [isLoginPage, logout]);

  // Pantau Aktivitas Pengguna (Inactivity / Idle Timeout Auto Logout)
  useEffect(() => {
    if (isLoginPage || !adminUser) return;

    const settings = getAdminSettings();
    const timeoutMin = settings.sessionIdleTimeoutMinutes || 15;

    const registerActivity = () => {
      const now = Date.now();
      if (now - lastThrottleRef.current > 1000) {
        lastThrottleRef.current = now;
        updateAdminActivity();
        setIdleWarningSeconds(null);
      }
    };

    const events: (keyof WindowEventMap)[] = [
      "mousemove",
      "mousedown",
      "keydown",
      "scroll",
      "touchstart",
      "wheel",
    ];

    events.forEach((evt) => {
      window.addEventListener(evt, registerActivity, { passive: true });
    });

    const timerInterval = setInterval(() => {
      const remainingMs = getTimeUntilIdleExpire(timeoutMin);

      if (remainingMs <= 0) {
        clearInterval(timerInterval);
        logout("idle");
      } else {
        const remainingSec = Math.ceil(remainingMs / 1000);
        if (remainingSec <= 60) {
          setIdleWarningSeconds(remainingSec);
        } else {
          setIdleWarningSeconds(null);
        }
      }
    }, 1000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        const remainingMs = getTimeUntilIdleExpire(timeoutMin);
        if (remainingMs <= 0) {
          clearInterval(timerInterval);
          logout("idle");
        } else {
          registerActivity();
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleVisibilityChange);

    return () => {
      events.forEach((evt) => {
        window.removeEventListener(evt, registerActivity);
      });
      clearInterval(timerInterval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleVisibilityChange);
    };
  }, [isLoginPage, adminUser, logout]);

  const updateAdminUser = useCallback((updated: Partial<AdminAuthSession>) => {
    setAdminUser((prev) => {
      if (!prev) return null;
      const next = { ...prev, ...updated };
      setAdminSession(next);
      return next;
    });
  }, []);

  const triggerSiren = useCallback(() => {
    if (!isSirenMuted) {
      playSosSiren(4, 0.4);
    }
  }, [isSirenMuted]);

  // Sinkronisasi jumlah sinyal SOS aktif riil secara global di dashboard sesuai role
  useEffect(() => {
    if (isLoginPage) return;
    let isMounted = true;

    async function syncSosCount() {
      try {
        const alerts = await fetchLiveSosAlerts();
        if (isMounted && alerts) {
          const activeOnly = alerts.filter((s) => {
            if (s.status !== "aktif") return false;
            if (activeUnit === "pemerintahan" || activeUnit === "semua") return true;
            if (activeUnit === "damkar") return s.assistance_type === "damkar";
            if (activeUnit === "medis") return s.assistance_type === "medis";
            if (activeUnit === "polisi") return s.assistance_type === "polisi";
            // bnpb_bpbd
            return (
              s.assistance_type === "bnpb_bpbd" ||
              (s.assistance_type as string) === "evakuasi" ||
              (s.assistance_type as string) === "lainnya"
            );
          });
          setActiveSosCount(activeOnly.length);
        }
      } catch {
        // ignore
      }
    }

    syncSosCount();

    const handleIncomingSos = (e?: CustomEvent<{ id?: string; assistanceType?: string }>) => {
      syncSosCount();
      const type = e?.detail?.assistanceType;
      const isRelevant =
        !type ||
        activeUnit === "pemerintahan" ||
        activeUnit === "semua" ||
        (activeUnit === "damkar" && type === "damkar") ||
        (activeUnit === "medis" && type === "medis") ||
        (activeUnit === "polisi" && type === "polisi") ||
        (activeUnit === "bnpb_bpbd" &&
          (type === "bnpb_bpbd" || (type as string) === "evakuasi" || (type as string) === "lainnya"));

      if (isRelevant) {
        triggerSiren();
        setEmergencyNotice({
          id: e?.detail?.id || `sos-${Date.now()}`,
          text: `Panggilan Darurat Baru Masuk${
            e?.detail?.assistanceType ? ` (Bantuan: ${e.detail.assistanceType.toUpperCase()})` : ""
          }! Segera lakukan respons taktis.`,
          time: "Baru saja",
        });
      }
    };

    const handleLocalSync = () => {
      syncSosCount();
    };

    if (typeof window !== "undefined") {
      window.addEventListener("sigapbumi:sos-created", handleIncomingSos as EventListener);
      window.addEventListener("sigapbumi:sos-updated", handleLocalSync);
      window.addEventListener("storage", handleLocalSync);
    }

    const channel = supabase
      .channel("admin_shell_sos_siren")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "sos_alerts" },
        (payload) => {
          handleIncomingSos({
            detail: {
              id: payload.new?.id,
              assistanceType: payload.new?.assistance_type,
            },
          } as unknown as CustomEvent);
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "sos_alerts" },
        () => {
          syncSosCount();
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "reports" },
        (payload) => {
          const row = payload.new;
          if (row?.tracking_code?.startsWith("SOS-") || row?.title?.includes("SOS")) {
            handleIncomingSos({
              detail: { id: row?.id },
            } as unknown as CustomEvent);
          }
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      if (typeof window !== "undefined") {
        window.removeEventListener("sigapbumi:sos-created", handleIncomingSos as EventListener);
        window.removeEventListener("sigapbumi:sos-updated", handleLocalSync);
        window.removeEventListener("storage", handleLocalSync);
      }
      supabase.removeChannel(channel);
    };
  }, [isLoginPage, triggerSiren, activeUnit]);

  const handleExtendSession = () => {
    updateAdminActivity();
    setIdleWarningSeconds(null);
  };

  const unitNames: Record<string, string> = {
    semua: "Pemerintahan (Semua Data)",
    pemerintahan: "Pemerintahan (Semua Data)",
    bnpb_bpbd: "BNPB / BPBD",
    damkar: "Dinas Pemadam Kebakaran",
    medis: "Dinas Kesehatan / RS",
    polisi: "Kepolisian (Polri)",
  };

  const activeUnitName = unitNames[activeUnit] || "Posko Terpadu";

  if (isLoginPage) {
    return <>{children}</>;
  }

  // Tampilkan splash verifikasi otoritas jika sesi sedang divalidasi atau tidak valid
  if (isVerifyingAuth || !adminUser) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#F8FAFC] text-slate-700 font-sans p-4">
        <div className="w-12 h-12 rounded-2xl bg-orange-50 border border-orange-100 p-2 flex items-center justify-center mb-4 shadow-2xs animate-pulse">
          <Image
            src="/logo_sigapbumi.png"
            alt="SigapBumi"
            width={36}
            height={36}
            className="object-contain"
          />
        </div>
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
          <div className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
          <span>Memverifikasi Otoritas Akses Posko...</span>
        </div>
        <p className="text-xs text-slate-400 mt-1.5 text-center">
          Menyiapkan kanal koordinasi darurat & radar kebencanaan
        </p>
      </div>
    );
  }

  return (
    <AdminContext.Provider
      value={{
        activeUnit,
        setActiveUnit,
        activeUnitName,
        activeSosCount,
        setActiveSosCount,
        isLiveConnected,
        setIsLiveConnected,
        isSirenMuted,
        setIsSirenMuted,
        triggerSiren,
        adminUser,
        updateAdminUser,
        logout,
      }}
    >
      <div className="flex h-screen w-full bg-[#F8FAFC] text-slate-800 overflow-hidden relative font-sans">
        {/* Modal Peringatan Idle Timeout Sebelum Auto-Logout */}
        {idleWarningSeconds !== null && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 text-center animate-in fade-in zoom-in-95 duration-200">
              <div className="w-14 h-14 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto mb-4 text-amber-600">
                <Clock className="w-7 h-7 animate-pulse" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-1">
                Sesi Akan Berakhir
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed mb-4">
                Tidak ada aktivitas terdeteksi pada posko. Sesi komando Anda akan ditutup otomatis demi keamanan dalam:
              </p>
              <div className="inline-flex items-center justify-center px-4 py-2 rounded-xl bg-amber-100 text-amber-900 font-mono text-2xl font-extrabold mb-5 tracking-wider border border-amber-300">
                00:{idleWarningSeconds < 10 ? `0${idleWarningSeconds}` : idleWarningSeconds}
              </div>
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => logout("manual")}
                  className="flex-1 py-2.5 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Keluar Sekarang
                </button>
                <button
                  type="button"
                  onClick={handleExtendSession}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
                >
                  Tetap Masuk
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Banner Darurat Mengambang Saat Ada Panggilan SOS Baru */}
        {emergencyNotice && (
          <div className="fixed top-4 right-4 z-50 max-w-md w-full bg-[#EF4444] text-white p-4 rounded-xl shadow-2xl border-2 border-white/30 animate-pulse flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-white/20 rounded-full shrink-0">
                <Siren className="w-5 h-5 text-white animate-bounce" />
              </div>
              <div>
                <h4 className="font-extrabold text-sm uppercase tracking-wide flex items-center gap-1.5">
                  <span>SIAGA SOS MASUK</span>
                  <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded font-mono">
                    {emergencyNotice.time}
                  </span>
                </h4>
                <p className="text-xs text-white/90 mt-1 leading-snug">
                  {emergencyNotice.text}
                </p>
                <div className="mt-3 flex items-center gap-2">
                  <Link
                    href="/admin/sos"
                    onClick={() => setEmergencyNotice(null)}
                    className="px-3 py-1.5 rounded-md bg-white text-danger font-bold text-xs hover:bg-slate-100 transition-colors shadow-sm"
                  >
                    Buka Radar SOS
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      stopSosSiren();
                      setEmergencyNotice(null);
                    }}
                    className="px-2.5 py-1.5 rounded-md bg-white/20 hover:bg-white/30 text-white font-semibold text-xs transition-colors"
                  >
                    Hentikan Sirine
                  </button>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                stopSosSiren();
                setEmergencyNotice(null);
              }}
              className="p-1 hover:bg-white/20 rounded text-white/80 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Collapsible Left Light Sidebar */}
        <React.Suspense fallback={<div className="w-64 bg-white min-h-screen shrink-0 border-r border-slate-200/80" />}>
          <AdminSidebar
            isCollapsed={isSidebarCollapsed}
            onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
            activeSosCount={activeSosCount}
          />
        </React.Suspense>

        {/* Right Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#F8FAFC]">
          <AdminTopbar
            isSidebarCollapsed={isSidebarCollapsed}
            onToggleSidebar={() => setIsSidebarCollapsed((prev) => !prev)}
            activeUnit={activeUnit}
            onSelectUnit={setActiveUnit}
            activeSosCount={activeSosCount}
            isLiveConnected={isLiveConnected}
            isSirenMuted={isSirenMuted}
            onToggleSiren={() => setIsSirenMuted((prev) => !prev)}
            onTestSiren={() => playSosSiren(2, 0.35)}
          />
          <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 bg-[#F8FAFC] text-slate-800">
            {children}
          </main>
        </div>
      </div>
    </AdminContext.Provider>
  );
}

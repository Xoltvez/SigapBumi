"use client";

import React, { useState, useEffect, useCallback, createContext, useContext } from "react";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Siren, Volume2, VolumeX, X } from "lucide-react";
import { AdminSidebar } from "@/components/admin/layout/AdminSidebar";
import { AdminTopbar } from "@/components/admin/layout/AdminTopbar";
import { playSosSiren, stopSosSiren } from "@/lib/audio/siren";
import { supabase } from "@/lib/supabase/client";

export interface AdminAuthSession {
  nip: string;
  name: string;
  email: string;
  unit: string;
  unitName: string;
  role: string;
  loginAt: string;
}

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
  logout: () => void;
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
  logout: () => {},
});

export const useAdmin = () => useContext(AdminContext);

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const [activeUnit, setActiveUnit] = useState<string>("semua");
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
  const [isCheckingAuth, setIsCheckingAuth] = useState<boolean>(true);

  // If user is directly on /admin/login, render without AdminShell frame
  const isLoginPage = pathname === "/admin/login";

  useEffect(() => {
    if (isLoginPage) {
      setIsCheckingAuth(false);
      return;
    }

    // Verify session
    try {
      const stored = localStorage.getItem("sigapbumi_admin_auth");
      if (stored) {
        const parsed: AdminAuthSession = JSON.parse(stored);
        setAdminUser(parsed);
        if (parsed.unit && parsed.unit !== "semua") {
          setActiveUnit(parsed.unit);
        }
        setIsCheckingAuth(false);
      } else {
        // Redirect to login preserving the path
        router.replace(`/admin/login?redirect=${encodeURIComponent(pathname)}`);
      }
    } catch {
      router.replace(`/admin/login?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [isLoginPage, pathname, router]);

  const triggerSiren = useCallback(() => {
    if (!isSirenMuted) {
      playSosSiren(4, 0.4);
    }
  }, [isSirenMuted]);

  // Realtime channel listener untuk mendeteksi sinyal SOS baru secara global di dashboard
  useEffect(() => {
    if (isLoginPage) return;

    const handleIncomingSos = (e?: CustomEvent<{ id?: string; assistanceType?: string }>) => {
      setActiveSosCount((prev) => prev + 1);
      triggerSiren();
      setEmergencyNotice({
        id: e?.detail?.id || `sos-${Date.now()}`,
        text: `Panggilan Darurat Baru Masuk${
          e?.detail?.assistanceType ? ` (Bantuan: ${e.detail.assistanceType.toUpperCase()})` : ""
        }! Segera lakukan respons taktis.`,
        time: "Baru saja",
      });
    };

    if (typeof window !== "undefined") {
      window.addEventListener("sigapbumi:sos-created", handleIncomingSos as EventListener);
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
      if (typeof window !== "undefined") {
        window.removeEventListener("sigapbumi:sos-created", handleIncomingSos as EventListener);
      }
      supabase.removeChannel(channel);
    };
  }, [isLoginPage, triggerSiren]);

  const logout = () => {
    try {
      localStorage.removeItem("sigapbumi_admin_auth");
    } catch (e) {
      console.warn("Storage error", e);
    }
    setAdminUser(null);
    router.push("/admin/login");
  };

  const unitNames: Record<string, string> = {
    semua: "Posko Terpadu (Semua)",
    bnpb_bpbd: "BNPB / BPBD",
    damkar: "Dinas Pemadam Kebakaran",
    medis: "Dinas Kesehatan / RS",
    polisi: "Kepolisian (Polri)",
  };

  const activeUnitName = unitNames[activeUnit] || "Posko Terpadu";

  if (isLoginPage) {
    return <>{children}</>;
  }

  if (isCheckingAuth) {
    return (
      <div className="h-screen w-full bg-[#0F172A] text-slate-200 flex flex-col items-center justify-center space-y-4">
        <div className="relative w-12 h-12 flex items-center justify-center animate-pulse">
          <Image
            src="/logo_sigapbumi.png"
            alt="Logo SigapBumi"
            width={44}
            height={44}
            className="object-contain"
          />
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
          <div className="w-3.5 h-3.5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
          <span>Memverifikasi Otorisasi Posko Petugas...</span>
        </div>
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
        logout,
      }}
    >
      <div className="flex h-screen w-full bg-[#F8FAFC] text-slate-800 overflow-hidden relative font-sans">
        {/* Banner Darurat Mengambang Saat Ada Panggilan SOS Baru */}
        {emergencyNotice && (
          <div className="fixed top-4 right-4 z-50 max-w-md w-full bg-[#EF4444] text-white p-4 rounded-xl shadow-2xl border-2 border-white/30 animate-pulse flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-white/20 rounded-full shrink-0">
                <Siren className="w-5 h-5 text-white animate-bounce" />
              </div>
              <div>
                <h4 className="font-extrabold text-sm uppercase tracking-wide flex items-center gap-1.5">
                  <span>🚨 SIAGA SOS MASUK</span>
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

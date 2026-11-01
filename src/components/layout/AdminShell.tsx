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
import { fetchLiveSosAlerts } from "@/lib/services/sos";

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
  updateAdminUser: (updated: Partial<AdminAuthSession>) => void;
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
  updateAdminUser: () => {},
  logout: () => {},
});

export const useAdmin = () => useContext(AdminContext);

const DEFAULT_OFFICER_SESSION: AdminAuthSession = {
  nip: "198803152011011002",
  name: "Kapten Hendra Gunawan",
  email: "hendra.bpbd@sigapbumi.id",
  unit: "bnpb_bpbd",
  unitName: "BNPB / BPBD",
  role: "Komandan Posko",
  loginAt: "2026-11-01T08:00:00Z",
};

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

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
  const [adminUser, setAdminUser] = useState<AdminAuthSession | null>(DEFAULT_OFFICER_SESSION);

  // If user is directly on /admin/login, render without AdminShell frame
  const isLoginPage = pathname === "/admin/login";

  useEffect(() => {
    if (isLoginPage) return;

    // Verify session
    try {
      const stored = localStorage.getItem("sigapbumi_admin_auth");
      if (stored) {
        const parsed: AdminAuthSession = JSON.parse(stored);
        setAdminUser(parsed);
        if (parsed.unit && parsed.unit !== "semua") {
          setActiveUnit(parsed.unit);
        }
      } else {
        localStorage.setItem("sigapbumi_admin_auth", JSON.stringify(DEFAULT_OFFICER_SESSION));
      }
    } catch {
      // Local storage fallback
    }
  }, [isLoginPage]);

  const updateAdminUser = useCallback((updated: Partial<AdminAuthSession>) => {
    setAdminUser((prev) => {
      if (!prev) return null;
      const next = { ...prev, ...updated };
      try {
        localStorage.setItem("sigapbumi_admin_auth", JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  const triggerSiren = useCallback(() => {
    if (!isSirenMuted) {
      playSosSiren(4, 0.4);
    }
  }, [isSirenMuted]);

  // Sinkronisasi jumlah sinyal SOS aktif riil secara global di dashboard
  useEffect(() => {
    if (isLoginPage) return;
    let isMounted = true;

    async function syncSosCount() {
      try {
        const alerts = await fetchLiveSosAlerts();
        if (isMounted && alerts) {
          const activeOnly = alerts.filter((s) => s.status === "aktif");
          setActiveSosCount(activeOnly.length);
        }
      } catch {
        // ignore
      }
    }

    syncSosCount();

    const handleIncomingSos = (e?: CustomEvent<{ id?: string; assistanceType?: string }>) => {
      syncSosCount();
      triggerSiren();
      setEmergencyNotice({
        id: e?.detail?.id || `sos-${Date.now()}`,
        text: `Panggilan Darurat Baru Masuk${
          e?.detail?.assistanceType ? ` (Bantuan: ${e.detail.assistanceType.toUpperCase()})` : ""
        }! Segera lakukan respons taktis.`,
        time: "Baru saja",
      });
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

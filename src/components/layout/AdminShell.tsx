"use client";

import React, { useState, useEffect, createContext, useContext } from "react";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import { AdminSidebar } from "@/components/admin/layout/AdminSidebar";
import { AdminTopbar } from "@/components/admin/layout/AdminTopbar";

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
  adminUser: AdminAuthSession | null;
  logout: () => void;
}

const AdminContext = createContext<AdminContextType>({
  activeUnit: "semua",
  setActiveUnit: () => {},
  activeUnitName: "Posko Terpadu (Semua)",
  activeSosCount: 2,
  setActiveSosCount: () => {},
  isLiveConnected: true,
  setIsLiveConnected: () => {},
  adminUser: null,
  logout: () => {},
});

export const useAdmin = () => useContext(AdminContext);

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const [activeUnit, setActiveUnit] = useState<string>("semua");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [activeSosCount, setActiveSosCount] = useState<number>(2);
  const [isLiveConnected, setIsLiveConnected] = useState<boolean>(true);
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
        adminUser,
        logout,
      }}
    >
      <div className="flex h-screen w-full bg-bg text-ink overflow-hidden">
        {/* Collapsible Left Dark Sidebar */}
        <React.Suspense fallback={<div className="w-64 bg-[#131722] min-h-screen shrink-0" />}>
          <AdminSidebar
            isCollapsed={isSidebarCollapsed}
            onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
            activeSosCount={activeSosCount}
          />
        </React.Suspense>

        {/* Right Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-bg">
          <AdminTopbar
            isSidebarCollapsed={isSidebarCollapsed}
            onToggleSidebar={() => setIsSidebarCollapsed((prev) => !prev)}
            activeUnit={activeUnit}
            onSelectUnit={setActiveUnit}
            activeSosCount={activeSosCount}
            isLiveConnected={isLiveConnected}
          />
          <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 bg-bg text-ink">
            {children}
          </main>
        </div>
      </div>
    </AdminContext.Provider>
  );
}

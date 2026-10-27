"use client";

import React, { useState, createContext, useContext } from "react";
import { AdminSidebar } from "@/components/admin/layout/AdminSidebar";
import { AdminTopbar } from "@/components/admin/layout/AdminTopbar";

interface AdminContextType {
  activeUnit: string;
  setActiveUnit: (unit: string) => void;
  activeUnitName: string;
  activeSosCount: number;
  setActiveSosCount: React.Dispatch<React.SetStateAction<number>>;
  isLiveConnected: boolean;
  setIsLiveConnected: React.Dispatch<React.SetStateAction<boolean>>;
}

const AdminContext = createContext<AdminContextType>({
  activeUnit: "semua",
  setActiveUnit: () => {},
  activeUnitName: "Posko Terpadu (Semua)",
  activeSosCount: 2,
  setActiveSosCount: () => {},
  isLiveConnected: true,
  setIsLiveConnected: () => {},
});

export const useAdmin = () => useContext(AdminContext);

export function AdminShell({ children }: { children: React.ReactNode }) {
  const [activeUnit, setActiveUnit] = useState<string>("semua");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [activeSosCount, setActiveSosCount] = useState<number>(2);
  const [isLiveConnected, setIsLiveConnected] = useState<boolean>(true);

  const unitNames: Record<string, string> = {
    semua: "Posko Terpadu (Semua)",
    bnpb_bpbd: "BNPB / BPBD",
    damkar: "Dinas Pemadam Kebakaran",
    medis: "Dinas Kesehatan / RS",
    polisi: "Kepolisian (Polri)",
  };

  const activeUnitName = unitNames[activeUnit] || "Posko Terpadu";

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
      }}
    >
      <div className="flex h-screen w-full bg-bg text-ink overflow-hidden">
        {/* Collapsible Left Dark Sidebar */}
        <React.Suspense fallback={<div className="w-60 bg-ink min-h-screen shrink-0" />}>
          <AdminSidebar
            isCollapsed={isSidebarCollapsed}
            activeSosCount={activeSosCount}
          />
        </React.Suspense>

        {/* Right Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <AdminTopbar
            isSidebarCollapsed={isSidebarCollapsed}
            onToggleSidebar={() => setIsSidebarCollapsed((prev) => !prev)}
            activeUnit={activeUnit}
            onSelectUnit={setActiveUnit}
            activeSosCount={activeSosCount}
            isLiveConnected={isLiveConnected}
          />
          <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
            {children}
          </main>
        </div>
      </div>
    </AdminContext.Provider>
  );
}

"use client";

import React, { useState, createContext, useContext } from "react";
import { AdminSidebar } from "./AdminSidebar";
import { AdminTopbar } from "./AdminTopbar";

interface AdminContextType {
  activeUnit: string;
  setActiveUnit: (unit: string) => void;
  activeUnitName: string;
}

const AdminContext = createContext<AdminContextType>({
  activeUnit: "semua",
  setActiveUnit: () => {},
  activeUnitName: "Posko Terpadu (Semua)",
});

export const useAdmin = () => useContext(AdminContext);

export function AdminShell({ children }: { children: React.ReactNode }) {
  const [activeUnit, setActiveUnit] = useState<string>("semua");

  const unitNames: Record<string, string> = {
    semua: "Posko Terpadu (Semua)",
    bnpb_bpbd: "BNPB / BPBD",
    damkar: "Dinas Pemadam Kebakaran",
    medis: "Dinas Kesehatan / RS",
    polisi: "Kepolisian (Polri)",
  };

  const activeUnitName = unitNames[activeUnit] || "Posko Terpadu";

  return (
    <AdminContext.Provider value={{ activeUnit, setActiveUnit, activeUnitName }}>
      <div className="flex h-screen w-full bg-bg text-ink overflow-hidden">
        {/* Left Fixed 240px Dark Sidebar */}
        <AdminSidebar activeUnit={activeUnit} onSelectUnit={setActiveUnit} />

        {/* Right Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <AdminTopbar activeUnitName={activeUnitName} />
          <main className="flex-1 overflow-y-auto p-4 md:p-8">
            {children}
          </main>
        </div>
      </div>
    </AdminContext.Provider>
  );
}

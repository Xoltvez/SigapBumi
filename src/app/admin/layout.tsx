import React from "react";
import type { Metadata } from "next";
import { AdminShell } from "@/components/layout/AdminShell";

export const metadata: Metadata = {
  title: "Dashboard Petugas BPBD & Penanggung Jawab - SigapBumi",
  description: "Pusat komando tanggap bencana, monitor SOS, dan verifikasi laporan warga.",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminShell>{children}</AdminShell>;
}

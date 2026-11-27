import React from "react";
import { NotifikasiClient } from "@/components/notifications/NotifikasiClient";

export const metadata = {
  title: "Pusat Notifikasi Status Laporan - SigapBumi",
  description: "Pemberitahuan real-time laporan bencana terbaru dan perubahan status penanganan laporan Anda.",
};

export default function NotifikasiPage() {
  return <NotifikasiClient />;
}

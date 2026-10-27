"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminLaporanRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Arahkan ke dashboard utama posko terpadu yang memuat antrean laporan masuk
    router.replace("/admin");
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-[400px] text-ink-muted text-sm">
      <p>Mengalihkan ke Antrean Laporan Bencana...</p>
    </div>
  );
}

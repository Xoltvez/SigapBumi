"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminStatistikRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Arahkan ke modul statistik kebencanaan
    router.replace("/statistik");
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-[400px] text-ink-muted text-sm">
      <p>Mengalihkan ke Analisis Statistik Kebencanaan...</p>
    </div>
  );
}

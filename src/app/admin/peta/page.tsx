"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminPetaRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Arahkan ke peta kejadian bencana
    router.replace("/peta");
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-[400px] text-ink-muted text-sm">
      <p>Mengalihkan ke Peta Sebaran Bencana...</p>
    </div>
  );
}

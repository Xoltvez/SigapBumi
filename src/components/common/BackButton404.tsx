"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export function BackButton404() {
  const router = useRouter();

  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/");
    }
  };

  return (
    <button
      type="button"
      onClick={handleBack}
      className="inline-flex items-center justify-center gap-2 h-11 px-5 rounded-md border border-line-strong bg-surface text-ink font-semibold text-sm hover:bg-surface-hover active:scale-[0.98]"
    >
      <ArrowLeft className="w-4 h-4" aria-hidden="true" />
      Kembali
    </button>
  );
}

import React from "react";
import { Siren, ArrowUp, Minus, ArrowDown } from "lucide-react";
import type { PriorityLabel } from "@/types";

interface PriorityBadgeProps {
  priority?: PriorityLabel | "tinggi" | "sedang" | "normal" | "rendah" | "kritis";
  className?: string;
}

export function PriorityBadge({ priority, className = "" }: PriorityBadgeProps) {
  // Normalisasi input
  const normalized = (priority || "sedang").toLowerCase();

  if (normalized === "kritis") {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-danger text-white shadow-sm ${className}`}
      >
        <Siren className="w-3.5 h-3.5 animate-pulse" />
        <span>Kritis</span>
      </span>
    );
  }

  if (normalized === "tinggi") {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-warning-soft text-warning-text border border-warning ${className}`}
      >
        <ArrowUp className="w-3.5 h-3.5" />
        <span>Tinggi</span>
      </span>
    );
  }

  if (normalized === "rendah") {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-bg text-ink-soft border border-line ${className}`}
      >
        <ArrowDown className="w-3.5 h-3.5" />
        <span>Rendah</span>
      </span>
    );
  }

  // Default: Sedang / Normal
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-info-soft text-info-text ${className}`}
    >
      <Minus className="w-3.5 h-3.5" />
      <span>Sedang</span>
    </span>
  );
}

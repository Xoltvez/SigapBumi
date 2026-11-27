"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface BackButtonProps {
  href?: string;
  onClick?: () => void;
  label?: string;
  className?: string;
  "data-reveal"?: string;
}

export const BACK_BUTTON_CLASS =
  "inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200/90 bg-white hover:bg-orange-50/80 hover:border-orange-300 text-xs font-bold text-slate-700 hover:text-orange-700 shadow-2xs transition-all cursor-pointer active:scale-[0.98]";

export function BackButton({
  href,
  onClick,
  label = "Kembali ke Beranda",
  className = "",
  "data-reveal": dataReveal,
}: BackButtonProps) {
  const combinedClass = `${BACK_BUTTON_CLASS} ${className}`.trim();

  if (href) {
    return (
      <Link href={href} data-reveal={dataReveal} className={combinedClass}>
        <ArrowLeft className="w-3.5 h-3.5 shrink-0" />
        <span>{label}</span>
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      data-reveal={dataReveal}
      className={combinedClass}
    >
      <ArrowLeft className="w-3.5 h-3.5 shrink-0" />
      <span>{label}</span>
    </button>
  );
}

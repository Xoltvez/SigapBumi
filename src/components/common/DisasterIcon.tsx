import React from "react";
import Image from "next/image";
import { DisasterType } from "@/types";

export interface DisasterMeta {
  label: string;
  iconUrl: string;
  color: string;
}

export const DISASTER_META: Record<DisasterType, DisasterMeta> = {
  banjir: {
    label: "Banjir",
    iconUrl: "/icon%20bencana/banjir.png",
    color: "text-blue-500",
  },
  tsunami: {
    label: "Tsunami & Banjir",
    iconUrl: "/icon%20bencana/banjir.png",
    color: "text-blue-500",
  },
  gempa: {
    label: "Gempa Bumi",
    iconUrl: "/icon%20bencana/gempa%20bumi.png",
    color: "text-amber-500",
  },
  kebakaran: {
    label: "Kebakaran",
    iconUrl: "/icon%20bencana/house-fire.png",
    color: "text-red-500",
  },
  longsor: {
    label: "Tanah Longsor",
    iconUrl: "/icon%20bencana/avalanche.png",
    color: "text-amber-700",
  },
  karhutla: {
    label: "Karhutla",
    iconUrl: "/icon%20bencana/fire.png",
    color: "text-orange-500",
  },
  lainnya: {
    label: "Lainnya",
    iconUrl: "/icon%20bencana/disaster-management.png",
    color: "text-slate-500",
  },
};

export function getDisasterMeta(type?: string): DisasterMeta {
  const key = (type || "").toLowerCase() as DisasterType;
  return DISASTER_META[key] || DISASTER_META.lainnya;
}

export function getDisasterLabel(type?: string): string {
  return getDisasterMeta(type).label;
}

interface DisasterIconProps {
  type?: string;
  size?: number;
  className?: string;
  alt?: string;
}

export default function DisasterIcon({
  type,
  size = 20,
  className = "",
  alt,
}: DisasterIconProps) {
  const meta = getDisasterMeta(type);

  return (
    <span
      className={`inline-flex items-center justify-center shrink-0 ${className}`}
      style={{ width: size, height: size }}
      title={meta.label}
    >
      <Image
        src={meta.iconUrl}
        alt={alt || meta.label}
        width={size}
        height={size}
        className="object-contain w-full h-full drop-shadow-2xs"
      />
    </span>
  );
}

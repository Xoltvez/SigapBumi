import React from "react";
import {
  Inbox,
  BadgeCheck,
  Loader,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import type { ReportStatus } from "@/types";

export interface TimelineStep {
  status: ReportStatus;
  label: string;
  timestamp?: string;
  note?: string;
  actor?: string;
}

interface TimelineStatusProps {
  currentStatus: ReportStatus;
  logs: TimelineStep[];
}

export function TimelineStatus({ currentStatus, logs }: TimelineStatusProps) {
  const isRejected = currentStatus === "ditolak";

  const standardSteps: { status: ReportStatus; label: string; icon: React.ElementType }[] = [
    { status: "diterima", label: "Laporan Diterima", icon: Inbox },
    { status: "diverifikasi", label: "Diverifikasi Relawan/Petugas", icon: BadgeCheck },
    { status: "ditindaklanjuti", label: "Sedang Ditindaklanjuti", icon: Loader },
    { status: "selesai", label: "Selesai Ditangani", icon: CheckCircle2 },
  ];

  // If rejected, replace or append rejected step
  const steps = isRejected
    ? [
        standardSteps[0],
        { status: "ditolak" as ReportStatus, label: "Laporan Ditolak (Tidak Valid / Duplikat)", icon: XCircle },
      ]
    : standardSteps;

  const getStepIndex = (status: ReportStatus) => {
    if (status === "diterima") return 0;
    if (status === "diverifikasi") return 1;
    if (status === "ditindaklanjuti") return 2;
    if (status === "selesai") return 3;
    if (status === "ditolak") return 1;
    return -1;
  };

  const currentIndex = getStepIndex(currentStatus);

  return (
    <div className="py-4">
      <div className="relative border-l-2 border-line ml-4 space-y-6">
        {steps.map((step, index) => {
          const isDone = index < currentIndex;
          const isCurrent = index === currentIndex;
          const isPending = index > currentIndex;

          // Find log matching this step
          const log = logs.find((l) => l.status === step.status);
          const Icon = step.icon;

          let nodeColor = "bg-surface border-line text-ink-muted";
          if (isDone) {
            nodeColor = "bg-primary border-primary text-white";
          } else if (isCurrent) {
            nodeColor = isRejected
              ? "bg-danger border-danger text-white ring-4 ring-danger-soft"
              : "bg-primary border-primary text-white ring-4 ring-primary-soft";
          }

          return (
            <div key={step.status} className="relative pl-6">
              {/* Dot / Icon Node */}
              <div
                className={`absolute -left-[17px] top-0.5 w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${nodeColor}`}
              >
                <Icon className="w-4 h-4" />
              </div>

              {/* Step Content */}
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h4
                    className={`text-sm font-bold ${
                      isPending ? "text-ink-muted" : "text-ink"
                    }`}
                  >
                    {step.label}
                  </h4>
                  {isCurrent && (
                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                        isRejected
                          ? "bg-danger-soft text-danger-text"
                          : "bg-primary-soft text-primary-hover"
                      }`}
                    >
                      Status Saat Ini
                    </span>
                  )}
                </div>

                {log?.timestamp && (
                  <p className="text-xs text-ink-muted mt-0.5 font-mono">
                    {log.timestamp}
                  </p>
                )}

                {log?.note && (
                  <div className="mt-2 p-3 bg-bg rounded-md border border-line text-xs text-ink-soft">
                    <p className="font-semibold text-ink mb-0.5">
                      Catatan Petugas {log.actor ? `(${log.actor})` : ""}:
                    </p>
                    <p className="leading-relaxed">{log.note}</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

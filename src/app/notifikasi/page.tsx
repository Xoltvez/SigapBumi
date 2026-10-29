import React from "react";
import Link from "next/link";
import {
  Bell,
  CheckCircle2,
  ChevronLeft,
  Search,
  Clock,
  Waves,
  Mountain,
} from "lucide-react";

export const metadata = {
  title: "Pusat Notifikasi Status Laporan - SigapBumi",
  description: "Pemberitahuan perubahan status penanganan laporan bencana terkini.",
};

const SAMPLE_NOTIFICATIONS = [
  {
    id: "notif-1",
    tracking_code: "LPR-8F3K2Q",
    title: "Laporan Banjir Telah Ditindaklanjuti",
    body: "Regu Damkar & TRC BPBD Sektor Barat telah tiba di lokasi Kalideres dengan 2 perahu karet evakuasi.",
    time: "25 menit lalu",
    unread: true,
    type: "banjir",
  },
  {
    id: "notif-2",
    tracking_code: "LPR-4K9W1Z",
    title: "Laporan Longsor Telah Diverifikasi",
    body: "Petugas posko telah memverifikasi laporan tebing ambrol di Cisarua. Berkoordinasi dengan tim alat berat.",
    time: "1 jam lalu",
    unread: false,
    type: "longsor",
  },
  {
    id: "notif-3",
    tracking_code: "LPR-2X7M9P",
    title: "Penanganan Kebakaran Dinyatakan Selesai",
    body: "Api di pemukiman Tambora telah padam sepenuhnya dan tahap pendinginan selesai.",
    time: "4 jam lalu",
    unread: false,
    type: "kebakaran",
  },
];

export default function NotifikasiPage() {
  return (
    <main className="flex-1 w-full max-w-[800px] mx-auto px-4 md:px-8 py-6 md:py-10 pb-28 md:pb-12 space-y-6">
      {/* Breadcrumb & Header */}
      <div>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-soft hover:text-ink mb-3 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Kembali ke Beranda</span>
        </Link>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full bg-primary-soft text-primary-hover flex items-center justify-center">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-ink">
                Pusat Notifikasi Warga
              </h1>
              <p className="text-xs text-ink-soft">
                Pembaruan riil status penanganan laporan kebencanaan Anda
              </p>
            </div>
          </div>
          <span className="text-xs px-2.5 py-1 rounded-full bg-primary-soft text-primary font-bold">
            1 Baru
          </span>
        </div>
      </div>

      {/* Notification List */}
      <div className="space-y-3">
        {SAMPLE_NOTIFICATIONS.map((item) => (
          <div
            key={item.id}
            className={`p-4 rounded-lg border transition-all ${
              item.unread
                ? "bg-surface border-primary/40 shadow-sm"
                : "bg-surface/80 border-line"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                    item.unread
                      ? "bg-primary-soft text-primary-hover"
                      : "bg-bg text-ink-muted"
                  }`}
                >
                  {item.type === "banjir" ? (
                    <Waves className="w-4 h-4" />
                  ) : item.type === "longsor" ? (
                    <Mountain className="w-4 h-4" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-bold text-ink">{item.title}</h2>
                    {item.unread && (
                      <span className="w-2 h-2 rounded-full bg-primary" />
                    )}
                  </div>
                  <p className="text-xs text-ink-soft leading-relaxed">
                    {item.body}
                  </p>
                  <div className="flex items-center gap-3 pt-1 text-[11px] text-ink-muted">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{item.time}</span>
                    </span>
                    <span>·</span>
                    <span className="font-mono font-semibold text-primary">
                      {item.tracking_code}
                    </span>
                  </div>
                </div>
              </div>

              <Link
                href={`/lacak?kode=${item.tracking_code}`}
                className="shrink-0 text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1 pt-1"
              >
                <Search className="w-3.5 h-3.5" />
                <span>Lihat Lacak</span>
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Info Notice */}
      <div className="p-3 bg-bg border border-line rounded-md text-xs text-ink-soft">
        <p>
          <strong>Catatan:</strong> Notifikasi otomatis diperbarui saat tim posko
          memverifikasi atau memperbarui status laporan Anda di sistem.
        </p>
      </div>
    </main>
  );
}

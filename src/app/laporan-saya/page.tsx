import React from "react";
import Link from "next/link";
import {
  Clock,
  MapPin,
  ChevronLeft,
  Search,
  Plus,
  ShieldCheck,
} from "lucide-react";

export const metadata = {
  title: "Daftar Laporan Saya - SigapBumi",
  description: "Daftar riwayat laporan bencana yang Anda kirimkan.",
};

const SAMPLE_MY_REPORTS = [
  {
    tracking_code: "LPR-8F3K2Q",
    title: "Banjir Luapan Kali Semanan 60 cm",
    location: "Kalideres, Jakarta Barat",
    date: "27 Okt 2026, 14:15 WIB",
    status: "ditindaklanjuti",
    statusLabel: "Ditindaklanjuti",
    statusColor: "bg-warning-soft text-warning-text border-warning/30",
  },
  {
    tracking_code: "LPR-4K9W1Z",
    title: "Tebing Penahan Longsor Ambrol",
    location: "Cisarua, Kab. Bogor",
    date: "27 Okt 2026, 15:30 WIB",
    status: "diverifikasi",
    statusLabel: "Diverifikasi",
    statusColor: "bg-info-soft text-info-text border-info/30",
  },
];

export default function LaporanSayaPage() {
  return (
    <main className="flex-1 w-full max-w-[900px] mx-auto px-4 md:px-8 py-6 md:py-10 pb-28 md:pb-12 space-y-6">
      <div>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-soft hover:text-ink mb-3 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Kembali ke Beranda</span>
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-ink">
              Riwayat Laporan Saya
            </h1>
            <p className="text-xs text-ink-soft mt-0.5">
              Pantau perkembangan seluruh laporan bencana yang Anda ajukan
            </p>
          </div>
          <Link
            href="/lapor"
            className="inline-flex items-center gap-2 h-10 px-4 rounded-md bg-primary hover:bg-primary-hover text-white text-xs font-semibold transition-colors shadow-sm self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Buat Laporan Baru</span>
          </Link>
        </div>
      </div>

      <div className="space-y-3">
        {SAMPLE_MY_REPORTS.map((report) => (
          <div
            key={report.tracking_code}
            className="bg-surface border border-line rounded-lg p-5 shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          >
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-primary">
                  {report.tracking_code}
                </span>
                <span
                  className={`text-[11px] font-semibold px-2 py-0.5 rounded border ${report.statusColor}`}
                >
                  {report.statusLabel}
                </span>
              </div>
              <h2 className="text-base font-bold text-ink">{report.title}</h2>
              <div className="flex flex-wrap items-center gap-3 text-xs text-ink-soft">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-primary" />
                  <span>{report.location}</span>
                </span>
                <span>·</span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-ink-muted" />
                  <span>{report.date}</span>
                </span>
              </div>
            </div>

            <Link
              href={`/lacak?kode=${report.tracking_code}`}
              className="inline-flex items-center justify-center gap-1.5 h-10 px-4 rounded-md border border-line-strong hover:bg-bg text-ink text-xs font-semibold transition-colors shrink-0"
            >
              <Search className="w-3.5 h-3.5 text-ink-muted" />
              <span>Buka Timeline Lacak</span>
            </Link>
          </div>
        ))}
      </div>

      <div className="p-3 bg-bg border border-line rounded-md text-xs text-ink-soft flex items-start gap-2">
        <ShieldCheck className="w-4 h-4 text-primary shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          Setiap laporan yang masuk akan diverifikasi oleh posko dan warga sekitar untuk menentukan tindakan cepat tim reaksi darurat.
        </p>
      </div>
    </main>
  );
}

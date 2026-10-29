"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  CheckCircle2,
  Copy,
  Check,
  Search,
  MapPin,
  Home,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";

function SuksesContent() {
  const searchParams = useSearchParams();
  const kode = searchParams.get("kode") || "LPR-8F3K2Q";
  const statusParam = searchParams.get("status");
  const isLocalOnly = statusParam === "local";
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(kode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <main className="flex-1 w-full max-w-[640px] mx-auto px-4 py-10 md:py-16 pb-28 md:pb-16 text-center">
      <div className="bg-surface border border-line rounded-lg p-6 md:p-10 shadow-card space-y-6">
        {/* Success Icon */}
        <div className="w-16 h-16 rounded-full bg-success-soft text-success flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
        </div>

        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-ink mb-2">
            Laporan Berhasil Dicatat!
          </h1>
          <p className="text-sm text-ink-soft leading-relaxed">
            {isLocalOnly
              ? "Laporan Anda telah tersimpan secara aman di penyimpanan perangkat (Mode Kesiapsiagaan Sinyal) dan siap disinkronkan ke posko penanggulangan bencana."
              : "Data kejadian telah masuk ke antrean verifikasi posko penanggulangan bencana dan relawan wilayah terdekat."}
          </p>
        </div>

        {/* Tracking Code Highlight Box */}
        <div className="bg-bg border-2 border-primary/20 rounded-lg p-5">
          <span className="text-xs font-semibold uppercase tracking-wider text-ink-muted block mb-1">
            Simpan Kode Tracking Laporan Anda
          </span>
          <div className="flex items-center justify-center gap-3">
            <span className="text-2xl md:text-3xl font-extrabold font-mono text-primary tracking-wider">
              {kode}
            </span>
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1 min-h-[44px] px-3.5 py-1.5 rounded-md border border-line bg-surface hover:bg-line text-xs font-semibold text-ink transition-colors shadow-sm"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-success" />
                  <span>Tersalin</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-ink-muted" />
                  <span>Salin Kode</span>
                </>
              )}
            </button>
          </div>
          <p className="text-xs text-ink-muted mt-2">
            Gunakan kode ini kapan saja di menu <strong>Lacak</strong> untuk melihat perkembangan penanganan petugas.
          </p>
        </div>

        {/* Reassurance Feature Note */}
        <div className="p-3.5 bg-primary-soft/50 rounded-md border border-primary/20 text-xs text-ink-soft flex items-start gap-2.5 text-left">
          <ShieldCheck className="w-4 h-4 text-primary shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong>Dukungan Warga Terbuka:</strong> Laporan Anda dapat dikonfirmasi oleh warga sekitar untuk otomatis menaikkan prioritas penanganan tim lapangan.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href={`/lacak?kode=${kode}`}
            className="w-full sm:w-auto min-h-[44px] px-6 rounded-md bg-primary hover:bg-primary-hover text-white font-semibold text-sm inline-flex items-center justify-center gap-2 transition-colors shadow-sm"
          >
            <Search className="w-4 h-4" />
            <span>Lacak Status Sekarang</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </Link>

          <Link
            href="/peta"
            className="w-full sm:w-auto min-h-[44px] px-5 rounded-md border border-line-strong bg-surface hover:bg-bg text-ink font-semibold text-sm inline-flex items-center justify-center gap-2 transition-colors"
          >
            <MapPin className="w-4 h-4 text-ink-soft" />
            <span>Lihat di Peta Bencana</span>
          </Link>
        </div>

        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-muted hover:text-ink transition-colors"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Kembali ke Halaman Utama</span>
          </Link>
        </div>
      </div>
    </main>
  );
}

export default function LaporSuksesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 max-w-[640px] mx-auto p-12 text-center text-ink-muted">
          Memuat konfirmasi laporan...
        </div>
      }
    >
      <SuksesContent />
    </Suspense>
  );
}

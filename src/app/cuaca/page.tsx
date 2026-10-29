import React from "react";
import Link from "next/link";
import {
  CloudSun,
  Activity,
  Radio,
  ExternalLink,
  ChevronLeft,
  AlertTriangle,
  Info,
} from "lucide-react";

export const metadata = {
  title: "Peringatan Dini Cuaca & Gempa BMKG - SigapBumi",
  description:
    "Rujukan informasi cuaca ekstrem, peringatan gelombang, dan data gempa bumi terkini dari BMKG.",
};

export default function CuacaPage() {
  return (
    <main className="flex-1 w-full max-w-[1000px] mx-auto px-4 md:px-8 py-6 md:py-10 pb-28 md:pb-12 space-y-8">
      {/* Breadcrumb & Header */}
      <div>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-soft hover:text-ink mb-3 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Kembali ke Beranda</span>
        </Link>
        <div className="flex items-center gap-2 mb-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-warning-soft text-warning-text border border-warning/20">
            <Radio className="w-3.5 h-3.5" />
            <span>Rujukan Resmi BMKG</span>
          </span>
          <span className="text-xs text-ink-muted">· Indonesia</span>
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-ink">
          Informasi Cuaca & Peringatan Dini
        </h1>
        <p className="text-sm text-ink-soft mt-1 leading-relaxed">
          Penyedia data kebencanaan atmosfer dan geofisika resmi Indonesia. SigapBumi merujuk langsung ke sistem Badan Meteorologi, Klimatologi, dan Geofisika (BMKG).
        </p>
      </div>

      {/* Official Source Transparency Box */}
      <div className="bg-surface border border-line rounded-lg p-5 shadow-card space-y-3">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs text-ink-soft">
            <p className="font-bold text-sm text-ink">
              Keterbukaan Data Sumber (Data Truthfulness)
            </p>
            <p className="leading-relaxed">
              Untuk menjamin keandalan data keselamatan masyarakat dan menghindari misinformasi, data peringatan dini cuaca, siklon tropis, dan gempa bumi M 5.0+ wajib diverifikasi dari kanal terpusat BMKG.
            </p>
          </div>
        </div>
      </div>

      {/* Official Portals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* BMKG Cuaca Card */}
        <div className="bg-surface border border-line rounded-lg p-5 shadow-card flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-md bg-info-soft text-info flex items-center justify-center">
              <CloudSun className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-ink">
                Peringatan Dini Cuaca & Angin Kencang
              </h2>
              <p className="text-xs text-ink-muted mt-0.5">
                Prakiraan potensi hujan lebat, kilat, dan cuaca ekstrem berbasis kabupaten/kota.
              </p>
            </div>
            <ul className="text-xs text-ink-soft space-y-1.5 list-disc list-inside">
              <li>Peringatan cuaca ekstrem 3 harian</li>
              <li>Peta citra radar cuaca real-time</li>
              <li>Prakiraan tinggi gelombang laut dan pasang rob</li>
            </ul>
          </div>

          <a
            href="https://www.bmkg.go.id/cuaca/peringatan-dini-cuaca.bmkg"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-md bg-primary hover:bg-primary-hover text-white text-xs font-semibold transition-colors shadow-sm focus-visible:outline-primary"
          >
            <span>Buka Peringatan Cuaca BMKG</span>
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>

        {/* BMKG Gempa Card */}
        <div className="bg-surface border border-line rounded-lg p-5 shadow-card flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-md bg-warning-soft text-warning flex items-center justify-center">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-ink">
                Pusat Gempa Bumi & Tsunami (InaTEWS)
              </h2>
              <p className="text-xs text-ink-muted mt-0.5">
                Monitoring getaran gempa bumi berkekuatan M 5.0+ dan potensi tsunami di seluruh Indonesia.
              </p>
            </div>
            <ul className="text-xs text-ink-soft space-y-1.5 list-disc list-inside">
              <li>Informasi gempa bumi dirasakan terkini</li>
              <li>Peta episenter dan kedalaman hiposenter</li>
              <li>Status potensi tsunami (Waspada, Siaga, Awas)</li>
            </ul>
          </div>

          <a
            href="https://inatews.bmkg.go.id"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-md bg-ink hover:bg-ink-soft text-white text-xs font-semibold transition-colors shadow-sm focus-visible:outline-ink"
          >
            <span>Buka Portal InaTEWS BMKG</span>
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>

      {/* Practical Safety Tips */}
      <div className="bg-bg border border-line rounded-lg p-5 space-y-3">
        <h3 className="text-sm font-bold text-ink flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-warning" />
          <span>Panduan Saat Peringatan Cuaca Ekstrem Aktif</span>
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-ink-soft">
          <div className="bg-surface p-3 rounded border border-line">
            <p className="font-semibold text-ink mb-1">Angin Kencang</p>
            <p>Jauhi pohon rindang tua, tiang listrik, dan baliho reklame besar saat hujan deras.</p>
          </div>
          <div className="bg-surface p-3 rounded border border-line">
            <p className="font-semibold text-ink mb-1">Potensi Banjir</p>
            <p>Simpan dokumen penting di tempat tinggi dan amankan instalasi listrik rumah.</p>
          </div>
          <div className="bg-surface p-3 rounded border border-line">
            <p className="font-semibold text-ink mb-1">Wilayah Pesisir</p>
            <p>Hindari berlayar atau beraktivitas di bibir pantai saat peringatan gelombang tinggi aktif.</p>
          </div>
        </div>
      </div>
    </main>
  );
}

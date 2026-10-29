import React from "react";
import Link from "next/link";
import {
  HeartPulse,
  MapPin,
  ExternalLink,
  ChevronLeft,
  PhoneCall,
  Info,
  ShieldCheck,
} from "lucide-react";

export const metadata = {
  title: "Informasi Fasilitas Kesehatan & IGD Terdekat - SigapBumi",
  description:
    "Rujukan rumah sakit rujukan, puskesmas 24 jam, dan panduan kedaruratan medis saat bencana.",
};

const SAMPLE_FACILITIES = [
  {
    name: "RSUD Kalideres (Rujukan Jakarta Barat)",
    type: "Rumah Sakit Umum Daerah",
    address: "Jl. Satu Maret No.48, Kalideres, Jakarta Barat",
    phone: "021-54376442",
    emergency: "IGD 24 Jam Buka",
    distance: "1.2 km dari Posko Semanan",
    badge: "Faskes Rujukan Banjir",
  },
  {
    name: "RSUD Ciawi (Rujukan Bencana Puncak/Bogor)",
    type: "Rumah Sakit Umum Daerah",
    address: "Jl. Raya Puncak No.479, Ciawi, Kab. Bogor",
    phone: "0251-8240797",
    emergency: "IGD & Bedah 24 Jam",
    distance: "4.8 km dari Cisarua",
    badge: "Faskes Rujukan Longsor",
  },
  {
    name: "RSUD Tarakan (Pusat Trauma Kebencanaan)",
    type: "RSUD Khusus Rujukan Bencana",
    address: "Jl. Kyai Caringin No.7, Gambir, Jakarta Pusat",
    phone: "021-3503003",
    emergency: "IGD & Trauma Center 24 Jam",
    distance: "Akses Pusat Ibu Kota",
    badge: "Trauma Center Terpadu",
  },
  {
    name: "Puskesmas Kecamatan Tambora",
    type: "Puskesmas Rawat Inap",
    address: "Jl. Krendang Barat No.18, Tambora, Jakarta Barat",
    phone: "021-6310245",
    emergency: "Persalinan & Rawat 24 Jam",
    distance: "0.8 km dari Sektor Tambora",
    badge: "Pertolongan Pertama",
  },
];

export default function FasilitasPage() {
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
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-danger-soft text-danger-text border border-danger/20">
            <HeartPulse className="w-3.5 h-3.5" />
            <span>Kesiapsiagaan Medis</span>
          </span>
          <span className="text-xs text-ink-muted">· OpenStreetMap Data</span>
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-ink">
          Fasilitas Kesehatan & Rujukan IGD
        </h1>
        <p className="text-sm text-ink-soft mt-1 leading-relaxed">
          Daftar rumah sakit rujukan darurat dan puskesmas siaga di sekitar titik posko penanggulangan bencana.
        </p>
      </div>

      {/* Transparency & Disclaimer Box */}
      <div className="bg-surface border border-line rounded-lg p-5 shadow-card space-y-3">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs text-ink-soft">
            <p className="font-bold text-sm text-ink">
              Catatan Keterbukaan Data Faskes:
            </p>
            <p className="leading-relaxed">
              Daftar fasilitas kesehatan berikut disiapkan sebagai rujukan demonstrasi operasional WIA 2026 berdasarkan titik kejadian banjir dan longsor di area simulasi. Dalam situasi gawat darurat aktual, hubungi <strong>119</strong> untuk koordinasi ketersediaan bed ICU dan ambulans evakuasi resmi.
            </p>
          </div>
        </div>
      </div>

      {/* Facilities Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {SAMPLE_FACILITIES.map((facility) => {
          const cleanPhone = facility.phone.replace(/[^0-9]/g, "");

          return (
            <div
              key={facility.name}
              className="bg-surface border border-line rounded-lg p-5 shadow-card flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-primary-soft text-primary-hover border border-primary/20">
                    {facility.badge}
                  </span>
                  <span className="text-[11px] font-bold text-success-text bg-success-soft px-2 py-0.5 rounded">
                    {facility.emergency}
                  </span>
                </div>

                <h2 className="text-base font-bold text-ink pt-1">
                  {facility.name}
                </h2>
                <p className="text-xs text-ink-muted font-medium">
                  {facility.type}
                </p>

                <p className="text-xs text-ink-soft flex items-start gap-1.5 pt-1">
                  <MapPin className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                  <span>{facility.address}</span>
                </p>
                <p className="text-xs text-ink-muted font-medium pl-5">
                  Perkiraan Jarak: {facility.distance}
                </p>
              </div>

              <div className="pt-3 border-t border-line flex items-center justify-between">
                <span className="text-xs font-mono font-semibold text-ink">
                  {facility.phone}
                </span>
                <a
                  href={`tel:${cleanPhone}`}
                  className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-md bg-danger hover:bg-danger/90 text-white text-xs font-bold transition-colors shadow-sm focus-visible:outline-danger"
                >
                  <PhoneCall className="w-3.5 h-3.5" />
                  <span>Hubungi IGD</span>
                </a>
              </div>
            </div>
          );
        })}
      </div>

      {/* OpenStreetMap Attribution */}
      <div className="p-4 bg-bg rounded-md border border-line text-xs text-ink-soft flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-primary" />
          <span>Atribusi Data: OpenStreetMap Contributors (ODbL) & Kemenkes RI</span>
        </div>
        <a
          href="https://www.openstreetmap.org"
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary-hover font-semibold hover:underline inline-flex items-center gap-1"
        >
          <span>OpenStreetMap</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
    </main>
  );
}

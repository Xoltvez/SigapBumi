import React from "react";
import Link from "next/link";
import {
  PhoneCall,
  Flame,
  LifeBuoy,
  Shield,
  HeartPulse,
  Radio,
  ExternalLink,
  ChevronLeft,
  AlertTriangle,
} from "lucide-react";

export const metadata = {
  title: "Daftar Kontak Darurat Nasional & Daerah - SigapBumi",
  description:
    "Nomor telepon darurat resmi kepolisian, pemadam kebakaran, SAR, ambulans, dan BNPB di Indonesia.",
};

const EMERGENCY_CONTACTS = [
  {
    number: "112",
    title: "Layanan Panggilan Darurat Nasional (NTE 112)",
    agency: "Kemenkominfo & Pemerintah Daerah",
    description:
      "Layanan bebas pulsa untuk semua kondisi darurat: medis, kebakaran, kecelakaan, dan bencana alam. Dapat dihubungi dari ponsel tanpa pulsa atau SIM card.",
    icon: PhoneCall,
    color: "bg-danger text-white",
    badge: "Bebas Pulsa 24 Jam",
  },
  {
    number: "113",
    title: "Pemadam Kebakaran (Damkar)",
    agency: "Dinas Pemadam Kebakaran & Penyelamatan",
    description:
      "Penanganan kebakaran pemukiman, kebakaran hutan dan lahan, penyelamatan darurat, dan evakuasi satwa berbahaya.",
    icon: Flame,
    color: "bg-warning text-white",
    badge: "24 Jam",
  },
  {
    number: "115",
    title: "Badan SAR Nasional (BASARNAS)",
    agency: "Badan Nasional Pencarian dan Pertolongan",
    description:
      "Operasi pencarian dan pertolongan korban musibah pelayaran, penerbangan, bencana alam, dan kondisi membahayakan manusia.",
    icon: LifeBuoy,
    color: "bg-primary text-white",
    badge: "Operasi SAR 24 Jam",
  },
  {
    number: "119",
    title: "Layanan Ambulans & Kedaruratan Medis",
    agency: "Kementerian Kesehatan RI",
    description:
      "Pertolongan pertama pada kecelakaan dan serangan medis akut, pengiriman ambulans gawat darurat, dan rujukan rumah sakit terdekat.",
    icon: HeartPulse,
    color: "bg-danger text-white",
    badge: "Medis 24 Jam",
  },
  {
    number: "110",
    title: "Kepolisian Republik Indonesia (Polri)",
    agency: "Polri",
    description:
      "Laporan gangguan ketertiban masyarakat, tindak kriminal, penutupan jalur lalu lintas akibat bencana, dan pengamanan lokasi kejadian.",
    icon: Shield,
    color: "bg-info text-white",
    badge: "24 Jam",
  },
  {
    number: "021-29827793",
    title: "Pusdalops BNPB RI",
    agency: "Badan Nasional Penanggulangan Bencana",
    description:
      "Pusat Pengendalian Operasi penanggulangan bencana nasional dan koordinasi tanggap darurat antar-provinsi.",
    icon: Radio,
    color: "bg-ink text-white",
    badge: "Hotline Bencana",
  },
];

export default function KontakDaruratPage() {
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
        <h1 className="text-2xl md:text-3xl font-bold text-ink">
          Daftar Kontak Darurat Resmi
        </h1>
        <p className="text-sm text-ink-soft mt-1 leading-relaxed">
          Nomor darurat resmi instansi pemerintah Republik Indonesia. Seluruh nomor dapat dihubungi langsung dari perangkat Anda saat situasi darurat.
        </p>
      </div>

      {/* Emergency Notice */}
      <div className="bg-danger-soft border-l-4 border-danger p-4 rounded-md text-xs text-danger-text flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-danger" />
        <div className="space-y-1">
          <p className="font-bold text-sm">Panduan Menghubungi Layanan Darurat</p>
          <p className="leading-relaxed">
            Tetap tenang, sebutkan nama Anda, lokasi kejadian secara spesifik (patokan jalan atau RT/RW), jenis keadaan darurat, dan jumlah korban yang membutuhkan pertolongan. Jangan menutup telepon sebelum petugas mengizinkan.
          </p>
        </div>
      </div>

      {/* Grid of Emergency Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {EMERGENCY_CONTACTS.map((contact) => {
          const Icon = contact.icon;
          const cleanPhone = contact.number.replace(/[^0-9]/g, "");

          return (
            <div
              key={contact.number}
              className="bg-surface border border-line rounded-lg p-5 shadow-card flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-md flex items-center justify-center shrink-0 ${contact.color}`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-ink">
                        {contact.title}
                      </h2>
                      <span className="text-xs text-ink-muted">
                        {contact.agency}
                      </span>
                    </div>
                  </div>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-bg text-ink-soft border border-line shrink-0">
                    {contact.badge}
                  </span>
                </div>
                <p className="text-xs text-ink-soft leading-relaxed">
                  {contact.description}
                </p>
              </div>

              <div className="pt-3 border-t border-line flex items-center justify-between">
                <span className="text-xl font-bold font-mono text-ink tracking-wide">
                  {contact.number}
                </span>
                <a
                  href={`tel:${cleanPhone}`}
                  className="inline-flex items-center gap-2 h-10 px-4 rounded-md bg-danger hover:bg-danger/90 text-white text-xs font-bold transition-colors shadow-sm focus-visible:outline-danger"
                >
                  <PhoneCall className="w-4 h-4" />
                  <span>Panggil {contact.number}</span>
                </a>
              </div>
            </div>
          );
        })}
      </div>

      {/* External Resources */}
      <div className="bg-surface border border-line rounded-lg p-5 text-xs text-ink-soft space-y-2">
        <p className="font-semibold text-ink">Sumber Rujukan Kanal Resmi:</p>
        <div className="flex flex-wrap gap-4 font-medium">
          <a
            href="https://layanan112.kominfo.go.id"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-primary-hover hover:underline"
          >
            <span>Direktorat Layanan Darurat 112 Kominfo</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
          <a
            href="https://bnpb.go.id"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-primary-hover hover:underline"
          >
            <span>Badan Nasional Penanggulangan Bencana (BNPB)</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </main>
  );
}

import Link from "next/link";
import {
  AlertTriangle,
  MapPin,
  Search,
  Clock,
  ShieldCheck,
  Radio,
  ExternalLink,
  ChevronRight,
  Flame,
  Waves,
  Activity,
  Trees,
  Mountain,
} from "lucide-react";

export default function HomePage() {
  return (
    <main className="flex-1 w-full max-w-[1200px] mx-auto px-4 md:px-8 py-6 md:py-10 space-y-8">
      {/* Official Weather/Alert Banner from BMKG */}
      <section
        aria-label="Peringatan Dini Cuaca BMKG"
        className="bg-warning-soft border-l-4 border-warning p-4 rounded-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-card"
      >
        <div className="flex items-start gap-3">
          <div className="p-1 rounded bg-warning text-white shrink-0 mt-0.5 sm:mt-0">
            <Radio className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-warning-text uppercase tracking-wider">
                Peringatan Dini BMKG
              </span>
              <span className="text-xs text-ink-muted">· 10 menit lalu</span>
            </div>
            <p className="text-sm font-medium text-ink mt-0.5">
              Waspada potensi hujan lebat disertai kilat dan angin kencang di sebagian wilayah pesisir barat dan selatan.
            </p>
          </div>
        </div>
        <Link
          href="/cuaca"
          className="text-xs font-semibold text-warning-text hover:underline inline-flex items-center gap-1 shrink-0"
        >
          <span>Detail Cuaca</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </section>

      {/* Hero Section */}
      <section className="bg-surface border border-line rounded-lg p-6 md:p-10 shadow-card">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-soft text-primary-hover text-xs font-semibold mb-4">
            <ShieldCheck className="w-4 h-4" />
            <span>Civic Reporting & Accountability</span>
          </div>

          <h1 className="text-2xl md:text-4xl font-bold text-ink leading-tight mb-3">
            Layanan Pelaporan Bencana Cepat, Terbuka, dan Transparan
          </h1>

          <p className="text-ink-soft text-base md:text-lg mb-8 leading-relaxed">
            Laporkan kejadian bencana di sekitar Anda secara langsung. Laporan
            akan diverifikasi oleh relawan dan diteruskan ke posko penanganan
            BNPB/BPBD dengan kode pelacakan terbuka.
          </p>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <Link
              href="/lapor"
              className="inline-flex items-center justify-center h-12 px-6 rounded-md bg-primary hover:bg-primary-hover text-white font-semibold text-base transition-colors shadow-sm focus-visible:outline-primary"
            >
              Lapor Bencana Sekarang
            </Link>
            <Link
              href="/peta"
              className="inline-flex items-center justify-center h-12 px-6 rounded-md border border-line-strong bg-white hover:bg-bg text-ink font-semibold text-base transition-colors focus-visible:outline-primary"
            >
              <MapPin className="w-4 h-4 mr-2 text-ink-soft" />
              Pantau Peta Kejadian
            </Link>
            <Link
              href="/lacak"
              className="inline-flex items-center justify-center h-12 px-6 rounded-md bg-transparent hover:bg-bg text-ink-soft hover:text-ink font-semibold text-base transition-colors focus-visible:outline-primary"
            >
              <Search className="w-4 h-4 mr-2" />
              Lacak Status Laporan
            </Link>
          </div>
        </div>
      </section>

      {/* Kategori Bencana Cepat */}
      <section aria-labelledby="kategori-title">
        <div className="flex items-center justify-between mb-4">
          <h2 id="kategori-title" className="text-lg md:text-xl font-bold text-ink">
            Kategori Kejadian
          </h2>
          <span className="text-xs text-ink-muted">Pilih untuk lapor cepat</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          <Link
            href="/lapor?tipe=banjir"
            className="flex flex-col items-center p-4 bg-surface border border-line rounded-md hover:border-primary hover:bg-primary-soft/30 transition-all text-center group"
          >
            <div className="w-12 h-12 rounded-full bg-info-soft text-info flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
              <Waves className="w-6 h-6" />
            </div>
            <span className="text-sm font-semibold text-ink">Banjir</span>
          </Link>

          <Link
            href="/lapor?tipe=gempa"
            className="flex flex-col items-center p-4 bg-surface border border-line rounded-md hover:border-primary hover:bg-primary-soft/30 transition-all text-center group"
          >
            <div className="w-12 h-12 rounded-full bg-warning-soft text-warning flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
              <Activity className="w-6 h-6" />
            </div>
            <span className="text-sm font-semibold text-ink">Gempa Bumi</span>
          </Link>

          <Link
            href="/lapor?tipe=kebakaran"
            className="flex flex-col items-center p-4 bg-surface border border-line rounded-md hover:border-primary hover:bg-primary-soft/30 transition-all text-center group"
          >
            <div className="w-12 h-12 rounded-full bg-danger-soft text-danger flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
              <Flame className="w-6 h-6" />
            </div>
            <span className="text-sm font-semibold text-ink">Kebakaran</span>
          </Link>

          <Link
            href="/lapor?tipe=longsor"
            className="flex flex-col items-center p-4 bg-surface border border-line rounded-md hover:border-primary hover:bg-primary-soft/30 transition-all text-center group"
          >
            <div className="w-12 h-12 rounded-full bg-line text-ink flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
              <Mountain className="w-6 h-6" />
            </div>
            <span className="text-sm font-semibold text-ink">Tanah Longsor</span>
          </Link>

          <Link
            href="/lapor?tipe=karhutla"
            className="flex flex-col items-center p-4 bg-surface border border-line rounded-md hover:border-primary hover:bg-primary-soft/30 transition-all text-center group"
          >
            <div className="w-12 h-12 rounded-full bg-warning-soft text-warning flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
              <Trees className="w-6 h-6" />
            </div>
            <span className="text-sm font-semibold text-ink">Karhutla</span>
          </Link>

          <Link
            href="/lapor?tipe=lainnya"
            className="flex flex-col items-center p-4 bg-surface border border-line rounded-md hover:border-primary hover:bg-primary-soft/30 transition-all text-center group"
          >
            <div className="w-12 h-12 rounded-full bg-bg text-ink-muted flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <span className="text-sm font-semibold text-ink">Lainnya</span>
          </Link>
        </div>
      </section>

      {/* Ringkasan Statistik Publik */}
      <section aria-labelledby="stats-title">
        <h2 id="stats-title" className="text-lg md:text-xl font-bold text-ink mb-4">
          Statistik & Respons Kebencanaan
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-surface border border-line rounded-md p-5 shadow-card">
            <span className="text-xs font-semibold uppercase text-ink-muted">
              Laporan Terverifikasi
            </span>
            <p className="text-3xl font-bold text-ink mt-2 tabular-nums">
              142
            </p>
            <p className="text-xs text-success-text mt-1 flex items-center gap-1">
              <span className="inline-block w-2 h-2 rounded-full bg-success"></span>
              94% telah ditindaklanjuti
            </p>
          </div>

          <div className="bg-surface border border-line rounded-md p-5 shadow-card">
            <span className="text-xs font-semibold uppercase text-ink-muted">
              Waktu Respons Rata-rata
            </span>
            <p className="text-3xl font-bold text-ink mt-2 tabular-nums">
              18 <span className="text-lg font-normal text-ink-soft">menit</span>
            </p>
            <p className="text-xs text-ink-muted mt-1 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              Dari laporan masuk ke verifikasi
            </p>
          </div>

          <div className="bg-surface border border-line rounded-md p-5 shadow-card">
            <span className="text-xs font-semibold uppercase text-ink-muted">
              Peringatan Siaga Aktif
            </span>
            <p className="text-3xl font-bold text-warning-text mt-2 tabular-nums">
              3 <span className="text-lg font-normal text-ink-soft">wilayah</span>
            </p>
            <p className="text-xs text-ink-muted mt-1">
              Sumber terintegrasi BMKG & BPBD
            </p>
          </div>
        </div>
      </section>

      {/* Tautan Sumber Resmi BMKG & Kontak */}
      <section className="bg-surface border border-line rounded-md p-6 shadow-card">
        <h2 className="text-base font-bold text-ink mb-2">
          Sumber Informasi & Kanal Resmi
        </h2>
        <p className="text-xs text-ink-soft mb-4">
          Data kebencanaan dan cuaca diperbarui secara berkala merujuk pada instansi resmi pemerintah Republik Indonesia.
        </p>
        <div className="flex flex-wrap gap-4 text-xs font-semibold">
          <a
            href="https://www.bmkg.go.id"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-primary-hover hover:underline"
          >
            <span>Portal Resmi BMKG</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
          <a
            href="https://bnpb.go.id"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-primary-hover hover:underline"
          >
            <span>Portal Resmi BNPB</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
          <Link
            href="/fasilitas"
            className="inline-flex items-center gap-1.5 text-primary-hover hover:underline"
          >
            <span>Fasilitas Kesehatan Terdekat</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
          <Link
            href="/kontak-darurat"
            className="inline-flex items-center gap-1.5 text-primary-hover hover:underline"
          >
            <span>Daftar Kontak Darurat</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </section>
    </main>
  );
}

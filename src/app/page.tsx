import Link from "next/link";
import {
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
  AlertTriangle,
  PhoneCall,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

export default function HomePage() {
  return (
    <main className="flex-1 w-full max-w-[1200px] mx-auto px-4 md:px-8 py-6 md:py-8 space-y-8">
      {/* Official Weather/Alert Banner from BMKG */}
      <section
        aria-label="Peringatan Dini Cuaca BMKG"
        className="bg-warning-soft border-l-4 border-warning px-4 py-3 rounded-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-card"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-warning/20 flex items-center justify-center text-warning-text shrink-0">
            <Radio className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-warning-text uppercase tracking-wider">
                Peringatan Dini BMKG
              </span>
              <span className="text-xs text-ink-muted">· Diperbarui 10 menit lalu</span>
            </div>
            <p className="text-sm font-medium text-ink mt-0.5">
              Waspada potensi hujan lebat disertai kilat dan angin kencang di sebagian wilayah pesisir barat dan selatan.
            </p>
          </div>
        </div>
        <Link
          href="/cuaca"
          className="text-xs font-semibold text-warning-text hover:underline inline-flex items-center gap-1 shrink-0 self-end sm:self-center"
        >
          <span>Detail Cuaca</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </section>

      {/* Hero Section (Balanced 2-Column Layout) */}
      <section className="bg-surface border border-line rounded-lg p-6 md:p-8 shadow-card">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Column: Hero Text & Actions */}
          <div className="lg:col-span-7 flex flex-col items-start">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-soft text-primary-hover text-xs font-semibold mb-4">
              <ShieldCheck className="w-4 h-4" />
              <span>Civic Reporting & Accountability</span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-ink leading-tight mb-4">
              Layanan Pelaporan Bencana Cepat, Terbuka, dan Transparan
            </h1>

            <p className="text-ink-soft text-base md:text-lg mb-8 leading-relaxed">
              Laporkan kejadian bencana di sekitar Anda secara langsung. Laporan
              diverifikasi oleh relawan, diteruskan ke posko penanganan
              BNPB/BPBD, dan dapat dilacak oleh publik secara transparan.
            </p>

            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
              <Link
                href="/lapor"
                className="inline-flex items-center justify-center h-12 px-6 rounded-md bg-primary hover:bg-primary-hover text-white font-semibold text-base transition-colors shadow-sm focus-visible:outline-primary whitespace-nowrap"
              >
                Lapor Bencana
              </Link>
              <Link
                href="/peta"
                className="inline-flex items-center justify-center h-12 px-5 rounded-md border border-line-strong bg-surface hover:bg-bg text-ink font-semibold text-base transition-colors focus-visible:outline-primary whitespace-nowrap"
              >
                <MapPin className="w-4 h-4 mr-2 text-ink-soft" />
                Pantau Peta
              </Link>
              <Link
                href="/lacak"
                className="inline-flex items-center justify-center h-12 px-4 rounded-md text-ink-soft hover:text-ink hover:bg-bg font-semibold text-sm transition-colors focus-visible:outline-primary whitespace-nowrap"
              >
                <Search className="w-4 h-4 mr-1.5 text-ink-muted" />
                Lacak Laporan
              </Link>
            </div>
          </div>

          {/* Right Column: Live Status & Reassurance Widget */}
          <div className="lg:col-span-5 bg-bg border border-line rounded-lg p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-success"></span>
                </span>
                <span className="text-xs font-bold text-ink uppercase tracking-wider">
                  Posko Siaga Kebencanaan
                </span>
              </div>
              <span className="text-xs text-ink-muted font-mono">Live Update</span>
            </div>

            {/* Laporan Terkini Preview */}
            <div className="space-y-2.5">
              <div className="bg-surface p-3 rounded-md border border-line flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded bg-info-soft text-info flex items-center justify-center shrink-0">
                    <Waves className="w-4 h-4" />
                  </div>
                  <div className="truncate">
                    <p className="font-semibold text-ink truncate">Genangan Air 40 cm</p>
                    <p className="text-ink-muted truncate">Cengkareng, Jakarta Barat</p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-info-soft text-info-text font-semibold shrink-0">
                  Diverifikasi
                </span>
              </div>

              <div className="bg-surface p-3 rounded-md border border-line flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded bg-danger-soft text-danger flex items-center justify-center shrink-0">
                    <Flame className="w-4 h-4" />
                  </div>
                  <div className="truncate">
                    <p className="font-semibold text-ink truncate">Kebakaran Lahan</p>
                    <p className="text-ink-muted truncate">Cibinong, Kab. Bogor</p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-warning-soft text-warning-text font-semibold shrink-0">
                  Ditangani
                </span>
              </div>
            </div>

            {/* Key Reassurance Metrics */}
            <div className="pt-2 border-t border-line flex items-center justify-between text-xs text-ink-soft">
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-primary" />
                <span>Respons: <strong className="text-ink font-semibold">~18 Menit</strong></span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-success" />
                <span>Terverifikasi BPBD</span>
              </div>
            </div>

            {/* Emergency Call Box */}
            <div className="bg-danger-soft/70 border border-danger/20 rounded-md p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <PhoneCall className="w-4 h-4 text-danger" />
                <span className="text-xs font-semibold text-danger-text">
                  Panggilan Darurat Bebas Pulsa
                </span>
              </div>
              <a
                href="tel:112"
                className="px-2.5 py-1 rounded bg-danger text-white text-xs font-bold hover:bg-danger/90 transition-colors"
              >
                Hubungi 112
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Kategori Bencana Cepat */}
      <section aria-labelledby="kategori-title">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 id="kategori-title" className="text-lg md:text-xl font-bold text-ink">
              Kategori Kejadian
            </h2>
            <p className="text-xs text-ink-soft mt-0.5">
              Pilih kategori bencana untuk mempercepat pengisian formulir
            </p>
          </div>
          <Link
            href="/lapor"
            className="text-xs font-semibold text-primary hover:text-primary-hover inline-flex items-center gap-0.5"
          >
            <span>Semua Kategori</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          <Link
            href="/lapor?tipe=banjir"
            className="flex flex-col items-center justify-center p-4 bg-surface border border-line rounded-md hover:border-primary hover:bg-primary-soft/30 transition-all text-center group"
          >
            <div className="w-12 h-12 rounded-full bg-info-soft text-info flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform">
              <Waves className="w-6 h-6" />
            </div>
            <span className="text-sm font-semibold text-ink">Banjir</span>
          </Link>

          <Link
            href="/lapor?tipe=gempa"
            className="flex flex-col items-center justify-center p-4 bg-surface border border-line rounded-md hover:border-primary hover:bg-primary-soft/30 transition-all text-center group"
          >
            <div className="w-12 h-12 rounded-full bg-warning-soft text-warning flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform">
              <Activity className="w-6 h-6" />
            </div>
            <span className="text-sm font-semibold text-ink">Gempa Bumi</span>
          </Link>

          <Link
            href="/lapor?tipe=kebakaran"
            className="flex flex-col items-center justify-center p-4 bg-surface border border-line rounded-md hover:border-primary hover:bg-primary-soft/30 transition-all text-center group"
          >
            <div className="w-12 h-12 rounded-full bg-danger-soft text-danger flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform">
              <Flame className="w-6 h-6" />
            </div>
            <span className="text-sm font-semibold text-ink">Kebakaran</span>
          </Link>

          <Link
            href="/lapor?tipe=longsor"
            className="flex flex-col items-center justify-center p-4 bg-surface border border-line rounded-md hover:border-primary hover:bg-primary-soft/30 transition-all text-center group"
          >
            <div className="w-12 h-12 rounded-full bg-line text-ink flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform">
              <Mountain className="w-6 h-6" />
            </div>
            <span className="text-sm font-semibold text-ink">Tanah Longsor</span>
          </Link>

          <Link
            href="/lapor?tipe=karhutla"
            className="flex flex-col items-center justify-center p-4 bg-surface border border-line rounded-md hover:border-primary hover:bg-primary-soft/30 transition-all text-center group"
          >
            <div className="w-12 h-12 rounded-full bg-warning-soft text-warning flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform">
              <Trees className="w-6 h-6" />
            </div>
            <span className="text-sm font-semibold text-ink">Karhutla</span>
          </Link>

          <Link
            href="/lapor?tipe=lainnya"
            className="flex flex-col items-center justify-center p-4 bg-surface border border-line rounded-md hover:border-primary hover:bg-primary-soft/30 transition-all text-center group"
          >
            <div className="w-12 h-12 rounded-full bg-bg text-ink-muted flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <span className="text-sm font-semibold text-ink">Lainnya</span>
          </Link>
        </div>
      </section>

      {/* Ringkasan Statistik Publik */}
      <section aria-labelledby="stats-title">
        <h2 id="stats-title" className="text-lg md:text-xl font-bold text-ink mb-1">
          Statistik & Respons Kebencanaan
        </h2>
        <p className="text-xs text-ink-soft mb-4">
          Data pelaporan publik dan waktu penanganan oleh instansi penanggulangan bencana
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-surface border border-line rounded-md p-5 shadow-card">
            <span className="text-xs font-semibold uppercase text-ink-muted">
              Laporan Terverifikasi
            </span>
            <p className="text-3xl font-bold text-ink mt-2 tabular-nums">
              142
            </p>
            <p className="text-xs text-success-text mt-1 flex items-center gap-1.5 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 text-success" />
              94% telah selesai ditindaklanjuti
            </p>
          </div>

          <div className="bg-surface border border-line rounded-md p-5 shadow-card">
            <span className="text-xs font-semibold uppercase text-ink-muted">
              Waktu Respons Rata-rata
            </span>
            <p className="text-3xl font-bold text-ink mt-2 tabular-nums">
              18 <span className="text-lg font-normal text-ink-soft">menit</span>
            </p>
            <p className="text-xs text-ink-muted mt-1 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-primary" />
              Waktu verifikasi awal dari laporan masuk
            </p>
          </div>

          <div className="bg-surface border border-line rounded-md p-5 shadow-card">
            <span className="text-xs font-semibold uppercase text-ink-muted">
              Peringatan Siaga Aktif
            </span>
            <p className="text-3xl font-bold text-warning-text mt-2 tabular-nums">
              3 <span className="text-lg font-normal text-ink-soft">wilayah</span>
            </p>
            <p className="text-xs text-ink-muted mt-1 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 text-warning" />
              Berdasarkan rilis resmi BMKG & BPBD
            </p>
          </div>
        </div>
      </section>

      {/* Tautan Sumber Resmi BMKG & Kontak */}
      <section className="bg-surface border border-line rounded-md p-6 shadow-card">
        <h2 className="text-base font-bold text-ink mb-1">
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

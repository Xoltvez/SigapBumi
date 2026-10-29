import Link from "next/link";
import {
  MapPin,
  Search,
  Clock,
  Radio,
  ExternalLink,
  ChevronRight,
  Flame,
  Waves,
  Activity,
  Trees,
  Mountain,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
} from "lucide-react";
import { DEFAULT_MOCK_REPORTS } from "@/lib/services/reports";

export default function HomePage() {
  const recentReports = DEFAULT_MOCK_REPORTS.slice(0, 4);
  const totalCount = DEFAULT_MOCK_REPORTS.length;
  const resolvedCount = DEFAULT_MOCK_REPORTS.filter((r) => r.status === "selesai").length;
  const resolvedRate = ((resolvedCount / totalCount) * 100).toFixed(1);

  return (
    <main className="flex-1 w-full max-w-[1200px] mx-auto px-4 md:px-8 py-6 md:py-8 pb-28 md:pb-12 space-y-8">
      {/* Official Weather/Alert Reference Banner */}
      <section
        aria-label="Peringatan Dini Cuaca BMKG"
        className="bg-warning-soft border-l-4 border-warning px-4 py-3 rounded-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-warning/20 flex items-center justify-center text-warning-text shrink-0">
            <Radio className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-warning-text uppercase tracking-wider">
                Rujukan Resmi BMKG
              </span>
              <span className="text-xs text-ink-muted">· Peringatan Dini Wilayah</span>
            </div>
            <p className="text-sm font-medium text-ink mt-0.5">
              Waspada potensi hujan lebat disertai kilat dan angin kencang di pesisir barat Sumatera dan pulau Jawa.
            </p>
          </div>
        </div>
        <Link
          href="/cuaca"
          className="text-xs font-semibold text-warning-text hover:underline inline-flex items-center gap-1 shrink-0 self-end sm:self-center min-h-[36px]"
        >
          <span>Detail Cuaca & InaTEWS</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </section>

      {/* Hero Section (Fokus Tindakan Utama, Bersih, Human-Centered) */}
      <section className="bg-surface border border-line rounded-lg p-6 md:p-8 shadow-xs">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Column: Headline Utama & Tombol Tindakan */}
          <div className="lg:col-span-7 flex flex-col items-start">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-ink leading-tight mb-4">
              Laporkan Bencana. Pantau Perkembangannya.
            </h1>

            <p className="text-ink-soft text-base md:text-lg mb-8 leading-relaxed max-w-xl">
              Kirim laporan kejadian, pantau tindak lanjut, dan akses informasi kebencanaan melalui satu platform layanan publik terbuka.
            </p>

            {/* CTAs: Primary Lapor, Secondary Lacak, Tertiary Peta */}
            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
              <Link
                href="/lapor"
                className="inline-flex items-center justify-center h-12 px-6 rounded-md bg-primary hover:bg-primary-hover text-white font-semibold text-base transition-colors shadow-xs focus-visible:outline-primary whitespace-nowrap min-h-[44px]"
              >
                Laporkan Kejadian
              </Link>
              <Link
                href="/lacak"
                className="inline-flex items-center justify-center h-12 px-5 rounded-md border border-line-strong bg-surface hover:bg-bg text-ink font-semibold text-base transition-colors focus-visible:outline-primary whitespace-nowrap min-h-[44px]"
              >
                <Search className="w-4 h-4 mr-2 text-ink-soft" />
                Lacak Laporan
              </Link>
              <Link
                href="/peta"
                className="inline-flex items-center justify-center h-12 px-4 rounded-md text-ink-soft hover:text-ink hover:bg-bg font-semibold text-sm transition-colors focus-visible:outline-primary whitespace-nowrap min-h-[44px]"
              >
                <MapPin className="w-4 h-4 mr-1.5 text-ink-muted" />
                Lihat Peta
              </Link>
            </div>
          </div>

          {/* Right Column: Ringkasan Status & Kontak Darurat */}
          <div className="lg:col-span-5 bg-bg border border-line rounded-lg p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <span className="text-xs font-bold text-ink uppercase tracking-wider">
                Alur Verifikasi Posko
              </span>
              <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded bg-warning-soft text-warning-text border border-warning/30">
                Mode Demonstrasi — Data Simulasi
              </span>
            </div>

            {/* Realtime / Demonstration Incidents Preview */}
            <div className="space-y-2.5">
              {recentReports.slice(0, 2).map((item) => (
                <div
                  key={item.id}
                  className="bg-surface p-3 rounded-md border border-line flex items-center justify-between text-xs"
                >
                  <div className="min-w-0 pr-2">
                    <p className="font-semibold text-ink truncate">{item.title}</p>
                    <p className="text-ink-muted truncate text-[11px]">{item.address}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[11px] font-semibold shrink-0 capitalize ${
                    item.status === "selesai"
                      ? "bg-success-soft text-success-text"
                      : "bg-warning-soft text-warning-text"
                  }`}>
                    {item.status}
                  </span>
                </div>
              ))}
            </div>

            {/* Key Service Standards */}
            <div className="pt-2 border-t border-line flex items-center justify-between text-xs text-ink-soft">
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-primary" />
                <span>Target Respons: <strong className="text-ink font-semibold">&lt; 30 Menit</strong></span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-success" />
                <span>Standar Posko Terpadu</span>
              </div>
            </div>

            {/* Emergency Hotline Box */}
            <div className="bg-danger-soft border border-danger/20 rounded-md p-3 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-danger-text block">
                  Panggilan Darurat Bebas Pulsa
                </span>
                <span className="text-[11px] text-danger-text/80">
                  Layanan Darurat Nasional 112
                </span>
              </div>
              <a
                href="tel:112"
                className="px-3 py-1.5 rounded bg-danger text-white text-xs font-bold hover:bg-danger-hover transition-colors min-h-[36px] inline-flex items-center"
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
              Kategori Kejadian Bencana
            </h2>
            <p className="text-xs text-ink-soft mt-0.5">
              Pilih jenis bencana untuk membuka formulir pelaporan terarah
            </p>
          </div>
          <Link
            href="/lapor"
            className="text-xs font-semibold text-primary hover:text-primary-hover inline-flex items-center gap-0.5 min-h-[32px]"
          >
            <span>Semua Kategori</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          <Link
            href="/lapor?tipe=banjir"
            className="flex flex-col items-center justify-center p-4 bg-surface border border-line rounded-lg hover:border-primary transition-all text-center group min-h-[96px]"
          >
            <Waves className="w-6 h-6 text-info mb-2" />
            <span className="text-sm font-semibold text-ink">Banjir</span>
          </Link>

          <Link
            href="/lapor?tipe=gempa"
            className="flex flex-col items-center justify-center p-4 bg-surface border border-line rounded-lg hover:border-primary transition-all text-center group min-h-[96px]"
          >
            <Activity className="w-6 h-6 text-warning mb-2" />
            <span className="text-sm font-semibold text-ink">Gempa Bumi</span>
          </Link>

          <Link
            href="/lapor?tipe=kebakaran"
            className="flex flex-col items-center justify-center p-4 bg-surface border border-line rounded-lg hover:border-primary transition-all text-center group min-h-[96px]"
          >
            <Flame className="w-6 h-6 text-danger mb-2" />
            <span className="text-sm font-semibold text-ink">Kebakaran</span>
          </Link>

          <Link
            href="/lapor?tipe=longsor"
            className="flex flex-col items-center justify-center p-4 bg-surface border border-line rounded-lg hover:border-primary transition-all text-center group min-h-[96px]"
          >
            <Mountain className="w-6 h-6 text-ink mb-2" />
            <span className="text-sm font-semibold text-ink">Tanah Longsor</span>
          </Link>

          <Link
            href="/lapor?tipe=karhutla"
            className="flex flex-col items-center justify-center p-4 bg-surface border border-line rounded-lg hover:border-primary transition-all text-center group min-h-[96px]"
          >
            <Trees className="w-6 h-6 text-warning mb-2" />
            <span className="text-sm font-semibold text-ink">Karhutla</span>
          </Link>

          <Link
            href="/lapor?tipe=lainnya"
            className="flex flex-col items-center justify-center p-4 bg-surface border border-line rounded-lg hover:border-primary transition-all text-center group min-h-[96px]"
          >
            <AlertTriangle className="w-6 h-6 text-ink-muted mb-2" />
            <span className="text-sm font-semibold text-ink">Lainnya</span>
          </Link>
        </div>
      </section>

      {/* Daftar Laporan Kejadian Terkini */}
      <section aria-labelledby="laporan-terkini-title" className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 id="laporan-terkini-title" className="text-lg md:text-xl font-bold text-ink">
              Daftar Kejadian Bencana Terkini
            </h2>
            <p className="text-xs text-ink-soft mt-0.5">
              Laporan terverifikasi posko penanggulangan dari seluruh wilayah Indonesia
            </p>
          </div>
          <Link
            href="/peta"
            className="text-xs font-semibold text-primary hover:text-primary-hover inline-flex items-center gap-1 self-start sm:self-auto min-h-[36px]"
          >
            <span>Buka Seluruh Titik di Peta</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {recentReports.map((report) => (
            <div
              key={report.id}
              className="bg-surface border border-line rounded-lg p-5 shadow-xs hover:border-primary/40 transition-colors flex flex-col justify-between space-y-3"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-bold text-primary">
                      {report.tracking_code}
                    </span>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-bg text-ink-muted border border-line">
                      {report.province}
                    </span>
                  </div>
                  <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full capitalize ${
                    report.status === "selesai"
                      ? "bg-success-soft text-success-text"
                      : report.status === "ditindaklanjuti"
                      ? "bg-warning-soft text-warning-text"
                      : "bg-info-soft text-info-text"
                  }`}>
                    {report.status}
                  </span>
                </div>

                <h3 className="text-base font-bold text-ink leading-snug">
                  {report.title}
                </h3>
                <p className="text-xs text-ink-soft leading-relaxed line-clamp-2">
                  {report.description}
                </p>
              </div>

              <div className="pt-3 border-t border-line flex items-center justify-between text-xs text-ink-muted">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                  <span className="truncate max-w-[200px]">{report.address}</span>
                </div>
                <Link
                  href={`/lacak?kode=${report.tracking_code}`}
                  className="font-semibold text-primary hover:underline inline-flex items-center gap-1 shrink-0 min-h-[32px]"
                >
                  <span>Lacak Detail</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Ringkasan Statistik Publik */}
      <section aria-labelledby="stats-title" className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <h2 id="stats-title" className="text-lg md:text-xl font-bold text-ink">
                Ringkasan Penanganan & Respons Posko
              </h2>
              <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded bg-warning-soft text-warning-text border border-warning/30">
                Mode Demonstrasi — Data Simulasi
              </span>
            </div>
            <p className="text-xs text-ink-soft mt-0.5">
              Data agregat dihitung langsung dari master dataset kebencanaan terverifikasi di seluruh Indonesia.
            </p>
          </div>
          <Link
            href="/statistik"
            className="text-xs font-semibold text-primary hover:text-primary-hover inline-flex items-center gap-1 self-start sm:self-auto min-h-[36px]"
          >
            <span>Buka Analitik Lengkap</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-surface border border-line rounded-lg p-5 shadow-xs">
            <span className="text-xs font-semibold uppercase text-ink-muted">
              Total Laporan Terdata
            </span>
            <p className="text-3xl font-bold text-ink mt-2 tabular-nums">
              {totalCount}
            </p>
            <p className="text-xs text-success-text mt-1 flex items-center gap-1.5 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 text-success" />
              <span>{resolvedRate}% selesai ({resolvedCount} dari {totalCount} laporan)</span>
            </p>
          </div>

          <div className="bg-surface border border-line rounded-lg p-5 shadow-xs">
            <span className="text-xs font-semibold uppercase text-ink-muted">
              Target Respons Awal
            </span>
            <p className="text-3xl font-bold text-ink mt-2 tabular-nums">
              18 <span className="text-lg font-normal text-ink-soft">menit</span>
            </p>
            <p className="text-xs text-ink-muted mt-1 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-primary" />
              <span>Target verifikasi operasional posko</span>
            </p>
          </div>

          <div className="bg-surface border border-line rounded-lg p-5 shadow-xs">
            <span className="text-xs font-semibold uppercase text-ink-muted">
              Cakupan Pemantauan
            </span>
            <p className="text-3xl font-bold text-ink mt-2 tabular-nums">
              9 <span className="text-lg font-normal text-ink-soft">provinsi</span>
            </p>
            <p className="text-xs text-ink-muted mt-1 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 text-primary" />
              <span>Cakupan data posko terpadu nasional</span>
            </p>
          </div>
        </div>
      </section>

      {/* Preparedness Education Callout */}
      <section className="bg-surface border border-line rounded-lg p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-ink">
            Panduan Kesiapsiagaan & Mitigasi Mandiri
          </h3>
          <p className="text-xs text-ink-soft mt-1 leading-relaxed max-w-xl">
            Ketahui langkah tepat sebelum, saat, dan sesudah bencana gempa, banjir, kebakaran, dan tanah longsor, serta checklist perlengkapan Tas Siaga Bencana untuk keluarga Anda.
          </p>
        </div>
        <Link
          href="/edukasi"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-ink hover:bg-ink-soft text-white text-xs font-semibold transition-colors shrink-0 min-h-[44px]"
        >
          <span>Buka Panduan Edukasi</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </section>

      {/* Tautan Sumber Resmi & Kanal Informasi */}
      <section className="bg-surface border border-line rounded-lg p-6 shadow-xs">
        <h2 className="text-base font-bold text-ink mb-1">
          Sumber Informasi & Kanal Resmi
        </h2>
        <p className="text-xs text-ink-soft mb-4">
          Data kebencanaan dan cuaca merujuk pada instansi resmi pemerintah Republik Indonesia.
        </p>
        <div className="flex flex-wrap gap-4 text-xs font-semibold">
          <a
            href="https://www.bmkg.go.id"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-primary-hover hover:underline min-h-[32px]"
          >
            <span>Portal Resmi BMKG</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
          <a
            href="https://bnpb.go.id"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-primary-hover hover:underline min-h-[32px]"
          >
            <span>Portal Resmi BNPB</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
          <Link
            href="/cuaca"
            className="inline-flex items-center gap-1.5 text-primary-hover hover:underline min-h-[32px]"
          >
            <span>Peringatan Cuaca & Gempa</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
          <Link
            href="/fasilitas"
            className="inline-flex items-center gap-1.5 text-primary-hover hover:underline min-h-[32px]"
          >
            <span>Fasilitas Kesehatan Terdekat</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
          <Link
            href="/kontak-darurat"
            className="inline-flex items-center gap-1.5 text-primary-hover hover:underline min-h-[32px]"
          >
            <span>Daftar Kontak Darurat</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </section>
    </main>
  );
}

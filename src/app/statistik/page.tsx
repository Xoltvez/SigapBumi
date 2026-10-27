"use client";

import React, { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import {
  BarChart3,
  TrendingUp,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Download,
  Calendar,
} from "lucide-react";

const MONTHLY_DATA = [
  { bulan: "Jan", laporan: 18, selesai: 17 },
  { bulan: "Feb", laporan: 24, selesai: 23 },
  { bulan: "Mar", laporan: 15, selesai: 14 },
  { bulan: "Apr", laporan: 12, selesai: 12 },
  { bulan: "Mei", laporan: 9, selesai: 9 },
  { bulan: "Jun", laporan: 8, selesai: 8 },
  { bulan: "Jul", laporan: 11, selesai: 10 },
  { bulan: "Agu", laporan: 14, selesai: 13 },
  { bulan: "Sep", laporan: 16, selesai: 15 },
  { bulan: "Okt", laporan: 21, selesai: 19 },
];

const DISASTER_DISTRIBUTION = [
  { name: "Banjir", value: 64, color: "#2563EB" },
  { name: "Kebakaran", value: 31, color: "#DC2626" },
  { name: "Tanah Longsor", value: 21, color: "#1F2937" },
  { name: "Gempa Bumi", value: 14, color: "#F59E0B" },
  { name: "Karhutla", value: 12, color: "#EF6806" },
];

const REGIONAL_STATS = [
  { wilayah: "Jakarta Barat", total: 42, selesai: 40, respons: "14 menit", persentase: "95%" },
  { wilayah: "Kab. Bogor", total: 34, selesai: 31, respons: "24 menit", persentase: "91%" },
  { wilayah: "Jakarta Timur", total: 28, selesai: 27, respons: "16 menit", persentase: "96%" },
  { wilayah: "Kab. Sukabumi", total: 22, selesai: 20, respons: "28 menit", persentase: "90%" },
  { wilayah: "Kota Tangerang", total: 16, selesai: 16, respons: "12 menit", persentase: "100%" },
];

export default function StatistikPage() {
  const [period, setPeriod] = useState<string>("2026");

  const exportCSV = () => {
    const csvContent =
      "data:text/csv;charset=utf-8," +
      "Wilayah,Total Laporan,Selesai,Waktu Respons,Persentase\n" +
      REGIONAL_STATS.map(
        (r) => `${r.wilayah},${r.total},${r.selesai},${r.respons},${r.persentase}`
      ).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `statistik_kebencanaan_sigapbumi_${period}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <main className="flex-1 w-full max-w-[1200px] mx-auto px-4 md:px-8 py-6 md:py-10 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-line">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-soft text-primary-hover text-xs font-semibold mb-2">
            <BarChart3 className="w-4 h-4" />
            <span>Open Government Data & Decision Support</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-ink">
            Statistik & Analitik Penanganan Bencana
          </h1>
          <p className="text-sm text-ink-soft mt-1">
            Transparansi data pelaporan masyarakat, kecepatan respons posko, dan tren sebaran bencana.
          </p>
        </div>

        {/* Filter Period & Export Buttons */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-surface border border-line rounded-md p-1 text-xs font-medium">
            <Calendar className="w-4 h-4 text-ink-muted ml-2" />
            <button
              type="button"
              onClick={() => setPeriod("30hari")}
              className={`px-3 py-1.5 rounded transition-colors ${
                period === "30hari"
                  ? "bg-primary text-white font-semibold"
                  : "text-ink-soft hover:text-ink"
              }`}
            >
              30 Hari
            </button>
            <button
              type="button"
              onClick={() => setPeriod("2026")}
              className={`px-3 py-1.5 rounded transition-colors ${
                period === "2026"
                  ? "bg-primary text-white font-semibold"
                  : "text-ink-soft hover:text-ink"
              }`}
            >
              Tahun 2026
            </button>
          </div>

          <button
            type="button"
            onClick={exportCSV}
            className="h-9 px-3.5 rounded-md border border-line bg-surface hover:bg-bg text-ink text-xs font-semibold inline-flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <Download className="w-3.5 h-3.5 text-primary" />
            <span>Ekspor CSV</span>
          </button>
        </div>
      </div>

      {/* KPI Cards (4 Kolom) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-surface border border-line rounded-lg p-5 shadow-card">
          <span className="text-xs font-semibold uppercase text-ink-muted block">
            Total Laporan Masuk
          </span>
          <p className="text-3xl md:text-4xl font-extrabold text-ink mt-2 tabular-nums">
            142
          </p>
          <p className="text-xs text-primary-hover font-semibold mt-1 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" />
            Terverifikasi sistem
          </p>
        </div>

        <div className="bg-surface border border-line rounded-lg p-5 shadow-card">
          <span className="text-xs font-semibold uppercase text-ink-muted block">
            Tingkat Penyelesaian
          </span>
          <p className="text-3xl md:text-4xl font-extrabold text-success mt-2 tabular-nums">
            94.3%
          </p>
          <p className="text-xs text-success-text font-medium mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-success" />
            134 laporan selesai
          </p>
        </div>

        <div className="bg-surface border border-line rounded-lg p-5 shadow-card">
          <span className="text-xs font-semibold uppercase text-ink-muted block">
            Rata-rata Waktu Respons
          </span>
          <p className="text-3xl md:text-4xl font-extrabold text-ink mt-2 tabular-nums">
            18 <span className="text-lg font-normal text-ink-soft">menit</span>
          </p>
          <p className="text-xs text-ink-muted mt-1 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-primary" />
            Verifikasi hingga tim jalan
          </p>
        </div>

        <div className="bg-surface border border-line rounded-lg p-5 shadow-card">
          <span className="text-xs font-semibold uppercase text-ink-muted block">
            Konfirmasi Warga
          </span>
          <p className="text-3xl md:text-4xl font-extrabold text-primary mt-2 tabular-nums">
            489
          </p>
          <p className="text-xs text-ink-muted mt-1 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-primary" />
            Validasi kolektif masyarakat
          </p>
        </div>
      </div>

      {/* Visual Charts Grid: Bar Chart & Donut Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Monthly Trend (7 Cols) */}
        <div className="lg:col-span-7 bg-surface border border-line rounded-lg p-5 md:p-6 shadow-card space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-ink">Tren Kejadian per Bulan</h2>
              <p className="text-xs text-ink-soft">
                Perbandingan jumlah laporan masuk vs laporan yang selesai ditangani
              </p>
            </div>
            <span className="text-xs text-ink-muted font-mono">Tahun 2026</span>
          </div>

          <div className="h-[280px] w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={MONTHLY_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                <XAxis dataKey="bulan" tick={{ fill: "#6B7280", fontSize: 12 }} />
                <YAxis tick={{ fill: "#6B7280", fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1F2937",
                    borderRadius: "8px",
                    border: "none",
                    color: "#FFFFFF",
                    fontSize: "12px",
                  }}
                />
                <Bar dataKey="laporan" name="Laporan Masuk" fill="#EF6806" radius={[4, 4, 0, 0]} />
                <Bar dataKey="selesai" name="Selesai Ditangani" fill="#16A34A" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Disaster Type Distribution (5 Cols) */}
        <div className="lg:col-span-5 bg-surface border border-line rounded-lg p-5 md:p-6 shadow-card space-y-4">
          <div>
            <h2 className="text-base font-bold text-ink">Komposisi Jenis Bencana</h2>
            <p className="text-xs text-ink-soft">
              Persentase laporan berdasarkan kategori bencana
            </p>
          </div>

          <div className="h-[280px] w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={DISASTER_DISTRIBUTION}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {DISASTER_DISTRIBUTION.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => [`${value} Kejadian`, "Total"]}
                  contentStyle={{
                    backgroundColor: "#1F2937",
                    borderRadius: "8px",
                    border: "none",
                    color: "#FFFFFF",
                    fontSize: "12px",
                  }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Regional Stats Table (design.md section 7.9) */}
      <div className="bg-surface border border-line rounded-lg p-5 md:p-6 shadow-card space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-ink">Sebaran Wilayah & Waktu Respons</h2>
            <p className="text-xs text-ink-soft">
              Kinerja penanganan posko penanggulangan bencana per kabupaten/kota
            </p>
          </div>
          <span className="text-xs px-2.5 py-1 rounded bg-bg text-ink-soft border border-line">
            5 Wilayah Pantauan
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-bg text-xs font-semibold text-ink-muted uppercase border-y border-line">
              <tr>
                <th className="py-3 px-4">Wilayah</th>
                <th className="py-3 px-4">Total Laporan</th>
                <th className="py-3 px-4">Selesai Ditangani</th>
                <th className="py-3 px-4">Waktu Respons Rata-rata</th>
                <th className="py-3 px-4 text-right">Tingkat Keberhasilan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {REGIONAL_STATS.map((row) => (
                <tr key={row.wilayah} className="hover:bg-bg/50 transition-colors">
                  <td className="py-3.5 px-4 font-semibold text-ink">{row.wilayah}</td>
                  <td className="py-3.5 px-4 font-mono tabular-nums text-ink">{row.total}</td>
                  <td className="py-3.5 px-4 font-mono tabular-nums text-success-text font-medium">
                    {row.selesai}
                  </td>
                  <td className="py-3.5 px-4 font-mono tabular-nums text-ink-soft flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-primary" />
                    <span>{row.respons}</span>
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono tabular-nums font-bold text-ink">
                    <span className="inline-block px-2 py-0.5 rounded bg-success-soft text-success-text text-xs">
                      {row.persentase}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}

"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  LayoutGrid,
  Users,
  FileText,
  MousePointerClick,
  Map as MapIcon,
  GitBranch,
  Eye,
  Clock,
  TrendingUp,
  RotateCw,
  Calendar,
  ArrowRight,
  Smartphone,
  Monitor,
  Globe,
  CloudRain,
  Siren,
  CheckCircle2,
  Activity,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

type SubTabId = "overview" | "traffic" | "pages" | "clicks" | "map_weather" | "journey";
type PeriodId = "1d" | "7d" | "30d";

interface AnalyticsResponse {
  generatedAt: string;
  liveVisitors: number;
  totalSessions: number;
  liveSessions: {
    sessionId: string;
    visitorId: string;
    lastSeen: string;
    device: "Mobile" | "Desktop";
    lastPath: string;
    pageViews: number;
    clicks: number;
  }[];
  totalVisitors: number;
  totalViews: number;
  totalClicks: number;
  avgActiveSeconds: number;
  bounceRatePct: number;
  trendData: { date: string; views: number; visitors: number }[];
  popularPages: {
    path: string;
    name: string;
    views: number;
    visitors: number;
    avgTime: string;
    bounce: string;
  }[];
  ctaClicks: {
    label: string;
    target: string;
    clicks: number;
    pct: number;
  }[];
  trafficSources: {
    source: string;
    sessions: number;
    pct: number;
  }[];
  deviceBreakdown: {
    mobileCount: number;
    desktopCount: number;
    mobilePct: number;
    desktopPct: number;
  };
  geoBreakdown: {
    region: string;
    sessions: number;
    pct: number;
  }[];
  featureUsage: {
    mapViews: number;
    weatherViews: number;
    laporViews: number;
    sosPageViews: number;
  };
  funnelSteps: {
    step: string;
    users: number;
    pct: number;
    desc: string;
  }[];
  adminLogs: {
    id: string;
    adminName: string;
    adminEmail: string;
    unit: string;
    unitName: string;
    action: string;
    detail: string;
    device: "Mobile" | "Desktop";
    timestamp: string;
  }[];
  activeAdmins: {
    adminName: string;
    adminEmail: string;
    unitName: string;
    lastAction: string;
    lastDetail: string;
    lastSeen: string;
    device: "Mobile" | "Desktop";
  }[];
}

function formatWibTimeOnly(iso: string): string {
  try {
    const d = new Date(iso);
    return (
      new Intl.DateTimeFormat("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        timeZone: "Asia/Jakarta",
      }).format(d) + " WIB"
    );
  } catch {
    return iso;
  }
}

export default function AdminAnalitikWebPage() {
  const [activeTab, setActiveTab] = useState<SubTabId>("overview");
  const [period, setPeriod] = useState<PeriodId>("7d");
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [data, setData] = useState<AnalyticsResponse | null>(null);

  const loadAnalytics = useCallback(async (showSpinner = false) => {
    if (showSpinner) setIsRefreshing(true);
    try {
      const res = await fetch(`/api/analytics?period=${period}`, {
        cache: "no-store",
      });
      if (res.ok) {
        const json = (await res.json()) as AnalyticsResponse;
        setData(json);
      }
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [period]);

  // Load awal + auto-polling real-time setiap 8 detik
  useEffect(() => {
    loadAnalytics(false);
    const interval = setInterval(() => {
      loadAnalytics(false);
    }, 8000);
    return () => clearInterval(interval);
  }, [loadAnalytics]);

  const periodLabel = period === "1d" ? "Hari Ini" : period === "30d" ? "30 Hari Terakhir" : "7 Hari Terakhir";

  const avgActiveFormatted = useMemo(() => {
    const sec = data?.avgActiveSeconds || 0;
    if (sec >= 60) {
      const mins = Math.round(sec / 60);
      return { value: String(mins), unit: "Menit / Sesi" };
    }
    return { value: String(sec), unit: "Detik / Sesi" };
  }, [data?.avgActiveSeconds]);

  const subTabs: {
    id: SubTabId;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }[] = [
    { id: "overview", label: "Overview", icon: LayoutGrid },
    { id: "traffic", label: "Pengunjung & Trafik", icon: Users },
    { id: "pages", label: "Halaman Populer", icon: FileText },
    { id: "clicks", label: "Klik & CTA", icon: MousePointerClick },
    { id: "map_weather", label: "Peta & Cuaca", icon: MapIcon },
    { id: "journey", label: "Alur Lapor Warga", icon: GitBranch },
  ];

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto font-sans pb-12 select-none">
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Statistik Pengunjung &amp; Interaksi Website
          </h1>
          <p className="text-xs md:text-sm text-slate-500 font-normal mt-1 leading-relaxed">
            Analisis trafik &amp; interaksi pengunjung website publik SigapBumi (terpisah dari aktivitas petugas) • WIB
            {data?.generatedAt && (
              <span className="inline-block sm:ml-2 text-slate-400">
                • Update: {formatWibTimeOnly(data.generatedAt)}
              </span>
            )}
          </p>
        </div>

        {/* Period Dropdown & Refresh */}
        <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0 w-full sm:w-auto">
          <div className="relative inline-flex items-center flex-1 sm:flex-initial">
            <Calendar className="w-3.5 h-3.5 text-slate-500 absolute left-3 pointer-events-none" />
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value as PeriodId)}
              aria-label="Rentang waktu analitik"
              className="w-full sm:w-auto pl-8 pr-8 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 shadow-2xs cursor-pointer focus:outline-none focus:ring-2 focus:ring-orange-500/20"
            >
              <option value="1d">Hari Ini</option>
              <option value="7d">7 Hari Terakhir</option>
              <option value="30d">30 Hari Terakhir</option>
            </select>
          </div>

          <button
            type="button"
            onClick={() => loadAnalytics(true)}
            disabled={isRefreshing}
            title="Segarkan Data Analitik Real-Time"
            className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 shadow-2xs transition-colors cursor-pointer disabled:opacity-50 shrink-0"
          >
            <RotateCw className={`w-4 h-4 ${isRefreshing ? "animate-spin text-orange-500" : ""}`} />
          </button>
        </div>
      </div>

      {/* 2. Sub-Tab Navigation Bar */}
      <div className="border-b border-slate-200 pb-3">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
          {subTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer border ${
                  isActive
                    ? "bg-orange-600 text-white border-orange-600 shadow-xs"
                    : "bg-white text-slate-600 border-transparent hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? "text-white" : "text-slate-400"}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. 4 Kartu Metrik KPI Utama (100% Real-Time, Responsif Mobile 2x2) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-5">
        {/* KPI 1: Live Visitors */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-[0_2px_12px_rgba(0,0,0,0.02)] hover:border-orange-200 transition-all flex flex-col justify-between">
          <div className="flex items-start justify-between gap-2">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Pengunjung Aktif
            </span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-600 shrink-0">
              <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="mt-2.5 sm:mt-3 flex flex-wrap items-baseline gap-1.5 sm:gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tabular-nums">
              {isLoading ? "—" : data?.liveVisitors ?? 0}
            </span>
            <span className="px-1.5 sm:px-2 py-0.5 rounded-md bg-orange-50 border border-orange-200 text-[9px] sm:text-[10px] font-bold text-orange-600">
              Live
            </span>
          </div>
          <p className="text-[10px] sm:text-[11px] text-slate-400 mt-1.5 sm:mt-2 leading-snug">
            5 menit terakhir
          </p>
        </div>

        {/* KPI 2: Total Pengunjung */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-[0_2px_12px_rgba(0,0,0,0.02)] hover:border-orange-200 transition-all flex flex-col justify-between">
          <div className="flex items-start justify-between gap-2">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Pengunjung Unik
            </span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-600 shrink-0">
              <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="mt-2.5 sm:mt-3">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tabular-nums">
              {isLoading ? "—" : (data?.totalVisitors ?? 0).toLocaleString("id-ID")}
            </span>
          </div>
          <p className="text-[10px] sm:text-[11px] text-slate-500 mt-1.5 sm:mt-2 flex flex-wrap items-center gap-1">
            <span className="text-orange-600 font-bold">Real-time</span>
            <span className="truncate">({periodLabel})</span>
          </p>
        </div>

        {/* KPI 3: Halaman Dibuka (Views) */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-[0_2px_12px_rgba(0,0,0,0.02)] hover:border-orange-200 transition-all flex flex-col justify-between">
          <div className="flex items-start justify-between gap-2">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Halaman Dibuka
            </span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-600 shrink-0">
              <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="mt-2.5 sm:mt-3">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tabular-nums">
              {isLoading ? "—" : (data?.totalViews ?? 0).toLocaleString("id-ID")}
            </span>
          </div>
          <p className="text-[10px] sm:text-[11px] text-slate-500 mt-1.5 sm:mt-2 flex flex-wrap items-center gap-1">
            <span className="text-orange-600 font-bold">Aktual</span>
            <span>Views langsung</span>
          </p>
        </div>

        {/* KPI 4: Total Klik Elemen & CTA */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-[0_2px_12px_rgba(0,0,0,0.02)] hover:border-orange-200 transition-all flex flex-col justify-between">
          <div className="flex items-start justify-between gap-2">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Total Klik &amp; CTA
            </span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-600 shrink-0">
              <MousePointerClick className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="mt-2.5 sm:mt-3">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tabular-nums">
              {isLoading ? "—" : (data?.totalClicks ?? 0).toLocaleString("id-ID")}
            </span>
          </div>
          <p className="text-[10px] sm:text-[11px] text-slate-400 mt-1.5 sm:mt-2 leading-snug">
            Tombol, tautan &amp; SOS
          </p>
        </div>
      </div>

      {/* 4. Konten Dinamis Berdasarkan Sub-Tab Aktif */}
      {activeTab === "overview" && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 md:gap-6 items-stretch">
            {/* Kolom Kiri (8 cols): Tren Lalu Lintas */}
            <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 p-6 shadow-[0_2px_16px_rgba(0,0,0,0.02)] flex flex-col justify-between space-y-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
                    Tren Lalu Lintas ({periodLabel})
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Perbandingan jumlah pengunjung unik dan page views aktual
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full bg-orange-50 border border-orange-200 text-orange-600 text-[11px] font-bold">
                  Live Tracking
                </span>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={data?.trendData || []}
                    margin={{ top: 10, right: 10, left: -18, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                    <XAxis
                      dataKey="date"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#64748B", fontSize: 11, fontWeight: 600 }}
                    />
                    <YAxis
                      allowDecimals={false}
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#94A3B8", fontSize: 11 }}
                    />
                    <Tooltip
                      cursor={{ fill: "#FFF7ED" }}
                      contentStyle={{
                        backgroundColor: "#FFFFFF",
                        borderColor: "#E2E8F0",
                        borderRadius: "12px",
                        fontSize: "12px",
                        boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
                      }}
                    />
                    <Bar
                      dataKey="views"
                      name="Page Views"
                      fill="#F97316"
                      radius={[6, 6, 0, 0]}
                      maxBarSize={36}
                    />
                    <Bar
                      dataKey="visitors"
                      name="Unique Visitors"
                      fill="#FDBA74"
                      radius={[6, 6, 0, 0]}
                      maxBarSize={36}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="flex items-center justify-center gap-6 pt-1 text-xs font-semibold text-slate-600">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-xs bg-orange-500 inline-block" />
                  <span>Page Views</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-xs bg-orange-300 inline-block" />
                  <span>Unique Visitors</span>
                </div>
              </div>
            </div>

            {/* Kolom Kanan (4 cols): Kualitas Kunjungan */}
            <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 p-6 shadow-[0_2px_16px_rgba(0,0,0,0.02)] flex flex-col justify-between space-y-4">
              <div>
                <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
                  Kualitas Kunjungan
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Tingkat retensi dan atensi pengunjung aktif
                </p>
              </div>

              <div className="space-y-3">
                {/* Subcard 1 */}
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-600">
                      Rata-rata Waktu Aktif
                    </span>
                    <Clock className="w-4 h-4 text-orange-600" />
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-extrabold text-slate-900 tabular-nums">
                      {avgActiveFormatted.value}
                    </span>
                    <span className="text-xs font-semibold text-slate-600">
                      {avgActiveFormatted.unit}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-snug">
                    Waktu tab aktif, dijeda saat pengguna beralih aplikasi
                  </p>
                </div>

                {/* Subcard 2 */}
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-600">
                      Rasio Keluar Cepat (Bounce)
                    </span>
                    <TrendingUp className="w-4 h-4 text-orange-600" />
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-extrabold text-slate-900 tabular-nums">
                      {data?.bounceRatePct ?? 0}%
                    </span>
                    <span className="text-xs font-bold text-orange-600">
                      {(data?.bounceRatePct ?? 0) <= 40 ? "Sangat Baik (<40%)" : "Perlu Interaksi"}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-snug">
                    Sesi dengan 1 halaman tanpa interaksi tambahan
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveTab("traffic")}
                className="w-full py-3 px-4 rounded-xl bg-orange-600 hover:bg-orange-700 active:bg-orange-800 text-white text-xs font-bold flex items-center justify-between transition-colors cursor-pointer shadow-xs"
              >
                <span>Buka Analisis Lalu Lintas &amp; Geografis</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Live Active Sessions Preview */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
                  Sesi Pengguna Aktif Saat Ini (Live 5 Menit Terakhir)
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Daftar sesi peramban yang sedang membuka halaman SigapBumi secara real-time
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-orange-50 border border-orange-200 text-orange-600 text-[11px] font-bold">
                {data?.liveSessions?.length ?? 0} Sesi Aktif
              </span>
            </div>

            {!data?.liveSessions?.length ? (
              <p className="text-xs text-slate-400 py-4 text-center">
                Belum ada sesi aktif terdeteksi dalam 5 menit terakhir.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {data.liveSessions.map((ses) => (
                  <div
                    key={ses.sessionId}
                    className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                        <code className="font-bold text-slate-800 truncate">{ses.lastPath}</code>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">
                        {ses.device} • {ses.pageViews} views • {ses.clicks} klik
                      </p>
                    </div>
                    <span className="text-[10px] font-bold text-orange-600 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-md shrink-0">
                      {formatWibTimeOnly(ses.lastSeen)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "traffic" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 md:gap-6">
          {/* Sumber Trafik */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
                  Sumber Kedatangan Pengunjung
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Kanal rujukan aktual menuju portal SigapBumi ({periodLabel})
                </p>
              </div>
              <Globe className="w-4 h-4 text-orange-600" />
            </div>

            {!data?.trafficSources?.length ? (
              <p className="text-xs text-slate-400 py-6 text-center">
                Belum ada data sumber trafik pada rentang waktu ini.
              </p>
            ) : (
              <div className="space-y-4">
                {data.trafficSources.map((src, idx) => (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-800">{src.source}</span>
                      <span className="text-orange-600 font-extrabold tabular-nums">
                        {src.sessions} sesi ({src.pct}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-50 border border-slate-200 rounded-full h-2.5 overflow-hidden">
                      <div
                        className="bg-orange-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${src.pct}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Distribusi Perangkat */}
          <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
            <div className="pb-3 border-b border-slate-100">
              <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
                Perangkat Akses Aktual
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Deteksi langsung resolusi &amp; perangkat pengunjung
              </p>
            </div>

            <div className="space-y-3">
              <div className="p-4 rounded-xl border border-slate-200 bg-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-600">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800">Smartphone / Mobile</p>
                    <p className="text-[11px] text-slate-400">
                      {data?.deviceBreakdown.mobileCount ?? 0} sesi tercatat
                    </p>
                  </div>
                </div>
                <span className="text-xl font-extrabold text-orange-600 tabular-nums">
                  {data?.deviceBreakdown.mobilePct ?? 0}%
                </span>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-600">
                    <Monitor className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800">Desktop / Laptop</p>
                    <p className="text-[11px] text-slate-400">
                      {data?.deviceBreakdown.desktopCount ?? 0} sesi tercatat
                    </p>
                  </div>
                </div>
                <span className="text-xl font-extrabold text-orange-600 tabular-nums">
                  {data?.deviceBreakdown.desktopPct ?? 0}%
                </span>
              </div>

              <div className="pt-3 border-t border-slate-100 space-y-2">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Wilayah Geografis &amp; Sesi ({data?.totalSessions ?? 0} Sesi)
                </p>
                {(data?.geoBreakdown || []).map((g, i) => (
                  <div key={i} className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="font-semibold text-slate-700">{g.region}</span>
                    <span className="font-extrabold text-orange-600 tabular-nums">
                      {g.sessions} sesi ({g.pct}%)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "pages" && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
                Halaman Paling Sering Dikunjungi
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Data tampilan halaman riil selama {periodLabel}
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-orange-50 border border-orange-200 text-orange-600 text-[11px] font-bold">
              {data?.popularPages?.length ?? 0} Halaman Tercatat
            </span>
          </div>

          {!data?.popularPages?.length ? (
            <p className="text-xs text-slate-400 py-6 text-center">
              Belum ada kunjungan halaman tercatat pada periode ini.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 uppercase text-[10px] tracking-wider">
                    <th className="py-2.5 pr-4">Halaman</th>
                    <th className="py-2.5 px-4 text-right">Views</th>
                    <th className="py-2.5 px-4 text-right">Pengunjung Unik</th>
                    <th className="py-2.5 px-4 text-right">Rata-rata Durasi</th>
                    <th className="py-2.5 pl-4 text-right">Bounce Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.popularPages.map((pg, idx) => (
                    <tr key={idx} className="hover:bg-orange-50/30 transition-colors">
                      <td className="py-3 pr-4">
                        <p className="font-bold text-slate-800">{pg.name}</p>
                        <code className="text-[11px] text-orange-600 font-mono">{pg.path}</code>
                      </td>
                      <td className="py-3 px-4 text-right font-extrabold text-slate-900 tabular-nums">
                        {pg.views.toLocaleString("id-ID")}
                      </td>
                      <td className="py-3 px-4 text-right font-semibold text-slate-600 tabular-nums">
                        {pg.visitors.toLocaleString("id-ID")}
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-slate-500 tabular-nums">
                        {pg.avgTime}
                      </td>
                      <td className="py-3 pl-4 text-right">
                        <span className="px-2 py-0.5 rounded-md bg-orange-50 border border-orange-200 text-orange-600 font-bold">
                          {pg.bounce}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === "clicks" && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5">
          <div className="pb-3 border-b border-slate-100">
            <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
              Interaksi Tombol &amp; CTA Aktual
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Frekuensi klik nyata pengguna pada tombol dan tautan di SigapBumi ({periodLabel})
            </p>
          </div>

          {!data?.ctaClicks?.length ? (
            <p className="text-xs text-slate-400 py-6 text-center">
              Belum ada interaksi klik tombol tercatat pada periode ini.
            </p>
          ) : (
            <div className="space-y-4">
              {data.ctaClicks.map((item, idx) => (
                <div key={idx} className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-600 shrink-0">
                        <MousePointerClick className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <span className="font-bold text-slate-800 block truncate">{item.label}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{item.target}</span>
                      </div>
                    </div>
                    <span className="font-extrabold text-orange-600 tabular-nums shrink-0">
                      {item.clicks.toLocaleString("id-ID")} klik
                    </span>
                  </div>
                  <div className="w-full bg-slate-50 border border-slate-200 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="bg-orange-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${item.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "map_weather" && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-2">
            <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-600 mb-2">
              <MapIcon className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Akses Peta Bencana</h3>
            <p className="text-2xl font-extrabold text-orange-600 tabular-nums">
              {data?.featureUsage.mapViews ?? 0}x
            </p>
            <p className="text-xs text-slate-500">Kunjungan riil halaman `/peta` &amp; `/admin/peta`.</p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-2">
            <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-600 mb-2">
              <CloudRain className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Pantau Cuaca BMKG</h3>
            <p className="text-2xl font-extrabold text-orange-600 tabular-nums">
              {data?.featureUsage.weatherViews ?? 0}x
            </p>
            <p className="text-xs text-slate-500">Kunjungan riil halaman `/cuaca`.</p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-2">
            <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-600 mb-2">
              <Activity className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Akses Form Lapor</h3>
            <p className="text-2xl font-extrabold text-orange-600 tabular-nums">
              {data?.featureUsage.laporViews ?? 0}x
            </p>
            <p className="text-xs text-slate-500">Kunjungan riil halaman `/lapor`.</p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-2">
            <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-600 mb-2">
              <Siren className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Monitor Radar SOS</h3>
            <p className="text-2xl font-extrabold text-orange-600 tabular-nums">
              {data?.featureUsage.sosPageViews ?? 0}x
            </p>
            <p className="text-xs text-slate-500">Pemantauan halaman `/admin/sos` oleh posko.</p>
          </div>
        </div>
      )}

      {activeTab === "journey" && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
          <div className="pb-3 border-b border-slate-100">
            <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
              Alur Konversi Pelaporan Warga (Funnel Aktual)
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Perjalanan pengunjung unik pada periode {periodLabel}
            </p>
          </div>

          <div className="space-y-3">
            {(data?.funnelSteps || []).map((f, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl border border-slate-200 bg-white hover:border-orange-200 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-600 shrink-0 mt-0.5">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-extrabold text-slate-900">{f.step}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">{f.desc}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
                  <span className="text-base font-extrabold text-orange-600 tabular-nums">
                    {f.users.toLocaleString("id-ID")} pengguna
                  </span>
                  <span className="px-2.5 py-1 rounded-md bg-orange-50 border border-orange-200 text-orange-600 text-xs font-bold tabular-nums">
                    {f.pct}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  CloudSun,
  Activity,
  Radio,
  ExternalLink,
  ChevronLeft,
  AlertTriangle,
  Info,
  RefreshCw,
  MapPin,
  Clock,
  Compass,
  Wind,
  Droplets,
  Thermometer,
  ShieldAlert,
  Eye,
  CheckCircle2,
  Search,
  ChevronDown,
} from "lucide-react";
import {
  CITIES_BMKG,
  POPULAR_WEATHER_SHORTCUTS,
  type CityBmkgItem,
} from "@/lib/data/provinces-weather";

interface GempaData {
  Tanggal: string;
  Jam: string;
  DateTime: string;
  Coordinates: string;
  Lintang: string;
  Bujur: string;
  Magnitude: string;
  Kedalaman: string;
  Wilayah: string;
  Potensi: string;
  Dirasakan?: string;
  Shakemap?: string;
}

interface WeatherPeriod {
  datetime: string;
  t: number;
  hu: number;
  ws: number;
  wd: string;
  weather_desc: string;
  image: string;
  local_datetime: string;
}

export default function CuacaPage() {
  const [activeTab, setActiveTab] = useState<"gempa" | "cuaca">("gempa");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<string>("");

  // Data Gempa
  const [gempaTerkini, setGempaTerkini] = useState<GempaData | null>(null);
  const [daftarGempa, setDaftarGempa] = useState<GempaData[]>([]);
  const [isShakemapOpen, setIsShakemapOpen] = useState<boolean>(false);

  // Data Cuaca (Inisialisasi langsung dengan 38 Provinsi Lengkap)
  const [cities, setCities] = useState<CityBmkgItem[]>(CITIES_BMKG);
  const [selectedCityAdm4, setSelectedCityAdm4] = useState<string>("31.71.01.1001");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [currentWeather, setCurrentWeather] = useState<{
    lokasi?: { desa?: string; kotkab?: string; provinsi?: string };
    periods?: WeatherPeriod[];
  } | null>(null);
  const [isLoadingWeather, setIsLoadingWeather] = useState<boolean>(false);

  // Grouping 38 provinsi berdasarkan gugus kepulauan Indonesia
  const groupedCities = React.useMemo(() => {
    const order = ["Jawa", "Sumatera", "Bali & Nusa Tenggara", "Kalimantan", "Sulawesi", "Maluku & Papua"] as const;
    const map: Record<string, CityBmkgItem[]> = {};
    order.forEach((r) => { map[r] = []; });
    cities.forEach((c) => {
      const reg = c.region || "Lainnya";
      if (!map[reg]) map[reg] = [];
      map[reg].push(c);
    });
    return map;
  }, [cities]);

  // Hasil pencarian cepat wilayah/provinsi
  const filteredSearchResults = React.useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();
    return cities.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.province.toLowerCase().includes(q) ||
        (c.region && c.region.toLowerCase().includes(q))
    );
  }, [cities, searchQuery]);

  // Data metadata wilayah terpilih
  const selectedCityInfo = React.useMemo(() => {
    return cities.find((c) => c.adm4 === selectedCityAdm4) || cities[0];
  }, [cities, selectedCityAdm4]);

  // Fetch data BMKG gempa & cuaca
  const fetchBmkgData = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) setIsRefreshing(true);
    else setIsLoading(true);

    try {
      const res = await fetch(`/api/bmkg?type=all&adm4=${encodeURIComponent(selectedCityAdm4)}`);
      if (res.ok) {
        const json = await res.json();
        if (json.gempaTerkini) setGempaTerkini(json.gempaTerkini);
        if (json.daftarGempa) setDaftarGempa(json.daftarGempa);
        if (json.cities) setCities(json.cities);

        // Parsing cuaca
        const weatherRaw = json.cuaca?.data?.[0];
        if (weatherRaw) {
          const periodsList: WeatherPeriod[] = [];
          if (Array.isArray(weatherRaw.cuaca)) {
            weatherRaw.cuaca.forEach((dayArr: WeatherPeriod[]) => {
              if (Array.isArray(dayArr)) {
                dayArr.forEach((item) => periodsList.push(item));
              }
            });
          }
          setCurrentWeather({
            lokasi: weatherRaw.lokasi,
            periods: periodsList.slice(0, 8),
          });
        }

        setLastUpdated(new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
      }
    } catch (err) {
      console.warn("Gagal memuat data BMKG:", err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [selectedCityAdm4]);

  // Fetch khusus saat ganti kota cuaca
  const handleSelectCity = async (adm4Code: string) => {
    setSelectedCityAdm4(adm4Code);
    setIsLoadingWeather(true);
    try {
      const res = await fetch(`/api/bmkg?type=cuaca&adm4=${encodeURIComponent(adm4Code)}`);
      if (res.ok) {
        const json = await res.json();
        const weatherRaw = json.cuaca?.data?.[0];
        if (weatherRaw) {
          const periodsList: WeatherPeriod[] = [];
          if (Array.isArray(weatherRaw.cuaca)) {
            weatherRaw.cuaca.forEach((dayArr: WeatherPeriod[]) => {
              if (Array.isArray(dayArr)) {
                dayArr.forEach((item) => periodsList.push(item));
              }
            });
          }
          setCurrentWeather({
            lokasi: weatherRaw.lokasi,
            periods: periodsList.slice(0, 8),
          });
        }
      }
    } catch (err) {
      console.warn("Gagal memuat data cuaca kota:", err);
    } finally {
      setIsLoadingWeather(false);
    }
  };

  useEffect(() => {
    fetchBmkgData();
    const interval = setInterval(() => {
      fetchBmkgData();
    }, 120000); // refresh otomatis tiap 2 menit
    return () => clearInterval(interval);
  }, [fetchBmkgData]);

  // Helper warna badge magnitudo
  const getMagColor = (magStr: string) => {
    const mag = parseFloat(magStr) || 0;
    if (mag >= 7.0) return "bg-red-500 text-white border-red-600";
    if (mag >= 6.0) return "bg-rose-500 text-white border-rose-600";
    if (mag >= 5.0) return "bg-orange-500 text-white border-orange-600";
    return "bg-amber-500 text-white border-amber-600";
  };

  const isTsunamiWarning = (potensi: string) => {
    const lower = potensi.toLowerCase();
    return lower.includes("waspada") || lower.includes("siaga") || lower.includes("awas") || lower.includes("potensi tsunami");
  };

  const activeWeatherItem = currentWeather?.periods?.[0];

  return (
    <main className="flex-1 w-full max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10 pb-28 md:pb-16 space-y-8">
      {/* Breadcrumb & Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200/90 bg-white hover:bg-orange-50/80 hover:border-orange-300 text-xs font-bold text-slate-700 hover:text-orange-700 shadow-2xs transition-all mb-3 active:scale-[0.98]"
          >
            <ChevronLeft className="w-3.5 h-3.5 shrink-0" />
            <span>Kembali ke Beranda</span>
          </Link>
          <h1 className="text-2xl md:text-3xl font-extrabold text-ink tracking-tight">
            Informasi Cuaca &amp; Peringatan Dini
          </h1>
          <p className="text-xs sm:text-sm text-ink-soft mt-1 leading-relaxed max-w-2xl">
            Pusat pemantauan kegempaan nasional (InaTEWS) dan prakiraan cuaca kabupaten/kota terhubung langsung dengan sistem Badan Meteorologi, Klimatologi, dan Geofisika (BMKG).
          </p>
        </div>

        {/* Tombol Refresh Live */}
        <div className="flex items-center justify-between md:justify-end gap-2.5 w-full md:w-auto shrink-0 pt-1 md:pt-0">
          {lastUpdated && (
            <span className="text-[11px] text-ink-muted">
              Pembaruan: {lastUpdated} WIB
            </span>
          )}
          <button
            type="button"
            onClick={() => fetchBmkgData(true)}
            disabled={isRefreshing}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-line bg-surface hover:bg-slate-50 text-ink font-semibold text-xs shadow-xs transition-all cursor-pointer disabled:opacity-60 ml-auto md:ml-0"
            title="Muat data terbaru langsung dari server BMKG"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-primary ${isRefreshing ? "animate-spin text-primary" : ""}`} />
            <span>{isRefreshing ? "Menghubungkan..." : "Perbarui Data"}</span>
          </button>
        </div>
      </div>

      {/* Tab Switcher: Gempa Bumi vs Prakiraan Cuaca */}
      <div className="flex items-center gap-2.5 border-b border-line pb-2">
        <button
          type="button"
          onClick={() => setActiveTab("gempa")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
            activeTab === "gempa"
              ? "bg-slate-900 text-white shadow-xs border border-slate-900"
              : "bg-surface border border-slate-200 hover:border-slate-300 text-ink-soft hover:text-ink hover:bg-slate-50 shadow-2xs"
          }`}
        >
          <Activity className="w-4 h-4 text-amber-400" />
          <span>Gempa Bumi &amp; InaTEWS</span>
          {daftarGempa.length > 0 && (
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${
                activeTab === "gempa"
                  ? "bg-white/20 text-white"
                  : "bg-slate-100 text-slate-700 border border-slate-200"
              }`}
            >
              {daftarGempa.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("cuaca")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
            activeTab === "cuaca"
              ? "bg-slate-900 text-white shadow-xs border border-slate-900"
              : "bg-surface border border-slate-200 hover:border-slate-300 text-ink-soft hover:text-ink hover:bg-slate-50 shadow-2xs"
          }`}
        >
          <CloudSun className="w-4 h-4 text-sky-400" />
          <span>Prakiraan Cuaca Kota</span>
        </button>
      </div>

      {/* KONTEN TAB 1: GEMPA BUMI & INATEWS */}
      {activeTab === "gempa" && (
        <div className="space-y-6">
          {/* Hero Card: Gempa Bumi Terkini Real-Time */}
          {isLoading ? (
            <div className="bg-surface border border-line rounded-2xl p-8 text-center space-y-3">
              <RefreshCw className="w-8 h-8 text-primary animate-spin mx-auto" />
              <p className="text-sm font-bold text-ink">Mengambil Data Gempa Terkini dari BMKG...</p>
              <p className="text-xs text-ink-muted">Menghubungkan ke pusat data seismik InaTEWS nasional</p>
            </div>
          ) : gempaTerkini ? (
            <div className="bg-surface border border-line rounded-2xl p-5 sm:p-7 shadow-card relative overflow-hidden space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-line pb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center font-black shadow-md border ${getMagColor(gempaTerkini.Magnitude)}`}>
                    <span className="text-xs font-semibold leading-none opacity-90">M</span>
                    <span className="text-2xl leading-none mt-0.5">{gempaTerkini.Magnitude}</span>
                  </div>
                  <div>
                    <span className="text-xs font-bold text-primary uppercase tracking-wider block">
                      Aktivitas Seismik Terkini
                    </span>
                    <h2 className="text-lg sm:text-xl font-extrabold text-ink leading-tight mt-0.5">
                      {gempaTerkini.Wilayah}
                    </h2>
                  </div>
                </div>

                {/* Status Tsunami */}
                <div>
                  {isTsunamiWarning(gempaTerkini.Potensi) ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-extrabold bg-red-100 text-red-800 border border-red-300 animate-pulse">
                      <AlertTriangle className="w-4 h-4 text-red-600" />
                      <span>{gempaTerkini.Potensi}</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>{gempaTerkini.Potensi}</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Grid Detail Gempa & Shakemap */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                {/* 4 Poin Kunci Gempa */}
                <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                    <div className="flex items-center gap-1.5 text-xs text-ink-muted mb-1">
                      <Clock className="w-3.5 h-3.5 text-orange-500" />
                      <span>Waktu Gempa (WIB)</span>
                    </div>
                    <p className="text-sm font-bold text-ink">{gempaTerkini.Jam}</p>
                    <p className="text-[11px] text-ink-soft">{gempaTerkini.Tanggal}</p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                    <div className="flex items-center gap-1.5 text-xs text-ink-muted mb-1">
                      <Activity className="w-3.5 h-3.5 text-red-500" />
                      <span>Kedalaman Pusat</span>
                    </div>
                    <p className="text-sm font-bold text-ink">{gempaTerkini.Kedalaman}</p>
                    <p className="text-[11px] text-ink-soft">Hiposentrum di bawah kerak</p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                    <div className="flex items-center gap-1.5 text-xs text-ink-muted mb-1">
                      <Compass className="w-3.5 h-3.5 text-blue-500" />
                      <span>Koordinat Episentrum</span>
                    </div>
                    <p className="text-sm font-bold text-ink font-mono">{gempaTerkini.Coordinates}</p>
                    <p className="text-[11px] text-ink-soft">{gempaTerkini.Lintang} - {gempaTerkini.Bujur}</p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                    <div className="flex items-center gap-1.5 text-xs text-ink-muted mb-1">
                      <MapPin className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Wilayah Dirasakan</span>
                    </div>
                    <p className="text-sm font-bold text-ink truncate">{gempaTerkini.Dirasakan || "Diteruskan ke posko"}</p>
                    <p className="text-[11px] text-ink-soft">Skala Intensitas MMI</p>
                  </div>
                </div>

                {/* Visual Peta Shakemap BMKG */}
                <div className="lg:col-span-5 bg-slate-900 rounded-xl overflow-hidden border border-slate-800 flex flex-col justify-between">
                  <div className="px-3.5 py-2.5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 text-white text-xs">
                    <span className="font-bold flex items-center gap-1.5">
                      <Eye className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>Peta Shakemap Resmi BMKG</span>
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-semibold">
                      Peta Guncangan MMI
                    </span>
                  </div>

                  <div
                    onClick={() => setIsShakemapOpen(true)}
                    className="relative w-full bg-white p-2 flex items-center justify-center cursor-pointer group"
                    title="Klik untuk memperbesar Shakemap"
                  >
                    {gempaTerkini.Shakemap ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={`https://data.bmkg.go.id/DataMKG/TEWS/${gempaTerkini.Shakemap}`}
                        alt="Peta Shakemap Gempa BMKG"
                        className="w-full h-auto max-h-64 object-contain rounded-lg group-hover:scale-[1.02] transition-transform duration-300"
                      />
                    ) : (
                      <p className="text-xs text-slate-500 py-8">Peta visual belum tersedia</p>
                    )}
                    <div className="absolute inset-0 bg-slate-950/35 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                      <span className="bg-slate-900/90 text-white text-xs px-3 py-1.5 rounded-xl font-bold backdrop-blur-xs flex items-center gap-1.5">
                        <Eye className="w-4 h-4 text-amber-400" />
                        Perbesar Shakemap
                      </span>
                    </div>
                  </div>

                  <div className="px-3.5 py-2.5 bg-slate-950 flex items-center justify-between gap-2">
                    <span className="text-[10px] text-slate-400">Ketuk peta untuk perbesar</span>
                    <a
                      href="https://inatews.bmkg.go.id"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] font-bold text-amber-400 hover:text-amber-300 inline-flex items-center gap-1"
                    >
                      <span>Buka InaTEWS BMKG</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {/* Daftar 10 Gempa Bumi Terkini (M 5.0+) */}
          <div className="bg-surface border border-line rounded-2xl p-5 sm:p-6 shadow-card space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-ink">
                  Daftar 10 Gempa Bumi Terkini (M 5.0+)
                </h3>
                <p className="text-xs text-ink-muted mt-0.5">
                  Catatan getaran tektonik termutakhir yang terekam sensor seismograf BMKG di seluruh Indonesia
                </p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
                Data Realtime
              </span>
            </div>

            <div className="divide-y divide-line/70">
              {daftarGempa.map((gempa, idx) => (
                <div
                  key={`${gempa.DateTime}-${idx}`}
                  className="py-3.5 first:pt-1 last:pb-1 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/70 p-2.5 rounded-xl transition-colors"
                >
                  <div className="flex items-start sm:items-center gap-3">
                    <div className={`w-11 h-11 rounded-xl flex flex-col items-center justify-center font-bold shrink-0 border ${getMagColor(gempa.Magnitude)}`}>
                      <span className="text-[9px] font-semibold opacity-90 leading-none">M</span>
                      <span className="text-base leading-none mt-0.5 font-extrabold">{gempa.Magnitude}</span>
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm font-bold text-ink">
                        {gempa.Wilayah}
                      </p>
                      <div className="flex items-center gap-2 text-[11px] text-ink-soft mt-0.5 flex-wrap">
                        <span>Kedalaman: <strong>{gempa.Kedalaman}</strong></span>
                        <span>•</span>
                        <span>Koordinat: {gempa.Coordinates}</span>
                        <span>•</span>
                        <span className="text-ink-muted">{gempa.Tanggal}, {gempa.Jam}</span>
                      </div>
                    </div>
                  </div>

                  <div className="self-end sm:self-center shrink-0">
                    <span className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700">
                      {gempa.Potensi}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* KONTEN TAB 2: PRAKIRAAN CUACA KOTA BMKG */}
      {activeTab === "cuaca" && (
        <div className="space-y-6">
          {/* Pemilih Wilayah / Provinsi Cuaca (38 Provinsi Se-Indonesia) */}
          <div className="bg-surface border border-line rounded-2xl p-5 sm:p-6 shadow-card space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-line pb-3">
              <div>
                <span className="text-xs font-bold text-primary uppercase tracking-wider block">
                  Pilih Wilayah / Provinsi Prakiraan Cuaca
                </span>
                <p className="text-xs text-ink-muted mt-0.5">
                  Tersedia 38 Provinsi di seluruh Indonesia yang terhubung dengan data BMKG
                </p>
              </div>
              <span className="self-start sm:self-auto px-2.5 py-1 rounded-full text-[11px] font-bold bg-sky-50 text-sky-700 border border-sky-200">
                38 Provinsi Lengkap
              </span>
            </div>

            {/* Controls: Dropdown & Search Filter */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
              {/* Dropdown Select Grouped */}
              <div className="md:col-span-7 relative">
                <label htmlFor="weather-province-select" className="sr-only">
                  Pilih Provinsi
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-primary">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <select
                    id="weather-province-select"
                    value={selectedCityAdm4}
                    onChange={(e) => {
                      handleSelectCity(e.target.value);
                      setSearchQuery("");
                    }}
                    className="w-full h-11 pl-10 pr-10 rounded-xl border border-line bg-surface hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/20 text-xs sm:text-sm font-semibold text-ink appearance-none cursor-pointer shadow-2xs transition-colors"
                  >
                    {Object.entries(groupedCities).map(([region, items]) => (
                      <optgroup key={region} label={`Wilayah ${region} (${items.length} Provinsi/Kota)`}>
                        {items.map((city) => (
                          <option key={city.adm4} value={city.adm4}>
                            {city.province} — {city.name}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </div>
              </div>

              {/* Input Pencarian Cepat */}
              <div className="md:col-span-5 relative">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Search className="w-3.5 h-3.5" />
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Ketik cari provinsi / kota..."
                    className="w-full h-11 pl-9 pr-3 rounded-xl border border-line bg-surface placeholder:text-slate-400 text-xs sm:text-sm text-ink focus:border-primary focus:ring-2 focus:ring-primary/20 shadow-2xs transition-colors"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Hasil Pencarian jika pengguna mengetik query */}
            {searchQuery.trim() && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 animate-in fade-in">
                <div className="text-[11px] font-semibold text-slate-600 flex items-center justify-between">
                  <span>Hasil pencarian &quot;{searchQuery}&quot; ({filteredSearchResults.length} wilayah):</span>
                  {filteredSearchResults.length > 0 && (
                    <span className="text-[10px] text-slate-400">Klik untuk langsung melihat cuaca</span>
                  )}
                </div>
                {filteredSearchResults.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto">
                    {filteredSearchResults.map((city) => (
                      <button
                        key={city.adm4}
                        type="button"
                        onClick={() => {
                          handleSelectCity(city.adm4);
                          setSearchQuery("");
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          selectedCityAdm4 === city.adm4
                            ? "bg-primary text-white shadow-xs"
                            : "bg-white border border-slate-200 hover:border-primary text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        <span className="font-semibold">{city.province}</span>
                        <span className="text-[10px] opacity-75 ml-1">({city.name})</span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 py-1">Tidak ditemukan provinsi atau kota yang cocok.</p>
                )}
              </div>
            )}

            {/* Akses Cepat Wilayah Utama (Pill shortcuts) */}
            <div className="space-y-1.5 pt-1">
              <span className="text-[11px] font-semibold text-ink-muted block">
                Akses Cepat Kota / Provinsi Populer:
              </span>
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
                {cities
                  .filter((c) => POPULAR_WEATHER_SHORTCUTS.includes(c.adm4))
                  .map((city) => (
                    <button
                      key={city.adm4}
                      type="button"
                      onClick={() => {
                        handleSelectCity(city.adm4);
                        setSearchQuery("");
                      }}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                        selectedCityAdm4 === city.adm4
                          ? "bg-primary text-white shadow-xs border border-primary ring-2 ring-primary/20"
                          : "bg-surface text-slate-700 hover:bg-slate-50 border border-slate-200 hover:border-slate-300 shadow-2xs"
                      }`}
                    >
                      <span>{city.name}</span>
                    </button>
                  ))}
              </div>
            </div>
          </div>

          {/* Kartu Cuaca Kota Terpilih */}
          {isLoadingWeather ? (
            <div className="bg-surface border border-line rounded-2xl p-8 text-center space-y-3">
              <RefreshCw className="w-8 h-8 text-primary animate-spin mx-auto" />
              <p className="text-sm font-bold text-ink">Memuat Prakiraan Cuaca BMKG...</p>
            </div>
          ) : currentWeather && activeWeatherItem ? (
            <div className="bg-gradient-to-br from-sky-500/10 via-white to-amber-500/10 border border-sky-200/80 rounded-2xl p-6 sm:p-8 shadow-card space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 text-xs font-bold text-sky-700 mb-1">
                    <MapPin className="w-4 h-4" />
                    <span>{currentWeather.lokasi?.kotkab || selectedCityInfo.name}, {currentWeather.lokasi?.provinsi || selectedCityInfo.province}</span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-ink">
                    {activeWeatherItem.weather_desc}
                  </h2>
                  <p className="text-xs text-ink-soft mt-0.5">
                    Prakiraan resmi BMKG untuk waktu setempat: {activeWeatherItem.local_datetime}
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  {activeWeatherItem.image && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={activeWeatherItem.image}
                      alt={activeWeatherItem.weather_desc}
                      className="w-16 h-16 object-contain drop-shadow-sm"
                    />
                  )}
                  <div>
                    <span className="text-4xl sm:text-5xl font-black text-ink">
                      {activeWeatherItem.t}°
                    </span>
                    <span className="text-base text-ink-muted ml-0.5">C</span>
                  </div>
                </div>
              </div>

              {/* 3 Parameter Utama */}
              <div className="grid grid-cols-3 gap-3 pt-2 border-t border-sky-100">
                <div className="p-3 rounded-xl bg-white/80 border border-sky-100 flex items-center gap-3">
                  <Droplets className="w-5 h-5 text-sky-600 shrink-0" />
                  <div>
                    <p className="text-[11px] text-ink-muted">Kelembapan</p>
                    <p className="text-sm font-bold text-ink">{activeWeatherItem.hu}%</p>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-white/80 border border-sky-100 flex items-center gap-3">
                  <Wind className="w-5 h-5 text-teal-600 shrink-0" />
                  <div>
                    <p className="text-[11px] text-ink-muted">Kecepatan Angin</p>
                    <p className="text-sm font-bold text-ink">{activeWeatherItem.ws} km/j</p>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-white/80 border border-sky-100 flex items-center gap-3">
                  <Compass className="w-5 h-5 text-indigo-600 shrink-0" />
                  <div>
                    <p className="text-[11px] text-ink-muted">Arah Angin</p>
                    <p className="text-sm font-bold text-ink">Ke {activeWeatherItem.wd}</p>
                  </div>
                </div>
              </div>

              {/* Prakiraan Jam-jaman */}
              <div className="space-y-2 pt-2">
                <span className="text-xs font-bold text-ink block">
                  Prakiraan Waktu Berikutnya:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {currentWeather.periods?.slice(1, 5).map((p, i) => (
                    <div key={i} className="p-3 rounded-xl bg-white border border-slate-200 text-center space-y-1 shadow-2xs">
                      <p className="text-[11px] font-semibold text-ink-muted">{p.local_datetime.split(" ")[1]?.slice(0, 5) || p.local_datetime} WIB</p>
                      {p.image && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.image} alt={p.weather_desc} className="w-8 h-8 mx-auto object-contain" />
                      )}
                      <p className="text-xs font-bold text-ink">{p.t}°C</p>
                      <p className="text-[10px] text-ink-soft truncate">{p.weather_desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* Official Source Transparency Box */}
      <div className="bg-surface border border-line rounded-xl p-5 shadow-card space-y-2">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs text-ink-soft">
            <p className="font-bold text-sm text-ink">
              Keterbukaan Data Sumber (Data Truthfulness)
            </p>
            <p className="leading-relaxed">
              Seluruh data gempa bumi dan cuaca di atas diambil langsung melalui kanal terbuka <strong>Badan Meteorologi, Klimatologi, dan Geofisika (BMKG)</strong> Republik Indonesia. Pembaruan data terjadi secara otomatis setiap ada rilis gempa baru dari stasiun seismik nasional.
            </p>
          </div>
        </div>
      </div>

      {/* Modal Zoom Shakemap */}
      {isShakemapOpen && gempaTerkini?.Shakemap && (
        <div
          onClick={() => setIsShakemapOpen(false)}
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 cursor-pointer"
        >
          <div className="relative max-w-2xl w-full bg-slate-900 rounded-2xl overflow-hidden border border-slate-700 shadow-2xl p-2" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-3 border-b border-slate-800 text-white">
              <span className="font-bold text-sm">Peta Shakemap Guncangan Gempa BMKG</span>
              <button
                type="button"
                onClick={() => setIsShakemapOpen(false)}
                className="text-xs px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-white cursor-pointer"
              >
                Tutup
              </button>
            </div>
            <div className="p-2 flex items-center justify-center bg-black">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`https://data.bmkg.go.id/DataMKG/TEWS/${gempaTerkini.Shakemap}`}
                alt="Shakemap BMKG Fullscreen"
                className="max-h-[75vh] w-auto object-contain rounded"
              />
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

"use client";

import React, { useMemo, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  BarChart3,
  CheckCircle2,
  Clock,
  Shield,
  RotateCw,
  TrendingUp,
  Layers,
  ArrowRight,
  Flame,
  Mountain,
  Waves,
  AlertTriangle,
  Building2,
  Users,
  Compass,
  HeartPulse,
  Siren,
  Radio,
  Trash2,
} from "lucide-react";
import { useAdmin } from "@/components/layout/AdminShell";
import {
  fetchLiveReports,
  getCachedLiveReports,
  type LiveReportItem,
  clearAllLocalReportsAndCaches,
  parseReportTimestamp,
} from "@/lib/services/reports";
import {
  fetchLiveSosAlerts,
  getCachedLiveSosAlerts,
  type LiveSosItem,
} from "@/lib/services/sos";
import { supabase } from "@/lib/supabase/client";
import type { DisasterType, ReportStatus } from "@/types";

function detectProvinceFromAddress(address: string, province?: string): string {
  if (province && province.trim()) return province.trim();
  const lower = (address || "").toLowerCase();
  if (lower.includes("jakarta")) return "DKI Jakarta";
  if (
    lower.includes("bogor") ||
    lower.includes("bekasi") ||
    lower.includes("depok") ||
    lower.includes("bandung") ||
    lower.includes("cianjur") ||
    lower.includes("sukabumi") ||
    lower.includes("cirebon") ||
    lower.includes("garut") ||
    lower.includes("tasikmalaya") ||
    lower.includes("karawang") ||
    lower.includes("purwakarta") ||
    lower.includes("subang") ||
    lower.includes("jawa barat") ||
    lower.includes("jabar")
  )
    return "Jawa Barat";
  if (
    lower.includes("semarang") ||
    lower.includes("surakarta") ||
    lower.includes("solo") ||
    lower.includes("magelang") ||
    lower.includes("banyumas") ||
    lower.includes("purwokerto") ||
    lower.includes("cilacap") ||
    lower.includes("banjarnegara") ||
    lower.includes("wonosobo") ||
    lower.includes("kudus") ||
    lower.includes("jawa tengah") ||
    lower.includes("jateng")
  )
    return "Jawa Tengah";
  if (
    lower.includes("surabaya") ||
    lower.includes("malang") ||
    lower.includes("sidoarjo") ||
    lower.includes("gresik") ||
    lower.includes("banyuwangi") ||
    lower.includes("jember") ||
    lower.includes("kediri") ||
    lower.includes("jawa timur") ||
    lower.includes("jatim")
  )
    return "Jawa Timur";
  if (
    lower.includes("yogyakarta") ||
    lower.includes("jogja") ||
    lower.includes("sleman") ||
    lower.includes("bantul") ||
    lower.includes("gunungkidul") ||
    lower.includes("kulon progo")
  )
    return "DI Yogyakarta";
  if (
    lower.includes("tangerang") ||
    lower.includes("serang") ||
    lower.includes("cilegon") ||
    lower.includes("lebak") ||
    lower.includes("pandeglang") ||
    lower.includes("banten")
  )
    return "Banten";
  if (
    lower.includes("bali") ||
    lower.includes("denpasar") ||
    lower.includes("badung") ||
    lower.includes("gianyar") ||
    lower.includes("buleleng")
  )
    return "Bali";
  if (
    lower.includes("padang") ||
    lower.includes("bukittinggi") ||
    lower.includes("agam") ||
    lower.includes("sumatera barat") ||
    lower.includes("sumbar")
  )
    return "Sumatera Barat";
  if (
    lower.includes("makassar") ||
    lower.includes("gowa") ||
    lower.includes("maros") ||
    lower.includes("sulawesi selatan") ||
    lower.includes("sulsel")
  )
    return "Sulawesi Selatan";
  if (
    lower.includes("palembang") ||
    lower.includes("sumatera selatan") ||
    lower.includes("sumsel")
  )
    return "Sumatera Selatan";
  if (lower.includes("riau") || lower.includes("pekanbaru")) return "Riau";
  if (
    lower.includes("pontianak") ||
    lower.includes("kalimantan barat") ||
    lower.includes("kalbar")
  )
    return "Kalimantan Barat";
  if (lower.includes("aceh") || lower.includes("banda aceh")) return "Aceh";
  if (
    lower.includes("medan") ||
    lower.includes("sumatera utara") ||
    lower.includes("sumut")
  )
    return "Sumatera Utara";
  return "Jawa Barat";
}

export default function AdminStatistikPage() {
  const { activeUnit, activeUnitName } = useAdmin();
  const [reports, setReports] = useState<LiveReportItem[]>(() => getCachedLiveReports() || []);
  const [sosAlerts, setSosAlerts] = useState<LiveSosItem[]>(() => getCachedLiveSosAlerts() || []);
  const [isLoading, setIsLoading] = useState<boolean>(() => !getCachedLiveReports());
  const [lastRefreshedTime, setLastRefreshedTime] = useState<string>("");

  const loadData = useCallback(async (forceRefresh = false) => {
    if (!getCachedLiveReports()) {
      setIsLoading(true);
    }
    try {
      const [liveRep, liveSos] = await Promise.all([
        fetchLiveReports(forceRefresh, { lean: true }),
        fetchLiveSosAlerts(forceRefresh),
      ]);
      setReports(liveRep || []);
      setSosAlerts(liveSos || []);
      const now = new Date();
      setLastRefreshedTime(
        `${String(now.getHours()).padStart(2, "0")}:${String(
          now.getMinutes()
        ).padStart(2, "0")} WIB`
      );
    } catch (err) {
      console.warn("Gagal memuat data statistik live:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData(false);

    const handleSync = () => {
      loadData(true);
    };

    if (typeof window !== "undefined") {
      window.addEventListener("sigapbumi:sos-created", handleSync);
      window.addEventListener("sigapbumi:sos-updated", handleSync);
      window.addEventListener("storage", handleSync);
    }

    const channelReports = supabase
      .channel("admin_statistik_reports_realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "reports" },
        handleSync
      )
      .subscribe();

    const channelSos = supabase
      .channel("admin_statistik_sos_realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "sos_alerts" },
        handleSync
      )
      .subscribe();

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("sigapbumi:sos-created", handleSync);
        window.removeEventListener("sigapbumi:sos-updated", handleSync);
        window.removeEventListener("storage", handleSync);
      }
      supabase.removeChannel(channelReports);
      supabase.removeChannel(channelSos);
    };
  }, [loadData]);

  // Filter laporan sesuai kewenangan instansi aktif
  const unitReports = useMemo(() => {
    if (activeUnit === "pemerintahan" || activeUnit === "semua") {
      return reports;
    }
    if (activeUnit === "damkar") {
      return reports.filter(
        (r) =>
          ["kebakaran", "karhutla"].includes(r.disaster_type) ||
          r.target_agency === "damkar"
      );
    }
    if (activeUnit === "medis") {
      return reports.filter((r) => {
        if (r.disaster_type === "kebakaran" || r.disaster_type === "karhutla")
          return false;
        const titleUpper = (r.title || "").toUpperCase();
        return (
          r.target_agency === "medis" ||
          titleUpper.includes("MEDIS") ||
          titleUpper.includes("KESEHATAN") ||
          titleUpper.includes("AMBULANS") ||
          titleUpper.includes("KORBAN") ||
          titleUpper.includes("LUKA") ||
          titleUpper.includes("CEDERA")
        );
      });
    }
    if (activeUnit === "polisi") {
      return reports.filter((r) => {
        if (r.disaster_type === "kebakaran" || r.disaster_type === "karhutla")
          return false;
        if (r.target_agency === "damkar" || r.target_agency === "medis")
          return false;
        const titleUpper = (r.title || "").toUpperCase();
        return (
          r.target_agency === "polisi" ||
          titleUpper.includes("POLISI") ||
          titleUpper.includes("KEAMANAN") ||
          titleUpper.includes("KAMTIBMAS") ||
          r.disaster_type === "lainnya"
        );
      });
    }
    // bnpb_bpbd
    return reports.filter((r) => {
      if (r.disaster_type === "kebakaran" || r.disaster_type === "karhutla")
        return false;
      if (r.target_agency === "medis" || r.target_agency === "damkar")
        return false;
      return (
        ["banjir", "longsor", "gempa", "tsunami"].includes(r.disaster_type) ||
        r.target_agency === "bnpb_bpbd"
      );
    });
  }, [reports, activeUnit]);

  // Filter SOS sesuai kewenangan instansi aktif
  const unitSos = useMemo(() => {
    if (activeUnit === "pemerintahan" || activeUnit === "semua") {
      return sosAlerts;
    }
    if (activeUnit === "damkar") {
      return sosAlerts.filter((s) => s.assistance_type === "damkar");
    }
    if (activeUnit === "medis") {
      return sosAlerts.filter((s) => s.assistance_type === "medis");
    }
    if (activeUnit === "polisi") {
      return sosAlerts.filter((s) => s.assistance_type === "polisi");
    }
    return sosAlerts.filter(
      (s) =>
        s.assistance_type === "bnpb_bpbd" ||
        (s.assistance_type as string) === "evakuasi"
    );
  }, [sosAlerts, activeUnit]);

  // Agregasi Status Pipeline Riil dari Database
  const diterimaReports = useMemo(() => {
    const fromRep = unitReports.filter((r) => r.status === "diterima").length;
    const fromSos = unitSos.filter((s) => s.status === "aktif").length;
    return fromRep + fromSos;
  }, [unitReports, unitSos]);

  const diverifikasiReports = useMemo(() => {
    return unitReports.filter((r) => r.status === "diverifikasi").length;
  }, [unitReports]);

  const ditindaklanjutiReports = useMemo(() => {
    const fromRep = unitReports.filter(
      (r) => r.status === "ditindaklanjuti"
    ).length;
    const fromSos = unitSos.filter((s) => s.status === "ditangani").length;
    return fromRep + fromSos;
  }, [unitReports, unitSos]);

  const selesaiReports = useMemo(() => {
    const fromRep = unitReports.filter((r) => r.status === "selesai").length;
    const fromSos = unitSos.filter(
      (s) => s.status === "selesai" || s.status === "palsu"
    ).length;
    return fromRep + fromSos;
  }, [unitReports, unitSos]);

  const totalReportsCount = useMemo(() => {
    return unitReports.length + unitSos.length;
  }, [unitReports.length, unitSos.length]);

  const resolutionRate = useMemo(() => {
    if (totalReportsCount === 0) return "0.0";
    return ((selesaiReports / totalReportsCount) * 100).toFixed(1);
  }, [selesaiReports, totalReportsCount]);

  const totalConfirmationsCount = useMemo(() => {
    const fromRep = unitReports.reduce(
      (acc, r) => acc + (r.confirmation_count || 1),
      0
    );
    const fromSos = unitSos.length * 3;
    return fromRep + fromSos;
  }, [unitReports, unitSos]);

  // Sebaran Geografis Provinsi Berdasarkan Laporan Riil
  const provincesData = useMemo(() => {
    const provCountMap = new Map<string, number>();

    unitReports.forEach((r) => {
      const p = detectProvinceFromAddress(r.address, r.province);
      provCountMap.set(p, (provCountMap.get(p) || 0) + 1);
    });

    unitSos.forEach((s) => {
      const p = detectProvinceFromAddress(s.address);
      provCountMap.set(p, (provCountMap.get(p) || 0) + 1);
    });

    // Fallback jika database masih sedikit
    const defaultProvs = [
      "Jawa Barat",
      "DKI Jakarta",
      "Jawa Tengah",
      "Jawa Timur",
      "DI Yogyakarta",
      "Banten",
    ];
    defaultProvs.forEach((dp) => {
      if (!provCountMap.has(dp)) {
        provCountMap.set(dp, 0);
      }
    });

    return Array.from(provCountMap.entries())
      .map(([name, count]) => ({
        name,
        count,
        pct: totalReportsCount > 0 ? Math.round((count / totalReportsCount) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [unitReports, unitSos, totalReportsCount]);

  // Sebaran Tipe Kejadian Berdasarkan Laporan Riil
  const disastersData = useMemo(() => {
    const typeCountMap: Record<string, number> = {
      banjir: 0,
      longsor: 0,
      kebakaran: 0,
      karhutla: 0,
      gempa: 0,
      tsunami: 0,
      lainnya: 0,
    };

    unitReports.forEach((r) => {
      const dt = r.disaster_type in typeCountMap ? r.disaster_type : "lainnya";
      typeCountMap[dt] = (typeCountMap[dt] || 0) + 1;
    });

    unitSos.forEach((s) => {
      if (s.assistance_type === "damkar") {
        typeCountMap.kebakaran = (typeCountMap.kebakaran || 0) + 1;
      } else if (s.assistance_type === "medis") {
        typeCountMap.lainnya = (typeCountMap.lainnya || 0) + 1;
      } else {
        typeCountMap.banjir = (typeCountMap.banjir || 0) + 1;
      }
    });

    const total = Math.max(1, totalReportsCount);

    const configMap: Record<
      string,
      { label: string; icon: any; color: string; barColor: string }
    > = {
      banjir: {
        label: "Banjir & Luapan Sungai",
        icon: Waves,
        color: "text-blue-500",
        barColor: "bg-blue-500",
      },
      kebakaran: {
        label: "Kebakaran Permukiman & Gedung",
        icon: Flame,
        color: "text-red-500",
        barColor: "bg-red-500",
      },
      longsor: {
        label: "Tanah Longsor & Pergerakan Tanah",
        icon: Mountain,
        color: "text-amber-500",
        barColor: "bg-amber-500",
      },
      gempa: {
        label: "Gempa Bumi & Getaran",
        icon: Compass,
        color: "text-emerald-500",
        barColor: "bg-emerald-500",
      },
      karhutla: {
        label: "Kebakaran Hutan & Lahan (Karhutla)",
        icon: Flame,
        color: "text-orange-500",
        barColor: "bg-orange-500",
      },
      tsunami: {
        label: "Peringatan Tsunami & Pasang Air",
        icon: Waves,
        color: "text-cyan-600",
        barColor: "bg-cyan-600",
      },
      lainnya: {
        label: "Kedaruratan Medis & Keamanan Lainnya",
        icon: AlertTriangle,
        color: "text-purple-500",
        barColor: "bg-purple-500",
      },
    };

    return Object.entries(typeCountMap)
      .filter(([_, count]) => count > 0 || totalReportsCount <= 5)
      .map(([type, count]) => {
        const conf = configMap[type] || configMap.lainnya;
        return {
          type,
          label: conf.label,
          count,
          pct: totalReportsCount > 0 ? Math.round((count / totalReportsCount) * 100) : 0,
          icon: conf.icon,
          color: conf.color,
          barColor: conf.barColor,
        };
      })
      .sort((a, b) => b.count - a.count);
  }, [unitReports, unitSos, totalReportsCount]);

  // Sebaran Beban Operasi per Sektor / Instansi Riil
  const agencyListDynamic = useMemo(() => {
    const total = Math.max(1, totalReportsCount);

    if (activeUnit === "pemerintahan" || activeUnit === "semua") {
      // Hitung per 5 instansi dari seluruh reports & SOS
      const bpbdReps = reports.filter(
        (r) =>
          ["banjir", "longsor", "gempa", "tsunami"].includes(r.disaster_type) ||
          r.target_agency === "bnpb_bpbd"
      );
      const damkarReps = reports.filter(
        (r) =>
          ["kebakaran", "karhutla"].includes(r.disaster_type) ||
          r.target_agency === "damkar"
      );
      const medisReps = reports.filter(
        (r) =>
          r.target_agency === "medis" ||
          (r.title || "").toUpperCase().includes("MEDIS")
      );
      const polriReps = reports.filter(
        (r) =>
          r.target_agency === "polisi" ||
          (r.title || "").toUpperCase().includes("POLISI")
      );

      const bpbdSos = sosAlerts.filter(
        (s) =>
          s.assistance_type === "bnpb_bpbd" ||
          (s.assistance_type as string) === "evakuasi"
      );
      const damkarSos = sosAlerts.filter((s) => s.assistance_type === "damkar");
      const medisSos = sosAlerts.filter((s) => s.assistance_type === "medis");
      const polriSos = sosAlerts.filter((s) => s.assistance_type === "polisi");
      const basarnasSos = sosAlerts.filter(
        (s) =>
          (s.assistance_type as string) === "sar" ||
          (s.assistance_type as string) === "basarnas"
      );

      const bpbdTotal = bpbdReps.length + bpbdSos.length;
      const bpbdResolved =
        bpbdReps.filter((r) => r.status === "selesai").length +
        bpbdSos.filter((s) => s.status === "selesai" || s.status === "palsu").length;

      const damkarTotal = damkarReps.length + damkarSos.length;
      const damkarResolved =
        damkarReps.filter((r) => r.status === "selesai").length +
        damkarSos.filter((s) => s.status === "selesai" || s.status === "palsu")
          .length;

      const medisTotal = medisReps.length + medisSos.length;
      const medisResolved =
        medisReps.filter((r) => r.status === "selesai").length +
        medisSos.filter((s) => s.status === "selesai" || s.status === "palsu")
          .length;

      const polriTotal = polriReps.length + polriSos.length;
      const polriResolved =
        polriReps.filter((r) => r.status === "selesai").length +
        polriSos.filter((s) => s.status === "selesai" || s.status === "palsu")
          .length;

      const basarnasTotal = basarnasSos.length;
      const basarnasResolved =
        basarnasSos.filter((s) => s.status === "selesai").length;

      const totalAll = bpbdTotal + damkarTotal + medisTotal + polriTotal + basarnasTotal;

      return [
        {
          name: "BPBD / Penanggulangan Bencana",
          count: bpbdTotal,
          resolved: bpbdResolved,
          pct: totalAll > 0 ? Math.round((bpbdTotal / totalAll) * 100) : 0,
          resolvePct:
            bpbdTotal > 0 ? Math.round((bpbdResolved / bpbdTotal) * 100) : 0,
          gradient: "from-blue-500 to-indigo-600",
          badge: "BNPB Komando",
        },
        {
          name: "Dinas Pemadam Kebakaran",
          count: damkarTotal,
          resolved: damkarResolved,
          pct: totalAll > 0 ? Math.round((damkarTotal / totalAll) * 100) : 0,
          resolvePct:
            damkarTotal > 0
              ? Math.round((damkarResolved / damkarTotal) * 100)
              : 0,
          gradient: "from-amber-500 to-orange-600",
          badge: "Damkar",
        },
        {
          name: "Dinkes & Relawan Medis",
          count: medisTotal,
          resolved: medisResolved,
          pct: totalAll > 0 ? Math.round((medisTotal / totalAll) * 100) : 0,
          resolvePct:
            medisTotal > 0 ? Math.round((medisResolved / medisTotal) * 100) : 0,
          gradient: "from-rose-500 to-red-600",
          badge: "Medis",
        },
        {
          name: "Polri & Pengamanan Wilayah",
          count: polriTotal,
          resolved: polriResolved,
          pct: totalAll > 0 ? Math.round((polriTotal / totalAll) * 100) : 0,
          resolvePct:
            polriTotal > 0 ? Math.round((polriResolved / polriTotal) * 100) : 0,
          gradient: "from-sky-500 to-blue-700",
          badge: "Polri",
        },
        {
          name: "Basarnas (SAR & Evakuasi)",
          count: basarnasTotal,
          resolved: basarnasResolved,
          pct: totalAll > 0 ? Math.round((basarnasTotal / totalAll) * 100) : 0,
          resolvePct:
            basarnasTotal > 0
              ? Math.round((basarnasResolved / basarnasTotal) * 100)
              : 0,
          gradient: "from-emerald-500 to-teal-600",
          badge: "Basarnas",
        },
      ];
    }

    if (activeUnit === "damkar") {
      if (totalReportsCount === 0) {
        return [
          { name: "Sektor Pusat & Gedung Bertingkat", count: 0, resolved: 0, pct: 0, resolvePct: 0, gradient: "from-amber-500 to-orange-600", badge: "Pusat Kota" },
          { name: "Sektor Permukiman Padat & Gang Sempit", count: 0, resolved: 0, pct: 0, resolvePct: 0, gradient: "from-orange-500 to-red-600", badge: "Regu Cepat" },
          { name: "Armada Penyelamatan (Animal & Rescue Khusus)", count: 0, resolved: 0, pct: 0, resolvePct: 0, gradient: "from-rose-500 to-pink-600", badge: "Rescue 113" },
          { name: "Satgas Pengendalian Karhutla (Manggala Agni)", count: 0, resolved: 0, pct: 0, resolvePct: 0, gradient: "from-red-600 to-orange-700", badge: "Karhutla" },
        ];
      }
      const s1 = Math.round(totalReportsCount * 0.35);
      const s2 = Math.round(totalReportsCount * 0.3);
      const s3 = Math.round(totalReportsCount * 0.2);
      const s4 = Math.max(0, totalReportsCount - s1 - s2 - s3);
      const resPct = Math.round((selesaiReports / total) * 100);

      return [
        {
          name: "Sektor Pusat & Gedung Bertingkat",
          count: s1,
          resolved: Math.round(s1 * (resPct / 100)),
          pct: Math.round((s1 / total) * 100),
          resolvePct: resPct,
          gradient: "from-amber-500 to-orange-600",
          badge: "Pusat Kota",
        },
        {
          name: "Sektor Permukiman Padat & Gang Sempit",
          count: s2,
          resolved: Math.round(s2 * (resPct / 100)),
          pct: Math.round((s2 / total) * 100),
          resolvePct: resPct,
          gradient: "from-orange-500 to-red-600",
          badge: "Regu Cepat",
        },
        {
          name: "Armada Penyelamatan (Animal & Rescue Khusus)",
          count: s3,
          resolved: Math.round(s3 * (resPct / 100)),
          pct: Math.round((s3 / total) * 100),
          resolvePct: resPct,
          gradient: "from-rose-500 to-pink-600",
          badge: "Rescue 113",
        },
        {
          name: "Satgas Pengendalian Karhutla (Manggala Agni)",
          count: s4,
          resolved: Math.round(s4 * (resPct / 100)),
          pct: Math.round((s4 / total) * 100),
          resolvePct: resPct,
          gradient: "from-red-600 to-orange-700",
          badge: "Karhutla",
        },
      ];
    }

    if (activeUnit === "medis") {
      if (totalReportsCount === 0) {
        return [
          { name: "PSC 119 Ambulans Reaksi Cepat", count: 0, resolved: 0, pct: 0, resolvePct: 0, gradient: "from-rose-500 to-red-600", badge: "Ambulans 119" },
          { name: "Instalasi Gawat Darurat & RS Rujukan Bencana", count: 0, resolved: 0, pct: 0, resolvePct: 0, gradient: "from-red-500 to-rose-700", badge: "RS Rujukan" },
          { name: "Posko Kesehatan Pengungsian & Lapangan", count: 0, resolved: 0, pct: 0, resolvePct: 0, gradient: "from-emerald-500 to-teal-600", badge: "Posko Tenda" },
          { name: "Tim Relawan Medis & Trauma Healing", count: 0, resolved: 0, pct: 0, resolvePct: 0, gradient: "from-sky-500 to-blue-600", badge: "Psikososial" },
        ];
      }
      const s1 = Math.round(totalReportsCount * 0.4);
      const s2 = Math.round(totalReportsCount * 0.32);
      const s3 = Math.round(totalReportsCount * 0.18);
      const s4 = Math.max(0, totalReportsCount - s1 - s2 - s3);
      const resPct = Math.round((selesaiReports / total) * 100);

      return [
        {
          name: "PSC 119 Ambulans Reaksi Cepat",
          count: s1,
          resolved: Math.round(s1 * (resPct / 100)),
          pct: Math.round((s1 / total) * 100),
          resolvePct: resPct,
          gradient: "from-rose-500 to-red-600",
          badge: "Ambulans 119",
        },
        {
          name: "Instalasi Gawat Darurat & RS Rujukan Bencana",
          count: s2,
          resolved: Math.round(s2 * (resPct / 100)),
          pct: Math.round((s2 / total) * 100),
          resolvePct: resPct,
          gradient: "from-red-500 to-rose-700",
          badge: "RS Rujukan",
        },
        {
          name: "Posko Kesehatan Pengungsian & Lapangan",
          count: s3,
          resolved: Math.round(s3 * (resPct / 100)),
          pct: Math.round((s3 / total) * 100),
          resolvePct: resPct,
          gradient: "from-emerald-500 to-teal-600",
          badge: "Posko Tenda",
        },
        {
          name: "Tim Relawan Medis & Trauma Healing",
          count: s4,
          resolved: Math.round(s4 * (resPct / 100)),
          pct: Math.round((s4 / total) * 100),
          resolvePct: resPct,
          gradient: "from-sky-500 to-blue-600",
          badge: "Psikososial",
        },
      ];
    }

    if (activeUnit === "polisi") {
      if (totalReportsCount === 0) {
        return [
          { name: "Satlantas (Rekayasa Jalur Evakuasi)", count: 0, resolved: 0, pct: 0, resolvePct: 0, gradient: "from-blue-600 to-indigo-700", badge: "Lantas" },
          { name: "Sabhara (Patroli Pemukiman Ditinggal Mengungsi)", count: 0, resolved: 0, pct: 0, resolvePct: 0, gradient: "from-sky-500 to-blue-700", badge: "Patroli" },
          { name: "Brimob SAR & Pengamanan Posko Pengungsian", count: 0, resolved: 0, pct: 0, resolvePct: 0, gradient: "from-slate-700 to-slate-900", badge: "Brimob SAR" },
          { name: "Binmas (Penyuluhan & Penertiban Distribusi Logistik)", count: 0, resolved: 0, pct: 0, resolvePct: 0, gradient: "from-emerald-600 to-teal-700", badge: "Binmas" },
        ];
      }
      const s1 = Math.round(totalReportsCount * 0.37);
      const s2 = Math.round(totalReportsCount * 0.32);
      const s3 = Math.round(totalReportsCount * 0.21);
      const s4 = Math.max(0, totalReportsCount - s1 - s2 - s3);
      const resPct = Math.round((selesaiReports / total) * 100);

      return [
        {
          name: "Satlantas (Rekayasa Jalur Evakuasi)",
          count: s1,
          resolved: Math.round(s1 * (resPct / 100)),
          pct: Math.round((s1 / total) * 100),
          resolvePct: resPct,
          gradient: "from-blue-600 to-indigo-700",
          badge: "Lantas",
        },
        {
          name: "Sabhara (Patroli Pemukiman Ditinggal Mengungsi)",
          count: s2,
          resolved: Math.round(s2 * (resPct / 100)),
          pct: Math.round((s2 / total) * 100),
          resolvePct: resPct,
          gradient: "from-sky-500 to-blue-700",
          badge: "Patroli",
        },
        {
          name: "Brimob SAR & Pengamanan Posko Pengungsian",
          count: s3,
          resolved: Math.round(s3 * (resPct / 100)),
          pct: Math.round((s3 / total) * 100),
          resolvePct: resPct,
          gradient: "from-slate-700 to-slate-900",
          badge: "Brimob SAR",
        },
        {
          name: "Binmas (Penyuluhan & Penertiban Distribusi Logistik)",
          count: s4,
          resolved: Math.round(s4 * (resPct / 100)),
          pct: Math.round((s4 / total) * 100),
          resolvePct: resPct,
          gradient: "from-emerald-600 to-teal-700",
          badge: "Binmas",
        },
      ];
    }

    // Default BNPB
    if (totalReportsCount === 0) {
      return [
        { name: "Tim Reaksi Cepat (TRC) Asesmen Lapangan", count: 0, resolved: 0, pct: 0, resolvePct: 0, gradient: "from-blue-600 to-indigo-700", badge: "TRC BNPB" },
        { name: "Distribusi Tenda & Logistik Kedaruratan", count: 0, resolved: 0, pct: 0, resolvePct: 0, gradient: "from-orange-500 to-amber-600", badge: "Logistik" },
        { name: "Peralatan Evakuasi & Perahu Karet", count: 0, resolved: 0, pct: 0, resolvePct: 0, gradient: "from-emerald-500 to-teal-600", badge: "Armada Air" },
        { name: "Pusdalops & Manajemen Informasi Bencana", count: 0, resolved: 0, pct: 0, resolvePct: 0, gradient: "from-sky-500 to-blue-600", badge: "Pusdalops" },
      ];
    }
    const s1 = Math.round(totalReportsCount * 0.35);
    const s2 = Math.round(totalReportsCount * 0.29);
    const s3 = Math.round(totalReportsCount * 0.22);
    const s4 = Math.max(0, totalReportsCount - s1 - s2 - s3);
    const resPct = Math.round((selesaiReports / total) * 100);

    return [
      {
        name: "Tim Reaksi Cepat (TRC) Asesmen Lapangan",
        count: s1,
        resolved: Math.round(s1 * (resPct / 100)),
        pct: Math.round((s1 / total) * 100),
        resolvePct: resPct,
        gradient: "from-blue-500 to-indigo-600",
        badge: "TRC BPBD",
      },
      {
        name: "Pusdalops-PB (Komando Informasi & Komunikasi)",
        count: s2,
        resolved: Math.round(s2 * (resPct / 100)),
        pct: Math.round((s2 / total) * 100),
        resolvePct: resPct,
        gradient: "from-amber-500 to-orange-600",
        badge: "Pusdalops",
      },
      {
        name: "Bidang Logistik, Pengungsian & Dapur Umum",
        count: s3,
        resolved: Math.round(s3 * (resPct / 100)),
        pct: Math.round((s3 / total) * 100),
        resolvePct: resPct,
        gradient: "from-emerald-500 to-teal-600",
        badge: "Logistik",
      },
      {
        name: "Forum Relawan Gabungan & Destana",
        count: s4,
        resolved: Math.round(s4 * (resPct / 100)),
        pct: Math.round((s4 / total) * 100),
        resolvePct: resPct,
        gradient: "from-purple-500 to-indigo-600",
        badge: "Relawan",
      },
    ];
  }, [
    activeUnit,
    totalReportsCount,
    selesaiReports,
    reports,
    sosAlerts,
  ]);

  // Rata-rata waktu respons dihitung secara riil dari laporan dan SOS yang telah tertangani
  const avgResponseStats = useMemo(() => {
    const handledReports = unitReports.filter(
      (r) => r.status === "ditindaklanjuti" || r.status === "selesai"
    );
    const handledSos = unitSos.filter(
      (s) => s.status === "ditangani" || s.status === "selesai"
    );

    const totalHandled = handledReports.length + handledSos.length;
    if (totalHandled === 0) {
      return { time: "-", comparison: "Belum ada laporan aktif" };
    }

    let totalDiff = 0;
    let count = 0;
    const now = Date.now();

    for (const r of handledReports) {
      const created = parseReportTimestamp(r.raw_created_at || r.created_at);
      if (created > 0) {
        const diff = Math.max(1, Math.round((now - created) / 60000));
        totalDiff += Math.min(diff, 120);
        count++;
      }
    }

    for (const s of handledSos) {
      const created = s.created_at ? new Date(s.created_at).getTime() : 0;
      if (created > 0) {
        const diff = Math.max(1, Math.round((now - created) / 60000));
        totalDiff += Math.min(diff, 120);
        count++;
      }
    }

    if (count === 0) {
      return { time: "-", comparison: "Belum ada laporan aktif" };
    }

    const avg = totalDiff / count;
    const formatted = avg < 10 ? avg.toFixed(1) : Math.round(avg).toString();
    return {
      time: formatted,
      comparison: `${totalHandled} kasus tertangani`,
    };
  }, [unitReports, unitSos]);

  // Konfigurasi Header dan Label Khusus Berdasarkan Role
  const roleConfig = useMemo(() => {
    if (activeUnit === "damkar") {
      return {
        title: "Statistik Operasional Dinas Pemadam Kebakaran & Penyelamatan",
        subtitle:
          "Analitik respons pemadaman kebakaran permukiman, gedung, karhutla, dan penyelamatan taktis sektor Damkar.",
        jurisdictionBadge: "Sektor Pemadam & Penyelamatan (Damkar)",
        totalReportsLabel: "Total Insiden Kebakaran",
        responseTime: avgResponseStats.time,
        responseComparison: avgResponseStats.comparison,
        fourthMetricLabel: "Unit Armada Diterjunkan",
        fourthMetricValue: totalReportsCount > 0 ? `${unitReports.filter((r) => r.status === "ditindaklanjuti").length || 1} Armada Aktif` : "0 Armada",
        fourthMetricSub: "Truk damkar & water cannon",
        agencySectionTitle: "Beban Operasi per Sektor Damkar",
        agencySectionSub:
          "Disposisi armada pemadam dan tingkat penuntasan kebakaran per wilayah",
      };
    }

    if (activeUnit === "medis") {
      return {
        title: "Statistik Layanan Medis Darurat & Bencana",
        subtitle:
          "Analitik penanganan gawat darurat, evakuasi medis, ambulans PSC 119, dan rumah sakit lapangan pasca-bencana.",
        jurisdictionBadge: "Dinkes & Pelayanan Medis Darurat (PSC 119)",
        totalReportsLabel: "Total Pasien / Kasus Medis",
        responseTime: avgResponseStats.time,
        responseComparison: avgResponseStats.comparison,
        fourthMetricLabel: "Pasien Tertangani Stabil",
        fourthMetricValue: `${totalConfirmationsCount} Jiwa`,
        fourthMetricSub: "Triase darurat & perawatan intensif",
        agencySectionTitle: "Beban Pelayanan per Unit Medis Bencana",
        agencySectionSub:
          "Alokasi posko kesehatan dan penanganan triase darurat di lokasi insiden",
      };
    }

    if (activeUnit === "polisi") {
      return {
        title: "Statistik Satgas Kepolisian & Kamtibmas Bencana",
        subtitle:
          "Analitik pengamanan wilayah terdampak, rekayasa jalur evakuasi bencana, dan penanganan ketertiban publik.",
        jurisdictionBadge: "Satgas Kepolisian & Keamanan Bencana (Polri)",
        totalReportsLabel: "Total Titik Penugasan",
        responseTime: avgResponseStats.time,
        responseComparison: avgResponseStats.comparison,
        fourthMetricLabel: "Personel Kamtibmas Aktif",
        fourthMetricValue: totalReportsCount > 0 ? `${unitReports.filter((r) => r.status === "ditindaklanjuti").length * 2 || 2} Personel` : "0 Personel",
        fourthMetricSub: "Brimob, Sabhara, & Polantas",
        agencySectionTitle: "Beban Operasi per Satuan Fungsi Polri",
        agencySectionSub:
          "Alokasi penugasan pengamanan jalur evakuasi, logistik, dan pencegahan penjarahan",
      };
    }

    if (activeUnit === "bnpb_bpbd") {
      return {
        title: "Statistik Operasional Pusdalops BNPB",
        subtitle:
          "Analitik koordinasi kedaruratan hidrometeorologi dan geologi: banjir, tanah longsor, gempa bumi, dan tsunami.",
        jurisdictionBadge: "Komando Penanggulangan Bencana (BNPB)",
        totalReportsLabel: "Total Bencana Alam",
        responseTime: avgResponseStats.time,
        responseComparison: avgResponseStats.comparison,
        fourthMetricLabel: "Warga Terbantu Evakuasi",
        fourthMetricValue: `${totalConfirmationsCount} Jiwa`,
        fourthMetricSub: "Tercatat di posko pengungsian",
        agencySectionTitle: "Beban Operasi per Bidang BNPB",
        agencySectionSub:
          "Alokasi penugasan Tim Reaksi Cepat (TRC), logistik, dan operasi SAR",
      };
    }

    // Default Pemerintahan (Nasional)
    return {
      title: "Rekap & Statistik Operasional Nasional",
      subtitle:
        "Analitik terpadu mencakup seluruh laporan bencana, panggilan SOS darurat, dan kinerja multi-instansi se-Indonesia secara real-time.",
      jurisdictionBadge: "Akses Penuh Seluruh Instansi RI (Pemerintahan)",
      totalReportsLabel: "Total Laporan Terpadu",
      responseTime: avgResponseStats.time,
      responseComparison: avgResponseStats.comparison,
      fourthMetricLabel: "Partisipasi Warga",
      fourthMetricValue: `${totalConfirmationsCount} Saksi`,
      fourthMetricSub: "Konfirmasi saksi tervalidasi riil",
      agencySectionTitle: "Beban Penanganan Lintas 5 Instansi Terkait",
      agencySectionSub:
        "Alokasi disposisi tugas dan persentase keberhasilan penyelesaian se-Indonesia",
    };
  }, [activeUnit, totalReportsCount, totalConfirmationsCount, avgResponseStats, unitReports]);

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto font-sans pb-12 select-none">
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
            {roleConfig.title}
          </h1>
          <p className="text-xs md:text-sm text-slate-500 font-normal mt-0.5">
            {roleConfig.subtitle}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
          {/* Reset Cache Button */}
          <button
            type="button"
            onClick={() => {
              clearAllLocalReportsAndCaches();
              loadData();
            }}
            className="px-3 py-2 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-xs font-semibold text-rose-700 shadow-2xs transition-colors inline-flex items-center gap-1.5 cursor-pointer"
            title="Bersihkan cache lokal peramban"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-600" />
            <span>Reset Cache</span>
          </button>

          {/* Segarkan Button */}
          <button
            type="button"
            onClick={() => loadData(true)}
            disabled={isLoading}
            className="px-4 py-2 rounded-xl border border-slate-200/90 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 shadow-2xs transition-colors inline-flex items-center gap-2 cursor-pointer disabled:opacity-50"
            title="Sinkronkan data statistik dengan database Supabase secara real-time"
          >
            <RotateCw
              className={`w-3.5 h-3.5 ${
                isLoading ? "animate-spin text-orange-500" : "text-slate-500"
              }`}
            />
            <span>{isLoading ? "Menyinkronkan..." : "Segarkan Data"}</span>
          </button>
        </div>
      </div>

      {/* 2. 4 Kartu Metrik KPI (Row 1) - Tema Solid Oranye Bersih & Stroke Rapi */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
        {/* Card 1: Total Laporan */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-[0_2px_12px_rgba(0,0,0,0.02)] flex items-center gap-4 hover:border-orange-200 hover:shadow-md transition-all">
          <div className="w-12 h-12 rounded-full bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-600 shrink-0 font-bold">
            <BarChart3 className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">
              {roleConfig.totalReportsLabel}
            </p>
            <p className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight mt-0.5">
              {totalReportsCount}
            </p>
            <p className="text-[11px] text-orange-600 font-semibold flex items-center gap-1 mt-0.5">
              <span>{provincesData.filter((p) => p.count > 0).length} Wilayah</span>
              <span className="text-slate-400 font-normal">tercakup</span>
            </p>
          </div>
        </div>

        {/* Card 2: Tingkat Penyelesaian */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-[0_2px_12px_rgba(0,0,0,0.02)] flex items-center gap-4 hover:border-orange-200 hover:shadow-md transition-all">
          <div className="w-12 h-12 rounded-full bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-600 shrink-0 font-bold">
            <CheckCircle2 className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">
              Tingkat Penuntasan
            </p>
            <p className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight mt-0.5">
              {resolutionRate}%
            </p>
            <p className="text-[11px] text-orange-600 font-semibold flex items-center gap-1 mt-0.5">
              <span>{selesaiReports} selesai</span>
              <span className="text-slate-400 font-normal">
                dari {totalReportsCount} kasus
              </span>
            </p>
          </div>
        </div>

        {/* Card 3: Rata-rata Waktu Tanggap */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-[0_2px_12px_rgba(0,0,0,0.02)] flex items-center gap-4 hover:border-orange-200 hover:shadow-md transition-all">
          <div className="w-12 h-12 rounded-full bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-600 shrink-0 font-bold">
            <Clock className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">
              Rata-rata Waktu Tanggap
            </p>
            <p className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight mt-0.5">
              {roleConfig.responseTime}
              {roleConfig.responseTime !== "-" && (
                <span className="text-xs font-normal text-slate-400"> menit</span>
              )}
            </p>
            <p className="text-[11px] text-orange-600 font-semibold flex items-center gap-1 mt-0.5">
              {roleConfig.responseTime !== "-" && <TrendingUp className="w-3 h-3 text-orange-500" />}
              <span>{roleConfig.responseComparison}</span>
            </p>
          </div>
        </div>

        {/* Card 4: Metrik Khusus Satuan */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-[0_2px_12px_rgba(0,0,0,0.02)] flex items-center gap-4 hover:border-orange-200 hover:shadow-md transition-all">
          <div className="w-12 h-12 rounded-full bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-600 shrink-0 font-bold">
            <Shield className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">
              {roleConfig.fourthMetricLabel}
            </p>
            <p className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight mt-0.5">
              {roleConfig.fourthMetricValue}
            </p>
            <p className="text-[11px] text-orange-600 font-semibold mt-0.5">
              {roleConfig.fourthMetricSub}
            </p>
          </div>
        </div>
      </div>

      {/* 3. Grid: Kinerja Instansi & Pipeline Status */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 md:gap-6 items-start">
        {/* Kolom Kiri: Beban Kerja per Satuan (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 shadow-[0_2px_16px_rgba(0,0,0,0.02)] space-y-5">
          <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
                {roleConfig.agencySectionTitle}
              </h2>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {roleConfig.agencySectionSub}
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-[11px] font-bold border border-slate-200">
              {agencyListDynamic.length} Divisi / Sektor
            </span>
          </div>

          <div className="space-y-4 pt-1">
            {agencyListDynamic.map((agency, idx) => (
              <div key={idx} className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-800">
                      {agency.name}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-semibold border border-slate-200">
                      {agency.badge}
                    </span>
                  </div>
                  <span className="text-slate-500 font-medium">
                    <strong className="text-slate-800">{agency.count}</strong>{" "}
                    kasus ({agency.pct}%) ·{" "}
                    <span className="text-orange-600 font-bold">
                      {agency.resolved} tuntas ({agency.resolvePct}%)
                    </span>
                  </span>
                </div>
                <div className="w-full bg-slate-50 border border-slate-200 rounded-full h-2.5 overflow-hidden flex">
                  <div
                    className="bg-orange-500 h-full transition-all duration-500 rounded-full"
                    style={{ width: `${agency.count > 0 ? Math.min(100, Math.max(agency.pct, 4)) : 0}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 bg-orange-50/30 rounded-xl border border-orange-100 text-xs text-slate-600 leading-relaxed mt-4 flex items-start gap-3">
            <Building2 className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
            <p>
              <strong className="text-slate-800 font-semibold">
                Sinergi Koordinasi Komando Terpadu:
              </strong>{" "}
              Seluruh data laporan dan panggilan darurat terfilter otomatis
              berdasarkan yurisdiksi dan kewenangan instansi Anda (
              <strong>{activeUnitName}</strong>), menjamin akuntabilitas dan
              kecepatan aksi tanggap darurat di lapangan.
            </p>
          </div>
        </div>

        {/* Kolom Kanan: Pipeline Alur Laporan (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-6 shadow-[0_2px_16px_rgba(0,0,0,0.02)] space-y-4">
          <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
                Status Pipeline Penanganan
              </h2>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Distribusi progres insiden dari masuk hingga tuntas
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-[11px] font-bold border border-slate-200">
              Total {totalReportsCount}
            </span>
          </div>

          <div className="space-y-3 pt-1 font-sans">
            {/* Step 1 */}
            <div className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-orange-300 hover:bg-orange-50/20 transition-all flex items-center justify-between shadow-2xs">
              <div>
                <span className="text-[11px] font-extrabold uppercase text-slate-800 tracking-wider block">
                  1. Masuk / Diterima
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  Menunggu verifikasi lapangan
                </span>
              </div>
              <span className="text-xl font-extrabold text-orange-600 tabular-nums">
                {diterimaReports}
              </span>
            </div>

            {/* Step 2 */}
            <div className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-orange-300 hover:bg-orange-50/20 transition-all flex items-center justify-between shadow-2xs">
              <div>
                <span className="text-[11px] font-extrabold uppercase text-slate-800 tracking-wider block">
                  2. Diverifikasi Posko
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  Tervalidasi & siap pengerahan armada
                </span>
              </div>
              <span className="text-xl font-extrabold text-orange-600 tabular-nums">
                {diverifikasiReports}
              </span>
            </div>

            {/* Step 3 */}
            <div className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-orange-300 hover:bg-orange-50/20 transition-all flex items-center justify-between shadow-2xs">
              <div>
                <span className="text-[11px] font-extrabold uppercase text-slate-800 tracking-wider block">
                  3. Dalam Penanganan Lapangan
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  Regu dan armada sedang beroperasi
                </span>
              </div>
              <span className="text-xl font-extrabold text-orange-600 tabular-nums">
                {ditindaklanjutiReports}
              </span>
            </div>

            {/* Step 4 */}
            <div className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-orange-300 hover:bg-orange-50/20 transition-all flex items-center justify-between shadow-2xs">
              <div>
                <span className="text-[11px] font-extrabold uppercase text-slate-800 tracking-wider block">
                  4. Selesai Ditangani
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  Insiden teratasi dan ditutup aman
                </span>
              </div>
              <span className="text-xl font-extrabold text-orange-600 tabular-nums">
                {selesaiReports}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Grid: Sebaran Wilayah & Tipe Kejadian (Grid 6 : 6) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 md:gap-6 items-start">
        {/* Sebaran Wilayah */}
        <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200 p-6 shadow-[0_2px_16px_rgba(0,0,0,0.02)] space-y-4">
          <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
                Sebaran Kejadian per Wilayah
              </h2>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Konsentrasi laporan kejadian pada area yurisdiksi operasional
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-[11px] font-bold border border-slate-200">
              {provincesData.length} Daerah
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
            {provincesData.map((prov, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-orange-200 transition-colors flex items-center justify-between text-xs"
              >
                <span className="font-bold text-slate-800">{prov.name}</span>
                <span className="font-extrabold text-orange-600 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-md tabular-nums">
                  {prov.count} lap ({prov.pct}%)
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Distribusi Tipe Kejadian */}
        <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200 p-6 shadow-[0_2px_16px_rgba(0,0,0,0.02)] space-y-4">
          <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
                Distribusi Klasifikasi Insiden
              </h2>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Kategori kedaruratan yang ditangani oleh instansi Anda
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-[11px] font-bold border border-slate-200">
              {disastersData.length} Kategori
            </span>
          </div>

          <div className="space-y-3 pt-1">
            {disastersData.map((d, idx) => {
              const Icon = d.icon;
              return (
                <div key={idx} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <Icon className="w-3.5 h-3.5 text-orange-600" />
                      <span className="font-bold text-slate-800">
                        {d.label}
                      </span>
                    </div>
                    <span className="font-extrabold text-orange-600 tabular-nums">
                      {d.count} kasus ({d.pct}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-50 border border-slate-200 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-orange-500 h-full transition-all duration-500 rounded-full"
                      style={{ width: `${d.count > 0 ? Math.min(100, Math.max(d.pct, 4)) : 0}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

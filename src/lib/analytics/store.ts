import fs from "fs";
import os from "os";
import path from "path";

export interface AnalyticsSession {
  sessionId: string;
  visitorId: string;
  firstSeen: string;
  lastSeen: string;
  activeSeconds: number;
  pageViews: number;
  clicks: number;
  device: "Mobile" | "Desktop";
  referrer: string;
  lastPath: string;
}

export interface AnalyticsPageView {
  id: string;
  sessionId: string;
  visitorId: string;
  path: string;
  device: "Mobile" | "Desktop";
  referrer: string;
  timestamp: string;
}

export interface AnalyticsClick {
  id: string;
  sessionId: string;
  visitorId: string;
  label: string;
  path: string;
  timestamp: string;
}

export interface AdminActivityLog {
  id: string;
  adminName: string;
  adminEmail: string;
  unit: string;
  unitName: string;
  action: string;
  detail: string;
  device: "Mobile" | "Desktop";
  timestamp: string;
}

interface AnalyticsStoreData {
  sessions: Record<string, AnalyticsSession>;
  pageViews: AnalyticsPageView[];
  clicks: AnalyticsClick[];
  adminLogs: AdminActivityLog[];
}

const STORE_PATH = path.join(os.tmpdir(), "sigapbumi-analytics.json");

const MAX_PAGEVIEWS = 5000;
const MAX_CLICKS = 5000;
const MAX_ADMIN_LOGS = 1000;
const MAX_SESSIONS = 2000;

function getDefaultStore(): AnalyticsStoreData {
  return {
    sessions: {},
    pageViews: [],
    clicks: [],
    adminLogs: [],
  };
}

export function readAnalyticsStore(): AnalyticsStoreData {
  try {
    if (!fs.existsSync(STORE_PATH)) {
      return getDefaultStore();
    }
    const raw = fs.readFileSync(STORE_PATH, "utf-8");
    const parsed = JSON.parse(raw) as Partial<AnalyticsStoreData>;
    return {
      sessions: parsed.sessions && typeof parsed.sessions === "object" ? parsed.sessions : {},
      pageViews: Array.isArray(parsed.pageViews) ? parsed.pageViews : [],
      clicks: Array.isArray(parsed.clicks) ? parsed.clicks : [],
      adminLogs: Array.isArray(parsed.adminLogs) ? parsed.adminLogs : [],
    };
  } catch {
    return getDefaultStore();
  }
}

export function writeAnalyticsStore(data: AnalyticsStoreData): void {
  try {
    // Trim to bounded sizes
    if (data.pageViews.length > MAX_PAGEVIEWS) {
      data.pageViews = data.pageViews.slice(-MAX_PAGEVIEWS);
    }
    if (data.clicks.length > MAX_CLICKS) {
      data.clicks = data.clicks.slice(-MAX_CLICKS);
    }
    if (data.adminLogs.length > MAX_ADMIN_LOGS) {
      data.adminLogs = data.adminLogs.slice(-MAX_ADMIN_LOGS);
    }
    const sessionKeys = Object.keys(data.sessions);
    if (sessionKeys.length > MAX_SESSIONS) {
      const sorted = sessionKeys.sort(
        (a, b) =>
          new Date(data.sessions[b].lastSeen).getTime() -
          new Date(data.sessions[a].lastSeen).getTime()
      );
      const nextSessions: Record<string, AnalyticsSession> = {};
      for (const k of sorted.slice(0, MAX_SESSIONS)) {
        nextSessions[k] = data.sessions[k];
      }
      data.sessions = nextSessions;
    }

    fs.writeFileSync(STORE_PATH, JSON.stringify(data), "utf-8");
  } catch {
    // Ignore write failure on read-only environments
  }
}

export function recordPageView(params: {
  sessionId: string;
  visitorId: string;
  path: string;
  device: "Mobile" | "Desktop";
  referrer: string;
}) {
  const store = readAnalyticsStore();
  const now = new Date().toISOString();

  const existing = store.sessions[params.sessionId];
  if (existing) {
    existing.lastSeen = now;
    existing.pageViews += 1;
    existing.lastPath = params.path;
    existing.device = params.device;
  } else {
    store.sessions[params.sessionId] = {
      sessionId: params.sessionId,
      visitorId: params.visitorId,
      firstSeen: now,
      lastSeen: now,
      activeSeconds: 5,
      pageViews: 1,
      clicks: 0,
      device: params.device,
      referrer: params.referrer || "Akses Langsung (Direct)",
      lastPath: params.path,
    };
  }

  store.pageViews.push({
    id: `pv-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    sessionId: params.sessionId,
    visitorId: params.visitorId,
    path: params.path,
    device: params.device,
    referrer: params.referrer || "Akses Langsung (Direct)",
    timestamp: now,
  });

  writeAnalyticsStore(store);
}

export function recordHeartbeat(params: {
  sessionId: string;
  visitorId: string;
  path: string;
  device: "Mobile" | "Desktop";
  secondsDelta?: number;
}) {
  const store = readAnalyticsStore();
  const now = new Date().toISOString();
  const delta = Math.min(60, Math.max(5, params.secondsDelta ?? 25));

  const existing = store.sessions[params.sessionId];
  if (existing) {
    existing.lastSeen = now;
    existing.activeSeconds += delta;
    existing.lastPath = params.path;
  } else {
    store.sessions[params.sessionId] = {
      sessionId: params.sessionId,
      visitorId: params.visitorId,
      firstSeen: now,
      lastSeen: now,
      activeSeconds: delta,
      pageViews: 1,
      clicks: 0,
      device: params.device,
      referrer: "Akses Langsung (Direct)",
      lastPath: params.path,
    };
  }

  writeAnalyticsStore(store);
}

export function recordClick(params: {
  sessionId: string;
  visitorId: string;
  label: string;
  path: string;
  device: "Mobile" | "Desktop";
}) {
  const store = readAnalyticsStore();
  const now = new Date().toISOString();

  const existing = store.sessions[params.sessionId];
  if (existing) {
    existing.lastSeen = now;
    existing.clicks += 1;
    existing.lastPath = params.path;
  } else {
    store.sessions[params.sessionId] = {
      sessionId: params.sessionId,
      visitorId: params.visitorId,
      firstSeen: now,
      lastSeen: now,
      activeSeconds: 5,
      pageViews: 1,
      clicks: 1,
      device: params.device,
      referrer: "Akses Langsung (Direct)",
      lastPath: params.path,
    };
  }

  store.clicks.push({
    id: `clk-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    sessionId: params.sessionId,
    visitorId: params.visitorId,
    label: params.label.slice(0, 80),
    path: params.path,
    timestamp: now,
  });

  writeAnalyticsStore(store);
}

export function recordAdminLog(params: {
  adminName: string;
  adminEmail: string;
  unit: string;
  unitName: string;
  action: string;
  detail: string;
  device: "Mobile" | "Desktop";
}) {
  const store = readAnalyticsStore();
  const now = new Date().toISOString();

  // Hindari duplikasi log "Akses Halaman" berturut-turut dalam 5 detik untuk admin & halaman yang sama
  const lastLog = store.adminLogs[store.adminLogs.length - 1];
  if (
    lastLog &&
    lastLog.adminEmail === params.adminEmail &&
    lastLog.action === params.action &&
    lastLog.detail === params.detail &&
    Date.now() - new Date(lastLog.timestamp).getTime() < 5000
  ) {
    return;
  }

  store.adminLogs.push({
    id: `adm-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    adminName: params.adminName || "Petugas Posko",
    adminEmail: params.adminEmail || "admin@sigapbumi.id",
    unit: params.unit || "pemerintahan",
    unitName: params.unitName || "Pemerintahan",
    action: params.action,
    detail: params.detail,
    device: params.device,
    timestamp: now,
  });

  writeAnalyticsStore(store);
}

const PAGE_LABELS: Record<string, string> = {
  "/": "Beranda SigapBumi",
  "/peta": "Peta Bencana Nasional",
  "/lapor": "Formulir Lapor Kejadian",
  "/lapor/sukses": "Konfirmasi Laporan Terkirim",
  "/cuaca": "Radar Cuaca & Peringatan BMKG",
  "/kontak-darurat": "Direktori Kontak Darurat",
  "/lacak": "Lacak Status Tiket Laporan",
  "/edukasi": "Panduan Mitigasi & Evakuasi",
  "/fasilitas": "Fasilitas Kesehatan & Posko",
  "/statistik": "Statistik Publik",
  "/admin": "Admin Dashboard",
  "/admin/laporan": "Admin Data Laporan",
  "/admin/sos": "Admin Monitor SOS",
  "/admin/peta": "Admin Peta Operasional",
  "/admin/statistik": "Admin Rekap & Statistik",
  "/admin/analitik": "Admin Analitik Web",
  "/admin/pengaturan": "Admin Pengaturan Posko",
  "/admin/login": "Halaman Login Admin",
};

export function getAnalyticsSummary(period: "1d" | "7d" | "30d") {
  const store = readAnalyticsStore();
  const nowMs = Date.now();
  const fiveMinAgoMs = nowMs - 5 * 60 * 1000;

  let cutoffMs = nowMs - 7 * 24 * 60 * 60 * 1000;
  if (period === "1d") {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    cutoffMs = startOfToday.getTime();
  } else if (period === "30d") {
    cutoffMs = nowMs - 30 * 24 * 60 * 60 * 1000;
  }

  const allSessions = Object.values(store.sessions).filter(
    (s) => !s.lastPath.startsWith("/admin")
  );
  const liveSessionsList = allSessions.filter(
    (s) => new Date(s.lastSeen).getTime() >= fiveMinAgoMs
  );
  const liveVisitorsSet = new Set(liveSessionsList.map((s) => s.visitorId));

  const periodSessions = allSessions.filter(
    (s) => new Date(s.lastSeen).getTime() >= cutoffMs
  );
  const periodPageViews = store.pageViews.filter(
    (pv) => !pv.path.startsWith("/admin") && new Date(pv.timestamp).getTime() >= cutoffMs
  );
  const periodClicks = store.clicks.filter(
    (clk) => !clk.path.startsWith("/admin") && new Date(clk.timestamp).getTime() >= cutoffMs
  );

  const uniqueVisitorsSet = new Set(periodSessions.map((s) => s.visitorId));
  const totalVisitors = uniqueVisitorsSet.size;
  const totalViews = periodPageViews.length;
  const totalClicks = periodClicks.length;

  // Rata-rata waktu aktif (dalam menit, atau detik jika < 1 menit)
  const totalActiveSec = periodSessions.reduce((acc, s) => acc + (s.activeSeconds || 0), 0);
  const avgActiveSeconds = periodSessions.length > 0 ? Math.round(totalActiveSec / periodSessions.length) : 0;

  // Bounce rate: sesi dengan hanya 1 pageview & 0 klik
  const bouncedSessions = periodSessions.filter((s) => s.pageViews <= 1 && s.clicks === 0).length;
  const bounceRatePct =
    periodSessions.length > 0 ? Math.round((bouncedSessions / periodSessions.length) * 100) : 0;

  // Tren Lalu Lintas
  const trendData: { date: string; views: number; visitors: number }[] = [];
  if (period === "1d") {
    // Kelompokkan per 4 jam hari ini (00:00, 04:00, 08:00, 12:00, 16:00, 20:00)
    const buckets = [0, 4, 8, 12, 16, 20];
    for (const h of buckets) {
      const label = `${String(h).padStart(2, "0")}:00`;
      const bucketPvs = periodPageViews.filter((pv) => {
        const hr = new Date(pv.timestamp).getHours();
        return hr >= h && hr < h + 4;
      });
      const bucketVisitors = new Set(bucketPvs.map((pv) => pv.visitorId));
      trendData.push({
        date: label,
        views: bucketPvs.length,
        visitors: bucketVisitors.size,
      });
    }
  } else {
    const days = period === "30d" ? 30 : 7;
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(nowMs - i * 24 * 60 * 60 * 1000);
      const dayKey = d.toISOString().slice(0, 10);
      const label = new Intl.DateTimeFormat("id-ID", {
        day: "2-digit",
        month: "short",
      }).format(d);
      const dayPvs = periodPageViews.filter((pv) => pv.timestamp.slice(0, 10) === dayKey);
      const dayVisitors = new Set(dayPvs.map((pv) => pv.visitorId));
      trendData.push({
        date: label,
        views: dayPvs.length,
        visitors: dayVisitors.size,
      });
    }
  }

  // Halaman Populer (riil dari periodPageViews)
  const pageMap = new Map<string, { views: number; visitors: Set<string>; sessions: Set<string> }>();
  for (const pv of periodPageViews) {
    const cleanPath = pv.path.split("?")[0] || "/";
    if (!pageMap.has(cleanPath)) {
      pageMap.set(cleanPath, { views: 0, visitors: new Set(), sessions: new Set() });
    }
    const entry = pageMap.get(cleanPath)!;
    entry.views += 1;
    entry.visitors.add(pv.visitorId);
    entry.sessions.add(pv.sessionId);
  }

  const popularPages = Array.from(pageMap.entries())
    .map(([p, info]) => {
      const sessArr = Array.from(info.sessions)
        .map((sid) => store.sessions[sid])
        .filter(Boolean);
      const avgSec =
        sessArr.length > 0
          ? Math.round(sessArr.reduce((acc, s) => acc + s.activeSeconds, 0) / sessArr.length)
          : 0;
      const mins = Math.floor(avgSec / 60);
      const secs = avgSec % 60;
      const bounceCount = sessArr.filter((s) => s.pageViews <= 1 && s.clicks === 0).length;
      const bouncePct = sessArr.length > 0 ? Math.round((bounceCount / sessArr.length) * 100) : 0;

      return {
        path: p,
        name: PAGE_LABELS[p] || (p.startsWith("/admin/laporan/") ? "Detail Laporan Admin" : p),
        views: info.views,
        visitors: info.visitors.size,
        avgTime: mins > 0 ? `${mins}m ${secs}d` : `${secs}d`,
        bounce: `${bouncePct}%`,
      };
    })
    .sort((a, b) => b.views - a.views);

  // Klik & CTA Riil
  const clickMap = new Map<string, { clicks: number; lastPath: string }>();
  for (const c of periodClicks) {
    const key = c.label || "Tombol Tanpa Label";
    if (!clickMap.has(key)) {
      clickMap.set(key, { clicks: 0, lastPath: c.path });
    }
    const entry = clickMap.get(key)!;
    entry.clicks += 1;
    entry.lastPath = c.path;
  }
  const maxClicks = Math.max(1, ...Array.from(clickMap.values()).map((v) => v.clicks));
  const ctaClicks = Array.from(clickMap.entries())
    .map(([label, info]) => ({
      label,
      target: info.lastPath,
      clicks: info.clicks,
      pct: Math.round((info.clicks / maxClicks) * 100),
    }))
    .sort((a, b) => b.clicks - a.clicks)
    .slice(0, 12);

  // Sumber Trafik Riil
  const refMap = new Map<string, number>();
  for (const s of periodSessions) {
    const ref = s.referrer || "Akses Langsung (Direct)";
    refMap.set(ref, (refMap.get(ref) || 0) + 1);
  }
  const totalRefSessions = Math.max(1, periodSessions.length);
  const trafficSources = Array.from(refMap.entries())
    .map(([source, sessions]) => ({
      source,
      sessions,
      pct: Math.round((sessions / totalRefSessions) * 100),
    }))
    .sort((a, b) => b.sessions - a.sessions);

  // Perangkat Riil
  const mobileCount = periodSessions.filter((s) => s.device === "Mobile").length;
  const desktopCount = periodSessions.filter((s) => s.device === "Desktop").length;
  const deviceTotal = Math.max(1, mobileCount + desktopCount);
  const deviceBreakdown = {
    mobileCount,
    desktopCount,
    mobilePct: periodSessions.length > 0 ? Math.round((mobileCount / deviceTotal) * 100) : 0,
    desktopPct: periodSessions.length > 0 ? Math.round((desktopCount / deviceTotal) * 100) : 0,
  };

  // Interaksi Fitur Peta & Cuaca Riil
  const mapViews = periodPageViews.filter((pv) => pv.path.startsWith("/peta") || pv.path.startsWith("/admin/peta")).length;
  const weatherViews = periodPageViews.filter((pv) => pv.path.startsWith("/cuaca")).length;
  const laporViews = periodPageViews.filter((pv) => pv.path.startsWith("/lapor")).length;
  const sosPageViews = periodPageViews.filter((pv) => pv.path.startsWith("/admin/sos")).length;

  // Funnel Riil
  const portalVisitors = new Set(periodPageViews.map((pv) => pv.visitorId)).size;
  const mapOrWeatherVisitors = new Set(
    periodPageViews
      .filter((pv) => pv.path.startsWith("/peta") || pv.path.startsWith("/cuaca"))
      .map((pv) => pv.visitorId)
  ).size;
  const laporVisitors = new Set(
    periodPageViews.filter((pv) => pv.path.startsWith("/lapor")).map((pv) => pv.visitorId)
  ).size;
  const laporSuccessVisitors = new Set(
    periodPageViews.filter((pv) => pv.path.startsWith("/lapor/sukses")).map((pv) => pv.visitorId)
  ).size;

  const baseFunnel = Math.max(1, portalVisitors);
  const funnelSteps = [
    {
      step: "1. Membuka Portal SigapBumi",
      users: portalVisitors,
      pct: portalVisitors > 0 ? 100 : 0,
      desc: "Pengunjung unik membuka halaman website SigapBumi",
    },
    {
      step: "2. Mengeksplorasi Peta / Cuaca",
      users: mapOrWeatherVisitors,
      pct: Math.round((mapOrWeatherVisitors / baseFunnel) * 100),
      desc: "Pengunjung membuka peta bencana atau info cuaca BMKG",
    },
    {
      step: "3. Membuka Form Lapor Warga",
      users: laporVisitors,
      pct: Math.round((laporVisitors / baseFunnel) * 100),
      desc: "Pengunjung mengakses formulir pelaporan bencana",
    },
    {
      step: "4. Berhasil Mengirim Laporan",
      users: laporSuccessVisitors,
      pct: Math.round((laporSuccessVisitors / baseFunnel) * 100),
      desc: "Pengunjung sampai pada halaman konfirmasi laporan terkirim",
    },
  ];

  // Admin Logs (terbaru di atas)
  const adminLogs = [...store.adminLogs].reverse().slice(0, 200);

  // Admin yang aktif dalam 5 menit terakhir berdasarkan adminLogs
  const activeAdminsMap = new Map<
    string,
    {
      adminName: string;
      adminEmail: string;
      unitName: string;
      lastAction: string;
      lastDetail: string;
      lastSeen: string;
      device: "Mobile" | "Desktop";
    }
  >();

  for (const log of adminLogs) {
    const logTime = new Date(log.timestamp).getTime();
    if (logTime >= fiveMinAgoMs && !activeAdminsMap.has(log.adminEmail)) {
      if (log.action !== "Keluar Sesi" && log.action !== "Auto-Logout (Idle)") {
        activeAdminsMap.set(log.adminEmail, {
          adminName: log.adminName,
          adminEmail: log.adminEmail,
          unitName: log.unitName,
          lastAction: log.action,
          lastDetail: log.detail,
          lastSeen: log.timestamp,
          device: log.device,
        });
      } else {
        // Jika aksi terakhir dalam 5 menit adalah logout, tandai agar tidak muncul sebagai online
        activeAdminsMap.set(`__loggedout__${log.adminEmail}`, {
          adminName: "",
          adminEmail: "",
          unitName: "",
          lastAction: "",
          lastDetail: "",
          lastSeen: "",
          device: "Desktop",
        });
      }
    }
  }

  const activeAdmins = Array.from(activeAdminsMap.entries())
    .filter(([k]) => !k.startsWith("__loggedout__") && !activeAdminsMap.has(`__loggedout__${k}`))
    .map(([, v]) => v);

  return {
    generatedAt: new Date().toISOString(),
    liveVisitors: liveVisitorsSet.size,
    totalSessions: periodSessions.length,
    liveSessions: liveSessionsList
      .sort((a, b) => new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime())
      .slice(0, 20),
    totalVisitors,
    totalViews,
    totalClicks,
    avgActiveSeconds,
    bounceRatePct,
    trendData,
    popularPages,
    ctaClicks,
    trafficSources,
    deviceBreakdown,
    geoBreakdown: [
      {
        region: "Indonesia (WIB / Asia-Jakarta)",
        sessions: periodSessions.length,
        pct: periodSessions.length > 0 ? 100 : 0,
      },
    ],
    featureUsage: {
      mapViews,
      weatherViews,
      laporViews,
      sosPageViews,
    },
    funnelSteps,
    adminLogs,
    activeAdmins,
  };
}

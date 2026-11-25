/**
 * SigapBumi Analytics Store
 * --------------------------
 * Persistent backend: Supabase (production / Vercel)
 * Fallback: os.tmpdir() JSON file (local development)
 *
 * Menggunakan tabel `web_analytics_events` di Supabase yang sudah disiapkan
 * di migrasi 20261125_enterprise_monitoring_audit.sql
 */

import fs from "fs";
import os from "os";
import path from "path";

// ─── Supabase admin client (server-side only) ───────────────────────────────
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SERVICE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

function supabaseHeaders() {
  return {
    apikey: SERVICE_KEY,
    Authorization: `Bearer ${SERVICE_KEY}`,
    "Content-Type": "application/json",
    Prefer: "return=minimal",
  };
}

const USE_SUPABASE = !!(SUPABASE_URL && SERVICE_KEY && SUPABASE_URL !== "https://placeholder-project.supabase.co");
const STORAGE_BUCKET = "system-analytics";
const STORAGE_OBJECT = "analytics-store.json";
let bucketEnsured = false;

async function ensureAnalyticsBucket(): Promise<void> {
  if (!USE_SUPABASE || bucketEnsured) return;
  try {
    const res = await fetch(`${SUPABASE_URL}/storage/v1/bucket/${STORAGE_BUCKET}`, {
      headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` },
    });
    if (res.ok) {
      bucketEnsured = true;
      return;
    }
    await fetch(`${SUPABASE_URL}/storage/v1/bucket`, {
      method: "POST",
      headers: {
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id: STORAGE_BUCKET, name: STORAGE_BUCKET, public: false }),
    });
    bucketEnsured = true;
  } catch {}
}

async function readStorageStore(): Promise<AnalyticsStoreData | null> {
  if (!USE_SUPABASE) return null;
  try {
    const res = await fetch(
      `${SUPABASE_URL}/storage/v1/object/${STORAGE_BUCKET}/${STORAGE_OBJECT}`,
      {
        headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` },
        cache: "no-store",
      }
    );
    if (!res.ok) return null;
    const parsed = (await res.json()) as Partial<AnalyticsStoreData>;
    return {
      sessions: parsed.sessions && typeof parsed.sessions === "object" ? parsed.sessions : {},
      pageViews: Array.isArray(parsed.pageViews) ? parsed.pageViews : [],
      clicks: Array.isArray(parsed.clicks) ? parsed.clicks : [],
      adminLogs: Array.isArray(parsed.adminLogs) ? parsed.adminLogs : [],
    };
  } catch {
    return null;
  }
}

async function writeStorageStore(data: AnalyticsStoreData): Promise<void> {
  if (!USE_SUPABASE) return;
  try {
    await ensureAnalyticsBucket();
    await fetch(
      `${SUPABASE_URL}/storage/v1/object/${STORAGE_BUCKET}/${STORAGE_OBJECT}`,
      {
        method: "POST",
        headers: {
          apikey: SERVICE_KEY,
          Authorization: `Bearer ${SERVICE_KEY}`,
          "Content-Type": "application/json",
          "x-upsert": "true",
        },
        body: JSON.stringify(data),
      }
    );
  } catch {}
}

function mergeAnalyticsStores(a: AnalyticsStoreData, b: AnalyticsStoreData): AnalyticsStoreData {
  const sessions: Record<string, AnalyticsSession> = { ...a.sessions };
  for (const [sid, s] of Object.entries(b.sessions)) {
    const prev = sessions[sid];
    if (!prev || new Date(s.lastSeen).getTime() >= new Date(prev.lastSeen).getTime()) {
      sessions[sid] = prev
        ? {
            ...s,
            activeSeconds: Math.max(prev.activeSeconds || 0, s.activeSeconds || 0),
            pageViews: Math.max(prev.pageViews || 0, s.pageViews || 0),
            clicks: Math.max(prev.clicks || 0, s.clicks || 0),
          }
        : s;
    }
  }
  const pvMap = new Map<string, AnalyticsPageView>();
  [...a.pageViews, ...b.pageViews].forEach((pv) => pvMap.set(pv.id, pv));
  const clkMap = new Map<string, AnalyticsClick>();
  [...a.clicks, ...b.clicks].forEach((c) => clkMap.set(c.id, c));
  const admMap = new Map<string, AdminActivityLog>();
  [...a.adminLogs, ...b.adminLogs].forEach((l) => admMap.set(l.id, l));
  return {
    sessions,
    pageViews: Array.from(pvMap.values()).slice(-MAX_PAGEVIEWS),
    clicks: Array.from(clkMap.values()).slice(-MAX_CLICKS),
    adminLogs: Array.from(admMap.values()).slice(-MAX_ADMIN_LOGS),
  };
}

// ─── TypeScript interfaces ───────────────────────────────────────────────────

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

// ─── Local (tmpdir) fallback ─────────────────────────────────────────────────

const STORE_PATH = path.join(os.tmpdir(), "sigapbumi-analytics.json");
const MAX_PAGEVIEWS = 5000;
const MAX_CLICKS = 5000;
const MAX_ADMIN_LOGS = 1000;
const MAX_SESSIONS = 2000;

function getDefaultStore(): AnalyticsStoreData {
  return { sessions: {}, pageViews: [], clicks: [], adminLogs: [] };
}

export function readAnalyticsStore(): AnalyticsStoreData {
  try {
    if (!fs.existsSync(STORE_PATH)) return getDefaultStore();
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
    if (data.pageViews.length > MAX_PAGEVIEWS) data.pageViews = data.pageViews.slice(-MAX_PAGEVIEWS);
    if (data.clicks.length > MAX_CLICKS) data.clicks = data.clicks.slice(-MAX_CLICKS);
    if (data.adminLogs.length > MAX_ADMIN_LOGS) data.adminLogs = data.adminLogs.slice(-MAX_ADMIN_LOGS);
    const sessionKeys = Object.keys(data.sessions);
    if (sessionKeys.length > MAX_SESSIONS) {
      const sorted = sessionKeys.sort(
        (a, b) => new Date(data.sessions[b].lastSeen).getTime() - new Date(data.sessions[a].lastSeen).getTime()
      );
      const nextSessions: Record<string, AnalyticsSession> = {};
      for (const k of sorted.slice(0, MAX_SESSIONS)) nextSessions[k] = data.sessions[k];
      data.sessions = nextSessions;
    }
    fs.writeFileSync(STORE_PATH, JSON.stringify(data), "utf-8");
  } catch {
    // Ignore write failure on read-only environments
  }
}

// ─── Supabase insert helpers ─────────────────────────────────────────────────

async function sbInsert(table: string, record: Record<string, unknown>) {
  if (!USE_SUPABASE) return;
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
      method: "POST",
      headers: supabaseHeaders(),
      body: JSON.stringify(record),
    });
  } catch {
    // ignore network errors
  }
}

async function sbUpsert(table: string, record: Record<string, unknown>, onConflict: string) {
  if (!USE_SUPABASE) return;
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/${table}?on_conflict=${onConflict}`, {
      method: "POST",
      headers: { ...supabaseHeaders(), Prefer: "resolution=merge-duplicates,return=minimal" },
      body: JSON.stringify(record),
    });
  } catch {
    // ignore
  }
}

// ─── Public record functions ─────────────────────────────────────────────────

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

  // Persist ke Supabase (non-blocking)
  void sbInsert("web_analytics_events", {
    event_type: "pageview",
    session_id: params.sessionId,
    visitor_id: params.visitorId,
    path: params.path,
    device: params.device,
    referrer: params.referrer || "Akses Langsung (Direct)",
    created_at: now,
  });

  void sbUpsert(
    "admin_user_sessions",
    {
      session_id: `pub_${params.sessionId}`,
      user_id: params.visitorId,
      user_name: "Pengunjung Publik",
      user_email: `visitor_${params.visitorId}@public`,
      role: "visitor",
      unit: "public",
      unit_name: "Publik",
      current_path: params.path,
      status: "online",
      last_active_at: now,
      login_at: now,
    },
    "session_id"
  );
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

  void sbInsert("web_analytics_events", {
    event_type: "heartbeat",
    session_id: params.sessionId,
    visitor_id: params.visitorId,
    path: params.path,
    device: params.device,
    created_at: now,
  });

  void sbUpsert(
    "admin_user_sessions",
    {
      session_id: `pub_${params.sessionId}`,
      user_id: params.visitorId,
      user_name: "Pengunjung Publik",
      user_email: `visitor_${params.visitorId}@public`,
      role: "visitor",
      unit: "public",
      unit_name: "Publik",
      current_path: params.path,
      status: "online",
      last_active_at: now,
      login_at: now,
    },
    "session_id"
  );
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

  void sbInsert("web_analytics_events", {
    event_type: "click",
    session_id: params.sessionId,
    visitor_id: params.visitorId,
    path: params.path,
    label: params.label.slice(0, 80),
    device: params.device,
    created_at: now,
  });
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

  // Hindari duplikasi log "Akses Halaman" berturut-turut dalam 5 detik
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

  void sbInsert("web_analytics_events", {
    event_type: "admin_log",
    session_id: `admin_${params.adminEmail}`,
    visitor_id: params.adminEmail,
    path: params.detail,
    label: `${params.action}: ${params.detail}`.slice(0, 200),
    device: params.device,
    created_at: now,
  });
}

// ─── PAGE_LABELS mapping ─────────────────────────────────────────────────────

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

// ─── Supabase-based summary (production) ─────────────────────────────────────

async function getAnalyticsSummaryFromSupabase(period: "1d" | "7d" | "30d") {
  const nowMs = Date.now();
  let cutoffMs = nowMs - 7 * 24 * 60 * 60 * 1000;
  if (period === "1d") {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    cutoffMs = startOfToday.getTime();
  } else if (period === "30d") {
    cutoffMs = nowMs - 30 * 24 * 60 * 60 * 1000;
  }

  const cutoffIso = new Date(cutoffMs).toISOString();
  const fiveMinAgoIso = new Date(nowMs - 5 * 60 * 1000).toISOString();

  // Fetch events from Supabase - hanya yang bukan admin
  const eventsUrl = `${SUPABASE_URL}/rest/v1/web_analytics_events?created_at=gte.${cutoffIso}&path=not.like./admin%25&select=event_type,session_id,visitor_id,path,label,device,referrer,created_at&order=created_at.asc&limit=10000`;
  const liveUrl = `${SUPABASE_URL}/rest/v1/web_analytics_events?created_at=gte.${fiveMinAgoIso}&path=not.like./admin%25&event_type=in.(pageview,heartbeat)&select=session_id,visitor_id,path,device,created_at&order=created_at.desc&limit=500`;

  const headers = { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` };

  const [eventsRes, liveRes] = await Promise.all([
    fetch(eventsUrl, { headers }).then((r) => r.json()).catch(() => []),
    fetch(liveUrl, { headers }).then((r) => r.json()).catch(() => []),
  ]);

  const events: {
    event_type: string;
    session_id: string;
    visitor_id: string;
    path: string;
    label?: string;
    device?: string;
    referrer?: string;
    created_at: string;
  }[] = Array.isArray(eventsRes) ? eventsRes : [];

  const liveEvents: { session_id: string; visitor_id: string; path: string; device?: string; created_at: string }[] =
    Array.isArray(liveRes) ? liveRes : [];

  // Live visitors (dalam 5 menit terakhir)
  const liveVisitorSet = new Set(liveEvents.map((e) => e.visitor_id));
  const liveSessionSet = new Set(liveEvents.map((e) => e.session_id));

  // Live sessions detail
  const liveSessionsMap = new Map<
    string,
    { sessionId: string; visitorId: string; lastSeen: string; device: string; lastPath: string; pageViews: number; clicks: number }
  >();
  for (const e of liveEvents) {
    if (!liveSessionsMap.has(e.session_id)) {
      liveSessionsMap.set(e.session_id, {
        sessionId: e.session_id,
        visitorId: e.visitor_id,
        lastSeen: e.created_at,
        device: (e.device as "Mobile" | "Desktop") || "Desktop",
        lastPath: e.path,
        pageViews: 0,
        clicks: 0,
      });
    }
  }

  // Pageviews
  const pageViews = events.filter((e) => e.event_type === "pageview");
  const clicks = events.filter((e) => e.event_type === "click");

  // Unique visitors & sessions in period
  const uniqueVisitorSet = new Set(pageViews.map((e) => e.visitor_id));
  const sessionSet = new Set(pageViews.map((e) => e.session_id));

  // Trend data
  const days = period === "1d" ? 1 : period === "7d" ? 7 : 30;
  const trendData: { date: string; views: number; visitors: number }[] = [];

  if (period === "1d") {
    const buckets = [0, 4, 8, 12, 16, 20];
    for (const h of buckets) {
      const label = `${String(h).padStart(2, "0")}:00`;
      const bucketPvs = pageViews.filter((pv) => {
        const hr = new Date(pv.created_at).getHours();
        return hr >= h && hr < h + 4;
      });
      trendData.push({ date: label, views: bucketPvs.length, visitors: new Set(bucketPvs.map((p) => p.visitor_id)).size });
    }
  } else {
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(nowMs - i * 24 * 60 * 60 * 1000);
      const dayKey = d.toISOString().slice(0, 10);
      const label = new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short" }).format(d);
      const dayPvs = pageViews.filter((pv) => pv.created_at.slice(0, 10) === dayKey);
      trendData.push({ date: label, views: dayPvs.length, visitors: new Set(dayPvs.map((p) => p.visitor_id)).size });
    }
  }

  // Popular pages
  const pageMap = new Map<string, { views: number; visitors: Set<string>; sessions: Set<string> }>();
  for (const pv of pageViews) {
    const cleanPath = pv.path.split("?")[0] || "/";
    if (!pageMap.has(cleanPath)) pageMap.set(cleanPath, { views: 0, visitors: new Set(), sessions: new Set() });
    const entry = pageMap.get(cleanPath)!;
    entry.views += 1;
    entry.visitors.add(pv.visitor_id);
    entry.sessions.add(pv.session_id);
  }

  const popularPages = Array.from(pageMap.entries())
    .map(([p, info]) => ({
      path: p,
      name: PAGE_LABELS[p] || (p.startsWith("/admin/laporan/") ? "Detail Laporan Admin" : p),
      views: info.views,
      visitors: info.visitors.size,
      avgTime: "—",
      bounce: "—",
    }))
    .sort((a, b) => b.views - a.views);

  // CTA Clicks
  const clickMap = new Map<string, { clicks: number; lastPath: string }>();
  for (const c of clicks) {
    const key = c.label || "Tombol Tanpa Label";
    if (!clickMap.has(key)) clickMap.set(key, { clicks: 0, lastPath: c.path });
    clickMap.get(key)!.clicks += 1;
    clickMap.get(key)!.lastPath = c.path;
  }
  const maxClicks = Math.max(1, ...Array.from(clickMap.values()).map((v) => v.clicks));
  const ctaClicks = Array.from(clickMap.entries())
    .map(([label, info]) => ({ label, target: info.lastPath, clicks: info.clicks, pct: Math.round((info.clicks / maxClicks) * 100) }))
    .sort((a, b) => b.clicks - a.clicks)
    .slice(0, 12);

  // Traffic sources
  const refMap = new Map<string, number>();
  for (const pv of pageViews) {
    const ref = pv.referrer || "Akses Langsung (Direct)";
    refMap.set(ref, (refMap.get(ref) || 0) + 1);
  }
  const totalRefSessions = Math.max(1, sessionSet.size);
  const trafficSources = Array.from(refMap.entries())
    .map(([source, sessions]) => ({ source, sessions, pct: Math.round((sessions / totalRefSessions) * 100) }))
    .sort((a, b) => b.sessions - a.sessions);

  // Device breakdown
  const mobileCount = pageViews.filter((e) => e.device === "Mobile").length;
  const desktopCount = pageViews.filter((e) => e.device === "Desktop").length;
  const deviceTotal = Math.max(1, mobileCount + desktopCount);

  // Feature usage
  const mapViews = pageViews.filter((pv) => pv.path.startsWith("/peta")).length;
  const weatherViews = pageViews.filter((pv) => pv.path.startsWith("/cuaca")).length;
  const laporViews = pageViews.filter((pv) => pv.path.startsWith("/lapor")).length;
  const sosPageViews = pageViews.filter((pv) => pv.path.startsWith("/admin/sos")).length;

  // Funnel
  const portalVisitors = uniqueVisitorSet.size;
  const mapOrWeatherVisitors = new Set(
    pageViews.filter((pv) => pv.path.startsWith("/peta") || pv.path.startsWith("/cuaca")).map((pv) => pv.visitor_id)
  ).size;
  const laporVisitors = new Set(pageViews.filter((pv) => pv.path.startsWith("/lapor")).map((pv) => pv.visitor_id)).size;
  const laporSuccessVisitors = new Set(pageViews.filter((pv) => pv.path.startsWith("/lapor/sukses")).map((pv) => pv.visitor_id)).size;
  const baseFunnel = Math.max(1, portalVisitors);

  // Admin logs (dari local store saja karena ini hanya utk dev tracking)
  const localStore = readAnalyticsStore();
  const adminLogs = [...localStore.adminLogs].reverse().slice(0, 200);
  const fiveMinAgoMs = nowMs - 5 * 60 * 1000;
  const activeAdminsMap = new Map<string, { adminName: string; adminEmail: string; unitName: string; lastAction: string; lastDetail: string; lastSeen: string; device: "Mobile" | "Desktop" }>();
  for (const log of adminLogs) {
    const logTime = new Date(log.timestamp).getTime();
    if (logTime >= fiveMinAgoMs && !activeAdminsMap.has(log.adminEmail)) {
      if (log.action !== "Keluar Sesi" && log.action !== "Auto-Logout (Idle)") {
        activeAdminsMap.set(log.adminEmail, { adminName: log.adminName, adminEmail: log.adminEmail, unitName: log.unitName, lastAction: log.action, lastDetail: log.detail, lastSeen: log.timestamp, device: log.device });
      }
    }
  }
  const activeAdmins = Array.from(activeAdminsMap.values());

  // Bounce rate estimate (sesi dengan hanya 1 pageview)
  const sessionPageViewCount = new Map<string, number>();
  for (const pv of pageViews) {
    sessionPageViewCount.set(pv.session_id, (sessionPageViewCount.get(pv.session_id) || 0) + 1);
  }
  const bouncedSessions = Array.from(sessionPageViewCount.values()).filter((n) => n <= 1).length;
  const bounceRatePct = sessionSet.size > 0 ? Math.round((bouncedSessions / sessionSet.size) * 100) : 0;

  return {
    generatedAt: new Date().toISOString(),
    liveVisitors: liveVisitorSet.size,
    totalSessions: sessionSet.size,
    liveSessions: Array.from(liveSessionsMap.values()).slice(0, 20),
    totalVisitors: uniqueVisitorSet.size,
    totalViews: pageViews.length,
    totalClicks: clicks.length,
    avgActiveSeconds: 0,
    bounceRatePct,
    trendData,
    popularPages,
    ctaClicks,
    trafficSources,
    deviceBreakdown: {
      mobileCount,
      desktopCount,
      mobilePct: pageViews.length > 0 ? Math.round((mobileCount / deviceTotal) * 100) : 0,
      desktopPct: pageViews.length > 0 ? Math.round((desktopCount / deviceTotal) * 100) : 0,
    },
    geoBreakdown: [{ region: "Indonesia (WIB / Asia-Jakarta)", sessions: sessionSet.size, pct: sessionSet.size > 0 ? 100 : 0 }],
    featureUsage: { mapViews, weatherViews, laporViews, sosPageViews },
    funnelSteps: [
      { step: "1. Membuka Portal SigapBumi", users: portalVisitors, pct: portalVisitors > 0 ? 100 : 0, desc: "Pengunjung unik membuka halaman website SigapBumi" },
      { step: "2. Mengeksplorasi Peta / Cuaca", users: mapOrWeatherVisitors, pct: Math.round((mapOrWeatherVisitors / baseFunnel) * 100), desc: "Pengunjung membuka peta bencana atau info cuaca BMKG" },
      { step: "3. Membuka Form Lapor Warga", users: laporVisitors, pct: Math.round((laporVisitors / baseFunnel) * 100), desc: "Pengunjung mengakses formulir pelaporan bencana" },
      { step: "4. Berhasil Mengirim Laporan", users: laporSuccessVisitors, pct: Math.round((laporSuccessVisitors / baseFunnel) * 100), desc: "Pengunjung sampai pada halaman konfirmasi laporan terkirim" },
    ],
    adminLogs,
    activeAdmins,
  };
}

// ─── Main exported summary function ─────────────────────────────────────────

export async function recordPageViewAsync(params: {
  sessionId: string;
  visitorId: string;
  path: string;
  device: "Mobile" | "Desktop";
  referrer?: string;
}) {
  const remote = await readStorageStore();
  if (remote) {
    const merged = mergeAnalyticsStores(remote, readAnalyticsStore());
    writeAnalyticsStore(merged);
  }
  recordPageView({
    ...params,
    referrer: params.referrer || "Akses Langsung (Direct)",
  });
  await writeStorageStore(readAnalyticsStore());
}

export async function recordHeartbeatAsync(params: {
  sessionId: string;
  visitorId: string;
  path: string;
  device: "Mobile" | "Desktop";
  secondsDelta?: number;
}) {
  const remote = await readStorageStore();
  if (remote) {
    const merged = mergeAnalyticsStores(remote, readAnalyticsStore());
    writeAnalyticsStore(merged);
  }
  recordHeartbeat(params);
  await writeStorageStore(readAnalyticsStore());
}

export async function recordClickAsync(params: {
  sessionId: string;
  visitorId: string;
  label: string;
  path: string;
  device: "Mobile" | "Desktop";
}) {
  const remote = await readStorageStore();
  if (remote) {
    const merged = mergeAnalyticsStores(remote, readAnalyticsStore());
    writeAnalyticsStore(merged);
  }
  recordClick(params);
  await writeStorageStore(readAnalyticsStore());
}

export async function recordAdminLogAsync(params: {
  adminName: string;
  adminEmail: string;
  unit: string;
  unitName: string;
  action: string;
  detail: string;
  device: "Mobile" | "Desktop";
}) {
  const remote = await readStorageStore();
  if (remote) {
    const merged = mergeAnalyticsStores(remote, readAnalyticsStore());
    writeAnalyticsStore(merged);
  }
  recordAdminLog(params);
  await writeStorageStore(readAnalyticsStore());
}

export async function getAnalyticsSummaryAsync(period: "1d" | "7d" | "30d") {
  if (USE_SUPABASE) {
    try {
      const sbSummary = await getAnalyticsSummaryFromSupabase(period);
      if (sbSummary && (sbSummary.totalViews > 0 || sbSummary.liveVisitors > 0 || sbSummary.totalClicks > 0)) {
        return sbSummary;
      }
    } catch {}
    const remote = await readStorageStore();
    if (remote) {
      const merged = mergeAnalyticsStores(remote, readAnalyticsStore());
      return getAnalyticsSummary(period, merged);
    }
  }
  return getAnalyticsSummary(period);
}

export function getAnalyticsSummary(period: "1d" | "7d" | "30d", overrideStore?: AnalyticsStoreData) {
  const store = overrideStore || readAnalyticsStore();
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

  const allSessions = Object.values(store.sessions).filter((s) => !s.lastPath.startsWith("/admin"));
  const liveSessionsList = allSessions.filter((s) => new Date(s.lastSeen).getTime() >= fiveMinAgoMs);
  const liveVisitorsSet = new Set(liveSessionsList.map((s) => s.visitorId));

  const periodSessions = allSessions.filter((s) => new Date(s.lastSeen).getTime() >= cutoffMs);
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

  const totalActiveSec = periodSessions.reduce((acc, s) => acc + (s.activeSeconds || 0), 0);
  const avgActiveSeconds = periodSessions.length > 0 ? Math.round(totalActiveSec / periodSessions.length) : 0;

  const bouncedSessions = periodSessions.filter((s) => s.pageViews <= 1 && s.clicks === 0).length;
  const bounceRatePct = periodSessions.length > 0 ? Math.round((bouncedSessions / periodSessions.length) * 100) : 0;

  // Trend
  const trendData: { date: string; views: number; visitors: number }[] = [];
  if (period === "1d") {
    const buckets = [0, 4, 8, 12, 16, 20];
    for (const h of buckets) {
      const label = `${String(h).padStart(2, "0")}:00`;
      const bucketPvs = periodPageViews.filter((pv) => { const hr = new Date(pv.timestamp).getHours(); return hr >= h && hr < h + 4; });
      trendData.push({ date: label, views: bucketPvs.length, visitors: new Set(bucketPvs.map((pv) => pv.visitorId)).size });
    }
  } else {
    const days = period === "30d" ? 30 : 7;
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(nowMs - i * 24 * 60 * 60 * 1000);
      const dayKey = d.toISOString().slice(0, 10);
      const label = new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short" }).format(d);
      const dayPvs = periodPageViews.filter((pv) => pv.timestamp.slice(0, 10) === dayKey);
      trendData.push({ date: label, views: dayPvs.length, visitors: new Set(dayPvs.map((pv) => pv.visitorId)).size });
    }
  }

  // Popular pages
  const pageMap = new Map<string, { views: number; visitors: Set<string>; sessions: Set<string> }>();
  for (const pv of periodPageViews) {
    const cleanPath = pv.path.split("?")[0] || "/";
    if (!pageMap.has(cleanPath)) pageMap.set(cleanPath, { views: 0, visitors: new Set(), sessions: new Set() });
    const entry = pageMap.get(cleanPath)!;
    entry.views += 1;
    entry.visitors.add(pv.visitorId);
    entry.sessions.add(pv.sessionId);
  }

  const popularPages = Array.from(pageMap.entries())
    .map(([p, info]) => {
      const sessArr = Array.from(info.sessions).map((sid) => store.sessions[sid]).filter(Boolean);
      const avgSec = sessArr.length > 0 ? Math.round(sessArr.reduce((acc, s) => acc + s.activeSeconds, 0) / sessArr.length) : 0;
      const mins = Math.floor(avgSec / 60);
      const secs = avgSec % 60;
      const bounceCount = sessArr.filter((s) => s.pageViews <= 1 && s.clicks === 0).length;
      const bouncePct = sessArr.length > 0 ? Math.round((bounceCount / sessArr.length) * 100) : 0;
      return { path: p, name: PAGE_LABELS[p] || (p.startsWith("/admin/laporan/") ? "Detail Laporan Admin" : p), views: info.views, visitors: info.visitors.size, avgTime: mins > 0 ? `${mins}m ${secs}d` : `${secs}d`, bounce: `${bouncePct}%` };
    })
    .sort((a, b) => b.views - a.views);

  // CTA Clicks
  const clickMap = new Map<string, { clicks: number; lastPath: string }>();
  for (const c of periodClicks) {
    const key = c.label || "Tombol Tanpa Label";
    if (!clickMap.has(key)) clickMap.set(key, { clicks: 0, lastPath: c.path });
    clickMap.get(key)!.clicks += 1;
    clickMap.get(key)!.lastPath = c.path;
  }
  const maxClicks = Math.max(1, ...Array.from(clickMap.values()).map((v) => v.clicks));
  const ctaClicks = Array.from(clickMap.entries())
    .map(([label, info]) => ({ label, target: info.lastPath, clicks: info.clicks, pct: Math.round((info.clicks / maxClicks) * 100) }))
    .sort((a, b) => b.clicks - a.clicks)
    .slice(0, 12);

  // Traffic sources
  const refMap = new Map<string, number>();
  for (const s of periodSessions) {
    const ref = s.referrer || "Akses Langsung (Direct)";
    refMap.set(ref, (refMap.get(ref) || 0) + 1);
  }
  const totalRefSessions = Math.max(1, periodSessions.length);
  const trafficSources = Array.from(refMap.entries())
    .map(([source, sessions]) => ({ source, sessions, pct: Math.round((sessions / totalRefSessions) * 100) }))
    .sort((a, b) => b.sessions - a.sessions);

  // Devices
  const mobileCount = periodSessions.filter((s) => s.device === "Mobile").length;
  const desktopCount = periodSessions.filter((s) => s.device === "Desktop").length;
  const deviceTotal = Math.max(1, mobileCount + desktopCount);

  // Feature usage
  const mapViews = periodPageViews.filter((pv) => pv.path.startsWith("/peta") || pv.path.startsWith("/admin/peta")).length;
  const weatherViews = periodPageViews.filter((pv) => pv.path.startsWith("/cuaca")).length;
  const laporViews = periodPageViews.filter((pv) => pv.path.startsWith("/lapor")).length;
  const sosPageViews = periodPageViews.filter((pv) => pv.path.startsWith("/admin/sos")).length;

  // Funnel
  const portalVisitors = new Set(periodPageViews.map((pv) => pv.visitorId)).size;
  const mapOrWeatherVisitors = new Set(periodPageViews.filter((pv) => pv.path.startsWith("/peta") || pv.path.startsWith("/cuaca")).map((pv) => pv.visitorId)).size;
  const laporVisitors = new Set(periodPageViews.filter((pv) => pv.path.startsWith("/lapor")).map((pv) => pv.visitorId)).size;
  const laporSuccessVisitors = new Set(periodPageViews.filter((pv) => pv.path.startsWith("/lapor/sukses")).map((pv) => pv.visitorId)).size;
  const baseFunnel = Math.max(1, portalVisitors);

  // Admin logs
  const adminLogs = [...store.adminLogs].reverse().slice(0, 200);
  const activeAdminsMap = new Map<string, { adminName: string; adminEmail: string; unitName: string; lastAction: string; lastDetail: string; lastSeen: string; device: "Mobile" | "Desktop" }>();
  for (const log of adminLogs) {
    const logTime = new Date(log.timestamp).getTime();
    if (logTime >= fiveMinAgoMs && !activeAdminsMap.has(log.adminEmail)) {
      if (log.action !== "Keluar Sesi" && log.action !== "Auto-Logout (Idle)") {
        activeAdminsMap.set(log.adminEmail, { adminName: log.adminName, adminEmail: log.adminEmail, unitName: log.unitName, lastAction: log.action, lastDetail: log.detail, lastSeen: log.timestamp, device: log.device });
      } else {
        activeAdminsMap.set(`__loggedout__${log.adminEmail}`, { adminName: "", adminEmail: "", unitName: "", lastAction: "", lastDetail: "", lastSeen: "", device: "Desktop" });
      }
    }
  }
  const activeAdmins = Array.from(activeAdminsMap.entries()).filter(([k]) => !k.startsWith("__loggedout__") && !activeAdminsMap.has(`__loggedout__${k}`)).map(([, v]) => v);

  return {
    generatedAt: new Date().toISOString(),
    liveVisitors: liveVisitorsSet.size,
    totalSessions: periodSessions.length,
    liveSessions: liveSessionsList.sort((a, b) => new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime()).slice(0, 20),
    totalVisitors,
    totalViews,
    totalClicks,
    avgActiveSeconds,
    bounceRatePct,
    trendData,
    popularPages,
    ctaClicks,
    trafficSources,
    deviceBreakdown: { mobileCount, desktopCount, mobilePct: periodSessions.length > 0 ? Math.round((mobileCount / deviceTotal) * 100) : 0, desktopPct: periodSessions.length > 0 ? Math.round((desktopCount / deviceTotal) * 100) : 0 },
    geoBreakdown: [{ region: "Indonesia (WIB / Asia-Jakarta)", sessions: periodSessions.length, pct: periodSessions.length > 0 ? 100 : 0 }],
    featureUsage: { mapViews, weatherViews, laporViews, sosPageViews },
    funnelSteps: [
      { step: "1. Membuka Portal SigapBumi", users: portalVisitors, pct: portalVisitors > 0 ? 100 : 0, desc: "Pengunjung unik membuka halaman website SigapBumi" },
      { step: "2. Mengeksplorasi Peta / Cuaca", users: mapOrWeatherVisitors, pct: Math.round((mapOrWeatherVisitors / baseFunnel) * 100), desc: "Pengunjung membuka peta bencana atau info cuaca BMKG" },
      { step: "3. Membuka Form Lapor Warga", users: laporVisitors, pct: Math.round((laporVisitors / baseFunnel) * 100), desc: "Pengunjung mengakses formulir pelaporan bencana" },
      { step: "4. Berhasil Mengirim Laporan", users: laporSuccessVisitors, pct: Math.round((laporSuccessVisitors / baseFunnel) * 100), desc: "Pengunjung sampai pada halaman konfirmasi laporan terkirim" },
    ],
    adminLogs,
    activeAdmins,
  };
}

/**
 * SigapBumi Enterprise Store (Monitoring, Audit Trail)
 * -----------------------------------------------------
 * Persistent backend: Supabase (production / Vercel)
 *   - Tabel: admin_user_sessions  → monitoring sesi aktif
 *   - Tabel: audit_logs (existing) → immutable audit trail  
 *   - Tabel: security_events      → security center
 * Fallback: os.tmpdir() JSON file (local development)
 */

import fs from "fs";
import os from "os";
import path from "path";
import type { SystemRole } from "@/lib/rbac";

// ─── Supabase admin client ───────────────────────────────────────────────────
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SERVICE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

function sbHeaders() {
  return {
    apikey: SERVICE_KEY,
    Authorization: `Bearer ${SERVICE_KEY}`,
    "Content-Type": "application/json",
    Prefer: "return=minimal",
  };
}

const USE_SUPABASE = !!(
  SUPABASE_URL &&
  SERVICE_KEY &&
  SUPABASE_URL !== "https://placeholder-project.supabase.co"
);

async function sbPost(table: string, body: Record<string, unknown>, onConflict?: string) {
  if (!USE_SUPABASE) return;
  try {
    const url = onConflict
      ? `${SUPABASE_URL}/rest/v1/${table}?on_conflict=${onConflict}`
      : `${SUPABASE_URL}/rest/v1/${table}`;
    const prefer = onConflict
      ? "resolution=merge-duplicates,return=minimal"
      : "return=minimal";
    await fetch(url, {
      method: "POST",
      headers: { ...sbHeaders(), Prefer: prefer },
      body: JSON.stringify(body),
    });
  } catch {
    // ignore
  }
}

async function sbPatch(table: string, filter: string, body: Record<string, unknown>) {
  if (!USE_SUPABASE) return;
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/${table}?${filter}`, {
      method: "PATCH",
      headers: sbHeaders(),
      body: JSON.stringify(body),
    });
  } catch {
    // ignore
  }
}

// ─── TypeScript interfaces ───────────────────────────────────────────────────

export type AuditActionType =
  | "LOGIN"
  | "LOGOUT"
  | "LOGIN_FAILED"
  | "CREATE"
  | "UPDATE"
  | "DELETE"
  | "CHANGE_STATUS"
  | "CHANGE_ROLE"
  | "EXPORT_DATA"
  | "ACCESS_DENIED";

export interface AuditLogEntry {
  id: string;
  userId: string;
  userName: string;
  role: SystemRole | string;
  unit: string;
  unitName: string;
  action: AuditActionType;
  module: string;
  recordId: string;
  timestamp: string;
  ipAddress: string;
  deviceMeta: string;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
  archived?: boolean;
}

export interface ManagedUserAccount {
  userId: string;
  name: string;
  email: string;
  unit: string;
  unitName: string;
  role: SystemRole;
  isActive: boolean;
  createdAt: string;
  lastLoginAt?: string;
  lastActivityAt?: string;
}

export interface UserSessionRecord {
  sessionId: string;
  userId: string;
  userName: string;
  userEmail: string;
  role: SystemRole | string;
  unit: string;
  unitName: string;
  ipAddress: string;
  deviceMeta: string;
  currentPath: string;
  loginAt: string;
  lastHeartbeatAt: string;
  logoutAt?: string;
  isActive: boolean;
}

interface EnterpriseStoreData {
  users: Record<string, ManagedUserAccount>;
  sessions: Record<string, UserSessionRecord>;
  auditLogs: AuditLogEntry[];
}

// ─── Local (tmpdir) fallback ─────────────────────────────────────────────────

const ENTERPRISE_STORE_PATH = path.join(os.tmpdir(), "sigapbumi-enterprise.json");
const MAX_AUDIT_LOGS = 5000;
const MAX_SESSIONS = 1000;

function getSeededUsers(): Record<string, ManagedUserAccount> {
  const now = new Date().toISOString();
  const base: ManagedUserAccount[] = [
    { userId: "198501012010011001", name: "Drs. Tri Wahyudi (Koordinator Operasi)", email: "pemerintahan@sigapbumi.go.id", unit: "pemerintahan", unitName: "Pemerintahan", role: "Super Admin", isActive: true, createdAt: now },
    { userId: "198803152012121002", name: "Kapten Hendra Gunawan", email: "bnpb_bpbd@sigapbumi.go.id", unit: "bnpb_bpbd", unitName: "BNPB", role: "Koordinator Wilayah", isActive: true, createdAt: now },
    { userId: "199007202014031003", name: "Komandan Raka Pratama", email: "damkar@sigapbumi.go.id", unit: "damkar", unitName: "Dinas Damkar", role: "Operator Posko", isActive: true, createdAt: now },
    { userId: "199211052016042004", name: "dr. Nadia Kusuma", email: "medis@sigapbumi.go.id", unit: "medis", unitName: "Medis / Dinkes", role: "Operator Posko", isActive: true, createdAt: now },
    { userId: "198904182013081005", name: "AKBP Bima Santoso", email: "polisi@sigapbumi.go.id", unit: "polisi", unitName: "Polri", role: "Operator Posko", isActive: true, createdAt: now },
  ];
  const map: Record<string, ManagedUserAccount> = {};
  for (const u of base) map[u.email.toLowerCase()] = u;
  return map;
}

export function readEnterpriseStore(): EnterpriseStoreData {
  try {
    if (!fs.existsSync(ENTERPRISE_STORE_PATH)) {
      const initial: EnterpriseStoreData = { users: getSeededUsers(), sessions: {}, auditLogs: [] };
      fs.writeFileSync(ENTERPRISE_STORE_PATH, JSON.stringify(initial), "utf-8");
      return initial;
    }
    const raw = fs.readFileSync(ENTERPRISE_STORE_PATH, "utf-8");
    const parsed = JSON.parse(raw) as Partial<EnterpriseStoreData>;
    const users =
      parsed.users && typeof parsed.users === "object" && Object.keys(parsed.users).length > 0
        ? parsed.users
        : getSeededUsers();
    return {
      users,
      sessions: parsed.sessions && typeof parsed.sessions === "object" ? parsed.sessions : {},
      auditLogs: Array.isArray(parsed.auditLogs) ? parsed.auditLogs : [],
    };
  } catch {
    return { users: getSeededUsers(), sessions: {}, auditLogs: [] };
  }
}

export function writeEnterpriseStore(data: EnterpriseStoreData): void {
  try {
    if (data.auditLogs.length > MAX_AUDIT_LOGS) data.auditLogs = data.auditLogs.slice(-MAX_AUDIT_LOGS);
    const sKeys = Object.keys(data.sessions);
    if (sKeys.length > MAX_SESSIONS) {
      const sorted = sKeys.sort(
        (a, b) => new Date(data.sessions[b].lastHeartbeatAt).getTime() - new Date(data.sessions[a].lastHeartbeatAt).getTime()
      );
      const next: Record<string, UserSessionRecord> = {};
      for (const k of sorted.slice(0, MAX_SESSIONS)) next[k] = data.sessions[k];
      data.sessions = next;
    }
    fs.writeFileSync(ENTERPRISE_STORE_PATH, JSON.stringify(data), "utf-8");
  } catch {
    // ignore
  }
}

// ─── Audit Log ───────────────────────────────────────────────────────────────

export function appendAuditLog(entry: Omit<AuditLogEntry, "id" | "timestamp" | "archived">): AuditLogEntry {
  const store = readEnterpriseStore();
  const record: AuditLogEntry = {
    ...entry,
    id: `aud-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    timestamp: new Date().toISOString(),
    archived: false,
  };
  store.auditLogs.push(record);
  writeEnterpriseStore(store);

  // Persist ke Supabase (sesuai skema public.audit_logs: actor_name, action, entity, meta, created_at)
  void sbPost("audit_logs", {
    actor_name: entry.userName,
    action: entry.action,
    entity: entry.module,
    meta: {
      userId: entry.userId,
      role: entry.role,
      unit: entry.unit,
      unitName: entry.unitName,
      recordId: entry.recordId,
      ipAddress: entry.ipAddress,
      deviceMeta: entry.deviceMeta,
      before: entry.before || null,
      after: entry.after || null,
    },
    created_at: record.timestamp,
  });

  return record;
}

// ─── User Heartbeat / Session ─────────────────────────────────────────────────

export function upsertUserHeartbeat(params: {
  sessionId: string;
  userId: string;
  userName: string;
  userEmail: string;
  role: SystemRole | string;
  unit: string;
  unitName: string;
  ipAddress: string;
  deviceMeta: string;
  currentPath: string;
}): void {
  const store = readEnterpriseStore();
  const now = new Date().toISOString();
  const emailKey = params.userEmail.toLowerCase();

  if (!store.users[emailKey]) {
    store.users[emailKey] = {
      userId: params.userId,
      name: params.userName,
      email: params.userEmail,
      unit: params.unit,
      unitName: params.unitName,
      role: (params.role as SystemRole) || "Operator Posko",
      isActive: true,
      createdAt: now,
      lastLoginAt: now,
      lastActivityAt: now,
    };
  } else {
    store.users[emailKey].lastActivityAt = now;
  }

  const existing = store.sessions[params.sessionId];
  if (existing) {
    existing.lastHeartbeatAt = now;
    existing.currentPath = params.currentPath;
    existing.isActive = true;
    existing.ipAddress = params.ipAddress;
  } else {
    store.sessions[params.sessionId] = {
      sessionId: params.sessionId,
      userId: params.userId,
      userName: params.userName,
      userEmail: params.userEmail,
      role: params.role,
      unit: params.unit,
      unitName: params.unitName,
      ipAddress: params.ipAddress,
      deviceMeta: params.deviceMeta,
      currentPath: params.currentPath,
      loginAt: now,
      lastHeartbeatAt: now,
      isActive: true,
    };
  }

  writeEnterpriseStore(store);

  // Persist ke Supabase
  void sbPost(
    "admin_user_sessions",
    {
      session_id: params.sessionId,
      user_id: params.userId,
      user_name: params.userName,
      user_email: params.userEmail,
      role: params.role,
      unit: params.unit,
      unit_name: params.unitName,
      ip_address: params.ipAddress,
      device_meta: params.deviceMeta,
      current_path: params.currentPath,
      status: "online",
      last_active_at: now,
      login_at: now,
    },
    "session_id"
  );
}

// ─── Login / Logout ───────────────────────────────────────────────────────────

export function markUserLogin(params: {
  sessionId: string;
  userId: string;
  userName: string;
  userEmail: string;
  role: SystemRole | string;
  unit: string;
  unitName: string;
  ipAddress: string;
  deviceMeta: string;
}): void {
  const store = readEnterpriseStore();
  const now = new Date().toISOString();
  const emailKey = params.userEmail.toLowerCase();

  if (!store.users[emailKey]) {
    store.users[emailKey] = {
      userId: params.userId,
      name: params.userName,
      email: params.userEmail,
      unit: params.unit,
      unitName: params.unitName,
      role: (params.role as SystemRole) || "Operator Posko",
      isActive: true,
      createdAt: now,
      lastLoginAt: now,
      lastActivityAt: now,
    };
  } else {
    store.users[emailKey].lastLoginAt = now;
    store.users[emailKey].lastActivityAt = now;
  }

  store.sessions[params.sessionId] = {
    sessionId: params.sessionId,
    userId: params.userId,
    userName: params.userName,
    userEmail: params.userEmail,
    role: params.role,
    unit: params.unit,
    unitName: params.unitName,
    ipAddress: params.ipAddress,
    deviceMeta: params.deviceMeta,
    currentPath: "/admin",
    loginAt: now,
    lastHeartbeatAt: now,
    isActive: true,
  };

  store.auditLogs.push({
    id: `aud-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    userId: params.userId,
    userName: params.userName,
    role: params.role,
    unit: params.unit,
    unitName: params.unitName,
    action: "LOGIN",
    module: "Auth",
    recordId: params.sessionId,
    timestamp: now,
    ipAddress: params.ipAddress,
    deviceMeta: params.deviceMeta,
    after: { status: "authenticated", unit: params.unit },
    archived: false,
  });

  writeEnterpriseStore(store);

  // Persist ke Supabase
  void sbPost(
    "admin_user_sessions",
    {
      session_id: params.sessionId,
      user_id: params.userId,
      user_name: params.userName,
      user_email: params.userEmail,
      role: params.role,
      unit: params.unit,
      unit_name: params.unitName,
      ip_address: params.ipAddress,
      device_meta: params.deviceMeta,
      current_path: "/admin",
      status: "online",
      login_at: now,
      last_active_at: now,
    },
    "session_id"
  );

  void sbPost("audit_logs", {
    actor_name: params.userName,
    action: "LOGIN",
    entity: "Auth",
    meta: {
      userId: params.userId,
      role: params.role,
      unit: params.unit,
      unitName: params.unitName,
      recordId: params.sessionId,
      ipAddress: params.ipAddress,
      deviceMeta: params.deviceMeta,
      after: { status: "authenticated", unit: params.unit },
    },
    created_at: now,
  });
}

export function markUserLogout(params: {
  sessionId: string;
  userId: string;
  userName: string;
  userEmail: string;
  role: SystemRole | string;
  unit: string;
  unitName: string;
  ipAddress: string;
  deviceMeta: string;
  reason?: string;
}): void {
  const store = readEnterpriseStore();
  const now = new Date().toISOString();

  if (store.sessions[params.sessionId]) {
    store.sessions[params.sessionId].isActive = false;
    store.sessions[params.sessionId].logoutAt = now;
  }

  store.auditLogs.push({
    id: `aud-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    userId: params.userId,
    userName: params.userName,
    role: params.role,
    unit: params.unit,
    unitName: params.unitName,
    action: "LOGOUT",
    module: "Auth",
    recordId: params.sessionId,
    timestamp: now,
    ipAddress: params.ipAddress,
    deviceMeta: params.deviceMeta,
    after: { reason: params.reason || "manual" },
    archived: false,
  });

  writeEnterpriseStore(store);

  // Persist ke Supabase
  void sbPatch(
    "admin_user_sessions",
    `session_id=eq.${encodeURIComponent(params.sessionId)}`,
    { status: "offline", logout_at: now, last_active_at: now }
  );

  void sbPost("audit_logs", {
    actor_name: params.userName,
    action: "LOGOUT",
    entity: "Auth",
    meta: {
      userId: params.userId,
      role: params.role,
      unit: params.unit,
      unitName: params.unitName,
      recordId: params.sessionId,
      ipAddress: params.ipAddress,
      deviceMeta: params.deviceMeta,
      after: { reason: params.reason || "manual" },
    },
    created_at: now,
  });
}

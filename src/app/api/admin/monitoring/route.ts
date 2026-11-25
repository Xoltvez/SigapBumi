import { NextRequest, NextResponse } from "next/server";
import {
  appendAuditLog,
  markUserLogin,
  markUserLogout,
  readEnterpriseStore,
  upsertUserHeartbeat,
  writeEnterpriseStore,
} from "@/lib/enterprise/store";
import { authorizeApiRequest, getClientIp, getDeviceMeta } from "@/lib/enterprise/authGuard";
import { resolveSystemRole, type SystemRole } from "@/lib/rbac";

const ONLINE_THRESHOLD_MS = 2 * 60 * 1000; // < 2 menit heartbeat = Online
const IDLE_THRESHOLD_MS = 10 * 60 * 1000; // 2-10 menit = Idle, > 10 menit = Offline

function getTodayJakartaDateKey(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export async function GET(req: NextRequest) {
  const auth = authorizeApiRequest(req, "view_user_monitoring", "User Monitoring");
  if (!auth.authorized) return auth.response;

  const { searchParams } = new URL(req.url);
  const filterRole = searchParams.get("role") || "semua";
  const filterUnit = searchParams.get("unit") || "semua";
  const filterStatus = searchParams.get("status") || "semua";
  const filterDate = searchParams.get("date") || "";
  const search = (searchParams.get("search") || "").trim().toLowerCase();

  const store = readEnterpriseStore();
  const nowMs = Date.now();
  const todayKey = getTodayJakartaDateKey();

  const allUsers = Object.values(store.users);
  const allSessions = Object.values(store.sessions);

  // Hitung status online/idle/offline berdasarkan heartbeat sesi aktif
  const userStatusMap = new Map<
    string,
    {
      status: "online" | "idle" | "offline";
      lastActivityAt: string | null;
      currentPath: string | null;
      deviceMeta: string | null;
      activeSessionsCount: number;
    }
  >();

  for (const s of allSessions) {
    const emailKey = s.userEmail.toLowerCase();
    const elapsed = nowMs - new Date(s.lastHeartbeatAt).getTime();
    let sessStatus: "online" | "idle" | "offline" = "offline";
    if (s.isActive && elapsed <= ONLINE_THRESHOLD_MS) {
      sessStatus = "online";
    } else if (s.isActive && elapsed <= IDLE_THRESHOLD_MS) {
      sessStatus = "idle";
    }

    const prev = userStatusMap.get(emailKey);
    const rank = { online: 3, idle: 2, offline: 1 };
    if (!prev || rank[sessStatus] > rank[prev.status]) {
      userStatusMap.set(emailKey, {
        status: sessStatus,
        lastActivityAt: s.lastHeartbeatAt,
        currentPath: s.currentPath,
        deviceMeta: s.deviceMeta,
        activeSessionsCount: (prev?.activeSessionsCount || 0) + (sessStatus !== "offline" ? 1 : 0),
      });
    } else if (sessStatus !== "offline") {
      prev.activeSessionsCount += 1;
    }
  }

  // Filter & bentuk tabel pengguna
  const usersTable = allUsers
    .map((u) => {
      const st = userStatusMap.get(u.email.toLowerCase());
      return {
        userId: u.userId,
        name: u.name,
        email: u.email,
        unit: u.unit,
        unitName: u.unitName,
        role: u.role,
        isActive: u.isActive,
        status: st?.status || "offline",
        lastLoginAt: u.lastLoginAt || null,
        lastActivityAt: st?.lastActivityAt || u.lastActivityAt || null,
        currentPath: st?.currentPath || "-",
        deviceMeta: st?.deviceMeta || "-",
        activeSessionsCount: st?.activeSessionsCount || 0,
      };
    })
    .filter((u) => {
      if (filterRole !== "semua" && u.role !== filterRole) return false;
      if (filterUnit !== "semua" && u.unit !== filterUnit) return false;
      if (filterStatus !== "semua" && u.status !== filterStatus) return false;
      if (search) {
        const hay = `${u.name} ${u.email} ${u.userId} ${u.unitName} ${u.role}`.toLowerCase();
        if (!hay.includes(search)) return false;
      }
      if (filterDate && u.lastActivityAt) {
        const dKey = new Intl.DateTimeFormat("en-CA", {
          timeZone: "Asia/Jakarta",
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        }).format(new Date(u.lastActivityAt));
        if (dKey !== filterDate) return false;
      }
      return true;
    });

  // Ringkasan KPI riil
  const onlineCount = allUsers.filter(
    (u) => userStatusMap.get(u.email.toLowerCase())?.status === "online"
  ).length;

  const loginEvents = store.auditLogs.filter(
    (l) => l.action === "LOGIN" || l.action === "LOGOUT" || l.action === "LOGIN_FAILED"
  );

  const loginSuccessToday = loginEvents.filter((l) => {
    if (l.action !== "LOGIN") return false;
    const k = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Jakarta",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date(l.timestamp));
    return k === todayKey;
  }).length;

  const loginFailedToday = loginEvents.filter((l) => {
    if (l.action !== "LOGIN_FAILED") return false;
    const k = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Jakarta",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date(l.timestamp));
    return k === todayKey;
  }).length;

  // Distribusi berdasarkan role
  const roleMap = new Map<string, number>();
  const unitMap = new Map<string, number>();
  for (const u of allUsers) {
    roleMap.set(u.role, (roleMap.get(u.role) || 0) + 1);
    unitMap.set(u.unitName, (unitMap.get(u.unitName) || 0) + 1);
  }

  const activeSessions = allSessions
    .filter((s) => s.isActive && nowMs - new Date(s.lastHeartbeatAt).getTime() <= IDLE_THRESHOLD_MS)
    .sort((a, b) => new Date(b.lastHeartbeatAt).getTime() - new Date(a.lastHeartbeatAt).getTime());

  const loginHistory = [...loginEvents].reverse().slice(0, 50);

  return NextResponse.json(
    {
      summary: {
        totalAccounts: allUsers.length,
        onlineUsers: onlineCount,
        loginSuccessToday,
        loginFailedToday,
      },
      roleDistribution: Array.from(roleMap.entries()).map(([role, count]) => ({ role, count })),
      unitDistribution: Array.from(unitMap.entries()).map(([unitName, count]) => ({ unitName, count })),
      usersTable,
      activeSessions,
      loginHistory,
    },
    { headers: { "Cache-Control": "no-store, max-age=0" } }
  );
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const type = body?.type as string;
    const ip = getClientIp(req.headers);
    const device = getDeviceMeta(req.headers);

    const userId = String(body.userId || "unknown");
    const userName = String(body.userName || "Petugas Posko");
    const userEmail = String(body.userEmail || "unknown@sigapbumi.go.id");
    const unit = String(body.unit || "pemerintahan");
    const unitName = String(body.unitName || "Pemerintahan");
    const role = resolveSystemRole(unit, body.role);
    const sessionId = String(body.sessionId || `ses-${Date.now()}`);

    if (type === "heartbeat") {
      upsertUserHeartbeat({
        sessionId,
        userId,
        userName,
        userEmail,
        role,
        unit,
        unitName,
        ipAddress: ip,
        deviceMeta: device,
        currentPath: String(body.currentPath || "/admin"),
      });
    } else if (type === "login") {
      markUserLogin({
        sessionId,
        userId,
        userName,
        userEmail,
        role,
        unit,
        unitName,
        ipAddress: ip,
        deviceMeta: device,
      });
    } else if (type === "logout") {
      markUserLogout({
        sessionId,
        userId,
        userName,
        userEmail,
        role,
        unit,
        unitName,
        ipAddress: ip,
        deviceMeta: device,
        reason: String(body.reason || "manual"),
      });
    } else if (type === "login_failed") {
      appendAuditLog({
        userId,
        userName,
        role,
        unit,
        unitName,
        action: "LOGIN_FAILED",
        module: "Auth",
        recordId: userEmail,
        ipAddress: ip,
        deviceMeta: device,
        after: { reason: String(body.reason || "Kredensial tidak valid") },
      });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}

export async function PATCH(req: NextRequest) {
  const auth = authorizeApiRequest(req, "manage_roles", "User Management");
  if (!auth.authorized) return auth.response;

  try {
    const body = await req.json();
    const targetEmail = String(body.email || "").toLowerCase();
    const newRole = body.role as SystemRole | undefined;
    const newIsActive = typeof body.isActive === "boolean" ? body.isActive : undefined;

    const store = readEnterpriseStore();
    const targetUser = store.users[targetEmail];
    if (!targetUser) {
      return NextResponse.json({ error: "Akun pengguna tidak ditemukan." }, { status: 404 });
    }

    const before = { role: targetUser.role, isActive: targetUser.isActive };

    if (newRole) {
      targetUser.role = newRole;
    }
    if (newIsActive !== undefined) {
      targetUser.isActive = newIsActive;
    }

    writeEnterpriseStore(store);

    appendAuditLog({
      userId: auth.actor.userId,
      userName: auth.actor.userName,
      role: auth.actor.role,
      unit: auth.actor.unit,
      unitName: auth.actor.unitName,
      action: newRole && newRole !== before.role ? "CHANGE_ROLE" : "UPDATE",
      module: "User Management",
      recordId: targetUser.email,
      ipAddress: auth.ip,
      deviceMeta: auth.device,
      before,
      after: { role: targetUser.role, isActive: targetUser.isActive },
    });

    return NextResponse.json({ ok: true, user: targetUser });
  } catch {
    return NextResponse.json({ error: "Gagal memperbarui pengguna" }, { status: 400 });
  }
}

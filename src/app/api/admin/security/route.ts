import { NextRequest, NextResponse } from "next/server";
import { readEnterpriseStore } from "@/lib/enterprise/store";
import { authorizeApiRequest } from "@/lib/enterprise/authGuard";

export async function GET(req: NextRequest) {
  const auth = authorizeApiRequest(req, "view_security_center", "Security Center");
  if (!auth.authorized) return auth.response;

  const store = readEnterpriseStore();
  const logs = [...store.auditLogs].reverse();
  const sessions = Object.values(store.sessions);
  const nowMs = Date.now();

  // 1. Login gagal berulang
  const failedLogins = logs.filter((l) => l.action === "LOGIN_FAILED");
  const failedByTarget = new Map<string, { target: string; count: number; lastAt: string; ipAddress: string }>();
  for (const f of failedLogins) {
    const key = f.recordId || f.userName;
    const prev = failedByTarget.get(key);
    if (!prev) {
      failedByTarget.set(key, {
        target: key,
        count: 1,
        lastAt: f.timestamp,
        ipAddress: f.ipAddress,
      });
    } else {
      prev.count += 1;
    }
  }
  const repeatedFailedLogins = Array.from(failedByTarget.values()).sort((a, b) => b.count - a.count);

  // 2. Percobaan akses tidak sah (ACCESS_DENIED)
  const unauthorizedAttempts = logs
    .filter((l) => l.action === "ACCESS_DENIED")
    .slice(0, 30)
    .map((l) => ({
      id: l.id,
      userName: l.userName,
      role: l.role,
      unitName: l.unitName,
      module: l.module,
      recordId: l.recordId,
      ipAddress: l.ipAddress,
      timestamp: l.timestamp,
    }));

  // 3. Perubahan role administrator (CHANGE_ROLE)
  const roleChanges = logs
    .filter((l) => l.action === "CHANGE_ROLE")
    .slice(0, 30)
    .map((l) => ({
      id: l.id,
      actorName: l.userName,
      targetEmail: l.recordId,
      before: l.before,
      after: l.after,
      timestamp: l.timestamp,
    }));

  // 4. Sesi aktif yang tidak wajar (lebih dari 1 sesi aktif paralel pada akun yang sama)
  const activeByEmail = new Map<string, typeof sessions>();
  for (const s of sessions) {
    if (s.isActive && nowMs - new Date(s.lastHeartbeatAt).getTime() <= 10 * 60 * 1000) {
      const k = s.userEmail.toLowerCase();
      const arr = activeByEmail.get(k) || [];
      arr.push(s);
      activeByEmail.set(k, arr);
    }
  }

  const unusualSessions = Array.from(activeByEmail.entries())
    .filter(([, arr]) => arr.length > 1)
    .map(([email, arr]) => ({
      email,
      userName: arr[0].userName,
      concurrentCount: arr.length,
      devices: arr.map((x) => x.deviceMeta),
      lastActiveAt: arr[0].lastHeartbeatAt,
    }));

  // 5. Aktivitas akun mencurigakan (gabungan login gagal >= 2 atau access denied >= 2)
  const suspiciousMap = new Map<string, { account: string; reason: string; score: number; lastAt: string }>();
  for (const f of repeatedFailedLogins) {
    if (f.count >= 2) {
      suspiciousMap.set(f.target, {
        account: f.target,
        reason: `${f.count}x percobaan login gagal`,
        score: f.count * 20,
        lastAt: f.lastAt,
      });
    }
  }
  for (const u of unauthorizedAttempts) {
    const key = u.userName;
    const prev = suspiciousMap.get(key);
    if (!prev) {
      suspiciousMap.set(key, {
        account: key,
        reason: `Percobaan akses tanpa izin (${u.module})`,
        score: 30,
        lastAt: u.timestamp,
      });
    } else {
      prev.score += 25;
      prev.reason = `${prev.reason} + akses ditolak`;
    }
  }
  const suspiciousAccounts = Array.from(suspiciousMap.values()).sort((a, b) => b.score - a.score);

  // 6. Riwayat perubahan konfigurasi penting & mutasi sensitif
  const configChanges = logs
    .filter(
      (l) =>
        l.action === "CHANGE_ROLE" ||
        l.action === "EXPORT_DATA" ||
        l.action === "DELETE" ||
        (l.action === "UPDATE" && (l.module.includes("Config") || l.module.includes("Retention") || l.module.includes("User")))
    )
    .slice(0, 30);

  return NextResponse.json(
    {
      summary: {
        failedLoginCount: failedLogins.length,
        accessDeniedCount: unauthorizedAttempts.length,
        roleChangesCount: roleChanges.length,
        unusualSessionsCount: unusualSessions.length,
        suspiciousAccountsCount: suspiciousAccounts.length,
      },
      repeatedFailedLogins,
      unauthorizedAttempts,
      roleChanges,
      unusualSessions,
      suspiciousAccounts,
      configChanges,
    },
    { headers: { "Cache-Control": "no-store, max-age=0" } }
  );
}

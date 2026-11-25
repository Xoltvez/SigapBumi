import { NextRequest, NextResponse } from "next/server";
import { appendAuditLog, readEnterpriseStore, writeEnterpriseStore, type AuditActionType } from "@/lib/enterprise/store";
import { authorizeApiRequest } from "@/lib/enterprise/authGuard";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const format = searchParams.get("format") || "json";

  // Jika export CSV, wajib memiliki izin export_audit_logs
  const requiredPerm = format === "csv" ? "export_audit_logs" : "view_audit_logs";
  const auth = authorizeApiRequest(req, requiredPerm, "Audit Trail");
  if (!auth.authorized) return auth.response;

  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
  const limit = Math.min(100, Math.max(5, parseInt(searchParams.get("limit") || "15", 10) || 15));
  const actionFilter = searchParams.get("action") || "semua";
  const moduleFilter = searchParams.get("module") || "semua";
  const unitFilter = searchParams.get("unit") || "semua";
  const dateFrom = searchParams.get("dateFrom") || "";
  const dateTo = searchParams.get("dateTo") || "";
  const includeArchived = searchParams.get("includeArchived") === "true";
  const search = (searchParams.get("search") || "").trim().toLowerCase();

  const store = readEnterpriseStore();
  const filtered = [...store.auditLogs]
    .reverse()
    .filter((log) => {
      if (!includeArchived && log.archived) return false;
      if (actionFilter !== "semua" && log.action !== actionFilter) return false;
      if (moduleFilter !== "semua" && log.module !== moduleFilter) return false;
      if (unitFilter !== "semua" && log.unit !== unitFilter) return false;
      if (dateFrom) {
        const dKey = new Intl.DateTimeFormat("en-CA", {
          timeZone: "Asia/Jakarta",
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        }).format(new Date(log.timestamp));
        if (dKey < dateFrom) return false;
      }
      if (dateTo) {
        const dKey = new Intl.DateTimeFormat("en-CA", {
          timeZone: "Asia/Jakarta",
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        }).format(new Date(log.timestamp));
        if (dKey > dateTo) return false;
      }
      if (search) {
        const hay = `${log.userName} ${log.userId} ${log.role} ${log.unitName} ${log.action} ${log.module} ${log.recordId} ${log.ipAddress}`.toLowerCase();
        if (!hay.includes(search)) return false;
      }
      return true;
    });

  // Ekspor CSV (dilindungi hak akses export_audit_logs + tercatat di Audit Trail)
  if (format === "csv") {
    appendAuditLog({
      userId: auth.actor.userId,
      userName: auth.actor.userName,
      role: auth.actor.role,
      unit: auth.actor.unit,
      unitName: auth.actor.unitName,
      action: "EXPORT_DATA",
      module: "Audit Trail",
      recordId: `csv-${filtered.length}-rows`,
      ipAddress: auth.ip,
      deviceMeta: auth.device,
      after: { format: "csv", exportedCount: filtered.length },
    });

    const header = "ID,Waktu_WIB,User_ID,Nama_Pengguna,Role,Instansi,Action,Module,Record_ID,IP_Address,Perangkat";
    const rows = filtered.map((l) => {
      const wib = new Intl.DateTimeFormat("id-ID", {
        timeZone: "Asia/Jakarta",
        dateStyle: "short",
        timeStyle: "medium",
      }).format(new Date(l.timestamp));
      const escape = (v: string) => `"${String(v || "").replace(/"/g, '""')}"`;
      return [
        escape(l.id),
        escape(wib),
        escape(l.userId),
        escape(l.userName),
        escape(l.role),
        escape(l.unitName),
        escape(l.action),
        escape(l.module),
        escape(l.recordId),
        escape(l.ipAddress),
        escape(l.deviceMeta),
      ].join(",");
    });

    return new NextResponse([header, ...rows].join("\n"), {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="sigapbumi-audit-logs-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  }

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const safePage = Math.min(page, totalPages);
  const items = filtered.slice((safePage - 1) * limit, safePage * limit);

  const uniqueModules = Array.from(new Set(store.auditLogs.map((l) => l.module)));

  return NextResponse.json(
    {
      items,
      pagination: {
        page: safePage,
        limit,
        total,
        totalPages,
      },
      modules: uniqueModules,
    },
    { headers: { "Cache-Control": "no-store, max-age=0" } }
  );
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Aksi arsip retensi log (hanya Super Admin / manage_roles)
    if (body?.archiveOlderThanDays) {
      const auth = authorizeApiRequest(req, "manage_roles", "Audit Trail");
      if (!auth.authorized) return auth.response;

      const days = Math.max(1, Number(body.archiveOlderThanDays));
      const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
      const store = readEnterpriseStore();
      let archivedCount = 0;

      for (const l of store.auditLogs) {
        if (!l.archived && new Date(l.timestamp).getTime() < cutoff) {
          l.archived = true;
          archivedCount += 1;
        }
      }
      writeEnterpriseStore(store);

      appendAuditLog({
        userId: auth.actor.userId,
        userName: auth.actor.userName,
        role: auth.actor.role,
        unit: auth.actor.unit,
        unitName: auth.actor.unitName,
        action: "UPDATE",
        module: "Audit Trail Retention",
        recordId: `archive-${days}d`,
        ipAddress: auth.ip,
        deviceMeta: auth.device,
        after: { archivedCount, retentionDays: days },
      });

      return NextResponse.json({ ok: true, archivedCount });
    }

    // Pencatatan mutasi operasional normal (CHANGE_STATUS, CREATE, UPDATE, DELETE, dll)
    const authHeaderActor = authorizeApiRequest(req, "view_analytics", String(body.module || "Operasional"));
    if (!authHeaderActor.authorized) return authHeaderActor.response;

    const record = appendAuditLog({
      userId: authHeaderActor.actor.userId,
      userName: authHeaderActor.actor.userName,
      role: authHeaderActor.actor.role,
      unit: authHeaderActor.actor.unit,
      unitName: authHeaderActor.actor.unitName,
      action: (body.action as AuditActionType) || "UPDATE",
      module: String(body.module || "Operasional"),
      recordId: String(body.recordId || "-"),
      ipAddress: authHeaderActor.ip,
      deviceMeta: authHeaderActor.device,
      before: body.before || null,
      after: body.after || null,
    });

    return NextResponse.json({ ok: true, id: record.id });
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}

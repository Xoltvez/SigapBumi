import { NextResponse } from "next/server";
import {
  extractActorFromHeaders,
  hasPermission,
  type ActorContext,
  type Permission,
} from "@/lib/rbac";
import { appendAuditLog } from "@/lib/enterprise/store";

export function getClientIp(headers: Headers): string {
  const fwd = headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return headers.get("x-real-ip") || "127.0.0.1";
}

export function getDeviceMeta(headers: Headers): string {
  const ua = headers.get("user-agent") || "Unknown Browser";
  const isMobile = /mobile|android|iphone|ipad/i.test(ua);
  const browser = /edg/i.test(ua)
    ? "Edge"
    : /chrome/i.test(ua)
    ? "Chrome"
    : /firefox/i.test(ua)
    ? "Firefox"
    : /safari/i.test(ua)
    ? "Safari"
    : "Browser";
  return `${isMobile ? "Mobile" : "Desktop"} (${browser})`;
}

export function authorizeApiRequest(
  request: Request,
  requiredPermission: Permission,
  moduleName: string
): { authorized: true; actor: ActorContext; ip: string; device: string } | { authorized: false; response: NextResponse } {
  const actor = extractActorFromHeaders(request.headers);
  const ip = getClientIp(request.headers);
  const device = getDeviceMeta(request.headers);

  if (!hasPermission(requiredPermission, actor.unit, actor.role)) {
    appendAuditLog({
      userId: actor.userId,
      userName: actor.userName,
      role: actor.role,
      unit: actor.unit,
      unitName: actor.unitName,
      action: "ACCESS_DENIED",
      module: moduleName,
      recordId: requiredPermission,
      ipAddress: ip,
      deviceMeta: device,
      after: { requiredPermission, reason: "Role tidak memiliki kewenangan" },
    });

    return {
      authorized: false,
      response: NextResponse.json(
        {
          error: "Akses ditolak. Peran Anda tidak memiliki izin untuk modul ini.",
          requiredPermission,
        },
        { status: 403 }
      ),
    };
  }

  return { authorized: true, actor, ip, device };
}

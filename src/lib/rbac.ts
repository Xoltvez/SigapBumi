export type Permission =
  | "view_analytics"
  | "view_user_monitoring"
  | "view_audit_logs"
  | "export_audit_logs"
  | "view_security_center"
  | "manage_users"
  | "manage_roles";

export type AdminUnitId =
  | "pemerintahan"
  | "semua"
  | "bnpb_bpbd"
  | "damkar"
  | "medis"
  | "polisi";

export type SystemRole =
  | "Super Admin"
  | "Koordinator Wilayah"
  | "Operator Posko"
  | "Auditor Keamanan";

const UNIT_DEFAULT_ROLE_MAP: Record<string, SystemRole> = {
  pemerintahan: "Super Admin",
  semua: "Super Admin",
  bnpb_bpbd: "Koordinator Wilayah",
  damkar: "Operator Posko",
  medis: "Operator Posko",
  polisi: "Operator Posko",
};

const ROLE_PERMISSIONS: Record<SystemRole, Permission[]> = {
  "Super Admin": [
    "view_analytics",
    "view_user_monitoring",
    "view_audit_logs",
    "export_audit_logs",
    "view_security_center",
    "manage_users",
    "manage_roles",
  ],
  "Koordinator Wilayah": [
    "view_analytics",
    "view_user_monitoring",
    "view_audit_logs",
    "view_security_center",
  ],
  "Auditor Keamanan": [
    "view_analytics",
    "view_user_monitoring",
    "view_audit_logs",
    "export_audit_logs",
    "view_security_center",
  ],
  "Operator Posko": ["view_analytics"],
};

export function resolveSystemRole(unit?: string, explicitRole?: string): SystemRole {
  if (
    explicitRole === "Super Admin" ||
    explicitRole === "Koordinator Wilayah" ||
    explicitRole === "Auditor Keamanan" ||
    explicitRole === "Operator Posko"
  ) {
    return explicitRole;
  }
  const normalizedUnit = (unit || "").toLowerCase();
  return UNIT_DEFAULT_ROLE_MAP[normalizedUnit] || "Operator Posko";
}

export function getPermissionsForActor(unit?: string, explicitRole?: string): Permission[] {
  const sysRole = resolveSystemRole(unit, explicitRole);
  return ROLE_PERMISSIONS[sysRole] || ["view_analytics"];
}

export function hasPermission(
  permission: Permission,
  unit?: string,
  explicitRole?: string
): boolean {
  const perms = getPermissionsForActor(unit, explicitRole);
  return perms.includes(permission);
}

export interface ActorContext {
  userId: string;
  userName: string;
  userEmail: string;
  unit: string;
  unitName: string;
  role: SystemRole;
}

export function extractActorFromHeaders(headers: Headers): ActorContext {
  const unit = headers.get("x-sigap-unit") || "operator";
  const explicitRole = headers.get("x-sigap-role") || undefined;
  const role = resolveSystemRole(unit, explicitRole);

  return {
    userId: headers.get("x-sigap-actor-id") || "unknown",
    userName: headers.get("x-sigap-actor-name") || "Petugas Posko",
    userEmail: headers.get("x-sigap-actor-email") || "unknown@sigapbumi.go.id",
    unit,
    unitName: headers.get("x-sigap-unit-name") || unit.toUpperCase(),
    role,
  };
}

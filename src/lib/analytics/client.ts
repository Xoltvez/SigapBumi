"use client";

export function getAnalyticsDevice(): "Mobile" | "Desktop" {
  if (typeof window === "undefined") return "Desktop";
  return window.innerWidth < 768 ? "Mobile" : "Desktop";
}

export function getVisitorAndSessionIds(): { visitorId: string; sessionId: string } {
  if (typeof window === "undefined") {
    return { visitorId: "srv-visitor", sessionId: "srv-session" };
  }

  let visitorId = "";
  let sessionId = "";
  try {
    visitorId = localStorage.getItem("sigapbumi_visitor_id") || "";
    if (!visitorId) {
      visitorId = `vis-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      localStorage.setItem("sigapbumi_visitor_id", visitorId);
    }

    sessionId = sessionStorage.getItem("sigapbumi_session_id") || "";
    if (!sessionId) {
      sessionId = `ses-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      sessionStorage.setItem("sigapbumi_session_id", sessionId);
    }
  } catch {
    visitorId = visitorId || `vis-${Date.now()}`;
    sessionId = sessionId || `ses-${Date.now()}`;
  }

  return { visitorId, sessionId };
}

export function getReferrerSource(): string {
  if (typeof document === "undefined") return "Akses Langsung (Direct)";
  const ref = document.referrer || "";
  if (!ref) return "Akses Langsung (Direct)";
  try {
    const url = new URL(ref);
    const host = url.hostname.toLowerCase();
    if (host === window.location.hostname.toLowerCase()) {
      return "Navigasi Internal";
    }
    if (host.includes("google")) return "Pencarian Google (Organik)";
    if (host.includes("wa.me") || host.includes("whatsapp")) return "Tautan WhatsApp";
    if (host.includes("bmkg")) return "Rujukan BMKG";
    if (host.includes("instagram") || host.includes("facebook") || host.includes("t.co") || host.includes("tiktok")) {
      return "Media Sosial";
    }
    return host;
  } catch {
    return "Akses Langsung (Direct)";
  }
}

export function sendAnalyticsEvent(payload: Record<string, unknown>): void {
  if (typeof window === "undefined") return;
  try {
    const body = JSON.stringify(payload);
    if (navigator.sendBeacon) {
      const blob = new Blob([body], { type: "application/json" });
      navigator.sendBeacon("/api/analytics", blob);
      return;
    }
    fetch("/api/analytics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    }).catch(() => {});
  } catch {
    // ignore
  }
}

export function trackAdminActivity(params: {
  adminName?: string;
  adminEmail?: string;
  unit?: string;
  unitName?: string;
  action: string;
  detail: string;
}): void {
  sendAnalyticsEvent({
    type: "admin_log",
    adminName: params.adminName || "Petugas Posko",
    adminEmail: params.adminEmail || "admin@sigapbumi.id",
    unit: params.unit || "pemerintahan",
    unitName: params.unitName || "Pemerintahan",
    action: params.action,
    detail: params.detail,
    device: getAnalyticsDevice(),
  });
}

export function getEnterpriseAuthHeaders(adminUser: {
  nip?: string;
  name?: string;
  email?: string;
  unit?: string;
  unitName?: string;
  role?: string;
} | null): Record<string, string> {
  if (!adminUser) return {};
  return {
    "x-sigap-unit": adminUser.unit || "operator",
    "x-sigap-role": adminUser.role || "",
    "x-sigap-actor-id": adminUser.nip || "unknown",
    "x-sigap-actor-name": adminUser.name || "Petugas Posko",
    "x-sigap-actor-email": adminUser.email || "unknown@sigapbumi.go.id",
    "x-sigap-unit-name": adminUser.unitName || "Posko Terpadu",
  };
}

export function sendMonitoringEvent(payload: Record<string, unknown>): void {
  if (typeof window === "undefined") return;
  try {
    const body = JSON.stringify(payload);
    if (navigator.sendBeacon) {
      const blob = new Blob([body], { type: "application/json" });
      navigator.sendBeacon("/api/admin/monitoring", blob);
      return;
    }
    fetch("/api/admin/monitoring", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    }).catch(() => {});
  } catch {
    // ignore
  }
}

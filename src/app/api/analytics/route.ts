import { NextRequest, NextResponse } from "next/server";
import {
  getAnalyticsSummaryAsync,
  recordAdminLog,
  recordClick,
  recordHeartbeat,
  recordPageView,
} from "@/lib/analytics/store";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const periodParam = searchParams.get("period");
    const period: "1d" | "7d" | "30d" =
      periodParam === "1d" || periodParam === "30d" ? periodParam : "7d";

    const summary = await getAnalyticsSummaryAsync(period);
    return NextResponse.json(summary, {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch {
    return NextResponse.json({ error: "Gagal memuat data analitik" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const type = body?.type as string;
    const device: "Mobile" | "Desktop" = body?.device === "Mobile" ? "Mobile" : "Desktop";

    if (type === "pageview") {
      recordPageView({
        sessionId: String(body.sessionId || `sess-${Date.now()}`),
        visitorId: String(body.visitorId || `vis-${Date.now()}`),
        path: String(body.path || "/"),
        device,
        referrer: String(body.referrer || "Akses Langsung (Direct)"),
      });
    } else if (type === "heartbeat") {
      recordHeartbeat({
        sessionId: String(body.sessionId || `sess-${Date.now()}`),
        visitorId: String(body.visitorId || `vis-${Date.now()}`),
        path: String(body.path || "/"),
        device,
        secondsDelta: Number(body.secondsDelta || 25),
      });
    } else if (type === "click") {
      recordClick({
        sessionId: String(body.sessionId || `sess-${Date.now()}`),
        visitorId: String(body.visitorId || `vis-${Date.now()}`),
        label: String(body.label || "Interaksi"),
        path: String(body.path || "/"),
        device,
      });
    } else if (type === "admin_log") {
      recordAdminLog({
        adminName: String(body.adminName || "Petugas Posko"),
        adminEmail: String(body.adminEmail || "admin@sigapbumi.id"),
        unit: String(body.unit || "pemerintahan"),
        unitName: String(body.unitName || "Pemerintahan"),
        action: String(body.action || "Akses Halaman"),
        detail: String(body.detail || "/admin"),
        device,
      });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}

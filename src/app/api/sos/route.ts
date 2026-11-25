import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) return null;

  return createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false },
  });
}

export async function GET() {
  try {
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return NextResponse.json({ success: false, sosAlerts: [], reports: [] });
    }

    const [sosRes, repRes] = await Promise.all([
      supabase
        .from("sos_alerts")
        .select("*")
        .order("created_at", { ascending: false }),
      supabase
        .from("reports")
        .select("*, report_media(*)")
        .or("tracking_code.ilike.SOS-%,title.ilike.%SOS%")
        .order("created_at", { ascending: false }),
    ]);

    return NextResponse.json({
      success: true,
      sosAlerts: sosRes.data || [],
      reports: repRes.data || [],
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      id,
      tracking_code,
      lat,
      lng,
      assistance_type,
      note,
      photo_url,
      disaster_type,
      title,
      description,
      address,
      reporter_id,
      created_at,
    } = body;

    if (!id || !tracking_code) {
      return NextResponse.json(
        { success: false, error: "id dan tracking_code wajib diisi." },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return NextResponse.json(
        { success: false, error: "Konfigurasi Supabase tidak tersedia." },
        { status: 500 }
      );
    }

    const nowIso = created_at || new Date().toISOString();
    const numLat = typeof lat === "number" ? lat : -6.2088;
    const numLng = typeof lng === "number" ? lng : 106.8456;
    const pointWkt = `POINT(${numLng} ${numLat})`;

    const errors: string[] = [];

    // 1. Insert ke sos_alerts
    const { error: sosErr } = await supabase.from("sos_alerts").insert({
      id,
      location: pointWkt,
      assistance_type: assistance_type || "damkar",
      status: "aktif",
      note: note || `[Kode: ${tracking_code}] Panggilan Darurat SOS Warga (Realtime)`,
      created_at: nowIso,
    });
    if (sosErr) errors.push(`sos_alerts: ${sosErr.message}`);

    // 2. Insert ke reports
    const reportPayload: Record<string, unknown> = {
      id,
      tracking_code,
      disaster_type: disaster_type || "lainnya",
      title: title || `PANGGILAN DARURAT SOS (${String(assistance_type || "damkar").toUpperCase()})`,
      description: description || note || "",
      location: pointWkt,
      address: address || `Titik Darurat Warga (${numLat.toFixed(4)}, ${numLng.toFixed(4)})`,
      status: "diterima",
      confirmation_count: 1,
      priority_score: 99,
      created_at: nowIso,
      updated_at: nowIso,
    };

    if (
      reporter_id &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(reporter_id)
    ) {
      reportPayload.reporter_id = reporter_id;
    }

    const { error: repErr } = await supabase.from("reports").insert(reportPayload);
    if (repErr) errors.push(`reports: ${repErr.message}`);

    // 3. Insert foto ke report_media jika ada
    if (photo_url) {
      const { error: mediaErr } = await supabase.from("report_media").insert({
        report_id: id,
        media_url: photo_url,
        media_type: "image",
        created_at: nowIso,
      });
      if (mediaErr) errors.push(`report_media: ${mediaErr.message}`);
    }

    return NextResponse.json({
      success: errors.length < 2,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

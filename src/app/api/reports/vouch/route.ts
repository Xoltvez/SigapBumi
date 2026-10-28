import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: Request) {
  try {
    const { reportId, trackingCode, newCount } = await request.json();

    if (!trackingCode && !reportId) {
      return NextResponse.json({ error: "Missing reportId or trackingCode" }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseKey) {
      const supabase = createClient(supabaseUrl, supabaseKey);

      // 1. Coba update via RPC increment jika tersedia
      try {
        await supabase.rpc("increment_report_confirmation", {
          p_tracking_code: trackingCode,
        });
      } catch {
        // Abaikan jika RPC belum ada
      }

      // 2. Update kolom confirmation_count
      const query = supabase.from("reports").update({
        confirmation_count: newCount,
        updated_at: new Date().toISOString(),
      });

      if (reportId && !reportId.startsWith("rep-") && !reportId.startsWith("p")) {
        await query.eq("id", reportId);
      } else if (trackingCode) {
        await query.eq("tracking_code", trackingCode);
      }
    }

    return NextResponse.json({ success: true, newCount });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

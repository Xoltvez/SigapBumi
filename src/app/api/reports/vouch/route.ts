import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { reportId, trackingCode } = body;

    if (!trackingCode && !reportId) {
      return NextResponse.json(
        { error: "Parameter reportId atau trackingCode wajib diisi." },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    let updatedCount = 1;

    if (supabaseUrl && supabaseKey) {
      const supabase = createClient(supabaseUrl, supabaseKey);

      // Ambil data laporan saat ini untuk menghitung increment secara server-side
      let currentQuery = supabase
        .from("reports")
        .select("id, confirmation_count, priority_score");

      if (reportId && !reportId.startsWith("rep-") && !reportId.startsWith("p")) {
        currentQuery = currentQuery.eq("id", reportId);
      } else if (trackingCode) {
        currentQuery = currentQuery.eq("tracking_code", trackingCode);
      }

      const { data: existingReport } = await currentQuery.maybeSingle();

      const currentCount = existingReport?.confirmation_count || 0;
      updatedCount = currentCount + 1;
      const newScore = (existingReport?.priority_score || 0) + 5;

      const updateQuery = supabase.from("reports").update({
        confirmation_count: updatedCount,
        priority_score: newScore,
        updated_at: new Date().toISOString(),
      });

      if (reportId && !reportId.startsWith("rep-") && !reportId.startsWith("p")) {
        await updateQuery.eq("id", reportId);
      } else if (trackingCode) {
        await updateQuery.eq("tracking_code", trackingCode);
      }
    }

    return NextResponse.json({ success: true, newCount: updatedCount });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

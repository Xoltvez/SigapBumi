import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { ReportStatus } from "@/types";

export async function POST(request: Request) {
  try {
    const { reportId, status, note, actorName } = (await request.json()) as {
      reportId: string;
      status: ReportStatus;
      note?: string;
      actorName?: string;
    };

    if (!reportId || !status) {
      return NextResponse.json(
        { success: false, error: "Missing reportId or status" },
        { status: 400 }
      );
    }

    const cleanNote = note?.trim() || `Status diperbarui menjadi ${status}`;
    const actor = actorName || "Petugas Posko Terpadu";
    const nowIso = new Date().toISOString();

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseKey) {
      const supabase = createClient(supabaseUrl, supabaseKey);

      // 1. Coba panggil RPC resmi change_report_status jika sudah ada di database
      try {
        const { data: rpcData, error: rpcErr } = await supabase.rpc(
          "change_report_status",
          {
            p_report_id: reportId,
            p_new_status: status,
            p_note: cleanNote,
            p_actor_name: actor,
          }
        );
        if (!rpcErr && rpcData?.success) {
          return NextResponse.json({ success: true, via: "rpc_change_report_status" });
        }
      } catch {
        // Lanjut ke fallback
      }

      // 2. Coba RPC update_report_status_public
      try {
        const { data: rpcData2, error: rpcErr2 } = await supabase.rpc(
          "update_report_status_public",
          {
            p_report_id: reportId,
            p_new_status: status,
            p_note: cleanNote,
          }
        );
        if (!rpcErr2 && rpcData2) {
          return NextResponse.json({ success: true, via: "rpc_update_public" });
        }
      } catch {
        // Lanjut ke fallback direct
      }

      // 3. Update langsung tabel reports jika id adalah UUID Supabase
      const isUUID =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
          reportId
        );

      if (isUUID) {
        await supabase
          .from("reports")
          .update({
            status,
            updated_at: nowIso,
          })
          .eq("id", reportId);

        // Catat timeline ke report_status_logs
        try {
          await supabase.from("report_status_logs").insert({
            report_id: reportId,
            status,
            note: cleanNote,
            created_at: nowIso,
          });
        } catch {
          // Abaikan jika trigger sudah menangani
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

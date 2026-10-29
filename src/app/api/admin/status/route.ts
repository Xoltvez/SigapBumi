import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { ReportStatus } from "@/types";

const VALID_STATUSES: ReportStatus[] = [
  "diterima",
  "diverifikasi",
  "ditindaklanjuti",
  "selesai",
  "ditolak",
];

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
        { success: false, error: "Parameter reportId dan status wajib diisi." },
        { status: 400 }
      );
    }

    if (!VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { success: false, error: `Status "${status}" bukan status resmi yang valid.` },
        { status: 400 }
      );
    }

    const cleanNote = note?.trim() || "";

    // Validasi catatan wajib untuk status ditolak dan selesai demi akuntabilitas
    if ((status === "ditolak" || status === "selesai") && cleanNote.length < 5) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Catatan tindak lanjut wajib diisi minimal 5 karakter untuk laporan yang ditolak atau selesai.",
        },
        { status: 400 }
      );
    }

    const finalNote =
      cleanNote ||
      (status === "diverifikasi"
        ? "Laporan telah diverifikasi oleh posko dan siap ditindaklanjuti tim operasional."
        : status === "ditindaklanjuti"
        ? "Tim operasional telah dikerahkan ke lokasi kejadian."
        : `Status diperbarui menjadi ${status}`);

    const actor = actorName || "Petugas Posko Terpadu";
    const nowIso = new Date().toISOString();

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseKey) {
      const supabase = createClient(supabaseUrl, supabaseKey);

      // 1. Coba panggil RPC resmi change_report_status jika skema A1 aktif
      try {
        const { data: rpcData, error: rpcErr } = await supabase.rpc(
          "change_report_status",
          {
            p_report_id: reportId,
            p_new_status: status,
            p_note: finalNote,
            p_actor_name: actor,
          }
        );
        if (!rpcErr && (rpcData as { success?: boolean })?.success) {
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
            p_note: finalNote,
          }
        );
        if (!rpcErr2 && rpcData2) {
          return NextResponse.json({ success: true, via: "rpc_update_public" });
        }
      } catch {
        // Lanjut ke fallback direct
      }

      // 3. Update langsung tabel reports jika UUID
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
            note: finalNote,
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

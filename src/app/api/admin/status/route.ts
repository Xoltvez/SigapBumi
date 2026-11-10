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

    const defaultNote =
      status === "diverifikasi"
        ? "Laporan telah diverifikasi oleh posko dan siap ditindaklanjuti tim operasional."
        : status === "ditindaklanjuti"
        ? "Tim operasional telah dikerahkan ke lokasi kejadian untuk penanganan."
        : status === "selesai"
        ? "Penanganan laporan telah selesai ditangani secara tuntas oleh tim lapangan."
        : status === "ditolak"
        ? "Laporan ditolak setelah peninjauan posko operasional."
        : `Status diperbarui menjadi ${status}`;

    const cleanNote = note?.trim() || defaultNote;

    // Validasi catatan wajib minimal 5 karakter untuk laporan yang ditolak atau selesai
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

    const finalNote = cleanNote;
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

export async function DELETE(request: Request) {
  try {
    let reportId = "";
    let clearAllSos = false;
    try {
      const body = await request.json();
      reportId = body?.reportId;
      clearAllSos = Boolean(body?.clearAllSos);
    } catch {
      const url = new URL(request.url);
      reportId = url.searchParams.get("reportId") || "";
      clearAllSos = url.searchParams.get("clearAllSos") === "true";
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (clearAllSos) {
      if (supabaseUrl && supabaseKey) {
        const supabase = createClient(supabaseUrl, supabaseKey);
        try {
          // Hapus semua data dari sos_alerts
          await supabase.from("sos_alerts").delete().neq("id", "00000000-0000-0000-0000-000000000000");
        } catch {
          // Abaikan jika tidak tersedia
        }
        try {
          // Hapus data laporan yang berupa SOS saja (bukan laporan bencana umum)
          await supabase.from("reports").delete().or("tracking_code.ilike.SOS-%,title.ilike.%SOS%");
        } catch {
          // Abaikan jika tidak tersedia
        }
      }
      return NextResponse.json({ success: true, message: "Seluruh data panggilan SOS berhasil dihapus." });
    }

    if (!reportId) {
      return NextResponse.json(
        { success: false, error: "Parameter reportId wajib diisi." },
        { status: 400 }
      );
    }

    if (supabaseUrl && supabaseKey) {
      const supabase = createClient(supabaseUrl, supabaseKey);

      // Hapus dari reports berdasarkan id atau tracking_code
      await supabase
        .from("reports")
        .delete()
        .or(`id.eq.${reportId},tracking_code.eq.${reportId}`);

      // Hapus dari sos_alerts jika ada
      try {
        await supabase
          .from("sos_alerts")
          .delete()
          .eq("id", reportId);
      } catch {
        // Abaikan jika tidak ada
      }

      // Catat ke audit_logs
      try {
        await supabase.from("audit_logs").insert({
          action: "DELETE_REPORT",
          entity: "reports",
          entity_id: reportId,
          actor_name: "Petugas Posko Terpadu",
        });
      } catch {
        // Abaikan jika tabel tidak tersedia
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

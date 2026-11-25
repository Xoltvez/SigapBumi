import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import os from "os";

export interface TrashSnapshotItem {
  id: string;
  kind: "sos" | "report";
  tracking_code?: string;
  title: string;
  address?: string;
  status?: string;
  photo_url?: string;
  deleted_at: string;
  deleted_by?: string;
  raw_report?: Record<string, unknown> | null;
  raw_sos?: Record<string, unknown> | null;
  raw_media?: Array<Record<string, unknown>>;
}

const TRASH_FILE_PATH = path.join(os.tmpdir(), "sigapbumi_admin_trash.json");

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) return null;
  return createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });
}

function readTrashStore(): TrashSnapshotItem[] {
  try {
    if (fs.existsSync(TRASH_FILE_PATH)) {
      const raw = fs.readFileSync(TRASH_FILE_PATH, "utf-8");
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    }
  } catch {}
  return [];
}

function writeTrashStore(items: TrashSnapshotItem[]) {
  try {
    fs.writeFileSync(TRASH_FILE_PATH, JSON.stringify(items.slice(0, 100), null, 2), "utf-8");
  } catch {}
}

function extractPhoto(desc?: unknown): string | undefined {
  if (typeof desc !== "string") return undefined;
  const m = desc.match(/\[Foto:\s*([\s\S]*?)\]/i);
  return m?.[1]?.trim() || undefined;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const kind = searchParams.get("kind");
    const items = readTrashStore();
    const filtered =
      kind === "sos" || kind === "report"
        ? items.filter((i) => i.kind === kind)
        : items;
    return NextResponse.json({ success: true, items: filtered });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const action = body?.action as string;
    const supabase = getSupabaseAdmin();

    if (action === "archive_and_delete") {
      const {
        reportId,
        kind = "report",
        actorName = "Petugas Posko",
        clearAllSos = false,
        clientSnapshot,
      } = body as {
        reportId?: string;
        kind?: "sos" | "report";
        actorName?: string;
        clearAllSos?: boolean;
        clientSnapshot?: Partial<TrashSnapshotItem>;
      };

      const nowIso = new Date().toISOString();
      const archived: TrashSnapshotItem[] = [];
      const currentTrash = readTrashStore();

      if (clearAllSos && supabase) {
        const [{ data: sosRows }, { data: repRows }] = await Promise.all([
          supabase.from("sos_alerts").select("*"),
          supabase
            .from("reports")
            .select("*, report_media(*)")
            .or("tracking_code.ilike.SOS-%,title.ilike.%SOS%"),
        ]);

        const byId = new Map<string, TrashSnapshotItem>();

        (repRows || []).forEach((rep: any) => {
          const { report_media, ...cleanRep } = rep;
          const mediaList = Array.isArray(report_media) ? report_media : [];
          byId.set(rep.id, {
            id: rep.id,
            kind: "sos",
            tracking_code: rep.tracking_code,
            title: rep.title || "Panggilan Darurat SOS",
            address: rep.address,
            status: rep.status,
            photo_url: mediaList[0]?.media_url || extractPhoto(rep.description),
            deleted_at: nowIso,
            deleted_by: actorName,
            raw_report: cleanRep,
            raw_sos: null,
            raw_media: mediaList,
          });
        });

        (sosRows || []).forEach((sos: any) => {
          const existing = byId.get(sos.id);
          if (existing) {
            existing.raw_sos = sos;
            if (!existing.photo_url) existing.photo_url = extractPhoto(sos.note);
          } else {
            const codeMatch = typeof sos.note === "string" ? sos.note.match(/SOS-\d+/)?.[0] : undefined;
            byId.set(sos.id, {
              id: sos.id,
              kind: "sos",
              tracking_code: codeMatch,
              title: `Panggilan Darurat SOS (${String(sos.assistance_type || "darurat").toUpperCase()})`,
              address: sos.note || "Titik Darurat Warga",
              status: sos.status,
              photo_url: extractPhoto(sos.note),
              deleted_at: nowIso,
              deleted_by: actorName,
              raw_report: null,
              raw_sos: sos,
              raw_media: [],
            });
          }
        });

        archived.push(...Array.from(byId.values()));

        await supabase.from("sos_alerts").delete().neq("id", "00000000-0000-0000-0000-000000000000");
        await supabase.from("reports").delete().or("tracking_code.ilike.SOS-%,title.ilike.%SOS%");
      } else if (reportId) {
        let rawReport: Record<string, unknown> | null = null;
        let rawMedia: Array<Record<string, unknown>> = [];
        let rawSos: Record<string, unknown> | null = null;

        if (supabase) {
          const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(reportId);
          const { data: repData } = await supabase
            .from("reports")
            .select("*, report_media(*)")
            .or(isUuid ? `id.eq.${reportId},tracking_code.eq.${reportId}` : `tracking_code.eq.${reportId}`)
            .maybeSingle();

          if (repData) {
            const { report_media, ...cleanRep } = repData as any;
            rawReport = cleanRep;
            rawMedia = Array.isArray(report_media) ? report_media : [];
          }

          const targetId = (rawReport?.id as string) || (isUuid ? reportId : undefined);
          if (targetId) {
            const { data: sosData } = await supabase
              .from("sos_alerts")
              .select("*")
              .eq("id", targetId)
              .maybeSingle();
            if (sosData) rawSos = sosData as Record<string, unknown>;
          }

          // Hapus dari database
          await supabase
            .from("reports")
            .delete()
            .or(isUuid ? `id.eq.${reportId},tracking_code.eq.${reportId}` : `tracking_code.eq.${reportId}`);

          if (targetId) {
            await supabase.from("sos_alerts").delete().eq("id", targetId);
          }
        }

        const resolvedKind: "sos" | "report" =
          kind === "sos" ||
          rawSos !== null ||
          String(rawReport?.tracking_code || clientSnapshot?.tracking_code || "").toUpperCase().startsWith("SOS-")
            ? "sos"
            : "report";

        const snapId = (rawReport?.id as string) || (rawSos?.id as string) || reportId;
        const snap: TrashSnapshotItem = {
          id: snapId,
          kind: resolvedKind,
          tracking_code: (rawReport?.tracking_code as string) || clientSnapshot?.tracking_code,
          title:
            (rawReport?.title as string) ||
            clientSnapshot?.title ||
            (resolvedKind === "sos" ? "Panggilan Darurat SOS" : "Laporan Bencana"),
          address: (rawReport?.address as string) || clientSnapshot?.address,
          status: (rawReport?.status as string) || (rawSos?.status as string) || clientSnapshot?.status,
          photo_url:
            (rawMedia[0]?.media_url as string) ||
            extractPhoto(rawReport?.description) ||
            extractPhoto(rawSos?.note) ||
            clientSnapshot?.photo_url,
          deleted_at: nowIso,
          deleted_by: actorName,
          raw_report: rawReport || clientSnapshot?.raw_report || null,
          raw_sos: rawSos || clientSnapshot?.raw_sos || null,
          raw_media: rawMedia.length > 0 ? rawMedia : clientSnapshot?.raw_media || [],
        };
        archived.push(snap);
      }

      if (archived.length > 0) {
        const archivedIds = new Set(archived.map((a) => a.id));
        const merged = [...archived, ...currentTrash.filter((t) => !archivedIds.has(t.id))];
        writeTrashStore(merged);
      }

      return NextResponse.json({ success: true, archivedItems: archived });
    }

    if (action === "restore") {
      const { id, snapshot } = body as { id: string; snapshot?: TrashSnapshotItem };
      if (!id && !snapshot) {
        return NextResponse.json({ success: false, error: "id atau snapshot wajib diisi." }, { status: 400 });
      }

      const currentTrash = readTrashStore();
      const target =
        currentTrash.find((t) => t.id === id || t.tracking_code === id) || snapshot;

      if (!target) {
        return NextResponse.json({ success: false, error: "Data di Kotak Sampah tidak ditemukan." }, { status: 404 });
      }

      if (supabase) {
        if (target.raw_report) {
          await supabase.from("reports").upsert(target.raw_report, { onConflict: "id" });
        }
        if (target.raw_media && target.raw_media.length > 0) {
          for (const m of target.raw_media) {
            await supabase.from("report_media").upsert(m, { onConflict: "id" });
          }
        }
        if (target.raw_sos) {
          await supabase.from("sos_alerts").upsert(target.raw_sos, { onConflict: "id" });
        }
      }

      const remaining = currentTrash.filter((t) => t.id !== target.id && t.tracking_code !== target.tracking_code);
      writeTrashStore(remaining);

      return NextResponse.json({ success: true, restoredItem: target });
    }

    return NextResponse.json({ success: false, error: "Action tidak dikenal." }, { status: 400 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const emptyAll = searchParams.get("emptyAll") === "true";
    const kind = searchParams.get("kind");

    const currentTrash = readTrashStore();
    if (emptyAll) {
      const next =
        kind === "sos" || kind === "report"
          ? currentTrash.filter((t) => t.kind !== kind)
          : [];
      writeTrashStore(next);
      return NextResponse.json({ success: true });
    }

    if (id) {
      writeTrashStore(currentTrash.filter((t) => t.id !== id && t.tracking_code !== id));
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, error: "Parameter id atau emptyAll diperlukan." }, { status: 400 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

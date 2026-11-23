import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

const SHARED_CACHE_PATH = path.join(process.cwd(), ".system_shared_reports.json");

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) return null;

  return createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false },
  });
}

function readSharedCache(): any[] {
  try {
    if (fs.existsSync(SHARED_CACHE_PATH)) {
      const raw = fs.readFileSync(SHARED_CACHE_PATH, "utf-8");
      return JSON.parse(raw) || [];
    }
  } catch {}
  return [];
}

function writeSharedCache(items: any[]) {
  try {
    fs.writeFileSync(SHARED_CACHE_PATH, JSON.stringify(items, null, 2), "utf-8");
  } catch {}
}

/**
 * GET: Ambil daftar seluruh laporan atau detail per tracking_code
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code")?.trim().toUpperCase();

    const supabase = getSupabaseClient();
    const sharedCache = readSharedCache();

    // 1. Jika mencari detail laporan spesifik
    if (code) {
      if (supabase) {
        const { data, error } = await supabase
          .from("reports")
          .select("*, report_status_logs(*), report_media(*)")
          .eq("tracking_code", code)
          .maybeSingle();

        if (!error && data) {
          return NextResponse.json({ success: true, report: data, source: "supabase" });
        }
      }

      const foundCache = sharedCache.find((r) => r.tracking_code === code);
      if (foundCache) {
        return NextResponse.json({ success: true, report: foundCache, source: "cache" });
      }

      return NextResponse.json(
        { success: false, error: `Laporan dengan kode ${code} tidak ditemukan.` },
        { status: 404 }
      );
    }

    // 2. Ambil seluruh laporan untuk dashboard admin dan peta situasi
    let remoteReports: any[] = [];
    if (supabase) {
      const { data, error } = await supabase
        .from("reports")
        .select("*, report_media(*)")
        .order("created_at", { ascending: false });

      if (!error && data) {
        remoteReports = data;
      }
    }

    // Gabungkan dengan server cache agar data selalu lengkap dan sinkron
    const map = new Map<string, any>();
    sharedCache.forEach((r) => map.set(r.tracking_code || r.id, r));
    remoteReports.forEach((r) => map.set(r.tracking_code || r.id, r));

    const all = Array.from(map.values()).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    return NextResponse.json({ success: true, reports: all, total: all.length });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

/**
 * POST: Simpan laporan baru dari warga secara terpusat ke database Supabase
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      id,
      tracking_code,
      disaster_type,
      title,
      description,
      latitude,
      longitude,
      address,
      province,
      regency,
      reporter_id,
      reporter_name,
      reporter_phone,
      image_url,
      priority,
    } = body;

    if (!tracking_code || !title || !disaster_type) {
      return NextResponse.json(
        { success: false, error: "Parameter tracking_code, title, dan disaster_type wajib diisi." },
        { status: 400 }
      );
    }

    const reportId = id || crypto.randomUUID();
    const lat = typeof latitude === "number" ? latitude : -6.2088;
    const lng = typeof longitude === "number" ? longitude : 106.8456;

    // Susun alamat lengkap
    const fullAddress = [address, regency, province].filter(Boolean).join(", ") || "Lokasi Warga";

    // Susun deskripsi lengkap dengan tag metadata pelapor
    let richDescription = description || "";
    if (reporter_name && !richDescription.includes("[Pelapor:")) {
      richDescription += `\n[Pelapor: ${reporter_name}]`;
    }
    if (reporter_phone && !richDescription.includes("[Kontak:")) {
      richDescription += `\n[Kontak: ${reporter_phone}]`;
    }

    // Hitung skor prioritas
    const p = String(priority || "").toLowerCase();
    const priorityScore =
      p === "kritis" ? 95 : p === "tinggi" ? 75 : p === "rendah" ? 20 : 50;

    const supabasePayload: Record<string, unknown> = {
      id: reportId,
      tracking_code,
      disaster_type,
      title,
      description: richDescription,
      location: `POINT(${lng} ${lat})`,
      address: fullAddress,
      status: "diterima",
      confirmation_count: 0,
      priority_score: priorityScore,
    };

    if (
      reporter_id &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(reporter_id)
    ) {
      supabasePayload.reporter_id = reporter_id;
    }

    const supabase = getSupabaseClient();
    let isSavedSupabase = false;

    if (supabase) {
      let { error } = await supabase.from("reports").insert(supabasePayload);

      // Jika ada error foreign key reporter_id, retry tanpa reporter_id
      if (error && error.message?.toLowerCase().includes("reporter_id")) {
        delete supabasePayload.reporter_id;
        const retry = await supabase.from("reports").insert(supabasePayload);
        error = retry.error;
      }

      if (!error) {
        isSavedSupabase = true;

        // Simpan foto ke report_media jika ada
        if (image_url) {
          await supabase.from("report_media").insert({
            report_id: reportId,
            media_url: image_url,
            media_type: "image",
          });
        }
      } else {
        console.warn("[/api/reports] Supabase insert warning:", error.message);
      }
    }

    // Selalu simpan di server shared cache
    const cacheItem = {
      ...supabasePayload,
      lat,
      lng,
      image_url,
      reporter_name,
      reporter_phone,
      created_at: new Date().toISOString(),
    };

    const sharedCache = readSharedCache();
    sharedCache.unshift(cacheItem);
    writeSharedCache(sharedCache.slice(0, 100)); // Simpan 100 laporan terkini

    return NextResponse.json({
      success: true,
      tracking_code,
      id: reportId,
      savedToSupabase: isSavedSupabase,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

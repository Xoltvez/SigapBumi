import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

// Batas waktu idle session: 1 jam (3.600.000 ms)
const SESSION_TTL_MS = 60 * 60 * 1000;

interface ActiveSession {
  email: string;
  sessionId: string;
  userId?: string;
  userName?: string;
  userAgent?: string;
  lastActiveAt: number;
  createdAt: number;
}

// Simpan active sessions di in-memory Map dan persist ke file JSON lokal agar tahan hot-reload dev server
const activeSessionsMap = new Map<string, ActiveSession>();
const CACHE_FILE_PATH = path.join(process.cwd(), ".system_active_sessions.json");

// Inisialisasi: baca file cache jika ada saat cold-start
function loadSessionsFromDisk() {
  try {
    if (fs.existsSync(CACHE_FILE_PATH)) {
      const raw = fs.readFileSync(CACHE_FILE_PATH, "utf-8");
      const list: ActiveSession[] = JSON.parse(raw);
      const now = Date.now();
      activeSessionsMap.clear();
      list.forEach((s) => {
        // Hanya muat sesi yang belum melewati batas 1 jam
        if (now - s.lastActiveAt < SESSION_TTL_MS) {
          activeSessionsMap.set(s.email.toLowerCase(), s);
        }
      });
    }
  } catch (err) {
    console.warn("[active-session] Gagal membaca session cache:", err);
  }
}

function persistSessionsToDisk() {
  try {
    const list = Array.from(activeSessionsMap.values());
    fs.writeFileSync(CACHE_FILE_PATH, JSON.stringify(list, null, 2), "utf-8");
  } catch (err) {
    console.warn("[active-session] Gagal menyimpan session cache:", err);
  }
}

// Bersihkan sesi yang kadaluarsa (> 1 jam tidak ada aktivitas)
function pruneExpiredSessions() {
  const now = Date.now();
  let changed = false;
  for (const [email, session] of activeSessionsMap.entries()) {
    if (now - session.lastActiveAt >= SESSION_TTL_MS) {
      activeSessionsMap.delete(email);
      changed = true;
    }
  }
  if (changed) {
    persistSessionsToDisk();
  }
}

// Inisialisasi awal sekali
loadSessionsFromDisk();

/**
 * GET: Cek status apakah email sedang aktif login
 */
export async function GET(request: Request) {
  try {
    pruneExpiredSessions();
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email")?.trim().toLowerCase();
    const currentSessionId = searchParams.get("sessionId");

    if (!email) {
      return NextResponse.json({ error: "Parameter email wajib diisi." }, { status: 400 });
    }

    const session = activeSessionsMap.get(email);
    if (!session) {
      return NextResponse.json({ inUse: false });
    }

    // Jika sessionId sama dengan sesi pemanggil, dianggap sesi yang valid (bukan konflik)
    if (currentSessionId && session.sessionId === currentSessionId) {
      return NextResponse.json({ inUse: false, isOwnSession: true });
    }

    return NextResponse.json({
      inUse: true,
      lastActiveAt: session.lastActiveAt,
      createdAt: session.createdAt,
      userAgent: session.userAgent || "Perangkat lain",
      message:
        "Email ini sedang aktif login di perangkat/sesi lain. Demi keamanan, satu akun tidak dapat digunakan bersamaan.",
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Internal error" }, { status: 500 });
  }
}

/**
 * POST: Manajemen sesi aktif (claim, heartbeat, release, force_claim)
 */
export async function POST(request: Request) {
  try {
    pruneExpiredSessions();
    const body = await request.json();
    const { action, email, sessionId, userId, userName, force } = body as {
      action: "claim" | "heartbeat" | "release" | "force_claim";
      email?: string;
      sessionId?: string;
      userId?: string;
      userName?: string;
      force?: boolean;
    };

    if (!email) {
      return NextResponse.json(
        { success: false, error: "Parameter email wajib diisi." },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
    const userAgent = request.headers.get("user-agent") || "Web Browser";
    const now = Date.now();

    // 1. ACTION: CLAIM (Saat user mencoba login)
    if (action === "claim") {
      const existing = activeSessionsMap.get(normalizedEmail);

      // Jika ada sesi aktif yang masih berlaku dan bukan force claim
      if (existing && now - existing.lastActiveAt < SESSION_TTL_MS && !force) {
        // Jika browser yang sama mencoba masuk kembali dengan sessionId yang sama
        if (sessionId && existing.sessionId === sessionId) {
          existing.lastActiveAt = now;
          persistSessionsToDisk();
          return NextResponse.json({ success: true, sessionId: existing.sessionId });
        }

        // TOLAK LOGIN: Email sedang aktif digunakan di tempat lain
        return NextResponse.json(
          {
            success: false,
            inUse: true,
            code: "EMAIL_CURRENTLY_LOGGED_IN",
            message:
              "Email ini sedang aktif login di perangkat/sesi lain. Demi keamanan, satu akun email tidak dapat dipakai secara bersamaan. Silakan keluar dari sesi sebelumnya atau tunggu hingga sesi tersebut tidak aktif selama 1 jam.",
            lastActiveAt: existing.lastActiveAt,
            createdAt: existing.createdAt,
          },
          { status: 409 } // 409 Conflict
        );
      }

      // Berhasil claim sesi baru
      const newSessionId = sessionId || `session_${now}_${Math.random().toString(36).substring(2, 9)}`;
      const newSession: ActiveSession = {
        email: normalizedEmail,
        sessionId: newSessionId,
        userId: userId || undefined,
        userName: userName || undefined,
        userAgent,
        lastActiveAt: now,
        createdAt: now,
      };

      activeSessionsMap.set(normalizedEmail, newSession);
      persistSessionsToDisk();

      return NextResponse.json({
        success: true,
        sessionId: newSessionId,
        message: "Sesi berhasil didaftarkan.",
      });
    }

    // 2. ACTION: HEARTBEAT (Kirim ping berkala dari tab aktif)
    if (action === "heartbeat") {
      if (!sessionId) {
        return NextResponse.json(
          { success: false, valid: false, error: "Parameter sessionId wajib diisi." },
          { status: 400 }
        );
      }

      const existing = activeSessionsMap.get(normalizedEmail);
      if (!existing) {
        // Sesi tidak ditemukan di server (mungkin server restart atau kadaluarsa), daftarkan ulang
        const regenerated: ActiveSession = {
          email: normalizedEmail,
          sessionId,
          userId,
          userName,
          userAgent,
          lastActiveAt: now,
          createdAt: now,
        };
        activeSessionsMap.set(normalizedEmail, regenerated);
        persistSessionsToDisk();
        return NextResponse.json({ success: true, valid: true });
      }

      // Verifikasi apakah sessionId cocok
      if (existing.sessionId !== sessionId) {
        // Sesi telah diambil alih atau digantikan
        return NextResponse.json(
          {
            success: false,
            valid: false,
            code: "SESSION_CONFLICT",
            message: "Sesi Anda telah dinonaktifkan karena email ini telah masuk di sesi lain.",
          },
          { status: 403 }
        );
      }

      // Update aktivitas terakhir
      existing.lastActiveAt = now;
      persistSessionsToDisk();
      return NextResponse.json({ success: true, valid: true });
    }

    // 3. ACTION: RELEASE (Saat user klik keluar / logout)
    if (action === "release") {
      const existing = activeSessionsMap.get(normalizedEmail);
      if (existing) {
        // Hapus sesi jika sessionId cocok atau jika tidak ada sessionId yang diberikan
        if (!sessionId || existing.sessionId === sessionId) {
          activeSessionsMap.delete(normalizedEmail);
          persistSessionsToDisk();
        }
      }
      return NextResponse.json({ success: true, released: true });
    }

    // 4. ACTION: FORCE_CLAIM (Paksa ambil alih sesi dengan persetujuan user)
    if (action === "force_claim") {
      const newSessionId = `session_${now}_${Math.random().toString(36).substring(2, 9)}`;
      const newSession: ActiveSession = {
        email: normalizedEmail,
        sessionId: newSessionId,
        userId: userId || undefined,
        userName: userName || undefined,
        userAgent,
        lastActiveAt: now,
        createdAt: now,
      };

      activeSessionsMap.set(normalizedEmail, newSession);
      persistSessionsToDisk();

      return NextResponse.json({
        success: true,
        sessionId: newSessionId,
        message: "Sesi lama telah dikeluarkan dan sesi baru berhasil diaktifkan.",
      });
    }

    return NextResponse.json(
      { success: false, error: `Action "${action}" tidak dikenali.` },
      { status: 400 }
    );
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Internal error" }, { status: 500 });
  }
}

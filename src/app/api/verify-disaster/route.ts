import { GoogleGenAI } from "@google/genai";
import { fileTypeFromBuffer } from "file-type";
import { NextResponse } from "next/server";
import { z } from "zod";
import fs from "fs";
import path from "path";

// Batas ukuran maksimal file (3.5 MB) agar tetap di bawah limit serverless payload
const MAX_BYTES = 3.5 * 1024 * 1024;
const ALLOWED_MIMES = new Set(["image/jpeg", "image/png", "image/webp"]);

// Kategori umum bencana dan unit bantuan darurat SOS
export const SUPPORTED_CATEGORIES = [
  "banjir",
  "banjir_tsunami",
  "tsunami",
  "gempa",
  "kebakaran",
  "longsor",
  "karhutla",
  "lainnya",
  // Kategori SOS
  "damkar",
  "sar",
  "bnpb_bpbd",
  "evakuasi",
  "medis",
  "polisi",
] as const;

export type SupportedCategory = (typeof SUPPORTED_CATEGORIES)[number];

// Helper membaca kunci API dan model secara tangguh dari process.env atau .env.local
function getGeminiConfig(): { apiKey: string | undefined; model: string } {
  let apiKey =
    process.env.GEMINI_API_KEY?.trim() ||
    process.env.NEXT_PUBLIC_GEMINI_API_KEY?.trim();
  let model = process.env.GEMINI_MODEL?.trim() || "gemini-3.8-flash";

  // Jika Next.js belum me-reload memory environment, baca langsung dari .env.local
  if (!apiKey) {
    try {
      const envPath = path.join(process.cwd(), ".env.local");
      if (fs.existsSync(envPath)) {
        const content = fs.readFileSync(envPath, "utf8");
        const keyMatch = content.match(/GEMINI_API_KEY\s*=\s*([^\r\n]+)/);
        const modelMatch = content.match(/GEMINI_MODEL\s*=\s*([^\r\n]+)/);
        if (keyMatch && keyMatch[1]?.trim()) {
          apiKey = keyMatch[1].trim();
        }
        if (modelMatch && modelMatch[1]?.trim()) {
          model = modelMatch[1].trim();
        }
      }
    } catch { }
  }

  return { apiKey, model };
}

const visionSchema = z.object({
  kondisi: z.enum(["bencana_jelas", "meragukan", "bukan_bencana"]),
  tipe_visual: z.enum([
    "banjir",
    "tsunami",
    "kerusakan_struktur",
    "longsor",
    "kebakaran",
    "erupsi",
    "cuaca_ekstrem",
    "lainnya",
    "tidak_terlihat",
  ]),
  bukti_visual: z.array(z.string()),
  penjelasan: z.string(),
});

export type VisionResult = z.infer<typeof visionSchema>;

function evaluate(vision: VisionResult, category: string) {
  // 1. Jika AI menyimpulkan bukan bencana sama sekali (selfie, lantai/dinding kosong, makanan, meme, foto acak)
  if (vision.kondisi === "bukan_bencana") {
    return {
      status: "ditolak" as const,
      pesan:
        "Foto tidak menunjukkan indikasi visual bencana nyata (seperti genangan air, luapan sungai, kobaran api, reruntuhan gedung, atau tebing longsor). Harap ambil foto kejadian yang sebenarnya.",
    };
  }

  // 2. Jika kondisi meragukan atau tidak terlihat (misal foto sangat gelap di malam hari)
  if (vision.kondisi === "meragukan" || vision.tipe_visual === "tidak_terlihat") {
    return {
      status: "perlu_review" as const,
      pesan:
        "Foto belum cukup jelas untuk dinilai otomatis oleh AI (misal pencahayaan minim atau buram). Panggilan darurat tetap dapat diajukan untuk tinjauan langsung oleh petugas posko.",
    };
  }

  // Pemetaan kecocokan visual terhadap kategori yang dipilih pelapor
  const matches: Record<string, string[]> = {
    // Kategori Banjir / Air & SAR BPBD
    banjir: ["banjir", "tsunami", "cuaca_ekstrem"],
    banjir_tsunami: ["banjir", "tsunami", "cuaca_ekstrem"],
    tsunami: ["tsunami", "banjir"],
    sar: ["banjir", "tsunami", "longsor", "cuaca_ekstrem", "kerusakan_struktur"],
    bnpb_bpbd: [
      "banjir",
      "tsunami",
      "longsor",
      "kebakaran",
      "karhutla",
      "kerusakan_struktur",
      "cuaca_ekstrem",
      "erupsi",
      "lainnya",
    ],
    evakuasi: [
      "banjir",
      "tsunami",
      "longsor",
      "kebakaran",
      "kerusakan_struktur",
      "cuaca_ekstrem",
    ],

    // Kategori Kebakaran
    kebakaran: ["kebakaran", "karhutla", "erupsi"],
    karhutla: ["kebakaran", "karhutla"],
    damkar: ["kebakaran", "karhutla", "erupsi"],

    // Kategori Gempa & Struktur
    gempa: ["kerusakan_struktur", "longsor"],
    medis: [
      "kerusakan_struktur",
      "longsor",
      "banjir",
      "kebakaran",
      "cuaca_ekstrem",
      "lainnya",
    ],

    // Kategori Longsor
    longsor: ["longsor", "kerusakan_struktur"],

    // Kategori Lainnya & Polisi (lebih toleran)
    polisi: [
      "kebakaran",
      "kerusakan_struktur",
      "longsor",
      "banjir",
      "cuaca_ekstrem",
      "lainnya",
    ],
    lainnya: [
      "longsor",
      "kebakaran",
      "erupsi",
      "cuaca_ekstrem",
      "kerusakan_struktur",
      "banjir",
      "lainnya",
    ],
  };

  const allowedTypes = matches[category.toLowerCase()] || matches.lainnya;

  if (vision.tipe_visual === "lainnya") {
    return {
      status: "perlu_review" as const,
      pesan:
        "Indikasi darurat ditemukan, namun jenis objek belum dapat dipastikan sepenuhnya oleh sistem. Petugas posko akan melakukan verifikasi manual.",
    };
  }

  // Jika bukti visual nyata tidak relevan sama sekali dengan bantuan yang dimohon
  if (!allowedTypes.includes(vision.tipe_visual)) {
    return {
      status: "ditolak" as const,
      pesan: `Bukti visual foto (${vision.tipe_visual.replace("_", " ")}) tidak cocok dengan jenis bantuan/kejadian yang Anda pilih (${category}). Periksa kembali pilihan Anda atau ambil foto yang relevan.`,
    };
  }

  return {
    status: "lolos_foto" as const,
    pesan:
      "Foto lolos verifikasi AI: Terdeteksi bukti visual bencana yang relevan dengan laporan.",
  };
}

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const photo = form.get("photo");
    const category = String(form.get("category") || "lainnya").toLowerCase();

    if (!(photo instanceof File)) {
      return NextResponse.json(
        { error: "Foto bukti wajib dilampirkan." },
        { status: 400 }
      );
    }

    if (photo.size === 0 || photo.size > MAX_BYTES) {
      return NextResponse.json(
        { error: "Ukuran foto harus antara 1 KB sampai 3.5 MB." },
        { status: 413 }
      );
    }

    const bytes = Buffer.from(await photo.arrayBuffer());

    // Periksa magic number byte riil foto (anti rename ekstensi palsu)
    const detected = await fileTypeFromBuffer(bytes);
    if (!detected || !ALLOWED_MIMES.has(detected.mime)) {
      return NextResponse.json(
        { error: "Format foto tidak didukung. Harap gunakan format JPEG, PNG, atau WEBP asli." },
        { status: 415 }
      );
    }

    const { apiKey, model: rawModel } = getGeminiConfig();
    const configuredModel = rawModel || "gemini-3.1-flash-lite";

    // Fail-Safe: Jika GEMINI_API_KEY benar-benar belum diisi sama sekali
    if (!apiKey) {
      console.warn("GEMINI_API_KEY belum dikonfigurasi di environment atau .env.local. Mengaktifkan mode fail-safe posko.");
      return NextResponse.json({
        status: "perlu_review",
        pesan: "Foto diterima dan berstempel GPS. Laporan diteruskan untuk konfirmasi posko.",
        category,
        visual: {
          kondisi: "meragukan",
          tipe: "lainnya",
          bukti: ["Foto kamera berstempel koordinat GPS & waktu riil"],
          penjelasan: "Pemeriksaan AI otomatis offline. Laporan darurat tidak diblokir.",
        },
        verificationScope: "offline_fallback",
      });
    }

    const ai = new GoogleGenAI({ apiKey });
    // Prioritaskan model ultra-cepat gemini-3.1-flash-lite lalu fallback model flash lainnya
    const modelsToTry = [
      configuredModel,
      "gemini-3.1-flash-lite",
      "gemini-2.5-flash",
      "gemini-3.8-flash",
    ].filter((v, i, a) => Boolean(v) && a.indexOf(v) === i);

    const promptText = `Anda adalah sistem verifikasi visual darurat kebencanaan untuk platform SIGAP-BUMI.
Tugas Anda adalah menilai bukti visual dari foto yang diunggah warga secara objektif dan independen.
Patuhi panduan ketat berikut:
1. Jika foto SAMA SEKALI BUKAN BENCANA (misalnya swafoto/selfie, foto makanan, hewan peliharaan, ruangan/lantai/dinding rumah normal tanpa kerusakan, screenshot dokumen/layar, pemandangan kota/jalan raya normal tanpa genangan air), Anda WAJIB menetapkan:
   - kondisi: "bukan_bencana"
   - tipe_visual: "tidak_terlihat"
2. Jika foto menunjukkan GENANGAN AIR, luapan sungai, banjir merendam jalan, rumah, atau pekarangan:
   - kondisi: "bencana_jelas"
   - tipe_visual: "banjir"
3. Jika foto menunjukkan ASAP TEBAL, KOBARAN API, atau puing bekas kebakaran:
   - kondisi: "bencana_jelas"
   - tipe_visual: "kebakaran"
4. Jika foto menunjukkan TANAH LONGSOR, tebing runtuh, pohon tumbang menutup jalan, atau material longsor:
   - kondisi: "bencana_jelas"
   - tipe_visual: "longsor"
5. Jika foto menunjukkan RETAKAN BESAR, bangunan runtuh/rusak parah:
   - kondisi: "bencana_jelas"
   - tipe_visual: "kerusakan_struktur"
6. Jika foto sangat gelap (malam hari tanpa lampu), buram parah, atau tidak jelas:
   - kondisi: "meragukan"
   - tipe_visual: "tidak_terlihat"

Keluarkan HANYA JSON valid sesuai skema berikut tanpa format markdown pembuka/penutup:
{
  "kondisi": "bencana_jelas" | "meragukan" | "bukan_bencana",
  "tipe_visual": "banjir" | "tsunami" | "kerusakan_struktur" | "longsor" | "kebakaran" | "erupsi" | "cuaca_ekstrem" | "lainnya" | "tidak_terlihat",
  "bukti_visual": ["poin bukti 1", "poin bukti 2"],
  "penjelasan": "Deskripsi singkat 1 kalimat dalam bahasa Indonesia mengenai apa yang terlihat di foto"
}`;

    let outputText: string | undefined;

    // Helper timeout darurat per percobaan (8 detik per request)
    const callWithTimeout = async (modelName: string): Promise<string | undefined> => {
      const t0 = Date.now();
      const generatePromise = ai.models
        .generateContent({
          model: modelName,
          contents: [
            promptText,
            {
              inlineData: {
                data: bytes.toString("base64"),
                mimeType: detected.mime,
              },
            },
          ],
          config: {
            responseMimeType: "application/json",
          },
        })
        .then((res) => {
          console.log(`[AI-VISION] Model ${modelName} berhasil dalam ${Date.now() - t0} ms`);
          return res.text;
        });

      const timeoutPromise = new Promise<undefined>((_, reject) =>
        setTimeout(() => reject(new Error(`Timeout AI pada model ${modelName}`)), 8000)
      );

      return Promise.race([generatePromise, timeoutPromise]);
    };

    for (const modelToTry of modelsToTry) {
      try {
        console.log(`[AI-VISION] Mencoba verifikasi visual dengan model ${modelToTry}...`);
        const text = await callWithTimeout(modelToTry);
        if (text) {
          outputText = text;
          break;
        }
      } catch (err: unknown) {
        console.warn(`[AI-VISION] Model ${modelToTry} mengalami kendala:`, (err as Error)?.message || err);
      }
    }

    // Jika semua model timeout atau sibuk: FAST-PASS DARURAT
    if (!outputText) {
      return NextResponse.json({
        status: "perlu_review",
        pesan: "Verifikasi visual otomatis dialihkan ke petugas posko agar bantuan segera meluncur.",
        category,
        visual: {
          kondisi: "meragukan",
          tipe: "lainnya",
          bukti: ["Foto berstempel GPS & waktu riil siap diverifikasi tim posko"],
          penjelasan: "Pemeriksaan dipercepat demi keselamatan korban darurat.",
        },
        verificationScope: "emergency_fast_pass",
      });
    }

    // Bersihkan karakter markdown jika ada (misal ```json ... ```)
    const cleanJson = outputText.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();
    const rawParsed = JSON.parse(cleanJson);
    const vision = visionSchema.parse(rawParsed);

    const evaluation = evaluate(vision, category);

    return NextResponse.json({
      ...evaluation,
      category,
      visual: {
        kondisi: vision.kondisi,
        tipe: vision.tipe_visual,
        bukti: vision.bukti_visual.slice(0, 4),
        penjelasan: vision.penjelasan,
      },
      verificationScope: "ai_multimodal_vision",
    });
  } catch (error) {
    console.error("SIGAP-BUMI AI disaster photo verification failed:", error);
    return NextResponse.json(
      {
        status: "perlu_review",
        pesan: "Pemeriksaan AI sedang mengalami kendala jaringan. Sinyal darurat tetap diteruskan ke posko terdekat.",
        visual: {
          kondisi: "meragukan",
          tipe: "lainnya",
          bukti: ["Koneksi AI timeout / offline"],
          penjelasan: "Pemeriksaan visual manual oleh petugas posko.",
        },
        verificationScope: "error_fallback",
      },
      { status: 200 }
    );
  }
}


/**
 * Modul Manajemen Kode Tracking SigapBumi
 * Standar: Non-guessable format acak berbasis tahun dan karakter unik (Poin 3.4 Master Prompt)
 * Format Baru: SB-2026-XXXX (contoh: SB-2026-8F3K)
 * Mendukung backward-compatibility untuk format legacy LPR-XXXXXX dan SOS-XXXX
 */

const UNAMBIGUOUS_CHARS = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

/**
 * Menghasilkan kode tracking acak yang aman dan tidak dapat ditebak.
 * Menghindari karakter ambigu seperti 0, O, 1, I untuk kemudahan baca warga.
 * @param year Tahun berjalan (default 2026)
 * @param length Jumlah karakter acak (default 4 sesuai format SB-2026-XXXX)
 */
export function generateTrackingCode(year: number = 2026, length: number = 4): string {
  let randomPart = "";
  for (let i = 0; i < length; i++) {
    randomPart += UNAMBIGUOUS_CHARS.charAt(
      Math.floor(Math.random() * UNAMBIGUOUS_CHARS.length)
    );
  }
  return `SB-${year}-${randomPart}`;
}

/**
 * Memvalidasi apakah string memenuhi format kode tracking SigapBumi yang sah.
 * Menerima format baru: SB-2026-XXXX (4-6 karakter)
 * Serta format kompatibilitas: LPR-XXXXXX dan SOS-XXXX
 */
export function isValidTrackingCode(code: string): boolean {
  if (!code || typeof code !== "string") return false;
  const clean = code.trim().toUpperCase();
  // Regex untuk SB-YYYY-XXXX (4-8 karakter unik), LPR-XXXXXX, atau SOS-XXXX
  const pattern = /^(SB-\d{4}-[2-9A-HJ-NP-Z]{4,8}|LPR-[2-9A-HJ-NP-Z]{4,8}|SOS-[A-Z0-9]{4,10})$/;
  return pattern.test(clean);
}

/**
 * Membersihkan dan menormalisasi kode input pengguna (trim whitespace & uppercase)
 */
export function normalizeTrackingCode(code: string): string {
  if (!code) return "";
  return code.trim().toUpperCase().replace(/\s+/g, "");
}

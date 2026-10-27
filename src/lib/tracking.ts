/**
 * Menghasilkan kode tracking unik acak (misal: LPR-8F3K2Q)
 * Menghindari karakter ambigu seperti 0, O, 1, I
 */
export function generateTrackingCode(): string {
  const chars = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
  let randomPart = "";
  for (let i = 0; i < 6; i++) {
    randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `LPR-${randomPart}`;
}

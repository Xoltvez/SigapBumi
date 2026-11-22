"use client";

import { useState, type FormEvent } from "react";

type Category = "banjir_tsunami" | "gempa" | "lainnya";
type Result = {
  status: "lolos_foto" | "perlu_review" | "ditolak";
  pesan: string;
  visual: { kondisi: string; tipe: string; bukti: string[]; penjelasan: string };
};

export function DisasterPhotoVerifier({
  onPassed,
}: {
  // Call your existing report submission flow after a visual check passes.
  // IMPORTANT: final submission must verify this on the server again.
  onPassed?: (file: File, category: Category) => void;
}) {
  const [category, setCategory] = useState<Category>("banjir_tsunami");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState("");

  async function verify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file) return;
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const form = new FormData();
      form.append("photo", file);
      form.append("category", category);
      const response = await fetch("/api/verify-disaster", { method: "POST", body: form });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Verifikasi gagal.");
      setResult(data as Result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verifikasi gagal.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mx-auto max-w-lg rounded-xl border p-5 space-y-4">
      <h2 className="text-xl font-bold">Verifikasi Foto Bencana</h2>
      <p className="text-sm text-gray-600">Pemeriksaan relevansi foto oleh AI sebelum laporan diproses.</p>
      <form onSubmit={verify} className="space-y-3">
        <label className="block text-sm font-medium" htmlFor="disaster-category">Kategori laporan</label>
        <select
          id="disaster-category" value={category}
          onChange={(e) => { setCategory(e.target.value as Category); setResult(null); }}
          className="w-full rounded-lg border p-2"
        >
          <option value="banjir_tsunami">Banjir &amp; Tsunami</option>
          <option value="gempa">Gempa</option>
          <option value="lainnya">Lainnya</option>
        </select>
        <label className="block text-sm font-medium" htmlFor="disaster-photo">Unggah foto (maks. 3 MB)</label>
        <input
          id="disaster-photo" type="file" accept="image/jpeg,image/png,image/webp" required
          onChange={(e) => { setFile(e.target.files?.[0] ?? null); setResult(null); }}
          className="block w-full text-sm"
        />
        <button type="submit" disabled={!file || loading}
          className="rounded-lg bg-blue-700 px-4 py-2 font-semibold text-white disabled:opacity-50">
          {loading ? "AI sedang memeriksa foto..." : "Periksa Foto dengan AI"}
        </button>
      </form>
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      {result && (
        <div role="status" className="rounded-lg border p-4 space-y-2 text-sm">
          <strong>
            {result.status === "lolos_foto" ? "✅ Lolos pemeriksaan foto" :
              result.status === "perlu_review" ? "⚠️ Perlu tinjauan petugas" : "❌ Foto ditolak"}
          </strong>
          <p>{result.pesan}</p>
          <p><strong>Hasil visual:</strong> {result.visual.tipe.replaceAll("_", " ")}</p>
          <p>{result.visual.penjelasan}</p>
          {result.visual.bukti.length > 0 && (
            <p><strong>Bukti yang terlihat:</strong> {result.visual.bukti.join("; ")}</p>
          )}
          {result.status === "lolos_foto" && onPassed && file && (
            <button type="button" onClick={() => onPassed(file, category)}
              className="rounded-lg bg-green-700 px-4 py-2 font-semibold text-white">
              Lanjutkan Laporan
            </button>
          )}
          {result.status === "perlu_review" && (
            <p>Jangan menghalangi laporan darurat: sediakan jalur pengajuan dengan status menunggu review.</p>
          )}
        </div>
      )}
    </section>
  );
}

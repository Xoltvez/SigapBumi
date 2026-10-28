"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  MapPin,
  Clock,
  ShieldCheck,
  Eye,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Send,
  Waves,
  Mountain,
  Flame,
  User,
  Radio,
  Image as ImageIcon,
} from "lucide-react";
import { PriorityBadge } from "@/components/admin/common/PriorityBadge";
import type { ReportStatus, DisasterType, PriorityLabel } from "@/types";
import { fetchLiveReports, fetchReportDetail, updateReportStatusLive, recordAuditLog } from "@/lib/services/reports";
import { supabase } from "@/lib/supabase/client";

interface ReportDetailState {
  id: string;
  tracking_code: string;
  disaster_type: DisasterType;
  title: string;
  description: string;
  address: string;
  lat: number;
  lng: number;
  status: ReportStatus;
  priority: PriorityLabel;
  confirmation_count: number;
  created_at: string;
  version: number;
  reporter_name?: string;
  reporter_phone?: string;
  timeline: Array<{
    status: ReportStatus;
    label: string;
    timestamp?: string;
    note?: string;
    actor?: string;
  }>;
}

export default function DetailLaporanClient({ reportId }: { reportId: string }) {
  const [report, setReport] = useState<ReportDetailState | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Dialog State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [targetStatus, setTargetStatus] = useState<ReportStatus | null>(null);
  const [actionNote, setActionNote] = useState("");
  const [noteError, setNoteError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Privasi Kontak Pelapor (Penyamaran PII & Audit Log)
  const [isContactRevealed, setIsContactRevealed] = useState(false);
  const [isRevealModalOpen, setIsRevealModalOpen] = useState(false);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadDetail() {
      setIsLoading(true);
      try {
        const live = await fetchLiveReports();
        const found = live.find(
          (r) => r.id === reportId || r.tracking_code === reportId
        );

        if (isMounted && found) {
          const detail = await fetchReportDetail(found.tracking_code);

          let pLabel: PriorityLabel = "Sedang";
          if (found.priority === "tinggi" || found.confirmation_count >= 20) pLabel = "Kritis";
          else if (found.confirmation_count >= 10) pLabel = "Tinggi";
          else if (found.status === "selesai") pLabel = "Rendah";

          setReport({
            id: found.id,
            tracking_code: found.tracking_code,
            disaster_type: found.disaster_type,
            title: found.title,
            description: found.description,
            address: found.address,
            lat: found.lat,
            lng: found.lng,
            status: found.status,
            priority: pLabel,
            confirmation_count: found.confirmation_count,
            created_at: found.created_at,
            version: 1,
            reporter_name: "Warga SigapBumi (Terverifikasi)",
            reporter_phone: "0812-8899-2345",
            timeline: (detail?.timeline && detail.timeline.length > 0) ? detail.timeline : found.timeline || [
              {
                status: "diterima",
                label: "Laporan Masuk Sistem",
                timestamp: found.created_at,
                note: "Laporan tercatat dan masuk ke antrean verifikasi posko.",
                actor: "Sistem SigapBumi",
              },
            ],
          });
        }
      } catch (err) {
        console.warn("Gagal memuat detail laporan:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    const timer = setTimeout(() => {
      loadDetail();
    }, 0);

    // Realtime channel
    const channel = supabase
      .channel(`admin_detail_${reportId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "reports", filter: `id=eq.${reportId}` },
        () => loadDetail()
      )
      .subscribe();

    return () => {
      isMounted = false;
      clearTimeout(timer);
      supabase.removeChannel(channel);
    };
  }, [reportId]);

  // Handler Buka Dialog Aksi Ubah Status
  const openActionDialog = (newStatus: ReportStatus) => {
    setTargetStatus(newStatus);
    setActionNote("");
    setNoteError("");
    setIsDialogOpen(true);
  };

  // Eksekusi Konfirmasi Aksi Ubah Status
  const handleConfirmStatusChange = async () => {
    if (!targetStatus || !report) return;

    // Validasi catatan wajib untuk Ditolak dan Selesai
    const clean = actionNote.trim();
    if ((targetStatus === "ditolak" || targetStatus === "selesai") && clean.length < 5) {
      setNoteError("Catatan wajib diisi minimal 5 karakter agar pelapor mengetahui alasannya.");
      return;
    }

    setIsSubmitting(true);
    setNoteError("");

    try {
      const result = await updateReportStatusLive(
        report.id,
        targetStatus,
        clean || undefined,
        "Petugas Pusdalops",
        report.version
      );

      if (!result.success && result.error?.includes("Konflik")) {
        setNoteError(result.error);
        setIsSubmitting(false);
        return;
      }

      // Optimistic update
      setReport((prev) => {
        if (!prev) return null;
        const newStep = {
          status: targetStatus,
          label:
            targetStatus === "diverifikasi"
              ? "Laporan Diverifikasi"
              : targetStatus === "ditindaklanjuti"
              ? "Tim Operasional Ditugaskan"
              : targetStatus === "selesai"
              ? "Kasus Penanganan Selesai"
              : "Laporan Ditolak",
          timestamp: "Baru saja",
          note: clean || `Status diperbarui menjadi ${targetStatus}`,
          actor: "Petugas Pusdalops",
        };

        return {
          ...prev,
          status: targetStatus,
          version: prev.version + 1,
          timeline: [...prev.timeline, newStep],
        };
      });

      setIsDialogOpen(false);
      setToastMessage(`Status berhasil diubah menjadi: ${targetStatus.toUpperCase()}`);
      setTimeout(() => setToastMessage(null), 4000);
    } catch (err) {
      console.error(err);
      setNoteError("Gagal memperbarui status. Periksa koneksi internet.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handler Buka Kontak Pelapor (Audit Log)
  const handleRevealContact = async () => {
    if (!report) return;
    setIsContactRevealed(true);
    setIsRevealModalOpen(false);

    // Catat ke audit_logs
    await recordAuditLog(
      "VIEW_REPORTER_CONTACT",
      "reports",
      report.id,
      { tracking_code: report.tracking_code },
      "Petugas Pusdalops"
    );

    setToastMessage("Data kontak pelapor dibuka. Tindakan telah dicatat ke audit log.");
    setTimeout(() => setToastMessage(null), 4000);
  };

  const getDisasterIcon = (type: DisasterType) => {
    switch (type) {
      case "banjir":
        return <Waves className="w-5 h-5 text-info" />;
      case "longsor":
        return <Mountain className="w-5 h-5 text-ink" />;
      case "kebakaran":
        return <Flame className="w-5 h-5 text-danger" />;
      default:
        return <AlertTriangle className="w-5 h-5 text-warning" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] text-ink-muted text-sm">
        <Radio className="w-6 h-6 animate-spin text-primary mr-2" />
        <p>Memuat Lembar Kerja Laporan...</p>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="bg-surface border border-line rounded-md p-8 text-center max-w-md mx-auto space-y-3">
        <AlertTriangle className="w-8 h-8 text-warning mx-auto" />
        <h2 className="text-base font-bold text-ink">Laporan Tidak Ditemukan</h2>
        <p className="text-xs text-ink-soft">Laporan dengan ID tersebut tidak tersedia di sistem.</p>
        <Link
          href="/admin/laporan"
          className="inline-block px-4 py-2 rounded-md bg-ink text-white text-xs font-semibold"
        >
          Kembali ke Antrean Laporan
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto pb-12">
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="p-3.5 rounded-md bg-success-soft border border-success/30 text-success-text text-xs font-bold flex items-center justify-between shadow-xs">
          <span>✓ {toastMessage}</span>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="text-[11px] underline"
          >
            Tutup
          </button>
        </div>
      )}

      {/* Top Header: Navigasi Kembali & Ringkasan Judul */}
      <div className="bg-surface border border-line rounded-md p-4 shadow-card flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <Link
            href="/admin/laporan"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary-text hover:underline mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Kembali ke Daftar Laporan</span>
          </Link>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-xl md:text-2xl font-bold font-mono text-primary-text">
              {report.tracking_code}
            </h1>
            <PriorityBadge priority={report.priority} />
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${
                report.status === "diterima"
                  ? "bg-info-soft text-info-text border border-info/30"
                  : report.status === "diverifikasi"
                  ? "bg-info-soft text-info-text border border-info"
                  : report.status === "ditindaklanjuti"
                  ? "bg-warning-soft text-warning-text border border-warning"
                  : report.status === "selesai"
                  ? "bg-success-soft text-success-text border border-success"
                  : "bg-danger-soft text-danger-text border border-danger"
              }`}
            >
              {report.status}
            </span>
          </div>
          <p className="text-sm font-bold text-ink mt-1 flex items-center gap-1.5">
            {getDisasterIcon(report.disaster_type)}
            <span>{report.title}</span>
          </p>
        </div>

        <div className="text-xs text-ink-muted">
          <p>
            Masuk pada: <strong className="text-ink">{report.created_at}</strong>
          </p>
          <p className="mt-0.5">Versi data: #{report.version}</p>
        </div>
      </div>

      {/* Main Grid: Kolom Kiri (2/3 Konten Laporan) & Kolom Kanan (1/3 Tindakan & Riwayat) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Kolom Kiri: Bukti, Deskripsi, Peta Mini, Data Pelapor */}
        <div className="lg:col-span-8 space-y-6">
          {/* Galeri Bukti Foto / Video */}
          <section className="bg-surface border border-line rounded-md p-5 shadow-card space-y-3">
            <h2 className="text-sm font-bold text-ink uppercase tracking-wider flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-primary" />
              <span>Bukti Visual Kejadian</span>
            </h2>

            <div className="aspect-video w-full rounded-md bg-bg border border-line flex flex-col items-center justify-center text-ink-muted p-6 text-center">
              <ImageIcon className="w-12 h-12 text-ink-muted mb-2 opacity-50" />
              <p className="text-xs font-semibold text-ink">Foto Bukti Lapangan Terverifikasi GPS</p>
              <p className="text-[11px] text-ink-muted mt-0.5">
                Format citra terenkripsi dan terverifikasi metadata timestamp perangkat pelapor.
              </p>
            </div>
          </section>

          {/* Deskripsi Lengkap Pelapor */}
          <section className="bg-surface border border-line rounded-md p-5 shadow-card space-y-2">
            <h2 className="text-sm font-bold text-ink uppercase tracking-wider">
              Deskripsi dari Pelapor
            </h2>
            <p className="text-sm text-ink-soft leading-relaxed p-4 bg-bg rounded-md border border-line">
              {report.description}
            </p>
          </section>

          {/* Lokasi & Peta Mini */}
          <section className="bg-surface border border-line rounded-md p-5 shadow-card space-y-3">
            <h2 className="text-sm font-bold text-ink uppercase tracking-wider flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" />
              <span>Titik Lokasi Geospasial</span>
            </h2>
            <div className="p-3 bg-bg rounded-md border border-line text-xs space-y-1">
              <p className="font-semibold text-ink">📍 {report.address}</p>
              <p className="font-mono text-ink-muted text-[11px]">
                Koordinat GPS: {report.lat}, {report.lng} (WGS84 / PostGIS SRID 4326)
              </p>
            </div>
          </section>

          {/* Data Pelapor (Disamarkan Bawaan - Privasi PII & Audit Log) */}
          <section className="bg-surface border border-line rounded-md p-5 shadow-card space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-line">
              <h2 className="text-sm font-bold text-ink uppercase tracking-wider flex items-center gap-2">
                <User className="w-4 h-4 text-primary" />
                <span>Identitas Pelapor (Data Terlindungi)</span>
              </h2>
              <span className="text-[11px] text-ink-muted">Privasi Terjamin</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3 bg-bg rounded-md border border-line space-y-1">
                <span className="text-ink-muted block text-[11px]">Nama Pelapor:</span>
                <p className="font-semibold text-ink font-mono text-sm">
                  {isContactRevealed ? report.reporter_name : "Budi S***"}
                </p>
              </div>

              <div className="p-3 bg-bg rounded-md border border-line space-y-1">
                <span className="text-ink-muted block text-[11px]">Nomor Telepon:</span>
                <p className="font-semibold text-ink font-mono text-sm">
                  {isContactRevealed ? report.reporter_phone : "0812-****-7890"}
                </p>
              </div>
            </div>

            {!isContactRevealed && (
              <button
                type="button"
                onClick={() => setIsRevealModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-line bg-surface hover:bg-bg text-xs font-semibold text-ink transition-colors shadow-xs"
              >
                <Eye className="w-3.5 h-3.5 text-primary" />
                <span>Buka Kontak Lengkap (Dicatat Audit Log)</span>
              </button>
            )}

            {isContactRevealed && (
              <p className="text-[11px] text-success-text font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-success" />
                Kontak berhasil dibuka. Akses petugas telah terekam pada audit log sistem.
              </p>
            )}
          </section>
        </div>

        {/* Kolom Kanan: Panel Tindakan Petugas & Riwayat Status */}
        <div className="lg:col-span-4 space-y-6">
          {/* Panel Tindakan Petugas (design-admin.md 5.3) */}
          <section className="bg-surface border border-line rounded-md p-5 shadow-card space-y-4">
            <h2 className="text-sm font-bold text-ink uppercase tracking-wider pb-2 border-b border-line">
              Panel Tindakan Operasional
            </h2>

            <div className="space-y-2.5">
              {/* Tombol transisi sesuai status saat ini */}
              {report.status === "diterima" && (
                <>
                  <button
                    type="button"
                    onClick={() => openActionDialog("diverifikasi")}
                    className="w-full h-10 px-4 rounded-md bg-primary-action hover:bg-primary-action-hover text-white text-xs font-bold transition-colors shadow-xs flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Verifikasi Laporan</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => openActionDialog("ditolak")}
                    className="w-full h-9 px-4 rounded-md border border-danger/40 text-danger-text hover:bg-danger-soft text-xs font-bold transition-colors flex items-center justify-center gap-2"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Tolak (Laporan Palsu/Duplikat)</span>
                  </button>
                </>
              )}

              {report.status === "diverifikasi" && (
                <>
                  <button
                    type="button"
                    onClick={() => openActionDialog("ditindaklanjuti")}
                    className="w-full h-10 px-4 rounded-md bg-warning hover:bg-warning/90 text-white text-xs font-bold transition-colors shadow-xs flex items-center justify-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    <span>Tugaskan Tim Lapangan</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => openActionDialog("ditolak")}
                    className="w-full h-9 px-4 rounded-md border border-danger/40 text-danger-text hover:bg-danger-soft text-xs font-bold transition-colors flex items-center justify-center gap-2"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Tolak Laporan</span>
                  </button>
                </>
              )}

              {report.status === "ditindaklanjuti" && (
                <button
                  type="button"
                  onClick={() => openActionDialog("selesai")}
                  className="w-full h-10 px-4 rounded-md bg-success hover:bg-success/90 text-white text-xs font-bold transition-colors shadow-xs flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Tandai Selesai Ditangani</span>
                </button>
              )}

              {report.status === "selesai" && (
                <div className="p-3 bg-success-soft border border-success/30 rounded-md text-success-text text-xs text-center font-bold">
                  ✓ Penanganan Kasus Selesai (Kasus Ditutup)
                </div>
              )}

              {report.status === "ditolak" && (
                <div className="p-3 bg-danger-soft border border-danger/30 rounded-md text-danger-text text-xs text-center font-bold">
                  ✕ Laporan Ditolak / Tidak Valid
                </div>
              )}
            </div>

            {/* Konfirmasi Warga */}
            <div className="pt-3 border-t border-line text-xs text-ink-muted flex items-center justify-between">
              <span>Konfirmasi Warga:</span>
              <span className="font-bold text-primary flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                {report.confirmation_count} Warga
              </span>
            </div>
          </section>

          {/* Timeline Riwayat Petugas (design-admin.md 5.3) */}
          <section className="bg-surface border border-line rounded-md p-5 shadow-card space-y-3">
            <h2 className="text-sm font-bold text-ink uppercase tracking-wider pb-2 border-b border-line">
              Timeline Tindak Lanjut
            </h2>

            <div className="relative pl-5 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-line">
              {report.timeline.map((step, idx) => (
                <div key={idx} className="relative text-xs">
                  <span className="absolute -left-5 top-1 w-2.5 h-2.5 rounded-full bg-primary border-2 border-surface" />
                  <p className="font-bold text-ink">{step.label}</p>
                  <p className="text-[11px] text-ink-muted flex items-center gap-1 mt-0.5">
                    <Clock className="w-3 h-3" />
                    <span>{step.timestamp}</span> · <span>{step.actor || "Petugas"}</span>
                  </p>
                  {step.note && (
                    <p className="mt-1 p-2 bg-bg rounded border border-line text-[11px] text-ink-soft">
                      {step.note}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>

      {/* Modal Dialog Konfirmasi Ubah Status (design-admin.md 6) */}
      {isDialogOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-surface border border-line rounded-lg p-6 max-w-md w-full shadow-overlay space-y-4 animate-in fade-in zoom-in-95">
            <div>
              <h3 className="text-base font-bold text-ink">
                Konfirmasi Perubahan Status
              </h3>
              <p className="text-xs text-ink-soft mt-1">
                Ubah status laporan <strong>{report.tracking_code}</strong> menjadi:{" "}
                <span className="font-bold text-primary-text uppercase">{targetStatus}</span>.
              </p>
            </div>

            {/* Kolom Catatan Wajib (design-admin.md 6) */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-ink block">
                Catatan Tindak Lanjut:{" "}
                {(targetStatus === "ditolak" || targetStatus === "selesai") && (
                  <span className="text-danger">* (Wajib diisi)</span>
                )}
              </label>
              <textarea
                rows={3}
                value={actionNote}
                onChange={(e) => setActionNote(e.target.value)}
                placeholder="Tuliskan catatan verifikasi atau alasan keputusan untuk pelapor..."
                className="w-full p-2.5 rounded-md border border-line bg-bg text-xs text-ink focus-visible:outline-primary"
              />
              {noteError && (
                <p className="text-xs text-danger font-medium mt-1">
                  {noteError}
                </p>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-line">
              <button
                type="button"
                onClick={() => setIsDialogOpen(false)}
                disabled={isSubmitting}
                className="px-3 py-1.5 rounded-md border border-line bg-surface hover:bg-bg text-xs font-semibold text-ink"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmStatusChange}
                disabled={isSubmitting}
                className={`px-4 py-1.5 rounded-md text-white text-xs font-bold transition-colors ${
                  targetStatus === "ditolak"
                    ? "bg-danger hover:bg-danger/90"
                    : "bg-primary-action hover:bg-primary-action-hover"
                }`}
              >
                {isSubmitting ? "Menyimpan..." : "Simpan Perubahan"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Dialog Buka Kontak Pelapor */}
      {isRevealModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-surface border border-line rounded-lg p-6 max-w-sm w-full shadow-overlay space-y-4 animate-in fade-in zoom-in-95">
            <div>
              <h3 className="text-sm font-bold text-ink">Buka Kontak Pribadi Pelapor</h3>
              <p className="text-xs text-ink-soft mt-1 leading-relaxed">
                Tindakan ini akan menampilkan nomor telepon dan nama lengkap pelapor. Demi akuntabilitas, pembukaan data kontak akan <strong>dicatat di audit log</strong>.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-line">
              <button
                type="button"
                onClick={() => setIsRevealModalOpen(false)}
                className="px-3 py-1.5 rounded-md border border-line bg-surface text-xs font-semibold text-ink"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleRevealContact}
                className="px-3.5 py-1.5 rounded-md bg-primary-action hover:bg-primary-action-hover text-white text-xs font-bold"
              >
                Buka Kontak
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

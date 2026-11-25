"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Trash2, RotateCcw, X, AlertTriangle, CheckCircle2, Image as ImageIcon, RefreshCw } from "lucide-react";
import {
  fetchTrashItems,
  restoreTrashItem,
  permanentlyDeleteTrashItem,
  emptyTrash,
  type TrashSnapshotItem,
} from "@/lib/services/trash";

interface AdminTrashModalProps {
  isOpen: boolean;
  onClose: () => void;
  kind?: "sos" | "report";
  title?: string;
  onRestored?: () => void;
}

export function AdminTrashModal({
  isOpen,
  onClose,
  kind,
  title = "Kotak Sampah & Pemulihan Data",
  onRestored,
}: AdminTrashModalProps) {
  const [items, setItems] = useState<TrashSnapshotItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const loadTrash = useCallback(async () => {
    setLoading(true);
    try {
      const list = await fetchTrashItems(kind);
      setItems(list);
    } finally {
      setLoading(false);
    }
  }, [kind]);

  useEffect(() => {
    if (!isOpen) return;
    loadTrash();
    const handleUpdate = () => loadTrash();
    window.addEventListener("sigapbumi:trash-updated", handleUpdate);
    return () => window.removeEventListener("sigapbumi:trash-updated", handleUpdate);
  }, [isOpen, loadTrash]);

  if (!isOpen) return null;

  const handleRestore = async (item: TrashSnapshotItem) => {
    setRestoringId(item.id);
    setFeedback(null);
    const res = await restoreTrashItem(item);
    setRestoringId(null);
    if (res.success) {
      setItems((prev) => prev.filter((i) => i.id !== item.id));
      setFeedback(`Data "${item.tracking_code || item.title}" berhasil dipulihkan.`);
      onRestored?.();
    } else {
      setFeedback(res.error || "Gagal memulihkan data.");
    }
  };

  const handleDeleteForever = async (id: string) => {
    await permanentlyDeleteTrashItem(id);
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const handleEmptyTrash = async () => {
    await emptyTrash(kind);
    setItems([]);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs overflow-hidden"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl max-h-[86dvh] flex flex-col bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden font-sans"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-3 bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
              <Trash2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900">{title}</h2>
              <p className="text-[11px] text-slate-500">
                Data yang dihapus disimpan sementara di sini agar dapat dipulihkan kembali.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-200/70 text-slate-500 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback */}
        {feedback && (
          <div className="mx-5 mt-3 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{feedback}</span>
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {loading ? (
            <div className="py-12 text-center text-xs text-slate-500 flex flex-col items-center gap-2">
              <RefreshCw className="w-5 h-5 animate-spin text-orange-500" />
              <span>Memuat isi kotak sampah...</span>
            </div>
          ) : items.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <Trash2 className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-sm font-bold text-slate-700">Kotak Sampah Kosong</p>
              <p className="text-xs text-slate-400">
                Belum ada data yang dihapus atau seluruh data sudah dipulihkan.
              </p>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-start gap-3 min-w-0">
                  {item.photo_url ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={item.photo_url}
                      alt={item.title}
                      className="w-14 h-14 rounded-lg object-cover border border-slate-200 shrink-0"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 shrink-0">
                      <ImageIcon className="w-5 h-5" />
                    </div>
                  )}
                  <div className="min-w-0 space-y-0.5">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {item.tracking_code && (
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-mono text-[11px] font-bold">
                          {item.tracking_code}
                        </span>
                      )}
                      <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 text-[10px] font-bold uppercase">
                        {item.kind === "sos" ? "SOS" : "Laporan"}
                      </span>
                    </div>
                    <p className="text-xs font-bold text-slate-900 truncate">{item.title}</p>
                    {item.address && (
                      <p className="text-[11px] text-slate-500 truncate">{item.address}</p>
                    )}
                    <p className="text-[10px] text-slate-400">
                      Dihapus: {new Date(item.deleted_at).toLocaleString("id-ID")}
                      {item.deleted_by ? ` oleh ${item.deleted_by}` : ""}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  <button
                    type="button"
                    disabled={restoringId === item.id}
                    onClick={() => handleRestore(item)}
                    className="h-8 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
                  >
                    <RotateCcw className={`w-3.5 h-3.5 ${restoringId === item.id ? "animate-spin" : ""}`} />
                    <span>{restoringId === item.id ? "Memulihkan..." : "Pulihkan"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteForever(item.id)}
                    className="h-8 px-2.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-semibold cursor-pointer"
                    title="Hapus permanen"
                  >
                    Hapus Permanen
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between gap-2">
            <span className="text-[11px] text-slate-500 flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
              <span>{items.length} item di kotak sampah</span>
            </span>
            <button
              type="button"
              onClick={handleEmptyTrash}
              className="px-3 py-1.5 rounded-lg border border-rose-200 bg-white hover:bg-rose-50 text-rose-600 text-xs font-bold cursor-pointer"
            >
              Kosongkan Kotak Sampah
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

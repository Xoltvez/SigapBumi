"use client";

import type { TrashSnapshotItem } from "@/app/api/admin/trash/route";
import { LOCAL_STORAGE_DELETED_KEY, invalidateLiveReportsCache } from "@/lib/services/reports";
import { LOCAL_STORAGE_DELETED_SOS_KEY, invalidateLiveSosCache } from "@/lib/services/sos";

export type { TrashSnapshotItem };

export const LOCAL_STORAGE_TRASH_KEY = "sigapbumi_admin_trash";

export function getLocalTrash(kind?: "sos" | "report"): TrashSnapshotItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_TRASH_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return kind ? parsed.filter((i: TrashSnapshotItem) => i.kind === kind) : parsed;
  } catch {
    return [];
  }
}

export function saveLocalTrash(items: TrashSnapshotItem[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LOCAL_STORAGE_TRASH_KEY, JSON.stringify(items.slice(0, 100)));
  } catch {}
}

export function addItemsToLocalTrash(newItems: TrashSnapshotItem[]): void {
  if (typeof window === "undefined" || newItems.length === 0) return;
  const current = getLocalTrash();
  const newIds = new Set(newItems.map((n) => n.id));
  const merged = [...newItems, ...current.filter((c) => !newIds.has(c.id))];
  saveLocalTrash(merged);
  window.dispatchEvent(new CustomEvent("sigapbumi:trash-updated"));
}

export async function fetchTrashItems(kind?: "sos" | "report"): Promise<TrashSnapshotItem[]> {
  const local = getLocalTrash();
  const map = new Map<string, TrashSnapshotItem>();
  local.forEach((item) => map.set(item.id, item));

  try {
    const res = await fetch(`/api/admin/trash${kind ? `?kind=${kind}` : ""}`, { cache: "no-store" });
    if (res.ok) {
      const json = await res.json();
      if (json?.success && Array.isArray(json.items)) {
        json.items.forEach((item: TrashSnapshotItem) => map.set(item.id, item));
      }
    }
  } catch {}

  const all = Array.from(map.values()).sort(
    (a, b) => new Date(b.deleted_at).getTime() - new Date(a.deleted_at).getTime()
  );
  return kind ? all.filter((i) => i.kind === kind) : all;
}

export async function restoreTrashItem(
  item: TrashSnapshotItem
): Promise<{ success: boolean; error?: string }> {
  // 1. Bersihkan ID / tracking_code dari daftar deleted lokal
  if (typeof window !== "undefined") {
    try {
      const repDelRaw = localStorage.getItem(LOCAL_STORAGE_DELETED_KEY);
      if (repDelRaw) {
        const arr: string[] = JSON.parse(repDelRaw);
        localStorage.setItem(
          LOCAL_STORAGE_DELETED_KEY,
          JSON.stringify(arr.filter((x) => x !== item.id && x !== item.tracking_code))
        );
      }
    } catch {}

    try {
      const sosDelRaw = localStorage.getItem(LOCAL_STORAGE_DELETED_SOS_KEY);
      if (sosDelRaw) {
        const arr: string[] = JSON.parse(sosDelRaw);
        localStorage.setItem(
          LOCAL_STORAGE_DELETED_SOS_KEY,
          JSON.stringify(arr.filter((x) => x !== item.id && x !== item.tracking_code))
        );
      }
    } catch {}
  }

  // 2. Restore ke Supabase via server API (kirim snapshot penuh sebagai jaminan)
  try {
    const res = await fetch("/api/admin/trash", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "restore", id: item.id, snapshot: item }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return { success: false, error: err?.error || "Gagal memulihkan data." };
    }
  } catch {
    return { success: false, error: "Gagal terhubung ke server." };
  }

  // 3. Hapus dari local trash
  const remaining = getLocalTrash().filter((t) => t.id !== item.id);
  saveLocalTrash(remaining);

  invalidateLiveReportsCache();
  invalidateLiveSosCache();

  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("sigapbumi:trash-updated"));
    window.dispatchEvent(new CustomEvent("sigapbumi:sos-updated", { detail: { id: item.id } }));
    window.dispatchEvent(new CustomEvent("sigapbumi:report-updated", { detail: { id: item.id } }));
    window.dispatchEvent(new Event("storage"));
  }

  return { success: true };
}

export async function permanentlyDeleteTrashItem(id: string): Promise<void> {
  const remaining = getLocalTrash().filter((t) => t.id !== id);
  saveLocalTrash(remaining);

  try {
    await fetch(`/api/admin/trash?id=${encodeURIComponent(id)}`, { method: "DELETE" });
  } catch {}

  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("sigapbumi:trash-updated"));
  }
}

export async function emptyTrash(kind?: "sos" | "report"): Promise<void> {
  const remaining = kind ? getLocalTrash().filter((t) => t.kind !== kind) : [];
  saveLocalTrash(remaining);

  try {
    await fetch(`/api/admin/trash?emptyAll=true${kind ? `&kind=${kind}` : ""}`, {
      method: "DELETE",
    });
  } catch {}

  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("sigapbumi:trash-updated"));
  }
}

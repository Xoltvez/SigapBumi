"use client";

export interface UserSession {
  id: string;
  full_name: string;
  email: string;
  phone_number?: string;
  role?: string;
  created_at?: string;
  loginAt?: string;
}

const STORAGE_KEY = "sigapbumi_current_user";
const AUTH_EVENT = "sigapbumi_auth_change";

export function getCurrentUser(): UserSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as UserSession;
  } catch (err) {
    console.warn("Gagal membaca session auth user:", err);
    return null;
  }
}

export function setCurrentUser(user: UserSession): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    window.dispatchEvent(new Event(AUTH_EVENT));
  } catch (err) {
    console.warn("Gagal menyimpan session auth user:", err);
  }
}

export function logoutUser(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new Event(AUTH_EVENT));
  } catch (err) {
    console.warn("Gagal logout user:", err);
  }
}

export function subscribeToAuth(callback: (user: UserSession | null) => void): () => void {
  if (typeof window === "undefined") return () => {};

  const handleUpdate = () => {
    callback(getCurrentUser());
  };

  window.addEventListener(AUTH_EVENT, handleUpdate);
  window.addEventListener("storage", handleUpdate);

  return () => {
    window.removeEventListener(AUTH_EVENT, handleUpdate);
    window.removeEventListener("storage", handleUpdate);
  };
}

export function getFirstName(fullName?: string): string {
  if (!fullName) return "Warga";

  // 1. Pisahkan camelCase jika ada (misal FaizAzzahra -> Faiz Azzahra)
  const withSpaces = fullName.replace(/([a-z])([A-Z])/g, "$1 $2");

  // 2. Ambil kata pertama berdasarkan pemisah spasi, titik, underscore, tanda minus
  let first = withSpaces.trim().split(/[\s._-]+/)[0] || "";

  // 3. Buang angka (misal Faizazzahra88 -> Faizazzahra)
  first = first.replace(/[0-9]/g, "").trim();

  // 4. Deteksi gabungan nama depan populer jika berasal dari username email tanpa spasi
  const compoundMatch = first.match(
    /^(faiz|muhamm?ad|ahmad|siti|nur|adi|dwi|tri|arya|bayu|budi|rizky|dimas|agus|dewi|putri|eka|fajar|ilham|reza|yoga|kevin|david)(.+)$/i
  );
  if (compoundMatch && compoundMatch[1]) {
    first = compoundMatch[1];
  }

  if (!first) return "Warga";

  // Format Titlecase
  return first.charAt(0).toUpperCase() + first.slice(1).toLowerCase();
}

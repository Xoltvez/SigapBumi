import { createBrowserClient } from "@supabase/ssr";

// Menggunakan environment variables jika tersedia, atau fallback aman saat build static prerender
const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder-project.supabase.co";
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key";

export function createClient() {
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}

// Export singleton instance for client-side reuse
export const supabase = createClient();

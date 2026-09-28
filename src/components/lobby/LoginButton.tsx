"use client";
import { createSupabaseBrowser } from "@/lib/supabase/client";

export function LoginButton({ next = "/lobby" }: { next?: string }) {
  const login = () =>
    createSupabaseBrowser().auth.signInWithOAuth({
      provider: "discord",
      options: { redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`, scopes: "identify" },
    });
  return (
    <button type="button" onClick={login} className="rounded-full bg-[#5865F2] px-6 py-3 font-bold text-white">
      Discord でログイン
    </button>
  );
}

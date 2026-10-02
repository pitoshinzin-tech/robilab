"use client";
import { createSupabaseBrowser } from "@/lib/supabase/client";

/** Discord でログイン。variant="ghost" は案内の文の横に置く弱い形(/aim。主ボタンより目立たせない)。 */
export function LoginButton({ next = "/lobby", variant = "discord" }: { next?: string; variant?: "discord" | "ghost" }) {
  const login = () =>
    createSupabaseBrowser().auth.signInWithOAuth({
      provider: "discord",
      options: { redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`, scopes: "identify" },
    });
  // ghost は ui/button の ghost sm と同じ見た目(ここで ui/button を import すると、/my などのチャンクの分け方が変わって JS が増えるため、クラスだけ写す)
  if (variant === "ghost") {
    return (
      <button type="button" onClick={() => void login()}
        className="inline-flex h-11 cursor-pointer items-center rounded-rl-pill px-4 text-sm font-bold text-rl-muted underline-offset-4 transition-colors duration-(--rl-dur-fast) hover:text-rl-text hover:underline active:translate-y-px">
        Discord でログイン
      </button>
    );
  }
  return (
    <button type="button" onClick={login} className="rounded-full bg-[#5865F2] px-6 py-3 font-bold text-white">
      Discord でログイン
    </button>
  );
}

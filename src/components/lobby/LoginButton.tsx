"use client";
import { useEffect, useState } from "react";
import { LoaderCircle } from "lucide-react";
import { createSupabaseBrowser } from "@/lib/supabase/client";
import { buttonVariants } from "@/components/ui/button-link";
import { cn } from "@/lib/utils";

/**
 * Discord でログイン。押したら移動するまで押せない(2 回押しても 1 回だけ始める)。失敗したら押せる状態に戻す。
 * variant="ghost" は案内の文の横に置く弱い形(/aim。主ボタンより目立たせない)。
 * base-ui の Button(ui/button)は import しない:/aim・/my のチャンクの分け方が変わって JS が増えるため。
 * 見た目は buttonVariants、loading の形は ui/button と同じ(元の文字を見えないまま残すので幅が変わらない)。
 */
export function LoginButton({ next = "/lobby", variant = "discord", size, className }: {
  next?: string; variant?: "discord" | "ghost"; size?: "md" | "lg"; className?: string;
}) {
  const [pending, setPending] = useState(false);
  // Discord へ移ったあと「戻る」で bfcache から戻ると pending のまま止まるので、そのときだけ押せる状態に戻す
  useEffect(() => {
    const onPageShow = (e: PageTransitionEvent) => { if (e.persisted) setPending(false); };
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, []);
  const login = () => {
    if (pending) return;
    setPending(true);
    createSupabaseBrowser()
      .auth.signInWithOAuth({
        provider: "discord",
        options: { redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`, scopes: "identify" },
      })
      .then(({ error }) => { if (error) setPending(false); }, () => setPending(false));
  };
  const label = "Discord でログイン";
  return (
    <button
      type="button"
      onClick={login}
      disabled={pending}
      aria-busy={pending || undefined}
      className={cn(buttonVariants({ variant, size: variant === "ghost" ? "sm" : (size ?? "md") }), className)}
    >
      {pending ? (
        <>
          <span aria-hidden className="invisible">{label}</span>
          <span className="absolute inset-0 inline-flex items-center justify-center gap-2">
            <LoaderCircle aria-hidden className="animate-spin motion-reduce:animate-none" />
            Discord に移動中…
          </span>
        </>
      ) : (
        label
      )}
    </button>
  );
}

"use client";
import { useEffect, useState } from "react";
import type { PublicCardData } from "@/lib/card-view";

/** 名刺カードのプレビューと「画像を保存」。入力が止まってから 0.8 秒後に作り直す。 */
export function CardPreview({ data }: { data: PublicCardData | null }) {
  const [url, setUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const body = data ? JSON.stringify(data) : null;

  useEffect(() => {
    if (!body) return;
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const res = await fetch("/api/card-image", { method: "POST", body, headers: { "Content-Type": "application/json" }, signal: ctrl.signal });
        if (!res.ok) throw new Error(String(res.status));
        const next = URL.createObjectURL(await res.blob());
        setUrl((old) => { if (old) URL.revokeObjectURL(old); return next; });
        setFailed(false);
      } catch {
        if (!ctrl.signal.aborted) setFailed(true);
      }
    }, 800);
    return () => { clearTimeout(t); ctrl.abort(); };
  }, [body]);

  return (
    <section className="grid gap-3">
      <h2 className="font-bold">名刺カード</h2>
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element -- blob URL のため next/image は使えない
        <img src={url} alt="名刺カードのプレビュー" width={1200} height={630} className="w-full rounded-xl border border-[var(--rl-border)]" />
      ) : (
        <div className="aspect-[1200/630] w-full rounded-xl bg-white/5" />
      )}
      {failed && <p role="alert" className="text-sm text-[var(--rl-magenta)]">画像を作れませんでした。</p>}
      {url && (
        <a href={url} download="robilab-my-card.png" className="justify-self-start rounded-full bg-[var(--rl-cyan)] px-6 py-3 font-bold text-[#0a0c16]">
          画像を保存
        </a>
      )}
    </section>
  );
}

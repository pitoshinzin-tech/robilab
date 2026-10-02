"use client";
import { useEffect, useState } from "react";
import { Check, Download } from "lucide-react";
import type { PublicCardData } from "@/lib/card-view";
import { cn } from "@/lib/utils";
import { ButtonAnchor } from "@/components/ui/button-link";
import { Card } from "@/components/ui/card";
import { FieldError } from "@/components/ui/field";
import { Skeleton } from "@/components/ui/skeleton";

const layer = "col-start-1 row-start-1 inline-flex items-center justify-center gap-2";

/**
 * 名刺カードのプレビューと「名刺の画像を保存」。入力が止まってから 0.8 秒後に作り直す。
 * 保存はタイプが入っているときだけ主ボタン。タイプがないときは「診断する」が主ボタンなので、ここは secondary にし、
 * 名刺のコードが仮の「????」であることを書き添える(本当の値に見せない)。
 * (追補 6 章)作り直した画像は上から 2 段(120ms)で重ねて出し、下に 1 つ前の画像を残す(明るさが変わらない)。
 * rewrite が false のあいだ(開いたあと、まだ入力していないとき)は書き換えの動きを付けない。
 */
export function CardPreview({ data, rewrite = false, hasType = true }: { data: PublicCardData | null; rewrite?: boolean; hasType?: boolean }) {
  const [pair, setPair] = useState<{ url: string | null; prev: string | null }>({ url: null, prev: null });
  const [failed, setFailed] = useState(false);
  // (動きの参考 009)保存を押した画像の URL。画像が作り直されると元の文字に戻る(時間では戻さない)
  const [savedUrl, setSavedUrl] = useState<string | null>(null);
  const url = pair.url;
  const saved = url !== null && savedUrl === url;
  const body = data ? JSON.stringify(data) : null;

  useEffect(() => {
    if (!body) return;
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const res = await fetch("/api/card-image", { method: "POST", body, headers: { "Content-Type": "application/json" }, signal: ctrl.signal });
        if (!res.ok) throw new Error(String(res.status));
        const next = URL.createObjectURL(await res.blob());
        setPair((p) => { if (p.prev) URL.revokeObjectURL(p.prev); return { url: next, prev: p.url }; });
        setFailed(false);
      } catch {
        if (!ctrl.signal.aborted) setFailed(true);
      }
    }, 800);
    return () => { clearTimeout(t); ctrl.abort(); };
  }, [body]);

  return (
    <Card as="section" aria-labelledby="my-card-preview" className="grid gap-4">
      <h2 id="my-card-preview" className="text-xl font-bold">名刺カード</h2>
      {url ? (
        <div className="relative">
          {/* eslint-disable-next-line @next/next/no-img-element -- blob URL のため next/image は使えない */}
          {pair.prev && <img aria-hidden src={pair.prev} alt="" width={1200} height={630} className="absolute inset-0 h-auto w-full rounded-rl-sm border border-rl-line" />}
          {/* eslint-disable-next-line @next/next/no-img-element -- blob URL のため next/image は使えない */}
          <img key={url} src={url} alt="名刺カードのプレビュー" width={1200} height={630}
            className={cn("relative h-auto w-full rounded-rl-sm border border-rl-line", rewrite && pair.prev && "rl-rewrite")} />
        </div>
      ) : (
        <Skeleton className="aspect-[1200/630] w-full" />
      )}
      {!hasType && <p className="text-sm text-rl-muted [word-break:auto-phrase]">タイプは診断するまで「????」と出ます。</p>}
      {failed && <FieldError>画像を作れませんでした。入力を少し変えると、作り直します。</FieldError>}
      {url && (
        <ButtonAnchor href={url} download="robilab-my-card.png" variant={hasType ? "primary" : "secondary"} className="justify-self-start" onClick={() => setSavedUrl(url)}>
          {/* 元の文字と「保存しました」を同じマスに重ね、幅を変えない */}
          <span className="grid">
            <span className={cn(layer, saved && "invisible")}><Download aria-hidden />名刺の画像を保存</span>
            <span className={cn(layer, !saved && "invisible")}>{saved && <Check aria-hidden data-rl-touched="" className="rl-draw-check" />}保存しました</span>
          </span>
        </ButtonAnchor>
      )}
    </Card>
  );
}

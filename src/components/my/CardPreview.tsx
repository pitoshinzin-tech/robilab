"use client";
import { useEffect, useRef, useState } from "react";
import { Check, Download } from "lucide-react";
import { toPublicCardData, type PublicCardData } from "@/lib/card-view";
import { browserStorage, loadLocal } from "@/lib/my-settings-store";
import { emptyMySettings } from "@/lib/my-settings";
import { startEarlyCardImage, takeEarlyCardImage } from "@/lib/card-early";
import { cn } from "@/lib/utils";
import { ButtonAnchor } from "@/components/ui/button-link";
import { Card } from "@/components/ui/card";
import { FieldError } from "@/components/ui/field";
import { Skeleton } from "@/components/ui/skeleton";

const layer = "col-start-1 row-start-1 inline-flex items-center justify-center gap-2";

// 表示速度(docs/design/perf.md):このファイルが読み込まれた時に、最初の名刺の画像を頼み始める(src/lib/card-early.ts)。
// 本文は useMySettings の最初の値(この端末の保存、なければ空)と同じ作り方。画面の部品が描かれるのを待たない分、画像が早く届く。
if (typeof window !== "undefined") {
  try {
    startEarlyCardImage(JSON.stringify(toPublicCardData(loadLocal(browserStorage()) ?? emptyMySettings())));
  } catch {
    // 保存が読めない環境では、今までどおり描かれてから頼む
  }
}

/**
 * 名刺カードのプレビューと「名刺の画像を保存」。開いた直後はすぐ作り、そのあとは入力が止まってから 0.8 秒後に作り直す。
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
  const live = useRef<string[]>([]);

  // 表示速度(docs/design/perf.md):まだ 1 枚も出ていないとき(開いた直後)は待たずに作る。入力の後は 0.8 秒待つ(今までどおり)
  const first = url === null;
  useEffect(() => {
    if (!body) return;
    const ctrl = new AbortController();
    // 開いた直後は、先に頼んでおいた画像(本文が同じとき)を使う
    const early = first ? takeEarlyCardImage(body) : null;
    const t = setTimeout(async () => {
      try {
        let blob = early ? await early : null;
        if (ctrl.signal.aborted) return;
        if (!blob) {
          const res = await fetch("/api/card-image", { method: "POST", body, headers: { "Content-Type": "application/json" }, signal: ctrl.signal });
          if (!res.ok) throw new Error(String(res.status));
          blob = await res.blob();
        }
        const next = URL.createObjectURL(blob);
        // 画面に残っている 2 つ(今と 1 つ前)を覚えておき、閉じたときに消す。それより古いものは下の setPair で消している
        live.current = [...live.current.slice(-1), next];
        setPair((p) => { if (p.prev) URL.revokeObjectURL(p.prev); return { url: next, prev: p.url }; });
        setFailed(false);
      } catch {
        if (!ctrl.signal.aborted) setFailed(true);
      }
    }, first ? 0 : 800);
    return () => { clearTimeout(t); ctrl.abort(); };
    // first は body が変わった時の値を使う(画像が届いて first が変わっても作り直さない)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [body]);

  // 画面を離れたら、最後に作った画像の blob URL を消す(見た目は変わらない)
  useEffect(() => {
    const urls = live;
    return () => { urls.current.forEach((u) => URL.revokeObjectURL(u)); urls.current = []; };
  }, []);

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

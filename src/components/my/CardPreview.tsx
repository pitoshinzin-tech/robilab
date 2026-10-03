"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Download, LoaderCircle } from "lucide-react";
import { buildCardView, type PublicCardData } from "@/lib/card-view";
import { cardSaveState } from "@/lib/card-face";
import { cn } from "@/lib/utils";
import { CardFace } from "@/components/card/CardFace";
import { ButtonAnchor, buttonVariants } from "@/components/ui/button-link";
import { Card } from "@/components/ui/card";
import { FieldError } from "@/components/ui/field";
import { Skeleton } from "@/components/ui/skeleton";

const layer = "col-start-1 row-start-1 inline-flex items-center justify-center gap-2";
const FILE_NAME = "robilab-my-card.png";

/** 名刺の HTML の面(入れ物の幅に合わせて 1200×630 の割合で描く) */
function Face({ body, className, hidden = false }: { body: string; className?: string; hidden?: boolean }) {
  const view = useMemo(() => buildCardView(JSON.parse(body) as PublicCardData), [body]);
  return (
    <div aria-hidden={hidden || undefined} className={cn("absolute inset-0 overflow-hidden rounded-rl-sm border border-rl-line [container-type:inline-size]", className)}>
      <CardFace view={view} />
    </div>
  );
}

/**
 * 名刺カードのプレビューと「名刺の画像を保存」。
 * 表示速度(docs/design/perf.md):プレビューは画像と同じ組みの HTML(CardFace)で、開いた直後から描く(前は /api/card-image の PNG が届くまで Skeleton で、LCP が 4 秒前後だった)。
 * 保存する PNG は今までどおり裏で作る(開いた直後はすぐ、入力のあとは止まってから 0.8 秒後)。
 * 今の入力の PNG が届くまで、保存のボタンは「画像を準備中…」で押せない(押してから待って保存すると、Safari などでユーザーの操作と見なされず止まることがある)。届いたら押した時にすぐ保存する。
 * 入力が正しくない間(data が null)は、前の PNG を捨てて保存できないようにする(プレビューは直前の正しい内容のまま)。
 * プレビューの描き直しも今までと同じ間(入力が止まってから 0.8 秒)で、上から 2 段(120ms)で重ねて出し、下に 1 つ前を残す。
 * 保存はタイプが入っているときだけ主ボタン。タイプがないときは「診断する」が主ボタンなので、ここは secondary にし、
 * 名刺のコードが仮の「????」であることを書き添える(本当の値に見せない)。
 * rewrite が false のあいだ(開いたあと、まだ入力していないとき)は書き換えの動きを付けない。
 */
export function CardPreview({ data, rewrite = false, hasType = true }: { data: PublicCardData | null; rewrite?: boolean; hasType?: boolean }) {
  const body = data ? JSON.stringify(data) : null;
  // プレビューに出している本文(今と 1 つ前)。開いた直後は待たずに出す
  const [faces, setFaces] = useState<{ cur: string | null; prev: string | null }>(() => ({ cur: body, prev: null }));
  // 保存用の PNG(blob URL)と、その元の本文
  const [png, setPng] = useState<{ url: string; body: string } | null>(null);
  const [failed, setFailed] = useState(false);
  // (動きの参考 009)保存を押した画像の URL。画像が作り直されると元の文字に戻る(時間では戻さない)
  const [savedUrl, setSavedUrl] = useState<string | null>(null);
  const live = useRef<string[]>([]);
  // 入力が正しくなくなったら、前の PNG を捨てる(描いている間に前の値を直す形。blob URL は下の effect で消す)
  if (body === null && png !== null) setPng(null);
  const state = cardSaveState({ pngBody: png?.body ?? null, body, failed });
  const url = state === "ready" && png ? png.url : null;
  const saved = url !== null && savedUrl === url;

  // まだ 1 枚も作っていないとき(開いた直後)は待たずに作る。入力の後は 0.8 秒待つ(今までどおり)
  const first = png === null;
  useEffect(() => {
    if (!body) {
      // 捨てた PNG の blob URL を消す
      live.current.forEach((u) => URL.revokeObjectURL(u));
      live.current = [];
      return;
    }
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      setFaces((f) => (f.cur === body ? f : { cur: body, prev: f.cur }));
      setFailed(false);
      try {
        const res = await fetch("/api/card-image", { method: "POST", body, headers: { "Content-Type": "application/json" }, signal: ctrl.signal });
        if (!res.ok) throw new Error(String(res.status));
        const next = URL.createObjectURL(await res.blob());
        // 画面に残っている 2 つ(今と 1 つ前)を覚えておき、閉じたときに消す。それより古いものは消す
        const old = live.current.length > 1 ? live.current[0] : null;
        if (old) URL.revokeObjectURL(old);
        live.current = [...live.current.slice(-1), next];
        setPng({ url: next, body });
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
      {faces.cur ? (
        <div className="relative aspect-[1200/630] w-full">
          {faces.prev && <Face key={`p-${faces.prev}`} body={faces.prev} hidden />}
          <Face key={`c-${faces.cur}`} body={faces.cur} className={cn(rewrite && faces.prev && "rl-rewrite")} />
        </div>
      ) : (
        <Skeleton className="aspect-[1200/630] w-full" />
      )}
      {!hasType && <p className="text-sm text-rl-muted [word-break:auto-phrase]">タイプは診断するまで「????」と出ます。</p>}
      {failed && <FieldError>画像を作れませんでした。入力を少し変えると、作り直します。</FieldError>}
      {faces.cur && (url ? (
        <ButtonAnchor href={url} download={FILE_NAME} variant={hasType ? "primary" : "secondary"} className="justify-self-start" onClick={() => setSavedUrl(url)}>
          {/* 元の文字・「保存しました」・「画像を準備中…」を同じマスに重ね、幅を変えない */}
          <span className="grid">
            <span className={cn(layer, saved && "invisible")}><Download aria-hidden />名刺の画像を保存</span>
            <span className={cn(layer, !saved && "invisible")}>{saved && <Check aria-hidden data-rl-touched="" className="rl-draw-check" />}保存しました</span>
            <span aria-hidden className={cn(layer, "invisible")}><LoaderCircle aria-hidden />画像を準備中…</span>
          </span>
        </ButtonAnchor>
      ) : (
        // PNG がまだ(作っている・作れなかった・入力が正しくない)間は押せない。ボタンの形はそのまま
        <button type="button" disabled className={cn(buttonVariants({ variant: hasType ? "primary" : "secondary" }), "justify-self-start")}>
          <span className="grid">
            <span className={cn(layer, state !== "preparing" && "invisible")} aria-hidden={state !== "preparing" || undefined}><LoaderCircle aria-hidden className="motion-safe:animate-spin" />画像を準備中…</span>
            <span className={cn(layer, state === "preparing" && "invisible")} aria-hidden={state === "preparing" || undefined}><Download aria-hidden />名刺の画像を保存</span>
            <span aria-hidden className={cn(layer, "invisible")}><Check aria-hidden />保存しました</span>
          </span>
        </button>
      ))}
    </Card>
  );
}

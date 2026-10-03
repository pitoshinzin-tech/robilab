"use client";
import { useEffect, useMemo, useRef, useState, type MouseEvent } from "react";
import { Check, Download } from "lucide-react";
import { buildCardView, type PublicCardData } from "@/lib/card-view";
import { cn } from "@/lib/utils";
import { CardFace } from "@/components/card/CardFace";
import { ButtonAnchor } from "@/components/ui/button-link";
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
      <CardFace view={view} label="名刺カードのプレビュー" />
    </div>
  );
}

/**
 * 名刺カードのプレビューと「名刺の画像を保存」。
 * 表示速度(docs/design/perf.md):プレビューは画像と同じ組みの HTML(CardFace)で、開いた直後から描く(前は /api/card-image の PNG が届くまで Skeleton で、LCP が 4 秒前後だった)。
 * 保存する PNG は今までどおり裏で作る(開いた直後はすぐ、入力のあとは止まってから 0.8 秒後)。届く前に保存を押したら、届いてから保存する。
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
  const pending = useRef<{ body: string; promise: Promise<string | null> } | null>(null);
  const url = png?.url ?? null;
  const saved = url !== null && savedUrl === url;

  // まだ 1 枚も作っていないとき(開いた直後)は待たずに作る。入力の後は 0.8 秒待つ(今までどおり)
  const first = png === null;
  useEffect(() => {
    if (!body) return;
    const ctrl = new AbortController();
    let resolve: (u: string | null) => void = () => {};
    pending.current = { body, promise: new Promise((r) => { resolve = r; }) };
    const t = setTimeout(async () => {
      setFaces((f) => (f.cur === body ? f : { cur: body, prev: f.cur }));
      try {
        const res = await fetch("/api/card-image", { method: "POST", body, headers: { "Content-Type": "application/json" }, signal: ctrl.signal });
        if (!res.ok) throw new Error(String(res.status));
        const next = URL.createObjectURL(await res.blob());
        // 画面に残っている 2 つ(今と 1 つ前)を覚えておき、閉じたときに消す。それより古いものは消す
        const old = live.current.length > 1 ? live.current[0] : null;
        if (old) URL.revokeObjectURL(old);
        live.current = [...live.current.slice(-1), next];
        setPng({ url: next, body });
        setFailed(false);
        resolve(next);
      } catch {
        if (!ctrl.signal.aborted) setFailed(true);
        resolve(null);
      }
    }, first ? 0 : 800);
    return () => { clearTimeout(t); ctrl.abort(); resolve(null); };
    // first は body が変わった時の値を使う(画像が届いて first が変わっても作り直さない)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [body]);

  // 画面を離れたら、最後に作った画像の blob URL を消す(見た目は変わらない)
  useEffect(() => {
    const urls = live;
    return () => { urls.current.forEach((u) => URL.revokeObjectURL(u)); urls.current = []; };
  }, []);

  /** PNG が今の入力のものでなければ(まだ作っている・入力の直後)、できるのを待ってから保存する */
  const onSave = async (e: MouseEvent<HTMLAnchorElement>) => {
    if (png && png.body === body) { setSavedUrl(png.url); return; }
    e.preventDefault();
    const p = pending.current;
    const ready = p && p.body === body ? await p.promise : null;
    if (!ready) return;
    const a = document.createElement("a");
    a.href = ready;
    a.download = FILE_NAME;
    a.click();
    setSavedUrl(ready);
  };

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
      {faces.cur && (
        <ButtonAnchor href={url ?? "#"} download={FILE_NAME} variant={hasType ? "primary" : "secondary"} className="justify-self-start" onClick={onSave}>
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

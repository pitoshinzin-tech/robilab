"use client";
import { useEffect, useState } from "react";
import { SearchX, Share2, TriangleAlert } from "lucide-react";
import { applyFilter, compareWith, DEFAULT_HAND_LENGTH_CM, fitTarget, handFrom, NO_FILTER, rankMice, targetText, type MouseFilter } from "@/lib/mouse-fit";
import { recommendReason } from "@/lib/mouse-reason";
import type { MouseRow } from "@/lib/mouse-rows";
import { buildMouseShareText } from "@/lib/mouse-share";
import { buildXShareUrl } from "@/lib/share";
import { adoptServerIfLocalEmpty, browserStorage, loadLocal } from "@/lib/my-settings-store";
import { emptyMySettings, type MySettings } from "@/lib/my-settings";
import { useIsClient } from "@/lib/use-is-client";
import { cn } from "@/lib/utils";
import { loadSupabaseBrowser } from "@/lib/supabase/lazy";
import { HandSetup, GRIP_INFO } from "@/components/mouse/HandSetup";
import { MouseCard } from "@/components/mouse/MouseCard";
import { MouseFilters } from "@/components/mouse/MouseFilters";
import { FitOverlay } from "@/components/mouse/FitOverlay";
import { TopMouseRow } from "@/components/mouse/TopMouseRow";
import { ButtonAnchor, buttonVariants } from "@/components/ui/button-link";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { SectionHeading } from "@/components/ui/section-heading";
import { Skeleton } from "@/components/ui/skeleton";

const FIRST = 10;
const FIT_FIGURE_ID = "mouse-fit-figure";

/** 「手と重ねる」を押したとき、重ね図が画面の外なら見える所まで送る(1 列のスマホ・タブレットで、押した結果が見えないのを防ぐ) */
function revealFitFigure() {
  const el = document.getElementById(FIT_FIGURE_ID);
  if (!el) return;
  const r = el.getBoundingClientRect();
  if (r.top >= 0 && r.bottom <= window.innerHeight) return;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  el.scrollIntoView({ block: "center", behavior: reduce ? "auto" : "smooth" });
}

export function MouseClient({ pageUrl, mice }: { pageUrl: string; mice: MouseRow[] }) {
  const isClient = useIsClient();
  const [rev, setRev] = useState(0);
  // 保存できない環境(プライベートモードなど)で入力した値
  const [memoryHand, setMemoryHand] = useState<MySettings["hand"] | null>(null);
  const [notSaved, setNotSaved] = useState(false);
  const [editing, setEditing] = useState(false);
  const [filter, setFilter] = useState<MouseFilter>(NO_FILTER);
  const [showAll, setShowAll] = useState(false);
  // 追補 6 章:重ね図に出すマウス(なければ 1 位)
  const [overlayId, setOverlayId] = useState<string | null>(null);
  // サーバーの設定を確かめ中か(Supabase を使う環境だけ。確かめ終わるまで入力画面を出さない)
  const [serverPending, setServerPending] = useState(() => Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL));

  const settings = isClient ? loadLocal(browserStorage()) : null;
  void rev;
  const handRaw = memoryHand ?? settings?.hand ?? null;
  const handInfo = handFrom(handRaw);
  const hand = handInfo?.hand ?? null;
  const estimated = handInfo?.estimated ?? false;

  // ログインしていて、この端末にマイ設定がなければ、サーバーの設定を使う(/aim と同じ。サーバーへは送らない)
  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return;
    let cancelled = false;
    (async () => {
      const storage = browserStorage();
      if (loadLocal(storage)) return; // この端末に設定がある(下の表示条件では待たない)
      try {
        const supabase = await loadSupabaseBrowser();
        const { data } = await supabase.auth.getUser();
        if (!cancelled && data.user) {
          const { data: row, error } = await supabase.from("my_settings").select("data").maybeSingle();
          if (!cancelled && !error && adoptServerIfLocalEmpty(storage, row?.data ?? null)) setRev((n) => n + 1);
        }
      } catch {
        // 読めなくても、その場の入力で進める
      }
      if (!cancelled) setServerPending(false);
    })();
    return () => { cancelled = true; };
  }, []);

  const ranked = hand ? rankMice(hand, mice) : [];
  const filtered = applyFilter(ranked, filter);
  const shown = showAll ? filtered : filtered.slice(0, FIRST);

  const currentRef = settings?.devices.mouse ?? null;
  const currentMouse = currentRef && "id" in currentRef ? mice.find((m) => m.id === currentRef.id) ?? null : null;

  /*
   * 読み込み中の面。表示速度(docs/design/perf.md):入力画面(HandSetup)を見えないまま置いて同じ高さを取り、その上に Skeleton を重ねる。
   * 初めての人は確かめ終わると入力画面になるので、下の段(注意書き)が動かない(高さ 160px の Skeleton のときは CLS 0.258)。
   */
  const pendingView = (busy: boolean) => (
    <div aria-busy={busy || undefined} className="relative">
      <div aria-hidden inert className="invisible"><HandSetup initial={emptyMySettings().hand} onDone={() => {}} mice={mice} /></div>
      <Skeleton className="absolute inset-0 rounded-rl-md" />
    </div>
  );
  if (!isClient) return pendingView(false);
  // この端末が空で、サーバーの設定を確かめ中のときだけ待つ(入力画面のちらつきを防ぐ)
  if (!hand && !settings && serverPending) return pendingView(true);

  if (!hand || editing) {
    return (
      <HandSetup
        initial={handRaw ?? emptyMySettings().hand}
        onDone={(h, saved) => { setNotSaved(!saved); setMemoryHand(saved ? null : h); setEditing(false); setRev((n) => n + 1); }}
        onCancel={hand ? () => setEditing(false) : undefined}
        mice={mice}
      />
    );
  }

  const target = fitTarget(hand);
  const top3 = ranked.slice(0, 3).map((r) => ({ brand: r.mouse.brand, name: r.mouse.name }));
  const shareUrl = buildXShareUrl(buildMouseShareText(top3), pageUrl);
  // 追補 6 章:重ね図に出すマウス(選んでいなければ、絞り込んだ一覧の先頭。0 件なら 1 位)
  const overlay = ranked.find((r) => r.mouse.id === overlayId)?.mouse ?? filtered[0]?.mouse ?? ranked[0]?.mouse;
  const overlayName = overlay?.name ?? "";

  return (
    <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)] lg:items-start">
      {/* 左の列はスクロールしても残す。画面より高いときは列の中でスクロールできる(絞り込みが画面の下で切れないように) */}
      <div className="grid gap-6 lg:sticky lg:top-6 lg:max-h-[calc(100svh-48px)] lg:overflow-y-auto">
        <Card as="section" aria-labelledby="mouse-target" className="grid gap-4">
          <h2 id="mouse-target" className="text-xl font-bold">あなたの目安</h2>
          <p className="text-sm text-rl-muted">
            {GRIP_INFO[hand.grip].label}・手の長さ:{estimated ? `未入力(平均 ${DEFAULT_HAND_LENGTH_CM}cm で計算)` : `${hand.lengthCm}cm`}{hand.widthCm !== null && `・幅 ${hand.widthCm}cm`}
          </p>
          <p className="text-base"><span className="font-bold text-rl-highlight">{targetText(target)}</span> くらいのマウス</p>
          {/* 追補 6 章:実寸の重ね図(手の設定のすぐ横) */}
          {overlay && (
            <div id={FIT_FIGURE_ID} className="scroll-mt-6">
              <FitOverlay handLengthCm={hand.lengthCm} handWidthCm={hand.widthCm} mouse={{ id: overlay.id, name: overlayName, lengthMm: overlay.lengthMm, widthMm: overlay.widthMm }} />
            </div>
          )}
          {estimated && <p className="text-sm text-rl-muted">手の長さを入れていないので、平均的な大きさ({DEFAULT_HAND_LENGTH_CM}cm)で出しています。測って入れると、あなたの手に合わせられます。</p>}
          {hand.widthCm === null && <p className="text-sm text-rl-muted">手の幅も入れると精度が上がります。</p>}
          {notSaved && <p className="flex items-start gap-2 text-sm text-rl-warning"><TriangleAlert aria-hidden className="mt-0.5 size-4 shrink-0" />この端末には保存できませんでした(この画面を閉じると消えます)。</p>}
          <button type="button" className={cn(buttonVariants({ variant: "secondary", size: "sm" }), "justify-self-start")} onClick={() => setEditing(true)}>手の情報を変える</button>
        </Card>
        <MouseFilters value={filter} onChange={(f) => { setFilter(f); setShowAll(false); }} />
      </div>

      <section aria-labelledby="mouse-results" className="grid gap-4">
        <SectionHeading id="mouse-results" title="あなたの手に近い順" count={filtered.length}
          action={<ButtonAnchor href={shareUrl} target="_blank" rel="noopener noreferrer" variant="secondary" size="sm"><Share2 aria-hidden />TOP3 を X でシェア</ButtonAnchor>} />
        <p className="flex flex-wrap items-center gap-2 text-sm text-rl-muted"><Badge variant="pr">PR</Badge>このリンクから買うと、ロビラボに紹介料が入ることがあります</p>
        {filtered.length === 0 ? (
          <EmptyState icon={SearchX} title="条件に合うマウスがありません" description="絞り込みを減らすと見つかります。"
            action={<button type="button" className={buttonVariants({ variant: "secondary" })} onClick={() => setFilter(NO_FILTER)}>絞り込みを外す</button>} />
        ) : (
          <ol className="grid gap-4">
            {shown.map((item) => {
              const m = item.mouse;
              const rank = ranked.indexOf(item) + 1;
              const reason = recommendReason({ ...hand, estimated }, target, m, null);
              const compare = currentMouse ? compareWith(currentMouse, m) : null;
              const overlaid = overlay?.id === m.id;
              const onOverlay = () => { setOverlayId(m.id); requestAnimationFrame(revealFitFigure); };
              // 追補 6 章:一覧の先頭は大きな行(主ボタンはここ。絞り込みで 1 位が外れても先頭が持つ)。2 番目からはカード(店のボタンは二番手)
              if (item === shown[0]) return <TopMouseRow key={m.id} rank={rank} item={item} brand={m.brand} name={m.name} reason={reason} links={m.links} compare={compare} overlaid={overlaid} onOverlay={onOverlay} />;
              return (
                <MouseCard key={m.id} rank={rank} item={item} brand={m.brand} name={m.name}
                  reason={reason}
                  compare={compare}
                  links={m.links}
                  imageUrl={m.imageUrl} overlaid={overlaid} onOverlay={onOverlay} />
              );
            })}
          </ol>
        )}
        {!showAll && filtered.length > FIRST && (
          <button type="button" className={cn(buttonVariants({ variant: "secondary" }), "justify-self-center")} onClick={() => setShowAll(true)}>もっと見る({filtered.length - FIRST} 件)</button>
        )}
      </section>
    </div>
  );
}

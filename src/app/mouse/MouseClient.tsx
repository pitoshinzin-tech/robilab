"use client";
import { useEffect, useState } from "react";
import { DEVICES } from "@/data/devices";
import { MICE, mouseById } from "@/data/mice";
import { applyFilter, compareWith, DEFAULT_HAND_LENGTH_CM, fitTarget, handFrom, NO_FILTER, rankMice, targetText, type MouseFilter } from "@/lib/mouse-fit";
import { shopLinks } from "@/lib/shop-links";
import { buildMouseShareText } from "@/lib/mouse-share";
import { buildXShareUrl } from "@/lib/share";
import { adoptServerIfLocalEmpty, browserStorage, loadLocal } from "@/lib/my-settings-store";
import { emptyMySettings, type MySettings } from "@/lib/my-settings";
import { useIsClient } from "@/lib/use-is-client";
import { createSupabaseBrowser } from "@/lib/supabase/client";
import { HandSetup, GRIP_INFO } from "@/components/mouse/HandSetup";
import { MouseCard } from "@/components/mouse/MouseCard";
import { MouseFilters } from "@/components/mouse/MouseFilters";

const FIRST = 10;
const device = (id: string) => DEVICES.find((d) => d.id === id);

export function MouseClient({ pageUrl }: { pageUrl: string }) {
  const isClient = useIsClient();
  const [rev, setRev] = useState(0);
  // 保存できない環境(プライベートモードなど)で入力した値
  const [memoryHand, setMemoryHand] = useState<MySettings["hand"] | null>(null);
  const [notSaved, setNotSaved] = useState(false);
  const [editing, setEditing] = useState(false);
  const [filter, setFilter] = useState<MouseFilter>(NO_FILTER);
  const [showAll, setShowAll] = useState(false);
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
        const supabase = createSupabaseBrowser();
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

  const ranked = hand ? rankMice(hand, MICE) : [];
  const filtered = applyFilter(ranked, filter);
  const shown = showAll ? filtered : filtered.slice(0, FIRST);

  const currentRef = settings?.devices.mouse ?? null;
  const currentMouse = currentRef && "id" in currentRef ? mouseById(currentRef.id) ?? null : null;

  if (!isClient) return <div className="h-40 rounded-2xl bg-white/5" />;
  // この端末が空で、サーバーの設定を確かめ中のときだけ待つ(入力画面のちらつきを防ぐ)
  if (!hand && !settings && serverPending) return <div className="h-40 rounded-2xl bg-white/5" aria-busy="true" />;

  if (!hand || editing) {
    return (
      <HandSetup
        initial={handRaw ?? emptyMySettings().hand}
        onDone={(h, saved) => {
          setNotSaved(!saved);
          setMemoryHand(saved ? null : h);
          setEditing(false);
          setRev((n) => n + 1);
        }}
        onCancel={hand ? () => setEditing(false) : undefined}
      />
    );
  }

  const target = fitTarget(hand);
  const top3 = ranked.slice(0, 3).map((r) => device(r.mouse.id)).filter((d) => d !== undefined);
  const shareUrl = buildXShareUrl(buildMouseShareText(top3.map((d) => ({ brand: d.brand, name: d.name }))), pageUrl);

  return (
    <div className="grid gap-5">
      <section className="grid gap-2 rounded-2xl border border-[var(--rl-border)] bg-[var(--rl-surface)] p-4">
        <p className="text-sm text-[var(--rl-muted)]">
          {GRIP_INFO[hand.grip].label}・手の長さ:{estimated ? `未入力(平均 ${DEFAULT_HAND_LENGTH_CM}cm で計算)` : `${hand.lengthCm}cm`}{hand.widthCm !== null && `・幅 ${hand.widthCm}cm`}
        </p>
        <p className="text-lg font-bold">あなたの目安:<span className="text-[var(--rl-highlight)]">{targetText(target)}</span> くらいのマウス</p>
        {estimated && <p className="text-xs text-[var(--rl-muted)]">手の長さを入れていないので、平均的な大きさ({DEFAULT_HAND_LENGTH_CM}cm)で出しています。測って入れると、あなたの手に合わせられます。下の「手の情報を変える」から入れられます。</p>}
        {hand.widthCm === null && <p className="text-xs text-[var(--rl-muted)]">手の幅も入れると精度が上がります。</p>}
        {notSaved && <p className="text-xs text-[var(--rl-danger)]">この端末には保存できませんでした(この画面を閉じると消えます)。</p>}
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => setEditing(true)} className="rounded-full bg-white/10 px-4 py-2 text-sm">手の情報を変える</button>
          <a href={shareUrl} target="_blank" rel="noopener noreferrer" className="rounded-full bg-[var(--rl-accent)] px-4 py-2 text-sm font-bold text-[var(--rl-on-accent)]">TOP3 を X でシェア</a>
        </div>
      </section>

      <MouseFilters value={filter} onChange={(f) => { setFilter(f); setShowAll(false); }} />

      {filtered.length === 0 ? (
        <div className="grid gap-2 rounded-2xl bg-white/5 p-4 text-sm">
          <p>条件に合うマウスがありません。条件を減らしてください。</p>
          <button type="button" onClick={() => setFilter(NO_FILTER)} className="justify-self-start rounded-full bg-white/10 px-4 py-2">絞り込みを外す</button>
        </div>
      ) : (
        <ol className="grid gap-3">
          {shown.map((item) => {
            const d = device(item.mouse.id);
            if (!d) return null;
            const rank = ranked.indexOf(item) + 1;
            return (
              <MouseCard key={item.mouse.id} rank={rank} item={item} brand={d.brand} name={d.name}
                compare={currentMouse ? compareWith(currentMouse, item.mouse) : null}
                links={shopLinks(`${d.brand} ${d.name}`, item.mouse.officialUrl)} />
            );
          })}
        </ol>
      )}
      {!showAll && filtered.length > FIRST && (
        <button type="button" onClick={() => setShowAll(true)} className="justify-self-center rounded-full bg-white/10 px-6 py-2 text-sm">もっと見る({filtered.length - FIRST} 件)</button>
      )}
    </div>
  );
}

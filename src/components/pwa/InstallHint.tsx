"use client";
import { useEffect, useMemo, useState, useSyncExternalStore, type ReactNode } from "react";
import { ChevronDown, Download, X } from "lucide-react";
import { useIsClient } from "@/lib/use-is-client";
import { installPromptStore, SERVER_SNAPSHOT } from "@/lib/pwa/install-prompt";
import { HINT_STORAGE_KEY, detectPlatform, dismissHint, hintView, parseHintState, type HintPlace, type StepsPlatform } from "@/lib/pwa/install-hint";
import { Card } from "@/components/ui/card";
import { PlainButton } from "@/components/ui/plain-button";
import { SectionHeading } from "@/components/ui/section-heading";
import { HomeRowArt } from "./AppIconMark";
import { cn } from "@/lib/utils";

type HintStorage = Pick<Storage, "getItem" | "setItem">;

/** localStorage が使えれば返す。プライベートモードなどで読めない・書けないときは null(案内を出さない) */
export function openHintStorage(): HintStorage | null {
  try {
    const s = window.localStorage;
    const probe = "robilab:probe";
    s.setItem(probe, "1");
    s.removeItem(probe);
    return s;
  } catch {
    return null;
  }
}

function save(storage: HintStorage | null, value: unknown) {
  if (!storage) return;
  try {
    storage.setItem(HINT_STORAGE_KEY, JSON.stringify(value));
  } catch {
    // 書けなくても画面は変えない
  }
}

function readStored(storage: HintStorage | null): string | null | undefined {
  if (!storage) return undefined;
  try {
    return storage.getItem(HINT_STORAGE_KEY);
  } catch {
    return undefined;
  }
}

/** ブラウザでだけ呼ぶ(useIsClient が true のとき) */
function readEnv(place: HintPlace, today: string | undefined) {
  const standalone = window.matchMedia?.("(display-mode: standalone)").matches === true || (navigator as Navigator & { standalone?: boolean }).standalone === true;
  const platform = detectPlatform({ userAgent: navigator.userAgent, maxTouchPoints: navigator.maxTouchPoints ?? 0, standalone });
  const storage = place === "aim" ? openHintStorage() : null;
  return { storage, view: hintView({ place, platform, stored: place === "aim" ? readStored(storage) : null, today }) };
}

const LEAD: Record<HintPlace, string> = {
  aim: "アイコンから、毎日の今日の文字にワンタップで。",
  my: "アプリのように全画面で開けます。",
};

/**
 * 「ホーム画面に追加」の静かな案内(設計書 4 章)。手順の文はサーバーで描いた steps を受け取り、JS が決めるのは
 * 「出すか」「どの手順か」「追加する(prompt)」だけ。ハイドレーションのあとに出す(置き場所はどちらも最初の画面の外)。
 */
export function InstallHint({ place, today, steps, className }: { place: HintPlace; today?: string; steps: Record<StepsPlatform, ReactNode>; className?: string }) {
  const isClient = useIsClient();
  const prompt = useSyncExternalStore(installPromptStore.subscribe, installPromptStore.get, () => SERVER_SNAPSHOT);
  const [closed, setClosed] = useState(false);
  const env = useMemo(() => (isClient ? readEnv(place, today) : null), [isClient, place, today]);

  // 来訪日の記録(/aim だけ)。effect では保存だけして、setState はしない
  useEffect(() => {
    if (env?.view.next) save(env.storage, env.view.next);
  }, [env]);
  // インストールしたら二度と出さない
  useEffect(() => {
    if (prompt.installed && env?.storage) save(env.storage, dismissHint(parseHintState(readStored(env.storage) ?? null)));
  }, [prompt.installed, env]);

  if (!env || !env.view.show || closed || prompt.installed || env.view.platform === "installed") return null;
  const platform = env.view.platform;
  const canPrompt = prompt.event !== null && (platform === "android" || platform === "desktop");

  const hasSteps = platform !== "other";
  // 左(スマホは上)にホームに並ぶアイコン。/aim のカードは PC の幅で右の空きに置く(文は 720px まで)。
  // 「追加のしかた」を開くと、アイコンの横に「ホームの列」の線の四角が出る(HomeRowArt。group/hint の has で CSS だけ)
  const body = (
    <div className={cn("group/hint grid gap-4", place === "aim" && "lg:grid-cols-[minmax(0,1fr)_auto] lg:gap-x-8")}>
      <HomeRowArt showRow={hasSteps} className={cn(place === "aim" && "lg:col-start-2 lg:row-start-1")} />
      <div className="grid min-w-0 max-w-[720px] content-start gap-4">
        <p className="text-sm text-pretty text-rl-muted [word-break:auto-phrase]">{LEAD[place]}</p>
        {canPrompt && (
          <div>
            <PlainButton variant="secondary" size="sm" onClick={() => void installPromptStore.prompt()}>
              <Download aria-hidden />
              追加する
            </PlainButton>
          </div>
        )}
        {hasSteps ? (
          <details className="group">
            <summary className="inline-flex min-h-11 cursor-pointer list-none items-center gap-1 text-sm font-bold text-rl-accent underline-offset-4 hover:underline [&::-webkit-details-marker]:hidden">
              追加のしかた
              <ChevronDown aria-hidden className="size-4 shrink-0 group-open:rotate-180" />
            </summary>
            <div className="pt-2">{steps[platform]}</div>
          </details>
        ) : (
          steps.other
        )}
      </div>
    </div>
  );

  if (place === "my") {
    return (
      <section aria-labelledby="install-hint-heading" className={cn("grid gap-4", className)}>
        <SectionHeading id="install-hint-heading" title="ホーム画面に追加" />
        {body}
      </section>
    );
  }

  const close = () => {
    save(env.storage, dismissHint(parseHintState(readStored(env.storage) ?? null)));
    setClosed(true);
  };
  return (
    <Card as="section" aria-labelledby="install-hint-heading" className={cn("grid gap-4", className)}>
      <div className="flex items-start justify-between gap-4">
        <h2 id="install-hint-heading" className="min-w-0 text-xl font-bold">ホーム画面に追加</h2>
        <PlainButton variant="ghost" size="icon" aria-label="閉じる" onClick={close} className="-mr-2 -mt-2">
          <X aria-hidden />
        </PlainButton>
      </div>
      {body}
    </Card>
  );
}

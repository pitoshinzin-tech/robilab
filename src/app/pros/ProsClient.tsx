"use client";
import { useState } from "react";
import Link from "next/link";
import { PROS, PRO_GAMES, type ProGameId } from "@/data/pros";
import { getSensGame } from "@/data/sensitivity";
import { nearPros, sortPros, userCmFrom, type ProSort } from "@/lib/pro-match";
import { browserStorage, loadLocal } from "@/lib/my-settings-store";
import { useIsClient } from "@/lib/use-is-client";
import { ProCard } from "@/components/pros/ProCard";
import { ProList } from "@/components/pros/ProList";
import { Card } from "@/components/ui/card";
import { ChipButton, ChipButtonGroup } from "@/components/ui/chip-button";
import { SectionHeading } from "@/components/ui/section-heading";
import { Skeleton } from "@/components/ui/skeleton";

const SORTS: [ProSort, string][] = [["cmAsc", "振り向きが短い順"], ["cmDesc", "振り向きが長い順"], ["name", "名前順"]];

export function ProsClient() {
  const isClient = useIsClient();
  const settings = isClient ? loadLocal(browserStorage()) : null;
  const user = userCmFrom(settings);
  const initialTab: ProGameId = settings?.mainGame && (PRO_GAMES as string[]).includes(settings.mainGame) ? (settings.mainGame as ProGameId) : "valorant";
  const [tab, setTab] = useState<ProGameId | null>(null);
  const [sort, setSort] = useState<ProSort>("cmAsc");
  const current = tab ?? initialTab;

  return (
    <div className="grid gap-8">
      <Card as="section" aria-labelledby="pros-near" className="grid gap-4">
        <SectionHeading id="pros-near" title="あなたに近いプロ" />
        {!isClient ? (
          <Skeleton className="h-24 w-full rounded-rl-md" />
        ) : user ? (
          <>
            <p className="text-base">あなたの振り向き:<span className="font-display tabular-nums text-rl-highlight">約 {user.cm}cm</span>({getSensGame(user.game)!.name})</p>
            {/* 近いプロは箱にしない行(ProCard)。このカードの中にカードを入れない */}
            <ul className="grid gap-x-6 gap-y-4 md:grid-cols-2">
              {nearPros(user.cm, user.game, PROS, 5).map((item) => <ProCard key={item.pro.id} item={item} userCm={user.cm} />)}
            </ul>
          </>
        ) : (
          <p className="text-base"><Link href="/tools/sensitivity" className="text-rl-accent underline">感度計算</Link>でマイ設定に保存すると、振り向きが近いプロが出ます。</p>
        )}
      </Card>
      <section aria-label="ゲームごとの一覧" className="grid gap-4">
        {/* base-ui の ChipGroup ではなく、読まない ChipButtonGroup(矢印キーで移る。選ぶのは Enter・Space) */}
        <ChipButtonGroup label="ゲーム">
          {PRO_GAMES.map((g) => <ChipButton key={g} pressed={current === g} onClick={() => setTab(g)}>{getSensGame(g)!.name}</ChipButton>)}
        </ChipButtonGroup>
        <ChipButtonGroup label="並び替え">
          {SORTS.map(([v, label]) => <ChipButton key={v} pressed={sort === v} onClick={() => setSort(v)}>{label}</ChipButton>)}
        </ChipButtonGroup>
        <ProList pros={sortPros(PROS.filter((p) => p.game === current), sort)} />
      </section>
    </div>
  );
}

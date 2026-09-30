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
    <div className="grid gap-6">
      <section className="grid gap-3 rounded-2xl border border-[var(--rl-border)] bg-[var(--rl-surface)] p-4">
        <h2 className="font-bold">あなたに近いプロ</h2>
        {!isClient ? (
          <div className="h-24 rounded-xl bg-white/5" />
        ) : user ? (
          <>
            <p className="text-sm">あなたの振り向き:<span className="font-bold text-[var(--rl-highlight)]">約 {user.cm}cm</span>({getSensGame(user.game)!.name})</p>
            <ul className="grid gap-2 sm:grid-cols-2">
              {nearPros(user.cm, user.game, PROS, 5).map((item) => <ProCard key={item.pro.id} item={item} userCm={user.cm} />)}
            </ul>
          </>
        ) : (
          <p className="text-sm">
            <Link href="/tools/sensitivity" className="underline">感度計算</Link>でマイ設定に保存すると、振り向きが近いプロが出ます。
          </p>
        )}
      </section>

      <section className="grid gap-3">
        <div className="flex flex-wrap gap-2" role="group" aria-label="ゲーム">
          {PRO_GAMES.map((g) => (
            <button key={g} type="button" aria-pressed={current === g} onClick={() => setTab(g)}
              className={`rounded-full border px-4 py-2 text-sm ${current === g ? "border-[var(--rl-secondary)] bg-[var(--rl-card)]" : "border-white/10"}`}>
              {getSensGame(g)!.name}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2 text-xs" role="group" aria-label="並び替え">
          {SORTS.map(([v, label]) => (
            <button key={v} type="button" aria-pressed={sort === v} onClick={() => setSort(v)}
              className={`rounded-full border px-3 py-1 ${sort === v ? "border-[var(--rl-secondary)] bg-[var(--rl-card)]" : "border-white/10"}`}>
              {label}
            </button>
          ))}
        </div>
        <ProList pros={sortPros(PROS.filter((p) => p.game === current), sort)} />
      </section>
    </div>
  );
}

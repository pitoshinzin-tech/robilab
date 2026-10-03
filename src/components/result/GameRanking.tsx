import Link from "next/link";
import type { GameRank } from "@/lib/role-match";
import type { ResultCharLink, ResultCharPick } from "@/lib/char-dex";
import { roleSymbol } from "@/lib/role-symbols";
import { PixelArt } from "@/components/brand/PixelArt";
import { CHAR_REASON_TEXT } from "@/lib/char-reason";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

const CHAR_LINK = "rl-lock inline-flex min-h-11 flex-wrap items-center gap-x-2 font-bold text-rl-accent underline-offset-4 hover:underline";

/**
 * キャラへのリンク:ロールの記号 16px+名前+ロールの土台からずれた軸の札 1 つ(札がなければ足さない。数字なし)。
 * 乗せる・フォーカスで照準の印(S4 の rl-lock)。
 */
function CharLink({ link }: { link: ResultCharLink }) {
  return (
    <Link href={link.href} className={CHAR_LINK}>
      <PixelArt grid={roleSymbol(link.game, link.roleId)} size={16} />
      {link.name}
      {link.shift && (
        <span className="inline-flex h-6 items-center gap-1 rounded-rl-sm border border-rl-line-strong px-1.5 text-xs font-normal text-rl-text no-underline">
          <span className="sr-only">(</span><span className="text-rl-muted">{link.shift.left}/{link.shift.right}</span>
          <span className="font-bold">{link.shift.word}</span><span className="sr-only">)</span>
        </span>
      )}
    </Link>
  );
}

/** ゲームの行の下の「合うキャラ」と「手ざわりが違うかも」(設計書 6-4)。キャラは % を出さない。ラベルは 1 行目、キャラは 2 行目に並べる */
function CharLines({ pick }: { pick: ResultCharPick }) {
  return (
    <div className="mt-2 grid gap-2 border-t border-rl-line pt-2">
      <div className="grid gap-1 text-sm">
        <p className="text-rl-muted">合うキャラ</p>
        <ul className="flex flex-wrap gap-x-4">
          {pick.fits.map((f) => <li key={f.href}><CharLink link={f} /></li>)}
        </ul>
      </div>
      {pick.surprise && (
        <div className="grid gap-1">
          <p className="flex flex-wrap items-center gap-x-3 text-sm">
            <Badge>{CHAR_REASON_TEXT.badge}</Badge>
            <span className="text-rl-muted">{CHAR_REASON_TEXT.heading}</span>
            <CharLink link={pick.surprise} />
          </p>
          <p className="text-sm text-pretty text-rl-muted [word-break:auto-phrase]">{pick.surprise.reason}</p>
        </div>
      )}
    </div>
  );
}

/**
 * おすすめゲームと合うロール。showScore={false}(直接開いた結果):% はタイプのコードからの既定の軸で計算した数で
 * 本人の数ではないので出さない。順位・ロール・理由はタイプの 4 文字で決まるので、そのまま出す。
 * chars:ゲームの id → 合うキャラ(ページが src/lib/char-dex の resultCharPicks で作って渡す。キャラのデータは import しない)。
 */
export function GameRanking({ ranks, showScore = true, chars = {} }: { ranks: GameRank[]; showScore?: boolean; chars?: Readonly<Record<string, ResultCharPick>> }) {
  return (
    <ol className="grid gap-4">
      {ranks.map((r, i) => {
        const pick = Object.hasOwn(chars, r.game.id) ? chars[r.game.id] : undefined;
        return (
          <Card as="li" key={r.game.id} className="grid gap-1">
            <div className="flex items-baseline justify-between gap-3">
              <span className="min-w-0 text-base font-bold">{i + 1}. {r.game.name}</span>
              {showScore && <span className="text-xl font-bold tabular-nums text-rl-highlight">{r.best.score}%</span>}
            </div>
            <p className="text-base">合うロール:<b>{r.best.role.name}</b> — {r.best.role.reason}</p>
            <p className="text-sm text-rl-muted">{r.roles.slice(1).map((x) => (showScore ? `${x.role.name} ${x.score}%` : x.role.name)).join(" / ")}</p>
            {pick && <CharLines pick={pick} />}
          </Card>
        );
      })}
    </ol>
  );
}

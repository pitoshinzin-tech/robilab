import { Mic } from "lucide-react";
import { GAMES } from "@/data/games";
import { TIME_SLOTS } from "@/data/lobby-options";
import type { Candidate } from "@/lib/lobby-types";
import type { PeopleMatch } from "@/lib/people-match";
import { heatOf, spriteFill } from "@/lib/type-sprite";
import { TypeIcon } from "@/components/brand/TypeIcon";
import { Badge } from "@/components/ui/badge";
import { Card, CardLink } from "@/components/ui/card";

const gameName = (id: string) => GAMES.find((g) => g.id === id)?.shortName ?? id;
const slotName = (id: string) => TIME_SLOTS.find((t) => t.id === id)?.label ?? id;

/**
 * (追補 6 章)ロビーの「プレイヤーの札」。左の端のタイプの色の 4px のマス帯(8px ずつ)で、遠くからどのタイプか分かる
 * (熱血はマゼンタ・冷静は淡いパープル・未診断は線の色)。link=false は /lobby/[profileId] 用の大きい形(押せない・自己紹介を全部出す)。
 * 一覧の札はホバー・フォーカスで絵が上から 4 段で塗り替わる(動きの参考 025。TypeIcon の dissolve、CSS だけ)。
 */
export function CandidateCard({ c, match, link = true }: { c: Candidate; match: PeopleMatch | null; link?: boolean }) {
  const band = c.type_code ? spriteFill("body", heatOf(c.type_code)) : "var(--rl-line-strong)";
  const body = (
    <div className="flex min-w-0 gap-4 pl-2">
      {/* 角丸にかからないよう上下 16px あける */}
      <span aria-hidden className="absolute top-4 bottom-4 left-0 w-1" style={{ backgroundImage: `repeating-linear-gradient(to bottom, ${band} 0 8px, transparent 8px 16px)` }} />
      {c.type_code ? <TypeIcon code={c.type_code} size={64} dissolve={link} /> : <span aria-hidden className="size-16 shrink-0 rounded-rl-sm bg-rl-surface-2" />}
      <div className="grid min-w-0 flex-1 content-start gap-1">
        <div className="flex min-w-0 flex-wrap items-start justify-between gap-x-3 gap-y-1">
          <span data-long-name className="min-w-0 text-xl font-bold wrap-anywhere">{c.nickname}</span>
          {match ? (
            <span className="whitespace-nowrap text-sm text-rl-muted">
              相性 <span className="font-display text-rl-heading leading-none font-extrabold tabular-nums text-rl-highlight">{match.score}</span>
              <span className="text-base text-rl-text">%</span>
            </span>
          ) : (
            <span className="text-sm text-rl-muted">診断で相性表示</span>
          )}
        </div>
        {c.type_code ? <Badge variant="code" className="justify-self-start">{c.type_code}</Badge> : <span className="text-sm text-rl-muted">タイプ未診断</span>}
        {match && match.reasons.length > 0 && <p className="text-sm [word-break:auto-phrase]">{match.reasons.join("・")}</p>}
        <p className="flex flex-wrap items-center gap-x-2 text-sm text-rl-muted">
          {/* 区切りの「・」は 2 つ目から(ゲーム・時間帯が空でも先頭に「・」だけが出ない) */}
          {[
            c.games.length > 0 && <span key="games">{c.games.map((g) => gameName(g.id)).join(" / ")}</span>,
            c.time_slots.length > 0 && <span key="slots">{c.time_slots.map(slotName).join(" ")}</span>,
            c.voice_ok && <span key="voice" className="inline-flex items-center gap-1"><Mic aria-hidden className="size-4" />VC 可</span>,
          ]
            .filter(Boolean)
            .map((item, i) => (i === 0 ? item : [<span key={`sep-${i}`} aria-hidden>・</span>, item]))}
        </p>
        {c.bio && <p data-long-name className={link ? "line-clamp-3 text-sm wrap-anywhere" : "text-base wrap-anywhere"}>{c.bio}</p>}
      </div>
    </div>
  );
  return link ? <CardLink href={`/lobby/${c.id}`} className="rl-dissolve-host">{body}</CardLink> : <Card className="relative">{body}</Card>;
}

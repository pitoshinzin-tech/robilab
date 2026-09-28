import Link from "next/link";
import { GAMES } from "@/data/games";
import { TIME_SLOTS } from "@/data/lobby-options";
import type { Candidate } from "@/lib/lobby-types";
import type { PeopleMatch } from "@/lib/people-match";

const gameName = (id: string) => GAMES.find((g) => g.id === id)?.shortName ?? id;
const slotName = (id: string) => TIME_SLOTS.find((t) => t.id === id)?.label ?? id;

export function CandidateCard({ c, match }: { c: Candidate; match: PeopleMatch | null }) {
  return (
    <Link href={`/lobby/${c.id}`} className="block rounded-xl border border-white/10 bg-[var(--rl-surface)] p-4 transition hover:border-[var(--rl-cyan)]">
      <div className="flex items-baseline justify-between">
        <span className="font-bold">{c.nickname}</span>
        {match ? <span className="font-[family-name:var(--font-display)] text-[var(--rl-cyan)]">相性 {match.score}%</span> : <span className="text-xs text-[var(--rl-muted)]">診断で相性表示</span>}
      </div>
      <div className="mt-1 text-xs text-[var(--rl-magenta)]">{c.type_code ?? "タイプ未診断"}</div>
      {match && match.reasons.length > 0 && <p className="mt-1 text-xs">{match.reasons.join("・")}</p>}
      <p className="mt-2 text-xs text-[var(--rl-muted)]">
        {c.games.map((g) => gameName(g.id)).join(" / ")} ・ {c.time_slots.map(slotName).join(" ")} {c.voice_ok ? "・🎙 VC OK" : ""}
      </p>
      {c.bio && <p className="mt-2 text-sm">{c.bio}</p>}
    </Link>
  );
}

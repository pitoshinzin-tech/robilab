import type { Axes, AxisId } from "@/data/axes";
import { peopleScore, type PeopleMatch } from "@/lib/people-match";
import type { Candidate } from "@/lib/lobby-types";

export type Filters = { game?: string; slot?: string; voice?: boolean };

const AXIS_IDS: AxisId[] = ["attack", "instinct", "team", "heat"];

function isCompleteAxes(axes: unknown): axes is Axes {
  if (!axes || typeof axes !== "object") return false;
  return AXIS_IDS.every((id) => typeof (axes as Record<string, unknown>)[id] === "number");
}

export function sortAndFilter(me: { axes: Axes | null }, list: Candidate[], filters: Filters) {
  const myAxes = isCompleteAxes(me.axes) ? me.axes : null;
  return list
    .filter((c) => !filters.game || c.games.some((g) => g.id === filters.game))
    .filter((c) => !filters.slot || c.time_slots.includes(filters.slot))
    .filter((c) => !filters.voice || c.voice_ok)
    .map((candidate) => {
      const theirAxes = isCompleteAxes(candidate.axes) ? candidate.axes : null;
      return { candidate, match: myAxes && theirAxes ? peopleScore(myAxes, theirAxes) : (null as PeopleMatch | null) };
    })
    .sort((x, y) => {
      if (x.match && y.match) return y.match.score - x.match.score;
      if (x.match) return -1;
      if (y.match) return 1;
      return y.candidate.created_at.localeCompare(x.candidate.created_at);
    });
}

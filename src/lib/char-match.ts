import { AXES, type Axes, type AxisId } from "@/data/axes";
import { GAMES, type Game, type Role } from "@/data/games";
import { TYPES, type GamerType } from "@/data/types";
import type { Char, CharTagId } from "@/data/char-types";
import { parseAxesParam } from "@/lib/axes-param";
import { rankGames, roleScore } from "@/lib/role-match";

/**
 * 合うキャラの計算(設計書 3-2・5-1)。キャラの値=ロールの値+公式の言葉の札。人の感覚で数字を付けない。
 * キャラのデータ(@/data/chars)は import しない(引数で受け取る。部品からも使うため)。画面に数字は出さない。
 */

/** 札 1 枚で動かす幅 */
export const TAG_SHIFT = 0.3;
/** 「寄り」と言う境目(値が +0.25 以上/−0.25 以下) */
export const LEAN = 0.25;

export const TAG_AXIS: Record<CharTagId, { axis: AxisId; sign: 1 | -1 }> = {
  front: { axis: "attack", sign: 1 },
  hold: { axis: "attack", sign: -1 },
  mobile: { axis: "instinct", sign: 1 },
  setup: { axis: "instinct", sign: -1 },
  ally: { axis: "team", sign: 1 },
  lone: { axis: "team", sign: -1 },
  aggro: { axis: "heat", sign: 1 },
  calm: { axis: "heat", sign: -1 },
};

const round1 = (n: number) => Math.round(n * 10) / 10;
const clamp = (n: number) => Math.max(-1, Math.min(1, n));

export function roleOf(char: Char, games: readonly Game[] = GAMES): Role | undefined {
  return games.find((g) => g.id === char.game)?.roles.find((r) => r.id === char.roleId);
}

export function charTarget(char: Char, games: readonly Game[] = GAMES): Axes {
  const role = roleOf(char, games);
  if (!role) throw new Error(`${char.game}/${char.id}: roleId ${char.roleId} が games.ts にない`);
  const t: Axes = { ...role.target };
  for (const e of char.evidence) {
    const { axis, sign } = TAG_AXIS[e.tag];
    t[axis] = clamp(round1(t[axis] + sign * TAG_SHIFT));
  }
  return t;
}

export type RankedChar = { char: Char; score: number };

/** 相性に入るのは matchable で予備でないキャラだけ。score の大きい順、同点は渡した順 */
export function rankChars(user: Axes, chars: readonly Char[]): RankedChar[] {
  return chars
    .map((char, index) => ({ char, index }))
    .filter(({ char }) => char.matchable && !char.reserve)
    .map(({ char, index }) => ({ char, index, score: roleScore(user, charTarget(char)) }))
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map(({ char, score }) => ({ char, score }));
}

/** キャラの札のうち、あなたの軸と逆の向きに動かすもの。あなたの値の大きい軸が先、同じなら札の順 */
export function opposingTags(user: Axes, char: Char): CharTagId[] {
  return char.evidence
    .map((e, i) => ({ tag: e.tag, i, ...TAG_AXIS[e.tag] }))
    .filter(({ axis, sign }) => user[axis] !== 0 && Math.sign(user[axis]) !== sign)
    .sort((a, b) => Math.abs(user[b.axis]) - Math.abs(user[a.axis]) || a.i - b.i)
    .map((x) => x.tag);
}

export type Surprise = { char: Char; role: Role; tag: CharTagId };
export type GamePick = { fits: Char[]; surprise: Surprise | null };

/**
 * 合うキャラ 3 体(ロールをまたいでよい)と、「ロールは同じでも、手ざわりが違うかも」1 体(条件を満たすときだけ)。
 * 違うかも=一番合うロール(rankGames の best)のキャラで、ほかのロールの一番手より低く、合うキャラに入らず、
 * あなたの軸と逆の向きの札を持つもの。そのうち一番低い 1 体(同点はデータの順で先)。しきい値の数字は作らない。
 */
export function pickForGame(user: Axes, game: Game, chars: readonly Char[]): GamePick {
  const ranked = rankChars(user, chars.filter((c) => c.game === game.id));
  const fits = ranked.slice(0, 3).map((r) => r.char);
  const bestRole = rankGames(user, [game])[0].best.role;
  const otherTop = ranked.find((r) => r.char.roleId !== bestRole.id);
  if (!otherTop) return { fits, surprise: null };
  const candidates = ranked.filter(
    (r) => r.char.roleId === bestRole.id && r.score < otherTop.score && !fits.includes(r.char) && opposingTags(user, r.char).length > 0,
  );
  if (candidates.length === 0) return { fits, surprise: null };
  const low = Math.min(...candidates.map((r) => r.score));
  const pick = candidates.find((r) => r.score === low)!.char;
  return { fits, surprise: { char: pick, role: bestRole, tag: opposingTags(user, pick)[0] } };
}

/** このキャラが合うタイプ:16 タイプの既定の軸(各軸 ±0.6)と近い順に 3 つ。同点はタイプの並び順 */
export function fitTypes(char: Char, types: readonly GamerType[] = TYPES): GamerType[] {
  const target = charTarget(char);
  return types
    .map((t, index) => ({ t, index, score: roleScore(parseAxesParam(undefined, t.code), target) }))
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .slice(0, 3)
    .map((x) => x.t);
}

export type AxisLean = "left" | "right" | "neutral";
export function leanOf(v: number): AxisLean {
  return v >= LEAN ? "left" : v <= -LEAN ? "right" : "neutral";
}

export type CharAxisRow = {
  axis: AxisId;
  /** 軸の両はしの言葉(例:攻め/守り) */
  left: string;
  right: string;
  lean: AxisLean;
  /** 「攻め寄り」「どちらでもない」など(数字を出さない) */
  word: string;
  basis: { kind: "role"; roleName: string } | { kind: "tag"; tag: CharTagId; quote: string; url: string };
};

/** 1 体のページの「このキャラの傾向」と根拠の表(軸ごとに、札があれば札、なければロール) */
export function charAxisRows(char: Char): CharAxisRow[] {
  const role = roleOf(char);
  if (!role) throw new Error(`${char.game}/${char.id}: roleId ${char.roleId} が games.ts にない`);
  const t = charTarget(char);
  return AXES.map((a) => {
    const lean = leanOf(t[a.id]);
    const word = lean === "left" ? `${a.left}寄り` : lean === "right" ? `${a.right}寄り` : "どちらでもない";
    const ev = char.evidence.find((e) => TAG_AXIS[e.tag].axis === a.id);
    const basis: CharAxisRow["basis"] = ev ? { kind: "tag", tag: ev.tag, quote: ev.quote, url: ev.url } : { kind: "role", roleName: role.name };
    return { axis: a.id, left: a.left, right: a.right, lean, word, basis };
  });
}

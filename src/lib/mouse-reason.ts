import type { Grip } from "@/lib/my-settings";
import type { MouseConnection, MouseShape } from "@/data/gear-types";
import { DEFAULT_HAND_LENGTH_CM, RANGE_MM, type CompareMouse, type FitMouse, type Hand, type Target } from "@/lib/mouse-fit";

/**
 * 「おすすめの理由」の文言(本人が言い回しを直せるように、ここにまとめる)。
 * 決まった規則で、手の情報とマウスの公式の数字だけから作る。数字にない性能・使い心地・口コミは書かない。
 */
export const REASON_TEXT = {
  /** 持ち方の呼び名(HandSetup の GRIP_INFO と同じ) */
  gripLabel: { palm: "かぶせ持ち", claw: "つかみ持ち", fingertip: "つまみ持ち" } as Record<Grip, string>,
  /** 1 文目:長さが目安より短い/長いとき(「長さ ○mm は」のあと。持ち方ごと) */
  length: {
    ok: "がちょうどいい大きさです",
    small: {
      palm: "はやや小さめで、細かく動かしやすいです",
      claw: "はやや小さめで、指を立てて動かしやすいです",
      fingertip: "はやや小さめで、指先だけで動かしやすいです",
    } as Record<Grip, string>,
    large: {
      palm: "はやや大きめで、手のひら全体で支えやすいです",
      claw: "はやや大きめで、付け根で支えて安定させやすいです",
      fingertip: "はやや大きめで、安定寄りです",
    } as Record<Grip, string>,
  },
  /** 2 文目:幅(「幅は ○mm と」のあと。読点の前まで) */
  width: {
    /** 手の幅から見て目安どおり */
    ok: "手の幅に合っていて",
    /** 手の幅が未入力で、細め・広めのどちらでもない */
    normal: "標準的な太さで",
    narrow: {
      palm: "細めで指先で細かく動かしやすく",
      claw: "細めで指で挟んで動かしやすく",
      fingertip: "細めで指先でつまみやすく",
    } as Record<Grip, string>,
    wide: {
      palm: "広めで手のひらで包みやすく",
      claw: "広めで握りやすく",
      fingertip: "広めのつくりで",
    } as Record<Grip, string>,
  },
  /** 手の幅が未入力のときの、幅の細め・広めの境目(mm)。以下なら細め、以上なら広め */
  widthAbsolute: { narrowMax: 58, wideMin: 66 },
  /** 2 文目の終わり:形 */
  shape: {
    symmetric: "左右対称で持ち方を選ばない形です",
    right: "右手用(かぶせ・つかみ持ち向き)の形です",
  } as Record<MouseShape, string>,
  /** 形が公式にないとき */
  shapeUnknown: "形は公式の記載がありません",
  /** 3 文目:重さの区分(g)。light 以下は軽い、mid 以下は標準、それより上は重め */
  weightMax: { light: 55, mid: 75 },
  weight: {
    light: (g: number) => `重さは ${g}g と軽く、素早い振り向き・細かい操作向きの`,
    mid: (g: number) => `重さは ${g}g と、軽さと安定のバランスがいい`,
    heavy: (g: number) => `重さは ${g}g と重めで、狙いを止めやすい`,
  },
  /** 3 文目の終わり:接続 */
  connection: {
    wireless: "ケーブルが引っかからない無線です",
    wired: "充電のいらない有線です",
    both: "有線でも無線でも使えるタイプです",
  } as Record<MouseConnection, string>,
  /** 重さ・接続が公式にないとき */
  weightUnknown: "重さは公式の記載がなく",
  connectionUnknownTail: "マウスです",
  noWeightNoConnection: "重さ・接続は公式の記載がありません",
  /** 今のマウスとの比べ(差の絶対値がこれ以下は書かない) */
  compareMin: 1,
} as const;

/** 使わない言葉(大げさな言い方。テストで確かめる) */
export const BANNED_WORDS = ["最強", "絶対", "最高", "完璧", "神", "間違いなし", "No.1", "一番"];

const round1 = (x: number) => Math.round(x * 10) / 10;
const num = (x: number) => {
  const v = round1(x);
  return Number.isInteger(v) ? String(v) : v.toFixed(1);
};

type Verdict = "ok" | "small" | "large";
function verdict(actual: number, target: number, range: number): Verdict {
  const diff = round1(actual - target);
  if (diff < -range) return "small";
  if (diff > range) return "large";
  return "ok";
}

function sizeSentence(hand: Hand, estimated: boolean, t: Target, m: FitMouse): string {
  const g = REASON_TEXT.gripLabel[hand.grip];
  const who = estimated
    ? `平均的な手(${DEFAULT_HAND_LENGTH_CM}cm)として、${g}には`
    : `手の長さ ${num(hand.lengthCm)}cm の${g}には、`;
  const v = verdict(m.lengthMm, t.lengthMm, RANGE_MM.length);
  const tail = v === "ok" ? REASON_TEXT.length.ok : REASON_TEXT.length[v][hand.grip];
  return `${who}長さ ${num(m.lengthMm)}mm ${tail}。`;
}

function widthSentence(hand: Hand, t: Target, m: FitMouse): string {
  const W = REASON_TEXT.width;
  let part: string;
  if (t.widthMm !== null) {
    const v = verdict(m.widthMm, t.widthMm, RANGE_MM.width);
    part = v === "ok" ? W.ok : v === "small" ? W.narrow[hand.grip] : W.wide[hand.grip];
  } else if (m.widthMm <= REASON_TEXT.widthAbsolute.narrowMax) part = W.narrow[hand.grip];
  else if (m.widthMm >= REASON_TEXT.widthAbsolute.wideMin) part = W.wide[hand.grip];
  else part = W.normal;
  const shape = m.shape === null ? REASON_TEXT.shapeUnknown : REASON_TEXT.shape[m.shape];
  return `幅は ${num(m.widthMm)}mm と${part}、${shape}。`;
}

function weightSentence(m: FitMouse): string {
  const T = REASON_TEXT;
  if (m.weightG === null) return m.connection === null ? `${T.noWeightNoConnection}。` : `${T.weightUnknown}、${T.connection[m.connection]}。`;
  const { light, mid } = T.weightMax;
  const w = m.weightG <= light ? T.weight.light : m.weightG <= mid ? T.weight.mid : T.weight.heavy;
  return m.connection === null ? `${w(m.weightG)}${T.connectionUnknownTail}。` : `${w(m.weightG)}、${T.connection[m.connection]}。`;
}

/** 今のマウスとの比べ(長さ・幅・重さのうち、両方に公式の数字があるもの)。同じマウス・ほぼ同じなら空。 */
export function compareClause(current: CompareMouse, m: CompareMouse): string {
  if (current.id === m.id) return "";
  const all: [number | null, number | null, string, string, string][] = [
    [m.lengthMm, current.lengthMm, "mm", "短", "長"],
    [m.widthMm, current.widthMm, "mm", "細", "太"],
    [m.weightG, current.weightG, "g", "軽", "重"],
  ];
  const parts: { v: string; stem: string }[] = [];
  for (const [a, b, unit, less, more] of all) {
    if (a === null || b === null) continue;
    const d = a - b;
    if (Math.abs(d) > REASON_TEXT.compareMin) parts.push({ v: `${num(Math.abs(d))}${unit}`, stem: d < 0 ? less : more });
  }
  if (parts.length === 0) return "";
  const body = parts.map((p, i) => `${p.v} ${p.stem}${i === parts.length - 1 ? "いです" : "く"}`).join("、");
  return `今のマウスより ${body}。`;
}

/**
 * 結果のカードに出す「おすすめの理由」(3 文 + 今のマウスとの比べ)。
 * 手の情報(持ち方・長さ・幅)とマウスの公式の数字だけから、決まった規則で作る。公式にない数字は「公式の記載がありません」と書く。
 */
export function recommendReason(
  hand: Hand & { estimated?: boolean },
  target: Target,
  mouse: FitMouse,
  current?: CompareMouse | null,
): string {
  const text = sizeSentence(hand, hand.estimated ?? false, target, mouse) + widthSentence(hand, target, mouse) + weightSentence(mouse);
  return current ? text + compareClause(current, mouse) : text;
}

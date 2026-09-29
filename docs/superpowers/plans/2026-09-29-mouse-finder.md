# マウス探し Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** マイ設定の手の長さ・幅・持ち方から、合うマウスを理由付きで並べる `/mouse` ページを作る。

**Architecture:** データ(`src/data/mice.ts`)と計算(`src/lib/mouse-fit.ts`)とリンク(`src/lib/shop-links.ts`)は純粋な TS で、ブラウザだけで動く。DB は使わない。画面は `/mouse`(サーバーのページ+クライアントの `MouseClient`)で、マイ設定のブラウザ保存を読み書きする。

**Tech Stack:** TypeScript / Next.js 16.3(App Router)/ React 19 / Tailwind 4 / Vitest

**Spec:** [docs/superpowers/specs/2026-09-29-mouse-finder-design.md](../specs/2026-09-29-mouse-finder-design.md)

## Global Constraints

- 画面の文言・コメントは日本語。ユーザーへの返答も日本語。
- 技術スタック以外の依存を足さない(新しい npm パッケージは入れない)。
- この Next.js は学習データと違う。ページ・メタデータ・OG 画像を書く前に `node_modules/next/dist/docs/` の該当ガイドを読む。
- 色は役割で使う:押してほしいボタンは `bg-[var(--rl-accent)] text-[var(--rl-on-accent)]` だけ、強調は `--rl-highlight`、補助は `--rl-secondary`、カード・入力欄は `bg-[var(--rl-card)]`、エラーは `text-[var(--rl-danger)]`。
- DB・Supabase の migration は作らない。サーバーへの書き込みもしない(ログイン中の読み込みだけ `/aim` と同じ方法で行う)。
- 外部リンクは `target="_blank"`。公式ページは `rel="noopener noreferrer"`、Amazon・楽天は `rel="sponsored noopener noreferrer"`。
- 価格は載せない。左手用マウスは入れない。
- `.env*` を読まない。秘密の値を表示しない。
- `npm run lint` はエラー 0・警告 0。
- コミットは `git -c user.name=pitos -c user.email=pito.shinzin@gmail.com commit`。メッセージは日本語、最後に空行と `Co-Authored-By: <実装したモデル名> <noreply@anthropic.com>`。

## Review Focus

1. 手の長さ・幅が小数(18.5cm)や、幅が未入力(null)のとき → 目安・並び・理由が崩れない(Task 1 のテスト)。
2. マイ設定の「今のマウス」が自由入力やデータにないマウスのとき → 比較だけ出さず、落ちない(Task 1 のテスト `compareWith` と Task 5 の `currentMouse`)。
3. localStorage が使えないとき → その場の入力で結果が出て、「保存できませんでした」と出る(Task 4 の `saveHandToLocal` のテストと Task 5 の手での確認)。
4. 絞り込みで 0 件のとき → 「条件を減らしてください」と外すボタン(Task 1 の `applyFilter` テストと Task 5)。
5. アフィリエイトの環境変数に空白や変な文字が入っているとき → 未設定として扱い、PR を出さない(Task 2 のテスト)。

---

### Task 0: ブランチ(済み)

`feat/mouse-finder` は `feat/aim-daily` から作成済み(設計書のコミット 09e60fa)。

---

### Task 1: 合う順の計算 `mouse-fit.ts`

**Files:**
- Create: `src/lib/mouse-fit.ts`
- Create: `src/data/mice.ts`(型と空の配列だけ。データは Task 3)
- Test: `tests/lib/mouse-fit.test.ts`

**Interfaces:**
- Produces:
  - `src/data/mice.ts`:`export type MouseSpec = { id: string; lengthMm: number; widthMm: number; heightMm: number; weightG: number; shape: "symmetric" | "right"; connection: "wired" | "wireless"; officialUrl: string; checkedAt: string }`、`export const MICE: MouseSpec[]`、`export function mouseById(id: string): MouseSpec | undefined`
  - `src/lib/mouse-fit.ts`:`Hand`、`Target`、`Ranked`、`MouseFilter`、`NO_FILTER`、`FIT_COEF`、`RANGE_MM`、`fitTarget(h)`、`fitDistance(t, m)`、`fitScore(d)`、`rankMice(h, mice)`、`applyFilter(list, f)`、`targetText(t)`、`compareWith(current, m)`、`handFrom(hand)`

- [ ] **Step 1: 型だけのデータファイルを作る**

`src/data/mice.ts`:

```ts
/**
 * マウスの大きさ・重さ(メーカー公式の製品ページの数字。価格は載せない)。
 * id は src/data/devices.ts と同じ。メーカー名・製品名は devices.ts を使う。
 * 増やすときは devices.ts とこのファイルの両方に足す(tests/data/mice.test.ts が確かめる)。
 */
export type MouseSpec = {
  id: string;
  lengthMm: number;
  /** いちばん広いところ */
  widthMm: number;
  heightMm: number;
  /** 標準の構成(公式の表記どおり) */
  weightG: number;
  shape: "symmetric" | "right";
  connection: "wired" | "wireless";
  /** 数字の出典(メーカー公式の製品ページ) */
  officialUrl: string;
  /** 確認した日(YYYY-MM-DD) */
  checkedAt: string;
};

export const MICE: MouseSpec[] = [];

export function mouseById(id: string): MouseSpec | undefined {
  return MICE.find((m) => m.id === id);
}
```

- [ ] **Step 2: 失敗するテストを書く**

`tests/lib/mouse-fit.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import type { MouseSpec } from "@/data/mice";
import {
  applyFilter, compareWith, fitDistance, fitScore, fitTarget, handFrom, NO_FILTER, rankMice, targetText,
} from "@/lib/mouse-fit";

const m = (id: string, lengthMm: number, widthMm: number, weightG: number, extra: Partial<MouseSpec> = {}): MouseSpec => ({
  id, lengthMm, widthMm, heightMm: 38, weightG, shape: "symmetric", connection: "wireless",
  officialUrl: "https://example.com/" + id, checkedAt: "2026-09-29", ...extra,
});

describe("fitTarget", () => {
  it("uses the grip coefficients (palm 0.64/0.62, claw 0.60/0.60, fingertip 0.56/0.56)", () => {
    expect(fitTarget({ lengthCm: 18.5, widthCm: 9, grip: "palm" })).toEqual({ lengthMm: 118.4, widthMm: 55.8 });
    expect(fitTarget({ lengthCm: 18.5, widthCm: 9, grip: "claw" })).toEqual({ lengthMm: 111, widthMm: 54 });
    expect(fitTarget({ lengthCm: 18.5, widthCm: 9, grip: "fingertip" })).toEqual({ lengthMm: 103.6, widthMm: 50.4 });
  });
  it("keeps width null when the hand width is unknown", () => {
    expect(fitTarget({ lengthCm: 18.5, widthCm: null, grip: "palm" })).toEqual({ lengthMm: 118.4, widthMm: null });
  });
  it("describes the range in whole millimetres", () => {
    expect(targetText({ lengthMm: 118.4, widthMm: 55.8 })).toBe("長さ 114〜122mm・幅 53〜59mm");
    expect(targetText({ lengthMm: 118.4, widthMm: null })).toBe("長さ 114〜122mm");
  });
});

describe("fitDistance / fitScore", () => {
  it("scales length by 6mm and width by 4mm", () => {
    expect(fitDistance({ lengthMm: 120, widthMm: 60 }, { lengthMm: 126, widthMm: 60 })).toBeCloseTo(1);
    expect(fitDistance({ lengthMm: 120, widthMm: 60 }, { lengthMm: 120, widthMm: 64 })).toBeCloseTo(1);
    expect(fitDistance({ lengthMm: 120, widthMm: 60 }, { lengthMm: 126, widthMm: 64 })).toBeCloseTo(Math.SQRT2);
  });
  it("ignores width when the target width is null", () => {
    expect(fitDistance({ lengthMm: 120, widthMm: null }, { lengthMm: 126, widthMm: 99 })).toBeCloseTo(1);
  });
  it("maps distance 0 to 100 and 3 or more to 0", () => {
    expect(fitScore(0)).toBe(100);
    expect(fitScore(1.5)).toBe(50);
    expect(fitScore(3)).toBe(0);
    expect(fitScore(10)).toBe(0);
  });
});

describe("rankMice", () => {
  const hand = { lengthCm: 18.5, widthCm: 9, grip: "palm" as const }; // 目安 118.4 / 55.8
  it("orders by distance, then lighter, then id", () => {
    const list = rankMice(hand, [m("far", 130, 66, 50), m("b-close", 118, 56, 60), m("a-close", 118, 56, 60), m("light", 118, 56, 55)]);
    expect(list.map((r) => r.mouse.id)).toEqual(["light", "a-close", "b-close", "far"]);
  });
  it("explains length and width against the range (±4mm / ±3mm)", () => {
    const [ok] = rankMice(hand, [m("ok", 122.4, 58.8, 60)]);
    expect(ok.reasons).toEqual(["長さが目安どおり", "幅が目安どおり"]);
    const [small] = rankMice(hand, [m("s", 114.3, 52.7, 60)]);
    expect(small.reasons).toEqual(["長さがやや短め(細かい操作向き)", "幅がやや狭め"]);
    const [large] = rankMice(hand, [m("l", 122.5, 58.9, 60)]);
    expect(large.reasons).toEqual(["長さがやや長め(安定しやすい)", "幅がやや広め"]);
  });
  it("gives only the length reason when the hand width is unknown", () => {
    const [r] = rankMice({ ...hand, widthCm: null }, [m("x", 118, 70, 60)]);
    expect(r.reasons).toEqual(["長さが目安どおり"]);
    expect(r.score).toBe(fitScore(Math.abs(118 - 118.4) / 6));
  });
});

describe("applyFilter", () => {
  const list = rankMice({ lengthCm: 18.5, widthCm: 9, grip: "palm" }, [
    m("a", 118, 56, 50, { shape: "right", connection: "wired" }),
    m("b", 119, 56, 65),
    m("c", 120, 57, 80),
  ]);
  it("keeps the order and filters by weight, shape and connection", () => {
    expect(applyFilter(list, NO_FILTER).map((r) => r.mouse.id)).toEqual(["a", "b", "c"]);
    expect(applyFilter(list, { ...NO_FILTER, weight: "le55" }).map((r) => r.mouse.id)).toEqual(["a"]);
    expect(applyFilter(list, { ...NO_FILTER, weight: "le70" }).map((r) => r.mouse.id)).toEqual(["a", "b"]);
    expect(applyFilter(list, { ...NO_FILTER, weight: "gt70" }).map((r) => r.mouse.id)).toEqual(["c"]);
    expect(applyFilter(list, { ...NO_FILTER, shape: "right" }).map((r) => r.mouse.id)).toEqual(["a"]);
    expect(applyFilter(list, { ...NO_FILTER, connection: "wireless" }).map((r) => r.mouse.id)).toEqual(["b", "c"]);
  });
  it("can return an empty list", () => {
    expect(applyFilter(list, { weight: "le55", shape: "symmetric", connection: "all" })).toEqual([]);
  });
});

describe("compareWith", () => {
  const cur = m("cur", 125, 63, 60, { heightMm: 40 });
  it("shows signed differences and ほぼ同じ within 1", () => {
    expect(compareWith(cur, m("x", 121, 63.5, 48, { heightMm: 38 }))).toBe("今のマウスより 長さ −4mm・幅 ほぼ同じ・高さ −2mm・重さ −12g");
    expect(compareWith(cur, m("y", 130.5, 66, 61, { heightMm: 40 }))).toBe("今のマウスより 長さ +5.5mm・幅 +3mm・高さ ほぼ同じ・重さ ほぼ同じ");
  });
  it("says so when everything is within 1", () => {
    expect(compareWith(cur, m("z", 125.5, 63, 60.5, { heightMm: 40 }))).toBe("今のマウスとほぼ同じ大きさ・重さ");
  });
  it("marks the mouse you already use", () => {
    expect(compareWith(cur, cur)).toBe("今使っているマウス");
  });
});

describe("handFrom", () => {
  it("needs length and grip; width is optional", () => {
    expect(handFrom({ lengthCm: 18.5, widthCm: null, grip: "claw" })).toEqual({ lengthCm: 18.5, widthCm: null, grip: "claw" });
    expect(handFrom({ lengthCm: null, widthCm: 9, grip: "claw" })).toBeNull();
    expect(handFrom({ lengthCm: 18.5, widthCm: 9, grip: null })).toBeNull();
    expect(handFrom(null)).toBeNull();
  });
});
```

- [ ] **Step 3: 失敗を確かめる**

Run: `npx vitest run tests/lib/mouse-fit.test.ts`
Expected: FAIL(`@/lib/mouse-fit` がない)

- [ ] **Step 4: 実装する**

`src/lib/mouse-fit.ts`:

```ts
import type { Grip, MySettings } from "@/lib/my-settings";
import type { MouseSpec } from "@/data/mice";

/**
 * 手の大きさ × 係数 = ちょうどいいマウスの長さ・幅の目安(docs/superpowers/specs/2026-09-29-mouse-finder-design.md 4.1)。
 * 係数は一般的な手のサイズ表の考え方を元にした仮の値。本人の手応えで調整する。
 */
export const FIT_COEF: Record<Grip, { length: number; width: number }> = {
  palm: { length: 0.64, width: 0.62 },
  claw: { length: 0.6, width: 0.6 },
  fingertip: { length: 0.56, width: 0.56 },
};
/** 目安の範囲(±mm) */
export const RANGE_MM = { length: 4, width: 3 };
/** ずれの距離で「1」とみなす mm(幅のずれを長さより重く見る) */
const SCALE_MM = { length: 6, width: 4 };
/** この距離で合う度が 0 になる */
const ZERO_AT = 3;

export type Hand = { lengthCm: number; widthCm: number | null; grip: Grip };
export type Target = { lengthMm: number; widthMm: number | null };
export type Ranked = { mouse: MouseSpec; distance: number; score: number; reasons: string[] };
export type MouseFilter = {
  weight: "all" | "le55" | "le70" | "gt70";
  shape: "all" | MouseSpec["shape"];
  connection: "all" | MouseSpec["connection"];
};
export const NO_FILTER: MouseFilter = { weight: "all", shape: "all", connection: "all" };

const round1 = (x: number) => Math.round(x * 10) / 10;

export function fitTarget(h: Hand): Target {
  const c = FIT_COEF[h.grip];
  return { lengthMm: round1(h.lengthCm * 10 * c.length), widthMm: h.widthCm === null ? null : round1(h.widthCm * 10 * c.width) };
}

export function targetText(t: Target): string {
  const range = (v: number, r: number) => `${Math.round(v - r)}〜${Math.round(v + r)}mm`;
  const length = `長さ ${range(t.lengthMm, RANGE_MM.length)}`;
  return t.widthMm === null ? length : `${length}・幅 ${range(t.widthMm, RANGE_MM.width)}`;
}

export function fitDistance(t: Target, m: Pick<MouseSpec, "lengthMm" | "widthMm">): number {
  const dl = (m.lengthMm - t.lengthMm) / SCALE_MM.length;
  const dw = t.widthMm === null ? 0 : (m.widthMm - t.widthMm) / SCALE_MM.width;
  return Math.sqrt(dl * dl + dw * dw);
}

export function fitScore(d: number): number {
  return Math.round(100 * Math.max(0, 1 - d / ZERO_AT));
}

type Verdict = "ok" | "small" | "large";
function verdict(actual: number, target: number, range: number): Verdict {
  // 浮動小数の誤差で境目がずれないよう、0.1mm 単位にそろえて比べる
  const diff = round1(actual - target);
  if (diff < -range) return "small";
  if (diff > range) return "large";
  return "ok";
}
const REASON: Record<"length" | "width", Record<Verdict, string>> = {
  length: { ok: "長さが目安どおり", small: "長さがやや短め(細かい操作向き)", large: "長さがやや長め(安定しやすい)" },
  width: { ok: "幅が目安どおり", small: "幅がやや狭め", large: "幅がやや広め" },
};

/** 目安に近い順(同じなら軽い順、それも同じなら id 順)。 */
export function rankMice(h: Hand, mice: MouseSpec[]): Ranked[] {
  const t = fitTarget(h);
  return mice
    .map((mouse) => {
      const distance = fitDistance(t, mouse);
      const reasons = [REASON.length[verdict(mouse.lengthMm, t.lengthMm, RANGE_MM.length)]];
      if (t.widthMm !== null) reasons.push(REASON.width[verdict(mouse.widthMm, t.widthMm, RANGE_MM.width)]);
      return { mouse, distance, score: fitScore(distance), reasons };
    })
    .sort((a, b) => a.distance - b.distance || a.mouse.weightG - b.mouse.weightG || (a.mouse.id < b.mouse.id ? -1 : a.mouse.id > b.mouse.id ? 1 : 0));
}

/** 絞り込み(並び順は変えない)。 */
export function applyFilter(list: Ranked[], f: MouseFilter): Ranked[] {
  return list.filter(({ mouse: m }) => {
    if (f.weight === "le55" && m.weightG > 55) return false;
    if (f.weight === "le70" && m.weightG > 70) return false;
    if (f.weight === "gt70" && m.weightG <= 70) return false;
    if (f.shape !== "all" && m.shape !== f.shape) return false;
    if (f.connection !== "all" && m.connection !== f.connection) return false;
    return true;
  });
}

/** 今のマウスとの差。差の絶対値が 1 以下は「ほぼ同じ」。 */
export function compareWith(current: MouseSpec, m: MouseSpec): string {
  if (current.id === m.id) return "今使っているマウス";
  const items: [string, number, string][] = [
    ["長さ", m.lengthMm - current.lengthMm, "mm"],
    ["幅", m.widthMm - current.widthMm, "mm"],
    ["高さ", m.heightMm - current.heightMm, "mm"],
    ["重さ", m.weightG - current.weightG, "g"],
  ];
  if (items.every(([, d]) => Math.abs(d) <= 1)) return "今のマウスとほぼ同じ大きさ・重さ";
  const fmt = (d: number, unit: string) => {
    if (Math.abs(d) <= 1) return "ほぼ同じ";
    const v = round1(Math.abs(d));
    return `${d < 0 ? "−" : "+"}${Number.isInteger(v) ? v : v.toFixed(1)}${unit}`;
  };
  return "今のマウスより " + items.map(([label, d, unit]) => `${label} ${fmt(d, unit)}`).join("・");
}

/** マイ設定の手の情報から、計算に使える形にする(長さと持ち方が必要。幅はなくてよい)。 */
export function handFrom(hand: MySettings["hand"] | null): Hand | null {
  if (!hand || hand.lengthCm === null || hand.grip === null) return null;
  return { lengthCm: hand.lengthCm, widthCm: hand.widthCm, grip: hand.grip };
}
```

- [ ] **Step 5: 通ることを確かめる**

Run: `npx vitest run tests/lib/mouse-fit.test.ts`、`npx tsc --noEmit`、`npm run lint`
Expected: PASS、エラーなし

- [ ] **Step 6: コミット** `feat: マウス探しの合う順の計算を追加`

---

### Task 2: 買う・詳しく見るリンクとシェア文

**Files:**
- Create: `src/lib/shop-links.ts`、`src/lib/mouse-share.ts`
- Test: `tests/lib/shop-links.test.ts`、`tests/lib/mouse-share.test.ts`

**Interfaces:**
- Produces:
  - `shopLinks(query: string, officialUrl: string, env?: AffiliateEnv): ShopLinks`
  - `type ShopLinks = { official: string; amazon: string; rakuten: string; amazonPr: boolean; rakutenPr: boolean }`
  - `type AffiliateEnv = { amazonTag?: string; rakutenId?: string }`、`affiliateEnv(): AffiliateEnv`(`process.env.NEXT_PUBLIC_*` を読む)
  - `buildMouseShareText(top: { brand: string; name: string }[]): string`

- [ ] **Step 1: 失敗するテストを書く**

`tests/lib/shop-links.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { shopLinks } from "@/lib/shop-links";

const OFFICIAL = "https://gaming.logicool.co.jp/ja-jp/products/gaming-mice/pro-x2-superlight-wireless-mouse.html";

describe("shopLinks", () => {
  it("builds plain search links without affiliate settings", () => {
    const l = shopLinks("Logicool G PRO X SUPERLIGHT 2", OFFICIAL, {});
    expect(l.official).toBe(OFFICIAL);
    const a = new URL(l.amazon);
    expect(a.origin + a.pathname).toBe("https://www.amazon.co.jp/s");
    expect(a.searchParams.get("k")).toBe("Logicool G PRO X SUPERLIGHT 2");
    expect(a.searchParams.has("tag")).toBe(false);
    expect(l.rakuten).toBe("https://search.rakuten.co.jp/search/mall/Logicool%20G%20PRO%20X%20SUPERLIGHT%202/");
    expect(l.amazonPr).toBe(false);
    expect(l.rakutenPr).toBe(false);
  });
  it("adds the Amazon tag and wraps Rakuten when configured", () => {
    const l = shopLinks("Razer Viper V3 Pro", OFFICIAL, { amazonTag: "robilab-22", rakutenId: "1a2b3c4d.5e6f7a8b.1a2b3c4d.5e6f7a8b" });
    expect(new URL(l.amazon).searchParams.get("tag")).toBe("robilab-22");
    const r = new URL(l.rakuten);
    expect(r.origin + r.pathname).toBe("https://hb.afl.rakuten.co.jp/hgc/1a2b3c4d.5e6f7a8b.1a2b3c4d.5e6f7a8b/");
    expect(r.searchParams.get("pc")).toBe("https://search.rakuten.co.jp/search/mall/Razer%20Viper%20V3%20Pro/");
    expect(l.amazonPr).toBe(true);
    expect(l.rakutenPr).toBe(true);
  });
  it("treats malformed settings as unset", () => {
    const l = shopLinks("X", OFFICIAL, { amazonTag: " bad tag ", rakutenId: "../evil" });
    expect(new URL(l.amazon).searchParams.has("tag")).toBe(false);
    expect(l.rakuten.startsWith("https://search.rakuten.co.jp/")).toBe(true);
    expect(l.amazonPr).toBe(false);
    expect(l.rakutenPr).toBe(false);
  });
  it("encodes symbols in the query", () => {
    const l = shopLinks("A&B/C #1", OFFICIAL, {});
    expect(new URL(l.amazon).searchParams.get("k")).toBe("A&B/C #1");
    expect(l.rakuten).toBe("https://search.rakuten.co.jp/search/mall/A%26B%2FC%20%231/");
  });
});
```

`tests/lib/mouse-share.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { buildMouseShareText } from "@/lib/mouse-share";

describe("buildMouseShareText", () => {
  it("lists up to three mice with brand and name, and hashtags", () => {
    const text = buildMouseShareText([
      { brand: "Logicool G", name: "PRO X SUPERLIGHT 2" },
      { brand: "Razer", name: "Viper V3 Pro" },
      { brand: "ZOWIE", name: "EC2-CW" },
      { brand: "Pulsar", name: "X2 V2" },
    ]);
    expect(text).toBe("私に合うマウス TOP3\n1. Logicool G PRO X SUPERLIGHT 2\n2. Razer Viper V3 Pro\n3. ZOWIE EC2-CW\n#ロビラボ #マウス探し");
  });
  it("never contains hand sizes (the function takes only product names)", () => {
    const text = buildMouseShareText([{ brand: "Razer", name: "Viper Mini" }]);
    expect(text).not.toMatch(/cm|手の/);
  });
});
```

- [ ] **Step 2: 失敗を確かめる** — `npx vitest run tests/lib/shop-links.test.ts tests/lib/mouse-share.test.ts` → FAIL

- [ ] **Step 3: 実装する**

`src/lib/shop-links.ts`:

```ts
/**
 * 公式ページと Amazon・楽天の検索リンク。
 * アフィリエイトの審査が通ったら、Vercel に NEXT_PUBLIC_AMAZON_ASSOCIATE_TAG / NEXT_PUBLIC_RAKUTEN_AFFILIATE_ID を入れると
 * 成果報酬付きのリンクになり、そのときだけ「PR」を表示する。形が正しくない値は未設定として扱う。
 */
export type AffiliateEnv = { amazonTag?: string; rakutenId?: string };
export type ShopLinks = { official: string; amazon: string; rakuten: string; amazonPr: boolean; rakutenPr: boolean };

const AMAZON_TAG_RE = /^[A-Za-z0-9-]{1,64}$/;
const RAKUTEN_ID_RE = /^[0-9a-f]{8}(\.[0-9a-f]{8}){3}$/i;

export function affiliateEnv(): AffiliateEnv {
  // NEXT_PUBLIC_ の値は組み立て時に埋め込まれる(ブラウザでも読める公開の値)
  return { amazonTag: process.env.NEXT_PUBLIC_AMAZON_ASSOCIATE_TAG, rakutenId: process.env.NEXT_PUBLIC_RAKUTEN_AFFILIATE_ID };
}

export function shopLinks(query: string, officialUrl: string, env: AffiliateEnv = affiliateEnv()): ShopLinks {
  const amazonTag = env.amazonTag && AMAZON_TAG_RE.test(env.amazonTag) ? env.amazonTag : null;
  const rakutenId = env.rakutenId && RAKUTEN_ID_RE.test(env.rakutenId) ? env.rakutenId : null;

  const amazon = new URL("https://www.amazon.co.jp/s");
  amazon.searchParams.set("k", query);
  if (amazonTag) amazon.searchParams.set("tag", amazonTag);

  const rakutenSearch = `https://search.rakuten.co.jp/search/mall/${encodeURIComponent(query)}/`;
  let rakuten = rakutenSearch;
  if (rakutenId) {
    const u = new URL(`https://hb.afl.rakuten.co.jp/hgc/${rakutenId}/`);
    u.searchParams.set("pc", rakutenSearch);
    rakuten = u.toString();
  }
  return { official: officialUrl, amazon: amazon.toString(), rakuten, amazonPr: amazonTag !== null, rakutenPr: rakutenId !== null };
}
```

`src/lib/mouse-share.ts`:

```ts
/** 「私に合うマウス TOP3」の投稿文。手の大きさ(個人の情報)は入れない。 */
export function buildMouseShareText(top: { brand: string; name: string }[]): string {
  const lines = ["私に合うマウス TOP3", ...top.slice(0, 3).map((m, i) => `${i + 1}. ${m.brand} ${m.name}`), "#ロビラボ #マウス探し"];
  return lines.join("\n");
}
```

- [ ] **Step 4: 通ることを確かめる** — 上の2つのテスト、`npx tsc --noEmit`、`npm run lint`

- [ ] **Step 5: コミット** `feat: マウス探しのリンクとシェア文を追加`

---

### Task 3: マウスのデータ(公式サイトから)

**Files:**
- Modify: `src/data/mice.ts`(`MICE` にデータを入れる)
- Modify(必要なときだけ): `src/data/devices.ts`(公式の製品名と違う表記を直す。id は変えない)
- Test: `tests/data/mice.test.ts`

**Interfaces:**
- Consumes: `MouseSpec`(Task 1)、`DEVICES`(`src/data/devices.ts`)
- Produces: 中身の入った `MICE`

- [ ] **Step 1: 失敗するテストを書く**

`tests/data/mice.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { MICE, mouseById } from "@/data/mice";
import { DEVICES } from "@/data/devices";

describe("mice data", () => {
  it("has at least 20 mice with unique ids that exist as mice in devices.ts", () => {
    expect(MICE.length).toBeGreaterThanOrEqual(20);
    const ids = MICE.map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const m of MICE) {
      const d = DEVICES.find((x) => x.id === m.id);
      expect(d, m.id).toBeDefined();
      expect(d!.category, m.id).toBe("mouse");
    }
  });
  it("keeps numbers in realistic ranges", () => {
    for (const m of MICE) {
      expect(m.lengthMm, m.id).toBeGreaterThanOrEqual(90);
      expect(m.lengthMm, m.id).toBeLessThanOrEqual(140);
      expect(m.widthMm, m.id).toBeGreaterThanOrEqual(50);
      expect(m.widthMm, m.id).toBeLessThanOrEqual(80);
      expect(m.heightMm, m.id).toBeGreaterThanOrEqual(20);
      expect(m.heightMm, m.id).toBeLessThanOrEqual(50);
      expect(m.weightG, m.id).toBeGreaterThanOrEqual(30);
      expect(m.weightG, m.id).toBeLessThanOrEqual(150);
    }
  });
  it("cites an https manufacturer page (not a shop) and a check date", () => {
    for (const m of MICE) {
      const u = new URL(m.officialUrl);
      expect(u.protocol, m.id).toBe("https:");
      expect(u.hostname, m.id).not.toMatch(/amazon|rakuten|yodobashi|kakaku/);
      expect(m.checkedAt, m.id).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });
  it("finds a mouse by id", () => {
    expect(mouseById(MICE[0].id)).toBe(MICE[0]);
    expect(mouseById("no-such-mouse")).toBeUndefined();
  });
});
```

- [ ] **Step 2: 失敗を確かめる** — `npx vitest run tests/data/mice.test.ts` → FAIL(0 件)

- [ ] **Step 3: 公式ページを調べてデータを入れる**
  - 対象:`src/data/devices.ts` の `category: "mouse"` の全件(30 本)。
  - 1本ずつメーカー公式の製品ページ(日本語ページがあれば日本語)を開き、長さ・幅・高さ・重さ・形(左右対称/右手用)・接続(有線/無線)を写す。`officialUrl` はそのページ、`checkedAt` は調べた日。
  - 本人の許可(2026-09-29)により、メーカー公式サイトの閲覧はしてよい。ショップ・レビューサイトの数字は使わない。
  - 公式に数字がない項目があるマウスは、推測で埋めず `MICE` に入れない。ファイルの末尾にコメントで「外したもの:id と理由」を残す。
  - 重さに幅がある(ケーブル込み/抜き、重りあり)ときは、公式の標準の数字(本体のみ)を使う。
  - 公式の製品名が `devices.ts` の表記と違う(例:大文字小文字、型番)ときは、`devices.ts` の `name` を公式どおりに直し、報告に書く。存在しない製品だったら、`devices.ts` から消さずに報告だけする(マイ設定に保存済みの id を壊さないため)。
  - 並びは `devices.ts` と同じ順。

- [ ] **Step 4: 通ることを確かめる** — `npx vitest run tests/data/mice.test.ts`、`npm test`、`npx tsc --noEmit`、`npm run lint`

- [ ] **Step 5: コミット** `feat: マウス探しのデータ(公式サイトの大きさ・重さ)を追加`

---

### Task 4: 手の入力(案内の図つき)

**Files:**
- Modify: `src/lib/my-settings-store.ts`(`saveHandToLocal` を足す)
- Create: `src/components/mouse/HandGuide.tsx`、`src/components/mouse/HandSetup.tsx`
- Test: `tests/lib/my-settings-store.test.ts` に追記

**Interfaces:**
- Consumes: `updateLocal`(`my-settings-store.ts` 内)、`NumberField`(`src/components/my/NumberField.tsx`)、`MY_SETTINGS_LIMITS`・`GRIPS`・`Grip`・`MySettings`(`src/lib/my-settings.ts`)
- Produces:
  - `saveHandToLocal(storage: SettingsStorage | null, hand: MySettings["hand"], now?: Date): MySettings | null`
  - `<HandSetup initial={MySettings["hand"]} onDone={(hand: MySettings["hand"], saved: boolean) => void} />`
  - `GRIP_INFO: Record<Grip, { label: string; note: string }>`(`HandSetup.tsx` から export)

- [ ] **Step 1: 失敗するテストを書く**(`tests/lib/my-settings-store.test.ts` の末尾に足す。ファイル内の既存のメモリ上の storage の作り方に合わせる。なければ下の `memStorage` を使う)

```ts
import { saveHandToLocal, loadLocal, loadDirty } from "@/lib/my-settings-store";

function memStorage() {
  const m = new Map<string, string>();
  return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v), removeItem: (k: string) => void m.delete(k) };
}

describe("saveHandToLocal", () => {
  it("saves the hand and marks it dirty for sync", () => {
    const s = memStorage();
    const saved = saveHandToLocal(s, { lengthCm: 18.5, widthCm: null, grip: "claw" }, new Date("2026-10-01T00:00:00Z"));
    expect(saved?.hand).toEqual({ lengthCm: 18.5, widthCm: null, grip: "claw" });
    expect(loadLocal(s)?.hand).toEqual({ lengthCm: 18.5, widthCm: null, grip: "claw" });
    expect(loadDirty(s)).toContain("hand");
  });
  it("refuses values outside the limits", () => {
    const s = memStorage();
    expect(saveHandToLocal(s, { lengthCm: 30, widthCm: null, grip: "palm" })).toBeNull();
    expect(loadLocal(s)).toBeNull();
  });
});
```

- [ ] **Step 2: 失敗を確かめる** — `npx vitest run tests/lib/my-settings-store.test.ts` → FAIL

- [ ] **Step 3: 実装する**

`src/lib/my-settings-store.ts` の `saveSensToLocal` の後に足す:

```ts
/** マウス探しの「手の情報」をマイ設定に保存する。範囲外なら保存せず null。 */
export function saveHandToLocal(storage: SettingsStorage | null, hand: MySettings["hand"], now: Date = new Date()) {
  return updateLocal(storage, (s) => ({ next: { ...s, hand }, keys: ["hand"] }), now);
}
```

`src/components/mouse/HandGuide.tsx`(自作の SVG。外部画像は使わない):

```tsx
/** 手の測り方の図。長さ=手首のしわから中指の先まで、幅=親指を除いた4本の付け根の幅。 */
export function HandGuide() {
  return (
    <figure className="grid gap-2">
      <svg viewBox="0 0 220 260" role="img" aria-label="手の長さと幅の測り方" className="mx-auto h-56 w-auto">
        <g fill="none" stroke="var(--rl-muted)" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round">
          {/* 手のひらと指 */}
          <path d="M70 240 L70 150 Q70 130 80 125 L80 60 Q80 48 90 48 Q100 48 100 60 L100 120 L102 40 Q102 28 112 28 Q122 28 122 40 L122 118 L126 48 Q126 36 136 36 Q146 36 146 48 L146 122 L150 72 Q150 60 160 60 Q170 60 170 72 L170 170 Q170 215 140 240 Z" />
          {/* 親指 */}
          <path d="M70 175 Q48 160 38 135 Q32 122 42 118 Q52 114 58 128 L70 150" />
        </g>
        {/* 長さ:手首から中指の先 */}
        <g stroke="var(--rl-accent)" strokeWidth="3" fill="var(--rl-accent)">
          <line x1="190" y1="28" x2="190" y2="240" />
          <path d="M184 38 L190 28 L196 38 Z M184 230 L190 240 L196 230 Z" />
        </g>
        <text x="200" y="140" fill="var(--rl-accent)" fontSize="14" writingMode="vertical-rl">長さ</text>
        {/* 幅:4本の付け根 */}
        <g stroke="var(--rl-highlight)" strokeWidth="3" fill="var(--rl-highlight)">
          <line x1="80" y1="135" x2="170" y2="135" />
          <path d="M90 129 L80 135 L90 141 Z M160 129 L170 135 L160 141 Z" />
        </g>
        <text x="112" y="158" fill="var(--rl-highlight)" fontSize="14">幅</text>
      </svg>
      <figcaption className="text-xs text-[var(--rl-muted)]">
        長さ:手首のしわから中指の先まで。幅:親指を除いた4本の指の付け根のいちばん広いところ。定規やメジャーで測ってください。
      </figcaption>
    </figure>
  );
}
```

`src/components/mouse/HandSetup.tsx`:

```tsx
"use client";
import { useState } from "react";
import { GRIPS, MY_SETTINGS_LIMITS, type Grip, type MySettings } from "@/lib/my-settings";
import { browserStorage, saveHandToLocal } from "@/lib/my-settings-store";
import { NumberField } from "@/components/my/NumberField";
import { HandGuide } from "./HandGuide";

export const GRIP_INFO: Record<Grip, { label: string; note: string }> = {
  palm: { label: "かぶせ持ち", note: "手のひら全体をマウスに乗せる。安定しやすい" },
  claw: { label: "つかみ持ち", note: "手のひらの付け根だけ乗せ、指を立てる。細かい操作と安定の中間" },
  fingertip: { label: "つまみ持ち", note: "指先だけでつまむ。小さく軽いマウス向き" },
};

type Hand = MySettings["hand"];
const L = MY_SETTINGS_LIMITS;

/** 手の長さ・幅・持ち方の入力。保存はマイ設定(ブラウザ)。保存できなくても、その場の値で結果を出せるように返す。 */
export function HandSetup({ initial, onDone }: { initial: Hand; onDone: (hand: Hand, saved: boolean) => void }) {
  const [hand, setHand] = useState<Hand>(initial);
  const [error, setError] = useState<string | null>(null);

  const submit = () => {
    if (hand.lengthCm === null || hand.lengthCm < L.handLengthMin || hand.lengthCm > L.handLengthMax) {
      setError(`手の長さは ${L.handLengthMin}〜${L.handLengthMax}cm で入力してください。`);
      return;
    }
    if (hand.widthCm !== null && (hand.widthCm < L.handWidthMin || hand.widthCm > L.handWidthMax)) {
      setError(`手の幅は ${L.handWidthMin}〜${L.handWidthMax}cm で入力してください(わからなければ空欄で大丈夫です)。`);
      return;
    }
    if (hand.grip === null) {
      setError("持ち方を選んでください。");
      return;
    }
    setError(null);
    const storage = browserStorage();
    const saved = storage !== null && saveHandToLocal(storage, hand) !== null;
    onDone(hand, saved);
  };

  return (
    <section className="grid gap-4 rounded-2xl border border-[var(--rl-border)] bg-[var(--rl-surface)] p-4">
      <h2 className="font-bold">手の大きさと持ち方</h2>
      <p className="text-sm text-[var(--rl-muted)]">入力はマイ設定に保存され、次からは自動で使われます。</p>
      <HandGuide />
      <div className="grid grid-cols-2 gap-3">
        <NumberField label="手の長さ" suffix="cm" value={hand.lengthCm} onValue={(lengthCm) => setHand((h) => ({ ...h, lengthCm }))} />
        <NumberField label="手の幅(任意)" suffix="cm" value={hand.widthCm} onValue={(widthCm) => setHand((h) => ({ ...h, widthCm }))} />
      </div>
      <div className="grid gap-2" role="radiogroup" aria-label="持ち方">
        {GRIPS.map((g) => (
          <button key={g} type="button" role="radio" aria-checked={hand.grip === g}
            onClick={() => setHand((h) => ({ ...h, grip: g }))}
            className={`rounded-xl border px-4 py-3 text-left ${hand.grip === g ? "border-[var(--rl-accent)] bg-[var(--rl-card)]" : "border-white/10 bg-white/5"}`}>
            <span className="font-bold">{GRIP_INFO[g].label}</span>
            <span className="block text-xs text-[var(--rl-muted)]">{GRIP_INFO[g].note}</span>
          </button>
        ))}
      </div>
      {error && <p role="alert" className="text-sm text-[var(--rl-danger)]">{error}</p>}
      <button type="button" onClick={submit} className="h-12 rounded-full bg-[var(--rl-accent)] font-bold text-[var(--rl-on-accent)]">
        合うマウスを見る
      </button>
    </section>
  );
}
```

- [ ] **Step 4: 通ることを確かめる** — `npx vitest run tests/lib/my-settings-store.test.ts`、`npx tsc --noEmit`、`npm run lint`

- [ ] **Step 5: コミット** `feat: マウス探しの手の入力と測り方の図を追加`

---

### Task 5: `/mouse` ページ(結果・絞り込み・比較・シェア)

**Files:**
- Create: `src/app/mouse/page.tsx`、`src/app/mouse/MouseClient.tsx`、`src/app/mouse/opengraph-image.tsx`、`src/components/mouse/MouseCard.tsx`、`src/components/mouse/MouseFilters.tsx`
- Modify: `src/components/brand/SiteHeader.tsx`(「今日の文字」の次に「マウス探し」)、`src/proxy.ts`(matcher に `"/mouse"`)、`src/components/my/MySettingsEditor.tsx`(手と持ち方の欄にリンク)

**Interfaces:**
- Consumes: Task 1〜4 のすべて、`DEVICES`(`src/data/devices.ts`)、`buildXShareUrl`(`src/lib/share.ts`)、`getSiteUrl`(`src/lib/site-url.ts`)、`loadOgFont`(`src/lib/og-font.ts`)、`useIsClient`、`adoptServerIfLocalEmpty`・`browserStorage`・`loadLocal`(`src/lib/my-settings-store.ts`)、`createSupabaseBrowser`(`src/lib/supabase/client.ts`)
- Produces: `/mouse` ページ

- [ ] **Step 1: カードと絞り込みの部品**

`src/components/mouse/MouseCard.tsx`:

```tsx
import type { Ranked } from "@/lib/mouse-fit";
import type { ShopLinks } from "@/lib/shop-links";

const SHAPE = { symmetric: "左右対称", right: "右手用" } as const;
const CONNECTION = { wired: "有線", wireless: "無線" } as const;

export function MouseCard({ rank, item, brand, name, compare, links }: {
  rank: number; item: Ranked; brand: string; name: string; compare: string | null; links: ShopLinks;
}) {
  const m = item.mouse;
  return (
    <li className="grid gap-3 rounded-2xl border border-white/10 bg-[var(--rl-card)] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs text-[var(--rl-muted)]">{rank}位 ・ {brand}</p>
          <p className="text-lg font-bold">{name}</p>
        </div>
        <p className="shrink-0 text-right"><span className="text-2xl font-bold text-[var(--rl-highlight)]">{item.score}</span><span className="block text-xs text-[var(--rl-muted)]">合う度</span></p>
      </div>
      <p className="text-sm">{item.reasons.join(" ・ ")}</p>
      <dl className="grid grid-cols-3 gap-x-3 gap-y-1 text-xs text-[var(--rl-muted)] sm:grid-cols-6">
        <div><dt>長さ</dt><dd className="text-[var(--rl-text)]">{m.lengthMm}mm</dd></div>
        <div><dt>幅</dt><dd className="text-[var(--rl-text)]">{m.widthMm}mm</dd></div>
        <div><dt>高さ</dt><dd className="text-[var(--rl-text)]">{m.heightMm}mm</dd></div>
        <div><dt>重さ</dt><dd className="text-[var(--rl-text)]">{m.weightG}g</dd></div>
        <div><dt>形</dt><dd className="text-[var(--rl-text)]">{SHAPE[m.shape]}</dd></div>
        <div><dt>接続</dt><dd className="text-[var(--rl-text)]">{CONNECTION[m.connection]}</dd></div>
      </dl>
      {compare && <p className="text-xs text-[var(--rl-secondary)]">{compare}</p>}
      <div className="flex flex-wrap gap-2 text-sm">
        <a href={links.official} target="_blank" rel="noopener noreferrer" className="rounded-full bg-white/10 px-4 py-2">公式ページ</a>
        <a href={links.amazon} target="_blank" rel="sponsored noopener noreferrer" className="rounded-full bg-white/10 px-4 py-2">
          Amazon で探す{links.amazonPr && <span className="ml-1 text-xs text-[var(--rl-muted)]">PR</span>}
        </a>
        <a href={links.rakuten} target="_blank" rel="sponsored noopener noreferrer" className="rounded-full bg-white/10 px-4 py-2">
          楽天で探す{links.rakutenPr && <span className="ml-1 text-xs text-[var(--rl-muted)]">PR</span>}
        </a>
      </div>
    </li>
  );
}
```

`src/components/mouse/MouseFilters.tsx`:

```tsx
"use client";
import type { MouseFilter } from "@/lib/mouse-fit";

const GROUPS: { key: keyof MouseFilter; label: string; options: [string, string][] }[] = [
  { key: "weight", label: "重さ", options: [["all", "すべて"], ["le55", "〜55g"], ["le70", "〜70g"], ["gt70", "70g より重い"]] },
  { key: "shape", label: "形", options: [["all", "すべて"], ["symmetric", "左右対称"], ["right", "右手用"]] },
  { key: "connection", label: "接続", options: [["all", "すべて"], ["wireless", "無線"], ["wired", "有線"]] },
];

export function MouseFilters({ value, onChange }: { value: MouseFilter; onChange: (f: MouseFilter) => void }) {
  return (
    <div className="grid gap-2">
      {GROUPS.map((g) => (
        <div key={g.key} className="flex flex-wrap items-center gap-2 text-sm" role="radiogroup" aria-label={g.label}>
          <span className="w-10 text-[var(--rl-muted)]">{g.label}</span>
          {g.options.map(([v, text]) => (
            <button key={v} type="button" role="radio" aria-checked={value[g.key] === v}
              onClick={() => onChange({ ...value, [g.key]: v } as MouseFilter)}
              className={`rounded-full border px-3 py-1 ${value[g.key] === v ? "border-[var(--rl-secondary)] bg-[var(--rl-card)]" : "border-white/10"}`}>
              {text}
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: クライアント**

`src/app/mouse/MouseClient.tsx`:

```tsx
"use client";
import { useEffect, useMemo, useState } from "react";
import { DEVICES } from "@/data/devices";
import { MICE, mouseById } from "@/data/mice";
import { applyFilter, compareWith, fitTarget, handFrom, NO_FILTER, rankMice, targetText, type MouseFilter } from "@/lib/mouse-fit";
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

  const settings = isClient ? loadLocal(browserStorage()) : null;
  void rev;
  const handRaw = memoryHand ?? settings?.hand ?? null;
  const hand = handFrom(handRaw);

  // ログインしていて、この端末にマイ設定がなければ、サーバーの設定を使う(/aim と同じ。サーバーへは送らない)
  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return;
    let cancelled = false;
    (async () => {
      const storage = browserStorage();
      if (loadLocal(storage)) return;
      const supabase = createSupabaseBrowser();
      const { data } = await supabase.auth.getUser();
      if (cancelled || !data.user) return;
      const { data: row, error } = await supabase.from("my_settings").select("data").maybeSingle();
      if (cancelled || error) return;
      if (adoptServerIfLocalEmpty(storage, row?.data ?? null)) setRev((n) => n + 1);
    })();
    return () => { cancelled = true; };
  }, []);

  const ranked = useMemo(() => (hand ? rankMice(hand, MICE) : []), [hand?.lengthCm, hand?.widthCm, hand?.grip]); // eslint-disable-line react-hooks/exhaustive-deps
  const filtered = applyFilter(ranked, filter);
  const shown = showAll ? filtered : filtered.slice(0, FIRST);

  const currentRef = settings?.devices.mouse ?? null;
  const currentMouse = currentRef && "id" in currentRef ? mouseById(currentRef.id) ?? null : null;

  if (!isClient) return <div className="h-40 rounded-2xl bg-white/5" />;

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
          {GRIP_INFO[hand.grip].label}・手の長さ {hand.lengthCm}cm{hand.widthCm !== null && `・幅 ${hand.widthCm}cm`}
        </p>
        <p className="text-lg font-bold">あなたの目安:<span className="text-[var(--rl-highlight)]">{targetText(target)}</span> くらいのマウス</p>
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
```

注意:`react-hooks/exhaustive-deps` の disable が lint で警告・エラーになる場合は、`useMemo` の依存を `[handKey]`(`const handKey = hand ? \`${hand.lengthCm}|${hand.widthCm}|${hand.grip}\` : ""`)にして disable を消し、`useMemo` の中で `handKey` から計算し直す形に書き換える。lint はエラー 0・警告 0 にする。

- [ ] **Step 3: ページと X 用画像**

`src/app/mouse/page.tsx`:

```tsx
import type { Metadata } from "next";
import Link from "next/link";
import { getSiteUrl } from "@/lib/site-url";
import { MouseClient } from "./MouseClient";

const TITLE = "マウス探し(手の大きさと持ち方で選ぶ)";
const DESCRIPTION = "手の長さ・幅と持ち方から、ちょうどいい大きさのゲーミングマウスを理由付きで並べます。";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: { title: TITLE, description: DESCRIPTION },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION },
};

export default function MousePage() {
  return (
    <main className="mx-auto grid max-w-3xl gap-6 px-4 py-6">
      <header>
        <h1 className="text-2xl font-bold">マウス探し</h1>
        <p className="text-sm text-[var(--rl-muted)]">手の大きさと持ち方から、ちょうどいい大きさのマウスを探します。</p>
      </header>
      <MouseClient pageUrl={`${getSiteUrl()}/mouse`} />
      <p className="text-xs text-[var(--rl-muted)]">
        大きさ・重さは各メーカー公式サイトの表記です(確認日はデータに記録)。目安は一般的な考え方を元にした参考の値です。
        価格や在庫は各ショップでご確認ください。Amazon・楽天のリンクには広告(PR)が含まれる場合があります(<Link href="/disclosure" className="underline">広告表記</Link>)。
      </p>
    </main>
  );
}
```

`src/app/mouse/opengraph-image.tsx`(固定の画像。`src/app/aim/opengraph-image.tsx` と同じ作り。日付で変わらないので `force-dynamic` にせず、既定のキャッシュのままにする):

```tsx
import { ImageResponse } from "next/og";
import { loadOgFont } from "@/lib/og-font";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "ロビラボ マウス探し";

export default async function Image() {
  const text = "ロビラボマウス探し手の大きさと持ち方で、ちょうどいいマウスを";
  const font = await loadOgFont([...new Set(text)].sort().join(""));
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 96px", color: "#eaf6ff",
        background: "radial-gradient(90% 120% at 85% 0%, #232a66 0%, #0a0c16 60%)", fontFamily: "ZenKaku" }}>
        <div style={{ fontSize: 34, textShadow: "2px 0 0 #FF4FD8, -2px 0 0 #39F3FF" }}>ロビラボ</div>
        <div style={{ fontSize: 110, marginTop: 12, color: "#39f3ff" }}>マウス探し</div>
        <div style={{ fontSize: 40, marginTop: 24, opacity: 0.85 }}>手の大きさと持ち方で、ちょうどいいマウスを</div>
      </div>
    ),
    { ...size, ...(font ? { fonts: [{ name: "ZenKaku", data: font, weight: 700 as const, style: "normal" as const }] } : {}) },
  );
}
```

- [ ] **Step 4: ヘッダー・proxy・マイ設定のリンク**
  - `src/components/brand/SiteHeader.tsx`:`<Link href="/aim" ...>今日の文字</Link>` の次に `<Link href="/mouse" className="whitespace-nowrap">マウス探し</Link>`。
  - `src/proxy.ts`:matcher に `"/mouse"` を足す(ログイン中のサーバー設定の読み込みで、セッションを新しくするため)。
  - `src/components/my/MySettingsEditor.tsx`:「手と持ち方」の欄の説明文 `<p className="text-xs ...">手の大きさはマウス探しで使います。…</p>` の直後に `<Link href="/mouse" className="text-sm underline">合うマウスを探す</Link>` を足す(`next/link` の import が無ければ足す)。

- [ ] **Step 5: 確かめる** — `npm test`、`npx tsc --noEmit`、`npm run lint`(0/0)、`npm run build`(`/mouse` と `/mouse/opengraph-image` が出る)

- [ ] **Step 6: 手で確かめる(コントローラーが built-in browser で行う。実装担当はしない)**
  - マイ設定が空 → `/mouse` で手の入力が出る → 入力して「合うマウスを見る」→ 目安と一覧が出る → 再読み込みしても結果が出る
  - 範囲外の長さで注意が出る。持ち方なしで注意が出る
  - 絞り込み(0 件の表示と「絞り込みを外す」)、「もっと見る」
  - マイ設定の今のマウスをデータにあるマウスにすると、比較の一言が出る
  - 外部リンクの `rel`、シェアの URL に手のサイズが入っていない
  - スマホ幅で崩れない。`/mouse/opengraph-image` が 200 の PNG

- [ ] **Step 7: コミット** `feat: マウス探しのページ(結果・絞り込み・比較・シェア)を追加`

---

### Task 6: 文書

**Files:** Modify `docs/ops/launch.md`、`content/legal/privacy.md`(必要なら)、`plan.md`

- [ ] **Step 1:** `docs/ops/launch.md` に足す:
  - 環境変数(任意・審査が通ってから):`NEXT_PUBLIC_AMAZON_ASSOCIATE_TAG`(例 `xxxx-22`)、`NEXT_PUBLIC_RAKUTEN_AFFILIATE_ID`(`xxxxxxxx.xxxxxxxx.xxxxxxxx.xxxxxxxx`)。入れたら再デプロイが必要(組み立て時に埋め込まれるため)。未設定なら普通の検索リンクになり、PR は出ない。
  - 本人の確認:`- [ ] マウス探し:自分の手で結果が納得できるか(係数の手応え)/マウスの一覧の数字と出典/リンクが開く/スマホで崩れない`
- [ ] **Step 2:** `content/legal/privacy.md` のマイ設定の節に、手の大きさが「マウス探し」の計算にも使われること(ブラウザの中だけで計算し、サーバーには送らない。ログイン時の同期はマイ設定の説明どおり)が書かれていなければ、1文足す。
- [ ] **Step 3:** `plan.md` のロードマップの「マウス探し:設計中」を「実装済み(ブランチ feat/mouse-finder、公開待ち)」にし、進捗ログに1行足す。
- [ ] **Step 4:** コミット `docs: マウス探しの公開手順・プライバシーポリシー・進捗を更新`

---

### Task 7: 仕上げ

- [ ] **Step 1:** `npm test`、`npx tsc --noEmit`、`npm run lint`(0/0)、`npm run build` をすべて通す。`npm run test:rls` も流す(DB は変えていないが、既存の動作が壊れていないことの確認)。
- [ ] **Step 2:** `public-web-security-gate` に従い、`feat/aim-daily..feat/mouse-finder` の差分を quick の scoped run で監査する(出力 `~/security-audit-skill/gamer-hub/run-5`)。confirmed の critical / high が出たら直すまで止める。
- [ ] **Step 3:** `git push -u origin feat/mouse-finder`。
- [ ] **Step 4:** 本人への報告:できたこと、外したマウスと直した製品名、本人に確かめてほしいこと(係数の手応え、データの数字)、監査の結果。

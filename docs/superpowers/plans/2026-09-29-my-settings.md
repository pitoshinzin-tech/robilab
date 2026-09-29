# マイ設定 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** ゲーマーが一度だけ登録した設定(タイプ・感度・手と持ち方・デバイス・好きなゲーム)を、感度計算などのツールが自動で使い、名刺カード(画像保存/ログイン者は公開 URL)として X でシェアできるようにする。

**Architecture:**
- 設定は1つの JSON(`MySettings` 版 1)。まずブラウザ(localStorage)に保存し、Discord でログインした人はサーバー(`my_settings` 表、1人1行)と「新しい方を採用」で同期する。
- DB への書き込みは SECURITY DEFINER の関数だけにする。関数の中で画面側と同じチェック(範囲・文字数・NG ワード)を行う。
- 名刺カードは `next/og` の ImageResponse で描く。本人用の保存は `POST /api/card-image`、公開用は `/c/[slug]` とその opengraph-image。

**Tech Stack:** TypeScript / Next.js 16.3.6(App Router、proxy)/ React 19.2 / Tailwind 4 / Supabase(@supabase/ssr 0.12.7、supabase-js 2.117.2)/ Vitest 5。**新しいライブラリは足さない。**

**Spec:** [docs/superpowers/specs/2026-09-29-my-settings-design.md](../specs/2026-09-29-my-settings-design.md)

## Global Constraints

- 画面の文言・エラーメッセージ・コメントはすべて日本語にする。
- 技術スタック(TypeScript / Next.js / Tailwind CSS / shadcn/ui / Supabase / Vercel / Stripe / Vitest)以外は足さない。新しい npm パッケージは入れない。
- Next.js 16 は学習データと違う点がある。ルートハンドラー・opengraph-image・metadata を書く前に、`node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/route.md` と `01-metadata/opengraph-image.md` を読む。`params` と `searchParams` は Promise。
- ブランチ:`feat/v0.1-part2` から `feat/my-settings` を作って作業する。コミットは `git -c user.name=pitos -c user.email=pito.shinzin@gmail.com commit ...` の形にし、末尾に `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>` を付ける。
- migration は dev(Supabase project `hmipbsncbemuttxxxbqn`)にだけ適用する。本番(`bncjzilfehkjftzraajd`)には触らない。本番分は `docs/ops/launch.md` の一覧に足す。
- `.env*` ファイルは読まない。秘密の値を表示しない。
- 公開カードに出す項目は spec 4.4 のとおり:typeCode、cardName、mainGame とその感度、DPI、eDPI、振り向き cm、持ち方、デバイス4つの表示名、好きなゲームの表示名。手の長さと幅、4軸の値、Discord の名前と ID は出さない。
- 入力の上限:DPI は既存の感度計算と同じ `DPI_MIN = 50`〜`DPI_MAX = 64000`(整数)。手の長さ 10〜25cm、手の幅 5〜15cm、自由入力 1〜40字、表示名 1〜20字、好きなゲーム最大6つ、候補 id は `^[a-z0-9-]{1,40}$`。
  - 注:spec 4.1 は DPI を「100〜32000」と書いていた。既存の感度計算ツールと食い違わないよう、ツールの値に合わせる。Task 11 で spec も直す。
- 公開 slug は英数字10文字(`^[A-Za-z0-9]{10}$`)。
- NG ワードの一覧は DB にしかないので、NG ワードのエラーは入力欄ごとではなく同期パネルにまとめて出す(spec 6.2 は「その入力欄の横」と書いているが、DB はどの欄かを返せないため)。ブラウザへの保存は続け、サーバーへの保存だけ止まる。
- テストのコマンド:
  - 単体:`npm test`
  - RLS:`npm run test:rls`(dev に接続する)
  - 型:`npx tsc --noEmit`
  - lint:`npm run lint`(0件を保つ)
  - ビルド:`npm run build`

## Review Focus

1. **スマホと PC で別々に編集した**:(最終レビュー後に変更)ログインしたとき、サーバーの設定を土台にし、この端末で前回の同期以降に変えた項目だけを重ねる。→ `mergeForSync` のテスト。
2. **前後の空白だけの自由入力・表示名**:空白を削ってから保存し、空になったら「未入力(null)」として扱う。DB の文字数チェックで弾かれない。→ Task 1 のテスト「trims free text」。
3. **メインゲームを変えたが、そのゲームの感度が未入力**:カードの感度の行を出さない。落ちない、0 も出さない。→ Task 5 のテスト「omits the main game line」。
4. **`/api/card-image` に壊れた JSON・巨大な本文・未知のキー**:400 を返し、サーバーは落ちない。→ Task 6 のテスト「parseCardRequest」。
5. **公開をオフ → オンにした**:古い URL は 404 になり、新しい URL が出る。→ Task 4 の RLS テスト「turning public off kills the old slug」。

---

## File Structure

| ファイル | 役割 |
|---|---|
| `src/lib/my-settings.ts`(新) | 型 `MySettings` 版 1、上限値、`emptyMySettings`、`validateMySettings`、`parseMySettings`、`normalizeText` |
| `src/data/devices.ts`(新) | デバイスの候補(`id, category, brand, name`)と `deviceOptions(category)` |
| `src/data/popular-games.ts`(新) | 好きなゲームの候補と `gameOptions()` |
| `src/lib/item-ref.ts`(新) | 候補 id / 自由入力の表示名の解決 `itemLabel` |
| `src/lib/my-settings-store.ts`(新) | localStorage の読み書き、`pickNewer`、診断結果・感度の書き込み |
| `supabase/migrations/20261001001100_my_settings.sql`(新) | `my_settings` 表と4つの関数 |
| `src/lib/card-view.ts`(新) | `PublicCardData`、`toPublicCardData`、`validatePublicCardData`、`buildCardView`、`parseCardRequest` |
| `src/components/card/CardImage.tsx`(新) | `renderCardImage(view)`:1200×630 の ImageResponse |
| `src/app/api/card-image/route.ts`(新) | `POST`:本人用の画像保存 |
| `src/lib/use-is-client.ts`(新) | ブラウザで描画中かどうか(localStorage の読み込みを安全にする) |
| `src/components/my/*`(新) | マイ設定の画面(フック、入力部品、プレビュー、同期パネル、エディター) |
| `src/app/my/page.tsx`(新) | マイ設定ページ |
| `src/lib/public-card.ts`(新) | 公開カードの取得(anon) |
| `src/app/c/[slug]/page.tsx`、`opengraph-image.tsx`(新) | 公開カードのページと X 用画像 |
| 既存の変更 | `DiagnosisClient.tsx`、`SensitivityClient.tsx` と `page.tsx`、`SiteHeader.tsx`、`src/app/type/[code]/page.tsx`、`src/proxy.ts`、`content/legal/privacy.md`、`docs/ops/*.md`、`plan.md`、`export/erd/build-erd.cjs` |

---

### Task 0: 作業ブランチを作る

- [ ] **Step 1:** ブランチを作る

```bash
git checkout feat/v0.1-part2
git pull --ff-only
git checkout -b feat/my-settings
```

- [ ] **Step 2:** `npm test` を実行し、すべて通ることを確認する(開始時点の確認)。

---

### Task 1: 設定データの型と入力チェック

**Files:**
- Create: `src/lib/my-settings.ts`
- Test: `tests/lib/my-settings.test.ts`

**Interfaces:**
- Consumes:
  - `SENS_GAMES`, `getSensGame`(`@/data/sensitivity`)
  - `DPI_MIN`, `DPI_MAX`(`@/lib/sensitivity`)
  - `Axes`(`@/data/axes`)
- Produces:
  - 型:`Grip`、`DeviceSlot`、`ItemRef`、`MySettings`、`FieldErrors`
  - 定数:`DEVICE_SLOTS`、`MY_SETTINGS_LIMITS`、`CATALOG_ID_RE`、`TYPE_CODE_RE`、`GRIPS`
  - 関数:
    - `emptyMySettings(now?: Date): MySettings`
    - `normalizeText(raw: string): string | null`
    - `isValidItemRef(v: unknown): v is ItemRef`
    - `validateMySettings(input: unknown): { ok: true; value: MySettings } | { ok: false; errors: FieldErrors }`
    - `parseMySettings(raw: unknown): MySettings | null`

- [ ] **Step 1: 失敗するテストを書く**

```ts
// tests/lib/my-settings.test.ts
import { describe, it, expect } from "vitest";
import { emptyMySettings, validateMySettings, parseMySettings, normalizeText, isValidItemRef, MY_SETTINGS_LIMITS } from "@/lib/my-settings";

const base = () => emptyMySettings(new Date("2026-10-01T00:00:00.000Z"));

describe("emptyMySettings", () => {
  it("is valid and version 1", () => {
    const r = validateMySettings(base());
    expect(r.ok).toBe(true);
    expect(base().version).toBe(1);
    expect(base().updatedAt).toBe("2026-10-01T00:00:00.000Z");
  });
});

describe("normalizeText (trims free text)", () => {
  it("trims and turns blank into null", () => {
    expect(normalizeText("  G PRO  ")).toBe("G PRO");
    expect(normalizeText("   ")).toBeNull();
    expect(normalizeText("")).toBeNull();
  });
});

describe("isValidItemRef", () => {
  it("accepts catalog ids and free names", () => {
    expect(isValidItemRef({ id: "logicool-g-pro-x-superlight-2" })).toBe(true);
    expect(isValidItemRef({ name: "自作マウス" })).toBe(true);
  });
  it("rejects bad shapes", () => {
    expect(isValidItemRef({ id: "Bad ID" })).toBe(false);
    expect(isValidItemRef({ name: "x".repeat(41) })).toBe(false);
    expect(isValidItemRef({ name: " 前後に空白 " })).toBe(false);
    expect(isValidItemRef({ name: "改行\nあり" })).toBe(false);
    expect(isValidItemRef({ id: "a", name: "b" })).toBe(false);
    expect(isValidItemRef({})).toBe(false);
    expect(isValidItemRef("x")).toBe(false);
  });
});

describe("validateMySettings", () => {
  it("accepts a full valid settings object", () => {
    const s = {
      ...base(),
      typeCode: "ARCH",
      axes: { attack: 0.33, instinct: 0.33, team: 0.33, heat: 0.33 },
      dpi: 800,
      mainGame: "valorant",
      sens: { valorant: 0.35, apex: 1.2 },
      hand: { lengthCm: 18.5, widthCm: 9, grip: "claw" as const },
      devices: { mouse: { id: "logicool-g-pro-x-superlight-2" }, pad: { name: "布パッド" }, keyboard: null, headset: null },
      favoriteGames: [{ id: "valorant" }, { name: "昔のゲーム" }],
      cardName: "ロビ太",
    };
    expect(validateMySettings(s)).toEqual({ ok: true, value: s });
  });

  it("reports field errors for out-of-range values", () => {
    const s = {
      ...base(),
      dpi: 10,
      mainGame: "unknown-game",
      sens: { valorant: 99 },
      hand: { lengthCm: 40, widthCm: 1, grip: "fist" },
      cardName: "x".repeat(MY_SETTINGS_LIMITS.cardNameMax + 1),
    };
    const r = validateMySettings(s);
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(Object.keys(r.errors).sort()).toEqual(
      ["cardName", "dpi", "hand.grip", "hand.lengthCm", "hand.widthCm", "mainGame", "sens.valorant"].sort(),
    );
  });

  it("rejects non-integer DPI, duplicate or too many favorite games, and bad type codes", () => {
    const r1 = validateMySettings({ ...base(), dpi: 800.5 });
    expect(r1.ok).toBe(false);
    const r2 = validateMySettings({ ...base(), favoriteGames: [{ id: "valorant" }, { id: "valorant" }] });
    expect(r2.ok).toBe(false);
    const seven = Array.from({ length: 7 }, (_, i) => ({ name: `game${i}` }));
    expect(validateMySettings({ ...base(), favoriteGames: seven }).ok).toBe(false);
    expect(validateMySettings({ ...base(), typeCode: "XXXX" }).ok).toBe(false);
  });

  it("rejects unknown keys and wrong versions", () => {
    expect(validateMySettings({ ...base(), extra: 1 }).ok).toBe(false);
    expect(validateMySettings({ ...base(), version: 2 }).ok).toBe(false);
    expect(validateMySettings(null).ok).toBe(false);
  });
});

describe("parseMySettings", () => {
  it("returns null for broken data instead of throwing", () => {
    expect(parseMySettings("not json object")).toBeNull();
    expect(parseMySettings({ version: 1 })).toBeNull();
    expect(parseMySettings(base())).toEqual(base());
  });
});
```

- [ ] **Step 2:** `npx vitest run tests/lib/my-settings.test.ts` を実行し、FAIL(`Cannot find module '@/lib/my-settings'`)になることを確認する。

- [ ] **Step 3: 実装する**

```ts
// src/lib/my-settings.ts
import { getSensGame } from "@/data/sensitivity";
import { DPI_MIN, DPI_MAX } from "@/lib/sensitivity";
import type { Axes } from "@/data/axes";

/** マイ設定のデータ(版 1)。ブラウザとサーバーで同じ形を使う。 */
export type Grip = "palm" | "claw" | "fingertip";
export type DeviceSlot = "mouse" | "pad" | "keyboard" | "headset";
export type ItemRef = { id: string } | { name: string };

export type MySettings = {
  version: 1;
  updatedAt: string;
  typeCode: string | null;
  axes: Axes | null;
  dpi: number | null;
  mainGame: string | null;
  sens: Record<string, number>;
  hand: { lengthCm: number | null; widthCm: number | null; grip: Grip | null };
  devices: Record<DeviceSlot, ItemRef | null>;
  favoriteGames: ItemRef[];
  cardName: string | null;
};

export type FieldErrors = Record<string, string>;

export const DEVICE_SLOTS: DeviceSlot[] = ["mouse", "pad", "keyboard", "headset"];
export const GRIPS: Grip[] = ["palm", "claw", "fingertip"];
export const TYPE_CODE_RE = /^[AG][RB][CL][HZ]$/;
export const CATALOG_ID_RE = /^[a-z0-9-]{1,40}$/;
// DB の save_my_settings(supabase/migrations/20261001001100_my_settings.sql)と同じ値。
// 変えるときは両方を変える(tests/data/my-settings-sql.test.ts が一致を確認する)。
export const MY_SETTINGS_LIMITS = {
  dpiMin: DPI_MIN,
  dpiMax: DPI_MAX,
  handLengthMin: 10,
  handLengthMax: 25,
  handWidthMin: 5,
  handWidthMax: 15,
  freeTextMax: 40,
  cardNameMax: 20,
  favoriteGamesMax: 6,
} as const;

const KEYS = ["version", "updatedAt", "typeCode", "axes", "dpi", "mainGame", "sens", "hand", "devices", "favoriteGames", "cardName"];
const AXIS_KEYS = ["attack", "instinct", "team", "heat"];
const CONTROL_RE = /[\x00-\x1f\x7f]/;

export function emptyMySettings(now: Date = new Date()): MySettings {
  return {
    version: 1,
    updatedAt: now.toISOString(),
    typeCode: null,
    axes: null,
    dpi: null,
    mainGame: null,
    sens: {},
    hand: { lengthCm: null, widthCm: null, grip: null },
    devices: { mouse: null, pad: null, keyboard: null, headset: null },
    favoriteGames: [],
    cardName: null,
  };
}

/** 入力欄の文字を保存用に整える。前後の空白を削り、空なら null。 */
export function normalizeText(raw: string): string | null {
  const t = raw.trim();
  return t === "" ? null : t;
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function isCleanText(v: unknown, max: number): v is string {
  return typeof v === "string" && v.length >= 1 && [...v].length <= max && v.trim() === v && !CONTROL_RE.test(v);
}

export function isValidItemRef(v: unknown): v is ItemRef {
  if (!isPlainObject(v)) return false;
  const keys = Object.keys(v);
  if (keys.length !== 1) return false;
  if (keys[0] === "id") return typeof v.id === "string" && CATALOG_ID_RE.test(v.id);
  if (keys[0] === "name") return isCleanText(v.name, MY_SETTINGS_LIMITS.freeTextMax);
  return false;
}

const refKey = (r: ItemRef) => ("id" in r ? `id:${r.id}` : `name:${r.name}`);

function inRange(v: unknown, min: number, max: number): v is number {
  return typeof v === "number" && Number.isFinite(v) && v >= min && v <= max;
}

export function validateMySettings(input: unknown): { ok: true; value: MySettings } | { ok: false; errors: FieldErrors } {
  const errors: FieldErrors = {};
  if (!isPlainObject(input)) return { ok: false, errors: { _: "設定の形が正しくありません。" } };
  const keys = Object.keys(input);
  if (keys.length !== KEYS.length || !KEYS.every((k) => keys.includes(k))) errors._ = "設定の形が正しくありません。";
  if (input.version !== 1) errors.version = "対応していない版です。";
  if (typeof input.updatedAt !== "string" || Number.isNaN(Date.parse(input.updatedAt))) errors.updatedAt = "更新日時が正しくありません。";

  if (input.typeCode !== null && !(typeof input.typeCode === "string" && TYPE_CODE_RE.test(input.typeCode))) errors.typeCode = "タイプが正しくありません。";
  if (input.axes !== null) {
    const a = input.axes;
    const ok = isPlainObject(a) && Object.keys(a).length === 4 && AXIS_KEYS.every((k) => inRange(a[k], -1, 1));
    if (!ok) errors.axes = "診断の値が正しくありません。";
  }

  const L = MY_SETTINGS_LIMITS;
  if (input.dpi !== null && !(inRange(input.dpi, L.dpiMin, L.dpiMax) && Number.isInteger(input.dpi)))
    errors.dpi = `DPI は ${L.dpiMin}〜${L.dpiMax} の整数で入力してください。`;
  if (input.mainGame !== null && !(typeof input.mainGame === "string" && getSensGame(input.mainGame)))
    errors.mainGame = "メインのゲームを選び直してください。";

  if (!isPlainObject(input.sens)) errors.sens = "感度の形が正しくありません。";
  else
    for (const [id, v] of Object.entries(input.sens)) {
      const g = getSensGame(id);
      if (!g) errors[`sens.${id}`] = "対応していないゲームです。";
      else if (!inRange(v, g.min, g.max) || v <= 0) errors[`sens.${id}`] = `${g.name} の感度は ${g.min}〜${g.max} の範囲で入力してください。`;
    }

  const h = input.hand;
  if (!isPlainObject(h) || Object.keys(h).length !== 3) errors.hand = "手の情報の形が正しくありません。";
  else {
    if (h.lengthCm !== null && !inRange(h.lengthCm, L.handLengthMin, L.handLengthMax))
      errors["hand.lengthCm"] = `手の長さは ${L.handLengthMin}〜${L.handLengthMax}cm で入力してください。`;
    if (h.widthCm !== null && !inRange(h.widthCm, L.handWidthMin, L.handWidthMax))
      errors["hand.widthCm"] = `手の幅は ${L.handWidthMin}〜${L.handWidthMax}cm で入力してください。`;
    if (h.grip !== null && !GRIPS.includes(h.grip as Grip)) errors["hand.grip"] = "持ち方を選び直してください。";
  }

  const d = input.devices;
  if (!isPlainObject(d) || Object.keys(d).length !== 4 || !DEVICE_SLOTS.every((s) => s in d)) errors.devices = "デバイスの形が正しくありません。";
  else for (const s of DEVICE_SLOTS) if (d[s] !== null && !isValidItemRef(d[s])) errors[`devices.${s}`] = `${L.freeTextMax}字以内で入力してください。`;

  const f = input.favoriteGames;
  if (!Array.isArray(f) || f.length > L.favoriteGamesMax || !f.every(isValidItemRef))
    errors.favoriteGames = `好きなゲームは ${L.favoriteGamesMax}つまで、${L.freeTextMax}字以内で入力してください。`;
  else if (new Set(f.map(refKey)).size !== f.length) errors.favoriteGames = "同じゲームが2回入っています。";

  if (input.cardName !== null && !isCleanText(input.cardName, L.cardNameMax)) errors.cardName = `表示名は ${L.cardNameMax}字以内で入力してください。`;

  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return { ok: true, value: input as unknown as MySettings };
}

/** 保存されていたデータを読む。壊れていたら null(画面を止めない)。 */
export function parseMySettings(raw: unknown): MySettings | null {
  const r = validateMySettings(raw);
  return r.ok ? r.value : null;
}
```

- [ ] **Step 4:** `npx vitest run tests/lib/my-settings.test.ts` を実行し、PASS を確認する。

- [ ] **Step 5: コミット**

```bash
git add src/lib/my-settings.ts tests/lib/my-settings.test.ts
git -c user.name=pitos -c user.email=pito.shinzin@gmail.com commit -m "feat: マイ設定のデータ型と入力チェックを追加

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: 候補データ(デバイス・好きなゲーム)と表示名の解決

**Files:**
- Create: `src/data/devices.ts`、`src/data/popular-games.ts`、`src/lib/item-ref.ts`
- Test: `tests/data/devices.test.ts`、`tests/lib/item-ref.test.ts`

**Interfaces:**
- Consumes:`CATALOG_ID_RE`、`ItemRef`、`DeviceSlot`(Task 1)
- Produces:
  - `DEVICES: Device[]`(`Device = { id: string; category: DeviceSlot; brand: string; name: string }`)
  - `deviceOptions(category: DeviceSlot): { id: string; label: string }[]`
  - `POPULAR_GAMES: { id: string; name: string }[]`
  - `gameOptions(): { id: string; label: string }[]`
  - `itemLabel(ref: ItemRef | null, options: { id: string; label: string }[]): string | null`(未知の id は null)

- [ ] **Step 1: 失敗するテストを書く**

```ts
// tests/data/devices.test.ts
import { describe, it, expect } from "vitest";
import { DEVICES, deviceOptions } from "@/data/devices";
import { POPULAR_GAMES, gameOptions } from "@/data/popular-games";
import { CATALOG_ID_RE, DEVICE_SLOTS } from "@/lib/my-settings";
import { GAMES } from "@/data/games";

describe("device candidates", () => {
  it("have unique ids in the catalog id format", () => {
    expect(new Set(DEVICES.map((d) => d.id)).size).toBe(DEVICES.length);
    for (const d of DEVICES) expect(d.id).toMatch(CATALOG_ID_RE);
  });
  it("cover every device slot with enough candidates", () => {
    for (const slot of DEVICE_SLOTS) expect(deviceOptions(slot).length).toBeGreaterThanOrEqual(10);
    expect(deviceOptions("mouse").length).toBeGreaterThanOrEqual(25);
  });
});

describe("popular games", () => {
  it("have unique ids in the catalog id format and include the diagnosis games", () => {
    expect(new Set(POPULAR_GAMES.map((g) => g.id)).size).toBe(POPULAR_GAMES.length);
    for (const g of POPULAR_GAMES) expect(g.id).toMatch(CATALOG_ID_RE);
    for (const g of GAMES) expect(POPULAR_GAMES.map((p) => p.id)).toContain(g.id);
    expect(gameOptions().length).toBeGreaterThanOrEqual(35);
  });
});
```

```ts
// tests/lib/item-ref.test.ts
import { describe, it, expect } from "vitest";
import { itemLabel } from "@/lib/item-ref";

const options = [{ id: "a-mouse", label: "Brand A Mouse" }];

describe("itemLabel", () => {
  it("resolves catalog ids and free names", () => {
    expect(itemLabel({ id: "a-mouse" }, options)).toBe("Brand A Mouse");
    expect(itemLabel({ name: "自作" }, options)).toBe("自作");
  });
  it("hides unknown ids and null", () => {
    expect(itemLabel({ id: "unknown" }, options)).toBeNull();
    expect(itemLabel(null, options)).toBeNull();
  });
});
```

- [ ] **Step 2:** `npx vitest run tests/data/devices.test.ts tests/lib/item-ref.test.ts` を実行し、FAIL を確認する。

- [ ] **Step 3: 実装する**

```ts
// src/lib/item-ref.ts
import type { ItemRef } from "@/lib/my-settings";

export type Option = { id: string; label: string };

/** 候補の id か自由入力の名前を、表示用の文字にする。候補にない id は表示しない(null)。 */
export function itemLabel(ref: ItemRef | null, options: Option[]): string | null {
  if (!ref) return null;
  if ("name" in ref) return ref.name;
  return options.find((o) => o.id === ref.id)?.label ?? null;
}
```

```ts
// src/data/devices.ts
import type { DeviceSlot } from "@/lib/my-settings";
import type { Option } from "@/lib/item-ref";

/**
 * デバイスの候補(名前だけ。公式のロゴや画像は使わない)。
 * 製品名はメーカー公式サイトの表記に合わせる。追加はこの配列に足すだけでよい。
 */
export type Device = { id: string; category: DeviceSlot; brand: string; name: string };

export const DEVICES: Device[] = [
  // マウス
  { id: "logicool-g-pro-x-superlight-2", category: "mouse", brand: "Logicool G", name: "PRO X SUPERLIGHT 2" },
  { id: "logicool-g-pro-x-superlight-2-dex", category: "mouse", brand: "Logicool G", name: "PRO X SUPERLIGHT 2 DEX" },
  { id: "logicool-g-pro-x-superlight", category: "mouse", brand: "Logicool G", name: "PRO X SUPERLIGHT" },
  { id: "logicool-g502-x-plus", category: "mouse", brand: "Logicool G", name: "G502 X PLUS" },
  { id: "logicool-g502-hero", category: "mouse", brand: "Logicool G", name: "G502 HERO" },
  { id: "logicool-g305", category: "mouse", brand: "Logicool G", name: "G305" },
  { id: "logicool-g304", category: "mouse", brand: "Logicool G", name: "G304" },
  { id: "razer-deathadder-v3-pro", category: "mouse", brand: "Razer", name: "DeathAdder V3 Pro" },
  { id: "razer-deathadder-v3", category: "mouse", brand: "Razer", name: "DeathAdder V3" },
  { id: "razer-viper-v3-pro", category: "mouse", brand: "Razer", name: "Viper V3 Pro" },
  { id: "razer-viper-mini", category: "mouse", brand: "Razer", name: "Viper Mini" },
  { id: "razer-basilisk-v3-pro", category: "mouse", brand: "Razer", name: "Basilisk V3 Pro" },
  { id: "zowie-ec2-cw", category: "mouse", brand: "ZOWIE", name: "EC2-CW" },
  { id: "zowie-ec2-c", category: "mouse", brand: "ZOWIE", name: "EC2-C" },
  { id: "zowie-fk2-c", category: "mouse", brand: "ZOWIE", name: "FK2-C" },
  { id: "zowie-s2-c", category: "mouse", brand: "ZOWIE", name: "S2-C" },
  { id: "zowie-za13-c", category: "mouse", brand: "ZOWIE", name: "ZA13-C" },
  { id: "pulsar-x2-v2", category: "mouse", brand: "Pulsar", name: "X2 V2" },
  { id: "pulsar-xlite-v3", category: "mouse", brand: "Pulsar", name: "Xlite V3" },
  { id: "finalmouse-ultralightx", category: "mouse", brand: "Finalmouse", name: "UltralightX" },
  { id: "lamzu-atlantis-mini", category: "mouse", brand: "LAMZU", name: "Atlantis Mini" },
  { id: "endgame-gear-op1-8k", category: "mouse", brand: "Endgame Gear", name: "OP1 8k" },
  { id: "endgame-gear-xm2we", category: "mouse", brand: "Endgame Gear", name: "XM2we" },
  { id: "vaxee-xe", category: "mouse", brand: "VAXEE", name: "XE" },
  { id: "glorious-model-o-2-wireless", category: "mouse", brand: "Glorious", name: "Model O 2 Wireless" },
  { id: "steelseries-aerox-3", category: "mouse", brand: "SteelSeries", name: "Aerox 3" },
  { id: "steelseries-rival-3", category: "mouse", brand: "SteelSeries", name: "Rival 3" },
  { id: "corsair-m75-wireless", category: "mouse", brand: "CORSAIR", name: "M75 WIRELESS" },
  { id: "hyperx-pulsefire-haste-2", category: "mouse", brand: "HyperX", name: "Pulsefire Haste 2" },
  { id: "zowie-u2", category: "mouse", brand: "ZOWIE", name: "U2" },
  // マウスパッド
  { id: "artisan-zero", category: "pad", brand: "ARTISAN", name: "零 ZERO" },
  { id: "artisan-hien", category: "pad", brand: "ARTISAN", name: "飛燕 HIEN" },
  { id: "artisan-raiden", category: "pad", brand: "ARTISAN", name: "雷電 RAIDEN" },
  { id: "artisan-shidenkai", category: "pad", brand: "ARTISAN", name: "紫電改 SHIDENKAI" },
  { id: "logicool-g640", category: "pad", brand: "Logicool G", name: "G640" },
  { id: "logicool-g240", category: "pad", brand: "Logicool G", name: "G240" },
  { id: "razer-gigantus-v2", category: "pad", brand: "Razer", name: "Gigantus V2" },
  { id: "razer-strider", category: "pad", brand: "Razer", name: "Strider" },
  { id: "zowie-g-sr", category: "pad", brand: "ZOWIE", name: "G-SR" },
  { id: "zowie-g-sr-se", category: "pad", brand: "ZOWIE", name: "G-SR-SE" },
  { id: "steelseries-qck-heavy", category: "pad", brand: "SteelSeries", name: "QcK Heavy" },
  { id: "steelseries-qck", category: "pad", brand: "SteelSeries", name: "QcK" },
  { id: "lgg-saturn-pro", category: "pad", brand: "Lethal Gaming Gear", name: "Saturn Pro" },
  { id: "lgg-jupiter", category: "pad", brand: "Lethal Gaming Gear", name: "Jupiter" },
  { id: "vaxee-pa", category: "pad", brand: "VAXEE", name: "PA" },
  // キーボード
  { id: "wooting-60he-plus", category: "keyboard", brand: "Wooting", name: "60HE+" },
  { id: "wooting-80he", category: "keyboard", brand: "Wooting", name: "80HE" },
  { id: "razer-huntsman-v3-pro-tkl", category: "keyboard", brand: "Razer", name: "Huntsman V3 Pro TKL" },
  { id: "razer-huntsman-v3-pro-mini", category: "keyboard", brand: "Razer", name: "Huntsman V3 Pro Mini" },
  { id: "logicool-g-pro-x-tkl", category: "keyboard", brand: "Logicool G", name: "PRO X TKL" },
  { id: "logicool-g-pro-x-60", category: "keyboard", brand: "Logicool G", name: "PRO X 60" },
  { id: "steelseries-apex-pro-tkl", category: "keyboard", brand: "SteelSeries", name: "Apex Pro TKL" },
  { id: "steelseries-apex-pro-mini", category: "keyboard", brand: "SteelSeries", name: "Apex Pro Mini" },
  { id: "corsair-k70-rgb-tkl", category: "keyboard", brand: "CORSAIR", name: "K70 RGB TKL" },
  { id: "realforce-gx1", category: "keyboard", brand: "REALFORCE", name: "GX1" },
  { id: "hyperx-alloy-origins", category: "keyboard", brand: "HyperX", name: "Alloy Origins" },
  { id: "drunkdeer-a75", category: "keyboard", brand: "DrunkDeer", name: "A75" },
  { id: "keychron-k2-he", category: "keyboard", brand: "Keychron", name: "K2 HE" },
  // ヘッドセット
  { id: "logicool-g-pro-x-2-lightspeed", category: "headset", brand: "Logicool G", name: "PRO X 2 LIGHTSPEED" },
  { id: "logicool-g733", category: "headset", brand: "Logicool G", name: "G733" },
  { id: "logicool-g435", category: "headset", brand: "Logicool G", name: "G435" },
  { id: "razer-blackshark-v2-pro", category: "headset", brand: "Razer", name: "BlackShark V2 Pro" },
  { id: "razer-blackshark-v2-x", category: "headset", brand: "Razer", name: "BlackShark V2 X" },
  { id: "hyperx-cloud-iii", category: "headset", brand: "HyperX", name: "Cloud III" },
  { id: "hyperx-cloud-ii", category: "headset", brand: "HyperX", name: "Cloud II" },
  { id: "hyperx-cloud-alpha", category: "headset", brand: "HyperX", name: "Cloud Alpha" },
  { id: "steelseries-arctis-nova-pro", category: "headset", brand: "SteelSeries", name: "Arctis Nova Pro" },
  { id: "steelseries-arctis-nova-7", category: "headset", brand: "SteelSeries", name: "Arctis Nova 7" },
  { id: "sony-inzone-h9", category: "headset", brand: "Sony", name: "INZONE H9" },
  { id: "sony-inzone-h5", category: "headset", brand: "Sony", name: "INZONE H5" },
  { id: "sony-inzone-buds", category: "headset", brand: "Sony", name: "INZONE Buds" },
  { id: "corsair-hs80-rgb-wireless", category: "headset", brand: "CORSAIR", name: "HS80 RGB WIRELESS" },
];

export function deviceOptions(category: DeviceSlot): Option[] {
  return DEVICES.filter((d) => d.category === category).map((d) => ({ id: d.id, label: `${d.brand} ${d.name}` }));
}
```

```ts
// src/data/popular-games.ts
import type { Option } from "@/lib/item-ref";

/** 好きなゲームの候補(名前だけ)。診断の対象5本(src/data/games.ts)の id は同じにする。 */
export const POPULAR_GAMES: { id: string; name: string }[] = [
  { id: "valorant", name: "VALORANT" },
  { id: "apex", name: "Apex Legends" },
  { id: "overwatch", name: "オーバーウォッチ 2" },
  { id: "sf6", name: "ストリートファイター6" },
  { id: "dbd", name: "Dead by Daylight" },
  { id: "fortnite", name: "フォートナイト" },
  { id: "cs2", name: "Counter-Strike 2" },
  { id: "cod", name: "Call of Duty" },
  { id: "r6", name: "レインボーシックス シージ" },
  { id: "pubg", name: "PUBG: BATTLEGROUNDS" },
  { id: "the-finals", name: "THE FINALS" },
  { id: "marvel-rivals", name: "Marvel Rivals" },
  { id: "tarkov", name: "Escape from Tarkov" },
  { id: "delta-force", name: "Delta Force" },
  { id: "knives-out", name: "荒野行動" },
  { id: "lol", name: "リーグ・オブ・レジェンド" },
  { id: "tft", name: "チームファイト タクティクス" },
  { id: "dota2", name: "Dota 2" },
  { id: "tekken8", name: "鉄拳8" },
  { id: "smash-sp", name: "大乱闘スマッシュブラザーズ SPECIAL" },
  { id: "splatoon3", name: "スプラトゥーン3" },
  { id: "mario-kart-world", name: "マリオカート ワールド" },
  { id: "minecraft", name: "Minecraft" },
  { id: "monster-hunter-wilds", name: "モンスターハンターワイルズ" },
  { id: "elden-ring-nightreign", name: "ELDEN RING NIGHTREIGN" },
  { id: "genshin", name: "原神" },
  { id: "honkai-star-rail", name: "崩壊:スターレイル" },
  { id: "zenless-zone-zero", name: "ゼンレスゾーンゼロ" },
  { id: "pokemon-unite", name: "ポケモンユナイト" },
  { id: "rocket-league", name: "Rocket League" },
  { id: "fall-guys", name: "Fall Guys" },
  { id: "among-us", name: "Among Us" },
  { id: "lethal-company", name: "Lethal Company" },
  { id: "palworld", name: "パルワールド" },
  { id: "rust", name: "Rust" },
  { id: "gta5", name: "グランド・セフト・オートV" },
  { id: "ff14", name: "ファイナルファンタジーXIV" },
  { id: "dq10", name: "ドラゴンクエストX" },
  { id: "umamusume", name: "ウマ娘 プリティーダービー" },
  { id: "monster-strike", name: "モンスターストライク" },
];

export function gameOptions(): Option[] {
  return POPULAR_GAMES.map((g) => ({ id: g.id, label: g.name }));
}
```

- [ ] **Step 4:** `npx vitest run tests/data/devices.test.ts tests/lib/item-ref.test.ts` を実行し、PASS を確認する。

- [ ] **Step 5: 表記を確認する。**
  - 候補の製品名とゲーム名を、メーカーや公式サイトの表記と見比べる(ブラウザで各社の製品ページを開く)。
  - 表記が違うもの、販売終了で探せないものは直すか消す。
  - 直したものは、最終報告の「本人に確認してほしい候補一覧」に書く。

- [ ] **Step 6: コミット**

```bash
git add src/data/devices.ts src/data/popular-games.ts src/lib/item-ref.ts tests/data/devices.test.ts tests/lib/item-ref.test.ts
git -c user.name=pitos -c user.email=pito.shinzin@gmail.com commit -m "feat: マイ設定のデバイスと好きなゲームの候補を追加

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: ブラウザの保存と引き継ぎの規則

**Files:**
- Create: `src/lib/my-settings-store.ts`
- Test: `tests/lib/my-settings-store.test.ts`

**Interfaces:**
- Consumes:`MySettings`、`emptyMySettings`、`parseMySettings`(Task 1)、`Axes`
- Produces:
  - 型・定数:
    - `SettingsStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">`
    - `MY_SETTINGS_KEY = "robilab:mySettings"`
  - 関数:
    - `browserStorage(): SettingsStorage | null`
    - `loadLocal(storage: SettingsStorage | null): MySettings | null`
    - `saveLocal(storage: SettingsStorage | null, s: MySettings): boolean`
    - `clearLocal(storage: SettingsStorage | null): void`
    - `pickNewer(local: MySettings | null, server: MySettings | null): "local" | "server" | "none"`
    - `applyDiagnosisToLocal(storage: SettingsStorage | null, typeCode: string, axes: Axes, now?: Date): MySettings | null`
    - `saveSensToLocal(storage: SettingsStorage | null, gameId: string, dpi: number, sens: number, now?: Date): MySettings | null`

- [ ] **Step 1: 失敗するテストを書く**

```ts
// tests/lib/my-settings-store.test.ts
import { describe, it, expect } from "vitest";
import { emptyMySettings, type MySettings } from "@/lib/my-settings";
import {
  MY_SETTINGS_KEY, loadLocal, saveLocal, clearLocal, pickNewer, applyDiagnosisToLocal, saveSensToLocal, type SettingsStorage,
} from "@/lib/my-settings-store";

function memoryStorage(initial: Record<string, string> = {}): SettingsStorage & { data: Record<string, string> } {
  const data = { ...initial };
  return {
    data,
    getItem: (k) => (k in data ? data[k] : null),
    setItem: (k, v) => { data[k] = v; },
    removeItem: (k) => { delete data[k]; },
  };
}
const at = (iso: string): MySettings => emptyMySettings(new Date(iso));

describe("loadLocal / saveLocal / clearLocal", () => {
  it("round-trips valid settings", () => {
    const st = memoryStorage();
    const s = at("2026-10-01T00:00:00.000Z");
    expect(saveLocal(st, s)).toBe(true);
    expect(loadLocal(st)).toEqual(s);
    clearLocal(st);
    expect(loadLocal(st)).toBeNull();
  });
  it("returns null for broken JSON, invalid shapes, and unknown versions", () => {
    expect(loadLocal(memoryStorage({ [MY_SETTINGS_KEY]: "{broken" }))).toBeNull();
    expect(loadLocal(memoryStorage({ [MY_SETTINGS_KEY]: JSON.stringify({ version: 1 }) }))).toBeNull();
    expect(loadLocal(memoryStorage({ [MY_SETTINGS_KEY]: JSON.stringify({ ...at("2026-10-01T00:00:00.000Z"), version: 2 }) }))).toBeNull();
  });
  it("does nothing without storage", () => {
    expect(loadLocal(null)).toBeNull();
    expect(saveLocal(null, at("2026-10-01T00:00:00.000Z"))).toBe(false);
  });
  it("reports failure when the storage throws (quota, private mode)", () => {
    const st: SettingsStorage = { getItem: () => null, setItem: () => { throw new Error("quota"); }, removeItem: () => {} };
    expect(saveLocal(st, at("2026-10-01T00:00:00.000Z"))).toBe(false);
  });
});

describe("pickNewer", () => {
  const older = at("2026-10-01T00:00:00.000Z");
  const newer = at("2026-10-02T00:00:00.000Z");
  it("picks the newer side", () => {
    expect(pickNewer(newer, older)).toBe("local");
    expect(pickNewer(older, newer)).toBe("server");
  });
  it("prefers the server on a tie and handles missing sides", () => {
    expect(pickNewer(older, older)).toBe("server");
    expect(pickNewer(older, null)).toBe("local");
    expect(pickNewer(null, older)).toBe("server");
    expect(pickNewer(null, null)).toBe("none");
  });
});

describe("applyDiagnosisToLocal / saveSensToLocal", () => {
  it("writes the diagnosis type into new or existing settings", () => {
    const st = memoryStorage();
    const axes = { attack: 0.33, instinct: 0.33, team: 0.33, heat: 0.33 };
    const s = applyDiagnosisToLocal(st, "ARCH", axes, new Date("2026-10-03T00:00:00.000Z"));
    expect(s?.typeCode).toBe("ARCH");
    expect(loadLocal(st)?.axes).toEqual(axes);
    expect(loadLocal(st)?.updatedAt).toBe("2026-10-03T00:00:00.000Z");
  });
  it("saves DPI and sensitivity, and sets the main game only when empty", () => {
    const st = memoryStorage();
    saveSensToLocal(st, "valorant", 800, 0.35, new Date("2026-10-03T00:00:00.000Z"));
    saveSensToLocal(st, "apex", 800, 1.2, new Date("2026-10-04T00:00:00.000Z"));
    const s = loadLocal(st)!;
    expect(s.dpi).toBe(800);
    expect(s.sens).toEqual({ valorant: 0.35, apex: 1.2 });
    expect(s.mainGame).toBe("valorant");
  });
  it("refuses values that would make the settings invalid", () => {
    const st = memoryStorage();
    expect(saveSensToLocal(st, "valorant", 800, 999)).toBeNull();
    expect(loadLocal(st)).toBeNull();
  });
});
```

- [ ] **Step 2:** `npx vitest run tests/lib/my-settings-store.test.ts` を実行し、FAIL を確認する。

- [ ] **Step 3: 実装する**

```ts
// src/lib/my-settings-store.ts
import type { Axes } from "@/data/axes";
import { emptyMySettings, parseMySettings, validateMySettings, type MySettings } from "@/lib/my-settings";

export type SettingsStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;
export const MY_SETTINGS_KEY = "robilab:mySettings";

/** localStorage が使えれば返す。プライベートモードなどで使えなければ null。 */
export function browserStorage(): SettingsStorage | null {
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

export function loadLocal(storage: SettingsStorage | null): MySettings | null {
  if (!storage) return null;
  try {
    const raw = storage.getItem(MY_SETTINGS_KEY);
    return raw ? parseMySettings(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

export function saveLocal(storage: SettingsStorage | null, s: MySettings): boolean {
  if (!storage) return false;
  try {
    storage.setItem(MY_SETTINGS_KEY, JSON.stringify(s));
    return true;
  } catch {
    return false;
  }
}

export function clearLocal(storage: SettingsStorage | null): void {
  try {
    storage?.removeItem(MY_SETTINGS_KEY);
  } catch {
    // 消せなくても画面は止めない
  }
}

/** ブラウザとサーバーのどちらを採用するか。updatedAt が新しい方。同じならサーバー。 */
export function pickNewer(local: MySettings | null, server: MySettings | null): "local" | "server" | "none" {
  if (!local && !server) return "none";
  if (!server) return "local";
  if (!local) return "server";
  return Date.parse(local.updatedAt) > Date.parse(server.updatedAt) ? "local" : "server";
}

function updateLocal(storage: SettingsStorage | null, change: (s: MySettings) => MySettings, now: Date): MySettings | null {
  const current = loadLocal(storage) ?? emptyMySettings(now);
  const next = { ...change(current), updatedAt: now.toISOString() };
  const r = validateMySettings(next);
  if (!r.ok) return null;
  saveLocal(storage, r.value);
  return r.value;
}

/** 診断が終わったときに、タイプと4軸の値をマイ設定に入れる。 */
export function applyDiagnosisToLocal(storage: SettingsStorage | null, typeCode: string, axes: Axes, now: Date = new Date()) {
  return updateLocal(storage, (s) => ({ ...s, typeCode, axes }), now);
}

/** 感度計算ツールの「マイ設定に保存」。メインゲームが未設定ならこのゲームにする。 */
export function saveSensToLocal(storage: SettingsStorage | null, gameId: string, dpi: number, sens: number, now: Date = new Date()) {
  return updateLocal(storage, (s) => ({ ...s, dpi, sens: { ...s.sens, [gameId]: sens }, mainGame: s.mainGame ?? gameId }), now);
}
```

- [ ] **Step 4:** `npx vitest run tests/lib/my-settings-store.test.ts` を実行し、PASS を確認する。

- [ ] **Step 5: コミット**

```bash
git add src/lib/my-settings-store.ts tests/lib/my-settings-store.test.ts
git -c user.name=pitos -c user.email=pito.shinzin@gmail.com commit -m "feat: マイ設定のブラウザ保存と引き継ぎの規則を追加

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: DB(my_settings 表と関数)

**Files:**
- Create: `supabase/migrations/20261001001100_my_settings.sql`
- Test:
  - `tests/data/my-settings-sql.test.ts`(上限値の一致)
  - `tests/rls/my-settings.rls.test.ts`

**Interfaces:**
- Consumes:
  - 既存の `public._has_ng_word(text)`
  - `extensions.gen_random_bytes`(dev にあることを確認済み)
  - `MY_SETTINGS_LIMITS`、`SENS_GAMES`
  - テスト用ヘルパー `makeUser({ register: false })`、`admin`、`errorCode`、`cleanup`
- Produces(RPC):
  - `save_my_settings(p_data jsonb) returns jsonb`:保存した内容を返す。`updatedAt` はサーバーの時刻に置き換える。
  - `delete_my_settings() returns void`
  - `set_card_public(p_public boolean) returns text`:公開なら新しい slug、非公開なら null。
  - `get_public_card(p_slug text) returns jsonb`:`PublicCardData` の形、なければ null。anon も実行できる。
  - エラーコード:`NOT_LOGGED_IN`、`INVALID_INPUT`、`NG_WORD`、`NOT_FOUND`

- [ ] **Step 1: 上限値の一致テストを書く**

```ts
// tests/data/my-settings-sql.test.ts
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { MY_SETTINGS_LIMITS } from "@/lib/my-settings";
import { SENS_GAMES } from "@/data/sensitivity";

// save_my_settings の上限値は、画面側(src/lib/my-settings.ts)と同じでなければならない。
const sql = readFileSync(join(process.cwd(), "supabase", "migrations", "20261001001100_my_settings.sql"), "utf8");

function constant(name: string): number {
  const m = sql.match(new RegExp(String.raw`c_${name} numeric := (-?[0-9.]+);`));
  if (!m) throw new Error(`c_${name} not found`);
  return Number(m[1]);
}

describe("save_my_settings limits match the client", () => {
  it("numeric limits", () => {
    expect(constant("dpi_min")).toBe(MY_SETTINGS_LIMITS.dpiMin);
    expect(constant("dpi_max")).toBe(MY_SETTINGS_LIMITS.dpiMax);
    expect(constant("hand_length_min")).toBe(MY_SETTINGS_LIMITS.handLengthMin);
    expect(constant("hand_length_max")).toBe(MY_SETTINGS_LIMITS.handLengthMax);
    expect(constant("hand_width_min")).toBe(MY_SETTINGS_LIMITS.handWidthMin);
    expect(constant("hand_width_max")).toBe(MY_SETTINGS_LIMITS.handWidthMax);
    expect(constant("free_text_max")).toBe(MY_SETTINGS_LIMITS.freeTextMax);
    expect(constant("card_name_max")).toBe(MY_SETTINGS_LIMITS.cardNameMax);
    expect(constant("favorite_games_max")).toBe(MY_SETTINGS_LIMITS.favoriteGamesMax);
  });
  it("per-game sensitivity ranges", () => {
    const m = sql.match(/v_sens_games jsonb := '([^']+)';/);
    expect(m).not.toBeNull();
    const table = JSON.parse(m![1]) as Record<string, [number, number]>;
    expect(Object.keys(table).sort()).toEqual(SENS_GAMES.map((g) => g.id).sort());
    for (const g of SENS_GAMES) expect(table[g.id]).toEqual([g.min, g.max]);
  });
});
```

- [ ] **Step 2:** `npx vitest run tests/data/my-settings-sql.test.ts` を実行し、FAIL(ファイルがない)を確認する。

- [ ] **Step 3: migration を書く**

```sql
-- supabase/migrations/20261001001100_my_settings.sql
-- マイ設定(docs/superpowers/specs/2026-09-29-my-settings-design.md)
-- 1人1行の設定データ。読むのは本人だけ。書き込みは関数経由だけ。公開カードは slug で anon も読める。

create table if not exists public.my_settings (
  user_id uuid primary key references auth.users (id) on delete cascade,
  data jsonb not null check (jsonb_typeof(data) = 'object' and pg_column_size(data) <= 4096),
  updated_at timestamptz not null default now(),
  public_slug text unique check (public_slug ~ '^[A-Za-z0-9]{10}$')
);
alter table public.my_settings enable row level security;
create policy "read own my settings" on public.my_settings for select to authenticated using (user_id = (select auth.uid()));

-- 候補の id か自由入力の名前(どちらか1つ)。
-- jsonb_object_keys はオブジェクト以外でエラーになるので、先に種類を確かめてから中身を見る(plpgsql の if で順番を保証する)。
create or replace function public._my_item_ok(p jsonb, p_max int) returns boolean
language plpgsql immutable set search_path = public as $$
declare
  v_keys text[];
begin
  if p is null or jsonb_typeof(p) <> 'object' then return false; end if;
  select array_agg(k) into v_keys from jsonb_object_keys(p) k;
  if v_keys = array['id'] then
    return jsonb_typeof(p -> 'id') = 'string' and (p ->> 'id') ~ '^[a-z0-9-]{1,40}$';
  end if;
  if v_keys = array['name'] then
    return jsonb_typeof(p -> 'name') = 'string'
      and char_length(p ->> 'name') between 1 and p_max
      and btrim(p ->> 'name') = (p ->> 'name')
      and (p ->> 'name') !~ '[[:cntrl:]]';
  end if;
  return false;
end $$;
revoke all on function public._my_item_ok from public, anon, authenticated;

create or replace function public.save_my_settings(p_data jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  -- src/lib/my-settings.ts の MY_SETTINGS_LIMITS と同じ(tests/data/my-settings-sql.test.ts で確認)
  c_dpi_min numeric := 50;
  c_dpi_max numeric := 64000;
  c_hand_length_min numeric := 10;
  c_hand_length_max numeric := 25;
  c_hand_width_min numeric := 5;
  c_hand_width_max numeric := 15;
  c_free_text_max numeric := 40;
  c_card_name_max numeric := 20;
  c_favorite_games_max numeric := 6;
  -- src/data/sensitivity.ts の SENS_GAMES の [min, max]
  v_sens_games jsonb := '{"valorant":[0.001,10],"overwatch":[0.01,100],"apex":[0.01,20],"cs2":[0.001,20],"cod":[0.01,100],"fortnite":[0.1,100],"r6":[1,100]}';
  v_keys text[] := array['version', 'updatedAt', 'typeCode', 'axes', 'dpi', 'mainGame', 'sens', 'hand', 'devices', 'favoriteGames', 'cardName'];
  v_hand jsonb := p_data -> 'hand';
  v_devices jsonb := p_data -> 'devices';
  v_games jsonb := p_data -> 'favoriteGames';
  v_texts text;
  v_saved jsonb;
begin
  if auth.uid() is null then raise exception 'NOT_LOGGED_IN'; end if;
  if p_data is null or jsonb_typeof(p_data) <> 'object' or pg_column_size(p_data) > 4096 then raise exception 'INVALID_INPUT'; end if;
  if not (p_data ?& v_keys) or exists (select 1 from jsonb_object_keys(p_data) k where k <> all (v_keys)) then raise exception 'INVALID_INPUT'; end if;
  if p_data -> 'version' is distinct from '1'::jsonb or jsonb_typeof(p_data -> 'updatedAt') <> 'string' then raise exception 'INVALID_INPUT'; end if;

  -- タイプと4軸
  if jsonb_typeof(p_data -> 'typeCode') <> 'null'
     and not (jsonb_typeof(p_data -> 'typeCode') = 'string' and (p_data ->> 'typeCode') ~ '^[AG][RB][CL][HZ]$') then
    raise exception 'INVALID_INPUT';
  end if;
  -- 注意:jsonb_object_keys / jsonb_each / jsonb_array_elements は種類が違うとエラーになる。
  -- 条件式の中の評価順は保証されないので、種類の確認は必ず別の if で先に行う。
  if jsonb_typeof(p_data -> 'axes') <> 'null' then
    if jsonb_typeof(p_data -> 'axes') <> 'object' then raise exception 'INVALID_INPUT'; end if;
    if (select array_agg(k order by k) from jsonb_object_keys(p_data -> 'axes') k) is distinct from array['attack', 'heat', 'instinct', 'team']
       or exists (select 1 from jsonb_each(p_data -> 'axes') e
                  where jsonb_typeof(e.value) <> 'number' or (e.value)::numeric < -1 or (e.value)::numeric > 1) then
      raise exception 'INVALID_INPUT';
    end if;
  end if;

  -- DPI とメインゲーム
  if jsonb_typeof(p_data -> 'dpi') <> 'null'
     and not (jsonb_typeof(p_data -> 'dpi') = 'number'
              and (p_data ->> 'dpi')::numeric = trunc((p_data ->> 'dpi')::numeric)
              and (p_data ->> 'dpi')::numeric between c_dpi_min and c_dpi_max) then
    raise exception 'INVALID_INPUT';
  end if;
  if jsonb_typeof(p_data -> 'mainGame') <> 'null'
     and not (jsonb_typeof(p_data -> 'mainGame') = 'string' and v_sens_games ? (p_data ->> 'mainGame')) then
    raise exception 'INVALID_INPUT';
  end if;

  -- ゲームごとの感度
  if jsonb_typeof(p_data -> 'sens') <> 'object' then raise exception 'INVALID_INPUT'; end if;
  if exists (select 1 from jsonb_each(p_data -> 'sens') e
                where not (v_sens_games ? e.key)
                   or jsonb_typeof(e.value) <> 'number'
                   or (e.value)::numeric <= 0
                   or (e.value)::numeric < (v_sens_games -> e.key ->> 0)::numeric
                   or (e.value)::numeric > (v_sens_games -> e.key ->> 1)::numeric) then
    raise exception 'INVALID_INPUT';
  end if;

  -- 手と持ち方
  if jsonb_typeof(v_hand) <> 'object' then raise exception 'INVALID_INPUT'; end if;
  if (select array_agg(k order by k) from jsonb_object_keys(v_hand) k) is distinct from array['grip', 'lengthCm', 'widthCm']
     or (jsonb_typeof(v_hand -> 'lengthCm') <> 'null' and not (jsonb_typeof(v_hand -> 'lengthCm') = 'number'
         and (v_hand ->> 'lengthCm')::numeric between c_hand_length_min and c_hand_length_max))
     or (jsonb_typeof(v_hand -> 'widthCm') <> 'null' and not (jsonb_typeof(v_hand -> 'widthCm') = 'number'
         and (v_hand ->> 'widthCm')::numeric between c_hand_width_min and c_hand_width_max))
     or (jsonb_typeof(v_hand -> 'grip') <> 'null' and not (v_hand ->> 'grip' in ('palm', 'claw', 'fingertip'))) then
    raise exception 'INVALID_INPUT';
  end if;

  -- デバイス4つ
  if jsonb_typeof(v_devices) <> 'object' then raise exception 'INVALID_INPUT'; end if;
  if (select array_agg(k order by k) from jsonb_object_keys(v_devices) k) is distinct from array['headset', 'keyboard', 'mouse', 'pad']
     or exists (select 1 from jsonb_each(v_devices) e
                where jsonb_typeof(e.value) <> 'null' and not public._my_item_ok(e.value, c_free_text_max::int)) then
    raise exception 'INVALID_INPUT';
  end if;

  -- 好きなゲーム(最大6つ、重複なし)
  if jsonb_typeof(v_games) <> 'array' then raise exception 'INVALID_INPUT'; end if;
  if jsonb_array_length(v_games) > c_favorite_games_max
     or exists (select 1 from jsonb_array_elements(v_games) g where not public._my_item_ok(g, c_free_text_max::int))
     or (select count(distinct g) from jsonb_array_elements(v_games) g) <> jsonb_array_length(v_games) then
    raise exception 'INVALID_INPUT';
  end if;

  -- 表示名
  if jsonb_typeof(p_data -> 'cardName') <> 'null'
     and not (jsonb_typeof(p_data -> 'cardName') = 'string'
              and char_length(p_data ->> 'cardName') between 1 and c_card_name_max
              and btrim(p_data ->> 'cardName') = (p_data ->> 'cardName')
              and (p_data ->> 'cardName') !~ '[[:cntrl:]]') then
    raise exception 'INVALID_INPUT';
  end if;

  -- 自由入力と表示名の NG ワード
  select concat_ws(' ', p_data ->> 'cardName',
           (select string_agg(e.value ->> 'name', ' ') from jsonb_each(v_devices) e where jsonb_typeof(e.value) = 'object'),
           (select string_agg(g ->> 'name', ' ') from jsonb_array_elements(v_games) g))
    into v_texts;
  if public._has_ng_word(coalesce(v_texts, '')) then raise exception 'NG_WORD'; end if;

  v_saved := jsonb_set(p_data, '{updatedAt}', to_jsonb(to_char(now() at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')));
  insert into public.my_settings (user_id, data, updated_at) values (auth.uid(), v_saved, now())
    on conflict (user_id) do update set data = excluded.data, updated_at = excluded.updated_at;
  return v_saved;
end $$;

create or replace function public.delete_my_settings() returns void
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'NOT_LOGGED_IN'; end if;
  delete from public.my_settings where user_id = auth.uid();
end $$;

create or replace function public.set_card_public(p_public boolean) returns text
language plpgsql security definer set search_path = public, extensions as $$
declare
  v_alphabet text := 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  v_bytes bytea;
  v_slug text;
begin
  if auth.uid() is null then raise exception 'NOT_LOGGED_IN'; end if;
  if not exists (select 1 from public.my_settings where user_id = auth.uid()) then raise exception 'NOT_FOUND'; end if;
  if not coalesce(p_public, false) then
    update public.my_settings set public_slug = null where user_id = auth.uid();
    return null;
  end if;
  for attempt in 1..5 loop
    v_bytes := extensions.gen_random_bytes(10);
    select string_agg(substr(v_alphabet, (get_byte(v_bytes, i) % 62) + 1, 1), '' order by i)
      into v_slug from generate_series(0, 9) i;
    begin
      update public.my_settings set public_slug = v_slug where user_id = auth.uid();
      return v_slug;
    exception when unique_violation then
      -- まれに重なったら作り直す
    end;
  end loop;
  raise exception 'INVALID_INPUT';
end $$;

-- 公開カードの表示項目だけを返す(src/lib/card-view.ts の PublicCardData と同じ形)
create or replace function public.get_public_card(p_slug text) returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'typeCode', data -> 'typeCode',
    'cardName', data -> 'cardName',
    'dpi', data -> 'dpi',
    'mainGame', data -> 'mainGame',
    'mainSens', coalesce(data -> 'sens' -> (data ->> 'mainGame'), 'null'::jsonb),
    'grip', data -> 'hand' -> 'grip',
    'devices', data -> 'devices',
    'favoriteGames', data -> 'favoriteGames')
  from public.my_settings
  where p_slug ~ '^[A-Za-z0-9]{10}$' and public_slug = p_slug
$$;

revoke all on function public.save_my_settings, public.delete_my_settings, public.set_card_public, public.get_public_card from public, anon;
grant execute on function public.save_my_settings, public.delete_my_settings, public.set_card_public to authenticated;
grant execute on function public.get_public_card to anon, authenticated;
```

- [ ] **Step 4:** `npx vitest run tests/data/my-settings-sql.test.ts` を実行し、PASS を確認する。

- [ ] **Step 5: RLS テストを書く**

```ts
// tests/rls/my-settings.rls.test.ts
import { describe, it, expect, afterAll } from "vitest";
import { createClient } from "@supabase/supabase-js";
import { admin, makeUser, cleanup, errorCode } from "./helpers";
import { emptyMySettings } from "@/lib/my-settings";

afterAll(cleanup);

const anon = () => createClient(process.env.TEST_SUPABASE_URL!, process.env.TEST_SUPABASE_ANON_KEY!, { auth: { persistSession: false } });
const sample = () => ({
  ...emptyMySettings(new Date("2026-10-01T00:00:00.000Z")),
  typeCode: "ARCH",
  dpi: 800,
  mainGame: "valorant",
  sens: { valorant: 0.35 },
  hand: { lengthCm: 18.5, widthCm: 9, grip: "claw" },
  devices: { mouse: { id: "logicool-g-pro-x-superlight-2" }, pad: { name: "布パッド" }, keyboard: null, headset: null },
  favoriteGames: [{ id: "valorant" }],
  cardName: "ロビ太",
});

describe("my_settings", () => {
  it("saves your own settings, replaces updatedAt with server time, and nobody else can read them", async () => {
    const a = await makeUser({ register: false });
    const b = await makeUser({ register: false });
    const { data, error } = await a.client!.rpc("save_my_settings", { p_data: sample() });
    expect(error).toBeNull();
    expect((data as { updatedAt: string }).updatedAt).not.toBe("2026-10-01T00:00:00.000Z");
    expect((await a.client!.from("my_settings").select("user_id")).data).toHaveLength(1);
    expect((await b.client!.from("my_settings").select("user_id")).data).toHaveLength(0);
    expect((await anon().from("my_settings").select("user_id")).data ?? []).toHaveLength(0);
  });

  it("rejects out-of-range values, unknown keys, and NG words", async () => {
    const a = await makeUser({ register: false });
    const bad = [
      { ...sample(), dpi: 10 },
      { ...sample(), sens: { valorant: 99 } },
      { ...sample(), hand: { lengthCm: 40, widthCm: 9, grip: "claw" } },
      { ...sample(), favoriteGames: Array.from({ length: 7 }, (_, i) => ({ name: `g${i}` })) },
      { ...sample(), extra: true },
      { ...sample(), devices: { ...sample().devices, mouse: { name: " 空白 " } } },
      // 種類の違う値(オブジェクトの代わりに文字列や配列)でも、落ちずに INVALID_INPUT になる
      { ...sample(), devices: "mouse" },
      { ...sample(), devices: { ...sample().devices, mouse: "G PRO" } },
      { ...sample(), hand: [] },
      { ...sample(), sens: [0.35] },
      { ...sample(), favoriteGames: { id: "valorant" } },
      { ...sample(), axes: "ARCH" },
    ];
    for (const p of bad) expect(errorCode((await a.client!.rpc("save_my_settings", { p_data: p })).error), JSON.stringify(p)).toBe("INVALID_INPUT");
    const ng = { ...sample(), cardName: "discord.gg/xx" };
    expect(errorCode((await a.client!.rpc("save_my_settings", { p_data: ng })).error)).toBe("NG_WORD");
  });

  it("anonymous visitors cannot save", async () => {
    expect(errorCode((await anon().rpc("save_my_settings", { p_data: sample() })).error)).not.toBeUndefined();
  });

  it("public card returns only the whitelisted fields, and turning public off kills the old slug", async () => {
    const a = await makeUser({ register: false });
    expect(errorCode((await a.client!.rpc("set_card_public", { p_public: true })).error)).toBe("NOT_FOUND");
    await a.client!.rpc("save_my_settings", { p_data: sample() });
    const slug1 = (await a.client!.rpc("set_card_public", { p_public: true })).data as string;
    expect(slug1).toMatch(/^[A-Za-z0-9]{10}$/);
    const card = (await anon().rpc("get_public_card", { p_slug: slug1 })).data as Record<string, unknown>;
    expect(Object.keys(card).sort()).toEqual(["cardName", "devices", "dpi", "favoriteGames", "grip", "mainGame", "mainSens", "typeCode"]);
    expect(card.mainSens).toBe(0.35);
    expect(JSON.stringify(card)).not.toContain("lengthCm");
    await a.client!.rpc("set_card_public", { p_public: false });
    expect((await anon().rpc("get_public_card", { p_slug: slug1 })).data).toBeNull();
    const slug2 = (await a.client!.rpc("set_card_public", { p_public: true })).data as string;
    expect(slug2).not.toBe(slug1);
    expect((await anon().rpc("get_public_card", { p_slug: slug1 })).data).toBeNull();
    expect((await anon().rpc("get_public_card", { p_slug: "not a slug" })).data).toBeNull();
  });

  it("delete_my_settings and account deletion both remove the row", async () => {
    const a = await makeUser({ register: false });
    await a.client!.rpc("save_my_settings", { p_data: sample() });
    expect((await a.client!.rpc("delete_my_settings")).error).toBeNull();
    expect((await admin.from("my_settings").select("user_id").eq("user_id", a.id)).data).toHaveLength(0);
    await a.client!.rpc("save_my_settings", { p_data: sample() });
    expect((await a.client!.rpc("delete_me")).error).toBeNull();
    expect((await admin.from("my_settings").select("user_id").eq("user_id", a.id)).data).toHaveLength(0);
  });
});
```

- [ ] **Step 6: dev に適用する。**
  - Supabase の `apply_migration` で、project `hmipbsncbemuttxxxbqn` に name `my_settings`、query に migration ファイルの中身をそのまま渡す。
  - 本番には適用しない。

- [ ] **Step 7:** `npm run test:rls` を実行し、全件 PASS(既存の 36 件+新しい 5 件)を確認する。

- [ ] **Step 8:** Supabase の `get_advisors`(security)を dev で実行する。
  - 新しく増えてよい警告は2種類だけ:`get_public_card` の anon 実行と、`save_my_settings`/`delete_my_settings`/`set_card_public` の authenticated 実行(どちらも意図どおり)。
  - それ以外が出たら直す。

- [ ] **Step 9: コミット**

```bash
git add supabase/migrations/20261001001100_my_settings.sql tests/data/my-settings-sql.test.ts tests/rls/my-settings.rls.test.ts
git -c user.name=pitos -c user.email=pito.shinzin@gmail.com commit -m "feat: マイ設定の DB(my_settings 表と保存・公開の関数)を追加

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: 公開カードのデータと表示用の組み立て

**Files:**
- Create: `src/lib/card-view.ts`
- Test: `tests/lib/card-view.test.ts`

**Interfaces:**
- Consumes:
  - `MySettings`、`Grip`、`DeviceSlot`、`ItemRef`、`isValidItemRef`、`TYPE_CODE_RE`、`MY_SETTINGS_LIMITS`、`DEVICE_SLOTS`、`GRIPS`(Task 1)
  - `itemLabel`(Task 2)、`deviceOptions`、`gameOptions`
  - `getSensGame`、`edpi`、`cm360`、`getType`
- Produces:
  - 型:
    - `PublicCardData = { typeCode: string | null; cardName: string | null; dpi: number | null; mainGame: string | null; mainSens: number | null; grip: Grip | null; devices: Record<DeviceSlot, ItemRef | null>; favoriteGames: ItemRef[] }`
    - `CardView = { typeCode: string | null; typeName: string | null; accent: "cyan" | "magenta" | "purple" | "lime"; cardName: string | null; main: { gameName: string; sens: number; dpi: number; edpi: number; cm360: number } | null; grip: string | null; devices: { label: string; name: string }[]; favoriteGames: string[] }`
  - 関数:
    - `toPublicCardData(s: MySettings): PublicCardData`
    - `validatePublicCardData(v: unknown): v is PublicCardData`
    - `buildCardView(d: PublicCardData): CardView`
    - `parseCardRequest(body: string): PublicCardData | null`
    - `CARD_REQUEST_MAX_BYTES = 8192`

- [ ] **Step 1: 失敗するテストを書く**

```ts
// tests/lib/card-view.test.ts
import { describe, it, expect } from "vitest";
import { emptyMySettings } from "@/lib/my-settings";
import { toPublicCardData, validatePublicCardData, buildCardView, parseCardRequest, CARD_REQUEST_MAX_BYTES } from "@/lib/card-view";

const settings = () => ({
  ...emptyMySettings(new Date("2026-10-01T00:00:00.000Z")),
  typeCode: "ARCH",
  axes: { attack: 0.33, instinct: 0.33, team: 0.33, heat: 0.33 },
  dpi: 800,
  mainGame: "valorant",
  sens: { valorant: 0.35 },
  hand: { lengthCm: 18.5, widthCm: 9, grip: "claw" as const },
  devices: { mouse: { id: "logicool-g-pro-x-superlight-2" }, pad: { name: "布パッド" }, keyboard: { id: "unknown-id" }, headset: null },
  favoriteGames: [{ id: "valorant" }, { name: "昔のゲーム" }],
  cardName: "ロビ太",
});

describe("toPublicCardData", () => {
  it("keeps only public fields (no hand size, no axes)", () => {
    const d = toPublicCardData(settings());
    expect(Object.keys(d).sort()).toEqual(["cardName", "devices", "dpi", "favoriteGames", "grip", "mainGame", "mainSens", "typeCode"]);
    expect(d.mainSens).toBe(0.35);
    expect(validatePublicCardData(d)).toBe(true);
  });
});

describe("buildCardView", () => {
  it("resolves names and computes eDPI / cm360", () => {
    const v = buildCardView(toPublicCardData(settings()));
    expect(v.typeName).toBe("先陣ヒーロータイプ");
    expect(v.main).toEqual({ gameName: "VALORANT", sens: 0.35, dpi: 800, edpi: 280, cm360: 46.65 });
    expect(v.grip).toBe("つかみ持ち");
    expect(v.devices).toEqual([
      { label: "マウス", name: "Logicool G PRO X SUPERLIGHT 2" },
      { label: "マウスパッド", name: "布パッド" },
    ]);
    expect(v.favoriteGames).toEqual(["VALORANT", "昔のゲーム"]);
  });
  it("omits the main game line when the sensitivity for the main game is missing", () => {
    const s = { ...settings(), mainGame: "apex" };
    expect(buildCardView(toPublicCardData(s)).main).toBeNull();
  });
});

describe("parseCardRequest", () => {
  it("accepts a valid body", () => {
    expect(parseCardRequest(JSON.stringify(toPublicCardData(settings())))).not.toBeNull();
  });
  it("returns null for broken, oversized, or unexpected bodies", () => {
    expect(parseCardRequest("{broken")).toBeNull();
    expect(parseCardRequest("x".repeat(CARD_REQUEST_MAX_BYTES + 1))).toBeNull();
    expect(parseCardRequest(JSON.stringify({ ...toPublicCardData(settings()), extra: 1 }))).toBeNull();
    expect(parseCardRequest(JSON.stringify({ ...toPublicCardData(settings()), cardName: "x".repeat(21) }))).toBeNull();
    expect(parseCardRequest("null")).toBeNull();
  });
});
```

(cm360 の期待値 46.65 は `round((360 / (800 * 0.35 * 0.07)) * 2.54, 2)` = 46.65。)

- [ ] **Step 2:** `npx vitest run tests/lib/card-view.test.ts` を実行し、FAIL を確認する。

- [ ] **Step 3: 実装する**

```ts
// src/lib/card-view.ts
import { getType } from "@/data/types";
import { getSensGame } from "@/data/sensitivity";
import { deviceOptions } from "@/data/devices";
import { gameOptions } from "@/data/popular-games";
import { cm360, edpi } from "@/lib/sensitivity";
import { itemLabel } from "@/lib/item-ref";
import {
  DEVICE_SLOTS, GRIPS, MY_SETTINGS_LIMITS, TYPE_CODE_RE, isValidItemRef,
  type DeviceSlot, type Grip, type ItemRef, type MySettings,
} from "@/lib/my-settings";

/** 公開カードに出す項目だけ(DB の get_public_card と同じ形)。 */
export type PublicCardData = {
  typeCode: string | null;
  cardName: string | null;
  dpi: number | null;
  mainGame: string | null;
  mainSens: number | null;
  grip: Grip | null;
  devices: Record<DeviceSlot, ItemRef | null>;
  favoriteGames: ItemRef[];
};

export type CardView = {
  typeCode: string | null;
  typeName: string | null;
  accent: "cyan" | "magenta" | "purple" | "lime";
  cardName: string | null;
  main: { gameName: string; sens: number; dpi: number; edpi: number; cm360: number } | null;
  grip: string | null;
  devices: { label: string; name: string }[];
  favoriteGames: string[];
};

export const CARD_REQUEST_MAX_BYTES = 8192;
const PUBLIC_KEYS = ["typeCode", "cardName", "dpi", "mainGame", "mainSens", "grip", "devices", "favoriteGames"];
const SLOT_LABEL: Record<DeviceSlot, string> = { mouse: "マウス", pad: "マウスパッド", keyboard: "キーボード", headset: "ヘッドセット" };
const GRIP_LABEL: Record<Grip, string> = { palm: "かぶせ持ち", claw: "つかみ持ち", fingertip: "つまみ持ち" };

export function toPublicCardData(s: MySettings): PublicCardData {
  return {
    typeCode: s.typeCode,
    cardName: s.cardName,
    dpi: s.dpi,
    mainGame: s.mainGame,
    mainSens: s.mainGame ? (s.sens[s.mainGame] ?? null) : null,
    grip: s.hand.grip,
    devices: s.devices,
    favoriteGames: s.favoriteGames,
  };
}

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);
const numOrNull = (v: unknown) => v === null || (typeof v === "number" && Number.isFinite(v));

export function validatePublicCardData(v: unknown): v is PublicCardData {
  if (!isObj(v)) return false;
  const keys = Object.keys(v);
  if (keys.length !== PUBLIC_KEYS.length || !PUBLIC_KEYS.every((k) => keys.includes(k))) return false;
  if (v.typeCode !== null && !(typeof v.typeCode === "string" && TYPE_CODE_RE.test(v.typeCode))) return false;
  if (v.cardName !== null && !isValidItemRef({ name: v.cardName })) return false;
  if (typeof v.cardName === "string" && [...v.cardName].length > MY_SETTINGS_LIMITS.cardNameMax) return false;
  if (!numOrNull(v.dpi) || !numOrNull(v.mainSens)) return false;
  if (v.mainGame !== null && !(typeof v.mainGame === "string" && getSensGame(v.mainGame))) return false;
  if (v.grip !== null && !GRIPS.includes(v.grip as Grip)) return false;
  const d = v.devices;
  if (!isObj(d) || Object.keys(d).length !== 4 || !DEVICE_SLOTS.every((s) => s in d && (d[s] === null || isValidItemRef(d[s])))) return false;
  const f = v.favoriteGames;
  if (!Array.isArray(f) || f.length > MY_SETTINGS_LIMITS.favoriteGamesMax || !f.every(isValidItemRef)) return false;
  return true;
}

export function buildCardView(d: PublicCardData): CardView {
  const type = d.typeCode ? getType(d.typeCode) : undefined;
  const game = d.mainGame ? getSensGame(d.mainGame) : undefined;
  const main =
    game && d.mainSens !== null && d.dpi !== null
      ? { gameName: game.name, sens: d.mainSens, dpi: d.dpi, edpi: edpi(d.dpi, d.mainSens), cm360: cm360(d.dpi, d.mainSens, game.yaw) }
      : null;
  const devices = DEVICE_SLOTS.flatMap((slot) => {
    const name = itemLabel(d.devices[slot], deviceOptions(slot));
    return name ? [{ label: SLOT_LABEL[slot], name }] : [];
  });
  const games = gameOptions();
  return {
    typeCode: type?.code ?? null,
    typeName: type?.name ?? null,
    accent: type?.accent ?? "cyan",
    cardName: d.cardName,
    main,
    grip: d.grip ? GRIP_LABEL[d.grip] : null,
    devices,
    favoriteGames: d.favoriteGames.flatMap((g) => {
      const name = itemLabel(g, games);
      return name ? [name] : [];
    }),
  };
}

/** POST /api/card-image の本文を読む。壊れていれば null(400 にする)。 */
export function parseCardRequest(body: string): PublicCardData | null {
  if (body.length > CARD_REQUEST_MAX_BYTES) return null;
  try {
    const v: unknown = JSON.parse(body);
    return validatePublicCardData(v) ? v : null;
  } catch {
    return null;
  }
}
```

- [ ] **Step 4:** `npx vitest run tests/lib/card-view.test.ts` を実行し、PASS を確認する。

- [ ] **Step 5: コミット**

```bash
git add src/lib/card-view.ts tests/lib/card-view.test.ts
git -c user.name=pitos -c user.email=pito.shinzin@gmail.com commit -m "feat: 名刺カードの公開項目と表示用データの組み立てを追加

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: カード画像(描画と本人用の保存ルート)

**Files:**
- Create: `src/components/card/CardImage.tsx`、`src/app/api/card-image/route.ts`
- Test:手で確認(ImageResponse は単体テストしない。入力の読み取りは Task 5 のテストで確認済み)

**Interfaces:**
- Consumes:`CardView`、`buildCardView`、`parseCardRequest`(Task 5)、`loadOgFont`(`@/lib/og-font`)
- Produces:
  - `CARD_SIZE = { width: 1200, height: 630 }`
  - `renderCardImage(view: CardView): Promise<ImageResponse>`
  - `POST /api/card-image`:200 で `image/png`、本文がおかしければ 400

- [ ] **Step 1:** `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/route.md` を読み、Next.js 16 のルートハンドラーの書き方(`export async function POST(request: Request)`)を確認する。

- [ ] **Step 2: 描画を書く**

```tsx
// src/components/card/CardImage.tsx
import { ImageResponse } from "next/og";
import { loadOgFont } from "@/lib/og-font";
import type { CardView } from "@/lib/card-view";

export const CARD_SIZE = { width: 1200, height: 630 };
const ACCENT = { cyan: "#39F3FF", magenta: "#FF4FD8", purple: "#7B61FF", lime: "#B6FF3B" } as const;

/** 名刺カード(1200×630)。見た目の最終調整は本人が行う前提の叩き台。 */
export async function renderCardImage(view: CardView): Promise<ImageResponse> {
  const accent = ACCENT[view.accent];
  const lines = [
    "ロビラボ マイ設定",
    view.typeCode ?? "",
    view.typeName ?? "",
    view.cardName ?? "",
    view.main ? `${view.main.gameName} 感度 ${view.main.sens} / ${view.main.dpi} DPI` : "",
    view.main ? `eDPI ${view.main.edpi} ・ 振り向き ${view.main.cm360} cm` : "",
    view.grip ?? "",
    ...view.devices.map((d) => `${d.label} ${d.name}`),
    ...view.favoriteGames,
    "好きなゲーム 未登録",
  ];
  const font = await loadOgFont(lines.join(""));
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", padding: 56, gap: 48, color: "#eaf6ff", fontFamily: "ZenKaku",
        background: "radial-gradient(90% 120% at 85% 0%, #232a66 0%, #0a0c16 60%)" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 280 }}>
          <div style={{ width: 240, height: 240, borderRadius: 32, background: "#151a33", display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: `0 0 60px ${accent}4d` }}>
            <svg viewBox="0 0 8 8" width={150} height={150}>
              <g fill={accent}>
                <rect x="2" y="0" width="4" height="1" /><rect x="1" y="1" width="6" height="1" />
                <rect x="1" y="2" width="1" height="2" /><rect x="6" y="2" width="1" height="2" />
                <rect x="2" y="4" width="4" height="1" /><rect x="0" y="5" width="8" height="1" />
                <rect x="2" y="6" width="1" height="2" /><rect x="5" y="6" width="1" height="2" />
              </g>
              <g fill="#FF4FD8"><rect x="2" y="2" width="1" height="1" /><rect x="5" y="2" width="1" height="1" /></g>
            </svg>
          </div>
          <div style={{ fontSize: 64, color: "#FF4FD8", letterSpacing: 8, marginTop: 20 }}>{view.typeCode ?? "????"}</div>
          <div style={{ fontSize: 26 }}>{view.typeName ?? "タイプ未診断"}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
          <div style={{ fontSize: 22, opacity: 0.7, textShadow: "2px 0 0 #FF4FD8, -2px 0 0 #39F3FF" }}>ロビラボ マイ設定</div>
          <div style={{ fontSize: 56, marginTop: 8 }}>{view.cardName ?? ""}</div>
          {view.main && (
            <div style={{ display: "flex", flexDirection: "column", marginTop: 16, color: "#39F3FF" }}>
              <div style={{ fontSize: 30 }}>{`${view.main.gameName} 感度 ${view.main.sens} / ${view.main.dpi} DPI`}</div>
              <div style={{ fontSize: 26 }}>{`eDPI ${view.main.edpi} ・ 振り向き ${view.main.cm360} cm`}</div>
            </div>
          )}
          {view.grip && <div style={{ fontSize: 24, marginTop: 8, color: "#B6FF3B" }}>{view.grip}</div>}
          <div style={{ display: "flex", flexDirection: "column", marginTop: 16, gap: 4 }}>
            {view.devices.map((d) => (
              <div key={d.label} style={{ display: "flex", fontSize: 24 }}>
                <span style={{ width: 170, opacity: 0.6 }}>{d.label}</span>
                <span>{d.name}</span>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 18 }}>
            {(view.favoriteGames.length ? view.favoriteGames : ["好きなゲーム 未登録"]).map((g) => (
              <div key={g} style={{ fontSize: 20, padding: "4px 14px", borderRadius: 999, border: "2px solid #7B61FF" }}>{g}</div>
            ))}
          </div>
        </div>
      </div>
    ),
    { ...CARD_SIZE, ...(font ? { fonts: [{ name: "ZenKaku", data: font, weight: 700 as const, style: "normal" as const }] } : {}) },
  );
}
```

- [ ] **Step 3: ルートを書く**

```ts
// src/app/api/card-image/route.ts
import { buildCardView, parseCardRequest } from "@/lib/card-view";
import { renderCardImage } from "@/components/card/CardImage";

/**
 * 本人用の名刺カード画像。本文(公開カードの項目)を受け取って PNG を返す。
 * URL だけで呼べる GET は用意しない(他人に見せる手段にしない)。
 */
export async function POST(request: Request) {
  const data = parseCardRequest(await request.text());
  if (!data) return new Response("Bad Request", { status: 400 });
  const image = await renderCardImage(buildCardView(data));
  image.headers.set("Cache-Control", "no-store");
  return image;
}
```

- [ ] **Step 4:** `npx tsc --noEmit` と `npm run lint` を実行し、エラーが0件であることを確認する。

- [ ] **Step 5: 手で確認する。**
  - `npm run build` のあと、ブラウザ(built-in の preview、`.claude/launch.json` の `robilab-prod-build`)で `http://localhost:3100` を開く。
  - JS から次を実行し、`200 image/png` が返ることを確かめる。

```js
await fetch("/api/card-image", { method: "POST", body: JSON.stringify({ typeCode: "ARCH", cardName: "ロビ太", dpi: 800, mainGame: "valorant", mainSens: 0.35, grip: "claw", devices: { mouse: { id: "logicool-g-pro-x-superlight-2" }, pad: null, keyboard: null, headset: null }, favoriteGames: [{ id: "valorant" }] }) }).then(r => [r.status, r.headers.get("content-type")])
```

  - `body: "{broken"` なら 400 が返ることも確かめる。
  - 画像を開いて、日本語が太字の Zen Kaku で出ることを目で確かめる。

- [ ] **Step 6: コミット**

```bash
git add src/components/card/CardImage.tsx src/app/api/card-image/route.ts
git -c user.name=pitos -c user.email=pito.shinzin@gmail.com commit -m "feat: 名刺カードの画像生成と本人用の保存ルートを追加

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: マイ設定ページ(`/my`)

**Files:**
- Create:
  - `src/lib/use-is-client.ts`
  - `src/components/my/useMySettings.ts`
  - `src/components/my/NumberField.tsx`
  - `src/components/my/ItemPicker.tsx`
  - `src/components/my/CardPreview.tsx`
  - `src/components/my/SyncPanel.tsx`
  - `src/components/my/MySettingsEditor.tsx`
  - `src/components/my/MySettingsClient.tsx`
  - `src/app/my/page.tsx`
- Modify:`src/proxy.ts`(matcher に `/my` を足す)
- Test:
  - `tests/lib/my-settings-messages.test.ts`(サーバーのエラーを文言にする関数)
  - 画面は手で確認する

**Interfaces:**
- Consumes:
  - Task 1 から Task 5 のすべて
  - `createSupabaseBrowser`
  - `LoginButton`(`@/components/lobby/LoginButton`)
  - `DeleteAccount`(`@/app/lobby/me/DeleteAccount`)
  - `buildXShareUrl`
  - `errorCodeOf`
  - `SENS_GAMES`
- Produces:
  - `useIsClient(): boolean`
  - `serverErrorMessage(code: string | undefined): string`(`src/components/my/useMySettings.ts` から export)
  - `useMySettings(): { draft, errors, update, loggedIn, slug, status, serverError, setPublic, removeAll }`
  - 型:`SyncStatus = "local" | "memory" | "saving" | "synced" | "server-error"`

- [ ] **Step 1: 失敗するテストを書く(エラー文言)**

```ts
// tests/lib/my-settings-messages.test.ts
import { describe, it, expect } from "vitest";
import { serverErrorMessage } from "@/components/my/useMySettings";

describe("serverErrorMessage", () => {
  it("explains NG words and falls back to a safe message", () => {
    expect(serverErrorMessage("NG_WORD")).toContain("使えない言葉");
    expect(serverErrorMessage("INVALID_INPUT")).toContain("入力内容");
    expect(serverErrorMessage(undefined)).toContain("この端末には保存されています");
  });
});
```

- [ ] **Step 2:** `npx vitest run tests/lib/my-settings-messages.test.ts` を実行し、FAIL を確認する。

- [ ] **Step 3: 小さな部品を書く**

```ts
// src/lib/use-is-client.ts
import { useSyncExternalStore } from "react";

const noSubscribe = () => () => {};

/** ブラウザで描画しているとき true(サーバー描画とハイドレーション中は false)。localStorage を安全に読むために使う。 */
export function useIsClient(): boolean {
  return useSyncExternalStore(noSubscribe, () => true, () => false);
}
```

```tsx
// src/components/my/NumberField.tsx
"use client";
import { useState } from "react";
import { parseNumber } from "@/lib/parse-number";

type Props = { label: string; value: number | null; onValue: (n: number | null) => void; error?: string; suffix?: string };

/** 数字の入力欄。全角や読めない文字はその場で注意し、保存には回さない。 */
export function NumberField({ label, value, onValue, error, suffix }: Props) {
  const [text, setText] = useState(value === null ? "" : String(value));
  const [parseError, setParseError] = useState(false);
  return (
    <label className="grid gap-1 text-sm">
      {label}
      <span className="flex items-center gap-2">
        <input
          inputMode="decimal"
          value={text}
          onChange={(e) => {
            const t = e.target.value;
            setText(t);
            if (t.trim() === "") { setParseError(false); onValue(null); return; }
            const n = parseNumber(t);
            if (n === null) { setParseError(true); return; }
            setParseError(false);
            onValue(n);
          }}
          className="h-12 w-full rounded-xl border border-white/15 bg-[#151a33] px-3 text-base"
        />
        {suffix && <span className="text-[var(--rl-muted)]">{suffix}</span>}
      </span>
      {(parseError || error) && <span role="alert" className="text-xs text-[var(--rl-magenta)]">{parseError ? "数字で入力してください。" : error}</span>}
    </label>
  );
}
```

```tsx
// src/components/my/ItemPicker.tsx
"use client";
import { useState } from "react";
import { normalizeText, type ItemRef } from "@/lib/my-settings";
import { itemLabel, type Option } from "@/lib/item-ref";

type Props = { label: string; listId: string; options: Option[]; value: ItemRef | null; onValue: (v: ItemRef | null) => void; error?: string };

/** 候補から選ぶか、自由入力する欄。候補の名前と完全に一致したら候補の id で保存する。 */
export function ItemPicker({ label, listId, options, value, onValue, error }: Props) {
  const [text, setText] = useState(itemLabel(value, options) ?? "");
  return (
    <label className="grid gap-1 text-sm">
      {label}
      <input
        list={listId}
        value={text}
        placeholder="候補から選ぶか、入力"
        onChange={(e) => {
          setText(e.target.value);
          const t = normalizeText(e.target.value);
          if (t === null) return onValue(null);
          const hit = options.find((o) => o.label === t);
          onValue(hit ? { id: hit.id } : { name: t });
        }}
        className="h-12 rounded-xl border border-white/15 bg-[#151a33] px-3 text-base"
      />
      <datalist id={listId}>
        {options.map((o) => <option key={o.id} value={o.label} />)}
      </datalist>
      {error && <span role="alert" className="text-xs text-[var(--rl-magenta)]">{error}</span>}
    </label>
  );
}
```

- [ ] **Step 4: 同期のフックを書く**

```ts
// src/components/my/useMySettings.ts
"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { createSupabaseBrowser } from "@/lib/supabase/client";
import { errorCodeOf } from "@/lib/lobby-errors";
import { emptyMySettings, parseMySettings, validateMySettings, type FieldErrors, type MySettings } from "@/lib/my-settings";
import { browserStorage, clearLocal, loadLocal, pickNewer, saveLocal } from "@/lib/my-settings-store";

export type SyncStatus = "local" | "memory" | "saving" | "synced" | "server-error";

export function serverErrorMessage(code: string | undefined): string {
  if (code === "NG_WORD") return "デバイス名・ゲーム名・表示名に使えない言葉が含まれています。直すまでサーバーには保存されません。";
  if (code === "INVALID_INPUT") return "入力内容を確認してください。";
  return "サーバーに保存できませんでした。この端末には保存されています。";
}

const SAVE_DELAY_MS = 800;

export function useMySettings() {
  const storage = useRef(browserStorage());
  const [draft, setDraft] = useState<MySettings>(() => loadLocal(storage.current) ?? emptyMySettings());
  const [loggedIn, setLoggedIn] = useState(false);
  const [slug, setSlug] = useState<string | null>(null);
  const [status, setStatus] = useState<SyncStatus>(storage.current ? "local" : "memory");
  const [serverError, setServerError] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const validation = validateMySettings(draft);
  const errors: FieldErrors = validation.ok ? {} : validation.errors;

  const pushToServer = useCallback(async (s: MySettings) => {
    setStatus("saving");
    const { error } = await createSupabaseBrowser().rpc("save_my_settings", { p_data: s });
    if (error) {
      setStatus("server-error");
      setServerError(serverErrorMessage(errorCodeOf(error)));
      return;
    }
    setServerError(null);
    setStatus("synced");
  }, []);

  // ログインしていれば、サーバーの設定と比べて新しい方を採用する
  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return;
    let cancelled = false;
    (async () => {
      const supabase = createSupabaseBrowser();
      const { data: { user } } = await supabase.auth.getUser();
      if (cancelled || !user) return;
      setLoggedIn(true);
      const { data: row } = await supabase.from("my_settings").select("data, public_slug").maybeSingle();
      if (cancelled) return;
      setSlug((row?.public_slug as string | null) ?? null);
      const server = parseMySettings(row?.data ?? null);
      const local = loadLocal(storage.current);
      const side = pickNewer(local, server);
      if (side === "server" && server) {
        saveLocal(storage.current, server);
        setDraft(server);
        setStatus("synced");
      } else if (side === "local" && local) {
        await pushToServer(local);
      } else {
        setStatus("synced");
      }
    })();
    return () => { cancelled = true; };
  }, [pushToServer]);

  const update = useCallback((patch: Partial<MySettings>) => {
    const next: MySettings = { ...draft, ...patch, updatedAt: new Date().toISOString() };
    setDraft(next);
    const v = validateMySettings(next);
    if (!v.ok) return;
    saveLocal(storage.current, v.value);
    if (!loggedIn) return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => void pushToServer(v.value), SAVE_DELAY_MS);
  }, [draft, loggedIn, pushToServer]);

  const setPublic = useCallback(async (on: boolean) => {
    const { data, error } = await createSupabaseBrowser().rpc("set_card_public", { p_public: on });
    if (error) { setServerError(serverErrorMessage(errorCodeOf(error))); return; }
    setSlug((data as string | null) ?? null);
  }, []);

  const removeAll = useCallback(async () => {
    clearLocal(storage.current);
    if (loggedIn) {
      const { error } = await createSupabaseBrowser().rpc("delete_my_settings");
      if (error) { setServerError(serverErrorMessage(errorCodeOf(error))); return; }
      setSlug(null);
    }
    setDraft(emptyMySettings());
  }, [loggedIn]);

  return { draft, errors, update, loggedIn, slug, status, serverError, setPublic, removeAll };
}
```

- [ ] **Step 5:** `npx vitest run tests/lib/my-settings-messages.test.ts` を実行し、PASS を確認する。

- [ ] **Step 6: プレビューと同期パネルを書く**

```tsx
// src/components/my/CardPreview.tsx
"use client";
import { useEffect, useState } from "react";
import type { PublicCardData } from "@/lib/card-view";

/** 名刺カードのプレビューと「画像を保存」。入力が止まってから 0.8 秒後に作り直す。 */
export function CardPreview({ data }: { data: PublicCardData | null }) {
  const [url, setUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const body = data ? JSON.stringify(data) : null;

  useEffect(() => {
    if (!body) return;
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const res = await fetch("/api/card-image", { method: "POST", body, headers: { "Content-Type": "application/json" }, signal: ctrl.signal });
        if (!res.ok) throw new Error(String(res.status));
        const next = URL.createObjectURL(await res.blob());
        setUrl((old) => { if (old) URL.revokeObjectURL(old); return next; });
        setFailed(false);
      } catch {
        if (!ctrl.signal.aborted) setFailed(true);
      }
    }, 800);
    return () => { clearTimeout(t); ctrl.abort(); };
  }, [body]);

  return (
    <section className="grid gap-3">
      <h2 className="font-bold">名刺カード</h2>
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element -- blob URL のため next/image は使えない
        <img src={url} alt="名刺カードのプレビュー" width={1200} height={630} className="w-full rounded-xl border border-[var(--rl-border)]" />
      ) : (
        <div className="aspect-[1200/630] w-full rounded-xl bg-white/5" />
      )}
      {failed && <p role="alert" className="text-sm text-[var(--rl-magenta)]">画像を作れませんでした。</p>}
      {url && (
        <a href={url} download="robilab-my-card.png" className="justify-self-start rounded-full bg-[var(--rl-cyan)] px-6 py-3 font-bold text-[#0a0c16]">
          画像を保存
        </a>
      )}
    </section>
  );
}
```

```tsx
// src/components/my/SyncPanel.tsx
"use client";
import { LoginButton } from "@/components/lobby/LoginButton";
import { DeleteAccount } from "@/app/lobby/me/DeleteAccount";
import { buildXShareUrl } from "@/lib/share";
import type { SyncStatus } from "./useMySettings";

type Props = {
  loggedIn: boolean;
  slug: string | null;
  status: SyncStatus;
  serverError: string | null;
  canPublish: boolean;
  onPublic: (on: boolean) => void;
  onRemove: () => void;
};

const STATUS_TEXT: Record<SyncStatus, string> = {
  local: "この端末に保存しています。",
  memory: "この端末には保存されません(ブラウザの設定で保存が止められています)。",
  saving: "サーバーに保存中…",
  synced: "スマホと PC で共有しています。",
  "server-error": "",
};

export function SyncPanel({ loggedIn, slug, status, serverError, canPublish, onPublic, onRemove }: Props) {
  const pageUrl = slug && typeof window !== "undefined" ? `${window.location.origin}/c/${slug}` : null;
  return (
    <section className="grid gap-3 rounded-xl border border-[var(--rl-border)] bg-[var(--rl-surface)] p-4 text-sm">
      <p>{serverError ?? STATUS_TEXT[status]}</p>
      {!loggedIn ? (
        <div className="grid gap-2">
          <p className="text-[var(--rl-muted)]">Discord でログインすると、スマホと PC で共有でき、名刺を URL で公開できます。</p>
          <div><LoginButton next="/my" /></div>
        </div>
      ) : (
        <div className="grid gap-3">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={Boolean(slug)} disabled={!canPublish} onChange={(e) => onPublic(e.target.checked)} />
            名刺を公開する(URL を知っている人が見られます)
          </label>
          {pageUrl && (
            <div className="grid gap-2">
              <a href={pageUrl} className="break-all text-[var(--rl-cyan)] underline">{pageUrl}</a>
              <a href={buildXShareUrl("わたしのゲーム設定 #ロビラボ", pageUrl)} target="_blank" rel="noopener" className="justify-self-start rounded-full bg-[var(--rl-cyan)] px-6 py-3 font-bold text-[#0a0c16]">
                X でシェア
              </a>
            </div>
          )}
          <DeleteAccount />
        </div>
      )}
      <button type="button" onClick={() => { if (confirm("マイ設定を消します(この端末とサーバーの両方)。よろしいですか?")) onRemove(); }}
        className="justify-self-start text-[var(--rl-muted)] underline">
        設定を消す
      </button>
    </section>
  );
}
```

- [ ] **Step 7: エディターとページを書く**

```tsx
// src/components/my/MySettingsEditor.tsx
"use client";
import Link from "next/link";
import { SENS_GAMES } from "@/data/sensitivity";
import { getType } from "@/data/types";
import { deviceOptions } from "@/data/devices";
import { gameOptions } from "@/data/popular-games";
import { DEVICE_SLOTS, GRIPS, MY_SETTINGS_LIMITS, normalizeText, type Grip, type ItemRef } from "@/lib/my-settings";
import { toPublicCardData } from "@/lib/card-view";
import { PixelIcon } from "@/components/brand/PixelIcon";
import { NumberField } from "./NumberField";
import { ItemPicker } from "./ItemPicker";
import { CardPreview } from "./CardPreview";
import { SyncPanel } from "./SyncPanel";
import { useMySettings } from "./useMySettings";

const SLOT_LABEL = { mouse: "マウス", pad: "マウスパッド", keyboard: "キーボード", headset: "ヘッドセット" } as const;
const GRIP_LABEL: Record<Grip, string> = { palm: "かぶせ", claw: "つかみ", fingertip: "つまみ" };
const box = "grid gap-3 rounded-xl border border-white/10 bg-[var(--rl-surface)] p-4";

export function MySettingsEditor() {
  const { draft, errors, update, loggedIn, slug, status, serverError, setPublic, removeAll } = useMySettings();
  const type = draft.typeCode ? getType(draft.typeCode) : undefined;
  const games = gameOptions();
  const favSlots: (ItemRef | null)[] = Array.from({ length: MY_SETTINGS_LIMITS.favoriteGamesMax }, (_, i) => draft.favoriteGames[i] ?? null);
  const valid = Object.keys(errors).length === 0;

  return (
    <div className="grid gap-5">
      <section className={box}>
        <h2 className="font-bold">タイプ</h2>
        {type ? (
          <div className="flex items-center gap-3"><PixelIcon code={type.code} /><div><b>{type.code}</b> {type.name}</div></div>
        ) : (
          <Link href="/diagnosis" className="justify-self-start rounded-full bg-[var(--rl-magenta)] px-5 py-2 font-bold text-[#0a0c16]">診断する(約1分半)</Link>
        )}
      </section>

      <section className={box}>
        <h2 className="font-bold">感度</h2>
        <NumberField label="マウスの DPI" value={draft.dpi} error={errors.dpi} onValue={(dpi) => update({ dpi })} />
        <label className="grid gap-1 text-sm">
          メインのゲーム
          <select value={draft.mainGame ?? ""} onChange={(e) => update({ mainGame: e.target.value || null })}
            className="h-12 rounded-xl border border-white/15 bg-[#151a33] px-3 text-base">
            <option value="">選ばない</option>
            {SENS_GAMES.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
        </label>
        {SENS_GAMES.map((g) => (
          <NumberField key={g.id} label={`${g.name} の感度`} value={draft.sens[g.id] ?? null} error={errors[`sens.${g.id}`]}
            onValue={(v) => {
              const sens = { ...draft.sens };
              if (v === null) delete sens[g.id]; else sens[g.id] = v;
              update({ sens });
            }} />
        ))}
      </section>

      <section className={box}>
        <h2 className="font-bold">手と持ち方</h2>
        <div className="grid grid-cols-2 gap-3">
          <NumberField label="手の長さ" suffix="cm" value={draft.hand.lengthCm} error={errors["hand.lengthCm"]} onValue={(lengthCm) => update({ hand: { ...draft.hand, lengthCm } })} />
          <NumberField label="手の幅" suffix="cm" value={draft.hand.widthCm} error={errors["hand.widthCm"]} onValue={(widthCm) => update({ hand: { ...draft.hand, widthCm } })} />
        </div>
        <div className="flex gap-2" role="radiogroup" aria-label="持ち方">
          {GRIPS.map((g) => (
            <button key={g} type="button" role="radio" aria-checked={draft.hand.grip === g}
              onClick={() => update({ hand: { ...draft.hand, grip: draft.hand.grip === g ? null : g } })}
              className={`h-10 flex-1 rounded-full ${draft.hand.grip === g ? "bg-[var(--rl-cyan)] text-[#0a0c16]" : "bg-white/10"}`}>
              {GRIP_LABEL[g]}
            </button>
          ))}
        </div>
        <p className="text-xs text-[var(--rl-muted)]">手の大きさはマウス探しで使います。公開する名刺には出しません。</p>
      </section>

      <section className={box}>
        <h2 className="font-bold">使っているデバイス</h2>
        {DEVICE_SLOTS.map((slot) => (
          <ItemPicker key={slot} label={SLOT_LABEL[slot]} listId={`dev-${slot}`} options={deviceOptions(slot)} value={draft.devices[slot]}
            error={errors[`devices.${slot}`]} onValue={(v) => update({ devices: { ...draft.devices, [slot]: v } })} />
        ))}
      </section>

      <section className={box}>
        <h2 className="font-bold">好きなゲーム(最大{MY_SETTINGS_LIMITS.favoriteGamesMax}つ)</h2>
        {favSlots.map((g, i) => (
          <ItemPicker key={i} label={`${i + 1}つ目`} listId={`fav-games-${i}`} options={games} value={g}
            onValue={(v) => {
              const next = [...favSlots];
              next[i] = v;
              update({ favoriteGames: next.filter((x): x is ItemRef => x !== null) });
            }} />
        ))}
        {errors.favoriteGames && <p role="alert" className="text-xs text-[var(--rl-magenta)]">{errors.favoriteGames}</p>}
      </section>

      <section className={box}>
        <h2 className="font-bold">名刺の表示名</h2>
        <label className="grid gap-1 text-sm">
          カードに出す名前({MY_SETTINGS_LIMITS.cardNameMax}字まで)
          <input defaultValue={draft.cardName ?? ""} onChange={(e) => update({ cardName: normalizeText(e.target.value) })}
            className="h-12 rounded-xl border border-white/15 bg-[#151a33] px-3 text-base" />
          {errors.cardName && <span role="alert" className="text-xs text-[var(--rl-magenta)]">{errors.cardName}</span>}
        </label>
      </section>

      <CardPreview data={valid ? toPublicCardData(draft) : null} />
      <SyncPanel loggedIn={loggedIn} slug={slug} status={status} serverError={serverError} canPublish={valid && status !== "server-error"}
        onPublic={(on) => void setPublic(on)} onRemove={() => void removeAll().then(() => window.location.reload())} />
    </div>
  );
}
```

```tsx
// src/components/my/MySettingsClient.tsx
"use client";
import { useIsClient } from "@/lib/use-is-client";
import { MySettingsEditor } from "./MySettingsEditor";

/** localStorage はブラウザでしか読めないので、ハイドレーションが終わってからエディターを出す。 */
export function MySettingsClient() {
  const isClient = useIsClient();
  if (!isClient) return <div className="h-96 animate-pulse rounded-xl bg-white/5" />;
  return <MySettingsEditor />;
}
```

```tsx
// src/app/my/page.tsx
import type { Metadata } from "next";
import { MySettingsClient } from "@/components/my/MySettingsClient";

export const metadata: Metadata = {
  title: "マイ設定",
  description: "感度・デバイス・好きなゲームを一度だけ登録して、ツールで使ったり名刺カードにしてシェアしたりできます。",
};

export default function MyPage() {
  return (
    <main className="mx-auto max-w-md px-4 py-6">
      <h1 className="mb-2 text-2xl font-bold">マイ設定</h1>
      <p className="mb-6 text-sm text-[var(--rl-muted)]">一度入れたら、感度計算などのツールが自動で使います。入力はその場で保存されます。</p>
      <MySettingsClient />
    </main>
  );
}
```

- [ ] **Step 8:** `src/proxy.ts` の matcher に `/my` を足す(ログインのセッションを更新するため)。

```ts
export const config = { matcher: ["/lobby/:path*", "/auth/:path*", "/my"] };
```

- [ ] **Step 9:** `npx tsc --noEmit`、`npm run lint`、`npm test` を実行し、どれもエラー0件・全件 PASS を確認する。
  - lint が「effect の中で同期的に setState」と言ったら、その setState を await のあとか、コールバックの中に移す。

- [ ] **Step 10: 手で確認する(ログインなし)。**
  - `npm run build` のあと preview で `/my` を開き、次を確かめる。
    - DPI 800、VALORANT 感度 0.35、メインゲーム VALORANT を入れると、プレビューに感度の行が出る。
    - DPI に「abc」を入れると「数字で入力してください。」が出る。
    - DPI に 10 を入れると範囲のエラーが出て、プレビューが更新されない。
    - ページを再読み込みしても、入力が残っている。
    - 「画像を保存」で PNG がダウンロードされる。
  - コンソールに CSP 違反が出ていないことを確かめる。
  - ログインしたときの確認は、公開当日の手順(Task 11)に回す。ブラウザにログイン状態を入れる操作は、安全チェックで止められるため。

- [ ] **Step 11: コミット**

```bash
git add src/lib/use-is-client.ts src/components/my src/app/my src/proxy.ts tests/lib/my-settings-messages.test.ts
git -c user.name=pitos -c user.email=pito.shinzin@gmail.com commit -m "feat: マイ設定ページ(入力・自動保存・同期・名刺プレビュー)を追加

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 8: 既存の画面とつなぐ(診断・感度計算・ヘッダー・結果ページ)

**Files:**
- Modify:
  - `src/app/diagnosis/DiagnosisClient.tsx`
  - `src/app/tools/sensitivity/SensitivityClient.tsx`
  - `src/app/tools/sensitivity/page.tsx`
  - `src/components/brand/SiteHeader.tsx`
  - `src/app/type/[code]/page.tsx`
- Create:`src/app/tools/sensitivity/SensitivityTool.tsx`
- Test:
  - `tests/lib/my-settings-store.test.ts`(Task 3 で済み)
  - `tests/lib/sens-defaults.test.ts`(新)

**Interfaces:**
- Consumes:
  - `applyDiagnosisToLocal`、`saveSensToLocal`、`loadLocal`、`browserStorage`(Task 3)
  - `useIsClient`(Task 7)
- Produces:
  - `sensDefaults(s: MySettings | null): { gameId: string; dpiText: string; sensText: string } | null`(`src/lib/my-settings-store.ts` に追加)
  - `SensitivityClient` の props:`{ initial?: { gameId: string; dpiText: string; sensText: string } | null }`

- [ ] **Step 1: 失敗するテストを書く**

```ts
// tests/lib/sens-defaults.test.ts
import { describe, it, expect } from "vitest";
import { emptyMySettings } from "@/lib/my-settings";
import { sensDefaults } from "@/lib/my-settings-store";

describe("sensDefaults", () => {
  it("uses the main game, DPI and its sensitivity", () => {
    const s = { ...emptyMySettings(), dpi: 800, mainGame: "apex", sens: { apex: 1.2 } };
    expect(sensDefaults(s)).toEqual({ gameId: "apex", dpiText: "800", sensText: "1.2" });
  });
  it("returns null when something is missing", () => {
    expect(sensDefaults(null)).toBeNull();
    expect(sensDefaults({ ...emptyMySettings(), dpi: 800, mainGame: "apex", sens: {} })).toBeNull();
    expect(sensDefaults({ ...emptyMySettings(), dpi: null, mainGame: "apex", sens: { apex: 1.2 } })).toBeNull();
  });
});
```

- [ ] **Step 2:** `npx vitest run tests/lib/sens-defaults.test.ts` を実行し、FAIL を確認する。

- [ ] **Step 3:** `src/lib/my-settings-store.ts` の末尾に追加する。

```ts
/** 感度計算ツールの初期値(マイ設定のメインゲーム・DPI・感度)。そろっていなければ null。 */
export function sensDefaults(s: MySettings | null): { gameId: string; dpiText: string; sensText: string } | null {
  if (!s || s.dpi === null || !s.mainGame) return null;
  const sens = s.sens[s.mainGame];
  if (sens === undefined) return null;
  return { gameId: s.mainGame, dpiText: String(s.dpi), sensText: String(sens) };
}
```

- [ ] **Step 4:** `npx vitest run tests/lib/sens-defaults.test.ts` を実行し、PASS を確認する。

- [ ] **Step 5: 診断の完了時にマイ設定へ入れる。**
  - `src/app/diagnosis/DiagnosisClient.tsx` の import に次を足す。

```ts
import { applyDiagnosisToLocal, browserStorage } from "@/lib/my-settings-store";
```

  - `void recordDiagnosis(code, axes);` の次の行に足す。

```ts
    applyDiagnosisToLocal(browserStorage(), code, axes);
```

- [ ] **Step 6: 感度計算ツールにマイ設定をつなぐ。**
  - `SensitivityClient.tsx` の関数の先頭を次のように変える(`initial` があればそれで始める)。

```tsx
import { browserStorage, saveSensToLocal } from "@/lib/my-settings-store";

type Initial = { gameId: string; dpiText: string; sensText: string } | null;

export function SensitivityClient({ initial = null }: { initial?: Initial }) {
  const [gameId, setGameId] = useState(initial?.gameId ?? SENS_GAMES[0].id);
  const [dpiText, setDpiText] = useState(initial?.dpiText ?? "800");
  const [sensText, setSensText] = useState(initial?.sensText ?? "0.35");
  const [saved, setSaved] = useState<string | null>(null);
```

  - `{results && (` の直前に、保存ボタンを足す。

```tsx
      {!error && dpi !== null && sens !== null && (
        <div className="grid gap-1">
          <button type="button"
            onClick={() => setSaved(saveSensToLocal(browserStorage(), gameId, Math.round(dpi), sens) ? "マイ設定に保存しました。" : "保存できませんでした(DPI は整数、感度は範囲内で入力してください)。")}
            className="justify-self-start rounded-full bg-white/10 px-5 py-2 text-sm">
            マイ設定に保存
          </button>
          {saved && <p className="text-xs text-[var(--rl-lime)]">{saved}</p>}
        </div>
      )}
```

  - 新しいファイルを作る。

```tsx
// src/app/tools/sensitivity/SensitivityTool.tsx
"use client";
import { useIsClient } from "@/lib/use-is-client";
import { browserStorage, loadLocal, sensDefaults } from "@/lib/my-settings-store";
import { SensitivityClient } from "./SensitivityClient";

/** ブラウザで描画し始めたら、マイ設定の値で入れ直す(key を変えて作り直す)。 */
export function SensitivityTool() {
  const isClient = useIsClient();
  const initial = isClient ? sensDefaults(loadLocal(browserStorage())) : null;
  return <SensitivityClient key={isClient ? "client" : "server"} initial={initial} />;
}
```

  - `src/app/tools/sensitivity/page.tsx` の `SensitivityClient` の import と使用箇所を、`SensitivityTool` に置き換える。

- [ ] **Step 7: ヘッダーと結果ページに導線を足す。**
  - `SiteHeader.tsx` の `<Link href="/tools/sensitivity">感度計算</Link>` の次に足す。

```tsx
        <Link href="/my">マイ設定</Link>
```

  - `src/app/type/[code]/page.tsx` の `<ShareButton ... />` がある箇所のすぐ後に足す。

```tsx
        <Link href="/my" className="inline-block rounded-full border border-[var(--rl-border)] px-6 py-3 font-bold">マイ設定に登録しよう</Link>
```

- [ ] **Step 8:** `npx tsc --noEmit`、`npm run lint`、`npm test`、`npm run build` を実行し、すべて通ることを確認する。

- [ ] **Step 9: 手で確認する。**
  - preview で診断を最後まで進める。
  - `/my` にタイプが入っていることを確かめる。
  - `/tools/sensitivity` で「マイ設定に保存」を押す。
  - `/my` に DPI と感度が入っていることを確かめる。
  - `/tools/sensitivity` を開き直して、保存した値が最初から入っていることを確かめる。
  - スマホ幅(`resize_window` の mobile)で、ヘッダーのリンクが折り返しても押せることを確かめる。

- [ ] **Step 10: コミット**

```bash
git add src/lib/my-settings-store.ts tests/lib/sens-defaults.test.ts src/app/diagnosis/DiagnosisClient.tsx src/app/tools/sensitivity src/components/brand/SiteHeader.tsx "src/app/type/[code]/page.tsx"
git -c user.name=pitos -c user.email=pito.shinzin@gmail.com commit -m "feat: 診断・感度計算・ヘッダー・結果ページをマイ設定とつなぐ

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 9: 公開カードのページ(`/c/[slug]`)と X 用画像

**Files:**
- Create:
  - `src/lib/supabase/anon.ts`
  - `src/lib/public-card.ts`
  - `src/app/c/[slug]/page.tsx`
  - `src/app/c/[slug]/opengraph-image.tsx`
- Test:
  - `tests/lib/public-card.test.ts`
  - 画面は手で確認する

**Interfaces:**
- Consumes:
  - `validatePublicCardData`、`buildCardView`(Task 5)
  - `renderCardImage`、`CARD_SIZE`(Task 6)
  - `get_public_card`(Task 4)
- Produces:
  - `createSupabaseAnon(): SupabaseClient`
  - `isSlug(s: string): boolean`
  - `fetchPublicCard(slug: string): Promise<PublicCardData | null>`

- [ ] **Step 1: 失敗するテストを書く**

```ts
// tests/lib/public-card.test.ts
import { describe, it, expect } from "vitest";
import { isSlug } from "@/lib/public-card";

describe("isSlug", () => {
  it("accepts only 10 alphanumeric characters", () => {
    expect(isSlug("Ab3dEf9hIj")).toBe(true);
    expect(isSlug("short")).toBe(false);
    expect(isSlug("Ab3dEf9hIj!")).toBe(false);
    expect(isSlug("../../etc/x")).toBe(false);
  });
});
```

- [ ] **Step 2:** `npx vitest run tests/lib/public-card.test.ts` を実行し、FAIL を確認する。

- [ ] **Step 3: 実装する**

```ts
// src/lib/supabase/anon.ts
import { createClient } from "@supabase/supabase-js";

/** ログイン情報を使わない読み取り専用のクライアント(公開カードの取得用)。 */
export function createSupabaseAnon() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { auth: { persistSession: false } });
}
```

```ts
// src/lib/public-card.ts
import { createSupabaseAnon } from "@/lib/supabase/anon";
import { validatePublicCardData, type PublicCardData } from "@/lib/card-view";

const SLUG_RE = /^[A-Za-z0-9]{10}$/;

export function isSlug(s: string): boolean {
  return SLUG_RE.test(s);
}

/** 公開中のカードを取る。非公開・存在しない・形がおかしいときは null。 */
export async function fetchPublicCard(slug: string): Promise<PublicCardData | null> {
  if (!isSlug(slug) || !process.env.NEXT_PUBLIC_SUPABASE_URL) return null;
  const { data, error } = await createSupabaseAnon().rpc("get_public_card", { p_slug: slug });
  if (error) throw new Error(error.message);
  return validatePublicCardData(data) ? data : null;
}
```

- [ ] **Step 4:** `npx vitest run tests/lib/public-card.test.ts` を実行し、PASS を確認する。

- [ ] **Step 5:** `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/01-metadata/opengraph-image.md` を読み、動的なセグメントでの `params`(Promise)と `notFound()` の扱いを確認する。

- [ ] **Step 6: ページと画像を書く**

```tsx
// src/app/c/[slug]/opengraph-image.tsx
import { notFound } from "next/navigation";
import { fetchPublicCard } from "@/lib/public-card";
import { buildCardView } from "@/lib/card-view";
import { renderCardImage, CARD_SIZE } from "@/components/card/CardImage";

export const size = CARD_SIZE;
export const contentType = "image/png";
export const alt = "ロビラボ マイ設定の名刺カード";

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const card = await fetchPublicCard(slug);
  if (!card) notFound();
  return renderCardImage(buildCardView(card));
}
```

```tsx
// src/app/c/[slug]/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { fetchPublicCard } from "@/lib/public-card";
import { buildCardView } from "@/lib/card-view";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const card = await fetchPublicCard(slug);
  if (!card) return { robots: { index: false, follow: false } };
  const view = buildCardView(card);
  return {
    title: `${view.cardName ?? "ゲーマー"}のマイ設定`,
    description: "ロビラボのマイ設定(感度・デバイス・好きなゲーム)の名刺カード",
    robots: { index: false, follow: false },
  };
}

export default async function PublicCardPage({ params }: Props) {
  const { slug } = await params;
  const card = await fetchPublicCard(slug);
  if (!card) notFound();
  const view = buildCardView(card);
  return (
    <main className="mx-auto grid max-w-2xl gap-5 px-4 py-6">
      <h1 className="text-2xl font-bold">{view.cardName ?? "ゲーマー"}のマイ設定</h1>
      {/* eslint-disable-next-line @next/next/no-img-element -- 動的な OG 画像をそのまま見せる */}
      <img src={`/c/${slug}/opengraph-image`} alt="名刺カード" width={1200} height={630} className="w-full rounded-xl border border-[var(--rl-border)]" />
      <Link href="/my" className="justify-self-start rounded-full bg-[var(--rl-magenta)] px-6 py-3 font-bold text-[#0a0c16]">自分も作る</Link>
    </main>
  );
}
```

- [ ] **Step 7:** `npx tsc --noEmit`、`npm run lint`、`npm test`、`npm run build` を実行し、すべて通ることを確認する。

- [ ] **Step 8: 手で確認する。**
  - dev でテスト用ユーザーを作る。RLS テストのヘルパーと同じく service role で作り、秘密の値は表示しない。
  - `save_my_settings` と `set_card_public(true)` で slug を得る。
  - preview で `/c/<slug>` を開き、次を確かめる。
    - カードが表示される。
    - `<meta name="robots" content="noindex, nofollow">` がある(`read_page` で確認)。
    - `/c/<slug>/opengraph-image` が PNG を返す。
    - `/c/AAAAAAAAAA` が 404 になる。
  - 確認が終わったら、テストユーザーを削除する。

- [ ] **Step 9: コミット**

```bash
git add src/lib/supabase/anon.ts src/lib/public-card.ts tests/lib/public-card.test.ts "src/app/c"
git -c user.name=pitos -c user.email=pito.shinzin@gmail.com commit -m "feat: 名刺カードの公開ページと X 用画像を追加

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 10: 文書の更新(プライバシーポリシー・運営手順・公開手順・ER 図・spec)

**Files:**
- Modify:
  - `content/legal/privacy.md`
  - `docs/ops/moderation.md`
  - `docs/ops/launch.md`
  - `export/erd/build-erd.cjs`(と生成物の svg・png)
  - `docs/superpowers/specs/2026-09-29-my-settings-design.md`(DPI の範囲)

- [ ] **Step 1:** `content/legal/privacy.md` の「## 1-4. プロフィール情報について」の節の後に、次の節を足す。

```markdown
## 1-5. マイ設定について

マイ設定では、次の情報を登録できます。

- 診断タイプ、マウスの DPI とゲームごとの感度
- 手の長さ・幅と持ち方
- 使っているデバイス、好きなゲーム
- 名刺の表示名

ログインしていない場合は、お使いのブラウザの中だけに保存し、当サイトのサーバーには送りません。
Discord でログインした場合は、スマホと PC で共有するため、当サイトのサーバー(Supabase)にも保存します。

「名刺を公開する」をオンにした場合に限り、URL を知っている人が次の情報を見られます。

- 診断タイプ、表示名、メインのゲームとその感度、DPI
- 持ち方、デバイス、好きなゲーム

手の長さ・幅と、Discord のユーザー名・ID は公開しません。公開はいつでもオフにでき、オフにした URL は使えなくなります。

マイ設定の「設定を消す」で、ブラウザとサーバーの両方から削除できます。退会した場合も削除されます。
```

- [ ] **Step 2:** `docs/ops/moderation.md` の「## よく使う確認用 SQL」の前に、次の節を足す。

```markdown
## 問題のある名刺カードを非公開にする

公開 URL(`/c/<slug>`)の内容に問題がある場合は、SQL エディタで次を実行する。URL はすぐに使えなくなる。

```sql
update my_settings set public_slug = null where public_slug = '<slug>';
```

内容そのものを消す場合は、`delete from my_settings where public_slug = '<slug>';` を使う。
```

- [ ] **Step 3:** `docs/ops/launch.md` の本番に適用する migration の一覧に、次の行を足す。

```markdown
   - [ ] `supabase/migrations/20261001001100_my_settings.sql`(マイ設定の表と関数。マイ設定を公開するときだけ必要)
```

  - 本番での確認項目に、次の行を足す。

```markdown
   - [ ] マイ設定:ログインして入力 → 別の端末でログインして同じ内容が出る → 名刺を公開して X に貼るとカードが出る → 公開をオフにすると URL が 404
```

- [ ] **Step 4: ER 図に my_settings を足す。**
  - `export/erd/build-erd.cjs` の `tables` に次の表を足す。位置は `x: 400, y: 880` とし、`W` と `H` と凡例の `ly` を、重ならないように広げる。

```js
  { id: "my_settings", name: "my_settings", sub: "マイ設定(1人1件)", x: 400, y: 880, w: 340, access: "own",
    cols: [["user_id", "uuid", "PK FK"], ["data", "jsonb(〜4KB)", ""], ["updated_at", "timestamptz", ""], ["public_slug", "text?(10文字)", "UQ"]] },
```

  - `rels` に次の行を足す(auth.users へ、ON DELETE CASCADE)。

```js
  ["my_settings", "user_id", "auth_users", "id", "CASCADE", "1:1"],
```

  - タイトルの migration 番号を `20261001001100` に変える。
  - `node export/erd/build-erd.cjs` を実行し、次のコマンドで PNG を作り直す。

```bash
"/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe" --headless=new --disable-gpu --hide-scrollbars --force-device-scale-factor=2 --window-size=<W>,<H> --screenshot="C:\\Users\\pitos\\dev\\gamer-hub\\export\\erd\\robilab-erd.png" "file:///C:/Users/pitos/dev/gamer-hub/export/erd/robilab-erd.svg"
```

  - PNG を開き、表や線が重なっていないことを目で確認する。

- [ ] **Step 5:** spec 4.1 の `dpi: number | null; // 100〜32000 の整数` を、`dpi: number | null; // 50〜64000 の整数(感度計算ツールの DPI_MIN / DPI_MAX と同じ)` に直す。

- [ ] **Step 6: コミット**

```bash
git add content/legal/privacy.md docs/ops/moderation.md docs/ops/launch.md export/erd docs/superpowers/specs/2026-09-29-my-settings-design.md
git -c user.name=pitos -c user.email=pito.shinzin@gmail.com commit -m "docs: マイ設定のプライバシーポリシー・運営手順・公開手順・ER 図を更新

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 11: 仕上げ(全体の確認・セキュリティ監査・記録)

- [ ] **Step 1: 全部のチェックを流す。**
  - `npm test`、`npm run test:rls`、`npx tsc --noEmit`、`npm run lint`、`npm run build` を実行する。
  - すべて通ること、lint が0件であることを確認し、結果の件数を記録する。

- [ ] **Step 2: 差分のセキュリティ監査をかける。**
  - `public-web-security-gate` スキルに従い、`feat/v0.1-part2..feat/my-settings` の差分を quick の scoped run で監査する。
  - 出力先は `~/security-audit-skill/gamer-hub/run-3`。
  - confirmed の critical / high が出たら、直すまでマージしない。

- [ ] **Step 3:** `plan.md` を更新する。
  - 進捗ログに、実装した内容、テストの件数、監査の結果を1行ずつ足す。
  - 4章のロードマップに「公開後の機能:マイ設定(実装済み・公開待ち)」を足す。

- [ ] **Step 4:** コミットして push する(`git push -u origin feat/my-settings`)。

- [ ] **Step 5: 本人への報告をまとめる。**
  - 次のことを入れる。
    - 手で確認できたこと
    - ログインが必要で確認できなかったこと(同期・公開 URL を実際のブラウザで試すこと)
    - 候補一覧で表記を直したもの
    - 監査の結果
  - 次のサブプロジェクト(マウス探し・プロ設定・エイム練習)のどれに進むかを聞く。

/**
 * docs/content/gear/*.json(メーカー公式の数字・出典 URL・確認日つき)から、src/data の型付きの .ts を作る。
 * 使い方(リポジトリの一番上で): node scripts/gear-data.ts
 * JSON を直したら作り直し、JSON と .ts を一緒にコミットする。サイトの実行時には JSON を読まない(この .ts だけを import する)。
 * tests/data/gear-generated.test.ts が、同じ関数で作った文字と .ts を比べて「作り直し忘れ」を見つける。
 */
import { readFileSync, writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import type { MouseConnection, MouseShape, MouseSpec, PadSpec, PadSurface, SkateMaterial, SkateShape, SkateSpec } from "../src/data/gear-types";

const header = (src: string) =>
  `// scripts/gear-data.ts が ${src} から作る。手で直さない(JSON を直して \`node scripts/gear-data.ts\` で作り直す)。\n`;

/** 画面に出す名前の直し(id は残す)。設計書 2 章:LGG は Pulsar の後継(Pulsar eS)、SkyPAD は Wallhack。Razer は名前にブランドを重ねない */
export const PAD_RENAMES: Record<string, { brand?: string; name?: string }> = {
  "lgg-saturn-pro": { brand: "Pulsar" },
  "lgg-jupiter": { brand: "Pulsar" },
  "skypad-glass-3": { brand: "Wallhack" },
  "razer-gigantus-v2": { name: "Gigantus V2" },
  "razer-gigantus-v2-pro": { name: "Gigantus V2 Pro" },
  "razer-strider": { name: "Strider" },
  "razer-atlas": { name: "Atlas" },
};
/** 生産終了(docs/content/gear/pads-notes.md 4 章。公式ページに生産終了と書いてあるもの) */
export const DISCONTINUED_PADS: readonly string[] = ["artisan-shidenkai", "zowie-g-sr", "zowie-g-tr"];
/** ソールの生産終了(skates-notes.md に記載なし) */
export const DISCONTINUED_SKATES: readonly string[] = [];

const MOUSE_SHAPES: readonly MouseShape[] = ["symmetric", "right"];
const CONNECTIONS: readonly MouseConnection[] = ["wired", "wireless", "both"];
/** マウスの生産終了(mice-notes.md に記載なし) */
export const DISCONTINUED_MICE: readonly string[] = [];

type RawMouse = {
  id: string; brand: string; name: string; lengthMm: number | null; widthMm: number | null; heightMm: number | null; weightG: number | null;
  shape: string | null; connection: string | null; sensor: string | null; officialUrl: string; checkedAt: string;
  inExistingData: boolean; selectionBasis: string; notes: string;
};

const SURFACES: readonly PadSurface[] = ["cloth", "hybrid", "glass", "hard", "other"];
const MATERIALS: readonly SkateMaterial[] = ["PTFE", "glass", "ceramic", "UPE", "other"];
const SKATE_SHAPES: readonly SkateShape[] = ["full", "dot", "other"];

/** JSON の 1 件(JSON.parse の結果なので中身は確かめながら使う) */
type RawPad = {
  id: string; brand: string; name: string; surface: string | null; speedOfficial: string | null; firmnessVariants: string[];
  sizes: { label: string; widthMm: number | null; depthMm: number | null; thicknessMm: number | null }[];
  base: string | null; stitchedEdge: boolean | null; officialUrl: string | null; checkedAt: string; selectionBasis: string; notes: string;
};
type RawSkate = {
  id: string; brand: string; line: string; name: string; forMouse: string; mouseId: string | null; mouseIds: string[];
  material: string | null; materialOfficial: string | null; shape: string; thicknessMm: number | null; thicknessOfficial: string | null;
  piecesPerPack: number | null; setsPerPack: number | null; extras: string[]; officialUrl: string; checkedAt: string; selectionBasis: string; notes: string[];
};

/** 決まった値のどれかか null。それ以外はデータの間違いなので止める */
function oneOf<T extends string>(value: string | null, allowed: readonly T[], where: string): T | null {
  if (value === null) return null;
  if ((allowed as readonly string[]).includes(value)) return value as T;
  throw new Error(`${where}: 想定外の値 ${JSON.stringify(value)}`);
}

/** 名前の直し・生産終了の表の id がデータにあるか。ないものは書き間違い(または消し忘れ)なので止める */
export function assertKnownIds(listed: readonly string[], known: readonly string[], where: string): void {
  const unknown = listed.filter((id) => !known.includes(id));
  if (unknown.length > 0) throw new Error(`${where}: データにない id ${unknown.join(", ")}`);
}

export function toMouseSpecs(raw: RawMouse[]): MouseSpec[] {
  assertKnownIds(DISCONTINUED_MICE, raw.map((m) => m.id), "DISCONTINUED_MICE");
  return raw.map((m) => ({
    id: m.id,
    brand: m.brand,
    name: m.name,
    lengthMm: m.lengthMm,
    widthMm: m.widthMm,
    heightMm: m.heightMm,
    weightG: m.weightG,
    shape: oneOf(m.shape, MOUSE_SHAPES, `${m.id}.shape`),
    connection: oneOf(m.connection, CONNECTIONS, `${m.id}.connection`),
    sensor: m.sensor,
    officialUrl: m.officialUrl,
    checkedAt: m.checkedAt,
    selectionBasis: m.selectionBasis,
    note: m.notes,
    discontinued: DISCONTINUED_MICE.includes(m.id),
  }));
}

export function toPadSpecs(raw: { pads: RawPad[] }): PadSpec[] {
  const padIds = raw.pads.map((p) => p.id);
  assertKnownIds(Object.keys(PAD_RENAMES), padIds, "PAD_RENAMES");
  assertKnownIds(DISCONTINUED_PADS, padIds, "DISCONTINUED_PADS");
  return raw.pads.map((p) => {
    const rename = PAD_RENAMES[p.id] ?? {};
    return {
      id: p.id,
      brand: rename.brand ?? p.brand,
      name: rename.name ?? p.name,
      surface: oneOf(p.surface, SURFACES, `${p.id}.surface`),
      speedOfficial: p.speedOfficial,
      firmnessVariants: p.firmnessVariants,
      sizes: p.sizes.map((s) => ({ label: s.label, widthMm: s.widthMm, depthMm: s.depthMm, thicknessMm: s.thicknessMm })),
      base: p.base,
      stitchedEdge: p.stitchedEdge,
      officialUrl: p.officialUrl,
      checkedAt: p.checkedAt,
      selectionBasis: p.selectionBasis,
      note: p.notes,
      hidden: p.officialUrl === null && p.sizes.length === 0,
      discontinued: DISCONTINUED_PADS.includes(p.id),
    };
  });
}

export function toSkateSpecs(raw: { items: RawSkate[] }): SkateSpec[] {
  assertKnownIds(DISCONTINUED_SKATES, raw.items.map((x) => x.id), "DISCONTINUED_SKATES");
  return raw.items.map((s) => {
    if (s.mouseId !== null && !s.mouseIds.includes(s.mouseId)) throw new Error(`${s.id}: mouseId が mouseIds に入っていない`);
    const shape = oneOf(s.shape, SKATE_SHAPES, `${s.id}.shape`);
    if (shape === null) throw new Error(`${s.id}: shape がない`);
    return {
      id: s.id,
      brand: s.brand,
      line: s.line,
      name: s.name,
      forMouse: s.forMouse,
      mouseIds: s.mouseIds,
      material: oneOf(s.material, MATERIALS, `${s.id}.material`),
      materialOfficial: s.materialOfficial,
      shape,
      thicknessMm: s.thicknessMm,
      thicknessOfficial: s.thicknessOfficial,
      piecesPerPack: s.piecesPerPack,
      setsPerPack: s.setsPerPack,
      extras: s.extras,
      officialUrl: s.officialUrl,
      checkedAt: s.checkedAt,
      selectionBasis: s.selectionBasis,
      note: s.notes.join(" / "),
      discontinued: DISCONTINUED_SKATES.includes(s.id),
    };
  });
}

/** 1 件を 1 行に(差分が読みやすい。JSON の書き方は TS としても正しい) */
function lines(items: readonly object[]): string {
  return items.map((x) => `  ${JSON.stringify(x)},`).join("\n");
}

export function renderPadsTs(raw: { pads: RawPad[] }): string {
  return `${header("docs/content/gear/pads.json")}import type { PadSpec } from "./gear-types";
export type { PadSize, PadSpec, PadSurface } from "./gear-types";

export const PADS: PadSpec[] = [
${lines(toPadSpecs(raw))}
];
`;
}

export function renderSkatesTs(raw: { items: RawSkate[] }): string {
  return `${header("docs/content/gear/skates.json")}import type { SkateSpec } from "./gear-types";
export type { SkateMaterial, SkateShape, SkateSpec } from "./gear-types";

export const SKATES: SkateSpec[] = [
${lines(toSkateSpecs(raw))}
];
`;
}

export function renderMiceTs(raw: RawMouse[]): string {
  return `${header("docs/content/gear/mice.json")}// 並びは JSON のまま(src/data/mice-rakuten.ts の並びと合わせる。tests/data/mice-rakuten.test.ts)。
import type { MouseSpec } from "./gear-types";
export type { MouseConnection, MouseShape, MouseSpec } from "./gear-types";

export const MICE: MouseSpec[] = [
${lines(toMouseSpecs(raw))}
];

export function mouseById(id: string): MouseSpec | undefined {
  return MICE.find((m) => m.id === id);
}
`;
}

export function renderMiceIdsTs(raw: RawMouse[]): string {
  return `${header("docs/content/gear/mice.json")}// マウス探し(/mouse)に載っているマウスの id だけ。ブラウザの部品(プロ設定の行など)はこちらを読む(機種のデータ本体を JS に入れない)。
export const MICE_IDS: readonly string[] = ${JSON.stringify(raw.map((m) => m.id))};
`;
}

const readJson = (p: string) => JSON.parse(readFileSync(p, "utf8"));

/** 書き出すファイル(テストも同じ一覧を使う) */
export const TARGETS: { out: string; render: () => string }[] = [
  { out: "src/data/mice.ts", render: () => renderMiceTs(readJson("docs/content/gear/mice.json")) },
  { out: "src/data/mice-ids.ts", render: () => renderMiceIdsTs(readJson("docs/content/gear/mice.json")) },
  { out: "src/data/pads.ts", render: () => renderPadsTs(readJson("docs/content/gear/pads.json")) },
  { out: "src/data/skates.ts", render: () => renderSkatesTs(readJson("docs/content/gear/skates.json")) },
];

function main() {
  for (const t of TARGETS) {
    writeFileSync(t.out, t.render());
    console.log(`書き出した: ${t.out}`);
  }
}

// node scripts/gear-data.ts で動かしたときだけ書き出す(テストが import したときは書かない)
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();

import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { posix } from "node:path";

/** 出典の文・メモ・センサー名まで入った機種のデータ。ブラウザの JS に入れない */
const HEAVY_RE = /\/data\/(mice|pads|skates|mice-rakuten)$/;

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) return sourceFiles(p);
    return /\.(ts|tsx)$/.test(f) ? [p] : [];
  });
}

/** コメント(ブロック・行頭の行コメント)を空にする。文字列の中の // は触らない */
function stripComments(text: string): string {
  return text.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
}

/** ファイルの最初の文が "use client" か(先頭のコメント・空白は読み飛ばす) */
export function isClientFile(text: string): boolean {
  return /^(?:\s|\/\/[^\n]*(?:\n|$)|\/\*[\s\S]*?\*\/)*["']use client["']/.test(text);
}

/** 値として読むもの(型だけの import・export type は除く)の指定。import / export … from / 副作用だけ / 動的 import() */
export function valueSpecifiers(source: string): string[] {
  const text = stripComments(source);
  const out: string[] = [];
  for (const m of text.matchAll(/\b(?:import|export)\s+(?!type\b)([^;'"]*?)\sfrom\s*["']([^"']+)["']/g)) {
    const clause = m[1].trim();
    // import { type A, type B } from … は値を読まない
    if (/^\{\s*(?:type\s+[\w$]+(?:\s+as\s+[\w$]+)?\s*,?\s*)+\}$/.test(clause)) continue;
    out.push(m[2]);
  }
  for (const m of text.matchAll(/\bimport\s*["']([^"']+)["']/g)) out.push(m[1]);
  for (const m of text.matchAll(/\bimport\(\s*["']([^"']+)["']\s*\)/g)) out.push(m[1]);
  return out;
}

/** 指定を src からのパス(拡張子なし)にする。@/ は src/、相対は読んでいるファイルから */
export function normalizeSpecifier(spec: string, fromFile: string): string {
  const base = spec.startsWith("@/") ? posix.join("src", spec.slice(2)) : spec.startsWith(".") ? posix.join(posix.dirname(fromFile), spec) : spec;
  return posix.normalize(base).replace(/\.(?:tsx?|jsx?|mjs)$/, "");
}

const isHeavy = (spec: string, fromFile: string) => HEAVY_RE.test(normalizeSpecifier(spec, fromFile));

/** files:{ "src/…": 中身 }。ブラウザに入りうるファイル("use client" と src/components)が、機種のデータを値で読む道(直接と src/lib を 1 段通す間接)を返す */
export function findViolations(files: Record<string, string>): string[] {
  const bad: string[] = [];
  const libFile = (norm: string): [string, string] | null => {
    for (const ext of [".ts", ".tsx", "/index.ts", "/index.tsx"]) if (files[norm + ext] !== undefined) return [norm + ext, files[norm + ext]];
    return null;
  };
  for (const [path, text] of Object.entries(files)) {
    if (!isClientFile(text) && !path.startsWith("src/components/")) continue;
    for (const spec of valueSpecifiers(text)) {
      if (isHeavy(spec, path)) {
        bad.push(`${path}: ${spec}`);
        continue;
      }
      const norm = normalizeSpecifier(spec, path);
      if (!norm.startsWith("src/lib/")) continue;
      const lib = libFile(norm);
      if (!lib) continue;
      for (const inner of valueSpecifiers(lib[1])) if (isHeavy(inner, lib[0])) bad.push(`${path} → ${lib[0]}: ${inner}`);
    }
  }
  return bad;
}

describe("ブラウザの JS に機種のデータを入れない", () => {
  it("\"use client\" のファイルと src/components は、機種のデータを値として(直接も src/lib 経由も)import しない(型だけはよい)", () => {
    const files: Record<string, string> = {};
    for (const file of sourceFiles("src")) files[file.split("\\").join("/")] = readFileSync(file, "utf8");
    expect(findViolations(files)).toEqual([]);
  });
});

describe("境界テスト自身の抜け道がない(わざと違反を書いた文字列で落ちる)", () => {
  const client = (body: string, head = '"use client";\n') => ({ "src/app/x/X.tsx": `${head}${body}` });
  const cases: [string, Record<string, string>][] = [
    ["@/ の値 import", client('import { MICE } from "@/data/mice";')],
    ["拡張子つき", client('import { MICE } from "@/data/mice.ts";')],
    ["相対パス", client('import { MICE } from "../../data/mice";')],
    ["複数行の import", client('import {\n  PADS,\n  PADS as P,\n} from "@/data/pads";')],
    ["デフォルト・名前空間 import", client('import * as S from "@/data/skates";')],
    ["export … from", client('export { MICE } from "@/data/mice";')],
    ["export * from", client('export * from "@/data/mice-rakuten";')],
    ["動的 import()", client('const m = await import("@/data/pads");')],
    ["副作用だけの import", client('import "@/data/skates";')],
    ["先頭にコメントのある use client", client('import { MICE } from "@/data/mice";', '// 注釈\n/* ブロック */\n"use client";\n')],
    ["src/components(use client なし)", { "src/components/gear/Y.tsx": 'import { PADS } from "@/data/pads";' }],
    ["src/lib を通す間接", { ...client('import { f } from "@/lib/indirect";'), "src/lib/indirect.ts": 'import { MICE } from "@/data/mice";\nexport const f = () => MICE;' }],
    ["相対の src/lib を通す間接", { ...client('import { f } from "../../lib/indirect";'), "src/lib/indirect.ts": 'export { PADS as f } from "../data/pads";' }],
  ];
  it.each(cases)("%s", (_name, files) => {
    expect(findViolations(files).length).toBeGreaterThan(0);
  });

  const ok: [string, Record<string, string>][] = [
    ["型だけ", client('import type { MouseSpec } from "@/data/mice";\nimport { type PadSpec } from "@/data/pads";\nexport type { SkateSpec } from "@/data/skates";')],
    ["コメントの中", client('// import { MICE } from "@/data/mice";\n/* import { PADS } from "@/data/pads"; */')],
    ["機種のデータではない data", client('import { DEVICES } from "@/data/devices";\nimport { MICE_IDS } from "@/data/mice-ids";')],
    ["サーバーのページ(use client でも components でもない)", { "src/app/mouse/page.tsx": 'import { MICE } from "@/data/mice";' }],
    ["値で読まない src/lib を通す", { ...client('import { f } from "@/lib/ok";'), "src/lib/ok.ts": 'import type { MouseSpec } from "@/data/mice";\nexport const f = (m: MouseSpec) => m;' }],
  ];
  it.each(ok)("違反にしない:%s", (_name, files) => {
    expect(findViolations(files)).toEqual([]);
  });
});

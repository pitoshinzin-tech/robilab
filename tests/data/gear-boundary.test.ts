import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

/** 出典の文・メモ・センサー名まで入った機種のデータ。ブラウザの JS に入れない */
const HEAVY = ["@/data/mice", "@/data/pads", "@/data/skates", "@/data/mice-rakuten"];

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) return sourceFiles(p);
    return /\.(ts|tsx)$/.test(f) ? [p] : [];
  });
}

describe("ブラウザの JS に機種のデータを入れない", () => {
  it("\"use client\" のファイルと src/components は、機種のデータを値として import しない(型だけはよい)", () => {
    const bad: string[] = [];
    for (const file of sourceFiles("src")) {
      const path = file.replace(/\\/g, "/");
      const text = readFileSync(file, "utf8");
      const isClient = /^\s*["']use client["']/.test(text);
      if (!isClient && !path.startsWith("src/components/")) continue;
      for (const m of text.matchAll(/^import\s+(?!type\s)[^;]*?from\s+["']([^"']+)["']/gm)) {
        if (HEAVY.includes(m[1])) bad.push(`${path}: ${m[1]}`);
      }
    }
    expect(bad).toEqual([]);
  });
});

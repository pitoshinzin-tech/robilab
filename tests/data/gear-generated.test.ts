import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { TARGETS } from "../../scripts/gear-data";

const norm = (s: string) => s.replace(/\r\n/g, "\n");

describe("生成した src/data の .ts が docs/content/gear の JSON と合っている(作り直し忘れがない)", () => {
  it.each(TARGETS.map((t) => [t.out, t] as const))("%s", (out, t) => {
    expect(norm(readFileSync(out, "utf8"))).toBe(t.render());
  });
});

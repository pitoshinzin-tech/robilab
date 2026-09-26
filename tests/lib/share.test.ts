import { describe, it, expect } from "vitest";
import { buildShareText, buildXShareUrl } from "@/lib/share";
import { getType } from "@/data/types";

describe("share", () => {
  const arch = getType("ARCH")!;
  it("includes type code, name and hashtag", () => {
    const text = buildShareText(arch, { name: "VALORANT", role: "デュエリスト" });
    expect(text).toContain("ARCH");
    expect(text).toContain(arch.name);
    expect(text).toContain("VALORANT");
    expect(text).toContain("#ロビラボ");
  });
  it("encodes Japanese, symbols and emoji safely", () => {
    const text = "わたしは「先陣ヒーロー・タイプ」🔥 #ロビラボ";
    const url = buildXShareUrl(text, "https://example.com/type/ARCH");
    expect(url.startsWith("https://x.com/intent/post?")).toBe(true);
    const params = new URL(url).searchParams;
    expect(params.get("text")).toBe(text);
    expect(params.get("url")).toBe("https://example.com/type/ARCH");
  });
});

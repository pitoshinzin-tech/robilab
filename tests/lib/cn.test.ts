import { describe, expect, it } from "vitest";
import { cn } from "@/lib/utils";

describe("cn(ロビラボの角丸・影のクラスを知っている)", () => {
  it("rounded-rl-md が rounded-rl-sm を上書きする", () => {
    expect(cn("rounded-rl-sm", "rounded-rl-md")).toBe("rounded-rl-md");
  });
  it("rounded-rl-pill が rounded-rl-md を上書きする", () => {
    expect(cn("rounded-rl-md", "rounded-rl-pill")).toBe("rounded-rl-pill");
  });
  it("shadow-rl-glow-1 が shadow-rl-float に上書きされる", () => {
    expect(cn("shadow-rl-glow-1", "shadow-rl-float")).toBe("shadow-rl-float");
  });
  it("別の種類のクラスは残る", () => {
    expect(cn("rounded-rl-sm text-rl-muted", "text-sm")).toBe("rounded-rl-sm text-rl-muted text-sm");
  });
});

describe("cn(追補の表示用の段・間・イージングを知っている)", () => {
  it("表示用の段と色は両方残る", () => {
    expect(cn("text-rl-highlight", "text-rl-display-1")).toBe("text-rl-highlight text-rl-display-1");
  });
  it("表示用の段はほかの文字の大きさを上書きする", () => {
    expect(cn("text-xl", "text-rl-display-1")).toBe("text-rl-display-1");
    expect(cn("text-rl-display-2", "text-rl-hero")).toBe("text-rl-hero");
  });
  it("32px の見出しの段(text-rl-title)も文字の大きさで、色は残る", () => {
    expect(cn("text-xl", "text-rl-title")).toBe("text-rl-title");
    expect(cn("text-rl-highlight", "text-rl-title")).toBe("text-rl-highlight text-rl-title");
  });
  it("間の 3 段は余白として上書きする", () => {
    expect(cn("mt-8", "mt-rl-ma-lg")).toBe("mt-rl-ma-lg");
    expect(cn("gap-4", "gap-rl-ma-sm")).toBe("gap-rl-ma-sm");
  });
});

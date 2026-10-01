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

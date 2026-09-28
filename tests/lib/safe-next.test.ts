import { describe, it, expect } from "vitest";
import { safeNext } from "@/lib/safe-next";

describe("safeNext", () => {
  it("keeps internal paths", () => {
    expect(safeNext("/lobby/inbox")).toBe("/lobby/inbox");
  });
  it("rejects external or protocol-relative URLs", () => {
    expect(safeNext("https://evil.example")).toBe("/lobby");
    expect(safeNext("//evil.example")).toBe("/lobby");
    expect(safeNext("/\\evil.example")).toBe("/lobby");
    expect(safeNext(null)).toBe("/lobby");
  });
});

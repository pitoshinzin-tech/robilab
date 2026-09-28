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
  it("rejects control characters used to smuggle a host past the leading slash check", () => {
    expect(safeNext("/\t/evil.com")).toBe("/lobby");
    expect(safeNext("/\n/evil.com")).toBe("/lobby");
    expect(safeNext("/\x00/evil.com")).toBe("/lobby");
    expect(safeNext("/\x7f/evil.com")).toBe("/lobby");
  });
});

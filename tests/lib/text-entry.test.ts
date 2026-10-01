import { describe, it, expect } from "vitest";
import { isTextEntry } from "@/lib/text-entry";

describe("isTextEntry(キーボードが開く欄か)", () => {
  it.each([
    [{ tagName: "INPUT" }], [{ tagName: "INPUT", type: null }], [{ tagName: "input", type: "text" }],
    [{ tagName: "INPUT", type: "number" }], [{ tagName: "INPUT", type: "search" }], [{ tagName: "INPUT", type: "date" }],
    [{ tagName: "TEXTAREA" }], [{ tagName: "DIV", isContentEditable: true }],
  ])("%o は true", (el) => {
    expect(isTextEntry(el)).toBe(true);
  });
  it.each([
    [null], [undefined], [{ tagName: "BODY" }], [{ tagName: "SELECT" }], [{ tagName: "BUTTON" }], [{ tagName: "A" }],
    [{ tagName: "INPUT", type: "checkbox" }], [{ tagName: "INPUT", type: "radio" }], [{ tagName: "INPUT", type: "range" }],
    [{ tagName: "INPUT", type: "color" }], [{ tagName: "INPUT", type: "submit" }], [{ tagName: "INPUT", type: "hidden" }],
  ])("%o は false", (el) => {
    expect(isTextEntry(el)).toBe(false);
  });
});

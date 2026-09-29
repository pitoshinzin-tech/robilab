import { describe, it, expect } from "vitest";
import { serverErrorMessage } from "@/components/my/useMySettings";

describe("serverErrorMessage", () => {
  it("explains NG words and falls back to a safe message", () => {
    expect(serverErrorMessage("NG_WORD")).toContain("使えない言葉");
    expect(serverErrorMessage("INVALID_INPUT")).toContain("入力内容");
    expect(serverErrorMessage(undefined)).toContain("この端末には保存されています");
  });
});

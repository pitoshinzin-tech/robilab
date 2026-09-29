import { describe, it, expect } from "vitest";
import { serverErrorMessage } from "@/components/my/useMySettings";

describe("serverErrorMessage", () => {
  it("explains NG words and falls back to a safe message", () => {
    expect(serverErrorMessage("NG_WORD")).toContain("使えない言葉");
    expect(serverErrorMessage("INVALID_INPUT")).toContain("入力内容");
    expect(serverErrorMessage(undefined)).toContain("この端末には保存されています");
  });

  it("asks to save first when publishing without a saved row", () => {
    expect(serverErrorMessage("NOT_FOUND")).toContain("先に設定を保存してから公開してください");
  });

  it("explains moderation blocks", () => {
    expect(serverErrorMessage("NOT_ACTIVE")).toContain("利用停止中");
    expect(serverErrorMessage("BANNED")).toContain("ご利用いただけません");
    expect(serverErrorMessage("CARD_LOCKED")).toContain("公開できません");
  });
});

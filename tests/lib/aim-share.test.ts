import { describe, it, expect } from "vitest";
import { buildAimShareText, aimErrorMessage } from "@/lib/aim/share";

describe("buildAimShareText", () => {
  it("formats score, accuracy and seconds", () => {
    expect(buildAimShareText("炎", 8420, 91.2, 12345)).toBe("今日の文字【炎】 8,420 点(正確さ 91%・12.3 秒) #ロビラボ #今日の文字");
  });
});

describe("aimErrorMessage", () => {
  it("explains date change, rapid resubmits and moderation", () => {
    expect(aimErrorMessage("WRONG_DATE")).toContain("日付が変わった");
    expect(aimErrorMessage("TOO_FAST")).toContain("少し待って");
    expect(aimErrorMessage("NOT_ACTIVE")).toContain("利用停止中");
    expect(aimErrorMessage(undefined)).toContain("送れませんでした");
  });
});

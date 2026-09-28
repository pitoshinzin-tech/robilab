import { describe, it, expect } from "vitest";
import { lobbyErrorMessage } from "@/lib/lobby-errors";

describe("lobbyErrorMessage", () => {
  it("maps known codes to Japanese", () => {
    expect(lobbyErrorMessage("UNDER_AGE")).toMatch(/18歳/);
    expect(lobbyErrorMessage("DAILY_LIMIT")).toMatch(/明日/);
    expect(lobbyErrorMessage("NG_WORD")).toMatch(/使えない言葉/);
    expect(lobbyErrorMessage("REPORT_LIMIT")).toMatch(/明日/);
  });
  it("has a safe fallback", () => {
    expect(lobbyErrorMessage(undefined)).toMatch(/もう一度/);
    expect(lobbyErrorMessage("SOMETHING_NEW")).toMatch(/もう一度/);
  });
});

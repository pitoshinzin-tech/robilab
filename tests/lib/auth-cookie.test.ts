import { describe, it, expect } from "vitest";
import { mayHaveSupabaseSession } from "@/lib/auth-cookie";

describe("mayHaveSupabaseSession(Supabase のログインの cookie があるか)", () => {
  it("sb-<ref>-auth-token(分割の .0 も)があれば true", () => {
    expect(mayHaveSupabaseSession("sb-abcdefgh-auth-token=base64-xxx")).toBe(true);
    expect(mayHaveSupabaseSession("theme=dark; sb-abcdefgh-auth-token.0=base64-xxx; sb-abcdefgh-auth-token.1=yyy")).toBe(true);
    expect(mayHaveSupabaseSession("a=1;sb-x-auth-token=1")).toBe(true);
  });
  it("なければ false(読み込みを待たずに入力画面へ)", () => {
    expect(mayHaveSupabaseSession("")).toBe(false);
    expect(mayHaveSupabaseSession("theme=dark; _ga=GA1.1")).toBe(false);
    expect(mayHaveSupabaseSession("xsb-abc-auth-token=1")).toBe(false);
    expect(mayHaveSupabaseSession("note=sb-abc-auth-token")).toBe(false);
  });
});

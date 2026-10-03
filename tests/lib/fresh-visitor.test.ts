import { describe, it, expect } from "vitest";
import { FRESH_VISITOR_CLASS, freshVisitorScript } from "@/lib/fresh-visitor";
import { MY_SETTINGS_KEY } from "@/lib/my-settings-store";

/** 小さな document / localStorage で、ハイドレーションの前に動く 1 行の script を走らせる */
function run(stored: string | null, cookie: string, throws = false): string[] {
  const classes: string[] = [];
  const document = { cookie, documentElement: { classList: { add: (c: string) => classes.push(c) } } };
  const localStorage = { getItem: (k: string) => { if (throws) throw new Error("blocked"); return k === MY_SETTINGS_KEY ? stored : null; } };
  new Function("document", "localStorage", freshVisitorScript())(document, localStorage);
  return classes;
}

describe("freshVisitorScript(初めての人だけ、読み込み中から入力画面を見せる印)", () => {
  it("マイ設定の保存もログインの cookie もなければ印を付ける", () => {
    expect(run(null, "")).toEqual([FRESH_VISITOR_CLASS]);
    expect(run(null, "theme=dark")).toEqual([FRESH_VISITOR_CLASS]);
  });
  it("保存があれば付けない(結果の画面に替わるので、今までどおり Skeleton)", () => {
    expect(run("{}", "")).toEqual([]);
  });
  it("ログインの cookie があれば付けない(サーバーの設定を確かめる間は今までどおり)", () => {
    expect(run(null, "sb-abc-auth-token=x")).toEqual([]);
    expect(run(null, "a=1; sb-abc-auth-token.0=x")).toEqual([]);
  });
  it("保存が読めない環境では何もしない(落ちない)", () => {
    expect(run(null, "", true)).toEqual([]);
  });
});

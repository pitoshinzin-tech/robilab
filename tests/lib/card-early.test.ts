import { describe, it, expect, vi, beforeEach } from "vitest";

describe("card-early(名刺の画像を先に頼む)", () => {
  beforeEach(() => vi.resetModules());
  it("同じ本文なら先に頼んだ画像を 1 回だけ渡す", async () => {
    const { startEarlyCardImage, takeEarlyCardImage } = await import("@/lib/card-early");
    const blob = new Blob(["png"]);
    const fetcher = vi.fn(async () => new Response(blob, { status: 200 }));
    startEarlyCardImage('{"a":1}', fetcher as unknown as typeof fetch);
    startEarlyCardImage('{"a":2}', fetcher as unknown as typeof fetch); // 2 回目は頼まない
    expect(fetcher).toHaveBeenCalledTimes(1);
    const p = takeEarlyCardImage('{"a":1}');
    expect(p).not.toBeNull();
    expect(await (await p)?.text()).toBe("png");
    expect(takeEarlyCardImage('{"a":1}')).toBeNull();
  });
  it("本文が違えば渡さず捨てる", async () => {
    const { startEarlyCardImage, takeEarlyCardImage } = await import("@/lib/card-early");
    startEarlyCardImage('{"a":1}', (async () => new Response("x")) as unknown as typeof fetch);
    expect(takeEarlyCardImage('{"a":9}')).toBeNull();
    expect(takeEarlyCardImage('{"a":1}')).toBeNull();
  });
  it("失敗・エラーの応答は null(今までどおり頼み直す)", async () => {
    const { startEarlyCardImage, takeEarlyCardImage } = await import("@/lib/card-early");
    startEarlyCardImage("b", (async () => new Response("no", { status: 500 })) as unknown as typeof fetch);
    expect(await takeEarlyCardImage("b")).toBeNull();
    const m2 = await import("@/lib/card-early");
    vi.resetModules();
    const m3 = await import("@/lib/card-early");
    m3.startEarlyCardImage("c", (async () => { throw new Error("offline"); }) as unknown as typeof fetch);
    expect(await m3.takeEarlyCardImage("c")).toBeNull();
    void m2;
  });
});

describe("cardEarlyScript(/my の HTML で先に頼む 1 行)", () => {
  async function runScript(stored: string | null) {
    const { cardEarlyScript, CARD_EARLY_GLOBAL } = await import("@/lib/card-early");
    const calls: { url: string; body: string }[] = [];
    const window: Record<string, unknown> = {};
    const localStorage = { getItem: () => stored };
    const fetchFn = async (url: string, init: { body: string }) => { calls.push({ url, body: init.body }); return new Response("png"); };
    new Function("window", "localStorage", "fetch", cardEarlyScript())(window, localStorage, fetchFn);
    return { calls, early: window[CARD_EARLY_GLOBAL] as { body: string } | undefined };
  }
  it("保存がなければ、空のマイ設定と同じ本文で頼む", async () => {
    const { toPublicCardData } = await import("@/lib/card-view");
    const { emptyMySettings } = await import("@/lib/my-settings");
    const { calls, early } = await runScript(null);
    expect(calls).toHaveLength(1);
    expect(calls[0].url).toBe("/api/card-image");
    expect(calls[0].body).toBe(JSON.stringify(toPublicCardData(emptyMySettings())));
    expect(early?.body).toBe(calls[0].body);
  });
  it("保存があれば、CardPreview と同じ本文(toPublicCardData(parseMySettings(保存)))", async () => {
    const { toPublicCardData } = await import("@/lib/card-view");
    const { parseMySettings, emptyMySettings } = await import("@/lib/my-settings");
    const saved = { ...emptyMySettings(), typeCode: "ARCH", dpi: 800, mainGame: "valorant", sens: { valorant: 0.35 }, hand: { lengthCm: 18, widthCm: null, grip: "claw" },
      devices: { mouse: { id: "logicool-g-pro-x-superlight-2" }, pad: { name: "自作のパッド" }, keyboard: null, headset: null }, favoriteGames: [{ id: "valorant" }, { name: "ストリートファイター6" }], cardName: "ろびお" };
    const raw = JSON.stringify(saved);
    const parsed = parseMySettings(JSON.parse(raw));
    expect(parsed).not.toBeNull();
    const { calls } = await runScript(raw);
    expect(calls[0].body).toBe(JSON.stringify(toPublicCardData(parsed!)));
  });
  it("壊れた保存でも落ちない", async () => {
    const { calls } = await runScript("{not json");
    expect(calls).toHaveLength(1);
  });
});

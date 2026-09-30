import { afterEach, describe, expect, it, vi } from "vitest";
import { extractFontUrl, isAllowedFontUrl, loadOgFont, OG_FONT_CSS_MAX_BYTES, OG_FONT_MAX_BYTES, readFontCapped } from "@/lib/og-font";

// Google Fonts の css2 が返す形(User-Agent なしのサーバーからの取得では truetype)
const CSS = `/* japanese */
@font-face {
  font-family: 'Zen Kaku Gothic New';
  font-style: normal;
  font-weight: 700;
  src: url(https://fonts.gstatic.com/l/font?kit=abc123&skey=def&v=v16) format('truetype');
}`;

describe("extractFontUrl", () => {
  it("picks the font file URL from Google Fonts CSS", () => {
    expect(extractFontUrl(CSS)).toBe("https://fonts.gstatic.com/l/font?kit=abc123&skey=def&v=v16");
  });

  it("returns null for woff2-only or unexpected CSS", () => {
    expect(extractFontUrl("src: url(https://example.com/a.woff2) format('woff2');")).toBeNull();
    expect(extractFontUrl("")).toBeNull();
  });
});

describe("isAllowedFontUrl", () => {
  it("allows only https://fonts.gstatic.com/", () => {
    expect(isAllowedFontUrl("https://fonts.gstatic.com/l/font?kit=abc")).toBe(true);
    expect(isAllowedFontUrl("http://fonts.gstatic.com/l/font?kit=abc")).toBe(false);
    expect(isAllowedFontUrl("https://fonts.gstatic.com.evil.example/a.ttf")).toBe(false);
    expect(isAllowedFontUrl("https://evil.example/fonts.gstatic.com/a.ttf")).toBe(false);
    expect(isAllowedFontUrl("https://user@fonts.gstatic.com/a.ttf")).toBe(false);
    expect(isAllowedFontUrl("https://fonts.gstatic.com:8443/a.ttf")).toBe(false);
    expect(isAllowedFontUrl("http://169.254.169.254/latest")).toBe(false);
    expect(isAllowedFontUrl("not a url")).toBe(false);
  });
});

function streamResponse(parts: Uint8Array[], headers: Record<string, string> = {}): Response {
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      for (const p of parts) controller.enqueue(p);
      controller.close();
    },
  });
  return new Response(stream, { headers });
}

describe("readFontCapped", () => {
  it("reads a body within the limit", async () => {
    const buf = await readFontCapped(streamResponse([new Uint8Array([1, 2]), new Uint8Array([3])]), 10);
    expect(buf && [...new Uint8Array(buf)]).toEqual([1, 2, 3]);
  });

  it("rejects when Content-Length is over the limit", async () => {
    expect(await readFontCapped(streamResponse([new Uint8Array(1)], { "content-length": String(OG_FONT_MAX_BYTES + 1) }))).toBeNull();
  });

  it("rejects when the received bytes exceed the limit without Content-Length", async () => {
    expect(await readFontCapped(streamResponse([new Uint8Array(6), new Uint8Array(6)]), 10)).toBeNull();
  });

  it("rejects non-OK responses", async () => {
    expect(await readFontCapped(new Response("nope", { status: 404 }))).toBeNull();
  });
});

describe("loadOgFont", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("does not fetch a font file outside fonts.gstatic.com", async () => {
    const fetchMock = vi.fn(async () => new Response("src: url(https://evil.example/a.ttf) format('truetype');"));
    vi.stubGlobal("fetch", fetchMock);
    expect(await loadOgFont("あ")).toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("returns the font from fonts.gstatic.com", async () => {
    const fetchMock = vi.fn(async (input: string | URL | Request) =>
      String(input).startsWith("https://fonts.googleapis.com/") ? new Response(CSS) : new Response(new Uint8Array([7, 8, 9])),
    );
    vi.stubGlobal("fetch", fetchMock);
    const font = await loadOgFont("あ");
    expect(font && [...new Uint8Array(font)]).toEqual([7, 8, 9]);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("fetches the font file with redirect: \"error\" so no redirect target is contacted", async () => {
    const fetchMock = vi.fn<(input: string | URL | Request, init?: RequestInit) => Promise<Response>>(async (input) =>
      String(input).startsWith("https://fonts.googleapis.com/") ? new Response(CSS) : new Response(new Uint8Array([1])),
    );
    vi.stubGlobal("fetch", fetchMock);
    await loadOgFont("あ");
    expect(fetchMock.mock.calls[1][1]?.redirect).toBe("error");
  });

  it("returns null when the font fetch fails because of a redirect", async () => {
    const fetchMock = vi.fn(async (input: string | URL | Request) => {
      if (String(input).startsWith("https://fonts.googleapis.com/")) return new Response(CSS);
      throw new TypeError("fetch failed: unexpected redirect");
    });
    vi.stubGlobal("fetch", fetchMock);
    expect(await loadOgFont("あ")).toBeNull();
  });

  it("does not fetch the font when the CSS response is too large", async () => {
    const big = CSS + " ".repeat(OG_FONT_CSS_MAX_BYTES);
    const fetchMock = vi.fn(async () => new Response(big));
    vi.stubGlobal("fetch", fetchMock);
    expect(await loadOgFont("あ")).toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("falls back to null when the font is too large", async () => {
    const fetchMock = vi.fn(async (input: string | URL | Request) =>
      String(input).startsWith("https://fonts.googleapis.com/")
        ? new Response(CSS)
        : new Response("x", { headers: { "content-length": String(OG_FONT_MAX_BYTES + 1) } }),
    );
    vi.stubGlobal("fetch", fetchMock);
    expect(await loadOgFont("あ")).toBeNull();
  });
});

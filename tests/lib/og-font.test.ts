import { describe, expect, it } from "vitest";
import { extractFontUrl } from "@/lib/og-font";

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

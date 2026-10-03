import { describe, it, expect } from "vitest";
import nextConfig from "../../next.config";

type Rule = { source: string; headers: { key: string; value: string }[] };
const rules = async () => (await nextConfig.headers!()) as Rule[];
const header = (rule: Rule, key: string) => rule.headers.find((h) => h.key.toLowerCase() === key.toLowerCase())?.value;
const directive = (csp: string, name: string) => csp.split(";").map((d) => d.trim()).find((d) => d.startsWith(`${name} `));

describe("全体の CSP(設計書 3-3)", () => {
  it("worker-src と manifest-src は 'self' だけ(blob: data: を許さない)", async () => {
    const all = (await rules()).find((r) => r.source === "/(.*)")!;
    const csp = header(all, "Content-Security-Policy")!;
    expect(directive(csp, "worker-src")).toBe("worker-src 'self'");
    expect(directive(csp, "manifest-src")).toBe("manifest-src 'self'");
  });
});

describe("/sw.js の見出し", () => {
  it("全体のルールより後ろにあり(同じキーは後ろが勝つ)、3 つの見出しを持つ", async () => {
    const list = await rules();
    const allIndex = list.findIndex((r) => r.source === "/(.*)");
    const swIndex = list.findIndex((r) => r.source === "/sw.js");
    expect(swIndex).toBeGreaterThan(allIndex);
    const sw = list[swIndex];
    expect(header(sw, "Cache-Control")).toBe("no-cache, no-store, must-revalidate");
    expect(header(sw, "Content-Security-Policy")).toBe("default-src 'self'; script-src 'self'");
    expect(header(sw, "Content-Type")).toBe("application/javascript; charset=utf-8");
    expect(header(sw, "Service-Worker-Allowed")).toBeUndefined();
  });
});

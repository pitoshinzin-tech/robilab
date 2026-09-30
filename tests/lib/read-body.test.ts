import { describe, expect, it } from "vitest";
import { readBodyCapped } from "@/lib/read-body";

function streamRequest(parts: Uint8Array[]): Request {
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      for (const p of parts) controller.enqueue(p);
      controller.close();
    },
  });
  // Content-Length なし(chunked)で送られた本文を再現する
  return new Request("http://localhost/api/card-image", { method: "POST", body: stream, duplex: "half" } as RequestInit);
}

describe("readBodyCapped", () => {
  it("reads a body within the limit", async () => {
    const req = new Request("http://localhost/x", { method: "POST", body: "こんにちは" });
    expect(await readBodyCapped(req, 100)).toBe("こんにちは");
  });

  it("accepts exactly the limit and rejects one byte over", async () => {
    expect(await readBodyCapped(new Request("http://localhost/x", { method: "POST", body: "a".repeat(10) }), 10)).toBe("a".repeat(10));
    expect(await readBodyCapped(new Request("http://localhost/x", { method: "POST", body: "a".repeat(11) }), 10)).toBeNull();
  });

  it("stops reading a chunked body without Content-Length once over the limit", async () => {
    const chunk = new Uint8Array(4096).fill(97);
    const req = streamRequest([chunk, chunk, chunk]);
    expect(req.headers.get("content-length")).toBeNull();
    expect(await readBodyCapped(req, 8192)).toBeNull();
  });

  it("joins multi-chunk bodies, including split multibyte characters", async () => {
    const bytes = new TextEncoder().encode("あいう");
    const req = streamRequest([bytes.slice(0, 2), bytes.slice(2, 7), bytes.slice(7)]);
    expect(await readBodyCapped(req, 100)).toBe("あいう");
  });

  it("returns an empty string for a request without a body", async () => {
    expect(await readBodyCapped(new Request("http://localhost/x", { method: "POST" }), 10)).toBe("");
  });
});

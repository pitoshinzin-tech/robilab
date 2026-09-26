import { describe, it, expect, vi, afterEach } from "vitest";
import { recordDiagnosis } from "@/lib/analytics";

const axes = { attack: 0.3, instinct: 0.3, team: 0.3, heat: 0.3 };

afterEach(() => vi.unstubAllEnvs());

describe("recordDiagnosis", () => {
  it("does nothing without env vars", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    const fetchMock = vi.fn();
    await recordDiagnosis("ARCH", axes, fetchMock as unknown as typeof fetch);
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it("posts to the diagnosis_results table", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://x.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon");
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 201 }));
    await recordDiagnosis("ARCH", axes, fetchMock as unknown as typeof fetch);
    expect(fetchMock).toHaveBeenCalledWith(
      "https://x.supabase.co/rest/v1/diagnosis_results",
      expect.objectContaining({ method: "POST" }),
    );
  });
  it("never throws on network errors", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://x.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon");
    const fetchMock = vi.fn().mockRejectedValue(new Error("offline"));
    await expect(recordDiagnosis("ARCH", axes, fetchMock as unknown as typeof fetch)).resolves.toBeUndefined();
  });
});

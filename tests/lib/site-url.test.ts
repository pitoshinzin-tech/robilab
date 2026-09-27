import { describe, it, expect, afterEach, vi } from "vitest";
import { getSiteUrl } from "@/lib/site-url";

describe("getSiteUrl", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("prefers NEXT_PUBLIC_SITE_URL when set", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://robilab.example.com/");
    vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", "prod.vercel.app");
    vi.stubEnv("VERCEL_BRANCH_URL", "branch.vercel.app");
    vi.stubEnv("VERCEL_URL", "preview.vercel.app");
    expect(getSiteUrl()).toBe("https://robilab.example.com");
  });

  it("falls back to VERCEL_PROJECT_PRODUCTION_URL", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");
    vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", "prod.vercel.app");
    vi.stubEnv("VERCEL_BRANCH_URL", "branch.vercel.app");
    vi.stubEnv("VERCEL_URL", "preview.vercel.app");
    expect(getSiteUrl()).toBe("https://prod.vercel.app");
  });

  it("falls back to VERCEL_BRANCH_URL", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");
    vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", "");
    vi.stubEnv("VERCEL_BRANCH_URL", "branch.vercel.app");
    vi.stubEnv("VERCEL_URL", "preview.vercel.app");
    expect(getSiteUrl()).toBe("https://branch.vercel.app");
  });

  it("falls back to VERCEL_URL", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");
    vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", "");
    vi.stubEnv("VERCEL_BRANCH_URL", "");
    vi.stubEnv("VERCEL_URL", "preview.vercel.app");
    expect(getSiteUrl()).toBe("https://preview.vercel.app");
  });

  it("falls back to localhost when nothing is set", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");
    vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", "");
    vi.stubEnv("VERCEL_BRANCH_URL", "");
    vi.stubEnv("VERCEL_URL", "");
    expect(getSiteUrl()).toBe("http://localhost:3000");
  });

  it("strips a trailing slash", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://robilab.example.com/");
    expect(getSiteUrl()).toBe("https://robilab.example.com");
  });
});

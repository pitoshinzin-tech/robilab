import { describe, expect, it } from "vitest";
import { discordProfileUrl } from "@/lib/discord-link";

describe("discordProfileUrl", () => {
  it("builds a profile URL from a numeric snowflake", () => {
    expect(discordProfileUrl("80351110224678912")).toBe("https://discord.com/users/80351110224678912");
  });

  it("rejects missing or non-numeric ids", () => {
    expect(discordProfileUrl(null)).toBeNull();
    expect(discordProfileUrl("")).toBeNull();
    expect(discordProfileUrl("d-abc")).toBeNull();
    expect(discordProfileUrl("123/../evil")).toBeNull();
    expect(discordProfileUrl("1234")).toBeNull();
  });
});

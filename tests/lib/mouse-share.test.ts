import { describe, it, expect } from "vitest";
import { buildMouseShareText } from "@/lib/mouse-share";

describe("buildMouseShareText", () => {
  it("lists up to three mice with brand and name, and hashtags", () => {
    const text = buildMouseShareText([
      { brand: "Logicool G", name: "PRO X SUPERLIGHT 2" },
      { brand: "Razer", name: "Viper V3 Pro" },
      { brand: "ZOWIE", name: "EC2-CW" },
      { brand: "Pulsar", name: "X2 V2" },
    ]);
    expect(text).toBe("私に合うマウス TOP3\n1. Logicool G PRO X SUPERLIGHT 2\n2. Razer Viper V3 Pro\n3. ZOWIE EC2-CW\n#ロビラボ #マウス探し");
  });
  it("never contains hand sizes (the function takes only product names)", () => {
    const text = buildMouseShareText([{ brand: "Razer", name: "Viper Mini" }]);
    expect(text).not.toMatch(/cm|手の/);
  });
});

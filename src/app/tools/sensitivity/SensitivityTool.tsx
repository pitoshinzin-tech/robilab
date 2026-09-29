"use client";
import { useIsClient } from "@/lib/use-is-client";
import { browserStorage, loadLocal, sensDefaults } from "@/lib/my-settings-store";
import { SensitivityClient } from "./SensitivityClient";

/** ブラウザで描画し始めたら、マイ設定の値で入れ直す(key を変えて作り直す)。 */
export function SensitivityTool() {
  const isClient = useIsClient();
  const initial = isClient ? sensDefaults(loadLocal(browserStorage())) : null;
  return <SensitivityClient key={isClient ? "client" : "server"} initial={initial} />;
}

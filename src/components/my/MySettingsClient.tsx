"use client";
import { useIsClient } from "@/lib/use-is-client";
import { MySettingsEditor } from "./MySettingsEditor";

/** localStorage はブラウザでしか読めないので、ハイドレーションが終わってからエディターを出す。 */
export function MySettingsClient() {
  const isClient = useIsClient();
  if (!isClient) return <div className="h-96 animate-pulse rounded-xl bg-white/5" />;
  return <MySettingsEditor />;
}

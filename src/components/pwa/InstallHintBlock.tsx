import { hintLead, type HintPlace, type StepsPlatform } from "@/lib/pwa/install-hint";
import { InstallHint } from "./InstallHint";
import { AndroidSteps, DesktopSteps, IosSteps, OtherBrowserNote } from "./InstallSteps";

const PLATFORMS = ["ios", "android", "desktop", "other"] as const satisfies readonly StepsPlatform[];

/**
 * 1 行目と手順の文をサーバーで描いて、client の InstallHint に渡す(文をブラウザの JS に入れない)。
 * 端末はブラウザでしか分からないので 4 通りとも渡し、InstallHint がハイドレーションのあとに 1 つだけ出す(サーバーでは何も描かないのでずれない)
 */
export function InstallHintBlock({ place, today, className }: { place: HintPlace; today?: string; className?: string }) {
  return (
    <InstallHint
      place={place}
      today={today}
      className={className}
      lead={Object.fromEntries(PLATFORMS.map((p) => [p, hintLead(place, p)])) as Record<StepsPlatform, string>}
      steps={{ ios: <IosSteps />, android: <AndroidSteps />, desktop: <DesktopSteps />, other: <OtherBrowserNote /> }}
    />
  );
}

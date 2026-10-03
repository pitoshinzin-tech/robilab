import type { HintPlace } from "@/lib/pwa/install-hint";
import { InstallHint } from "./InstallHint";
import { AndroidSteps, DesktopSteps, IosSteps, OtherBrowserNote } from "./InstallSteps";

/** 手順の文をサーバーで描いて、client の InstallHint に渡す(文をブラウザの JS に入れない) */
export function InstallHintBlock({ place, today, className }: { place: HintPlace; today?: string; className?: string }) {
  return (
    <InstallHint
      place={place}
      today={today}
      className={className}
      steps={{ ios: <IosSteps />, android: <AndroidSteps />, desktop: <DesktopSteps />, other: <OtherBrowserNote /> }}
    />
  );
}

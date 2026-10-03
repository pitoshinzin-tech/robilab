import { BOLT_12, CROSSHAIR_12, CROSS_12, EYE_12, FLAG_12, SHIELD_12, type PixelGrid } from "@/lib/pixel-art";

/** ロール → 記号(キャラ図鑑)。スト6(公式のロールなし)と型を決めていないキャラは「目」 */
const BY_ROLE = new Map<string, PixelGrid>([
  ["overwatch/tank", SHIELD_12], ["overwatch/damage", CROSSHAIR_12], ["overwatch/support", CROSS_12],
  ["valorant/duelist", CROSSHAIR_12], ["valorant/initiator", EYE_12], ["valorant/controller", FLAG_12], ["valorant/sentinel", SHIELD_12],
  ["apex/assault", CROSSHAIR_12], ["apex/skirmisher", BOLT_12], ["apex/recon", EYE_12], ["apex/controller", FLAG_12], ["apex/support", CROSS_12],
  ["dbd/killer-chase", BOLT_12], ["dbd/killer-stealth", EYE_12], ["dbd/killer-setup", FLAG_12],
  ["dbd/survivor-chase", BOLT_12], ["dbd/survivor-support", CROSS_12], ["dbd/survivor-stealth", EYE_12],
]);

export function roleSymbol(gameId: string, roleId: string | null): PixelGrid {
  return (roleId !== null && BY_ROLE.get(`${gameId}/${roleId}`)) || EYE_12;
}

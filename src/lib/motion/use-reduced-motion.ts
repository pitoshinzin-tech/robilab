import { useSyncExternalStore } from "react";

/** 追補:OS の「動きを減らす」を読む。サーバーとハイドレーション中は false(CSS 側の @media がすでに効いている)。 */
export const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";
type MatchMedia = (query: string) => { matches: boolean };

export function readReducedMotion(mm: MatchMedia | undefined): boolean {
  return mm ? mm(REDUCED_MOTION_QUERY).matches : false;
}

export const reducedMotionServerSnapshot = (): false => false;

function subscribe(onChange: () => void) {
  const mql = window.matchMedia(REDUCED_MOTION_QUERY);
  mql.addEventListener("change", onChange);
  return () => mql.removeEventListener("change", onChange);
}

export function useReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, () => readReducedMotion(window.matchMedia?.bind(window)), reducedMotionServerSnapshot);
}

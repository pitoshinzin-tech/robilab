/** 下のタブバーと上のヘッダーで共通のナビ。今いる場所は pathname だけから決める(サーバーとブラウザで同じ答えにする)。 */
export type NavTabId = "aim" | "diagnosis" | "mouse" | "lobby" | "my";
export type NavTab = { id: NavTabId; href: string; label: string; match: readonly string[] };

export const NAV_TABS: readonly NavTab[] = [
  { id: "aim", href: "/aim", label: "今日の文字", match: ["/aim"] },
  { id: "diagnosis", href: "/diagnosis", label: "診断", match: ["/diagnosis", "/type", "/types"] },
  { id: "mouse", href: "/mouse", label: "マウス", match: ["/mouse", "/pads", "/skates", "/tools/sensitivity", "/pros"] },
  { id: "lobby", href: "/lobby", label: "仲間", match: ["/lobby"] },
  { id: "my", href: "/my", label: "マイ設定", match: ["/my"] },
];

export function normalizePath(path: string | null | undefined): string {
  if (!path) return "";
  const bare = path.split(/[?#]/)[0];
  const trimmed = bare.replace(/\/+$/, "");
  return trimmed === "" ? "/" : trimmed;
}

export function matchesPath(pathname: string, base: string): boolean {
  const p = normalizePath(pathname);
  return p === base || p.startsWith(`${base}/`);
}

export function activeTabId(pathname: string | null | undefined): NavTabId | null {
  const p = normalizePath(pathname);
  if (p === "" || p === "/") return null;
  return NAV_TABS.find((t) => t.match.some((m) => matchesPath(p, m)))?.id ?? null;
}

export type SubnavItem = { href: string; label: string };
export type SubnavGroup = "mouse" | "diagnosis";

const SUBNAV: Record<SubnavGroup, readonly SubnavItem[]> = {
  mouse: [
    { href: "/mouse", label: "マウス探し" },
    { href: "/pads", label: "マウスパッド" },
    { href: "/skates", label: "ソール" },
    { href: "/tools/sensitivity", label: "感度計算" },
    { href: "/pros", label: "プロ設定" },
  ],
  diagnosis: [
    { href: "/diagnosis", label: "診断" },
    { href: "/types", label: "タイプ一覧" },
  ],
};

export function subnavFor(group: SubnavGroup, prosReady: boolean): SubnavItem[] {
  return SUBNAV[group].filter((i) => prosReady || i.href !== "/pros");
}

export function activeSubnavHref(pathname: string | null | undefined, items: readonly SubnavItem[]): string | null {
  const p = normalizePath(pathname);
  return items.find((i) => i.href === p)?.href ?? null;
}

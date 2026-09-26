import type { GamerType } from "@/data/types";

export function buildShareText(type: GamerType, topGame?: { name: string; role: string }): string {
  const lines = [`わたしのゲーマータイプは【${type.code}】${type.name}!`, `「${type.catchcopy}」`];
  if (topGame) lines.push(`いちばん相性がいいのは ${topGame.name} の${topGame.role}`);
  lines.push("#ロビラボ #ゲーマータイプ診断");
  return lines.join("\n");
}

export function buildXShareUrl(text: string, pageUrl: string): string {
  const params = new URLSearchParams({ text, url: pageUrl });
  return `https://x.com/intent/post?${params.toString()}`;
}

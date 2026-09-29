/**
 * マウスの大きさ・重さ(メーカー公式の製品ページの数字。価格は載せない)。
 * id は src/data/devices.ts と同じ。メーカー名・製品名は devices.ts を使う。
 * 増やすときは devices.ts とこのファイルの両方に足す(tests/data/mice.test.ts が確かめる)。
 */
export type MouseSpec = {
  id: string;
  lengthMm: number;
  /** いちばん広いところ */
  widthMm: number;
  heightMm: number;
  /** 標準の構成(公式の表記どおり) */
  weightG: number;
  shape: "symmetric" | "right";
  connection: "wired" | "wireless";
  /** 数字の出典(メーカー公式の製品ページ) */
  officialUrl: string;
  /** 確認した日(YYYY-MM-DD) */
  checkedAt: string;
};

export const MICE: MouseSpec[] = [];

export function mouseById(id: string): MouseSpec | undefined {
  return MICE.find((m) => m.id === id);
}

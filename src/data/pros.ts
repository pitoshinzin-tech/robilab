/**
 * プロ選手の感度設定(選手本人・所属チームの公開情報だけ。まとめサイトは出典にしない)。
 * 名前は公に使っている活動名だけ。掲載を外す依頼が来たら、その行を消す(docs/ops/moderation.md)。
 * 移籍や感度の変更は、数字と checkedAt を直す。tests/data/pros.test.ts が形を確かめる。
 */
export type ProGameId = "valorant" | "apex" | "overwatch" | "cs2";
export const PRO_GAMES: ProGameId[] = ["valorant", "apex", "overwatch", "cs2"];

export type ProSetting = {
  /** 例 "valorant-xxx"(ゲーム名で始める) */
  id: string;
  /** 公に使っている活動名 */
  name: string;
  /** 確認日時点の所属 */
  team: string | null;
  game: ProGameId;
  dpi: number;
  /** ゲーム内感度 */
  sens: number;
  /** src/data/devices.ts の id。候補にないマウスは null にして mouseName に名前 */
  mouse: string | null;
  mouseName?: string;
  /** 一次情報(選手本人の X・配信・動画、所属チームの公式ページ) */
  sourceUrl: string;
  /** 確認した日(YYYY-MM-DD) */
  checkedAt: string;
};

export const PROS: ProSetting[] = [];

/** 一覧を公開してよいか(データが入るまでページ・ヘッダーのリンクを隠す) */
export const PROS_READY = PROS.length > 0;

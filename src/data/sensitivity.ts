export type SensGame = {
  id: string;
  name: string;
  yaw: number;
  min: number;
  max: number;
  decimals: number;
  note?: string;
};

export const SENS_GAMES: SensGame[] = [
  { id: "valorant", name: "VALORANT", yaw: 0.07, min: 0.001, max: 10, decimals: 3 },
  { id: "overwatch", name: "オーバーウォッチ", yaw: 0.0066, min: 0.01, max: 100, decimals: 2 },
  { id: "apex", name: "Apex Legends", yaw: 0.022, min: 0.01, max: 20, decimals: 2 },
  { id: "cs2", name: "Counter-Strike 2", yaw: 0.022, min: 0.001, max: 20, decimals: 3 },
  { id: "cod", name: "Call of Duty", yaw: 0.0066, min: 0.01, max: 100, decimals: 2 },
  {
    id: "fortnite",
    name: "Fortnite",
    yaw: 0.005555,
    min: 0.1,
    max: 100,
    decimals: 1,
    note: "ゲーム内の X 感度(%表記の数字。例:6.4)を入力してください。",
  },
  {
    id: "r6",
    name: "レインボーシックス シージ",
    yaw: 0.00572958,
    min: 1,
    max: 100,
    decimals: 0,
    note: "設定ファイルの倍率が初期値(0.02)の場合の値です。感度は整数なので、換算すると少しずれます。",
  },
];

export function getSensGame(id: string): SensGame | undefined {
  return SENS_GAMES.find((g) => g.id === id);
}

import type { Axes } from "./axes";

export type Role = { id: string; name: string; target: Axes; reason: string };
export type Game = { id: string; name: string; shortName: string; roles: Role[] };

const t = (attack: number, instinct: number, team: number, heat: number): Axes => ({ attack, instinct, team, heat });

export const GAMES: Game[] = [
  {
    id: "overwatch",
    name: "オーバーウォッチ",
    shortName: "OW",
    roles: [
      { id: "tank", name: "タンク", target: t(0.5, 0, 1, 0.5), reason: "前に立って味方のために場所を取る" },
      { id: "damage", name: "ダメージ", target: t(1, 0.3, -0.5, 0.3), reason: "個人技で倒しきり、試合を動かす" },
      { id: "support", name: "サポート", target: t(-0.7, -0.3, 1, -0.5), reason: "味方を支え、落ち着いて全体を見る" },
    ],
  },
  {
    id: "valorant",
    name: "VALORANT",
    shortName: "VALO",
    roles: [
      { id: "duelist", name: "デュエリスト", target: t(1, 0.7, -0.5, 0.7), reason: "先頭で撃ち合い、道を開く" },
      { id: "initiator", name: "イニシエーター", target: t(0.5, -0.3, 1, 0), reason: "情報とスキルで突入を助ける" },
      { id: "controller", name: "コントローラー", target: t(-0.3, -1, 0.7, -0.7), reason: "視界を管理し、ラウンドを組み立てる" },
      { id: "sentinel", name: "センチネル", target: t(-1, -0.5, 0.3, -0.7), reason: "設置物でエリアを守る" },
    ],
  },
  {
    id: "apex",
    name: "Apex Legends",
    shortName: "Apex",
    roles: [
      { id: "assault", name: "アサルト", target: t(1, 0.3, 0.3, 0.7), reason: "戦闘の真ん中で火力を出す" },
      { id: "skirmisher", name: "スカーミッシャー", target: t(0.7, 1, -0.5, 0.5), reason: "機動力で出入りし、感覚で戦う" },
      { id: "recon", name: "リコン", target: t(0.3, -0.7, 0.7, -0.5), reason: "索敵で次の動きを決める" },
      { id: "controller", name: "コントローラー", target: t(-1, -0.7, 0.3, 0), reason: "陣地を作り、守りで勝つ" },
      { id: "support", name: "サポート", target: t(-0.7, 0, 1, 0), reason: "蘇生と回復で味方を支える" },
    ],
  },
  {
    id: "sf6",
    name: "ストリートファイター6",
    shortName: "スト6",
    roles: [
      { id: "rush", name: "ラッシュ", target: t(1, 0.7, -0.8, 0.8), reason: "攻め続けて考える時間を与えない" },
      { id: "footsies", name: "差し合い", target: t(0, -0.3, -0.8, 0), reason: "間合いの取り合いで有利を積む" },
      { id: "zoner", name: "待ち・差し返し", target: t(-1, -0.7, -0.8, -0.7), reason: "相手の動きを待って返す" },
      { id: "grappler", name: "グラップラー", target: t(0.5, 0.3, -0.8, 0.8), reason: "一発の大ダメージを狙って近づく" },
      { id: "technical", name: "テクニカル", target: t(0.3, -1, -0.8, -0.3), reason: "研究するほど強くなる" },
    ],
  },
  {
    id: "dbd",
    name: "Dead by Daylight",
    shortName: "DbD",
    roles: [
      { id: "killer-chase", name: "キラー:チェイス型", target: t(1, 0.5, -1, 0.7), reason: "追い続けて次々と倒す" },
      { id: "killer-stealth", name: "キラー:ステルス型", target: t(0.5, 0.3, -1, -0.7), reason: "気配を消して不意を突く" },
      { id: "killer-setup", name: "キラー:設置型", target: t(-0.7, -0.8, -1, 0), reason: "罠と設置でじわじわ追い込む" },
      { id: "survivor-chase", name: "サバイバー:引きつけ役", target: t(0, 0.8, 0.3, 0.7), reason: "キラーを引きつけて時間を稼ぐ" },
      { id: "survivor-support", name: "サバイバー:救助役", target: t(-0.3, 0, 1, 0.3), reason: "仲間を助けてチームを支える" },
      { id: "survivor-stealth", name: "サバイバー:修理・隠密", target: t(-1, -0.5, 0.5, -0.7), reason: "見つからずに発電機を回す" },
    ],
  },
];

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

export const MICE: MouseSpec[] = [
  {
    id: "logicool-g-pro-x-superlight-2",
    lengthMm: 125,
    widthMm: 63.5,
    heightMm: 40,
    weightG: 60,
    shape: "symmetric",
    connection: "wireless",
    officialUrl: "https://support.logi.com/hc/en-us/articles/15235304069783-Specification-G-PRO-X-Superlight-2-Lightspeed-Gaming-Mouse",
    checkedAt: "2026-09-29",
  },
  {
    id: "logicool-g-pro-x-superlight-2-dex",
    lengthMm: 125.8,
    widthMm: 67.7,
    heightMm: 43.9,
    weightG: 60,
    shape: "right",
    connection: "wireless",
    officialUrl: "https://support.logi.com/hc/en-us/articles/24668087532823-Specification-PRO-X-SUPERLIGHT-2-DEX",
    checkedAt: "2026-09-29",
  },
  {
    id: "logicool-g-pro-x-superlight",
    lengthMm: 125,
    widthMm: 63.5,
    heightMm: 40,
    weightG: 63,
    shape: "symmetric",
    connection: "wireless",
    officialUrl: "https://www.logitechg.com/en-us/shop/p/pro-x-superlight-wireless-mouse.910-005878",
    checkedAt: "2026-09-29",
  },
  {
    id: "logicool-g502-x-plus",
    lengthMm: 131.4,
    widthMm: 79.2,
    heightMm: 41.1,
    weightG: 106,
    shape: "right",
    connection: "wireless",
    officialUrl: "https://support.logi.com/hc/en-us/articles/7639125500183-Specification-G502-X-PLUS-Wireless-RGB-Gaming-Mouse",
    checkedAt: "2026-09-29",
  },
  {
    id: "logicool-g502-hero",
    lengthMm: 131.2,
    widthMm: 75,
    heightMm: 40,
    weightG: 121,
    shape: "right",
    connection: "wired",
    officialUrl: "https://www.logitechg.com/en-us/shop/p/g502-hero-gaming-mouse.910-005469",
    checkedAt: "2026-09-29",
  },
  {
    id: "logicool-g305",
    lengthMm: 116.6,
    widthMm: 62.15,
    heightMm: 38.2,
    weightG: 99,
    shape: "symmetric",
    connection: "wireless",
    officialUrl: "https://support.logi.com/hc/en-us/articles/360023303254-G305-LIGHTSPEED-Wireless-Gaming-Mouse-Technical-Specifications",
    checkedAt: "2026-09-29",
  },
  {
    id: "logicool-g304",
    lengthMm: 116.6,
    widthMm: 62.15,
    heightMm: 38.2,
    weightG: 99,
    shape: "symmetric",
    connection: "wireless",
    officialUrl: "https://support.logi.com/hc/en-us/articles/360023303474-G304-LIGHTSPEED-Wireless-Gaming-Mouse-Technical-Specifications",
    checkedAt: "2026-09-29",
  },
  {
    id: "razer-deathadder-v3-pro",
    lengthMm: 128,
    widthMm: 68,
    heightMm: 44,
    weightG: 63,
    shape: "right",
    connection: "wireless",
    officialUrl: "https://www.razer.com/gaming-mice/razer-deathadder-v3-pro",
    checkedAt: "2026-09-29",
  },
  {
    id: "razer-deathadder-v3",
    lengthMm: 128,
    widthMm: 68,
    heightMm: 44,
    weightG: 59,
    shape: "right",
    connection: "wired",
    officialUrl: "https://www.razer.com/gaming-mice/razer-deathadder-v3",
    checkedAt: "2026-09-29",
  },
  {
    id: "razer-viper-v3-pro",
    lengthMm: 127.1,
    widthMm: 63.9,
    heightMm: 39.9,
    weightG: 54,
    shape: "symmetric",
    connection: "wireless",
    officialUrl: "https://www.razer.com/gaming-mice/razer-viper-v3-pro",
    checkedAt: "2026-09-29",
  },
  {
    id: "razer-viper-mini",
    lengthMm: 118.3,
    widthMm: 53.5,
    heightMm: 38.3,
    weightG: 61,
    shape: "symmetric",
    connection: "wired",
    officialUrl: "https://www.razer.com/gaming-mice/razer-viper-mini",
    checkedAt: "2026-09-29",
  },
  {
    id: "razer-basilisk-v3-pro",
    lengthMm: 130,
    widthMm: 75.4,
    heightMm: 42.5,
    weightG: 112,
    shape: "right",
    connection: "wireless",
    officialUrl: "https://www.razer.com/gaming-mice/razer-basilisk-v3-pro",
    checkedAt: "2026-09-29",
  },
  {
    id: "pulsar-x2-v2",
    lengthMm: 120.4,
    widthMm: 63,
    heightMm: 38,
    weightG: 53,
    shape: "symmetric",
    connection: "wireless",
    officialUrl: "https://www.pulsar.gg/products/x2v2-gaming-mouse",
    checkedAt: "2026-09-29",
  },
  {
    id: "pulsar-xlite-v3",
    lengthMm: 122,
    widthMm: 66,
    heightMm: 43,
    weightG: 55,
    shape: "right",
    connection: "wireless",
    officialUrl: "https://www.pulsar.gg/products/xlite-v3-medium-gaming-mouse",
    checkedAt: "2026-09-29",
  },
  {
    id: "endgame-gear-op1-8k",
    lengthMm: 118.2,
    widthMm: 60.5,
    heightMm: 37.2,
    weightG: 50.5,
    shape: "symmetric",
    connection: "wired",
    officialUrl: "https://endgamegear.com/products/op1-8k-gaming-mouse",
    checkedAt: "2026-09-29",
  },
  {
    id: "endgame-gear-xm2we",
    lengthMm: 122,
    widthMm: 66,
    heightMm: 38,
    weightG: 63,
    shape: "symmetric",
    connection: "wireless",
    officialUrl: "https://endgamegear.com/products/xm2we-wireless-gaming-mouse",
    checkedAt: "2026-09-29",
  },
  {
    id: "steelseries-aerox-3",
    lengthMm: 120.55,
    widthMm: 67.03,
    heightMm: 37.98,
    weightG: 68,
    shape: "right",
    connection: "wireless",
    officialUrl: "https://steelseries.com/gaming-mice/aerox-3-wireless",
    checkedAt: "2026-09-29",
  },
  {
    id: "steelseries-rival-3",
    lengthMm: 120.6,
    widthMm: 67,
    heightMm: 37.9,
    weightG: 106,
    shape: "right",
    connection: "wireless",
    officialUrl: "https://steelseries.com/gaming-mice/rival-3-wireless",
    checkedAt: "2026-09-29",
  },
  {
    id: "corsair-m75-wireless",
    lengthMm: 128,
    widthMm: 65,
    heightMm: 42,
    weightG: 89,
    shape: "symmetric",
    connection: "wireless",
    officialUrl: "https://www.corsair.com/us/en/explorer/gamer/mice/corsair-m75-and-m75-wireless-everything-you-need-to-know/",
    checkedAt: "2026-09-29",
  },
  {
    id: "hyperx-pulsefire-haste-2",
    lengthMm: 124.3,
    widthMm: 66.8,
    heightMm: 38.2,
    weightG: 53,
    shape: "symmetric",
    connection: "wired",
    officialUrl: "https://hyperx.com/products/hyperx-pulsefire-haste-2-gaming-mouse",
    checkedAt: "2026-09-29",
  },
];

export function mouseById(id: string): MouseSpec | undefined {
  return MICE.find((m) => m.id === id);
}

/*
 * 外したもの(メーカー公式ページに大きさの数字がない、または数字が使えないため。推測で埋めない):
 * 外したもの: zowie-ec2-cw — 公式ページの「Dimensions」欄に数字がない(重さのみ)
 * 外したもの: zowie-ec2-c — 公式ページの「Dimensions」欄に数字がない
 * 外したもの: zowie-fk2-c — 公式ページの「Dimensions」欄に数字がない
 * 外したもの: zowie-s2-c — 公式ページの「Dimensions」欄に数字がない
 * 外したもの: zowie-za13-c — 公式ページの「Dimensions」欄に数字がない
 * 外したもの: zowie-u2 — 公式ページの「Dimensions」欄に数字がない
 * 外したもの: finalmouse-ultralightx — 公式は S/M/L の3サイズで、幅は「グリップ幅」表記(いちばん広いところではない)。devices.ts にサイズの区別がない
 * 外したもの: lamzu-atlantis-mini — 初代(49g)の公式ページが現在ない。現行の Mini 4K/Pro のページにも大きさの数字が文字で載っていない
 * 外したもの: vaxee-xe — 公式の製品ページに大きさ・重さの説明文がない(画像のみ)
 * 外したもの: glorious-model-o-2-wireless — 公式ページに長さ・幅・高さの数字がない(重さ 68g のみ)
 */

// 楽天の商品検索 API で、マウス探しに出す商品(画像と商品ページ)を選び、
// src/data/mice-rakuten.ts と docs/content/rakuten-mice-review.md に書き出す。
// 楽天アプリの許可 IP が本人の家の IPv4 だけなので、本人の PC で動かす(サイトの実行時には呼ばない)。
//
// 使い方(どちらか):
//   node --env-file=.env.local --dns-result-order=ipv4first scripts/rakuten-mice.mjs
//   node --dns-result-order=ipv4first scripts/rakuten-mice.mjs --config "<楽天ROOM 自動化の config.json のパス>"
//
// キーは process.env(RAKUTEN_APPLICATION_ID / RAKUTEN_ACCESS_KEY)か、--config で渡した config.json の
// 「楽天API.applicationId / accessKey」から、実行中にメモリへ読むだけ(どこにも書き写さない。本人のルール)。
// キーの値やキーを含む URL は、ログ・ファイル・エラーメッセージに出さない。
import { readFileSync, writeFileSync } from "node:fs";
import { DEVICES } from "../src/data/devices.ts";
import { MICE } from "../src/data/mice.ts";
import { pickRakutenItem, toRakutenItem } from "../src/lib/rakuten-pick.ts";

const ENDPOINT = "https://openapi.rakuten.co.jp/ichibams/api/IchibaItem/Search/20260401";
const WAIT_MS = 1100; // 1 秒に 1 回まで

function keysFromConfig() {
  const i = process.argv.indexOf("--config");
  if (i < 0 || !process.argv[i + 1]) return {};
  try {
    const api = JSON.parse(readFileSync(process.argv[i + 1], "utf8"))["楽天API"] ?? {};
    return { applicationId: api.applicationId, accessKey: api.accessKey };
  } catch {
    console.error("--config の config.json を読めませんでした(パスを確かめてください)");
    process.exit(1);
  }
}
const fromConfig = keysFromConfig();
const applicationId = fromConfig.applicationId || process.env.RAKUTEN_APPLICATION_ID;
const accessKey = fromConfig.accessKey || process.env.RAKUTEN_ACCESS_KEY;
if (!applicationId || !accessKey) {
  console.error("楽天のキーがありません(--config で config.json を渡すか、.env.local に RAKUTEN_APPLICATION_ID / RAKUTEN_ACCESS_KEY を入れる)");
  process.exit(1);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const today = new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Tokyo" }); // YYYY-MM-DD

async function search(keyword) {
  const url = new URL(ENDPOINT);
  url.searchParams.set("applicationId", applicationId);
  url.searchParams.set("accessKey", accessKey);
  url.searchParams.set("format", "json");
  url.searchParams.set("keyword", keyword);
  url.searchParams.set("hits", "30");
  url.searchParams.set("sort", "-reviewCount");
  url.searchParams.set("availability", "1");
  url.searchParams.set("imageFlag", "1");
  let res;
  try {
    res = await fetch(url);
  } catch {
    // エラーの中身には URL(キー入り)が入ることがあるので出さない
    return { status: "接続できませんでした", items: null };
  }
  if (!res.ok) return { status: `HTTP ${res.status}`, items: null };
  const body = await res.json();
  return { status: "ok", items: (body.Items ?? []).map((x) => x.Item ?? x) };
}

const results = [];
const errors = [];
for (const [i, m] of MICE.entries()) {
  const d = DEVICES.find((x) => x.id === m.id);
  if (!d) continue;
  if (i > 0) await sleep(WAIT_MS);
  // 楽天の検索は 1 文字の語(G・X・2 など)があると 400 になるので、検索語からだけ外す(選ぶときの照合は元の名前のまま)
  const keyword = `${d.brand} ${d.name}`.split(/\s+/).filter((w) => w.length >= 2).join(" ");
  const { status, items } = await search(keyword);
  if (!items) {
    console.error(`${m.id}: ${status}`);
    errors.push(m.id);
    continue;
  }
  const siblings = DEVICES.filter((x) => x.category === "mouse" && x.brand === d.brand && x.id !== d.id).map((x) => x.name);
  const picked = pickRakutenItem(items, d.brand, d.name, siblings);
  const item = picked ? toRakutenItem(picked, today) : null;
  results.push({ id: m.id, label: `${d.brand} ${d.name}`, item, reviewCount: picked?.reviewCount ?? null });
  console.log(`${m.id}: ${item ? "見つかった" : "見つからない"}`);
}

if (errors.length > 0) {
  console.error(`${errors.length} 件のマウスで取得に失敗したので、ファイルは書き換えません`);
  process.exit(1);
}

const entries = results
  .filter((r) => r.item)
  .map((r) => `  ${JSON.stringify(r.id)}: ${JSON.stringify(r.item)},`)
  .join("\n");
const ts = `// scripts/rakuten-mice.mjs が作る。手で直さない。月 1 回くらい作り直す。
// 楽天の商品検索 API の結果のスナップショット(キーはマウスの id。並びは src/data/mice.ts と同じ)。

export type RakutenItem = { itemCode: string; itemName: string; shopName: string; itemUrl: string; imageUrl: string; checkedAt: string };

export const MICE_RAKUTEN: Record<string, RakutenItem> = {${entries ? `\n${entries}\n` : ""}};
`;
writeFileSync(new URL("../src/data/mice-rakuten.ts", import.meta.url), ts);

const md = [
  "# 楽天の商品画像の確認用一覧",
  "",
  `scripts/rakuten-mice.mjs が作る(${today})。違う商品が選ばれていたら、src/data/mice-rakuten.ts から消すか、選び方を直して作り直す。`,
  "",
  ...results.flatMap((r) =>
    r.item
      ? [
          `## ${r.label}`,
          "",
          `- 商品名:${r.item.itemName}`,
          `- ショップ:${r.item.shopName}`,
          `- レビュー数:${r.reviewCount}`,
          `- 商品ページ:${r.item.itemUrl}`,
          `- 画像:${r.item.imageUrl}`,
          "",
        ]
      : [`## ${r.label}`, "", "- 見つからなかった(載せない)", ""],
  ),
].join("\n");
writeFileSync(new URL("../docs/content/rakuten-mice-review.md", import.meta.url), md);

console.log(`書き出し: ${results.filter((r) => r.item).length} / ${results.length} 件`);

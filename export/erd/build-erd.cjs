// ロビラボの ER 図(SVG)を作る。列の情報は dev DB(robilab-dev)の information_schema / pg_constraint から写したもの。
// 実行: node export/erd/build-erd.cjs → export/erd/robilab-erd.svg
const fs = require("fs");
const path = require("path");

const W = 1640, H = 1310;
const ROW = 26, HEAD = 48;
const FONT = "'Yu Gothic UI', 'Meiryo', sans-serif";
const MONO = "'Consolas', 'MS Gothic', monospace";

// アクセスの種類(ヘッダーの色)
const ACCESS = {
  own: { color: "#2f6fde", label: "本人の行だけ読める(RLS)。書き込みは関数経由" },
  rpc: { color: "#7b4fd6", label: "直接は読み書き不可。関数(RPC)経由だけ" },
  ops: { color: "#c46a1a", label: "運営だけ(ダッシュボード / 関数の内部で使用)" },
  anon: { color: "#1f9d6b", label: "だれでも関数経由で記録だけできる(件数上限あり・読めない)" },
  auth: { color: "#5b6270", label: "Supabase Auth が管理" },
};

// k: PK / FK / UQ、d: Discord ID(外部キーではなく値でつながる)
const tables = [
  { id: "auth_users", name: "auth.users", sub: "ログインアカウント", x: 40, y: 110, w: 270, access: "auth",
    cols: [["id", "uuid", "PK"], ["…", "Supabase が管理", ""]] },
  { id: "private_info", name: "private_info", sub: "非公開の情報", x: 40, y: 330, w: 300, access: "own",
    cols: [["user_id", "uuid", "PK FK"], ["discord_user_id", "text", "UQ D"], ["discord_username", "text", ""],
      ["birthdate", "date(変更不可)", ""], ["created_at", "timestamptz", ""]] },
  { id: "profiles", name: "profiles", sub: "公開プロフィール", x: 400, y: 110, w: 340, access: "own",
    cols: [["id", "uuid", "PK FK"], ["nickname", "text(1〜20字)", ""], ["type_code", "text?", ""], ["axes", "jsonb?", ""],
      ["games", "jsonb", ""], ["platforms", "text[]", ""], ["voice_ok", "boolean", ""], ["time_slots", "text[]", ""],
      ["bio", "text(〜50字)", ""], ["age_group", "adult | teen", ""], ["status", "active | suspended | banned", ""],
      ["created_at", "timestamptz", ""], ["updated_at", "timestamptz", ""]] },
  { id: "approaches", name: "approaches", sub: "声かけ", x: 400, y: 580, w: 340, access: "rpc",
    cols: [["id", "uuid", "PK"], ["from_id", "uuid", "FK"], ["to_id", "uuid", "FK"],
      ["status", "pending | accepted | passed | expired", ""], ["created_at", "timestamptz", ""], ["responded_at", "timestamptz?", ""],
      ["seen_by_to", "boolean", ""], ["seen_by_from", "boolean", ""]] },
  { id: "blocks", name: "blocks", sub: "ブロック", x: 860, y: 110, w: 300, access: "own",
    cols: [["blocker_id", "uuid", "PK FK"], ["blocked_id", "uuid", "PK FK"], ["created_at", "timestamptz", ""]] },
  { id: "carried_blocks", name: "carried_blocks", sub: "退会した人へのブロック(引き継ぎ)", x: 860, y: 300, w: 300, access: "ops",
    cols: [["blocker_id", "uuid", "PK FK"], ["blocked_discord_id", "text", "PK D"], ["created_at", "timestamptz", ""]] },
  { id: "reports", name: "reports", sub: "通報", x: 860, y: 490, w: 340, access: "ops",
    cols: [["id", "uuid", "PK"], ["reporter_id", "uuid?", "FK UQ"], ["reporter_discord_id", "text?", "D"],
      ["target_id", "uuid?", "FK UQ"], ["target_discord_id", "text?", "D"],
      ["reason", "5種類(年齢詐称・嫌がらせ など)", ""], ["detail", "text(〜200字)", ""],
      ["status", "open | closed", ""], ["created_at", "timestamptz", ""]] },
  { id: "banned", name: "banned_discord_ids", sub: "BAN した Discord", x: 1290, y: 110, w: 310, access: "ops",
    cols: [["discord_user_id", "text", "PK D"], ["banned_at", "timestamptz", ""], ["note", "text?", ""]] },
  { id: "left", name: "left_discord_ids", sub: "退会した Discord(7日間再登録不可)", x: 1290, y: 300, w: 310, access: "ops",
    cols: [["discord_user_id", "text", "PK D"], ["left_at", "timestamptz", ""]] },
  { id: "ng_words", name: "ng_words", sub: "NG ワード", x: 1290, y: 460, w: 310, access: "ops",
    cols: [["word", "text", "PK"]] },
  { id: "diagnosis", name: "diagnosis_results", sub: "診断結果の匿名記録", x: 1290, y: 650, w: 310, access: "anon",
    cols: [["id", "uuid", "PK"], ["type_code", "text(16タイプ)", ""], ["axes", "jsonb(〜512B)", ""], ["created_at", "timestamptz", ""]] },
  { id: "my_settings", name: "my_settings", sub: "マイ設定(1人1件)", x: 400, y: 880, w: 340, access: "own",
    cols: [["user_id", "uuid", "PK FK"], ["data", "jsonb(〜4KB)", ""], ["updated_at", "timestamptz", ""], ["public_slug", "text?(10文字)", "UQ"]] },
];
const T = Object.fromEntries(tables.map((t) => [t.id, t]));
const rowY = (t, col) => t.y + HEAD + t.cols.findIndex((c) => c[0] === col) * ROW + ROW / 2;
const height = (t) => HEAD + t.cols.length * ROW;

// 外部キー(from 側が N、to 側が 1)。del は ON DELETE
const rels = [
  ["profiles", "id", "auth_users", "id", "CASCADE", "1:1"],
  ["private_info", "user_id", "auth_users", "id", "CASCADE", "1:1"],
  ["my_settings", "user_id", "auth_users", "id", "CASCADE", "1:1"],
  ["approaches", "from_id", "profiles", "id", "CASCADE"],
  ["approaches", "to_id", "profiles", "id", "CASCADE"],
  ["blocks", "blocker_id", "profiles", "id", "CASCADE"],
  ["blocks", "blocked_id", "profiles", "id", "CASCADE"],
  ["carried_blocks", "blocker_id", "profiles", "id", "CASCADE"],
  ["reports", "reporter_id", "profiles", "id", "SET NULL"],
  ["reports", "target_id", "profiles", "id", "SET NULL"],
];

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
let out = [];
out.push(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" font-family="${FONT}">`);
out.push(`<g id="background"><rect width="${W}" height="${H}" fill="#f7f8fb"/></g>`);
out.push(`<g id="title"><text x="40" y="52" font-size="28" font-weight="700" fill="#1b1f2a">ロビラボ データベース ER 図</text>` +
  `<text x="40" y="82" font-size="15" fill="#5b6270">Supabase public スキーマ(dev: robilab-dev で確認、migration 20261001001100 まで)</text></g>`);

// 領域の背景
out.push(`<g id="areas">`);
out.push(`<rect x="20" y="96" width="1200" height="${582 + height(T.approaches) - 96 + 30}" rx="14" fill="none" stroke="#c9cedb" stroke-dasharray="6 5"/>`);
out.push(`<text x="36" y="${582 + height(T.approaches) + 20}" font-size="13" fill="#7a8190">マッチング(Discord ログインが必要)</text>`);
out.push(`<rect x="1270" y="96" width="350" height="${460 + height(T.ng_words) - 96 + 40}" rx="14" fill="none" stroke="#c9cedb" stroke-dasharray="6 5"/>`);
out.push(`<text x="1286" y="${460 + height(T.ng_words) + 30}" font-size="13" fill="#7a8190">運営用(アプリの画面からは見えない)</text>`);
out.push(`<rect x="1270" y="636" width="350" height="${height(T.diagnosis) + 48}" rx="14" fill="none" stroke="#c9cedb" stroke-dasharray="6 5"/>`);
out.push(`<text x="1286" y="${650 + height(T.diagnosis) + 26}" font-size="13" fill="#7a8190">診断(ログイン不要・個人情報なし)</text>`);
out.push(`</g>`);

// 線
out.push(`<g id="relations" fill="none" stroke-width="1.6">`);
rels.forEach(([ft, fc, tt, tc, del, card], i) => {
  const a = T[ft], b = T[tt];
  const y1 = rowY(a, fc), y2 = rowY(b, tc);
  let x1, x2, c1, c2;
  const overlap = a.x < b.x + b.w && b.x < a.x + a.w;
  if (overlap) {
    // 同じ列に並ぶ表どうしは左側でつなぐ
    x1 = a.x; x2 = b.x;
    const off = 34 + (i % 3) * 14;
    c1 = x1 - off; c2 = x2 - off;
  } else if (a.x > b.x) { x1 = a.x; x2 = b.x + b.w; c1 = x1 - 60; c2 = x2 + 60; }
  else { x1 = a.x + a.w; x2 = b.x; c1 = x1 + 60; c2 = x2 - 60; }
  const color = del === "SET NULL" ? "#c46a1a" : "#4a5263";
  const dash = del === "SET NULL" ? ` stroke-dasharray="7 4"` : "";
  out.push(`<g id="rel-${ft}-${fc}"><path d="M${x1},${y1} C${c1},${y1} ${c2},${y2} ${x2},${y2}" stroke="${color}"${dash}/>` +
    `<circle cx="${x2}" cy="${y2}" r="3.5" fill="${color}"/>` +
    `<text x="${x1 + (x1 <= c1 ? 6 : -6)}" y="${y1 - 5}" font-size="11" fill="${color}" text-anchor="${x1 <= c1 ? "start" : "end"}">${card === "1:1" ? "1" : "N"}</text>` +
    `<text x="${x2 + (x2 <= c2 ? 6 : -6)}" y="${y2 - 5}" font-size="11" fill="${color}" text-anchor="${x2 <= c2 ? "start" : "end"}">1</text></g>`);
});
out.push(`</g>`);

// 表
out.push(`<g id="tables">`);
for (const t of tables) {
  const acc = ACCESS[t.access];
  const h = height(t);
  out.push(`<g id="table-${t.name.replace(/\./g, "-")}">`);
  out.push(`<rect x="${t.x}" y="${t.y}" width="${t.w}" height="${h}" rx="8" fill="#ffffff" stroke="${acc.color}" stroke-width="1.5"${t.access === "auth" ? ` stroke-dasharray="5 4"` : ""}/>`);
  out.push(`<path d="M${t.x},${t.y + 8} a8,8 0 0 1 8,-8 h${t.w - 16} a8,8 0 0 1 8,8 v${HEAD - 8} h-${t.w} z" fill="${acc.color}"/>`);
  out.push(`<text x="${t.x + 12}" y="${t.y + 21}" font-size="15" font-weight="700" fill="#fff" font-family="${MONO}">${esc(t.name)}</text>`);
  out.push(`<text x="${t.x + 12}" y="${t.y + 40}" font-size="12" fill="#eef1f7">${esc(t.sub)}</text>`);
  t.cols.forEach(([name, type, keys], i) => {
    const y = t.y + HEAD + i * ROW;
    if (i % 2 === 1) out.push(`<rect x="${t.x + 1}" y="${y}" width="${t.w - 2}" height="${ROW}" fill="#f3f5f9"/>`);
    const ks = keys.split(" ").filter(Boolean);
    let bx = t.x + 8;
    for (const k of ks) {
      const fill = { PK: "#e2b714", FK: "#4a5263", UQ: "#7a8190", D: "#5865f2" }[k];
      const label = k === "D" ? "Discord" : k;
      const bw = k === "D" ? 50 : 24;
      out.push(`<rect x="${bx}" y="${y + 6}" width="${bw}" height="15" rx="3" fill="${fill}"/>` +
        `<text x="${bx + bw / 2}" y="${y + 17.5}" font-size="10" font-weight="700" fill="#fff" text-anchor="middle">${label}</text>`);
      bx += bw + 3;
    }
    const nameX = t.x + 8 + 84;
    out.push(`<text x="${nameX}" y="${y + 18}" font-size="13" fill="#1b1f2a" font-family="${MONO}">${esc(name)}</text>`);
    out.push(`<text x="${t.x + t.w - 10}" y="${y + 18}" font-size="11" fill="#6b7280" text-anchor="end">${esc(type)}</text>`);
  });
  out.push(`</g>`);
}
out.push(`</g>`);

// 凡例
const ly = 1080;
out.push(`<g id="legend"><rect x="20" y="${ly}" width="${W - 40}" height="${H - ly - 20}" rx="12" fill="#ffffff" stroke="#d7dbe5"/>`);
out.push(`<text x="40" y="${ly + 30}" font-size="15" font-weight="700" fill="#1b1f2a">凡例</text>`);
Object.values(ACCESS).forEach((a, i) => {
  const x = 40 + (i % 2) * 560, y = ly + 56 + Math.floor(i / 2) * 26;
  out.push(`<rect x="${x}" y="${y - 12}" width="16" height="16" rx="3" fill="${a.color}"/><text x="${x + 24}" y="${y + 1}" font-size="13" fill="#333a48">${esc(a.label)}</text>`);
});
const lx = 1160;
out.push(`<rect x="${lx}" y="${ly + 44}" width="24" height="15" rx="3" fill="#e2b714"/><text x="${lx + 30}" y="${ly + 56}" font-size="13" fill="#333a48">主キー</text>`);
out.push(`<rect x="${lx + 90}" y="${ly + 44}" width="24" height="15" rx="3" fill="#4a5263"/><text x="${lx + 120}" y="${ly + 56}" font-size="13" fill="#333a48">外部キー</text>`);
out.push(`<rect x="${lx + 196}" y="${ly + 44}" width="24" height="15" rx="3" fill="#7a8190"/><text x="${lx + 226}" y="${ly + 56}" font-size="13" fill="#333a48">一意</text>`);
out.push(`<rect x="${lx}" y="${ly + 70}" width="50" height="15" rx="3" fill="#5865f2"/><text x="${lx + 56}" y="${ly + 82}" font-size="13" fill="#333a48">Discord ID の値でつながる(外部キーではない)</text>`);
out.push(`<path d="M40,${ly + 144} h60" stroke="#4a5263" stroke-width="1.6"/><text x="110" y="${ly + 148}" font-size="13" fill="#333a48">親が消えると一緒に消える(ON DELETE CASCADE)</text>`);
out.push(`<path d="M520,${ly + 144} h60" stroke="#c46a1a" stroke-width="1.6" stroke-dasharray="7 4"/><text x="590" y="${ly + 148}" font-size="13" fill="#333a48">親が消えると空欄になる(ON DELETE SET NULL)。通報は証跡として残る</text>`);
out.push(`<text x="40" y="${ly + 180}" font-size="13" fill="#333a48">N / 1 = 多対一。profiles・private_info・my_settings は auth.users と 1 対 1。「?」は空欄(NULL)を許す列。</text>`);
out.push(`<text x="40" y="${ly + 202}" font-size="13" fill="#333a48">Discord ID の値でつながる列:private_info.discord_user_id = reports.reporter_discord_id / target_discord_id = carried_blocks.blocked_discord_id = banned_discord_ids / left_discord_ids.discord_user_id</text>`);
out.push(`</g>`);
out.push(`</svg>`);
fs.writeFileSync(path.join(__dirname, "robilab-erd.svg"), out.join("\n"));
console.log("wrote robilab-erd.svg");

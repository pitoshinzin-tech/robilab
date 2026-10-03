# デバイスの広がり(マウス 54・マウスパッド探し・ソール探し)Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** メーカー公式の数字だけのデータ(マウス 54・マウスパッド 48・ソール 58)を型付きの `src/data` に入れ、`/mouse` を 54 機種に広げ、`/pads`(マウスパッド探し)と `/skates`(ソール探し)を新しく作る。どの画面も作った数字を出さず、店へのリンクは PR 表記つき。

**Architecture:** JSON → TS は一度きりの手作業ではなく、`scripts/gear-data.ts`(Node 24 の型の取り除きでそのまま動く)が `src/data/{pads,skates,mice,mice-ids}.ts` を書き出し、出力と一緒にコミットする(テストが「作り直し忘れ」を見つける。実行時に JSON は読まない)。判断の入る計算(null に強い合う順・人気の順・大きさの目安・絞り込み・ソールの結び付け・マイ設定の読み取り)はすべて `src/lib` の純粋な関数にして Vitest で先に固める。`/pads` と `/skates` はサーバーの部品で、URL の `?…` を読んでサーバーで絞り、絞り込みのチップはリンク(JS を足さない)。`/mouse` は手の情報がブラウザにしかないので合う順はブラウザで計算するが、渡すデータはサーバーで表示に要る分だけの「行」にしてから props で渡す(機種データ本体・出典の文・メモをブラウザの JS に入れない)。

**Tech Stack:** TypeScript / Next.js 16.3(App Router)/ React 19.2 / Tailwind CSS 4 / lucide-react / class-variance-authority / Vitest(environment node)/ Node 24(スクリプトの実行)。新しい道具は足さない。

**Spec:** `docs/superpowers/specs/2026-10-03-gear-finder-design.md`。データの根拠は `docs/content/gear/{mice,pads,skates}.json` と各 `*-notes.md`。デザインの決まりは `docs/superpowers/plans/2026-10-02-ui-polish.md` の「Global Constraints」と「設計書との読み替え」、`docs/design/motion-reference.md`、JS の測り方は `docs/design/js-budget.md`。ぶつかったときは、データの扱いは設計書と notes、見た目の決まりは ui-polish の計画を正とする。

**並んで動いている作業:** 別の担当が表示の速さのために `src/app/mouse/MouseClient.tsx`・`src/components/my/*` を直している。Task 3・7 で `MouseClient.tsx` を触るときは、**必ずその時点のファイルを読み直してから**、下に書いた「置き換え」を当てる(行番号ではなく、書いてある元の文で探す)。`src/components/my/*` は触らない。

## Global Constraints

**設計書 4 章(そのまま)**
- 数字はメーカー公式だけ。null は空欄・「公式の記載なし」。速さ・止めを点数にしない。価格は載せない。
- PR 表記、`rel="sponsored noopener"`、Amazon のタグ、楽天は検索リンク(新しい API の呼び出しはしない)。(今のコードの `rel="sponsored noopener noreferrer"` にそろえる。マウスの楽天の商品ページのスナップショットは今のまま使う)
- デザインシステム(役割の色、主ボタン 1 つ、44px、フォーカス、reduced-motion、文字の段、`cn` は `@/lib/utils`、base-ui を使わない軽い部品)と、アートディレクション(線とマス)。自動の動きは足さない。
- JS は 1 ページ 4KB 以内の増え。データはサーバーで絞り、ブラウザへは表示に要る分だけ送る。
- 出来上がったら、ほかの画面と同じ採点(375/1440 の写真、合格 8.2 以上)と、差分のセキュリティ監査。

**ui-polish の Global Constraints から(そのまま。この計画に関係する分)**
- 新しいライブラリは足さない(`package.json` にあるものだけ。DOM のテスト道具も足さない)。
- シアン(`--rl-accent` `#39F3FF`)は押せるものだけ:主ボタンの塗り・文中のリンクの文字・フォーカスの線。数字・見出し・枠・選んだ状態・飾りには使わない。数字の強調は `--rl-highlight`(マゼンタ)、選んだ状態は `--rl-selected`(パープル)の枠+ `--rl-selected-bg`、ふつうの枠は `--rl-line` / `--rl-line-strong`。パープル `#7B61FF` は文字に使わない(文字は `--rl-secondary-text` `#A99BFF`)。
- 主ボタン(`variant="primary"`)は 1 画面に 1 つ。
- アイコンは lucide-react の SVG だけ。絵文字と文字の矢印(← →)をアイコンに使わない。大きさは文の中 16・ボタン 20・タブ 24・空の状態 32(px)。
- 押せるものは 44×44px 以上(ボタン `sm` = 44px)。`cursor-pointer`。押した状態 `active:translate-y-px`。無効は不透明度 45% と `cursor-not-allowed`。
- フォーカスは `:focus-visible` のときだけ `outline: 2px solid var(--rl-focus); outline-offset: 2px`(`globals.css` の base で全体に。部品で `outline-none` を使わない)。
- 文字の段階:12(出典・注記・バッジだけ)/ 14 / 16 / 20 / 24 / 32 / 40(px)。エラー・注意・説明は 14px 以上。入力欄は 16px。Orbitron は数字・タイプのコード・英字だけで 14px 以上。表示用の段は `text-rl-display-1`〜`3` と `text-rl-hero` だけ。大きな文字は「漢字 1 文字」と「Orbitron の数字・コード」だけ(日本語の長い見出しを巨大にしない)。
- 線とマス:マス(格子・バー・地の点)の大きさは 8px の倍数。縦のリズムは 8px の倍数(44px のタップの大きさだけ例外)。
- 箱(Card)を使うのは「同じ種類のものの一覧で、押すと別の所へ行くもの」と「入力のまとまり」と「ロビーのプレイヤーの札」だけ。ほかは幅いっぱいの行(上下に `border-rl-line` の線)か、箱なしの名簿。
- 角丸は `rounded-rl-sm`(8px:入力欄・チップ・バッジ)/ `rounded-rl-md`(16px:カード)/ `rounded-rl-pill`(ボタン)。
- ページの幅は `narrow`(640px)と `wide`(1120px)の 2 つだけ(`PageShell`)。
- 長い名前は `wrap-anywhere`、flex の中の文字の箱は `min-w-0`。
- 文言はすべて日本語(コード・識別子はそのまま)。謝らない空の文言(「なにがないか+次になにをすればいいか」)。
- React 19 の lint:effect の中で同期的に setState しない。描画中に ref を読まない。
- `.env*` を読まない。キー・トークンを書かない・表示しない。
- コミットは `git -c user.name=pitos -c user.email=pito.shinzin@gmail.com commit`、最後の行に `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`。
- UI のタスクの確かめ方はすべて同じ 4 つ+コントローラーのブラウザ確認:`npx tsc --noEmit`、`npm run lint`、`npx vitest run`、`npm run build`(担当はサーバーを起動しない。ブラウザ確認はコントローラーが行う)。

**この計画で足す決まり**
- ブラウザの部品(`"use client"` のファイルと `src/components/**`)から `@/data/mice` `@/data/pads` `@/data/skates` `@/data/mice-rakuten` を値として import しない(型だけはよい)。出典の文・メモ・センサー名がブラウザの JS に入るため。Task 4 のテストで固める。
- `src/data/{pads,skates,mice,mice-ids}.ts` は生成物。手で直さない(`docs/content/gear/*.json` を直して `node scripts/gear-data.ts`)。
- 技術スタック(TypeScript / Next.js / Tailwind CSS / shadcn/ui / Supabase / Vercel / Stripe / Vitest)の外は足さない。スクリプトは Node の標準だけ。
- 正本は `plan.md`。決まったこと・進み具合は Task 9 でまとめて書く(途中で社長の判断が要ることが出たら、その場でコントローラーに返す)。

**JS の測り方(各 UI タスクの「JS の確認」で同じ手順)**

Task 1 の Step 0 で作る `scripts/page-js.mjs` を使う(数え方は `docs/design/js-budget.md` と同じ:client reference manifest の entryJSFiles + rootMainFiles・polyfill の gzip の合計)。**PowerShell で**動かす(Git Bash は `/mouse` をパスに書き換えてしまう):

```powershell
Remove-Item -Recurse -Force .next; npm run build
node scripts/page-js.mjs / /terms /mouse /pads /skates /my /tools/sensitivity
```

- 合格:今あるページは Task 1 の基準からの増えが **+4.0KB 以下**(`/mouse` は減る見込み)。新しいページは **`/pads` − `/terms` と `/skates` − `/terms` がどちらも 4.0KB 以下**(`/terms` はブラウザの部品を持たない、いちばん軽いページ)。
- 結果は `docs/design/js-budget.md` の表に 1 行(タスク・合計 KB・前からの差 KB・メモにページごとの値)。

## Review Focus

1. **公式にない数字(null)が計算や表示に入る**:長さ・幅のない 8 機種、重さ・形・接続のない機種、厚さのないパッドのサイズ、厚さが幅の表記のソール → 「NaN」「nullmm」「0mm」「undefined」が画面に出る・順位がずれる。期待:順位に入れず「公式の大きさがないため比べられません」の段、表示は「公式の記載なし」。→ Task 2 のテスト(全組み合わせで文に `null|NaN|undefined` が出ない・重さ null は同点で後ろ)、Task 4 のテスト(本物の 54 機種 × 3 つの持ち方で同じ確認)、Task 5 のテスト(厚さ null のサイズは厚さの絞り込みに入らない・本物の全パッドとソールのラベルに `null` が出ない)。
2. **URL の想定外の値**:`?surface=GLASS`、`?size=XS`、`?surface=a&surface=b`、`?mouse=no-such-mouse`、`?mouse=`(空)、長い文字列 → 落ちずに「すべて」として出す。`?mouse=`(空)は「選ばない」を選んだ印なので、マイ設定で上書きしない。→ Task 5 の `parsePadFilter` / `parseSkateFilter` / `shouldPreselect` のテスト。
3. **マイ設定の保存が壊れている・自由入力の名前・候補にない id**:`/skates` が落ちる、または変な id で選び直し続ける。期待:読めなければ何もしない、選び直しは URL にマウスの指定がまったくないときの 1 回だけ。→ Task 5 の `myMouseIdFrom` のテスト(壊れた JSON・`{name}`・大文字や `../` の id)と、Task 7 のブラウザ確認(候補にない id を保存した状態で開いてもループしない)。
4. **非表示・生産終了の取り違え**:全部 null の 7 件のパッドが出る、生産終了が札なしで出る、LGG・SkyPAD が古い名前で出る。→ Task 1 のテスト(hidden がちょうど 7 件・生産終了がちょうど 3 件・名前の直し)と、Task 5 の `visiblePads` のテスト、Task 6 のブラウザ確認(シデンカイ V2・G-SR・G-TR に「生産終了」の札)。
5. **375px で長い英語の製品名・サイズの表・SubNav がはみ出す**(例「MM350 PRO Premium Spill-Proof Cloth Gaming Mouse Pad – Extended XL」「ICE V2 Mouse Skates For Logitech G-Pro X Superlight 2」)→ 名前の h3 に `data-long-name` と `wrap-anywhere`。Task 3・6・7・8 のブラウザ確認で、ui-polish の「はみ出し確認スクリプト」(下に再掲)を流す。

**はみ出し確認スクリプト**(ブラウザのコンソールに貼る):

```js
const SELECTOR = "[data-long-name]";
document.querySelectorAll(SELECTOR).forEach((el) => { el.textContent = "WWWWWWWWWWWWWWWWWWWW超長いニックネームのテストです"; });
console.log("横にはみ出していない:", document.documentElement.scrollWidth === window.innerWidth);
```

## 設計書との読み替え(実装の都合で決めたこと)

1. **絞り込みのチップはリンク**(`ChipLink`。設計書は `ChipButton`)。`/pads` と `/skates` は URL の `?…` をサーバーで読んで絞る。理由:JS を足さない(4KB の上限)・URL をそのまま共有できる・JS なしでも動く。見た目は `chipClassName` と同じで、選んでいるものは `aria-current="true"`+チェック。矢印キーでの移動はなく、Tab で移る。
2. **マウスを選ぶのは GET のフォーム**(ネイティブの `<select>`+「このマウスで絞り込む」ボタン)。選んだだけでは送らない(JS を足さない)。
3. **大きさの目安(S〜XXL)は公式の横幅だけで決める**(机の幅に合わせて選ぶため。奥行きは表に出す):S 300mm 未満・M 300〜399・L 400〜479・XL 480〜599・XXL 600 以上。パッドはサイズのどれか 1 つが当てはまれば出し、絞り込んだときは当てはまるサイズだけを表に出す。
4. **厚さの目安**:薄い 3mm 未満・ふつう 3〜4.9mm・厚い 5mm 以上。公式の厚さがないサイズは、どの厚さにも入らない。
5. **人気の順**:`selectionBasis` の中の売れ筋ランキング(Amazon.co.jp・価格.com・BCN)のいちばん高い順位。ProSettings.net のプロ使用率は「選ぶときの参考」なので数えない(mice-notes)。URL の中の数字は読まない。順位がないもの(編集判断・登録済みだけ)は後ろで、データの順。画面の下に 1 行で書く。
6. **`/mouse` の順位に入るのは、公式の長さと幅がそろう 46 機種**。8 機種(EC2-CW・EC2-DW・ZA13-DW・U2-DW・UltralightX・E1 Wireless・V8・Model O 2 Wireless)は「公式の大きさがないため比べられません」の段(人気の順)。この段はサーバーの部品で、マウス探しの部品の下に置く(手を入れる前にも出る)。
7. **null の扱い(マウス)**:重さがないものは、同じ距離のときに後ろ・重さの絞り込みでは外れる。形がないものは形の絞り込みで外れる。接続 `both` は「有線」でも「無線」でも入る。今のマウスとの比べは、両方に公式の数字がある項目だけ(1 つもなければ出さない。今のマウスが比べられない機種なら出さない)。理由の文は「形は公式の記載がありません」「重さは公式の記載がなく、…」の形で 3 文のまま。
8. **生産終了**:パッド 3 件(シデンカイ V2・G-SR・G-TR。公式ページに記載)。マウス・ソールは 0 件(同じ札を出せるように、型には `discontinued` を持つ)。ハヤテ乙 V2 は現行(生産終了は旧 V1 と甲)。
9. **名前の直し**:LGG の 2 件はブランドを「Pulsar」(名前は「eS Saturn Pro」「eS Jupiter Pro」。id は残す)、SkyPAD は「Wallhack」(全部 null で非表示なので画面には出ない)。Razer のパッドは名前の頭の「Razer 」を外す(ブランドと重ねない)。
10. **`devices.ts`**:マウスは 54 機種(名前は JSON にそろえる)+マイ設定・ソールの対応で使う旧 9 機種を残す。パッドは画面に出す 41 件(名前は生成した `PADS` にそろえる)+既にあった `vaxee-pa` を残す(非表示の残り 6 件は足さない)。マイ設定でも同じ名前で選べる。
11. **`/skates` のマイ設定は、この端末の保存だけを読む**(ログインしている人のサーバーの設定は読まない。Supabase の JS を足さないため)。URL にマウスの指定がまったくないときだけ、`?mouse=<id>&from=my` に置き換え、「マイ設定のマウスで絞り込みました」と出す。
12. **ソールの結び付け**:「このマウス専用」は `mouseIds` に入っているもの。「どのマウスにも使える汎用のドット」は `shape = "dot"` かつ `mouseIds` が空のもの。結び付けを保留した専用品(Pulsar X2 用・EC-W 用など)は、マウスを選ばない一覧にだけ出る。マウスを選ぶ欄の候補は `devices.ts` のマウスすべて(専用のソールがあるものを先に、件数つき)。
13. **`loading.tsx` は足さない**(`/pads` `/skates` とも)。データはメモリの中の定数で待ち時間がほぼなく、足すと絞り込みを押すたびにスケルトンに切り替わる。404 の意味は変えない(どちらも `notFound()` を使わない。想定外の `?…` は「すべて」)。
14. **パッド・ソールの楽天は検索リンク**(商品のスナップショットはマウスだけ。楽天の API は呼ばない)。Amazon は「メーカー 名前」で探す検索リンク。
15. **SubNav** は「マウス探し・マウスパッド・ソール・感度計算(・プロ設定)」。`aria-label` は今の「感度・マウス」のまま(ほかのページを触らないため)。
16. **生成スクリプトは TypeScript**(`scripts/gear-data.ts`。Node 24 は型を取り除いてそのまま動かす)。純粋な変換の関数を export し、Vitest が同じ関数で「生成物が JSON と合っているか」を確かめる。
17. **`/mouse` の 54 機種への広げ(Task 4)は、`/mouse` がサーバーで行を作る形(Task 3)のあと**に置く。先に広げると、54 機種の出典の文・メモがブラウザの JS に入るため(依頼の「データが先」からの並べ替え。パッド・ソールのデータは Task 1 で先に入れる)。
18. **プロ設定の行(`ProCard`)**は機種データ本体ではなく、生成した `MICE_IDS`(id だけ)で「マウス探しにあるか」を見る(`/tools/sensitivity` と `/pros` の JS に機種データを入れない)。

## ファイルの地図

- データ(生成):`scripts/gear-data.ts`(新)→ `src/data/pads.ts` `src/data/skates.ts`(新・Task 1)、`src/data/mice.ts`(作り直し)`src/data/mice-ids.ts`(新・Task 4)。型は `src/data/gear-types.ts`(新・手で書く)
- データ(手で):`src/data/devices.ts`(パッドは Task 1、マウスは Task 4)
- 純粋な関数:`src/lib/mouse-fit.ts` `src/lib/mouse-reason.ts`(null 対応・Task 2)、`src/lib/gear-labels.ts` `src/lib/gear-popularity.ts`(新・Task 2)、`src/lib/mouse-rows.ts`(新・Task 3)、`src/lib/gear-query.ts` `src/lib/pad-filter.ts` `src/lib/skate-match.ts` `src/lib/my-mouse.ts`(新・Task 5)、`src/lib/nav.ts`(Task 8)
- 部品:`src/components/gear/ShopButtons.tsx`(新・Task 3)、`src/components/mouse/OtherMiceList.tsx`(新・Task 3)、`src/components/ui/chip-style.ts` `chip-link.tsx`(新・Task 6)、`src/components/gear/FilterGroup.tsx` `PadRow.tsx`(新・Task 6)、`SkateRow.tsx` `MyMousePreselect.tsx`(新・Task 7)、`src/components/ui/badge.tsx`(`status` を足す・Task 6)、`chip-button.tsx`(クラスを `chip-style.ts` から読む・Task 6)、`src/components/mouse/{MouseCard,TopMouseRow,HandSetup}.tsx`、`src/components/pros/ProCard.tsx`
- 画面:`src/app/mouse/{page,MouseClient}.tsx`、`src/app/pads/page.tsx`(新)、`src/app/skates/page.tsx`(新)
- 道具:`scripts/page-js.mjs`(新・Task 1)
- テスト:`tests/data/gear.test.ts` `gear-generated.test.ts` `gear-boundary.test.ts`(新)、`tests/data/mice.test.ts`(書き直し)、`tests/lib/gear-labels.test.ts` `gear-popularity.test.ts` `mouse-rows.test.ts` `gear-query.test.ts` `pad-filter.test.ts` `skate-match.test.ts` `my-mouse.test.ts`(新)、`tests/lib/mouse-fit.test.ts` `mouse-reason.test.ts` `nav.test.ts`(追記)
- 記録:`docs/design/js-budget.md`、`docs/design/score/{mouse,pads,skates}.md`、`plan.md`

**タスクの順番:** 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9。Task 1・2・5 はデータと純粋な関数だけ。Task 3・4・6・7・8 は画面(4 つの確認+JS+ブラウザ)。Task 9 は採点と監査。

---

### Task 1: 生成スクリプト・型・マウスパッドとソールのデータ

**Files:**
- Create: `scripts/page-js.mjs`、`scripts/gear-data.ts`、`src/data/gear-types.ts`、`src/data/pads.ts`(生成)、`src/data/skates.ts`(生成)、`tests/data/gear.test.ts`、`tests/data/gear-generated.test.ts`
- Modify: `src/data/devices.ts`(マウスパッドの段)、`docs/design/js-budget.md`(基準の行)

**Interfaces:**
- Consumes: `docs/content/gear/pads.json`(`{ meta, pads: [...] }`)、`docs/content/gear/skates.json`(`{ schema, checkedAt, description, fields, items: [...] }`)、`src/data/devices.ts` の `DEVICES`
- Produces:
  - `src/data/gear-types.ts`:`MouseShape` `MouseConnection` `PadSurface` `PadSize` `PadSpec` `SkateMaterial` `SkateShape` `SkateSpec`(下の全文)
  - `src/data/pads.ts`:`export const PADS: PadSpec[]`(48 件・JSON の順)、型の再 export
  - `src/data/skates.ts`:`export const SKATES: SkateSpec[]`(58 件・JSON の順)、型の再 export
  - `scripts/gear-data.ts`:`toPadSpecs(raw)` `toSkateSpecs(raw)` `renderPadsTs(raw)` `renderSkatesTs(raw)` `TARGETS: { out: string; render: () => string }[]` `PAD_RENAMES` `DISCONTINUED_PADS` `DISCONTINUED_SKATES`
  - `scripts/page-js.mjs`:`node scripts/page-js.mjs <route...>` で合計とページごとの gzip KB を出す

- [ ] **Step 0: JS の基準を測る(何も変える前)**

`scripts/page-js.mjs` を作る:

```js
// ページごとに読む JS(gzip)を測る。`npm run build` のあとに PowerShell で: node scripts/page-js.mjs / /terms /mouse
// 数え方は docs/design/js-budget.md と同じ(client reference manifest の entryJSFiles + rootMainFiles・polyfill の gzip の合計)。
// 1 行目の「合計」は .next/static/chunks の .js をすべて gzip した合計(js-budget.md の「合計」の列)。
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

const NEXT = path.resolve(".next");
const build = JSON.parse(fs.readFileSync(path.join(NEXT, "build-manifest.json"), "utf8"));
const gz = (file) => zlib.gzipSync(fs.readFileSync(path.join(NEXT, file))).length;

let total = 0;
(function walk(dir) {
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) walk(p);
    else if (f.endsWith(".js")) total += zlib.gzipSync(fs.readFileSync(p)).length;
  }
})(path.join(NEXT, "static", "chunks"));
console.log(`合計(gzip)\t${(total / 1024).toFixed(1)} KB`);

for (const route of process.argv.slice(2)) {
  const file = path.join(NEXT, "server", "app", route === "/" ? "" : route, "page_client-reference-manifest.js");
  if (!fs.existsSync(file)) {
    console.log(`${route}\t(ページなし)`);
    continue;
  }
  globalThis.__RSC_MANIFEST = {};
  new Function(fs.readFileSync(file, "utf8"))();
  const manifest = Object.values(globalThis.__RSC_MANIFEST)[0];
  const files = new Set([...build.rootMainFiles, ...build.polyfillFiles, ...Object.values(manifest.entryJSFiles).flat()]);
  const kb = [...files].reduce((sum, f) => sum + gz(f), 0) / 1024;
  console.log(`${route}\t${kb.toFixed(1)} KB`);
}
```

Run(PowerShell):`Remove-Item -Recurse -Force .next; npm run build; node scripts/page-js.mjs / /terms /mouse /pads /skates /my /tools/sensitivity`
Expected:合計と各ページの KB が出る(`/pads` `/skates` は「(ページなし)」)。

`docs/design/js-budget.md` の表の一番下に 1 行足す:`| デバイスの広がりの前(基準) | <合計> | 0 | <コミット>。ページごと:/ …・/terms …・/mouse …・/my …・/tools/sensitivity … |`

- [ ] **Step 1: 型を書く**

`src/data/gear-types.ts`:

```ts
/**
 * マウス・マウスパッド・マウスソールの型。データは scripts/gear-data.ts が docs/content/gear/*.json から作る(手で直さない)。
 * 数字はメーカー公式の表記だけ。公式にないものは null(理由は note)。価格は持たない。
 */
export type MouseShape = "symmetric" | "right";
export type MouseConnection = "wired" | "wireless" | "both";

export type PadSurface = "cloth" | "hybrid" | "glass" | "hard" | "other";
/** 1 つのサイズ(公式の表記。widthMm = 横幅、depthMm = 奥行き、thicknessMm = 厚さ) */
export type PadSize = { label: string; widthMm: number | null; depthMm: number | null; thicknessMm: number | null };
export type PadSpec = {
  id: string;
  brand: string;
  name: string;
  surface: PadSurface | null;
  /** 滑り・止めの公式の言葉(そのまま。点数にしない) */
  speedOfficial: string | null;
  /** 硬さ違い(公式の呼び名) */
  firmnessVariants: string[];
  sizes: PadSize[];
  base: string | null;
  stitchedEdge: boolean | null;
  officialUrl: string | null;
  /** 確認した日(YYYY-MM-DD) */
  checkedAt: string;
  /** 人気の根拠(出典と順位) */
  selectionBasis: string;
  note: string;
  /** 公式の数字が 1 つもない(画面に出さない) */
  hidden: boolean;
  discontinued: boolean;
};

export type SkateMaterial = "PTFE" | "glass" | "ceramic" | "UPE" | "other";
export type SkateShape = "full" | "dot" | "other";
export type SkateSpec = {
  id: string;
  brand: string;
  line: string;
  name: string;
  /** 公式の対応マウスの表記(原文) */
  forMouse: string;
  /** 合うマウスの id(src/data/devices.ts)。汎用・結び付けを保留したものは空 */
  mouseIds: string[];
  material: SkateMaterial | null;
  materialOfficial: string | null;
  shape: SkateShape;
  /** 公式に 1 つの値で書かれているときだけ */
  thicknessMm: number | null;
  /** 厚さの公式の原文(幅の表記など) */
  thicknessOfficial: string | null;
  piecesPerPack: number | null;
  setsPerPack: number | null;
  extras: string[];
  officialUrl: string;
  checkedAt: string;
  selectionBasis: string;
  note: string;
  discontinued: boolean;
};
```

- [ ] **Step 2: 失敗するテストを書く(生成物が JSON と合っているか・データの決まり)**

`tests/data/gear-generated.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { TARGETS } from "../../scripts/gear-data";

const norm = (s: string) => s.replace(/\r\n/g, "\n");

describe("生成した src/data の .ts が docs/content/gear の JSON と合っている(作り直し忘れがない)", () => {
  it.each(TARGETS.map((t) => [t.out, t] as const))("%s", (out, t) => {
    expect(norm(readFileSync(out, "utf8"))).toBe(t.render());
  });
});
```

`tests/data/gear.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { PADS } from "@/data/pads";
import { SKATES } from "@/data/skates";
import { DEVICES } from "@/data/devices";

const isDate = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(`${s}T00:00:00Z`));
const onHost = (url: string, hosts: readonly string[]) => {
  const u = new URL(url);
  return u.protocol === "https:" && hosts.some((h) => u.hostname === h || u.hostname.endsWith(`.${h}`));
};
const PAD_HOSTS = ["artisan-jp.com", "logicool.co.jp", "razer.com", "benq.com", "steelseries.com", "pulsar.gg", "x-raypad.com", "aim1.jp", "endgamegear.com", "corsair.com", "wallhack.com"];
const SKATE_HOSTS = ["esptiger.com", "corepad.de", "x-raypad.com", "pulsar.gg", "wallhack.com", "artisan-jp.com"];
const HIDDEN = ["dotandz-glimpse-beta", "elecom-gaming-pad-balance", "fnatic-jet", "hyperx-pulsefire-mat", "skypad-glass-3", "talongames-maya", "vaxee-pa"];

describe("マウスパッドのデータ", () => {
  it("48 件で id が重ならない", () => {
    expect(PADS).toHaveLength(48);
    expect(new Set(PADS.map((p) => p.id)).size).toBe(PADS.length);
  });
  it("公式の数字が 1 つもない 7 件だけ hidden(画面に出さない)", () => {
    expect(PADS.filter((p) => p.hidden).map((p) => p.id).sort()).toEqual([...HIDDEN].sort());
  });
  it("画面に出すものは https のメーカーのページと確認日を持つ", () => {
    for (const p of PADS) {
      expect(isDate(p.checkedAt), p.id).toBe(true);
      if (p.hidden) continue;
      expect(p.officialUrl, p.id).not.toBeNull();
      expect(onHost(p.officialUrl!, PAD_HOSTS), `${p.id}: ${p.officialUrl}`).toBe(true);
    }
  });
  it("生産終了は公式に書いてある 3 件", () => {
    expect(PADS.filter((p) => p.discontinued).map((p) => p.id).sort()).toEqual(["artisan-shidenkai", "zowie-g-sr", "zowie-g-tr"]);
  });
  it("大きさ・厚さは正の数か null(作った数字を入れない)", () => {
    for (const p of PADS) {
      for (const s of p.sizes) {
        for (const v of [s.widthMm, s.depthMm]) if (v !== null) expect(v, `${p.id} ${s.label}`).toBeGreaterThanOrEqual(200);
        for (const v of [s.widthMm, s.depthMm]) if (v !== null) expect(v, `${p.id} ${s.label}`).toBeLessThanOrEqual(1700);
        if (s.thicknessMm !== null) expect(s.thicknessMm, `${p.id} ${s.label}`).toBeGreaterThan(0);
        if (s.thicknessMm !== null) expect(s.thicknessMm, `${p.id} ${s.label}`).toBeLessThanOrEqual(10);
      }
    }
  });
  it("名前の直し:LGG は Pulsar、SkyPAD は Wallhack、Razer は名前にブランドを重ねない(id は残す)", () => {
    const byId = (id: string) => PADS.find((p) => p.id === id)!;
    expect([byId("lgg-saturn-pro").brand, byId("lgg-saturn-pro").name]).toEqual(["Pulsar", "eS Saturn Pro"]);
    expect([byId("lgg-jupiter").brand, byId("lgg-jupiter").name]).toEqual(["Pulsar", "eS Jupiter Pro"]);
    expect(byId("skypad-glass-3").brand).toBe("Wallhack");
    for (const p of PADS.filter((x) => x.brand === "Razer")) expect(p.name.startsWith("Razer "), p.id).toBe(false);
  });
  it("画面に出すパッドは devices.ts に同じ名前で入っている(マイ設定でも選べる)", () => {
    for (const p of PADS.filter((x) => !x.hidden)) {
      const d = DEVICES.find((x) => x.id === p.id);
      expect(d?.category, p.id).toBe("pad");
      expect(`${d?.brand} ${d?.name}`, p.id).toBe(`${p.brand} ${p.name}`);
    }
  });
});

describe("マウスソールのデータ", () => {
  it("58 件で id が重ならない", () => {
    expect(SKATES).toHaveLength(58);
    expect(new Set(SKATES.map((s) => s.id)).size).toBe(SKATES.length);
  });
  it("https のメーカーのページと確認日を持つ", () => {
    for (const s of SKATES) {
      expect(onHost(s.officialUrl, SKATE_HOSTS), `${s.id}: ${s.officialUrl}`).toBe(true);
      expect(isDate(s.checkedAt), s.id).toBe(true);
    }
  });
  it("合うマウスの id はすべて devices.ts のマウス", () => {
    for (const s of SKATES) {
      for (const id of s.mouseIds) expect(DEVICES.find((d) => d.id === id)?.category, `${s.id} → ${id}`).toBe("mouse");
    }
  });
  it("汎用のドットはマウスに結び付けない", () => {
    for (const s of SKATES.filter((x) => x.shape === "dot")) expect(s.mouseIds, s.id).toEqual([]);
  });
  it("厚さ・入数は正の数か null", () => {
    for (const s of SKATES) {
      if (s.thicknessMm !== null) expect(s.thicknessMm, s.id).toBeGreaterThan(0);
      if (s.thicknessMm !== null) expect(s.thicknessMm, s.id).toBeLessThan(3);
      for (const n of [s.piecesPerPack, s.setsPerPack]) if (n !== null) expect(Number.isInteger(n) && n > 0, s.id).toBe(true);
    }
  });
  it("生産終了は 0 件(公式に記載がない)", () => {
    expect(SKATES.filter((s) => s.discontinued)).toEqual([]);
  });
});
```

- [ ] **Step 3: テストが落ちるのを確かめる**

Run: `npx vitest run tests/data/gear.test.ts tests/data/gear-generated.test.ts`
Expected: FAIL(`@/data/pads` と `../../scripts/gear-data` が見つからない)

- [ ] **Step 4: 生成スクリプトを書く**

`scripts/gear-data.ts`:

```ts
/**
 * docs/content/gear/*.json(メーカー公式の数字・出典 URL・確認日つき)から、src/data の型付きの .ts を作る。
 * 使い方(リポジトリの一番上で): node scripts/gear-data.ts
 * JSON を直したら作り直し、JSON と .ts を一緒にコミットする。サイトの実行時には JSON を読まない(この .ts だけを import する)。
 * tests/data/gear-generated.test.ts が、同じ関数で作った文字と .ts を比べて「作り直し忘れ」を見つける。
 */
import { readFileSync, writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import type { PadSpec, PadSurface, SkateMaterial, SkateShape, SkateSpec } from "../src/data/gear-types";

const header = (src: string) =>
  `// scripts/gear-data.ts が ${src} から作る。手で直さない(JSON を直して \`node scripts/gear-data.ts\` で作り直す)。\n`;

/** 画面に出す名前の直し(id は残す)。設計書 2 章:LGG は Pulsar の後継(Pulsar eS)、SkyPAD は Wallhack。Razer は名前にブランドを重ねない */
export const PAD_RENAMES: Record<string, { brand?: string; name?: string }> = {
  "lgg-saturn-pro": { brand: "Pulsar" },
  "lgg-jupiter": { brand: "Pulsar" },
  "skypad-glass-3": { brand: "Wallhack" },
  "razer-gigantus-v2": { name: "Gigantus V2" },
  "razer-gigantus-v2-pro": { name: "Gigantus V2 Pro" },
  "razer-strider": { name: "Strider" },
  "razer-atlas": { name: "Atlas" },
};
/** 生産終了(docs/content/gear/pads-notes.md 4 章。公式ページに生産終了と書いてあるもの) */
export const DISCONTINUED_PADS: readonly string[] = ["artisan-shidenkai", "zowie-g-sr", "zowie-g-tr"];
/** ソールの生産終了(skates-notes.md に記載なし) */
export const DISCONTINUED_SKATES: readonly string[] = [];

const SURFACES: readonly PadSurface[] = ["cloth", "hybrid", "glass", "hard", "other"];
const MATERIALS: readonly SkateMaterial[] = ["PTFE", "glass", "ceramic", "UPE", "other"];
const SKATE_SHAPES: readonly SkateShape[] = ["full", "dot", "other"];

/** JSON の 1 件(JSON.parse の結果なので中身は確かめながら使う) */
type RawPad = {
  id: string; brand: string; name: string; surface: string | null; speedOfficial: string | null; firmnessVariants: string[];
  sizes: { label: string; widthMm: number | null; depthMm: number | null; thicknessMm: number | null }[];
  base: string | null; stitchedEdge: boolean | null; officialUrl: string | null; checkedAt: string; selectionBasis: string; notes: string;
};
type RawSkate = {
  id: string; brand: string; line: string; name: string; forMouse: string; mouseId: string | null; mouseIds: string[];
  material: string | null; materialOfficial: string | null; shape: string; thicknessMm: number | null; thicknessOfficial: string | null;
  piecesPerPack: number | null; setsPerPack: number | null; extras: string[]; officialUrl: string; checkedAt: string; selectionBasis: string; notes: string[];
};

/** 決まった値のどれかか null。それ以外はデータの間違いなので止める */
function oneOf<T extends string>(value: string | null, allowed: readonly T[], where: string): T | null {
  if (value === null) return null;
  if ((allowed as readonly string[]).includes(value)) return value as T;
  throw new Error(`${where}: 想定外の値 ${JSON.stringify(value)}`);
}

export function toPadSpecs(raw: { pads: RawPad[] }): PadSpec[] {
  return raw.pads.map((p) => {
    const rename = PAD_RENAMES[p.id] ?? {};
    return {
      id: p.id,
      brand: rename.brand ?? p.brand,
      name: rename.name ?? p.name,
      surface: oneOf(p.surface, SURFACES, `${p.id}.surface`),
      speedOfficial: p.speedOfficial,
      firmnessVariants: p.firmnessVariants,
      sizes: p.sizes.map((s) => ({ label: s.label, widthMm: s.widthMm, depthMm: s.depthMm, thicknessMm: s.thicknessMm })),
      base: p.base,
      stitchedEdge: p.stitchedEdge,
      officialUrl: p.officialUrl,
      checkedAt: p.checkedAt,
      selectionBasis: p.selectionBasis,
      note: p.notes,
      hidden: p.officialUrl === null && p.sizes.length === 0,
      discontinued: DISCONTINUED_PADS.includes(p.id),
    };
  });
}

export function toSkateSpecs(raw: { items: RawSkate[] }): SkateSpec[] {
  return raw.items.map((s) => {
    if (s.mouseId !== null && !s.mouseIds.includes(s.mouseId)) throw new Error(`${s.id}: mouseId が mouseIds に入っていない`);
    const shape = oneOf(s.shape, SKATE_SHAPES, `${s.id}.shape`);
    if (shape === null) throw new Error(`${s.id}: shape がない`);
    return {
      id: s.id,
      brand: s.brand,
      line: s.line,
      name: s.name,
      forMouse: s.forMouse,
      mouseIds: s.mouseIds,
      material: oneOf(s.material, MATERIALS, `${s.id}.material`),
      materialOfficial: s.materialOfficial,
      shape,
      thicknessMm: s.thicknessMm,
      thicknessOfficial: s.thicknessOfficial,
      piecesPerPack: s.piecesPerPack,
      setsPerPack: s.setsPerPack,
      extras: s.extras,
      officialUrl: s.officialUrl,
      checkedAt: s.checkedAt,
      selectionBasis: s.selectionBasis,
      note: s.notes.join(" / "),
      discontinued: DISCONTINUED_SKATES.includes(s.id),
    };
  });
}

/** 1 件を 1 行に(差分が読みやすい。JSON の書き方は TS としても正しい) */
function lines(items: readonly object[]): string {
  return items.map((x) => `  ${JSON.stringify(x)},`).join("\n");
}

export function renderPadsTs(raw: { pads: RawPad[] }): string {
  return `${header("docs/content/gear/pads.json")}import type { PadSpec } from "./gear-types";
export type { PadSize, PadSpec, PadSurface } from "./gear-types";

export const PADS: PadSpec[] = [
${lines(toPadSpecs(raw))}
];
`;
}

export function renderSkatesTs(raw: { items: RawSkate[] }): string {
  return `${header("docs/content/gear/skates.json")}import type { SkateSpec } from "./gear-types";
export type { SkateMaterial, SkateShape, SkateSpec } from "./gear-types";

export const SKATES: SkateSpec[] = [
${lines(toSkateSpecs(raw))}
];
`;
}

const readJson = (p: string) => JSON.parse(readFileSync(p, "utf8"));

/** 書き出すファイル(テストも同じ一覧を使う) */
export const TARGETS: { out: string; render: () => string }[] = [
  { out: "src/data/pads.ts", render: () => renderPadsTs(readJson("docs/content/gear/pads.json")) },
  { out: "src/data/skates.ts", render: () => renderSkatesTs(readJson("docs/content/gear/skates.json")) },
];

function main() {
  for (const t of TARGETS) {
    writeFileSync(t.out, t.render());
    console.log(`書き出した: ${t.out}`);
  }
}

// node scripts/gear-data.ts で動かしたときだけ書き出す(テストが import したときは書かない)
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
```

- [ ] **Step 5: 生成する**

Run: `node scripts/gear-data.ts`
Expected: `書き出した: src/data/pads.ts` と `書き出した: src/data/skates.ts`(Node の「型の取り除き」の注意が 1 行出ることがある。止まらなければよい)。`src/data/pads.ts` の先頭が生成のコメント、`export const PADS: PadSpec[] = [` のあとに 48 行あることを目で確かめる。

- [ ] **Step 6: `devices.ts` のマウスパッドの段を、画面に出す 41 件+既にあった `vaxee-pa` にする**

`src/data/devices.ts` の `// マウスパッド` から `// キーボード` の前までを、次に置き換える(名前は生成した `PADS` と同じ。並びは JSON の順):

```ts
  // マウスパッド(名前は src/data/pads.ts と同じ。tests/data/gear.test.ts が確かめる)
  { id: "artisan-zero", category: "pad", brand: "ARTISAN", name: "NINJA FX ゼロ(零)" },
  { id: "artisan-hien", category: "pad", brand: "ARTISAN", name: "NINJA FX ヒエン(飛燕)" },
  { id: "artisan-raiden", category: "pad", brand: "ARTISAN", name: "NINJA FX ライデン(雷電)" },
  { id: "artisan-shidenkai", category: "pad", brand: "ARTISAN", name: "NINJA FX シデンカイ V2(紫電改)" },
  { id: "artisan-type99", category: "pad", brand: "ARTISAN", name: "NINJA FX 99式" },
  { id: "artisan-hayate-otsu", category: "pad", brand: "ARTISAN", name: "NINJA FX ハヤテ乙 V2(疾風乙)" },
  { id: "artisan-key83", category: "pad", brand: "ARTISAN", name: "NINJA FX キ83" },
  { id: "logicool-g240", category: "pad", brand: "Logicool G", name: "G240 クロス ゲーミングマウスパッド" },
  { id: "logicool-g640", category: "pad", brand: "Logicool G", name: "G640 ラージ クロス ゲーミングマウスパッド" },
  { id: "logicool-g840", category: "pad", brand: "Logicool G", name: "G840 XL クロス ゲーミングマウスパッド" },
  { id: "logicool-g440", category: "pad", brand: "Logicool G", name: "G440 ハード ゲーミングマウスパッド" },
  { id: "logicool-g740", category: "pad", brand: "Logicool G", name: "G740 ラージ クロス ゲーミングマウスパッド(厚型)" },
  { id: "logicool-powerplay-2", category: "pad", brand: "Logicool G", name: "POWERPLAY 2 ワイヤレス充電システム" },
  { id: "razer-gigantus-v2", category: "pad", brand: "Razer", name: "Gigantus V2" },
  { id: "razer-gigantus-v2-pro", category: "pad", brand: "Razer", name: "Gigantus V2 Pro" },
  { id: "razer-strider", category: "pad", brand: "Razer", name: "Strider" },
  { id: "razer-atlas", category: "pad", brand: "Razer", name: "Atlas" },
  { id: "zowie-g-sr", category: "pad", brand: "ZOWIE", name: "G-SR" },
  { id: "zowie-g-sr-iii", category: "pad", brand: "ZOWIE", name: "G-SR III" },
  { id: "zowie-g-sr-se", category: "pad", brand: "ZOWIE", name: "G-SR-SE ROUGE II" },
  { id: "zowie-g-tr", category: "pad", brand: "ZOWIE", name: "G-TR" },
  { id: "steelseries-qck", category: "pad", brand: "SteelSeries", name: "QcK" },
  { id: "steelseries-qck-heavy", category: "pad", brand: "SteelSeries", name: "QcK Heavy" },
  { id: "steelseries-qck-performance", category: "pad", brand: "SteelSeries", name: "QcK Performance" },
  { id: "lgg-saturn-pro", category: "pad", brand: "Pulsar", name: "eS Saturn Pro" },
  { id: "lgg-jupiter", category: "pad", brand: "Pulsar", name: "eS Jupiter Pro" },
  { id: "pulsar-es-hyperion-pro", category: "pad", brand: "Pulsar", name: "eS Hyperion Pro" },
  { id: "pulsar-es-mercury-pro", category: "pad", brand: "Pulsar", name: "eS Mercury Pro" },
  { id: "pulsar-es-neptune-pro", category: "pad", brand: "Pulsar", name: "eS Neptune Pro" },
  { id: "pulsar-paraglide", category: "pad", brand: "Pulsar", name: "ParaGlide Mouse Pad (Medium Speed)" },
  { id: "pulsar-superglide3-glass", category: "pad", brand: "Pulsar", name: "Superglide3 Glass Mousepad - Type S" },
  { id: "xraypad-aqua-control-ii", category: "pad", brand: "X-raypad", name: "Aqua Control II" },
  { id: "xraypad-aqua-control-plus", category: "pad", brand: "X-raypad", name: "Aqua Control+" },
  { id: "aim1-kagero", category: "pad", brand: "AIM1", name: "陽炎 マウスパッド" },
  { id: "aim1-murakumo", category: "pad", brand: "AIM1", name: "叢雲 ガラスマウスパッド - MURAKUMO" },
  { id: "aim1-inazuma", category: "pad", brand: "AIM1", name: "電 マウスパッド" },
  { id: "endgame-gear-mpc450", category: "pad", brand: "Endgame Gear", name: "MPC450 CORDURA Gaming Mousepad" },
  { id: "endgame-gear-em-c", category: "pad", brand: "Endgame Gear", name: "EM-C Gaming Mousepad" },
  { id: "corsair-mm350-pro", category: "pad", brand: "Corsair", name: "MM350 PRO Premium Spill-Proof Cloth Gaming Mouse Pad – Extended XL" },
  { id: "wallhack-cr-005", category: "pad", brand: "Wallhack", name: "CR-005" },
  { id: "wallhack-sp-005", category: "pad", brand: "Wallhack", name: "SP-005" },
  // 公式の数字がなく /pads には出さないが、前から選べたので残す
  { id: "vaxee-pa", category: "pad", brand: "VAXEE", name: "PA" },
```

- [ ] **Step 7: テストが通るのを確かめる**

Run: `npx vitest run tests/data`
Expected: PASS(`devices.test.ts` `mice.test.ts` `mice-rakuten.test.ts` も今のまま通る)

- [ ] **Step 8: 4 つの確認と JS**

Run: `npx tsc --noEmit`、`npm run lint`、`npx vitest run`、`npm run build`
Expected: どれもエラー 0。続けて「JS の測り方」のコマンド。`/my` と `/tools/sensitivity` は `devices.ts` が増えた分だけ増える(目安 +0.6KB 以内。4.0KB を超えたらコントローラーに返す)。`js-budget.md` に `| Task 1(パッド・ソールのデータ) | … |` の行。

- [ ] **Step 9: コミット**

```bash
git add scripts/page-js.mjs scripts/gear-data.ts src/data/gear-types.ts src/data/pads.ts src/data/skates.ts src/data/devices.ts tests/data/gear.test.ts tests/data/gear-generated.test.ts docs/design/js-budget.md
git -c user.name=pitos -c user.email=pito.shinzin@gmail.com commit -m "feat: マウスパッド 48・ソール 58 のデータを JSON から生成(生成スクリプト・型・テスト)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: 公式にない数字に強い計算と表示の言葉(純粋な関数)

**Files:**
- Create: `src/lib/gear-labels.ts`、`src/lib/gear-popularity.ts`、`tests/lib/gear-labels.test.ts`、`tests/lib/gear-popularity.test.ts`
- Modify: `src/lib/mouse-fit.ts`(全体)、`src/lib/mouse-reason.ts`(型・形・重さ・接続・比べ)、`tests/lib/mouse-fit.test.ts`(見本の作り方と追記)、`tests/lib/mouse-reason.test.ts`(見本の作り方と追記)、`src/components/mouse/MouseCard.tsx`(寸法・形・接続の表示)、`src/components/mouse/TopMouseRow.tsx`(重さの表示)

**Interfaces:**
- Consumes: `MouseShape` `MouseConnection` `PadSurface` `SkateMaterial` `SkateShape`(Task 1 の `src/data/gear-types.ts`)、`PADS`(Task 1。人気の順のテストだけ)
- Produces:
  - `src/lib/mouse-fit.ts`:`type FitMouse = { id: string; lengthMm: number; widthMm: number; heightMm: number | null; weightG: number | null; shape: MouseShape | null; connection: MouseConnection | null }`、`type CompareMouse = { id: string; lengthMm: number | null; widthMm: number | null; heightMm: number | null; weightG: number | null }`、`type Ranked<M extends FitMouse = FitMouse>`、`isFitMouse<M>(m): m is M & { lengthMm: number; widthMm: number }`、`rankMice<M extends FitMouse>(h, mice: readonly M[]): Ranked<M>[]`、`applyFilter<M extends FitMouse>(list: readonly Ranked<M>[], f): Ranked<M>[]`、`compareWith(current: CompareMouse, m: CompareMouse): string | null`(ほかの export は今のまま)
  - `src/lib/mouse-reason.ts`:`recommendReason(hand, target, mouse: FitMouse, current?: CompareMouse | null): string`、`compareClause(current: CompareMouse, m: CompareMouse): string`
  - `src/lib/gear-labels.ts`:`NO_DATA` `shapeLabel` `connectionLabel` `surfaceLabel` `materialLabel` `SURFACE_LABEL` `SKATE_MATERIAL_LABEL` `SKATE_SHAPE_LABEL` `withUnit(n, "mm" | "g")` `packText(pieces, sets)` `padSizeText(w, d)` `skateThicknessText(mm, official)`
  - `src/lib/gear-popularity.ts`:`bestRank(basis: string): number | null`、`byPopularity<T extends { selectionBasis: string }>(items: readonly T[]): T[]`、`POPULARITY_NOTE: string`

- [ ] **Step 1: 失敗するテストを書く(言葉と人気の順)**

`tests/lib/gear-labels.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { NO_DATA, connectionLabel, materialLabel, packText, padSizeText, shapeLabel, skateThicknessText, surfaceLabel, withUnit } from "@/lib/gear-labels";

describe("gear-labels", () => {
  it("形・接続(null は公式の記載なし)", () => {
    expect(NO_DATA).toBe("公式の記載なし");
    expect(shapeLabel("symmetric")).toBe("左右対称");
    expect(shapeLabel("right")).toBe("右手用");
    expect(shapeLabel(null)).toBe(NO_DATA);
    expect(connectionLabel("wired")).toBe("有線");
    expect(connectionLabel("wireless")).toBe("無線");
    expect(connectionLabel("both")).toBe("有線・無線");
    expect(connectionLabel(null)).toBe(NO_DATA);
  });
  it("面・素材", () => {
    expect(surfaceLabel("cloth")).toBe("布");
    expect(surfaceLabel("glass")).toBe("ガラス");
    expect(surfaceLabel(null)).toBe(NO_DATA);
    expect(materialLabel("UPE")).toBe("UPE(超高分子量ポリエチレン)");
    expect(materialLabel(null)).toBe(NO_DATA);
  });
  it("数字+単位は公式の表記のまま(丸めない)、null は記載なし", () => {
    expect(withUnit(62.15, "mm")).toBe("62.15mm");
    expect(withUnit(60, "g")).toBe("60g");
    expect(withUnit(null, "g")).toBe(NO_DATA);
  });
  it("入数", () => {
    expect(packText(8, 2)).toBe("2 セット(8 枚)");
    expect(packText(null, 2)).toBe("2 セット");
    expect(packText(8, null)).toBe("8 枚");
    expect(packText(null, null)).toBe(NO_DATA);
  });
  it("パッドの大きさ(片方でもなければ記載なし)", () => {
    expect(padSizeText(490, 420)).toBe("490×420mm");
    expect(padSizeText(null, 420)).toBe(NO_DATA);
  });
  it("ソールの厚さ:1 つの数字は mm、幅の表記は公式の原文のまま", () => {
    expect(skateThicknessText(0.8, null)).toBe("0.8mm");
    expect(skateThicknessText(null, "a thickness ranging from 0.7 to 0.8mm")).toBe("a thickness ranging from 0.7 to 0.8mm");
    expect(skateThicknessText(null, null)).toBe(NO_DATA);
  });
});
```

`tests/lib/gear-popularity.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { bestRank, byPopularity } from "@/lib/gear-popularity";
import { PADS } from "@/data/pads";

describe("bestRank", () => {
  it("売れ筋のいちばん高い順位を読む(URL の中の数字は読まない)", () => {
    expect(bestRank("Amazon.co.jp 売れ筋ランキング(https://www.amazon.co.jp/gp/bestsellers/computers/8417538051 、2026-10-03 取得) 15位(NINJA FX ゼロ SOFT XXL)/ 価格.com マウスパッド人気ランキング 2026年9月 3位(ゼロ XL)ほか")).toBe(3);
    expect(bestRank("Amazon.co.jp 売れ筋ランキング 32位(99式 XSOFT L)・41位(99式 SOFT XXL)")).toBe(32);
  });
  it("プロ使用率は数えない", () => {
    expect(bestRank("Amazon.co.jp 11位 / ProSettings.net プロ使用率 1位(2026-10-03 取得)")).toBe(11);
    expect(bestRank("ProSettings.net プロ使用率 3位")).toBeNull();
  });
  it("順位がなければ null", () => {
    expect(bestRank("ランキング上位には無いが、主要ブランドの定番として CEO 確認用に追加(編集判断)")).toBeNull();
    expect(bestRank("src/data/devices.ts に既に登録済み(category: pad)")).toBeNull();
    expect(bestRank("")).toBeNull();
  });
});

describe("byPopularity", () => {
  it("順位の高い順・順位なしは後ろ・同じならもとの並び", () => {
    const items = [
      { id: "a", selectionBasis: "編集判断" },
      { id: "b", selectionBasis: "Amazon 5位" },
      { id: "c", selectionBasis: "価格.com 2位" },
      { id: "d", selectionBasis: "" },
      { id: "e", selectionBasis: "Amazon 2位" },
    ];
    expect(byPopularity(items).map((x) => x.id)).toEqual(["c", "e", "b", "a", "d"]);
  });
  it("もとの配列は変えない", () => {
    const items = [{ selectionBasis: "9位" }, { selectionBasis: "1位" }];
    byPopularity(items);
    expect(items[0].selectionBasis).toBe("9位");
  });
  it("本物のデータ:画面に出すパッドの先頭は Amazon 1 位の G240", () => {
    expect(byPopularity(PADS.filter((p) => !p.hidden))[0].id).toBe("logicool-g240");
  });
});
```

- [ ] **Step 2: テストが落ちるのを確かめる**

Run: `npx vitest run tests/lib/gear-labels.test.ts tests/lib/gear-popularity.test.ts`
Expected: FAIL(モジュールが見つからない)

- [ ] **Step 3: 言葉と人気の順を書く**

`src/lib/gear-labels.ts`:

```ts
import type { MouseConnection, MouseShape, PadSurface, SkateMaterial, SkateShape } from "@/data/gear-types";

/** 公式に数字・言葉がないとき(作らない。空欄の代わりにこの言葉を出す) */
export const NO_DATA = "公式の記載なし";

const SHAPE: Record<MouseShape, string> = { symmetric: "左右対称", right: "右手用" };
const CONNECTION: Record<MouseConnection, string> = { wired: "有線", wireless: "無線", both: "有線・無線" };
export const SURFACE_LABEL: Record<PadSurface, string> = { cloth: "布", hybrid: "ハイブリッド", glass: "ガラス", hard: "ハード", other: "その他" };
export const SKATE_MATERIAL_LABEL: Record<SkateMaterial, string> = {
  PTFE: "PTFE", glass: "ガラス", ceramic: "セラミック", UPE: "UPE(超高分子量ポリエチレン)", other: "その他",
};
export const SKATE_SHAPE_LABEL: Record<SkateShape, string> = { full: "機種専用の形", dot: "汎用のドット", other: "その他の形" };

export const shapeLabel = (s: MouseShape | null): string => (s === null ? NO_DATA : SHAPE[s]);
export const connectionLabel = (c: MouseConnection | null): string => (c === null ? NO_DATA : CONNECTION[c]);
export const surfaceLabel = (s: PadSurface | null): string => (s === null ? NO_DATA : SURFACE_LABEL[s]);
export const materialLabel = (m: SkateMaterial | null): string => (m === null ? NO_DATA : SKATE_MATERIAL_LABEL[m]);

/** 数字+単位。公式の表記のまま(丸めない)。null は NO_DATA */
export function withUnit(n: number | null, unit: "mm" | "g"): string {
  return n === null ? NO_DATA : `${n}${unit}`;
}

/** ソールの入数(粒・枚の数とセット数。公式に書いてあるものだけ) */
export function packText(pieces: number | null, sets: number | null): string {
  if (pieces !== null && sets !== null) return `${sets} セット(${pieces} 枚)`;
  if (sets !== null) return `${sets} セット`;
  if (pieces !== null) return `${pieces} 枚`;
  return NO_DATA;
}

/** パッドの幅×奥行き(片方でもなければ NO_DATA) */
export function padSizeText(widthMm: number | null, depthMm: number | null): string {
  return widthMm === null || depthMm === null ? NO_DATA : `${widthMm}×${depthMm}mm`;
}

/** ソールの厚さ:公式に 1 つの数字があるときだけ mm。幅の表記などは公式の原文のまま */
export function skateThicknessText(mm: number | null, official: string | null): string {
  if (mm !== null) return `${mm}mm`;
  return official ?? NO_DATA;
}
```

`src/lib/gear-popularity.ts`:

```ts
/**
 * 人気の順(設計書 3-2)。selectionBasis(出典と順位の文)から、売れ筋ランキングのいちばん高い順位を読む。
 * ProSettings.net のプロ使用率は「選ぶときの参考」なので数えない(docs/content/gear/mice-notes.md)。URL の中の数字は読まない。
 */
export function bestRank(basis: string): number | null {
  const text = basis.replace(/https?:\/\/\S+/g, "");
  let best: number | null = null;
  for (const segment of text.split("/")) {
    if (segment.includes("プロ使用率")) continue;
    for (const m of segment.matchAll(/(\d+)\s*位/g)) {
      const n = Number(m[1]);
      if (n >= 1 && (best === null || n < best)) best = n;
    }
  }
  return best;
}

/** 順位の高い順。順位のないものは後ろ。同じならもとの並び(データの順)。もとの配列は変えない。 */
export function byPopularity<T extends { selectionBasis: string }>(items: readonly T[]): T[] {
  return items
    .map((item, index) => ({ item, index, rank: bestRank(item.selectionBasis) }))
    .sort((a, b) => {
      if (a.rank !== b.rank) {
        if (a.rank === null) return 1;
        if (b.rank === null) return -1;
        return a.rank - b.rank;
      }
      return a.index - b.index;
    })
    .map((x) => x.item);
}

/** 画面の下に出す、並びの根拠の 1 行 */
export const POPULARITY_NOTE =
  "並びは、Amazon.co.jp・価格.com などの売れ筋ランキング(2026-10-03 取得)で、いちばん高い順位の順です。順位が載っていないものは後ろにあります。";
```

- [ ] **Step 4: 言葉と人気の順のテストが通るのを確かめる**

Run: `npx vitest run tests/lib/gear-labels.test.ts tests/lib/gear-popularity.test.ts`
Expected: PASS

- [ ] **Step 5: 合う順・理由の文のテストを、null に強い形へ書き足す(失敗する)**

`tests/lib/mouse-fit.test.ts` の 2 行目と見本の作り方を置き換える:

```ts
import type { FitMouse } from "@/lib/mouse-fit";
import {
  applyFilter, compareWith, DEFAULT_HAND_LENGTH_CM, fitDistance, fitScore, fitTarget, handFrom, isFitMouse, NO_FILTER, previewHand, rankMice, targetText,
} from "@/lib/mouse-fit";

const m = (id: string, lengthMm: number, widthMm: number, weightG: number, extra: Partial<FitMouse> = {}): FitMouse => ({
  id, lengthMm, widthMm, heightMm: 38, weightG, shape: "symmetric", connection: "wireless", ...extra,
});
```

(元の `import type { MouseSpec } from "@/data/mice";` と元の `import { … } from "@/lib/mouse-fit";` と元の `const m = …` を消す。ほかのテストは今のまま。)ファイルの最後に足す:

```ts
describe("公式にない数字(null)", () => {
  const hand = { lengthCm: 18.5, widthCm: 9, grip: "palm" as const };
  it("isFitMouse は長さと幅がそろうときだけ true", () => {
    expect(isFitMouse({ lengthMm: 120, widthMm: 60 })).toBe(true);
    expect(isFitMouse({ lengthMm: null, widthMm: 60 })).toBe(false);
    expect(isFitMouse({ lengthMm: 120, widthMm: null })).toBe(false);
  });
  it("同じ距離なら重さのあるものが先、重さのないもの同士は id 順。距離は数のまま", () => {
    const list = rankMice(hand, [m("z-null", 118, 56, 0, { weightG: null }), m("a-null", 118, 56, 0, { weightG: null }), m("w", 118, 56, 80)]);
    expect(list.map((r) => r.mouse.id)).toEqual(["w", "a-null", "z-null"]);
    for (const r of list) expect(Number.isFinite(r.distance)).toBe(true);
  });
  it("重さのないものは重さの絞り込みで外れ、形のないものは形の絞り込みで外れる(すべてなら入る)", () => {
    const list = rankMice(hand, [m("nw", 118, 56, 0, { weightG: null }), m("ns", 120, 57, 50, { shape: null })]);
    expect(applyFilter(list, NO_FILTER).map((r) => r.mouse.id).sort()).toEqual(["ns", "nw"]);
    expect(applyFilter(list, { ...NO_FILTER, weight: "le70" }).map((r) => r.mouse.id)).toEqual(["ns"]);
    expect(applyFilter(list, { ...NO_FILTER, weight: "gt70" })).toEqual([]);
    expect(applyFilter(list, { ...NO_FILTER, shape: "symmetric" }).map((r) => r.mouse.id)).toEqual(["nw"]);
  });
  it("有線・無線(both)は、有線でも無線でも絞り込みに入る。接続のないものはどちらにも入らない", () => {
    const list = rankMice(hand, [m("both", 118, 56, 60, { connection: "both" }), m("none", 119, 56, 60, { connection: null })]);
    expect(applyFilter(list, { ...NO_FILTER, connection: "wired" }).map((r) => r.mouse.id)).toEqual(["both"]);
    expect(applyFilter(list, { ...NO_FILTER, connection: "wireless" }).map((r) => r.mouse.id)).toEqual(["both"]);
  });
  it("今のマウスとの比べは、両方に公式の数字がある項目だけ。1 つもなければ null", () => {
    const cur = m("cur", 125, 63.5, 60, { heightMm: 40 });
    expect(compareWith(cur, m("x", 130, 63.5, 0, { heightMm: null, weightG: null }))).toBe("今のマウスより 長さ +5mm・幅 ほぼ同じ");
    expect(compareWith(cur, m("y", 125.5, 63, 0, { heightMm: null, weightG: null }))).toBe("今のマウスと長さ・幅がほぼ同じ");
    expect(compareWith({ id: "n", lengthMm: null, widthMm: null, heightMm: null, weightG: null }, cur)).toBeNull();
  });
});
```

`tests/lib/mouse-reason.test.ts` の 1〜11 行目(import と見本の作り方)を置き換える:

```ts
import { describe, it, expect } from "vitest";
import { MICE } from "@/data/mice";
import { fitTarget, isFitMouse, type FitMouse, type Hand } from "@/lib/mouse-fit";
import { BANNED_WORDS, compareClause, recommendReason } from "@/lib/mouse-reason";
import { GRIPS } from "@/lib/my-settings";

const m = (lengthMm: number, widthMm: number, weightG: number, extra: Partial<FitMouse> = {}): FitMouse => ({
  id: "x", lengthMm, widthMm, heightMm: 38, weightG, shape: "symmetric", connection: "wireless", ...extra,
});
const palm: Hand = { lengthCm: 18.5, widthCm: null, grip: "palm" }; // 目安の長さ 118.4mm
const reason = (h: Hand & { estimated?: boolean }, mouse: FitMouse, current?: FitMouse | null) =>
  recommendReason(h, fitTarget(h), mouse, current);
```

同じファイルの「every mouse × grip × hand」のテストの `for (const mouse of MICE) {` を `for (const mouse of MICE.filter(isFitMouse)) {` にする。ファイルの最後に足す:

```ts
describe("公式にない数字(null)", () => {
  it("形がないときは「形は公式の記載がありません」", () => {
    expect(reason(palm, m(118, 60, 61, { shape: null }))).toContain("、形は公式の記載がありません。");
  });
  it("接続が有線・無線の両方のとき・重さがないとき", () => {
    expect(reason(palm, m(118, 60, 50, { connection: "both" }))).toMatch(/重さは 50g と軽く、素早い振り向き・細かい操作向きの、有線でも無線でも使えるタイプです。$/);
    expect(reason(palm, m(118, 60, 0, { weightG: null, connection: "both" }))).toMatch(/重さは公式の記載がなく、有線でも無線でも使えるタイプです。$/);
  });
  it("接続がないとき・重さも接続もないとき", () => {
    expect(reason(palm, m(118, 60, 80, { connection: null }))).toMatch(/重さは 80g と重めで、狙いを止めやすいマウスです。$/);
    expect(reason(palm, m(118, 60, 0, { weightG: null, connection: null }))).toMatch(/重さ・接続は公式の記載がありません。$/);
  });
  it("今のマウスとの比べは、両方にある数字だけ", () => {
    expect(compareClause(m(125, 60, 0, { weightG: null }), m(128, 60, 70))).toBe("今のマウスより 3mm 長いです。");
  });
  it("どの組み合わせでも 3 文で、null・NaN・undefined を書かない", () => {
    for (const shape of ["symmetric", "right", null] as const) {
      for (const connection of ["wired", "wireless", "both", null] as const) {
        for (const weightG of [50, 70, 90, null]) {
          const r = reason(palm, m(118, 60, 0, { shape, connection, weightG }));
          expect(r.split("。").filter(Boolean)).toHaveLength(3);
          expect(r).not.toMatch(/null|NaN|undefined/);
        }
      }
    }
  });
});
```

Run: `npx vitest run tests/lib/mouse-fit.test.ts tests/lib/mouse-reason.test.ts`
Expected: FAIL(`isFitMouse` がない・型 `FitMouse` がない・null の文が違う)

- [ ] **Step 6: `mouse-fit.ts` を null に強くする**

`src/lib/mouse-fit.ts` の 1〜2 行目の import を次にする:

```ts
import { MY_SETTINGS_LIMITS, type Grip, type MySettings } from "@/lib/my-settings";
import type { MouseConnection, MouseShape } from "@/data/gear-types";
```

`export type Ranked = …` と `export type MouseFilter = …` の 2 つを、次に置き換える:

```ts
/** 手に合う順に並べられるマウス(公式の長さと幅があるもの)。高さ・重さ・形・接続は公式にないことがある(null) */
export type FitMouse = {
  id: string;
  lengthMm: number;
  widthMm: number;
  heightMm: number | null;
  weightG: number | null;
  shape: MouseShape | null;
  connection: MouseConnection | null;
};
/** 今のマウスとの比べに使う数字(どれも公式にないことがある) */
export type CompareMouse = { id: string; lengthMm: number | null; widthMm: number | null; heightMm: number | null; weightG: number | null };
export type Ranked<M extends FitMouse = FitMouse> = { mouse: M; distance: number; score: number; reasons: string[] };
export type MouseFilter = {
  weight: "all" | "le55" | "le70" | "gt70";
  shape: "all" | MouseShape;
  /** both(有線・無線)のマウスは wired にも wireless にも入る */
  connection: "all" | "wired" | "wireless";
};
```

`fitDistance` の引数の型 `Pick<MouseSpec, "lengthMm" | "widthMm">` を `Pick<FitMouse, "lengthMm" | "widthMm">` にする。`rankMice` と `applyFilter` と `compareWith` を次に置き換え、`isFitMouse` と `nullLast` を `rankMice` の上に足す:

```ts
/** 公式の長さと幅があるか(ないものは順位に入れず「比べられません」へ) */
export function isFitMouse<M extends { lengthMm: number | null; widthMm: number | null }>(m: M): m is M & { lengthMm: number; widthMm: number } {
  return m.lengthMm !== null && m.widthMm !== null;
}

/** 小さい順。null は後ろ */
function nullLast(a: number | null, b: number | null): number {
  if (a === b) return 0;
  if (a === null) return 1;
  if (b === null) return -1;
  return a - b;
}

/** 目安に近い順(同じなら軽い順・重さが公式にないものは後ろ、それも同じなら id 順)。 */
export function rankMice<M extends FitMouse>(h: Hand, mice: readonly M[]): Ranked<M>[] {
  const t = fitTarget(h);
  return mice
    .map((mouse) => {
      const distance = fitDistance(t, mouse);
      const reasons = [REASON.length[verdict(mouse.lengthMm, t.lengthMm, RANGE_MM.length)]];
      if (t.widthMm !== null) reasons.push(REASON.width[verdict(mouse.widthMm, t.widthMm, RANGE_MM.width)]);
      return { mouse, distance, score: fitScore(distance), reasons };
    })
    .sort((a, b) => a.distance - b.distance || nullLast(a.mouse.weightG, b.mouse.weightG) || (a.mouse.id < b.mouse.id ? -1 : a.mouse.id > b.mouse.id ? 1 : 0));
}

/** 絞り込み(並び順は変えない)。重さ・形が公式にないものは、その絞り込みでは外れる。 */
export function applyFilter<M extends FitMouse>(list: readonly Ranked<M>[], f: MouseFilter): Ranked<M>[] {
  return list.filter(({ mouse: m }) => {
    if (f.weight !== "all") {
      if (m.weightG === null) return false;
      if (f.weight === "le55" && m.weightG > 55) return false;
      if (f.weight === "le70" && m.weightG > 70) return false;
      if (f.weight === "gt70" && m.weightG <= 70) return false;
    }
    if (f.shape !== "all" && m.shape !== f.shape) return false;
    if (f.connection !== "all" && m.connection !== f.connection && m.connection !== "both") return false;
    return true;
  });
}

/** 今のマウスとの差(両方に公式の数字がある項目だけ)。差の絶対値が 1 以下は「ほぼ同じ」。比べられる項目がなければ null。 */
export function compareWith(current: CompareMouse, m: CompareMouse): string | null {
  if (current.id === m.id) return "今使っているマウス";
  const all: [string, number | null, number | null, string][] = [
    ["長さ", m.lengthMm, current.lengthMm, "mm"],
    ["幅", m.widthMm, current.widthMm, "mm"],
    ["高さ", m.heightMm, current.heightMm, "mm"],
    ["重さ", m.weightG, current.weightG, "g"],
  ];
  const items: [string, number, string][] = [];
  for (const [label, a, b, unit] of all) if (a !== null && b !== null) items.push([label, a - b, unit]);
  if (items.length === 0) return null;
  if (items.every(([, d]) => Math.abs(d) <= 1)) {
    return items.length === all.length ? "今のマウスとほぼ同じ大きさ・重さ" : `今のマウスと${items.map(([label]) => label).join("・")}がほぼ同じ`;
  }
  const fmt = (d: number, unit: string) => {
    if (Math.abs(d) <= 1) return "ほぼ同じ";
    const v = round1(Math.abs(d));
    return `${d < 0 ? "−" : "+"}${Number.isInteger(v) ? v : v.toFixed(1)}${unit}`;
  };
  return "今のマウスより " + items.map(([label, d, unit]) => `${label} ${fmt(d, unit)}`).join("・");
}
```

(`import type { MouseSpec } from "@/data/mice";` は消す。`FIT_COEF` `RANGE_MM` `fitTarget` `targetText` `fitScore` `verdict` `REASON` `DEFAULT_HAND_LENGTH_CM` `handFrom` `previewHand` は今のまま。)

- [ ] **Step 7: `mouse-reason.ts` を null に強くする**

`src/lib/mouse-reason.ts` の import を次にする:

```ts
import type { Grip } from "@/lib/my-settings";
import type { MouseConnection, MouseShape } from "@/data/gear-types";
import { DEFAULT_HAND_LENGTH_CM, RANGE_MM, type CompareMouse, type FitMouse, type Hand, type Target } from "@/lib/mouse-fit";
```

`REASON_TEXT` の `shape:` と `connection:` の 2 つの項目を次に置き換える(ほかの項目は今のまま):

```ts
  /** 2 文目の終わり:形 */
  shape: {
    symmetric: "左右対称で持ち方を選ばない形です",
    right: "右手用(かぶせ・つかみ持ち向き)の形です",
  } as Record<MouseShape, string>,
  /** 形が公式にないとき */
  shapeUnknown: "形は公式の記載がありません",
```

```ts
  /** 3 文目の終わり:接続 */
  connection: {
    wireless: "ケーブルが引っかからない無線です",
    wired: "充電のいらない有線です",
    both: "有線でも無線でも使えるタイプです",
  } as Record<MouseConnection, string>,
  /** 重さ・接続が公式にないとき */
  weightUnknown: "重さは公式の記載がなく",
  connectionUnknownTail: "マウスです",
  noWeightNoConnection: "重さ・接続は公式の記載がありません",
```

`sizeSentence` `widthSentence` の引数の `m: MouseSpec` を `m: FitMouse` にする。`widthSentence` の最後の行を次にする:

```ts
  const shape = m.shape === null ? REASON_TEXT.shapeUnknown : REASON_TEXT.shape[m.shape];
  return `幅は ${num(m.widthMm)}mm と${part}、${shape}。`;
```

`weightSentence` と `compareClause` と `recommendReason` を次に置き換える:

```ts
function weightSentence(m: FitMouse): string {
  const T = REASON_TEXT;
  if (m.weightG === null) return m.connection === null ? `${T.noWeightNoConnection}。` : `${T.weightUnknown}、${T.connection[m.connection]}。`;
  const { light, mid } = T.weightMax;
  const w = m.weightG <= light ? T.weight.light : m.weightG <= mid ? T.weight.mid : T.weight.heavy;
  return m.connection === null ? `${w(m.weightG)}${T.connectionUnknownTail}。` : `${w(m.weightG)}、${T.connection[m.connection]}。`;
}

/** 今のマウスとの比べ(長さ・幅・重さのうち、両方に公式の数字があるもの)。同じマウス・ほぼ同じなら空。 */
export function compareClause(current: CompareMouse, m: CompareMouse): string {
  if (current.id === m.id) return "";
  const all: [number | null, number | null, string, string, string][] = [
    [m.lengthMm, current.lengthMm, "mm", "短", "長"],
    [m.widthMm, current.widthMm, "mm", "細", "太"],
    [m.weightG, current.weightG, "g", "軽", "重"],
  ];
  const parts: { v: string; stem: string }[] = [];
  for (const [a, b, unit, less, more] of all) {
    if (a === null || b === null) continue;
    const d = a - b;
    if (Math.abs(d) > REASON_TEXT.compareMin) parts.push({ v: `${num(Math.abs(d))}${unit}`, stem: d < 0 ? less : more });
  }
  if (parts.length === 0) return "";
  const body = parts.map((p, i) => `${p.v} ${p.stem}${i === parts.length - 1 ? "いです" : "く"}`).join("、");
  return `今のマウスより ${body}。`;
}

/**
 * 結果のカードに出す「おすすめの理由」(3 文 + 今のマウスとの比べ)。
 * 手の情報(持ち方・長さ・幅)とマウスの公式の数字だけから、決まった規則で作る。公式にない数字は「公式の記載がありません」と書く。
 */
export function recommendReason(
  hand: Hand & { estimated?: boolean },
  target: Target,
  mouse: FitMouse,
  current?: CompareMouse | null,
): string {
  const text = sizeSentence(hand, hand.estimated ?? false, target, mouse) + widthSentence(hand, target, mouse) + weightSentence(mouse);
  return current ? text + compareClause(current, mouse) : text;
}
```

(`import type { MouseSpec } from "@/data/mice";` は消す。)

- [ ] **Step 8: 結果のカードの表示を null に強くする**

`src/components/mouse/MouseCard.tsx`:`const SHAPE = …` と `const CONNECTION = …` の 2 行を消し、import に `import { connectionLabel, shapeLabel, withUnit } from "@/lib/gear-labels";` を足し、`const specs …` の行を次にする:

```tsx
  const specs: [string, string][] = [
    ["長さ", `${m.lengthMm}mm`], ["幅", `${m.widthMm}mm`], ["高さ", withUnit(m.heightMm, "mm")], ["重さ", withUnit(m.weightG, "g")],
    ["形", shapeLabel(m.shape)], ["接続", connectionLabel(m.connection)],
  ];
```

`src/components/mouse/TopMouseRow.tsx`:import に `import { NO_DATA } from "@/lib/gear-labels";` を足し、`<span>重さ <NumUnit value={m.weightG} unit="g" className="text-rl-title" /></span>` を次にする:

```tsx
          <span>重さ {m.weightG === null ? NO_DATA : <NumUnit value={m.weightG} unit="g" className="text-rl-title" />}</span>
```

- [ ] **Step 9: テストが通るのを確かめる**

Run: `npx vitest run tests/lib`
Expected: PASS(今ある `mouse-fit` `mouse-reason` のテストもそのまま通る)

- [ ] **Step 10: 4 つの確認**

Run: `npx tsc --noEmit`、`npm run lint`、`npx vitest run`、`npm run build`
Expected: どれもエラー 0(`MouseClient.tsx` は `rankMice(hand, MICE)` の型が推論で `Ranked<MouseSpec>` になるので、触らずに通る。通らないときは、`compareWith` の戻りが `string | null` になった所だけを `?? null` で合わせる)

- [ ] **Step 11: コミット**

```bash
git add src/lib/gear-labels.ts src/lib/gear-popularity.ts src/lib/mouse-fit.ts src/lib/mouse-reason.ts src/components/mouse/MouseCard.tsx src/components/mouse/TopMouseRow.tsx tests/lib/gear-labels.test.ts tests/lib/gear-popularity.test.ts tests/lib/mouse-fit.test.ts tests/lib/mouse-reason.test.ts
git -c user.name=pitos -c user.email=pito.shinzin@gmail.com commit -m "feat: 公式にない数字(null)に強い合う順・理由の文・表示の言葉と、人気の順

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: `/mouse` はサーバーで「行」を作って渡す(比べられない機種の段つき)

**Files:**
- Create: `src/lib/mouse-rows.ts`、`tests/lib/mouse-rows.test.ts`、`src/components/gear/ShopButtons.tsx`、`src/components/mouse/OtherMiceList.tsx`
- Modify: `src/app/mouse/page.tsx`、`src/app/mouse/MouseClient.tsx`(**読み直してから**)、`src/components/mouse/HandSetup.tsx`、`docs/design/js-budget.md`

**Interfaces:**
- Consumes: `isFitMouse` `rankMice` `FitMouse` `Ranked`(Task 2)、`byPopularity`(Task 2)、`shopLinks` `affiliateEnv` `ShopLinks` `AffiliateEnv`(`src/lib/shop-links.ts`)、`MICE`(今の 20 機種)、`DEVICES`、`MICE_RAKUTEN`
- Produces:
  - `src/lib/mouse-rows.ts`:`type MouseSource`(下)、`type NameLookup = (id: string) => { brand: string; name: string } | undefined`、`type MouseRow = FitMouse & { brand: string; name: string; links: ShopLinks; imageUrl: string | null; skateCount: number }`、`type OtherMouseRow = { id; brand; name; lengthMm: number | null; widthMm: number | null; heightMm; weightG; shape; connection; links; imageUrl; skateCount; missing: string[] }`、`toMouseRows(mice, names, rakuten, skateCounts?, env?): { comparable: MouseRow[]; other: OtherMouseRow[] }`
  - `MouseClient` の props:`{ pageUrl: string; mice: MouseRow[] }`
  - `HandSetup` の props に `mice: readonly (FitMouse & { name: string })[]` を足す
  - `ShopButtons({ links, primary?, className? })`(サーバーでもブラウザでも使える。hooks なし)
  - `OtherMiceList({ items: OtherMouseRow[] })`(サーバーの部品)

- [ ] **Step 1: 失敗するテストを書く**

`tests/lib/mouse-rows.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { toMouseRows, type MouseSource } from "@/lib/mouse-rows";

const src = (id: string, lengthMm: number | null, widthMm: number | null, extra: Partial<MouseSource> = {}): MouseSource => ({
  id, lengthMm, widthMm, heightMm: 40, weightG: 60, shape: "symmetric", connection: "wireless", officialUrl: `https://example.com/${id}`, ...extra,
});
const NAMES: Record<string, { brand: string; name: string }> = {
  a: { brand: "B", name: "Alpha" }, b: { brand: "B", name: "Beta" }, c: { brand: "C", name: "Gamma" }, d: { brand: "D", name: "Delta" },
};
const names = (id: string) => NAMES[id];

describe("toMouseRows", () => {
  it("長さと幅がそろうものは比べる行に、ないものは「比べられません」に(足りない項目つき)", () => {
    const { comparable, other } = toMouseRows([src("a", 120, 60), src("b", null, 60), src("c", 120, null), src("d", null, null)], names, {}, {}, {});
    expect(comparable.map((r) => r.id)).toEqual(["a"]);
    expect(other.map((r) => [r.id, r.missing])).toEqual([["b", ["長さ"]], ["c", ["幅"]], ["d", ["長さ", "幅"]]]);
  });
  it("devices.ts に名前がないものは出さない", () => {
    expect(toMouseRows([src("zzz", 120, 60)], names, {}, {}, {}).comparable).toEqual([]);
  });
  it("ブラウザへ送るのは表示に要る分だけ(出典の文・メモ・公式 URL の生の値を持たない)", () => {
    const [row] = toMouseRows([src("a", 120, 60, { selectionBasis: "Amazon 1位" })], names, {}, {}, {}).comparable;
    expect(Object.keys(row).sort()).toEqual(["brand", "connection", "heightMm", "id", "imageUrl", "lengthMm", "links", "name", "shape", "skateCount", "weightG", "widthMm"]);
  });
  it("店のリンクは「メーカー 名前」で探し、公式は出典の URL", () => {
    const [row] = toMouseRows([src("a", 120, 60)], names, {}, {}, {}).comparable;
    expect(new URL(row.links.amazon).searchParams.get("k")).toBe("B Alpha");
    expect(row.links.official).toBe("https://example.com/a");
    expect(row.links.amazonPr).toBe(false);
  });
  it("楽天の商品ページ(https の item.rakuten.co.jp)があるときだけ画像を使い、ソールの数を入れる", () => {
    const rakuten = {
      a: { itemUrl: "https://item.rakuten.co.jp/shop/a/", imageUrl: "https://thumbnail.image.rakuten.co.jp/a.jpg" },
      b: { itemUrl: "http://evil.example/b", imageUrl: "https://thumbnail.image.rakuten.co.jp/b.jpg" },
    };
    const { comparable } = toMouseRows([src("a", 120, 60), src("b", 120, 60)], names, rakuten, { a: 3 }, {});
    expect(comparable[0].imageUrl).toBe("https://thumbnail.image.rakuten.co.jp/a.jpg");
    expect(comparable[0].links.rakutenIsItem).toBe(true);
    expect(comparable[0].skateCount).toBe(3);
    expect(comparable[1].imageUrl).toBeNull();
    expect(comparable[1].links.rakutenIsItem).toBe(false);
    expect(comparable[1].skateCount).toBe(0);
  });
  it("比べる行はデータの順のまま、比べられない行は人気の順(順位のないものは後ろ)", () => {
    const { comparable, other } = toMouseRows(
      [src("c", 120, 60), src("a", 121, 60), src("b", null, null, { selectionBasis: "" }), src("d", null, null, { selectionBasis: "価格.com 2位" })],
      names, {}, {}, {},
    );
    expect(comparable.map((r) => r.id)).toEqual(["c", "a"]);
    expect(other.map((r) => r.id)).toEqual(["d", "b"]);
  });
});
```

Run: `npx vitest run tests/lib/mouse-rows.test.ts`
Expected: FAIL(`@/lib/mouse-rows` がない)

- [ ] **Step 2: `mouse-rows.ts` を書く**

```ts
import type { MouseConnection, MouseShape } from "@/data/gear-types";
import { byPopularity } from "@/lib/gear-popularity";
import { isFitMouse, type FitMouse } from "@/lib/mouse-fit";
import { affiliateEnv, shopLinks, type AffiliateEnv, type ShopLinks } from "@/lib/shop-links";

/** データの形(src/data/mice.ts の MouseSpec が当てはまる)。名前は devices.ts から引く */
export type MouseSource = {
  id: string;
  lengthMm: number | null;
  widthMm: number | null;
  heightMm: number | null;
  weightG: number | null;
  shape: MouseShape | null;
  connection: MouseConnection | null;
  officialUrl: string;
  /** 人気の根拠(ないときはデータの順) */
  selectionBasis?: string;
};
export type NameLookup = (id: string) => { brand: string; name: string } | undefined;
type RowExtras = { brand: string; name: string; links: ShopLinks; imageUrl: string | null; skateCount: number };
/** ブラウザへ送る行(表示に要る分だけ。出典の文・メモ・センサー名は送らない) */
export type MouseRow = FitMouse & RowExtras;
/** 公式の長さか幅がないマウス(順位に入れない。サーバーの部品で出す) */
export type OtherMouseRow = Omit<MouseSource, "officialUrl" | "selectionBasis"> & RowExtras & { missing: string[] };

/**
 * マウスのデータを、画面に出す行にする(サーバーで呼ぶ)。
 * 長さと幅がそろうものは合う順に並べる行(並びはデータのまま。ブラウザで手に合う順にする)、ないものは「比べられません」の行(人気の順)。
 */
export function toMouseRows(
  mice: readonly MouseSource[],
  names: NameLookup,
  rakuten: Readonly<Record<string, { itemUrl: string; imageUrl: string }>>,
  skateCounts: Readonly<Record<string, number>> = {},
  env: AffiliateEnv = affiliateEnv(),
): { comparable: MouseRow[]; other: OtherMouseRow[] } {
  const comparable: MouseRow[] = [];
  const others: { row: OtherMouseRow; selectionBasis: string }[] = [];
  for (const m of mice) {
    const n = names(m.id);
    if (!n) continue; // devices.ts にない(tests/data/mice.test.ts が 0 件を確かめる)
    const r = rakuten[m.id];
    const links = shopLinks(`${n.brand} ${n.name}`, m.officialUrl, env, r?.itemUrl);
    const extras: RowExtras = { brand: n.brand, name: n.name, links, imageUrl: r && links.rakutenIsItem ? r.imageUrl : null, skateCount: skateCounts[m.id] ?? 0 };
    const base = { id: m.id, heightMm: m.heightMm, weightG: m.weightG, shape: m.shape, connection: m.connection, ...extras };
    if (isFitMouse(m)) {
      comparable.push({ ...base, lengthMm: m.lengthMm, widthMm: m.widthMm });
    } else {
      const missing = [m.lengthMm === null ? "長さ" : null, m.widthMm === null ? "幅" : null].filter((x): x is string => x !== null);
      others.push({ row: { ...base, lengthMm: m.lengthMm, widthMm: m.widthMm, missing }, selectionBasis: m.selectionBasis ?? "" });
    }
  }
  return { comparable, other: byPopularity(others).map((o) => o.row) };
}
```

Run: `npx vitest run tests/lib/mouse-rows.test.ts`
Expected: PASS

- [ ] **Step 3: 店のボタンの部品と、比べられない機種の段を書く**

`src/components/gear/ShopButtons.tsx`:

```tsx
import { ExternalLink } from "lucide-react";
import type { ShopLinks } from "@/lib/shop-links";
import { ButtonAnchor } from "@/components/ui/button-link";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/**
 * 店(Amazon・楽天)と公式ページのリンク。店のリンクは広告(rel="sponsored")で、紹介料の設定があるときは PR を付ける。
 * primary は 1 画面に 1 つだけ(一覧の先頭だけ true)。hooks を使わないので、サーバーでもブラウザでも使える。
 */
export function ShopButtons({ links, primary = false, className }: { links: ShopLinks; primary?: boolean; className?: string }) {
  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {(links.amazonPr || links.rakutenPr) && <Badge variant="pr">PR</Badge>}
      <ButtonAnchor href={links.amazon} target="_blank" rel="sponsored noopener noreferrer" variant={primary ? "primary" : "secondary"} size={primary ? "md" : "sm"}>
        Amazon で探す<ExternalLink aria-hidden className="size-4" />
      </ButtonAnchor>
      <ButtonAnchor href={links.rakuten} target="_blank" rel="sponsored noopener noreferrer" variant="secondary" size="sm">
        {links.rakutenIsItem ? "楽天で見る" : "楽天で探す"}<ExternalLink aria-hidden className="size-4" />
      </ButtonAnchor>
      <ButtonAnchor href={links.official} target="_blank" rel="noopener noreferrer" variant="ghost" size="sm">
        公式ページ<ExternalLink aria-hidden className="size-4" />
      </ButtonAnchor>
    </div>
  );
}
```

`src/components/mouse/OtherMiceList.tsx`:

```tsx
import type { OtherMouseRow } from "@/lib/mouse-rows";
import { connectionLabel, shapeLabel, withUnit } from "@/lib/gear-labels";
import { SectionHeading } from "@/components/ui/section-heading";
import { ShopButtons } from "@/components/gear/ShopButtons";

/** 公式の長さか幅がないマウス(設計書 3-1)。手に合う順には入れず、わかっている公式の数字と店へのリンクだけを出す(人気の順)。 */
export function OtherMiceList({ items }: { items: OtherMouseRow[] }) {
  return (
    <section aria-labelledby="mouse-other" className="grid gap-4">
      <SectionHeading id="mouse-other" title="公式の大きさがないため比べられません" count={items.length}
        description="メーカー公式に長さか幅の数字がないマウスです。手に合う順には入れていません(人気の順)。" />
      <ul className="grid">
        {items.map((m) => (
          <li key={m.id} className="grid gap-4 border-t border-rl-line py-6 md:grid-cols-[minmax(0,1fr)_auto] md:items-center md:gap-6">
            <div className="grid min-w-0 gap-1">
              <p className="text-sm text-rl-muted">{m.brand}</p>
              <h3 data-long-name className="text-xl font-bold wrap-anywhere">{m.name}</h3>
              <p className="text-sm text-rl-muted">公式に数字がない項目:{m.missing.join("・")}</p>
              <dl className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-rl-muted">
                <div className="flex gap-1"><dt>重さ</dt><dd className="text-rl-text">{withUnit(m.weightG, "g")}</dd></div>
                <div className="flex gap-1"><dt>形</dt><dd className="text-rl-text">{shapeLabel(m.shape)}</dd></div>
                <div className="flex gap-1"><dt>接続</dt><dd className="text-rl-text">{connectionLabel(m.connection)}</dd></div>
              </dl>
            </div>
            <ShopButtons links={m.links} className="md:justify-end" />
          </li>
        ))}
      </ul>
    </section>
  );
}
```

- [ ] **Step 4: `page.tsx` でサーバーの行を作る**

`src/app/mouse/page.tsx` の import に足す:

```tsx
import { DEVICES } from "@/data/devices";
import { MICE } from "@/data/mice";
import { toMouseRows } from "@/lib/mouse-rows";
import { OtherMiceList } from "@/components/mouse/OtherMiceList";
```

`export default function MousePage() {` の次の行に足す:

```tsx
  // 表示に要る分だけの行にして渡す(機種のデータ本体・出典の文はブラウザの JS に入れない)
  const { comparable, other } = toMouseRows(MICE, (id) => DEVICES.find((d) => d.id === id), MICE_RAKUTEN);
```

`<MouseClient pageUrl={`${getSiteUrl()}/mouse`} />` を次にする:

```tsx
        <MouseClient pageUrl={`${getSiteUrl()}/mouse`} mice={comparable} />
        {other.length > 0 && <OtherMiceList items={other} />}
```

注意書きの `<p>` の 1 文目「大きさ・重さは各メーカー公式サイトの表記です(確認日はデータに記録)。」のあとに「公式に数字がない項目は「公式の記載なし」と出します。」を足す。

- [ ] **Step 5: `HandSetup` はマウスを props で受け取る**

`src/components/mouse/HandSetup.tsx`:`import { DEVICES } from "@/data/devices";` と `import { MICE } from "@/data/mice";` を消し、`import { previewHand, rankMice } from "@/lib/mouse-fit";` を `import { previewHand, rankMice, type FitMouse } from "@/lib/mouse-fit";` にする。props の型に `mice` を足す:

```tsx
export function HandSetup({ initial, onDone, onCancel, mice }: {
  initial: Hand;
  onDone: (hand: Hand, saved: boolean) => void;
  /** 渡されたときだけ「変えずに戻る」を出す */
  onCancel?: () => void;
  /** 見本の重ね図に使うマウス(サーバーで作った行。名前つき) */
  mice: readonly (FitMouse & { name: string })[];
}) {
```

見本の 2 行を次にする:

```tsx
  const top = rankMice(preview.hand, mice)[0]?.mouse;
  const topName = top?.name ?? "";
```

- [ ] **Step 6: `MouseClient` はサーバーの行を使う(読み直してから置き換え)**

`src/app/mouse/MouseClient.tsx` を読み直す。そのうえで:
1. import から `DEVICES`・`MICE`・`mouseById`・`MICE_RAKUTEN`・`shopLinks` の行を消す。`import type { MouseRow } from "@/lib/mouse-rows";` を足す。
2. `const device = (id: string) => DEVICES.find((d) => d.id === id);` の行を消す。
3. `export function MouseClient({ pageUrl }: { pageUrl: string }) {` を `export function MouseClient({ pageUrl, mice }: { pageUrl: string; mice: MouseRow[] }) {` にする。
4. `rankMice(hand, MICE)` を `rankMice(hand, mice)` にする。
5. `const currentMouse = …` の行を次にする(今のマウスが比べられない機種なら比べない):
   ```tsx
   const currentMouse = currentRef && "id" in currentRef ? mice.find((m) => m.id === currentRef.id) ?? null : null;
   ```
6. ファイルの中の **すべての** `<HandSetup` に `mice={mice}` を足す(見えない高さ取りの `pendingView` の中の `<HandSetup initial={emptyMySettings().hand} onDone={() => {}} />` も含む)。
7. `const top3 = …` と `const shareUrl = …` を次にする:
   ```tsx
   const top3 = ranked.slice(0, 3).map((r) => ({ brand: r.mouse.brand, name: r.mouse.name }));
   const shareUrl = buildXShareUrl(buildMouseShareText(top3), pageUrl);
   ```
8. `const overlayName = overlay ? (device(overlay.id)?.name ?? "") : "";` を `const overlayName = overlay?.name ?? "";` にする。
9. `{shown.map((item) => { … })}` の中身を次にする:
   ```tsx
            {shown.map((item) => {
              const m = item.mouse;
              const rank = ranked.indexOf(item) + 1;
              const reason = recommendReason({ ...hand, estimated }, target, m, null);
              const compare = currentMouse ? compareWith(currentMouse, m) : null;
              const overlaid = overlay?.id === m.id;
              const onOverlay = () => { setOverlayId(m.id); requestAnimationFrame(revealFitFigure); };
              // 追補 6 章:一覧の先頭は大きな行(主ボタンはここ。絞り込みで 1 位が外れても先頭が持つ)。2 番目からはカード(店のボタンは二番手)
              if (item === shown[0]) return <TopMouseRow key={m.id} rank={rank} item={item} brand={m.brand} name={m.name} reason={reason} links={m.links} compare={compare} overlaid={overlaid} onOverlay={onOverlay} />;
              return (
                <MouseCard key={m.id} rank={rank} item={item} brand={m.brand} name={m.name}
                  reason={reason}
                  compare={compare}
                  links={m.links}
                  imageUrl={m.imageUrl} overlaid={overlaid} onOverlay={onOverlay} />
              );
            })}
   ```
(ほかの所:手の情報・サーバーの設定の読み込み・重ね図・絞り込み・もっと見るは変えない。並んで動く担当の変更を消さない。)

- [ ] **Step 7: 4 つの確認**

Run: `npx tsc --noEmit`、`npm run lint`、`npx vitest run`、`npm run build`
Expected: どれもエラー 0

- [ ] **Step 8: JS の確認**

「JS の測り方」のコマンド。`/mouse` は Task 1 の基準より**減る**見込み(`MICE` `DEVICES` `MICE_RAKUTEN`(商品名の長い文字)と `shop-links` がブラウザの JS から抜ける)。増えたらコントローラーに返す。`js-budget.md` に `| Task 3(/mouse をサーバーの行に) | … |`。

- [ ] **Step 9: コントローラーのブラウザ確認**

`npm run build` のあと、ブラウザ枠の `preview_start` で `robilab-prod-build`(port 3100)を起動して `/mouse` を開く:
- [ ] 375×812 と 1440×900 で、入力前の画面が前と同じ(見本の重ね図に 1 位のマウス名が出る)
- [ ] 持ち方を選んで「合うマウスを見る」→ 結果が出る。1 位の大きな行・2 位からのカード・店のボタン・PR・楽天の画像が前と同じ。「TOP3 を X でシェア」の文にマウス名が 3 つ
- [ ] `/my` でマウスに「Logicool G PRO X SUPERLIGHT 2」を選んでから `/mouse` → カードに「今のマウスより …」
- [ ] 比べられない段は、今の 20 機種ではまだ出ない(Task 4 で出る)
- [ ] コンソールに Hydration の警告とエラーが 0 件
- [ ] はみ出し確認スクリプトで `true`(375)

- [ ] **Step 10: コミット**

```bash
git add src/lib/mouse-rows.ts tests/lib/mouse-rows.test.ts src/components/gear/ShopButtons.tsx src/components/mouse/OtherMiceList.tsx src/app/mouse/page.tsx src/app/mouse/MouseClient.tsx src/components/mouse/HandSetup.tsx docs/design/js-budget.md
git -c user.name=pitos -c user.email=pito.shinzin@gmail.com commit -m "feat: /mouse はサーバーで表示に要る分だけの行を作って渡す(比べられない機種の段)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: マウス 54 機種のデータ(生成・devices.ts の名前・ブラウザに入れない決まり)

**Files:**
- Modify: `scripts/gear-data.ts`(マウスの変換と書き出し先)、`src/data/gear-types.ts`(`MouseSpec`)、`src/data/mice.ts`(生成で置き換え)、`src/data/devices.ts`(マウスの段)、`src/components/pros/ProCard.tsx`、`tests/data/mice.test.ts`(書き直し)、`docs/design/js-budget.md`
- Create: `src/data/mice-ids.ts`(生成)、`tests/data/gear-boundary.test.ts`

**Interfaces:**
- Consumes: `toMouseRows`(Task 3)、`isFitMouse` `rankMice` `recommendReason` `compareWith`(Task 2)、`docs/content/gear/mice.json`(54 件の配列)
- Produces:
  - `src/data/gear-types.ts`:`MouseSpec`(下)
  - `src/data/mice.ts`:`MICE: MouseSpec[]`(54 件・JSON の順 = 前の 20 件が先頭で同じ並び)、`mouseById(id)`、型の再 export(`MouseSpec` `MouseShape` `MouseConnection`)
  - `src/data/mice-ids.ts`:`MICE_IDS: readonly string[]`(ブラウザの部品用)
  - `scripts/gear-data.ts`:`toMouseSpecs(raw)` `renderMiceTs(raw)` `renderMiceIdsTs(raw)` `DISCONTINUED_MICE`、`TARGETS` に 2 つ足す

- [ ] **Step 1: 失敗するテストを書く**

`tests/data/mice.test.ts` を全部書き直す:

```ts
import { describe, it, expect } from "vitest";
import { MICE, mouseById } from "@/data/mice";
import { MICE_IDS } from "@/data/mice-ids";
import { DEVICES } from "@/data/devices";
import { compareWith, fitTarget, isFitMouse, rankMice } from "@/lib/mouse-fit";
import { recommendReason } from "@/lib/mouse-reason";
import { connectionLabel, shapeLabel, withUnit } from "@/lib/gear-labels";
import { GRIPS } from "@/lib/my-settings";

const MAKER_HOSTS = ["logi.com", "logitechg.com", "logicool.co.jp", "razer.com", "benq.com", "pulsar.gg", "finalmouse.com", "lamzu.com", "endgamegear.com", "vaxee.co", "gloriousgaming.com", "steelseries.com", "corsair.com", "hyperx.com", "atk.store", "scyrox.com", "asus.com", "elecom.co.jp"];
const NOT_COMPARABLE = ["finalmouse-ultralightx", "glorious-model-o-2-wireless", "scyrox-v8", "vaxee-e1-wireless", "zowie-ec2-cw", "zowie-ec2-dw", "zowie-u2-dw", "zowie-za13-dw"];

describe("mice data", () => {
  it("54 機種で id が重ならず、devices.ts に同じ名前のマウスとして入っている", () => {
    expect(MICE).toHaveLength(54);
    expect(new Set(MICE.map((m) => m.id)).size).toBe(MICE.length);
    for (const m of MICE) {
      const d = DEVICES.find((x) => x.id === m.id);
      expect(d?.category, m.id).toBe("mouse");
      expect(`${d?.brand} ${d?.name}`, m.id).toBe(`${m.brand} ${m.name}`);
    }
  });
  it("MICE_IDS は MICE と同じ並び", () => {
    expect([...MICE_IDS]).toEqual(MICE.map((m) => m.id));
  });
  it("数字は現実の範囲か null(公式にないものは作らない)", () => {
    const range = (v: number | null, lo: number, hi: number, id: string) => {
      if (v === null) return;
      expect(v, id).toBeGreaterThanOrEqual(lo);
      expect(v, id).toBeLessThanOrEqual(hi);
    };
    for (const m of MICE) {
      range(m.lengthMm, 90, 140, m.id);
      range(m.widthMm, 50, 80, m.id);
      range(m.heightMm, 20, 50, m.id);
      range(m.weightG, 30, 150, m.id);
    }
  });
  it("長さか幅がない 8 機種だけが、順位の外(比べられません)", () => {
    expect(MICE.filter((m) => !isFitMouse(m)).map((m) => m.id).sort()).toEqual(NOT_COMPARABLE);
  });
  it("https のメーカーのページ(店ではない)と確認日", () => {
    for (const m of MICE) {
      const u = new URL(m.officialUrl);
      expect(u.protocol, m.id).toBe("https:");
      expect(MAKER_HOSTS.some((h) => u.hostname === h || u.hostname.endsWith("." + h)), `${m.id}: ${u.hostname}`).toBe(true);
      expect(m.checkedAt, m.id).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });
  it("生産終了は 0 件(公式に記載がない)", () => {
    expect(MICE.filter((m) => m.discontinued)).toEqual([]);
  });
  it("finds a mouse by id", () => {
    expect(mouseById(MICE[0].id)).toBe(MICE[0]);
    expect(mouseById("no-such-mouse")).toBeUndefined();
  });
  it("本物の全機種 × 持ち方 × 手の幅で、距離は数、文と表示に null・NaN・undefined が出ない", () => {
    const fit = MICE.filter(isFitMouse);
    for (const grip of GRIPS) {
      for (const widthCm of [null, 9]) {
        const hand = { lengthCm: 18.5, widthCm, grip };
        const t = fitTarget(hand);
        for (const r of rankMice(hand, fit)) {
          expect(Number.isFinite(r.distance), r.mouse.id).toBe(true);
          const text = recommendReason(hand, t, r.mouse, fit[0]) + (compareWith(fit[0], r.mouse) ?? "");
          expect(text, r.mouse.id).not.toMatch(/null|NaN|undefined/);
        }
      }
    }
    for (const m of MICE) {
      const shown = [withUnit(m.heightMm, "mm"), withUnit(m.weightG, "g"), shapeLabel(m.shape), connectionLabel(m.connection)].join(" ");
      expect(shown, m.id).not.toMatch(/null|NaN|undefined/);
    }
  });
});
```

`tests/data/gear-boundary.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

/** 出典の文・メモ・センサー名まで入った機種のデータ。ブラウザの JS に入れない */
const HEAVY = ["@/data/mice", "@/data/pads", "@/data/skates", "@/data/mice-rakuten"];

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) return sourceFiles(p);
    return /\.(ts|tsx)$/.test(f) ? [p] : [];
  });
}

describe("ブラウザの JS に機種のデータを入れない", () => {
  it("\"use client\" のファイルと src/components は、機種のデータを値として import しない(型だけはよい)", () => {
    const bad: string[] = [];
    for (const file of sourceFiles("src")) {
      const path = file.replace(/\\/g, "/");
      const text = readFileSync(file, "utf8");
      const isClient = /^\s*["']use client["']/.test(text);
      if (!isClient && !path.startsWith("src/components/")) continue;
      for (const m of text.matchAll(/^import\s+(?!type\s)[^;]*?from\s+["']([^"']+)["']/gm)) {
        if (HEAVY.includes(m[1])) bad.push(`${path}: ${m[1]}`);
      }
    }
    expect(bad).toEqual([]);
  });
});
```

Run: `npx vitest run tests/data/mice.test.ts tests/data/gear-boundary.test.ts`
Expected: FAIL(`@/data/mice-ids` がない・54 件でない・`ProCard.tsx` が `@/data/mice` を import している)

- [ ] **Step 2: `MouseSpec` を型のファイルへ**

`src/data/gear-types.ts` の `export type MouseConnection …` の行のあとに足す:

```ts
export type MouseSpec = {
  id: string;
  brand: string;
  name: string;
  lengthMm: number | null;
  /** いちばん広いところ */
  widthMm: number | null;
  heightMm: number | null;
  /** 標準の構成(公式の表記どおり。電池式は電池込み) */
  weightG: number | null;
  shape: MouseShape | null;
  connection: MouseConnection | null;
  sensor: string | null;
  /** 数字の出典(メーカー公式のページ) */
  officialUrl: string;
  /** 確認した日(YYYY-MM-DD) */
  checkedAt: string;
  /** 人気の根拠(出典と順位) */
  selectionBasis: string;
  /** null の理由・原文の表記 */
  note: string;
  discontinued: boolean;
};
```

- [ ] **Step 3: 生成スクリプトにマウスを足す**

`scripts/gear-data.ts` の型の import を次にする:

```ts
import type { MouseConnection, MouseShape, MouseSpec, PadSpec, PadSurface, SkateMaterial, SkateShape, SkateSpec } from "../src/data/gear-types";
```

`const SURFACES …` の行の上に足す:

```ts
const MOUSE_SHAPES: readonly MouseShape[] = ["symmetric", "right"];
const CONNECTIONS: readonly MouseConnection[] = ["wired", "wireless", "both"];
/** マウスの生産終了(mice-notes.md に記載なし) */
export const DISCONTINUED_MICE: readonly string[] = [];

type RawMouse = {
  id: string; brand: string; name: string; lengthMm: number | null; widthMm: number | null; heightMm: number | null; weightG: number | null;
  shape: string | null; connection: string | null; sensor: string | null; officialUrl: string; checkedAt: string;
  inExistingData: boolean; selectionBasis: string; notes: string;
};

export function toMouseSpecs(raw: RawMouse[]): MouseSpec[] {
  return raw.map((m) => ({
    id: m.id,
    brand: m.brand,
    name: m.name,
    lengthMm: m.lengthMm,
    widthMm: m.widthMm,
    heightMm: m.heightMm,
    weightG: m.weightG,
    shape: oneOf(m.shape, MOUSE_SHAPES, `${m.id}.shape`),
    connection: oneOf(m.connection, CONNECTIONS, `${m.id}.connection`),
    sensor: m.sensor,
    officialUrl: m.officialUrl,
    checkedAt: m.checkedAt,
    selectionBasis: m.selectionBasis,
    note: m.notes,
    discontinued: DISCONTINUED_MICE.includes(m.id),
  }));
}
```

(`oneOf` は `const SURFACES` より下にあるので、`toMouseSpecs` は `oneOf` の定義より下に置く。関数の宣言は巻き上がるのでどちらでも動くが、読みやすさのため `toPadSpecs` の上に置く。)`renderSkatesTs` のあとに足す:

```ts
export function renderMiceTs(raw: RawMouse[]): string {
  return `${header("docs/content/gear/mice.json")}// 並びは JSON のまま(src/data/mice-rakuten.ts の並びと合わせる。tests/data/mice-rakuten.test.ts)。
import type { MouseSpec } from "./gear-types";
export type { MouseConnection, MouseShape, MouseSpec } from "./gear-types";

export const MICE: MouseSpec[] = [
${lines(toMouseSpecs(raw))}
];

export function mouseById(id: string): MouseSpec | undefined {
  return MICE.find((m) => m.id === id);
}
`;
}

export function renderMiceIdsTs(raw: RawMouse[]): string {
  return `${header("docs/content/gear/mice.json")}// マウス探し(/mouse)に載っているマウスの id だけ。ブラウザの部品(プロ設定の行など)はこちらを読む(機種のデータ本体を JS に入れない)。
export const MICE_IDS: readonly string[] = ${JSON.stringify(raw.map((m) => m.id))};
`;
}
```

`TARGETS` の配列の先頭に 2 つ足す:

```ts
  { out: "src/data/mice.ts", render: () => renderMiceTs(readJson("docs/content/gear/mice.json")) },
  { out: "src/data/mice-ids.ts", render: () => renderMiceIdsTs(readJson("docs/content/gear/mice.json")) },
```

Run: `node scripts/gear-data.ts`
Expected: 4 つのファイルの「書き出した」。`git diff --stat src/data/mice.ts` で、前の手書きのファイル(と最後の「外したもの」のコメント)が生成物に置き換わっている。

- [ ] **Step 4: `devices.ts` のマウスの段**

`src/data/devices.ts` の `// マウス` から `// マウスパッド` の前までを次に置き換える:

```ts
  // マウス(名前は src/data/mice.ts と同じ。tests/data/mice.test.ts が確かめる)
  { id: "logicool-g-pro-x-superlight-2", category: "mouse", brand: "Logicool G", name: "PRO X SUPERLIGHT 2" },
  { id: "logicool-g-pro-x-superlight-2-dex", category: "mouse", brand: "Logicool G", name: "PRO X SUPERLIGHT 2 DEX" },
  { id: "logicool-g-pro-x-superlight", category: "mouse", brand: "Logicool G", name: "PRO X SUPERLIGHT" },
  { id: "logicool-g502-x-plus", category: "mouse", brand: "Logicool G", name: "G502 X PLUS" },
  { id: "logicool-g502-hero", category: "mouse", brand: "Logicool G", name: "G502 HERO" },
  { id: "logicool-g305", category: "mouse", brand: "Logicool G", name: "G305" },
  { id: "logicool-g304", category: "mouse", brand: "Logicool G", name: "G304" },
  { id: "razer-deathadder-v3-pro", category: "mouse", brand: "Razer", name: "DeathAdder V3 Pro" },
  { id: "razer-deathadder-v3", category: "mouse", brand: "Razer", name: "DeathAdder V3" },
  { id: "razer-viper-v3-pro", category: "mouse", brand: "Razer", name: "Viper V3 Pro" },
  { id: "razer-viper-mini", category: "mouse", brand: "Razer", name: "Viper Mini" },
  { id: "razer-basilisk-v3-pro", category: "mouse", brand: "Razer", name: "Basilisk V3 Pro" },
  { id: "pulsar-x2-v2", category: "mouse", brand: "Pulsar", name: "X2 v2 Medium" },
  { id: "pulsar-xlite-v3", category: "mouse", brand: "Pulsar", name: "Xlite v3 Medium" },
  { id: "endgame-gear-op1-8k", category: "mouse", brand: "Endgame Gear", name: "OP1 8k" },
  { id: "endgame-gear-xm2we", category: "mouse", brand: "Endgame Gear", name: "XM2we" },
  { id: "steelseries-aerox-3-wireless", category: "mouse", brand: "SteelSeries", name: "Aerox 3 Wireless" },
  { id: "steelseries-rival-3-wireless", category: "mouse", brand: "SteelSeries", name: "Rival 3 Wireless" },
  { id: "corsair-m75-wireless", category: "mouse", brand: "CORSAIR", name: "M75 WIRELESS" },
  { id: "hyperx-pulsefire-haste-2", category: "mouse", brand: "HyperX", name: "Pulsefire Haste 2" },
  { id: "logicool-g-pro-x2-superstrike", category: "mouse", brand: "Logicool G", name: "PRO X2 SUPERSTRIKE" },
  { id: "logicool-g-pro-x3-superstrike", category: "mouse", brand: "Logicool G", name: "PRO X3 SUPERSTRIKE" },
  { id: "logicool-g203", category: "mouse", brand: "Logicool G", name: "G203 LIGHTSYNC" },
  { id: "logicool-g703", category: "mouse", brand: "Logicool G", name: "G703 LIGHTSPEED" },
  { id: "logicool-g-pro-2-lightspeed", category: "mouse", brand: "Logicool G", name: "PRO 2 LIGHTSPEED" },
  { id: "logicool-g-pro-x-superlight-2-se", category: "mouse", brand: "Logicool G", name: "PRO X SUPERLIGHT 2 SE" },
  { id: "logicool-g-pro-x-superlight-2c", category: "mouse", brand: "Logicool G", name: "PRO X SUPERLIGHT 2c" },
  { id: "logicool-g502-x-lightspeed", category: "mouse", brand: "Logicool G", name: "G502 X LIGHTSPEED" },
  { id: "logicool-g502-x", category: "mouse", brand: "Logicool G", name: "G502 X" },
  { id: "logicool-g402", category: "mouse", brand: "Logicool G", name: "G402 Hyperion Fury" },
  { id: "logicool-g309", category: "mouse", brand: "Logicool G", name: "G309 LIGHTSPEED" },
  { id: "logicool-g304-x-superlight", category: "mouse", brand: "Logicool G", name: "G304 X SUPERLIGHT" },
  { id: "razer-viper-v4-pro", category: "mouse", brand: "Razer", name: "Viper V4 Pro" },
  { id: "razer-deathadder-v4-pro", category: "mouse", brand: "Razer", name: "DeathAdder V4 Pro" },
  { id: "razer-naga-v3-pro", category: "mouse", brand: "Razer", name: "Naga V3 Pro" },
  { id: "razer-cobra", category: "mouse", brand: "Razer", name: "Cobra" },
  { id: "razer-orochi-v2", category: "mouse", brand: "Razer", name: "Orochi V2" },
  { id: "razer-deathadder-v3-hyperspeed", category: "mouse", brand: "Razer", name: "DeathAdder V3 HyperSpeed" },
  { id: "razer-naga-v2-hyperspeed", category: "mouse", brand: "Razer", name: "Naga V2 HyperSpeed" },
  { id: "zowie-ec2-cw", category: "mouse", brand: "ZOWIE", name: "EC2-CW" },
  { id: "zowie-ec2-dw", category: "mouse", brand: "ZOWIE", name: "EC2-DW" },
  { id: "zowie-za13-dw", category: "mouse", brand: "ZOWIE", name: "ZA13-DW" },
  { id: "zowie-u2-dw", category: "mouse", brand: "ZOWIE", name: "U2-DW" },
  { id: "finalmouse-ultralightx", category: "mouse", brand: "Finalmouse", name: "UltralightX (ULX) Lion (M)" },
  { id: "lamzu-maya-x", category: "mouse", brand: "LAMZU", name: "MAYA X" },
  { id: "vaxee-e1-wireless", category: "mouse", brand: "VAXEE", name: "E1 Wireless (4K)" },
  { id: "pulsar-xlite-crazylight", category: "mouse", brand: "Pulsar", name: "Xlite CrazyLight Medium" },
  { id: "endgame-gear-op1-8k-v2", category: "mouse", brand: "Endgame Gear", name: "OP1 8k v2" },
  { id: "vxe-dragonfly-r1-se-plus", category: "mouse", brand: "VXE", name: "Dragonfly R1 SE+" },
  { id: "scyrox-v8", category: "mouse", brand: "SCYROX", name: "V8" },
  { id: "asus-tuf-gaming-m3-gen-ii", category: "mouse", brand: "ASUS", name: "TUF Gaming M3 Gen II" },
  { id: "glorious-model-o-2-wireless", category: "mouse", brand: "Glorious", name: "Model O 2 Wireless" },
  { id: "elecom-vm500", category: "mouse", brand: "ELECOM", name: "V custom VM500" },
  { id: "steelseries-aerox-3-wireless-gen-2", category: "mouse", brand: "SteelSeries", name: "Aerox 3 Wireless Gen 2" },
  // マウス探しのデータにはない(公式の数字がない・旧モデル)が、マイ設定で選べる・ソールの対応に使うので残す
  { id: "zowie-ec2-c", category: "mouse", brand: "ZOWIE", name: "EC2-C" },
  { id: "zowie-fk2-c", category: "mouse", brand: "ZOWIE", name: "FK2-C" },
  { id: "zowie-s2-c", category: "mouse", brand: "ZOWIE", name: "S2-C" },
  { id: "zowie-za13-c", category: "mouse", brand: "ZOWIE", name: "ZA13-C" },
  { id: "zowie-u2", category: "mouse", brand: "ZOWIE", name: "U2" },
  { id: "lamzu-atlantis-mini", category: "mouse", brand: "LAMZU", name: "Atlantis Mini" },
  { id: "vaxee-xe", category: "mouse", brand: "VAXEE", name: "XE" },
  { id: "steelseries-aerox-3", category: "mouse", brand: "SteelSeries", name: "Aerox 3" },
  { id: "steelseries-rival-3", category: "mouse", brand: "SteelSeries", name: "Rival 3" },
```

- [ ] **Step 5: プロ設定の行は id だけを読む**

`src/components/pros/ProCard.tsx`:`import { mouseById } from "@/data/mice";` を `import { MICE_IDS } from "@/data/mice-ids";` にし、`href: mouseById(p.mouse) ? "/mouse" : null` を `href: MICE_IDS.includes(p.mouse) ? "/mouse" : null` にする。

- [ ] **Step 6: テストが通るのを確かめる**

Run: `npx vitest run`
Expected: PASS(`gear-generated` の 4 つ・`mice` `gear-boundary` `mice-rakuten`(前の 20 件の並びは同じ)・`devices` を含む)

- [ ] **Step 7: 4 つの確認**

Run: `npx tsc --noEmit`、`npm run lint`、`npm run build`
Expected: どれもエラー 0

- [ ] **Step 8: JS の確認**

「JS の測り方」のコマンド。`/mouse` は Task 3 の値から行の分(46 機種)だけ増えるが、行は RSC のデータで JS のチャンクではないので、JS の増えはほぼ 0 の見込み。`/tools/sensitivity` は `mice.ts` が抜けて `devices.ts` が増える(差はほぼ 0 か減る)。`/my` は `devices.ts` の分(目安 +0.6KB)。どれも Task 1 の基準から +4.0KB 以下。`js-budget.md` に `| Task 4(マウス 54) | … |`。

- [ ] **Step 9: コントローラーのブラウザ確認**

`npm run build` のあと `robilab-prod-build` を起動して:
- [ ] `/mouse`(手を入れたあと)で「あなたの手に近い順」の件数が 46。もっと見るで全部出る
- [ ] ページの下に「公式の大きさがないため比べられません」8 件(人気の順:先頭は順位のある SCYROX V8 など、順位のない ZOWIE は後ろ)。どの行も「公式に数字がない項目:長さ・幅」などと、店・公式のボタン
- [ ] 新しい機種のカード(例:Dragonfly R1 SE+ は重さが「公式の記載なし」、G309 は形が「公式の記載なし」、DeathAdder V3 Pro は接続「有線・無線」)
- [ ] 絞り込み「〜55g」で重さのない機種が消え、「すべて」に戻すと出る。「有線」で `both` の機種が残る
- [ ] `/my` のマウスの候補に新しい機種(例「Razer Viper V4 Pro」)と旧機種(「ZOWIE EC2-C」)がある
- [ ] 375 ではみ出し確認スクリプト `true`。コンソールのエラー 0 件

- [ ] **Step 10: コミット**

```bash
git add scripts/gear-data.ts src/data/gear-types.ts src/data/mice.ts src/data/mice-ids.ts src/data/devices.ts src/components/pros/ProCard.tsx tests/data/mice.test.ts tests/data/gear-boundary.test.ts docs/design/js-budget.md
git -c user.name=pitos -c user.email=pito.shinzin@gmail.com commit -m "feat: マウスを 54 機種に(JSON から生成・devices.ts の名前をそろえる・機種データをブラウザに入れない)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: 絞り込み・大きさの目安・ソールの結び付け・マイ設定の読み取り(純粋な関数)

**Files:**
- Create: `src/lib/gear-query.ts`、`src/lib/pad-filter.ts`、`src/lib/skate-match.ts`、`src/lib/my-mouse.ts`、`tests/lib/gear-query.test.ts`、`tests/lib/pad-filter.test.ts`、`tests/lib/skate-match.test.ts`、`tests/lib/my-mouse.test.ts`

**Interfaces:**
- Consumes: `PadSpec` `PadSize` `PadSurface` `SkateSpec` `SkateMaterial` `SkateShape`(Task 1)、`PADS` `SKATES`(Task 1。本物のデータのテスト)、`MY_SETTINGS_KEY`(`src/lib/my-settings-store.ts`)・`CATALOG_ID_RE`(`src/lib/my-settings.ts`)はテストだけ
- Produces:
  - `src/lib/gear-query.ts`:`type SearchParams = Record<string, string | string[] | undefined>`、`firstParam(sp, key): string | null`、`pick<T extends string>(value, allowed: readonly T[], fallback: T): T`、`queryHref(path, entries): string`
  - `src/lib/pad-filter.ts`:`PadSizeClass` `PadThickness` `PadFilter` `NO_PAD_FILTER` `SIZE_CLASSES` `THICKNESS_CLASSES` `VisiblePad = PadSpec & { officialUrl: string }` `PadMatch = { pad: VisiblePad; sizes: PadSize[] }`、`sizeClass(widthMm)` `thicknessClass(mm)` `parsePadFilter(sp)` `padFilterHref(f, patch?)` `isPadFilterEmpty(f)` `visiblePads(pads)` `filterPads(pads: readonly VisiblePad[], f): PadMatch[]`
  - `src/lib/skate-match.ts`:`SkateFilter` `NO_SKATE_FILTER` `SkateView`、`parseSkateFilter(sp, knownMouseIds)` `skateFilterHref(f, patch?)` `skatesForMouse(skates, mouseId)` `universalSkates(skates)` `skateCounts(skates)` `filterSkates(skates, f)` `groupByBrand(skates)` `skateView(skates, f)`
  - `src/lib/my-mouse.ts`:`MY_SETTINGS_STORAGE_KEY` `MOUSE_ID_RE` `myMouseIdFrom(raw)` `shouldPreselect(search)`

- [ ] **Step 1: 失敗するテストを書く**

`tests/lib/gear-query.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { firstParam, pick, queryHref } from "@/lib/gear-query";

describe("gear-query", () => {
  it("firstParam:重なりは最初の値、なければ null", () => {
    expect(firstParam({ a: "x" }, "a")).toBe("x");
    expect(firstParam({ a: ["y", "z"] }, "a")).toBe("y");
    expect(firstParam({ a: [] }, "a")).toBeNull();
    expect(firstParam({}, "a")).toBeNull();
  });
  it("pick:決まった値だけ通し、ほか(大文字違い・長い文字)は fallback", () => {
    const allowed = ["all", "glass"] as const;
    expect(pick("glass", allowed, "all")).toBe("glass");
    expect(pick("GLASS", allowed, "all")).toBe("all");
    expect(pick("x".repeat(5000), allowed, "all")).toBe("all");
    expect(pick(null, allowed, "all")).toBe("all");
  });
  it("queryHref:all と null は書かず、決まった順で並べる", () => {
    expect(queryHref("/pads", [["surface", "all"], ["size", null]])).toBe("/pads");
    expect(queryHref("/pads", [["surface", "glass"], ["size", "XL"]])).toBe("/pads?surface=glass&size=XL");
    expect(queryHref("/skates", [["mouse", "a b"]])).toBe("/skates?mouse=a+b");
  });
});
```

`tests/lib/pad-filter.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import type { PadSize, PadSpec } from "@/data/gear-types";
import { PADS } from "@/data/pads";
import {
  NO_PAD_FILTER, filterPads, isPadFilterEmpty, padFilterHref, parsePadFilter, sizeClass, thicknessClass, visiblePads, type VisiblePad,
} from "@/lib/pad-filter";
import { padSizeText, surfaceLabel, withUnit } from "@/lib/gear-labels";

const size = (label: string, w: number | null, d: number | null, t: number | null): PadSize => ({ label, widthMm: w, depthMm: d, thicknessMm: t });
const pad = (id: string, extra: Partial<PadSpec> = {}): VisiblePad => ({
  id, brand: "B", name: id, surface: "cloth", speedOfficial: null, firmnessVariants: [], sizes: [size("L", 450, 400, 4)], base: null, stitchedEdge: null,
  officialUrl: `https://example.com/${id}`, checkedAt: "2026-10-03", selectionBasis: "", note: "", hidden: false, discontinued: false, ...extra,
} as VisiblePad);

describe("sizeClass(公式の横幅で分ける)", () => {
  it.each([[240, "S"], [299, "S"], [300, "M"], [399, "M"], [400, "L"], [479, "L"], [480, "XL"], [599, "XL"], [600, "XXL"], [1600, "XXL"]] as const)("%d → %s", (w, c) => {
    expect(sizeClass(w)).toBe(c);
  });
  it("null・0 以下は分けない", () => {
    expect(sizeClass(null)).toBeNull();
    expect(sizeClass(0)).toBeNull();
  });
});

describe("thicknessClass", () => {
  it.each([[1, "thin"], [2.9, "thin"], [3, "normal"], [4.9, "normal"], [5, "thick"], [6, "thick"]] as const)("%d → %s", (mm, c) => {
    expect(thicknessClass(mm)).toBe(c);
  });
  it("公式の厚さがないものはどこにも入らない", () => {
    expect(thicknessClass(null)).toBeNull();
  });
});

describe("parsePadFilter / padFilterHref", () => {
  it("決まった値だけ読む。ほかは「すべて」", () => {
    expect(parsePadFilter({ surface: "glass", size: "XL", thickness: "thin", firmness: "variants" })).toEqual({ surface: "glass", size: "XL", thickness: "thin", firmness: "variants" });
    expect(parsePadFilter({ surface: "GLASS", size: "XS", thickness: ["thick", "thin"], firmness: "1" })).toEqual({ ...NO_PAD_FILTER, thickness: "thick" });
    expect(parsePadFilter({ surface: "other" })).toEqual(NO_PAD_FILTER);
    expect(parsePadFilter({})).toEqual(NO_PAD_FILTER);
  });
  it("リンクは今の絞り込みに 1 つだけ変えたもの", () => {
    const f = { ...NO_PAD_FILTER, surface: "glass" as const };
    expect(padFilterHref(f, { size: "L" })).toBe("/pads?surface=glass&size=L");
    expect(padFilterHref(f, { surface: "all" })).toBe("/pads");
    expect(isPadFilterEmpty(NO_PAD_FILTER)).toBe(true);
    expect(isPadFilterEmpty(f)).toBe(false);
  });
});

describe("visiblePads / filterPads", () => {
  it("hidden と公式 URL のないものは出さない", () => {
    expect(visiblePads([pad("a"), pad("h", { hidden: true }), pad("n", { officialUrl: null })]).map((p) => p.id)).toEqual(["a"]);
  });
  it("面・硬さで絞る(面がないものは面の絞り込みで外れる。硬さは 2 種類以上で「選べる」)", () => {
    const pads = [pad("c"), pad("g", { surface: "glass" }), pad("n", { surface: null }), pad("f", { firmnessVariants: ["SOFT", "HARD"] }), pad("one", { firmnessVariants: ["ソフト程度"] })];
    expect(filterPads(pads, { ...NO_PAD_FILTER, surface: "glass" }).map((m) => m.pad.id)).toEqual(["g"]);
    expect(filterPads(pads, { ...NO_PAD_FILTER, firmness: "variants" }).map((m) => m.pad.id)).toEqual(["f"]);
    expect(filterPads(pads, NO_PAD_FILTER).map((m) => m.pad.id)).toEqual(["c", "g", "n", "f", "one"]);
  });
  it("大きさ・厚さで絞ると、合うサイズだけ残す。厚さのないサイズは厚さの絞り込みに入らない", () => {
    const p = pad("p", { sizes: [size("S", 240, 210, 4), size("XXL", 900, 400, null), size("L", 450, 400, 2)] });
    expect(filterPads([p], { ...NO_PAD_FILTER, size: "XXL" })[0].sizes.map((s) => s.label)).toEqual(["XXL"]);
    expect(filterPads([p], { ...NO_PAD_FILTER, thickness: "thin" })[0].sizes.map((s) => s.label)).toEqual(["L"]);
    expect(filterPads([p], { ...NO_PAD_FILTER, size: "XXL", thickness: "normal" })).toEqual([]);
    expect(filterPads([p], NO_PAD_FILTER)[0].sizes).toHaveLength(3);
  });
  it("空の一覧は空", () => {
    expect(filterPads([], NO_PAD_FILTER)).toEqual([]);
  });
});

describe("本物のデータ", () => {
  const visible = visiblePads(PADS);
  it("画面に出すのは 41 件", () => {
    expect(visible).toHaveLength(41);
  });
  it("どのチップを押しても 1 件以上ある(面・大きさ・厚さ・硬さ)", () => {
    for (const surface of ["cloth", "hybrid", "glass", "hard"] as const) expect(filterPads(visible, { ...NO_PAD_FILTER, surface }).length, surface).toBeGreaterThan(0);
    for (const s of ["S", "M", "L", "XL", "XXL"] as const) expect(filterPads(visible, { ...NO_PAD_FILTER, size: s }).length, s).toBeGreaterThan(0);
    for (const t of ["thin", "normal", "thick"] as const) expect(filterPads(visible, { ...NO_PAD_FILTER, thickness: t }).length, t).toBeGreaterThan(0);
    expect(filterPads(visible, { ...NO_PAD_FILTER, firmness: "variants" }).length).toBeGreaterThan(0);
  });
  it("表示の言葉に null・NaN・undefined が出ない", () => {
    for (const p of visible) {
      const text = [surfaceLabel(p.surface), ...p.sizes.map((s) => `${s.label} ${padSizeText(s.widthMm, s.depthMm)} ${withUnit(s.thicknessMm, "mm")}`)].join(" ");
      expect(text, p.id).not.toMatch(/null|NaN|undefined/);
    }
  });
});
```

`tests/lib/skate-match.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import type { SkateSpec } from "@/data/gear-types";
import { SKATES } from "@/data/skates";
import {
  NO_SKATE_FILTER, filterSkates, groupByBrand, parseSkateFilter, skateCounts, skateFilterHref, skateView, skatesForMouse, universalSkates,
} from "@/lib/skate-match";
import { materialLabel, packText, skateThicknessText } from "@/lib/gear-labels";

const skate = (id: string, extra: Partial<SkateSpec> = {}): SkateSpec => ({
  id, brand: "B", line: "L", name: id, forMouse: "x", mouseIds: [], material: "PTFE", materialOfficial: null, shape: "full",
  thicknessMm: null, thicknessOfficial: null, piecesPerPack: null, setsPerPack: null, extras: [], officialUrl: `https://example.com/${id}`,
  checkedAt: "2026-10-03", selectionBasis: "", note: "", discontinued: false, ...extra,
});
const KNOWN = new Set(["m1", "m2"]);

describe("parseSkateFilter / skateFilterHref", () => {
  it("知っているマウスの id だけ読む。空・知らない id は選ばない", () => {
    expect(parseSkateFilter({ mouse: "m1", material: "glass", shape: "dot" }, KNOWN)).toEqual({ mouse: "m1", material: "glass", shape: "dot" });
    expect(parseSkateFilter({ mouse: "", material: "ceramic", shape: "other" }, KNOWN)).toEqual(NO_SKATE_FILTER);
    expect(parseSkateFilter({ mouse: "no-such", material: ["UPE", "PTFE"] }, KNOWN)).toEqual({ ...NO_SKATE_FILTER, material: "UPE" });
  });
  it("リンクは今の絞り込みに 1 つだけ変えたもの", () => {
    expect(skateFilterHref({ mouse: "m1", material: "all", shape: "all" }, { shape: "dot" })).toBe("/skates?mouse=m1&shape=dot");
    expect(skateFilterHref(NO_SKATE_FILTER)).toBe("/skates");
  });
});

describe("結び付け", () => {
  const list = [
    skate("a", { mouseIds: ["m1"] }), skate("b", { mouseIds: ["m1", "m2"], material: "glass" }), skate("u", { shape: "dot" }),
    skate("held", { mouseIds: [] }), skate("n", { shape: "dot", material: null }),
  ];
  it("専用は mouseIds、汎用は機種に結び付けないドット", () => {
    expect(skatesForMouse(list, "m1").map((s) => s.id)).toEqual(["a", "b"]);
    expect(skatesForMouse(list, "m2").map((s) => s.id)).toEqual(["b"]);
    expect(universalSkates(list).map((s) => s.id)).toEqual(["u", "n"]);
    expect(skateCounts(list)).toEqual({ m1: 2, m2: 1 });
  });
  it("素材・形で絞る(素材がないものは素材の絞り込みで外れる)", () => {
    expect(filterSkates(list, { material: "glass", shape: "all" }).map((s) => s.id)).toEqual(["b"]);
    expect(filterSkates(list, { material: "all", shape: "dot" }).map((s) => s.id)).toEqual(["u", "n"]);
    expect(filterSkates(list, { material: "PTFE", shape: "dot" }).map((s) => s.id)).toEqual(["u"]);
  });
  it("マウスを選んだら専用と汎用、選ばなければブランド別(最初に出た順)", () => {
    expect(skateView(list, { mouse: "m1", material: "all", shape: "all" })).toEqual({ kind: "mouse", mouseId: "m1", dedicated: [list[0], list[1]], universal: [list[2], list[4]] });
    const all = skateView([skate("x", { brand: "Z" }), skate("y", { brand: "A" }), skate("z", { brand: "Z" })], NO_SKATE_FILTER);
    expect(all.kind === "all" && all.groups.map((g) => [g.brand, g.items.map((s) => s.id)])).toEqual([["Z", ["x", "z"]], ["A", ["y"]]]);
    expect(all.kind === "all" && all.total).toBe(3);
  });
});

describe("本物のデータ", () => {
  it("PRO X SUPERLIGHT 2 の専用は 13 件、汎用のドットは 8 件", () => {
    expect(skatesForMouse(SKATES, "logicool-g-pro-x-superlight-2")).toHaveLength(13);
    expect(universalSkates(SKATES)).toHaveLength(8);
  });
  it("ブランド別にすると 58 件がそろう", () => {
    const groups = groupByBrand(SKATES);
    expect(groups.map((g) => g.brand)).toEqual([...new Set(SKATES.map((s) => s.brand))]);
    expect(groups.reduce((n, g) => n + g.items.length, 0)).toBe(58);
  });
  it("表示の言葉に null・NaN・undefined が出ない", () => {
    for (const s of SKATES) {
      const text = `${materialLabel(s.material)} ${skateThicknessText(s.thicknessMm, s.thicknessOfficial)} ${packText(s.piecesPerPack, s.setsPerPack)}`;
      expect(text, s.id).not.toMatch(/null|NaN|undefined/);
    }
  });
});
```

`tests/lib/my-mouse.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { MOUSE_ID_RE, MY_SETTINGS_STORAGE_KEY, myMouseIdFrom, shouldPreselect } from "@/lib/my-mouse";
import { MY_SETTINGS_KEY } from "@/lib/my-settings-store";
import { CATALOG_ID_RE } from "@/lib/my-settings";

describe("my-mouse", () => {
  it("保存のキーと id の形は、マイ設定と同じ", () => {
    expect(MY_SETTINGS_STORAGE_KEY).toBe(MY_SETTINGS_KEY);
    expect(MOUSE_ID_RE.source).toBe(CATALOG_ID_RE.source);
  });
  it("候補から選んだマウスの id だけ読む", () => {
    expect(myMouseIdFrom(JSON.stringify({ devices: { mouse: { id: "razer-viper-v3-pro" } } }))).toBe("razer-viper-v3-pro");
  });
  it.each([
    [null], [""], ["{"], ["null"], ["[]"], ['"text"'],
    [JSON.stringify({ devices: null })],
    [JSON.stringify({ devices: { mouse: null } })],
    [JSON.stringify({ devices: { mouse: { name: "自作マウス" } } })],
    [JSON.stringify({ devices: { mouse: { id: "Razer-Viper" } } })],
    [JSON.stringify({ devices: { mouse: { id: "../evil" } } })],
    [JSON.stringify({ devices: { mouse: { id: "x".repeat(41) } } })],
    [JSON.stringify({ devices: { mouse: { id: 12 } } })],
  ])("読めないもの(%s)は null", (raw) => {
    expect(myMouseIdFrom(raw)).toBeNull();
  });
  it("URL にマウスの指定がまったくないときだけ選び直す(?mouse= は「選ばない」を選んだ印)", () => {
    expect(shouldPreselect("")).toBe(true);
    expect(shouldPreselect("?material=glass")).toBe(true);
    expect(shouldPreselect("?mouse=")).toBe(false);
    expect(shouldPreselect("?mouse=razer-viper-v3-pro")).toBe(false);
  });
});
```

- [ ] **Step 2: テストが落ちるのを確かめる**

Run: `npx vitest run tests/lib/gear-query.test.ts tests/lib/pad-filter.test.ts tests/lib/skate-match.test.ts tests/lib/my-mouse.test.ts`
Expected: FAIL(モジュールが見つからない)

- [ ] **Step 3: 関数を書く**

`src/lib/gear-query.ts`:

```ts
/** ページの searchParams(Next.js の page の props)を読むための小さな道具。どれも純粋な関数。 */
export type SearchParams = Record<string, string | string[] | undefined>;

/** ?a=1&a=2 のような重なりは最初の値。なければ null */
export function firstParam(sp: SearchParams, key: string): string | null {
  const v = sp[key];
  const s = Array.isArray(v) ? v[0] : v;
  return typeof s === "string" ? s : null;
}

/** 決まった値のどれかならその値。違えば fallback(想定外の値で落ちない) */
export function pick<T extends string>(value: string | null, allowed: readonly T[], fallback: T): T {
  return value !== null && (allowed as readonly string[]).includes(value) ? (value as T) : fallback;
}

/** "all" と null は書かず、渡した順で ? に並べる */
export function queryHref(path: string, entries: readonly (readonly [string, string | null])[]): string {
  const q = new URLSearchParams();
  for (const [k, v] of entries) if (v !== null && v !== "all") q.set(k, v);
  const s = q.toString();
  return s ? `${path}?${s}` : path;
}
```

`src/lib/pad-filter.ts`:

```ts
import type { PadSize, PadSpec, PadSurface } from "@/data/gear-types";
import { firstParam, pick, queryHref, type SearchParams } from "@/lib/gear-query";

export type PadSizeClass = "S" | "M" | "L" | "XL" | "XXL";
export type PadThickness = "thin" | "normal" | "thick";
export type PadFilter = {
  surface: "all" | Exclude<PadSurface, "other">;
  size: "all" | PadSizeClass;
  thickness: "all" | PadThickness;
  /** variants = 硬さを 2 種類以上から選べるもの */
  firmness: "all" | "variants";
};
export const NO_PAD_FILTER: PadFilter = { surface: "all", size: "all", thickness: "all", firmness: "all" };

/** 大きさの目安(ロビラボの決め方:公式の横幅で分ける。机の幅に合わせて選ぶため) */
export const SIZE_CLASSES: readonly { id: PadSizeClass; minWidthMm: number; hint: string }[] = [
  { id: "S", minWidthMm: 0, hint: "幅 300mm 未満" },
  { id: "M", minWidthMm: 300, hint: "幅 300〜399mm" },
  { id: "L", minWidthMm: 400, hint: "幅 400〜479mm" },
  { id: "XL", minWidthMm: 480, hint: "幅 480〜599mm" },
  { id: "XXL", minWidthMm: 600, hint: "幅 600mm 以上(キーボードも乗る)" },
];
export const THICKNESS_CLASSES: readonly { id: PadThickness; label: string; hint: string }[] = [
  { id: "thin", label: "薄い", hint: "3mm 未満" },
  { id: "normal", label: "ふつう", hint: "3〜4.9mm" },
  { id: "thick", label: "厚い", hint: "5mm 以上" },
];

export function sizeClass(widthMm: number | null): PadSizeClass | null {
  if (widthMm === null || !(widthMm > 0)) return null;
  let found: PadSizeClass = "S";
  for (const c of SIZE_CLASSES) if (widthMm >= c.minWidthMm) found = c.id;
  return found;
}

export function thicknessClass(mm: number | null): PadThickness | null {
  if (mm === null || !(mm > 0)) return null;
  return mm < 3 ? "thin" : mm < 5 ? "normal" : "thick";
}

export function parsePadFilter(sp: SearchParams): PadFilter {
  return {
    surface: pick(firstParam(sp, "surface"), ["all", "cloth", "hybrid", "glass", "hard"] as const, "all"),
    size: pick(firstParam(sp, "size"), ["all", "S", "M", "L", "XL", "XXL"] as const, "all"),
    thickness: pick(firstParam(sp, "thickness"), ["all", "thin", "normal", "thick"] as const, "all"),
    firmness: pick(firstParam(sp, "firmness"), ["all", "variants"] as const, "all"),
  };
}

export function padFilterHref(f: PadFilter, patch: Partial<PadFilter> = {}): string {
  const n = { ...f, ...patch };
  return queryHref("/pads", [["surface", n.surface], ["size", n.size], ["thickness", n.thickness], ["firmness", n.firmness]]);
}

export function isPadFilterEmpty(f: PadFilter): boolean {
  return f.surface === "all" && f.size === "all" && f.thickness === "all" && f.firmness === "all";
}

/** 画面に出すパッド(公式の数字が 1 つもない hidden と、公式 URL のないものを除く) */
export type VisiblePad = PadSpec & { officialUrl: string };
export function visiblePads(pads: readonly PadSpec[]): VisiblePad[] {
  return pads.filter((p): p is VisiblePad => !p.hidden && p.officialUrl !== null);
}

export type PadMatch = { pad: VisiblePad; sizes: PadSize[] };
/**
 * 絞り込み(並びは変えない)。面・硬さはパッドで、大きさ・厚さはサイズごとに見る。
 * 大きさか厚さで絞ったときは、合うサイズだけを sizes に残す。公式の数字がないサイズはどの目安にも入らない。
 */
export function filterPads(pads: readonly VisiblePad[], f: PadFilter): PadMatch[] {
  const bySize = f.size !== "all" || f.thickness !== "all";
  const out: PadMatch[] = [];
  for (const pad of pads) {
    if (f.surface !== "all" && pad.surface !== f.surface) continue;
    if (f.firmness === "variants" && pad.firmnessVariants.length < 2) continue;
    const sizes = pad.sizes.filter(
      (s) => (f.size === "all" || sizeClass(s.widthMm) === f.size) && (f.thickness === "all" || thicknessClass(s.thicknessMm) === f.thickness),
    );
    if (bySize && sizes.length === 0) continue;
    out.push({ pad, sizes });
  }
  return out;
}
```

`src/lib/skate-match.ts`:

```ts
import type { SkateSpec } from "@/data/gear-types";
import { firstParam, pick, queryHref, type SearchParams } from "@/lib/gear-query";

export type SkateFilter = {
  /** devices.ts のマウスの id(知らない id・空は null = 選ばない) */
  mouse: string | null;
  material: "all" | "PTFE" | "glass" | "UPE" | "other";
  shape: "all" | "full" | "dot";
};
export const NO_SKATE_FILTER: SkateFilter = { mouse: null, material: "all", shape: "all" };

export function parseSkateFilter(sp: SearchParams, knownMouseIds: ReadonlySet<string>): SkateFilter {
  const mouse = firstParam(sp, "mouse");
  return {
    mouse: mouse !== null && knownMouseIds.has(mouse) ? mouse : null,
    material: pick(firstParam(sp, "material"), ["all", "PTFE", "glass", "UPE", "other"] as const, "all"),
    shape: pick(firstParam(sp, "shape"), ["all", "full", "dot"] as const, "all"),
  };
}

export function skateFilterHref(f: SkateFilter, patch: Partial<SkateFilter> = {}): string {
  const n = { ...f, ...patch };
  return queryHref("/skates", [["mouse", n.mouse], ["material", n.material], ["shape", n.shape]]);
}

/** そのマウス専用のソール(公式の対応表から結び付けたもの) */
export function skatesForMouse(skates: readonly SkateSpec[], mouseId: string): SkateSpec[] {
  return skates.filter((s) => s.mouseIds.includes(mouseId));
}

/** どのマウスにも使える汎用のドット(機種に結び付けていないドット) */
export function universalSkates(skates: readonly SkateSpec[]): SkateSpec[] {
  return skates.filter((s) => s.shape === "dot" && s.mouseIds.length === 0);
}

/** マウスの id ごとの専用ソールの数(/mouse の「このマウスのソール」と、マウスを選ぶ欄の件数) */
export function skateCounts(skates: readonly SkateSpec[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const s of skates) for (const id of s.mouseIds) out[id] = (out[id] ?? 0) + 1;
  return out;
}

/** 素材・形で絞る(並びは変えない)。素材が公式にないものは素材の絞り込みで外れる */
export function filterSkates(skates: readonly SkateSpec[], f: Pick<SkateFilter, "material" | "shape">): SkateSpec[] {
  return skates.filter((s) => (f.material === "all" || s.material === f.material) && (f.shape === "all" || s.shape === f.shape));
}

/** ブランドごと(最初に出た順。中の並びはデータの順) */
export function groupByBrand(skates: readonly SkateSpec[]): { brand: string; items: SkateSpec[] }[] {
  const groups = new Map<string, SkateSpec[]>();
  for (const s of skates) groups.set(s.brand, [...(groups.get(s.brand) ?? []), s]);
  return [...groups].map(([brand, items]) => ({ brand, items }));
}

export type SkateView =
  | { kind: "mouse"; mouseId: string; dedicated: SkateSpec[]; universal: SkateSpec[] }
  | { kind: "all"; groups: { brand: string; items: SkateSpec[] }[]; total: number };

/** 画面の形:マウスを選んだら「専用」と「汎用のドット」、選ばなければブランド別 */
export function skateView(skates: readonly SkateSpec[], f: SkateFilter): SkateView {
  const narrowed = filterSkates(skates, f);
  if (f.mouse !== null) return { kind: "mouse", mouseId: f.mouse, dedicated: skatesForMouse(narrowed, f.mouse), universal: universalSkates(narrowed) };
  return { kind: "all", groups: groupByBrand(narrowed), total: narrowed.length };
}
```

`src/lib/my-mouse.ts`:

```ts
/**
 * /skates の「マイ設定のマウスで選ぶ」のための小さな読み取り(ブラウザの部品が使う)。
 * マイ設定の読み書きの部品(入力チェック一式)をブラウザの JS に入れないため、キーと id の形だけを写す(テストで一致を確かめる)。
 */
export const MY_SETTINGS_STORAGE_KEY = "robilab:mySettings";
/** src/lib/my-settings.ts の CATALOG_ID_RE と同じ */
export const MOUSE_ID_RE = /^[a-z0-9-]{1,40}$/;

/** 保存されたマイ設定の文字から、候補から選んだマウスの id を読む。読めない・自由入力の名前・形が違うときは null */
export function myMouseIdFrom(raw: string | null): string | null {
  if (!raw) return null;
  try {
    const v: unknown = JSON.parse(raw);
    if (typeof v !== "object" || v === null) return null;
    const devices = (v as { devices?: unknown }).devices;
    if (typeof devices !== "object" || devices === null) return null;
    const mouse = (devices as { mouse?: unknown }).mouse;
    if (typeof mouse !== "object" || mouse === null) return null;
    const id = (mouse as { id?: unknown }).id;
    return typeof id === "string" && MOUSE_ID_RE.test(id) ? id : null;
  } catch {
    return null;
  }
}

/** URL にマウスの指定がまったくないときだけ選び直す(「選ばない」を選んだ ?mouse= は上書きしない) */
export function shouldPreselect(search: string): boolean {
  return !new URLSearchParams(search).has("mouse");
}
```

- [ ] **Step 4: テストが通るのを確かめる**

Run: `npx vitest run tests/lib`
Expected: PASS

- [ ] **Step 5: 4 つの確認**

Run: `npx tsc --noEmit`、`npm run lint`、`npx vitest run`、`npm run build`
Expected: どれもエラー 0(画面はまだ使わないので JS は変わらない)

- [ ] **Step 6: コミット**

```bash
git add src/lib/gear-query.ts src/lib/pad-filter.ts src/lib/skate-match.ts src/lib/my-mouse.ts tests/lib/gear-query.test.ts tests/lib/pad-filter.test.ts tests/lib/skate-match.test.ts tests/lib/my-mouse.test.ts
git -c user.name=pitos -c user.email=pito.shinzin@gmail.com commit -m "feat: パッド・ソールの絞り込み、大きさの目安、ソールの結び付け、マイ設定のマウスの読み取り

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: `/pads` マウスパッド探し(リンクのチップ・生産終了の札)

**Files:**
- Create: `src/components/ui/chip-style.ts`、`src/components/ui/chip-link.tsx`、`src/components/gear/FilterGroup.tsx`、`src/components/gear/PadRow.tsx`、`src/app/pads/page.tsx`
- Modify: `src/components/ui/chip-button.tsx`(クラスを `chip-style.ts` から読む)、`src/components/ui/badge.tsx`(`status`)、`docs/design/js-budget.md`

**Interfaces:**
- Consumes: `PADS`(Task 1)、`byPopularity` `POPULARITY_NOTE` `surfaceLabel` `padSizeText` `withUnit` `NO_DATA`(Task 2)、`ShopButtons`(Task 3)、`parsePadFilter` `filterPads` `padFilterHref` `isPadFilterEmpty` `visiblePads` `SIZE_CLASSES` `THICKNESS_CLASSES` `PadFilter` `VisiblePad` `PadMatch`(Task 5)、`shopLinks` `affiliateEnv`、`subnavFor`、`PageShell` `SubNav` `NumUnit` `EmptyState` `ButtonLink` `SectionHeading` `Card` `Badge`
- Produces:
  - `chipClassName` `chipCheckClassName`(`src/components/ui/chip-style.ts`。`chip-button.tsx` からも今までどおり出す)
  - `ChipLink({ href, current, children, className? })`(サーバーの部品)
  - `FilterGroup({ label, hint?, options: { key: string; text: string; href: string; current: boolean }[] })`(サーバーの部品)
  - `PadRow({ pad, sizes, links, primary, narrowed })`(サーバーの部品)
  - `Badge` の `variant="status"`(生産終了の札。Task 7 も使う)
  - ルート `/pads`(動的。`?surface` `?size` `?thickness` `?firmness`)

- [ ] **Step 1: チップのクラスを、サーバーからも読めるファイルへ分ける**

`src/components/ui/chip-style.ts` を作り、`chip-button.tsx` の `chipClassName` と `chipCheckClassName` の 2 つの定数(とその上のコメント)を**そのまま**移す。ファイルの頭に次のコメント:

```ts
/**
 * チップの見た目のクラス。"use client" のないファイルに置く(サーバーの部品 ChipLink からも文字として読めるように。
 * "use client" のファイルの export をサーバーから読むと、文字ではなくクライアントの参照になる)。chip-button.tsx からも同じものを出す。
 */
```

`src/components/ui/chip-button.tsx` の 2 つの定数の定義を消し、`import { cn } from "@/lib/utils";` の下に足す:

```ts
import { chipCheckClassName, chipClassName } from "./chip-style";

export { chipCheckClassName, chipClassName };
```

(`chip.tsx`・`TypeAxisFilter.tsx` など今 `chip-button` から読んでいる所は変えない。)

- [ ] **Step 2: 生産終了の札(Badge の status)**

`src/components/ui/badge.tsx` の `variant` に 1 行足す:

```ts
      status: "h-6 border border-rl-warning px-2 text-xs text-rl-warning",
```

- [ ] **Step 3: リンクのチップと、絞り込みのまとまり**

`src/components/ui/chip-link.tsx`:

```tsx
import type { ReactNode } from "react";
import Link from "next/link";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { chipClassName } from "./chip-style";

/**
 * 絞り込みのチップをリンクで(URL の ?… を変える。サーバーで絞るので JS を足さない)。選んでいるものは aria-current="true" とチェック。
 * チェックを線で引く動き(rl-draw-check)は付けない(押すとページが入れ替わるので、自動で動くものを足さない)。
 */
export function ChipLink({ href, current, children, className }: { href: string; current: boolean; children: ReactNode; className?: string }) {
  return (
    <Link href={href} scroll={false} aria-current={current ? "true" : undefined}
      className={cn(chipClassName, "aria-[current=true]:border-rl-selected aria-[current=true]:bg-rl-selected-bg", className)}>
      {current && <Check aria-hidden className="size-4 shrink-0" />}
      {children}
    </Link>
  );
}
```

`src/components/gear/FilterGroup.tsx`:

```tsx
import { ChipLink } from "@/components/ui/chip-link";

export type FilterOption = { key: string; text: string; href: string; current: boolean };

/** 1 つの絞り込みのまとまり(見出し+リンクのチップ)。role="group" と aria-label で読み上げる。hint は目安の説明(14px) */
export function FilterGroup({ label, hint, options }: { label: string; hint?: string; options: FilterOption[] }) {
  return (
    <div className="grid gap-2">
      <p aria-hidden className="text-sm font-bold text-rl-muted">{label}</p>
      <div role="group" aria-label={label} className="flex flex-wrap gap-2">
        {options.map((o) => <ChipLink key={o.key} href={o.href} current={o.current}>{o.text}</ChipLink>)}
      </div>
      {hint && <p className="text-sm text-rl-muted">{hint}</p>}
    </div>
  );
}
```

- [ ] **Step 4: パッドの 1 行**

`src/components/gear/PadRow.tsx`:

```tsx
import type { PadSize } from "@/data/gear-types";
import type { VisiblePad } from "@/lib/pad-filter";
import type { ShopLinks } from "@/lib/shop-links";
import { NO_DATA, padSizeText, surfaceLabel, withUnit } from "@/lib/gear-labels";
import { Badge } from "@/components/ui/badge";
import { ShopButtons } from "@/components/gear/ShopButtons";

/**
 * マウスパッドの 1 行(設計書 3-2)。箱にせず、上の線で区切る幅いっぱいの行。
 * 速さ・止めは点数にせず、メーカー公式の言葉を引用の形で出す(出典は公式ページ)。数字は公式の表記のまま。
 */
export function PadRow({ pad, sizes, links, primary, narrowed }: {
  pad: VisiblePad; sizes: PadSize[]; links: ShopLinks;
  /** 一覧の先頭だけ true(主ボタンは 1 画面に 1 つ) */
  primary: boolean;
  /** 大きさ・厚さで絞り込んでいて、合うサイズだけを出しているか */
  narrowed: boolean;
}) {
  return (
    <li className="grid gap-4 border-t border-rl-line py-6">
      <div className="grid min-w-0 gap-1">
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-rl-muted">
          {pad.brand}<span aria-hidden>・</span>{surfaceLabel(pad.surface)}
          {pad.discontinued && <Badge variant="status">生産終了</Badge>}
        </p>
        <h3 data-long-name className="text-2xl font-bold wrap-anywhere">{pad.name}</h3>
      </div>
      <figure className="grid gap-2">
        <figcaption className="text-sm font-bold text-rl-muted">速さ・止め(メーカー公式の言葉)</figcaption>
        {pad.speedOfficial
          ? <blockquote cite={pad.officialUrl} className="border-l-2 border-rl-line-strong pl-4 text-base wrap-anywhere">{pad.speedOfficial}</blockquote>
          : <p className="text-base text-rl-muted">{NO_DATA}</p>}
      </figure>
      <div className="grid gap-2">
        <p className="text-sm font-bold text-rl-muted">サイズ(公式){narrowed && "・絞り込みに合うものだけ"}</p>
        {sizes.length === 0 ? (
          <p className="text-base text-rl-muted">{NO_DATA}</p>
        ) : (
          <table className="w-full max-w-[560px] text-sm">
            <thead className="text-left text-rl-muted">
              <tr><th scope="col" className="py-1 pr-3 font-bold">名前</th><th scope="col" className="py-1 pr-3 font-bold">幅×奥行き</th><th scope="col" className="py-1 font-bold">厚さ</th></tr>
            </thead>
            <tbody>
              {sizes.map((s, i) => (
                <tr key={`${s.label}-${i}`} className="border-t border-rl-line">
                  <td className="py-2 pr-3 wrap-anywhere">{s.label}</td>
                  <td className="py-2 pr-3 tabular-nums">{padSizeText(s.widthMm, s.depthMm)}</td>
                  <td className="py-2 tabular-nums">{withUnit(s.thicknessMm, "mm")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {pad.firmnessVariants.length > 0 && (
        <p className="text-sm text-rl-muted wrap-anywhere">硬さ(公式):<span className="text-rl-text">{pad.firmnessVariants.join("・")}</span></p>
      )}
      <details className="group rounded-rl-sm border border-rl-line">
        <summary className="flex min-h-11 cursor-pointer list-none items-center px-4 text-sm font-bold [&::-webkit-details-marker]:hidden">公式の表記のメモ</summary>
        <p className="px-4 pb-4 text-sm text-rl-muted wrap-anywhere">{pad.note}</p>
      </details>
      <div className="grid gap-2">
        <ShopButtons links={links} primary={primary} />
        <p className="text-xs text-rl-muted">確認日 {pad.checkedAt}</p>
      </div>
    </li>
  );
}
```

- [ ] **Step 5: `/pads` のページ**

`src/app/pads/page.tsx`:

```tsx
import type { Metadata } from "next";
import Link from "next/link";
import { PackageOpen, SearchX } from "lucide-react";
import { PADS } from "@/data/pads";
import { PROS_READY } from "@/data/pros";
import { byPopularity, POPULARITY_NOTE } from "@/lib/gear-popularity";
import type { SearchParams } from "@/lib/gear-query";
import { SURFACE_LABEL } from "@/lib/gear-labels";
import { subnavFor } from "@/lib/nav";
import {
  SIZE_CLASSES, THICKNESS_CLASSES, filterPads, isPadFilterEmpty, padFilterHref, parsePadFilter, visiblePads, type PadFilter,
} from "@/lib/pad-filter";
import { affiliateEnv, shopLinks } from "@/lib/shop-links";
import { PageShell } from "@/components/ui/page-shell";
import { SubNav } from "@/components/brand/SubNav";
import { NumUnit } from "@/components/ui/num-unit";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { ButtonLink } from "@/components/ui/button-link";
import { SectionHeading } from "@/components/ui/section-heading";
import { FilterGroup, type FilterOption } from "@/components/gear/FilterGroup";
import { PadRow } from "@/components/gear/PadRow";

const TITLE = "マウスパッド探し(面・大きさ・厚さで選ぶ)";
const DESCRIPTION = "人気のゲーミングマウスパッドを、メーカー公式の大きさ・厚さと、公式の言葉の「速さ・止め」で比べます。";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: { title: TITLE, description: DESCRIPTION },
  twitter: { card: "summary", title: TITLE, description: DESCRIPTION },
};

const SURFACES = ["cloth", "hybrid", "glass", "hard"] as const;

function options<K extends keyof PadFilter>(filter: PadFilter, key: K, items: readonly (readonly [PadFilter[K], string])[]): FilterOption[] {
  return items.map(([value, text]) => ({ key: String(value), text, href: padFilterHref(filter, { [key]: value } as Partial<PadFilter>), current: filter[key] === value }));
}

export default async function PadsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const filter = parsePadFilter(await searchParams);
  const all = byPopularity(visiblePads(PADS));
  const matches = filterPads(all, filter);
  const env = affiliateEnv();
  const narrowed = filter.size !== "all" || filter.thickness !== "all";

  return (
    <PageShell width="wide" title="マウスパッド探し" description="面・大きさ・厚さで絞り込み、メーカー公式の言葉で「速さ・止め」を読めます。"
      subnav={<SubNav label="感度・マウス" items={subnavFor("mouse", PROS_READY)} />}
      actions={<p className="grid justify-items-end"><NumUnit value={all.length} unit="枚" className="text-rl-display-2" /><span className="text-sm text-rl-muted">公式の数字で比べられる数</span></p>}>
      <div className="grid gap-8">
        <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)] lg:items-start">
          <Card as="section" aria-labelledby="pads-filters" className="grid gap-4 lg:sticky lg:top-6">
            <h2 id="pads-filters" className="text-xl font-bold">絞り込み</h2>
            <FilterGroup label="面" options={options(filter, "surface", [["all", "すべて"], ...SURFACES.map((s) => [s, SURFACE_LABEL[s]] as const)])} />
            <FilterGroup label="大きさ" hint={`公式の横幅で分けた目安です(${SIZE_CLASSES.map((c) => `${c.id} ${c.hint}`).join("・")})。`}
              options={options(filter, "size", [["all", "すべて"], ...SIZE_CLASSES.map((c) => [c.id, c.id] as const)])} />
            <FilterGroup label="厚さ" hint={`公式の厚さがあるサイズだけで分けます(${THICKNESS_CLASSES.map((c) => `${c.label} ${c.hint}`).join("・")})。`}
              options={options(filter, "thickness", [["all", "すべて"], ...THICKNESS_CLASSES.map((c) => [c.id, c.label] as const)])} />
            <FilterGroup label="硬さ" options={options(filter, "firmness", [["all", "すべて"], ["variants", "硬さを選べる"]])} />
            {!isPadFilterEmpty(filter) && <ButtonLink href="/pads" scroll={false} variant="ghost" size="sm" className="justify-self-start">絞り込みを外す</ButtonLink>}
          </Card>

          <section aria-labelledby="pads-results" className="grid gap-4">
            <SectionHeading id="pads-results" title="人気の順" count={matches.length} />
            <p className="flex flex-wrap items-center gap-2 text-sm text-rl-muted"><Badge variant="pr">PR</Badge>このリンクから買うと、ロビラボに紹介料が入ることがあります</p>
            {all.length === 0 ? (
              <EmptyState icon={PackageOpen} title="マウスパッドのデータがまだありません" description="先にマウス探しで、手に合うマウスを見られます。"
                action={<ButtonLink href="/mouse" variant="secondary">マウス探しへ</ButtonLink>} />
            ) : matches.length === 0 ? (
              <EmptyState icon={SearchX} title="条件に合うマウスパッドがありません" description="絞り込みを 1 つ外すと見つかりやすくなります。"
                action={<ButtonLink href="/pads" scroll={false} variant="secondary">絞り込みを外す</ButtonLink>} />
            ) : (
              <ol className="grid">
                {matches.map((m, i) => (
                  <PadRow key={m.pad.id} pad={m.pad} sizes={m.sizes} narrowed={narrowed} primary={i === 0}
                    links={shopLinks(`${m.pad.brand} ${m.pad.name}`, m.pad.officialUrl, env)} />
                ))}
              </ol>
            )}
          </section>
        </div>
        <div className="grid gap-2 text-xs text-rl-muted">
          <p>{POPULARITY_NOTE}</p>
          <p>大きさ・厚さ・速さと止めの言葉は、各メーカー公式サイトの表記です(確認日は製品ごと)。公式に書いていないものは「公式の記載なし」と出し、速さ・止めは点数にしません。生産終了は公式ページに書いてあるものだけ札を付けています。</p>
          <p>価格や在庫は各ショップでご確認ください。Amazon・楽天のリンクには広告(PR)が含まれる場合があります(<Link href="/disclosure" className="text-rl-accent underline">広告表記</Link>)。</p>
        </div>
      </div>
    </PageShell>
  );
}
```

(`options` の `{ [key]: value } as Partial<PadFilter>` は、計算したキーの型を TS が広げるための 1 か所だけの型の合わせ。値は `items` の型で守られている。)

- [ ] **Step 6: 4 つの確認**

Run: `npx tsc --noEmit`、`npm run lint`、`npx vitest run`、`npm run build`
Expected: どれもエラー 0。`npm run build` の出力で `/pads` が `ƒ`(動的)。

- [ ] **Step 7: JS の確認**

「JS の測り方」のコマンド。`/pads` − `/terms` が 4.0KB 以下(ブラウザの部品は SubNav だけの見込みで、ほぼ 0)。`chip-style.ts` に分けた分で `/mouse` `/my` `/types` が ±0.3KB 以内。`js-budget.md` に `| Task 6(/pads) | … |`。

- [ ] **Step 8: コントローラーのブラウザ確認**

`robilab-prod-build` を起動して `/pads`:
- [ ] 375×812 と 1440×900 の最初の画面と全体。h1「マウスパッド探し」、右上(375 では h1 の下)に「41 枚」(数はマゼンタの Orbitron、単位は白)
- [ ] 並びの先頭が「G240 クロス ゲーミングマウスパッド」で、Amazon のボタンが主ボタン(シアンはこの 1 つだけ)
- [ ] 「NINJA FX シデンカイ V2」「G-SR」「G-TR」に「生産終了」の札。全部 null の 7 件(VAXEE PA・HyperX Pulsefire Mat など)が出ていない。「eS Saturn Pro」のブランドが「Pulsar」
- [ ] チップ「ガラス」→ URL が `/pads?surface=glass`、チップにチェックと選んだ枠、件数が減る。スクロール位置が上に飛ばない。ブラウザの「戻る」で前の絞り込みに戻る
- [ ] 「XXL」+「薄い」など 0 件になる組み合わせ → 空の状態と「絞り込みを外す」。押すと `/pads` に戻る
- [ ] 「大きさ」を選ぶと表に「絞り込みに合うものだけ」と、合うサイズだけ
- [ ] `/pads?surface=GLASS&size=XS&surface=x` を直接開いても落ちず「すべて」で出る
- [ ] Tab キーでチップ・店のボタン・メモの開閉にフォーカスの線が見える。メモの開閉が 44px
- [ ] SubNav はまだ「マウスパッド」を含まない(Task 8 で足す)
- [ ] 375 ではみ出し確認スクリプト `true`(「MM350 PRO … Extended XL」が折れる)。コンソールのエラー 0 件

- [ ] **Step 9: コミット**

```bash
git add src/components/ui/chip-style.ts src/components/ui/chip-button.tsx src/components/ui/chip-link.tsx src/components/ui/badge.tsx src/components/gear/FilterGroup.tsx src/components/gear/PadRow.tsx src/app/pads/page.tsx docs/design/js-budget.md
git -c user.name=pitos -c user.email=pito.shinzin@gmail.com commit -m "feat: /pads マウスパッド探し(サーバーで絞るリンクのチップ・公式の言葉の速さと止め・生産終了の札)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: `/skates` ソール探しと、`/mouse` からの「このマウスのソール」

**Files:**
- Create: `src/components/gear/SkateRow.tsx`、`src/components/gear/MyMousePreselect.tsx`、`src/app/skates/page.tsx`
- Modify: `src/app/mouse/page.tsx`(ソールの数)、`src/app/mouse/MouseClient.tsx`(**読み直してから**。ソールへのリンクを渡す)、`src/components/mouse/MouseCard.tsx`、`src/components/mouse/TopMouseRow.tsx`、`src/components/mouse/OtherMiceList.tsx`、`docs/design/js-budget.md`

**Interfaces:**
- Consumes: `SKATES` `DEVICES`、`parseSkateFilter` `skateView` `skateCounts` `skateFilterHref` `SkateFilter` `SkateView`(Task 5)、`firstParam` `SearchParams`(Task 5)、`myMouseIdFrom` `shouldPreselect` `MY_SETTINGS_STORAGE_KEY`(Task 5)、`materialLabel` `skateThicknessText` `packText` `SKATE_SHAPE_LABEL` `POPULARITY_NOTE` なし(ソールはブランド別)、`ShopButtons`(Task 3)、`FilterGroup` `Badge status`(Task 6)、`toMouseRows` の 4 つ目の引数 `skateCounts`(Task 3)
- Produces:
  - ルート `/skates`(動的。`?mouse` `?material` `?shape` `?from=my`)
  - `SkateRow({ skate, links, primary })`(サーバーの部品)
  - `MyMousePreselect()`(ブラウザの部品。何も描かない)
  - `MouseCard` `TopMouseRow` の props に `skateHref?: string | null`

- [ ] **Step 1: ソールの 1 行と、マイ設定のマウスで選び直す部品**

`src/components/gear/SkateRow.tsx`:

```tsx
import type { SkateSpec } from "@/data/gear-types";
import type { ShopLinks } from "@/lib/shop-links";
import { SKATE_SHAPE_LABEL, materialLabel, packText, skateThicknessText } from "@/lib/gear-labels";
import { Badge } from "@/components/ui/badge";
import { ShopButtons } from "@/components/gear/ShopButtons";

/** マウスソールの 1 行(設計書 3-3)。厚さは公式に 1 つの数字があるときだけ mm、幅の表記は公式の原文のまま。 */
export function SkateRow({ skate, links, primary }: { skate: SkateSpec; links: ShopLinks; primary: boolean }) {
  return (
    <li className="grid gap-4 border-t border-rl-line py-6 md:grid-cols-[minmax(0,1fr)_auto] md:items-start md:gap-6">
      <div className="grid min-w-0 gap-2">
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-rl-muted">
          {skate.brand}<span aria-hidden>・</span>{SKATE_SHAPE_LABEL[skate.shape]}
          {skate.discontinued && <Badge variant="status">生産終了</Badge>}
        </p>
        <h3 data-long-name className="text-xl font-bold wrap-anywhere">{skate.name}</h3>
        <p className="text-sm text-rl-muted wrap-anywhere">対応(公式の表記):{skate.forMouse}</p>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm md:grid-cols-3">
          <div className="min-w-0"><dt className="text-rl-muted">素材</dt><dd className="wrap-anywhere">{materialLabel(skate.material)}</dd></div>
          <div className="min-w-0"><dt className="text-rl-muted">厚さ</dt><dd className="wrap-anywhere">{skateThicknessText(skate.thicknessMm, skate.thicknessOfficial)}</dd></div>
          <div className="min-w-0"><dt className="text-rl-muted">入数</dt><dd className="wrap-anywhere">{packText(skate.piecesPerPack, skate.setsPerPack)}</dd></div>
        </dl>
        {skate.materialOfficial && <p className="text-sm text-rl-muted wrap-anywhere">素材の公式の表記:「{skate.materialOfficial}」</p>}
        {skate.extras.length > 0 && <p className="text-sm text-rl-muted wrap-anywhere">付属(公式):{skate.extras.join("・")}</p>}
        <p className="text-xs text-rl-muted">確認日 {skate.checkedAt}</p>
      </div>
      <ShopButtons links={links} primary={primary} className="md:justify-end" />
    </li>
  );
}
```

`src/components/gear/MyMousePreselect.tsx`:

```tsx
"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { MY_SETTINGS_STORAGE_KEY, myMouseIdFrom, shouldPreselect } from "@/lib/my-mouse";

/**
 * URL にマウスの指定がまったくないときだけ、マイ設定(この端末の保存)のマウスで選び直す(設計書 3-3)。何も描かない。
 * サーバーが知らない id は無視されるが、URL に ?mouse= が付くので、選び直しは 1 回だけ。
 */
export function MyMousePreselect() {
  const router = useRouter();
  useEffect(() => {
    if (!shouldPreselect(window.location.search)) return;
    let raw: string | null = null;
    try {
      raw = window.localStorage.getItem(MY_SETTINGS_STORAGE_KEY);
    } catch {
      return; // 保存が使えない(プライベートモードなど)
    }
    const id = myMouseIdFrom(raw);
    if (!id) return;
    const q = new URLSearchParams(window.location.search);
    q.set("mouse", id);
    q.set("from", "my");
    router.replace(`/skates?${q.toString()}`, { scroll: false });
  }, [router]);
  return null;
}
```

- [ ] **Step 2: `/skates` のページ**

`src/app/skates/page.tsx`:

```tsx
import type { Metadata } from "next";
import Link from "next/link";
import { SearchX } from "lucide-react";
import { SKATES } from "@/data/skates";
import { DEVICES } from "@/data/devices";
import { PROS_READY } from "@/data/pros";
import type { SkateSpec } from "@/data/gear-types";
import { firstParam, type SearchParams } from "@/lib/gear-query";
import { subnavFor } from "@/lib/nav";
import { affiliateEnv, shopLinks, type AffiliateEnv } from "@/lib/shop-links";
import { parseSkateFilter, skateCounts, skateFilterHref, skateView, type SkateFilter } from "@/lib/skate-match";
import { PageShell } from "@/components/ui/page-shell";
import { SubNav } from "@/components/brand/SubNav";
import { NumUnit } from "@/components/ui/num-unit";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { ButtonLink, buttonVariants } from "@/components/ui/button-link";
import { NativeSelect } from "@/components/ui/native-select";
import { SectionHeading } from "@/components/ui/section-heading";
import { FilterGroup, type FilterOption } from "@/components/gear/FilterGroup";
import { SkateRow } from "@/components/gear/SkateRow";
import { MyMousePreselect } from "@/components/gear/MyMousePreselect";

const TITLE = "マウスソール探し(自分のマウスに合うソール)";
const DESCRIPTION = "使っているマウスに合うマウスソール(マウスフィート)を、メーカー公式の素材・厚さ・入数で一覧します。";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: { title: TITLE, description: DESCRIPTION },
  twitter: { card: "summary", title: TITLE, description: DESCRIPTION },
};

const MATERIALS = [["all", "すべて"], ["PTFE", "PTFE"], ["glass", "ガラス"], ["UPE", "UPE"], ["other", "その他"]] as const;
const SHAPES = [["all", "すべて"], ["full", "機種専用の形"], ["dot", "汎用のドット"]] as const;

function options<K extends "material" | "shape">(filter: SkateFilter, key: K, items: readonly (readonly [SkateFilter[K], string])[]): FilterOption[] {
  return items.map(([value, text]) => ({ key: String(value), text, href: skateFilterHref(filter, { [key]: value } as Partial<SkateFilter>), current: filter[key] === value }));
}

function SkateList({ skates, env, primaryFirst }: { skates: SkateSpec[]; env: AffiliateEnv; primaryFirst: boolean }) {
  return (
    <ul className="grid">
      {skates.map((s, i) => <SkateRow key={s.id} skate={s} primary={primaryFirst && i === 0} links={shopLinks(`${s.brand} ${s.name}`, s.officialUrl, env)} />)}
    </ul>
  );
}

export default async function SkatesPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  const mice = DEVICES.filter((d) => d.category === "mouse");
  const counts = skateCounts(SKATES);
  const filter = parseSkateFilter(sp, new Set(mice.map((m) => m.id)));
  const view = skateView(SKATES, filter);
  const selected = filter.mouse === null ? undefined : mice.find((m) => m.id === filter.mouse);
  const fromMy = firstParam(sp, "from") === "my" && selected !== undefined;
  const env = affiliateEnv();
  const withSkates = mice.filter((m) => (counts[m.id] ?? 0) > 0);
  const withoutSkates = mice.filter((m) => (counts[m.id] ?? 0) === 0);
  const shownCount = view.kind === "mouse" ? view.dedicated.length + view.universal.length : view.total;
  const clearHref = skateFilterHref(filter, { material: "all", shape: "all" });
  const filtered = filter.material !== "all" || filter.shape !== "all";

  return (
    <PageShell width="wide" title="マウスソール探し" description="使っているマウスを選ぶと、合うソールだけを公式の素材・厚さ・入数で並べます。"
      subnav={<SubNav label="感度・マウス" items={subnavFor("mouse", PROS_READY)} />}
      actions={<p className="grid justify-items-end"><NumUnit value={shownCount} unit="件" className="text-rl-display-2" /><span className="text-sm text-rl-muted">{selected ? "このマウスに使える数" : "公式の数字で比べられる数"}</span></p>}>
      <div className="grid gap-8">
        <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)] lg:items-start">
          <div className="grid gap-6 lg:sticky lg:top-6">
            <Card as="section" aria-labelledby="skate-mouse" className="grid gap-4">
              <h2 id="skate-mouse" className="text-xl font-bold">マウスを選ぶ</h2>
              <form action="/skates" method="get" className="grid gap-3">
                <label htmlFor="skate-mouse-select" className="text-sm font-bold">使っているマウス</label>
                <NativeSelect id="skate-mouse-select" name="mouse" defaultValue={filter.mouse ?? ""}>
                  <option value="">選ばない(ブランド別にすべて)</option>
                  <optgroup label="専用のソールが載っているマウス">
                    {withSkates.map((m) => <option key={m.id} value={m.id}>{`${m.brand} ${m.name}(${counts[m.id]} 件)`}</option>)}
                  </optgroup>
                  <optgroup label="専用のソールがまだないマウス">
                    {withoutSkates.map((m) => <option key={m.id} value={m.id}>{`${m.brand} ${m.name}`}</option>)}
                  </optgroup>
                </NativeSelect>
                {filter.material !== "all" && <input type="hidden" name="material" value={filter.material} />}
                {filter.shape !== "all" && <input type="hidden" name="shape" value={filter.shape} />}
                <button type="submit" className={buttonVariants({ variant: selected ? "secondary" : "primary" })}>このマウスで絞り込む</button>
              </form>
              {fromMy && <p className="text-sm text-rl-muted">マイ設定のマウス({selected.brand} {selected.name})で絞り込みました。</p>}
              <MyMousePreselect />
            </Card>
            <Card as="section" aria-labelledby="skate-filters" className="grid gap-4">
              <h2 id="skate-filters" className="text-xl font-bold">絞り込み</h2>
              <FilterGroup label="素材" options={options(filter, "material", MATERIALS)} />
              <FilterGroup label="形" options={options(filter, "shape", SHAPES)} />
              {filtered && <ButtonLink href={clearHref} scroll={false} variant="ghost" size="sm" className="justify-self-start">絞り込みを外す</ButtonLink>}
            </Card>
          </div>

          <div className="grid gap-6">
            <p className="flex flex-wrap items-center gap-2 text-sm text-rl-muted"><Badge variant="pr">PR</Badge>このリンクから買うと、ロビラボに紹介料が入ることがあります</p>
            {view.kind === "mouse" ? (
              <>
                <section aria-labelledby="skates-dedicated" className="grid gap-4">
                  <SectionHeading id="skates-dedicated" title={`${selected?.brand ?? ""} ${selected?.name ?? ""} 専用`} count={view.dedicated.length} />
                  {view.dedicated.length === 0 ? (
                    <EmptyState icon={SearchX} title={filtered ? "条件に合う専用のソールがありません" : "このマウス専用のソールはまだ載っていません"}
                      description={filtered ? "絞り込みを外すと見つかることがあります。" : "下の汎用のドットなら、どのマウスにも貼れます。"}
                      action={filtered ? <ButtonLink href={clearHref} scroll={false} variant="secondary">絞り込みを外す</ButtonLink> : undefined} />
                  ) : (
                    <SkateList skates={view.dedicated} env={env} primaryFirst />
                  )}
                </section>
                <section aria-labelledby="skates-universal" className="grid gap-4">
                  <SectionHeading id="skates-universal" title="どのマウスにも使える汎用のドット" count={view.universal.length} />
                  {view.universal.length === 0
                    ? <p className="text-sm text-rl-muted">この絞り込みでは、汎用のドットはありません。</p>
                    : <SkateList skates={view.universal} env={env} primaryFirst={view.dedicated.length === 0} />}
                </section>
              </>
            ) : view.total === 0 ? (
              <EmptyState icon={SearchX} title="条件に合うソールがありません" description="絞り込みを 1 つ外すと見つかりやすくなります。"
                action={<ButtonLink href={clearHref} scroll={false} variant="secondary">絞り込みを外す</ButtonLink>} />
            ) : (
              <>
                <p className="text-base">マウスを選ぶと、合うソールだけに絞り込めます。</p>
                {view.groups.map((g, i) => (
                  <section key={g.brand} aria-labelledby={`skates-brand-${i}`} className="grid gap-4">
                    <SectionHeading id={`skates-brand-${i}`} title={g.brand} count={g.items.length} />
                    <SkateList skates={g.items} env={env} primaryFirst={false} />
                  </section>
                ))}
              </>
            )}
          </div>
        </div>
        <div className="grid gap-2 text-xs text-rl-muted">
          <p>素材・厚さ・入数は、各メーカー公式サイトの表記です(確認日は製品ごと)。厚さは公式に 1 つの数字があるときだけ mm で出し、幅のある表記は公式の文をそのまま載せています。公式に書いていないものは「公式の記載なし」です。</p>
          <p>「専用」は、メーカー公式の対応の表記からマウスに結び付けたものです。名前が同じか確かめられないものは結び付けず、「選ばない」の一覧にだけ出しています。</p>
          <p>価格や在庫は各ショップでご確認ください。Amazon・楽天のリンクには広告(PR)が含まれる場合があります(<Link href="/disclosure" className="text-rl-accent underline">広告表記</Link>)。</p>
        </div>
      </div>
    </PageShell>
  );
}
```

(主ボタンは 1 つだけ:マウスを選んでいないときは「このマウスで絞り込む」、選んだときは一覧の先頭の Amazon。ブランド別の一覧では店のボタンはすべて二番手。)

- [ ] **Step 3: `/mouse` から「このマウスのソール」へ**

`src/app/mouse/page.tsx`:import に `import { SKATES } from "@/data/skates";` と `import { skateCounts } from "@/lib/skate-match";` を足し、`toMouseRows(MICE, (id) => DEVICES.find((d) => d.id === id), MICE_RAKUTEN)` を `toMouseRows(MICE, (id) => DEVICES.find((d) => d.id === id), MICE_RAKUTEN, skateCounts(SKATES))` にする。

`src/components/mouse/MouseCard.tsx` と `src/components/mouse/TopMouseRow.tsx`:import に `import { ChevronRight } from "lucide-react";`(`MouseCard` は今の `ExternalLink` の import に足す)と `import { ButtonLink } from "@/components/ui/button-link";` を足す(`ButtonAnchor` と同じ import にまとめてよい)。props に足す:

```tsx
  /** このマウス専用のソールがあるときだけ(/skates?mouse=<id>) */
  skateHref?: string | null;
```

(関数の引数の分割に `skateHref = null` を足す。)`MouseCard` は `{onOverlay && <ChipButton …>手と重ねる</ChipButton>}` の行のすぐ下、`TopMouseRow` は `<ChipButton … >手と重ねる</ChipButton>` の行のすぐ下に足す:

```tsx
        {skateHref && <ButtonLink href={skateHref} variant="ghost" size="sm" className="justify-self-start">このマウスのソール<ChevronRight aria-hidden className="size-4" /></ButtonLink>}
```

`src/app/mouse/MouseClient.tsx` を**読み直してから**、Task 3 で置き換えた `shown.map` の中で、`<TopMouseRow …/>` と `<MouseCard …/>` の両方に `skateHref={m.skateCount > 0 ? `/skates?mouse=${m.id}` : null}` を足す。

`src/components/mouse/OtherMiceList.tsx`:import に `import { ChevronRight } from "lucide-react";` と `import { ButtonLink } from "@/components/ui/button-link";` を足し、`</dl>` の下に足す:

```tsx
              {m.skateCount > 0 && <ButtonLink href={`/skates?mouse=${m.id}`} variant="ghost" size="sm" className="justify-self-start">このマウスのソール<ChevronRight aria-hidden className="size-4" /></ButtonLink>}
```

- [ ] **Step 4: 4 つの確認**

Run: `npx tsc --noEmit`、`npm run lint`、`npx vitest run`、`npm run build`
Expected: どれもエラー 0。`/skates` が `ƒ`(動的)、`/mouse` は静的のまま。

- [ ] **Step 5: JS の確認**

「JS の測り方」のコマンド。`/skates` − `/terms` が 4.0KB 以下(`MyMousePreselect` と `my-mouse.ts` の分。目安 1KB 以内)。`/mouse` は Task 1 の基準から +4.0KB 以下(リンクの分はわずか)。`js-budget.md` に `| Task 7(/skates) | … |`。

- [ ] **Step 6: コントローラーのブラウザ確認**

`robilab-prod-build` を起動して:
- [ ] `/skates`(マイ設定が空の状態)375 と 1440:h1「マウスソール探し」、「58 件」、主ボタン「このマウスで絞り込む」、「マウスを選ぶと、合うソールだけに絞り込めます。」、ブランド別(ESPTIGER から)
- [ ] 選ぶ欄で「Logicool G PRO X SUPERLIGHT 2(13 件)」→ 送る → `/skates?mouse=logicool-g-pro-x-superlight-2`、「… 専用」13 件+「汎用のドット」8 件、先頭の Amazon が主ボタン、送るボタンは二番手に
- [ ] ESPTIGER の厚さが「a thickness ranging from 0.7 to 0.8mm」(原文)、Corepad は「0.7mm」など。入数がない所は「公式の記載なし」
- [ ] 「Logicool G G203 LIGHTSYNC」(専用なし)→ 空の状態「このマウス専用のソールはまだ載っていません」と汎用のドット
- [ ] 素材「UPE」+マウスを選んだ状態 → 専用 0 件の空の状態(絞り込みを外す)と、汎用に UHMW-PE のドット 1 件。「絞り込みを外す」でマウスは残る
- [ ] `/my` でマウスに「Razer Viper V3 Pro」を選んでから `/skates` を開く → URL が `?mouse=razer-viper-v3-pro&from=my` に置き換わり「マイ設定のマウス(Razer Viper V3 Pro)で絞り込みました。」。選ぶ欄で「選ばない」を送る → `?mouse=` で、マイ設定に戻されない
- [ ] コンソールで `localStorage.setItem("robilab:mySettings", JSON.stringify({devices:{mouse:{id:"no-such-mouse"}}}))` → `/skates` を開き直す → `?mouse=no-such-mouse&from=my` で 1 回だけ置き換わり、ブランド別の一覧(ループしない・落ちない)。終わったら `localStorage.removeItem("robilab:mySettings")`
- [ ] `/mouse` で手を入れた結果:PRO X SUPERLIGHT 2 のカードに「このマウスのソール」→ `/skates?mouse=logicool-g-pro-x-superlight-2`。専用ソールのない機種(例 G203)には出ない。比べられない段の EC2-CW に出る
- [ ] Tab でフォーム・チップ・店のボタンにフォーカスの線。375 ではみ出し確認スクリプト `true`。コンソールのエラー・Hydration の警告 0 件

- [ ] **Step 7: コミット**

```bash
git add src/components/gear/SkateRow.tsx src/components/gear/MyMousePreselect.tsx src/app/skates/page.tsx src/app/mouse/page.tsx src/app/mouse/MouseClient.tsx src/components/mouse/MouseCard.tsx src/components/mouse/TopMouseRow.tsx src/components/mouse/OtherMiceList.tsx docs/design/js-budget.md
git -c user.name=pitos -c user.email=pito.shinzin@gmail.com commit -m "feat: /skates ソール探し(マウスを選ぶ・マイ設定から・汎用のドット)と /mouse からのリンク

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 8: ナビ(タブの今いる場所と SubNav)

**Files:**
- Modify: `src/lib/nav.ts`、`tests/lib/nav.test.ts`、`docs/design/js-budget.md`

**Interfaces:**
- Consumes: なし(`NAV_TABS` `SUBNAV` の中身だけ変える)
- Produces: `NAV_TABS` の「マウス」の `match` に `/pads` `/skates`、`subnavFor("mouse", prosReady)` が `["/mouse", "/pads", "/skates", "/tools/sensitivity", ("/pros")]`

- [ ] **Step 1: 失敗するテストを書く**

`tests/lib/nav.test.ts` の `activeTabId` の `it.each([...])("%s → %s"` の配列に足す:

```ts
    ["/pads", "mouse"], ["/pads?surface=glass", "mouse"], ["/skates", "mouse"], ["/skates?mouse=razer-viper-v3-pro", "mouse"],
```

`→ null` の配列に `["/padsx"], ["/skate"]` を足す。`subnav` の「プロ設定はデータが入るまで出さない」を次にする:

```ts
  it("マウスの段はマウス探し・マウスパッド・ソール・感度計算(プロ設定はデータが入るまで出さない)", () => {
    expect(subnavFor("mouse", false).map((i) => i.href)).toEqual(["/mouse", "/pads", "/skates", "/tools/sensitivity"]);
    expect(subnavFor("mouse", false).map((i) => i.label)).toEqual(["マウス探し", "マウスパッド", "ソール", "感度計算"]);
    expect(subnavFor("mouse", true).map((i) => i.href)).toEqual(["/mouse", "/pads", "/skates", "/tools/sensitivity", "/pros"]);
    expect(subnavFor("diagnosis", false).map((i) => i.label)).toEqual(["診断", "タイプ一覧"]);
  });
```

「今いるページの印」に足す:

```ts
    const mouse = subnavFor("mouse", false);
    expect(activeSubnavHref("/skates?mouse=razer-viper-v3-pro", mouse)).toBe("/skates");
    expect(activeSubnavHref("/pads/", mouse)).toBe("/pads");
```

Run: `npx vitest run tests/lib/nav.test.ts`
Expected: FAIL(`/pads` が null・SubNav が 3 つ)

- [ ] **Step 2: ナビを足す**

`src/lib/nav.ts`:「マウス」のタブを次にする:

```ts
  { id: "mouse", href: "/mouse", label: "マウス", match: ["/mouse", "/pads", "/skates", "/tools/sensitivity", "/pros"] },
```

`SUBNAV.mouse` を次にする:

```ts
  mouse: [
    { href: "/mouse", label: "マウス探し" },
    { href: "/pads", label: "マウスパッド" },
    { href: "/skates", label: "ソール" },
    { href: "/tools/sensitivity", label: "感度計算" },
    { href: "/pros", label: "プロ設定" },
  ],
```

Run: `npx vitest run tests/lib/nav.test.ts`
Expected: PASS

- [ ] **Step 3: 4 つの確認と JS**

Run: `npx tsc --noEmit`、`npm run lint`、`npx vitest run`、`npm run build`。続けて「JS の測り方」(どのページも ±0.1KB の見込み)。`js-budget.md` に `| Task 8(ナビ) | … |`。

- [ ] **Step 4: コントローラーのブラウザ確認**

- [ ] 375:`/mouse` `/pads` `/skates` `/tools/sensitivity` の SubNav が 1 行に収まり(4 つ)、今いるページにパープルの下線。下のタブ「マウス」が光る
- [ ] 1440:ヘッダーの「マウス」に今いる場所の下線(`/pads` `/skates` でも)
- [ ] SubNav から 4 ページを行き来して、コンソールに Hydration の警告 0 件。はみ出し確認 `true`

- [ ] **Step 5: コミット**

```bash
git add src/lib/nav.ts tests/lib/nav.test.ts docs/design/js-budget.md
git -c user.name=pitos -c user.email=pito.shinzin@gmail.com commit -m "feat: ナビに マウスパッド・ソール(タブの今いる場所と SubNav)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 9: 品質の自己採点・差分のセキュリティ監査・正本の更新

**だれが:** コントローラー(CEO)。直しは 1 つずつ担当へ小さなタスクで振るか、コントローラーが行う(担当はサーバーを起動しない)。採点は最大 3 回。届かない画面は社長に聞く。

**Files:**
- Create / Modify: `docs/design/score/mouse.md`(節を足す)、`docs/design/score/pads.md`(新)、`docs/design/score/skates.md`(新)、`docs/design/review/2026-10-03-gear-roundN/notes.md`(新)
- Modify: `plan.md`(決定の行・進捗の行・社長の確認)、`docs/design/js-budget.md`(まとめの行)、直しのコミットで触る画面のファイル

**Interfaces:**
- Consumes: Task 1〜8 のすべて、`.claude/launch.json` の `robilab-prod-build`、ui-polish の Task 19 のルーブリック(下に再掲)
- Produces: 合格の判定と記録、監査の結果(コードの関数は作らない)

**採点する状態(375×812 は全部、1440×900 は「ふつう」)**

| 画面 | URL | 状態 |
|---|---|---|
| mouse | `/mouse` | 入力前 / 結果(手を入れて)/ 絞り込み 0 件 / 比べられない段 |
| pads | `/pads` | ふつう / 絞り込み(`?surface=glass&size=XL`)/ 0 件(`?size=S&thickness=thick`) |
| skates | `/skates` | 選ばない / マウスを選んだ(`?mouse=logicool-g-pro-x-superlight-2`)/ マイ設定から / 専用 0 件(`?mouse=logicool-g203`)/ 絞り込み 0 件 |

**ルーブリック(ui-polish Task 19 と同じ。画面ごとに 4 観点)**

| 観点 | 8 点の条件(全部満たす) |
|---|---|
| Design(40%) | ① 375 と 1440 の写真で、一番大きい文字と本文の差が 6 倍以上 ② 色の役割の違反 0(シアンは押せるものだけ・数字はマゼンタ)③ 余白が 8 の倍数で、間の 3 段が守られている ④ 同じ形の箱が 4 つ以上並ぶのは同じ種類の一覧だけ ⑤ 線かマスの言葉が少なくとも 1 つ見える ⑥ 文字の段階の外のサイズ 0 |
| Usability(30%) | ① 主ボタンが 1 つで、5 秒で次にやることが分かる ② 44px・フォーカス・コントラスト・reduced-motion の違反 0 ③ 空・読み込み中・エラー・成功を全部出して崩れない ④ 375px で横スクロールなし ⑤ Lighthouse(スマホ)Performance 90 以上・Accessibility 100 ⑥ 動きのせいで押すのが遅れない |
| Creativity(20%) | ① S1〜S5 か 6 章の「このサイトだけの表現」が 1 つある ② それが飾りではなく中身を伝える ③ 触ると答える |
| Content(10%) | ① 「なぜ」が書いてある ② 数字に単位と比べる相手がある ③ 文言が設計書のルール(謝らない・行き先を書く・→ を書かない)を守る ④ 空の画面で次にやることがある |

- 点の付け方:8 点の条件を全部満たして 8。1 つ欠けるごとに −0.5。重みつき平均 = 0.4×D + 0.3×U + 0.2×C + 0.1×Ct。
- **合格:3 画面とも 4 観点すべて 8 以上、かつ重みつき平均 8.2 以上**。Lighthouse は社長の計測まで「仮」(ui-polish Task 19 と同じ:LCP 2.5 秒以下・CLS 0.05 以下・TBT 200ms 以下なら仮に満たす)。
- 点は写真と計測を見ながら付ける(記憶で付けない)。

- [ ] **Step 1: 本番の形で起動**

Run: `npm run build`。`preview_start` で `robilab-prod-build`(port 3100)。`notes.md` を作り、回の番号・日付・`git rev-parse --short HEAD` を書く。

- [ ] **Step 2: 写真(上の表の状態をすべて)**

375×812 で最初の画面と全体(下へ 1 画面ずつ)、1440×900 で「ふつう」の最初の画面と全体。`/mouse` の結果は、入力画面で手の長さ 18.5・持ち方「かぶせ持ち」を入れて「合うマウスを見る」(保存のキーは `robilab:mySettings`。前回の採点で結果の写真が撮れなかったので、画面に手の値が出ているのを確かめてから撮る)。マイ設定からの `/skates` は `/my` でマウスを選んでから。終わったら `resize_window` を `desktop` に戻す。気づき(例「1440 の一番大きい文字は 41 枚の 120px、本文 16px → 7.5 倍」)を `notes.md` に書く。

- [ ] **Step 3: 速さの計測(3 画面。375×812、再読み込みしてから)**

ui-polish Task 19 の Step 4 の JS(LCP・CLS・TBT・長いタスク)を `javascript_tool` で流し、`notes.md` に書く。LCP の要素が文字(h1 か説明)で、CLS 0.05 以下か。あわせて「JS の測り方」のコマンドで 3 画面の値と、Task 1 の基準からの差を `js-budget.md` に `| デバイスの広がり まとめ | … |`(`/pads` `/skates` は `/terms` との差も)。

- [ ] **Step 4: キーボードと reduced-motion**

`/pads` で Tab と Enter だけで:チップ → 一覧の先頭の店のボタンまで行けるか。`/skates` で選ぶ欄 → 送る → 一覧。フォーカスの線が見えるか。新しく足した自動の動きがないことを確かめる(チップのチェックは線を引かずに出る)。

- [ ] **Step 5: 採点を書く**

`docs/design/score/<画面>.md` に節を足す(なければ作る。形は `docs/design/score/mouse.md` の「最終」の節と同じ:見たもの・合格の線・4 観点の表(点・満たしていない条件・根拠)・重みつき平均・直すこと(優先順、ファイルと行)・見込み)。

- [ ] **Step 6: 直す → 測り直す(最大 3 回)**

不合格の画面は、直すことを P0 から 1 つずつ小さなタスクにして直し、4 つの確認と JS の確認をしてからコミット。Step 1 から回し直す。3 回で届かない画面は、何が足りないかを 1 問ずつ選択式で社長に聞く(おすすめを先頭に)。

- [ ] **Step 7: 差分のセキュリティ監査(公開前の決まり)**

`public-web-security-gate` スキルに従って `security-audit` を差分(`git merge-base HEAD master`..HEAD、ソースのみ)で回す。見る所:
- `/pads` `/skates` の `searchParams` の読み方(決まった値だけ通す・知らない id は無視・`?mouse=` を HTML とリンクに出すときは React の文字の扱いだけ・`dangerouslySetInnerHTML` なし)
- `MyMousePreselect` の `router.replace`(行き先は `/skates` に固定、id は `MOUSE_ID_RE` を通ったものだけ。開いたリダイレクトにならない)
- 外へのリンクの `rel`(店は `sponsored noopener noreferrer`、公式は `noopener noreferrer`)、`target="_blank"`
- 公式 URL・楽天の URL はデータから(https だけ。テストで確かめている)・楽天の商品ページは `safeRakutenItemUrl` を通る
- CSP は変えていない(画像の新しい送り先なし)・新しい API の呼び出しなし・キーをコードに書いていない
- `scripts/gear-data.ts` は手元でだけ動く(サイトの実行時には読まない)
結果(confirmed / needs_validation / rejected の件数と中身)を `plan.md` の進捗ログに 1 行。**confirmed の critical/high が残っていたら、マージ・公開に進まない**(社長に報告)。

- [ ] **Step 8: 正本の更新と報告**

`plan.md` の「1. 決定事項」に `D46`(番号がもう使われていれば次の番号)を 1 行:「デバイスの広がり:マウス 54(順位は長さ・幅のそろう 46、ほかは「比べられません」)・`/pads`・`/skates`。データは `docs/content/gear/*.json` から `scripts/gear-data.ts` で生成。絞り込みは URL のリンクでサーバーで絞る。設計書:`docs/superpowers/specs/2026-10-03-gear-finder-design.md`、計画:`docs/superpowers/plans/2026-10-03-gear-finder.md`」。進捗ログに 1 行(タスクの数・テストの数・JS・採点・監査)。社長の確認リストに:①人気の順の決め方(売れ筋の最高順位)②パッドの大きさの目安の境目 ③編集判断で足したパッド 8 件を残すか ④楽天の商品のスナップショット(`scripts/rakuten-mice.mjs`)を 54 機種で作り直す(本人の PC で。月 1 回の作り直しのとき)⑤ Lighthouse の計測。

コミット:

```bash
git add docs/design/score docs/design/review docs/design/js-budget.md plan.md
git -c user.name=pitos -c user.email=pito.shinzin@gmail.com commit -m "docs: デバイスの広がりの採点・監査・正本の更新

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

## 自己レビューの結果

**1. 設計書との照らし合わせ**
- 1 章 成功の基準:`/mouse` 54 機種・比べられません(Task 3・4)/ `/pads` の面・大きさ・厚さ・硬さと公式の言葉(Task 5・6)/ `/skates` のマイ設定 or その場で選ぶ(Task 5・7)/ 作った数字を出さない・生産終了の札(Task 1・2・5・6・7)。
- 2 章 データ:`mice.ts` の型の広げ(`shape` null・`connection` both・寸法と重さ null。データに接続 null の 1 件(SCYROX V8)があるので `connection` も null を許す)・`devices.ts` の名前(Task 1・4)・`pads.ts` `skates.ts`(Task 1)・hidden 7 件・生産終了・テスト(id・https・日付・ソールの mouseIds・null を計算に使わない)・LGG と SkyPAD の名前(Task 1)。
- 3-1:比べられませんの段と店のリンク(Task 3・4)・形 null は「公式の記載なし」・both は「有線・無線」(Task 2)。3-2:h1・数字の見せ場・1 行の説明・絞り込み・1 行 1 製品(表・引用・硬さ・PR・公式・生産終了の札)・人気の順と根拠の 1 行・空と 0 件・375(Task 6)。3-3:h1・マウスを選ぶ・マイ設定・素材・形・厚さの原文・入数・PR・公式・選んでいないときのブランド別と案内・素材と形の絞り込み(Task 7)。3-4:タブ・ヘッダー・SubNav・`/skates?mouse=<id>`(Task 7・8)。
- 4 章:数字は公式だけ・価格なし・PR と rel・楽天は検索・デザインシステム・自動の動きなし・4KB(各 UI タスクの JS の確認)・採点と監査(Task 9)。
- 抜けはなし。設計書の「ChipButton」は読み替え 1 で `ChipLink` にした(理由つき)。

**2. 置き場所のことば(プレースホルダー)の確認:** 「TBD」「あとで」「適切に」「Task N と同じ」はない。`MouseClient.tsx` は並んで動く担当がいるので行番号ではなく「元の文で探して置き換え」にし、置き換えの後の形を全部書いた。

**3. 型と名前のそろい:** `FitMouse` `CompareMouse` `Ranked<M>` `isFitMouse`(Task 2)→ `MouseRow` `OtherMouseRow` `toMouseRows`(Task 3)→ `MICE` `MICE_IDS` `MouseSpec`(Task 4)。`VisiblePad` `PadMatch` `filterPads` `padFilterHref`(Task 5)→ `PadRow` `/pads`(Task 6)。`SkateFilter` `skateView` `skateCounts` `skateFilterHref` `myMouseIdFrom` `shouldPreselect` `MY_SETTINGS_STORAGE_KEY`(Task 5)→ `/skates` `MyMousePreselect`、`toMouseRows` の `skateCounts`(Task 7)。`ShopButtons`(Task 3)を Task 3・6・7 で同じ props(`links` `primary` `className`)で使う。`Badge variant="status"`(Task 6)を Task 6・7 で使う。

**4. Review Focus:** 5 つとも、持ち主のタスクにテストかブラウザ確認の手順を書いた(1:Task 2・4・5 のテスト / 2:Task 5 のテスト / 3:Task 5 のテストと Task 7 のブラウザ確認 / 4:Task 1・5 のテストと Task 6 のブラウザ確認 / 5:Task 3・4・6・7・8 のはみ出し確認)。

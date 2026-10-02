# 最終の自己採点のまとめ(Task 19・794933e・2026-10-02)

- 見たもの:`shots/final/<画面>-375.png`・`-1440.png`(本番ビルド、CDP の端末の真似 375×812 タッチ / 1440×900、全体、reduced-motion オン、どれも横のはみ出しなし)。375 でタブバーが途中に写るのは撮り方の癖。
- 動きはソースで判断(`HeroKanji`・`TypeRoster`・`SpriteScreen`/`DiagnosisClient`・`PageShell`/`vt-names`・`Odometer`・`globals.css` の `rl-*`)。Lighthouse・録画・CPU を遅くした確認は、ここではできない(下の「社長の確認」)。
- 合格の線:どの画面も 4 観点すべて 8 以上、重みつき平均 8.2 以上。主要の 4 画面(トップ・診断・結果・`/aim`)は平均 8.5 以上。
- 画面ごとの根拠と直し方は、各 md の「最終」の節。

## 1. 点の一覧

| 画面 | Design | Usability | Creativity | Content | 平均 | 線 | 判定 |
|---|---|---|---|---|---|---|---|
| トップ `/` | 8.5 | 8.5(仮) | 8.5 | 8.5 | **8.50** | 8.5 | 合格(仮) |
| 診断 `/diagnosis` | **7.5** | 8.5 | 8.5 | 8.5 | **8.10** | 8.5 | 不合格 |
| 結果(診断から) | 8.0 | 8.5 | 8.5 | 9.0 | **8.35** | 8.5 | 不合格 |
| 結果(直接 `/type/ARCH`) | 8.0 | 8.5 | 8.5 | 8.5 | **8.30** | 8.5 | 不合格 |
| `/aim` | 8.0 | 8.5(仮) | 8.5(仮) | 8.0 | **8.25** | 8.5 | 不合格 |
| タイプ一覧 `/types` | 8.0 | 8.5 | 8.5 | 8.5 | **8.30** | 8.2 | 合格 |
| マウス `/mouse` | **7.5** | 8.0 | 8.0 | 8.5 | **7.85** | 8.2 | 不合格 |
| 感度 `/tools/sensitivity` | 8.0 | **7.5** | 8.5 | 8.0 | **7.95** | 8.2 | 不合格 |
| マイ設定 `/my` | **7.5** | **7.5** | 8.0 | 8.0 | **7.65** | 8.2 | 不合格 |
| ロビー `/lobby`(未ログイン) | **7.5** | 8.0 | **7.5** | 8.5 | **7.75** | 8.2 | 不合格 |
| 規約 `/terms` ほか | **7.5** | 8.5 | **7.0** | 8.0 | **7.75** | 8.2 | 不合格(社長の判断あり) |
| 404 | 8.0 | 8.5 | 8.0 | 8.5 | **8.20** | 8.2 | 合格(ぎりぎり) |

- 採点していない画面(写真なし):`/lobby/[id]`・`/lobby/inbox`・ログイン後の `/lobby`(社長のアカウントが要る)、名刺 `/c/<slug>` の読み込み中・画像の失敗、`/aim` の遊ぶ面・結果、`/mouse` の結果、`/my` の途中。

## 2. 全体の判定

- **不合格**。合格は 3 画面(トップ・`/types`・404)。主要の 4 画面のうち 3 つが 8.5 に 0.15〜0.4 足りない。
- 足りない所は大きな作り直しではなく、ほとんどが「画面の一番大きい文字」と「並べ方」の細部。下の 20 個の直しで、全画面が線に届く見込み(規約は社長の判断つき)。
- 直したあとの見込み:診断 8.6・結果 8.55 / 8.5・`/aim` 8.5・マウス 8.5・感度 8.3・マイ設定 8.35・ロビー 8.25・規約 約 8.25(当てはめないとき)。

## 3. 画面をまたぐ問題

1. **文字の段(①)**:主役の数字がない画面は、一番大きい文字が `PageShell` の h1(32px)になり、本文との差が 2 倍しかない(マウスの入力前・マイ設定・ロビー・規約・診断の質問の画面)。トップ・`/aim`・`/types`・感度・404 は「その画面の主役の数字」を display の段で出していて、ここが点の差になっている。直し方は 1 つ:**どの画面にも、その画面の中身の数字を 1 つ display の段で置く**(質問の何問目・埋まった項目の数・流れの番号・手の長さ)。375 では display-2(72px)÷ 16px = 4.5 倍が上限なので、① は 1440 で厳しく、375 は「display の段を使っているか」で見た(前の回と同じ見方)。
2. **段の外のサイズ**:Task 18 の片付けのあと、写真で段の外のサイズは見つからなかった。`text-rl-display-1` を 1440 で display-2 に上げる所(結果のコード・`/types` の 16)は、段の中の上げ下げ。
3. **間のリズム**:幅の広い画面(トップ・診断・`/types`・マウス・マイ設定)と、640px の列の画面(感度・ロビー・規約・404)が混ざる。640px の画面は 1440 で中身の左の端(約 400px)がロゴの左(160px)とそろわない。どちらも決まりどおりなので直しの対象にはしないが、狭い画面の右側の空きがロビーの「中身が見えない」印象を強めている(→ ロビーの見本の札)。`/aim` の折れ線だけが間の 3 段を壊している(1 つ 370px の空の箱)。
4. **動きの数**:1 画面 1 つの見せ場は守られている(トップ S1+名簿 S5 は「スクロールで動くのは名簿だけ」の例外として決めたとおり)。勝手に動き続けるものなし。数字が毎回回るものなし(`Odometer` は `/aim` の結果だけ、感度の数は入力を変えたときだけ)。reduced-motion はどれも `globals.css` の決まりで止まる形。見せ場の JS は約 7.1KB(12KB 以下)。
5. **色の役割**:違反は 2 つだけ。感度の「ほかのゲーム」の数字が白(マゼンタにする)、マウスのカードの寸法が白(同じ)。塗りのボタンが 2 つ見える画面が 1 つ(マイ設定:シアン+Discord のパープル)。Discord のボタンは Discord の色のままでよい(ロビーと同じ)が、主ボタンを入れ替える(マイ設定の直し 1)。
6. **文の折れ方**:`[word-break:auto-phrase] text-balance` の付け忘れが 4 か所(診断の問い・結果の強み/伸びしろ・ロビーの流れの文)。1 文字だけの行・単語の途中の折れが、審査員の目にいちばん「仕上がっていない」と映る。

## 4. 直しの一覧(全画面を合格にするため)

2 人で分けるときは、担当 A(主要 4 画面)と担当 B(ほかの画面)。どちらも `npx tsc --noEmit && npm run lint && npx vitest run && npm run build` で確かめ、1 つの直しに 1 つのコミット。担当はサーバーを起動しない。写真の撮り直しはコントローラー。

### 担当 A:主要の 4 画面(9 個)

1. **診断・質問の画面を 2 列に**:`src/app/diagnosis/DiagnosisClient.tsx:131-138`。`lg:grid-cols-12`、問いの列 `lg:col-span-7`、`SpriteScreen` を `size={288}`・`size-24 lg:size-72` で右の `lg:col-span-5 lg:row-span-3`。
2. **診断・何問目を表示用の数字に**:`src/components/diagnosis/ProgressBar.tsx:12` を `NumUnit`(`value={current}`、`unit={`/ ${total}`}`、`text-rl-display-1 lg:text-rl-display-2`)。
3. **診断・問いの折れ方**:`src/components/diagnosis/QuestionCard.tsx:14` に `[word-break:auto-phrase] text-balance`。
4. **結果・コードを PC で大きく**:`src/app/type/[code]/page.tsx:90` に `lg:text-rl-display-2`。
5. **結果・下のリンクを左にそろえる**:同 `:151` の `justify-self-center` → `justify-self-start`。
6. **結果・強みと伸びしろの折れ方**:同 `:117-118` の `ul` に `[word-break:auto-phrase] text-pretty`。
7. **`/aim`・折れ線を 2 列に**:`src/components/aim/AimHistory.tsx:58-61` の 2 つの `Chart` を `grid gap-6 lg:grid-cols-2` で包む。
8. **`/aim`・折れ線に目盛りと今日の値**:`AimHistory.tsx:13-30` の `figcaption` の行に「上の端 10,000 点 / 100%」と「今日 ○点」(数字は `font-display text-rl-highlight`)。
9. **`/aim`・遊ばなかった日で線を切らない**:`src/lib/aim/history-chart.ts:27-31` に `bridge` を足し、遊んだ日を 1 本でつなぐ(またぐ所は `--rl-line-strong` の破線)。`history-chart.test.ts` にテストを足す。

### 担当 B:ほかの画面(11 個)

10. **マウス・入力前を 2 列にし、右に重ね図の見本と手の長さの数字**:`src/components/mouse/HandSetup.tsx:60` の `Card` の中を `lg:grid-cols-[minmax(0,560px)_minmax(0,1fr)]`、右に `FitOverlay`(入力中の値、空なら `DEFAULT_HAND_LENGTH_CM`、持ち方が未選択ならかぶせ持ち、マウスは `rankMice` の 1 位)と `NumUnit`(display-2、cm)。
11. **マウス・ラベルの高さ**:`HandSetup.tsx:70` のラベルを「手の長さ」にし、「わからなければ空欄で OK」は欄の下の説明へ。
12. **感度・保存を主ボタンに**:`src/app/tools/sensitivity/SensitivityClient.tsx:102` を `variant="primary"`。
13. **感度・ほかのゲームの数字**:同 `:118` に `text-rl-highlight`、`:111` の見出しに `description`「同じ振り向き(○cm)になるゲーム内の感度」。
14. **マイ設定・空のときの主ボタン**:`src/components/my/CardPreview.tsx:60` を `data ? "primary" : "secondary"`、`src/components/my/MySettingsEditor.tsx:172` からのタイプの節の「1 分半で診断する」を、タイプがないとき primary。
15. **マイ設定・埋まり具合の数字**:`MySettingsEditor.tsx:157` を `NumUnit`(display-1、「/ 8 項目」)、`ProgressCells`(:41)を `size-3`。
16. **マイ設定・箱を減らす**:`MySettingsEditor.tsx:61-72` の `Section` に `boxed` を足し、タイプ・名刺の表示名の節は箱なし(上の線の行)。
17. **ロビー・流れの段のずれ**:`src/app/lobby/page.tsx:51` の li に `content-start`。
18. **ロビー・流れの番号を表示用の数字に**:同 `:57` を `text-rl-display-1 leading-none`、文の span に `text-balance`。
19. **ロビー・見本の札**:未ログインの画面に `PairFigure`(ARCH と GBLH、`score` なし、`drawLine`、「見本」と小さく)を 1 つ。
20. **規約・制定日**:`content/legal/terms.md`・`privacy.md` の h1 の下に「制定日:2026年○月○日」(日付は社長に確認)。

- そのほか(合否に響かない P2):トップのヒーローの下の空き(`src/app/page.tsx:49`)、`/types` の「16」を display-2(`src/app/types/page.tsx:25`)、マウスのカードの寸法をマゼンタ(`MouseCard.tsx:50`)、`/aim` の消すボタンを `-ml-3`(`AimHistory.tsx:66`)、404 のマスの絵(`not-found.tsx:17`)、規約の見出しの `:target` の線と目次の `rl-lock`(`LegalText.tsx:38, 46`。社長が「当てはめる」を選んだときは必須)。

## 5. 社長に聞くこと(1 問)

- 規約の 3 ページに、Creativity と Design ①(大きな文字の差)を当てはめますか。
  - A(おすすめ):当てはめない。法律の文に飾りは要らない。制定日だけ足し、Design・Usability・Content で見る(約 8.25 で合格)。
  - B:当てはめる。見出しの `:target` の線と目次の照準(CSS だけ)を足す(Creativity 8.0 の見込み)。

## 6. 社長だけができる確認(1 回にまとめて、目安 20 分)

1. **Lighthouse(スマホ・シークレットウィンドウ・`http://localhost:3100`)**:`/`・`/diagnosis`・`/type/ARCH`・`/aim`(できれば `/mouse` も)。Performance 90 以上・Accessibility 100・Best Practices 95 以上・SEO 95 以上、LCP 2.5 秒以下・CLS 0.05 以下・TBT 200ms 以下。数字を教えてください。これでトップと `/aim` の「仮」が外れます。
2. **10 秒の画面録画を 2 本**:S1(トップを開いて漢字が描かれる → 漢字をなぞる)と S2(診断の最後の答えを押す → マスが塗り替わる → 結果へ移る)。ふつうの速さで。
3. (できれば)DevTools の CPU 6 倍遅延で S1・S2 を 1 回ずつ記録し、赤い長いタスク(50ms 以上)がないか。
4. (できれば)テスト用のアカウントでログインした状態の `/lobby`(0 人・候補あり)・`/lobby/<id>`・`/lobby/inbox` の写真(375 と 1440)。
5. Safari か Firefox があれば、診断 → 結果がふつうに切り替わるか。

- コントローラーが撮り直す写真(社長の作業ではない):`/aim` の遊ぶ面・3・2・1・結果(感度まで入った設定で)、`/mouse` の結果(手のデータが読まれるキーで)、`/my` の途中。今回の「入れたはず」の 3 枚(aim-ready・mouse-hand・my)は、どれも入れた値が画面に出ていなかった。

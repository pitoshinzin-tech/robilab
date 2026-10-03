# PWA(ホーム画面に追加)— 設計書

- 日付:2026-10-03
- 状態:社長の「確認いらない、CEO が決めて進めて」を受け、設計担当がおすすめ案で決めた設計。CEO が見て直す。社長はいつでも変えられる
- 前提:plan.md の D19(まず PWA、ストア版は後で相談)・D33(スマホへの通知は v1.0 の PWA で)・D38(今日の文字は PC 専用)・D44・D45(デザインシステム・アートディレクション)、`docs/superpowers/specs/2026-10-02-ui-polish-design.md` と `...-art-direction.md`、`next.config.ts`(CSP)、`src/proxy.ts`、`src/app/layout.tsx`
- 読んだ Next.js の説明(16.3.6):`node_modules/next/dist/docs/01-app/02-guides/progressive-web-apps.md`、`.../02-guides/offline-support.md`、`.../03-api-reference/03-file-conventions/01-metadata/manifest.md`・`app-icons.md`、`.../04-functions/generate-metadata.md`(`appleWebApp`・`manifest`)、`.../02-guides/content-security-policy.md`
- 新しいパッケージは足さない(技術スタックの決まり)。Serwist などの PWA のライブラリ、`web-push` は使わない

## 0. この Next.js で分かったこと(学習データと違う所・気をつける所)

- manifest は `src/app/manifest.ts` で作る(`MetadataRoute.Manifest` 型)。Next.js が `/manifest.webmanifest` で配り、`<link rel="manifest">` も自動で付く。`manifest.ts` は「特別なルートハンドラ」で、リクエストの情報を使わなければビルド時に作られてキャッシュされる。
- iPhone のアイコンは `src/app/apple-icon.png` を置くと `<link rel="apple-touch-icon">` が自動で付く(apple-icon は png・jpg だけ。SVG は不可)。今のタブのアイコン `src/app/icon.svg` はそのまま。
- iOS 向けの `<meta>` は `metadata.appleWebApp`(`capable`・`title`・`statusBarStyle`)で出す。`themeColor` は `metadata` ではなく `viewport` に書く(今の layout はすでに `viewport.themeColor = "#0A0C16"`)。
- 説明書では「ホーム画面に追加」の条件は「正しい manifest+HTTPS」だけで、オフライン対応(service worker)はいらない、と書かれている。`beforeinstallprompt` の自前のボタンは「Safari で動かないので勧めない」とある → この設計では「使えるときだけ使う、おまけ」の扱いにする(4 章)。
- `experimental.useOffline`(`next/offline` の `useOffline`)は実験中の機能で、`cacheComponents` などとセット。しかも「ページを読み直すとオフラインでは失敗する。それには service worker が要る」と書かれている → 今回は使わない。
- Next.js の PWA の説明の service worker の例は、`/sw.js` に `Cache-Control: no-cache, no-store, must-revalidate` と専用の CSP(`default-src 'self'; script-src 'self'`)を付けている → この設計でもそうする。
- Middleware は Proxy(`src/proxy.ts`)に名前が変わっている。matcher は `/lobby/:path*`・`/auth/:path*`・`/my`・`/aim`・`/mouse` だけなので、`/sw.js`・`/manifest.webmanifest`・`/offline.html`・`/icons/*` は Supabase のセッション更新を通らない(通さないままにする)。
- Lighthouse の「PWA」の採点の項目は、Lighthouse 12(2024 年)でなくなっている。確かめ方は Chrome の DevTools の「Application」タブ(Manifest の「インストールできるか」・Service workers)に変える(6 章)。

## 1. 目的と成功の基準

### 目的
- ロビラボを「ブックマークのサイト」から「ホームのアイコンからワンタップで開くアプリ」にする(D19「常に触ってもらうため」)。
- 毎日来る理由(D20:今日の文字・エイム記録・仲間の通知ベル)に、アイコンから戻ってきやすくする。今日の文字は PC 専用(D38)なので、**PC の Chrome / Edge の「アプリとしてインストール」も対象に入れる**(タスクバーやドックから今日の文字を 1 クリックで開ける)。

### 成功の基準(全部できたら「できた」)
1. **Android の Chrome**:メニューから「ホーム画面に追加 / アプリをインストール」ができ、アイコン(マスク対応で欠けない)から開くと、URL のバーなしの全画面(standalone)で `/` が開く。
2. **iPhone の Safari(iOS 16.4 以上)**:共有 →「ホーム画面に追加」ででき、アイコン(180px、角は iOS が丸める)と名前「ロビラボ」が出て、開くと Safari のバーなしで `/` が開く。
3. **PC の Chrome / Edge**:アドレスバーの「インストール」でき、別のウインドウで開く。アイコンを右クリック(Android は長押し)すると、ショートカット「今日の文字」「仲間」「マウス探し」が出る。
4. **電波がないとき**、ホームのアイコンから開くと(またはページを移ると)、ブラウザの恐竜の画面ではなく、ロビラボの「オフラインです」の画面が出る。電波が戻って「もう一度読み込む」を押すと元に戻る。
5. **ログインのページ・Supabase の応答・個人のデータを一切キャッシュしない**(service worker が持つのはオフラインの画面とアイコン 1 つだけ)。
6. アプリとして開いた状態(standalone)で、Discord のログイン → 戻ってくる、Amazon・楽天・X のリンク、下のタブバー、各ページの「戻る」が使える(iPhone のアプリ表示にはブラウザの戻るボタンがないため)。
7. ページごとの JS の増えが 4KB 以内(gzip)。スマホの LCP が今より悪くならない(Navigation Preload は使わないので、service worker の起動の遅れは実測で見る)。
8. 差分のセキュリティ監査(public-web-security-gate)で confirmed の critical / high が 0。

### やらないこと
- プッシュ通知(5 章)。オフラインでページの中身を見せること(診断・マウス探しなどを電波なしで使う)。ストア版(D19 で「後で相談」)。iOS の起動画面(startup image)。manifest の screenshots(本物のアートが決まってから)。

## 2. manifest(`src/app/manifest.ts`)

| 項目 | 値 | 理由 |
|---|---|---|
| `id` | `"/"` | アプリの身元を最初に固定する。あとで `start_url` を変えても「別のアプリ」にならない |
| `name` | `"ロビラボ"`(`BRAND.name`) | インストールの画面・Android の起動画面に出る。英字の表記(ROBILAB / LOBBYLAB)は plan の未決定の論点なので入れない |
| `short_name` | `"ロビラボ"` | アイコンの下に出る。4 文字なので切れない |
| `description` | `BRAND.description` | すでにあるサイトの説明と同じにする |
| `start_url` | `"/"` | トップに今日の漢字(S1)があり、スマホでも PC でも入口になる。今日の文字(`/aim`)はスマホでは「PC で」の案内なので、入口にはしない(PC の人はショートカットで `/aim` へ) |
| `scope` | `"/"` | サイト全体をアプリの中として扱う |
| `display` | `"standalone"` | URL のバーなし、時計などの上のバーは残す。`fullscreen` は上のバーまで消えてサイトには合わない。`/aim` の全画面は今までどおり開始時に Fullscreen API で(D41) |
| `orientation` | 書かない | 端末の向きに従う(タブレットの横向きもそのまま) |
| `background_color` | `"#0A0C16"`(`BRAND.colors.bg`) | Android の起動画面の色。白く光らないように |
| `theme_color` | `"#0A0C16"` | `viewport.themeColor` と同じにする(ずれると上のバーの色が途中で変わる) |
| `lang` / `dir` | `"ja"` / `"ltr"` | |
| `categories` | `["games", "entertainment"]` | 害がなく、ストアの分類のヒントになる |
| `icons` | 下の表 | |
| `shortcuts` | 3 つ(下) | 長押し・右クリックで毎日の機能に直行できる。manifest の文字だけで JS は増えない |

`shortcuts`(アイコンは書かない。書かなければアプリのアイコンが使われる):

| name | url | 理由 |
|---|---|---|
| 今日の文字 | `/aim` | 毎日の理由の 1 番。PC のインストールで一番効く |
| 仲間 | `/lobby` | 声かけの返事の確認(スマホで一番使う)。ログインしていなければ今までどおりの流れ |
| マウス探し | `/mouse` | 収益の入口(D46) |

`manifest.ts` の中身は `BRAND` から作り、文字を直書きしない。テストで「`theme_color` が `BRAND.colors.bg`・`viewport.themeColor` と同じ」「`start_url` と各ショートカットが `scope` の中」「アイコンのファイルが実在する」を確かめる。

### 2-1. アイコン

| 置き場所 | 大きさ | 用途 | 絵の決まり |
|---|---|---|---|
| `public/icons/icon-192.png` | 192×192 | manifest `purpose: "any"` | 背景 #0A0C16 で四角い全面(角は丸めない)、マークは中央 |
| `public/icons/icon-512.png` | 512×512 | manifest `purpose: "any"`(インストール画面・起動画面) | 同上 |
| `public/icons/icon-maskable-512.png` | 512×512 | manifest `purpose: "maskable"`(Android の丸・角丸に切り抜かれる) | マークは中央の直径 80%(半径 205px)の円の中に収める。外側は背景色だけ |
| `src/app/apple-icon.png` | 180×180 | iPhone のホーム画面(Next.js の決まりの名前で自動の `<link>`) | 透明を使わない(iOS は透明を黒で埋める)。角は丸めない(iOS が丸める) |
| `src/app/icon.svg` | 今のまま | ブラウザのタブ | 変えない |

- **今は仮のアイコン**:今のファビコン(8×8 のドット絵の「ロ」、`src/app/icon.svg`)と同じ絵を使う。ドット絵なので、拡大は「1 マスをそのまま大きくする」(ぼかさない)。
- **作り方**:`scripts/app-icons.mjs` を新しく作る。8×8 のマスの色の表(`icon.svg` と同じ)から、Node の標準の `zlib`(圧縮と CRC32)だけで PNG を書き出す(sharp などのパッケージは使わない。sharp は Next.js の中に入っているが、直接の依存にしていないので使わない)。使い方は `node scripts/app-icons.mjs`(gear-data と同じ書き方)。作った PNG はリポジトリにコミットする(サイトの実行時には何も作らない)。
- **Illustrator / Photoshop 用**:`export/app-icon/app-icon.svg`(仕上がり 512×512、`<g id="01_background">`・`<g id="02_mark">`・`<g id="guide_maskable_safe_zone">` に分ける。ガイドは非表示)と、上の 4 つの原寸 PNG(Photoshop 用。透明は使わない絵なので背景つき)。
- **社長のロゴができたら差し替える**(D29「ドット絵のシンボルマーク(アプリのアイコン用)」):
  - ドット絵のとき:1 ドット = 1px の小さな PNG(例 16×16)か、四角だけの SVG をもらい、スクリプトの色の表を差し替えて作り直す(同じファイル名・同じ URL なので manifest は変えない)。
  - ドット絵でないとき:社長が Photoshop で上の 4 つの大きさ(maskable は安全な円の中)を書き出し、同じ名前で置き換える。
  - タブの `src/app/icon.svg` も同じときに差し替える。
  - 注意:インストール済みのアイコンは、Android は manifest の更新で数日のうちに変わるが、iPhone は「ホーム画面に追加し直す」まで変わらない。**できれば公開の前に本物のアイコンにする**。

### 2-2. layout に足すもの(`src/app/layout.tsx`、別の担当の作業が終わってから)

- `metadata.appleWebApp = { capable: true, title: "ロビラボ", statusBarStyle: "black" }`
  - `black-translucent`(上のバーの下までページを伸ばす)にすると、ヘッダーに `safe-area-inset-top` の余白が要る。背景がほぼ黒なので `black` で見た目の差は小さく、ヘッダーを触らずに済む。
- `viewport.viewportFit = "cover"`
  - 下のタブバーはすでに `pb-[env(safe-area-inset-bottom)]` を書いているが、`viewport-fit=cover` がないと iPhone では `env()` が 0 になり効いていない。アプリ表示ではホームバーの下に背景の帯ができる。`cover` にすると、タブバーがホームバーの所まで伸びて、余白はタブバーの中に入る。
  - 横向きの iPhone で、ヘッダー・本文の左右がノッチに隠れないかを実機で確かめる(隠れるなら `px` に `env(safe-area-inset-left/right)` を足す。今は横向きの見た目を最優先にしていないので、隠れたらそのときに直す)。
- `metadata.manifest` は書かない(`manifest.ts` を置けば自動で付く)。

## 3. service worker(入れる。持つのはオフラインの画面だけ)

### 3-1. 入れる理由
- アプリとして開いたのに電波がないと、ブラウザの恐竜の画面になり「サイトだった」と分かってしまう。社長の品質の基準(Awwwards 級)なら、オフラインでもロビラボの画面を出したい。
- ただし中身(ページ・データ)をキャッシュすると、古い版が残る・ログインの情報が残るなどの危険が大きい。**だから最小:オフラインの画面 1 枚とアイコン 1 つだけを持ち、ほかは何も保存しない**。ページは毎回ネットから取る(今と同じ)。

### 3-2. ファイルと動き
- `public/sw.js`(手書きの素の JS。ビルドを通さない。`/sw.js` で配る。スコープは `/`)。
- `public/offline.html`(静的な 1 枚。JS なし、外のフォント・CSS なし、CSS は中に書く。色はデザインシステムの値を直書き:背景 #0A0C16・文字 #EAF6FF・押せるものだけシアン #39F3FF。ドット絵の「ロ」の SVG を中に書く。文:「電波が届いていません」「つながったら、もう一度読み込んでください。」ボタン「もう一度読み込む」は `<a href="">`(今の URL を読み直す。JS なし。電波が切れたときに開こうとしていたページに戻る)。システムの書体。44px 以上の押せる高さ、フォーカスの線、コントラスト 4.5:1 以上)。
  - Next.js のページ(`/offline`)にしない理由:ページの HTML は名前にハッシュの付いた JS を読み、それはキャッシュしないので、オフラインでは壊れる。
- `sw.js` の中身(全部で 40 行くらい):
  - `const CACHE = "robilab-offline-v1";`(`offline.html` を変えたら数字を上げる)
  - `install`:`/offline.html` と `/icons/icon-192.png` だけを(`new Request(url, { cache: "reload" })` で HTTP キャッシュを通さず)`cache.addAll` → `self.skipWaiting()`。
  - `activate`:`CACHE` 以外の自分のキャッシュを消す → `self.registration.navigationPreload?.disable()`(すでに有効にした端末のため。**有効にはしない**。理由:有効だと `/auth/callback` にもブラウザが先行の要求を送り、`/auth` は `respondWith` しないので新しい要求がもう 1 本飛ぶ。`exchangeCodeForSession` の code は 1 回しか使えず、取り合いでログインに失敗しうる)→ `self.clients.claim()`。
  - `fetch`:次の全部に当てはまるときだけ `respondWith` する。それ以外は何もしない(ブラウザにそのまま任せる)。
    1. `request.mode === "navigate"`(ページを開く・移るとき)で `method === "GET"`
    2. 同じ origin
    3. パスが `/auth/` で始まらない(Discord ログインの往復はブラウザに任せる)
  - 応答:`fetch(event.request)`(Navigation Preload は使わない)。**失敗したとき(ネットにつながらない)だけ** `caches.match("/offline.html")`。成功した応答は保存しない(`cache.put` を書かない)。
  - `message`・`push`・`sync`・`importScripts` は書かない。
- 登録:`src/components/pwa/SwRegister.tsx`(`"use client"`、何も描かない)を layout に置く。本番のビルドのときだけ(`process.env.NODE_ENV === "production"`)、`window` の `load` のあとに `navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" })`。`serviceWorker` がないブラウザでは何もしない。失敗しても画面には何も出さない。

### 3-3. 危険と対策

| 危険 | 対策 |
|---|---|
| 古い版が残る | ページも JS もキャッシュしないので、古いページが出ることはない。残りうるのは `offline.html` だけで、`CACHE` の数字を上げれば次の起動で入れ替わる。`/sw.js` には `Cache-Control: no-cache, no-store, must-revalidate` を付け、登録は `updateViaCache: "none"`(ブラウザがページを開くたびに新しい `sw.js` を確かめる) |
| ログインのページ・Supabase の応答をキャッシュする | 保存するのはインストールのときの 2 ファイルだけ。`cache.put` を書かない。`/auth/` は触らない。Supabase は別の origin で、ページを開く(navigate)の通信でもないので触らない。ログアウト・退会のときに消すべきものが何も残らない |
| ページを開くのが遅くなる(service worker の起動の待ち) | Navigation Preload は **使わない**(`/auth/callback` の code の取り合いになるため)。実装の前後でスマホの Lighthouse(遅い回線の条件、perf.md と同じ)の LCP を比べ、悪くなったら止める |
| 壊れた `sw.js` を配ってしまった | 「止める版」の `sw.js`(`install` で `skipWaiting`、`activate` で全部のキャッシュを消して `self.registration.unregister()`、`fetch` は書かない)を同じ場所に配れば、次に開いたときに外れる。手順を `docs/ops/launch.md` に書く |
| CSP | `next.config.ts` の CSP に `worker-src 'self'` と `manifest-src 'self'` を足す(今は `default-src` / `script-src` からの引き継ぎで動くが、はっきり書く。`blob:` は許さない)。`/sw.js` の応答だけ、Next.js の説明どおり `Content-Security-Policy: default-src 'self'; script-src 'self'` にする(service worker の中の通信の決まりはこの応答の CSP で決まる)。`headers()` で `/sw.js` 用のルールを足す。全体の `/(.*)` のルールも `/sw.js` に当たるので、同じキーは後ろのルールが勝つことを実装のときに `curl -I` で確かめる |
| `/sw.js` の置き場所 | ルートに置かないとスコープが `/` にならない。`public/sw.js` で `/sw.js`。`Service-Worker-Allowed` は付けない。Proxy の matcher に入れない |
| 開発中の混乱 | 開発(`next dev`)では登録しない。もし登録が残ったら DevTools の Application → Service workers の「Unregister」 |
| Vercel のプレビューの「Deployment Protection」 | プレビューに保護があると、manifest の取得(クッキーなしで取りに行く)が 401 になりインストールできない。確かめは本番の URL か、保護のないプレビューで |

## 4. 「ホーム画面に追加」の案内

ブラウザに勝手に何かを出させない・自動で動くものは足さない(ui-polish 設計書・追補の決まり)。ページを開いた瞬間のポップアップ・下から出てくる帯は作らない。**静かに置いてある 1 枚のカード**にする。

### 4-1. どこに出すか(2 か所)
1. **`/my`(マイ設定)の下のほうに「ホーム画面に追加」の段**:いつでも見られる正式な置き場所。閉じるボタンはなし(段の 1 つなので)。アプリとして開いているときは出さない。
2. **`/aim` の「あなたの記録」の下に 1 枚のカード**:「毎日戻ってくる」その場所だから。トップ(`/`)には出さない(見せ場 S1 の画面を守る)。
   - 出す条件:`/aim` を開いた日が **2 日目から**(2 回目の来訪 = また来る人)、**最大 3 日**まで。× で閉じたら二度と出さない。インストールしたら(`appinstalled` の知らせ、またはアプリ表示で開いた)二度と出さない。
   - 記録はこの端末だけ:`localStorage` の `robilab:pwaHint` = `{ v: 1, days: ["YYYY-MM-DD", …(最大 4)], dismissed: boolean }`。個人の情報は入れない。サーバーには送らない。読み書きの失敗(プライベートモードなど)のときは出さない。
   - カードはハイドレーションのあとに出るので、ページの下のほう(最初の画面の外)に置き、レイアウトのずれ(CLS)を起こさない。

### 4-2. 中身(端末ごと)
- 見出し:「ホーム画面に追加」/ 1 行:「アイコンから、毎日の今日の文字にワンタップで。」(`/my` では「アプリのように全画面で開けます。」)
- **Android の Chrome / PC の Chrome・Edge で、ブラウザが `beforeinstallprompt` をくれたとき**:主ボタン「追加する」→ その場で `prompt()`。`preventDefault()` はしない(ブラウザ自身の案内を消さない。主ボタンが押せるようにだけする)。もらえなかったとき(すでにインストール済み・ほかのブラウザ)は、ボタンを出さず手順の文だけ:「右上の︙メニュー →『ホーム画面に追加』(PC は『アプリをインストール』)」。
- **iPhone・iPad(iPadOS は Mac の顔をするので、タッチの点の数でも見る)**:3 つの手順を、アイコンつきの番号のリストで(絵文字は使わない。lucide の `Share` と `SquarePlus`):
  1. 共有ボタン(四角から上向きの矢印)を押す。見当たらないときは、下か右上の「…」の中にあります。
  2. 「ホーム画面に追加」を選ぶ(なければ下にスクロール)。
  3. 右上の「追加」を押す。
  - Safari 以外(iPhone の Chrome など)でも同じ共有メニューから追加できる(iOS 16.4 以上)ので、同じ手順を出す。
- 手順の文はサーバーで HTML に入れておき、`<details>`「追加のしかた」で開く(開け閉めに JS を使わない)。JS は「どの手順を見せるか」「カードを出すか」「`prompt()`」だけ。
- デザイン:共通部品(`Card` の箱、`buttonVariants` の主ボタンは 1 つ、閉じるは `PlainButton` の × で `aria-label="閉じる"`、44px、フォーカスの線、reduced-motion)。色はシアン=押せるものだけ。動きはなし(出るときもふわっとさせない)。base-ui は使わない(JS を増やさないため)。

### 4-3. 判定は純粋な関数に分ける
- `src/lib/pwa/install-hint.ts`:`detectPlatform({ userAgent, maxTouchPoints, standalone })` → `"ios" | "android" | "desktop" | "other" | "installed"`、`nextHintState(state, today)`、`shouldShowHint(state, today, platform)`。Vitest で、日付の境目(JST)・3 日の上限・閉じたあと・壊れた JSON を確かめる。
- アプリ表示かどうか:`matchMedia("(display-mode: standalone)").matches || navigator.standalone === true`(後者は iOS)。

## 5. 通知(プッシュ)は入れない

- **理由**
  1. 送る仕組みに、VAPID の鍵(秘密の値の管理)、`web-push` のパッケージ(技術スタックの外 → 社長の確認が要る)、購読を保存するテーブルと RLS、送る係(Supabase の Edge Function か cron)が要る。今回の「ホーム画面に追加」より何倍も大きい。
  2. iPhone はホーム画面に追加した人だけが通知を受け取れる。まず「追加してくれる人」を増やすのが先。
  3. 通知の許可を求めるのは、ユーザーには「勝手に出てくる」もの。どの場面で聞くか(声かけが届いたとき、など)を決める設計が別に要る。
  4. 声かけの通知はサイト内のベル(D33)ですでに届く。Discord ボットの DM 通知(D33 の v0.2 の候補)という別の道もある。
- **D33 との関係**:D33 は「スマホへの通知は v1.0 の PWA で」。この設計は PWA を 2 段に分ける:**段 1 = ホーム画面に追加(この設計)**、**段 2 = プッシュ通知(別の設計書。`web-push` を足すかどうか社長の確認から)**。v1.0(12 月末)までに段 2 を決めれば D33 に沿う。
- この設計の `sw.js` には `push` を書かない。段 2 で足すときも、同じ `sw.js` に足す(スコープ `/` の service worker は 1 つだけ)。

## 6. テストと確かめ方

### 6-1. 自動のテスト(Vitest)
- `manifest.ts`:必須の項目、色が `BRAND` と `viewport` と同じ、`start_url`・ショートカットが `scope` の中で実在するルート、アイコンのファイルが `public/` にあり PNG の大きさが表どおり(PNG の頭の幅・高さを読む)。
- `sw.js`:偽の `self`・`caches`・`fetch` を用意して読み込み、①ページを開く通信は素通し ②ネットの失敗のときだけ `offline.html` ③`/auth/`・POST・別の origin・画像や JS の通信には `respondWith` しない ④成功した応答を保存しない ⑤`activate` で古いキャッシュを消す、を確かめる。
- `install-hint.ts`:4-3 のとおり。
- `next.config.ts`:CSP に `worker-src 'self'`・`manifest-src 'self'` があり、`blob:` がない。`/sw.js` の見出し(Cache-Control・CSP)。
- `scripts/app-icons.mjs`:作った PNG と、コミットした PNG が同じ(作り直し忘れを見つける。gear-data と同じ考え)。

### 6-2. ブラウザで(Claude が確かめられるもの)
- `next build && next start`(本番のビルドで。開発では登録しないため)のあと、Chrome の DevTools:
  - Application → Manifest:エラーなし、「インストールできる」、アイコンの表示、maskable の切り抜きの見本。
  - Application → Service workers:`/sw.js` が activated、スコープ `/`。Cache Storage に `robilab-offline-v1` の 2 ファイルだけ。
  - Network の「Offline」でページを移る → `offline.html`。戻す → 「もう一度読み込む」で戻る。
  - ログインして `/lobby`・`/my` を開いたあとも、Cache Storage に増えたものがない。
- `curl -I` で `/sw.js`・`/manifest.webmanifest`・`/offline.html` の見出し(Content-Type・Cache-Control・CSP)。
- Lighthouse:PWA の採点はもうないので、**速さの比べ**に使う。スマホの条件で `/`・`/aim`・`/mouse` の LCP を実装の前後で比べ、悪くならないこと。
- JS の重さ:`node scripts/page-js.mjs / /aim /my /mouse` で実装の前後を比べ、どのページも +4KB 以内(見込み:全ページ `SwRegister` +0.2KB くらい、`/aim`・`/my` は案内のカードで +1.5KB くらい)。`docs/design/js-budget.md` に行を足す。
- 375・1440px の画面写真で `/my` の段と `/aim` のカード、`offline.html` を、ほかの画面と同じ 4 観点で採点(8.2 以上)。

### 6-3. 実機(社長の作業。7 章)

## 7. セキュリティ監査の観点(public-web-security-gate、CLIENT-SIDE の service worker)

監査を頼むときに、次を観点として渡す。
- **service worker の乗っ取り**:XSS があると、悪い service worker を登録されて長く居座られる。→ `worker-src 'self'`(同じ origin のファイルだけ、`blob:`・`data:` 不可)、`sw.js` は固定の静的ファイル、`importScripts` なし、登録の URL に外からの値を使わない。
- **キャッシュの中身**:人ごとの応答・ログインのページ・Supabase の応答が保存されないこと(共有の端末で次の人に見えない)。保存するのは固定の 2 ファイルだけで、`cache.put` がないこと。
- **キャッシュの汚染**:navigate の応答を保存しないので、汚れた応答が居座ることがない。
- **`/auth/` の往復**:service worker が触らない(リダイレクトや `code` を含む URL を扱わない)。
- **`sw.js` の応答の見出し**:`Cache-Control: no-cache, no-store, must-revalidate`、専用の CSP、`Content-Type: application/javascript`。
- **メッセージ**:`message` を受けないので、ページや他の窓から service worker に命令を送れない。
- **止め方**:壊れたとき・乗っ取りが疑われるときに外す手順(3-3 の「止める版」)がある。
- **manifest**:`scope`・`start_url`・ショートカットがすべて同じ origin。外の URL を入れない。
- **localStorage**:`robilab:pwaHint` は日付と真偽だけ。壊れた値でも落ちない。
- **`offline.html`**:JS なし・外の読み込みなし。

## 8. 社長にしかできない作業

1. **本物のアプリのアイコンの絵**(D29 のドット絵のシンボルマーク)。渡し方は 2-1(ドット絵なら 1 ドット 1px の PNG か四角だけの SVG、そうでなければ 4 つの大きさの PNG)。maskable は中央 80% の円の中に収める。iPhone の人は追加し直さないと変わらないので、できれば公開の前に。
2. **実機の確認**(Claude はできない):
   - Android の Chrome:インストール → アイコン(欠けない)→ 全画面で開く → 長押しのショートカット → 機内モードでオフラインの画面。
   - iPhone の Safari:共有 → ホーム画面に追加 → 全画面で開く → 下のタブバーがホームバーにかぶらない → 横向きでノッチに文字が隠れない → **アプリ表示のまま Discord でログインして戻ってこられる**(iPhone のアプリ表示は Safari とクッキーが別。だめなら「ログインは Safari で」の案内を足す判断を CEO がする)→ Amazon・楽天のリンクで戻ってこられる。
   - PC の Chrome / Edge:インストール → 別ウインドウで今日の文字が遊べる(全画面・マウスの動き)。
3. **Vercel の設定**:必要なし(`public/` のファイルと `next.config.ts` の見出しで足りる)。プレビューで確かめるときは Deployment Protection に注意(3-3)。本番への反映(公開・マージ)は今までどおり社長の判断。

## 9. 作るものの一覧(実装計画の下書き)

| ファイル | 中身 |
|---|---|
| `src/app/manifest.ts`(新) | 2 章 |
| `public/icons/icon-192.png`・`icon-512.png`・`icon-maskable-512.png`、`src/app/apple-icon.png`(新) | 2-1。`scripts/app-icons.mjs` で作る |
| `scripts/app-icons.mjs`(新) | 8×8 の色の表 → PNG(Node の zlib だけ) |
| `export/app-icon/app-icon.svg` と原寸 PNG(新) | Illustrator / Photoshop 用 |
| `public/sw.js`・`public/offline.html`(新) | 3 章 |
| `src/components/pwa/SwRegister.tsx`(新) | 3-2 の登録 |
| `src/lib/pwa/install-hint.ts`(新)・`src/components/pwa/InstallHint.tsx`(新) | 4 章 |
| `src/app/layout.tsx`(直す) | `appleWebApp`・`viewportFit: "cover"`・`<SwRegister />` |
| `src/app/my/page.tsx`・`src/app/aim/page.tsx`(直す) | 案内の段・カードを置く |
| `next.config.ts`(直す) | `worker-src`・`manifest-src`、`/sw.js` の見出し |
| `tests/…`(新) | 6-1 |
| `docs/ops/launch.md`(足す) | service worker の止め方、本物のアイコンの差し替え手順 |
| `docs/design/js-budget.md`(足す) | JS の増えの行 |

- ブランチ:`feat/pwa`。いま `feat/perf-floor` で layout と速さを直しているので、**その作業が終わってから、その上に作る**(layout がぶつからない・速さの比べの基準がそろう)。
- 大きさの見込み:タスク 5〜6 個(manifest とアイコン → service worker とオフラインの画面 → 登録と CSP → 案内 → 確かめと採点 → 監査)。

## 10. 決めたこと(CEO が見る所)

| # | 決めたこと | 理由 | 違ったら何が変わるか |
|---|---|---|---|
| 1 | **service worker を入れる。ただしオフラインの画面 1 枚+アイコン 1 つだけ** | アプリ表示で恐竜の画面を出さない(品質の基準)。中身をキャッシュしないので古い版・ログインの残りの危険がほぼない | 入れない案:インストールはできる(条件は manifest+HTTPS)。`sw.js`・`offline.html`・登録・CSP の追加・監査の観点が消え、作業が半分くらいに。オフラインはブラウザの画面になる |
| 2 | **プッシュ通知は入れない(段 2 の別の設計に)** | `web-push` は技術スタックの外、秘密の鍵・テーブル・送る係が要る。まず追加する人を増やすのが先 | 入れる案:社長に `web-push` を足す確認、VAPID の鍵(社長が Vercel に入れる)、購読テーブルの migration、送る係、許可を聞く場面の設計が増える。D33 の「v1.0 の PWA で通知」は段 2 で守る |
| 3 | **`start_url` は `/`**、ショートカットは「今日の文字 `/aim`・仲間 `/lobby`・マウス探し `/mouse`」 | 今日の文字は PC 専用なので、スマホの入口はトップ(今日の漢字の見せ場)。PC の人はショートカットで直行 | `/aim` にすると、スマホでは開いてすぐ「PC で」の案内になる。`/lobby` にするとログインしていない人は入口で止まる |
| 4 | **PC の Chrome / Edge のインストールも成功の基準に入れる** | 毎日の理由(今日の文字)は PC でしか遊べない。タスクバーから 1 クリックが一番効く | スマホだけにすると、確かめる項目が減るだけで作るものは同じ |
| 5 | **案内は `/my` の段と `/aim` のカードの 2 か所。カードは 2 日目から最大 3 日、× で二度と出さない。トップには出さない** | 自動で出る帯は足さない決まり。また来た人だけに、毎日戻る場所で。トップの見せ場を守る | トップにも出すなら、S1 の画面の採点のやり直しと CLS の確認が要る。`/my` だけにすると、気づく人が減る |
| 6 | **`beforeinstallprompt` は使えるときだけ「追加する」ボタン。`preventDefault` はしない** | Next.js の説明は自前のボタンを勧めていない(Safari で動かない)。ブラウザ自身の案内を消さない | 使わない案:全部の端末で手順の文だけになり、JS が少し減る |
| 7 | **アイコンは今は仮(ファビコンの「ロ」を拡大)。PNG は Node の zlib だけで作るスクリプト。本物は同じファイル名で差し替え** | パッケージを足さない。ドット絵なので拡大がぼけない。URL が同じなら manifest を変えずに差し替えられる | 本物を先に待つ案:実装は止まらないが、iPhone の人は差し替えのあと追加し直しが要るので、公開の前に本物があるのが一番よい |
| 8 | **iPhone の上のバーは `black`(ページを下に潜らせない)、`viewportFit: "cover"` を足す** | ヘッダーを触らずに済む。タブバーの `safe-area-inset-bottom` が初めて効く | `black-translucent` にするとヘッダーに上の余白の直しが要る。`cover` を足さないと、アプリ表示でタブバーの下に背景の帯が残る(壊れはしない) |
| 9 | **`name`・`short_name` は両方「ロビラボ」**(英字は入れない) | 英字の表記は未決定(plan 2 章) | 英字が決まったら `name` を「ロビラボ ROBILAB」などに変えるだけ(`id` は `/` で固定なので別のアプリにならない) |
| 10 | **作るのは `feat/perf-floor` が終わってから、その上の `feat/pwa`** | layout がぶつからない。LCP の比べの基準がそろう | 先に作るなら、layout の直しを最後に合わせる手間と、速さの測り直しが要る |

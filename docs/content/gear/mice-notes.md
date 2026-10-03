# ゲーミングマウスの公式スペック集(mice.json)のメモ

- 確認した日: 2026-10-03
- 件数: 54 件(既存 `src/data/mice.ts` の 20 件 + 新規 34 件)
- 数値はメーカー公式の製品ページ・仕様ページ(サポートの仕様ページ、公式ストア、公式の解説記事を含む)の表記だけ。レビューサイトやまとめサイトの数値は使っていない。価格は載せていない。
- 公式に数値がないところは推測で埋めずに `null` にして、`notes` に理由を書いた。
- 既存の `src/data/mice.ts` の見出しコメントには「21 件」とあるが、実際の要素は 20 件。

## 選んだ方法と出典(日付つき)

日本で売れている・使われている順に、次の 4 つを合わせて選んだ。各項目の `selectionBasis` に、どれの何位かを書いた。

| 出典 | 中身 | 日付 |
|---|---|---|
| Amazon.co.jp 売れ筋ランキング「ゲーミングマウス」 https://www.amazon.co.jp/gp/bestsellers/computers/2151973051 | 1〜30 位と 51〜80 位を取得(31〜50 位はページの後読み込みで取れなかった) | 2026-10-03 取得 |
| 価格.com ゲーミングマウス 人気売れ筋ランキング https://kakaku.com/pc/mouse/itemlist.aspx?pdf_Spec014=1 | 1〜80 位 | 2026-10-03 取得 |
| BCN ランキング「ロジクールが1～6位まで独占、26年8月に売れたゲーミングマウスTOP10」 https://www.bcnretail.com/ranking/research/detail/20260918_661963.html | 2026年8月の販売実績の TOP10 | 2026-09-18 公開 |
| ProSettings.net のプロ使用率 https://prosettings.net/gear/lists/mice/ | 上位 25 機種(選定の参考だけ。数値には使っていない) | 2026-10-03 取得(ページに更新日の表示なし) |

- 楽天ランキング(https://ranking.rakuten.co.jp/daily/568407/ など)は、取得がタイムアウトして読めなかった。楽天は根拠に入っていない。
- 選定の考え方: 上の出典で上位の機種を優先し、既存の 20 件はすべて残した。マウスソール・アームスリーブなどの周辺品、ノーブランドの格安品は外した。ブランドの幅(Logicool G、Razer、ZOWIE、Pulsar、Finalmouse、LAMZU、VAXEE、VXE(ATK)、SteelSeries、Endgame Gear など)はランキングとプロ使用率の範囲で入れた。
- ランキングに出てこないが既存なので残したもの: G305、Viper Mini、X2 v2、Xlite v3、OP1 8k、XM2we、Rival 3 Wireless、M75 WIRELESS、Pulsefire Haste 2。`devices.ts` にあって前は外していた Model O 2 Wireless、EC2-CW、UltralightX も入れた。

## 項目の決め方

- `widthMm` はいちばん広いところ。前後で幅が書いてあるものは後ろ(広い方)。
- `weightG` は公式の標準構成の値。電池式は電池込み(G304/G305 は単三1本込み 99g、Rival 3 Wireless は単四2本込み 106g、G309 は単三込み 86g)。「<49 g」「60 g 未満」のような上限表記は、その数字を入れて notes に原文を書いた。「60-61g」「48g～55g」のような幅のある表記は null。
- `shape` は公式ページ(または公式の形状の説明)に「左右対称/Symmetrical/Ambidextrous」か「右手用/Right-Handed/右利き向けの非対称」が書いてあるときだけ。Razer の「Right-handed Symmetrical」(左右対称の形でサイドボタンは左側)は symmetric にした。
- `connection` は公式の接続の欄に無線と有線の両方が書いてあるときだけ both。ロジクールのワイヤレス機は有線動作が仕様に書かれていないので wireless。
- ロジクール日本の仕様欄は「高さ/奥行き/長さ」の見出しが機種ごとにばらばら(例: X2 SUPERSTRIKE は「高さ 125mm・奥行き 40mm」)。いちばん大きい値を長さ、いちばん小さい値を高さとして読んだ。

## 数字が欠けている・不確かなもの

全部そろっているのは 27 件、どこかが null なのは 27 件。長さ・幅・高さ・重さの 4 つがそろっているのは 45 件。

| id | null の項目 | 理由 |
|---|---|---|
| scyrox-v8 | すべて | 公式ページの仕様が画像だけ。日本の代理店の公式ページも見つからなかった |
| vaxee-e1-wireless | 寸法・重さ・形状 | 製品ページの仕様が画像だけ。公式ニュースに「60-61g」「3950 sensor」とだけある |
| zowie-ec2-cw / ec2-dw / za13-dw / u2-dw | 寸法(DW 3機種はセンサーも) | 公式ページの「Dimensions (HxWxD mm)」欄が見出しだけで空。大きさの比較ページも画像だけ |
| glorious-model-o-2-wireless | 寸法 | 製品ページにも製品ガイドにも長さ・幅・高さがない(重さ 68g ± 3g のみ) |
| finalmouse-ultralightx | 幅・形状・センサー | 公式の幅は「Grip Width」(握る位置の幅)だけ。3 サイズのうち M(Lion)を代表に記載。重さ 35g は「ソールなしの概算 ±2g」 |
| vxe-dragonfly-r1-se-plus | 重さ・形状・センサー | ATK 公式ストアのページが R1 シリーズ共通で、重さは「48g～55g(モデルによって異なる)」。寸法もシリーズ共通の値 |
| lamzu-maya-x | 形状・センサー | 公式ページの文字情報は大きさ・重さ(47± 2g)だけ |
| logicool-g203 / g402 | センサー(と形状) | 公式ページにセンサー名がない |
| ロジクールの多く(G304、G305、G502 系、G703、G309、G304 X SUPERLIGHT、PRO X SUPERLIGHT 2c、PRO X3 SUPERSTRIKE、ほか) | 形状 | 日本・米国の公式ページに左右対称/右手用の記載がない |
| endgame-gear-op1-8k / op1-8k-v2 / xm2we | 形状 | 公式は「Redesigned Shape for Versatile Claw Grip」「XM1 と同じ形」だけで、左右対称の明記がない |
| asus-tuf-gaming-m3-gen-ii | 形状 | 仕様欄に形状の記載がない。寸法「123 x 68 x 40mm」は長さ×幅×高さの順と読んだ |

ほかの不確かな点:

- **pulsar-xlite-crazylight**: Amazon 8 位の商品名は「CrazyLight Series … 44グラム」だけ。44g が Xlite CrazyLight Medium の公式重量と一致するので同機種と判断したが、X2 系の CrazyLight の可能性も残る。
- **razer-naga-v3-pro**: 117g とサイドパネルの重さ(15〜20g)が別に書かれていて、117g がパネル込みかどうか読み切れない。
- **zowie-ec2-cw / ec2-dw**: 公式は「左右非対称エルゴノミクスデザイン」で、「右手用」と直接は書いていない。right とした。
- **logicool-g502-x-lightspeed**: 日本・米国の製品ページに重さがなく、102g はサポートの仕様ページの値。センサーは製品ページが HERO 44K、サポートページが HERO で食い違う。
- **PRO X SUPERLIGHT / PRO X SUPERLIGHT 2 / 2 SE の symmetric**: その機種のページではなく、PRO X2 SUPERSTRIKE の日本公式ページの「PRO X SUPERLIGHT と PRO X SUPERLIGHT 2によって改良された左右対称の形状」という説明が根拠。
- **corsair-m75-wireless**: 寸法はコルセア公式サイトの解説記事の値。製品ページには寸法がない。
- **寸法・重さが「約」「~」「±」つきのもの**: Endgame Gear、ELECOM、Pulsar、LAMZU、Finalmouse、Glorious。notes に原文を書いた。

## 既存データ(src/data/mice.ts)からの変更点

数値(長さ・幅・高さ・重さ)はすべて公式ページの値と一致した。変わったのは形状・接続・URL・補足だけ。

| id | 変更 | 理由 |
|---|---|---|
| logicool-g502-x-plus | shape: right → null、sensor は HERO 44K | 公式に形状の記載なし。2026 年の現行ページはセンサーが HERO 44K(サポートページは HERO) |
| logicool-g502-hero | shape: right → null、URL を日本公式に | 公式に形状の記載なし |
| logicool-g305 / logicool-g304 | shape: symmetric → null | 公式に形状の記載なし。幅は日本・米国の製品ページが 62.1mm、サポートページが 62.15mm(既存の 62.15 のまま) |
| endgame-gear-op1-8k | shape: symmetric → null | 公式に左右対称の明記なし。現行は後継の OP1 8k v2 |
| endgame-gear-xm2we | shape: symmetric → null、connection: wireless → both | 形状の明記なし。公式の接続に wireless と wired の両方 |
| razer-deathadder-v3-pro / razer-viper-v3-pro / razer-basilisk-v3-pro | connection: wireless → both | 公式の接続仕様に「有線」も並記 |
| razer-deathadder-v3 | URL を日本公式に | 数値は同じ |
| razer-basilisk-v3-pro | URL を日本公式の仕様タブに | 米国の製品トップには仕様が出ない |
| steelseries-aerox-3-wireless | URL を /gaming-mice/aerox-3-2022 に | 旧 URL が転送される |
| steelseries-rival-3-wireless | URL を /gaming-mice/rival-3 に | 旧 URL が転送される。106g は単四2本込み(1本なら 96g) |

`src/` の中は変えていない。この変更を `src/data/mice.ts` に入れるかは別に決める(`MouseSpec` の型は shape・connection に null や both を許していない)。

## 公式ページを取得できなかった URL

| URL | 状態 | 代わりにしたこと |
|---|---|---|
| https://www.amazon.co.jp/gp/bestsellers/computers/2151976051 (WebFetch) | 503 | curl で取り直した。このノードは「キーボード・マウスセット」だったので、ゲーミングマウスのノード 2151973051 を使った |
| https://ranking.rakuten.co.jp/daily/568407/ と /realtime/568407/ | タイムアウト | 楽天は根拠から外した |
| https://www.vaxee.co/en/product.php?act=view&id=248 と https://eu.vaxee.co/product.php?act=list&cid=43 | 自動取得は 403 | ブラウザーで閲覧したが仕様は画像だけ。公式ニュース(id=187)の文字だけを使った |
| https://vaxee.co/ | 403 | 同上 |
| https://www.elecom.co.jp/products/M-VM500BK.html | 自動取得は 403 | ブラウザーで閲覧して仕様表を読んだ |
| https://scyrox.com/products/scyrox-v8 | ブラウザーでの表示は拒否/失敗。WebFetch では読めたが仕様は画像だけ | すべて null |
| https://www.logicool.co.jp/ja-jp/shop/p/pro-x-superlight-wireless-mouse.910-005882 | 404 | 米国公式(910-005878)で確認 |
| https://www.razer.com/jp-jp/gaming-mice/razer-deathadder-v3-pro(仕様)と /specs | 仕様が取り出せない / 404 | 米国公式で確認 |
| https://www.razer.com/jp-jp/gaming-mice/razer-viper-mini | Viper シリーズの一覧へ転送 | 米国公式で確認 |
| https://finalmouse.com/products/ultralightx | 仕様の記載なし | ULX Pro Series の公式ページを使用 |
| https://finalmouse.com/products/ulx-pro-series-overview | 404 | 同上 |
| https://endgamegear.com/products/op1-8k-v2 | 404 | 正しい URL(/products/op1-8k-v2-wired-gaming-mouse)を公式サイト内検索で見つけた |
| https://steelseries.com/gaming-mice/rival-3-wireless-gen-2(ja-jp・英語とも) | 404 | Gen 2 は入れていない |
| https://zowie.benq.com/en/mouse/*.html | 404 | 日本語ページ(/ja-jp/)を使った |
| https://kakaku.com/pc/mouse/ranking_0150/ | 404 | 価格.com のゲーミングマウス一覧(人気順)を使った |
| BCN の 2026年4〜6月の記事(id=623267、638509 など) | 404 | 2026年8月分(9/18 公開)だけを使った |

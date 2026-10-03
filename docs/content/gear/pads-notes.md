# マウスパッド一覧(pads.json)の調べ方とメモ

確認日: 2026-10-03

## 1. やり方

- 数字と言葉は **メーカー公式の製品ページだけ** から取った。通販サイト・レビューサイトの数字は使っていない。価格は載せていない。
- 滑り・止まりの説明(`speedOfficial`)は、メーカーの言葉や独自のスケールをそのまま書いた(例: ARTISAN「ロースピード」、ZOWIE「●●●○○」、Pulsar「Speed: ▶︎▶︎▶︎▷▷▷ Medium」)。ブランドをまたぐ共通の点数は作っていない。
- 硬さ違い(ARTISAN の XSOFT/SOFT/MID、Pulsar eS の XSOFT/SOFT/FIRM、AIM1 電の SOFT/HARD)は、1つの製品の `firmnessVariants` にまとめた。
- 公式に書いていないものは `null` にして、`notes` に理由を書いた。
- 既に `src/data/devices.ts` にあるパッドの id はそのまま使った(15件すべて収録)。
- 件数: **48件**。

## 2. 選び方(人気の出典)

| 出典 | URL | 取得日 |
|---|---|---|
| Amazon.co.jp 売れ筋ランキング「ゲーミングマウスパッド」1〜60位 | https://www.amazon.co.jp/gp/bestsellers/computers/8417538051 | 2026-10-03 |
| 価格.com マウスパッド人気ランキング 2026年9月(1〜3ページ) | https://kakaku.com/ranking/pc/0001_0111/0004/ | 2026-10-03 |
| 既存の登録(devices.ts の category: pad) | src/data/devices.ts | 2026-10-03 |

- 楽天の検索結果(人気順)も見たが、事務用・キャラクターものが中心でゲーミングの判断材料にならなかった。
- ランキングに無いが主要ブランドの定番として足したもの(ARTISAN ハヤテ乙/キ83、Logicool G440/G740、ZOWIE G-SR III、X-raypad Aqua Control+、Endgame Gear 2点、Corsair MM350 PRO)は、`selectionBasis` に「編集判断」と書いた。CEO の判断で外してよい。
- プロ使用の件数は今回は数えていない(公式・第三者の集計を確認していない)。

## 3. 使った公式ページ(主なもの)

- ARTISAN: https://artisan-jp.com/jp/products/ninja-fx/ 以下の各製品、速度分類は https://artisan-jp.com/jp/selection-guide/
- Logicool G: https://www.logicool.co.jp/ja-jp/shop/p/ 以下(仕様はページ内データから)
- Razer: https://www.razer.com/jp-jp/gaming-mouse-mats/ 以下と各 `/specs` ページ
- ZOWIE: https://zowie.benq.com/ja-jp/mouse-pad/ 以下
- SteelSeries: https://steelseries.com/ja-jp/gaming-mousepads/ 以下(仕様はページ内データから)
- Pulsar: https://jp.pulsar.gg/products/ 以下、LGG→Pulsar eS の経緯は https://www.pulsar.gg/blogs/news/pulsar-es-mousepad
- X-raypad: https://shop.x-raypad.com/shop/ 以下
- AIM1: https://aim1.jp/products/ 以下
- Endgame Gear: https://www.endgamegear.com/products/ 以下
- Corsair: https://www.corsair.com/us/en/p/mousepads/ch-9413770-ww/...(英語ページ)
- Wallhack: https://wallhack.com/products/ 以下

## 4. null と気になる点

### 全部 null(公式ページを確認できなかった)7件

| id | 理由 |
|---|---|
| skypad-glass-3 | SkyPAD は 2024年3月に Wallhack へブランド変更。SkyPAD Glass 3.0 の公式ページが無い(skypad.com は別会社、skypadgaming.com は wallhack.com へ転送) |
| vaxee-pa | vaxee.co の製品ページが 403 / ブラウザでも一覧が出ない |
| hyperx-pulsefire-mat | hyperx.com の製品 URL が 404 |
| fnatic-jet | 時間内に公式ページを確認できず |
| dotandz-glimpse-beta | dotandz.com に接続できず |
| talongames-maya | 公式ページ未確認 |
| elecom-gaming-pad-balance | 公式ページ未確認・型番も未特定 |

### 一部 null・食い違い

- **ARTISAN 全7件**: 製品ページにベース素材名とエッジステッチの記載がない。零(ゼロ)・雷電(ライデン)だけは、CLASSIC 版ページの「エッジステッチをご希望の方は NINJA FX ○○ を」という文から `stitchedEdge: true` にした。他は null。厚さは MID のみ 3mm(sizes には XSOFT/SOFT の 4mm を入れた)。シデンカイ V2 は**生産終了**(在庫限り)。
- **Logicool**: 公式の仕様欄の軸名が「高さ=奥行き/幅=横幅/奥行き=厚さ」の意味になっていたので読み替えた。G240/G640/G840/G740 はエッジの記載なし。価格.com 上位の「G240f」「G840r」は公式ページが見つからず、G240/G840 と同一扱いにしてよいか未確認。POWERPLAY 2 は説明文(344×284mm)と仕様欄(幅340/奥行き344)で数字が食い違う。
- **Razer Gigantus V2 Pro**: 公式表の列名「着丈/幅/厚さ」で、L サイズだけ縦横の向きがあいまい(480/500)。
- **Razer Atlas**: 価格.com に出ていたのは「Atlas Pro」で、Atlas Pro の公式ページは取得していない。
- **SteelSeries QcK Heavy XXL**: 説明は厚さ 4mm、同じページの画像説明は 6mm。4mm を採用。
- **ZOWIE G-SR / G-SR II / G-TR は生産終了**。G-SR の現行後継は G-SR III(別 id で収録)。
- **LGG → Pulsar eS**: Pulsar が LGG を買収し、Saturn Pro・Jupiter Pro を作り直して「Pulsar eS」として販売。既存 id `lgg-saturn-pro` `lgg-jupiter` は残したが、LGG 版と同一の製品ではない。devices.ts のブランド・名前をどうそろえるか要判断。Jupiter/Hyperion/Neptune は FIRM の厚さがページに書いていない。
- **X-raypad Aqua Control+**: 厚さの本文記載なし(「Additional information」の 45×40×0.3cm は採用せず)。旧公式とみられる xraypad.com は駐車ドメインで、現在の公式は shop.x-raypad.com。
- **AIM1**: 陽炎 340x300 と叢雲 420x500 の厚さ・向きが不明。
- **Wallhack CR-005 / SP-005**: 寸法が画像にしか無く、厚さも説明文 2.5mm とアイコン 3MM で食い違うため null。
- **Endgame Gear**: MPC450 は厚さとエッジ、EM-C 500x500 は厚さの記載なし。
- **Corsair MM350 PRO**: 日本語ページではなく英語(US)ページで確認。

## 5. 取得できなかった URL

- https://www.amazon.co.jp/gp/bestsellers/... を WebFetch で取ると 503(curl では取得できた)
- https://ranking.rakuten.co.jp/daily/565234/ (タイムアウト)
- https://kakaku.com/pc/mouse-pad/ranking_0547/ ほか推測 URL(404。正しいのは /ranking/pc/0001_0111/0004/)
- https://www.xraypad.com/ (駐車ドメイン)
- https://vaxee.co/jp/product/ (403)
- https://lethalgaminggear.com/ (SSL エラー)
- https://hyperx.com/ja-jp/products/hyperx-pulsefire-mat-gaming-mouse-pad (404)
- https://www.corsair.com/jp/ja/c/mouse-pads (404)
- https://www.razer.com/jp-jp/gaming-mouse-mats/razer-gigantus-v2-pro/specs (404)
- https://www.logicool.co.jp/ja-jp/shop/p/g240f-cloth-gaming-mouse-pad (404)
- https://dotandz.com/ 、https://talongames.jp/ 、https://skypad.jp/ (接続失敗)

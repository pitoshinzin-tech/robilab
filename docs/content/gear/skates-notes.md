# マウスソール(マウスフィート)データのメモ

- ファイル: `docs/content/gear/skates.json`(58 件)
- 確認日: 2026-10-03(全件の `checkedAt`)
- 決まり: 数値はメーカー公式の製品ページの表記だけ。価格は載せない。分からない値は推測せず `null` にして `notes` に理由を書く。id は kebab-case(`src/data/mice.ts` と `src/data/devices.ts` に合わせた)。

## 集め方

1. **選定(どの製品を載せるか)**
   - Amazon.co.jp と楽天の検索・ランキングのページは直接読めなかった(Amazon は 503、楽天は 403)。代わりに、Amazon のランキングをまとめた次の 2 つの日本のページで、日本でよく売れているブランドと型を確かめた。
     - my-best.com/16044「マウスソールのおすすめ人気ランキング【2026年9月】」: 1位 EsportsTiger ICE(汎用)、2位 ESPTIGER Arc1(汎用)、3位 Superglide2(G PRO X SUPERLIGHT 用)、5位 WALLHACK ドット、8位 TALONGAMES(G PRO Wireless 用)、9位 TALONGAMES(G502X 用)、10位 ARTISAN 水蜘蛛 FUTAE P8 など。
     - jp.monohikaku-jp.com「日本におけるマウスソールの検索順位」(Amazon.co.jp 基準、2026-10-03 閲覧): 1・2位 WALLHACK ドット、4〜7位 EsportsTiger/ESPTIGER(Arc1 汎用、ICE 汎用、ICE の G PRO X Superlight 2 用)、8位 X-Raypad Obsidian Air ドット など。
   - ソールは機種ごとに売られるので、各ブランドの中から、ロビラボのデータ(`src/data/devices.ts`)にある人気のマウス向けの製品を選んだ。各件の `selectionBasis` に根拠を書いた。
2. **仕様(数値)**: 各メーカーの公式ストアの製品ページ(または同じストアの商品データ)から取った。
   - ESPTIGER: https://www.esptiger.com (Shopify の商品データ `products.json` と製品ページ)
   - Corepad: https://www.corepad.de/de/ (製品ページの「Dicke」「Sets」「MPN」「Lieferumfang」)
   - X-raypad: https://shop.x-raypad.com (WooCommerce の商品データ。製品ページは本文を JS で読み込むため、同じストアの API の説明文を使った)
   - Pulsar(Superglide / PTFE / UHMW-PE): https://www.pulsar.gg
   - WALLHACK: https://wallhack.com
   - ARTISAN: https://artisan-jp.com/jp/

## 項目の意味

- `material`: PTFE / glass / ceramic / UPE / other。`materialOfficial` に公式の原文。
- `shape`: `full` = 機種専用の形(純正ソールの置き換え。製品名が機種専用であることから判断)、`dot` = 汎用ドット。
- `thicknessMm`: 公式に 1 つの値で書かれているときだけ数値。幅(例「0.7 to 0.8mm」)や選択式は `null` にして、`thicknessOfficial` に原文。
- `piecesPerPack`(粒・枚の数)と `setsPerPack`(セット数。依頼に無い追加の項目)は、公式に書かれているときだけ。
- `mouseId` / `mouseIds`: `src/data/devices.ts` の id と合うときだけ。G304/G305 のように 2 機種に合うときは `mouseIds` に両方を入れた。

## 数

- 全 58 件(ESPTIGER 21、Corepad 14、X-raypad 11、Pulsar 9、ARTISAN 2、WALLHACK 1)
- 素材・厚さ・入数(枚数かセット数)がすべて公式で埋まった件: 16 件(Corepad 14、X-raypad ドット、Pulsar UHMW-PE ドット)
- どこかに null がある件: 42 件
- ロビラボのマウスに結び付いた件: 45 件(うち `src/data/mice.ts` にもある機種: 40 件)

## null と、はっきりしないこと

1. **ESPTIGER の厚さと入数**: 全製品の本文が「a thickness ranging from 0.7 to 0.8mm」の同じ文で、1 つの値ではない。さらに Arc 1 はタグが「0.6mm」、Arc 2 はタグが「0.8mm」で本文と食い違う。入数(何セット・何枚)は文章に無い。
2. **Pulsar Superglide の厚さと入数**: 公式ページに書かれていない(素材のアルミノケイ酸ガラスだけ確か)。
3. **X-raypad の G PRO X SUPERLIGHT 2 用(Obsidian Control / Jade Speed / Ultra)**: 厚さやセット数が、同じブランドの他機種の製品には書かれているのに、この 3 件のページの文章には無い。推測で埋めていない。
4. **ARTISAN 水蜘蛛**: 公式ページの文章に素材・厚さ・個数が無い(画像の中にある可能性)。`material` も null。直径だけ公式(P8 は 8mm、P6 は約 6.4mm)。
5. **WALLHACK ドット**: 素材が PTFE と UHMW-PE の選択式。厚さ・直径・個数は公式の文章に無い。ランキングの「7mm」は販売店の表記なので使っていない。
6. **ランキングの品と公式の現行品のずれ**: 日本の Amazon で売れている「EsportsTiger ICE」は、公式サイトでは「ICE V2」になっている。同じ版かは確認できない。
7. **マウスとの結び付けを保留したもの**:
   - Pulsar X2 用(ESPTIGER ICE V2、Pulsar 純正 PTFE、Superglide Type-S): 公式の対応表に「X2 v2」の名前が無いため、ロビラボの `pulsar-x2-v2` とは結び付けていない(Corepad と X-raypad は X2V2 を明記しているので結び付けた)。
   - ESPTIGER の「ZOWIE EC-W Series」: ZOWIE の現行名「EC2-CW」と同じか書かれていないため null。
   - ESPTIGER の「SteelSeries Aerox 3」: Wireless 版に合うか書かれていないため `steelseries-aerox-3` だけ。
8. **Corepad の商品番号**: 「Skatez CTRL Razer Viper V3 Pro」の MPN が AIR 版と同じ「CSA6530」と表示されている(公式ページの誤記の可能性)。G304/G305 向けには MPN と厚さの違う 2 商品(CS29050 0,7 mm と CSP3680 0,75 mm)がある。
9. **Corepad の選定根拠は弱い**: 日本の 2 つのランキングの上位 10 には入っていない。海外の定番として入れた。

## 取れなかった・使わなかったもの

- **X-raypad の旧公式ドメイン xraypad.com**: 売りに出されているドメイン(GoDaddy の売却ページへの転送)になっていた。現在の公式ストア shop.x-raypad.com を使った。
- **Amazon.co.jp の検索ページ**(503)と **楽天の検索ページ**(403): 読めなかった。上の 2 つのまとめページで代わりにした。
- **Lethal Gaming Gear(LGG)**: マウスソールの自社製品を公式サイトで確かめられなかった(lethalgaminggear.com に接続できなかった)。載せていない。
- **Hotline Games、TALONGAMES**: 日本の Amazon でよく売れているが、メーカーの公式製品ページを見つけられなかった。載せていない。次に足す候補。
- **Logicool / Razer の純正交換ソール**: 公式ストアに単体の製品ページを見つけられなかった(Logicool の純正部品は iFixit が扱う)。載せていない。
- **superglide.net**: 中身を読めなかった。Superglide は Pulsar の公式ストア(pulsar.gg)のページを使った。

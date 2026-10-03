# VALORANT(Riot Games)のファンコンテンツの決まり

- 確認した日: 2026-10-03
- 出典(Riot 公式):
  - Legal Jibber Jabber(英語・現行の本文) https://www.riotgames.com/en/legal  ※ページの表記は「Last Updated: August 2018」
  - 同(日本語) https://www.riotgames.com/ja/legal  ※中身は「Legal Jibber Jabber ポリシー」で**リーグ・オブ・レジェンド向けの古い版**。英語版と文言・ルールが違う。VALORANT に当てはまるのは英語の現行版と考えるのが安全(**【要確認】**日本語の窓口 jpinfo@riotgames.com に聞ける)
  - 開発者向けの決まり(API を使う製品の場合) https://developer.riotgames.com/policies.html (LAST UPDATED: MAY 29, 2025)
- ロビラボは Riot の API を使っていない(公式サイトのページを調べただけ)ので、**英語版の Legal Jibber Jabber(ファンプロジェクト向け)が当てはまる**と読んだ。

## 求められる断り書き(原文そのまま)

英語版 6 章「Can I share my Project with the community?」より。「ウェブサイトなど目立つ所に」入れるよう求めている。

> [The title of your Project] was created under Riot Games' "Legal Jibber Jabber" policy using assets owned by Riot Games.  Riot Games does not endorse or sponsor this project.

([The title of your Project] にはサイトの名前「ロビラボ」が入る。日本語の訳は公式にない。原文のまま英語で入れるのが安全。)

参考(API 開発者向けの断り書き。ロビラボは API を使わないので必須ではない):

> [Your product] isn't endorsed by Riot Games and doesn't reflect the views or opinions of Riot Games or anyone officially involved in producing or managing Riot Games properties. Riot Games, and all associated properties are trademarks or registered trademarks of Riot Games, Inc.

(日本語版・LoL 向けの古い断り書きの原文: 「[プロジェクトの名前]は、ライアットゲームズが公式承認するものではなく、ライアットゲームズ又はリーグ・オブ・レジェンドの製作・管理に正式に関与したいかなる者の見解・意見に基づくものではありません。…」。VALORANT 用ではない。)

## 禁止事項・条件(英語版の要点。原文の要約。引用は短く)

1. **お金を取る・商業のプロジェクトは不可**(2 章): 「You may not create commercial Projects, including any Project that crowdsources any portion of its funding, any Project that involves a business or legal entity, or any Project where you gate the content with a paywall」。書面の許諾がないと、資金集め・**会社や法人が関わるプロジェクト**・有料の壁があるものはだめ。例外は 3 つだけ。
   - 例外 1 広告収入: 「individual players」(個人)が、ふさわしい広告で**受け身の**収入を得るのは可。「No inappropriate ads」(何が不適切かは Riot が決める)。
   - 例外 2 ゲーム配信の寄付・サブスク(個人)。
   - 例外 3 Riot の API の規約に従い、自分に発行された API キーを使うもの。
   → **ロビラボの対応**: アフィリエイトの枠をキャラのページに置かない(設計書 4 章の決定)は正しい。広告も、サイトが個人の運営か法人の運営かで話が変わる(**【要確認】**運営主体。「business or legal entity が関わる」が商業扱いになりうる)。公開の前に社長が判断すること。
2. **ロゴ・商標は使わない**(5 章): 書面の許諾がない限り、ロゴや商標をプロジェクトのどこにも使わない。**ドメイン名・SNS アカウントに Riot やキャラ名などを使うのも不可。** 「You may not use our trademarks or names related to our IP as keywords or internet search tags.」(商標や IP に関係する名前を、**キーワードや検索タグとして使うのも不可**)。→ **注意**: 設計書 6-6 の「ジェット(VALORANT)はどんなタイプに合う?」のようなタイトル・description・meta keywords にキャラ名・ゲーム名を入れることが「検索タグとして使う」に当たるかは読み方が分かれる。**【要確認】**(日本語の窓口に聞くか、キャラ名を入れる範囲を決める)。ロゴを真似た文字組みもしない(設計書 4 章どおり)。
3. **ゲームやアプリには使えない**(3 章): キャラの見た目・アビリティー・マップ・アイコンなどをゲームやアプリに使わない。Apple Store / Google Play のものは書面の許諾か API キーが要る。→ ロビラボは Web サイトなので該当しにくいが、PWA を「アプリ」として配る場合は念のため確認(**【要確認】**)。
4. **画像の扱い**: 英語の現行版には画像の可否の明記が見当たらない(日本語の古い LoL 版は「画像はご利用いただけます。但し、当社ロゴはご利用いただけません」)。ロビラボは**公式の画像・アートを使わない**(設計書 4 章)ので問題にならない。
5. **独創性**(4 章): 既存のコンテンツをそのまま写したり、軽い解説を付けただけにしない。自分の貢献を作る。→ 引用は短く、自分たちの要約が主になる形(設計書 4 章の方針と合う)。
6. **Riot が使ってよい**(7 章): プロジェクトを Riot が宣伝・複製・改変してよい(対価・クレジットなし)に同意したことになる。
7. Riot はいつでも、理由を問わずプロジェクトを止めさせられる(冒頭と 1 章)。
8. **なりすまし・不適切な利用**: 日本語版には、Riot や社員になりすます・不快な広告・競合の広告を載せるのは不可とある(LoL 向けの古い版だが、同じ考え方と見るのが安全)。

## ページに入れる文(提案)

- 各ページの下: 上の英語の断り書きを原文のまま(「[The title of your Project]」を「ロビラボ」にして)+「VALORANT は Riot Games, Inc. の商標です。ロビラボは非公式のファンサイトで、Riot Games とは関係ありません」。
- 個別の確認が要る点(社長への質問候補): (a)運営が個人か法人か(広告・収益の扱い) (b)ページのタイトル・description にキャラ名とゲーム名を入れてよいか (c)PWA の配り方。

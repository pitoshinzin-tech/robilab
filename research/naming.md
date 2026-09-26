# サービス名候補の調査レポート

- 調査日:2026-09-26
- 方法:WebSearch / WebFetch、.com は Verisign RDAP で登録状況を確認、.com/.jp は DNS(NS レコード)と HTTPS でサイトが表示されるかを確認
- 前回の調査は利用制限で途中終了しました。そのときの途中結果は残っていなかったため、今回すべて調べ直しています。

> **このレポートの限界(先にお読みください)**
> - **商標(J-PlatPat)**:ページが JavaScript で表示される仕組みのため、今回の方法では検索結果を取得できませんでした(WebFetch では「Loading...」しか取れません)。**8候補すべて「要確認」**です。Web 検索で登録情報が出てこなかったことは、「登録がない」ことを意味しません。
> - **.jp ドメイン**:JPRS の whois/RDAP を機械的に取得できませんでした。そのため「DNS に NS レコードがあるか」で判断しています。NS がない場合も、登録だけされていて DNS 未設定の可能性があるため、「空きの可能性が高い」という表現にとどめています。
> - **X のアカウント**:x.com は取得できません(HTTP 403)。検索エンジン経由で見えたものだけを書いています。見えなかったものは「未確認」とし、「空いている」とは判断していません。

---

## 1. 候補ごとの比較表

| # | 候補 | 既存サービス(紛らわしいもの) | 商標(9/41/42類) | ドメイン .com | ドメイン .jp | X(@英字) | 検索での見つけやすさ | 総合 |
|---|---|---|---|---|---|---|---|---|
| 1 | GGロビー(GG Lobby) | **ggLobby(gglobby.in)**:インドの VALORANT 向けゲーマー SNS(仲間探し・クラン)。同じ分野です。ほかに Steam グループ「Good Game Lobby」、Discord「Lobby.gg」、YouTube「Lobby GG」 | 要確認(Web 検索では見つからず) | **使用中**:2026-02-16 登録。gglobby.in の ggLobby へ転送される | 空きの可能性が高い(NS なし) | @gglobby:未確認 | 「GG」「ロビー」はどちらも一般的なゲーム用語です。カタカナ表記では格ゲーの GBVSR「オンラインロビー」や GG の解説記事に埋もれます | **△** |
| 2 | ロビラボ(Lobby Lab) | 検索結果に「ログイン \| ロビラボ」(lobbylab.net)が出ますが、現在はドメインを名前解決できません(中身は未確認)。似た名前に Roblox 関連企業「株式会社ロブラボ」、ロボット「ロビ」 | 要確認 | **使用中**:2009 年登録。lobbyschool.com(米国のロビー活動の講座)へ転送。ゲームとは無関係 | 空きの可能性が高い(NS なし) | @LobbyLabNL(オランダの広報・ロビー活動系)が存在。@lobbylab 本体は未確認 | 「ロビラボ」自体は珍しい語です。ただし「ロビ」(ロボット)や「ロブラボ」と混ざる可能性があります | **○** |
| 3 | PLAYCE(プレイス) | **playce.jp**:日本の iOS アプリ・Web 制作会社「PLAYCE」。playce.com:豪州の「Playce - Serious About Fun」。X に @Playce_GG(ゲーム系とみられる)。Google Play に位置情報アプリ「plaYce」。カタカナ「プレイス」は「デュエル・マスターズ プレイス」(タカラトミー)と同じ読み | 要確認(同名の日本企業があるため、特に要注意) | **使用中**:2008 年登録、サイト表示あり | **使用中**:日本の制作会社が使用 | @Playce_GG ほか類似が多数。@playce 本体は未確認 | カタカナの「プレイス」は一般語(place)で、検索ではほぼ埋もれます。英字でも複数の既存サービスと競合します | **×〜△** |
| 4 | ゲーロビ(GAMELOBI) | 同名のゲーム系サービスは見つかりませんでした。ただしゲーマーのスラング「**ゲロビ**」(ゲロビーム=照射系ビーム攻撃)と一文字違いです。旧ゲームコミュニティ「Lobi(ロビー)」(2022 年 7 月終了)も連想されます | 要確認 | **登録済み**:2024-08-16 登録。現在はエラーページ(トルコ語「Hata!」)で、実際のサービスはなさそうです | 空きの可能性が高い(NS なし) | @gamelobi:未確認 | 「ゲーロビ」で検索すると「ゲロビ」の結果に寄せられやすいです。一方で、完全一致の競合は少ないです | **△** |
| 5 | パーティアップ(PARTY UP) | **米国のゲーマー向け仲間探し(LFG)アプリ「Party Up」**。App Store「Party Up: Friends & Group Game」。Google Play「Party Up! – Party Games 18+」。国内ではスクーター部品店「パーティーアップ(Partyup)」 | 要確認 | **使用中**:2001 年登録(現在は応答なし) | **使用中**:「Coming Soon」ページあり | @partyup:未確認(類似の @partyupsma 等あり) | 「party up」は一般的な英語表現で、パーティーゲームの記事にも埋もれます | **×** |
| 6 | ツナゲー | **フジテレビのバラエティ番組『ツナゲー〜繋げるバトルゲーム〜』**(TVer で配信)。パズルアプリ「ツナゲー」、JOYPOD「ツナゲー」、「駅つなゲー」 | 要確認(テレビ番組名として出願されている可能性があるため、特に要注意) | **登録済み**:2025 年登録。NS が Afternic のため、売りに出されている可能性があります | **使用中**:**TSUNAGE**(サッカー選手向けプラットフォーム。「選手タイプ診断」機能あり) | @tsunage:未確認 | テレビ番組が上位に来るため、埋もれます | **×** |
| 7 | ロビーク(LOBBIQ) | lobbiq.com:ホテル向けのセルフチェックイン SaaS「Lobbiq」(分野は無関係)。日本語「ロビーク」でゲーム系の同名サービスは見つかりませんでした | 要確認(Web 検索では見つからず) | **使用中**:2026-02-18 登録。ホテル向け SaaS が使用 | 空きの可能性が高い(NS なし) | @lobbiq:未確認 | 造語のため、カタカナ・英字どちらでも埋もれにくいです | **○** |
| 8 | ゲームひろば | **Gポイント「ゲームひろば」**(無料ブラウザゲーム+ポイ活)。「ゲーム広場プラス」(ゲソてん)。dポイント「ポイント広場」ゲーム。アサヒ飲料アンパンマン「ゲームひろば」。「ボードゲームひろば」 | 要確認 | 空きの可能性が高い(RDAP 404=未登録、NS なし) | 空きの可能性が高い(NS なし) | 未確認 | 一般的な言葉で、既存のゲームサイトと完全に重なります。最も埋もれやすい候補です | **×** |

評価の目安:◎=大きな問題なし/○=軽い注意点あり/△=大きな懸念が1つ以上/×=既存の同名サービスが同じ分野にあり、避けるべき

---

## 2. 気になった点

1. **同じ分野の同名サービスがあるもの**
   - GGロビー:英字の「ggLobby」は、ゲーマー向け仲間探し SNS として現役です。gglobby.com もそこへ転送されています。海外展開や英字ロゴを考えると、衝突しやすい候補です。
   - パーティアップ:米国に同じ用途(仲間探し)のアプリ「Party Up」があり、.com と .jp も使われています。
   - ツナゲー:フジテレビの番組名と同じで、tsunage.jp は「タイプ診断」を持つ別サービスです。機能まで重なっています。
   - ゲームひろば:Gポイントの「ゲームひろば」が、無料ゲームサイトとして同じ名前で運営されています。
2. **PLAYCE**:日本に同名の IT 制作会社(playce.jp)があります。商標を出願済みかどうかは未確認ですが、同名の法人がある以上、慎重に判断すべきです。カタカナ「プレイス」は「デュエル・マスターズ プレイス」と同じ読みです。
3. **ゲーロビ**:ゲーマーのスラング「ゲロビ」と一文字違いです。狙っているゲーマー層ほど気づきやすいため、ブランドのイメージに影響するおそれがあります。
4. **「ロビ」系の名前(ロビラボ・ゲーロビ・ロビーク)**:以前ゲームコミュニティ「Lobi」(カヤック→ナナメウエ、2022-07-31 にアプリ終了)がありました。好意的に連想される可能性もありますが、X の @lobi_ja は今も残っています。
5. **ロビラボ**:検索エンジンに「ログイン | ロビラボ」(lobbylab.net)というページが残っていますが、現在はドメインを名前解決できません。過去に同名サービスがあった可能性があります(中身は未確認)。
6. **.com を取れる候補はほぼありません**:未登録と確認できたのは gamehiroba.com だけです。ロビーク・GGロビー・ロビラボは、.jp やその他の TLD(.gg、.app など)で取ることが現実的です。
7. **商標は全候補とも未確認です**:決める前に、J-PlatPat の「商標検索」で、第9類(ゲーム用プログラム)、第41類(オンラインゲームの提供・娯楽情報)、第42類(SaaS・Web サービス)、第35類(広告・マッチング関連)を、称呼(読み)検索で確認してください。称呼検索は、カタカナの読みが似たものも拾えるため重要です。

---

## 3. おすすめ上位3つ

### 1位:ロビーク(LOBBIQ)
- 造語のため検索で埋もれにくく、ゲーム分野で同名のサービスは見つかりませんでした。
- lobbiq.com はホテル向け SaaS が使っていますが、分野が違うため混同されるおそれは小さいです。lobbiq.jp は空きの可能性が高いです。
- 「ロビー」が入っているため、「広場・たまり場」というイメージも伝わります。
- 注意:.com は取れません。商標(特に第42類の SaaS)は要確認です。

### 2位:ロビラボ(Lobby Lab)
- 「ロビー(つながり)」と「ラボ(診断・感度計算・エイム練習などのツール)」の組み合わせで、サイトの機能と名前が合っています。
- lobbylab.jp は空きの可能性が高いです。lobbylab.com はゲーム以外の分野が使っています。
- 注意:過去に「ロビラボ」というサービス(lobbylab.net)があった形跡があります。また「ロブラボ」(Roblox 関連企業)と音が近いです。商標は要確認です。

### 3位:GGロビー(GG Lobby)※条件付き
- 名前だけでゲーマー向けとすぐ伝わり、「ゲームといえば」の方向性とも合っています。gglobby.jp は空きの可能性が高いです。
- 注意:英字の「ggLobby」は、海外の同じ分野のサービス(仲間探し SNS)が gglobby.com とともに使っています。国内向けでカタカナ表記を主にするなら候補になりますが、英字ロゴや海外展開を考えるなら避けたほうがよいです。
- 次点:ゲーロビ。ドメインは .jp が空いていそうですが、「ゲロビ」と間違われるリスクがあるため 4 位としました。

---

## 4. 出典 URL

### 既存サービス
- ggLobby(インドの VALORANT 向けゲーマー SNS):https://gglobby.in/ 、https://gglobby.in/register
- Steam グループ Good Game Lobby:https://steamcommunity.com/groups/goodgamelobby
- Lobby.gg Discord:https://discord.me/lobbydotgg
- Lobby GG(YouTube):https://www.youtube.com/channel/UC-2AyAYiUpX5yEUkV8Uk6tw
- GBVSR オンラインロビー:https://rising.granbluefantasy.jp/gamemode/onlinelobby/
- ロビラボ(検索に残るログインページ):https://lobbylab.net/login
- 株式会社ロブラボ:https://www.roblabo.com/ 、https://ja.wikipedia.org/wiki/%E3%83%AD%E3%83%96%E3%83%A9%E3%83%9C
- ロビ(ロボット):https://ja.wikipedia.org/wiki/%E3%83%AD%E3%83%93
- LobbyLab(X、オランダ):https://x.com/lobbylabnl
- PLAYCE(日本の制作会社):https://playce.jp/
- Playce(豪州):https://playce.com/
- Playce_GG(X):https://x.com/playce_gg
- plaYce(Google Play):https://play.google.com/store/apps/details?id=com.mycompany.playceproto&hl=en_US
- デュエル・マスターズ プレイス:https://play.google.com/store/apps/details?id=jp.co.takaratomy.duelmastersplays&hl=en_US
- ゲロビ(ニコニコ大百科):https://dic.nicovideo.jp/a/%E3%82%B2%E3%83%AD%E3%83%93
- Lobi(Wikipedia):https://ja.wikipedia.org/wiki/Lobi
- Lobi 事業譲渡(カヤック):https://www.kayac.com/news/2022/06/lobi
- Lobi サービス終了のご案内:https://web.lobi.co/blog/mention/f30301aed010e15aafc0bb3cb0f4ef3b89417d3a
- Party Up(ゲーマー向け仲間探しアプリの紹介記事):https://mp1st.com/news/new-app-aims-to-make-partying-up-meeting-new-gamers-a-breeze-beta-sign-ups-now-live
- Party Up: Friends & Group Game(App Store):https://apps.apple.com/us/app/party-up-friends-group-game/id1620838428
- Party Up! – Party Games 18+(Google Play):https://play.google.com/store/apps/details?id=com.sensanetwork.partyup&hl=en_US
- Partyup(スクーター部品店):https://www.partyup4.com/
- ツナゲー(TVer):https://tver.jp/lp/c0645151
- ツナゲー(フジテレビのプレスリリース):https://prtimes.jp/main/html/rd/p/000001069.000000084.html
- ツナゲー(パズルアプリ):https://dotapps.jp/hierarchies/QNjRgEe6fcqi7SY0
- ツナゲー(JOYPOD):http://www.joypod.net/tunage-/
- 駅つなゲー:https://www.tetsudo.com/chain/
- TSUNAGE(サッカーのプラットフォーム):https://tsunage.jp/
- Lobbiq(ホテル向け SaaS):https://www.lobbiq.com/
- ゲームひろば(Gポイント):https://gpoint.kantangame.com/easygame
- ゲーム広場プラス:https://gd.gesoten.com/m/ap-hiroba/
- アンパンマン ゲームひろば(アサヒ飲料):https://www.asahiinryo.co.jp/anpanman/game/

### ドメイン・商標の確認に使ったもの
- Verisign RDAP(.com の登録日):https://rdap.verisign.com/com/v1/domain/<名前>.com
  - 登録日:gglobby.com 2026-02-16/lobbylab.com 2009-07-28/playce.com 2008-03-28/gamelobi.com 2024-08-16/partyup.com 2001-08-30/tsunage.com 2025-01-14/lobbiq.com 2026-02-18/gamehiroba.com 未登録(404)
- .jp:Google Public DNS(8.8.8.8)で NS レコードを確認(JPRS の whois は未取得。https://whois.jprs.jp/ で再確認が必要)
- J-PlatPat 商標検索:https://www.j-platpat.inpit.go.jp/t0100 (自動取得できなかったため、手作業での確認が必要)

---

## 追記:J-PlatPat での商標検索(2026-09-26、Claude がブラウザで確認)

**検索1:表記**(商標(検索用)で「ロビラボ」「LOBBYLAB」「ロビーラボ」)
- 結果は **0件**。同じ表記の出願・登録は見つからなかった。

**検索2:発音**(称呼(類似検索)で「ロビラボ」)
- 結果は19件。「ロビラボ」と同じ称呼のものはなかった。
- 似た音で、ゲーム・ソフト・サービスに近い区分のものは次のとおり。
  - 9類:ソフトウェア、アプリ
  - 41類:娯楽、教育、オンラインのゲームやサービス
  - 42類:SaaS、Web サービス

| 商標 | 称呼 | 区分 | 状態 | 権利者 |
|---|---|---|---|---|
| のびラボ! | ノビラボ | 09, 41 | 登録 | 個人 |
| ノヴィラボ | ノビラボ | 09, 35 | 登録 | ノヴィルホールディングス |
| あべのロボラボ | ロボラボ など | 16, 41 | 登録 | アトランティックカンパニー |
| ロジラボ | ロジラボ | 41 | 登録 | サムライプラン |
| LOGI-LABO | ロジラボ | 39, 42 | 登録 | 山九 |
| ロビラビ | ロビラビ | 35(小売など) | 出願・審査待ち | パン・パシフィック・インターナショナルHD |
| OpLab! | オプラボ など | 09, 35, 41 | 登録 | 海外個人 |
| MOBILABO / mobilabo | モビラボ | 09 / 12, 37, 39 | 登録 | 三井金属資源開発 / KMB |

**所感**(法的な判断ではない)
- 同じ表記・同じ称呼の商標はない。
- 「〇〇ラボ」は非常に多い語尾なので、似ているかどうかは頭の部分(ロビ/ノビ/ロボ/ロジ)の違いで判断されることが多いと考えられる。
- 確実に知りたい場合や、自分で商標を出願する場合は、弁理士への相談をすすめる。
- 検索 URL:https://www.j-platpat.inpit.go.jp/t0100

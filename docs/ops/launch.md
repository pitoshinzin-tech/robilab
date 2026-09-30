# 公開当日の手順(v0.1 マッチング込み)

上から順に進める。チェックが付かない項目があれば、公開を止めて相談する。

## 前日までに(本人)

- [ ] `content/legal/terms.md` と `content/legal/privacy.md` の【公開前に本人が記入】(お問い合わせ先)を埋める
- [ ] Discord アプリを作り、本番 Supabase(`robilab`)の Discord ログインを設定する
- [ ] Supabase Auth の「Redirect URLs」を、本番の `https://<本番ドメイン>/auth/callback` だけにする(dev 用は dev プロジェクト側に)
- [ ] Vercel の本番の環境変数を設定する
  - `NEXT_PUBLIC_SUPABASE_URL=https://bncjzilfehkjftzraajd.supabase.co`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY=`(本番の publishable key)
- [ ] (任意・アフィリエイトの審査が通ってから)マウス探しの成果報酬リンク用に、次の環境変数を入れて再デプロイする(組み立て時に埋め込まれるため、入れただけでは反映されない)。未設定なら普通の検索リンクになり、「PR」は出ない
  - `NEXT_PUBLIC_AMAZON_ASSOCIATE_TAG=`(Amazon アソシエイトのトラッキング ID。例 `xxxx-22`)
  - `NEXT_PUBLIC_RAKUTEN_AFFILIATE_ID=`(楽天アフィリエイト ID。`xxxxxxxx.xxxxxxxx.xxxxxxxx.xxxxxxxx` の形)
- [ ] 本番の NG ワード初期リストを確認する(`docs/ops/moderation.md` の「公開前の準備」)

## 当日

1. **セキュリティゲート**:マージする内容で security-audit を実行し、confirmed の critical / high が 0 件であることを確認する(`public-web-security-gate` スキル)
2. **本番 DB に未適用の migration を、番号順に適用する**(dev には適用済み)
   - **0500〜1500 のすべてを、アプリのマージ・本番反映(手順3)より前に適用し終えること**。順番を逆にすると、新しいアプリが呼ぶ関数や表が本番にまだないため、版 2 のマイ設定(クロスヘア)が保存できず、`/aim` のランキング取得・記録の送信(`get_aim_ranking` / `my_aim_rank` / `submit_aim_score`)も失敗する
   - [ ] `supabase/migrations/20261001000500_discord_link.sql`(成立相手の Discord プロフィールリンク)
   - [ ] `supabase/migrations/20261001000600_rejoin_guard.sql`(退会・再登録の悪用対策)
   - [ ] `supabase/migrations/20261001000700_perf.sql`(インデックスと RLS ポリシーの性能改善)
   - [ ] `supabase/migrations/20261001000800_hardening3.sql`(選択肢の検証、NG ワードのすり抜け対策、同時声かけ、BAN の状態同期)
   - [ ] `supabase/migrations/20261001000900_hardening4.sql`(axes の検証、NG ワードの除去文字の追加)
   - [ ] `supabase/migrations/20261001001000_diagnosis_rpc.sql`(診断の匿名記録を関数経由にし、件数の上限を付ける。**適用した瞬間から、今の本番アプリ(計画1)の診断記録は保存されなくなる**。診断結果の表示は止まらないが、記録が抜けるので、適用したらすぐ手順3に進む)
   - [ ] `supabase/migrations/20261001001100_my_settings.sql`(マイ設定の表と関数。マイ設定を公開するときだけ必要)
   - [ ] `supabase/migrations/20261001001200_my_settings_moderation.sql`(利用停止・BAN と名刺の公開をつなぐ。上の 1100 とセット)
   - [ ] `supabase/migrations/20261001001300_my_settings_v2.sql`(マイ設定の拡張)
   - [ ] `supabase/migrations/20261001001400_aim_daily.sql`(今日の文字の表と関数。※ dev では 1400 のあとに、関数の中身が最終の 1400 と同じ dev 専用の記録 `aim_daily_ranking_names` を別に適用した。本番は 1300 と 1400 のファイルだけでよい)
   - [ ] `supabase/migrations/20261001001500_card_locks.sql`(運営の公開禁止の印を別の表 `card_locks` にも残し、本人が設定を消して作り直しても印が戻るようにする。1200 のあと)
   - [ ] **Vercel の Firewall にルールを1つ足す**(マイ設定を公開するとき):パスが `/api/card-image` のリクエストを、IP ごとに1分20回まで(超えたら 429)。Vercel ダッシュボード → プロジェクト → Firewall → Custom Rules → Rate Limit
   - [ ] **同じく Firewall に、パスが `/aim/opengraph-image` のリクエストを IP ごとに1分30回まで(超えたら 429)のルールを足す**(クエリを変えると CDN のキャッシュを通らず、毎回画像を描かせられるため)
   - 以降に追加した migration があれば、それも。dev と本番の `list_migrations` を見比べて、差がないことを確認する
   - 適用後、Supabase の SQL エディタで `select public._ng_normalize('テスト');` がエラーにならないこと、アドバイザー(security)に新しい警告が出ていないことを確認する
   - [ ] **適用後、本番と dev の関数の定義を見比べる**(dev には dev 専用の記録 `aim_daily_ranking_names` が余分にあるため、`list_migrations` の差だけでは中身の違いに気づけない)。両方の SQL エディタで次を実行し、結果が同じであることを確認する
     ```sql
     select pg_get_functiondef('public.get_aim_ranking(date)'::regprocedure);
     select pg_get_functiondef('public.my_aim_rank(date)'::regprocedure);
     select pg_get_functiondef('public.submit_aim_score(date, text, numeric, int, int)'::regprocedure);
     select pg_get_functiondef('public.save_my_settings(jsonb)'::regprocedure);
     ```
   - 今の本番アプリ(計画1)はマッチング機能を使っていないので、手順2と3の間に古いアプリが新しい DB を使って困ることはない。マッチング機能を使うアプリが本番にある状態で DB を変えるときは、手順2と3の間に動作確認を1回入れる
3. `feat/v0.1-part2` を `master` にマージする → Vercel が自動で本番に反映する
4. 本番で動作確認(Claude はブラウザで、本人はスマホで)
   - [ ] 診断 → 結果 → X シェア
   - [ ] Discord ログイン → 登録 → ロビー表示(X のアプリ内ブラウザでも)
   - [ ] 声かけ → 相互 OK → Discord プロフィールリンクが開く(テスト用アカウント2つで)
   - [ ] 退会 → 7日間は再登録できないことの表示
   - [ ] 通知ベルの未読数が出て、通知ページを開くと 0 になる(既読化をサーバーアクションに移したため)
   - [ ] 診断してから登録画面を開くと、タイプが自動で入る(読み込み方を変えたため)
   - [ ] マイ設定:ログインして入力 → 別の端末でログインして同じ内容が出る → 名刺を公開して X に貼るとカードが出る → 公開をオフにすると URL が 404
   - [ ] 今日の文字:PC で実際に遊び、ゲームと同じ感度の手応えか確かめる/ログインして送るとランキングに載る/Esc で中断すると記録されない/スマホでは「PC で遊べます」が出る
   - [ ] 今日の文字:名刺を公開していない人の名前がランキングに出ない
   - [ ] マウス探し:自分の手で結果が納得できるか(係数の手応え。特に幅)/マウスの一覧の数字と出典(`src/data/mice.ts`)/公式・Amazon・楽天のリンクが開く/スマホで崩れない
   - [ ] (データが入ったら)プロ設定:載せる選手と数字の一覧(src/data/pros.ts)/近いプロの手応え/スマホで崩れない
   - [ ] マイ設定(ログイン後):新しい端末でログインすると、入力欄にサーバーの設定が表示される/「設定を消す」で消え、再読み込みしても戻らない/公開前に入力を変えてすぐ公開しても、公開カードに最新の内容が出る
5. X で告知する

## 公開後すぐ

- 通報の確認を毎日1回(`docs/ops/moderation.md`)
- Vercel と Supabase のエラーログを数日見守る

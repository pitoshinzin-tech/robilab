# 公開当日の手順(v0.1 マッチング込み)

上から順に進める。チェックが付かない項目があれば、公開を止めて相談する。

## 前日までに(本人)

- [x] `content/legal/terms.md` と `content/legal/privacy.md` のお問い合わせ先を埋める(robilab.contact@gmail.com、2026-09-30)
- [ ] 公開日が決まったら、`content/legal/privacy.md` の「制定日:2026年10月【公開日】」を実際の日付にする
- [x] Discord アプリを作り、本番 Supabase(`robilab`)の Discord ログインを設定する(2026-09-30)
- [ ] **本番ドメインを決める**(独自ドメインを取るか、しばらく `robilab.vercel.app` のままにするか)。決めたら次の 3 つをそろえる
  - Vercel → プロジェクト → Domains にドメインを足す(独自ドメインのとき)
  - Vercel の `NEXT_PUBLIC_SITE_URL` を本番の URL にする
  - Amazon アソシエイト →「アカウント設定」→「ウェブサイトとモバイルアプリの情報」に本番の URL を足す
- [ ] Supabase Auth の「URL Configuration」:Site URL を本番の URL に、「Redirect URLs」を本番の `https://<本番ドメイン>/auth/callback` だけにする(dev 用は dev プロジェクト側に)
- [ ] **Vercel を Pro プランにする**(無料の Hobby は商用利用が禁止。アフィリエイトのリンクを出すサイトは商用にあたる。D35)。本人の希望で、**すべて完成したあとに Claude から声をかけて進める**(2026-09-30)
- [ ] Vercel の本番の環境変数を、正しい値で**上書き**する(9/27 に Secret で入れたため値を見て確かめられない。Type は「Config」にする)
  - `NEXT_PUBLIC_SUPABASE_URL=https://bncjzilfehkjftzraajd.supabase.co`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY=`(本番の publishable key)
- [x] `NEXT_PUBLIC_AMAZON_ASSOCIATE_TAG=devicepickup-22` を Vercel に追加(2026-09-30、Production と Preview)
- [ ] (任意・楽天アフィリエイトの ID があれば)マウス探しの成果報酬リンク用に、次の環境変数を入れて再デプロイする(組み立て時に埋め込まれるため、入れただけでは反映されない)。未設定なら普通の検索リンクになり、「PR」は出ない
  - `NEXT_PUBLIC_AMAZON_ASSOCIATE_TAG=`(Amazon アソシエイトのトラッキング ID。例 `xxxx-22`)
  - `NEXT_PUBLIC_RAKUTEN_AFFILIATE_ID=`(楽天アフィリエイト ID。`xxxxxxxx.xxxxxxxx.xxxxxxxx.xxxxxxxx` の形)
- [ ] 本番の NG ワード初期リストを確認する(`docs/ops/moderation.md` の「公開前の準備」)

## 当日

1. **セキュリティゲート**:マージする内容で security-audit を実行し、confirmed の critical / high が 0 件であることを確認する(`public-web-security-gate` スキル)
2. **本番 DB に未適用の migration を、番号順に適用する**(dev には適用済み)
   - [ ] **適用前に**、本番の SQL エディタでロビーの表に行があるかを確かめる。0 件のはず(今の本番アプリ(計画1)はマッチング機能を使っていない)。すべて 0 件、または中身を見て問題がないことを確かめてから進める。行があれば止めて相談する(0600 より前に退会した人は `left_discord_ids` に記録がないので、再登録の待ち期間や引き継ぎのブロックが効かない。その扱いを決めてから進める)
     ```sql
     select
       (select count(*) from public.profiles) as profiles,
       (select count(*) from public.reports) as reports,
       (select count(*) from public.blocks) as blocks,
       (select count(*) from public.banned_discord_ids) as banned_discord_ids;
     ```
   - **0500〜1700 のすべてを、アプリのマージ・本番反映(手順3)より前に適用し終えること**。順番を逆にすると、新しいアプリが呼ぶ関数や表が本番にまだないため、版 2 のマイ設定(クロスヘア)が保存できず、`/aim` のランキング取得・記録の送信(`get_aim_ranking` / `my_aim_rank` / `submit_aim_score`)も失敗する
   - [ ] `supabase/migrations/20261001000500_discord_link.sql`(成立相手の Discord プロフィールリンク)
   - [ ] `supabase/migrations/20261001000600_rejoin_guard.sql`(退会・再登録の悪用対策)
   - [ ] `supabase/migrations/20261001000700_perf.sql`(インデックスと RLS ポリシーの性能改善)
   - [ ] `supabase/migrations/20261001000800_hardening3.sql`(選択肢の検証、NG ワードのすり抜け対策、同時声かけ、BAN の状態同期)
   - [ ] `supabase/migrations/20261001000900_hardening4.sql`(axes の検証、NG ワードの除去文字の追加)
   - [ ] `supabase/migrations/20261001001000_diagnosis_rpc.sql`(診断の匿名記録を関数経由にし、件数の上限を付ける。**適用した瞬間から、今の本番アプリ(計画1)の診断記録は保存されなくなる**。診断結果の表示は止まらないが、記録が抜けるので、適用したらすぐ手順3に進む)
   - [ ] `supabase/migrations/20261001001100_my_settings.sql`(マイ設定の表と関数。**必須**:マイ設定を公開しない場合でも、このあとの 1200〜1500 と新しいアプリ(`/aim` のランキングなど)がこの表と関数を使う。1100 を飛ばすと 1300〜1600 を番号順に流せない)
   - [ ] `supabase/migrations/20261001001200_my_settings_moderation.sql`(利用停止・BAN と名刺の公開をつなぐ。上の 1100 とセット)
   - [ ] `supabase/migrations/20261001001300_my_settings_v2.sql`(マイ設定の拡張)
   - [ ] `supabase/migrations/20261001001400_aim_daily.sql`(今日の文字の表と関数。※ dev では 1400 のあとに、関数の中身が最終の 1400 と同じ dev 専用の記録 `aim_daily_ranking_names` を別に適用した。本番は 1300 と 1400 のファイルだけでよい)
   - [ ] `supabase/migrations/20261001001500_card_locks.sql`(運営の公開禁止の印を別の表 `card_locks` にも残し、本人が設定を消して作り直しても、退会して同じ Discord で登録し直しても印が戻るようにする。Discord ID 単位の `card_locked_discord_ids` も作る。1200 のあと)
   - [ ] `supabase/migrations/20261001001600_profile_text_hardening.sql`(ロビーのニックネーム・自己紹介で制御文字・向きを変える文字(U+202E など)を弾く。**BAN 一覧にある Discord ID のアカウントの status を一回だけ banned にそろえる処理も入っている**(0800 のトリガーは、そのあとの BAN の追加でしか動かないため)。何度流しても同じ結果になる)
   - [ ] `supabase/migrations/20261001001700_report_review.sql`(通報しても相手をすぐには利用停止にせず、運営の確認待ちにする。自動で止めるのは「年齢詐称」の通報だけ。通報した人が相手をブロックするのはこれまでどおり。**適用したら、毎日の通報の確認で運営が止める必要がある**(`docs/ops/moderation.md`))
   - [ ] **0800/0900(と 1600)を適用したあと、今あるプロフィールが新しい検証に通るかを洗い出す**。次を SQL エディタで一度に実行し、出てきた行(id とエラー)を確かめる。0 行なら問題なし。行があれば、本人に直してもらうか運営が `nickname` / `bio` などを直す(残すと、その人は次のプロフィール更新で `INVALID_INPUT` / `NG_WORD` になる)
     ```sql
     create temp table if not exists profile_input_check (id uuid, error text);
     truncate profile_input_check;
     do $$
     declare r record;
     begin
       for r in select id, nickname, bio, type_code, games, time_slots, platforms, axes from public.profiles loop
         begin
           perform public._validate_profile_input(r.nickname, r.bio, r.type_code, r.games, r.time_slots, r.platforms, r.axes);
         exception when others then
           insert into profile_input_check values (r.id, sqlerrm);
         end;
       end loop;
     end $$;
     select * from profile_input_check;
     ```
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
3. **`feat/polish-1` を `master` にマージする**(`feat/v0.1-part2` → `feat/my-settings` → `feat/aim-daily` → `feat/mouse-finder` → `feat/pro-settings` → `feat/polish-1` と積み重なっているので、これ 1 つで全部入る)→ Vercel が自動で本番に反映する(環境変数もこのとき埋め込まれる)
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
   - [ ] (データが入ったら)プロ設定:規約の問い合わせ先が埋まっている(/pros の「掲載を外す依頼」の先)/tests/data/pros.test.ts が通る/載せる選手と数字の一覧(src/data/pros.ts)/近いプロの手応え/スマホで崩れない
   - [ ] マイ設定(ログイン後):新しい端末でログインすると、入力欄にサーバーの設定が表示される/「設定を消す」で消え、再読み込みしても戻らない/公開前に入力を変えてすぐ公開しても、公開カードに最新の内容が出る
5. X で告知する

## 公開後すぐ

- 通報の確認を毎日1回(`docs/ops/moderation.md`)
- Vercel と Supabase のエラーログを数日見守る

## 楽天の画像を更新するとき(本人の PC で。月 1 回くらい)

楽天アプリの許可 IP が家の IPv4 だけなので、Vercel ではなく本人の PC で動かす。キーは `.env.local` の `RAKUTEN_APPLICATION_ID` と `RAKUTEN_ACCESS_KEY`。

1. `node --dns-result-order=ipv4first scripts/rakuten-mice.mjs --config "<楽天ROOM 自動化フォルダの config.json のパス>"`(キーはその場で読むだけで、どこにも書き写さない)。`.env.local` にキーを入れた場合は `node --env-file=.env.local --dns-result-order=ipv4first scripts/rakuten-mice.mjs`
2. `docs/content/rakuten-mice-review.md` を開き、マウスごとに選ばれた商品・画像が合っているか目で確かめる(違うものは `src/data/mice-rakuten.ts` から消す)
3. コミットする(`src/data/mice-rakuten.ts` と `docs/content/rakuten-mice-review.md`)

## dev と本番の migration の違い

dev の DB には、リポジトリにない dev 専用の migration の記録がある(`aim_daily_ranking_names`、名前で適用した `card_locks` / `aim_ranking_lazy_filter` / `my_settings_v2_shape_check`、`aim_chars_mixed_difficulty`、`aim_chars_replace_53`、`card_locks_discord_carryover`)。dev で `db push` や差分の比較をしても、これらは本番とは関係ない。**本番には `supabase/migrations/` の 0500〜1700 のファイルだけを適用する**(1400 は 5〜14 画・60 字の版に直してあるので、そのまま新規に適用すればよい)。

# 公開当日の手順(v0.1 マッチング込み)

上から順に進める。チェックが付かない項目があれば、公開を止めて相談する。

## 前日までに(本人)

- [ ] `content/legal/terms.md` と `content/legal/privacy.md` の【公開前に本人が記入】(お問い合わせ先)を埋める
- [ ] Discord アプリを作り、本番 Supabase(`robilab`)の Discord ログインを設定する
- [ ] Supabase Auth の「Redirect URLs」を、本番の `https://<本番ドメイン>/auth/callback` だけにする(dev 用は dev プロジェクト側に)
- [ ] Vercel の本番の環境変数を設定する
  - `NEXT_PUBLIC_SUPABASE_URL=https://bncjzilfehkjftzraajd.supabase.co`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY=`(本番の publishable key)
- [ ] 本番の NG ワード初期リストを確認する(`docs/ops/moderation.md` の「公開前の準備」)

## 当日

1. **セキュリティゲート**:マージする内容で security-audit を実行し、confirmed の critical / high が 0 件であることを確認する(`public-web-security-gate` スキル)
2. **本番 DB に未適用の migration を、番号順に適用する**(dev には適用済み)
   - [ ] `supabase/migrations/20261001000500_discord_link.sql`(成立相手の Discord プロフィールリンク)
   - [ ] `supabase/migrations/20261001000600_rejoin_guard.sql`(退会・再登録の悪用対策)
   - [ ] `supabase/migrations/20261001000700_perf.sql`(インデックスと RLS ポリシーの性能改善)
   - [ ] `supabase/migrations/20261001000800_hardening3.sql`(選択肢の検証、NG ワードのすり抜け対策、同時声かけ、BAN の状態同期)
   - 以降に追加した migration があれば、それも。dev と本番の `list_migrations` を見比べて、差がないことを確認する
3. `feat/v0.1-part2` を `master` にマージする → Vercel が自動で本番に反映する
4. 本番で動作確認(Claude はブラウザで、本人はスマホで)
   - [ ] 診断 → 結果 → X シェア
   - [ ] Discord ログイン → 登録 → ロビー表示(X のアプリ内ブラウザでも)
   - [ ] 声かけ → 相互 OK → Discord プロフィールリンクが開く(テスト用アカウント2つで)
   - [ ] 退会 → 7日間は再登録できないことの表示
   - [ ] 通知ベルの未読数が出て、通知ページを開くと 0 になる(既読化をサーバーアクションに移したため)
   - [ ] 診断してから登録画面を開くと、タイプが自動で入る(読み込み方を変えたため)
5. X で告知する

## 公開後すぐ

- 通報の確認を毎日1回(`docs/ops/moderation.md`)
- Vercel と Supabase のエラーログを数日見守る

# 通報の確認と BAN の手順(運営用)

## 毎日やること(1日1回、5分)

1. [Supabase Dashboard](https://supabase.com/dashboard/project/bncjzilfehkjftzraajd/sql/new) にアクセスする
2. SQL エディタで「よく使う確認用 SQL」の「open の通報を一覧表示」を実行する
3. 各通報について `nickname` と `detail` を確認する
4. 対象ユーザーのプロフィールを確認し、判断する

## 判断

### ケース1: 問題なし(嫌がらせ目的の通報など)

相手を閉じ込める必要がないと判断した場合:

1. SQL エディタで以下を実行する:
   ```sql
   update profiles set status = 'active' where id = '<target_id>';
   ```
2. その次に以下を実行する:
   ```sql
   update reports set status = 'closed' where target_id = '<target_id>';
   ```

**注意:** 同じ人が嫌がらせ目的の通報を繰り返す場合は、その通報者(reporter_id)の status を「suspended」にする:

```sql
update profiles set status = 'suspended' where id = '<reporter_id>';
```

### ケース2: BAN する(年齢詐称、出会い目的、迷惑行為など)

**パターン A: 対象ユーザーがまだ登録済みの場合**

1. SQL エディタで以下を実行する:
   ```sql
   update profiles set status = 'banned' where id = '<target_id>';
   ```
2. その次に以下を実行する:
   ```sql
   insert into banned_discord_ids (discord_user_id, note)
     select discord_user_id, '<理由>'
     from private_info
     where user_id = '<target_id>';
   ```
3. その次に以下を実行する:
   ```sql
   update reports set status = 'closed' where target_id = '<target_id>';
   ```

**パターン B: 対象ユーザーがすでに削除されている場合（target_id が NULL の場合）**

1. SQL エディタで以下を実行する:
   ```sql
   insert into banned_discord_ids (discord_user_id, note)
     values ('<target_discord_id から reports で確認>', '<理由>');
   ```
2. その次に以下を実行する:
   ```sql
   update reports set status = 'closed' where target_discord_id = '<target_discord_id>';
   ```

## 未成年が関わる通報

1. **最優先で確認する** — この通報は他の確認よりも優先度が高い
2. 相手のプロフィール(年齢、自己紹介など)から年齢詐称が確かかどうかを判断する
3. 年齢詐称が確かなら、**その日のうちに BAN する** — 上記「ケース2」の手順に従う
4. 特に出会い目的や援助交際の疑いがある場合は、詳細の記録を残し、必要に応じて法務に報告する

## NG ワードの追加

新しい禁止ワードを追加する場合:

1. SQL エディタで以下を実行する:
   ```sql
   insert into ng_words (word) values ('<言葉>') on conflict do nothing;
   ```

例:
```sql
insert into ng_words (word) values ('出会い目的') on conflict do nothing;
insert into ng_words (word) values ('援助') on conflict do nothing;
```

## よく使う確認用 SQL

### open の通報を一覧表示(新しい順)

最新の通報から順に表示し、通報の理由・詳細・対象者のニックネームを確認できます:

```sql
select
  r.id,
  r.created_at,
  r.reason,
  r.detail,
  p.nickname as target_nickname,
  r.target_discord_id,
  r.target_id
from public.reports r
left join public.profiles p on r.target_id = p.id
where r.status = 'open'
order by r.created_at desc;
```

### 特定のユーザーの通報状況を確認

`<user_id>` を該当ユーザーの UUID に置き換えて実行:

```sql
select id, created_at, reason, detail, status
from public.reports
where target_id = '<user_id>'
order by created_at desc;
```

### 特定の通報者の報告数を確認(本日)

1日の報告上限(5件)に達しているか確認:

```sql
select
  reporter_id,
  count(*) as report_count
from public.reports
where reporter_id = '<reporter_id>'
  and created_at >= public.jst_day_start(now())
group by reporter_id;
```

### suspended 状態のユーザーを確認

一時停止中のユーザーが誰かを確認:

```sql
select id, nickname, created_at, updated_at
from public.profiles
where status = 'suspended'
order by updated_at desc;
```

### 削除されたアカウントの BAN Discord ID を確認

削除済みユーザーがすでに BAN されているか確認:

```sql
select discord_user_id, note, created_at
from public.banned_discord_ids
order by created_at desc
limit 20;
```

## 重要な制約事項

### 退会できない条件

以下の条件いずれかに該当するユーザーは、その状態では退会(delete_me)できません:

- プロフィールの status が「active」以外(suspended, banned など)
- open 状態の通報(reports where status = 'open')がある

例: 通報されて suspended 状態のユーザーは、通報が closed になり status が active に戻るまで退会できません。

### 通報の上限制限

各ユーザーは **1日(JST)あたり最大 5 件** まで通報できます。上限に達すると REPORT_LIMIT エラーになります。

### 通報直後の自動停止

1つの通報が入ると、対象ユーザーは自動的に suspended 状態になり、ロビー画面から見えなくなります。運営が判断してアクティブ化(active)または BAN(banned)するまで、その状態が続きます。

---

**最終確認日:** 2026-09-28  
**ドキュメント作成者:** ops team

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

通報者が退会していて reporter_id が NULL の場合も、`reporter_discord_id` が残っている。その Discord アカウントを BAN すれば再登録を防げる:

```sql
insert into banned_discord_ids (discord_user_id, note)
  values ('<reporter_discord_id>', '嫌がらせ目的の通報');
```

※ 退会した Discord ID は `left_discord_ids` に記録され、退会から7日間は再登録できない。退会された人へのブロックは `carried_blocks` に引き継がれ、再登録時に自動で戻る。

**報復通報の確認:** 通報された人(target)が、通報した人(reporter)を先にブロックしていないかを確認する:

```sql
select * from blocks where blocker_id = '<target_id>' and blocked_id = '<reporter_id>';
```

先にブロックされていた場合は、報復通報の可能性があります。

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

※ `banned_discord_ids` に追加すると、その Discord のアカウントは自動で `status = 'banned'` になる(パターン A の手順1は、念のための二重の操作)。

### BAN を解除する(誤 BAN だった場合など)

`banned_discord_ids` から消しても、アカウントの status は自動では戻らない。次の2つを両方行う:

```sql
delete from banned_discord_ids where discord_user_id = '<discord_user_id>';
update profiles set status = 'active'
  where id = (select user_id from private_info where discord_user_id = '<discord_user_id>');
```

## 未成年が関わる通報

1. **最優先で確認する** — この通報は他の確認よりも優先度が高い
2. プロフィールには年齢が表示されないため、`private_info.birthdate` を確認する:
   ```sql
   select birthdate from private_info where user_id = '<target_id>';
   ```
3. 年齢詐称が確かなら、**その日のうちに BAN する** — 上記「ケース2」の手順に従う
4. 特に出会い目的や援助交際の疑いがある場合は、詳細の記録を残し、必要に応じて警察や相談窓口に相談する

## 公開前の準備: 本番の NG ワード初期リスト

連絡先の直接交換で相互 OK を迂回されるのを防ぐため、以下の言葉を最初の NG ワードとして入れています(controller が投入済み):

- `discord.gg`
- `discord.com/invite`
- `http`
- `line.me`
- `@gmail`
- `@icloud`
- `LINE交換`
- `ID交換`

追加したい言葉がある場合は、下記「NG ワードの追加」の手順で追加してください。

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

## 問題のある名刺カードを非公開にする

公開 URL(`/c/<slug>`)の内容に問題がある場合は、SQL エディタで次を実行する。URL はすぐに使えなくなり、本人は公開し直せなくなる(マイ設定の保存はできる)。

```sql
update my_settings set card_locked = true, public_slug = null where public_slug = '<slug>';
```

公開禁止の印は `card_locks` にも自動で記録される(そのときの Discord ID も `card_locks.discord_user_id` に残る)。本人が「設定を消す」で行を消して保存し直しても、新しい行にまた印が付く。

本人が退会(`delete_me`)すると `card_locks` の行は消えるが、その直前に Discord ID が `card_locked_discord_ids` に移る。同じ Discord で登録し直してマイ設定を保存すると、新しい行にまた印が付く(BAN・退会の記録と同じく、印は Discord ID でも残る)。

公開禁止を解く場合は `update my_settings set card_locked = false where user_id = '<user_id>';`(`card_locks` と、その人の Discord ID の `card_locked_discord_ids` の記録も自動で消える。本人がもう一度公開をオンにすると、新しい URL で公開される)。

マイ設定の行がない人(設定を消したあと、まだ保存していない人など)に印を付ける場合は、次を実行する。次に保存したときから公開禁止になる(Discord ID は自動で記録される)。

```sql
insert into card_locks (user_id) values ('<user_id>') on conflict do nothing;
```

いまアカウントがない Discord ID(退会済みの人など)に印を付ける場合は、次を実行する。その Discord で登録してマイ設定を保存したときから公開禁止になる。

```sql
insert into card_locked_discord_ids (discord_user_id) values ('<discord_user_id>') on conflict do nothing;
```

その人の行がまだなく、印だけ外す場合は、両方の記録を消す。

```sql
delete from card_locks where user_id = '<user_id>';
delete from card_locked_discord_ids where discord_user_id = '<discord_user_id>';
```

いま付いている印の一覧は `select * from card_locks;` と `select * from card_locked_discord_ids;` で見られる。

注意:
- SQL エディタ・service_role・ダッシュボードなど、`auth.uid()` が null になる操作はすべて「運営の操作」とみなされる。運営が `card_locks` の行を消しても、Discord ID の記録には移らない。
- 運営がダッシュボードで公開禁止の人のアカウントを消す場合も、印は Discord ID に移らない。消したあとも印を残したいときは、先に `insert into card_locked_discord_ids (discord_user_id) select discord_user_id from card_locks where user_id = '<user_id>' on conflict do nothing;` を実行する。

※ ロビーで利用停止(suspended)・BAN(banned、または BAN 一覧の Discord)になった人は、自動でマイ設定の保存・名刺の公開ができなくなり、公開中の名刺も表示されなくなる。停止を解除すれば、公開中だった名刺はまた表示される。

内容そのものを消す場合は、`delete from my_settings where public_slug = '<slug>';` を使う(公開禁止の印を付けていれば、`card_locks` の記録は残る)。

## 今日の文字のランキング

不自然な記録(明らかに人間に無理な点数など)を消す場合:

```sql
delete from aim_scores where play_date = '<日付>' and user_id = '<user_id>';
```

利用停止・BAN 中の人は、ランキングに自動で表示されない。ランキングの名前は、名刺を公開している人だけ表示される。表示名に問題がある場合は、名刺と同じく `card_locked = true` にすると「名無しのゲーマー」になる。名刺を非公開にするだけでも名前は隠れ、「名無しのゲーマー」になる。

## プロ設定の掲載

- 掲載を外してほしい依頼が来たら、本人(またはチーム)からの連絡であることを確かめ、`src/data/pros.ts` のその選手の行を消して公開し直す。
- 数字の間違いの指摘は、一次情報(本人の投稿・配信・チームのページ)で確かめてから直し、`checkedAt` を更新する。
- まとめサイトの数字は出典にしない。

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
  reporter_discord_id,
  count(*) as report_count
from public.reports
where reporter_discord_id = '<reporter_discord_id>'
  and created_at >= public.jst_day_start(now())
group by reporter_discord_id;
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
**ドキュメント作成者:** 運営(1人)

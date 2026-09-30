-- 運営の「公開禁止」の印を、マイ設定の行とは別に残す(監査 run-4 の 6.1、run-8 の card_locks 退会リセット)
--   card_locked は本人のマイ設定の行にあるため、本人が delete_my_settings で行を消して保存し直すと、
--   印のない新しい行ができてしまっていた。印を card_locks にも記録し、行を作り直しても印が戻るようにする。
--   さらに card_locks は auth uid に結びつくので、退会(delete_me)→ 同じ Discord で再登録すると印が消えていた。
--   BAN・退会の記録と同じく、変わらない Discord ID でも印を残す(card_locked_discord_ids)。
--   ・運営が card_locked = true にすると、card_locks に記録される(そのときの Discord ID も一緒に)
--   ・本人が退会して card_locks の行が消えるとき、Discord ID を card_locked_discord_ids に移す
--   ・新しい行を作るとき、card_locks か card_locked_discord_ids に記録があれば印を付ける
--   ・運営が card_locked = false にすると(SQL エディタ、auth.uid() が null)、両方の記録から消える
--   ・マイ設定の行がない人は、insert into card_locks (user_id) values ('<id>') で印を付けられる
--   ・アカウントがない Discord ID は、insert into card_locked_discord_ids (discord_user_id) values ('<id>') で印を付けられる
--
-- 注意:このファイルのトリガーは「auth.uid() が null = 運営の操作」とみなす。
--   SQL エディタ・service_role・ダッシュボードからのユーザー削除など、auth.uid() が null になる文脈はすべて運営扱いになる
--   (本人向けの RPC は必ず auth.uid() が入る)。auth.uid() が null の文脈を本人に開く関数を作るときは、ここも見直すこと。

create table if not exists public.card_locks (
  user_id uuid primary key references auth.users (id) on delete cascade,
  locked_at timestamptz not null default now()
);
alter table public.card_locks add column if not exists discord_user_id text;
alter table public.card_locks enable row level security;
-- ポリシーは作らない(運営が SQL エディタで扱うだけ)
revoke all on table public.card_locks from anon, authenticated;

-- 退会しても残す、Discord ID 単位の公開禁止の印(運営だけ。直接の読み書きは不可)
create table if not exists public.card_locked_discord_ids (
  discord_user_id text primary key,
  locked_at timestamptz not null default now()
);
alter table public.card_locked_discord_ids enable row level security;
-- ポリシーは作らない
revoke all on table public.card_locked_discord_ids from anon, authenticated;

-- その人の Discord ID(_my_settings_block_reason と同じ探し方:private_info、なければ Discord のログイン情報)
create or replace function public._discord_id_of(p_uid uuid) returns text
language sql stable security definer set search_path = public, auth as $$
  select coalesce(
    (select discord_user_id from public.private_info where user_id = p_uid),
    (select coalesce(i.identity_data ->> 'provider_id', i.identity_data ->> 'sub')
       from auth.identities i
      where i.user_id = p_uid and i.provider = 'discord'
      order by i.created_at
      limit 1))
$$;
revoke all on function public._discord_id_of from public, anon, authenticated;

-- card_locks に記録するとき、Discord ID も一緒に残す(退会でログイン情報が消えても分かるように)
create or replace function public._card_locks_fill_discord_id() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  new.discord_user_id := coalesce(new.discord_user_id, public._discord_id_of(new.user_id));
  return new;
end $$;
revoke all on function public._card_locks_fill_discord_id from public, anon, authenticated;

drop trigger if exists card_locks_fill_discord_id on public.card_locks;
create trigger card_locks_fill_discord_id
before insert on public.card_locks
for each row execute function public._card_locks_fill_discord_id();

-- 本人の退会(delete_me → auth.users の削除 → card_locks の連鎖削除)で行が消えるとき、Discord ID で印を残す。
-- auth.uid() が null(運営が印を外す・運営がユーザーを消す)のときは残さない。
create or replace function public._card_locks_keep_by_discord() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_discord_id text;
begin
  if auth.uid() is not null then
    v_discord_id := coalesce(old.discord_user_id, public._discord_id_of(old.user_id));
    if v_discord_id is not null then
      insert into public.card_locked_discord_ids (discord_user_id) values (v_discord_id)
        on conflict (discord_user_id) do nothing;
    end if;
  end if;
  return old;
end $$;
revoke all on function public._card_locks_keep_by_discord from public, anon, authenticated;

drop trigger if exists card_locks_keep_by_discord on public.card_locks;
create trigger card_locks_keep_by_discord
before delete on public.card_locks
for each row execute function public._card_locks_keep_by_discord();

-- 行を作るとき、card_locks か card_locked_discord_ids に記録があれば公開禁止の印を付ける
create or replace function public._my_settings_apply_card_lock() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if exists (select 1 from public.card_locks where user_id = new.user_id)
     or exists (select 1 from public.card_locked_discord_ids
                where discord_user_id = public._discord_id_of(new.user_id)) then
    new.card_locked := true;
  end if;
  return new;
end $$;
revoke all on function public._my_settings_apply_card_lock from public, anon, authenticated;

-- 注意:同じタイミング(BEFORE INSERT)のトリガーは、名前のアルファベット順に動く。
-- 印を付けてから my_settings_guard(公開禁止なら公開を止める)が見るように、
-- 名前を my_settings_a_lock にして my_settings_guard より先に動かす。名前を変えるときは順番に気をつけること。
drop trigger if exists my_settings_a_lock on public.my_settings;
create trigger my_settings_a_lock
before insert on public.my_settings
for each row execute function public._my_settings_apply_card_lock();

-- card_locked の変更を card_locks に写す(AFTER なので、Discord ID で付いた印もここで card_locks に入る)。
-- 本人は card_locked を変えられない(my_settings_guard が止める)ので、false にするのは運営だけ。
-- 運営が外すときは、Discord ID の記録も消す。
create or replace function public._my_settings_sync_card_lock() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_old_discord_id text;
begin
  if new.card_locked then
    insert into public.card_locks (user_id) values (new.user_id) on conflict (user_id) do nothing;
  elsif auth.uid() is null then
    delete from public.card_locks where user_id = new.user_id returning discord_user_id into v_old_discord_id;
    delete from public.card_locked_discord_ids
      where discord_user_id in (v_old_discord_id, public._discord_id_of(new.user_id));
  end if;
  return null;
end $$;
revoke all on function public._my_settings_sync_card_lock from public, anon, authenticated;

drop trigger if exists my_settings_card_lock_sync on public.my_settings;
create trigger my_settings_card_lock_sync
after insert or update of card_locked on public.my_settings
for each row execute function public._my_settings_sync_card_lock();

-- いま公開禁止の人を記録する
insert into public.card_locks (user_id)
  select user_id from public.my_settings where card_locked
on conflict (user_id) do nothing;

-- すでにある記録に Discord ID を入れる
update public.card_locks set discord_user_id = public._discord_id_of(user_id)
  where discord_user_id is null;

-- 運営の「公開禁止」の印を、マイ設定の行とは別に残す(監査 run-4 の 6.1)
--   card_locked は本人のマイ設定の行にあるため、本人が delete_my_settings で行を消して保存し直すと、
--   印のない新しい行ができてしまっていた。印を card_locks にも記録し、行を作り直しても印が戻るようにする。
--   ・運営が card_locked = true にすると、card_locks に記録される
--   ・運営が card_locked = false にすると(SQL エディタ、auth.uid() が null)、card_locks からも消える
--   ・マイ設定の行がない人は、insert into card_locks (user_id) values ('<id>') で印を付けられる

create table if not exists public.card_locks (
  user_id uuid primary key references auth.users (id) on delete cascade,
  locked_at timestamptz not null default now()
);
alter table public.card_locks enable row level security;
-- ポリシーは作らない(運営が SQL エディタで扱うだけ)
revoke all on table public.card_locks from anon, authenticated;

-- 行を作るとき、card_locks に記録があれば公開禁止の印を付ける
create or replace function public._my_settings_apply_card_lock() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if exists (select 1 from public.card_locks where user_id = new.user_id) then
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

-- card_locked の変更を card_locks に写す。
-- 本人は card_locked を変えられない(my_settings_guard が止める)ので、false にするのは運営だけ。
create or replace function public._my_settings_sync_card_lock() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.card_locked then
    insert into public.card_locks (user_id) values (new.user_id) on conflict (user_id) do nothing;
  elsif auth.uid() is null then
    delete from public.card_locks where user_id = new.user_id;
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

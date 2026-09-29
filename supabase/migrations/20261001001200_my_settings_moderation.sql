-- マイ設定の名刺と、ロビーの利用停止・BAN をつなぐ(監査 run-3 の強化メモ)
--   1. 利用停止中(suspended)・BAN 中(banned、または BAN 一覧の Discord)の人は、マイ設定の保存と名刺の公開ができない
--      (公開をやめること・設定を消すことはいつでもできる)
--   2. そういう人の名刺は、公開ページで表示しない(停止が解除されれば、また表示される)
--   3. 運営が付ける「公開禁止」の印 card_locked。付いていると本人は公開し直せない

alter table public.my_settings add column if not exists card_locked boolean not null default false;

-- 保存・公開を止める理由(止めないなら null)
create or replace function public._my_settings_block_reason(p_uid uuid) returns text
language sql stable security definer set search_path = public, auth as $$
  select case
    when exists (select 1 from public.profiles where id = p_uid and status = 'banned') then 'BANNED'
    when exists (select 1 from public.private_info pi join public.banned_discord_ids b on b.discord_user_id = pi.discord_user_id
                 where pi.user_id = p_uid) then 'BANNED'
    when exists (select 1 from auth.identities i join public.banned_discord_ids b
                   on b.discord_user_id = coalesce(i.identity_data ->> 'provider_id', i.identity_data ->> 'sub')
                 where i.user_id = p_uid and i.provider = 'discord') then 'BANNED'
    when exists (select 1 from public.profiles where id = p_uid and status = 'suspended') then 'NOT_ACTIVE'
    else null
  end
$$;
revoke all on function public._my_settings_block_reason from public, anon, authenticated;

-- my_settings への書き込み(本人の RPC 経由)を見張る。
-- 運営が SQL エディタで直接変える場合(auth.uid() が null)は止めない。
create or replace function public._my_settings_guard() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_reason text;
begin
  if auth.uid() is null then return new; end if;
  -- 公開をやめるだけ(中身は同じ)の変更は、いつでも通す
  if tg_op = 'UPDATE' and new.public_slug is null and new.data = old.data and new.card_locked = old.card_locked then
    return new;
  end if;
  -- 本人は公開禁止の印を変えられない
  if tg_op = 'UPDATE' and new.card_locked is distinct from old.card_locked then raise exception 'INVALID_INPUT'; end if;
  v_reason := public._my_settings_block_reason(new.user_id);
  if v_reason is not null then raise exception '%', v_reason; end if;
  if new.public_slug is not null and new.card_locked then raise exception 'CARD_LOCKED'; end if;
  return new;
end $$;
revoke all on function public._my_settings_guard from public, anon, authenticated;

drop trigger if exists my_settings_guard on public.my_settings;
create trigger my_settings_guard
before insert or update on public.my_settings
for each row execute function public._my_settings_guard();

-- 公開カード:公開禁止・利用停止・BAN の人は返さない
create or replace function public.get_public_card(p_slug text) returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'typeCode', data -> 'typeCode',
    'cardName', data -> 'cardName',
    'dpi', data -> 'dpi',
    'mainGame', data -> 'mainGame',
    'mainSens', coalesce(data -> 'sens' -> (data ->> 'mainGame'), 'null'::jsonb),
    'grip', data -> 'hand' -> 'grip',
    'devices', data -> 'devices',
    'favoriteGames', data -> 'favoriteGames')
  from public.my_settings
  where p_slug ~ '^[A-Za-z0-9]{10}$' and public_slug = p_slug
    and not card_locked
    and public._my_settings_block_reason(user_id) is null
$$;
revoke all on function public.get_public_card from public;
grant execute on function public.get_public_card to anon, authenticated;

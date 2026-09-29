-- 退会 → 同じ Discord で再登録、で安全のための状態がリセットされる問題を防ぐ(監査 run-1 の未確定事項)。
-- auth uid は退会で消えるので、悪用対策は変わらない Discord ID に結びつける。
--   1. 退会後7日間は、同じ Discord アカウントで再登録できない(声かけの上限・パスの秘匿期間のリセットを防ぐ)
--   2. 通報の上限と証跡を、通報者の Discord ID でも数える・残す
--   3. 相手からのブロックは、退会しても Discord ID で引き継ぎ、再登録時に復元する

-- === 1. 退会した Discord ID(運営だけ。直接の読み書きは不可) ===
create table if not exists public.left_discord_ids (
  discord_user_id text primary key,
  left_at timestamptz not null default now()
);
alter table public.left_discord_ids enable row level security;

-- === 2. 通報者の Discord ID を証跡として残す ===
alter table public.reports add column if not exists reporter_discord_id text;
update public.reports r set reporter_discord_id = pi.discord_user_id
  from public.private_info pi where pi.user_id = r.reporter_id and r.reporter_discord_id is null;
create index if not exists reports_reporter_discord_created on public.reports (reporter_discord_id, created_at);

-- === 3. 退会した人へのブロックを引き継ぐ(運営だけ。ブロックした側が退会したら消える) ===
create table if not exists public.carried_blocks (
  blocker_id uuid not null references public.profiles (id) on delete cascade,
  blocked_discord_id text not null,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_discord_id)
);
alter table public.carried_blocks enable row level security;

-- === _register_profile: 退会直後の再登録を拒否し、引き継いだブロックを復元する ===
create or replace function public._register_profile(
  p_uid uuid, p_discord_id text, p_discord_name text, p_birthdate date,
  p_nickname text, p_type_code text, p_axes jsonb, p_games jsonb, p_platforms text[],
  p_voice_ok boolean, p_time_slots text[], p_bio text
) returns void language plpgsql security definer set search_path = public as $$
declare
  v_age int := public._age_on(p_birthdate, public._jst_today());
begin
  if exists (select 1 from public.banned_discord_ids where discord_user_id = p_discord_id) then raise exception 'BANNED'; end if;
  if exists (select 1 from public.left_discord_ids
             where discord_user_id = p_discord_id and left_at > now() - interval '7 days') then
    raise exception 'REJOIN_COOLDOWN';
  end if;
  if exists (select 1 from public.profiles where id = p_uid) then raise exception 'ALREADY_REGISTERED'; end if;
  if p_birthdate > public._jst_today() or v_age > 120 then raise exception 'INVALID_INPUT'; end if;
  if v_age < 18 then raise exception 'UNDER_AGE'; end if;
  perform public._validate_profile_input(p_nickname, p_bio, p_type_code, p_games, p_time_slots, p_platforms, p_axes);
  insert into public.private_info (user_id, discord_user_id, discord_username, birthdate)
    values (p_uid, p_discord_id, p_discord_name, p_birthdate);
  insert into public.profiles (id, nickname, type_code, axes, games, platforms, voice_ok, time_slots, bio, age_group)
    values (p_uid, trim(p_nickname), p_type_code, p_axes, p_games, coalesce(p_platforms, '{}'), coalesce(p_voice_ok, false), p_time_slots, coalesce(p_bio, ''), 'adult');
  insert into public.blocks (blocker_id, blocked_id)
    select blocker_id, p_uid from public.carried_blocks where blocked_discord_id = p_discord_id
    on conflict do nothing;
  delete from public.carried_blocks where blocked_discord_id = p_discord_id;
  delete from public.left_discord_ids where discord_user_id = p_discord_id;
end $$;
revoke all on function public._register_profile from public, anon, authenticated;

-- === report_user: 上限・重複・ロックを通報者の Discord ID 単位にする ===
create or replace function public.report_user(p_id uuid, p_reason public.report_reason, p_detail text) returns void
language plpgsql security definer set search_path = public as $$
declare
  v_me_discord_id text;
  v_target_discord_id text;
begin
  if auth.uid() is null then raise exception 'NOT_LOGGED_IN'; end if;
  if not exists (select 1 from public.profiles where id = auth.uid() and status = 'active') then raise exception 'NOT_ACTIVE'; end if;
  select discord_user_id into v_me_discord_id from public.private_info where user_id = auth.uid();
  if v_me_discord_id is null then raise exception 'NOT_ACTIVE'; end if;
  perform pg_advisory_xact_lock(hashtext('report:' || v_me_discord_id));
  if p_id = auth.uid() or not exists (select 1 from public.profiles where id = p_id) then raise exception 'NOT_FOUND'; end if;
  select discord_user_id into v_target_discord_id from public.private_info where user_id = p_id;
  -- すでに通報済みなら、対象が停止されて _visible が false になっていても ALREADY_REPORTED を返す
  -- (退会・再登録をはさんでも、同じ Discord 同士なら通報済みとみなす)
  if exists (select 1 from public.reports where reporter_id = auth.uid() and target_id = p_id)
     or exists (select 1 from public.reports
                where reporter_discord_id = v_me_discord_id and target_discord_id = v_target_discord_id) then
    raise exception 'ALREADY_REPORTED';
  end if;
  if not (
    public._visible(auth.uid(), p_id)
    or exists (
      select 1 from public.approaches
      where (from_id = auth.uid() and to_id = p_id) or (from_id = p_id and to_id = auth.uid())
    )
  ) then
    raise exception 'NOT_FOUND';
  end if;
  if char_length(coalesce(p_detail, '')) > 200 then raise exception 'INVALID_INPUT'; end if;
  if (select count(*) from public.reports
      where (reporter_discord_id = v_me_discord_id or reporter_id = auth.uid())
        and created_at >= public.jst_day_start(now())) >= 5 then
    raise exception 'REPORT_LIMIT';
  end if;
  insert into public.reports (reporter_id, reporter_discord_id, target_id, target_discord_id, reason, detail)
    values (auth.uid(), v_me_discord_id, p_id, v_target_discord_id, p_reason, coalesce(p_detail, ''));
  update public.profiles set status = 'suspended' where id = p_id and status = 'active';
  perform public.block_user(p_id);
exception
  when unique_violation then raise exception 'ALREADY_REPORTED';
end $$;

-- === delete_me: 退会の記録を残し、相手からのブロックを引き継ぐ ===
create or replace function public.delete_me() returns void
language plpgsql security definer set search_path = public, auth as $$
declare
  v_discord_id text;
begin
  if auth.uid() is null then raise exception 'NOT_LOGGED_IN'; end if;
  -- 同時に届いた通報と競合しないよう、自分の行をロックしてから確認する
  perform 1 from public.profiles where id = auth.uid() for update;
  if exists (select 1 from public.profiles where id = auth.uid() and status <> 'active')
     or exists (select 1 from public.reports where target_id = auth.uid() and status = 'open') then
    raise exception 'NOT_ACTIVE';
  end if;
  select discord_user_id into v_discord_id from public.private_info where user_id = auth.uid();
  if v_discord_id is not null then
    insert into public.left_discord_ids (discord_user_id, left_at) values (v_discord_id, now())
      on conflict (discord_user_id) do update set left_at = excluded.left_at;
    insert into public.carried_blocks (blocker_id, blocked_discord_id)
      select blocker_id, v_discord_id from public.blocks where blocked_id = auth.uid()
      on conflict do nothing;
  end if;
  delete from auth.users where id = auth.uid();
end $$;

revoke all on function public.report_user, public.delete_me from public, anon;
grant execute on function public.report_user, public.delete_me to authenticated;

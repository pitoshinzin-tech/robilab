-- Fix round 3: 通報の上限の競合、入力検証の抜け(NULL・余分なキー)、
-- NGワードの正規化順序、reporter_id の削除時の扱い

-- === reports: 通報した本人が退会しても証跡(通報自体)を残す ===
alter table public.reports alter column reporter_id drop not null;
alter table public.reports drop constraint reports_reporter_id_fkey;
alter table public.reports add constraint reports_reporter_id_fkey
  foreign key (reporter_id) references public.profiles (id) on delete set null;
-- unique (reporter_id, target_id) はそのまま維持する

-- === _has_ng_word: 先に NFKC 正規化してから小文字化する ===
create or replace function public._has_ng_word(p_text text) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.ng_words w
    where position(lower(normalize(w.word, NFKC)) in lower(normalize(p_text, NFKC))) > 0
  )
$$;

-- === _validate_profile_input: NULL 要素・余分なキーを弾く(シグネチャは7引数のまま) ===
create or replace function public._validate_profile_input(
  p_nickname text, p_bio text, p_type_code text, p_games jsonb, p_time_slots text[],
  p_platforms text[], p_axes jsonb
) returns void language plpgsql stable set search_path = public as $$
declare
  v_game jsonb;
begin
  if p_nickname is null or char_length(trim(p_nickname)) = 0 or char_length(p_nickname) > 20 then raise exception 'INVALID_INPUT'; end if;
  if char_length(coalesce(p_bio, '')) > 50 then raise exception 'INVALID_INPUT'; end if;
  if p_type_code is not null and p_type_code !~ '^[AG][RB][CL][HZ]$' then raise exception 'INVALID_INPUT'; end if;
  if jsonb_typeof(p_games) <> 'array' or jsonb_array_length(p_games) = 0 or jsonb_array_length(p_games) > 10 then
    raise exception 'INVALID_INPUT';
  end if;
  for v_game in select * from jsonb_array_elements(p_games) loop
    if jsonb_typeof(v_game) <> 'object' then raise exception 'INVALID_INPUT'; end if;
    if exists (select 1 from jsonb_object_keys(v_game) k where k not in ('id', 'rank')) then raise exception 'INVALID_INPUT'; end if;
    if v_game ->> 'id' is null or v_game ->> 'id' !~ '^[a-z0-9-]{1,32}$' then raise exception 'INVALID_INPUT'; end if;
    if (v_game ? 'rank') and v_game ->> 'rank' is not null and not (v_game ->> 'rank' ~ '^[a-z0-9-]{1,32}$') then
      raise exception 'INVALID_INPUT';
    end if;
  end loop;
  if coalesce(array_length(p_time_slots, 1), 0) = 0 or array_length(p_time_slots, 1) > 10 then raise exception 'INVALID_INPUT'; end if;
  if exists (select 1 from unnest(p_time_slots) s where s is null or s !~ '^[a-z0-9-]{1,32}$') then raise exception 'INVALID_INPUT'; end if;
  if coalesce(array_length(p_platforms, 1), 0) > 10 then raise exception 'INVALID_INPUT'; end if;
  if p_platforms is not null and exists (select 1 from unnest(p_platforms) s where s is null or s !~ '^[a-z0-9-]{1,32}$') then
    raise exception 'INVALID_INPUT';
  end if;
  if p_axes is not null and (jsonb_typeof(p_axes) <> 'object' or pg_column_size(p_axes) > 512) then raise exception 'INVALID_INPUT'; end if;
  if public._has_ng_word(p_nickname || ' ' || coalesce(p_bio, '')) then raise exception 'NG_WORD'; end if;
end $$;
revoke all on function public._validate_profile_input from public, anon, authenticated;

-- === report_user: 同時実行での通報上限の競合を防ぐ ===
create or replace function public.report_user(p_id uuid, p_reason public.report_reason, p_detail text) returns void
language plpgsql security definer set search_path = public as $$
declare
  v_target_discord_id text;
begin
  if auth.uid() is null then raise exception 'NOT_LOGGED_IN'; end if;
  if not exists (select 1 from public.profiles where id = auth.uid() and status = 'active') then raise exception 'NOT_ACTIVE'; end if;
  perform pg_advisory_xact_lock(hashtext('report:' || auth.uid()::text));
  if p_id = auth.uid() or not exists (select 1 from public.profiles where id = p_id) then raise exception 'NOT_FOUND'; end if;
  -- すでに通報済みなら、対象が停止されて _visible が false になっていても ALREADY_REPORTED を返す
  if exists (select 1 from public.reports where reporter_id = auth.uid() and target_id = p_id) then
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
  if (select count(*) from public.reports where reporter_id = auth.uid() and created_at >= public.jst_day_start(now())) >= 5 then
    raise exception 'REPORT_LIMIT';
  end if;
  select discord_user_id into v_target_discord_id from public.private_info where user_id = p_id;
  insert into public.reports (reporter_id, target_id, target_discord_id, reason, detail)
    values (auth.uid(), p_id, v_target_discord_id, p_reason, coalesce(p_detail, ''));
  update public.profiles set status = 'suspended' where id = p_id and status = 'active';
  perform public.block_user(p_id);
exception
  when unique_violation then raise exception 'ALREADY_REPORTED';
end $$;

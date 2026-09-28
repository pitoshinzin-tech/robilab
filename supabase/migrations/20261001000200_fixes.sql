-- Supabase security advisor: function_search_path_mutable
-- 対象の4関数に set search_path = public を追加する(本体は変更しない)

create or replace function public.jst_day_start(p_ts timestamptz)
returns timestamptz language sql immutable set search_path = public as $$
  select (date_trunc('day', p_ts at time zone 'Asia/Tokyo')) at time zone 'Asia/Tokyo'
$$;

create or replace function public._jst_today() returns date
language sql stable set search_path = public as $$
  select (now() at time zone 'Asia/Tokyo')::date
$$;

create or replace function public._age_on(p_birthdate date, p_today date) returns int
language sql immutable set search_path = public as $$
  select extract(year from age(p_today, p_birthdate))::int
$$;

create or replace function public._validate_profile_input(p_nickname text, p_bio text, p_type_code text, p_games jsonb, p_time_slots text[])
returns void language plpgsql stable set search_path = public as $$
begin
  if p_nickname is null or char_length(trim(p_nickname)) = 0 or char_length(p_nickname) > 20 then raise exception 'INVALID_INPUT'; end if;
  if char_length(coalesce(p_bio, '')) > 50 then raise exception 'INVALID_INPUT'; end if;
  if p_type_code is not null and p_type_code !~ '^[AG][RB][CL][HZ]$' then raise exception 'INVALID_INPUT'; end if;
  if jsonb_typeof(p_games) <> 'array' or jsonb_array_length(p_games) = 0 then raise exception 'INVALID_INPUT'; end if;
  if coalesce(array_length(p_time_slots, 1), 0) = 0 then raise exception 'INVALID_INPUT'; end if;
  if public._has_ng_word(p_nickname || ' ' || coalesce(p_bio, '')) then raise exception 'NG_WORD'; end if;
end $$;

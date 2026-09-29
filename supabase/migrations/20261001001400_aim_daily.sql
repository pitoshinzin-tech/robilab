-- エイム練習「今日の文字」(docs/superpowers/specs/2026-09-29-aim-daily-design.md)
-- お題の一覧(src/data/aim-chars.json と同じ。tests/data/aim-chars-sql.test.ts で一致を確認)
create table if not exists public.aim_chars (
  idx int primary key,
  char_id text not null unique check (char_id ~ '^u[0-9a-f]{4,5}$'),
  glyph text not null,
  strokes int not null check (strokes between 1 and 40)
);
alter table public.aim_chars enable row level security;

insert into public.aim_chars (idx, char_id, glyph, strokes) values
  (0, 'u4e00', '一', 1),
  (1, 'u4e8c', '二', 2),
  (2, 'u5341', '十', 2),
  (3, 'u4eba', '人', 2),
  (4, 'u5165', '入', 2),
  (5, 'u516b', '八', 2),
  (6, 'u4e03', '七', 2),
  (7, 'u4e5d', '九', 2),
  (8, 'u529b', '力', 2),
  (9, 'u4e09', '三', 3),
  (10, 'u4e0a', '上', 3),
  (11, 'u4e0b', '下', 3),
  (12, 'u5927', '大', 3),
  (13, 'u5c0f', '小', 3),
  (14, 'u5c71', '山', 3),
  (15, 'u5ddd', '川', 3),
  (16, 'u53e3', '口', 3),
  (17, 'u571f', '土', 3),
  (18, 'u5973', '女', 3),
  (19, 'u5b50', '子', 3),
  (20, 'u5343', '千', 3),
  (21, 'u5915', '夕', 3),
  (22, 'u4e2d', '中', 4),
  (23, 'u6728', '木', 4),
  (24, 'u706b', '火', 4),
  (25, 'u6c34', '水', 4),
  (26, 'u65e5', '日', 4),
  (27, 'u6708', '月', 4),
  (28, 'u624b', '手', 4),
  (29, 'u738b', '王', 4),
  (30, 'u5929', '天', 4),
  (31, 'u72ac', '犬', 4),
  (32, 'u6587', '文', 4),
  (33, 'u5186', '円', 4),
  (34, 'u4e94', '五', 4),
  (35, 'u516d', '六', 4),
  (36, 'u7530', '田', 5),
  (37, 'u76ee', '目', 5),
  (38, 'u77f3', '石', 5),
  (39, 'u672c', '本', 5),
  (40, 'u5de6', '左', 5),
  (41, 'u53f3', '右', 5),
  (42, 'u767d', '白', 5),
  (43, 'u6b63', '正', 5),
  (44, 'u751f', '生', 5),
  (45, 'u7acb', '立', 5),
  (46, 'u7389', '玉', 5),
  (47, 'u51fa', '出', 5),
  (48, 'u56db', '四', 5),
  (49, 'u5b57', '字', 6),
  (50, 'u65e9', '早', 6),
  (51, 'u7af9', '竹', 6),
  (52, 'u7cf8', '糸', 6),
  (53, 'u8033', '耳', 6),
  (54, 'u866b', '虫', 6),
  (55, 'u5e74', '年', 6),
  (56, 'u6c17', '気', 6),
  (57, 'u540d', '名', 6),
  (58, 'u5148', '先', 6),
  (59, 'u4f11', '休', 6)
on conflict (idx) do nothing;

-- 日本時間の今日
create or replace function public._aim_today() returns date
language sql stable set search_path = public as $$
  select (now() at time zone 'Asia/Tokyo')::date
$$;

-- その日の文字(src/lib/aim/daily.ts の aimIndexForDate と同じ式。開始日 2026-11-01)
create or replace function public._aim_char_for(p_date date) returns public.aim_chars
language sql stable set search_path = public as $$
  select c.* from public.aim_chars c
  where c.idx = greatest(0, p_date - date '2026-11-01') % (select count(*) from public.aim_chars)
$$;

create table if not exists public.aim_scores (
  play_date date not null,
  user_id uuid not null references auth.users (id) on delete cascade,
  char_id text not null,
  accuracy numeric(5,2) not null check (accuracy between 0 and 100),
  time_ms int not null check (time_ms > 0),
  score int not null check (score between 0 and 10000),
  submitted_at timestamptz not null default now(),
  primary key (play_date, user_id)
);
alter table public.aim_scores enable row level security;
create index if not exists aim_scores_ranking on public.aim_scores (play_date, score desc, time_ms);

-- 送信:点数はここで計算し直す。自己ベストだけ上書き。
create or replace function public.submit_aim_score(p_date date, p_char_id text, p_accuracy numeric, p_time_ms int, p_strokes int)
returns int language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_char public.aim_chars;
  v_reason text;
  v_prev public.aim_scores;
  v_score int;
begin
  if v_uid is null then raise exception 'NOT_LOGGED_IN'; end if;
  v_reason := public._my_settings_block_reason(v_uid);
  if v_reason is not null then raise exception '%', v_reason; end if;
  perform pg_advisory_xact_lock(hashtext('aim:' || v_uid::text));
  if p_date is distinct from public._aim_today() then raise exception 'WRONG_DATE'; end if;
  v_char := public._aim_char_for(p_date);
  if v_char.char_id is distinct from p_char_id or v_char.strokes is distinct from p_strokes then raise exception 'WRONG_CHAR'; end if;
  if p_accuracy is null or p_accuracy < 0 or p_accuracy > 100
     or p_time_ms is null or p_time_ms < p_strokes * 300 or p_time_ms > 600000 then
    raise exception 'INVALID_INPUT';
  end if;
  select * into v_prev from public.aim_scores where play_date = p_date and user_id = v_uid;
  if found and v_prev.submitted_at > now() - interval '10 seconds' then raise exception 'TOO_FAST'; end if;
  -- src/lib/aim/trace.ts の computeScore と同じ式
  v_score := round((p_accuracy / 100) * 10000 * least(1, (p_strokes * 1500)::numeric / greatest(1, p_time_ms)));
  if not found then
    insert into public.aim_scores (play_date, user_id, char_id, accuracy, time_ms, score)
      values (p_date, v_uid, p_char_id, round(p_accuracy, 2), p_time_ms, v_score);
    return v_score;
  end if;
  if v_score > v_prev.score then
    update public.aim_scores set accuracy = round(p_accuracy, 2), time_ms = p_time_ms, score = v_score, submitted_at = now()
      where play_date = p_date and user_id = v_uid;
    return v_score;
  end if;
  update public.aim_scores set submitted_at = now() where play_date = p_date and user_id = v_uid;
  return v_prev.score;
end $$;

-- ランキング(上位10件)。名前はマイ設定の表示名。利用停止・BAN の人は除く。
create or replace function public.get_aim_ranking(p_date date)
returns table (rank int, name text, score int, accuracy numeric, time_ms int)
language sql stable security definer set search_path = public as $$
  select (row_number() over (order by s.score desc, s.time_ms asc, s.submitted_at asc))::int,
         case when m.user_id is null or m.card_locked or coalesce(m.data ->> 'cardName', '') = '' then '名無しのゲーマー'
              else m.data ->> 'cardName' end,
         s.score, s.accuracy, s.time_ms
  from public.aim_scores s
  left join public.my_settings m on m.user_id = s.user_id
  where s.play_date = p_date and public._my_settings_block_reason(s.user_id) is null
  order by s.score desc, s.time_ms asc, s.submitted_at asc
  limit 10
$$;

-- 自分の順位(ランキングと同じ並び)
create or replace function public.my_aim_rank(p_date date)
returns table (rank int, score int, accuracy numeric, time_ms int)
language sql stable security definer set search_path = public as $$
  select r.rank, r.score, r.accuracy, r.time_ms from (
    select s.user_id, (row_number() over (order by s.score desc, s.time_ms asc, s.submitted_at asc))::int as rank, s.score, s.accuracy, s.time_ms
    from public.aim_scores s
    where s.play_date = p_date and public._my_settings_block_reason(s.user_id) is null
  ) r where r.user_id = auth.uid()
$$;

revoke all on function public._aim_today, public._aim_char_for from public, anon, authenticated;
revoke all on function public.submit_aim_score, public.get_aim_ranking, public.my_aim_rank from public, anon;
grant execute on function public.submit_aim_score, public.my_aim_rank to authenticated;
grant execute on function public.get_aim_ranking to anon, authenticated;

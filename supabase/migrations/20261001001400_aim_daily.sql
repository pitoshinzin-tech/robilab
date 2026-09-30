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
  (0, 'u7530', '田', 5),
  (1, 'u9752', '青', 8),
  (2, 'u96ea', '雪', 11),
  (3, 'u5b57', '字', 6),
  (4, 'u6d77', '海', 9),
  (5, 'u6b4c', '歌', 14),
  (6, 'u76ee', '目', 5),
  (7, 'u96e8', '雨', 8),
  (8, 'u96f2', '雲', 12),
  (9, 'u65e9', '早', 6),
  (10, 'u98a8', '風', 9),
  (11, 'u8a71', '話', 13),
  (12, 'u77f3', '石', 5),
  (13, 'u7a7a', '空', 8),
  (14, 'u5f37', '強', 11),
  (15, 'u7af9', '竹', 6),
  (16, 'u661f', '星', 9),
  (17, 'u7d75', '絵', 12),
  (18, 'u672c', '本', 5),
  (19, 'u91d1', '金', 8),
  (20, 'u8239', '船', 11),
  (21, 'u7cf8', '糸', 6),
  (22, 'u97f3', '音', 9),
  (23, 'u697d', '楽', 13),
  (24, 'u5de6', '左', 5),
  (25, 'u660e', '明', 8),
  (26, 'u9ed2', '黒', 11),
  (27, 'u866b', '虫', 6),
  (28, 'u6625', '春', 9),
  (29, 'u6570', '数', 13),
  (30, 'u53f3', '右', 5),
  (31, 'u5bb6', '家', 10),
  (32, 'u9ce5', '鳥', 11),
  (33, 'u5e74', '年', 6),
  (34, 'u79cb', '秋', 9),
  (35, 'u6697', '暗', 13),
  (36, 'u767d', '白', 5),
  (37, 'u9ad8', '高', 10),
  (38, 'u6674', '晴', 12),
  (39, 'u6c17', '気', 6),
  (40, 'u5357', '南', 9),
  (41, 'u958b', '開', 12),
  (42, 'u6b63', '正', 5),
  (43, 'u6821', '校', 10),
  (44, 'u9053', '道', 12),
  (45, 'u540d', '名', 6),
  (46, 'u601d', '思', 9),
  (47, 'u52dd', '勝', 12),
  (48, 'u751f', '生', 5),
  (49, 'u5cf6', '島', 10),
  (50, 'u68ee', '森', 12),
  (51, 'u4f11', '休', 6),
  (52, 'u590f', '夏', 10),
  (53, 'u60aa', '悪', 11),
  (54, 'u7acb', '立', 5),
  (55, 'u5f31', '弱', 10),
  (56, 'u9060', '遠', 13),
  (57, 'u51fa', '出', 5),
  (58, 'u99ac', '馬', 10),
  (59, 'u5712', '園', 13)
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
-- ランキングと同じ並びの索引。上位から順に読み、10 件そろったところで止められる(監査 run-4 の 6.2)
drop index if exists public.aim_scores_ranking;
create index aim_scores_ranking on public.aim_scores (play_date, score desc, time_ms, submitted_at, user_id);

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

-- ランキング(上位10件)。名前は、名刺を公開している人だけマイ設定の表示名(公開していない名前は出さない)。
-- 利用停止・BAN の人は除く。同点は時間、送信の早さ、user_id の順(並びを必ず一意にする)。
-- 匿名でも呼べるため、利用停止・BAN の判定は並べた順に 10 件そろうまでだけ行う
-- (内側の問い合わせを aim_scores_ranking の順に読み、limit で止める。その日の全行は判定しない)。
create or replace function public.get_aim_ranking(p_date date)
returns table (rank int, name text, score int, accuracy numeric, time_ms int)
language sql stable security definer set search_path = public as $$
  select (row_number() over (order by t.score desc, t.time_ms asc, t.submitted_at asc, t.user_id))::int,
         case when m.user_id is null or m.public_slug is null or m.card_locked or coalesce(m.data ->> 'cardName', '') = '' then '名無しのゲーマー'
              else m.data ->> 'cardName' end,
         t.score, t.accuracy, t.time_ms
  from (
    select s.user_id, s.score, s.accuracy, s.time_ms, s.submitted_at
    from public.aim_scores s
    where s.play_date = p_date and public._my_settings_block_reason(s.user_id) is null
    order by s.score desc, s.time_ms asc, s.submitted_at asc, s.user_id
    limit 10
  ) t
  left join public.my_settings m on m.user_id = t.user_id
  order by t.score desc, t.time_ms asc, t.submitted_at asc, t.user_id
$$;

-- 自分の順位(ランキングと同じ並び)。
-- その日の全行を判定するが、ログインした人(authenticated)だけが呼べる。匿名には渡さない。
create or replace function public.my_aim_rank(p_date date)
returns table (rank int, score int, accuracy numeric, time_ms int)
language sql stable security definer set search_path = public as $$
  select r.rank, r.score, r.accuracy, r.time_ms from (
    select s.user_id, (row_number() over (order by s.score desc, s.time_ms asc, s.submitted_at asc, s.user_id))::int as rank, s.score, s.accuracy, s.time_ms
    from public.aim_scores s
    where s.play_date = p_date and public._my_settings_block_reason(s.user_id) is null
  ) r where r.user_id = auth.uid()
$$;

revoke all on function public._aim_today, public._aim_char_for from public, anon, authenticated;
revoke all on function public.submit_aim_score, public.get_aim_ranking, public.my_aim_rank from public, anon;
grant execute on function public.submit_aim_score, public.my_aim_rank to authenticated;
grant execute on function public.get_aim_ranking to anon, authenticated;

-- 型
create type public.profile_status as enum ('active', 'suspended', 'banned');
create type public.age_group as enum ('adult', 'teen');
create type public.approach_status as enum ('pending', 'accepted', 'passed', 'expired');
create type public.report_reason as enum ('age_fake', 'harassment', 'spam', 'dating', 'other');

-- 診断結果(匿名)
create table public.diagnosis_results (
  id uuid primary key default gen_random_uuid(),
  type_code text not null check (type_code ~ '^[AG][RB][CL][HZ]$'),
  axes jsonb not null,
  created_at timestamptz not null default now()
);
alter table public.diagnosis_results enable row level security;
create policy "insert diagnosis results" on public.diagnosis_results for insert to anon, authenticated with check (true);

-- 非公開の情報(本人だけ)
create table public.private_info (
  user_id uuid primary key references auth.users (id) on delete cascade,
  discord_user_id text not null unique,
  discord_username text not null,
  birthdate date not null,
  created_at timestamptz not null default now()
);
alter table public.private_info enable row level security;
create policy "read own private info" on public.private_info for select to authenticated using (user_id = auth.uid());

-- BAN した Discord アカウント(運営だけ)
create table public.banned_discord_ids (
  discord_user_id text primary key,
  banned_at timestamptz not null default now(),
  note text
);
alter table public.banned_discord_ids enable row level security;

-- NG ワード(運営だけ。関数の中から読む)
create table public.ng_words (word text primary key);
alter table public.ng_words enable row level security;

-- プロフィール(本人だけが直接読める。他人のものは関数を通して返す)
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  nickname text not null check (char_length(nickname) between 1 and 20),
  type_code text check (type_code ~ '^[AG][RB][CL][HZ]$'),
  axes jsonb,
  games jsonb not null default '[]'::jsonb,
  platforms text[] not null default '{}',
  voice_ok boolean not null default false,
  time_slots text[] not null default '{}',
  bio text not null default '' check (char_length(bio) <= 50),
  age_group public.age_group not null,
  status public.profile_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
create policy "read own profile" on public.profiles for select to authenticated using (id = auth.uid());

-- 声かけ
create table public.approaches (
  id uuid primary key default gen_random_uuid(),
  from_id uuid not null references public.profiles (id) on delete cascade,
  to_id uuid not null references public.profiles (id) on delete cascade,
  status public.approach_status not null default 'pending',
  created_at timestamptz not null default now(),
  responded_at timestamptz,
  seen_by_to boolean not null default false,
  seen_by_from boolean not null default true,
  check (from_id <> to_id)
);
create unique index approaches_one_pending_per_pair on public.approaches (from_id, to_id) where status = 'pending';
create index approaches_from_created on public.approaches (from_id, created_at);
create index approaches_to_status on public.approaches (to_id, status);
alter table public.approaches enable row level security;
-- 直接の読み書きは許可しない(関数を通す)

-- ブロック
create table public.blocks (
  blocker_id uuid not null references public.profiles (id) on delete cascade,
  blocked_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);
alter table public.blocks enable row level security;
create policy "read own blocks" on public.blocks for select to authenticated using (blocker_id = auth.uid());

-- 通報(運営だけが読む)
create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles (id) on delete cascade,
  target_id uuid not null references public.profiles (id) on delete cascade,
  reason public.report_reason not null,
  detail text not null default '' check (char_length(detail) <= 200),
  status text not null default 'open' check (status in ('open', 'closed')),
  created_at timestamptz not null default now(),
  unique (reporter_id, target_id)
);
alter table public.reports enable row level security;

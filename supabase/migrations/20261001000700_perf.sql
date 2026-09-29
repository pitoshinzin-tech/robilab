-- Supabase アドバイザー(performance)の指摘への対応。動作は変わらない。
-- 1. 外部キーにインデックスがない(ブロック・通報の相手側から引くとき、退会時の削除が遅くなる)
create index if not exists blocks_blocked_id on public.blocks (blocked_id);
create index if not exists reports_target_id on public.reports (target_id);

-- 2. RLS ポリシーの auth.uid() を行ごとに評価しないよう、(select auth.uid()) にする
alter policy "read own private info" on public.private_info using (user_id = (select auth.uid()));
alter policy "read own profile" on public.profiles using (id = (select auth.uid()));
alter policy "read own blocks" on public.blocks using (blocker_id = (select auth.uid()));

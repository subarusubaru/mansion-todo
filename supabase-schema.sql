create table mansions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  address text,
  created_at timestamptz default now()
);

create table tasks (
  id uuid default gen_random_uuid() primary key,
  mansion_id uuid references mansions(id) on delete cascade not null,
  name text not null,
  category text not null default 'その他',
  last_date date,
  interval_key text,
  work_step text not null default '未着手',
  memo text,
  created_at timestamptz default now()
);

alter table mansions enable row level security;
alter table tasks enable row level security;

-- 認証済みユーザーは全物件・全タスクを共有
create policy "mansions_select" on mansions for select to authenticated using (true);
create policy "mansions_insert" on mansions for insert to authenticated with check (true);
create policy "mansions_update" on mansions for update to authenticated using (true);
create policy "mansions_delete" on mansions for delete to authenticated using (true);

create policy "tasks_select" on tasks for select to authenticated using (true);
create policy "tasks_insert" on tasks for insert to authenticated with check (true);
create policy "tasks_update" on tasks for update to authenticated using (true);
create policy "tasks_delete" on tasks for delete to authenticated using (true);

-- リアルタイム有効化
alter publication supabase_realtime add table mansions;
alter publication supabase_realtime add table tasks;

alter table mansions replica identity full;
alter table tasks replica identity full;

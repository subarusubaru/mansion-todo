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

create policy "mansions_select" on mansions for select using (auth.uid() = user_id);
create policy "mansions_insert" on mansions for insert with check (auth.uid() = user_id);
create policy "mansions_update" on mansions for update using (auth.uid() = user_id);
create policy "mansions_delete" on mansions for delete using (auth.uid() = user_id);

create policy "tasks_select" on tasks for select using (
  exists (select 1 from mansions where mansions.id = tasks.mansion_id and mansions.user_id = auth.uid())
);
create policy "tasks_insert" on tasks for insert with check (
  exists (select 1 from mansions where mansions.id = tasks.mansion_id and mansions.user_id = auth.uid())
);
create policy "tasks_update" on tasks for update using (
  exists (select 1 from mansions where mansions.id = tasks.mansion_id and mansions.user_id = auth.uid())
);
create policy "tasks_delete" on tasks for delete using (
  exists (select 1 from mansions where mansions.id = tasks.mansion_id and mansions.user_id = auth.uid())
);

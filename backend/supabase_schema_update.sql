-- Soft Delete columns
alter table public.news add column if not exists deleted_at timestamptz;
alter table public.activities add column if not exists deleted_at timestamptz;
-- Services table (if not exists, create simple version)
create table if not exists public.services (
  id uuid primary key,
  name text not null,
  description text,
  category text,
  deleted_at timestamptz,
  created_at timestamptz default now()
);

-- Audit Logs
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  action text not null, -- 'CREATE', 'UPDATE', 'DELETE', 'RESTORE'
  entity text not null, -- 'news', 'activity', 'service'
  entity_id text,
  details jsonb,
  created_at timestamptz default now()
);

-- RLS for Audit Logs
alter table public.audit_logs enable row level security;

create policy audit_read_admin on public.audit_logs 
  for select to authenticated 
  using (exists (select 1 from public.admins a where a.user_id = auth.uid() and a.enabled = true));

create policy audit_insert_admin on public.audit_logs 
  for insert to authenticated 
  with check (exists (select 1 from public.admins a where a.user_id = auth.uid() and a.enabled = true));

-- RLS for Services
alter table public.services enable row level security;
create policy services_select_public on public.services for select using (deleted_at is null);
create policy services_write_admin on public.services
  for all to authenticated
  using (exists (select 1 from public.admins a where a.user_id = auth.uid() and a.enabled = true))
  with check (exists (select 1 from public.admins a where a.user_id = auth.uid() and a.enabled = true));

-- Members table
create table if not exists public.members (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text unique not null,
  phone text,
  address text,
  membership_type text check (membership_type in ('active', 'supporter', 'family')),
  status text check (status in ('active', 'inactive', 'pending', 'debt')),
  last_payment_date timestamptz,
  registration_date timestamptz default now(),
  created_at timestamptz default now()
);

-- Payments table
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  member_id uuid references public.members(id),
  amount numeric not null,
  currency text default 'ARS',
  method text check (method in ('card', 'transfer', 'cash')),
  status text check (status in ('paid', 'pending', 'failed')),
  transaction_id text,
  description text,
  activity_id text, -- optional link to activity
  created_at timestamptz default now()
);

-- Enrollments table
create table if not exists public.enrollments (
  id uuid primary key default gen_random_uuid(),
  member_id uuid references public.members(id),
  activity_id text, -- assuming activity IDs are text like 'futbol'
  status text check (status in ('confirmed', 'pending', 'cancelled')),
  payment_id uuid references public.payments(id),
  created_at timestamptz default now()
);

-- RLS Policies
alter table public.members enable row level security;
alter table public.payments enable row level security;
alter table public.enrollments enable row level security;

-- Admin access
create policy members_read_admin on public.members for select to authenticated using (exists (select 1 from public.admins a where a.user_id = auth.uid() and a.enabled = true));
create policy members_write_admin on public.members for all to authenticated using (exists (select 1 from public.admins a where a.user_id = auth.uid() and a.enabled = true));

create policy payments_read_admin on public.payments for select to authenticated using (exists (select 1 from public.admins a where a.user_id = auth.uid() and a.enabled = true));
create policy payments_write_admin on public.payments for all to authenticated using (exists (select 1 from public.admins a where a.user_id = auth.uid() and a.enabled = true));

create policy enrollments_read_admin on public.enrollments for select to authenticated using (exists (select 1 from public.admins a where a.user_id = auth.uid() and a.enabled = true));
create policy enrollments_write_admin on public.enrollments for all to authenticated using (exists (select 1 from public.admins a where a.user_id = auth.uid() and a.enabled = true));

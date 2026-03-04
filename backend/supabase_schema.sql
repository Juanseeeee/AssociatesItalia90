-- Tablas principales
create table if not exists public.news (
  id uuid primary key,
  title text not null,
  excerpt text default '',
  image text default '',
  published_at timestamptz default now()
);

create table if not exists public.activities (
  id uuid primary key,
  name text not null,
  description text default '',
  image text default '',
  slots int default 0,
  created_at timestamptz default now()
);

create table if not exists public.memberships (
  id uuid primary key,
  name text,
  dni text,
  email text,
  phone text,
  plan text,
  price numeric,
  memberType text,
  rights jsonb,
  paysFee boolean default true,
  joinedAt timestamptz default now()
);

create table if not exists public.payments (
  id uuid primary key,
  concept text,
  amount numeric default 0,
  ts timestamptz default now(),
  status text,
  brand text,
  email text
);

-- Tabla de administradores vinculada a auth.users
create table if not exists public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  role text not null default 'admin',
  enabled boolean not null default true,
  created_at timestamptz default now()
);

-- Habilitar RLS
alter table public.news enable row level security;
alter table public.activities enable row level security;
alter table public.memberships enable row level security;
alter table public.payments enable row level security;
alter table public.admins enable row level security;

-- Políticas
-- Lectura pública de noticias y actividades
create policy news_select_public on public.news
  for select using (true);
create policy activities_select_public on public.activities
  for select using (true);

-- Escritura sólo para admins autenticados
create policy news_write_admin on public.news
  for all to authenticated
  using (exists (select 1 from public.admins a where a.user_id = auth.uid() and a.enabled = true))
  with check (exists (select 1 from public.admins a where a.user_id = auth.uid() and a.enabled = true));

create policy activities_write_admin on public.activities
  for all to authenticated
  using (exists (select 1 from public.admins a where a.user_id = auth.uid() and a.enabled = true))
  with check (exists (select 1 from public.admins a where a.user_id = auth.uid() and a.enabled = true));

-- Membresías y pagos: lectura/escritura sólo por servicio o admin
-- (si querés exponer lectura pública, crear políticas select específicas)
create policy memberships_rw_admin on public.memberships
  for all to authenticated
  using (exists (select 1 from public.admins a where a.user_id = auth.uid() and a.enabled = true))
  with check (exists (select 1 from public.admins a where a.user_id = auth.uid() and a.enabled = true));

create policy payments_rw_admin on public.payments
  for all to authenticated
  using (exists (select 1 from public.admins a where a.user_id = auth.uid() and a.enabled = true))
  with check (exists (select 1 from public.admins a where a.user_id = auth.uid() and a.enabled = true));

-- Nota: las claves de servicio (service_role) ignoran RLS por diseño

-- Compatibilidad si la tabla ya existía sin 'image'
alter table if exists public.activities add column if not exists image text;

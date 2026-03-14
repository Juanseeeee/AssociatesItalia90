-- Tabla de Fixtures (Partidos)
create table if not exists public.fixtures (
  id uuid primary key,
  home_team text not null,
  away_team text not null,
  date timestamptz not null,
  location text default '',
  status text default 'scheduled',
  home_score int default 0,
  away_score int default 0,
  created_at timestamptz default now()
);

-- Tabla de Servicios
create table if not exists public.services (
  id uuid primary key,
  title text not null,
  description text default '',
  image text default '',
  active boolean default true,
  created_at timestamptz default now()
);

-- Tabla de Noticias
create table if not exists public.news (
  id uuid primary key,
  title text not null,
  excerpt text default '',
  image text default '',
  published_at timestamptz default now()
);

-- Habilitar RLS
alter table public.fixtures enable row level security;
alter table public.services enable row level security;
alter table public.news enable row level security;

-- Políticas de lectura pública
create policy fixtures_select_public on public.fixtures for select using (true);
create policy services_select_public on public.services for select using (true);
create policy news_select_public on public.news for select using (true);

-- Políticas de escritura para admins
create policy fixtures_write_admin on public.fixtures
  for all to authenticated
  using (exists (select 1 from public.admins a where a.user_id = auth.uid() and a.enabled = true))
  with check (exists (select 1 from public.admins a where a.user_id = auth.uid() and a.enabled = true));

create policy services_write_admin on public.services
  for all to authenticated
  using (exists (select 1 from public.admins a where a.user_id = auth.uid() and a.enabled = true))
  with check (exists (select 1 from public.admins a where a.user_id = auth.uid() and a.enabled = true));

create policy news_write_admin on public.news
  for all to authenticated
  using (exists (select 1 from public.admins a where a.user_id = auth.uid() and a.enabled = true))
  with check (exists (select 1 from public.admins a where a.user_id = auth.uid() and a.enabled = true));

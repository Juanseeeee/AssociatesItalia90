-- Script de corrección de esquema (07_fix_schema_columns.sql)
-- Ejecutar este script en el Editor SQL de Supabase para solucionar los errores de columnas faltantes

-- 1. Corregir tabla 'news' (Noticias)
-- Verifica si existe la tabla, y si le faltan columnas las agrega
DO $$
BEGIN
    -- Si la tabla news existe, verificar columnas
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'news') THEN
        -- Agregar published_at si no existe
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'news' AND column_name = 'published_at') THEN
            ALTER TABLE public.news ADD COLUMN published_at timestamptz default now();
        END IF;
        
        -- Agregar excerpt si no existe
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'news' AND column_name = 'excerpt') THEN
            ALTER TABLE public.news ADD COLUMN excerpt text default '';
        END IF;
        
        -- Agregar image si no existe
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'news' AND column_name = 'image') THEN
            ALTER TABLE public.news ADD COLUMN image text default '';
        END IF;
    ELSE
        -- Si no existe, crearla completa
        CREATE TABLE public.news (
            id uuid primary key,
            title text not null,
            excerpt text default '',
            image text default '',
            published_at timestamptz default now()
        );
    END IF;
END $$;

-- 2. Corregir tabla 'services' (Servicios)
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'services') THEN
        -- Agregar active si no existe
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'services' AND column_name = 'active') THEN
            ALTER TABLE public.services ADD COLUMN active boolean default true;
        END IF;

        -- Agregar description si no existe
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'services' AND column_name = 'description') THEN
            ALTER TABLE public.services ADD COLUMN description text default '';
        END IF;
        
        -- Agregar image si no existe
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'services' AND column_name = 'image') THEN
            ALTER TABLE public.services ADD COLUMN image text default '';
        END IF;
    ELSE
        -- Si no existe, crearla completa
        CREATE TABLE public.services (
            id uuid primary key,
            title text not null,
            description text default '',
            image text default '',
            active boolean default true,
            created_at timestamptz default now()
        );
    END IF;
END $$;

-- 3. Crear tabla 'fixtures' (Partidos) si no existe
CREATE TABLE IF NOT EXISTS public.fixtures (
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

-- 4. Asegurar RLS (Row Level Security)
ALTER TABLE public.news ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fixtures ENABLE ROW LEVEL SECURITY;

-- 5. Re-aplicar políticas (Dropear primero para evitar duplicados/errores)

-- Policies for News
DROP POLICY IF EXISTS news_select_public ON public.news;
CREATE POLICY news_select_public ON public.news FOR SELECT USING (true);

DROP POLICY IF EXISTS news_write_admin ON public.news;
CREATE POLICY news_write_admin ON public.news
  FOR ALL TO authenticated
  USING (exists (select 1 from public.admins a where a.user_id = auth.uid() and a.enabled = true))
  WITH CHECK (exists (select 1 from public.admins a where a.user_id = auth.uid() and a.enabled = true));

-- Policies for Services
DROP POLICY IF EXISTS services_select_public ON public.services;
CREATE POLICY services_select_public ON public.services FOR SELECT USING (true);

DROP POLICY IF EXISTS services_write_admin ON public.services;
CREATE POLICY services_write_admin ON public.services
  FOR ALL TO authenticated
  USING (exists (select 1 from public.admins a where a.user_id = auth.uid() and a.enabled = true))
  WITH CHECK (exists (select 1 from public.admins a where a.user_id = auth.uid() and a.enabled = true));

-- Policies for Fixtures
DROP POLICY IF EXISTS fixtures_select_public ON public.fixtures;
CREATE POLICY fixtures_select_public ON public.fixtures FOR SELECT USING (true);

DROP POLICY IF EXISTS fixtures_write_admin ON public.fixtures;
CREATE POLICY fixtures_write_admin ON public.fixtures
  FOR ALL TO authenticated
  USING (exists (select 1 from public.admins a where a.user_id = auth.uid() and a.enabled = true))
  WITH CHECK (exists (select 1 from public.admins a where a.user_id = auth.uid() and a.enabled = true));

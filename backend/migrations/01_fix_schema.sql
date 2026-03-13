-- Script de corrección de esquema para AssociatesItalia90
-- Ejecutar este script en el Editor SQL de Supabase para habilitar las tablas necesarias

-- 1. Activities (agregar columnas faltantes)
ALTER TABLE public.activities ADD COLUMN IF NOT EXISTS cost NUMERIC DEFAULT 0;
ALTER TABLE public.activities ADD COLUMN IF NOT EXISTS slots INTEGER DEFAULT 0;
ALTER TABLE public.activities ADD COLUMN IF NOT EXISTS schedule TEXT;
ALTER TABLE public.activities ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.activities ADD COLUMN IF NOT EXISTS image TEXT;

-- 2. News (asegurar ID compatible con texto/nanoid)
-- Si la tabla está vacía, la recreamos para cambiar el tipo de ID a TEXT si fuera UUID
DROP TABLE IF EXISTS public.news;
CREATE TABLE public.news (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    excerpt TEXT,
    image TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Services (crear tabla si no existe)
CREATE TABLE IF NOT EXISTS public.services (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Memberships (crear tabla si no existe y ajustar)
CREATE TABLE IF NOT EXISTS public.memberships (
    id TEXT PRIMARY KEY, -- User ID
    user_id UUID REFERENCES auth.users(id),
    name TEXT,
    dni TEXT,
    phone TEXT,
    plan TEXT,
    category TEXT,
    status TEXT DEFAULT 'pending',
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    expiration TIMESTAMP WITH TIME ZONE,
    photo TEXT,
    last_payment TIMESTAMP WITH TIME ZONE,
    contact_info JSONB,
    payment_info JSONB
);

-- 5. Payments (crear tabla si no existe)
CREATE TABLE IF NOT EXISTS public.payments (
    id TEXT PRIMARY KEY,
    member_id TEXT REFERENCES public.memberships(id),
    amount NUMERIC NOT NULL,
    date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    concept TEXT,
    method TEXT,
    status TEXT
);

-- 6. Habilitar RLS (opcional pero recomendado)
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Políticas de lectura pública
CREATE POLICY "Public activities are viewable by everyone" ON public.activities FOR SELECT USING (true);
CREATE POLICY "Public news are viewable by everyone" ON public.news FOR SELECT USING (true);
CREATE POLICY "Public services are viewable by everyone" ON public.services FOR SELECT USING (true);

-- Políticas de escritura (solo service_role o admin)
-- Nota: Para desarrollo, service_role bypasses RLS por defecto.

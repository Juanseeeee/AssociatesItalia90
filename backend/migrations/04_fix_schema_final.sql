-- Script de corrección final de esquema para AssociatesItalia90
-- Ejecutar este script en el Editor SQL de Supabase para asegurar que todas las columnas necesarias existan.

-- 1. Activities (agregar deleted_at y otras columnas si faltan)
ALTER TABLE public.activities ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.activities ADD COLUMN IF NOT EXISTS slots INTEGER DEFAULT 0;
ALTER TABLE public.activities ADD COLUMN IF NOT EXISTS cost NUMERIC DEFAULT 0;
ALTER TABLE public.activities ADD COLUMN IF NOT EXISTS schedule TEXT;
ALTER TABLE public.activities ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.activities ADD COLUMN IF NOT EXISTS image TEXT;

-- 2. Memberships (agregar columnas críticas para el funcionamiento de la app)
ALTER TABLE public.memberships ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';
ALTER TABLE public.memberships ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.memberships ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE public.memberships ADD COLUMN IF NOT EXISTS contact_info JSONB;
ALTER TABLE public.memberships ADD COLUMN IF NOT EXISTS payment_info JSONB;
ALTER TABLE public.memberships ADD COLUMN IF NOT EXISTS last_payment TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.memberships ADD COLUMN IF NOT EXISTS expiration TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.memberships ADD COLUMN IF NOT EXISTS photo TEXT;
ALTER TABLE public.memberships ADD COLUMN IF NOT EXISTS documents JSONB;

-- 3. Family Members (crear tabla si no existe)
CREATE TABLE IF NOT EXISTS public.family_members (
    id TEXT PRIMARY KEY,
    parent_id UUID REFERENCES auth.users(id),
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    dni TEXT,
    birth_date DATE,
    medical_info TEXT,
    relation TEXT,
    photo_url TEXT,
    dni_url TEXT,
    school_cert_url TEXT,
    auth_parents_url TEXT,
    membership_status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 4. Enable RLS for family_members (si se acaba de crear)
ALTER TABLE public.family_members ENABLE ROW LEVEL SECURITY;

-- 5. Policies for family_members (si no existen, lanzará error si ya existen, pero es seguro intentar crear con IF NOT EXISTS en PG 9.5+ policies no soportan IF NOT EXISTS nativo facilmente sin DO block)
-- Usamos un bloque DO para evitar errores si la política ya existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'family_members' AND policyname = 'Users can view their own family members'
    ) THEN
        CREATE POLICY "Users can view their own family members" ON public.family_members
            FOR SELECT USING (auth.uid() = parent_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'family_members' AND policyname = 'Users can insert their own family members'
    ) THEN
        CREATE POLICY "Users can insert their own family members" ON public.family_members
            FOR INSERT WITH CHECK (auth.uid() = parent_id);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'family_members' AND policyname = 'Users can update their own family members'
    ) THEN
        CREATE POLICY "Users can update their own family members" ON public.family_members
            FOR UPDATE USING (auth.uid() = parent_id);
    END IF;
END
$$;

-- 1. Family Members (crear tabla si no existe)
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

-- Habilitar RLS
ALTER TABLE public.family_members ENABLE ROW LEVEL SECURITY;

-- Políticas (ajustar según necesidad, por ahora permisivas para servicio)
CREATE POLICY "Users can view their own family members" ON public.family_members
    FOR SELECT USING (auth.uid() = parent_id);

CREATE POLICY "Users can insert their own family members" ON public.family_members
    FOR INSERT WITH CHECK (auth.uid() = parent_id);

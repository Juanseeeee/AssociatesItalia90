-- Migration: 05_update_schema_for_auth_flow.sql
-- Description: Updates memberships table with necessary columns for registration flow and adds audit logging.

-- 1. Create Status Enum
DO $$ BEGIN
    CREATE TYPE membership_status AS ENUM ('active', 'inactive', 'pending_payment', 'disabled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Update Memberships Table
-- Ensure all required columns exist
ALTER TABLE public.memberships ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.memberships ADD COLUMN IF NOT EXISTS first_name TEXT;
ALTER TABLE public.memberships ADD COLUMN IF NOT EXISTS last_name TEXT;
ALTER TABLE public.memberships ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE public.memberships ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE public.memberships ADD COLUMN IF NOT EXISTS province TEXT;
ALTER TABLE public.memberships ADD COLUMN IF NOT EXISTS zip_code TEXT;
ALTER TABLE public.memberships ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';
ALTER TABLE public.memberships ADD COLUMN IF NOT EXISTS membership_number TEXT;
ALTER TABLE public.memberships ADD COLUMN IF NOT EXISTS expiration_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.memberships ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE public.memberships ADD COLUMN IF NOT EXISTS family_members JSONB DEFAULT '[]'::jsonb;

-- Update status column type if it exists as text, or add it
DO $$ 
BEGIN
    -- If status exists and is text, we might want to cast it or drop/recreate. 
    -- For safety, we'll just add it if missing. If it exists as TEXT, Supabase might complain on insert if we don't cast.
    -- Let's try to convert it if it's not the enum type.
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'memberships' AND column_name = 'status' AND data_type = 'text') THEN
        ALTER TABLE public.memberships ALTER COLUMN status TYPE membership_status USING status::membership_status;
    ELSIF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'memberships' AND column_name = 'status') THEN
        ALTER TABLE public.memberships ADD COLUMN status membership_status DEFAULT 'disabled';
    END IF;
END $$;

-- 3. Create Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name TEXT NOT NULL,
    record_id TEXT, -- Changed to TEXT to support both UUID and Nanoid IDs
    action TEXT NOT NULL,
    old_data JSONB,
    new_data JSONB,
    changed_by UUID DEFAULT auth.uid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Audit Trigger Function
CREATE OR REPLACE FUNCTION log_audit_event()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.audit_logs (table_name, record_id, action, old_data, new_data, changed_by)
    VALUES (TG_TABLE_NAME, 
            COALESCE(NEW.id::text, OLD.id::text),
            TG_OP, 
            row_to_json(OLD), 
            row_to_json(NEW), 
            auth.uid());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Apply Trigger to Memberships
DROP TRIGGER IF EXISTS audit_memberships_changes ON public.memberships;
CREATE TRIGGER audit_memberships_changes
AFTER INSERT OR UPDATE OR DELETE ON public.memberships
FOR EACH ROW EXECUTE FUNCTION log_audit_event();

-- 6. RLS Policies for Memberships (Ensure users can read their own data)
ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own membership" ON public.memberships;
CREATE POLICY "Users can view own membership" 
ON public.memberships FOR SELECT 
USING (auth.uid()::text = id);

DROP POLICY IF EXISTS "Users can update own membership" ON public.memberships;
CREATE POLICY "Users can update own membership" 
ON public.memberships FOR UPDATE 
USING (auth.uid()::text = id);

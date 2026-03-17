-- Add payment columns to memberships table
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'memberships' AND column_name = 'payment_status') THEN
        ALTER TABLE memberships ADD COLUMN payment_status TEXT DEFAULT 'pending'; -- 'active', 'pending', 'failed'
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'memberships' AND column_name = 'payment_id') THEN
        ALTER TABLE memberships ADD COLUMN payment_id TEXT DEFAULT NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'memberships' AND column_name = 'payment_date') THEN
        ALTER TABLE memberships ADD COLUMN payment_date TIMESTAMPTZ DEFAULT NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'memberships' AND column_name = 'payment_method') THEN
        ALTER TABLE memberships ADD COLUMN payment_method TEXT DEFAULT NULL;
    END IF;
    
    -- Ensure status column exists (audit log mentioned it might, but checking to be safe)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'memberships' AND column_name = 'status') THEN
        ALTER TABLE memberships ADD COLUMN status TEXT DEFAULT 'pending';
    END IF;
END $$;

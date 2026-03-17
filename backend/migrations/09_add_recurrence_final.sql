-- Add recurrence columns to activities table if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'activities' AND column_name = 'is_recurring') THEN
        ALTER TABLE activities ADD COLUMN is_recurring BOOLEAN DEFAULT FALSE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'activities' AND column_name = 'recurrence_days') THEN
        ALTER TABLE activities ADD COLUMN recurrence_days TEXT[] DEFAULT NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'activities' AND column_name = 'start_time') THEN
        ALTER TABLE activities ADD COLUMN start_time TIME DEFAULT NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'activities' AND column_name = 'end_time') THEN
        ALTER TABLE activities ADD COLUMN end_time TIME DEFAULT NULL;
    END IF;
END $$;

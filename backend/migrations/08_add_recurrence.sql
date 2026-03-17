
-- Migration: Add Recurrence Columns to Activities Table

-- 1. Add is_recurring boolean (default false)
alter table public.activities 
add column if not exists is_recurring boolean default false;

-- 2. Add recurrence_days array (text[])
alter table public.activities 
add column if not exists recurrence_days text[];

-- 3. Add start_time and end_time (time or text)
-- Using text for simplicity in storing "HH:mm" format, or time for strictness.
-- Let's use text to match the controller logic which expects strings, 
-- but 'time' type in Postgres is also compatible with "HH:mm" strings.
alter table public.activities 
add column if not exists start_time text;

alter table public.activities 
add column if not exists end_time text;

-- 4. Add check constraint for valid days (optional but good)
-- alter table public.activities add constraint check_recurrence_days 
-- check (recurrence_days <@ ARRAY['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']);

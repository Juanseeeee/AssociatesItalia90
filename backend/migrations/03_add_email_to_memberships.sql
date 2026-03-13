-- 3. Add Email to Memberships for easier lookup
ALTER TABLE public.memberships ADD COLUMN IF NOT EXISTS email TEXT;
CREATE INDEX IF NOT EXISTS idx_memberships_email ON public.memberships(email);
CREATE INDEX IF NOT EXISTS idx_memberships_dni ON public.memberships(dni);

-- Allow public read of memberships (for duplicate checks, restricted to count/exists if RLS allows)
-- Better: Create a stored procedure or use service role in backend.

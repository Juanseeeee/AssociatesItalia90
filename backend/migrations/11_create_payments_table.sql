-- Create payments table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT REFERENCES public.memberships(id), -- Must match memberships.id type (TEXT)
    email TEXT,
    amount NUMERIC NOT NULL,
    status TEXT DEFAULT 'pending', -- 'aprobado', 'pending', 'rejected'
    concept TEXT,
    payment_method TEXT,
    external_id TEXT, -- Mercado Pago ID or similar
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Policies
-- Admins can view all payments
CREATE POLICY "Admins can view all payments" ON public.payments
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.admins 
            WHERE user_id = auth.uid()
            AND enabled = true
        )
    );

-- Users can view their own payments
CREATE POLICY "Users can view own payments" ON public.payments
    FOR SELECT
    USING (
        auth.uid()::text = user_id OR email = (SELECT email FROM auth.users WHERE id = auth.uid())
    );

-- Admins can insert payments (manual payments)
CREATE POLICY "Admins can insert payments" ON public.payments
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.admins 
            WHERE user_id = auth.uid()
            AND enabled = true
        )
    );

-- Service Role (backend) can do anything (bypass RLS usually, but good to have policy if using client)
-- Actually, backend uses service role key which bypasses RLS.

-- Grant access to authenticated users to insert (for testing/demo if needed, but better restrict to backend/admin)
-- We will restrict insert to backend logic mostly.

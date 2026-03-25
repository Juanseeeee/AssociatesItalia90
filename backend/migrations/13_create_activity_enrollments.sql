-- Create activity_enrollments table
CREATE TABLE IF NOT EXISTS activity_enrollments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    activity_id UUID NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
    member_id UUID NOT NULL, -- References auth.users OR family_members
    enrolled_by UUID NOT NULL REFERENCES auth.users(id),
    status TEXT NOT NULL DEFAULT 'active', -- 'active', 'pending_payment', 'cancelled'
    enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    payment_id TEXT,
    UNIQUE(activity_id, member_id)
);

-- RLS Policies for activity_enrollments
ALTER TABLE activity_enrollments ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own enrollments or their family's
CREATE POLICY "Users can view own and family enrollments" 
ON activity_enrollments FOR SELECT 
USING (
    enrolled_by = auth.uid() OR 
    member_id = auth.uid()
);

-- Allow users to insert for themselves or their family
CREATE POLICY "Users can insert own and family enrollments" 
ON activity_enrollments FOR INSERT 
WITH CHECK (
    enrolled_by = auth.uid()
);

-- Allow users to update their own enrollments
CREATE POLICY "Users can update own and family enrollments" 
ON activity_enrollments FOR UPDATE 
USING (
    enrolled_by = auth.uid()
);

-- Service role bypasses RLS automatically

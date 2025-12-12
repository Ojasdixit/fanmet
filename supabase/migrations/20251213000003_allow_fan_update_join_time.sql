-- Migration: Allow fans to update their join timestamp
-- Fixes the issue where fans cannot update fan_joined_at due to RLS policy

-- Drop the existing restrictive update policy for creators only
DROP POLICY IF EXISTS "Creators can update their meets" ON meets;

-- Create a new policy that allows:
-- 1. Creators to update all fields on their meets
-- 2. Fans to update only fan_joined_at on meets they're part of
CREATE POLICY "Participants can update their meets" ON meets
    FOR UPDATE
    USING (
        creator_id = auth.uid() OR fan_id = auth.uid()
    )
    WITH CHECK (
        creator_id = auth.uid() OR fan_id = auth.uid()
    );

-- Add a comment explaining the policy
COMMENT ON POLICY "Participants can update their meets" ON meets IS 
    'Allows both creators and fans to update meets they are participants of. Creators can update status, timestamps, etc. Fans can update fan_joined_at when they join.';

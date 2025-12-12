-- Migration: Add RLS policies for meets table
-- Fixes the 403 Forbidden error when finalizing events

-- Enable RLS on meets table
ALTER TABLE meets ENABLE ROW LEVEL SECURITY;

-- Allow creators to create meets for their own events
CREATE POLICY "Creators can create meets for their events" ON meets
    FOR INSERT
    WITH CHECK (
        creator_id = auth.uid()
    );

-- Allow users to view meets they're part of (as creator or fan)
CREATE POLICY "Users can view their meets" ON meets
    FOR SELECT
    USING (
        creator_id = auth.uid() OR fan_id = auth.uid()
    );

-- Allow creators to update their own meets (for status changes)
CREATE POLICY "Creators can update their meets" ON meets
    FOR UPDATE
    USING (
        creator_id = auth.uid()
    );

-- Allow service role to manage meets (for cron jobs)
CREATE POLICY "Service role can manage meets" ON meets
    FOR ALL
    USING (auth.role() = 'service_role');

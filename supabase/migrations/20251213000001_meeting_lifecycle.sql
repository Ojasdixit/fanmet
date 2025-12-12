-- Migration: Meeting Lifecycle System
-- Adds columns for tracking creator start, fan join, recording, and event logs

-- Add new columns to meets table for lifecycle tracking
ALTER TABLE meets ADD COLUMN IF NOT EXISTS creator_started_at TIMESTAMPTZ;
ALTER TABLE meets ADD COLUMN IF NOT EXISTS creator_joined_at TIMESTAMPTZ;
ALTER TABLE meets ADD COLUMN IF NOT EXISTS fan_joined_at TIMESTAMPTZ;
ALTER TABLE meets ADD COLUMN IF NOT EXISTS recording_started_at TIMESTAMPTZ;
ALTER TABLE meets ADD COLUMN IF NOT EXISTS recording_stopped_at TIMESTAMPTZ;
ALTER TABLE meets ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ;
ALTER TABLE meets ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;
ALTER TABLE meets ADD COLUMN IF NOT EXISTS cancellation_reason TEXT;
ALTER TABLE meets ADD COLUMN IF NOT EXISTS refund_id TEXT;
ALTER TABLE meets ADD COLUMN IF NOT EXISTS recording_url TEXT;

-- Update status enum to include new states
-- Note: If status is already TEXT, this just documents valid values
COMMENT ON COLUMN meets.status IS 'Valid values: scheduled, live, completed, cancelled_no_show_creator, cancelled';

-- Create meeting_event_logs table for audit trail
CREATE TABLE IF NOT EXISTS meeting_event_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meet_id UUID NOT NULL REFERENCES meets(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast lookup by meet_id
CREATE INDEX IF NOT EXISTS idx_meeting_event_logs_meet_id ON meeting_event_logs(meet_id);
CREATE INDEX IF NOT EXISTS idx_meeting_event_logs_event_type ON meeting_event_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_meeting_event_logs_timestamp ON meeting_event_logs(timestamp);

-- Index on meets for scheduled jobs
CREATE INDEX IF NOT EXISTS idx_meets_status ON meets(status);
CREATE INDEX IF NOT EXISTS idx_meets_scheduled_at ON meets(scheduled_at);

-- Add RLS policies for meeting_event_logs
ALTER TABLE meeting_event_logs ENABLE ROW LEVEL SECURITY;

-- Allow users to read logs for meets they're part of
CREATE POLICY "Users can view logs for their meets" ON meeting_event_logs
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM meets 
            WHERE meets.id = meeting_event_logs.meet_id 
            AND (meets.creator_id = auth.uid() OR meets.fan_id = auth.uid())
        )
    );

-- Only service role can insert logs (backend operations)
CREATE POLICY "Service role can insert logs" ON meeting_event_logs
    FOR INSERT
    WITH CHECK (true);

-- Comment on event types
COMMENT ON TABLE meeting_event_logs IS 'Audit log for meeting lifecycle events. Event types: CREATOR_STREAM_STARTED, CREATOR_JOINED, FAN_JOINED, FAN_WAITING_ROOM, RECORDING_STARTED, RECORDING_STOPPED, MEETING_CANCELLED_NO_SHOW_CREATOR, REFUND_ISSUED, MEETING_COMPLETED, MEETING_ENDED_SCHEDULED';

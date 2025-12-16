-- Add metadata columns to track Agora Cloud Recording state
ALTER TABLE meets
    ADD COLUMN IF NOT EXISTS recording_resource_id TEXT,
    ADD COLUMN IF NOT EXISTS recording_sid TEXT,
    ADD COLUMN IF NOT EXISTS recording_mode TEXT DEFAULT 'composite',
    ADD COLUMN IF NOT EXISTS recording_status TEXT,
    ADD COLUMN IF NOT EXISTS recording_file_list JSONB;

COMMENT ON COLUMN meets.recording_resource_id IS 'Agora cloud recording resource ID (per channel acquire call).';
COMMENT ON COLUMN meets.recording_sid IS 'Agora cloud recording session ID (sid).';
COMMENT ON COLUMN meets.recording_mode IS 'Agora recording mode used for the session (individual/composite).';
COMMENT ON COLUMN meets.recording_status IS 'Last known status from Agora Cloud Recording (acquired, started, stopped, etc.).';
COMMENT ON COLUMN meets.recording_file_list IS 'Latest payload of file list returned by Agora Cloud Recording stop/query APIs.';

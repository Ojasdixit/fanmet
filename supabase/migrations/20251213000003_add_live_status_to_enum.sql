-- Add 'live' and 'cancelled_no_show_creator' to meet_status enum
ALTER TYPE meet_status ADD VALUE IF NOT EXISTS 'live';
ALTER TYPE meet_status ADD VALUE IF NOT EXISTS 'cancelled_no_show_creator';

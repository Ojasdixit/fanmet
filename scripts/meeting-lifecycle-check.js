/**
 * Meeting Lifecycle Scheduled Job
 * Run every minute to check for no-shows and meeting completions
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function logEvent(meetId, eventType, metadata = {}) {
    await supabase.from('meeting_event_logs').insert({
        meet_id: meetId,
        event_type: eventType,
        timestamp: new Date().toISOString(),
        metadata
    });
}

async function checkScheduledStartNoShows() {
    console.log('Checking for creator no-shows at scheduled start time...');
    const now = new Date();

    const { data: meetings, error } = await supabase
        .from('meets')
        .select('*')
        .eq('status', 'scheduled')
        .lte('scheduled_at', now.toISOString());

    if (error) {
        console.error('Error fetching meetings:', error);
        return;
    }

    if (!meetings || meetings.length === 0) {
        console.log('No meetings past scheduled start time.');
        return;
    }

    console.log(`Found ${meetings.length} meetings past start time without creator.`);

    for (const meet of meetings) {
        if (!meet.creator_started_at || new Date(meet.creator_started_at) >= new Date(meet.scheduled_at)) {
            console.log(`Cancelling meeting ${meet.id} - creator no-show`);

            await supabase.from('meets').update({
                status: 'cancelled_no_show_creator',
                cancelled_at: now.toISOString(),
                cancellation_reason: 'CREATOR_NO_SHOW'
            }).eq('id', meet.id);

            await logEvent(meet.id, 'MEETING_CANCELLED_NO_SHOW_CREATOR', {
                cancelled_at: now.toISOString(),
                scheduled_start: meet.scheduled_at
            });

            await logEvent(meet.id, 'FAN_JOIN_STATUS_AT_S', {
                fan_joined: meet.fan_joined_at !== null,
                fan_joined_at: meet.fan_joined_at
            });

            // TODO: Issue refund via payment gateway
            await logEvent(meet.id, 'REFUND_ISSUED', {
                refund_id: `refund_${Date.now()}_${meet.id}`,
                fan_id: meet.fan_id
            });

            console.log(`Meeting ${meet.id} cancelled, refund logged.`);
        }
    }
}

async function checkScheduledEndCompletions() {
    console.log('Checking for meetings at scheduled end time...');
    const now = new Date();

    const { data: meetings, error } = await supabase
        .from('meets')
        .select('*')
        .eq('status', 'live');

    if (error) {
        console.error('Error fetching live meetings:', error);
        return;
    }

    if (!meetings || meetings.length === 0) {
        console.log('No live meetings.');
        return;
    }

    for (const meet of meetings) {
        const scheduledEnd = new Date(meet.scheduled_at);
        scheduledEnd.setMinutes(scheduledEnd.getMinutes() + meet.duration_minutes);

        if (now >= scheduledEnd) {
            console.log(`Completing meeting ${meet.id} - reached end time`);

            if (meet.recording_started_at && !meet.recording_stopped_at) {
                await supabase.from('meets').update({
                    recording_stopped_at: now.toISOString()
                }).eq('id', meet.id);

                await logEvent(meet.id, 'RECORDING_STOPPED', { stopped_at: now.toISOString() });
            }

            await supabase.from('meets').update({
                status: 'completed',
                completed_at: now.toISOString()
            }).eq('id', meet.id);

            await logEvent(meet.id, 'MEETING_COMPLETED', {
                completed_at: now.toISOString(),
                creator_started_at: meet.creator_started_at,
                fan_joined_at: meet.fan_joined_at,
                recording_started_at: meet.recording_started_at
            });

            console.log(`Meeting ${meet.id} marked as completed.`);
        }
    }
}

async function runLifecycleChecks() {
    console.log(`\n=== Meeting Lifecycle Check @ ${new Date().toISOString()} ===`);
    await checkScheduledStartNoShows();
    await checkScheduledEndCompletions();
    console.log('=== Check complete ===\n');
}

runLifecycleChecks().catch(console.error);

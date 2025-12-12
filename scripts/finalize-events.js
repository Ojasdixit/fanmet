
// Scripts to be run periodically (e.g. by a cron job or scheduled task)
// This script checks for events where the bidding deadline has passed and finalizes them.

import { createClient } from '@supabase/supabase-js';

// Load environment variables (ensure these are set in your environment if running locally)
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''; // Needs service role to bypass RLS if running as backend job

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkAndFinalizeEvents() {
    console.log('Checking for events to finalize...');
    const now = new Date().toISOString();

    // 1. Fetch events that are 'Upcoming' or 'Accepting Bids' AND passed deadline
    const { data: events, error } = await supabase
        .from('events')
        .select('*')
        .in('status', ['Upcoming', 'Accepting Bids']) // Check both just in case
        .lt('bidding_closes_at', now);

    if (error) {
        console.error('Error fetching expired events:', error);
        return;
    }

    if (!events || events.length === 0) {
        console.log('No events to finalize.');
        return;
    }

    console.log(`Found ${events.length} events to finalize.`);

    for (const event of events) {
        console.log(`Finalizing event: ${event.title} (${event.id})`);

        // 2. Find highest active bid
        const { data: bids, error: bidError } = await supabase
            .from('bids')
            .select('*')
            .eq('event_id', event.id)
            .eq('status', 'active')
            .order('amount', { ascending: false })
            .limit(1);

        if (bidError) {
            console.error(`Error fetching bids for event ${event.id}:`, bidError);
            continue;
        }

        const winnerBid = bids && bids.length > 0 ? bids[0] : null;

        // 3. Create Meet if winner
        if (winnerBid) {
            const { error: meetError } = await supabase
                .from('meets')
                .insert({
                    event_id: event.id,
                    creator_id: event.creator_id,
                    fan_id: winnerBid.fan_id,
                    scheduled_at: event.starts_at,
                    duration_minutes: event.duration_minutes,
                    meeting_link: event.meeting_link,
                    status: 'scheduled'
                });

            if (meetError) {
                console.error(`Error creating meet for event ${event.id}:`, meetError);
                // Continue to try to close event? Or retry?
                // For now, loop continues but we should probably mark event as 'error' or similar if strictly needed.
                // But let's proceed to close the event so we don't process it infinitely.
            } else {
                console.log(`Created meet for event ${event.id} with winner ${winnerBid.fan_id}`);
            }
        } else {
            console.log(`No active bids for event ${event.id}. Closing without meet.`);
        }

        // 4. Mark event as completed
        const { error: updateError } = await supabase
            .from('events')
            .update({ status: 'completed' }) // Or 'closed'
            .eq('id', event.id);

        if (updateError) {
            console.error(`Error closing event ${event.id}:`, updateError);
        } else {
            console.log(`Event ${event.id} marked as completed.`);
        }
    }
}

checkAndFinalizeEvents().catch(console.error);

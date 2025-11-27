// Script to check all meetings in the database
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://iktldcrkyphkvxjwmxyb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlrdGxkY3JreXBoa3Z4andteHliIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzA1Mzg1NSwiZXhwIjoyMDc4NjI5ODU1fQ.A3bEVM_duySXx1cSDV7QobZNQRm9umZYyaQzQ3wybGs';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkMeetings() {
    console.log('Checking all meetings...\n');

    // Get all profiles with pari in the name
    const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .or('username.ilike.%pari%,display_name.ilike.%pari%');

    if (profileError) {
        console.error('Error fetching profiles:', profileError);
    } else {
        console.log('Profiles with "pari":', profiles);
        console.log('\n---\n');
    }

    // Get all meets
    const { data: allMeets, error: meetsError } = await supabase
        .from('meets')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

    if (meetsError) {
        console.error('Error fetching meets:', meetsError);
    } else {
        console.log(`Total meets (last 10):`, allMeets);
        console.log('\n---\n');

        if (allMeets && allMeets.length > 0) {
            // Check if any have no meeting link
            const noLink = allMeets.filter(m => !m.meeting_link || m.meeting_link === '');
            console.log(`Meets without links: ${noLink.length}`);
            if (noLink.length > 0) {
                console.log('Updating these meets with dummy links...');
                for (const meet of noLink) {
                    const { error } = await supabase
                        .from('meets')
                        .update({ meeting_link: 'https://meet.google.com/abc-defg-hij' })
                        .eq('id', meet.id);

                    if (error) {
                        console.error(`Error updating meet ${meet.id}:`, error);
                    } else {
                        console.log(`✓ Updated meet ${meet.id}`);
                    }
                }
            }
        }
    }
}

checkMeetings().then(() => {
    console.log('\nDone!');
    process.exit(0);
}).catch(err => {
    console.error('Error:', err);
    process.exit(1);
});

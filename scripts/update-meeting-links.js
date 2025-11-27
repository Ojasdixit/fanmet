// Script to update meeting links in the database
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://iktldcrkyphkvxjwmxyb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlrdGxkY3JreXBoa3Z4andteHliIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzA1Mzg1NSwiZXhwIjoyMDc4NjI5ODU1fQ.A3bEVM_duySXx1cSDV7QobZNQRm9umZYyaQzQ3wybGs';

const supabase = createClient(supabaseUrl, supabaseKey);

async function updateMeetingLinks() {
    console.log('Updating meeting links...');

    // Get all meets without a meeting link
    const { data: meetsWithoutLink, error: fetchError } = await supabase
        .from('meets')
        .select('*')
        .or('meeting_link.is.null,meeting_link.eq.');

    if (fetchError) {
        console.error('Error fetching meets:', fetchError);
        return;
    }

    console.log(`Found ${meetsWithoutLink?.length || 0} meets without links`);

    if (meetsWithoutLink && meetsWithoutLink.length > 0) {
        // Update with a dummy Google Meet link
        const { data, error } = await supabase
            .from('meets')
            .update({ meeting_link: 'https://meet.google.com/abc-defg-hij' })
            .or('meeting_link.is.null,meeting_link.eq.')
            .select();

        if (error) {
            console.error('Error updating meets:', error);
        } else {
            console.log(`Successfully updated ${data?.length || 0} meets`);
            console.log('Updated meets:', data);
        }
    }
}

updateMeetingLinks().then(() => {
    console.log('Done!');
    process.exit(0);
}).catch(err => {
    console.error('Error:', err);
    process.exit(1);
});


import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AgoraRTC, {
    AgoraRTCProvider,
    useJoin,
    useLocalCameraTrack,
    useLocalMicrophoneTrack,
    usePublish,
    useRemoteUsers,
    RemoteUser,
    LocalUser,
} from 'agora-rtc-react';
import { Button } from '@fanmeet/ui';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabaseClient';

// IMPORTANT: Replace with your actual Agora App ID
const APP_ID = (import.meta as any).env.VITE_AGORA_APP_ID || "147414ee52fa4baaa112702a2e49f189";

// Supabase Edge Function URL for token generation
const SUPABASE_URL = 'https://iktldcrkyphkvxjwmxyb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlrdGxkY3JreXBoa3Z4andteHliIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMwNTM4NTUsImV4cCI6MjA3ODYyOTg1NX0.ToXGJWTGBj0xaKp6EEHJY0H3hrqW122CE486oju4opI';

async function fetchAgoraToken(channelName: string, uid: number = 0): Promise<string | null> {
    try {
        console.log('🎫 Fetching Agora token for channel:', channelName);
        const response = await fetch(`${SUPABASE_URL}/functions/v1/generate-agora-token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'apikey': SUPABASE_ANON_KEY,
            },
            body: JSON.stringify({ channelName, uid, role: 1 }),
        });
        
        if (!response.ok) {
            const error = await response.text();
            console.error('❌ Token fetch failed:', error);
            return null;
        }
        
        const data = await response.json();
        console.log('✅ Token received:', data.token ? 'yes' : 'no');
        return data.token || null;
    } catch (error) {
        console.error('❌ Error fetching token:', error);
        return null;
    }
}

export const AgoraMeet = () => {
    const { meetId } = useParams<{ meetId: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();

    // Agora client
    const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });

    if (!meetId) return <div>Invalid Meeting Link</div>;

    return (
        <AgoraRTCProvider client={client}>
            <Call checkUser={user} meetId={meetId} onLeave={() => navigate('/')} />
        </AgoraRTCProvider>
    );
};

function Call({ checkUser, meetId, onLeave }: { checkUser: any, meetId: string, onLeave: () => void }) {
    const [active, setActive] = useState(false);
    const [timeLeft, setTimeLeft] = useState<number | null>(null);
    const [isTimerRunning, setIsTimerRunning] = useState(false);
    const [channelName, setChannelName] = useState<string | null>(null);
    const [agoraToken, setAgoraToken] = useState<string | null>(null);
    const [tokenLoading, setTokenLoading] = useState(true);

    useEffect(() => {
        async function fetchMeetingDataAndToken() {
            const { data, error } = await supabase
                .from('meets')
                .select('id, duration_minutes')
                .ilike('meeting_link', `%${meetId}%`)
                .single();

            let channel = meetId;
            if (data) {
                console.log('Fetched meeting:', data.id, 'duration:', data.duration_minutes);
                setTimeLeft(data.duration_minutes * 60);
                channel = data.id;
                setChannelName(data.id);
            } else {
                console.error('Could not fetch meeting data, defaulting to 5 mins', error);
                setTimeLeft(300);
                setChannelName(meetId);
            }
            
            // Fetch Agora token
            const token = await fetchAgoraToken(channel);
            setAgoraToken(token);
            setTokenLoading(false);
            setActive(true);
        }
        fetchMeetingDataAndToken();
    }, [meetId]);

    // Join hook - use meeting.id as channel name and fetched token
    const { isConnected } = useJoin(
        { appid: APP_ID, channel: channelName || '', token: agoraToken },
        active && channelName !== null && !tokenLoading
    );
    const { localMicrophoneTrack } = useLocalMicrophoneTrack(active && !tokenLoading);
    const { localCameraTrack } = useLocalCameraTrack(active && !tokenLoading);
    usePublish([localMicrophoneTrack, localCameraTrack]);
    const remoteUsers = useRemoteUsers();

    useEffect(() => {
        if (isConnected) {
            setIsTimerRunning(true);
        }
    }, [isConnected]);

    // Timer Logic
    useEffect(() => {
        let interval: any;
        if (isTimerRunning && timeLeft !== null && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft((prev) => {
                    if (prev === null) return null;
                    if (prev <= 1) {
                        clearInterval(interval);
                        onLeave();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isTimerRunning, timeLeft, onLeave]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="flex h-screen w-full flex-col bg-gray-900 text-white">
            {/* Header */}
            <div className="flex items-center justify-between bg-gray-800 px-6 py-4 shadow-md">
                <h1 className="text-lg font-semibold">FanMeet Call</h1>
                <div className={`rounded-full px-4 py-1 text-sm font-bold ${timeLeft !== null && timeLeft < 60 ? 'bg-red-500' : 'bg-gray-700'}`}>
                    {timeLeft !== null ? formatTime(timeLeft) : 'Loading...'}
                </div>
                <Button variant="secondary" size="sm" onClick={onLeave}>
                    Leave Call
                </Button>
            </div>

            {/* Video Grid */}
            <div className="flex flex-1 items-center justify-center gap-4 p-4">
                {/* Local User */}
                <div className="relative aspect-video h-full max-h-[400px] w-full max-w-[600px] overflow-hidden rounded-xl bg-gray-800 shadow-lg">
                    <LocalUser
                        audioTrack={localMicrophoneTrack}
                        videoTrack={localCameraTrack}
                        cameraOn={true}
                        micOn={true}
                        playAudio={false}
                        playVideo={true}
                        className="h-full w-full object-cover"
                    />
                    <div className="absolute bottom-4 left-4 rounded-md bg-black/50 px-2 py-1 text-sm">
                        You ({checkUser?.username || 'Me'})
                    </div>
                </div>

                {/* Remote Users */}
                {remoteUsers.map((user) => (
                    <div key={user.uid} className="relative aspect-video h-full max-h-[400px] w-full max-w-[600px] overflow-hidden rounded-xl bg-gray-800 shadow-lg">
                        <RemoteUser user={user} className="h-full w-full object-cover" />
                        <div className="absolute bottom-4 left-4 rounded-md bg-black/50 px-2 py-1 text-sm">
                            User {user.uid}
                        </div>
                    </div>
                ))}

                {remoteUsers.length === 0 && (
                    <div className="flex aspect-video h-full max-h-[400px] w-full max-w-[600px] items-center justify-center rounded-xl bg-gray-800 text-gray-400">
                        Waiting for others to join...
                    </div>
                )}
            </div>

            {/* Controls (Simplified) */}
            <div className="flex items-center justify-center gap-4 bg-gray-800 py-6">
                <div className="text-sm text-gray-400">
                    Note: Call will automatically end when the timer reaches 0:00.
                </div>
            </div>
        </div>
    );
}

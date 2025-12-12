
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
const APP_ID = (import.meta as any).env.VITE_AGORA_APP_ID || "8f73117280e84d43997dbdf5072049e6"; // Placeholder

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
    const [timeLeft, setTimeLeft] = useState<number | null>(null); // Start null, wait for data
    const [isTimerRunning, setIsTimerRunning] = useState(false);

    useEffect(() => {
        async function fetchDuration() {
            // We have meetId which is the meet.meeting_link UUID usually, BUT 
            // our route is /meet/:meetId
            // In CreatorCreateEvent, we set meetingLink = .../meet/${crypto.randomUUID()}
            // So meetId from URL IS the randomUUID.
            // However, we don't store this UUID as a primary key 'id' in 'meets' table easily lookup-able 
            // unless we query by meeting_link column contains this UUID.
            // Actually, let's look at how we store it.
            // meeting_link: `.../meet/${uuid}`
            // So we can search where meeting_link like `%${meetId}`.

            const { data, error } = await supabase
                .from('meets')
                .select('duration_minutes')
                .ilike('meeting_link', `%${meetId}%`)
                .single();

            if (data) {
                console.log('Fetched duration:', data.duration_minutes);
                setTimeLeft(data.duration_minutes * 60);
            } else {
                console.error('Could not fetch meet duration, defaulting to 5 mins', error);
                setTimeLeft(300);
            }
        }
        fetchDuration();
    }, [meetId]);

    // Join hook
    const { isConnected } = useJoin(
        { appid: APP_ID, channel: meetId, token: null },
        active
    );

    useEffect(() => {
        setActive(true);
    }, []);

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

    // Local Tracks
    const { localMicrophoneTrack } = useLocalMicrophoneTrack(active);
    const { localCameraTrack } = useLocalCameraTrack(active);

    // Publish tracks
    usePublish([localMicrophoneTrack, localCameraTrack]);

    // Remote Users
    const remoteUsers = useRemoteUsers();

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

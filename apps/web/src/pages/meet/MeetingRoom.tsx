import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
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
import { Button, Card } from '@fanmeet/ui';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabaseClient';
import {
    getMeetingByLink,
    onCreatorStreamStarted,
    onCreatorJoined,
    onFanAttemptJoin,
    calculateRemainingTime,
    isMeetingTimeValid,
    logMeetingEvent,
    MeetingLifecycleState,
} from '../../services/meetingLifecycleService';

const APP_ID = (import.meta as any).env?.VITE_AGORA_APP_ID || "147414ee52fa4baaa112702a2e49f189";
console.log('🔑 Agora APP_ID:', APP_ID);

type MeetingViewState = 'loading' | 'waiting_room' | 'live' | 'ended' | 'cancelled' | 'error';

export const MeetingRoom = () => {
    const { meetId } = useParams<{ meetId: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    
    // Create Agora client once and memoize it - MUST be before any conditional returns
    const client = useMemo(() => AgoraRTC.createClient({ mode: "rtc", codec: "vp8" }), []);

    // Determine appropriate dashboard based on user role - MUST be before any conditional returns
    const getDashboardRoute = useCallback(() => {
        if (user?.role === 'creator') return '/creator/meets';
        if (user?.role === 'fan') return '/fan/meets';
        return '/'; // fallback
    }, [user?.role]);

    // Early returns AFTER all hooks
    if (!meetId) return <ErrorView message="Invalid Meeting Link" onBack={() => navigate('/')} />;
    if (!user) return <ErrorView message="Please log in to join the meeting" onBack={() => navigate('/login')} />;

    return (
        <AgoraRTCProvider client={client}>
            <MeetingController user={user} meetId={meetId} onLeave={() => navigate(getDashboardRoute())} />
        </AgoraRTCProvider>
    );
};

function MeetingController({ user, meetId, onLeave }: { user: any; meetId: string; onLeave: () => void }) {
    const [viewState, setViewState] = useState<MeetingViewState>('loading');
    const [meeting, setMeeting] = useState<MeetingLifecycleState | null>(null);
    const [isCreator, setIsCreator] = useState(false);
    const [timeLeft, setTimeLeft] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);
    const pollingRef = useRef<NodeJS.Timeout | null>(null);
    const realtimeChannelRef = useRef<any>(null);

    // Helper functions using refs to avoid dependency issues
    const stopPollingFn = () => {
        if (pollingRef.current) {
            clearInterval(pollingRef.current);
            pollingRef.current = null;
        }
    };

    const cleanupRealtimeFn = () => {
        if (realtimeChannelRef.current) {
            console.log('📡 Cleaning up Realtime subscription');
            supabase.removeChannel(realtimeChannelRef.current);
            realtimeChannelRef.current = null;
        }
    };

    // Setup Supabase Realtime subscription for instant updates
    const setupRealtimeSubscription = (meetingId: string) => {
        if (realtimeChannelRef.current) return;
        
        console.log('📡 Setting up Supabase Realtime for meeting:', meetingId);
        
        const channel = supabase
            .channel(`meeting-${meetingId}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'meets',
                    filter: `id=eq.${meetingId}`
                },
                async (payload) => {
                    console.log('📡 Realtime update received:', payload.new);
                    const newData = payload.new as any;
                    
                    // Update meeting state
                    setMeeting(prev => prev ? {
                        ...prev,
                        status: newData.status,
                        creatorStartedAt: newData.creator_started_at,
                        creatorJoinedAt: newData.creator_joined_at,
                        fanJoinedAt: newData.fan_joined_at,
                    } : null);
                    
                    // Handle fan joining when creator starts
                    if (newData.status === 'live' && newData.creator_started_at) {
                        console.log('🎬 Creator started meeting! (Realtime)');
                        stopPollingFn();
                        const result = await onFanAttemptJoin(meetingId, user.id);
                        if (result.canJoin) {
                            setViewState('live');
                            const scheduledEnd = new Date(newData.scheduled_at);
                            scheduledEnd.setMinutes(scheduledEnd.getMinutes() + newData.duration_minutes);
                            const remaining = Math.max(0, Math.floor((scheduledEnd.getTime() - Date.now()) / 1000));
                            setTimeLeft(remaining);
                        }
                    }
                    
                    if (newData.status === 'cancelled_no_show_creator' || newData.status === 'cancelled') {
                        console.log('🚫 Meeting cancelled (Realtime)');
                        stopPollingFn();
                        setViewState('cancelled');
                    }
                    
                    if (newData.status === 'completed') {
                        console.log('✅ Meeting completed (Realtime)');
                        setViewState('ended');
                    }
                    
                    // Log when fan joins (for creator notification)
                    if (newData.fan_joined_at) {
                        console.log('👋 Fan joined the meeting! (Realtime)');
                    }
                }
            )
            .subscribe((status) => {
                console.log('📡 Realtime subscription status:', status);
            });
        
        realtimeChannelRef.current = channel;
    };

    // Fallback polling for meeting updates
    const startPollingFn = (meetingIdToWatch: string) => {
        if (pollingRef.current) return;
        console.log('🎯 Starting polling + Realtime for meeting updates...');
        
        // Setup realtime first
        setupRealtimeSubscription(meetingIdToWatch);
        
        // Also poll as backup every 3 seconds
        pollingRef.current = setInterval(async () => {
            const meetingData = await getMeetingByLink(meetId);
            if (!meetingData) return;

            if (meetingData.status === 'live' && meetingData.creatorStartedAt) {
                console.log('🎬 Creator started! (Polling)');
                stopPollingFn();
                const result = await onFanAttemptJoin(meetingData.id, user.id);
                if (result.canJoin) {
                    setMeeting(meetingData);
                    setViewState('live');
                    setTimeLeft(calculateRemainingTime(meetingData));
                }
            }
            if (meetingData.status === 'cancelled_no_show_creator') {
                console.log('🚫 Meeting cancelled (Polling)');
                stopPollingFn();
                setViewState('cancelled');
            }
        }, 3000);
    };

    // Main initialization effect
    useEffect(() => {
        async function init() {
            const meetingData = await getMeetingByLink(meetId);
            if (!meetingData) {
                setError('Meeting not found');
                setViewState('error');
                return;
            }
            
            setMeeting(meetingData);
            const userIsCreator = meetingData.creatorId === user.id;
            const userIsFan = meetingData.fanId === user.id;
            setIsCreator(userIsCreator);

            if (!userIsCreator && !userIsFan) {
                setError('You are not a participant of this meeting');
                setViewState('error');
                return;
            }

            if (meetingData.status === 'cancelled_no_show_creator' || meetingData.status === 'cancelled') {
                setViewState('cancelled');
                return;
            }

            if (meetingData.status === 'completed') {
                setViewState('ended');
                return;
            }

            const timeInfo = isMeetingTimeValid(meetingData);
            if (timeInfo.afterEnd) {
                setViewState('ended');
                return;
            }

            // Creator goes straight to live view
            if (userIsCreator) {
                setupRealtimeSubscription(meetingData.id); // Listen for fan joining
                setViewState('live');
                setTimeLeft(calculateRemainingTime(meetingData));
            } else {
                // Fan checks if meeting is already live
                if (meetingData.status === 'live' && meetingData.creatorStartedAt) {
                    const result = await onFanAttemptJoin(meetingData.id, user.id);
                    if (result.canJoin) {
                        setViewState('live');
                        setTimeLeft(calculateRemainingTime(meetingData));
                    } else if (result.meetingEnded) {
                        setViewState('ended');
                    } else {
                        setViewState('waiting_room');
                        startPollingFn(meetingData.id);
                    }
                } else {
                    // Wait for creator to start
                    setViewState('waiting_room');
                    startPollingFn(meetingData.id);
                }
            }
        }

        init();
        return () => {
            stopPollingFn();
            cleanupRealtimeFn();
        };
    }, [meetId, user.id]);

    // Timer countdown effect
    useEffect(() => {
        if (viewState !== 'live' || timeLeft === null) return;
        const interval = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev === null || prev <= 1) {
                    clearInterval(interval);
                    setViewState('ended');
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(interval);
    }, [viewState, timeLeft]);

    if (viewState === 'loading') {
        return <LoadingView />;
    }

    if (viewState === 'error') {
        return <ErrorView message={error || 'An error occurred'} onBack={onLeave} />;
    }

    if (viewState === 'cancelled') {
        return <CancelledView isCreator={isCreator} onBack={onLeave} />;
    }

    if (viewState === 'ended') {
        return <EndedView onBack={onLeave} />;
    }

    if (viewState === 'waiting_room' && meeting) {
        return <WaitingRoom meeting={meeting} onBack={onLeave} />;
    }

    if (viewState === 'live' && meeting) {
        return (
            <LiveCall
                user={user}
                meeting={meeting}
                meetId={meetId}
                isCreator={isCreator}
                timeLeft={timeLeft}
                onLeave={onLeave}
            />
        );
    }

    return <ErrorView message="Unknown state" onBack={onLeave} />;
}

function LoadingView() {
    return (
        <div className="flex h-screen w-full items-center justify-center bg-gray-900">
            <div className="text-center text-white">
                <div className="mb-4 text-4xl">⏳</div>
                <p className="text-lg">Loading meeting...</p>
            </div>
        </div>
    );
}

function ErrorView({ message, onBack }: { message: string; onBack: () => void }) {
    return (
        <div className="flex h-screen w-full items-center justify-center bg-gray-900">
            <Card className="max-w-md bg-gray-800 p-8 text-center">
                <div className="mb-4 text-4xl">❌</div>
                <h2 className="mb-2 text-xl font-semibold text-white">Error</h2>
                <p className="mb-6 text-gray-400">{message}</p>
                <Button onClick={onBack}>Go Back</Button>
            </Card>
        </div>
    );
}

function CancelledView({ isCreator, onBack }: { isCreator: boolean; onBack: () => void }) {
    return (
        <div className="flex h-screen w-full items-center justify-center bg-gray-900">
            <Card className="max-w-md bg-gray-800 p-8 text-center">
                <div className="mb-4 text-4xl">🚫</div>
                <h2 className="mb-2 text-xl font-semibold text-white">Meeting Cancelled</h2>
                <p className="mb-6 text-gray-400">
                    {isCreator
                        ? 'This meeting was cancelled because you did not start before the scheduled time.'
                        : 'This meeting was cancelled because the creator did not show up. A refund has been issued.'}
                </p>
                <Button onClick={onBack}>Go Back</Button>
            </Card>
        </div>
    );
}

function EndedView({ onBack }: { onBack: () => void }) {
    return (
        <div className="flex h-screen w-full items-center justify-center bg-gray-900">
            <Card className="max-w-md bg-gray-800 p-8 text-center">
                <div className="mb-4 text-4xl">✅</div>
                <h2 className="mb-2 text-xl font-semibold text-white">Meeting Ended</h2>
                <p className="mb-6 text-gray-400">This meeting has ended. Thank you for participating!</p>
                <Button onClick={onBack}>Go Back</Button>
            </Card>
        </div>
    );
}

function WaitingRoom({ meeting, onBack }: { meeting: MeetingLifecycleState; onBack: () => void }) {
    const timeInfo = isMeetingTimeValid(meeting);
    const scheduledTime = new Date(meeting.scheduledAt).toLocaleString();

    return (
        <div className="flex h-screen w-full items-center justify-center bg-gray-900">
            <Card className="max-w-lg bg-gray-800 p-8 text-center">
                <div className="mb-4 text-6xl">🎬</div>
                <h2 className="mb-2 text-2xl font-semibold text-white">Waiting Room</h2>
                <p className="mb-4 text-gray-400">
                    The creator hasn't started the meeting yet. Please wait...
                </p>
                <div className="mb-6 rounded-lg bg-gray-700 p-4">
                    <p className="text-sm text-gray-300">
                        <strong>Scheduled Start:</strong> {scheduledTime}
                    </p>
                    <p className="text-sm text-gray-300">
                        <strong>Duration:</strong> {meeting.durationMinutes} minutes
                    </p>
                    {timeInfo.beforeStart && (
                        <p className="mt-2 text-sm text-yellow-400">
                            ⏰ Meeting starts in {Math.ceil(timeInfo.secondsUntilStart / 60)} minutes
                        </p>
                    )}
                </div>
                <div className="mb-4 flex items-center justify-center gap-2">
                    <div className="h-3 w-3 animate-pulse rounded-full bg-yellow-500"></div>
                    <span className="text-sm text-yellow-400">Waiting for creator to start...</span>
                </div>
                <p className="mb-6 text-xs text-gray-500">
                    You'll automatically join when the creator starts the meeting.
                </p>
                <Button variant="secondary" onClick={onBack}>Leave Waiting Room</Button>
            </Card>
        </div>
    );
}

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

function LiveCall({
    user,
    meeting,
    meetId,
    isCreator,
    timeLeft,
    onLeave,
}: {
    user: any;
    meeting: MeetingLifecycleState;
    meetId: string;
    isCreator: boolean;
    timeLeft: number | null;
    onLeave: () => void;
}) {
    const [active, setActive] = useState(false);
    const [hasMarkedLive, setHasMarkedLive] = useState(false);
    const [agoraToken, setAgoraToken] = useState<string | null>(null);
    const [tokenLoading, setTokenLoading] = useState(true);
    
    // CRITICAL: Use meeting.id (database UUID) as channel name, NOT meetId from URL
    // This ensures both creator and fan join the SAME Agora channel regardless of URL case
    const channelName = meeting.id;
    console.log('🎯 Agora channel name:', channelName, '(meeting.id, not URL param)');
    
    // Fetch token on mount
    useEffect(() => {
        async function getToken() {
            setTokenLoading(true);
            const token = await fetchAgoraToken(channelName);
            setAgoraToken(token);
            setTokenLoading(false);
            // Activate Agora after token is fetched
            setActive(true);
        }
        getToken();
    }, [channelName]);
    
    // Join with token (or null if token generation failed - will work in testing mode)
    const { isConnected } = useJoin(
        { appid: APP_ID, channel: channelName, token: agoraToken },
        active && !tokenLoading
    );
    const { localMicrophoneTrack } = useLocalMicrophoneTrack(active && !tokenLoading);
    const { localCameraTrack } = useLocalCameraTrack(active && !tokenLoading);
    usePublish([localMicrophoneTrack, localCameraTrack]);
    const remoteUsers = useRemoteUsers();

    // Log connection status for debugging
    useEffect(() => {
        console.log('🔌 Agora connection status:', isConnected ? 'CONNECTED' : 'DISCONNECTED');
        console.log('📹 Remote users count:', remoteUsers.length);
        if (remoteUsers.length > 0) {
            console.log('👥 Remote users:', remoteUsers.map(u => u.uid));
        }
    }, [isConnected, remoteUsers]);

    // CRITICAL: Mark meeting as LIVE immediately when creator enters LiveCall view
    // This happens BEFORE waiting for Agora connection so fan can join seamlessly
    useEffect(() => {
        if (isCreator && !hasMarkedLive) {
            setHasMarkedLive(true);
            console.log('🚀 Creator entered LiveCall view, marking meeting as LIVE immediately');
            console.log('🔑 Meeting ID:', meeting.id);
            
            onCreatorStreamStarted(meeting.id).then((result) => {
                if (result.success) {
                    console.log('✅ Meeting marked as LIVE in database - fan can now join');
                } else {
                    console.error('❌ Failed to mark meeting as LIVE:', result.error);
                }
            }).catch(err => {
                console.error('💥 Error calling onCreatorStreamStarted:', err);
            });
            
            onCreatorJoined(meeting.id, user.id).catch(err => {
                console.error('Error in onCreatorJoined:', err);
            });
        }
    }, [isCreator, hasMarkedLive, meeting.id, user.id]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="flex h-screen w-full flex-col bg-gray-900 text-white">
            <div className="flex items-center justify-between bg-gray-800 px-6 py-4 shadow-md">
                <div className="flex items-center gap-3">
                    <h1 className="text-lg font-semibold">FanMeet Call</h1>
                    <span className={`rounded-full px-2 py-0.5 text-xs ${isCreator ? 'bg-purple-600' : 'bg-blue-600'}`}>
                        {isCreator ? 'Creator' : 'Fan'}
                    </span>
                </div>
                <div className={`rounded-full px-4 py-1 text-sm font-bold ${timeLeft !== null && timeLeft < 60 ? 'bg-red-500' : 'bg-gray-700'}`}>
                    {timeLeft !== null ? formatTime(timeLeft) : 'Loading...'}
                </div>
                <Button variant="secondary" size="sm" onClick={onLeave}>
                    Leave Call
                </Button>
            </div>

            <div className="flex flex-1 items-center justify-center gap-4 p-4">
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
                        You ({user?.username || 'Me'})
                    </div>
                </div>

                {remoteUsers.map((remoteUser) => (
                    <div key={remoteUser.uid} className="relative aspect-video h-full max-h-[400px] w-full max-w-[600px] overflow-hidden rounded-xl bg-gray-800 shadow-lg">
                        <RemoteUser user={remoteUser} className="h-full w-full object-cover" />
                        <div className="absolute bottom-4 left-4 rounded-md bg-black/50 px-2 py-1 text-sm">
                            {isCreator ? 'Fan' : 'Creator'}
                        </div>
                    </div>
                ))}

                {remoteUsers.length === 0 && (
                    <div className="flex aspect-video h-full max-h-[400px] w-full max-w-[600px] items-center justify-center rounded-xl bg-gray-800 text-gray-400">
                        <div className="text-center">
                            <div className="mb-2 text-4xl">👤</div>
                            <p>Waiting for {isCreator ? 'fan' : 'creator'} to join...</p>
                        </div>
                    </div>
                )}
            </div>

            <div className="flex items-center justify-center gap-4 bg-gray-800 py-4">
                <div className="flex items-center gap-2 text-sm text-gray-400">
                    <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse"></div>
                    <span>Recording</span>
                </div>
                <span className="text-gray-600">|</span>
                <span className="text-sm text-gray-400">
                    Call ends automatically at scheduled time. No extensions.
                </span>
            </div>
        </div>
    );
}

export default MeetingRoom;

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
import { PhoneOff, Mic, MicOff, Video, VideoOff } from 'lucide-react';
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

const APP_ID = (import.meta as any).env?.VITE_AGORA_APP_ID || "3a5053a5c71c493fbb8d67f68475fbcc";
console.log('🔑 Agora APP_ID:', APP_ID);

type MeetingViewState = 'loading' | 'waiting_room' | 'live' | 'ended' | 'cancelled' | 'error';

export const MeetingRoom = () => {
    const { meetId } = useParams<{ meetId: string }>();
    const navigate = useNavigate();
    const { user, isLoading } = useAuth();
    
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
    if (isLoading) return <LoadingView />;
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
}): JSX.Element {
    const [active, setActive] = useState(false);
    const [hasMarkedLive, setHasMarkedLive] = useState(false);
    const [recordingStatus, setRecordingStatus] = useState<'preparing' | 'recording' | 'stopped' | 'error'>('preparing');
    const [recordingError, setRecordingError] = useState<string | null>(null);
    const [agoraToken, setAgoraToken] = useState<string | null>(null);
    const [tokenLoading, setTokenLoading] = useState(true);
    const [micOn, setMicOn] = useState(true);
    const [cameraOn, setCameraOn] = useState(true);
    const [primaryView, setPrimaryView] = useState<'local' | number>('local');
    const [userPinnedPrimary, setUserPinnedPrimary] = useState(false);
    const [isSwapping, setIsSwapping] = useState(false);
    const swapTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const remoteFallbackTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    
    // CRITICAL: Use meeting.id (database UUID) as channel name, NOT meetId from URL
    // This ensures both creator and fan join the SAME Agora channel regardless of URL case
    const channelName = meeting.id;
    console.log('🎯 Agora channel name:', channelName, '(meeting.id, not URL param)');
    
    // Testing mode - no token needed, connect immediately
    useEffect(() => {
        console.log('🎫 Testing mode - using null token for channel:', channelName);
        setTokenLoading(false);
        setActive(true);
    }, [channelName]);
    
    // Join with null token (testing mode - no certificate)
    const { isConnected } = useJoin(
        { appid: APP_ID, channel: channelName, token: null },
        active
    );
    const { localMicrophoneTrack } = useLocalMicrophoneTrack(active);
    const { localCameraTrack } = useLocalCameraTrack(active);
    usePublish([localMicrophoneTrack, localCameraTrack]);
    const remoteUsers = useRemoteUsers();

    useEffect(() => {
        if (localMicrophoneTrack) {
            localMicrophoneTrack.setEnabled(micOn);
        }
    }, [localMicrophoneTrack, micOn]);

    useEffect(() => {
        if (localCameraTrack) {
            localCameraTrack.setEnabled(cameraOn);
        }
    }, [localCameraTrack, cameraOn]);

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

            // Creator triggers recording as soon as meeting goes live
            checkRecordingStatus();
        }
    }, [isCreator, hasMarkedLive, meeting.id, user.id]);

    // Query recording metadata to show status
    useEffect(() => {
        if (!meeting) return;
        if (meeting.recordingStartedAt && !meeting.recordingStoppedAt) {
            setRecordingStatus('recording');
        } else if (meeting.recordingStoppedAt) {
            setRecordingStatus('stopped');
        } else {
            setRecordingStatus('preparing');
        }
    }, [meeting.recordingStartedAt, meeting.recordingStoppedAt]);

    async function checkRecordingStatus() {
        try {
            setRecordingStatus('preparing');
            const { data, error } = await supabase.functions.invoke('agora-cloud-recording', {
                body: { action: 'query', meetId: meeting.id }
            });

            if (error || !data?.success) {
                setRecordingError(error?.message || data?.error || 'Unable to verify recording');
                setRecordingStatus('error');
                return;
            }

            setRecordingStatus('recording');
            setRecordingError(null);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Unknown recording error';
            console.error('Recording status check failed:', err);
            setRecordingError(message);
            setRecordingStatus('error');
        }
    }

    async function handleStopRecording() {
        try {
            setRecordingStatus('preparing');
            const { data, error } = await supabase.functions.invoke('agora-cloud-recording', {
                body: { action: 'stop', meetId: meeting.id }
            });

            if (error || !data?.success) {
                setRecordingError(error?.message || data?.error || 'Failed to stop recording');
                setRecordingStatus('error');
                return;
            }

            setRecordingStatus('stopped');
            setRecordingError(null);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Unknown recording error';
            console.error('Recording stop failed:', err);
            setRecordingError(message);
            setRecordingStatus('error');
        }
    }

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const focusedRemoteUser =
        remoteUsers.find((user) => user.uid === primaryView) || remoteUsers[0] || null;
    const secondaryRemoteUsers = focusedRemoteUser
        ? remoteUsers.filter((user) => user.uid !== focusedRemoteUser.uid)
        : [];
    const isLocalPrimary = primaryView === 'local' || !focusedRemoteUser;

    useEffect(() => {
        if (remoteUsers.length === 0) {
            if (!remoteFallbackTimeoutRef.current) {
                remoteFallbackTimeoutRef.current = setTimeout(() => {
                    setPrimaryView('local');
                    setUserPinnedPrimary(false);
                    remoteFallbackTimeoutRef.current = null;
                }, 350);
            }
            return;
        }

        if (remoteFallbackTimeoutRef.current) {
            clearTimeout(remoteFallbackTimeoutRef.current);
            remoteFallbackTimeoutRef.current = null;
        }

        const primaryRemoteStillPresent =
            primaryView !== 'local' && remoteUsers.some((user) => user.uid === primaryView);

        if (primaryView !== 'local' && !primaryRemoteStillPresent) {
            const nextRemote = remoteUsers[0];
            if (nextRemote && primaryView !== nextRemote.uid) {
                setPrimaryView(nextRemote.uid as number);
            }
        } else if (!userPinnedPrimary && primaryView === 'local' && remoteUsers.length > 0) {
            setPrimaryView(remoteUsers[0].uid as number);
        }
    }, [remoteUsers, primaryView, userPinnedPrimary]);

    useEffect(() => {
        return () => {
            if (swapTimeoutRef.current) {
                clearTimeout(swapTimeoutRef.current);
            }
            if (remoteFallbackTimeoutRef.current) {
                clearTimeout(remoteFallbackTimeoutRef.current);
            }
        };
    }, []);

    const togglePrimaryView = () => {
        if (remoteUsers.length === 0) return;
        setUserPinnedPrimary(true);
        setIsSwapping(true);
        if (swapTimeoutRef.current) {
            clearTimeout(swapTimeoutRef.current);
        }
        swapTimeoutRef.current = setTimeout(() => {
            setIsSwapping(false);
            swapTimeoutRef.current = null;
        }, 320);
        setPrimaryView((prev) => {
            if (prev === 'local') {
                const fallbackRemote = remoteUsers[0];
                return (fallbackRemote?.uid as number) ?? 'local';
            }
            return 'local';
        });
    };
    const recordingDotColor = 'bg-red-500 animate-pulse';

    return (
        <div className="relative flex h-screen w-full flex-col overflow-hidden bg-[#040308] text-white">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(88,111,255,0.25),_rgba(4,3,8,0.95))]" />

            <div className="relative z-10 flex h-full flex-col">
                <header className="flex items-center justify-between px-5 pb-2 pt-6 sm:px-8">
                    <div>
                        <p className="text-xs uppercase tracking-[0.35em] text-white/50">FanMeet Live</p>
                        <h1 className="text-xl font-semibold text-white sm:text-2xl">
                            {isCreator ? 'Chat with your fan' : 'Live with the creator'}
                        </h1>
                        <p className="text-[11px] text-white/60">End-to-end encrypted • Agora powered</p>
                    </div>
                    <div className="flex flex-col items-end gap-1 text-right">
                        <span className="text-[11px] uppercase tracking-[0.3em] text-emerald-300">Live</span>
                        <span
                            className={`text-2xl font-bold ${
                                timeLeft !== null && timeLeft < 60 ? 'text-rose-300' : 'text-white'
                            }`}
                        >
                            {timeLeft !== null ? formatTime(timeLeft) : '--:--'}
                        </span>
                        <span className="text-xs text-white/60">
                            {remoteUsers.length + 1} participant{remoteUsers.length !== 0 ? 's' : ''}
                        </span>
                    </div>
                </header>

                <main className="relative flex-1 px-4 pb-36 pt-2 sm:px-8">
                    <div
                        className={`relative h-full w-full overflow-hidden rounded-[32px] border border-white/10 bg-black/40 shadow-[0_30px_120px_rgba(0,0,0,0.45)] transition-all duration-300 ease-out ${
                            isSwapping ? 'ring-2 ring-white/20 scale-[1.01]' : ''
                        }`}
                    >
                        {!isLocalPrimary && focusedRemoteUser ? (
                            <RemoteUser user={focusedRemoteUser} className="h-full w-full object-cover" />
                        ) : cameraOn ? (
                            <LocalUser
                                audioTrack={localMicrophoneTrack}
                                videoTrack={localCameraTrack}
                                cameraOn={cameraOn}
                                micOn={micOn}
                                playAudio={false}
                                playVideo={cameraOn}
                                className="h-full w-full object-cover"
                            />
                        ) : (
                            <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-center">
                                <div className="mb-4 text-5xl">📡</div>
                                <p className="text-base font-semibold">
                                    {remoteUsers.length ? 'Your camera is off' : `Waiting for ${isCreator ? 'fan' : 'creator'} to connect`}
                                </p>
                                <p className="mt-2 max-w-xs text-sm text-white/70">
                                    {remoteUsers.length
                                        ? 'Switch on your camera or tap swap to spotlight the participant.'
                                        : 'We’ll pull them in the moment their camera is active.'}
                                </p>
                            </div>
                        )}

                        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/40" />

                        <div className="absolute left-5 top-5 flex flex-col gap-1 rounded-2xl bg-black/30 px-4 py-3 backdrop-blur">
                            <span className="text-[11px] uppercase tracking-[0.3em] text-white/70">
                                {!isLocalPrimary && focusedRemoteUser ? 'Connected' : remoteUsers.length ? 'Self view' : 'Calling'}
                            </span>
                            <p className="text-lg font-semibold">
                                {!isLocalPrimary
                                    ? isCreator
                                        ? 'Fan in focus'
                                        : 'Creator in focus'
                                    : 'You are in focus'}
                            </p>
                            <p className="text-xs text-white/70">
                                {new Date(meeting.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                        </div>

                        {secondaryRemoteUsers.length > 0 && (
                            <div className="absolute right-5 top-5 flex gap-2">
                                {secondaryRemoteUsers.slice(0, 2).map((user) => (
                                    <div
                                        key={user.uid}
                                        className="h-12 w-12 rounded-2xl border border-white/20 bg-white/15 backdrop-blur"
                                    >
                                        <RemoteUser user={user} className="h-full w-full rounded-2xl object-cover" />
                                    </div>
                                ))}
                                {secondaryRemoteUsers.length > 2 && (
                                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/20 bg-black/30 text-xs font-semibold text-white/70">
                                        +{secondaryRemoteUsers.length - 2}
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="absolute bottom-5 left-5 flex max-w-[70%] items-center gap-3 rounded-2xl bg-black/35 px-4 py-2 text-xs text-white/80 backdrop-blur">
                            <div className={`h-2 w-2 rounded-full ${remoteUsers.length ? 'bg-emerald-400' : 'bg-yellow-400'}`} />
                            <p className="truncate">
                                {remoteUsers.length ? 'All good — video stabilized' : 'Linking you both together…'}
                            </p>
                        </div>
                    </div>

                    {remoteUsers.length > 0 && (
                        <button
                            type="button"
                            onClick={togglePrimaryView}
                            className="group absolute bottom-28 right-4 z-20 w-28 rounded-[20px] border border-white/30 bg-black/70 p-2 text-left shadow-2xl backdrop-blur transition-all duration-300 ease-out hover:scale-105 hover:border-white/80 sm:right-10 sm:w-32"
                        >
                            <div className="relative h-32 w-full overflow-hidden rounded-2xl">
                                {isLocalPrimary && focusedRemoteUser ? (
                                    <RemoteUser user={focusedRemoteUser} className="h-full w-full object-cover" />
                                ) : (
                                    <LocalUser
                                        audioTrack={localMicrophoneTrack}
                                        videoTrack={localCameraTrack}
                                        cameraOn={cameraOn}
                                        micOn={micOn}
                                        playAudio={false}
                                        playVideo={cameraOn}
                                        className="h-full w-full object-cover"
                                    />
                                )}
                                <div className="absolute inset-0 bg-black/30 opacity-0 transition group-hover:opacity-100" />
                            </div>
                            <div className="mt-2 flex items-center justify-between text-[10px] font-medium uppercase tracking-wide text-white/80">
                                <span>{isLocalPrimary ? (isCreator ? 'Fan view' : 'Creator view') : 'You'}</span>
                                <span className="text-white/60">Tap to swap</span>
                            </div>
                        </button>
                    )}
                </main>

                <footer className="pointer-events-auto absolute inset-x-0 bottom-0 flex flex-col gap-4 rounded-t-[32px] bg-black/60 px-6 pb-8 pt-6 backdrop-blur-2xl sm:flex-row sm:items-center sm:justify-between sm:px-10">
                    <div className="flex items-center gap-2 text-xs text-white/70 sm:text-sm">
                        <div className={`h-2 w-2 rounded-full ${recordingDotColor}`} />
                        <span>Recording • Cloud backup active</span>
                        {isCreator && (
                            <button
                                onClick={handleStopRecording}
                                className="ml-3 text-xs font-semibold text-white/90 underline-offset-2 hover:text-white"
                            >
                                Stop
                            </button>
                        )}
                    </div>

                    <div className="flex flex-1 flex-wrap items-center justify-center gap-4 sm:justify-end">
                        <button
                            onClick={() => setMicOn((prev) => !prev)}
                            className={`flex h-14 w-14 flex-col items-center justify-center rounded-full text-[11px] font-semibold transition sm:h-16 sm:w-16 ${
                                micOn ? 'bg-white/15 text-white' : 'bg-rose-600 text-white shadow-lg shadow-rose-900/40'
                            }`}
                        >
                            {micOn ? <Mic className="mb-1 h-5 w-5" /> : <MicOff className="mb-1 h-5 w-5" />}
                            {micOn ? 'Mute' : 'Unmute'}
                        </button>

                        <button
                            onClick={() => setCameraOn((prev) => !prev)}
                            className={`flex h-14 w-14 flex-col items-center justify-center rounded-full text-[11px] font-semibold transition sm:h-16 sm:w-16 ${
                                cameraOn ? 'bg-white/15 text-white' : 'bg-rose-600 text-white shadow-lg shadow-rose-900/40'
                            }`}
                        >
                            {cameraOn ? <Video className="mb-1 h-5 w-5" /> : <VideoOff className="mb-1 h-5 w-5" />}
                            {cameraOn ? 'Video' : 'Off'}
                        </button>

                        <button
                            onClick={onLeave}
                            className="flex h-14 flex-1 items-center justify-center rounded-2xl bg-rose-600 text-sm font-semibold uppercase tracking-wide text-white shadow-2xl shadow-rose-900/40 sm:h-14 sm:flex-none sm:px-8"
                        >
                            <PhoneOff className="mr-2 h-5 w-5" />
                            Leave
                        </button>
                    </div>
                </footer>
            </div>
        </div>
    );
}

export default MeetingRoom;

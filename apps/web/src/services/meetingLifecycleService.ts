import { supabase } from '../lib/supabaseClient';

// Meeting status types
export type MeetingStatus = 
  | 'scheduled' 
  | 'live' 
  | 'completed' 
  | 'cancelled_no_show_creator' 
  | 'cancelled';

// Event log types
export type MeetingEventType =
  | 'CREATOR_STREAM_STARTED'
  | 'CREATOR_JOINED'
  | 'FAN_JOINED'
  | 'FAN_WAITING_ROOM'
  | 'RECORDING_STARTED'
  | 'RECORDING_STOPPED'
  | 'MEETING_CANCELLED_NO_SHOW_CREATOR'
  | 'REFUND_ISSUED'
  | 'MEETING_COMPLETED'
  | 'MEETING_ENDED_SCHEDULED'
  | 'FAN_JOIN_STATUS_AT_S';

export interface MeetingLifecycleState {
  id: string;
  status: MeetingStatus;
  scheduledAt: string;
  durationMinutes: number;
  creatorId: string;
  fanId: string;
  creatorStartedAt: string | null;
  creatorJoinedAt: string | null;
  fanJoinedAt: string | null;
  recordingStartedAt: string | null;
  recordingStoppedAt: string | null;
}

// Log a meeting event
export async function logMeetingEvent(
  meetId: string,
  eventType: MeetingEventType,
  metadata: Record<string, any> = {}
): Promise<void> {
  const { error } = await supabase
    .from('meeting_event_logs')
    .insert({
      meet_id: meetId,
      event_type: eventType,
      timestamp: new Date().toISOString(),
      metadata
    });

  if (error) {
    console.error(`Error logging meeting event ${eventType}:`, error);
  }
}

// Get meeting by ID
export async function getMeeting(meetId: string): Promise<MeetingLifecycleState | null> {
  const { data, error } = await supabase
    .from('meets')
    .select('*')
    .eq('id', meetId)
    .single();

  if (error || !data) {
    console.error('Error fetching meeting:', error);
    return null;
  }

  return {
    id: data.id,
    status: data.status,
    scheduledAt: data.scheduled_at,
    durationMinutes: data.duration_minutes,
    creatorId: data.creator_id,
    fanId: data.fan_id,
    creatorStartedAt: data.creator_started_at,
    creatorJoinedAt: data.creator_joined_at,
    fanJoinedAt: data.fan_joined_at,
    recordingStartedAt: data.recording_started_at,
    recordingStoppedAt: data.recording_stopped_at
  };
}

// Get meeting by meeting link (for URL-based lookup)
export async function getMeetingByLink(meetingLinkId: string): Promise<MeetingLifecycleState | null> {
  const { data, error } = await supabase
    .from('meets')
    .select('*')
    .ilike('meeting_link', `%${meetingLinkId}%`)
    .single();

  if (error || !data) {
    console.error('Error fetching meeting by link:', error);
    return null;
  }

  return {
    id: data.id,
    status: data.status,
    scheduledAt: data.scheduled_at,
    durationMinutes: data.duration_minutes,
    creatorId: data.creator_id,
    fanId: data.fan_id,
    creatorStartedAt: data.creator_started_at,
    creatorJoinedAt: data.creator_joined_at,
    fanJoinedAt: data.fan_joined_at,
    recordingStartedAt: data.recording_started_at,
    recordingStoppedAt: data.recording_stopped_at
  };
}

// Creator starts their stream (publishes video/audio)
export async function onCreatorStreamStarted(meetId: string): Promise<{ success: boolean; error?: string }> {
  console.log('🔷 onCreatorStreamStarted called with meetId:', meetId);
  
  const now = new Date();
  const meeting = await getMeeting(meetId);

  if (!meeting) {
    console.error('🔷 Meeting not found for id:', meetId);
    return { success: false, error: 'Meeting not found' };
  }

  console.log('🔷 Meeting found:', { id: meeting.id, status: meeting.status, scheduledAt: meeting.scheduledAt });

  // Allow starting if meeting is scheduled OR already live (reconnection case)
  if (meeting.status !== 'scheduled' && meeting.status !== 'live') {
    console.error('🔷 Meeting not in startable state:', meeting.status);
    return { success: false, error: `Meeting is not in a startable state (current: ${meeting.status})` };
  }

  // If already live, just return success (creator reconnecting)
  if (meeting.status === 'live') {
    console.log('🔷 Meeting already live, returning success');
    return { success: true };
  }

  const scheduledStart = new Date(meeting.scheduledAt);
  const scheduledEnd = new Date(meeting.scheduledAt);
  scheduledEnd.setMinutes(scheduledEnd.getMinutes() + meeting.durationMinutes);

  // Only block if past the meeting END time
  if (now >= scheduledEnd) {
    console.error('🔷 Meeting past end time');
    return { success: false, error: 'Cannot start meeting after scheduled end time' };
  }

  const startedEarly = now < scheduledStart;
  const secondsDiff = startedEarly 
    ? Math.floor((scheduledStart.getTime() - now.getTime()) / 1000)
    : -Math.floor((now.getTime() - scheduledStart.getTime()) / 1000);

  console.log('🔷 Attempting to update meeting to live...');
  
  // Update meeting to live
  const { error, data } = await supabase
    .from('meets')
    .update({
      status: 'live',
      creator_started_at: now.toISOString()
    })
    .eq('id', meetId)
    .select();

  if (error) {
    console.error('🔷 Error updating meeting status:', error);
    return { success: false, error: `Failed to update meeting: ${error.message}` };
  }

  console.log('🔷 Update result:', data);

  await logMeetingEvent(meetId, 'CREATOR_STREAM_STARTED', {
    started_at: now.toISOString(),
    scheduled_start: meeting.scheduledAt,
    started_early: startedEarly,
    seconds_from_scheduled: secondsDiff
  });

  console.log('✅ onCreatorStreamStarted completed successfully');
  return { success: true };
}

// Creator joins the meeting room UI
export async function onCreatorJoined(meetId: string, creatorId: string): Promise<{ success: boolean; error?: string }> {
  const now = new Date();
  const meeting = await getMeeting(meetId);

  if (!meeting) {
    return { success: false, error: 'Meeting not found' };
  }

  if (meeting.creatorId !== creatorId) {
    return { success: false, error: 'User is not the creator of this meeting' };
  }

  // Update creator joined time
  const { error } = await supabase
    .from('meets')
    .update({ creator_joined_at: now.toISOString() })
    .eq('id', meetId);

  if (error) {
    console.error('Error updating creator joined time:', error);
    return { success: false, error: 'Failed to update meeting' };
  }

  await logMeetingEvent(meetId, 'CREATOR_JOINED', {
    creator_id: creatorId,
    joined_at: now.toISOString()
  });

  // Check if we should start recording
  await checkAndStartRecording(meetId);

  return { success: true };
}

// Fan attempts to join meeting
export async function onFanAttemptJoin(
  meetId: string, 
  fanId: string
): Promise<{ 
  success: boolean; 
  showWaitingRoom: boolean; 
  canJoin: boolean; 
  error?: string;
  meetingEnded?: boolean;
}> {
  const now = new Date();
  const meeting = await getMeeting(meetId);

  if (!meeting) {
    return { success: false, showWaitingRoom: false, canJoin: false, error: 'Meeting not found' };
  }

  if (meeting.fanId !== fanId) {
    return { success: false, showWaitingRoom: false, canJoin: false, error: 'User is not the fan for this meeting' };
  }

  // Check if meeting is cancelled
  if (meeting.status === 'cancelled_no_show_creator' || meeting.status === 'cancelled') {
    return { 
      success: false, 
      showWaitingRoom: false, 
      canJoin: false, 
      error: 'Meeting has been cancelled',
      meetingEnded: true
    };
  }

  // Check if meeting is completed
  if (meeting.status === 'completed') {
    return { 
      success: false, 
      showWaitingRoom: false, 
      canJoin: false, 
      error: 'Meeting has already ended',
      meetingEnded: true
    };
  }

  // Check if past end time
  const scheduledEnd = new Date(meeting.scheduledAt);
  scheduledEnd.setMinutes(scheduledEnd.getMinutes() + meeting.durationMinutes);
  
  if (now >= scheduledEnd) {
    return { 
      success: false, 
      showWaitingRoom: false, 
      canJoin: false, 
      error: 'Meeting time has ended',
      meetingEnded: true
    };
  }

  // If meeting is still scheduled (creator hasn't started), show waiting room
  if (meeting.status === 'scheduled') {
    await logMeetingEvent(meetId, 'FAN_WAITING_ROOM', {
      fan_id: fanId,
      attempted_at: now.toISOString()
    });
    
    return { 
      success: true, 
      showWaitingRoom: true, 
      canJoin: false 
    };
  }

  // Meeting is live, fan can join
  if (meeting.status === 'live') {
    // Record fan joined time if not already joined
    if (!meeting.fanJoinedAt) {
      const { error } = await supabase
        .from('meets')
        .update({ fan_joined_at: now.toISOString() })
        .eq('id', meetId);

      if (error) {
        console.error('Error updating fan joined time:', error);
      }

      await logMeetingEvent(meetId, 'FAN_JOINED', {
        fan_id: fanId,
        joined_at: now.toISOString(),
        scheduled_start: meeting.scheduledAt,
        joined_late_by_seconds: now > new Date(meeting.scheduledAt) 
          ? Math.floor((now.getTime() - new Date(meeting.scheduledAt).getTime()) / 1000)
          : 0
      });

      // Check if we should start recording
      await checkAndStartRecording(meetId);
    }

    return { success: true, showWaitingRoom: false, canJoin: true };
  }

  return { success: false, showWaitingRoom: false, canJoin: false, error: 'Unknown meeting state' };
}

// Check and start recording if both parties are present
async function checkAndStartRecording(meetId: string): Promise<void> {
  const meeting = await getMeeting(meetId);

  if (!meeting) return;
  if (meeting.status !== 'live') return;
  if (meeting.recordingStartedAt) return; // Already recording

  // Both must be present
  if (meeting.creatorStartedAt && meeting.fanJoinedAt) {
    const now = new Date().toISOString();

    const { error } = await supabase
      .from('meets')
      .update({ recording_started_at: now })
      .eq('id', meetId);

    if (error) {
      console.error('Error updating recording start time:', error);
      return;
    }

    await logMeetingEvent(meetId, 'RECORDING_STARTED', {
      started_at: now
    });

    console.log(`Recording started for meeting ${meetId}`);
  }
}

// Stop recording
export async function stopRecording(meetId: string): Promise<void> {
  const now = new Date().toISOString();

  const { error } = await supabase
    .from('meets')
    .update({ recording_stopped_at: now })
    .eq('id', meetId);

  if (error) {
    console.error('Error updating recording stop time:', error);
    return;
  }

  await logMeetingEvent(meetId, 'RECORDING_STOPPED', {
    stopped_at: now
  });
}

// Cancel meeting due to creator no-show (called by scheduled job)
export async function cancelMeetingNoShow(meetId: string): Promise<{ success: boolean; error?: string }> {
  const now = new Date();
  const meeting = await getMeeting(meetId);

  if (!meeting) {
    return { success: false, error: 'Meeting not found' };
  }

  if (meeting.status !== 'scheduled') {
    return { success: false, error: 'Meeting is not in scheduled state' };
  }

  // Update meeting status
  const { error } = await supabase
    .from('meets')
    .update({
      status: 'cancelled_no_show_creator',
      cancelled_at: now.toISOString(),
      cancellation_reason: 'CREATOR_NO_SHOW'
    })
    .eq('id', meetId);

  if (error) {
    console.error('Error cancelling meeting:', error);
    return { success: false, error: 'Failed to cancel meeting' };
  }

  await logMeetingEvent(meetId, 'MEETING_CANCELLED_NO_SHOW_CREATOR', {
    cancelled_at: now.toISOString(),
    scheduled_start: meeting.scheduledAt,
    creator_started_at: meeting.creatorStartedAt,
    fan_joined_at: meeting.fanJoinedAt
  });

  // Log fan join status
  await logMeetingEvent(meetId, 'FAN_JOIN_STATUS_AT_S', {
    fan_joined: meeting.fanJoinedAt !== null,
    fan_joined_at: meeting.fanJoinedAt
  });

  return { success: true };
}

// Issue refund (placeholder - integrate with your payment system)
export async function issueRefund(meetId: string, fanId: string): Promise<{ success: boolean; refundId?: string; error?: string }> {
  // TODO: Integrate with Razorpay or your payment system
  const refundId = `refund_${Date.now()}_${meetId}`;

  const { error } = await supabase
    .from('meets')
    .update({ refund_id: refundId })
    .eq('id', meetId);

  if (error) {
    console.error('Error updating refund ID:', error);
    return { success: false, error: 'Failed to record refund' };
  }

  await logMeetingEvent(meetId, 'REFUND_ISSUED', {
    refund_id: refundId,
    fan_id: fanId,
    issued_at: new Date().toISOString()
  });

  console.log(`Refund ${refundId} issued for meeting ${meetId}`);
  return { success: true, refundId };
}

// Complete meeting at scheduled end time (called by scheduled job)
export async function completeMeetingAtEnd(meetId: string): Promise<{ success: boolean; error?: string }> {
  const now = new Date();
  const meeting = await getMeeting(meetId);

  if (!meeting) {
    return { success: false, error: 'Meeting not found' };
  }

  if (meeting.status === 'cancelled_no_show_creator' || meeting.status === 'cancelled' || meeting.status === 'completed') {
    return { success: false, error: 'Meeting already ended or cancelled' };
  }

  // Stop recording if running
  if (meeting.recordingStartedAt && !meeting.recordingStoppedAt) {
    await stopRecording(meetId);
  }

  // Update meeting status
  const { error } = await supabase
    .from('meets')
    .update({
      status: 'completed',
      completed_at: now.toISOString()
    })
    .eq('id', meetId);

  if (error) {
    console.error('Error completing meeting:', error);
    return { success: false, error: 'Failed to complete meeting' };
  }

  await logMeetingEvent(meetId, 'MEETING_COMPLETED', {
    completed_at: now.toISOString(),
    creator_started_at: meeting.creatorStartedAt,
    creator_joined_at: meeting.creatorJoinedAt,
    fan_joined_at: meeting.fanJoinedAt,
    recording_started_at: meeting.recordingStartedAt,
    recording_stopped_at: meeting.recordingStoppedAt || now.toISOString()
  });

  return { success: true };
}

// Get meeting event logs
export async function getMeetingLogs(meetId: string): Promise<any[]> {
  const { data, error } = await supabase
    .from('meeting_event_logs')
    .select('*')
    .eq('meet_id', meetId)
    .order('timestamp', { ascending: true });

  if (error) {
    console.error('Error fetching meeting logs:', error);
    return [];
  }

  return data || [];
}

// Calculate remaining time for a meeting
export function calculateRemainingTime(meeting: MeetingLifecycleState): number {
  const now = new Date();
  const scheduledEnd = new Date(meeting.scheduledAt);
  scheduledEnd.setMinutes(scheduledEnd.getMinutes() + meeting.durationMinutes);
  
  const remainingMs = scheduledEnd.getTime() - now.getTime();
  return Math.max(0, Math.floor(remainingMs / 1000));
}

// Check if meeting should be active now
export function isMeetingTimeValid(meeting: MeetingLifecycleState): { 
  beforeStart: boolean; 
  duringMeeting: boolean; 
  afterEnd: boolean;
  secondsUntilStart: number;
  secondsUntilEnd: number;
} {
  const now = new Date();
  const scheduledStart = new Date(meeting.scheduledAt);
  const scheduledEnd = new Date(meeting.scheduledAt);
  scheduledEnd.setMinutes(scheduledEnd.getMinutes() + meeting.durationMinutes);

  const secondsUntilStart = Math.floor((scheduledStart.getTime() - now.getTime()) / 1000);
  const secondsUntilEnd = Math.floor((scheduledEnd.getTime() - now.getTime()) / 1000);

  return {
    beforeStart: now < scheduledStart,
    duringMeeting: now >= scheduledStart && now < scheduledEnd,
    afterEnd: now >= scheduledEnd,
    secondsUntilStart,
    secondsUntilEnd
  };
}

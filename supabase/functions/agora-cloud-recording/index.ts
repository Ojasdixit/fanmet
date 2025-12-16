import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const AGORA_APP_ID = Deno.env.get("AGORA_APP_ID") || "";
const AGORA_CUSTOMER_ID = Deno.env.get("AGORA_CUSTOMER_ID") || "";
const AGORA_CUSTOMER_SECRET = Deno.env.get("AGORA_CUSTOMER_SECRET") || "";
const AGORA_RECORDING_UID = Deno.env.get("AGORA_RECORDING_UID") || "10000";
const AGORA_RECORDING_MODE = Deno.env.get("AGORA_RECORDING_MODE") || "composite";
const AGORA_RESOURCE_EXPIRE_HOURS = Number(Deno.env.get("AGORA_RESOURCE_EXPIRE_HOURS") || "24");
const AGORA_STORAGE_VENDOR = Number(Deno.env.get("AGORA_STORAGE_VENDOR") || "0");
const AGORA_STORAGE_REGION = Number(Deno.env.get("AGORA_STORAGE_REGION") || "0");
const AGORA_STORAGE_BUCKET = Deno.env.get("AGORA_STORAGE_BUCKET") || "";
const AGORA_STORAGE_ACCESS_KEY = Deno.env.get("AGORA_STORAGE_ACCESS_KEY") || "";
const AGORA_STORAGE_SECRET_KEY = Deno.env.get("AGORA_STORAGE_SECRET_KEY") || "";
const AGORA_TRIGGER_WEBHOOK = Deno.env.get("AGORA_WEBHOOK_URL") || "";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

if (
  !AGORA_APP_ID ||
  !AGORA_CUSTOMER_ID ||
  !AGORA_CUSTOMER_SECRET ||
  !SUPABASE_URL ||
  !SUPABASE_SERVICE_ROLE_KEY
) {
  console.error("Missing required environment variables for Agora recording edge function.");
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const agoraAuthHeader = "Basic " + btoa(`${AGORA_CUSTOMER_ID}:${AGORA_CUSTOMER_SECRET}`);
const agoraBaseUrl = `https://api.agora.io/v1/apps/${AGORA_APP_ID}/cloud_recording`;

interface MeetingRow {
  id: string;
  meeting_link: string | null;
  recording_resource_id: string | null;
  recording_sid: string | null;
  recording_mode: string | null;
  recording_status: string | null;
  recording_started_at: string | null;
  recording_stopped_at: string | null;
  recording_file_list: any | null;
}

async function agoraRequest(path: string, method: string, body?: Record<string, unknown>) {
  const response = await fetch(`${agoraBaseUrl}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: agoraAuthHeader,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const payload = await response.json();

  if (!response.ok) {
    console.error("Agora API error", response.status, payload);
    throw new Error(payload?.message || payload?.error || "Agora API request failed");
  }

  return payload;
}

async function getMeeting(meetId: string): Promise<MeetingRow | null> {
  const { data, error } = await supabase
    .from("meets")
    .select(
      "id, meeting_link, recording_resource_id, recording_sid, recording_mode, recording_status, recording_started_at, recording_stopped_at, recording_file_list",
    )
    .eq("id", meetId)
    .single();

  if (error) {
    console.error("Failed to fetch meeting", error);
    return null;
  }

  return data as MeetingRow;
}

function buildStorageConfig() {
  if (!AGORA_STORAGE_BUCKET || !AGORA_STORAGE_ACCESS_KEY || !AGORA_STORAGE_SECRET_KEY) {
    throw new Error("Missing Agora storage configuration");
  }

  return {
    vendor: AGORA_STORAGE_VENDOR,
    region: AGORA_STORAGE_REGION,
    bucket: AGORA_STORAGE_BUCKET,
    accessKey: AGORA_STORAGE_ACCESS_KEY,
    secretKey: AGORA_STORAGE_SECRET_KEY,
  };
}

function buildRecordingConfig() {
  return {
    channelType: 0,
    streamTypes: 0,
    maxIdleTime: 30,
    transcodingConfig: {
      width: 1280,
      height: 720,
      fps: 30,
      bitrate: 2400,
      maxResolutionUid: "1",
      mixedVideoLayout: 1,
      backgroundColor: "#000000",
    },
    subscribeVideoUids: ["#allstream#"],
    subscribeAudioUids: ["#allstream#"],
    subscribeUidGroup: 0,
  };
}

async function acquireResource(channelName: string) {
  const acquireBody = {
    cname: channelName,
    uid: AGORA_RECORDING_UID,
    clientRequest: {
      resourceExpiredHour: AGORA_RESOURCE_EXPIRE_HOURS,
    },
  };

  const acquireResp = await agoraRequest("/acquire", "POST", acquireBody);
  return acquireResp.resourceId as string;
}

async function startRecording(meeting: MeetingRow, mode: string) {
  const channelName = meeting.id;
  const resourceId = meeting.recording_resource_id || (await acquireResource(channelName));

  const clientRequest: Record<string, unknown> = {
    recordingConfig: buildRecordingConfig(),
    storageConfig: buildStorageConfig(),
  };

  const recordingToken = Deno.env.get("AGORA_RECORDING_TOKEN");
  if (recordingToken) {
    clientRequest.token = recordingToken;
  }

  const startBody = {
    cname: channelName,
    uid: AGORA_RECORDING_UID,
    clientRequest,
  };

  const startResp = await agoraRequest(`/resourceid/${resourceId}/mode/${mode}/start`, "POST", startBody);
  const sid = startResp.sid as string;

  const updates = {
    recording_resource_id: resourceId,
    recording_sid: sid,
    recording_mode: mode,
    recording_status: "started",
    recording_started_at: new Date().toISOString(),
  };

  const { error } = await supabase.from("meets").update(updates).eq("id", meeting.id);

  if (error) {
    console.error("Failed to persist recording start metadata", error);
    throw new Error("Unable to save recording metadata");
  }

  return { resourceId, sid };
}

async function stopRecording(meeting: MeetingRow) {
  if (!meeting.recording_resource_id || !meeting.recording_sid || !meeting.recording_mode) {
    throw new Error("Recording session not found for meeting");
  }

  const stopResp = await agoraRequest(
    `/resourceid/${meeting.recording_resource_id}/sid/${meeting.recording_sid}/mode/${meeting.recording_mode}/stop`,
    "POST",
    {
      cname: meeting.id,
      uid: AGORA_RECORDING_UID,
      clientRequest: {},
    },
  );

  const serverResponse = stopResp.serverResponse ?? {};
  const fileList = serverResponse.fileList ?? [];
  const firstFile = Array.isArray(fileList) && fileList.length > 0 ? fileList[0] : null;
  const recordingUrl = firstFile?.fileName ? firstFile.fileName : null;

  const updates = {
    recording_status: "stopped",
    recording_stopped_at: new Date().toISOString(),
    recording_file_list: fileList,
    recording_url: recordingUrl,
  };

  const { error } = await supabase.from("meets").update(updates).eq("id", meeting.id);

  if (error) {
    console.error("Failed to update recording stop metadata", error);
    throw new Error("Unable to update meeting recording state");
  }

  return { stopResp, recordingUrl };
}

async function queryRecording(meeting: MeetingRow) {
  if (!meeting.recording_resource_id || !meeting.recording_sid || !meeting.recording_mode) {
    throw new Error("Recording session not found for meeting");
  }

  return await agoraRequest(
    `/resourceid/${meeting.recording_resource_id}/sid/${meeting.recording_sid}/mode/${meeting.recording_mode}/query`,
    "GET",
  );
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { action, meetId, mode } = await req.json();

    if (!action || !meetId) {
      return new Response(JSON.stringify({ error: "Missing action or meetId" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const meeting = await getMeeting(meetId);
    if (!meeting) {
      return new Response(JSON.stringify({ error: "Meeting not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let result: unknown;

    switch (action) {
      case "start": {
        const recordingMode = mode || meeting.recording_mode || AGORA_RECORDING_MODE;
        result = await startRecording(meeting, recordingMode);
        break;
      }
      case "stop": {
        result = await stopRecording(meeting);
        break;
      }
      case "query": {
        result = await queryRecording(meeting);
        break;
      }
      default: {
        return new Response(JSON.stringify({ error: `Unsupported action: ${action}` }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    if (AGORA_TRIGGER_WEBHOOK) {
      fetch(AGORA_TRIGGER_WEBHOOK, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ meetId, action, timestamp: new Date().toISOString(), result }),
      }).catch((err) => console.error("Webhook notification failed", err));
    }

    return new Response(JSON.stringify({ success: true, action, data: result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Agora cloud recording edge function error", message);
    return new Response(JSON.stringify({ success: false, error: message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

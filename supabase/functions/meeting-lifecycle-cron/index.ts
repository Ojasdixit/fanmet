import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Meet {
  id: string;
  event_id: string;
  status: string;
  scheduled_at: string;
  duration_minutes: number;
  creator_id: string;
  fan_id: string;
  creator_started_at: string | null;
  fan_joined_at: string | null;
  recording_started_at: string | null;
  recording_stopped_at: string | null;
}

async function logEvent(
  supabase: any,
  meetId: string,
  eventType: string,
  metadata: Record<string, any> = {}
) {
  await supabase.from("meeting_event_logs").insert({
    meet_id: meetId,
    event_type: eventType,
    timestamp: new Date().toISOString(),
    metadata,
  });
}

interface RefundResult {
  success: boolean;
  refundId: string;
  amount: number;
  error?: string;
}

async function processRefund(supabase: any, meet: Meet): Promise<RefundResult> {
  const refundId = "refund_" + Date.now() + "_" + meet.id;
  const now = new Date().toISOString();
  
  try {
    // 1. Get the event to find the winning bid
    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("winning_bid_id, title")
      .eq("id", meet.event_id)
      .single();

    if (eventError || !event) {
      console.error("Error fetching event for refund:", eventError);
      return { success: false, refundId, amount: 0, error: "Event not found" };
    }

    // 2. Get the winning bid amount
    let bidAmount = 0;
    let bidId = event.winning_bid_id;

    if (bidId) {
      const { data: bid, error: bidError } = await supabase
        .from("bids")
        .select("id, amount, fan_id")
        .eq("id", bidId)
        .single();

      if (!bidError && bid) {
        bidAmount = bid.amount;
      }
    } else {
      // Fallback: find winning bid for this event
      const { data: bids, error: bidsError } = await supabase
        .from("bids")
        .select("id, amount, fan_id")
        .eq("event_id", meet.event_id)
        .eq("status", "won")
        .order("amount", { ascending: false })
        .limit(1);

      if (!bidsError && bids && bids.length > 0) {
        bidAmount = bids[0].amount;
        bidId = bids[0].id;
      }
    }

    if (bidAmount <= 0) {
      console.log("No bid amount to refund for meet " + meet.id);
      return { success: true, refundId, amount: 0 };
    }

    // 3. AUTO-REFUND: Credit 100% back to fan's wallet (creator no-show = full refund)
    let { data: fanWallet } = await supabase
      .from("wallets")
      .select("id, balance")
      .eq("user_id", meet.fan_id)
      .single();

    if (!fanWallet) {
      const { data: newWallet } = await supabase
        .from("wallets")
        .insert({ user_id: meet.fan_id, balance: 0 })
        .select("id, balance")
        .single();
      fanWallet = newWallet;
    }

    if (fanWallet) {
      // Credit full amount to fan wallet
      await supabase
        .from("wallets")
        .update({ 
          balance: fanWallet.balance + bidAmount,
          updated_at: now,
        })
        .eq("id", fanWallet.id);

      // Record wallet transaction
      await supabase.from("wallet_transactions").insert({
        wallet_id: fanWallet.id,
        type: "creator_no_show_refund",
        direction: "credit",
        amount: bidAmount,
        commission_amount: 0,
        commission_type: "no_fee",
        description: "Full refund for \"" + (event.title || "Event") + "\" - Creator no-show",
        reference_table: "meets",
        reference_id: meet.id,
      });
    }

    // 4. Update bid refund status
    if (bidId) {
      await supabase
        .from("bids")
        .update({
          refund_amount: bidAmount,
          refund_status: "refunded",
          refunded_at: now,
        })
        .eq("id", bidId);
    }

    // 5. Send notification to fan
    await supabase.from("notifications").insert({
      user_id: meet.fan_id,
      type: "creator_no_show_refund",
      title: "Full Refund - Creator No-Show",
      message: "The creator did not join your scheduled meeting for \"" + (event.title || "Event") + "\". A full refund of Rs." + bidAmount + " has been credited to your wallet.",
      event_id: meet.event_id,
    });

    console.log("AUTO-REFUND: " + bidAmount + " credited to fan " + meet.fan_id + " wallet");
    return { success: true, refundId, amount: bidAmount };

  } catch (err) {
    const error = err as Error;
    console.error("Error processing refund:", error);
    return { success: false, refundId, amount: 0, error: error.message };
  }
}

async function creditCreatorForCompletedMeeting(supabase: any, meet: Meet): Promise<boolean> {
  const now = new Date().toISOString();
  const PLATFORM_FEE_PERCENT = 10;
  
  try {
    // 1. Get the event and winning bid
    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("winning_bid_id, title")
      .eq("id", meet.event_id)
      .single();

    if (eventError || !event || !event.winning_bid_id) {
      console.log("No winning bid found for meet " + meet.id);
      return false;
    }

    // 2. Get bid amount
    const { data: bid, error: bidError } = await supabase
      .from("bids")
      .select("id, amount")
      .eq("id", event.winning_bid_id)
      .single();

    if (bidError || !bid) {
      console.error("Error fetching bid:", bidError);
      return false;
    }

    // 3. Calculate creator earning (90% after platform fee)
    const creatorEarning = Math.floor(bid.amount * (100 - PLATFORM_FEE_PERCENT) / 100);
    const platformFee = bid.amount - creatorEarning;

    // 4. Get or create creator wallet
    let { data: creatorWallet } = await supabase
      .from("wallets")
      .select("id, balance")
      .eq("user_id", meet.creator_id)
      .single();

    if (!creatorWallet) {
      const { data: newWallet } = await supabase
        .from("wallets")
        .insert({ user_id: meet.creator_id, balance: 0 })
        .select("id, balance")
        .single();
      creatorWallet = newWallet;
    }

    if (creatorWallet) {
      // Credit creator wallet
      await supabase
        .from("wallets")
        .update({ 
          balance: creatorWallet.balance + creatorEarning,
          updated_at: now,
        })
        .eq("id", creatorWallet.id);

      // Record wallet transaction (available for withdrawal after 24 hours)
      const availableAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      await supabase.from("wallet_transactions").insert({
        wallet_id: creatorWallet.id,
        type: "meeting_earning",
        direction: "credit",
        amount: creatorEarning,
        commission_amount: platformFee,
        commission_type: "platform_fee",
        description: "Earnings from completed meeting for \"" + (event.title || "Event") + "\" (90% of Rs." + bid.amount + ")",
        reference_table: "meets",
        reference_id: meet.id,
        available_for_withdrawal_at: availableAt,
      });

      // Notify creator
      await supabase.from("notifications").insert({
        user_id: meet.creator_id,
        type: "meeting_earning",
        title: "Meeting Completed - Earnings Credited!",
        message: "Your meeting for \"" + (event.title || "Event") + "\" completed successfully. Rs." + creatorEarning + " (90%) has been credited to your wallet.",
        event_id: meet.event_id,
      });

      console.log("Creator " + meet.creator_id + " credited Rs." + creatorEarning + " for completed meeting");
      return true;
    }

    return false;
  } catch (err) {
    console.error("Error crediting creator:", err);
    return false;
  }
}

async function checkScheduledStartNoShows(supabase: any) {
  console.log("Checking for creator no-shows at scheduled start time...");
  const now = new Date();

  const { data: meetings, error } = await supabase
    .from("meets")
    .select("*")
    .eq("status", "scheduled")
    .lte("scheduled_at", now.toISOString());

  if (error) {
    console.error("Error fetching meetings:", error);
    return { checked: 0, cancelled: 0 };
  }

  if (!meetings || meetings.length === 0) {
    console.log("No meetings past scheduled start time.");
    return { checked: 0, cancelled: 0 };
  }

  console.log("Found " + meetings.length + " meetings past start time.");
  let cancelledCount = 0;

  for (const meet of meetings as Meet[]) {
    if (!meet.creator_started_at || new Date(meet.creator_started_at) >= new Date(meet.scheduled_at)) {
      console.log("Cancelling meeting " + meet.id + " - creator no-show");

      await supabase
        .from("meets")
        .update({
          status: "cancelled_no_show_creator",
          cancelled_at: now.toISOString(),
          cancellation_reason: "CREATOR_NO_SHOW",
        })
        .eq("id", meet.id);

      await logEvent(supabase, meet.id, "MEETING_CANCELLED_NO_SHOW_CREATOR", {
        cancelled_at: now.toISOString(),
        scheduled_start: meet.scheduled_at,
      });

      await logEvent(supabase, meet.id, "FAN_JOIN_STATUS_AT_S", {
        fan_joined: meet.fan_joined_at !== null,
        fan_joined_at: meet.fan_joined_at,
      });

      // Process refund: mark bid as pending_refund for admin to process
      const refundResult = await processRefund(supabase, meet);
      
      await supabase
        .from("meets")
        .update({ refund_id: refundResult.refundId })
        .eq("id", meet.id);

      await logEvent(supabase, meet.id, "REFUND_ISSUED", {
        refund_id: refundResult.refundId,
        fan_id: meet.fan_id,
        amount: refundResult.amount,
        reason: "CREATOR_NO_SHOW",
        refund_marked: refundResult.success,
      });

      cancelledCount++;
      console.log("Meeting " + meet.id + " cancelled, refund processed: " + refundResult.amount);
    }
  }

  return { checked: meetings.length, cancelled: cancelledCount };
}

async function checkScheduledEndCompletions(supabase: any) {
  console.log("Checking for meetings at scheduled end time...");
  const now = new Date();

  const { data: meetings, error } = await supabase
    .from("meets")
    .select("*")
    .eq("status", "live");

  if (error) {
    console.error("Error fetching live meetings:", error);
    return { checked: 0, completed: 0 };
  }

  if (!meetings || meetings.length === 0) {
    console.log("No live meetings.");
    return { checked: 0, completed: 0 };
  }

  let completedCount = 0;

  for (const meet of meetings as Meet[]) {
    const scheduledEnd = new Date(meet.scheduled_at);
    scheduledEnd.setMinutes(scheduledEnd.getMinutes() + meet.duration_minutes);

    if (now >= scheduledEnd) {
      console.log("Completing meeting " + meet.id + " - reached end time");

      if (meet.recording_started_at && !meet.recording_stopped_at) {
        await supabase
          .from("meets")
          .update({ recording_stopped_at: now.toISOString() })
          .eq("id", meet.id);

        await logEvent(supabase, meet.id, "RECORDING_STOPPED", {
          stopped_at: now.toISOString(),
        });
      }

      await supabase
        .from("meets")
        .update({
          status: "completed",
          completed_at: now.toISOString(),
        })
        .eq("id", meet.id);

      // Credit creator earnings (90% of bid amount)
      const credited = await creditCreatorForCompletedMeeting(supabase, meet);

      await logEvent(supabase, meet.id, "MEETING_COMPLETED", {
        completed_at: now.toISOString(),
        creator_started_at: meet.creator_started_at,
        fan_joined_at: meet.fan_joined_at,
        recording_started_at: meet.recording_started_at,
        creator_credited: credited,
      });

      completedCount++;
      console.log("Meeting " + meet.id + " completed, creator credited: " + credited);
    }
  }

  return { checked: meetings.length, completed: completedCount };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log("=== Meeting Lifecycle Check @ " + new Date().toISOString() + " ===");

    const noShowResults = await checkScheduledStartNoShows(supabase);
    const completionResults = await checkScheduledEndCompletions(supabase);

    const result = {
      success: true,
      timestamp: new Date().toISOString(),
      noShowCheck: noShowResults,
      completionCheck: completionResults,
    };

    console.log("=== Check complete ===", result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err) {
    const error = err as Error;
    console.error("Error in meeting lifecycle check:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});

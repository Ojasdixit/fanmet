import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const RAZORPAY_KEY_ID = Deno.env.get("RAZORPAY_KEY_ID") || "";
const RAZORPAY_KEY_SECRET = Deno.env.get("RAZORPAY_KEY_SECRET") || "";

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

interface EventRow {
  id: string;
  creator_id: string;
  starts_at: string;
  duration_minutes: number;
  bidding_closes_at: string | null;
  meeting_link: string | null;
  status: string;
  is_paid: boolean;
}

async function refundLosingBidders(supabase: any, eventId: string, winnerBidId: string | null) {
  const now = new Date().toISOString();
  const REFUND_PERCENT = 90;

  try {
    // Get ALL active bids for this event EXCEPT the winner
    let query = supabase
      .from("bids")
      .select("id, fan_id, amount")
      .eq("event_id", eventId)
      .eq("status", "active");

    if (winnerBidId) {
      query = query.neq("id", winnerBidId);
    }

    const { data: losingBids, error: bidsError } = await query;

    if (bidsError) {
      console.error("Error fetching losing bids for event " + eventId + ":", bidsError);
      return { refunded: 0, failed: 0 };
    }

    if (!losingBids || losingBids.length === 0) {
      console.log("No losing bids to refund for event " + eventId);
      return { refunded: 0, failed: 0 };
    }

    console.log("Found " + losingBids.length + " losing bid(s) to refund for event " + eventId);

    let refundedCount = 0;
    let failedCount = 0;

    for (const bid of losingBids) {
      try {
        console.log("Processing losing bid " + bid.id + " (fan: " + bid.fan_id + ", amount: Rs." + bid.amount + ")");

        // Mark bid as lost
        const { error: lostError } = await supabase
          .from("bids")
          .update({ status: "lost" })
          .eq("id", bid.id);
        if (lostError) console.error("Error marking bid " + bid.id + " as lost:", lostError);

        // Find the Razorpay payment for this bid
        const { data: payment, error: paymentError } = await supabase
          .from("bid_payments")
          .select("razorpay_payment_id, amount")
          .eq("bid_id", bid.id)
          .eq("status", "paid")
          .maybeSingle();

        console.log("Bid " + bid.id + " payment lookup: found=" + !!payment + ", payment_id=" + (payment?.razorpay_payment_id || "none") + ", error=" + (paymentError ? JSON.stringify(paymentError) : "none"));

        if (paymentError || !payment || !payment.razorpay_payment_id) {
          // Fallback: find by event_id + fan_id (amount may differ from bid.amount since
          // bid increments now charge only the increment, not the cumulative total)
          console.log("Trying fallback payment lookup for bid " + bid.id + "...");
          const { data: fallbackPayment } = await supabase
            .from("bid_payments")
            .select("razorpay_payment_id, amount")
            .eq("event_id", eventId)
            .eq("fan_id", bid.fan_id)
            .eq("status", "paid")
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();

          if (!fallbackPayment || !fallbackPayment.razorpay_payment_id) {
            console.error("No Razorpay payment found for bid " + bid.id + " (fan: " + bid.fan_id + ", amount: " + bid.amount + ")");
            failedCount++;
            await supabase
              .from("bids")
              .update({ refund_status: "failed" })
              .eq("id", bid.id);
            continue;
          }

          // Use fallback payment
          await processRazorpayRefund(supabase, bid, fallbackPayment, eventId, REFUND_PERCENT, now);
          refundedCount++;
          continue;
        }

        await processRazorpayRefund(supabase, bid, payment, eventId, REFUND_PERCENT, now);
        refundedCount++;
      } catch (err) {
        console.error("Error refunding bid " + bid.id + ":", err);
        failedCount++;
        await supabase
          .from("bids")
          .update({ refund_status: "failed" })
          .eq("id", bid.id);
      }
    }

    console.log("Refund results for event " + eventId + ": refunded=" + refundedCount + ", failed=" + failedCount);
    return { refunded: refundedCount, failed: failedCount };
  } catch (err) {
    console.error("Error in refundLosingBidders:", err);
    return { refunded: 0, failed: 0 };
  }
}

async function processRazorpayRefund(
  supabase: any,
  bid: { id: string; fan_id: string; amount: number },
  payment: { razorpay_payment_id: string; amount: number },
  eventId: string,
  refundPercent: number,
  now: string
) {
  // Calculate refund based on the ACTUAL payment amount (not bid.amount which is cumulative total).
  // payment.amount is the real rupees charged for this specific transaction.
  const refundAmountRupees = Math.floor(payment.amount * refundPercent / 100);
  const refundAmountPaise = refundAmountRupees * 100;

  if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
    throw new Error("Razorpay credentials not configured");
  }

  const authHeader = "Basic " + btoa(RAZORPAY_KEY_ID + ":" + RAZORPAY_KEY_SECRET);

  // Step 1: Fetch payment details from Razorpay to verify status
  console.log("Fetching payment status from Razorpay: payment_id=" + payment.razorpay_payment_id);
  const paymentStatusRes = await fetch(
    "https://api.razorpay.com/v1/payments/" + payment.razorpay_payment_id,
    {
      method: "GET",
      headers: { "Authorization": authHeader },
    }
  );

  if (!paymentStatusRes.ok) {
    const errBody = await paymentStatusRes.text();
    console.error("Failed to fetch payment " + payment.razorpay_payment_id + " from Razorpay: status=" + paymentStatusRes.status + ", body=" + errBody);
    throw new Error("Could not fetch payment from Razorpay: " + paymentStatusRes.status);
  }

  const paymentInfo = await paymentStatusRes.json();
  console.log("Payment " + payment.razorpay_payment_id + " status=" + paymentInfo.status + ", amount=" + paymentInfo.amount + " paise");

  // Step 2: If payment is only authorized (not captured), capture it first
  if (paymentInfo.status === "authorized") {
    console.log("Payment is authorized but not captured. Capturing payment first...");
    const captureRes = await fetch(
      "https://api.razorpay.com/v1/payments/" + payment.razorpay_payment_id + "/capture",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": authHeader,
        },
        body: JSON.stringify({ amount: paymentInfo.amount, currency: "INR" }),
      }
    );

    if (!captureRes.ok) {
      const captureErr = await captureRes.json();
      console.error("Failed to capture payment " + payment.razorpay_payment_id + ":", captureErr);
      throw new Error("Payment capture failed: " + (captureErr.error?.description || JSON.stringify(captureErr)));
    }

    const captureData = await captureRes.json();
    console.log("Payment captured successfully: status=" + captureData.status);
  } else if (paymentInfo.status !== "captured") {
    // Payment is in an unexpected state (failed, refunded, etc.)
    console.error("Payment " + payment.razorpay_payment_id + " is in non-refundable state: " + paymentInfo.status);
    throw new Error("Payment is in state '" + paymentInfo.status + "' and cannot be refunded");
  }

  // Step 3: Ensure refund amount doesn't exceed captured amount
  const capturedAmountPaise = paymentInfo.amount;
  const actualRefundPaise = Math.min(refundAmountPaise, capturedAmountPaise);
  const actualRefundRupees = Math.floor(actualRefundPaise / 100);

  console.log("Calling Razorpay refund API: payment_id=" + payment.razorpay_payment_id + ", refund_amount_paise=" + actualRefundPaise + " (" + refundPercent + "% of Rs." + payment.amount + ", capped at captured=" + capturedAmountPaise + ")");

  // Step 4: Issue the refund
  const refundResponse = await fetch(
    "https://api.razorpay.com/v1/payments/" + payment.razorpay_payment_id + "/refund",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": authHeader,
      },
      body: JSON.stringify({
        amount: actualRefundPaise,
        speed: "normal",
        notes: {
          reason: "losing_bid_partial_refund",
          bid_id: bid.id,
          event_id: eventId,
          refund_percent: String(refundPercent),
        },
      }),
    }
  );

  const refundData = await refundResponse.json();

  if (!refundResponse.ok) {
    console.error("Razorpay refund failed for payment " + payment.razorpay_payment_id + ": status=" + refundResponse.status + ", error=", refundData);
    await supabase
      .from("bids")
      .update({
        refund_status: "failed",
        refunded_at: now,
      })
      .eq("id", bid.id);
    throw new Error("Razorpay refund API error: " + (refundData.error?.description || refundData.description || JSON.stringify(refundData)));
  }

  console.log("Razorpay refund created: refund_id=" + refundData.id + ", amount=" + refundData.amount + " paise, initial_status=" + refundData.status);

  // Step 5: Verify refund status by fetching it from Razorpay
  const verifyRes = await fetch(
    "https://api.razorpay.com/v1/refunds/" + refundData.id,
    { method: "GET", headers: { "Authorization": authHeader } }
  );
  const verifyData = verifyRes.ok ? await verifyRes.json() : null;
  const finalRefundStatus = verifyData?.status || refundData.status;

  // Accept any non-failed status: processed, refunded, pending, initiated are all valid
  if (finalRefundStatus === "failed") {
    console.error("Razorpay refund failed. Status: " + finalRefundStatus);
    await supabase
      .from("bids")
      .update({
        refund_status: "failed",
        refund_amount: 0,
        refunded_at: now,
      })
      .eq("id", bid.id);
    throw new Error("Refund status is 'failed' after verification");
  }

  console.log("Razorpay refund VERIFIED: refund_id=" + refundData.id + ", status=" + finalRefundStatus);

  // Update bid with refund details
  await supabase
    .from("bids")
    .update({
      refund_amount: actualRefundRupees,
      refund_status: "completed",
      refunded_at: now,
    })
    .eq("id", bid.id);

  // Get event title for notification
  const { data: eventData } = await supabase
    .from("events")
    .select("title")
    .eq("id", eventId)
    .maybeSingle();

  // Send notification to losing bidder
  await supabase.from("notifications").insert({
    user_id: bid.fan_id,
    type: "bid_refund",
    title: "Bid Refund Processed",
    message: "You did not win the auction for \"" + (eventData?.title || "Event") + "\". A refund of Rs." + actualRefundRupees + " (" + refundPercent + "% of your bid) has been initiated to your original payment method.",
    event_id: eventId,
  });
}

async function finalizeExpiredEvents(supabase: any) {
  console.log("Checking for events past bidding deadline...");
  const nowIso = new Date().toISOString();

  const { data: events, error } = await supabase
    .from("events")
    .select("id, creator_id, starts_at, duration_minutes, bidding_closes_at, meeting_link, status, is_paid")
    .in("status", ["upcoming", "live"])
    .lte("bidding_closes_at", nowIso);

  if (error) {
    console.error("Error fetching expired events:", error);
    return { finalized: 0 };
  }

  if (!events || events.length === 0) {
    console.log("No events past bidding deadline.");
    return { finalized: 0 };
  }

  let finalized = 0;

  for (const event of events as EventRow[]) {
    // Find highest active bid
    const { data: bids, error: bidsError } = await supabase
      .from("bids")
      .select("id, fan_id, amount")
      .eq("event_id", event.id)
      .eq("status", "active")
      .order("amount", { ascending: false })
      .limit(1);

    if (bidsError) {
      console.error("Error fetching bids for event", event.id, bidsError);
      continue;
    }

    const winnerBid = bids && bids.length > 0 ? bids[0] : null;

    if (winnerBid) {
      // Mark winning bid
      await supabase
        .from("bids")
        .update({ status: "won" })
        .eq("id", winnerBid.id);

      // Create meet for winner — ensure scheduled_at is in the future
      const eventStartTime = new Date(event.starts_at);
      const nowTime = new Date();
      const minScheduledAt = new Date(nowTime.getTime() + 5 * 60 * 1000); // at least 5 min from now
      const scheduledAt = eventStartTime > nowTime ? event.starts_at : minScheduledAt.toISOString();
      if (eventStartTime <= nowTime) {
        console.warn("Event " + event.id + " starts_at (" + event.starts_at + ") is in the past. Using future scheduled_at: " + scheduledAt);
      }

      const { error: meetError } = await supabase.from("meets").insert({
        event_id: event.id,
        creator_id: event.creator_id,
        fan_id: winnerBid.fan_id,
        scheduled_at: scheduledAt,
        duration_minutes: event.duration_minutes,
        meeting_link: event.meeting_link,
        status: "scheduled",
      });

      if (meetError) {
        console.error("Error creating meet for event", event.id, meetError);
      } else {
        // Create an initial welcome message so the chat room appears for both creator and fan
        const { data: newMeet } = await supabase
          .from("meets")
          .select("id")
          .eq("event_id", event.id)
          .eq("fan_id", winnerBid.fan_id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (newMeet) {
          const { error: msgError } = await supabase.from("messages").insert({
            sender_id: event.creator_id,
            receiver_id: winnerBid.fan_id,
            message: "Hey! I'm excited for our upcoming FanMeet. Feel free to reach out if you have any questions!",
            meet_id: newMeet.id,
            event_id: event.id,
          });

          if (msgError) {
            console.error("Error creating welcome message for meet", newMeet.id, msgError);
          } else {
            console.log("Welcome message created for meet", newMeet.id);
          }
        }
      }

      // Get event title for notification
      const { data: eventInfo } = await supabase
        .from("events")
        .select("title")
        .eq("id", event.id)
        .maybeSingle();

      const eventTitle = eventInfo?.title || "Event";

      // Notify winner fan
      const { error: winnerNotifError } = await supabase.from("notifications").insert({
        user_id: winnerBid.fan_id,
        type: "bid_won",
        title: "🎉 You Won!",
        message: "Congratulations! You won the auction for \"" + eventTitle + "\" with a bid of Rs." + winnerBid.amount + ". Your meeting has been scheduled. Check your Upcoming Meets for the meeting link.",
        event_id: event.id,
      });
      if (winnerNotifError) {
        console.error("FAILED to send bid_won notification to fan " + winnerBid.fan_id + " for event " + event.id + ":", winnerNotifError);
      } else {
        console.log("Sent bid_won notification to fan " + winnerBid.fan_id + " for event " + event.id);
      }

      // Notify creator
      const { error: creatorNotifError } = await supabase.from("notifications").insert({
        user_id: event.creator_id,
        type: "event_finalized",
        title: "Auction Closed",
        message: "The auction for \"" + eventTitle + "\" has closed. The winning bid is Rs." + winnerBid.amount + ". Check your Upcoming Meets to start the session.",
        event_id: event.id,
      });
      if (creatorNotifError) {
        console.error("FAILED to send event_finalized notification to creator " + event.creator_id + " for event " + event.id + ":", creatorNotifError);
      } else {
        console.log("Sent event_finalized notification to creator " + event.creator_id + " for event " + event.id);
      }
    } else if (event.is_paid) {
      console.log("No bids for paid event", event.id, "- skipping meet creation");
    }

    // Update event status and winning bid reference
    await supabase
      .from("events")
      .update({ status: "completed", winning_bid_id: winnerBid?.id ?? null })
      .eq("id", event.id);

    // AFTER bidding is closed and winner determined, refund 90% to all losing bidders via Razorpay
    const refundResults = await refundLosingBidders(supabase, event.id, winnerBid?.id ?? null);
    console.log("Event " + event.id + " refund results:", refundResults);

    finalized += 1;
  }

  console.log("Auto-finalized events:", finalized);
  return { finalized };
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
  razorpayRefunded?: boolean;
  razorpayRefundError?: string;
  refundErrors?: string;
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
      // Fallback 1: find winning bid by status=won for this event
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
        console.log("processRefund fallback1: found won bid " + bidId + " amount=" + bidAmount);
      } else {
        // Fallback 2: find any active/won bid for the meet's fan (handles cases where bids were never marked won)
        const { data: fanBids } = await supabase
          .from("bids")
          .select("id, amount, fan_id")
          .eq("event_id", meet.event_id)
          .eq("fan_id", meet.fan_id)
          .in("status", ["active", "won", "lost"])
          .order("amount", { ascending: false })
          .limit(1);

        if (fanBids && fanBids.length > 0) {
          bidAmount = fanBids[0].amount;
          bidId = fanBids[0].id;
          console.log("processRefund fallback2: found bid by fan_id=" + meet.fan_id + ", bid=" + bidId + ", amount=" + bidAmount);
        } else {
          console.warn("processRefund: no bid found for meet " + meet.id + " (event=" + meet.event_id + ", fan=" + meet.fan_id + ")");
        }
      }
    }

    if (!bidId) {
      console.log("No winning bid found for meet " + meet.id);
      return { success: true, refundId, amount: 0 };
    }

    // 3. Find ALL payments made by the winning fan for this event
    const { data: allPayments, error: paymentsError } = await supabase
      .from("bid_payments")
      .select("id, razorpay_payment_id, amount, bid_id")
      .eq("event_id", meet.event_id)
      .eq("fan_id", meet.fan_id)
      .eq("status", "paid");

    if (paymentsError) {
      console.error("Error fetching payments for refund:", paymentsError);
      return { success: false, refundId, amount: 0, error: "Payment lookup failed" };
    }

    const validPayments = (allPayments || []).filter((p: any) => p.razorpay_payment_id);
    if (validPayments.length === 0) {
      console.warn("No bid_payments found for fan " + meet.fan_id + " event " + meet.event_id);
      return { success: true, refundId, amount: 0 };
    }

    // 4. Refund each payment individually (100% of each payment amount)
    let totalRefundAmount = 0;
    let refundedCount = 0;
    let failedCount = 0;
    let refundErrors: string[] = [];

    if (RAZORPAY_KEY_ID && RAZORPAY_KEY_SECRET) {
      const authHeader = "Basic " + btoa(RAZORPAY_KEY_ID + ":" + RAZORPAY_KEY_SECRET);

      for (const payment of validPayments) {
        try {
          const paymentRefundAmountPaise = payment.amount * 100;

          // Check payment status
          const paymentStatusRes = await fetch(
            "https://api.razorpay.com/v1/payments/" + payment.razorpay_payment_id,
            { method: "GET", headers: { "Authorization": authHeader } }
          );
          const paymentInfo = paymentStatusRes.ok ? await paymentStatusRes.json() : null;

          if (!paymentInfo || (paymentInfo.status !== "captured" && paymentInfo.status !== "authorized")) {
            console.error("Payment " + payment.razorpay_payment_id + " not refundable: status=" + (paymentInfo?.status || "unknown"));
            failedCount++;
            refundErrors.push("Payment " + payment.razorpay_payment_id + " not refundable");
            continue;
          }

          // Capture if authorized
          if (paymentInfo.status === "authorized") {
            await fetch(
              "https://api.razorpay.com/v1/payments/" + payment.razorpay_payment_id + "/capture",
              {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": authHeader },
                body: JSON.stringify({ amount: paymentInfo.amount, currency: "INR" }),
              }
            );
          }

          // Issue full refund for this payment
          const refundResponse = await fetch(
            "https://api.razorpay.com/v1/payments/" + payment.razorpay_payment_id + "/refund",
            {
              method: "POST",
              headers: { "Content-Type": "application/json", "Authorization": authHeader },
              body: JSON.stringify({
                amount: Math.min(paymentRefundAmountPaise, paymentInfo.amount),
                speed: "normal",
                notes: {
                  reason: "creator_no_show_refund_100_percent",
                  bid_id: String(payment.bid_id),
                  event_id: meet.event_id,
                  meet_id: meet.id,
                  refund_percent: "100",
                },
              }),
            }
          );
          const refundData = await refundResponse.json();

          if (refundResponse.ok && refundData.id) {
            // Verify refund status
            const verifyRes = await fetch(
              "https://api.razorpay.com/v1/refunds/" + refundData.id,
              { method: "GET", headers: { "Authorization": authHeader } }
            );
            const verifyData = verifyRes.ok ? await verifyRes.json() : null;
            const finalStatus = verifyData?.status || refundData.status;

            if (finalStatus === "failed") {
              console.error("Refund failed for payment " + payment.razorpay_payment_id);
              failedCount++;
              refundErrors.push("Refund failed for payment " + payment.razorpay_payment_id);
            } else {
              console.log("Refunded payment " + payment.razorpay_payment_id + ": Rs." + payment.amount);
              totalRefundAmount += payment.amount;
              refundedCount++;
            }
          } else {
            console.error("Refund API failed for payment " + payment.razorpay_payment_id + ":", refundData);
            failedCount++;
            refundErrors.push(refundData.error?.description || "Refund API error");
          }
        } catch (rzErr: any) {
          console.error("Error refunding payment " + payment.razorpay_payment_id + ":", rzErr);
          failedCount++;
          refundErrors.push(rzErr.message || String(rzErr));
        }
      }
    }

    const razorpayRefunded = refundedCount > 0 && failedCount === 0;
    const dbRefundStatus = failedCount > 0 ? (refundedCount > 0 ? "partial" : "failed") : "completed";

    // Update all winning bids with refund status
    const { data: winningBids } = await supabase
      .from("bids")
      .select("id")
      .eq("event_id", meet.event_id)
      .eq("fan_id", meet.fan_id)
      .in("status", ["active", "won"]);

    for (const wb of (winningBids || [])) {
      await supabase
        .from("bids")
        .update({
          refund_amount: totalRefundAmount,
          refund_status: dbRefundStatus,
          refunded_at: now,
        })
        .eq("id", wb.id);
    }

    // 5. Send notification to fan
    const refundErrorMsg = refundErrors.length > 0 ? " (Issues: " + refundErrors.join("; ") + ")" : "";
    const notificationMessage = razorpayRefunded
      ? "The creator did not join your scheduled meeting for \"" + (event.title || "Event") + "\". A full refund of Rs." + totalRefundAmount + " has been processed to your original payment method."
      : "The creator did not join your scheduled meeting for \"" + (event.title || "Event") + "\". We could not process your full refund automatically." + refundErrorMsg;

    await supabase.from("notifications").insert({
      user_id: meet.fan_id,
      type: "creator_no_show_refund",
      title: razorpayRefunded ? "Full Refund Processed" : "Refund Failed - Contact Support",
      message: notificationMessage,
      event_id: meet.event_id,
    });

    console.log("No-show refund result: bid=" + bidId + ", status=" + dbRefundStatus + ", total_refunded=" + totalRefundAmount + ", payments=" + refundedCount + "/" + (refundedCount + failedCount));
    return { success: razorpayRefunded, refundId: refundId, amount: totalRefundAmount, razorpayRefunded, refundErrors: refundErrors.join("; ") };

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

    // 2. Get winning bid to find the fan_id
    const { data: bid, error: bidError } = await supabase
      .from("bids")
      .select("id, amount, fan_id")
      .eq("id", event.winning_bid_id)
      .single();

    if (bidError || !bid) {
      console.error("Error fetching bid:", bidError);
      return false;
    }

    // 3. Sum ALL payments made by the winning fan for this event
    const { data: allPayments, error: paymentsError } = await supabase
      .from("bid_payments")
      .select("amount")
      .eq("event_id", meet.event_id)
      .eq("fan_id", bid.fan_id)
      .eq("status", "paid");

    if (paymentsError) {
      console.error("Error fetching payments for creator payout:", paymentsError);
      return false;
    }

    const totalPaid = (allPayments || []).reduce((sum: number, p: any) => sum + (p.amount || 0), 0);

    // 4. Calculate creator earning (90% after platform fee) based on TOTAL payments
    const creatorEarning = Math.floor(totalPaid * (100 - PLATFORM_FEE_PERCENT) / 100);
    const platformFee = totalPaid - creatorEarning;
    console.log("Creator payout: total_paid=" + totalPaid + ", creator_earning=" + creatorEarning + ", platform_fee=" + platformFee);

    // 5. Get or create creator wallet
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
        description: "Earnings from completed meeting for \"" + (event.title || "Event") + "\" (90% of Rs." + totalPaid + ")",
        reference_table: "meets",
        reference_id: meet.id,
        available_for_withdrawal_at: availableAt,
      });

      // Notify creator
      await supabase.from("notifications").insert({
        user_id: meet.creator_id,
        type: "meeting_earning",
        title: "Meeting Completed - Earnings Credited!",
        message: "Your meeting for \"" + (event.title || "Event") + "\" completed successfully. Rs." + creatorEarning + " (90% of total Rs." + totalPaid + ") has been credited to your wallet.",
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

    const biddingResults = await finalizeExpiredEvents(supabase);
    const noShowResults = await checkScheduledStartNoShows(supabase);
    const completionResults = await checkScheduledEndCompletions(supabase);

    const result = {
      success: true,
      timestamp: new Date().toISOString(),
      biddingFinalize: biddingResults,
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

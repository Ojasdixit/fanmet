import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const RAZORPAY_KEY_ID = Deno.env.get("RAZORPAY_KEY_ID") || "";
const RAZORPAY_KEY_SECRET = Deno.env.get("RAZORPAY_KEY_SECRET") || "";
const REFUND_PERCENT = 90;

async function processRazorpayRefund(payment: { razorpay_payment_id: string; amount: number }, bidId: string, fanId: string, eventId: string): Promise<boolean> {
  const authHeader = "Basic " + btoa(RAZORPAY_KEY_ID + ":" + RAZORPAY_KEY_SECRET);
  const paymentRes = await fetch("https://api.razorpay.com/v1/payments/" + payment.razorpay_payment_id, { method: "GET", headers: { "Authorization": authHeader } });
  if (!paymentRes.ok) throw new Error("Could not fetch payment: " + paymentRes.status);
  const paymentInfo = await paymentRes.json();

  if (paymentInfo.status === "authorized") {
    const captureRes = await fetch("https://api.razorpay.com/v1/payments/" + payment.razorpay_payment_id + "/capture", {
      method: "POST", headers: { "Content-Type": "application/json", "Authorization": authHeader },
      body: JSON.stringify({ amount: paymentInfo.amount, currency: "INR" }),
    });
    if (!captureRes.ok) { const e = await captureRes.json(); throw new Error("Capture failed: " + (e.error?.description || JSON.stringify(e))); }
  } else if (paymentInfo.status !== "captured") {
    throw new Error("Payment in non-refundable state: " + paymentInfo.status);
  }

  const actualRefundPaise = Math.min(Math.floor(payment.amount * REFUND_PERCENT / 100) * 100, paymentInfo.amount);
  const refundRes = await fetch("https://api.razorpay.com/v1/payments/" + payment.razorpay_payment_id + "/refund", {
    method: "POST", headers: { "Content-Type": "application/json", "Authorization": authHeader },
    body: JSON.stringify({ amount: actualRefundPaise, speed: "normal", notes: { reason: "losing_bid_partial_refund", bid_id: bidId, fan_id: fanId, event_id: eventId, refund_percent: String(REFUND_PERCENT) } }),
  });
  const refundData = await refundRes.json();
  if (!refundRes.ok) throw new Error("Razorpay refund error: " + (refundData.error?.description || JSON.stringify(refundData)));
  console.log("Refund created: " + refundData.id + " amount_paise=" + refundData.amount);
  return true;
}

async function refundLosingBidders(supabase: any, eventId: string, winnerFanId: string | null, eventTitle: string) {
  const now = new Date().toISOString();
  // Fetch ALL bids regardless of status. Losing fans' bids are marked 'outbid' by the
  // update_outbid_status trigger, so identifying losers by status='active' misses them.
  // Identify losers by FAN (everyone except the winning fan) and refund 90% of ALL their payments.
  const { data: allBids } = await supabase.from("bids").select("id, fan_id, amount").eq("event_id", eventId);
  const losingBids = (allBids || []).filter((b: any) => b.fan_id !== winnerFanId);

  if (losingBids.length === 0) { console.log("No losing bids for event " + eventId); return { refunded: 0, failed: 0 }; }

  const losingBidIds = losingBids.map((b: any) => b.id);
  await supabase.from("bids").update({ status: "lost" }).in("id", losingBidIds);

  // Group by fan_id — process each fan exactly once for ALL their bids/payments
  const fanBidMap = new Map<string, string[]>();
  for (const bid of losingBids) {
    const arr = fanBidMap.get(bid.fan_id);
    if (arr) arr.push(bid.id); else fanBidMap.set(bid.fan_id, [bid.id]);
  }

  console.log("Refunding " + fanBidMap.size + " losing fan(s) for event " + eventId);
  let refundedCount = 0, failedCount = 0;

  for (const [fanId, bidIds] of fanBidMap) {
    try {
      const { data: allPayments } = await supabase.from("bid_payments").select("id, razorpay_payment_id, amount")
        .eq("event_id", eventId).eq("fan_id", fanId).eq("status", "paid");
      const validPayments = (allPayments || []).filter((p: any) => p.razorpay_payment_id);

      if (validPayments.length === 0) {
        console.error("No payments for fan " + fanId + " event " + eventId);
        await supabase.from("bids").update({ refund_status: "failed" }).in("id", bidIds);
        failedCount++; continue;
      }

      let paymentRefunded = 0, paymentFailed = 0, totalRefundRupees = 0;
      const refundErrors: string[] = [];

      for (const payment of validPayments) {
        try {
          await processRazorpayRefund(payment, bidIds[0], fanId, eventId);
          paymentRefunded++;
          totalRefundRupees += Math.floor(payment.amount * REFUND_PERCENT / 100);
        } catch (err: any) {
          console.error("Refund failed for " + payment.razorpay_payment_id + ":", err.message);
          paymentFailed++; refundErrors.push(err.message || String(err));
        }
      }

      const dbRefundStatus = paymentFailed > 0 ? (paymentRefunded > 0 ? "partial" : "failed") : "completed";
      await supabase.from("bids").update({ refund_amount: totalRefundRupees, refund_status: dbRefundStatus, refunded_at: now }).in("id", bidIds);

      const allFailed = paymentFailed > 0 && paymentRefunded === 0;
      const errSuffix = refundErrors.length > 0 ? " (Issues: " + refundErrors.join("; ") + ")" : "";
      await supabase.from("notifications").insert({
        user_id: fanId, type: "bid_refund",
        title: allFailed ? "Refund Failed - Contact Support" : "Bid Refund Processed",
        message: allFailed
          ? "We could not process your refund for \"" + eventTitle + "\"." + errSuffix
          : "You did not win the auction for \"" + eventTitle + "\". A refund of \u20b9" + totalRefundRupees + " (" + REFUND_PERCENT + "% of your total payments) has been initiated." + errSuffix,
        event_id: eventId,
      });

      refundedCount += paymentRefunded; failedCount += paymentFailed;
    } catch (err) {
      console.error("Error refunding fan " + fanId + ":", err);
      await supabase.from("bids").update({ refund_status: "failed" }).in("id", bidIds);
      failedCount++;
    }
  }
  return { refunded: refundedCount, failed: failedCount };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    if (!req.headers.get("Authorization")) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { eventId } = await req.json();
    if (!eventId) return new Response(JSON.stringify({ error: "eventId required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { data: event, error: eventError } = await supabase.from("events").select("*").eq("id", eventId).single();
    if (eventError || !event) return new Response(JSON.stringify({ error: "Event not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    // Get highest active bid
    const { data: topBids } = await supabase.from("bids").select("id, fan_id, amount").eq("event_id", eventId).eq("status", "active").order("amount", { ascending: false }).limit(1);
    const winnerBid = topBids && topBids.length > 0 ? topBids[0] : null;

    if (winnerBid) {
      await supabase.from("bids").update({ status: "won" }).eq("id", winnerBid.id);

      const { data: existingMeet } = await supabase.from("meets").select("id").eq("event_id", eventId).maybeSingle();
      if (!existingMeet) {
        const nowTime = new Date();
        const eventStartTime = new Date(event.starts_at);
        const scheduledAt = eventStartTime > nowTime ? event.starts_at : new Date(nowTime.getTime() + 5 * 60 * 1000).toISOString();

        const { data: newMeetData, error: meetErr } = await supabase.from("meets").insert({
          event_id: eventId, creator_id: event.creator_id, fan_id: winnerBid.fan_id,
          scheduled_at: scheduledAt, duration_minutes: event.duration_minutes,
          meeting_link: event.meeting_link, status: "scheduled",
        }).select("id").single();

        if (!meetErr && newMeetData) {
          await supabase.from("messages").insert({ sender_id: event.creator_id, receiver_id: winnerBid.fan_id, message: "Hey! I'm excited for our upcoming FanMeet. Feel free to reach out if you have any questions!", meet_id: newMeetData.id, event_id: eventId });
          await supabase.from("notifications").insert({ user_id: winnerBid.fan_id, type: "bid_won", title: "\uD83C\uDF89 You Won!", message: "Congratulations! You won the auction for \"" + event.title + "\" with a bid of \u20b9" + winnerBid.amount + ". Check your Upcoming Meets.", event_id: eventId });
          await supabase.from("notifications").insert({ user_id: event.creator_id, type: "event_finalized", title: "Auction Closed", message: "The auction for \"" + event.title + "\" has closed. Winning bid: \u20b9" + winnerBid.amount + ". Check your Upcoming Meets.", event_id: eventId });
        }
      }
    }

    await supabase.from("events").update({ status: "completed", winning_bid_id: winnerBid?.id ?? null }).eq("id", eventId);

    // Refund ALL losing bidders — 90% of every payment they made
    const refundResults = await refundLosingBidders(supabase, eventId, winnerBid?.fan_id ?? null, event.title);
    console.log("finalize-event refunds for " + eventId + ":", refundResults);

    return new Response(JSON.stringify({ success: true, winnerFanId: winnerBid?.fan_id ?? null, winnerAmount: winnerBid?.amount ?? null, refunds: refundResults }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err: any) {
    console.error("finalize-event error:", err);
    return new Response(JSON.stringify({ error: err.message || "Internal server error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});

// Setup for Deno environment types
declare const Deno: {
    env: { get(key: string): string | undefined };
    serve(handler: (req: Request) => Promise<Response> | Response): void;
};

import { createClient } from "@supabase/supabase-js";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const jsonResponse = (body: Record<string, unknown>, status = 200) =>
    new Response(JSON.stringify(body), {
        status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

const RAZORPAY_KEY_ID = Deno.env.get('RAZORPAYX_TEST_API_KEY');
const RAZORPAY_KEY_SECRET = Deno.env.get('RAZORPAYX_TEST_SECRET_KEY');
const RAZORPAY_ACCOUNT_NUMBER = Deno.env.get('RAZORPAY_X_ACCOUNT_NUMBER');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

Deno.serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    let parsedRequestId: string | null = null;

    try {
        const { withdrawal_request_id } = await req.json();

        if (!withdrawal_request_id) {
            throw new Error("Missing withdrawal_request_id");
        }

        parsedRequestId = withdrawal_request_id;

        // 1. Fetch Request Details
        const { data: request, error: reqError } = await supabaseClient
            .from('withdrawal_requests')
            .select('*, profiles:creator_id(razorpay_fund_account_id)')
            .eq('id', withdrawal_request_id)
            .single();

        if (reqError || !request) {
            throw new Error('Invalid withdrawal request or not found');
        }

        if (request.status !== 'pending') {
            return new Response(
                JSON.stringify({ message: 'Request already processed', status: request.status }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // @ts-ignore: profiles is an object from the join
        const fundAccountId = request.profiles?.razorpay_fund_account_id;
        if (!fundAccountId) {
            throw new Error('Creator has no linked fund account (razorpay_fund_account_id missing)');
        }

        const markFailed = async (note: string) => {
            await supabaseClient
                .from('withdrawal_requests')
                .update({
                    status: 'failed',
                    admin_notes: note,
                    processed_at: null
                })
                .eq('id', request.id);
        };

        if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET || !RAZORPAY_ACCOUNT_NUMBER) {
            console.error("Missing Razorpay Keys in Environment");
            await markFailed('Razorpay X credentials missing – payout skipped');
            return jsonResponse({
                success: false,
                error: "Payout keys not configured. Please add Razorpay X credentials in Supabase.",
                retryable: true
            });
        }

        // 2. Create Payout via Razorpay X
        const authHeader = `Basic ${btoa(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`)}`;

        const payload = {
            account_number: RAZORPAY_ACCOUNT_NUMBER,
            fund_account_id: fundAccountId,
            amount: request.amount * 100, // Amount in paise
            currency: "INR",
            mode: "IMPS",
            purpose: "payout",
            queue_if_low_balance: true,
            reference_id: request.id,
            narration: "FanMeet Earnings"
        };

        console.log("Initiating Payout:", JSON.stringify(payload));

        const payoutResp = await fetch('https://api.razorpay.com/v1/payouts', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': authHeader
            },
            body: JSON.stringify(payload)
        });

        const payoutData = await payoutResp.json();

        if (!payoutResp.ok) {
            console.error("Razorpay Error:", payoutData);

            await markFailed(`Razorpay Error: ${payoutData.error?.description || 'Unknown'}`);

            return jsonResponse({
                success: false,
                error: payoutData.error?.description || 'Payout failed at Razorpay',
                retryable: true
            });
        }

        // 3. Update Status to Completed
        const { error: updateError } = await supabaseClient
            .from('withdrawal_requests')
            .update({
                status: 'completed',
                processed_at: new Date().toISOString(),
                admin_notes: `Payout ID: ${payoutData.id}`
            })
            .eq('id', request.id);

        if (updateError) {
            console.error("Failed to update status after payout:", updateError);
        }

        return jsonResponse({ success: true, payout_id: payoutData.id });

    } catch (error: any) {
        console.error("Edge Function Error:", error);
        if (parsedRequestId) {
            try {
                await supabaseClient
                    .from('withdrawal_requests')
                    .update({
                        status: 'failed',
                        admin_notes: `Edge function error: ${error.message}`,
                        processed_at: null
                    })
                    .eq('id', parsedRequestId);
            } catch {
                // ignore secondary failure
            }
        }
        return jsonResponse({
            success: false,
            error: error?.message || 'Unexpected payout error',
            retryable: true
        });
    }
});

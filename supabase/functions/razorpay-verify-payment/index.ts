import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { crypto } from 'https://deno.land/std@0.177.0/crypto/mod.ts';

const RAZORPAY_KEY_SECRET = Deno.env.get('RAZORPAY_KEY_SECRET');

interface VerifyPaymentRequest {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

async function generateHmacSha256(message: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const messageData = encoder.encode(message);

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageData);
  return Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

serve(async (req: Request) => {
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Verify JWT
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature }: VerifyPaymentRequest = await req.json();

    // Validate required fields
    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: razorpay_payment_id, razorpay_order_id, razorpay_signature' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!RAZORPAY_KEY_SECRET) {
      return new Response(
        JSON.stringify({ error: 'Razorpay key secret not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate signature using HMAC-SHA256
    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = await generateHmacSha256(body, RAZORPAY_KEY_SECRET);

    // Compare signatures
    const isValid = expectedSignature === razorpay_signature;

    if (!isValid) {
      return new Response(
        JSON.stringify({ error: 'Invalid signature', valid: false }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch payment details from Razorpay
    const response = await fetch(`https://api.razorpay.com/v1/payments/${razorpay_payment_id}`, {
      headers: {
        'Authorization': `Basic ${btoa(`${Deno.env.get('RAZORPAY_KEY_ID')}:${RAZORPAY_KEY_SECRET}`)}`,
      },
    });

    let paymentDetails = null;
    if (response.ok) {
      paymentDetails = await response.json();
    }

    return new Response(
      JSON.stringify({
        valid: true,
        payment_id: razorpay_payment_id,
        order_id: razorpay_order_id,
        status: paymentDetails?.status || 'captured',
        amount: paymentDetails?.amount,
        method: paymentDetails?.method,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error verifying payment:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', message: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

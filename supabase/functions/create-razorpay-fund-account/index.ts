// This is a stub for the 'create-razorpay-fund-account' Edge Function.
// In a real deployment, you would deploy this to Supabase Functions.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const RAZORPAY_KEY_ID = Deno.env.get('RAZORPAYX_TEST_API_KEY')
const RAZORPAY_KEY_SECRET = Deno.env.get('RAZORPAYX_TEST_SECRET_KEY')

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' } })
    }

    try {
        const { name, ifsc, account_number, upi_id } = await req.json()

        // Validation
        if (!name || (!account_number && !upi_id)) {
            throw new Error("Missing required bank details")
        }

        const authHeader = `Basic ${btoa(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`)}`

        // 1. Create Contact
        const contactResp = await fetch('https://api.razorpay.com/v1/contacts', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': authHeader
            },
            body: JSON.stringify({
                name: name,
                type: 'employee', // or 'vendor'
                reference_id: `creator_${Date.now()}`,
                notes: { source: 'fanmeet_creator' }
            })
        })

        const contactData = await contactResp.json()
        if (!contactResp.ok) throw new Error(contactData.error?.description || 'Failed to create contact')

        // 2. Create Fund Account
        const fundPayload = upi_id
            ? {
                contact_id: contactData.id,
                account_type: 'vpa',
                vpa: { address: upi_id }
            }
            : {
                contact_id: contactData.id,
                account_type: 'bank_account',
                bank_account: {
                    name: name,
                    ifsc: ifsc,
                    account_number: account_number
                }
            }

        const fundResp = await fetch('https://api.razorpay.com/v1/fund_accounts', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': authHeader
            },
            body: JSON.stringify(fundPayload)
        })

        const fundData = await fundResp.json()
        if (!fundResp.ok) throw new Error(fundData.error?.description || 'Failed to create fund account')

        return new Response(
            JSON.stringify({ fund_account_id: fundData.id, contact_id: contactData.id }),
            { headers: { "Content-Type": "application/json", 'Access-Control-Allow-Origin': '*' } },
        )
    } catch (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 400, headers: { "Content-Type": "application/json", 'Access-Control-Allow-Origin': '*' } },
        )
    }
})

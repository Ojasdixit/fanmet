import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_ANON_KEY") ?? "",
            {
                global: {
                    headers: { Authorization: req.headers.get("Authorization")! },
                },
            }
        );

        // 1. Check if the caller is an admin
        const {
            data: { user },
        } = await supabaseClient.auth.getUser();

        if (!user) {
            throw new Error("Not authenticated");
        }

        // Check role in users table (assuming 'admin' role is stored there)
        const { data: userProfile, error: profileError } = await supabaseClient
            .from("users")
            .select("role")
            .eq("id", user.id)
            .single();

        if (profileError || !userProfile || userProfile.role !== "admin") {
            throw new Error("Unauthorized: Only admins can perform this action");
        }

        // 2. Get target user ID from body
        const { targetUserId } = await req.json();

        if (!targetUserId) {
            throw new Error("targetUserId is required");
        }

        // 3. Initialize Admin Client
        const supabaseAdmin = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
        );

        // 4. Get target user's email
        const { data: targetUser, error: targetUserError } = await supabaseAdmin.auth.admin.getUserById(
            targetUserId
        );

        if (targetUserError || !targetUser.user) {
            throw new Error("Target user not found");
        }

        const email = targetUser.user.email;
        if (!email) {
            throw new Error("Target user has no email");
        }

        // 5. Generate Magic Link
        const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
            type: "magiclink",
            email: email,
        });

        if (linkError) {
            throw linkError;
        }

        // Return the action link
        return new Response(
            JSON.stringify({
                actionLink: linkData.properties.action_link,
            }),
            {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 200,
            }
        );
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400,
        });
    }
});

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  );

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? "",
  );

  try {
    // Verify the user is authenticated
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");
    const token = authHeader.replace("Bearer ", "");
    const { data: authData, error: authError } = await supabaseClient.auth.getUser(token);
    if (authError) {
      console.error("Auth error:", authError.message);
      throw new Error("Authentication failed: " + authError.message);
    }
    const user = authData.user;
    if (!user) throw new Error("User not authenticated");
    console.log("User authenticated:", user.id);

    const { session_id } = await req.json();
    if (!session_id) throw new Error("session_id is required");
    console.log("Session ID:", session_id);
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Retrieve the checkout session from Stripe
    const session = await stripe.checkout.sessions.retrieve(session_id);

    if (session.payment_status !== "paid") {
      return new Response(
        JSON.stringify({ error: "Payment not completed" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 },
      );
    }

    const userId = session.metadata?.user_id;
    const runDateId = session.metadata?.run_date_id;

    if (!userId || !runDateId) {
      throw new Error("Missing metadata on Stripe session");
    }

    // Verify the authenticated user matches the session user
    if (userId !== user.id) {
      throw new Error("User mismatch");
    }

    // Check if booking already exists for this session (idempotent)
    const { data: existing } = await supabaseAdmin
      .from("bookings")
      .select("id")
      .eq("stripe_payment_intent_id", session.payment_intent as string)
      .maybeSingle();

    if (existing) {
      return new Response(
        JSON.stringify({ booking_id: existing.id, already_existed: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
      );
    }

    // Create the booking using admin client to bypass RLS
    const { data: booking, error: insertError } = await supabaseAdmin
      .from("bookings")
      .insert({
        user_id: userId,
        run_date_id: runDateId,
        status: "confirmed",
        stripe_payment_intent_id: session.payment_intent as string,
      })
      .select("id")
      .single();

    if (insertError) throw insertError;

    // Fetch run date details for the notification
    const { data: runDate } = await supabaseAdmin
      .from("run_dates")
      .select("date, time, meeting_point")
      .eq("id", runDateId)
      .single();

    const dateLabel = runDate
      ? new Date(runDate.date).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })
      : "your selected date";

    // Create booking confirmation notification
    await supabaseAdmin.from("notifications").insert({
      user_id: userId,
      title: "Booking confirmed 🎉",
      body: `You're booked in for ${dateLabel} at ${runDate?.meeting_point ?? "the meeting point"}. Your crew will be matched 48h before the run.`,
    });

    return new Response(
      JSON.stringify({ booking_id: booking.id, already_existed: false }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

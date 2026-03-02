import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const CANCELLATION_FEE_PENCE = 500; // £5

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
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data: authData } = await supabaseClient.auth.getUser(token);
    const user = authData.user;
    if (!user) throw new Error("User not authenticated");

    const { booking_id } = await req.json();
    if (!booking_id) throw new Error("booking_id is required");

    // Fetch the booking with run_date info
    const { data: booking, error: fetchErr } = await supabaseAdmin
      .from("bookings")
      .select("*, run_dates(*)")
      .eq("id", booking_id)
      .single();

    if (fetchErr || !booking) throw new Error("Booking not found");
    if (booking.user_id !== user.id) throw new Error("Not your booking");
    if (booking.status !== "confirmed") throw new Error("Booking is not active");

    const runDate = booking.run_dates;
    if (!runDate) throw new Error("Run date not found");

    // Calculate time until run
    const runStart = new Date(`${runDate.date}T${runDate.time}Z`);
    const now = new Date();
    const hoursUntil = (runStart.getTime() - now.getTime()) / (1000 * 60 * 60);
    const isWithin48Hours = hoursUntil < 48;

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    const paymentIntentId = booking.stripe_payment_intent_id;
    if (!paymentIntentId) throw new Error("No payment intent found for this booking");

    // Retrieve the payment intent to get the amount paid
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    const amountPaid = paymentIntent.amount; // in pence

    let refundAmount: number;
    let cancellationFeeApplied = false;

    if (isWithin48Hours) {
      // Deduct £5 cancellation fee
      refundAmount = Math.max(0, amountPaid - CANCELLATION_FEE_PENCE);
      cancellationFeeApplied = true;
    } else {
      // Full refund
      refundAmount = amountPaid;
    }

    // Issue the refund via Stripe
    if (refundAmount > 0) {
      await stripe.refunds.create({
        payment_intent: paymentIntentId,
        amount: refundAmount,
      });
    }

    // Update booking status to cancelled
    await supabaseAdmin
      .from("bookings")
      .update({ status: "cancelled" })
      .eq("id", booking_id);

    // Create cancellation confirmation notification
    const dateLabel = new Date(runDate.date).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
    const refundText = refundAmount > 0 ? ` A refund of £${(refundAmount / 100).toFixed(2)} is on its way.` : "";
    const feeText = cancellationFeeApplied ? ` A £${(CANCELLATION_FEE_PENCE / 100).toFixed(2)} cancellation fee was applied.` : "";

    await supabaseAdmin.from("notifications").insert({
      user_id: user.id,
      title: "Booking cancelled",
      body: `Your booking for ${dateLabel} has been cancelled.${refundText}${feeText}`,
    });

    return new Response(
      JSON.stringify({
        success: true,
        refund_amount_pence: refundAmount,
        cancellation_fee_applied: cancellationFeeApplied,
        cancellation_fee_pence: cancellationFeeApplied ? CANCELLATION_FEE_PENCE : 0,
      }),
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

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

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? "",
  );

  try {
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    if (!user?.email) throw new Error("User not authenticated");

    const { run_date_id, discount_code } = await req.json();
    if (!run_date_id) throw new Error("run_date_id is required");

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Find or create Stripe customer
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId: string | undefined;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    }

    // Validate discount code if provided
    let discounts: Stripe.Checkout.SessionCreateParams.Discount[] | undefined;
    if (discount_code && discount_code.trim()) {
      try {
        const promotionCodes = await stripe.promotionCodes.list({
          code: discount_code.trim(),
          active: true,
          limit: 1,
        });
        if (promotionCodes.data.length > 0) {
          discounts = [{ promotion_code: promotionCodes.data[0].id }];
        } else {
          return new Response(
            JSON.stringify({ error: "Invalid or expired discount code" }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 },
          );
        }
      } catch {
        return new Response(
          JSON.stringify({ error: "Could not validate discount code" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 },
        );
      }
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [{ price: "price_1T6XNlCxDZXB6o7143Z6iSvn", quantity: 1 }],
      mode: "payment",
      ui_mode: "embedded",
      discounts,
      allow_promotion_codes: !discounts ? true : undefined,
      return_url: `${req.headers.get("origin")}/booking/success?session_id={CHECKOUT_SESSION_ID}`,
      metadata: {
        user_id: user.id,
        run_date_id,
      },
    });

    return new Response(JSON.stringify({ clientSecret: session.client_secret }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

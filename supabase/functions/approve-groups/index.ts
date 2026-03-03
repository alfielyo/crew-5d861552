import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    // Parse body first
    let bodyJson: { run_date_id?: string } = {};
    try {
      bodyJson = await req.json();
    } catch {
      throw new Error("Invalid or missing JSON body");
    }
    const { run_date_id } = bodyJson;
    if (!run_date_id) throw new Error("run_date_id is required");

    // Verify caller is admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");
    const token = authHeader.replace("Bearer ", "");

    const { data: authData, error: authErr } = await supabaseAdmin.auth.getUser(token);
    if (authErr || !authData.user) throw new Error("Not authenticated");
    const user = authData.user;

    // Check admin role
    const { data: roleRow } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleRow) throw new Error("Forbidden: admin only");

    // Fetch all pending groups for this run date
    const { data: groups, error: gErr } = await supabaseAdmin
      .from("run_groups")
      .select(`
        id,
        name,
        run_group_members ( user_id )
      `)
      .eq("run_date_id", run_date_id)
      .eq("status", "pending");
    if (gErr) throw gErr;

    if (!groups || groups.length === 0) {
      throw new Error("No pending groups found for this run date");
    }

    // Fetch run date details for notification content
    const { data: runDate } = await supabaseAdmin
      .from("run_dates")
      .select("date, time, meeting_point")
      .eq("id", run_date_id)
      .single();
    const dateLabel = runDate
      ? new Date(runDate.date).toLocaleDateString("en-GB", {
          weekday: "short",
          day: "numeric",
          month: "short",
        })
      : "your run date";

    // Approve all groups and notify members
    for (const group of groups) {
      await supabaseAdmin
        .from("run_groups")
        .update({
          status: "approved",
          approved_at: new Date().toISOString(),
          approved_by: user.id,
        })
        .eq("id", group.id);

      const notifications = (group.run_group_members ?? []).map((m: any) => ({
        user_id: m.user_id,
        title: "Your crew is ready! 🏃",
        body: `You've been matched into ${group.name} for ${dateLabel}. Open the app to meet your crew, view your route, and chat!`,
      }));

      if (notifications.length > 0) {
        await supabaseAdmin.from("notifications").insert(notifications);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        groups_approved: groups.length,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

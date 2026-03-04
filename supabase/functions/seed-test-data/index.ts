import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const TEST_EMAIL_DOMAIN = "crew-test.dev";
const TEST_EMAIL_PREFIX = "testuser";
const TEST_PASSWORD = "CrewTest2026!"; // uniform password for all test accounts

// Exact interest strings from src/pages/Onboarding.tsx
const INTERESTS: string[] = [
  "Reading", "Music", "Cooking", "Socialising", "Education", "Technology",
  "Gaming", "Photography", "Fitness", "Self Improvement", "Politics", "Entrepreneurship",
];

// ── Helpers ───────────────────────────────────────────────

function randomDOB(): string {
  const currentYear = new Date().getFullYear();
  const year = currentYear - 18 - Math.floor(Math.random() * 23); // ages 18–40
  const month = String(Math.floor(Math.random() * 12) + 1).padStart(2, "0");
  const day = String(Math.floor(Math.random() * 28) + 1).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function randomInterests(): string[] {
  const shuffled = [...INTERESTS].sort(() => Math.random() - 0.5);
  const count = 2 + Math.floor(Math.random() * 3); // 2–4 interests
  return shuffled.slice(0, count);
}

function testEmail(index: number): string {
  return `${TEST_EMAIL_PREFIX}+${index}@${TEST_EMAIL_DOMAIN}`;
}

// ── Handler ───────────────────────────────────────────────

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  const respond = (body: object, status = 200) =>
    new Response(JSON.stringify(body), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status,
    });

  try {
    // Validate caller is admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");
    const token = authHeader.replace("Bearer ", "");
    const { data: authData, error: authErr } = await supabaseAdmin.auth.getUser(token);
    if (authErr || !authData.user) throw new Error("Not authenticated");

    const { data: roleRow } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", authData.user.id)
      .eq("role", "admin")
      .maybeSingle();
    if (!roleRow) throw new Error("Forbidden: admin only");

    // Parse body
    let body: any = {};
    try { body = await req.json(); } catch { /* empty body */ }

    // ── CLEAR ACTION ─────────────────────────────────────
    if (body.action === "clear") {
      // Find all test user accounts by email pattern
      let allUsers: any[] = [];
      let page = 1;
      while (true) {
        const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers({
          page,
          perPage: 1000,
        });
        if (error) throw error;
        allUsers = allUsers.concat(users);
        if (users.length < 1000) break;
        page++;
      }

      const testUsers = allUsers.filter((u) =>
        u.email?.endsWith(`@${TEST_EMAIL_DOMAIN}`)
      );

      if (testUsers.length === 0) {
        return respond({ success: true, users_deleted: 0, message: "No test users found." });
      }

      const testUserIds = testUsers.map((u) => u.id);

      // Delete in dependency order:
      // group_messages → run_group_members → run_groups → bookings → profiles → auth users

      // 1. Delete group_messages authored by test users
      await supabaseAdmin
        .from("group_messages")
        .delete()
        .in("user_id", testUserIds);

      // 2. Remove test users from any group memberships
      await supabaseAdmin
        .from("run_group_members")
        .delete()
        .in("user_id", testUserIds);

      // 3. Delete notifications for test users
      await supabaseAdmin
        .from("notifications")
        .delete()
        .in("user_id", testUserIds);

      // 4. Delete bookings for test users
      await supabaseAdmin
        .from("bookings")
        .delete()
        .in("user_id", testUserIds);

      // 5. Delete profiles
      await supabaseAdmin
        .from("profiles")
        .delete()
        .in("id", testUserIds);

      // 6. Delete auth users
      for (const userId of testUserIds) {
        await supabaseAdmin.auth.admin.deleteUser(userId);
      }

      // 7. Clean up any run_groups that now have zero members
      const { data: emptyGroups } = await supabaseAdmin
        .from("run_groups")
        .select(`
          id,
          run_group_members ( id )
        `)
        .eq("status", "pending");

      const emptyGroupIds = (emptyGroups ?? [])
        .filter((g: any) => g.run_group_members.length === 0)
        .map((g: any) => g.id);

      if (emptyGroupIds.length > 0) {
        await supabaseAdmin
          .from("run_groups")
          .delete()
          .in("id", emptyGroupIds);
      }

      return respond({ success: true, users_deleted: testUserIds.length });
    }

    // ── SEED ACTION (default) ─────────────────────────────
    const { run_date_id, names } = body;
    if (!run_date_id) throw new Error("run_date_id is required");
    if (!Array.isArray(names) || names.length === 0) throw new Error("names array is required");

    // Check for existing test users to avoid duplicates
    const { data: existingTestBookings } = await supabaseAdmin
      .from("bookings")
      .select("user_id")
      .eq("run_date_id", run_date_id);

    const existingProfileIds = new Set(
      (existingTestBookings ?? []).map((b: any) => b.user_id)
    );

    let usersCreated = 0;
    const errors: string[] = [];

    // Pre-fetch existing users once to avoid repeated listUsers calls
    let allExistingUsers: any[] = [];
    let page = 1;
    while (true) {
      const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers({
        page,
        perPage: 1000,
      });
      if (error) throw error;
      allExistingUsers = allExistingUsers.concat(users);
      if (users.length < 1000) break;
      page++;
    }

    for (let i = 0; i < names.length; i++) {
      const email = testEmail(i + 1);
      const fullName = names[i];

      try {
        const alreadyExists = allExistingUsers.find((u) => u.email === email);

        let userId: string;

        if (alreadyExists) {
          userId = alreadyExists.id;
        } else {
          // Create auth user
          const { data: newUser, error: createErr } =
            await supabaseAdmin.auth.admin.createUser({
              email,
              password: TEST_PASSWORD,
              email_confirm: true,
              user_metadata: { full_name: fullName },
            });

          if (createErr) {
            errors.push(`User ${i + 1}: ${createErr.message}`);
            continue;
          }

          userId = newUser.user.id;

          // Upsert profile with test data
          await supabaseAdmin.from("profiles").upsert({
            id: userId,
            full_name: fullName,
            date_of_birth: randomDOB(),
            personality_answers: {
              interests: randomInterests(),
            },
            has_consented: true,
            has_onboarded: true,
          });
        }

        // Create confirmed booking if one doesn't already exist
        if (!existingProfileIds.has(userId)) {
          const { error: bookingErr } = await supabaseAdmin
            .from("bookings")
            .insert({
              user_id: userId,
              run_date_id,
              status: "confirmed",
            });

          if (bookingErr && !bookingErr.message.includes("duplicate")) {
            errors.push(`Booking for ${fullName}: ${bookingErr.message}`);
            continue;
          }
        }

        usersCreated++;
      } catch (err: any) {
        errors.push(`User ${i + 1}: ${err.message}`);
      }
    }

    return respond({
      success: true,
      users_created: usersCreated,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (err: any) {
    return respond({ error: err.message }, 500);
  }
});

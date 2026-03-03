import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// ── Matching algorithm ──────────────────────────────────────
type Participant = {
  user_id: string;
  age: number;
  interests: string[];
};

function getAge(dobString: string | null): number {
  if (!dobString) return 30;
  try {
    const dob = new Date(dobString);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
    return isNaN(age) ? 30 : age;
  } catch {
    return 30;
  }
}

function similarity(a: Participant, b: Participant): number {
  const sharedInterests = a.interests.filter((i) =>
    b.interests.includes(i)
  ).length;
  const ageDiff = Math.abs(a.age - b.age);
  const ageBracketMatch = ageDiff <= 10 ? 1 : 0;
  return sharedInterests * 2 + ageBracketMatch;
}

function greedyGroup(
  participants: Participant[],
  minSize = 6,
  maxSize = 8
): Participant[][] {
  if (participants.length === 0) return [];

  const pool = [...participants].sort(() => Math.random() - 0.5);
  const groups: Participant[][] = [];
  const used = new Set<string>();

  for (const seed of pool) {
    if (used.has(seed.user_id)) continue;

    const group: Participant[] = [seed];
    used.add(seed.user_id);

    const candidates = pool
      .filter((p) => !used.has(p.user_id))
      .map((p) => ({
        participant: p,
        score: group.reduce((sum, g) => sum + similarity(g, p), 0),
      }))
      .sort((a, b) => b.score - a.score);

    for (const { participant } of candidates) {
      if (group.length >= maxSize) break;
      group.push(participant);
      used.add(participant.user_id);
    }

    groups.push(group);
  }

  return mergeSmallGroups(groups, minSize, maxSize);
}

function mergeSmallGroups(
  groups: Participant[][],
  minSize: number,
  maxSize: number
): Participant[][] {
  const result: Participant[][] = [];
  const small: Participant[] = [];

  for (const g of groups) {
    if (g.length >= minSize) {
      result.push(g);
    } else {
      small.push(...g);
    }
  }

  for (const p of small) {
    const target = result.find((g) => g.length < maxSize);
    if (target) {
      target.push(p);
    } else {
      result.push([p]);
    }
  }

  return result.filter((g) => g.length > 0);
}

// ── Handler ─────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  const ok = (body: object) =>
    new Response(JSON.stringify(body), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  const err = (msg: string, status = 500) =>
    new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status,
    });

  try {
    // Accept optional run_date_id override (for manual admin trigger)
    const body = req.method === "POST" ? await req.json().catch(() => ({})) : {};
    const overrideRunDateId: string | undefined = body.run_date_id;

    // Find run_dates that are ~48 hours away and have no matching_run record
    let targetRunDateIds: string[] = [];

    if (overrideRunDateId) {
      targetRunDateIds = [overrideRunDateId];
    } else {
      const now = new Date();
      const windowStart = new Date(now.getTime() + 47 * 60 * 60 * 1000);
      const windowEnd = new Date(now.getTime() + 49 * 60 * 60 * 1000);

      const { data: runDates, error: rdErr } = await supabaseAdmin
        .from("run_dates")
        .select("id, date, time")
        .gte("date", windowStart.toISOString().split("T")[0])
        .lte("date", windowEnd.toISOString().split("T")[0]);

      if (rdErr) throw rdErr;

      for (const rd of runDates ?? []) {
        const runStart = new Date(`${rd.date}T${rd.time}Z`);
        if (runStart >= windowStart && runStart <= windowEnd) {
          targetRunDateIds.push(rd.id);
        }
      }
    }

    if (targetRunDateIds.length === 0) {
      return ok({ message: "No run dates require matching at this time.", processed: 0 });
    }

    const results: Record<string, { groups_created: number; participants: number }> = {};

    for (const runDateId of targetRunDateIds) {
      // Idempotency: skip if already matched (unless override)
      if (!overrideRunDateId) {
        const { data: existing } = await supabaseAdmin
          .from("matching_runs")
          .select("id")
          .eq("run_date_id", runDateId)
          .maybeSingle();

        if (existing) {
          results[runDateId] = { groups_created: 0, participants: 0 };
          continue;
        }
      }

      // Fetch confirmed bookings with profile data
      const { data: bookings, error: bErr } = await supabaseAdmin
        .from("bookings")
        .select(`
          user_id,
          profiles:user_id (
            date_of_birth,
            personality_answers
          )
        `)
        .eq("run_date_id", runDateId)
        .eq("status", "confirmed");

      if (bErr) throw bErr;
      if (!bookings || bookings.length === 0) {
        results[runDateId] = { groups_created: 0, participants: 0 };
        continue;
      }

      // Build participant objects
      const participants: Participant[] = bookings.map((b: any) => {
        const profile = b.profiles ?? {};
        const pa = profile.personality_answers ?? {};
        return {
          user_id: b.user_id,
          age: getAge(profile.date_of_birth ?? null),
          interests: Array.isArray(pa.interests) ? pa.interests : [],
        };
      });

      // Run matching algorithm
      const groups = greedyGroup(participants);

      // Persist groups — delete any existing pending groups first (re-run safety)
      await supabaseAdmin
        .from("run_groups")
        .delete()
        .eq("run_date_id", runDateId)
        .eq("status", "pending");

      for (let i = 0; i < groups.length; i++) {
        const groupLabel = String.fromCharCode(65 + i); // A, B, C...

        const { data: newGroup, error: gErr } = await supabaseAdmin
          .from("run_groups")
          .insert({
            run_date_id: runDateId,
            name: `Crew ${groupLabel}`,
            status: "pending",
          })
          .select("id")
          .single();

        if (gErr) throw gErr;

        const members = groups[i].map((p) => ({
          run_group_id: newGroup.id,
          user_id: p.user_id,
        }));

        const { error: mErr } = await supabaseAdmin
          .from("run_group_members")
          .insert(members);

        if (mErr) throw mErr;
      }

      // Record matching run (idempotency log)
      await supabaseAdmin.from("matching_runs").upsert(
        {
          run_date_id: runDateId,
          status: "completed",
          groups_created: groups.length,
        },
        { onConflict: "run_date_id" }
      );

      results[runDateId] = {
        groups_created: groups.length,
        participants: participants.length,
      };
    }

    return ok({ success: true, results });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return err(msg);
  }
});

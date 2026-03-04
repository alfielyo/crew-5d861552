import { supabase } from "@/integrations/supabase/client";

// ── Constants ─────────────────────────────────────────────
// Exact interest strings from src/pages/Onboarding.tsx
const INTERESTS: string[] = [
  "Reading", "Music", "Cooking", "Socialising", "Education", "Technology",
  "Gaming", "Photography", "Fitness", "Self Improvement", "Politics", "Entrepreneurship",
];

const TEST_EMAIL_DOMAIN = "crew-test.dev";
const TEST_EMAIL_PREFIX = "testuser";

// 50 realistic UK first + last name combinations
const TEST_NAMES: string[] = [
  "Alex Morgan", "Jamie Clarke", "Sam Patel", "Jordan Ellis", "Casey Brooks",
  "Morgan Davies", "Riley Shah", "Taylor Bennett", "Avery Khan", "Reece Cooper",
  "Frankie Hughes", "Billie Okafor", "Charlie Foster", "Stevie Nwosu", "Robbie Patel",
  "Ash Griffiths", "Quinn Mensah", "Elliot Osei", "Darcy Walsh", "Hayden Byrne",
  "Blake Nkosi", "Emerson Diallo", "Addison Clarke", "Remy Okonkwo", "Sage Thompson",
  "Logan Adeyemi", "Finley Olu", "River Bannister", "Sasha Obi", "Drew Kamara",
  "Cody Mensah", "Kai Abara", "Jude Lawson", "Skye Oduya", "Ellis Musa",
  "Rowan Amara", "Harley Ejike", "Flynn Achebe", "Marlowe Eze", "Luca Asante",
  "Nico Babatunde", "Tate Chukwu", "Zara Osei", "Bryn Nwofor", "Orla Kalu",
  "Beau Ibe", "Wynne Okolie", "Rory Anyanwu", "Piper Nwosu", "Scout Obi",
];

// ── Seed Function ─────────────────────────────────────────

export async function seedTestData(
  onProgress: (message: string) => void
): Promise<{ success: boolean; error?: string; runDateId?: string }> {
  try {
    // 1. Find or create a run_date ~47 hours from now (inside the matching window)
    onProgress("Finding upcoming run date…");

    const now = new Date();
    const targetTime = new Date(now.getTime() + 47 * 60 * 60 * 1000);
    const targetDate = targetTime.toISOString().split("T")[0];
    const targetTimeStr = targetTime.toTimeString().slice(0, 8); // HH:MM:SS

    let runDateId: string;

    const { data: existingRunDate } = await supabase
      .from("run_dates")
      .select("id, date")
      .gte("date", new Date().toISOString().split("T")[0])
      .order("date", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (existingRunDate) {
      runDateId = existingRunDate.id;
      onProgress(`Using existing run date: ${existingRunDate.date}`);
    } else {
      // Create a run date 47h from now — this requires admin/service access.
      const { data: newRunDate, error: rdErr } = await supabase
        .from("run_dates")
        .insert({
          date: targetDate,
          time: targetTimeStr,
          meeting_point: "The Bandstand, Battersea Park",
          price_pence: 1200,
        })
        .select("id")
        .single();

      if (rdErr) {
        return {
          success: false,
          error: `No upcoming run date found and could not create one automatically. Please create a run date manually in the admin panel first, then re-run the seed. (${rdErr.message})`,
        };
      }

      runDateId = newRunDate.id;
      onProgress(`Created new run date: ${targetDate} at ${targetTimeStr}`);
    }

    // 2. Create 50 test users via edge function (requires service role key)
    onProgress("Creating 50 test users…");

    const { data: seedResult, error: seedErr } = await supabase.functions.invoke(
      "seed-test-data",
      {
        body: { run_date_id: runDateId, names: TEST_NAMES },
      }
    );

    if (seedErr || seedResult?.error) {
      return {
        success: false,
        error: seedErr?.message ?? seedResult?.error,
      };
    }

    onProgress(`✓ ${seedResult.users_created} test users created and booked.`);
    return { success: true, runDateId };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// ── Clear Function ────────────────────────────────────────

export async function clearTestData(
  onProgress: (message: string) => void
): Promise<{ success: boolean; error?: string }> {
  try {
    onProgress("Clearing test data…");

    const { data: result, error } = await supabase.functions.invoke(
      "seed-test-data",
      { body: { action: "clear" } }
    );

    if (error || result?.error) {
      return { success: false, error: error?.message ?? result?.error };
    }

    onProgress(`✓ Removed ${result.users_deleted} test users and all related records.`);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

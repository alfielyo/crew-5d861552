import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type GroupMember = {
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
};

export type RouteWaypoint = {
  order: number;
  label: string;
  lat: number;
  lng: number;
};

export type MyGroupData = {
  group_id: string;
  group_name: string;
  run_date_id: string;
  run_date: string;
  run_time: string;
  meeting_point: string;
  members: GroupMember[];
  route: {
    id: string;
    name: string;
    distance_km: number;
    meeting_point: string;
    post_run_cafe: string;
    waypoints: RouteWaypoint[];
  } | null;
};

export function useMyGroup(runDateId?: string) {
  return useQuery({
    queryKey: ["my-group", runDateId],
    enabled: !!runDateId,
    queryFn: async (): Promise<MyGroupData | null> => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return null;

      // Step 1: find all groups the user is a member of for this run date
      const { data: memberships } = await supabase
        .from("run_group_members")
        .select(`
          run_group_id,
          run_groups!inner (
            id,
            name,
            status,
            run_date_id
          )
        `)
        .eq("user_id", user.id)
        .eq("run_groups.run_date_id", runDateId!);

      if (!memberships || memberships.length === 0) return null;

      // Step 2: find the approved group
      const approvedMembership = memberships.find(
        (m: any) => m.run_groups?.status === "approved"
      );
      if (!approvedMembership) return null;

      const group = (approvedMembership as any).run_groups;

      // Step 3: fetch run_date details
      const { data: runDate } = await supabase
        .from("run_dates")
        .select("date, time, meeting_point")
        .eq("id", group.run_date_id)
        .single();

      if (!runDate) return null;

      // Step 4: fetch all members of this group with profile data
      const { data: members } = await supabase
        .from("run_group_members")
        .select(`
          user_id,
          profiles:user_id ( full_name, avatar_url )
        `)
        .eq("run_group_id", group.id);

      // Step 5: fetch route
      const { data: route } = await supabase
        .from("routes")
        .select("*")
        .eq("run_date_id", group.run_date_id)
        .maybeSingle();

      return {
        group_id: group.id,
        group_name: group.name,
        run_date_id: group.run_date_id,
        run_date: runDate.date,
        run_time: runDate.time,
        meeting_point: runDate.meeting_point,
        members: (members ?? []).map((m: any) => ({
          user_id: m.user_id,
          full_name: m.profiles?.full_name ?? null,
          avatar_url: m.profiles?.avatar_url ?? null,
        })),
        route: route
          ? {
              id: route.id,
              name: route.name,
              distance_km: Number(route.distance_km),
              meeting_point: route.meeting_point,
              post_run_cafe: route.post_run_cafe,
              waypoints: (route.waypoints as any) ?? [],
            }
          : null,
      };
    },
  });
}

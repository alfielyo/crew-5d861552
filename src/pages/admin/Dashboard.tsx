import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Users, Calendar, Ticket, PoundSterling } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const Dashboard = () => {
  const { data: profileCount } = useQuery({
    queryKey: ["admin-profile-count"],
    queryFn: async () => {
      const { count } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });
      return count ?? 0;
    },
  });

  const { data: upcomingRuns } = useQuery({
    queryKey: ["admin-upcoming-runs"],
    queryFn: async () => {
      const { data } = await supabase
        .from("run_dates")
        .select("*")
        .gte("date", new Date().toISOString().split("T")[0])
        .order("date", { ascending: true });
      return data ?? [];
    },
  });

  const { data: bookings } = useQuery({
    queryKey: ["admin-bookings-all"],
    queryFn: async () => {
      const { data } = await supabase
        .from("bookings")
        .select("*");
      return data ?? [];
    },
  });

  const confirmedBookings = bookings?.filter((b) => b.status === "confirmed") ?? [];
  const totalRevenue = confirmedBookings.length * 12;

  const stats = [
    { label: "Total Runners", value: profileCount ?? 0, icon: Users },
    { label: "Upcoming Runs", value: upcomingRuns?.length ?? 0, icon: Calendar },
    { label: "Bookings", value: bookings?.length ?? 0, icon: Ticket },
    { label: "Revenue", value: `£${totalRevenue}`, icon: PoundSterling },
  ];

  return (
    <div className="space-y-6">
      <h1 className="font-serif">Dashboard</h1>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground sm:text-sm">
                {s.label}
              </CardTitle>
              <s.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-xl font-bold sm:text-2xl">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div>
        <h2 className="mb-3 font-serif sm:mb-4">Upcoming Runs</h2>
        {upcomingRuns && upcomingRuns.length > 0 ? (
          <div className="space-y-2">
            {upcomingRuns.slice(0, 5).map((run) => (
              <Card key={run.id} className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4">
                <div className="min-w-0">
                  <p className="truncate font-medium">{run.date} · {run.time}</p>
                  <p className="truncate text-sm text-muted-foreground">{run.meeting_point}</p>
                </div>
                <span className="w-fit text-xs rounded bg-secondary px-2 py-1 text-secondary-foreground">
                  {run.status}
                </span>
              </Card>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No upcoming runs scheduled.</p>
        )}
      </div>
    </div>
  );
};

export default Dashboard;

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const Bookings = () => {
  const { data: bookings, isLoading } = useQuery({
    queryKey: ["admin-bookings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select(`
          *,
          profiles:user_id (full_name),
          run_dates:run_date_id (date, time, meeting_point)
        `)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const statusStyle = (status: string) => {
    if (status === "confirmed") return "bg-chart-2/20 text-foreground";
    if (status === "cancelled") return "bg-destructive/20 text-destructive";
    return "bg-secondary text-secondary-foreground";
  };

  return (
    <div className="space-y-5">
      <h1 className="font-serif">Bookings</h1>

      {/* Mobile cards */}
      <div className="block lg:hidden space-y-3">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : bookings && bookings.length > 0 ? (
          bookings.map((b: any) => (
            <Card key={b.id} className="p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{b.profiles?.full_name ?? "—"}</p>
                  <p className="text-sm text-muted-foreground">{b.run_dates?.date} · {b.run_dates?.time}</p>
                  <p className="truncate text-xs text-muted-foreground">{b.run_dates?.meeting_point}</p>
                </div>
                <span className={`shrink-0 rounded px-2 py-0.5 text-xs ${statusStyle(b.status)}`}>
                  {b.status}
                </span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {new Date(b.created_at).toLocaleDateString()}
              </p>
            </Card>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">No bookings yet</p>
        )}
      </div>

      {/* Desktop table */}
      <Card className="hidden lg:block">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Runner</TableHead>
                <TableHead>Run Date</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Booked At</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">Loading…</TableCell>
                </TableRow>
              ) : bookings && bookings.length > 0 ? (
                bookings.map((b: any) => (
                  <TableRow key={b.id}>
                    <TableCell>{b.profiles?.full_name ?? "—"}</TableCell>
                    <TableCell>{b.run_dates?.date} · {b.run_dates?.time}</TableCell>
                    <TableCell>{b.run_dates?.meeting_point}</TableCell>
                    <TableCell>
                      <span className={`rounded px-2 py-0.5 text-xs ${statusStyle(b.status)}`}>
                        {b.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(b.created_at).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">No bookings yet</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
};

export default Bookings;

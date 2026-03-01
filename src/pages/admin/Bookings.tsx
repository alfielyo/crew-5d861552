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

  return (
    <div className="space-y-6">
      <h1 className="font-serif text-3xl">Bookings</h1>

      <Card>
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
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      b.status === "confirmed"
                        ? "bg-chart-2/20 text-chart-2"
                        : b.status === "cancelled"
                        ? "bg-destructive/20 text-destructive"
                        : "bg-secondary text-secondary-foreground"
                    }`}>
                      {b.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
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
      </Card>
    </div>
  );
};

export default Bookings;

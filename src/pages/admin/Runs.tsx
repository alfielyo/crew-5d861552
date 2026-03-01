import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Trash2, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";

interface RunForm {
  date: string;
  time: string;
  meeting_point: string;
  capacity: number;
  price_pence: number;
}

const defaultForm: RunForm = {
  date: "",
  time: "09:00",
  meeting_point: "Battersea Park Bandstand",
  capacity: 30,
  price_pence: 1200,
};

const Runs = () => {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<RunForm>(defaultForm);

  const { data: runs, isLoading } = useQuery({
    queryKey: ["admin-runs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("run_dates")
        .select("*")
        .order("date", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const upsert = useMutation({
    mutationFn: async (values: RunForm & { id?: string }) => {
      if (values.id) {
        const { error } = await supabase
          .from("run_dates")
          .update(values)
          .eq("id", values.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("run_dates").insert(values);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-runs"] });
      setOpen(false);
      setEditingId(null);
      setForm(defaultForm);
      toast.success(editingId ? "Run updated" : "Run created");
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("run_dates").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-runs"] });
      toast.success("Run deleted");
    },
    onError: (e) => toast.error(e.message),
  });

  const openEdit = (run: any) => {
    setEditingId(run.id);
    setForm({
      date: run.date,
      time: run.time,
      meeting_point: run.meeting_point,
      capacity: run.capacity,
      price_pence: run.price_pence,
    });
    setOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    upsert.mutate(editingId ? { ...form, id: editingId } : form);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-3xl">Runs</h1>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setEditingId(null); setForm(defaultForm); } }}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1">
              <Plus className="h-4 w-4" /> New Run
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit Run" : "Create Run"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Date</Label>
                  <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
                </div>
                <div>
                  <Label>Time</Label>
                  <Input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} required />
                </div>
              </div>
              <div>
                <Label>Meeting Point</Label>
                <Input value={form.meeting_point} onChange={(e) => setForm({ ...form, meeting_point: e.target.value })} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Capacity</Label>
                  <Input type="number" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) })} required />
                </div>
                <div>
                  <Label>Price (pence)</Label>
                  <Input type="number" value={form.price_pence} onChange={(e) => setForm({ ...form, price_pence: Number(e.target.value) })} required />
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={upsert.isPending}>
                {editingId ? "Update" : "Create"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Time</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Capacity</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-20"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground">Loading…</TableCell></TableRow>
            ) : runs && runs.length > 0 ? (
              runs.map((run) => (
                <TableRow key={run.id}>
                  <TableCell>{run.date}</TableCell>
                  <TableCell>{run.time}</TableCell>
                  <TableCell>{run.meeting_point}</TableCell>
                  <TableCell>{run.capacity}</TableCell>
                  <TableCell>£{(run.price_pence / 100).toFixed(2)}</TableCell>
                  <TableCell>
                    <span className="text-xs px-2 py-0.5 rounded bg-secondary text-secondary-foreground">{run.status}</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(run)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => deleteMut.mutate(run.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground">No runs yet</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};

export default Runs;

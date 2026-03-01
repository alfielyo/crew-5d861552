import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Trash2, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

const Groups = () => {
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedRunDate, setSelectedRunDate] = useState("");
  const [groupName, setGroupName] = useState("");

  const { data: runDates } = useQuery({
    queryKey: ["admin-run-dates-for-groups"],
    queryFn: async () => {
      const { data } = await supabase.from("run_dates").select("*").order("date", { ascending: false });
      return data ?? [];
    },
  });

  const { data: groups, isLoading } = useQuery({
    queryKey: ["admin-groups"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("run_groups")
        .select(`
          *,
          run_dates (date, time),
          run_group_members (
            id,
            user_id,
            profiles:user_id (full_name)
          )
        `)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const createGroup = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("run_groups").insert({
        run_date_id: selectedRunDate,
        name: groupName,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-groups"] });
      setCreateOpen(false);
      setGroupName("");
      setSelectedRunDate("");
      toast.success("Group created");
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteGroup = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("run_groups").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-groups"] });
      toast.success("Group deleted");
    },
    onError: (e) => toast.error(e.message),
  });

  const removeMember = useMutation({
    mutationFn: async (memberId: string) => {
      const { error } = await supabase.from("run_group_members").delete().eq("id", memberId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-groups"] });
      toast.success("Member removed");
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-3xl">Groups</h1>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1">
              <Plus className="h-4 w-4" /> New Group
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Group</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Run Date</Label>
                <Select value={selectedRunDate} onValueChange={setSelectedRunDate}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a run" />
                  </SelectTrigger>
                  <SelectContent>
                    {runDates?.map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.date} · {r.time}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Group Name</Label>
                <Input value={groupName} onChange={(e) => setGroupName(e.target.value)} placeholder="e.g. Group A" />
              </div>
              <Button
                className="w-full"
                disabled={!selectedRunDate || !groupName || createGroup.isPending}
                onClick={() => createGroup.mutate()}
              >
                Create
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground text-sm">Loading…</p>
      ) : groups && groups.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {groups.map((g: any) => (
            <Card key={g.id}>
              <CardHeader className="flex flex-row items-start justify-between pb-2">
                <div>
                  <CardTitle className="text-base">{g.name}</CardTitle>
                  <p className="text-xs text-muted-foreground mt-1">
                    {g.run_dates?.date} · {g.run_dates?.time}
                  </p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => deleteGroup.mutate(g.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground mb-2">
                  {g.run_group_members?.length ?? 0} members
                </p>
                {g.run_group_members?.length > 0 ? (
                  <ul className="space-y-1">
                    {g.run_group_members.map((m: any) => (
                      <li key={m.id} className="flex items-center justify-between text-sm">
                        <span>{m.profiles?.full_name ?? "Unknown"}</span>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeMember.mutate(m.id)}>
                          <Trash2 className="h-3 w-3 text-muted-foreground" />
                        </Button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-muted-foreground italic">No members yet</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground text-sm">No groups created yet.</p>
      )}
    </div>
  );
};

export default Groups;

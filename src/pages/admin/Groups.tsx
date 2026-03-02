import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Trash2, UserPlus, BellOff } from "lucide-react";
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
  const [addMemberGroupId, setAddMemberGroupId] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState("");

  const { data: runDates } = useQuery({
    queryKey: ["admin-run-dates-for-groups"],
    queryFn: async () => {
      const { data } = await supabase.from("run_dates").select("*").order("date", { ascending: false });
      return data ?? [];
    },
  });

  const { data: profiles } = useQuery({
    queryKey: ["admin-profiles-for-groups"],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("id, full_name").order("full_name");
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

  const addMember = useMutation({
    mutationFn: async ({ groupId, userId }: { groupId: string; userId: string }) => {
      const { error } = await supabase.from("run_group_members").insert({
        run_group_id: groupId,
        user_id: userId,
      });
      if (error) throw error;

      // Fetch group name for notification
      const group = groups?.find((g: any) => g.id === groupId);
      const groupName = group?.name ?? "your group";

      await supabase.from("notifications").insert({
        user_id: userId,
        title: "You've been matched! 🏃‍♂️",
        body: `Great news — you've been added to ${groupName}. Your crew and route details are now visible in My Run.`,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-groups"] });
      setAddMemberGroupId(null);
      setSelectedUserId("");
      toast.success("Member added");
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

  const notifyUnmatched = useMutation({
    mutationFn: async (runDateId: string) => {
      // Get all users with confirmed bookings for this run date
      const { data: bookings } = await supabase
        .from("bookings")
        .select("user_id")
        .eq("run_date_id", runDateId)
        .eq("status", "confirmed");

      if (!bookings || bookings.length === 0) {
        throw new Error("No confirmed bookings for this run date");
      }

      // Get all users already in a group for this run date
      const { data: groupsForRun } = await supabase
        .from("run_groups")
        .select("id")
        .eq("run_date_id", runDateId);

      const groupIds = (groupsForRun ?? []).map((g) => g.id);

      let matchedUserIds: string[] = [];
      if (groupIds.length > 0) {
        const { data: members } = await supabase
          .from("run_group_members")
          .select("user_id")
          .in("run_group_id", groupIds);
        matchedUserIds = (members ?? []).map((m) => m.user_id);
      }

      const unmatchedUserIds = bookings
        .map((b) => b.user_id)
        .filter((uid) => !matchedUserIds.includes(uid));

      if (unmatchedUserIds.length === 0) {
        throw new Error("All booked runners have been matched");
      }

      const notifications = unmatchedUserIds.map((uid) => ({
        user_id: uid,
        title: "No crew match this time 😔",
        body: "Unfortunately we weren't able to match you into a crew for this run. Your booking remains active — we'll try again if spots shift!",
      }));

      const { error } = await supabase.from("notifications").insert(notifications);
      if (error) throw error;

      return unmatchedUserIds.length;
    },
    onSuccess: (count) => {
      toast.success(`Notified ${count} unmatched runner${count > 1 ? "s" : ""}`);
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-3xl">Groups</h1>
        <div className="flex gap-2">
          {/* Notify unmatched runners for a specific run */}
          <Select onValueChange={(runDateId) => notifyUnmatched.mutate(runDateId)}>
            <SelectTrigger className="h-8 w-auto gap-1 rounded-md border px-3 text-sm font-medium" disabled={notifyUnmatched.isPending}>
              <BellOff className="h-4 w-4" />
              <span>Notify Unmatched</span>
            </SelectTrigger>
            <SelectContent>
              {runDates?.map((r) => (
                <SelectItem key={r.id} value={r.id}>
                  {r.date} · {r.time}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
      </div>

      {/* Add Member Dialog */}
      <Dialog open={!!addMemberGroupId} onOpenChange={(v) => { if (!v) { setAddMemberGroupId(null); setSelectedUserId(""); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Member</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Select Runner</Label>
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a runner" />
                </SelectTrigger>
                <SelectContent>
                  {profiles?.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.full_name ?? "Unnamed"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              className="w-full"
              disabled={!selectedUserId || addMember.isPending}
              onClick={() => addMemberGroupId && addMember.mutate({ groupId: addMemberGroupId, userId: selectedUserId })}
            >
              Add
            </Button>
          </div>
        </DialogContent>
      </Dialog>

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
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => setAddMemberGroupId(g.id)}>
                    <UserPlus className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => deleteGroup.mutate(g.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
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

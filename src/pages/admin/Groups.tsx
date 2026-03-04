import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { seedTestData, clearTestData } from "@/hooks/use-seed-test-data";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Trash2, UserPlus, BellOff, Zap, CheckCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";

// Helper
async function invokeAdminFunction(fnName: string, body: object) {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  const res = await supabase.functions.invoke(fnName, {
    body,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (res.error) throw new Error(res.error.message);
  if (res.data?.error) throw new Error(res.data.error);
  return res.data;
}

// Component
const Groups = () => {
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedRunDate, setSelectedRunDate] = useState("");
  const [groupName, setGroupName] = useState("");
  const [addMemberGroupId, setAddMemberGroupId] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [activeRunDate, setActiveRunDate] = useState<string>("");
  const [devToolsOpen, setDevToolsOpen] = useState(false);
  const [seedLog, setSeedLog] = useState<string[]>([]);
  const [seedRunning, setSeedRunning] = useState(false);
  const [clearRunning, setClearRunning] = useState(false);

  // ── Queries ────────────────────────────────────────────
  const { data: runDates } = useQuery({
    queryKey: ["admin-run-dates-for-groups"],
    queryFn: async () => {
      const { data } = await supabase
        .from("run_dates")
        .select("*")
        .order("date", { ascending: false });
      return data ?? [];
    },
  });

  const { data: profiles } = useQuery({
    queryKey: ["admin-profiles-for-groups"],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id, full_name")
        .order("full_name");
      return data ?? [];
    },
  });

  const { data: groups, isLoading } = useQuery({
    queryKey: ["admin-groups", activeRunDate],
    queryFn: async () => {
      let query = supabase
        .from("run_groups")
        .select(`
          *,
          run_dates ( date, time ),
          run_group_members (
            id,
            user_id,
            profiles:user_id ( full_name )
          )
        `)
        .order("created_at", { ascending: false });
      if (activeRunDate && activeRunDate !== "all") query = query.eq("run_date_id", activeRunDate);
      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: matchingRun } = useQuery({
    queryKey: ["admin-matching-run", activeRunDate],
    enabled: !!activeRunDate,
    queryFn: async () => {
      const { data } = await supabase
        .from("matching_runs")
        .select("*")
        .eq("run_date_id", activeRunDate)
        .maybeSingle();
      return data;
    },
  });

  const pendingGroups = (groups ?? []).filter((g: any) => g.status === "pending");
  const approvedGroups = (groups ?? []).filter((g: any) => g.status === "approved");
  const allApproved =
    (groups ?? []).length > 0 &&
    (groups ?? []).every((g: any) => g.status === "approved");

  // ── Mutations ────────────────────────────────────────────
  const runMatching = useMutation({
    mutationFn: () =>
      invokeAdminFunction("match-groups", { run_date_id: activeRunDate }),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["admin-groups"] });
      queryClient.invalidateQueries({ queryKey: ["admin-matching-run"] });
      toast.success(
        `Matching complete — ${data.results?.[activeRunDate]?.groups_created ?? 0} groups created`
      );
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const approveAll = useMutation({
    mutationFn: () =>
      invokeAdminFunction("approve-groups", { run_date_id: activeRunDate }),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["admin-groups"] });
      toast.success(`${data.groups_approved} groups approved — runners notified!`);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const createGroup = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("run_groups").insert({
        run_date_id: selectedRunDate,
        name: groupName,
        status: "pending",
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
    onError: (e: Error) => toast.error(e.message),
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
    onError: (e: Error) => toast.error(e.message),
  });

  const addMember = useMutation({
    mutationFn: async ({ groupId, userId }: { groupId: string; userId: string }) => {
      const { error } = await supabase
        .from("run_group_members")
        .insert({ run_group_id: groupId, user_id: userId });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-groups"] });
      setAddMemberGroupId(null);
      setSelectedUserId("");
      toast.success("Member added");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const removeMember = useMutation({
    mutationFn: async (memberId: string) => {
      const { error } = await supabase
        .from("run_group_members")
        .delete()
        .eq("id", memberId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-groups"] });
      toast.success("Member removed");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const notifyUnmatched = useMutation({
    mutationFn: async (runDateId: string) => {
      const { data: bookings } = await supabase
        .from("bookings")
        .select("user_id")
        .eq("run_date_id", runDateId)
        .eq("status", "confirmed");

      if (!bookings?.length) throw new Error("No confirmed bookings");

      const { data: groupsForRun } = await supabase
        .from("run_groups")
        .select("id")
        .eq("run_date_id", runDateId);

      const groupIds = (groupsForRun ?? []).map((g: any) => g.id);

      let matchedIds: string[] = [];
      if (groupIds.length > 0) {
        const { data: members } = await supabase
          .from("run_group_members")
          .select("user_id")
          .in("run_group_id", groupIds);
        matchedIds = (members ?? []).map((m: any) => m.user_id);
      }

      const unmatched = bookings
        .map((b: any) => b.user_id)
        .filter((id: string) => !matchedIds.includes(id));

      if (unmatched.length === 0) throw new Error("All runners are matched");

      const { error } = await supabase.from("notifications").insert(
        unmatched.map((uid: string) => ({
          user_id: uid,
          title: "No crew match this time 😔",
          body: "We weren't able to match you into a crew for this run. Your booking remains active.",
        }))
      );

      if (error) throw error;
      return unmatched.length;
    },
    onSuccess: (n: number) => toast.success(`Notified ${n} unmatched runner${n > 1 ? "s" : ""}`),
    onError: (e: Error) => toast.error(e.message),
  });

  // ── Notify Unmatched Form ──────────────────────────────
  const NotifyUnmatchedForm = ({
    runDates: rds,
    onNotify,
    isPending,
  }: {
    runDates: any[];
    onNotify: (id: string) => void;
    isPending: boolean;
  }) => {
    const [pickedId, setPickedId] = useState("");
    return (
      <div className="space-y-4">
        <Select value={pickedId} onValueChange={setPickedId}>
          <SelectTrigger>
            <SelectValue placeholder="Select a run date" />
          </SelectTrigger>
          <SelectContent>
            {rds.map((r: any) => (
              <SelectItem key={r.id} value={r.id}>
                {r.date} · {r.time}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          className="w-full"
          disabled={!pickedId || isPending}
          onClick={() => onNotify(pickedId)}
        >
          {isPending ? "Sending…" : "Send Notifications"}
        </Button>
      </div>
    );
  };

  // ── Group Card ─────────────────────────────────────────
  const GroupCard = ({ g }: { g: any }) => (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between pb-2">
        <div>
          <CardTitle className="text-base">{g.name}</CardTitle>
          <p className="text-xs text-muted-foreground mt-1">
            {g.run_dates?.date} · {g.run_dates?.time}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <Badge variant={g.status === "approved" ? "default" : "secondary"}>
            {g.status}
          </Badge>
          {g.status === "pending" && (
            <Button variant="ghost" size="icon" onClick={() => setAddMemberGroupId(g.id)}>
              <UserPlus className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => deleteGroup.mutate(g.id)}
            disabled={g.status === "approved"}
          >
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
                {g.status === "pending" && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => removeMember.mutate(m.id)}
                  >
                    <Trash2 className="h-3 w-3 text-muted-foreground" />
                  </Button>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-muted-foreground italic">No members yet</p>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="font-serif text-3xl">Groups</h1>
        <div className="flex gap-2 flex-wrap">
          {/* Notify Unmatched */}
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1">
                <BellOff className="h-4 w-4" />
                Notify Unmatched
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Notify Unmatched Runners</DialogTitle>
              </DialogHeader>
              <p className="text-sm text-muted-foreground">
                Select a run date to notify all confirmed ticket holders who have not been assigned to a crew.
              </p>
              <NotifyUnmatchedForm
                runDates={runDates ?? []}
                onNotify={(id) => notifyUnmatched.mutate(id)}
                isPending={notifyUnmatched.isPending}
              />
            </DialogContent>
          </Dialog>

          {/* New Group */}
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
                      {runDates?.map((r: any) => (
                        <SelectItem key={r.id} value={r.id}>
                          {r.date} · {r.time}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Group Name</Label>
                  <Input
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    placeholder="e.g. Crew A"
                  />
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

      {/* Filter by run date */}
      <div>
        <Label className="text-xs text-muted-foreground">Filter by Run Date</Label>
        <Select value={activeRunDate} onValueChange={setActiveRunDate}>
          <SelectTrigger>
            <SelectValue placeholder="All run dates" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All run dates</SelectItem>
            {runDates?.map((r: any) => (
              <SelectItem key={r.id} value={r.id}>
                {r.date} · {r.time}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Matching controls — visible when a run date is selected */}
      {activeRunDate && activeRunDate !== "all" && (
        <Card>
          <CardContent className="flex items-center justify-between py-4">
            <div className="flex items-center gap-2 text-sm">
              <span className="font-medium">Automated Matching</span>
              {matchingRun ? (
                <Badge variant="default" className="gap-1">
                  <CheckCircle className="h-3 w-3" />
                  Matched ({matchingRun.groups_created} groups)
                </Badge>
              ) : (
                <Badge variant="secondary" className="gap-1">
                  <Clock className="h-3 w-3" />
                  Not yet matched
                </Badge>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                className="gap-1"
                onClick={() => runMatching.mutate()}
                disabled={runMatching.isPending}
              >
                <Zap className="h-4 w-4" />
                {runMatching.isPending ? "Running…" : "Run Matching"}
              </Button>
              <Button
                size="sm"
                className="gap-1"
                onClick={() => approveAll.mutate()}
                disabled={approveAll.isPending || pendingGroups.length === 0 || allApproved}
              >
                <CheckCircle className="h-4 w-4" />
                Approve All ({pendingGroups.length})
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add Member Dialog */}
      <Dialog
        open={!!addMemberGroupId}
        onOpenChange={(v) => {
          if (!v) {
            setAddMemberGroupId(null);
            setSelectedUserId("");
          }
        }}
      >
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
                  {profiles?.map((p: any) => (
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
              onClick={() =>
                addMemberGroupId &&
                addMember.mutate({ groupId: addMemberGroupId, userId: selectedUserId })
              }
            >
              Add
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {isLoading ? (
        <p className="text-muted-foreground text-sm">Loading…</p>
      ) : (groups ?? []).length === 0 ? (
        <p className="text-muted-foreground text-sm">No groups found.</p>
      ) : null}

      {/* Pending / Approved Tabs */}
      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending">
            Pending ({pendingGroups.length})
          </TabsTrigger>
          <TabsTrigger value="approved">
            Approved ({approvedGroups.length})
          </TabsTrigger>
        </TabsList>
        <TabsContent value="pending">
          {pendingGroups.length === 0 ? (
            <p className="text-sm text-muted-foreground mt-4">No pending groups.</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mt-4">
              {pendingGroups.map((g: any) => (
                <GroupCard key={g.id} g={g} />
              ))}
            </div>
          )}
        </TabsContent>
        <TabsContent value="approved">
          {approvedGroups.length === 0 ? (
            <p className="text-sm text-muted-foreground mt-4">No approved groups yet.</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mt-4">
              {approvedGroups.map((g: any) => (
                <GroupCard key={g.id} g={g} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* ── Developer Tools ───────────────────────────────── */}
      <div className="mt-10 border-t border-dashed border-border pt-6">
        <button
          type="button"
          onClick={() => setDevToolsOpen((v) => !v)}
          className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <span className="font-mono">{devToolsOpen ? "▾" : "▸"}</span>
          Developer Tools
        </button>

        {devToolsOpen && (
          <div className="mt-4 rounded-sm border border-dashed border-destructive/40 bg-destructive/5 p-5 space-y-4">
            <div>
              <p className="text-xs font-semibold text-destructive uppercase tracking-wider">
                ⚠ Dev Only — Do Not Use in Production
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Generates 50 test accounts (aged 18–40) and books them onto the next
                upcoming run date. Test accounts use emails ending in{" "}
                <code className="font-mono">@crew-test.dev</code> and can be fully
                removed with "Clear Test Data". A run date must exist before seeding.
              </p>
            </div>

            {!activeRunDate && (
              <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded px-3 py-2">
                Select a run date above before seeding, or the seeder will use the
                next available upcoming run date automatically.
              </p>
            )}

            <div className="flex gap-3 flex-wrap">
              <Button
                size="sm"
                variant="destructive"
                disabled={seedRunning || clearRunning}
                onClick={async () => {
                  setSeedRunning(true);
                  setSeedLog([]);
                  const result = await seedTestData((msg) =>
                    setSeedLog((prev) => [...prev, msg])
                  );
                  if (!result.success) {
                    setSeedLog((prev) => [...prev, `✗ Error: ${result.error}`]);
                    toast.error("Seed failed — see log below");
                  } else {
                    toast.success("50 test users seeded successfully");
                  }
                  setSeedRunning(false);
                }}
              >
                {seedRunning ? "Seeding…" : "Seed 50 Test Users"}
              </Button>

              <Button
                size="sm"
                variant="outline"
                className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                disabled={seedRunning || clearRunning}
                onClick={async () => {
                  setClearRunning(true);
                  setSeedLog([]);
                  const result = await clearTestData((msg) =>
                    setSeedLog((prev) => [...prev, msg])
                  );
                  if (!result.success) {
                    setSeedLog((prev) => [...prev, `✗ Error: ${result.error}`]);
                    toast.error("Clear failed — see log below");
                  } else {
                    queryClient.invalidateQueries({ queryKey: ["admin-groups"] });
                    toast.success("Test data cleared");
                  }
                  setClearRunning(false);
                }}
              >
                {clearRunning ? "Clearing…" : "Clear Test Data"}
              </Button>
            </div>

            {seedLog.length > 0 && (
              <div className="rounded-sm bg-black/80 text-green-400 font-mono text-xs p-3 space-y-0.5 max-h-40 overflow-y-auto">
                {seedLog.map((line, i) => (
                  <p key={i}>{line}</p>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Groups;

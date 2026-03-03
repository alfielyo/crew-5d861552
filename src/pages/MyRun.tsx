import { motion } from "framer-motion";
import { Clock, X, Users, Map, MessageCircle } from "lucide-react";
import PageShell from "@/components/PageShell";
import BottomNav from "@/components/BottomNav";
import { RouteCard } from "@/components/RouteCard";
import { GroupChat } from "@/components/GroupChat";
import { useState, useEffect, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMyGroup } from "@/hooks/use-my-group";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

function getInitials(name: string | null): string {
  if (!name) return "?";
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

const MyRun = () => {
  const queryClient = useQueryClient();
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setCurrentUserId(user.id);
    });
  }, []);

  // Next booking
  const { data: nextBooking, isLoading } = useQuery({
    queryKey: ["my-next-booking"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const today = new Date().toISOString().split("T")[0];
      const { data } = await supabase
        .from("bookings")
        .select("*, run_dates(*)")
        .eq("user_id", user.id)
        .eq("status", "confirmed")
        .order("created_at", { ascending: true });
      const upcoming = (data || []).filter(
        (b: any) => b.run_dates && b.run_dates.date >= today
      );
      upcoming.sort((a: any, b: any) => {
        const aKey = `${a.run_dates.date}T${a.run_dates.time}`;
        const bKey = `${b.run_dates.date}T${b.run_dates.time}`;
        return aKey.localeCompare(bKey);
      });
      return upcoming[0] || null;
    },
  });

  const runDateId = (nextBooking?.run_dates as any)?.id;

  // Group data (only fetches when runDateId is available)
  const { data: myGroup } = useMyGroup(runDateId);
  const isApproved = !!myGroup;

  // Countdown
  const targetDate = useMemo(() => {
    if (!nextBooking?.run_dates) return null;
    const rd = nextBooking.run_dates as any;
    return new Date(`${rd.date}T${rd.time}Z`);
  }, [nextBooking]);

  const isWithin48Hours = useMemo(() => {
    if (!targetDate) return false;
    return (targetDate.getTime() - Date.now()) / (1000 * 60 * 60) < 48;
  }, [targetDate]);

  const runPricePence = useMemo(() => {
    if (!nextBooking?.run_dates) return 0;
    return (nextBooking.run_dates as any).price_pence ?? 1200;
  }, [nextBooking]);

  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    if (!targetDate) return;
    const tick = () => {
      const diff = targetDate.getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }
      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000),
      });
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  // Cancel booking
  const handleCancel = async () => {
    if (!nextBooking) return;
    setIsCancelling(true);
    try {
      const { data, error } = await supabase.functions.invoke("cancel-booking", {
        body: { booking_id: nextBooking.id },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const refundPounds = ((data.refund_amount_pence ?? 0) / 100).toFixed(2);
      const feeMsg = data.cancellation_fee_applied
        ? `A £5.00 fee was applied. You'll be refunded £${refundPounds}.`
        : `Full refund of £${refundPounds} incoming.`;

      toast.success(`Booking cancelled — ${feeMsg}`);
      queryClient.invalidateQueries({ queryKey: ["my-next-booking"] });
      queryClient.invalidateQueries({ queryKey: ["my-group"] });
    } catch (err: any) {
      toast.error(`Cancellation failed: ${err.message}`);
    } finally {
      setIsCancelling(false);
      setShowCancelDialog(false);
    }
  };

  const fullRefundDisplay = `£${(runPricePence / 100).toFixed(2)}`;
  const partialRefundDisplay = `£${(Math.max(0, runPricePence - 500) / 100).toFixed(2)}`;

  return (
    <PageShell withBottomNav className="flex flex-col px-4 py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full">
        {isLoading ? (
          <p className="text-center text-muted-foreground">Loading…</p>
        ) : !targetDate ? (
          <div className="text-center">
            <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary">
              <Clock size={24} className="text-primary" />
            </div>
            <h1 className="font-serif text-2xl">No upcoming run</h1>
            <p className="mt-3 text-sm text-muted-foreground">
              Book a run to see your details here.
            </p>
          </div>
        ) : isApproved && myGroup ? (
          /* ── POST-APPROVAL VIEW ── */
          <div className="space-y-6">
            <div className="text-center">
              <h1 className="font-serif text-2xl">{myGroup.group_name}</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {new Date(myGroup.run_date).toLocaleDateString("en-GB", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })}{" "}
                · {myGroup.run_time.slice(0, 5)}
              </p>
            </div>

            <Tabs defaultValue="crew">
              <TabsList className="w-full">
                <TabsTrigger value="crew" className="flex-1 gap-1">
                  <Users size={14} /> Crew
                </TabsTrigger>
                <TabsTrigger value="route" className="flex-1 gap-1">
                  <Map size={14} /> Route
                </TabsTrigger>
                <TabsTrigger value="chat" className="flex-1 gap-1">
                  <MessageCircle size={14} /> Chat
                </TabsTrigger>
              </TabsList>

              {/* Crew tab */}
              <TabsContent value="crew" className="mt-4 space-y-3">
                {myGroup.members.map((m) => (
                  <div
                    key={m.user_id}
                    className="flex items-center gap-3 rounded-lg border border-border p-3"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-medium">
                      {m.avatar_url ? (
                        <img
                          src={m.avatar_url}
                          alt=""
                          className="h-10 w-10 rounded-full object-cover"
                        />
                      ) : (
                        getInitials(m.full_name)
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        {m.full_name ?? "Runner"}
                        {m.user_id === currentUserId && (
                          <span className="ml-1 text-xs text-muted-foreground">(you)</span>
                        )}
                      </p>
                    </div>
                  </div>
                ))}
              </TabsContent>

              {/* Route tab */}
              <TabsContent value="route" className="mt-4">
                {myGroup.route ? (
                  <RouteCard
                    name={myGroup.route.name}
                    distanceKm={myGroup.route.distance_km}
                    meetingPoint={myGroup.route.meeting_point}
                    postRunCafe={myGroup.route.post_run_cafe}
                    waypoints={myGroup.route.waypoints}
                  />
                ) : (
                  <p className="text-sm text-muted-foreground text-center">
                    Route details coming soon.
                  </p>
                )}
              </TabsContent>

              {/* Chat tab */}
              <TabsContent value="chat" className="mt-4">
                {currentUserId ? (
                  <GroupChat groupId={myGroup.group_id} currentUserId={currentUserId} />
                ) : (
                  <p className="text-sm text-muted-foreground text-center">Loading chat…</p>
                )}
              </TabsContent>
            </Tabs>

            {/* Cancel button — also available post-approval */}
            <div className="text-center">
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-destructive"
                onClick={() => setShowCancelDialog(true)}
              >
                <X size={14} className="mr-1" />
                Cancel booking
              </Button>
            </div>
          </div>
        ) : (
          /* ── PRE-APPROVAL VIEW ── */
          <div className="text-center">
            <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary">
              <Clock size={24} className="text-primary" />
            </div>
            <h1 className="font-serif text-2xl">Your crew is being assembled…</h1>
            <p className="mt-3 text-sm text-muted-foreground">
              Groups are matched and revealed 48 hours before the run.
            </p>

            {/* Countdown */}
            <div className="mt-10 flex justify-center gap-4">
              {[
                { label: "Days", value: timeLeft.days },
                { label: "Hours", value: timeLeft.hours },
                { label: "Mins", value: timeLeft.minutes },
                { label: "Secs", value: timeLeft.seconds },
              ].map(({ label, value }) => (
                <div key={label} className="flex flex-col items-center">
                  <span className="tabular-nums font-serif text-4xl text-foreground">
                    {String(value).padStart(2, "0")}
                  </span>
                  <span className="mt-1 text-xs text-muted-foreground">{label}</span>
                </div>
              ))}
            </div>

            <p className="mt-10 text-sm text-muted-foreground">
              We'll notify you the moment your crew is matched.
            </p>

            <Button
              variant="ghost"
              size="sm"
              className="mt-8 text-muted-foreground hover:text-destructive"
              onClick={() => setShowCancelDialog(true)}
            >
              <X size={14} className="mr-1" />
              Cancel booking
            </Button>
          </div>
        )}
      </motion.div>

      {/* Cancellation confirmation dialog */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel your booking?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              {isWithin48Hours ? (
                <>
                  <span className="block">
                    Your run starts in less than 48 hours. A £5.00 cancellation fee will be applied.
                  </span>
                  <span className="block">
                    You will be refunded {partialRefundDisplay}.
                  </span>
                </>
              ) : (
                <span className="block">
                  You will receive a full refund of {fullRefundDisplay}.
                </span>
              )}
              <span className="block">Please allow 5–10 business days for the refund.</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isCancelling}>Keep booking</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancel}
              disabled={isCancelling}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isCancelling ? "Cancelling…" : "Yes, cancel"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <BottomNav />
    </PageShell>
  );
};

export default MyRun;

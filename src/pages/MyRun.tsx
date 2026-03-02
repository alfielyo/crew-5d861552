import { motion } from "framer-motion";
import { Clock, X } from "lucide-react";
import PageShell from "@/components/PageShell";
import BottomNav from "@/components/BottomNav";
import { useState, useEffect, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
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
import { toast } from "@/hooks/use-toast";

const MyRun = () => {
  const queryClient = useQueryClient();
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

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
      const upcoming = (data || []).filter((b: any) => b.run_dates && b.run_dates.date >= today);
      upcoming.sort((a: any, b: any) => {
        const aKey = `${a.run_dates.date}T${a.run_dates.time}`;
        const bKey = `${b.run_dates.date}T${b.run_dates.time}`;
        return aKey.localeCompare(bKey);
      });
      return upcoming[0] || null;
    },
  });

  const targetDate = useMemo(() => {
    if (!nextBooking?.run_dates) return null;
    const rd = nextBooking.run_dates as any;
    return new Date(`${rd.date}T${rd.time}Z`);
  }, [nextBooking]);

  const isWithin48Hours = useMemo(() => {
    if (!targetDate) return false;
    const hoursUntil = (targetDate.getTime() - Date.now()) / (1000 * 60 * 60);
    return hoursUntil < 48;
  }, [targetDate]);

  const runPricePence = useMemo(() => {
    if (!nextBooking?.run_dates) return 0;
    return (nextBooking.run_dates as any).price_pence ?? 1200;
  }, [nextBooking]);

  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    if (!targetDate) return;
    const tick = () => {
      const now = Date.now();
      const diff = targetDate.getTime() - now;
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

      if (data.cancellation_fee_applied) {
        toast({
          title: "Booking cancelled",
          description: `A £5.00 cancellation fee has been applied. You will be refunded £${refundPounds}. Please allow 5–10 business days for the refund to process.`,
        });
      } else {
        toast({
          title: "Booking cancelled",
          description: `You will receive a full refund of £${refundPounds}. Please allow 5–10 business days for the refund to process.`,
        });
      }

      queryClient.invalidateQueries({ queryKey: ["my-next-booking"] });
    } catch (err: any) {
      toast({
        title: "Cancellation failed",
        description: err.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCancelling(false);
      setShowCancelDialog(false);
    }
  };

  const cancellationFeeDisplay = "£5.00";
  const fullRefundDisplay = `£${(runPricePence / 100).toFixed(2)}`;
  const partialRefundDisplay = `£${(Math.max(0, runPricePence - 500) / 100).toFixed(2)}`;

  return (
    <PageShell withBottomNav className="flex flex-col items-center px-6 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full text-center"
      >
        <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary">
          <Clock size={24} className="text-primary" />
        </div>

        {isLoading ? (
          <p className="text-muted-foreground">Loading...</p>
        ) : !targetDate ? (
          <>
            <h1 className="font-serif text-2xl">No upcoming run</h1>
            <p className="mt-3 text-sm text-muted-foreground">
              Book a run to see your countdown here.
            </p>
          </>
        ) : (
          <>
            <h1 className="font-serif text-2xl">Your crew is being assembled...</h1>
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
              We'll email you the moment your crew is matched.
            </p>

            {/* Cancel button */}
            <Button
              variant="ghost"
              size="sm"
              className="mt-8 text-muted-foreground hover:text-destructive"
              onClick={() => setShowCancelDialog(true)}
            >
              <X size={14} className="mr-1" />
              Cancel booking
            </Button>
          </>
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
                    Your run starts in less than 48 hours. A cancellation fee of{" "}
                    <strong>{cancellationFeeDisplay}</strong> will be applied.
                  </span>
                  <span className="block">
                    You will be refunded <strong>{partialRefundDisplay}</strong>. Please allow
                    5–10 business days for the refund to process.
                  </span>
                </>
              ) : (
                <>
                  <span className="block">
                    You will receive a full refund of <strong>{fullRefundDisplay}</strong>.
                  </span>
                  <span className="block">
                    Please allow 5–10 business days for the refund to process.
                  </span>
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isCancelling}>Keep booking</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancel}
              disabled={isCancelling}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isCancelling ? "Cancelling..." : "Yes, cancel"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <BottomNav />
    </PageShell>
  );
};

export default MyRun;

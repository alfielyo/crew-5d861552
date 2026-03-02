import { motion } from "framer-motion";
import { Clock } from "lucide-react";
import PageShell from "@/components/PageShell";
import BottomNav from "@/components/BottomNav";
import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { parseISO } from "date-fns";

const MyRun = () => {
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
      // Filter to future run dates
      const upcoming = (data || []).filter((b: any) => b.run_dates && b.run_dates.date >= today);
      // Sort by date+time ascending, pick first
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
    const rd = nextBooking.run_dates;
    // Construct a proper Date from date + time (treated as UTC/GMT)
    return new Date(`${rd.date}T${rd.time}Z`);
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
          </>
        )}
      </motion.div>

      <BottomNav />
    </PageShell>
  );
};

export default MyRun;

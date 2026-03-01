import { motion } from "framer-motion";
import { Clock } from "lucide-react";
import PageShell from "@/components/PageShell";
import BottomNav from "@/components/BottomNav";
import { useState, useEffect } from "react";

const MyRun = () => {
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + 2);
  targetDate.setHours(9, 0, 0, 0);

  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const diff = targetDate.getTime() - now;
      if (diff <= 0) {
        clearInterval(interval);
        return;
      }
      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000),
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <PageShell withBottomNav className="flex flex-col items-center px-5 py-10 sm:px-8 lg:mx-auto lg:max-w-2xl lg:py-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full text-center"
      >
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary">
          <Clock size={24} className="text-primary" />
        </div>

        <h1 className="font-serif">Your crew is being assembled...</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Groups are matched and revealed 48 hours before the run.
        </p>

        {/* Countdown */}
        <div className="mt-8 flex justify-center gap-3 sm:gap-5">
          {[
            { label: "Days", value: timeLeft.days },
            { label: "Hours", value: timeLeft.hours },
            { label: "Mins", value: timeLeft.minutes },
            { label: "Secs", value: timeLeft.seconds },
          ].map(({ label, value }) => (
            <div key={label} className="flex flex-col items-center">
              <span className="tabular-nums font-serif text-3xl text-foreground sm:text-4xl">
                {String(value).padStart(2, "0")}
              </span>
              <span className="mt-1 text-[11px] text-muted-foreground sm:text-xs">{label}</span>
            </div>
          ))}
        </div>

        <p className="mt-8 text-sm text-muted-foreground">
          We'll email you the moment your crew is matched.
        </p>
      </motion.div>

      <BottomNav />
    </PageShell>
  );
};

export default MyRun;

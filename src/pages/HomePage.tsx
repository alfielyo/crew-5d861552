import { motion } from "framer-motion";
import { Bell, ArrowRight, MapPin, Clock, Users } from "lucide-react";
import PageShell from "@/components/PageShell";
import BottomNav from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const HomePage = () => {
  const navigate = useNavigate();

  const userName = "Alfie";
  const run = {
    date: "Sunday 2nd March",
    time: "9:00am",
    meetingPoint: "Battersea Park Bandstand",
    price: 12,
    spotsRemaining: 18,
    capacity: 30,
  };

  return (
    <PageShell withBottomNav className="px-5 py-6 sm:px-8 lg:mx-auto lg:max-w-2xl lg:py-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-base text-muted-foreground sm:text-lg"
        >
          Hey {userName},
        </motion.p>
        <button className="relative flex min-h-[2.75rem] min-w-[2.75rem] items-center justify-center rounded-full hover:bg-secondary">
          <Bell size={22} className="text-foreground" />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-primary" />
        </button>
      </div>

      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mt-3"
      >
        <h1 className="font-serif">Meet new people in</h1>
      </motion.div>

      {/* Run Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="mt-8"
      >
        <div className="rounded-2xl border border-border bg-card p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h2 className="font-serif">Run 5k</h2>
              <div className="mt-2 space-y-1.5">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock size={14} className="shrink-0" />
                  <span>{run.date} · {run.time}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin size={14} className="shrink-0" />
                  <span className="truncate">{run.meetingPoint}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users size={14} className="shrink-0" />
                  <span>{run.spotsRemaining} spots left</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => navigate("/booking/confirm")}
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-border transition-colors hover:bg-secondary"
            >
              <ArrowRight size={20} />
            </button>
          </div>
        </div>
      </motion.div>

      {/* Book CTA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mt-5"
      >
        <Button
          onClick={() => navigate("/booking/confirm")}
          className="w-full bg-primary py-6 text-base font-semibold text-primary-foreground"
        >
          Book Your Spot — £{run.price}
        </Button>
      </motion.div>

      {/* About */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.55 }}
        className="mt-8"
      >
        <h2 className="mb-3 font-serif">What to expect</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Show up, meet your crew, and run together through Battersea Park. It's a social run, not a race — all paces welcome. Groups are matched based on personality, age, and interests so you'll click from the start.
        </p>
      </motion.div>

      <BottomNav />
    </PageShell>
  );
};

export default HomePage;

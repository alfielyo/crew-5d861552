import { motion } from "framer-motion";
import { Bell, ArrowRight, MapPin, Clock, Users } from "lucide-react";
import PageShell from "@/components/PageShell";
import BottomNav from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const HomePage = () => {
  const navigate = useNavigate();
  const [userName, setUserName] = useState("");
  const [city, setCity] = useState("");

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from("profiles").select("full_name, location_city").eq("id", user.id).maybeSingle();
      if (data) {
        setUserName(data.full_name?.split(" ")[0] || "");
        setCity(data.location_city || "");
      }
    };
    load();
  }, []);
  const run = {
    date: "Sunday 2nd March",
    time: "9:00am",
    meetingPoint: "Battersea Park Bandstand",
    price: 10,
    spotsRemaining: 18,
    capacity: 30,
  };

  return (
    <PageShell withBottomNav className="px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-lg text-muted-foreground">
          Hey {userName},
        </motion.p>
        <button className="relative rounded-full p-2 hover:bg-secondary">
          <Bell size={22} className="text-foreground" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-primary" />
        </button>
      </div>

      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mt-4"
      >
        <h1 className="font-serif text-4xl leading-tight">Meet new people in</h1>
        {city && <p className="font-serif text-4xl leading-tight text-muted-foreground">{city}</p>}
      </motion.div>

      {/* Run Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="mt-10"
      >
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="font-serif text-xl">Run 5k</h2>
              <div className="mt-2 space-y-1.5">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock size={14} />
                  <span>
                    {run.date} · {run.time}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin size={14} />
                  <span>{run.meetingPoint}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users size={14} />
                  <span>{run.spotsRemaining} spots left</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => navigate("/booking/confirm")}
              className="flex h-12 w-12 items-center justify-center rounded-full border border-border transition-colors hover:bg-secondary"
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
        className="mt-6"
      >
        <Button
          onClick={() => navigate("/booking/confirm")}
          className="w-full bg-primary py-6 text-base font-semibold text-primary-foreground"
        >
          Book Your Spot — £{run.price}
        </Button>
      </motion.div>

      {/* About */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.55 }} className="mt-10">
        <h2 className="mb-3 font-serif text-lg">What to expect</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Show up, meet your crew, and run together through Battersea Park. It's a social run, not a race — all paces
          welcome. Groups are matched based on personality, age, and interests so you'll click from the start.
        </p>
      </motion.div>

      <BottomNav />
    </PageShell>
  );
};

export default HomePage;

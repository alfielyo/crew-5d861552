import { motion } from "framer-motion";
import { Bell, ArrowRight, MapPin, Clock, Users } from "lucide-react";
import PageShell from "@/components/PageShell";
import BottomNav from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";

const HomePage = () => {
  const navigate = useNavigate();
  const [userName, setUserName] = useState("");
  const [city, setCity] = useState("");
  const [notifications, setNotifications] = useState<Tables<"notifications">[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from("profiles").select("full_name, location_city").eq("id", user.id).maybeSingle();
      if (data) {
        setUserName(data.full_name?.split(" ")[0] || "");
        setCity(data.location_city || "");
      }
      const { data: notifs } = await supabase.from("notifications").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(10);
      if (notifs) {
        setNotifications(notifs);
        setUnreadCount(notifs.filter(n => !n.read).length);
      }
    };
    load();
  }, []);

  const markAllRead = async () => {
    const unread = notifications.filter(n => !n.read);
    if (unread.length === 0) return;
    await supabase.from("notifications").update({ read: true }).in("id", unread.map(n => n.id));
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  };
  const [upcomingRuns, setUpcomingRuns] = useState<any[]>([]);
  const [bookedRunIds, setBookedRunIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const loadRuns = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data } = await supabase
        .from("run_dates")
        .select("*")
        .in("status", ["open", "scheduled"])
        .gte("date", new Date().toISOString().split("T")[0])
        .order("date", { ascending: true })
        .limit(2);

      // Fetch user's active bookings
      let userBookedIds = new Set<string>();
      if (user) {
        const { data: userBookings } = await supabase
          .from("bookings")
          .select("run_date_id")
          .eq("user_id", user.id)
          .eq("status", "confirmed");
        if (userBookings) {
          userBookedIds = new Set(userBookings.map(b => b.run_date_id));
        }
      }
      setBookedRunIds(userBookedIds);

      if (data && data.length > 0) {
        const enriched = await Promise.all(
          data.map(async (run) => {
            const { count } = await supabase
              .from("bookings")
              .select("*", { count: "exact", head: true })
              .eq("run_date_id", run.id)
              .eq("status", "confirmed");
            return { ...run, spotsRemaining: run.capacity - (count || 0) };
          })
        );
        setUpcomingRuns(enriched);
      }
    };
    loadRuns();
  }, []);

  return (
    <PageShell withBottomNav className="px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-lg text-muted-foreground">
          Hey {userName},
        </motion.p>
        <Popover>
          <PopoverTrigger asChild>
            <button className="relative rounded-full p-2 hover:bg-secondary" onClick={markAllRead}>
              <Bell size={22} className="text-foreground" />
              {unreadCount > 0 && <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-primary" />}
            </button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-72 p-0">
            <div className="border-b border-border px-4 py-3">
              <p className="text-sm font-medium">Notifications</p>
            </div>
            <div className="max-h-64 overflow-y-auto">
              {notifications.length === 0 ? (
                <p className="px-4 py-6 text-center text-sm text-muted-foreground">No notifications yet</p>
              ) : (
                notifications.map(n => (
                  <div key={n.id} className="border-b border-border px-4 py-3 last:border-0">
                    <p className="text-sm font-medium">{n.title}</p>
                    {n.body && <p className="mt-0.5 text-xs text-muted-foreground">{n.body}</p>}
                  </div>
                ))
              )}
            </div>
          </PopoverContent>
        </Popover>
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

      {/* Run Cards */}
      <div className="mt-10 space-y-4">
        {upcomingRuns.length > 0 ? (
          upcomingRuns.map((run, i) => {
            const isBooked = bookedRunIds.has(run.id);
            return (
              <motion.div
                key={run.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: isBooked ? 0.35 : 1, y: 0 }}
                transition={{ delay: 0.25 + i * 0.15 }}
                className={isBooked ? "pointer-events-none" : ""}
              >
                <div className="rounded-sm border border-border bg-card p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="font-serif text-xl">Run 5k</h2>
                      {isBooked && (
                        <span className="mt-1 inline-block text-xs font-medium text-primary">Already booked</span>
                      )}
                      <div className="mt-2 space-y-1.5">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock size={14} />
                          <span>
                            {new Date(run.date).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })} · {run.time}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin size={14} />
                          <span>{run.meeting_point}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Users size={14} />
                          <span>{run.spotsRemaining} spots left</span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => navigate(`/booking/confirm?run=${run.id}`)}
                      className="flex h-12 w-12 items-center justify-center rounded-full border border-border transition-colors hover:bg-secondary"
                    >
                      <ArrowRight size={20} />
                    </button>
                  </div>
                </div>
                <Button
                  onClick={() => navigate(`/booking/confirm?run=${run.id}`)}
                  className="mt-3 w-full py-6 text-base font-semibold"
                >
                  {isBooked ? "Booked" : `Book Your Spot — £${(run.price_pence / 100).toFixed(2)}`}
                </Button>
              </motion.div>
            );
          })
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            <div className="rounded-sm border border-border bg-card p-5 text-center">
              <p className="text-sm text-muted-foreground">No upcoming runs — check back soon!</p>
            </div>
          </motion.div>
        )}
      </div>

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

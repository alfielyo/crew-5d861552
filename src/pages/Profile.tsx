import { motion } from "framer-motion";
import { User, MapPin, LogOut, Trash2, Settings } from "lucide-react";
import PageShell from "@/components/PageShell";
import BottomNav from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";

const formatRunDate = (dateStr: string, timeStr: string) => {
  const date = parseISO(dateStr);
  const dayName = format(date, "EEEE");
  const dayNum = format(date, "do");
  const month = format(date, "MMMM");
  // timeStr is "HH:mm:ss", format to e.g. "9:00am"
  const [h, m] = timeStr.split(":");
  const hour = parseInt(h, 10);
  const ampm = hour >= 12 ? "pm" : "am";
  const hour12 = hour % 12 || 12;
  const timeFormatted = `${hour12}:${m}${ampm}`;
  return { display: `${dayName} ${dayNum} ${month}`, time: timeFormatted };
};

const Profile = () => {
  const navigate = useNavigate();

  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const { data } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
      return data;
    },
  });

  const { data: bookings } = useQuery({
    queryKey: ["my-bookings"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      const { data } = await supabase
        .from("bookings")
        .select("*, run_dates(*)")
        .eq("user_id", user.id)
        .eq("status", "confirmed")
        .order("created_at", { ascending: false });
      return data || [];
    },
  });

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const initials = profile?.full_name
    ? profile.full_name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  const interests = (profile?.personality_answers as any)?.interests || [];

  return (
    <PageShell withBottomNav className="px-6 py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        {/* Avatar */}
        <div className="flex flex-col items-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground">
            {initials}
          </div>
          <h1 className="mt-4 font-serif text-2xl">{profile?.full_name || "Your Profile"}</h1>
          <div className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPin size={13} />
            <span>{profile?.location_city || "Unknown"}{profile?.location_area ? `, ${profile.location_area}` : ""}</span>
          </div>
        </div>

        {/* Interests */}
        {interests.length > 0 && (
          <div className="mt-8">
            <h2 className="mb-3 text-sm font-medium text-muted-foreground uppercase tracking-wider font-sans">Interests</h2>
            <div className="flex flex-wrap gap-2">
              {interests.map((interest: string) => (
                <span
                  key={interest}
                  className="rounded-full border border-border bg-secondary px-3.5 py-1.5 text-sm text-foreground"
                >
                  {interest}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* My Bookings */}
        <div className="mt-8">
          <h2 className="mb-3 text-sm font-medium text-muted-foreground uppercase tracking-wider font-sans">My Bookings</h2>
          {bookings && bookings.length > 0 ? (
            <div className="space-y-3">
              {bookings.map((booking: any) => {
                const rd = booking.run_dates;
                if (!rd) return null;
                const { display, time } = formatRunDate(rd.date, rd.time);
                return (
                  <div key={booking.id} className="rounded-xl border border-border bg-card p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-foreground">{display}</p>
                        <p className="text-sm text-muted-foreground">{time} · {rd.meeting_point}</p>
                      </div>
                      <span className="rounded-full bg-accent/20 px-3 py-1 text-xs font-medium text-accent">
                        Confirmed
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No bookings yet.</p>
          )}
        </div>

        {/* Account Actions */}
        <div className="mt-12 space-y-3">
          <Button
            variant="ghost"
            onClick={() => navigate("/settings")}
            className="w-full justify-start gap-3 py-6 text-muted-foreground hover:text-foreground"
          >
            <Settings size={18} />
            Settings
          </Button>
          <Button
            variant="ghost"
            onClick={handleSignOut}
            className="w-full justify-start gap-3 py-6 text-muted-foreground hover:text-foreground"
          >
            <LogOut size={18} />
            Sign out
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 py-6 text-destructive hover:text-destructive"
          >
            <Trash2 size={18} />
            Delete account
          </Button>
        </div>
      </motion.div>

      <BottomNav />
    </PageShell>
  );
};

export default Profile;

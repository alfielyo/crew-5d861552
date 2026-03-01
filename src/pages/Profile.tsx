import { motion } from "framer-motion";
import { User, MapPin, LogOut, Trash2 } from "lucide-react";
import PageShell from "@/components/PageShell";
import BottomNav from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

const Profile = () => {
  const navigate = useNavigate();

  // Mock data
  const user = {
    fullName: "Alfie Johnson",
    age: 27,
    city: "Battersea",
    interests: ["Running", "Coffee", "Music", "Travel", "Wellness"],
    initials: "AJ",
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  return (
    <PageShell withBottomNav className="px-6 py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        {/* Avatar */}
        <div className="flex flex-col items-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground">
            {user.initials}
          </div>
          <h1 className="mt-4 font-serif text-2xl">{user.fullName}</h1>
          <div className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPin size={13} />
            <span>{user.city} · {user.age}</span>
          </div>
        </div>

        {/* Interests */}
        <div className="mt-8">
          <h2 className="mb-3 text-sm font-medium text-muted-foreground uppercase tracking-wider">Interests</h2>
          <div className="flex flex-wrap gap-2">
            {user.interests.map((interest) => (
              <span
                key={interest}
                className="rounded-full border border-border bg-secondary px-3.5 py-1.5 text-sm text-foreground"
              >
                {interest}
              </span>
            ))}
          </div>
        </div>

        {/* My Bookings */}
        <div className="mt-8">
          <h2 className="mb-3 text-sm font-medium text-muted-foreground uppercase tracking-wider">My Bookings</h2>
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Sunday 2nd March</p>
                <p className="text-sm text-muted-foreground">9:00am · Battersea Park</p>
              </div>
              <span className="rounded-full bg-accent/20 px-3 py-1 text-xs font-medium text-accent">
                Confirmed
              </span>
            </div>
          </div>
        </div>

        {/* Account Actions */}
        <div className="mt-12 space-y-3">
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

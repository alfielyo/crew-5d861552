import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import PageShell from "@/components/PageShell";
import BottomNav from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, ChevronRight, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import LocationSearch, { type LocationResult } from "@/components/LocationSearch";

const Settings = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const { data } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
      return data;
    },
  });

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [locationData, setLocationData] = useState<LocationResult | null>(null);
  const [notifBookings, setNotifBookings] = useState(true);
  const [notifGroups, setNotifGroups] = useState(true);
  const [notifReminders, setNotifReminders] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || "");
      setPhone(profile.phone || "");
      const city = profile.location_city || "";
      const area = profile.location_area || "";
      const country = profile.location_country || "";
      const display = [city, area, country].filter(Boolean).join(", ");
      setLocation(display);
      setLocationData({ displayName: display, city, area, country });

      const pa = profile.personality_answers as any;
      if (pa?.notifications) {
        setNotifBookings(pa.notifications.bookings ?? true);
        setNotifGroups(pa.notifications.groups ?? true);
        setNotifReminders(pa.notifications.reminders ?? true);
      }
    }
  }, [profile]);

  const markDirty = () => setDirty(true);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const existingAnswers = (profile?.personality_answers as any) || {};

      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: fullName.trim(),
          location_city: locationData?.city || "",
          location_country: locationData?.country || "",
          location_area: locationData?.area || "",
          personality_answers: {
            ...existingAnswers,
            notifications: {
              bookings: notifBookings,
              groups: notifGroups,
              reminders: notifReminders,
            },
          },
        })
        .eq("id", user.id);

      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      setDirty(false);
      toast({ title: "Settings saved" });
    } catch (err: any) {
      toast({ title: "Error saving", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return (
      <PageShell withBottomNav className="flex items-center justify-center">
        <p className="text-muted-foreground">Loading…</p>
        <BottomNav />
      </PageShell>
    );
  }

  return (
    <PageShell withBottomNav className="px-6 py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <button onClick={() => navigate("/profile")} className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
          <ArrowLeft size={16} /> Back to profile
        </button>

        <h1 className="font-serif text-2xl">Settings</h1>

        {/* Personal Information */}
        <section className="mt-8">
          <h2 className="mb-4 text-sm font-medium text-muted-foreground uppercase tracking-wider">Personal Information</h2>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Full name</Label>
              <Input id="name" value={fullName}
                onChange={(e) => { setFullName(e.target.value); markDirty(); }}
                className="mt-1.5 border-border bg-secondary" />
            </div>
            <div>
              <Label>Location</Label>
              <div className="mt-1.5">
                <LocationSearch value={location}
                  onSelect={(loc) => { setLocationData(loc); setLocation(loc.displayName); markDirty(); }}
                  onChange={(val) => {
                    setLocation(val);
                    if (locationData && val !== locationData.displayName) setLocationData(null);
                    markDirty();
                  }}
                />
              </div>
            </div>
          </div>
        </section>

        {/* Notification Preferences */}
        <section className="mt-10">
          <h2 className="mb-4 text-sm font-medium text-muted-foreground uppercase tracking-wider">Notifications</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="notif-bookings">Booking confirmations</Label>
              <Switch id="notif-bookings" checked={notifBookings}
                onCheckedChange={(v) => { setNotifBookings(v); markDirty(); }} />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="notif-groups">Group updates</Label>
              <Switch id="notif-groups" checked={notifGroups}
                onCheckedChange={(v) => { setNotifGroups(v); markDirty(); }} />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="notif-reminders">Run reminders</Label>
              <Switch id="notif-reminders" checked={notifReminders}
                onCheckedChange={(v) => { setNotifReminders(v); markDirty(); }} />
            </div>
          </div>
        </section>

        {/* Questionnaire */}
        <section className="mt-10">
          <h2 className="mb-4 text-sm font-medium text-muted-foreground uppercase tracking-wider">Interests & Personality</h2>
          <button
            onClick={() => navigate("/onboarding/1?mode=retake")}
            className="flex w-full items-center justify-between rounded-xl border border-border bg-card p-4 transition-colors hover:bg-secondary"
          >
            <div className="flex items-center gap-3">
              <RefreshCw size={18} className="text-muted-foreground" />
              <div className="text-left">
                <p className="font-medium text-foreground">Retake questionnaire</p>
                <p className="text-sm text-muted-foreground">Update your interests and personality answers</p>
              </div>
            </div>
            <ChevronRight size={18} className="text-muted-foreground" />
          </button>
        </section>

        {/* Save button */}
        {dirty && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-8">
            <Button onClick={handleSave} disabled={saving}
              className="w-full bg-primary py-6 text-base font-semibold text-primary-foreground">
              {saving ? "Saving…" : "Save Changes"}
            </Button>
          </motion.div>
        )}
      </motion.div>

      <BottomNav />
    </PageShell>
  );
};

export default Settings;

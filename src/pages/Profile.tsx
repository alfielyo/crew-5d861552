import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { MapPin, LogOut, Trash2, Camera, Pencil, X, Check, Lock, Mail } from "lucide-react";
import PageShell from "@/components/PageShell";
import BottomNav from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import PillOption from "@/components/PillOption";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { format, parseISO, isBefore, subHours } from "date-fns";

const INTERESTS = [
  "Reading", "Music", "Cooking", "Socialising", "Education", "Technology",
  "Gaming", "Photography", "Fitness", "Self Improvement", "Politics", "Entrepreneurship",
];

type ProfileData = {
  full_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  fitness_level: string | null;
  location_city: string | null;
  location_area: string | null;
  personality_answers: any;
};

type Booking = {
  id: string;
  status: string;
  run_date: {
    id: string;
    date: string;
    time: string;
    meeting_point: string;
  };
};

const Profile = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  // Edit states
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [editingInterests, setEditingInterests] = useState(false);
  const [interestsInput, setInterestsInput] = useState<string[]>([]);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [emailInput, setEmailInput] = useState("");
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { navigate("/login"); return; }
    setUserId(user.id);
    setUserEmail(user.email ?? null);

    const [profileRes, bookingsRes] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).single(),
      supabase.from("bookings").select("*, run_date:run_dates(id, date, time, meeting_point)").eq("user_id", user.id).eq("status", "confirmed"),
    ]);

    if (profileRes.data) setProfile(profileRes.data as any);
    if (bookingsRes.data) setBookings(bookingsRes.data as any);
    setLoading(false);
  };

  const interests: string[] = profile?.personality_answers?.interests ?? [];
  const initials = profile?.full_name
    ? profile.full_name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  const avatarUrl = profile?.avatar_url
    ? `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/avatars/${profile.avatar_url}`
    : null;

  // --- Avatar upload ---
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userId) return;
    const ext = file.name.split(".").pop();
    const path = `${userId}/avatar.${ext}`;

    setSaving(true);
    const { error: uploadError } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (uploadError) {
      toast({ title: "Upload failed", description: uploadError.message, variant: "destructive" });
      setSaving(false);
      return;
    }
    const { error } = await supabase.from("profiles").update({ avatar_url: path }).eq("id", userId);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else {
      toast({ title: "Photo updated" });
      await fetchData();
    }
    setSaving(false);
  };

  // --- Save name ---
  const handleSaveName = async () => {
    if (!userId || nameInput.trim().length < 2) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update({ full_name: nameInput.trim() }).eq("id", userId);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: "Name updated" }); await fetchData(); }
    setEditingName(false);
    setSaving(false);
  };

  // --- Save interests ---
  const handleSaveInterests = async () => {
    if (!userId || interestsInput.length < 3) return;
    setSaving(true);
    const updatedAnswers = { ...(profile?.personality_answers || {}), interests: interestsInput };
    const { error } = await supabase.from("profiles").update({ personality_answers: updatedAnswers }).eq("id", userId);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: "Interests updated" }); await fetchData(); }
    setEditingInterests(false);
    setSaving(false);
  };

  // --- Update email ---
  const handleUpdateEmail = async () => {
    if (!emailInput.trim()) return;
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ email: emailInput.trim() });
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else toast({ title: "Confirmation sent", description: "Check your new email to confirm the change." });
    setEmailDialogOpen(false);
    setSaving(false);
  };

  // --- Update password ---
  const handleUpdatePassword = async () => {
    if (passwordInput.length < 8) {
      toast({ title: "Password too short", description: "Minimum 8 characters.", variant: "destructive" });
      return;
    }
    if (passwordInput !== passwordConfirm) {
      toast({ title: "Passwords don't match", variant: "destructive" });
      return;
    }
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password: passwordInput });
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else toast({ title: "Password updated" });
    setPasswordDialogOpen(false);
    setPasswordInput("");
    setPasswordConfirm("");
    setSaving(false);
  };

  // --- Cancel booking ---
  const canCancelBooking = (booking: Booking) => {
    try {
      const runDateTime = parseISO(`${booking.run_date.date}T${booking.run_date.time}`);
      const cutoff = subHours(runDateTime, 48);
      return isBefore(new Date(), cutoff);
    } catch { return false; }
  };

  const handleCancelBooking = async (bookingId: string) => {
    setCancellingId(bookingId);
    const { error } = await supabase.from("bookings").delete().eq("id", bookingId);
    if (error) toast({ title: "Error cancelling", description: error.message, variant: "destructive" });
    else { toast({ title: "Booking cancelled" }); await fetchData(); }
    setCancellingId(null);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const locationDisplay = profile?.location_city && profile?.location_area
    ? `${profile.location_city}, ${profile.location_area}`
    : profile?.location_area || profile?.location_city || null;

  if (loading) {
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
        {/* Avatar */}
        <div className="flex flex-col items-center">
          <div className="relative">
            {avatarUrl ? (
              <img src={avatarUrl} alt="Profile" className="h-20 w-20 rounded-full object-cover border border-border" />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground">
                {initials}
              </div>
            )}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full border border-border bg-background text-muted-foreground hover:text-foreground transition-colors"
            >
              <Camera size={14} />
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
          </div>

          {/* Name */}
          {editingName ? (
            <div className="mt-4 flex items-center gap-2">
              <Input
                autoFocus
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                className="border-border bg-secondary text-center text-lg"
                placeholder="Your name"
              />
              <button onClick={handleSaveName} disabled={saving} className="text-foreground"><Check size={18} /></button>
              <button onClick={() => setEditingName(false)} className="text-muted-foreground"><X size={18} /></button>
            </div>
          ) : (
            <button
              onClick={() => { setNameInput(profile?.full_name || ""); setEditingName(true); }}
              className="mt-4 flex items-center gap-2 group"
            >
              <h1 className="font-serif text-2xl">{profile?.full_name || "Set your name"}</h1>
              <Pencil size={14} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          )}

          {/* Location */}
          {locationDisplay && (
            <div className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
              <MapPin size={13} />
              <span>{locationDisplay}</span>
            </div>
          )}
          <p className="mt-1 text-xs text-muted-foreground">Exact routes revealed after matching</p>
        </div>

        {/* Interests */}
        <div className="mt-8">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Interests</h2>
            {!editingInterests && (
              <button
                onClick={() => { setInterestsInput([...interests]); setEditingInterests(true); }}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <Pencil size={14} />
              </button>
            )}
          </div>
          {editingInterests ? (
            <div>
              <div className="flex flex-wrap gap-2">
                {INTERESTS.map((interest) => (
                  <PillOption
                    key={interest}
                    selected={interestsInput.includes(interest)}
                    onClick={() => {
                      setInterestsInput((prev) =>
                        prev.includes(interest) ? prev.filter((i) => i !== interest) : [...prev, interest]
                      );
                    }}
                  >
                    {interest}
                  </PillOption>
                ))}
              </div>
              <div className="mt-3 flex gap-2">
                <Button size="sm" onClick={handleSaveInterests} disabled={saving || interestsInput.length < 3}>
                  Save ({interestsInput.length})
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setEditingInterests(false)}>Cancel</Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {interests.length > 0 ? interests.map((interest: string) => (
                <span key={interest} className="rounded-full border border-border bg-secondary px-3.5 py-1.5 text-sm text-foreground">
                  {interest}
                </span>
              )) : (
                <p className="text-sm text-muted-foreground">No interests set</p>
              )}
            </div>
          )}
        </div>

        {/* My Bookings */}
        <div className="mt-8">
          <h2 className="mb-3 text-sm font-medium text-muted-foreground uppercase tracking-wider">My Bookings</h2>
          {bookings.length === 0 ? (
            <p className="text-sm text-muted-foreground">No upcoming bookings</p>
          ) : (
            <div className="space-y-3">
              {bookings.map((booking) => {
                const cancellable = canCancelBooking(booking);
                const dateStr = (() => {
                  try {
                    return format(parseISO(booking.run_date.date), "EEEE do MMMM");
                  } catch { return booking.run_date.date; }
                })();
                return (
                  <div key={booking.id} className="rounded-xl border border-border bg-card p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-foreground">{dateStr}</p>
                        <p className="text-sm text-muted-foreground">
                          {booking.run_date.time.slice(0, 5)} · London, Battersea
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          Exact location revealed after matching
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-foreground">
                          Confirmed
                        </span>
                        {cancellable ? (
                          <button
                            onClick={() => handleCancelBooking(booking.id)}
                            disabled={cancellingId === booking.id}
                            className="text-xs text-destructive hover:underline"
                          >
                            {cancellingId === booking.id ? "Cancelling…" : "Cancel"}
                          </button>
                        ) : (
                          <span className="text-xs text-muted-foreground">Cannot cancel &lt;48h</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Account Actions */}
        <div className="mt-10 space-y-1">
          <h2 className="mb-3 text-sm font-medium text-muted-foreground uppercase tracking-wider">Account</h2>
          <Button
            variant="ghost"
            onClick={() => { setEmailInput(userEmail || ""); setEmailDialogOpen(true); }}
            className="w-full justify-start gap-3 py-5 text-muted-foreground hover:text-foreground"
          >
            <Mail size={18} />
            Change email
          </Button>
          <Button
            variant="ghost"
            onClick={() => setPasswordDialogOpen(true)}
            className="w-full justify-start gap-3 py-5 text-muted-foreground hover:text-foreground"
          >
            <Lock size={18} />
            Change password
          </Button>
          <Button
            variant="ghost"
            onClick={handleSignOut}
            className="w-full justify-start gap-3 py-5 text-muted-foreground hover:text-foreground"
          >
            <LogOut size={18} />
            Sign out
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 py-5 text-destructive hover:text-destructive"
          >
            <Trash2 size={18} />
            Delete account
          </Button>
        </div>
      </motion.div>

      {/* Email Dialog */}
      <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change email</DialogTitle>
            <DialogDescription>A confirmation will be sent to your new email address.</DialogDescription>
          </DialogHeader>
          <Input value={emailInput} onChange={(e) => setEmailInput(e.target.value)} placeholder="New email" type="email" />
          <Button onClick={handleUpdateEmail} disabled={saving}>
            {saving ? "Saving…" : "Update email"}
          </Button>
        </DialogContent>
      </Dialog>

      {/* Password Dialog */}
      <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change password</DialogTitle>
            <DialogDescription>Minimum 8 characters with uppercase, lowercase, number and special character.</DialogDescription>
          </DialogHeader>
          <Input value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)} placeholder="New password" type="password" />
          <Input value={passwordConfirm} onChange={(e) => setPasswordConfirm(e.target.value)} placeholder="Confirm password" type="password" />
          <Button onClick={handleUpdatePassword} disabled={saving}>
            {saving ? "Saving…" : "Update password"}
          </Button>
        </DialogContent>
      </Dialog>

      <BottomNav />
    </PageShell>
  );
};

export default Profile;

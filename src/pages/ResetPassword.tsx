import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import PageShell from "@/components/PageShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

const PASSWORD_RULES = [
  { test: (p: string) => p.length >= 8, label: "At least 8 characters" },
  { test: (p: string) => /[A-Z]/.test(p), label: "One uppercase letter" },
  { test: (p: string) => /[a-z]/.test(p), label: "One lowercase letter" },
  { test: (p: string) => /[0-9]/.test(p), label: "One number" },
  { test: (p: string) => /[^A-Za-z0-9]/.test(p), label: "One special character" },
];

const ResetPassword = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setReady(true);
      }
    });

    // Also check hash for type=recovery (handles page refresh)
    const hash = window.location.hash;
    if (hash.includes("type=recovery")) {
      setReady(true);
    }

    return () => subscription.unsubscribe();
  }, []);

  const allRulesPass = PASSWORD_RULES.every((r) => r.test(password));
  const passwordsMatch = password === confirm && confirm.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!allRulesPass || !passwordsMatch) return;

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      toast({ title: "Failed to update password. Please try again.", variant: "destructive" });
    } else {
      toast({ title: "Password updated successfully" });
      await supabase.auth.signOut();
      navigate("/login");
    }
  };

  if (!ready) {
    return (
      <PageShell className="flex flex-col items-center justify-center px-6 py-8">
        <p className="text-muted-foreground">Verifying your reset link…</p>
      </PageShell>
    );
  }

  return (
    <PageShell className="flex flex-col px-6 py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-serif text-3xl">Set new password</h1>
        <p className="mt-2 text-muted-foreground">Choose a strong password for your account.</p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div>
            <Label htmlFor="password">New password</Label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              className="mt-1.5 border-border bg-secondary" placeholder="New password" />
            <ul className="mt-2 space-y-1">
              {PASSWORD_RULES.map((rule) => (
                <li key={rule.label} className={`text-xs ${rule.test(password) ? "text-green-500" : "text-muted-foreground"}`}>
                  {rule.test(password) ? "✓" : "○"} {rule.label}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <Label htmlFor="confirm">Confirm password</Label>
            <Input id="confirm" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)}
              className="mt-1.5 border-border bg-secondary" placeholder="Confirm password" />
            {confirm && !passwordsMatch && (
              <p className="mt-1 text-xs text-destructive">Passwords do not match</p>
            )}
          </div>
          <Button type="submit" disabled={loading || !allRulesPass || !passwordsMatch}
            className="w-full bg-primary py-6 text-base font-semibold text-primary-foreground">
            {loading ? "Updating..." : "Update password"}
          </Button>
        </form>
      </motion.div>
    </PageShell>
  );
};

export default ResetPassword;

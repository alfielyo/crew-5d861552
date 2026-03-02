import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import PageShell from "@/components/PageShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft } from "lucide-react";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) {
      toast({ title: "Something went wrong. Please try again.", variant: "destructive" });
    } else {
      setSent(true);
    }
  };

  return (
    <PageShell className="flex flex-col px-6 py-8">
      <button onClick={() => navigate("/login")} className="mb-8 flex items-center gap-2 text-sm text-muted-foreground">
        <ArrowLeft size={16} /> Back to login
      </button>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-serif text-3xl">Reset password</h1>

        {sent ? (
          <p className="mt-4 text-muted-foreground">
            If an account exists for <span className="text-foreground font-medium">{email}</span>, you'll receive a password reset link shortly. Check your inbox.
          </p>
        ) : (
          <>
            <p className="mt-2 text-muted-foreground">Enter your email and we'll send you a reset link.</p>
            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                  className="mt-1.5 border-border bg-secondary" placeholder="you@email.com" />
              </div>
              <Button type="submit" disabled={loading} className="w-full bg-primary py-6 text-base font-semibold text-primary-foreground">
                {loading ? "Sending..." : "Send reset link"}
              </Button>
            </form>
          </>
        )}
      </motion.div>
    </PageShell>
  );
};

export default ForgotPassword;

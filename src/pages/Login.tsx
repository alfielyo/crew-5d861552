import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import PageShell from "@/components/PageShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft } from "lucide-react";
import { getAuthErrorMessage } from "@/lib/auth-errors";

const Login = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast({ title: getAuthErrorMessage(error.message), variant: "destructive" });
    } else {
      navigate("/home");
    }
  };

  const handleMagicLink = async () => {
    if (!email) {
      toast({ title: "Enter your email first", variant: "destructive" });
      return;
    }
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin + "/home" },
    });
    if (error) {
      toast({ title: getAuthErrorMessage(error.message), variant: "destructive" });
    } else {
      toast({ title: "Check your email for a sign-in link" });
    }
  };

  return (
    <PageShell className="flex flex-col px-6 py-8">
      <button onClick={() => navigate("/")} className="mb-8 flex items-center gap-2 text-sm text-muted-foreground">
        <ArrowLeft size={16} /> Back
      </button>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-serif text-3xl">Welcome back</h1>
        <p className="mt-2 text-muted-foreground">Let's get you signed in.</p>

        <form onSubmit={handleLogin} className="mt-8 space-y-5">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
              className="mt-1.5 border-border bg-secondary" placeholder="you@email.com" />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
              className="mt-1.5 border-border bg-secondary" placeholder="Your password" />
          </div>
          <Button type="submit" disabled={loading} className="w-full bg-primary py-6 text-base font-semibold text-primary-foreground">
            {loading ? "Signing in..." : "Log In"}
          </Button>
        </form>

        <div className="mt-4 flex flex-col items-center gap-3">
          <button onClick={handleMagicLink} className="text-sm text-primary hover:underline">
            Email me a sign-in link
          </button>
          <Link to="/forgot-password" className="text-sm text-muted-foreground hover:underline">
            Forgot password?
          </Link>
        </div>

        <p className="mt-8 text-center text-sm text-muted-foreground">
          Don't have an account?{" "}
          <Link to="/signup" className="text-primary hover:underline">Sign up</Link>
        </p>
      </motion.div>
    </PageShell>
  );
};

export default Login;

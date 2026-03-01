import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import PageShell from "@/components/PageShell";
import { Button } from "@/components/ui/button";
import { Shield } from "lucide-react";

const Consent = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleConsent = async () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      navigate("/onboarding/1");
    }, 500);
  };

  return (
    <PageShell className="flex flex-col px-5 py-10 sm:px-8 lg:mx-auto lg:max-w-lg lg:py-16">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-1 flex-col">
        <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary">
          <Shield size={24} className="text-primary" />
        </div>

        <h1 className="font-serif">Your data, your call</h1>

        <div className="mt-5 space-y-4 text-muted-foreground">
          <p>To match you with the right crew, we'll collect:</p>
          <ul className="ml-1 list-inside list-disc space-y-1.5 text-sm">
            <li>Your name, date of birth & location</li>
            <li>Gender identity</li>
            <li>Interests & personality answers</li>
          </ul>
          <p className="text-sm">
            This data is used <span className="font-medium text-foreground">solely for group matching</span>.
            It's never sold or shared with third parties.
          </p>
          <a href="#" className="inline-block text-sm text-primary hover:underline">
            Read our full Privacy Policy →
          </a>
        </div>

        <div className="mt-auto space-y-3 pt-10">
          <Button
            onClick={handleConsent}
            disabled={loading}
            className="w-full bg-primary py-6 text-base font-semibold text-primary-foreground"
          >
            {loading ? "Setting up..." : "I Agree — Let's Go"}
          </Button>
          <Button variant="ghost" className="w-full py-6 text-sm text-destructive hover:text-destructive">
            Delete my account
          </Button>
        </div>
      </motion.div>
    </PageShell>
  );
};

export default Consent;

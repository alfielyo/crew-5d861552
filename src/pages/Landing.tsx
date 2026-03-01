import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import PageShell from "@/components/PageShell";
import { Button } from "@/components/ui/button";

const Landing = () => {
  const navigate = useNavigate();

  return (
    <PageShell className="flex flex-col">
      <div className="flex flex-1 flex-col justify-between px-6 py-12">
        {/* Hero */}
        <div className="flex-1 flex-col flex items-start justify-center">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-4 text-sm font-medium uppercase tracking-widest text-muted-foreground">

            Every week · Battersea, London
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="font-serif text-5xl leading-[1.1] sm:text-6xl">

            Find your{" "}
            <span className="text-primary">Crew</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="mt-6 max-w-sm text-lg leading-relaxed text-muted-foreground">
            Meet new people that actually fit.
          </motion.p>
        </div>

        {/* How it works */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="my-12">

          <h2 className="mb-6 font-serif text-xl text-foreground">How it works</h2>
          <div className="space-y-4">
            {[
            { step: "01", title: "Sign up", desc: "Create your account in 30 seconds" },
            { step: "02", title: "Tell us about you", desc: "Quick personality quiz for better matching" },
            { step: "03", title: "Run with your crew", desc: "Meet your matched group every week" }].
            map((item) =>
            <div key={item.step} className="flex items-start gap-4">
                <span className="font-serif text-2xl text-primary">{item.step}</span>
                <div>
                  <p className="font-medium text-foreground">{item.title}</p>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.65 }}
          className="space-y-3">

          <Button
            onClick={() => navigate("/signup")}
            className="w-full bg-primary py-6 text-base font-semibold text-primary-foreground hover:bg-primary/90">

            Book Your Spot
            <ArrowRight size={18} className="ml-2" />
          </Button>
          <Button
            variant="ghost"
            onClick={() => navigate("/login")}
            className="w-full py-6 text-base text-muted-foreground hover:text-foreground">

            Already have an account? Log in
          </Button>
        </motion.div>
      </div>
    </PageShell>);

};

export default Landing;
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Check } from "lucide-react";
import PageShell from "@/components/PageShell";
import { Button } from "@/components/ui/button";

const BookingSuccess = () => {
  const navigate = useNavigate();

  return (
    <PageShell className="flex flex-col items-center justify-center px-5 py-10 sm:px-8 lg:py-16">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 15 }}
        className="flex h-20 w-20 items-center justify-center rounded-full bg-accent"
      >
        <Check size={36} className="text-accent-foreground" />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mt-6 text-center"
      >
        <h1 className="font-serif">You're booked! 🏃</h1>
        <p className="mt-3 text-muted-foreground">See you in Battersea</p>
        <p className="mt-5 text-sm text-muted-foreground">
          Your crew will be matched 48 hours before the run. We'll email you when they're ready.
        </p>
      </motion.div>

      <Button
        onClick={() => navigate("/home")}
        variant="ghost"
        className="mt-10 text-primary hover:text-primary"
      >
        Back to Home
      </Button>
    </PageShell>
  );
};

export default BookingSuccess;

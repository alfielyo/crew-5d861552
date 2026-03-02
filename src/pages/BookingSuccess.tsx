import { motion } from "framer-motion";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Check, Loader2 } from "lucide-react";
import PageShell from "@/components/PageShell";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

const BookingSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const [confirming, setConfirming] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const sessionId = searchParams.get("session_id");
    if (!sessionId) {
      setConfirming(false);
      return;
    }

    const confirmBooking = async () => {
      try {
        const { data, error: fnError } = await supabase.functions.invoke("confirm-booking", {
          body: { session_id: sessionId },
        });

        if (fnError) throw fnError;
        if (data?.error) throw new Error(data.error);

        // Invalidate all booking/run related queries so they refetch
        queryClient.invalidateQueries({ queryKey: ["my-next-booking"] });
        queryClient.invalidateQueries({ queryKey: ["my-bookings"] });
      } catch (err: any) {
        console.error("Booking confirmation error:", err);
        setError(err.message || "Failed to confirm booking");
      } finally {
        setConfirming(false);
      }
    };

    confirmBooking();
  }, [searchParams, queryClient]);

  if (confirming) {
    return (
      <PageShell className="flex flex-col items-center justify-center px-6 py-12">
        <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
        <p className="mt-4 text-sm text-muted-foreground">Confirming your booking...</p>
      </PageShell>
    );
  }

  return (
    <PageShell className="flex flex-col items-center justify-center px-6 py-12">
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
        <h1 className="font-serif text-3xl">You're booked! 🏃</h1>
        <p className="mt-3 text-muted-foreground">See you in Battersea</p>
        {error && (
          <p className="mt-3 text-sm text-destructive">
            {error}
          </p>
        )}
        <p className="mt-6 text-sm text-muted-foreground">
          Your crew will be matched 48 hours before the run. We'll email you when they're ready.
        </p>
      </motion.div>

      <Button
        onClick={() => navigate("/my-run")}
        variant="ghost"
        className="mt-12 text-primary hover:text-primary"
      >
        View My Run
      </Button>
    </PageShell>
  );
};

export default BookingSuccess;

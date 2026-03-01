import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { MapPin, Clock, AlertCircle } from "lucide-react";
import PageShell from "@/components/PageShell";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const BookingConfirm = () => {
  const navigate = useNavigate();

  const run = {
    date: "Sunday 2nd March 2025",
    time: "9:00am",
    meetingPoint: "Battersea Park Bandstand",
    price: 12,
    refundDeadline: "Friday 28th February at 9:00am",
  };

  const handlePay = () => {
    // TODO: POST to create_checkout_session Edge Function
    navigate("/booking/success");
  };

  return (
    <PageShell className="flex flex-col px-6 py-8">
      <button onClick={() => navigate("/home")} className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
        <ArrowLeft size={16} /> Back
      </button>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-serif text-2xl">Confirm your booking</h1>

        <div className="mt-8 rounded-2xl border border-border bg-card p-5 space-y-4">
          <div className="flex items-center gap-3">
            <Clock size={16} className="text-muted-foreground" />
            <span className="text-sm">{run.date} · {run.time}</span>
          </div>
          <div className="flex items-center gap-3">
            <MapPin size={16} className="text-muted-foreground" />
            <span className="text-sm">{run.meetingPoint}</span>
          </div>
          <div className="border-t border-border pt-4">
            <div className="flex items-center justify-between text-lg font-semibold">
              <span>Total</span>
              <span>£{run.price}</span>
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-start gap-3 rounded-xl bg-secondary p-4">
          <AlertCircle size={16} className="mt-0.5 shrink-0 text-muted-foreground" />
          <p className="text-xs text-muted-foreground">
            Full refund available until {run.refundDeadline}. No refunds after this point.
          </p>
        </div>

        <Button
          onClick={handlePay}
          className="mt-8 w-full bg-primary py-6 text-base font-semibold text-primary-foreground"
        >
          Pay £{run.price} with Stripe
        </Button>
      </motion.div>
    </PageShell>
  );
};

export default BookingConfirm;

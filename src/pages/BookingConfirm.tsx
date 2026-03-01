import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { MapPin, Clock, AlertCircle, ArrowLeft } from "lucide-react";
import PageShell from "@/components/PageShell";
import { Button } from "@/components/ui/button";

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
    navigate("/booking/success");
  };

  return (
    <PageShell className="flex flex-col px-5 py-6 sm:px-8 lg:mx-auto lg:max-w-md lg:py-12">
      <button onClick={() => navigate("/home")} className="mb-5 flex items-center gap-2 text-sm text-muted-foreground">
        <ArrowLeft size={16} /> Back
      </button>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-serif">Confirm your booking</h1>

        <div className="mt-6 space-y-4 rounded-2xl border border-border bg-card p-4 sm:mt-8 sm:p-5">
          <div className="flex items-center gap-3">
            <Clock size={16} className="shrink-0 text-muted-foreground" />
            <span className="text-sm">{run.date} · {run.time}</span>
          </div>
          <div className="flex items-center gap-3">
            <MapPin size={16} className="shrink-0 text-muted-foreground" />
            <span className="text-sm">{run.meetingPoint}</span>
          </div>
          <div className="border-t border-border pt-4">
            <div className="flex items-center justify-between text-lg font-semibold">
              <span>Total</span>
              <span>£{run.price}</span>
            </div>
          </div>
        </div>

        <div className="mt-5 flex items-start gap-3 rounded-xl bg-secondary p-3 sm:p-4">
          <AlertCircle size={16} className="mt-0.5 shrink-0 text-muted-foreground" />
          <p className="text-xs text-muted-foreground">
            Full refund available until {run.refundDeadline}. No refunds after this point.
          </p>
        </div>

        <Button
          onClick={handlePay}
          className="mt-6 w-full bg-primary py-6 text-base font-semibold text-primary-foreground sm:mt-8"
        >
          Pay £{run.price} with Stripe
        </Button>
      </motion.div>
    </PageShell>
  );
};

export default BookingConfirm;

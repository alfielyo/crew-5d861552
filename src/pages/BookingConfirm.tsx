import { motion } from "framer-motion";
import { useNavigate, useSearchParams } from "react-router-dom";
import { MapPin, Clock, AlertCircle, Tag, Loader2, ArrowLeft } from "lucide-react";
import PageShell from "@/components/PageShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { loadStripe } from "@stripe/stripe-js";
import {
  EmbeddedCheckoutProvider,
  EmbeddedCheckout,
} from "@stripe/react-stripe-js";

const stripePromise = loadStripe("pk_test_51SChk7Q2y75tNzN9K23scaL22UvVPWO0sshObJAe435sojfG3uRh3xZXt8UOcFjirsUbV2ODkWwmrlejMSP2eZSy008FLcHtel");

const BookingConfirm = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [discountCode, setDiscountCode] = useState("");
  const [showCheckout, setShowCheckout] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [runData, setRunData] = useState<{
    id: string;
    date: string;
    time: string;
    meeting_point: string;
    price_pence: number;
  } | null>(null);

  const runId = searchParams.get("run");

  useEffect(() => {
    const loadRun = async () => {
      if (!runId) return;
      const { data } = await supabase
        .from("run_dates")
        .select("id, date, time, meeting_point, price_pence")
        .eq("id", runId)
        .maybeSingle();
      if (data) setRunData(data);
    };
    loadRun();
  }, [runId]);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  };

  const getRefundDeadline = (dateStr: string, timeStr: string) => {
    const d = new Date(dateStr);
    d.setDate(d.getDate() - 2);
    return d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" }) + ` at ${timeStr}`;
  };

  const handlePay = async () => {
    if (!runData) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: {
          run_date_id: runData.id,
          discount_code: discountCode.trim() || undefined,
        },
      });

      if (error) throw error;
      if (data?.error) {
        toast({ title: data.error, variant: "destructive" });
        setLoading(false);
        return;
      }
      if (data?.clientSecret) {
        setClientSecret(data.clientSecret);
        setShowCheckout(true);
      }
    } catch (err: any) {
      toast({ title: "Payment failed", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (!runData) {
    return (
      <PageShell className="flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </PageShell>
    );
  }

  const price = (runData.price_pence / 100).toFixed(2);

  // Show embedded checkout
  if (showCheckout && clientSecret) {
    return (
      <PageShell className="flex flex-col px-6 py-8">
        <button
          onClick={() => setShowCheckout(false)}
          className="mb-6 flex items-center gap-2 text-sm text-muted-foreground"
        >
          <ArrowLeft size={16} /> Back to details
        </button>
        <h1 className="font-serif text-2xl mb-6">Complete payment</h1>
        <div className="rounded-sm border border-border overflow-hidden">
          <EmbeddedCheckoutProvider stripe={stripePromise} options={{ clientSecret }}>
            <EmbeddedCheckout />
          </EmbeddedCheckoutProvider>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell className="flex flex-col px-6 py-8">
      <button onClick={() => navigate("/home")} className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
        <ArrowLeft size={16} /> Back
      </button>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-serif text-2xl">Confirm your booking</h1>

        <div className="mt-8 rounded-sm border border-border bg-card p-5 space-y-4">
          <div className="flex items-center gap-3">
            <Clock size={16} className="text-muted-foreground" />
            <span className="text-sm">{formatDate(runData.date)} · {runData.time}</span>
          </div>
          <div className="flex items-center gap-3">
            <MapPin size={16} className="text-muted-foreground" />
            <span className="text-sm">{runData.meeting_point}</span>
          </div>
          <div className="border-t border-border pt-4">
            <div className="flex items-center justify-between text-lg font-semibold">
              <span>Total</span>
              <span>£{price}</span>
            </div>
          </div>
        </div>

        {/* Discount Code */}
        <div className="mt-6">
          <label className="mb-2 flex items-center gap-2 text-sm font-medium">
            <Tag size={14} className="text-muted-foreground" />
            Discount code
          </label>
          <Input
            placeholder="Enter code"
            value={discountCode}
            onChange={(e) => setDiscountCode(e.target.value)}
            className="rounded-sm"
          />
        </div>

        <div className="mt-6 flex items-start gap-3 rounded-sm bg-secondary p-4">
          <AlertCircle size={16} className="mt-0.5 shrink-0 text-muted-foreground" />
          <p className="text-xs text-muted-foreground">
            Full refund available until {getRefundDeadline(runData.date, runData.time)}. No refunds after this point.
          </p>
        </div>

        <Button
          onClick={handlePay}
          disabled={loading}
          className="mt-8 w-full py-6 text-base font-semibold"
        >
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          {loading ? "Loading checkout..." : `Pay £${price}`}
        </Button>
      </motion.div>
    </PageShell>
  );
};

export default BookingConfirm;

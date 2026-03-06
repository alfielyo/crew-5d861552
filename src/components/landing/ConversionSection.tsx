import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Instagram, Activity, Mail } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const steps = [
{ num: "01", title: "Book your run", desc: "Pick a date, secure your spot. No recurring subscription. No commitment. Just one run at a time." },
{ num: "02", title: "Get matched", desc: "48 hours before the run, we group you with 6–7 others based on pace, age and interests." },
{ num: "03", title: "Run together", desc: "Meet at the Bandstand. Run the route. Grab a coffee at Mahali & Co." }];


const ConversionSection = () => {
  const navigate = useNavigate();

  const { data: nextRun } = useQuery({
    queryKey: ["next-run-public"],
    queryFn: async () => {
      const today = new Date().toISOString().split("T")[0];
      const { data } = await supabase.
      from("run_dates").
      select("date, time, meeting_point").
      gte("date", today).
      order("date", { ascending: true }).
      limit(1).
      maybeSingle();
      return data;
    }
  });

  const nextRunLabel = nextRun ?
  `Next run: ${new Date(nextRun.date).toLocaleDateString("en-GB", {
    weekday: "long", day: "numeric", month: "long"
  })}, ${nextRun.meeting_point ?? "Battersea Park"}, ${nextRun.time?.slice(0, 5)}` :
  "Next run: Saturday, Battersea Park, 7:30am";

  return (
    <>
      {/* How It Works */}
      <section className="w-full py-20 md:py-28 px-6 md:px-10 bg-primary-foreground">
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6 }}
          className="font-serif text-4xl md:text-5xl text-black mb-14 md:mb-20">
          
          Three steps to your crew.
        </motion.h2>
        <div className="grid md:grid-cols-3 gap-8 md:gap-12 max-w-5xl">
          {steps.map((step, i) =>
          <motion.div
            key={step.num}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.5, delay: i * 0.15 }}
            className="border border-black p-6 md:p-8 shadow-[4px_4px_0px_#000]">
            
              <span className="font-serif text-5xl text-black">{step.num}</span>
              <h3 className="font-serif text-2xl text-black mt-4 mb-3">{step.title}</h3>
              <p className="text-[#6B6B6B] text-sm leading-relaxed">{step.desc}</p>
            </motion.div>
          )}
        </div>
      </section>

      {/* CTA Banner */}
      <section className="w-full py-24 md:py-32 px-6 md:px-10 bg-primary">
        <div className="max-w-3xl mx-auto text-center">
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6 }}
            className="font-serif text-4xl md:text-6xl text-white mb-4">
            The weekend just got a whole lot better...
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="text-white/60 text-base md:text-lg mb-10">
            
            {nextRunLabel}
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4">
            
            <button
              onClick={() => navigate("/signup")}
              className="inline-flex items-center gap-2 bg-white text-black px-7 py-3.5 text-base font-medium shadow-[4px_4px_0px_#fff] hover:shadow-[6px_6px_0px_#fff] transition-shadow duration-200">
              
              Book your spot
              <ArrowRight size={18} />
            </button>
            <a href="#how-it-works" className="text-white/60 hover:text-white text-sm transition-colors">
              Learn more
            </a>
          </motion.div>
        </div>
      </section>

      {/* Contact */}
      <section className="w-full py-20 md:py-28 px-6 md:px-10 bg-primary-foreground">
        <div className="max-w-2xl">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6 }}
            className="font-serif text-4xl md:text-5xl text-black mb-6">
            
            Say hello.
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-[#6B6B6B] text-base md:text-lg mb-6">
            
            We're a small team running a passion project. Every message gets a real response.
          </motion.p>
          <motion.a
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            href="mailto:support@findurcrew.com"
            className="inline-flex items-center gap-2 text-black font-medium hover:underline">
            
            <Mail size={18} />
            support@findurcrew.com
          </motion.a>
          <div className="flex items-center gap-5 mt-6">
            <a href="#" className="inline-flex items-center gap-2 text-[#6B6B6B] hover:text-black transition-colors text-sm">
              <Instagram size={18} /> @findurcrew
            </a>
            <a href="#" className="inline-flex items-center gap-2 text-[#6B6B6B] hover:text-black transition-colors text-sm">
              <Activity size={18} /> CREW London
            </a>
          </div>
          <p className="text-xs text-black/50 mt-4">We aim to reply within 24 hours.</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full px-6 md:px-10 py-10 bg-primary">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <a href="#" className="font-serif text-2xl text-white">CREW</a>
          <nav className="flex items-center gap-6">
            {["Privacy", "Terms", "FAQ"].map((link) =>
            <a key={link} href="#" className="text-white/60 text-sm hover:text-white transition-colors">
                {link}
              </a>
            )}
          </nav>
          <div className="flex items-center gap-4">
            <a href="#" className="text-white/60 hover:text-white transition-colors">
              <Instagram size={18} />
            </a>
            <a href="#" className="text-white/60 hover:text-white transition-colors">
              <Activity size={18} />
            </a>
          </div>
        </div>
        <div className="border-t border-white/10 mt-6 pt-4 text-center">
          <p className="text-xs text-white/40">© 2026 CREW London. All rights reserved.</p>
        </div>
      </footer>
    </>);

};

export default ConversionSection;
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

/* ── Count-up hook ── */
function useCountUp(target: number, duration = 1500, start = false) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!start) return;
    let raf: number;
    const t0 = performance.now();
    const tick = (now: number) => {
      const progress = Math.min((now - t0) / duration, 1);
      setValue(Math.round(progress * target));
      if (progress < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration, start]);
  return value;
}

/* ── Stats data ── */
const stats = [
{ value: 847, suffix: "+", label: "Runners and counting" },
{ value: 4.9, suffix: "★", label: "Average run rating", decimal: true },
{ value: 12, suffix: "", label: "Battersea runs completed" },
{ value: 94, suffix: "%", label: "Come back for a second run" }];


function StatItem({ stat, inView }: {stat: typeof stats[0];inView: boolean;}) {
  const count = useCountUp(stat.decimal ? 49 : stat.value, 1200, inView);
  const display = stat.decimal ? (count / 10).toFixed(1) : count;
  return (
    <div className="flex flex-col items-center text-center px-4 py-6">
      <span className="font-serif text-4xl md:text-5xl text-black">
        {display}{stat.suffix}
      </span>
      <span className="mt-2 text-sm text-[#6B6B6B]">{stat.label}</span>
    </div>);

}

/* ── Testimonials ── */
const testimonials = [
{ quote: "I expected a workout. I got a friend group.", name: "Priya", age: 28, area: "Clapham" },
{ quote: "Showed up alone. Left with five people I actually want to see again.", name: "Tom", age: 34, area: "Brixton" },
{ quote: "I've run this park a hundred times. Never like this.", name: "Amara", age: 31, area: "Battersea" },
{ quote: "The matching is uncanny. We were the same kind of chaotic.", name: "Jess", age: 26, area: "Peckham" },
{ quote: "My Saturday mornings are now sacred.", name: "Marcus", age: 39, area: "Vauxhall" },
{ quote: "Finally a running club where you don't need to already know someone.", name: "Sofia", age: 29, area: "Stockwell" }];


/* ── Gallery images ── */
const galleryImages = [
"https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=600&q=80",
"https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=600&q=80",
"https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=600&q=80",
"https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&q=80"];


const SocialProofSection = () => {
  const statsRef = useRef<HTMLDivElement>(null);
  const [statsInView, setStatsInView] = useState(false);

  useEffect(() => {
    const el = statsRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {if (entry.isIntersecting) {setStatsInView(true);obs.disconnect();}},
      { threshold: 0.3 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <>
      {/* Stats Strip */}
      <section ref={statsRef} className="w-full border-y border-black bg-primary-foreground">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 divide-x divide-black">
          {stats.map((stat) =>
          <StatItem key={stat.label} stat={stat} inView={statsInView} />
          )}
        </div>
      </section>

      {/* Testimonials */}
      <section className="w-full py-20 md:py-28 px-6 md:px-10 bg-primary-foreground">
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6 }}
          className="font-serif text-4xl md:text-5xl text-black mb-12 md:mb-16">
          Don't take our word for it...
        </motion.h2>
        <div className="flex gap-6 overflow-x-auto pb-4 -mx-6 px-6 md:mx-0 md:px-0 md:grid md:grid-cols-3 md:overflow-visible snap-x snap-mandatory">
          {testimonials.map((t, i) =>
          <motion.div
            key={t.name}
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
            className="min-w-[80vw] md:min-w-0 snap-start border border-black p-6 md:p-8 shadow-[4px_4px_0px_#000] flex flex-col justify-between">
            
              <p className="font-serif text-xl md:text-2xl text-black leading-snug mb-6">
                "{t.quote}"
              </p>
              <p className="text-sm text-[#6B6B6B]">
                — {t.name}, {t.age} · {t.area}
              </p>
            </motion.div>
          )}
        </div>
      </section>

      {/* Image Gallery */}
      <section className="w-full h-auto md:h-[60vh] bg-black">
        <div className="grid grid-cols-2 md:grid-cols-4 h-full">
          {galleryImages.map((src, i) =>
          <motion.div
            key={src}
            initial={{ opacity: 0, scale: 1.03 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.6, delay: i * 0.2 }}
            className="relative overflow-hidden group aspect-square md:aspect-auto">
            
              <img
              src={src}
              alt="CREW running atmosphere"
              loading="lazy"
              className="w-full h-full object-cover filter grayscale contrast-[1.1] group-hover:grayscale-[60%] transition-[filter] duration-[400ms]" />
            
            </motion.div>
          )}
        </div>
        <p className="text-right text-xs text-white/40 px-6 py-2">
          © Battersea Park, London
        </p>
      </section>
    </>);

};

export default SocialProofSection;
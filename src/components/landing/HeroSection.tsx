import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Menu, X, Instagram, Activity } from "lucide-react";

const HeroSection = () => {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (heroRef.current) {
        setScrolled(window.scrollY > heroRef.current.offsetHeight - 80);
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  return (
    <>
      {/* Sticky Header */}
      <header
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-10 py-4 transition-all duration-300"
        style={{
          background: scrolled ? "rgba(255,255,255,1)" : "transparent",
          borderBottom: scrolled ? "1px solid #000" : "1px solid transparent"
        }}>
        
        <a
          href="#"
          className={`font-serif text-2xl transition-colors duration-300 ${scrolled ? "text-black" : "text-white"}`}>
          
          CREW
        </a>
        <div className="flex items-center gap-4 bg-inherit">
          <button
            onClick={() => navigate("/login")}
            className={`text-sm transition-colors duration-300 ${scrolled ? "text-black" : "text-white"}`}>
            
            Sign in
          </button>
          <button
            onClick={() => navigate("/signup")}
            className={`hidden md:inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium transition-all duration-300 ${
            scrolled ?
            "bg-black text-white shadow-[4px_4px_0px_#000] border border-black" :
            "bg-white text-black shadow-[4px_4px_0px_#fff] border border-white"}`
            }>
            
            Book your spot
          </button>
          <button
            onClick={() => setMenuOpen(true)}
            className={`md:hidden transition-colors duration-300 ${scrolled ? "text-black" : "text-white"}`}
            aria-label="Open menu">
            
            <Menu size={24} />
          </button>
        </div>
      </header>

      {/* Mobile Fullscreen Menu */}
      <AnimatePresence>
        {menuOpen &&
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[60] bg-black flex flex-col justify-center items-center">
          
            <button
            onClick={() => setMenuOpen(false)}
            className="absolute top-4 right-6 text-white"
            aria-label="Close menu">
            
              <X size={28} />
            </button>
            <nav className="flex flex-col items-center gap-8">
              {[
            { label: "Book your spot", path: "/signup" },
            { label: "Sign in", path: "/login" }].
            map((item, i) =>
            <motion.button
              key={item.path}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.12, duration: 0.4 }}
              onClick={() => {
                setMenuOpen(false);
                navigate(item.path);
              }}
              className="font-serif text-4xl text-white">
              
                  {item.label}
                </motion.button>
            )}
            </nav>
            <div className="absolute bottom-10 flex items-center gap-6">
              <a href="#" className="text-white opacity-60 hover:opacity-100 transition-opacity">
                <Instagram size={20} />
              </a>
              <a href="#" className="text-white opacity-60 hover:opacity-100 transition-opacity">
                <Activity size={20} />
              </a>
            </div>
          </motion.div>
        }
      </AnimatePresence>

      {/* Hero Section */}
      <section ref={heroRef} className="relative w-full h-[100svh] overflow-hidden">
        <picture>
          <img
            src="https://qnccnopiezwwvjqtwiyz.supabase.co/storage/v1/object/public/landingpage-images//dclassic 2025-09-08 121618.304.jpeg"
            alt="Runners in Battersea Park at dawn"
            className="absolute inset-0 w-full h-full object-cover object-center"
            loading="eager"
            fetchPriority="high" />
          
        </picture>
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-black/40" />

        {/* Hero content */}
        <div className="relative z-10 h-full px-6 pb-16 md:pb-24 flex-col flex items-start justify-center md:px-[40px]">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="font-serif text-white text-5xl md:text-7xl lg:text-8xl leading-[1.05]">


          </motion.h1>
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.25 }}
            className="font-serif text-5xl md:text-7xl leading-[1.05] mt-1 lg:text-6xl mx-0 my-0 bg-inherit text-primary-foreground">
            The Social Fitness App
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.45 }}
            className="mt-6 text-lg md:text-xl max-w-lg mx-0 my-[10px] text-primary-foreground">


          </motion.p>
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            onClick={() => navigate("/signup")}
            className="mt-8 inline-flex items-center gap-2 self-start text-black px-7 py-3.5 text-base font-medium shadow-[4px_4px_0px_#fff] hover:shadow-[6px_6px_0px_#fff] transition-shadow duration-200 bg-primary-foreground">
            
            Book your spot
            <ArrowRight size={18} />
          </motion.button>
        </div>
      </section>
    </>);

};

export default HeroSection;
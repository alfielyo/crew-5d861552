import HeroSection from "@/components/landing/HeroSection";
import SocialProofSection from "@/components/landing/SocialProofSection";
import ConversionSection from "@/components/landing/ConversionSection";

const Landing = () => {
  return (
    <div className="w-full min-h-screen bg-white">
      <HeroSection />
      <SocialProofSection />
      <ConversionSection />
    </div>
  );
};

export default Landing;

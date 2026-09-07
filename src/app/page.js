import HeroSection from "@/app/components/Home/HeroSection";
import ProofPillars from "@/app/components/Home/ProofPillars";

export default function Home() {
  return (
    <div className="min-h-screen overflow-hidden bg-[#dce5ec] text-[#303235]">
      <HeroSection />
      <ProofPillars />
    </div>
  );
}

import { Navbar } from "@layout/Navbar";
import { Footer } from "@layout/Footer";
import { AboutHero } from "@/sections/about/AboutHero";
import { AboutOverview } from "@/sections/about/AboutOverview";
import { AboutMissionValues } from "@/sections/about/AboutMissionValues";
import { AboutJourney } from "@/sections/about/AboutJourney";
import { AboutDivisions } from "@/sections/about/AboutDivisions";
import { AboutCertifications } from "@/sections/about/AboutCertifications";
import { AboutStats } from "@/sections/about/AboutStats";
import { AboutProcess } from "@/sections/about/AboutProcess";
import { AboutClients } from "@/sections/about/AboutClients";
import { AboutSafetySustainability } from "@/sections/about/AboutSafetySustainability";
import { AboutCTA } from "@/sections/about/AboutCTA";

export default function AboutPage() {
  return (
    <main className="relative bg-white">
      <Navbar />
      
      {/* 10-Step Premium About Us Experience */}
      <AboutHero />
      <AboutOverview />
      <AboutMissionValues />
      <AboutJourney />
      <AboutStats />
      <AboutProcess />
      <AboutDivisions />
      <AboutCertifications />
      <AboutClients />
      <AboutSafetySustainability />
      <AboutCTA />

      <Footer />
    </main>
  );
}

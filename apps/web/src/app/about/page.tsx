import { AboutCTA } from "@/sections/about/AboutCTA";
import { AboutCertifications } from "@/sections/about/AboutCertifications";
import { AboutClients } from "@/sections/about/AboutClients";
import { AboutDivisions } from "@/sections/about/AboutDivisions";
import { AboutHero } from "@/sections/about/AboutHero";
import { AboutJourney } from "@/sections/about/AboutJourney";
import { AboutMissionValues } from "@/sections/about/AboutMissionValues";
import { AboutOverview } from "@/sections/about/AboutOverview";
import { AboutSafetySustainability } from "@/sections/about/AboutSafetySustainability";
import { AboutStats } from "@/sections/about/AboutStats";

import { Footer } from "@layout/Footer";
import { Navbar } from "@layout/Navbar";

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
      <AboutDivisions />
      <AboutCertifications />
      <AboutClients />
      <AboutSafetySustainability />
      <AboutCTA />

      <Footer />
    </main>
  );
}

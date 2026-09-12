import { Footer } from "@layout/Footer";

import { getClientPartners } from "@/lib/content/clients";
import { getAboutContent } from "@/lib/content/about";
import { AboutCertifications } from "@/sections/about/AboutCertifications";
import { AboutClients } from "@/sections/about/AboutClients";
import { AboutCTA } from "@/sections/about/AboutCTA";
import { AboutDivisions } from "@/sections/about/AboutDivisions";
import { AboutHero } from "@/sections/about/AboutHero";
import { AboutJourney } from "@/sections/about/AboutJourney";
import { AboutMissionValues } from "@/sections/about/AboutMissionValues";
import { AboutOverview } from "@/sections/about/AboutOverview";
import { AboutSafetySustainability } from "@/sections/about/AboutSafetySustainability";
import { AboutStats } from "@/sections/about/AboutStats";

export default async function AboutPage() {
  const [clients, about] = await Promise.all([
    getClientPartners(),
    getAboutContent(),
  ]);

  return (
    <main className="relative min-h-screen bg-white">
      {/* Uniform Blueprint Grid Background - Like Safety Page */}
      <div
        className="pointer-events-none absolute inset-0 z-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(0,0,0,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.03) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      <div className="relative z-10">
        <AboutHero />
        <AboutOverview
          initialImages={about.overviewImages}
          overviewTitle={about.overviewTitle}
          overviewSubtitle={about.overviewSubtitle}
          overviewDescription1={about.overviewDescription1}
          overviewDescription2={about.overviewDescription2}
          classABadge={about.classABadge}
          classADescription={about.classADescription}
          deliveriesCount={about.deliveriesCount}
          yearsCount={about.yearsCount}
        />
        <AboutMissionValues />
        <AboutJourney />
        <AboutStats initialMetrics={about.aboutStats} />
        <AboutDivisions />
        <AboutCertifications />
        <AboutClients initialClients={clients} />
        <AboutSafetySustainability />
        <AboutCTA />
      </div>

      <Footer />
    </main>
  );
}


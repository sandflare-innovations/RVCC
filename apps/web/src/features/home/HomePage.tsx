import FinalLogo from "@/components/layout/FinalLogo";
import { Footer } from "@/components/layout/Footer";

import { AboutUs } from "./AboutUs";
import { CSRSection } from "./CSRSection";
import { Hero } from "./Hero";
import { MajorProject } from "./MajorProject";
import { OurWorks } from "./OurWorks";
import { RecentProjects } from "./RecentProjects";
import { Services } from "./Services";

export const HomePage = () => {
  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Background Blobs */}
      <div className="pointer-events-none absolute -top-24 -left-24 h-96 w-96 rounded-full bg-amber-600/20 blur-[120px]" />
      <div className="pointer-events-none absolute top-1/2 -right-24 h-96 w-96 -translate-y-1/2 rounded-full bg-orange-600/20 blur-[120px]" />

      <Hero />
      <AboutUs />
      <Services />
      <MajorProject />
      <RecentProjects />
      <OurWorks />
      <CSRSection />
      <Footer />
    </div>
  );
};

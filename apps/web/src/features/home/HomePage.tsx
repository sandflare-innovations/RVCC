import { Footer } from "@/components/layout/Footer";

import { AboutUs } from "./AboutUs";
import { CSRSection } from "./CSRSection";
import { Hero } from "./Hero";
import { MajorProject } from "./MajorProject";
import { OurWorks } from "./OurWorks";
import { RecentProjects } from "./RecentProjects";
import { ScrollingText } from "./ScrollingText";
import { Leaders } from "./Leaders";
import { Services } from "./Services";

export const HomePage = () => {
  return (
    <div className="relative min-h-screen">
      {/* Sticky Hero Section */}
      <div className="sticky top-0 z-0 h-screen w-full">
        <Hero />
      </div>

      {/* Main Content Sections - Scroll over the Hero */}
      <div className="bg-background relative z-10 w-full shadow-[0_-20px_50px_rgba(0,0,0,0.1)]">
        <AboutUs />
        <Leaders />
        <Services />
        <MajorProject />
        <RecentProjects />
        <ScrollingText />
        <OurWorks />
        <CSRSection />
        <Footer />
      </div>
    </div>
  );
};

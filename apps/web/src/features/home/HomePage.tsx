import { Footer } from "@/components/layout/Footer";

import { AboutUs } from "./AboutUs";
import { CSRSection } from "./CSRSection";
import { Hero } from "./Hero";
import { MajorProject } from "./MajorProject";
import { OurWorks } from "./OurWorks";
import { RecentProjects } from "./RecentProjects";
import { ScrollingText } from "./ScrollingText";
import { Services } from "./Services";

export const HomePage = () => {
  return (
    <div className="relative min-h-screen overflow-hidden">

      <Hero />
      <AboutUs />
      <Services />
      <MajorProject />
      <RecentProjects />
      <ScrollingText />
      <OurWorks />
      <CSRSection />
      <Footer />
    </div>
  );
};

import dynamic from "next/dynamic";

import { FloatingContact } from "@/components/common/FloatingContact";
import { Footer } from "@/components/layout/Footer";

// Eager load AboutUs as it's the first section after scroll
import { AboutUs } from "./AboutUs";
import { Hero } from "./Hero";

// Dynamically load heavy components below the fold
const Leaders = dynamic(() => import("./Leaders").then((mod) => mod.Leaders), { ssr: true });
const Services = dynamic(() => import("./Services").then((mod) => mod.Services), { ssr: true });
const MajorProject = dynamic(() => import("./MajorProject").then((mod) => mod.MajorProject), {
  ssr: true,
});
const RecentProjects = dynamic(() => import("./RecentProjects").then((mod) => mod.RecentProjects), {
  ssr: true,
});
const ScrollingText = dynamic(() => import("./ScrollingText").then((mod) => mod.ScrollingText), {
  ssr: true,
});
const OurWorks = dynamic(() => import("./OurWorks").then((mod) => mod.OurWorks), { ssr: true });
const CSRSection = dynamic(() => import("./CSRSection").then((mod) => mod.CSRSection), {
  ssr: true,
});
const NewsAndEvents = dynamic(() => import("./NewsAndEvents").then((mod) => mod.NewsAndEvents), {
  ssr: true,
});
const Contact = dynamic(() => import("@components/common/Contact"), { ssr: true });

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
        <NewsAndEvents />
        <Contact />
        <Footer />
      </div>
      <FloatingContact />
    </div>
  );
};

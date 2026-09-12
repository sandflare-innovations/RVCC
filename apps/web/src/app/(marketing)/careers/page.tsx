import { Footer } from "@layout/Footer";
import { Metadata } from "next";
import { Suspense } from "react";

import { FloatingContact } from "@/components/common/FloatingContact";
import { getPublishedJobs } from "@/lib/content/careers";
import { getPageHero } from "@/lib/content/hero";
import { CareerHero } from "@/sections/careers/CareerHero";
import { CareerList } from "@/sections/careers/CareerList";

export const metadata: Metadata = {
  title: "Careers | RVCC - Join Our Visionary Team",
  description:
    "Explore career opportunities at RVCC. We are looking for talented architects, engineers, and project managers to help us build the future of Saudi Arabia.",
};

/**
 * Job postings refresh at most every 60s (ISR). Admin publishes appear shortly after.
 */
export const revalidate = 60;

async function Positions() {
  const positions = await getPublishedJobs();
  return <CareerList positions={positions} />;
}

export default async function CareerPage() {
  const hero = await getPageHero("careers", {
    badge: "EVOLVE WITH US",
    title1: "ARCHITECT",
    title2: "THE FUTURE",
    description:
      "Join a team of visionaries and creators dedicated to reshaping the skyline of the Kingdom through monumental design and engineering.",
    imageUrl: "https://pub-70b8c21f306842d3bbeab4d1d19319e1.r2.dev/content/about/overview-4.webp",
  });

  return (
    <div className="bg-background relative min-h-screen">
      <CareerHero hero={hero} />
      <Suspense
        fallback={<div className="container py-24 text-center">Loading opportunities...</div>}
      >
        <Positions />
      </Suspense>
      <Footer />
      <FloatingContact />
    </div>
  );
}

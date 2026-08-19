import { Suspense } from "react";

import { Metadata } from "next";

import { FloatingContact } from "@/components/common/FloatingContact";
import { getPublishedJobs } from "@/lib/content/careers";
import { CareerHero } from "@/sections/careers/CareerHero";
import { CareerList } from "@/sections/careers/CareerList";

import { Footer } from "@layout/Footer";

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

export default function CareerPage() {
  return (
    <div className="bg-background relative min-h-screen">
      <CareerHero />
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

import { Metadata } from "next";

import { Footer } from "@/components/layout/Footer";
import { getNews } from "@/lib/content/news";
import { NewsListClient } from "./NewsListClient";

export const metadata: Metadata = {
  title: "News & Events | RVCC",
  description:
    "Explore the latest press releases, corporate milestones, community sports partnerships, and development updates from Rawabi Al-Ain Contracting (RVCC).",
};

export const dynamic = "force-static";
export const revalidate = 60;

export default async function NewsPage() {
  const news = await getNews();

  return (
    <main className="min-h-screen bg-white">
      {/* Header Section */}
      <section className="relative overflow-hidden bg-zinc-950 pt-36 pb-20 md:pt-44 md:pb-28">
        {/* Subtle background glow */}
        <div className="absolute top-0 right-1/4 h-96 w-96 rounded-full bg-brand-blue/10 blur-3xl pointer-events-none" />
        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-3xl">
            <span className="inline-block mb-4 text-xs font-bold tracking-[0.25em] text-brand-blue uppercase">
              Corporate Dispatches & Impact
            </span>
            <h1 className="font-heading text-4xl font-extrabold tracking-tight text-white uppercase sm:text-5xl md:text-6xl">
              News &amp; <span className="text-brand-blue">Events</span>
            </h1>
            <p className="mt-6 text-base md:text-lg leading-relaxed text-zinc-400">
              Discover stories of engineering progress, community investments, sports sponsorships,
              and project milestones shaping the kingdom&apos;s urban landscape.
            </p>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-6">
          <NewsListClient initialNews={news} />
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t border-zinc-200 bg-zinc-50 py-24">
        <div className="container mx-auto px-6 text-center">
          <h2 className="font-heading mb-6 text-3xl font-extrabold tracking-tight text-zinc-900 uppercase sm:text-4xl md:text-5xl">
            Stay Connected With <span className="text-brand-blue">RVCC</span>
          </h2>
          <p className="mx-auto mb-10 max-w-xl text-base text-zinc-600">
            For media inquiries, press kits, or community engagement partnerships, please connect
            with our communications department.
          </p>
          <a
            href="/contact"
            className="bg-brand-blue inline-flex items-center gap-3 px-8 py-4 text-xs font-bold tracking-widest text-white uppercase transition-all duration-200 rounded-full hover:bg-zinc-900 hover:shadow-lg"
          >
            Contact Communications
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M5 12h14m-7-7 7 7-7 7" />
            </svg>
          </a>
        </div>
      </section>

      <Footer />
    </main>
  );
}

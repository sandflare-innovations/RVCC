import { Metadata } from "next";

import { Footer } from "@/components/layout/Footer";
import { ThreeDMarquee } from "@/components/ui/3d-marquee";
import { clients } from "@/data/clients";
import { ClientsGrid } from "@/sections/clients/ClientsGrid";
import { ClientsHero } from "@/sections/clients/ClientsHero";

export const metadata: Metadata = {
  title: "Our Clients | RVCC",
  description:
    "Explore the network of industry leaders and visionary partners who trust RVCC for architectural and infrastructure excellence.",
};

export default function ClientsPage() {
  // Map our client data to the format expected by ThreeDMarquee
  const marqueeImages = clients.map((client) => ({
    src: client.logo,
    alt: client.name,
  }));

  return (
    <div className="min-h-screen bg-white">
      <ClientsHero />

      <ClientsGrid />

      {/* CTA Section */}
      <section className="bg-zinc-50 py-32">
        <div className="container mx-auto px-6 text-center">
          <h3 className="font-heading mb-12 text-5xl tracking-tighter text-zinc-900 uppercase md:text-7xl">
            Ready to <span className="text-brand-blue">Partner?</span>
          </h3>
          <p className="mx-auto mb-16 max-w-xl text-lg font-medium text-zinc-500">
            Join a growing list of industry leaders who rely on our specialized expertise for their
            most ambitious projects.
          </p>
          <a
            href="/contact"
            className="bg-brand-blue inline-flex items-center gap-4 px-12 py-6 text-[10px] font-black tracking-[0.4em] text-white uppercase transition-all hover:scale-105 hover:bg-zinc-900"
          >
            Get in Touch
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M5 12h14m-7-7 7 7-7 7" />
            </svg>
          </a>
        </div>
      </section>

      <Footer />
    </div>
  );
}

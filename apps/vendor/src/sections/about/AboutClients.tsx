import React from "react";

import { motion } from "framer-motion";

import { ClientLogos } from "@/components/common/ClientLogos";
import { Button } from "@/components/ui/Button";

export const AboutClients = () => {
  return (
    <section className="bg-transparent py-24">
      <div className="container mx-auto px-6">
        <div className="mx-auto mb-20 flex max-w-3xl flex-col items-center text-center">
          <span className="text-brand-blue mb-4 block text-[10px] font-bold tracking-[0.4em] uppercase">
            Trusted Partners
          </span>
          <h3 className="font-heading text-6xl tracking-tighter text-zinc-900 uppercase">
            Our <span className="text-brand-blue serif">Clients</span>
          </h3>
          <p className="text-lg leading-relaxed font-light text-zinc-500">
            We are honored to have collaborated with some of the most prestigious organizations and
            government entities in Saudi Arabia, building lasting partnerships based on trust and
            excellence.
          </p>
        </div>

        <div className="relative border-t border-zinc-100">
          <ClientLogos />
          <div className="mt-10 flex flex-col items-center justify-center">
            <Button href="/clients" variant="brand-outline" className="min-w-[240px]">
              View All Clients
            </Button>
          </div>
          {/* Decorative overlays for smooth fade */}
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-32 bg-gradient-to-r from-white/0 to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-32 bg-gradient-to-l from-white/0 to-transparent" />
        </div>
      </div>
    </section>
  );
};

"use client";

import Image from "next/image";

import { FOUNDER_DATA, LEADER_MESSAGE } from "@data/home/leaders";
import { motion } from "framer-motion";

export const Leaders = () => {
  return (
    <section className="section-padding px-container overflow-hidden" id="leaders">
      <div className="container mx-auto">
        <div className="grid grid-cols-1 items-start gap-12 md:grid-cols-12">
          {/* Left: Founder Profile (1/3 approx) */}
          <div className="border-brand-blue p-content-gap border-2 md:col-span-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="relative aspect-[4/4] w-full overflow-hidden transition-all duration-700"
            >
              <Image
                src={FOUNDER_DATA.image}
                alt={FOUNDER_DATA.name}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 33vw"
              />
            </motion.div>
            <div className="mt-8">
              <h3 className="text-brand-blue text-5xl tracking-tight uppercase">
                {FOUNDER_DATA.name}
              </h3>
              <p className="text-brand-blue/50 mt-2 text-sm font-medium tracking-[0.2em] uppercase">
                {FOUNDER_DATA.role}
              </p>
            </div>
          </div>

          {/* Right: CEO Message (2/3 approx) */}
          <div className="p-content-gap flex h-full flex-col justify-center md:col-span-8">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              <div className="text-brand-blue/30 mb-content-gap text-[10px] font-bold tracking-[0.4em] uppercase">
                Leader Message
              </div>

              <div className="grid grid-cols-1 gap-12">
                {LEADER_MESSAGE.map((paragraph, i) => (
                  <div key={i} className="text-brand-blue/80 text-lg leading-relaxed font-medium">
                    {paragraph}
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};

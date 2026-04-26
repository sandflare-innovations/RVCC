"use client";

import Image from "next/image";
import { motion } from "framer-motion";

export const Leaders = () => {
  return (
    <section className="py-24 px-8 md:px-16 lg:px-24 overflow-hidden" id="leaders">
      <div className="mx-auto max-w-[100rem]">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 items-start  border-black">

          {/* Left: Founder Profile (1/3 approx) */}
          <div className="md:col-span-4 border border-foreground/80 p-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="relative aspect-[4/4] w-full overflow-hidden transition-all duration-700"
            >
              <Image
                src="/images/team/founder.png" // Placeholder for Founder
                alt="Founder"
                fill
                className="object-cover"
              />
            </motion.div>
            <div className="mt-8">
              <h3 className="text-5xl uppercase tracking-tight text-brand-blue">
                Dr. Sooraj N K
              </h3>
              <p className="text-sm font-medium tracking-[0.2em] text-brand-blue/50 uppercase mt-2">
                Founder & CEO
              </p>
            </div>
          </div>

          {/* Right: CEO Message (2/3 approx) */}
          <div className="md:col-span-8 flex flex-col justify-center h-full p-8">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              <div className="text-[10px] font-bold tracking-[0.4em] text-brand-blue/30 uppercase mb-8">
                Leader Message
              </div>

              <div className="grid grid-cols-1 gap-12">
                <div className="text-lg leading-relaxed text-brand-blue/80 font-medium">
                  Reckoned as a fast-growing construction company in the Kingdom of Saudi Arabia, since inception in 2006, RVCC has always been a key contributor to Kingdom’s construction sector. It proudly associates itself with prestigious and landmark projects in the Kingdom.                </div>
                <div className="text-lg leading-relaxed text-brand-blue/80 font-medium">
                  We are committed to having a good partnership, transparency, and reliability with our clients and vendors. Our clients are aware that we have the skills, resources and expertise, and most importantly, the ability to provide specialist services related to all activities within the....                </div>
              </div>
            </motion.div>
          </div>

        </div>
      </div>
    </section>
  );
};

"use client";

import Image from "next/image";

import { motion } from "framer-motion";

export const Leaders = () => {
  return (
    <section className="overflow-hidden px-8 py-24 md:px-16 lg:px-24" id="leaders">
      <div className="mx-auto max-w-[100rem]">
        <div className="grid grid-cols-1 items-start gap-12 md:grid-cols-12">
          {/* Left: Founder Profile (1/3 approx) */}
          <div className="border-brand-blue border-2 p-6 md:col-span-4">
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
                sizes="(max-width: 768px) 100vw, 33vw"
              />
            </motion.div>
            <div className="mt-8">
              <h3 className="text-brand-blue text-5xl tracking-tight uppercase">Dr. Sooraj N K</h3>
              <p className="text-brand-blue/50 mt-2 text-sm font-medium tracking-[0.2em] uppercase">
                Founder & CEO
              </p>
            </div>
          </div>

          {/* Right: CEO Message (2/3 approx) */}
          <div className="flex h-full flex-col justify-center p-8 md:col-span-8">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              <div className="text-brand-blue/30 mb-8 text-[10px] font-bold tracking-[0.4em] uppercase">
                Leader Message
              </div>

              <div className="grid grid-cols-1 gap-12">
                <div className="text-brand-blue/80 text-lg leading-relaxed font-medium">
                  Reckoned as a fast-growing construction company in the Kingdom of Saudi Arabia,
                  since inception in 2006, RVCC has always been a key contributor to Kingdom’s
                  construction sector. It proudly associates itself with prestigious and landmark
                  projects in the Kingdom.{" "}
                </div>
                <div className="text-brand-blue/80 text-lg leading-relaxed font-medium">
                  We are committed to having a good partnership, transparency, and reliability with
                  our clients and vendors. Our clients are aware that we have the skills, resources
                  and expertise, and most importantly, the ability to provide specialist services
                  related to all activities within the....{" "}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};

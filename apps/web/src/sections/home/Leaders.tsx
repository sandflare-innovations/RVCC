"use client";

import Image from "next/image";
import Link from "next/link";

import { FOUNDER_DATA, LEADER_MESSAGE } from "@data/home/leaders";
import { motion } from "framer-motion";

import { cn } from "@lib/utils";

export const Leaders = () => {
  return (
    <section className="md:section-padding overflow-hidden py-12" id="leaders">
      <div className="container mx-auto">
        <div className="grid grid-cols-1 items-start gap-12 md:grid-cols-12">
          {/* Left: Founder Profile (1/3 approx) */}
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.1 }}
            transition={{ duration: 2, ease: [0.19, 1, 0.22, 1] }}
            className="border-brand-blue md:p-content-gap border-2 p-4 md:col-span-4"
          >
            <div className="relative aspect-[4/4] w-full overflow-hidden transition-all duration-700">
              <Image
                src={FOUNDER_DATA.image}
                alt={FOUNDER_DATA.name}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 33vw"
              />
            </div>
            <div className="mt-8">
              <h3 className="text-brand-blue text-5xl tracking-tight uppercase">
                {FOUNDER_DATA.name}
              </h3>
              <p className="text-brand-blue/50 mt-2 text-sm font-medium tracking-[0.2em] uppercase">
                {FOUNDER_DATA.role}
              </p>
            </div>
          </motion.div>

          {/* Right: CEO Message (2/3 approx) */}
          <div className="md:p-content-gap flex h-full flex-col justify-center p-0 md:col-span-8">
            <motion.div
              initial={{ opacity: 0, y: 100 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.1 }}
              transition={{ duration: 2, delay: 0.2, ease: [0.19, 1, 0.22, 1] }}
            >
              <div className="text-brand-blue/30 mb-content-gap text-[10px] font-bold tracking-[0.4em] uppercase">
                Leader Message
              </div>

              <div className="grid grid-cols-1 gap-12">
                {LEADER_MESSAGE.map((paragraph, i) => (
                  <div
                    key={i}
                    className={cn(
                      "text-lg leading-relaxed font-medium text-zinc-500",
                      i > 0 && "hidden md:block"
                    )}
                  >
                    {i === 0 ? (
                      <>
                        <span className="md:hidden">
                          {paragraph}{" "}
                          <Link href="/about" className="text-brand-blue font-bold underline">
                            Read More
                          </Link>
                        </span>
                        <span className="hidden md:inline">{paragraph}</span>
                      </>
                    ) : (
                      <>
                        {paragraph}
                        {i === LEADER_MESSAGE.length - 1 && (
                          <Link
                            href="/about"
                            className="text-brand-blue ml-2 hidden font-bold underline md:inline"
                          >
                            Read More
                          </Link>
                        )}
                      </>
                    )}
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

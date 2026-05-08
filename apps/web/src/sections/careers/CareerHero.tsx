"use client";

import { motion } from "framer-motion";

export const CareerHero = () => {
  return (
    <section className="bg-background relative overflow-hidden py-32 md:py-48">
      {/* Background Monumental Text */}
      <div className="container mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          className="pointer-events-none mb-[-4rem] md:mb-[-10rem]"
        >
          <h1 className="font-heading text-8xl leading-[0.8] font-black text-zinc-100 uppercase md:text-[20rem] dark:text-white/5">
            JOIN US
          </h1>
        </motion.div>

        {/* Foreground Content */}
        <div className="relative z-10 flex flex-col items-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="flex flex-col items-center text-center"
          >
            <div className="mb-6 flex items-center space-x-3">
              <div className="bg-brand-blue h-1.5 w-1.5" />
              <span className="text-brand-blue text-[10px] font-bold tracking-[0.5em] uppercase">
                CAREERS
              </span>
            </div>
            <h2 className="text-foreground max-w-4xl text-4xl font-normal tracking-tighter uppercase md:text-7xl">
              Build the <span className="text-brand-blue font-light">Future</span> <br />
              With RVCC
            </h2>
            <p className="text-muted-foreground mt-8 max-w-xl text-lg leading-relaxed font-light">
              We are a team of visionaries, engineers, and creators. Join us in shaping the
              architectural landscape of the Kingdom.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Decorative Accent */}
      <div className="bg-brand-blue absolute top-1/2 right-0 h-px w-24 -translate-y-1/2" />
      <div className="bg-brand-blue absolute top-1/2 left-0 h-px w-24 -translate-y-1/2" />
    </section>
  );
};

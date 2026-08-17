"use client";

import Image from "next/image";

import { motion } from "framer-motion";

import { Service } from "@/data/services";

interface ServiceDetailHeroProps {
  service: Service;
}

export const ServiceDetailHero = ({ service }: ServiceDetailHeroProps) => {
  return (
    <section className="relative h-screen min-h-[700px] w-full overflow-hidden bg-black">
      {/* Background Image with Overlay */}
      <motion.div
        initial={{ scale: 1.1 }}
        animate={{ scale: 1 }}
        transition={{ duration: 1.5, ease: "easeOut" }}
        className="absolute inset-0 z-0"
      >
        <Image
          src={service.image}
          alt={service.title}
          fill
          priority
          className="object-cover opacity-60 grayscale-[30%]"
        />
        <div className="absolute inset-0 bg-black/20 md:bg-black/10" />
      </motion.div>

      {/* Content */}
      <div className="relative z-10 container flex h-full flex-col justify-center pt-20">
        <div className="mb-8 flex items-center space-x-4">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: "48px" }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="h-[2px] bg-white"
          />
          <motion.span
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.7 }}
            className="text-[20px] font-bold tracking-[0.5em] text-white uppercase"
          >
            OUR SERVICES
          </motion.span>
        </div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="font-heading mb-10 text-6xl font-normal tracking-tighter text-white uppercase md:text-8xl lg:text-[10rem] lg:leading-[0.6em]"
        >
          {service.title?.split(" ").map((word, i) => (
            <span key={i} className={i % 2 === 1 ? "opacity-90" : ""}>
              {word} {i === 0 && service.title.split(" ").length > 1 && <br />}
            </span>
          ))}
        </motion.h1>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.9 }}
          className="max-w-xl"
        >
          <p className="text-lg leading-relaxed font-light text-white/90 md:text-xl lg:text-2xl">
            {service.description}
          </p>
        </motion.div>
      </div>

      {/* Decorative Icon */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 0.1, scale: 1 }}
        transition={{ duration: 1.2, delay: 1 }}
        className="absolute right-20 bottom-20 hidden text-[20rem] text-white lg:block"
      >
        {service.icon}
      </motion.div>
    </section>
  );
};

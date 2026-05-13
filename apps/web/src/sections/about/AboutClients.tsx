"use client";

import React from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { CLIENT_IMAGES } from "@data/home/about";

export const AboutClients = () => {
  return (
    <section className="bg-white py-24 lg:py-32">
      <div className="container mx-auto px-6">
        <div className="mb-16 flex flex-col items-center justify-between gap-6 md:flex-row">
          <h2 className="font-heading text-4xl uppercase text-zinc-900 md:text-5xl">
            Our <span className="text-brand-blue serif">Partners</span>
          </h2>
          <p className="max-w-md text-sm font-light text-zinc-500 md:text-right">
            We are honored to have collaborated with some of the most prestigious organizations and government entities in Saudi Arabia.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 border border-zinc-100 sm:grid-cols-3 lg:grid-cols-4">
          {CLIENT_IMAGES.map((src, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.05 }}
              className="group relative flex h-40 items-center justify-center border border-zinc-50 p-8 transition-colors hover:bg-zinc-50"
            >
              <div className="relative h-full w-full grayscale transition-all duration-500 group-hover:grayscale-0 group-hover:scale-110">
                <Image
                  src={src}
                  alt={`Partner Logo ${i + 1}`}
                  fill
                  className="object-contain"
                />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

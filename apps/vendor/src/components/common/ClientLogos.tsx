"use client";

import Image from "next/image";

import { motion } from "framer-motion";

import { CLIENT_IMAGES } from "@/data/home/about";

export const ClientLogos = () => {
  const logos = [...CLIENT_IMAGES, ...CLIENT_IMAGES];

  return (
    <div className="md:pt-element-gap w-full overflow-hidden pt-8">
      <motion.div
        className="flex w-max items-center gap-16 px-8"
        animate={{ x: ["0%", "-50%"] }}
        transition={{ duration: 60, ease: "linear", repeat: Infinity }}
      >
        {logos.map((src, i) => (
          <div
            key={i}
            className="relative h-42 w-42 flex-shrink-0 transition-all duration-300 hover:scale-110"
          >
            <Image
              src={src}
              alt="Client logo"
              fill
              className="object-contain"
              sizes="(max-width: 768px) 100px, 200px"
            />
          </div>
        ))}
      </motion.div>
    </div>
  );
};

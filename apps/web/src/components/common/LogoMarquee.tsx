"use client";

import Image from "next/image";

import { motion } from "framer-motion";

import { cn } from "@lib/utils";

interface LogoMarqueeProps {
  className?: string;
}

export const LogoMarquee = ({ className }: LogoMarqueeProps) => {
  const logos = [1, 2, 3, 4, 5, 6, 7];

  return (
    <div
      className={cn(
        "pointer-events-none absolute bottom-16 left-1/2 z-30 flex w-full -translate-x-1/2 justify-center overflow-hidden px-6 md:bottom-6",
        className
      )}
    >
      <div className="relative w-full max-w-xl overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_20%,black_80%,transparent)]">
        <motion.div
          animate={{
            x: ["0%", "-50%"],
          }}
          transition={{
            duration: 40,
            ease: "linear",
            repeat: Infinity,
          }}
          className="flex w-max items-center gap-12 md:gap-16"
        >
          {logos.concat(logos).map((i, index) => (
            <div key={index} className="relative h-20 w-20 brightness-0 invert transition-opacity">
              <Image
                src={`/images/clients/${i}.webp`}
                alt={`Partner Logo ${i}`}
                fill
                className="object-contain"
                loading="lazy"
                sizes="80px"
              />
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
};

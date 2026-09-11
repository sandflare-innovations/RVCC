"use client";

import { cn } from "@lib/utils";
import { motion } from "framer-motion";
import Image from "next/image";

interface LogoMarqueeProps {
  className?: string;
  logos?: string[];
}

export const LogoMarquee = ({ className, logos }: LogoMarqueeProps) => {
  if (!logos || logos.length === 0) {
    return null;
  }

  const marqueeList = logos.concat(logos);

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
          {marqueeList.map((logoUrl, index) => (
            <div key={index} className="relative h-16 w-24 brightness-0 invert transition-opacity">
              <Image
                src={logoUrl}
                alt={`Partner Logo ${index + 1}`}
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

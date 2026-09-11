"use client";

import { motion } from "framer-motion";
import Image from "next/image";

export interface ClientLogoItem {
  id?: string | number;
  name?: string;
  logoUrl?: string;
  logo?: string;
}

export const ClientLogosSkeleton = () => {
  return (
    <div className="md:pt-element-gap w-full overflow-hidden pt-8">
      <div className="flex w-full items-center justify-center gap-12 px-8 py-4 opacity-70">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="h-14 w-32 rounded border border-brand-blue/15 bg-gradient-to-r from-white via-brand-blue/10 to-white animate-pulse flex-shrink-0 shadow-sm"
          />
        ))}
      </div>
    </div>
  );
};

export const ClientLogos = ({
  initialLogos,
}: {
  initialLogos?: (string | ClientLogoItem)[];
}) => {
  const resolvedLogos: string[] =
    initialLogos && initialLogos.length > 0
      ? initialLogos
          .map((item) =>
            typeof item === "string" ? item : item.logoUrl || item.logo || ""
          )
          .filter(Boolean)
      : [];

  if (resolvedLogos.length === 0) {
    return <ClientLogosSkeleton />;
  }

  const displayList = [...resolvedLogos, ...resolvedLogos];

  return (
    <div className="md:pt-element-gap w-full overflow-hidden pt-8">
      <motion.div
        className="flex w-max items-center gap-16 px-8"
        animate={{ x: ["0%", "-50%"] }}
        transition={{ duration: 60, ease: "linear", repeat: Infinity }}
      >
        {displayList.map((src, i) => (
          <div
            key={i}
            className="relative h-28 w-40 flex-shrink-0 transition-all duration-300 hover:scale-110"
          >
            <Image
              src={src}
              alt="Client partner logo"
              fill
              className="object-contain"
              sizes="(max-width: 768px) 120px, 180px"
            />
          </div>
        ))}
      </motion.div>
    </div>
  );
};


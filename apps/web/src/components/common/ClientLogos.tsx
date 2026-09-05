"use client";

import { motion } from "framer-motion";
import Image from "next/image";

export interface ClientLogoItem {
  id?: string | number;
  name?: string;
  logoUrl?: string;
  logo?: string;
}

export const ClientLogos = ({
  initialLogos,
}: {
  initialLogos?: (string | ClientLogoItem)[];
}) => {
  const defaultLogos = [
    "/images/clients/1.webp",
    "/images/clients/2.webp",
    "/images/clients/3.webp",
    "/images/clients/4.webp",
    "/images/clients/5.webp",
  ];

  const resolvedLogos: string[] =
    initialLogos && initialLogos.length > 0
      ? initialLogos
          .map((item) =>
            typeof item === "string" ? item : item.logoUrl || item.logo || ""
          )
          .filter(Boolean)
      : defaultLogos;

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


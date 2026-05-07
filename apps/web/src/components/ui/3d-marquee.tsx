"use client";

import React from "react";

import Image from "next/image";

import { motion } from "framer-motion";

import { cn } from "@lib/utils";

export interface MarqueeImage {
  src: string;
  alt: string;
  href?: string;
  target?: "_blank" | "_self" | "_parent" | "_top";
}

export interface ThreeDMarqueeProps {
  images: MarqueeImage[];
  className?: string;
  cols?: number; // default is 4
  onImageClick?: (image: MarqueeImage, index: number) => void;
}

export const ThreeDMarquee: React.FC<ThreeDMarqueeProps> = ({
  images,
  className = "",
  cols = 4,
  onImageClick,
}) => {
  // Clone the image list twice
  const duplicatedImages = [...images, ...images];

  const groupSize = Math.ceil(duplicatedImages.length / cols);
  const imageGroups = Array.from({ length: cols }, (_, index) =>
    duplicatedImages.slice(index * groupSize, (index + 1) * groupSize)
  );

  const handleImageClick = (image: MarqueeImage, globalIndex: number) => {
    if (onImageClick) {
      onImageClick(image, globalIndex);
    } else if (image.href) {
      window.open(image.href, image.target || "_self");
    }
  };

  return (
    <section
      className={cn(
        "bg-background mx-auto block h-[600px] overflow-hidden max-sm:h-[400px]",
        className
      )}
    >
      <div
        className="flex h-full w-full items-center justify-center"
        style={{
          transform: "rotateX(55deg) rotateY(0deg) rotateZ(45deg)",
        }}
      >
        <div className="w-full scale-90 overflow-hidden sm:scale-125">
          <div
            className={cn(
              "relative grid h-full w-full origin-center transform grid-cols-2 gap-8 sm:grid-cols-4"
            )}
          >
            {imageGroups.map((imagesInGroup, idx) => (
              <motion.div
                key={`column-${idx}`}
                animate={{ y: idx % 2 === 0 ? 100 : -100 }}
                transition={{
                  duration: idx % 2 === 0 ? 12 : 15,
                  repeat: Infinity,
                  repeatType: "reverse",
                }}
                className={cn("relative flex flex-col items-center gap-12 will-change-transform")}
              >
                {/* Horizontal and Vertical lines for architectural grid feel */}
                <div className={cn("bg-brand-blue/10 absolute top-0 left-0 h-full w-px")} />
                {imagesInGroup.map((image, imgIdx) => {
                  const globalIndex = idx * groupSize + imgIdx;
                  const isClickable = image.href || onImageClick;

                  return (
                    <div key={`img-${imgIdx}`} className="relative">
                      <div className={cn("bg-brand-blue/10 absolute top-0 left-0 h-px w-full")} />
                      <motion.div
                        whileHover={{ y: -10, scale: 1.02 }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                        className={cn(
                          "ring-brand-blue/10 hover:shadow-brand-blue/30 relative aspect-[16/10] w-full min-w-[320px] overflow-hidden rounded-none shadow-2xl ring-1 transition-all duration-300",
                          isClickable ? "cursor-pointer" : ""
                        )}
                        onClick={() => handleImageClick(image, globalIndex)}
                      >
                        <Image
                          src={image.src}
                          alt={image.alt}
                          fill
                          className="object-cover"
                          sizes="400px"
                        />
                      </motion.div>
                    </div>
                  );
                })}
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

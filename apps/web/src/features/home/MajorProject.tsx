"use client";

import { useEffect, useRef } from "react";

import Image from "next/image";

import { Button } from "@/components/ui/Button";

const MajorProjectMask = () => (
  <svg width="0" height="0" className="absolute">
    <defs>
      <clipPath id="major-project-mask" clipPathUnits="objectBoundingBox">
        <path
          d="
            M 0 0 
            L 0.15 0 
            C 0.2 0, 0.22 0.05, 0.28 0.05 
            L 0.72 0.05 
            C 0.78 0.05, 0.8 0, 0.85 0 
            L 1 0 
            L 1 1 
            L 0.85 1 
            C 0.8 1, 0.78 0.95, 0.72 0.95 
            L 0.28 0.95 
            C 0.22 0.95, 0.2 1, 0.15 1 
            L 0 1 
            Z
          "
        />
      </clipPath>
    </defs>
  </svg>
);

const ImageSlider = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    let animationFrameId: number;
    let position = 0;
    const tick = () => {
      position -= 0.5; // slow slide
      const firstChild = container.firstElementChild as HTMLElement;
      if (firstChild) {
        const width = firstChild.offsetWidth + 16; // gap-4 = 16px
        if (-position >= width) {
          container.appendChild(firstChild);
          position += width;
        }
      }
      container.style.transform = `translate3d(${position}px, 0, 0)`;
      animationFrameId = requestAnimationFrame(tick);
    };
    animationFrameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  return (
    <div className="w-full max-w-lg overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
      <div ref={containerRef} className="flex w-max gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="relative h-24 w-36 flex-shrink-0 overflow-hidden rounded-xl border border-white/10"
          >
            <Image
              src={`/images/home-hero.png`}
              alt="Project thumbnail"
              fill
              className="object-cover"
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export const MajorProject = () => {
  return (
    <section className="relative w-full bg-gray-100 py-12">
      <MajorProjectMask />

      <div
        className="relative w-full overflow-hidden bg-zinc-900"
        style={{ clipPath: "url(#major-project-mask)", height: "650px" }}
      >
        <Image src="/images/home-hero.png" alt="Major Project" fill className="object-cover" />

        {/* Gradient Overlay for Text Readability */}

        <div className="absolute bottom-0 left-0 w-full p-8 md:px-16 md:pb-12">
          {/* Top Divider */}
          <div className="mb-8 h-[1px] w-full bg-white/20" />

          <div className="flex flex-col items-start justify-between gap-8 md:flex-row md:items-end">
            <div className="flex-1">
              <h2 className="text-background flex flex-col text-[4rem] leading-[0.6] tracking-tighter md:text-[8rem]">
                <span className="font-medium">
                  Major <br /> Projects
                </span>
              </h2>
            </div>

            <div className="flex flex-1 justify-center md:justify-start">
              <ImageSlider />
            </div>

            <div className="flex flex-1 justify-end pb-2">
              <Button href="#contact" className="bg-brand-blue h-12 w-[180px] text-white">
                Contact us
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

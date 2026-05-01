"use client";

import { useRef } from "react";

import Image from "next/image";

import {
  motion,
  useAnimationFrame,
  useMotionValue,
  useScroll,
  useSpring,
  useTransform,
  useVelocity,
} from "framer-motion";

const wrap = (min: number, max: number, v: number) => {
  const rangeSize = max - min;
  return ((((v - min) % rangeSize) + rangeSize) % rangeSize) + min;
};

interface ParallaxProps {
  children: string;
  images: string[];
  baseVelocity: number;
}

function ParallaxText({ children, images, baseVelocity = 100 }: ParallaxProps) {
  const baseX = useMotionValue(0);
  const { scrollY } = useScroll();
  const scrollVelocity = useVelocity(scrollY);
  const smoothVelocity = useSpring(scrollVelocity, {
    damping: 50,
    stiffness: 400,
  });
  const velocityFactor = useTransform(smoothVelocity, [0, 1000], [0, 5], {
    clamp: false,
  });

  /**
   * This is a magic wrapping for the length of the text - you
   * have to replace for wrap(-20, -45, baseX.get()) with the
   * right values depending on the length of text and screen width.
   */
  const x = useTransform(baseX, (v) => `${wrap(-20, -45, v)}%`);

  const directionFactor = useRef<number>(1);
  useAnimationFrame((t, delta) => {
    let moveBy = directionFactor.current * baseVelocity * (delta / 5000);

    /**
     * This is what changes the direction of the scroll once we
     * switch scrolling directions.
     */
    if (velocityFactor.get() < 0) {
      directionFactor.current = -1;
    } else if (velocityFactor.get() > 0) {
      directionFactor.current = 1;
    }

    moveBy += directionFactor.current * moveBy * velocityFactor.get();

    baseX.set(baseX.get() + moveBy);
  });

  /**
   * Dividing the text into parts to insert images
   */
  const words = children.split(" ");
  const midIndex = Math.floor(words.length / 2);

  return (
    <div className="parallax flex flex-nowrap overflow-hidden whitespace-nowrap">
      <motion.div
        className="scroller text-semibold text-foreground flex flex-nowrap text-[6rem] font-normal tracking-tighter whitespace-nowrap uppercase"
        style={{ x }}
      >
        {[...Array(4)].map((_, i) => (
          <span key={i} className="mr-8 flex items-center gap-8">
            {words.slice(0, midIndex).join(" ")}
            <div className="relative h-[4rem] w-[8rem] overflow-hidden rounded-none">
              <Image
                src={images[0]}
                alt="Construction detail"
                fill
                className="object-cover"
                sizes="15vw"
              />
            </div>
            {words.slice(midIndex).join(" ")}
            <div className="relative h-[4rem] w-[8rem] overflow-hidden rounded-none">
              <Image
                src={images[1]}
                alt="Construction detail"
                fill
                className="object-cover"
                sizes="15vw"
              />
            </div>
          </span>
        ))}
      </motion.div>
    </div>
  );
}

export const ScrollingText = () => {
  return (
    <section className="bg-background section-padding hidden overflow-hidden md:block">
      <ParallaxText baseVelocity={-3} images={["/images/home-hero.png", "/images/hero-bg.png"]}>
        Discover the world of Ray
      </ParallaxText>
      <ParallaxText baseVelocity={3} images={["/images/hero-bg.png", "/images/home-hero.png"]}>
        Construction Aluminium Premium
      </ParallaxText>
    </section>
  );
};

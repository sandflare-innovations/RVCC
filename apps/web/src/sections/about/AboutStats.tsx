"use client";

import React, { useEffect, useRef } from "react";
import { motion, useInView, useMotionValue, animate, useTransform } from "framer-motion";

const Counter = ({
  from = 0,
  to,
  suffix = "",
}: {
  from?: number;
  to: number;
  suffix?: string;
}) => {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });
  const count = useMotionValue(from);
  const rounded = useTransform(count, (latest) => Math.round(latest).toString() + suffix);

  useEffect(() => {
    if (inView) {
      animate(count, to, {
        duration: 2.5,
        ease: [0.16, 1, 0.3, 1],
      });
    }
  }, [inView, count, to]);

  return (
    <motion.span ref={ref} className="tabular-nums">
      {rounded}
    </motion.span>
  );
};

const STATS = [
  { label: "Projects Completed", value: 500, suffix: "+" },
  { label: "Years of Excellence", value: 18, suffix: "+" },
  { label: "Business Divisions", value: 6, suffix: "" },
  { label: "Global Presence", value: 4, suffix: " Countries" },
];

export const AboutStats = () => {
  return (
    <section className="bg-white py-24 lg:py-32">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-2 gap-12 lg:grid-cols-4">
          {STATS.map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: i * 0.1 }}
              className="flex flex-col items-center text-center"
            >
              <div className="font-heading text-brand-blue text-6xl leading-none md:text-8xl">
                <Counter to={stat.value} suffix={stat.suffix} />
              </div>
              <div className="mt-4 h-1 w-12 bg-zinc-100" />
              <p className="mt-4 text-[10px] font-bold tracking-[0.4em] text-zinc-400 uppercase">
                {stat.label}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

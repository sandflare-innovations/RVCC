"use client";

import { motion, useInView, useMotionValue, useSpring } from "framer-motion";
import { useEffect, useRef } from "react";

const Counter = ({ value, prefix = "+" }: { value: string; prefix?: string }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  // Extract number from string (e.g., "150" from "+150")
  const numericValue = parseInt(value.replace(/\D/g, ""), 10);

  const motionValue = useMotionValue(0);
  const springValue = useSpring(motionValue, {
    damping: 60,
    stiffness: 100,
  });

  useEffect(() => {
    if (isInView) {
      motionValue.set(numericValue);
    }
  }, [isInView, motionValue, numericValue]);

  useEffect(() => {
    const unsubscribe = springValue.on("change", (latest) => {
      if (ref.current) {
        (ref.current as HTMLElement).textContent = prefix + Math.floor(latest).toLocaleString();
      }
    });
    return () => unsubscribe();
  }, [springValue, prefix]);

  return <span ref={ref}>{prefix}0</span>;
};

const METRICS = [
  {
    description: "Premier projects successfully delivered across the Saudi Kingdom",
    value: "150",
  },
  {
    description: "Strategic urban centers and cities served nationwide",
    value: "12",
  },
  {
    description: "Years of unwavering architectural and engineering excellence",
    value: "15",
  },
  {
    description: "Dedicated professional teams shaping global visions into reality",
    value: "50",
  },
];

export const AboutStats = () => {
  return (
    <section className="bg-transparent py-24">
      <div className="container mx-auto px-6">
        <div className="mb-20 text-center">
          <span className="text-brand-blue mb-4 block text-[10px] font-bold tracking-[0.4em] uppercase">
            Impact & Scale
          </span>
          <h3 className="font-heading text-6xl tracking-tighter text-zinc-900 uppercase">
            Excellence in <span className="text-brand-blue serif">Numbers</span>
          </h3>
          <p className="mx-auto mt-4 max-w-2xl font-light text-zinc-500">
            A track record of successful deliveries and strategic growth across the Kingdom.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-x-12 gap-y-16 md:grid-cols-2 lg:grid-cols-4 lg:gap-x-16">
          {METRICS.map((metric, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: index * 0.1 }}
              className="group border border-zinc-100 bg-white p-8 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.08)] transition-all duration-500 hover:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.12)]"
            >
              <div className="flex h-full min-h-[250px] flex-col justify-between">
                {/* Top: Narrative Description */}
                <p className="max-w-[200px] text-[12px] leading-relaxed font-medium text-zinc-500">
                  {metric.description}
                </p>

                {/* Bottom: Impact Number with Counting Animation */}
                <h4 className="font-primary text-brand-blue mt-8 origin-left text-6xl font-light tracking-tighter transition-transform duration-500 group-hover:scale-105 md:text-7xl lg:text-8xl">
                  <Counter value={metric.value} />
                </h4>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

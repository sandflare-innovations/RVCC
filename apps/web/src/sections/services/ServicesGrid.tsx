"use client";

import Image from "next/image";
import Link from "next/link";

import { motion } from "framer-motion";

import { services } from "@/data/services";

export const ServicesGrid = () => {
  return (
    <section id="services-grid" className="section-padding bg-background">
      <div className="container">
        <div className="mb-20 flex flex-col items-center text-center">
          <div className="mb-6 flex items-center space-x-3">
            <div className="bg-brand-blue h-1.5 w-1.5" />
            <span className="text-brand-blue text-[10px] font-bold tracking-[0.5em] uppercase">
              SERVICES
            </span>
          </div>
          <h2 className="font-heading max-w-4xl text-4xl leading-[3rem] md:text-5xl lg:text-7xl">
            Seamless property solutions <br />
            tailored for you
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
          {services.map((service, index) => (
            <motion.div
              key={service.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="group border-border hover:border-brand-blue flex flex-col overflow-hidden border bg-white shadow-none transition-all md:flex-row"
              style={{ borderRadius: "0px" }}
            >
              {/* Left Content */}
              <div className="flex flex-1 flex-col justify-between p-10 md:p-12">
                <div>
                  <div
                    className="bg-brand-blue mb-8 flex h-14 w-14 items-center justify-center text-white"
                    style={{ borderRadius: "0px" }}
                  >
                    {service.icon}
                  </div>
                  <h3 className="font-heading mb-4 text-2xl tracking-wide uppercase">
                    {service.title}
                  </h3>
                  <p className="text-muted/80 mb-8 text-sm leading-relaxed">
                    {service.description}
                  </p>
                </div>

                <Link
                  href={`/services/${service.slug}`}
                  className="group/link text-brand-blue inline-flex items-center text-[10px] font-bold tracking-[0.4em] uppercase transition-colors"
                >
                  LEARN MORE
                  <div className="bg-brand-blue/20 group-hover/link:bg-brand-blue ml-3 h-[1.5px] w-10 transition-all group-hover/link:w-16" />
                </Link>
              </div>

              {/* Right Image */}
              <div className="relative h-72 w-full md:h-auto md:w-[45%]">
                <Image
                  src={service.image}
                  alt={service.title}
                  fill
                  className="object-cover grayscale-50 transition-all duration-700 group-hover:scale-105 group-hover:grayscale-0"
                />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

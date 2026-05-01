"use client";

import { useState } from "react";

import Image from "next/image";

import { SERVICES_DATA } from "@data/home/services";
import { motion } from "framer-motion";

import { Icons } from "@repo/ui";

import { Button } from "@/components/ui/Button";

import { cn } from "@lib/utils";

export const Services = () => {
  const [activeId, setActiveId] = useState(SERVICES_DATA[0].id);

  const activeService = SERVICES_DATA.find((s) => s.id === activeId) || SERVICES_DATA[0];

  return (
    <section className="section-padding px-container relative w-full bg-gray-100" id="services">
      <div className=" ">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, amount: 0.1 }}
          transition={{ duration: 2, ease: [0.19, 1, 0.22, 1] }}
          className="header-margin md:gap-element-gap flex flex-col items-center gap-6 text-center lg:flex-row lg:items-end lg:text-left"
        >
          <div className="flex-1">
            <h2 className="text-brand-blue font-primary text-[5rem] leading-[0.7] font-normal tracking-tighter uppercase md:text-[8rem]">
              Our <br className="hidden lg:block" /> Services
            </h2>
          </div>
          <div className="flex flex-col items-center gap-6 lg:items-end lg:justify-end">
            <p className="max-w-xl text-sm leading-relaxed text-zinc-500 md:text-lg lg:pb-4">
              Delivering excellence through specialized construction, infrastructure, and
              engineering solutions tailored for the Kingdom's vision.
            </p>
            <div className="hidden lg:block">
              <Button
                borderColor="border-brand-blue"
                textColor="text-brand-blue"
                bgColor="bg-transparent"
                hoverFillColor="bg-brand-blue"
                hoverTextColor="group-hover:text-background"
                className="w-full md:w-auto"
                href="#services"
              >
                VIEW ALL
              </Button>
            </div>
          </div>
        </motion.div>

        <div className="md:gap-content-gap hidden md:grid md:grid-cols-12 md:items-stretch">
          {/* Left Column: Service Items */}
          <div className="flex h-full flex-col gap-2 md:col-span-7">
            {SERVICES_DATA.map((service) => {
              const isActive = activeId === service.id;

              return (
                <div
                  key={service.id}
                  onMouseEnter={() => setActiveId(service.id)}
                  className={cn(
                    "group p-content-gap relative flex flex-1 cursor-pointer flex-col justify-center border-b border-black/5 transition-all duration-500",
                    isActive ? "bg-brand-blue" : "bg-white"
                  )}
                >
                  <div className="flex flex-col items-start justify-between">
                    <h3
                      className={cn(
                        "w-full text-end text-2xl font-bold uppercase transition-colors duration-500 md:text-5xl",
                        isActive ? "text-white" : "text-brand-blue"
                      )}
                    >
                      {service.title}
                    </h3>
                    <div className="flex w-full items-end justify-between gap-2 md:gap-4">
                      <p
                        className={cn(
                          "max-w-lg text-[10px] leading-relaxed transition-colors duration-500 md:text-xl",
                          isActive ? "text-white/70" : "text-brand-blue/50"
                        )}
                      >
                        {service.subtitle}
                      </p>
                      <Icons.ArrowRight
                        className={cn(
                          "mt-2 h-16 w-16 -rotate-45 transition-all duration-500 md:h-16 md:w-16",
                          isActive
                            ? "translate-x-1 -translate-y-1 text-white"
                            : "text-brand-blue/30"
                        )}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Column: Featured Image */}
          <div className="relative min-h-[500px] overflow-hidden md:col-span-5">
            <motion.div
              key={activeId}
              initial={{ opacity: 0, scale: 1.1 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              transition={{ duration: 0.8, ease: [0.19, 1, 0.22, 1] }}
              className="relative h-full w-full bg-zinc-200"
            >
              <Image
                src={activeService.image}
                alt={activeService.title}
                fill
                className="object-cover"
                sizes="40vw"
              />
              <div className="absolute inset-0 bg-black/10" />
            </motion.div>

            {/* Architectural Info Overlay */}
            <div className="absolute right-12 bottom-12 z-20 text-right">
              <div className="text-[10px] font-bold tracking-[0.4em] text-white/40 uppercase">
                Featured Capability
              </div>
              <div className="text-xl font-bold text-white uppercase">{activeService.title}</div>
            </div>
          </div>
        </div>

        {/* Mobile Layout: Separate Cards */}
        <div className="flex flex-col gap-8 md:hidden">
          {SERVICES_DATA.map((service, idx) => (
            <motion.div
              key={service.id}
              initial={{ opacity: 0, y: 100 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false, amount: 0.1 }}
              transition={{ duration: 2, delay: idx * 0.1, ease: [0.19, 1, 0.22, 1] }}
              className="overflow-hidden bg-white"
            >
              <div className="relative aspect-video w-full">
                <Image
                  src={service.image}
                  alt={service.title}
                  fill
                  className="object-cover"
                  sizes="100vw"
                />
                <div className="absolute inset-0 bg-black/20" />
              </div>
              <div className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <h3 className="text-brand-blue text-2xl leading-tight font-bold uppercase">
                    {service.title}
                  </h3>
                  <Icons.ArrowRight className="text-brand-blue/30 h-8 w-8 -rotate-45" />
                </div>
                <p className="mt-2 text-sm leading-relaxed text-zinc-500">{service.subtitle}</p>
              </div>
            </motion.div>
          ))}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.1 }}
            transition={{ duration: 1.5, delay: 0.5 }}
            className="mt-4"
          >
            <Button
              borderColor="border-brand-blue"
              textColor="text-brand-blue"
              bgColor="bg-transparent"
              hoverFillColor="bg-brand-blue"
              hoverTextColor="group-hover:text-background"
              className="w-full"
              href="#services"
            >
              VIEW ALL
            </Button>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

"use client";

import React from "react";

import Image from "next/image";

import { type Certificate, certificates, concernLogos, sisterCompanies } from "@data/home/csr";
import { Variants, motion } from "framer-motion";

import { Button } from "@/components/ui/Button";

const CertificateCard = ({
  cert,
  index,
  itemVariants,
}: {
  cert: Certificate;
  index: number;
  itemVariants: Variants;
}) => {
  return (
    <motion.div
      initial={{ opacity: 1, y: 0 }}
      className="group border-brand-blue bg-brand-blue relative flex aspect-[3.5/4] w-full flex-col overflow-hidden rounded-none border transition-all duration-500"
    >
      <div className="relative w-full flex-1 p-12">
        <Image
          src={cert.image}
          alt={cert.name}
          fill
          className="object-contain"
          sizes="(max-width: 768px) 100vw, 25vw"
        />
      </div>

      <div className="flex flex-col border-t border-white/10 p-8 text-center">
        <h3 className="text-xl font-bold text-white uppercase">{cert.name}</h3>
        <p className="mt-1 font-mono text-[10px] font-bold tracking-[0.3em] text-white/40 uppercase">
          {cert.code}
        </p>
      </div>

      <div className="bg-white py-4 text-center">
        <span className="text-[10px] font-black tracking-[0.2em] text-black uppercase">
          Verified Credential
        </span>
      </div>
    </motion.div>
  );
};

const LogoTicker = () => {
  return (
    <div className="relative w-full overflow-hidden">
      {/* Desktop Ticker */}
      <div className="hidden md:block">
        <div className="from-background pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r to-transparent md:w-64" />
        <div className="from-background pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l to-transparent md:w-64" />

        <motion.div
          animate={{
            x: ["0%", "-50%"],
          }}
          transition={{
            duration: 30,
            ease: "linear",
            repeat: Infinity,
          }}
          className="gap-2 flex w-max items-center md:gap-8"
        >
          {[...concernLogos, ...concernLogos].map((logo, index) => (
            <div
              key={index}
              className="group relative h-20 w-48 flex-shrink-0 transition-all duration-700"
            >
              <Image
                src={logo}
                alt={`Concern Company Logo ${index + 1}`}
                fill
                className="object-contain"
                sizes="(max-width: 768px) 200px, 300px"
              />
            </div>
          ))}
        </motion.div>
      </div>

      {/* Mobile Grid - 3 Columns */}
      <div className="grid grid-cols-3 gap-6 md:hidden">
        {concernLogos.map((logo, index) => (
          <div
            key={index}
            className="relative flex aspect-[4/3] items-center justify-center p-0 transition-all duration-700"
          >
            <Image
              src={logo}
              alt={`Concern Company Logo ${index + 1}`}
              fill
              className="object-contain"
              sizes="33vw"
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export const CSRSection = () => {
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { y: 40, opacity: 0 },
    visible: (i: number = 0) => ({
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.8,
        ease: [0.19, 1, 0.22, 1],
        delay: (i % 4) * 0.1,
      },
    }),
  };

  return (
    <section className="bg-background section-padding relative overflow-hidden">
      <div className="space-y-container-gap container mx-auto">
        {/* Corporate Social Responsibility */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
          variants={containerVariants}
          className="space-y-element-gap"
        >
          <div className="header-margin gap-element-gap flex flex-col items-center justify-between text-center md:flex-row md:items-end md:text-left">
            <div className="flex-1">
              <h2 className="text-brand-blue text-[4rem] leading-[0.7] font-medium tracking-tighter uppercase md:text-[6rem]">
                Corporate Social <br /> Responsibility
              </h2>
            </div>

          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* Daya Charitable Trust */}
            <motion.div
              variants={itemVariants}
              className="group relative h-[500px] cursor-pointer overflow-hidden rounded-none bg-zinc-950"
            >
              {/* Shutter Reveal Overlay - Slides Up to reveal from bottom */}
              <motion.div
                initial={{ y: "0%" }}
                whileInView={{ y: "-100%" }}
                transition={{ duration: 1.5, ease: [0.19, 1, 0.22, 1] }}
                viewport={{ once: true }}
                className="bg-background absolute inset-0 z-30"
              />

              <div className="absolute inset-0 z-10 bg-black/40 transition-colors group-hover:bg-black/20" />
              <div className="absolute inset-0 transition-all duration-1000">
                <Image
                  src="/images/social/daya-charity.png"
                  alt="Daya Charitable Trust"
                  fill
                  className="object-cover transition-transform duration-1000 group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>
              <div className="relative z-20 flex h-full flex-col justify-between p-12">
                <div className="space-y-4">
                  <h3 className="text-6xl leading-[0.8] font-bold text-white uppercase">
                    Daya <br /> Charitable Trust
                  </h3>
                  <p className="max-w-sm text-xl leading-relaxed font-medium text-white/70">
                    Empowering communities through education, healthcare, and sustainable living
                    initiatives.
                  </p>
                </div>

                <div className="group-hover:bg-brand-blue absolute bottom-0 left-0 w-full bg-gray-200 py-4 text-center transition-colors">
                  <span className="text-foreground group-hover:text-background text-[10px] font-black tracking-[0.3em] uppercase">
                    LEARN ABOUT THE INITIATIVE
                  </span>
                </div>
              </div>
            </motion.div>

            {/* Daya Academy */}
            <motion.div
              variants={itemVariants}
              className="group relative h-[500px] cursor-pointer overflow-hidden rounded-none bg-zinc-950"
            >
              {/* Shutter Reveal Overlay - Slides Up to reveal from bottom */}
              <motion.div
                initial={{ y: "0%" }}
                whileInView={{ y: "-100%" }}
                transition={{ duration: 1.5, ease: [0.19, 1, 0.22, 1] }}
                viewport={{ once: true }}
                className="bg-background absolute inset-0 z-30"
              />

              <div className="absolute inset-0 z-10 bg-black/40 transition-colors group-hover:bg-black/20" />
              <div className="absolute inset-0 transition-all duration-1000">
                <Image
                  src="/images/social/daya-academy.png"
                  alt="Daya Academy"
                  fill
                  className="object-cover transition-transform duration-1000 group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>
              <div className="relative z-20 flex h-full flex-col justify-between p-12">
                <div className="space-y-4">
                  <h3 className="text-6xl leading-[0.8] font-bold text-white uppercase">
                    Daya <br /> Academy
                  </h3>
                  <p className="max-w-sm text-xl leading-relaxed font-medium text-white/70">
                    Fostering the next generation of industry leaders with world-class technical
                    education.
                  </p>
                </div>

                <div className="group-hover:bg-brand-blue absolute bottom-0 left-0 w-full bg-gray-200 py-4 text-center transition-colors">
                  <span className="text-foreground group-hover:text-background text-[10px] font-black tracking-[0.3em] uppercase">
                    Explore the academy
                  </span>
                </div>
              </div>
            </motion.div>
          </div>

        </motion.div>

        {/* Sister Concerns */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
          variants={containerVariants}
          className="space-y-element-gap"
        >
          <div className="header-margin gap-element-gap flex flex-col items-center justify-between text-center md:flex-row md:items-end md:text-left">
            <div className="flex-1">
              <h2 className="text-brand-blue text-[4rem] leading-[0.7] font-medium tracking-tighter uppercase md:text-[6rem]">
                Our Sister <br />
                Concern Companies
              </h2>
            </div>
            <div className="hidden flex-1 justify-end pb-2 md:flex">
              <Button
                href="#contact"
                borderColor="border-brand-blue"
                textColor="text-brand-blue"
                bgColor="bg-transparent"
                hoverFillColor="bg-brand-blue"
                hoverTextColor="group-hover:text-background"
                className="h-14 w-[220px]"
              >
                VIEW ALL
              </Button>
            </div>
          </div>

          <LogoTicker />

          <div className="gap-4 scroll-hide flex flex-row items-stretch justify-start snap-x snap-mandatory overflow-x-auto overflow-y-hidden md:gap-content-gap md:flex-row md:items-center md:justify-center md:overflow-visible">
            {sisterCompanies.map((company, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 1, y: 0 }}
                whileHover={{ y: -10 }}
                transition={{ duration: 0.5 }}
                className="group relative h-[450px] w-[80vw] flex-shrink-0 snap-center cursor-pointer overflow-hidden rounded-none bg-zinc-950 md:w-1/3 md:flex-shrink"
              >
                {/* Background Image with Overlay */}
                <div className="absolute inset-0 z-0 transition-all duration-1000">
                  <Image
                    src={company.img}
                    alt={company.name}
                    fill
                    sizes="(max-width: 768px) 100vw, 350px"
                    className="object-cover opacity-60 transition-transform duration-1000 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent" />
                </div>

                {/* Content */}
                <div className="relative z-10 flex h-full flex-col justify-end p-10">
                  <h3 className="text-3xl leading-none font-bold tracking-tight text-white uppercase transition-colors duration-500">
                    {company.name}
                  </h3>
                  <div className="mt-6 h-[1px] w-full bg-white/10 transition-colors group-hover:bg-white/30" />
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-[10px] font-bold tracking-widest text-white/40 uppercase">
                      Subsidiary
                    </span>
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="text-white/40 transition-colors group-hover:text-white"
                    >
                      <path d="M7 17l10-10M7 7h10v10" />
                    </svg>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
          {/* Mobile CTA */}
          <div className="mt-8 flex justify-center md:hidden">
            <Button
              href="#contact"
              borderColor="border-brand-blue"
              textColor="text-brand-blue"
              bgColor="bg-transparent"
              hoverFillColor="bg-brand-blue"
              hoverTextColor="group-hover:text-background"
              className="h-14 w-full"
            >
              VIEW ALL
            </Button>
          </div>
        </motion.div>

        {/* Certificates */}
        <div className="space-y-element-gap">
          <div className="header-margin gap-element-gap flex flex-col items-center justify-between text-center md:flex-row md:items-end md:text-left">
            <div className="flex-1">
              <h2 className="text-brand-blue text-[4rem] leading-[0.7] font-medium tracking-tighter uppercase md:text-[6rem]">
                Quality <br /> Certificates
              </h2>
            </div>

          </div>

          <div className="scroll-hide flex flex-row items-stretch justify-start gap-4 snap-x snap-mandatory overflow-x-auto overflow-y-hidden md:grid md:grid-cols-2 md:overflow-visible lg:grid-cols-4">
            {certificates.map((cert: Certificate, index: number) => (
              <motion.div
                key={index}
                initial={{ opacity: 1, y: 0 }}
                className="w-[80vw] flex-shrink-0 snap-center md:w-auto md:flex-shrink"
              >
                <CertificateCard cert={cert} index={index} itemVariants={itemVariants} />
              </motion.div>
            ))}
          </div>

        </div>
      </div>
    </section>
  );
};

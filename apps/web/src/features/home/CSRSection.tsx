"use client";

import React from "react";
import Image from "next/image";
import { Variants, motion } from "framer-motion";
import { Button } from "@ui/Button";

interface Certificate {
  name: string;
  code: string;
}

const certificates = [
  { name: "ISO 9001", code: "ISO-9001-2015" },
  { name: "ISO 14001", code: "ISO-14001-2015" },
  { name: "OHSAS 18001", code: "OHSAS-18001-2007" },
  { name: "ISO 45001", code: "ISO-45001-2018" },
];

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
      variants={itemVariants}
      custom={index}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2, margin: "0px 0px -50px 0px" }}
      className="group relative aspect-[3.5/4] w-full border border-gray-100 bg-white p-8 transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl"
    >
      <div className="relative flex h-full flex-col">
        <div className="relative w-full flex-1">
          <Image
            src={`/images/certificates/certificate${index + 1}.png`}
            alt={cert.name}
            fill
            className="object-contain"
            sizes="(max-width: 768px) 100vw, 25vw"
          />
        </div>

        <div className="mt-6 flex flex-col items-center text-center">
          <h3 className="text-brand-blue text-lg font-bold uppercase tracking-widest">{cert.name}</h3>
          <p className="mt-1 font-mono text-[10px] font-bold tracking-widest text-gray-400 uppercase">
            {cert.code}
          </p>
        </div>
      </div>
    </motion.div>
  );
};

const LogoTicker = () => {
  const logos = Array.from({ length: 7 }, (_, i) => `/images/concern-companies/logos/${i + 1}.png`);

  return (
    <div className="relative w-full overflow-hidden border-y border-gray-100 py-12">
      <motion.div
        animate={{
          x: ["0%", "-50%"],
        }}
        transition={{
          duration: 30,
          ease: "linear",
          repeat: Infinity,
        }}
        className="flex w-max items-center gap-12"
      >
        {[...logos, ...logos].map((logo, index) => (
          <div
            key={index}
            className="group relative h-16 w-40 flex-shrink-0 opacity-40 grayscale transition-all duration-700 hover:opacity-100 hover:grayscale-0 md:h-20 md:w-56"
          >
            <Image
              src={logo}
              alt={`Concern Company Logo ${index + 1}`}
              fill
              className="object-contain"
              sizes="(max-width: 768px) 200px, 300px"
              priority
            />
          </div>
        ))}
      </motion.div>
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
    hidden: { y: 50, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.8,
        ease: "easeOut",
      },
    },
  };

  return (
    <section className="bg-background relative px-6 py-32 md:px-20 md:py-48 lg:px-32">
      <div className="max-w-8xl relative z-10 mx-auto space-y-40">
        {/* Corporate Social Responsibility */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={containerVariants}
          className="space-y-20"
        >
          <div className="flex flex-col items-start justify-between gap-8 md:flex-row">
            <div className="flex-1">
              <h2 className="text-brand-blue text-5xl font-bold uppercase tracking-[0.4em] md:text-7xl">
                Social <br /> Responsibility
              </h2>
            </div>
            <div className="flex flex-1 justify-end pt-4">
              <Button variant="outline" href="#csr">
                View All
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-12 md:grid-cols-2">
            {/* Daya Charitable Trust */}
            <motion.div
              variants={itemVariants}
              className="cursor-image-trigger group relative h-[500px] cursor-pointer overflow-hidden"
            >
              <div className="absolute inset-0 grayscale transition-all duration-1000 group-hover:scale-110 group-hover:grayscale-0">
                <Image
                  src="/images/home-hero.png"
                  alt="Daya Charitable Trust"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-80" />
              <div className="relative z-20 flex h-full flex-col items-start justify-end p-12 text-left text-white">
                <h3 className="mb-4 text-3xl font-bold uppercase tracking-widest">Daya Charitable Trust</h3>
                <p className="max-w-xs text-sm font-medium leading-relaxed tracking-wide text-white/80">
                  Empowering communities through education, healthcare, and sustainable living
                  initiatives.
                </p>
                <div className="mt-8 h-[1px] w-12 bg-white transition-all group-hover:w-24" />
              </div>
            </motion.div>

            {/* Daya Academy */}
            <motion.div
              variants={itemVariants}
              className="cursor-image-trigger group relative h-[500px] cursor-pointer overflow-hidden"
            >
              <div className="absolute inset-0 grayscale transition-all duration-1000 group-hover:scale-110 group-hover:grayscale-0">
                <Image
                  src="/images/home-hero.png"
                  alt="Daya Academy"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-80" />
              <div className="relative z-20 flex h-full flex-col items-start justify-end p-12 text-left text-white">
                <h3 className="mb-4 text-3xl font-bold uppercase tracking-widest">Daya Academy</h3>
                <p className="max-w-xs text-sm font-medium leading-relaxed tracking-wide text-white/80">
                  Fostering the next generation of industry leaders with world-class education.
                </p>
                <div className="mt-8 h-[1px] w-12 bg-white transition-all group-hover:w-24" />
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Sister Concerns */}
        <div className="space-y-16">
          <div className="flex flex-col items-start justify-between gap-8 md:flex-row">
            <div className="flex-1">
              <h2 className="text-brand-blue text-5xl font-bold uppercase tracking-[0.4em] md:text-7xl">
                Sister <br /> Concerns
              </h2>
            </div>
            <div className="flex flex-1 justify-end pt-4">
              <Button variant="outline" href="#concerns">
                View All
              </Button>
            </div>
          </div>

          <LogoTicker />

          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {[
              { name: "Paanayil Heavy", img: "/images/concern-companies/paanayil-heavy.png" },
              { name: "Paanayil Builder", img: "/images/concern-companies/panayil-builder.png" },
              { name: "South Pacific General", img: "/images/concern-companies/south-pacific-general.png" },
            ].map((company, index) => (
              <div
                key={index}
                className="cursor-image-trigger group relative h-[450px] cursor-pointer overflow-hidden bg-black"
              >
                <Image
                  src={company.img}
                  alt={company.name}
                  fill
                  className="object-cover opacity-60 grayscale transition-all duration-700 group-hover:scale-110 group-hover:opacity-100 group-hover:grayscale-0"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
                <div className="relative flex h-full flex-col items-center justify-end p-10 text-center">
                  <h3 className="text-sm font-bold tracking-[0.4em] text-white uppercase">
                    {company.name}
                  </h3>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Certificates */}
        <div className="space-y-16">
          <div className="flex flex-col items-start justify-between gap-8 md:flex-row">
            <div className="flex-1">
              <h2 className="text-brand-blue text-5xl font-bold uppercase tracking-[0.4em] md:text-7xl">
                Quality <br /> Certificates
              </h2>
            </div>
            <div className="flex flex-1 justify-end pt-4">
              <Button variant="outline" href="#certificates">
                View All
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {certificates.map((cert: Certificate, index: number) => (
              <CertificateCard key={index} cert={cert} index={index} itemVariants={itemVariants} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

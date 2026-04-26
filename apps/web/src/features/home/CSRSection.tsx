"use client";

import React from "react";

import Image from "next/image";

import { Variants, motion } from "framer-motion";

import { Button } from "@/components/ui/Button";

interface Certificate {
  name: string;
  code: string;
}

const CSRMask = () => (
  <svg width="0" height="0" className="absolute">
    <defs>
      <clipPath id="csr-mask" clipPathUnits="objectBoundingBox">
        <path
          d="
            M 0 0 
            L 0.15 0 
            C 0.2 0, 0.22 0.03, 0.28 0.03 
            L 0.72 0.03 
            C 0.78 0.03, 0.8 0, 0.85 0 
            L 1 0 
            L 1 1 
            L 0.85 1 
            C 0.8 1, 0.78 0.97, 0.72 0.97 
            L 0.28 0.97 
            C 0.22 0.97, 0.2 1, 0.15 1 
            L 0 1 
            Z
          "
        />
      </clipPath>
    </defs>
  </svg>
);

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
      className="group relative aspect-[3.5/4] w-full overflow-hidden rounded-3xl border border-gray-100 bg-white p-8 shadow-xl transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl"
    >
      <div className="bg-brand-blue/5 group-hover:bg-brand-blue/10 absolute top-0 right-0 h-32 w-32 translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl transition-colors duration-500" />

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
          <div className="bg-brand-blue/5 text-brand-blue mb-3 rounded-xl p-2">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <path d="m9 12 2 2 4-4" />
            </svg>
          </div>
          <h3 className="text-brand-blue text-lg font-bold">{cert.name}</h3>
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
    <div className="relative w-full overflow-hidden">
      {/* Gradient Masks for ultra-smooth edge transitions */}
      <div className="from-theme-bg pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r to-transparent md:w-64" />
      <div className="from-theme-bg pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l to-transparent md:w-64" />

      <motion.div
        animate={{
          x: ["0%", "-50%"],
        }}
        transition={{
          duration: 30,
          ease: "linear",
          repeat: Infinity,
        }}
        className="flex w-max items-center gap-6"
      >
        {/* Double the array for seamless infinity */}
        {[...logos, ...logos].map((logo, index) => (
          <motion.div
            key={index}
            whileHover={{ scale: 1.15 }}
            className="group relative h-20 w-48 flex-shrink-0 opacity-60 grayscale transition-all duration-700 hover:opacity-100 hover:grayscale-0 md:h-32 md:w-70"
          >
            <Image
              src={logo}
              alt={`Concern Company Logo ${index + 1}`}
              fill
              className="object-contain"
              sizes="(max-width: 768px) 200px, 300px"
              priority
            />
          </motion.div>
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
    hidden: { y: 100, opacity: 0, scale: 0.7 },
    visible: (i: number = 0) => ({
      y: 0,
      opacity: 1,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 12,
        mass: 1,
        delay: (i % 4) * 0.1,
      },
    }),
  };

  return (
    <section className="bg-background relative overflow-hidden px-6 py-32 md:px-20 md:py-48 lg:px-32">
      <CSRMask />
      <div className="max-w-8xl relative z-10 mx-auto space-y-40">
        {/* Corporate Social Responsibility */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={containerVariants}
          className="space-y-20"
        >
          <motion.div variants={itemVariants} className="space-y-6 text-center">
            <div className="mb-20 flex flex-col items-start justify-between gap-8 md:flex-row md:items-start">
              <div className="flex-1">
                <h2 className="text-brand-blue flex flex-col text-[4rem] leading-[0.6] tracking-tighter md:text-[5.5rem]">
                  <span className="text-start font-medium">
                    Corporate Social <br /> Responsibility
                  </span>
                </h2>
              </div>
              <div className="flex flex-1 justify-end pt-4">
                <Button href="#contact" className="bg-brand-blue h-12 w-[180px]">
                  View All
                </Button>
              </div>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
            {/* Daya Charitable Trust */}
            <motion.div
              initial={{ x: -100 }}
              whileInView={{ x: 0 }}
              viewport={{ once: false }}
              transition={{ duration: 1 }}
              className="group relative h-[500px] cursor-pointer overflow-hidden rounded-3xl shadow-[0_40px_100px_rgba(0,0,0,0.1)]"
              style={{ clipPath: "url(#csr-mask)" }}
            >
              <div className="bg-brand-blue/10 absolute inset-0 z-10 to-transparent transition-opacity duration-500" />
              <div className="absolute inset-0 grayscale transition-all duration-1000 group-hover:grayscale-0">
                <Image
                  src="/images/home-hero.png"
                  alt="Daya Charitable Trust - Charitable Initiative"
                  fill
                  className="scale-110 object-cover transition-transform duration-1000 group-hover:scale-100"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>
              <div className="relative z-20 flex h-full flex-col items-center justify-end space-y-6 p-12 pb-16 text-center text-white">
                <div className="bg-background mb-4 -translate-y-8 transform rounded-2xl p-5 opacity-0 shadow-2xl transition-all duration-700 group-hover:translate-y-0 group-hover:opacity-100">
                  <svg
                    width="40"
                    height="40"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-[#0073BC]"
                  >
                    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                  </svg>
                </div>
                <h3 className="text-3xl font-bold tracking-tight">Daya Charitable Trust</h3>
                <p className="max-w-xs leading-relaxed font-medium text-white/90">
                  Empowering communities through education, healthcare, and sustainable living
                  initiatives.
                </p>
                <div className="mt-4 h-1 w-12 rounded-full bg-white/30"></div>
              </div>
            </motion.div>

            {/* Daya Academy */}
            <motion.div
              initial={{ x: 100 }}
              whileInView={{ x: 0 }}
              viewport={{ once: false }}
              transition={{ duration: 1 }}
              className="group relative h-[500px] cursor-pointer overflow-hidden rounded-3xl shadow-[0_40px_100px_rgba(30,64,175,0.15)]"
              style={{ clipPath: "url(#csr-mask)" }}
            >
              <div className="bg-brand-blue/10 absolute inset-0 z-10 to-transparent transition-opacity duration-500" />
              <div className="absolute inset-0 grayscale transition-all duration-1000 group-hover:grayscale-0">
                <Image
                  src="/images/home-hero.png"
                  alt="Daya Academy - Educational Excellence"
                  fill
                  className="scale-110 object-cover transition-transform duration-1000 group-hover:scale-100"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>
              <div className="relative z-20 flex h-full flex-col items-center justify-end space-y-6 p-12 pb-16 text-center text-white">
                <div className="bg-background mb-4 -translate-y-8 transform rounded-2xl p-5 opacity-0 shadow-2xl transition-all duration-700 group-hover:translate-y-0 group-hover:opacity-100">
                  <svg
                    width="40"
                    height="40"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-[#1e40af]"
                  >
                    <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                    <path d="M6 12v5c3 3 9 3 12 0v-5" />
                  </svg>
                </div>
                <h3 className="text-3xl font-bold tracking-tight">Daya Academy</h3>
                <p className="max-w-xs leading-relaxed font-medium text-white/90">
                  Fostering the next generation of industry leaders with world-class education.
                </p>
                <div className="mt-4 h-1 w-12 rounded-full bg-white/30"></div>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Sister Concerns */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={containerVariants}
          className="space-y-16"
        >
          <motion.div variants={itemVariants} className="space-y-6 text-center">
            <div className="mb-20 flex flex-col items-start justify-between gap-8 md:flex-row md:items-start">
              <div className="flex-1">
                <h2 className="text-brand-blue flex flex-col text-[4rem] leading-[0.6] tracking-tighter md:text-[5.5rem]">
                  <span className="text-start font-medium">
                    Our Sister <br />
                    Concern Companies
                  </span>
                </h2>
              </div>
              <div className="flex flex-1 justify-end pt-4">
                <Button href="#contact" className="bg-brand-blue h-12 w-[180px]">
                  View All
                </Button>
              </div>
            </div>
          </motion.div>

          <LogoTicker />

          <div className="perspective-2000 flex flex-col items-center justify-center gap-6 py-20 md:flex-row md:-space-x-12">
            {[
              {
                name: "Paanayil Heavy",
                img: "/images/concern-companies/paanayil-heavy.png",
                rotation: -25,
                z: -100,
                x: -50,
                ix: 100,
                zIndex: 10,
              },
              {
                name: "Paanayil Builder",
                img: "/images/concern-companies/panayil-builder.png",
                rotation: 0,
                z: 100,
                x: 0,
                ix: 0,
                zIndex: 20,
              },
              {
                name: "South Pacific General",
                img: "/images/concern-companies/south-pacific-general.png",
                rotation: 25,
                z: -100,
                x: 50,
                ix: -100,
                zIndex: 10,
              },
            ].map((company, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                initial={{ x: company.ix, zIndex: company.zIndex }}
                whileInView={{ x: company.x, zIndex: company.zIndex }}
                style={{
                  rotateY: company.rotation,
                  z: company.z,
                  x: company.x,
                  transformStyle: "preserve-3d",
                  clipPath: "url(#csr-mask)",
                }}
                whileHover={{
                  y: -20,
                  rotateY: 0,
                  z: 100,
                  x: 0,
                  scale: 1.02,
                  zIndex: 50,
                }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="group bg-foreground relative h-[450px] w-full cursor-pointer overflow-hidden rounded-3xl md:w-[350px]"
              >
                {/* Background Image with Overlay */}
                <div className="absolute inset-0">
                  <Image
                    src={company.img}
                    alt={company.name}
                    fill
                    sizes="(max-width: 768px) 100vw, 350px"
                    className="object-cover opacity-100"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-900/40 to-transparent" />
                </div>

                {/* Content */}
                <div className="relative flex h-full flex-col items-center justify-end space-y-8 p-10 text-center">
                  <div className="space-y-2">
                    <h3 className="text-sm leading-relaxed font-bold tracking-widest text-white/80 uppercase transition-colors duration-500 group-hover:text-white">
                      {company.name}
                    </h3>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Certificates */}
        <div className="space-y-16">
          <motion.div className="space-y-6 text-center">
            <div className="mb-20 flex flex-col items-start justify-between gap-8 md:flex-row md:items-start">
              <div className="flex-1">
                <h2 className="text-brand-blue flex flex-col text-[4rem] leading-[0.6] tracking-tighter md:text-[5.5rem]">
                  <span className="text-start font-medium">
                    Quality <br /> Certificates
                  </span>
                </h2>
              </div>

              <div className="flex flex-1 justify-end pt-4">
                <Button href="#contact" className="bg-brand-blue h-12 w-[180px]">
                  View All
                </Button>
              </div>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {certificates.map((cert: Certificate, index: number) => (
              <motion.div
                key={index}
                initial={{ opacity: 0.8, y: 50 * (index + 1) }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 1 }}
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

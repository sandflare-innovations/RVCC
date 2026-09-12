"use client";

import {
  type Certificate,
  certificates,
  sisterCompanies,
} from "@data/home/csr";
import { motion, Variants } from "framer-motion";
import Image from "next/image";
import React from "react";

import { Button } from "@/components/ui/Button";

export interface CSRCompanyItem {
  id?: string | number;
  name: string;
  logoUrl?: string;
  src?: string;
  industry?: string;
  websiteUrl?: string | null;
  href?: string;
}

interface CSRSectionProps {
  initialLogos?: CSRCompanyItem[];
}

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

const LogoMedia = ({ logo, index }: { logo: { src: string; href?: string }; index: number }) => {
  const image = (
    <Image
      src={logo.src}
      alt={`Concern Company Logo ${index + 1}`}
      fill
      className="object-contain"
      sizes="(max-width: 768px) 200px, 300px"
    />
  );

  if (logo.href) {
    return (
      <a
        href={logo.href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Visit concern company website"
        className="absolute inset-0"
      >
        {image}
      </a>
    );
  }

  return image;
};

export const LogoTickerSkeleton = () => {
  return (
    <div className="relative w-full overflow-hidden py-4">
      <div className="flex w-full items-center justify-center gap-8 opacity-60">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="h-20 w-40 border border-brand-blue/15 bg-gradient-to-r from-white via-brand-blue/10 to-white animate-pulse flex-shrink-0"
          />
        ))}
      </div>
    </div>
  );
};

export const SisterCompaniesSkeleton = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="h-[450px] w-full bg-gradient-to-br from-brand-blue/10 via-white to-brand-blue/5 border border-brand-blue/20 shadow-sm animate-pulse relative p-10 flex flex-col justify-between"
        >
          <div className="h-20 w-36 bg-gradient-to-r from-brand-blue/20 to-brand-blue/10 rounded" />
          <div className="flex flex-col gap-3">
            <div className="h-8 w-3/4 bg-gradient-to-r from-brand-blue/25 to-brand-blue/10" />
            <div className="h-3 w-1/3 bg-brand-blue/40" />
          </div>
        </div>
      ))}
    </div>
  );
};

const LogoTicker = ({ logos }: { logos?: { src: string; href?: string }[] }) => {
  if (!logos || logos.length === 0) {
    return <LogoTickerSkeleton />;
  }

  const displayLogos = logos;

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
          className="flex w-max items-center gap-2 md:gap-8"
        >
          {[...displayLogos, ...displayLogos].map((logo, index) => (
            <div
              key={index}
              className="group relative h-32 w-48 flex-shrink-0 transition-all duration-700"
            >
              <LogoMedia logo={logo} index={index} />
            </div>
          ))}
        </motion.div>
      </div>

      {/* Mobile Grid - 3 Columns */}
      <div className="grid grid-cols-3 gap-6 md:hidden">
        {displayLogos.map((logo, index) => (
          <div
            key={index}
            className="relative flex aspect-[4/3] items-center justify-center p-0 transition-all duration-700"
          >
            <LogoMedia logo={logo} index={index} />
          </div>
        ))}
      </div>
    </div>
  );
};

export const CSRSection = ({ initialLogos }: CSRSectionProps = {}) => {
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

  const dynamicCompanies = initialLogos || [];
  const tickerLogos = dynamicCompanies
    .map((c) => ({
      src: c.logoUrl || c.src || "",
      href: c.websiteUrl || c.href || undefined,
    }))
    .filter((l) => Boolean(l.src));

  return (
    <section className="bg-background section-padding relative w-full overflow-hidden" id="csr">
      <div className="container space-y-32">
        {/* Sister Concerns */}
        <motion.div
          initial={{ opacity: 1, y: 0 }}
          className="space-y-element-gap"
        >
          <div className="header-margin gap-element-gap flex flex-col items-center justify-between text-center md:flex-row md:items-end md:text-left">
            <div className="flex-1">
              <h2 className="text-brand-blue text-[4rem] leading-[0.7] font-medium tracking-tighter uppercase md:text-[6rem]">
                Sister <br /> Concerns
              </h2>
            </div>
            <div className="hidden flex-col items-end justify-end md:flex">
              <p className="max-w-sm text-sm leading-relaxed text-zinc-500 md:pb-4">
                Discover our ecosystem of specialized enterprises driving forward-thinking
                solutions across multiple industries.
              </p>
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

          <LogoTicker logos={tickerLogos} />

          <div className="scroll-hide md:gap-content-gap flex snap-x snap-mandatory flex-row items-stretch justify-start gap-4 overflow-x-auto overflow-y-hidden md:flex-row md:items-center md:justify-center md:overflow-visible">
            {sisterCompanies.map((company, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 1, y: 0 }}
                whileHover={{ y: -10 }}
                transition={{ duration: 0.5 }}
                className="group relative h-[450px] w-[80vw] flex-shrink-0 cursor-pointer snap-center overflow-hidden rounded-none bg-zinc-950 md:w-1/3 md:flex-shrink"
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
        </motion.div>

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
                  src="https://pub-70b8c21f306842d3bbeab4d1d19319e1.r2.dev/file-manager/corporate-social-responsibility/daya-trust-5ftv.webp"
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

                <div className="bg-brand-blue group-hover:bg-brand-blue absolute bottom-0 left-0 w-full py-4 text-center transition-colors sm:bg-gray-200">
                  <span className="text-background sm:text-foreground group-hover:text-background text-[10px] font-black tracking-[0.3em] uppercase">
                    Explore the Initiative
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
                  src="https://pub-70b8c21f306842d3bbeab4d1d19319e1.r2.dev/file-manager/corporate-social-responsibility/daya-academy-vwr2.webp"
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

                <div className="bg-brand-blue group-hover:bg-brand-blue absolute bottom-0 left-0 w-full py-4 text-center transition-colors sm:bg-gray-200">
                  <span className="text-background sm:text-foreground group-hover:text-background text-[10px] font-black tracking-[0.3em] uppercase">
                    Explore the academy
                  </span>
                </div>
              </div>
            </motion.div>
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

          <div className="scroll-hide flex snap-x snap-mandatory flex-row items-stretch justify-start gap-4 overflow-x-auto overflow-y-hidden md:grid md:grid-cols-2 md:overflow-visible lg:grid-cols-4">
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

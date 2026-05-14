"use client";

import React from "react";

import Image from "next/image";

import { type Certificate, certificates } from "@data/home/csr";
import { motion } from "framer-motion";

const CertificateCard = ({ cert }: { cert: Certificate }) => {
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

export const AboutCertifications = () => {
  return (
    <section className="bg-background section-padding relative overflow-hidden">
      <div className="container mx-auto">
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
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{
                  duration: 0.8,
                  ease: [0.19, 1, 0.22, 1],
                  delay: (index % 4) * 0.1,
                }}
                className="w-[80vw] flex-shrink-0 snap-center md:w-auto md:flex-shrink"
              >
                <CertificateCard cert={cert} />
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

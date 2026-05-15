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
    <section className="bg-background py-24 relative overflow-hidden">
      <div className="container mx-auto">
        <div className="mb-20 text-center">
          <span className="text-brand-blue mb-4 block text-[10px] font-bold tracking-[0.4em] uppercase">
            Accreditations
          </span>
          <h3 className="font-heading text-6xl tracking-tighter text-zinc-900 uppercase">
            Quality <span className="text-brand-blue serif">Certificates</span>
          </h3>
          <p className="mx-auto mt-4 max-w-2xl font-light text-zinc-500">
            Our commitment to excellence is reinforced by international certifications and 
            adherence to the highest industry standards.
          </p>
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
    </section>
  );
};

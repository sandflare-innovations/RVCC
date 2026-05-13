"use client";

import React from "react";
import { motion } from "framer-motion";
import { FaBullseye, FaEye, FaShieldHalved, FaBolt, FaHeart, FaLightbulb } from "react-icons/fa6";

const ValueCard = ({ 
  icon: Icon, 
  title, 
  description, 
  delay 
}: { 
  icon: any, 
  title: string, 
  description: string,
  delay: number
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.6, delay }}
    className="group relative border border-zinc-100 bg-white p-8 transition-all hover:border-brand-blue/30 hover:shadow-xl hover:shadow-brand-blue/5"
  >
    <div className="mb-6 inline-flex h-12 w-12 items-center justify-center bg-brand-blue/5 text-brand-blue transition-colors group-hover:bg-brand-blue group-hover:text-white">
      <Icon size={24} />
    </div>
    <h4 className="font-heading mb-3 text-xl uppercase text-zinc-900 tracking-tight">{title}</h4>
    <p className="text-sm font-light leading-relaxed text-zinc-500">{description}</p>
    
    {/* Decorative corner */}
    <div className="absolute top-0 right-0 h-0 w-0 border-t-2 border-r-2 border-transparent transition-all group-hover:h-4 group-hover:w-4 group-hover:border-brand-blue/30" />
  </motion.div>
);

export const AboutMissionValues = () => {
  return (
    <section className="bg-zinc-50/50 py-24 lg:py-32">
      <div className="container mx-auto px-6">
        {/* Mission & Vision Row */}
        <div className="mb-24 grid grid-cols-1 gap-12 lg:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="flex gap-8"
          >
            <div className="flex-shrink-0 text-brand-blue">
              <FaBullseye size={48} />
            </div>
            <div>
              <h3 className="font-heading mb-4 text-3xl uppercase text-zinc-900">Our <span className="text-brand-blue serif">Mission</span></h3>
              <p className="text-lg font-light leading-relaxed text-zinc-500">
                At RVCC, we maximize client value by delivering high-quality, timely, and cost-effective solutions. Backed by modern technology and years of industry expertise, we excel in both new developments and renovation projects.
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="flex gap-8"
          >
            <div className="flex-shrink-0 text-brand-blue">
              <FaEye size={48} />
            </div>
            <div>
              <h3 className="font-heading mb-4 text-3xl uppercase text-zinc-900">Our <span className="text-brand-blue serif">Vision</span></h3>
              <p className="text-lg font-light leading-relaxed text-zinc-500">
                We are committed to partnership, transparency, and reliability. Leveraging our proven expertise across the construction industry, we build lasting client trust and support sustainable growth while prioritizing health, safety, and environmental responsibility.
              </p>
            </div>
          </motion.div>
        </div>

        {/* Core Values Heading */}
        <div className="mb-12 text-center">
          <h3 className="font-heading text-4xl uppercase text-zinc-900 tracking-tight">Core <span className="text-brand-blue serif">Strengths</span></h3>
          <div className="mx-auto mt-4 h-px w-20 bg-brand-blue/20" />
        </div>

        {/* Values Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <ValueCard 
            icon={FaShieldHalved} 
            title="Classified" 
            description="Class A certified contracting company with over 18 years of proven excellence in Saudi Arabia." 
            delay={0.1}
          />
          <ValueCard 
            icon={FaBolt} 
            title="Capable" 
            description="Dedicated PMO supported by experienced managers and skilled technical teams for large-scale developments." 
            delay={0.2}
          />
          <ValueCard 
            icon={FaHeart} 
            title="Trusted" 
            description="Established as a trusted partner with a robust financial foundation audited by KPMG." 
            delay={0.3}
          />
          <ValueCard 
            icon={FaLightbulb} 
            title="Quality Driven" 
            description="Steadfast commitment to quality and HSE excellence in alignment with ISO standards." 
            delay={0.4}
          />
        </div>
      </div>
    </section>
  );
};

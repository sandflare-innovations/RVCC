"use client";

import { motion } from "framer-motion";
import { HiOutlineCheck } from "react-icons/hi2";

import { Service } from "@/data/services";

interface ServiceDetailContentProps {
  service: Service;
}

export const ServiceDetailContent = ({ service }: ServiceDetailContentProps) => {
  return (
    <section className="section-padding bg-white">
      <div className="container">
        <div className="grid grid-cols-1 gap-16 lg:grid-cols-12">
          {/* Left: Long Description */}
          <div className="lg:col-span-7">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="font-heading mb-10 text-4xl leading-[2.5rem] md:text-6xl">
                Expert solutions for <br />
                <span className="text-brand-blue">exceptional results.</span>
              </h2>
              <div className="text-muted/80 space-y-6 text-lg leading-relaxed">
                <p>{service.longDescription}</p>
                <p>
                  At RVCC, we understand that each project is unique. Our approach combines
                  traditional craftsmanship with modern technology to deliver results that not only
                  meet but exceed our clients' expectations.
                </p>
              </div>
            </motion.div>
          </div>

          {/* Right: Features/Capabilities */}
          <div className="lg:col-span-4 lg:col-start-9">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="border-border bg-background border p-8 md:p-12"
              style={{ borderRadius: "0px" }}
            >
              <h3 className="font-heading mb-8 text-xl tracking-wider uppercase">Key Features</h3>
              <ul className="space-y-6">
                {service.features.map((feature, index) => (
                  <li key={index} className="flex items-start space-x-4">
                    <div className="bg-brand-blue mt-1 flex h-5 w-5 flex-shrink-0 items-center justify-center text-white">
                      <HiOutlineCheck className="h-3.5 w-3.5" />
                    </div>
                    <span className="text-muted/90 text-sm font-medium">{feature}</span>
                  </li>
                ))}
              </ul>

              <div className="bg-brand-blue/10 mt-12 p-6 text-center">
                <p className="text-brand-blue text-xs font-bold tracking-[0.2em] uppercase">
                  Ready to start?
                </p>
                <button className="hover:text-brand-blue mt-4 text-sm font-bold underline underline-offset-8 transition-colors">
                  REQUEST A QUOTE
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};

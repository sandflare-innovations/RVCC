"use client";

import Image from "next/image";
import { Button } from "@ui/Button";

const SERVICES_DATA = [
  {
    id: "civil",
    title: "Civil Construction",
    description:
      "Expertly engineered structures that redefine the skyline. We specialize in high-end villa construction and commercial developments with uncompromising integrity and precision.",
  },
  {
    id: "landscaping",
    title: "Landscaping",
    description:
      "Creating lush, sustainable outdoor environments that harmonize with modern architecture. Our landscape designs are functional works of art tailored for premium residences.",
  },
  {
    id: "infrastructure",
    title: "Infrastructure",
    description:
      "Developing the foundational systems that power cities. From complex roadworks to advanced utility networks, we build for the future with innovative engineering.",
  },
  {
    id: "surveying",
    title: "Surveying",
    description:
      "The starting point of every masterpiece. Our surveying team utilizes state-of-the-art instruments to ensure absolute accuracy in every measurement and site analysis.",
  },
];

export const Services = () => {
  return (
    <section className="bg-background relative w-full px-8 py-24 md:px-16 lg:px-24" id="services">
      <div className="mx-auto max-w-7xl">
        {/* Header Section */}
        <div className="mb-20 flex flex-col items-start justify-between gap-8 md:flex-row">
          <div className="flex-1">
            <h2 className="text-brand-blue text-5xl font-bold uppercase tracking-[0.4em] md:text-7xl">
              Our <br /> Services
            </h2>
          </div>

          <div className="max-w-sm flex-1 pt-4">
            <p className="text-xs font-medium leading-relaxed tracking-wider text-gray-700 uppercase">
              Discover our comprehensive range of architectural and construction services, designed
              to bring your most ambitious visions to life with unparalleled expertise.
            </p>
          </div>

          <div className="flex flex-1 justify-end pt-4">
            <Button variant="outline" href="#contact">
              Contact Us
            </Button>
          </div>
        </div>

        {/* Services List */}
        <div className="flex flex-col border-t border-gray-200">
          {SERVICES_DATA.map((service, index) => (
            <div
              key={service.id}
              className="group flex flex-col items-center gap-12 border-b border-gray-200 py-16 md:flex-row"
            >
              {/* Text Content */}
              <div className="flex flex-1 flex-col items-start gap-8">
                <div className="text-[10px] font-bold text-brand-blue tracking-[0.5em] uppercase">0{index + 1}</div>
                <h3 className="text-brand-blue text-3xl font-bold uppercase tracking-[0.2em] md:text-5xl">
                  {service.title}
                </h3>
                <p className="max-w-md text-sm leading-relaxed tracking-wide text-gray-600">
                  {service.description}
                </p>
                <Button variant="primary" href={`#${service.id}`} className="h-10 min-w-[150px] text-[9px]">
                  Explore Service
                </Button>
              </div>

              {/* Image */}
              <div className="w-full flex-1">
                <div className="cursor-image-trigger relative aspect-[16/9] w-full bg-gray-100 overflow-hidden">
                  <Image
                    src="/images/home-hero.png"
                    alt={service.title}
                    fill
                    className="object-cover grayscale transition-all duration-700 group-hover:scale-110 group-hover:grayscale-0"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

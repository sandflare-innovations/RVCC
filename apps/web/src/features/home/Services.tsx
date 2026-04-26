import Image from "next/image";

import { Button } from "@/components/ui/Button";

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
    <section className="bg-background relative w-full px-8 py-24 md:px-16 lg:px-24">

      <div className="mx-auto max-w-7xl">
        {/* Header Section */}
        <div className="mb-20 flex flex-col items-start justify-between gap-8 md:flex-row md:items-start">
          <div className="flex-1">
            <h2 className="text-brand-blue flex flex-col text-[4rem] leading-[0.6] tracking-tighter md:text-[5.5rem]">
              <span className="font-medium">
                Our <br /> Services
              </span>
            </h2>
          </div>

          <div className="max-w-sm flex-1 pt-4">
            <p className="text-sm leading-relaxed font-medium text-gray-700">
              Discover our comprehensive range of architectural and construction services, designed
              to bring your most ambitious visions to life with unparalleled expertise.
            </p>
          </div>

          <div className="flex flex-1 justify-end pt-4">
            <Button href="#contact" className="bg-brand-blue h-12 w-[180px]">
              Contact Us
            </Button>
          </div>
        </div>

        {/* Services List */}
        <div className="flex flex-col border-t border-gray-200">
          {SERVICES_DATA.map((service, index) => (
            <div
              key={service.id}
              className="flex flex-col items-center gap-12 border-b border-gray-200 py-16 md:flex-row"
            >
              {/* Text Content */}
              <div className="flex flex-1 flex-col items-start gap-6">
                <h3 className="text-brand-blue text-3xl font-medium tracking-tight md:text-6xl">
                  {service.title}
                </h3>
                <p className="max-w-md text-lg leading-relaxed text-gray-600">
                  {service.description}
                </p>
                <Button href={`#${service.id}`} className="bg-brand-blue h-12 w-[160px]">
                  View more
                </Button>
              </div>

              {/* Image */}
              <div className="w-full flex-1">
                <div
                  className="relative aspect-[16/9] w-full overflow-hidden rounded-none bg-gray-100"
                >
                  <Image
                    src="/images/home-hero.png"
                    alt={service.title}
                    fill
                    className="object-cover transition-transform duration-700 hover:scale-105"
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

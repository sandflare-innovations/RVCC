"use client";

import Image from "next/image";
import Link from "next/link";

import { motion } from "framer-motion";
import { FaDroplet, FaTree, FaWater } from "react-icons/fa6";
import {
  HiOutlineArrowPath,
  HiOutlineBeaker,
  HiOutlineBuildingOffice2,
  HiOutlineCpuChip,
  HiOutlineGlobeAlt,
  HiOutlineHome,
  HiOutlinePencilSquare,
  HiOutlineRectangleGroup,
  HiOutlineSparkles,
  HiOutlineSquare3Stack3D,
  HiOutlineSquares2X2,
  HiOutlineTruck,
} from "react-icons/hi2";

const services = [
  {
    id: 1,
    title: "Artificial Grass",
    description:
      "Considering the great advantages in the field of artificial grass, RVCC provides premium synthetic turf solutions for gardens and sports facilities.",
    image: "/images/services/service_artificial_grass_1778184363482.png",
    icon: <HiOutlineSparkles className="h-6 w-6" />,
  },
  {
    id: 2,
    title: "Architectural Service",
    description:
      "We boast of being the number one company in customer choice when it comes to innovative and functional architectural design and planning.",
    image: "/images/services/service_architectural_design_1778183639684.png",
    icon: <HiOutlinePencilSquare className="h-6 w-6" />,
  },
  {
    id: 3,
    title: "Artificial Lakes",
    description:
      "An artificial lake is an area filled with water that is surrounded by land, designed to enhance the aesthetic and ecological value of your property.",
    image: "/images/services/service_artificial_lakes_1778184387832.png",
    icon: <FaWater className="h-6 w-6" />,
  },
  {
    id: 4,
    title: "Cladding Works",
    description:
      "RVCC possess high proficiency in executing special feature work and have proved excellence in premium stone and metal cladding systems.",
    image: "/images/services/service_cladding_works_1778184406035.png",
    icon: <HiOutlineSquares2X2 className="h-6 w-6" />,
  },
  {
    id: 5,
    title: "Fountain Services",
    description:
      "Water is the ultimate medium for the creation of an architectural masterpiece, and our custom fountain designs bring life to any space.",
    image: "/images/services/service_fountain_services_1778184428712.png",
    icon: <FaDroplet className="h-6 w-6" />,
  },
  {
    id: 6,
    title: "Hardscaping Works",
    description:
      "Civil works - Landscape, Hardscape & Utility works. Specialized in delivering high-end projects like LULU MALL'S Riyadh KSA.",
    image: "/images/services/service_hardscaping_works_1778184446410.png",
    icon: <HiOutlineSquare3Stack3D className="h-6 w-6" />,
  },
  {
    id: 7,
    title: "Irrigation & Plantation",
    description:
      "Irrigation is the process of supplying water to the land at regular intervals by means of canals or other artificial methods for healthy plantations.",
    image: "/images/services/service_irrigation_plantation_1778184470138.png",
    icon: <FaTree className="h-6 w-6" />,
  },
  {
    id: 8,
    title: "Land Development",
    description:
      "RVCC landscaping has given life to public and private outdoor spaces by providing comprehensive land development and infrastructure services.",
    image: "/images/services/service_land_development_1778184589851.png",
    icon: <HiOutlineGlobeAlt className="h-6 w-6" />,
  },
  {
    id: 9,
    title: "Landscape Works",
    description:
      "RVCC Landscaping has been giving life to public and private outdoor spaces by creating harmonious green environments tailored to your vision.",
    image: "/images/services/service_landscape_works_main_1778184635856.png",
    icon: <HiOutlineHome className="h-6 w-6" />,
  },
  {
    id: 10,
    title: "Steel Works / Metal Works",
    description:
      "Street Furniture for street & Gardens such as Fencing, Benches, Trash receptacles and custom architectural metal features.",
    image: "/images/services/service_steel_works_metal_1778184492685.png",
    icon: <HiOutlineCpuChip className="h-6 w-6" />,
  },
  {
    id: 11,
    title: "Sand Removal Earth Work",
    description:
      "RVCC is performing professional sand removal services for SAUDI ARAMCO, SCECO and major infrastructure projects.",
    image: "/images/services/service_sand_removal_earthwork_1778184515373.png",
    icon: <HiOutlineTruck className="h-6 w-6" />,
  },
  {
    id: 12,
    title: "Building Projects",
    description:
      "We boast of being the number one company in customer choice when it comes to residential and commercial building construction.",
    image: "/images/services/service_building_projects_1778184550187.png",
    icon: <HiOutlineBuildingOffice2 className="h-6 w-6" />,
  },
];

export const ServicesGrid = () => {
  return (
    <section id="services-grid" className="section-padding bg-background">
      <div className="container">
        <div className="mb-20 flex flex-col items-center text-center">
          <div className="mb-6 flex items-center space-x-3">
            <div className="bg-brand-blue h-1.5 w-1.5" />
            <span className="text-brand-blue text-[10px] font-bold tracking-[0.5em] uppercase">
              SERVICES
            </span>
          </div>
          <h2 className="font-heading max-w-2xl text-4xl leading-[3rem] md:text-5xl lg:text-6xl">
            Seamless property solutions <br />
            tailored for you
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
          {services.map((service, index) => (
            <motion.div
              key={service.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="group border-border hover:border-brand-blue flex flex-col overflow-hidden border bg-white shadow-none transition-all md:flex-row"
              style={{ borderRadius: "0px" }}
            >
              {/* Left Content */}
              <div className="flex flex-1 flex-col justify-between p-10 md:p-12">
                <div>
                  <div
                    className="bg-brand-blue mb-8 flex h-14 w-14 items-center justify-center text-white"
                    style={{ borderRadius: "0px" }}
                  >
                    {service.icon}
                  </div>
                  <h3 className="font-heading mb-4 text-2xl tracking-wide uppercase">
                    {service.title}
                  </h3>
                  <p className="text-muted/80 mb-8 text-sm leading-relaxed">
                    {service.description}
                  </p>
                </div>

                <Link
                  href={`/services/${service.id}`}
                  className="group/link text-brand-blue inline-flex items-center text-[10px] font-bold tracking-[0.4em] uppercase transition-colors"
                >
                  LEARN MORE
                  <div className="bg-brand-blue/20 group-hover/link:bg-brand-blue ml-3 h-[1.5px] w-10 transition-all group-hover/link:w-16" />
                </Link>
              </div>

              {/* Right Image */}
              <div className="relative h-72 w-full md:h-auto md:w-[45%]">
                <Image
                  src={service.image}
                  alt={service.title}
                  fill
                  className="object-cover grayscale-50 transition-all duration-700 group-hover:scale-105 group-hover:grayscale-0"
                />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

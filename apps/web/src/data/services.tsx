import { FaDroplet, FaTree, FaWater } from "react-icons/fa6";
import {
  HiOutlineBuildingOffice2,
  HiOutlineCpuChip,
  HiOutlineGlobeAlt,
  HiOutlineHome,
  HiOutlinePencilSquare,
  HiOutlineSparkles,
  HiOutlineSquare3Stack3D,
  HiOutlineSquares2X2,
  HiOutlineTruck,
} from "react-icons/hi2";

export interface Service {
  id: number;
  title: string;
  description: string;
  image: string;
  icon: React.ReactNode;
}

export const services: Service[] = [
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

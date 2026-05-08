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
  slug: string;
  title: string;
  description: string;
  longDescription: string;
  image: string;
  icon: React.ReactNode;
  features: string[];
  projectIds: string[];
}

export const services: Service[] = [
  {
    id: 1,
    slug: "artificial-grass",
    title: "Artificial Grass",
    description:
      "Premium synthetic turf solutions for gardens and sports facilities with near-accurate match and long-term durability.",
    longDescription:
      "Considering the great advantages in the field of artificial grass, RVCC provides premium synthetic turf solutions. Our artificial grass systems are designed to provide a lush, green appearance year-round without the maintenance requirements of natural grass. We use high-quality materials that are UV-resistant, pet-friendly, and highly durable, making them ideal for residential gardens, commercial spaces, and sports facilities.",
    image: "/images/services/service_artificial_grass_1778184363482.png",
    icon: <HiOutlineSparkles className="h-6 w-6" />,
    features: [
      "UV-Resistant Fibers",
      "Superior Drainage Systems",
      "Pet and Child Friendly",
      "Low Maintenance Requirements",
      "Natural Aesthetic Match",
    ],
    projectIds: ["p4"],
  },
  {
    id: 2,
    slug: "architectural-service",
    title: "Architectural Service",
    description:
      "Innovative and functional architectural design and planning, leading the industry in creative excellence.",
    longDescription:
      "We boast of being the number one company in customer choice when it comes to innovative and functional architectural design and planning. Our team of expert architects and designers work closely with clients to transform their vision into reality. From initial concept sketches to detailed technical drawings, we ensure every project meets the highest standards of aesthetics, functionality, and sustainability.",
    image: "/images/services/service_architectural_design_1778183639684.png",
    icon: <HiOutlinePencilSquare className="h-6 w-6" />,
    features: [
      "Conceptual Design",
      "Technical Planning",
      "Sustainable Architecture",
      "Urban Planning",
      "Interior Design Integration",
    ],
    projectIds: ["p1", "p6"],
  },
  {
    id: 3,
    slug: "artificial-lakes",
    title: "Artificial Lakes",
    description:
      "Custom-designed artificial lakes that enhance the aesthetic and ecological value of your property.",
    longDescription:
      "An artificial lake is an area filled with water that is surrounded by land, designed to enhance the aesthetic and ecological value of your property. RVCC specializes in the design and construction of artificial lakes that serve as focal points for large-scale landscaping projects. We focus on creating balanced ecosystems that are both beautiful and sustainable, incorporating advanced filtration and circulation systems.",
    image: "/images/services/service_artificial_lakes_1778184387832.png",
    icon: <FaWater className="h-6 w-6" />,
    features: [
      "Ecological Design",
      "Advanced Filtration Systems",
      "Liner Installation",
      "Water Feature Integration",
      "Aquatic Planting",
    ],
    projectIds: ["p4"],
  },
  {
    id: 4,
    slug: "cladding-works",
    title: "Cladding Works",
    description:
      "Excellence in premium stone and metal cladding systems, providing durable and aesthetically pleasing building envelopes.",
    longDescription:
      "RVCC possess high proficiency in executing special feature work and have proved excellence in premium stone and metal cladding systems. Our cladding solutions are designed to protect buildings from the elements while providing a sophisticated and modern appearance. We work with a variety of materials, including natural stone, aluminum, and composite panels, to create unique and durable building envelopes.",
    image: "/images/services/service_cladding_works_1778184406035.png",
    icon: <HiOutlineSquares2X2 className="h-6 w-6" />,
    features: [
      "Stone Cladding",
      "Metal Panel Systems",
      "Thermal Insulation",
      "Weatherproofing",
      "Custom Fabrication",
    ],
    projectIds: ["p1", "p2"],
  },
  {
    id: 5,
    slug: "fountain-services",
    title: "Fountain Services",
    description:
      "Custom fountain designs that use water as the ultimate medium for architectural masterpieces.",
    longDescription:
      "Water is the ultimate medium for the creation of an architectural masterpiece, and our custom fountain designs bring life to any space. RVCC offers comprehensive fountain services, from initial design and engineering to installation and maintenance. Whether it's a dramatic musical fountain or a subtle reflecting pool, we create water features that inspire and delight.",
    image: "/images/services/service_fountain_services_1778184428712.png",
    icon: <FaDroplet className="h-6 w-6" />,
    features: [
      "Interactive Water Features",
      "Musical Fountains",
      "Reflecting Pools",
      "Lighting Integration",
      "Precision Engineering",
    ],
    projectIds: ["p4"],
  },
  {
    id: 6,
    slug: "hardscaping-works",
    title: "Hardscaping Works",
    description:
      "Specialized civil, landscape, and utility works for high-end commercial and public projects.",
    longDescription:
      "Civil works - Landscape, Hardscape & Utility works. Specialized in delivering high-end projects like LULU MALL'S Riyadh KSA. Our hardscaping services include the construction of walkways, plazas, retaining walls, and other permanent structural elements. We use premium materials and precise construction techniques to ensure that our hardscapes are both functional and visually stunning.",
    image: "/images/services/service_hardscaping_works_1778184446410.png",
    icon: <HiOutlineSquare3Stack3D className="h-6 w-6" />,
    features: [
      "Paving and Walkways",
      "Retaining Walls",
      "Plaza Construction",
      "Utility Infrastructure",
      "Material Selection",
    ],
    projectIds: ["p2", "p5"],
  },
  {
    id: 7,
    slug: "irrigation-plantation",
    title: "Irrigation & Plantation",
    description:
      "Smart irrigation systems and expert plantation services for healthy and vibrant green spaces.",
    longDescription:
      "Irrigation is the process of supplying water to the land at regular intervals by means of canals or other artificial methods for healthy plantations. RVCC provides state-of-the-art irrigation solutions that maximize water efficiency while ensuring the health of your landscape. Our plantation services include the selection and installation of a wide variety of plants, trees, and shrubs tailored to the local environment.",
    image: "/images/services/service_irrigation_plantation_1778184470138.png",
    icon: <FaTree className="h-6 w-6" />,
    features: [
      "Smart Control Systems",
      "Drip Irrigation",
      "Soil Analysis",
      "Native Plant Selection",
      "Tree Transplantation",
    ],
    projectIds: ["p4"],
  },
  {
    id: 8,
    slug: "land-development",
    title: "Land Development",
    description:
      "Comprehensive infrastructure and land development services for public and private outdoor spaces.",
    longDescription:
      "RVCC landscaping has given life to public and private outdoor spaces by providing comprehensive land development and infrastructure services. We handle everything from site clearing and grading to the installation of roads, utilities, and drainage systems. Our holistic approach to land development ensures that the foundation for any project is solid and well-planned.",
    image: "/images/services/service_land_development_1778184589851.png",
    icon: <HiOutlineGlobeAlt className="h-6 w-6" />,
    features: [
      "Site Grading",
      "Infrastructure Planning",
      "Road Construction",
      "Drainage Solutions",
      "Land Surveying",
    ],
    projectIds: ["p5"],
  },
  {
    id: 9,
    slug: "landscape-works",
    title: "Landscape Works",
    description:
      "Creating harmonious green environments tailored to your vision for public and private outdoor spaces.",
    longDescription:
      "RVCC Landscaping has been giving life to public and private outdoor spaces by creating harmonious green environments tailored to your vision. We combine artistic design with horticultural expertise to create outdoor spaces that are not only beautiful but also sustainable. From private gardens to large-scale public parks, we bring a unique perspective to every landscape project.",
    image: "/images/services/service_landscape_works_main_1778184635856.png",
    icon: <HiOutlineHome className="h-6 w-6" />,
    features: [
      "Landscape Architecture",
      "Softscape Installation",
      "Garden Maintenance",
      "Sustainable Design",
      "Outdoor Lighting",
    ],
    projectIds: ["p4", "p6"],
  },
  {
    id: 10,
    slug: "steel-metal-works",
    title: "Steel Works / Metal Works",
    description:
      "Custom architectural metal features and street furniture designed for durability and aesthetic impact.",
    longDescription:
      "Street Furniture for street & Gardens such as Fencing, Benches, Trash receptacles and custom architectural metal features. RVCC provides high-quality steel and metal works that are both functional and decorative. Our custom fabrication capabilities allow us to create unique pieces that complement the overall design of a project while standing up to the rigors of the environment.",
    image: "/images/services/service_steel_works_metal_1778184492685.png",
    icon: <HiOutlineCpuChip className="h-6 w-6" />,
    features: [
      "Custom Fabrication",
      "Fencing Systems",
      "Street Furniture",
      "Ornamental Metalwork",
      "Durable Coatings",
    ],
    projectIds: ["p1", "p3"],
  },
  {
    id: 11,
    slug: "sand-removal-earthwork",
    title: "Sand Removal Earth Work",
    description:
      "Professional sand removal and earthwork services for major industrial and infrastructure projects.",
    longDescription:
      "RVCC is performing professional sand removal services for SAUDI ARAMCO, SCECO and major infrastructure projects. Our earthwork capabilities include large-scale excavation, trenching, and site preparation in challenging desert environments. We utilize specialized equipment and experienced operators to ensure that every project is completed safely and efficiently.",
    image: "/images/services/service_sand_removal_earthwork_1778184515373.png",
    icon: <HiOutlineTruck className="h-6 w-6" />,
    features: [
      "Specialized Sand Removal",
      "Large-scale Excavation",
      "Trenching",
      "Site Leveling",
      "Heavy Equipment Operation",
    ],
    projectIds: ["p5"],
  },
  {
    id: 12,
    slug: "building-projects",
    title: "Building Projects",
    description:
      "Excellence in residential and commercial building construction, delivering high-quality architectural results.",
    longDescription:
      "We boast of being the number one company in customer choice when it comes to residential and commercial building construction. RVCC manages every aspect of the building process, from pre-construction planning to final handover. Our commitment to quality and attention to detail ensures that every building we construct is a testament to our craftsmanship and professionalism.",
    image: "/images/services/service_building_projects_1778184550187.png",
    icon: <HiOutlineBuildingOffice2 className="h-6 w-6" />,
    features: [
      "Residential Construction",
      "Commercial Building",
      "Project Management",
      "Quality Assurance",
      "Turnkey Solutions",
    ],
    projectIds: ["p1", "p2", "p3", "p6"],
  },
];

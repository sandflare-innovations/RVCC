import { PrismaClient } from "@prisma/client";
import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";

// Load environment variables from apps/api/.env manually
const envPath = path.resolve(__dirname, "../.env");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx > 0) {
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim();
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  }
}

const prisma = new PrismaClient();

const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || "rvcc-public-assets";
const R2_PUBLIC_URL = (
  process.env.R2_PUBLIC_URL || "https://pub-70b8c21f306842d3bbeab4d1d19319e1.r2.dev"
).replace(/\/$/, "");

/**
 * Uploads a file directly to Cloudflare R2 using wrangler CLI with remote credentials
 */
function uploadToCloudflareR2(key: string, localFilePath: string, contentType = "image/webp"): string {
  const apiDir = path.resolve(__dirname, "..");
  const escapedFile = `"${localFilePath}"`;
  const cmd = `npx wrangler r2 object put "${R2_BUCKET_NAME}/${key}" --file ${escapedFile} --content-type ${contentType} --remote`;

  try {
    execSync(cmd, { cwd: apiDir, stdio: "pipe" });
    return `${R2_PUBLIC_URL}/${key}`;
  } catch (err: any) {
    console.error(`Error uploading ${key}:`, err?.stderr?.toString() || err?.message);
    throw err;
  }
}

interface ServiceSeedItem {
  id: number;
  slug: string;
  title: string;
  description: string;
  longDescription: string;
  imageFileName: string;
  iconName: string;
  features: string[];
}

const SERVICES_SEED: ServiceSeedItem[] = [
  {
    id: 1,
    slug: "artificial-grass",
    title: "Artificial Grass",
    description:
      "Premium synthetic turf solutions for gardens and sports facilities with near-accurate match and long-term durability.",
    longDescription:
      "Considering the great advantages in the field of artificial grass, RVCC provides premium synthetic turf solutions. Our artificial grass systems are designed to provide a lush, green appearance year-round without the maintenance requirements of natural grass. We use high-quality materials that are UV-resistant, pet-friendly, and highly durable, making them ideal for residential gardens, commercial spaces, and sports facilities.",
    imageFileName: "service_artificial_grass_1778184363482.webp",
    iconName: "HiOutlineSparkles",
    features: [
      "UV-Resistant Fibers",
      "Superior Drainage Systems",
      "Pet and Child Friendly",
      "Low Maintenance Requirements",
      "Natural Aesthetic Match",
    ],
  },
  {
    id: 2,
    slug: "architectural-service",
    title: "Architectural Service",
    description:
      "Innovative and functional architectural design and planning, leading the industry in creative excellence.",
    longDescription:
      "We boast of being the number one company in customer choice when it comes to innovative and functional architectural design and planning. Our team of expert architects and designers work closely with clients to transform their vision into reality. From initial concept sketches to detailed technical drawings, we ensure every project meets the highest standards of aesthetics, functionality, and sustainability.",
    imageFileName: "service_architectural_design_1778183639684.webp",
    iconName: "HiOutlinePencilSquare",
    features: [
      "Conceptual Design",
      "Technical Planning",
      "Sustainable Architecture",
      "Urban Planning",
      "Interior Design Integration",
    ],
  },
  {
    id: 3,
    slug: "artificial-lakes",
    title: "Artificial Lakes",
    description:
      "Custom-designed artificial lakes that enhance the aesthetic and ecological value of your property.",
    longDescription:
      "An artificial lake is an area filled with water that is surrounded by land, designed to enhance the aesthetic and ecological value of your property. RVCC specializes in the design and construction of artificial lakes that serve as focal points for large-scale landscaping projects. We focus on creating balanced ecosystems that are both beautiful and sustainable, incorporating advanced filtration and circulation systems.",
    imageFileName: "service_artificial_lakes_1778184387832.webp",
    iconName: "FaWater",
    features: [
      "Ecological Design",
      "Advanced Filtration Systems",
      "Liner Installation",
      "Water Feature Integration",
      "Aquatic Planting",
    ],
  },
  {
    id: 4,
    slug: "cladding-works",
    title: "Cladding Works",
    description:
      "Excellence in premium stone and metal cladding systems, providing durable and aesthetically pleasing building envelopes.",
    longDescription:
      "RVCC possess high proficiency in executing special feature work and have proved excellence in premium stone and metal cladding systems. Our cladding solutions are designed to protect buildings from the elements while providing a sophisticated and modern appearance. We work with a variety of materials, including natural stone, aluminum, and composite panels, to create unique and durable building envelopes.",
    imageFileName: "service_cladding_works_1778184406035.webp",
    iconName: "HiOutlineSquares2X2",
    features: [
      "Stone Cladding",
      "Metal Panel Systems",
      "Thermal Insulation",
      "Weatherproofing",
      "Custom Fabrication",
    ],
  },
  {
    id: 5,
    slug: "fountain-services",
    title: "Fountain Services",
    description:
      "Custom fountain designs that use water as the ultimate medium for architectural masterpieces.",
    longDescription:
      "Water is the ultimate medium for the creation of an architectural masterpiece, and our custom fountain designs bring life to any space. RVCC offers comprehensive fountain services, from initial design and engineering to installation and maintenance. Whether it's a dramatic musical fountain or a subtle reflecting pool, we create water features that inspire and delight.",
    imageFileName: "service_fountain_services_1778184428712.webp",
    iconName: "FaDroplet",
    features: [
      "Interactive Water Features",
      "Musical Fountains",
      "Reflecting Pools",
      "Lighting Integration",
      "Precision Engineering",
    ],
  },
  {
    id: 6,
    slug: "hardscaping-works",
    title: "Hardscaping Works",
    description:
      "Specialized civil, landscape, and utility works for high-end commercial and public projects.",
    longDescription:
      "Civil works - Landscape, Hardscape & Utility works. Specialized in delivering high-end projects like LULU MALL'S Riyadh KSA. Our hardscaping services include the construction of walkways, plazas, retaining walls, and other permanent structural elements. We use premium materials and precise construction techniques to ensure that our hardscapes are both functional and visually stunning.",
    imageFileName: "service_hardscaping_works_1778184446410.webp",
    iconName: "HiOutlineSquare3Stack3D",
    features: [
      "Paving and Walkways",
      "Retaining Walls",
      "Plaza Construction",
      "Utility Infrastructure",
      "Material Selection",
    ],
  },
  {
    id: 7,
    slug: "irrigation-plantation",
    title: "Irrigation & Plantation",
    description:
      "Smart irrigation systems and expert plantation services for healthy and vibrant green spaces.",
    longDescription:
      "Irrigation is the process of supplying water to the land at regular intervals by means of canals or other artificial methods for healthy plantations. RVCC provides state-of-the-art irrigation solutions that maximize water efficiency while ensuring the health of your landscape. Our plantation services include the selection and installation of a wide variety of plants, trees, and shrubs tailored to the local environment.",
    imageFileName: "service_irrigation_plantation_1778184470138.webp",
    iconName: "FaTree",
    features: [
      "Smart Control Systems",
      "Drip Irrigation",
      "Soil Analysis",
      "Native Plant Selection",
      "Tree Transplantation",
    ],
  },
  {
    id: 8,
    slug: "land-development",
    title: "Land Development",
    description:
      "Comprehensive infrastructure and land development services for public and private outdoor spaces.",
    longDescription:
      "RVCC landscaping has given life to public and private outdoor spaces by providing comprehensive land development and infrastructure services. We handle everything from site clearing and grading to the installation of roads, utilities, and drainage systems. Our holistic approach to land development ensures that the foundation for any project is solid and well-planned.",
    imageFileName: "service_land_development_1778184589851.webp",
    iconName: "HiOutlineGlobeAlt",
    features: [
      "Site Grading",
      "Infrastructure Planning",
      "Road Construction",
      "Drainage Solutions",
      "Land Surveying",
    ],
  },
  {
    id: 9,
    slug: "landscape-works",
    title: "Landscape Works",
    description:
      "Creating harmonious green environments tailored to your vision for public and private outdoor spaces.",
    longDescription:
      "RVCC Landscaping has been giving life to public and private outdoor spaces by creating harmonious green environments tailored to your vision. We combine artistic design with horticultural expertise to create outdoor spaces that are not only beautiful but also sustainable. From private gardens to large-scale public parks, we bring a unique perspective to every landscape project.",
    imageFileName: "service_landscape_works_main_1778184635856.webp",
    iconName: "HiOutlineHome",
    features: [
      "Landscape Architecture",
      "Softscape Installation",
      "Garden Maintenance",
      "Sustainable Design",
      "Outdoor Lighting",
    ],
  },
  {
    id: 10,
    slug: "steel-metal-works",
    title: "Steel Works / Metal Works",
    description:
      "Custom architectural metal features and street furniture designed for durability and aesthetic impact.",
    longDescription:
      "Street Furniture for street & Gardens such as Fencing, Benches, Trash receptacles and custom architectural metal features. RVCC provides high-quality steel and metal works that are both functional and decorative. Our custom fabrication capabilities allow us to create unique pieces that complement the overall design of a project while standing up to the rigors of the environment.",
    imageFileName: "service_steel_works_metal_1778184492685.webp",
    iconName: "HiOutlineCpuChip",
    features: [
      "Custom Fabrication",
      "Fencing Systems",
      "Street Furniture",
      "Ornamental Metalwork",
      "Durable Coatings",
    ],
  },
  {
    id: 11,
    slug: "sand-removal-earthwork",
    title: "Sand Removal Earth Work",
    description:
      "Professional sand removal and earthwork services for major industrial and infrastructure projects.",
    longDescription:
      "RVCC is performing professional sand removal services for SAUDI ARAMCO, SCECO and major infrastructure projects. Our earthwork capabilities include large-scale excavation, trenching, and site preparation in challenging desert environments. We utilize specialized equipment and experienced operators to ensure that every project is completed safely and efficiently.",
    imageFileName: "service_sand_removal_earthwork_1778184515373.webp",
    iconName: "HiOutlineTruck",
    features: [
      "Specialized Sand Removal",
      "Large-scale Excavation",
      "Trenching",
      "Site Leveling",
      "Heavy Equipment Operation",
    ],
  },
  {
    id: 12,
    slug: "building-projects",
    title: "Building Projects",
    description:
      "Excellence in residential and commercial building construction, delivering high-quality architectural results.",
    longDescription:
      "We boast of being the number one company in customer choice when it comes to residential and commercial building construction. RVCC manages every aspect of the building process, from pre-construction planning to final handover. Our commitment to quality and attention to detail ensures that every building we construct is a testament to our craftsmanship and professionalism.",
    imageFileName: "service_building_projects_1778184550187.webp",
    iconName: "HiOutlineBuildingOffice2",
    features: [
      "Residential Construction",
      "Commercial Building",
      "Project Management",
      "Quality Assurance",
      "Turnkey Solutions",
    ],
  },
];

async function seedServices() {
  console.log("=== SEEDING DYNAMIC SERVICES TO CLOUDFLARE R2 & DATABASE ===");

  const webPublicImagesDir = path.resolve(__dirname, "../../web/public/images/services");

  for (let i = 0; i < SERVICES_SEED.length; i++) {
    const s = SERVICES_SEED[i];
    const localImgPath = path.join(webPublicImagesDir, s.imageFileName);

    let remoteImageUrl = `/images/services/${s.imageFileName}`;

    if (fs.existsSync(localImgPath)) {
      const r2Key = `services/${s.slug}/cover.webp`;
      console.log(`[R2] Uploading ${s.slug} -> ${r2Key}...`);
      try {
        remoteImageUrl = uploadToCloudflareR2(r2Key, localImgPath, "image/webp");
        console.log(`  Uploaded to ${remoteImageUrl}`);
      } catch (uploadErr) {
        console.warn(`  Warning: R2 upload failed for ${s.slug}, using fallback path.`);
      }
    } else {
      console.warn(`Local image file not found for ${s.slug}: ${localImgPath}`);
    }

    const upserted = await prisma.service.upsert({
      where: { slug: s.slug },
      create: {
        slug: s.slug,
        title: s.title,
        description: s.description,
        longDescription: s.longDescription,
        image: remoteImageUrl,
        iconName: s.iconName,
        features: s.features,
        sortOrder: i + 1,
        isActive: true,
      },
      update: {
        title: s.title,
        description: s.description,
        longDescription: s.longDescription,
        image: remoteImageUrl,
        iconName: s.iconName,
        features: s.features,
        sortOrder: i + 1,
        isActive: true,
        deletedAt: null,
      },
    });

    console.log(`[DB] Upserted service: ${upserted.title} (${upserted.slug}) -> ID: ${upserted.id}`);
  }

  const total = await prisma.service.count();
  console.log(`\n=== SEED COMPLETE! Total active services in database: ${total} ===\n`);
}

seedServices()
  .catch((e) => {
    console.error("Seed failed with error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

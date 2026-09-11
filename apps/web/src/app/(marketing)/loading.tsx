import { ClientLogosSkeleton } from "@/components/common/ClientLogos";
import { SisterCompaniesSkeleton } from "@/sections/home/CSRSection";
import { HeroSkeleton } from "@/sections/home/Hero";
import { MajorProjectSkeleton } from "@/sections/home/MajorProject";
import { RecentProjectsSkeleton } from "@/sections/home/Projects";
import { ServicesSkeleton } from "@/sections/home/Services";

export default function MarketingLoading() {
  return (
    <div className="relative min-h-screen bg-background">
      {/* 1. Hero Skeleton */}
      <div className="h-screen w-full">
        <HeroSkeleton />
      </div>

      {/* 2. Client Logos Skeleton */}
      <div className="border-b border-zinc-100 py-12 bg-white">
        <ClientLogosSkeleton />
      </div>

      {/* 3. Services Monolithic Skeleton Canvas */}
      <ServicesSkeleton />

      {/* 4. Major Projects Skeleton */}
      <MajorProjectSkeleton />

      {/* 5. Recent Projects Card Grid Skeleton */}
      <RecentProjectsSkeleton />

      {/* 6. Sister Concerns Ticker & Card Skeleton */}
      <div className="container mx-auto py-20 px-6">
        <div className="h-4 w-32 rounded-full bg-gradient-to-r from-brand-blue/20 to-brand-blue/10 animate-pulse mb-4" />
        <div className="h-16 w-80 bg-gradient-to-r from-brand-blue/20 via-brand-blue/10 to-brand-blue/15 animate-pulse mb-8" />
        <SisterCompaniesSkeleton />
      </div>
    </div>
  );
}

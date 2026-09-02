import { HeroSlideEditor } from "@/sections/hero/HeroSlideEditor";

export default function NewHeroSlidePage() {
  return (
    <div className="relative flex h-full min-h-0 w-full flex-col">
      <div className="flex-1 overflow-y-auto pb-12">
        <HeroSlideEditor initial={{}} />
      </div>
    </div>
  );
}

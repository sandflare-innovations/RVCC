import { DEPARTMENTS, EMPLOYMENT_TYPES } from "@/lib/careers";
import { CareerEditor } from "@/sections/careers/CareerEditor";

export default function NewCareerPage() {
  return (
    <div className="relative flex h-full min-h-0 w-full flex-col overflow-x-hidden">
      <div className="flex-1 overflow-y-auto overflow-x-hidden pb-12">
        <CareerEditor
          departments={DEPARTMENTS}
          employmentTypes={EMPLOYMENT_TYPES}
          initial={{
            id: null,
            title: "",
            slug: "",
            department: "",
            location: "Riyadh, Saudi Arabia",
            employmentType: "Full-time",
            description: "",
            requirements: "",
            benefits: "",
            isRemote: false,
            isPublished: true,
          }}
        />
      </div>
    </div>
  );
}

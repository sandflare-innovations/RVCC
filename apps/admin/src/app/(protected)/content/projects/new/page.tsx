import { ProjectEditor } from "@/sections/projects/ProjectEditor";

export default function NewProjectPage() {
  return (
    <div className="relative flex h-full min-h-0 w-full flex-col">
      <div className="flex-1 overflow-y-auto pb-12">
        <ProjectEditor initial={{}} />
      </div>
    </div>
  );
}

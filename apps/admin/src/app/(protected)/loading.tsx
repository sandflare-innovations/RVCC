import { PageLoader } from "@/components/ui";

export default function AdminSectionLoading() {
  return (
    <div className="flex h-full min-h-[50vh] w-full items-center justify-center">
      <PageLoader text="Loading…" />
    </div>
  );
}

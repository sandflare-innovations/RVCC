import { PageLoader } from "@/components/ui";

export default function AdminDashboardLoading() {
  return (
    <div className="flex h-full min-h-[60vh] w-full items-center justify-center">
      <PageLoader text="Loading Dashboard..." />
    </div>
  );
}

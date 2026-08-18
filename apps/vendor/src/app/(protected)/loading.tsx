import { PageLoader } from "@/components/ui";

export default function ProtectedLoading() {
  return (
    <div className="flex h-[50vh] w-full items-center justify-center">
      <PageLoader />
    </div>
  );
}

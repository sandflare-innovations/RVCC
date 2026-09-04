import { FileManager } from "@/sections/files/FileManager";

export const dynamic = "force-dynamic";

export default function ContentDocumentsPage() {
  return (
    <div className="relative flex h-full min-h-0 w-full flex-col overflow-x-hidden">
      <div className="flex-1 overflow-y-auto overflow-x-hidden pb-12">
        <FileManager />
      </div>
    </div>
  );
}

import { EnquireProvider } from "@/sections/enquire/EnquireContext";

export default function EnquireLayout({ children }: { children: React.ReactNode }) {
  return <EnquireProvider>{children}</EnquireProvider>;
}

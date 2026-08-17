import { redirect } from "next/navigation";

/** Old notification links pointed at /requirements — portal lives under /portal now. */
export default function LegacyRequirementsIndex() {
  redirect("/portal/requirements");
}

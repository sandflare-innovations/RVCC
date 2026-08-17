import { redirect } from "next/navigation";

/** Legacy /enquire bookmarks → registration on this same app. */
export default function EnquireLegacyIndex() {
  redirect("/register/verify");
}

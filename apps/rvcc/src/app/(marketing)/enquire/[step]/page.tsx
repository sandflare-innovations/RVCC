import { redirect } from "next/navigation";

type Props = { params: Promise<{ step: string }> };

/** Legacy /enquire/:step bookmarks → registration on this same app. */
export default async function EnquireLegacyStep({ params }: Props) {
  const { step } = await params;
  redirect(`/register/${step || "verify"}`);
}

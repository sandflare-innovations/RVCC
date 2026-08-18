import { redirect } from "next/navigation";

type Props = { params: Promise<{ id: string }> };

export default async function LegacyRequirementDetail({ params }: Props) {
  const { id } = await params;
  redirect(`/portal/requirements/${id}`);
}

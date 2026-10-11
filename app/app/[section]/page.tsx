import { redirect } from "next/navigation";
import { AppPage } from "@/components/app/app-pages";

export default async function AppSection({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  if (section === "workspace") redirect("/app/capabilities?tab=workspace");
  return <AppPage section={section} />;
}

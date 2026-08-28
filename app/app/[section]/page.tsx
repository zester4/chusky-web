import { AppPage } from "@/components/app/app-pages";

export default async function AppSection({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  return <AppPage section={section} />;
}

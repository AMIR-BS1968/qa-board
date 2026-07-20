import { DashboardContainer } from "@/features/dashboard/components/DashboardContainer";
import { checkProjectAccess } from "@/lib/projectAuth";
import { redirect } from "next/navigation";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function ProjectDashboardPage({ params }: PageProps) {
  const { slug } = await params;
  const { project, member } = await checkProjectAccess(slug);

  if (!project.finalized) {
    redirect(`/p/${slug}/setup`);
  }

  return <DashboardContainer slug={slug} />;
}

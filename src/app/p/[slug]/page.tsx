import { DashboardContainer } from "@/features/dashboard/components/DashboardContainer";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function ProjectDashboardPage({ params }: PageProps) {
  const { slug } = await params;

  // Validate that the project slug exists in the database
  const project = await prisma.project.findUnique({
    where: { slug },
  });

  if (!project) {
    notFound();
  }

  if (!(project as any).finalized) {
    redirect(`/p/${slug}/setup`);
  }

  return <DashboardContainer slug={slug} />;
}

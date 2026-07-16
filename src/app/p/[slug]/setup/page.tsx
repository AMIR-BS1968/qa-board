import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { getSpreadsheetTabNames } from "@/features/dashboard/api/sheets";
import { SetupClient } from "./SetupClient";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function ProjectSetupPage({ params }: PageProps) {
  const session = await auth();
  if (!session || !session.user || !session.user.id) {
    redirect("/login");
  }

  const { slug } = await params;

  // Retrieve project along with sheet configuration
  const project = await prisma.project.findUnique({
    where: { slug },
    include: {
      sheetConfigs: true,
    },
  });

  if (!project) {
    notFound();
  }

  // Ensure user owns project
  if (project.ownerId !== session.user.id) {
    redirect(`/p/${slug}?error=Unauthorized`);
  }

  // If already finalized, redirect to dashboard
  if (project.finalized) {
    redirect(`/p/${slug}`);
  }

  const sheetConfig = project.sheetConfigs[0];
  if (!sheetConfig) {
    notFound();
  }

  return (
    <SetupClient
      project={{
        id: project.id,
        name: project.name,
        slug: project.slug,
        sheetUrl: sheetConfig.sheetUrl,
      }}
    />
  );
}

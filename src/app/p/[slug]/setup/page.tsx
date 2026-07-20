import { checkProjectAccess } from "@/lib/projectAuth";
import { notFound, redirect } from "next/navigation";
import { getSpreadsheetTabNames } from "@/features/dashboard/api/sheets";
import { SetupClient } from "./SetupClient";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function ProjectSetupPage({ params }: PageProps) {
  const { slug } = await params;
  const { project, member } = await checkProjectAccess(slug);

  // Ensure user owns project
  if (!member.roles.includes("OWNER")) {
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

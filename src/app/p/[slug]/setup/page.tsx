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

  let tabs: string[] = [];
  let errorMsg: string | null = null;
  let autoHeaderRow = 9;
  let autoDataStartRow = 10;

  try {
    tabs = await getSpreadsheetTabNames(project.id, project.ownerId, sheetConfig.sheetUrl);
    const initialSelected = tabs.filter((t) => !/settings|validation|rules|config/i.test(t));
    const targetTab = initialSelected[0] || tabs[0];
    if (targetTab) {
      const { detectHeaderRow } = await import("@/features/dashboard/api/sheets");
      const detection = await detectHeaderRow(project.id, project.ownerId, sheetConfig.sheetUrl, targetTab);
      if (detection) {
        autoHeaderRow = detection.headerRow;
        autoDataStartRow = detection.dataStartRow;
      }
    }
  } catch (err: any) {
    console.error("Failed to load sheet tab names:", err);
    errorMsg = err.message || "Failed to load sheet tab names. Please verify Google Sheet permissions and verify that the sheet is shared with the service account.";
  }

  return (
    <SetupClient
      project={{
        id: project.id,
        name: project.name,
        slug: project.slug,
        sheetUrl: sheetConfig.sheetUrl,
      }}
      tabs={tabs}
      fetchError={errorMsg}
      initialHeaderRow={autoHeaderRow}
      initialDataStartRow={autoDataStartRow}
    />
  );
}

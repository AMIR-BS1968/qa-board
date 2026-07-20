import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { SettingsClient } from "./SettingsClient";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function ProjectSettingsPage({ params }: PageProps) {
  const session = await auth();
  if (!session || !session.user || !session.user.id) {
    redirect("/login");
  }

  const { slug } = await params;

  // Retrieve project along with all configs
  const project = await prisma.project.findUnique({
    where: { slug },
    include: {
      sheetConfigs: true,
      columnMappings: true,
      statusConfigs: {
        orderBy: { sortOrder: "asc" },
      },
      metricVisibilities: true,
      members: {
        where: {
          userId: session.user.id,
        },
      },
    },
  });

  if (!project) {
    notFound();
  }

  // Authorize User: check if member has OWNER or MANAGER roles
  const member = project.members[0];
  const hasAccess = member && (member.roles.includes("OWNER") || member.roles.includes("MANAGER"));
  if (!hasAccess) {
    // Return unauthorized view or redirect to project dashboard
    redirect(`/p/${slug}?error=Unauthorized`);
  }

  // Typecast StatusConfigs to expected format
  const formattedProject = {
    ...project,
    statusConfigs: project.statusConfigs.map((s: any) => ({
      ...s,
      category: s.category as "open" | "closed" | "fixed" | "qa" | "other",
    })),
  };

  return <SettingsClient project={formattedProject} />;
}

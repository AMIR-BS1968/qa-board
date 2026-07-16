"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { syncProjectColumnsAndStatuses } from "@/features/dashboard/api/sheets";

export async function createProject(formData: FormData) {
  const session = await auth();
  if (!session || !session.user || !session.user.id) {
    throw new Error("Unauthorized");
  }

  const userId = session.user.id;
  const name = formData.get("name") as string;
  let slug = formData.get("slug") as string;
  const sheetUrl = formData.get("sheetUrl") as string;

  if (!name || !sheetUrl) {
    return { error: "Name and Sheet URL are required." };
  }

  // Generate slug if not provided
  if (!slug) {
    slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");
  } else {
    slug = slug
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");
  }

  // Extract sheetId
  const match = sheetUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (!match || !match[1]) {
    return { error: "Invalid Google Sheet URL. Could not parse Spreadsheet ID." };
  }
  const sheetId = match[1];

  try {
    // Check if slug is unique
    const existing = await prisma.project.findUnique({
      where: { slug },
    });
    if (existing) {
      return { error: `Project slug "${slug}" is already in use. Please choose another name.` };
    }

    // Default configuration definitions
    const columnDefinitions = [
      { fieldKey: "module", columnIndex: 0 },
      { fieldKey: "feature", columnIndex: 1 },
      { fieldKey: "issueTitle", columnIndex: 2 },
      { fieldKey: "issueDescription", columnIndex: 3 },
      { fieldKey: "stepsToReproduce", columnIndex: 4 },
      { fieldKey: "resources", columnIndex: 5 },
      { fieldKey: "issueStatus", columnIndex: 6 },
      { fieldKey: "reportedBy", columnIndex: 7 },
      { fieldKey: "devComments", columnIndex: 8 },
      { fieldKey: "estimation", columnIndex: 9 },
      { fieldKey: "spentTime", columnIndex: 10 },
      { fieldKey: "assignedDate", columnIndex: 11 },
      { fieldKey: "assignee", columnIndex: 12 },
      { fieldKey: "resolutionDate", columnIndex: 13 },
      { fieldKey: "qaComments", columnIndex: 14 },
    ];

    const statusDefinitions = [
      { statusValue: "TODO", displayLabel: "TODO", color: "#64748b", category: "open" as const },
      { statusValue: "IN PROGRESS", displayLabel: "IN PROGRESS", color: "#0ea5e9", category: "open" as const },
      { statusValue: "NOT RESOLVED", displayLabel: "NOT RESOLVED", color: "#f43f5e", category: "open" as const },
      { statusValue: "IN QA", displayLabel: "IN QA", color: "#f59e0b", category: "qa" as const },
      { statusValue: "FIXED", displayLabel: "FIXED", color: "#a855f7", category: "fixed" as const },
      { statusValue: "RESOLVED", displayLabel: "RESOLVED", color: "#10b981", category: "closed" as const },
      { statusValue: "NOT NEEDED", displayLabel: "NOT NEEDED", color: "#3c010bff", category: "other" as const },
    ];

    const metricDefinitions = [
      "todayFound",
      "todayResolved",
      "openIssues",
      "inQa",
      "fixedDeployed",
      "resolvedIssues",
      "workloadEstimation",
      "todayWorkload",
      "issuesByStatus",
      "openIssuesByAssignee",
      "assigneeStatusTable",
      "issuesByModule",
      "issuesReportedBy",
      "issueTable",
      "kanbanBoard",
    ];

    // Build project with transaction
    await prisma.$transaction(async (tx: any) => {
      const project = await tx.project.create({
        data: {
          name,
          slug,
          ownerId: userId,
          members: {
            create: {
              userId,
              role: "OWNER",
            },
          },
          sheetConfigs: {
            create: {
              sheetUrl,
              sheetId,
              selectedTabs: ["Admin", "App"],
              headerRow: 9,
              dataStartRow: 10,
            },
          },
        },
      });

      // Insert columns for both default tabs
      const colData = [];
      for (const tab of ["Admin", "App"]) {
        for (const col of columnDefinitions) {
          colData.push({
            projectId: project.id,
            tabName: tab,
            fieldKey: col.fieldKey,
            columnIndex: col.columnIndex,
          });
        }
      }
      await tx.columnMapping.createMany({ data: colData });

      // Insert status configurations
      const statusData = statusDefinitions.map((s) => ({
        projectId: project.id,
        statusValue: s.statusValue,
        displayLabel: s.displayLabel,
        color: s.color,
        category: s.category,
      }));
      await tx.statusConfig.createMany({ data: statusData });

      // Insert metric visibilities
      const metricData = metricDefinitions.map((m) => ({
        projectId: project.id,
        metricKey: m,
        enabled: true,
      }));
      await tx.metricVisibility.createMany({ data: metricData });
    });

    revalidatePath("/projects");
    return { success: true, slug };
  } catch (error: any) {
    console.error("Failed to create project Server Action:", error);
    return { error: error.message || "Something went wrong." };
  }
}

export async function finalizeProjectSetup(
  projectId: string,
  data: {
    selectedTabs: string[];
    validationTabName: string | null;
    headerRow: number;
    dataStartRow: number;
  }
) {
  const session = await auth();
  if (!session || !session.user || !session.user.id) {
    throw new Error("Unauthorized");
  }

  // Ensure user owns project
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      sheetConfigs: true,
    },
  });

  if (!project || project.ownerId !== session.user.id) {
    throw new Error("You do not have permission to configure this project.");
  }

  const sheetConfig = project.sheetConfigs[0];
  if (!sheetConfig) {
    throw new Error("SheetConfig not found");
  }

  try {
    await prisma.$transaction(async (tx: any) => {
      // 1. Update SheetConfig
      await tx.sheetConfig.update({
        where: { id: sheetConfig.id },
        data: {
          selectedTabs: data.selectedTabs,
          validationTabName: data.validationTabName,
          headerRow: data.headerRow,
          dataStartRow: data.dataStartRow,
        },
      });

      // 2. Clear old ColumnMappings
      await tx.columnMapping.deleteMany({
        where: { projectId },
      });

      // 3. Mark project as finalized
      await tx.project.update({
        where: { id: projectId },
        data: { finalized: true },
      });
    });

    // 4. Run sync columns and statuses
    await syncProjectColumnsAndStatuses(projectId);

    revalidatePath("/projects");
    revalidatePath(`/p/${project.slug}`);

    return { success: true };
  } catch (error: any) {
    console.error("Failed to finalize project setup:", error);
    return { error: error.message || "Failed to finalize project setup." };
  }
}

export async function deleteProject(projectId: string) {
  const session = await auth();
  if (!session || !session.user || !session.user.id) {
    throw new Error("Unauthorized");
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
  });

  if (!project) {
    return { error: "Project not found." };
  }

  if (project.ownerId !== session.user.id) {
    return { error: "You do not have permission to delete this project." };
  }

  try {
    await prisma.project.delete({
      where: { id: projectId },
    });

    revalidatePath("/projects");
    return { success: true };
  } catch (error: any) {
    console.error("Failed to delete project:", error);
    return { error: error.message || "Failed to delete project." };
  }
}


"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

interface SaveSettingsInput {
  sheetConfig: {
    sheetUrl: string;
    selectedTabs: string[];
    headerRow: number;
    dataStartRow: number;
  };
  columnMappings: {
    tabName: string;
    fieldKey: string;
    columnIndex: number;
  }[];
  statusConfigs: {
    statusValue: string;
    displayLabel: string;
    color: string;
    category: "open" | "closed" | "fixed" | "qa" | "other";
  }[];
  metricVisibilities: {
    metricKey: string;
    enabled: boolean;
  }[];
}

export async function saveProjectSettings(projectId: string, data: SaveSettingsInput) {
  const session = await auth();
  if (!session || !session.user || !session.user.id) {
    throw new Error("Unauthorized");
  }

  // Verify that user is OWNER or ADMIN of this project
  const membership = await prisma.projectMember.findFirst({
    where: {
      projectId,
      userId: session.user.id,
      role: { in: ["OWNER", "ADMIN"] },
    },
  });

  if (!membership) {
    return { error: "You do not have permission to manage this project's settings." };
  }

  // Extract sheetId
  const match = data.sheetConfig.sheetUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (!match || !match[1]) {
    return { error: "Invalid Google Sheet URL." };
  }
  const sheetId = match[1];

  try {
    await prisma.$transaction(async (tx: any) => {
      // 1. Update SheetConfig
      const existingConfig = await tx.sheetConfig.findFirst({
        where: { projectId },
      });
      if (existingConfig) {
        await tx.sheetConfig.update({
          where: { id: existingConfig.id },
          data: {
            sheetUrl: data.sheetConfig.sheetUrl,
            sheetId,
            selectedTabs: data.sheetConfig.selectedTabs,
            headerRow: data.sheetConfig.headerRow,
            dataStartRow: data.sheetConfig.dataStartRow,
          },
        });
      } else {
        await tx.sheetConfig.create({
          data: {
            projectId,
            sheetUrl: data.sheetConfig.sheetUrl,
            sheetId,
            selectedTabs: data.sheetConfig.selectedTabs,
            headerRow: data.sheetConfig.headerRow,
            dataStartRow: data.sheetConfig.dataStartRow,
          },
        });
      }

      // 2. Update Column Mappings (Delete & Re-insert is simplest and most reliable for mappings)
      await tx.columnMapping.deleteMany({ where: { projectId } });
      const mappingsToCreate = data.columnMappings.map((cm) => ({
        projectId,
        tabName: cm.tabName,
        fieldKey: cm.fieldKey,
        columnIndex: cm.columnIndex,
      }));
      await tx.columnMapping.createMany({ data: mappingsToCreate });

      // 3. Update Status Configs (Delete & Re-insert)
      await tx.statusConfig.deleteMany({ where: { projectId } });
      const statusesToCreate = data.statusConfigs.map((sc) => ({
        projectId,
        statusValue: sc.statusValue,
        displayLabel: sc.displayLabel,
        color: sc.color,
        category: sc.category,
      }));
      await tx.statusConfig.createMany({ data: statusesToCreate });

      // 4. Update Metric Visibilities (Delete & Re-insert)
      await tx.metricVisibility.deleteMany({ where: { projectId } });
      const metricsToCreate = data.metricVisibilities.map((mv) => ({
        projectId,
        metricKey: mv.metricKey,
        enabled: mv.enabled,
      }));
      await tx.metricVisibility.createMany({ data: metricsToCreate });
    });

    revalidatePath("/projects");
    revalidatePath(`/p/${membership.projectId}`);
    return { success: true };
  } catch (error: any) {
    console.error("Failed to save settings Action:", error);
    return { error: error.message || "Something went wrong updating project configurations." };
  }
}

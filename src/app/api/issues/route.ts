import { NextRequest, NextResponse } from "next/server";
import { getIssuesForProjectSlug } from "@/features/dashboard/services/issues";
import { updateIssueStatusInSheet } from "@/features/dashboard/api/sheets";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get("slug") || "default";
    const issues = await getIssuesForProjectSlug(slug);

    const project = await prisma.project.findUnique({
      where: { slug },
      include: {
        statusConfigs: {
          orderBy: { sortOrder: "asc" },
        },
        metricVisibilities: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: issues,
      project: project
        ? {
            id: project.id,
            name: project.name,
            slug: project.slug,
            statusConfigs: project.statusConfigs,
            metricVisibilities: project.metricVisibilities,
          }
        : null,
    });
  } catch (error: any) {
    console.error("API route error fetching issues:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch issues" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { slug, tabName, sheetRowIndex, newStatus } = body;

    if (!slug || !tabName || !sheetRowIndex || !newStatus) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    const project = await prisma.project.findUnique({
      where: { slug },
    });

    if (!project) {
      return NextResponse.json(
        { success: false, error: "Project not found" },
        { status: 404 }
      );
    }

    const success = await updateIssueStatusInSheet({
      projectId: project.id,
      tabName,
      sheetRowIndex,
      newStatus,
    });

    if (success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { success: false, error: "Failed to update sheet cell" },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("API route error updating issue status:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update status" },
      { status: 500 }
    );
  }
}

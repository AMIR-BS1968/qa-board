import { NextRequest, NextResponse } from "next/server";
import { getIssuesForProjectSlug } from "@/features/dashboard/services/issues";
import { 
  updateIssueStatusInSheet, 
  fetchValidationRules,
  createIssueInSheet,
  editIssueInSheet
} from "@/features/dashboard/api/sheets";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const slug = searchParams.get("slug") || "default";

    const project = await prisma.project.findUnique({
      where: { slug },
      include: {
        sheetConfigs: true,
        statusConfigs: {
          orderBy: { sortOrder: "asc" },
        },
        metricVisibilities: true,
      },
    });

    if (!project) {
      return NextResponse.json(
        { success: false, error: "Project not found" },
        { status: 404 }
      );
    }

    // Find the user's membership to get their roles in this project
    const member = await prisma.projectMember.findFirst({
      where: { projectId: project.id, userId: session.user.id },
    });
    const roles = member?.roles || [];

    const issues = await getIssuesForProjectSlug(slug);

    let validationRules = {};
    const config = project.sheetConfigs[0];
    if (config && config.validationTabName) {
      validationRules = await fetchValidationRules(
        project.id,
        project.ownerId,
        config.sheetUrl,
        config.validationTabName
      );
    }

    return NextResponse.json({
      success: true,
      data: issues,
      validationRules,
      roles,
      project: {
        id: project.id,
        name: project.name,
        slug: project.slug,
        statusConfigs: project.statusConfigs,
        metricVisibilities: project.metricVisibilities,
        sheetConfigs: project.sheetConfigs.map((sc) => ({
          selectedTabs: sc.selectedTabs,
          headerRow: sc.headerRow,
          dataStartRow: sc.dataStartRow,
          validationTabName: sc.validationTabName,
        })),
      },
    });
  } catch (error: any) {
    console.error("API route error fetching issues:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch issues" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { slug, tabName, issueData } = body;

    if (!slug || !tabName || !issueData) {
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

    const success = await createIssueInSheet({
      projectId: project.id,
      tabName,
      issueData,
    });

    if (success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { success: false, error: "Failed to append new issue to sheet" },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("API route error creating issue:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create issue" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { slug, tabName, sheetRowIndex, issueData } = body;

    if (!slug || !tabName || !sheetRowIndex || !issueData) {
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

    const success = await editIssueInSheet({
      projectId: project.id,
      tabName,
      sheetRowIndex,
      issueData,
    });

    if (success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { success: false, error: "Failed to update issue in sheet" },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("API route error editing issue:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to edit issue" },
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

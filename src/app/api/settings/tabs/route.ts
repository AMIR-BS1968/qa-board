import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSpreadsheetTab, deleteSpreadsheetTab, listSpreadsheetTabs } from "@/features/dashboard/api/sheets";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const slug = new URL(request.url).searchParams.get("slug");
    if (!slug) return NextResponse.json({ success: false, error: "Missing slug" }, { status: 400 });

    const project = await prisma.project.findUnique({
      where: { slug },
      include: { sheetConfigs: true },
    });
    if (!project) return NextResponse.json({ success: false, error: "Project not found" }, { status: 404 });

    const config = project.sheetConfigs[0];
    if (!config) return NextResponse.json({ success: false, error: "No sheet config" }, { status: 400 });

    const tabs = await listSpreadsheetTabs({
      projectId: project.id,
      ownerId: project.ownerId,
      sheetUrl: config.sheetUrl,
    });

    return NextResponse.json({ success: true, tabs });
  } catch (err: any) {
    console.error("[tabs GET] Error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { slug, tabName } = await request.json();
    if (!slug || !tabName) {
      return NextResponse.json({ success: false, error: "Missing slug or tabName" }, { status: 400 });
    }

    const project = await prisma.project.findUnique({
      where: { slug },
      include: { sheetConfigs: true },
    });
    if (!project) return NextResponse.json({ success: false, error: "Project not found" }, { status: 404 });

    const config = project.sheetConfigs[0];
    if (!config) return NextResponse.json({ success: false, error: "No sheet config" }, { status: 400 });

    await createSpreadsheetTab({
      projectId: project.id,
      ownerId: project.ownerId,
      sheetUrl: config.sheetUrl,
      tabName,
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[tabs POST] Error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { slug, tabName } = await request.json();
    if (!slug || !tabName) {
      return NextResponse.json({ success: false, error: "Missing slug or tabName" }, { status: 400 });
    }

    const project = await prisma.project.findUnique({
      where: { slug },
      include: { sheetConfigs: true },
    });
    if (!project) return NextResponse.json({ success: false, error: "Project not found" }, { status: 404 });

    const config = project.sheetConfigs[0];
    if (!config) return NextResponse.json({ success: false, error: "No sheet config" }, { status: 400 });

    await deleteSpreadsheetTab({
      projectId: project.id,
      ownerId: project.ownerId,
      sheetUrl: config.sheetUrl,
      tabName,
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[tabs DELETE] Error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

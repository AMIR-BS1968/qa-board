import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  fetchValidationTabRaw,
  writeValidationTab,
} from "@/features/dashboard/api/sheets";

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
    if (!config?.validationTabName) {
      return NextResponse.json({ success: false, error: "No validation tab configured" }, { status: 400 });
    }

    const rows = await fetchValidationTabRaw({
      projectId: project.id,
      ownerId: project.ownerId,
      sheetUrl: config.sheetUrl,
      validationTabName: config.validationTabName,
    });

    return NextResponse.json({ success: true, rows, validationTabName: config.validationTabName });
  } catch (err: any) {
    console.error("[validation GET] Error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { slug, rows } = await request.json();
    if (!slug || !Array.isArray(rows)) {
      return NextResponse.json({ success: false, error: "Missing slug or rows" }, { status: 400 });
    }

    const project = await prisma.project.findUnique({
      where: { slug },
      include: { sheetConfigs: true },
    });
    if (!project) return NextResponse.json({ success: false, error: "Project not found" }, { status: 404 });

    const config = project.sheetConfigs[0];
    if (!config?.validationTabName) {
      return NextResponse.json({ success: false, error: "No validation tab configured" }, { status: 400 });
    }

    const success = await writeValidationTab({
      projectId: project.id,
      ownerId: project.ownerId,
      sheetUrl: config.sheetUrl,
      validationTabName: config.validationTabName,
      rows,
    });

    return NextResponse.json({ success });
  } catch (err: any) {
    console.error("[validation PUT] Error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

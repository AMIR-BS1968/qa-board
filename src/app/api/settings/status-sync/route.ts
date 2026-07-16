import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { appendValueToValidationColumn } from "@/features/dashboard/api/sheets";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const { slug, statusValue } = await request.json();
    if (!slug || !statusValue) {
      return NextResponse.json({ success: false, error: "Missing slug or statusValue" }, { status: 400 });
    }

    const project = await prisma.project.findUnique({
      where: { slug },
      include: { sheetConfigs: true },
    });
    if (!project) return NextResponse.json({ success: false, error: "Project not found" }, { status: 404 });

    const config = project.sheetConfigs[0];
    if (!config?.validationTabName) {
      // No validation tab configured — skip silently
      return NextResponse.json({ success: true, skipped: true });
    }

    // Try common column header names for status
    const statusHeaders = ["status", "issue status", "issue_status"];
    let synced = false;
    for (const header of statusHeaders) {
      synced = await appendValueToValidationColumn({
        projectId: project.id,
        ownerId: project.ownerId,
        sheetUrl: config.sheetUrl,
        validationTabName: config.validationTabName,
        columnHeader: header,
        value: statusValue,
      });
      if (synced) break;
    }

    return NextResponse.json({ success: true, synced });
  } catch (err: any) {
    console.error("[status-sync] Error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

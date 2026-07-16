import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSpreadsheetTabNames, detectHeaderRow } from "@/features/dashboard/api/sheets";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get("slug");

    if (!slug) {
      return NextResponse.json({ success: false, error: "Slug is required" }, { status: 400 });
    }

    const project = await prisma.project.findUnique({
      where: { slug },
      include: {
        sheetConfigs: true,
      },
    });

    if (!project) {
      return NextResponse.json({ success: false, error: "Project not found" }, { status: 404 });
    }

    const config = project.sheetConfigs[0];
    if (!config) {
      return NextResponse.json({ success: false, error: "Sheet config not found" }, { status: 404 });
    }

    const tabs = await getSpreadsheetTabNames(project.id, project.ownerId, config.sheetUrl);

    let initialHeaderRow = 9;
    let initialDataStartRow = 10;

    if (tabs.length > 0) {
      const firstTab = tabs.find((t) => !/settings|validation|rules|config/i.test(t)) || tabs[0];
      const detection = await detectHeaderRow(project.id, project.ownerId, config.sheetUrl, firstTab);
      if (detection) {
        initialHeaderRow = detection.headerRow;
        initialDataStartRow = detection.dataStartRow;
      }
    }

    return NextResponse.json({
      success: true,
      tabs,
      initialHeaderRow,
      initialDataStartRow,
    });
  } catch (e: any) {
    console.error("Failed to fetch tabs API:", e);
    return NextResponse.json({ success: false, error: e.message || "Internal server error" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");
    if (!projectId) {
      return NextResponse.json({ success: false, error: "Missing projectId" }, { status: 400 });
    }

    // Verify user is member of this project
    const memberCheck = await prisma.projectMember.findFirst({
      where: { projectId, userId: session.user.id },
    });
    if (!memberCheck) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    // Fetch mappings
    const mappings = await prisma.assigneeMapping.findMany({
      where: { projectId },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    // Fetch team members
    const members = await prisma.projectMember.findMany({
      where: { projectId },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      mappings: mappings.map((m) => ({
        sheetName: m.sheetName,
        userId: m.userId,
        user: m.user,
      })),
      members: members.map((m) => ({
        id: m.user.id,
        name: m.user.name,
        email: m.user.email,
        roles: m.roles,
      })),
    });
  } catch (err: any) {
    console.error("[mapping] Error retrieving mappings:", err);
    return NextResponse.json({ success: false, error: err.message || "Failed to load mappings" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { projectId, mappings } = await request.json();
    if (!projectId || !Array.isArray(mappings)) {
      return NextResponse.json({ success: false, error: "Missing projectId or mappings list" }, { status: 400 });
    }

    // Verify user is OWNER or MANAGER in this project
    const memberCheck = await prisma.projectMember.findFirst({
      where: {
        projectId,
        userId: session.user.id,
        roles: { hasSome: ["OWNER", "MANAGER"] },
      },
    });
    if (!memberCheck) {
      return NextResponse.json({ success: false, error: "Forbidden: insufficient permissions" }, { status: 403 });
    }

    // Replace mappings inside a transaction
    await prisma.$transaction(async (tx) => {
      await tx.assigneeMapping.deleteMany({
        where: { projectId },
      });

      if (mappings.length > 0) {
        const createData = mappings.map((m) => ({
          projectId,
          sheetName: m.sheetName,
          userId: m.userId,
        }));
        await tx.assigneeMapping.createMany({
          data: createData,
        });
      }
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[mapping] Error saving mappings:", err);
    return NextResponse.json({ success: false, error: err.message || "Failed to save mappings" }, { status: 500 });
  }
}

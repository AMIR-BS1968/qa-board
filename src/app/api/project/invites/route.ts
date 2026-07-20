import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { randomUUID } from "crypto";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { projectId, role } = await request.json();
    if (!projectId || !role) {
      return NextResponse.json({ success: false, error: "Missing projectId or role" }, { status: 400 });
    }

    // Verify user is OWNER or MANAGER in this project
    const member = await prisma.projectMember.findFirst({
      where: {
        projectId,
        userId: session.user.id,
        roles: { hasSome: ["OWNER", "MANAGER"] },
      },
    });

    if (!member) {
      return NextResponse.json({ success: false, error: "Forbidden: insufficient permissions" }, { status: 403 });
    }

    const token = randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // Valid for 7 days

    await prisma.projectInvite.create({
      data: {
        projectId,
        role,
        token,
        expiresAt,
      },
    });

    const origin = request.nextUrl.origin;
    const inviteUrl = `${origin}/invite/${token}`;

    return NextResponse.json({ success: true, inviteUrl });
  } catch (err: any) {
    console.error("[invites] Error generating invite link:", err);
    return NextResponse.json({ success: false, error: err.message || "Failed to generate invite" }, { status: 500 });
  }
}

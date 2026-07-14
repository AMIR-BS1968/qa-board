import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { syncProjectColumnsAndStatuses } from "@/features/dashboard/api/sheets";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("slug");
  if (!slug) {
    return NextResponse.json({ error: "Missing project slug" }, { status: 400 });
  }

  const session = await auth();
  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const project = await prisma.project.findUnique({
    where: { slug },
    include: {
      members: {
        where: { userId: session.user.id },
      },
    },
  });

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  // Check if user has membership in the project
  if (project.members.length === 0) {
    return NextResponse.json({ error: "Forbidden: Not a project member" }, { status: 403 });
  }

  try {
    const result = await syncProjectColumnsAndStatuses(project.id);
    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    console.error("[sync] Error syncing columns and statuses:", error);
    return NextResponse.json({ error: error.message || "Failed to sync" }, { status: 500 });
  }
}

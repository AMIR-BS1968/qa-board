import { NextResponse } from "next/server";
import { getIssues } from "@/features/dashboard/services/issues";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const issues = await getIssues();
    return NextResponse.json({ success: true, data: issues });
  } catch (error) {
    console.error("API route error fetching issues:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch issues" },
      { status: 500 }
    );
  }
}

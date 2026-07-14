import { fetchRawIssuesForProjectSlug } from "../api/sheets";
import { Issue } from "../types";

export async function getIssuesForProjectSlug(slug: string): Promise<Issue[]> {
  const rawIssues = await fetchRawIssuesForProjectSlug(slug);
  
  // Sort latest assigned dates first, placing empty dates at the end
  return rawIssues.sort((a, b) => {
    if (!a.assignedDate) return 1;
    if (!b.assignedDate) return -1;
    return new Date(b.assignedDate).getTime() - new Date(a.assignedDate).getTime();
  });
}

export async function getIssues(): Promise<Issue[]> {
  return getIssuesForProjectSlug("default");
}

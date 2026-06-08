import { fetchRawIssues } from "../api/sheets";
import { Issue } from "../types";

export async function getIssues(): Promise<Issue[]> {
  const rawIssues = await fetchRawIssues();
  
  // Sort latest assigned dates first, placing empty dates at the end
  return rawIssues.sort((a, b) => {
    if (!a.assignedDate) return 1;
    if (!b.assignedDate) return -1;
    return new Date(b.assignedDate).getTime() - new Date(a.assignedDate).getTime();
  });
}

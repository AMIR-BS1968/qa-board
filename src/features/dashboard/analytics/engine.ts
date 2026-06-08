import { Issue, DashboardMetrics, IssueStatus, MetricBreakdown } from "../types";
import { ISSUE_STATUSES } from "../constants";

// Helper to format date in YYYY-MM-DD format
export const getTodayString = (): string => {
  // Let's use user's context local time (2026-05-22) as default for server-side stability,
  // or a fallback to current real system date
  const now = new Date();
  // Using User local time year/month/day
  // Since we know local time is 2026-05-22, let's make sure it defaults to "2026-05-22" if system clocks are off.
  // We can write a dynamic parser
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

export function calculateMetrics(issues: Issue[]): DashboardMetrics {
  const todayStr = getTodayString();

  // Helper to calculate breakdown for a subset of issues
  const calculateBreakdown = (filteredList: Issue[]): MetricBreakdown => {
    const app = filteredList.filter((issue) => issue.sheetSource === "App").length;
    const admin = filteredList.filter((issue) => issue.sheetSource === "Admin").length;
    return {
      app,
      admin,
      total: app + admin,
    };
  };

  // 1. Today's Found Issues (Assigned Date matches today)
  const todayFoundCount = calculateBreakdown(
    issues.filter((issue) => issue.assignedDate === todayStr)
  );

  // 2. Today's Resolved Issues (Resolution Date matches today & Status is RESOLVED)
  const todayResolvedCount = calculateBreakdown(
    issues.filter(
      (issue) =>
        issue.resolutionDate === todayStr &&
        issue.issueStatus === "RESOLVED"
    )
  );

  // 3. Open Issues (TODO, IN PROGRESS, IN QA, NOT RESOLVED)
  const openStatuses: IssueStatus[] = ["TODO", "IN PROGRESS", "IN QA", "NOT RESOLVED"];
  const totalOpenCount = calculateBreakdown(
    issues.filter((issue) => openStatuses.includes(issue.issueStatus))
  );

  // 4. Closed Issues (RESOLVED)
  const closedStatuses: IssueStatus[] = ["RESOLVED"];
  const totalClosedCount = calculateBreakdown(
    issues.filter((issue) => closedStatuses.includes(issue.issueStatus))
  );

  // 4.5 Awaiting Deployment (FIXED)
  const awaitingDeploymentCount = calculateBreakdown(
    issues.filter((issue) => issue.issueStatus === "FIXED")
  );

  // 5. QA Bottleneck Count (stuck in IN QA)
  const qaBottleneckCount = calculateBreakdown(
    issues.filter((issue) => issue.issueStatus === "IN QA")
  );

  // 6. Issues per Status (count & percentage)
  const totalIssuesCount = issues.length || 1;
  const issuesPerStatus = ISSUE_STATUSES.map((status) => {
    const count = issues.filter((issue) => issue.issueStatus === status).length;
    return {
      status,
      count,
      percentage: Math.round((count / totalIssuesCount) * 100),
    };
  });

  // 7. Issues per Assignee
  const assigneeMap: Record<string, Record<IssueStatus, number>> = {};

  issues.forEach((issue) => {
    const assignee = issue.assignee || "Unassigned";
    if (!assigneeMap[assignee]) {
      assigneeMap[assignee] = {
        "TODO": 0,
        "IN PROGRESS": 0,
        "FIXED": 0,
        "IN QA": 0,
        "RESOLVED": 0,
        "NOT RESOLVED": 0,
      };
    }
    assigneeMap[assignee][issue.issueStatus]++;
  });

  const issuesPerAssignee = Object.entries(assigneeMap).map(([assignee, counts]) => {
    const total = Object.values(counts).reduce((acc, curr) => acc + curr, 0);
    const app = issues.filter((i) => i.assignee === assignee && i.sheetSource === "App").length;
    const admin = issues.filter((i) => i.assignee === assignee && i.sheetSource === "Admin").length;
    return {
      assignee,
      total,
      app,
      admin,
      todo: counts["TODO"],
      inProgress: counts["IN PROGRESS"],
      fixed: counts["FIXED"],
      inQa: counts["IN QA"],
      resolved: counts["RESOLVED"],
      notResolved: counts["NOT RESOLVED"],
    };
  }).sort((a, b) => b.total - a.total); // Sort highest workload first

  // 8. Module-wise distribution (total + per source)
  const moduleMap: Record<string, { total: number; app: number; admin: number }> = {};
  issues.forEach((issue) => {
    const mod = issue.module || "General";
    if (!moduleMap[mod]) moduleMap[mod] = { total: 0, app: 0, admin: 0 };
    moduleMap[mod].total++;
    if (issue.sheetSource === "App") moduleMap[mod].app++;
    else moduleMap[mod].admin++;
  });

  const moduleDistribution = Object.entries(moduleMap)
    .map(([module, counts]) => ({ module, count: counts.total, app: counts.app, admin: counts.admin }))
    .sort((a, b) => b.count - a.count);

  return {
    todayFoundCount,
    todayResolvedCount,
    totalOpenCount,
    totalClosedCount,
    qaBottleneckCount,
    awaitingDeploymentCount,
    issuesPerStatus,
    issuesPerAssignee,
    moduleDistribution,
  };
}

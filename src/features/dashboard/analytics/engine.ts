import { Issue, DashboardMetrics, IssueStatus, MetricBreakdown } from "../types";
import { ISSUE_STATUSES } from "../constants";

// Helper to format date in YYYY-MM-DD format
export const getTodayString = (): string => {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

export function calculateMetrics(issues: Issue[], tabsList: string[] = ["Admin", "App"]): DashboardMetrics {
  const todayStr = getTodayString();

  // Helper to calculate breakdown for a subset of issues dynamically
  const calculateBreakdown = (filteredList: Issue[]): MetricBreakdown => {
    const byTab: Record<string, number> = {};
    tabsList.forEach((tab) => {
      byTab[tab] = filteredList.filter((issue) => issue.sheetSource === tab).length;
    });
    const total = Object.values(byTab).reduce((acc, curr) => acc + curr, 0);
    return {
      total,
      byTab,
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

  // 3. Open Issues (TODO, IN PROGRESS, NOT RESOLVED)
  const openStatuses: IssueStatus[] = ["TODO", "IN PROGRESS", "NOT RESOLVED"];
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
        "NOT NEEDED": 0
      };
    }
    assigneeMap[assignee][issue.issueStatus]++;
  });

  const issuesPerAssignee = Object.entries(assigneeMap).map(([assignee, counts]) => {
    const total = Object.values(counts).reduce((acc, curr) => acc + curr, 0);
    const byTab: Record<string, number> = {};
    tabsList.forEach((tab) => {
      byTab[tab] = issues.filter((i) => i.assignee === assignee && i.sheetSource === tab).length;
    });
    return {
      assignee,
      total,
      byTab,
      todo: counts["TODO"],
      inProgress: counts["IN PROGRESS"],
      fixed: counts["FIXED"],
      inQa: counts["IN QA"],
      resolved: counts["RESOLVED"],
      notResolved: counts["NOT RESOLVED"],
    };
  }).sort((a, b) => b.total - a.total); // Sort highest workload first

  // 8. Module-wise distribution (total + per source)
  const moduleMap: Record<string, { total: number }> = {};
  issues.forEach((issue) => {
    const mod = issue.module || "General";
    if (!moduleMap[mod]) moduleMap[mod] = { total: 0 };
    moduleMap[mod].total++;
  });

  const moduleDistribution = Object.entries(moduleMap)
    .map(([module, counts]) => {
      const byTab: Record<string, number> = {};
      tabsList.forEach((tab) => {
        byTab[tab] = issues.filter((i) => (i.module || "General") === module && i.sheetSource === tab).length;
      });
      return { module, count: counts.total, byTab };
    })
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

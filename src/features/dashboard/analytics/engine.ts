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

export function calculateMetrics(
  issues: Issue[], 
  tabsList: string[] = ["Admin", "App"],
  statusConfigs: { statusValue: string; category: string }[] = []
): DashboardMetrics {
  const todayStr = getTodayString();

  // Get lists of status values for each category
  const openStatuses = statusConfigs.filter((s) => s.category === "open").map((s) => s.statusValue);
  const closedStatuses = statusConfigs.filter((s) => s.category === "closed").map((s) => s.statusValue);
  const fixedStatuses = statusConfigs.filter((s) => s.category === "fixed").map((s) => s.statusValue);
  const qaStatuses = statusConfigs.filter((s) => s.category === "qa").map((s) => s.statusValue);

  // Fallbacks for backward compatibility / initial load before cache resolves
  const openList = openStatuses.length > 0 ? openStatuses : ["TODO", "IN PROGRESS", "NOT RESOLVED"];
  const closedList = closedStatuses.length > 0 ? closedStatuses : ["RESOLVED"];
  const fixedList = fixedStatuses.length > 0 ? fixedStatuses : ["FIXED"];
  const qaList = qaStatuses.length > 0 ? qaStatuses : ["IN QA"];

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

  // 2. Today's Resolved Issues (Resolution Date matches today & Status is in closed category)
  const todayResolvedCount = calculateBreakdown(
    issues.filter(
      (issue) =>
        issue.resolutionDate === todayStr &&
        closedList.includes(issue.issueStatus)
    )
  );

  // 3. Open Issues
  const totalOpenCount = calculateBreakdown(
    issues.filter((issue) => openList.includes(issue.issueStatus))
  );

  // 4. Closed Issues (Resolved)
  const totalClosedCount = calculateBreakdown(
    issues.filter((issue) => closedList.includes(issue.issueStatus))
  );

  // 4.5 Awaiting Deployment (Fixed)
  const awaitingDeploymentCount = calculateBreakdown(
    issues.filter((issue) => fixedList.includes(issue.issueStatus))
  );

  // 5. QA Bottleneck Count (stuck in QA category)
  const qaBottleneckCount = calculateBreakdown(
    issues.filter((issue) => qaList.includes(issue.issueStatus))
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

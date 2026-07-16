export type IssueStatus = "TODO" | "IN PROGRESS" | "FIXED" | "IN QA" | "RESOLVED" | "NOT RESOLVED" | "NOT NEEDED";

export type SheetSource = string;

export interface MetricBreakdown {
  total: number;
  byTab: Record<string, number>;
}

export interface Issue {
  module: string;
  feature: string;
  issueTitle: string;
  issueDescription: string;
  stepsToReproduce: string;
  resources: string;
  issueStatus: IssueStatus;
  reportedBy: string;
  devComments: string;
  estimation: string;
  spentTime: string;
  assignedDate: string;
  assignee: string;
  resolutionDate: string;
  qaComments: string;
  sheetSource: SheetSource;
  sheetRowIndex?: number;
}

export interface DashboardMetrics {
  todayFoundCount: MetricBreakdown;
  todayResolvedCount: MetricBreakdown;
  totalOpenCount: MetricBreakdown;
  totalClosedCount: MetricBreakdown;
  qaBottleneckCount: MetricBreakdown;
  awaitingDeploymentCount: MetricBreakdown;
  issuesPerStatus: { status: IssueStatus; count: number; percentage: number }[];
  issuesPerAssignee: {
    assignee: string;
    total: number;
    byTab: Record<string, number>;
    todo: number;
    inProgress: number;
    fixed: number;
    inQa: number;
    resolved: number;
    notResolved: number;
  }[];
  moduleDistribution: { module: string; count: number; byTab: Record<string, number> }[];
}

export interface IssueFilters {
  search: string;
  source: SheetSource[];
  module: string[];
  status: IssueStatus[];
  assignee: string[];
  reportedBy: string[];
  assignedDateStart?: Date;
  assignedDateEnd?: Date;
  resolutionDateStart?: Date;
  resolutionDateEnd?: Date;
}

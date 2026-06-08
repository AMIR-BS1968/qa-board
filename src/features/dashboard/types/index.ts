export type IssueStatus = "TODO" | "IN PROGRESS" | "FIXED" | "IN QA" | "RESOLVED" | "NOT RESOLVED";

export type SheetSource = "Admin" | "App";

export interface MetricBreakdown {
  app: number;
  admin: number;
  total: number;
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
}

export interface DashboardMetrics {
  todayFoundCount: MetricBreakdown;
  todayResolvedCount: MetricBreakdown;
  totalOpenCount: MetricBreakdown;
  totalClosedCount: MetricBreakdown;
  qaBottleneckCount: MetricBreakdown;
  issuesPerStatus: { status: IssueStatus; count: number; percentage: number }[];
  issuesPerAssignee: {
    assignee: string;
    total: number;
    app: number;
    admin: number;
    todo: number;
    inProgress: number;
    fixed: number;
    inQa: number;
    resolved: number;
    notResolved: number;
  }[];
  moduleDistribution: { module: string; count: number; app: number; admin: number }[];
}

export interface IssueFilters {
  search: string;
  source: SheetSource[];
  module: string[];
  status: IssueStatus[];
  assignee: string[];
  assignedDateStart?: Date;
  assignedDateEnd?: Date;
  resolutionDateStart?: Date;
  resolutionDateEnd?: Date;
}

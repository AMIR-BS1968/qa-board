import { Issue } from "@/features/dashboard/types";

export interface IssuesTableProps {
  issues: Issue[];
  loading?: boolean;
  onEditIssue?: (issue: Issue) => void;
  onStatusChange?: (issue: Issue, newStatus: string) => Promise<void> | void;
  statusOptions?: string[];
}

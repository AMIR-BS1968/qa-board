import { Issue } from "@/features/dashboard/types";

export interface IssuesTableProps {
  issues: Issue[];
  loading?: boolean;
}

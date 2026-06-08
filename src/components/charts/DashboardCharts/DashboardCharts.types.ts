import { DashboardMetrics } from "@/features/dashboard/types";

export interface DashboardChartsProps {
  metrics: DashboardMetrics;
  loading?: boolean;
}

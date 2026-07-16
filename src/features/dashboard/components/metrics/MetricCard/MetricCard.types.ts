import { ReactNode } from "react";

export interface MetricCardProps {
  label: string;
  value: number | string;
  icon: ReactNode;
  description?: string;
  loading?: boolean;
  trend?: {
    value: string;
    isPositive?: boolean;
  };
  tabBreakdown?: { label: string; value: number }[];
  onClick?: () => void;
}

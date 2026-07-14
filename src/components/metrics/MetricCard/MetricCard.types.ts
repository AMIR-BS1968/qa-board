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
  appValue?: number;
  adminValue?: number;
  onClick?: () => void;
}

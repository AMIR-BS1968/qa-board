"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { MetricCardProps } from "./MetricCard.types";

export function MetricCardMobile({
  label,
  value,
  icon,
  description,
  loading = false,
  trend,
  appValue,
  adminValue,
}: MetricCardProps) {
  if (loading) {
    return (
      <Card className="border border-border/30 bg-zinc-950/30">
        <CardContent className="p-4">
          <div className="flex items-center justify-between pb-1">
            <Skeleton className="h-3 w-16 bg-zinc-800" />
            <Skeleton className="h-6 w-6 rounded-full bg-zinc-800" />
          </div>
          <Skeleton className="mt-2 h-6 w-12 bg-zinc-800" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border border-border/30 bg-zinc-950/30 active:bg-zinc-900/30 transition-colors duration-200">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-zinc-400">
            {label}
          </span>
          <div className="text-zinc-500">
            {icon}
          </div>
        </div>

        <div className="mt-2 flex items-baseline justify-between">
          <span className="text-2xl font-bold tracking-tight text-white">
            {value}
          </span>
          {trend && (
            <span className={`text-[10px] font-medium ${trend.isPositive ? "text-emerald-400" : "text-rose-400"}`}>
              {trend.value}
            </span>
          )}
        </div>

        {description && (
          <p className="mt-1 text-[10px] text-zinc-500 truncate">
            {description}
          </p>
        )}

        {appValue !== undefined && adminValue !== undefined && (
          <div className="mt-2 pt-2 border-t border-border/10 flex items-center justify-between text-[9px] font-medium font-mono text-zinc-400">
            <span className="flex items-center gap-1">
              <span className="h-1 w-1 rounded-full bg-indigo-500" />
              App: <span className="text-zinc-200">{appValue}</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="h-1 w-1 rounded-full bg-teal-500" />
              Admin: <span className="text-zinc-200">{adminValue}</span>
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

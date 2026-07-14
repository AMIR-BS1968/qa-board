"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { MetricCardProps } from "./MetricCard.types";

export function MetricCard({
  label,
  value,
  icon,
  description,
  loading = false,
  trend,
  appValue,
  adminValue,
  onClick,
}: MetricCardProps) {
  if (loading) {
    return (
      <Card className="border border-border/40 bg-zinc-950/30 backdrop-blur-md">
        <CardContent className="p-6">
          <div className="flex items-center justify-between space-y-0 pb-2">
            <Skeleton className="h-4 w-24 bg-zinc-800" />
            <Skeleton className="h-8 w-8 rounded-full bg-zinc-800" />
          </div>
          <Skeleton className="mt-4 h-8 w-16 bg-zinc-800" />
          <Skeleton className="mt-2 h-3 w-36 bg-zinc-800" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card 
      onClick={onClick}
      className={`group relative overflow-hidden border border-border/40 bg-zinc-950/20 backdrop-blur-md transition-all duration-300 ${
        onClick ? "cursor-pointer hover:border-primary/40 hover:bg-zinc-900/40 hover:scale-[1.01]" : "hover:border-primary/30 hover:bg-zinc-900/30"
      } hover:shadow-[0_0_20px_-5px_rgba(255,255,255,0.05)]`}
    >
      {/* Decorative Top Glow */}
      <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-zinc-800 to-transparent group-hover:via-primary/50 transition-all duration-500" />

      <CardContent className="p-6">
        <div className="flex items-center justify-between pb-2">
          <span className="text-sm font-medium text-zinc-400 group-hover:text-zinc-300 transition-colors duration-200">
            {label}
          </span>
          <div className="rounded-full bg-zinc-900/50 p-2 text-zinc-400 border border-border/20 group-hover:text-primary group-hover:border-primary/20 transition-all duration-300">
            {icon}
          </div>
        </div>

        <div className="mt-3">
          <span className="text-3xl font-bold tracking-tight text-white transition-all duration-300">
            {value}
          </span>
        </div>

        {(description || trend) && (
          <div className="mt-2 flex items-center space-x-1.5 text-xs text-zinc-500">
            {trend && (
              <span className={trend.isPositive ? "text-emerald-400 font-medium" : "text-rose-400 font-medium"}>
                {trend.value}
              </span>
            )}
            {description && <span className="truncate">{description}</span>}
          </div>
        )}

        {appValue !== undefined && adminValue !== undefined && (
          <div className="mt-4 pt-3 border-t border-border/20 flex items-center justify-between text-[11px] font-medium font-mono text-zinc-400">
            <span className="flex items-center gap-1.5 hover:text-indigo-400 transition-colors duration-150">
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 shadow-sm" />
              App: <strong className="text-white text-xs">{appValue}</strong>
            </span>
            <span className="text-zinc-700 font-sans">|</span>
            <span className="flex items-center gap-1.5 hover:text-teal-400 transition-colors duration-150">
              <span className="h-1.5 w-1.5 rounded-full bg-teal-500 shadow-sm" />
              Admin: <strong className="text-white text-xs">{adminValue}</strong>
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

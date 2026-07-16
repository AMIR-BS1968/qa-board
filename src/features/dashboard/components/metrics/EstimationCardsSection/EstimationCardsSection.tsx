"use client";

import { useMemo } from "react";
import { Issue } from "@/features/dashboard/types";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { parseEstimation, formatMinutes } from "@/lib/utils";
import { Clock, Smartphone, Monitor } from "lucide-react";

interface EstimationCardsSectionProps {
  issues: Issue[];
  loading?: boolean;
}

export function EstimationCardsSection({ issues, loading = false }: EstimationCardsSectionProps) {
  const stats = useMemo(() => {
    let appTotal = 0;
    let appRemaining = 0;
    let adminTotal = 0;
    let adminRemaining = 0;

    issues.forEach(issue => {
      const mins = parseEstimation(issue.estimation);
      if (mins === 0) return;

      const isRemaining = issue.issueStatus === "TODO" || issue.issueStatus === "IN PROGRESS";

      if (issue.sheetSource === "App") {
        appTotal += mins;
        if (isRemaining) appRemaining += mins;
      } else {
        adminTotal += mins;
        if (isRemaining) adminRemaining += mins;
      }
    });

    return {
      app: { total: appTotal, remaining: appRemaining },
      admin: { total: adminTotal, remaining: adminRemaining },
      overall: { 
        total: appTotal + adminTotal, 
        remaining: appRemaining + adminRemaining 
      }
    };
  }, [issues]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-32 w-full bg-zinc-900/60 rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Total Card */}
      <Card className="border border-indigo-500/30 bg-zinc-950/40 backdrop-blur-md overflow-hidden relative group">
        <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent" />
        <CardContent className="p-5 flex flex-col justify-between h-full">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">Overall Estimation</span>
            <div className="bg-indigo-500/20 p-2 rounded-full border border-indigo-500/20">
              <Clock className="h-4 w-4 text-indigo-400" />
            </div>
          </div>
          <div>
            <div className="flex items-end gap-2 mb-1">
              <span className="text-3xl font-bold text-white">{formatMinutes(stats.overall.remaining)}</span>
              <span className="text-xs font-medium text-zinc-400 mb-1.5">remaining</span>
            </div>
            <div className="text-xs text-zinc-500 font-medium">
              Out of <span className="text-zinc-300 font-semibold">{formatMinutes(stats.overall.total)}</span> total estimated work
            </div>
          </div>
        </CardContent>
      </Card>

      {/* App Card */}
      <Card className="border border-border/40 bg-zinc-950/20 backdrop-blur-md overflow-hidden relative group hover:bg-zinc-900/30 transition-colors">
        <CardContent className="p-5 flex flex-col justify-between h-full">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">App Workload</span>
            <div className="bg-zinc-800/80 p-2 rounded-full border border-border/30">
              <Smartphone className="h-4 w-4 text-zinc-400" />
            </div>
          </div>
          <div>
            <div className="flex items-end gap-2 mb-1">
              <span className="text-3xl font-bold text-white">{formatMinutes(stats.app.remaining)}</span>
              <span className="text-xs font-medium text-zinc-500 mb-1.5">remaining</span>
            </div>
            <div className="text-xs text-zinc-500 font-medium">
              Out of <span className="text-zinc-300 font-semibold">{formatMinutes(stats.app.total)}</span> total
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Admin Card */}
      <Card className="border border-border/40 bg-zinc-950/20 backdrop-blur-md overflow-hidden relative group hover:bg-zinc-900/30 transition-colors">
        <CardContent className="p-5 flex flex-col justify-between h-full">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">Admin Workload</span>
            <div className="bg-zinc-800/80 p-2 rounded-full border border-border/30">
              <Monitor className="h-4 w-4 text-zinc-400" />
            </div>
          </div>
          <div>
            <div className="flex items-end gap-2 mb-1">
              <span className="text-3xl font-bold text-white">{formatMinutes(stats.admin.remaining)}</span>
              <span className="text-xs font-medium text-zinc-500 mb-1.5">remaining</span>
            </div>
            <div className="text-xs text-zinc-500 font-medium">
              Out of <span className="text-zinc-300 font-semibold">{formatMinutes(stats.admin.total)}</span> total
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

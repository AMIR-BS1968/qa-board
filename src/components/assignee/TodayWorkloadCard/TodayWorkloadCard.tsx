"use client";

import { useMemo } from "react";
import { Issue } from "@/features/dashboard/types";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { parseSheetDate, parseEstimation, formatMinutes } from "@/lib/utils";
import { Clock } from "lucide-react";

interface TodayWorkloadCardProps {
  issues: Issue[];
  loading?: boolean;
}

export function TodayWorkloadCard({ issues, loading = false }: TodayWorkloadCardProps) {
  const workloads = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const map: Record<string, number> = {};

    issues.forEach((issue) => {
      // We only care about tasks assigned today
      const d = parseSheetDate(issue.assignedDate);
      if (!d) return;
      d.setHours(0, 0, 0, 0);
      if (d.getTime() !== today.getTime()) return;

      // Only show unfinished tasks (TODO, IN PROGRESS)
      if (issue.issueStatus !== "TODO" && issue.issueStatus !== "IN PROGRESS") return;

      const mins = parseEstimation(issue.estimation);
      if (mins > 0) {
        const assignee = issue.assignee || "Unassigned";
        if (!map[assignee]) map[assignee] = 0;
        map[assignee] += mins;
      }
    });

    // Convert to array and sort by most hours
    return Object.entries(map)
      .map(([assignee, totalMins]) => ({ assignee, totalMins }))
      .sort((a, b) => b.totalMins - a.totalMins);
  }, [issues]);

  if (loading) {
    return <Skeleton className="h-[250px] w-full bg-zinc-900/60 rounded-2xl" />;
  }

  return (
    <Card className="h-full border border-border/40 bg-zinc-950/20 backdrop-blur-md overflow-hidden flex flex-col">
      <div className="p-4 border-b border-border/20 bg-zinc-900/40 flex items-center gap-2">
        <Clock className="h-4 w-4 text-emerald-400" />
        <h3 className="text-sm font-semibold text-white">Today's Workload</h3>
      </div>
      
      <CardContent className="p-0 flex-1 overflow-y-auto">
        {workloads.length === 0 ? (
          <div className="p-6 flex flex-col items-center justify-center text-center h-full opacity-60">
            <Clock className="h-8 w-8 text-zinc-600 mb-2" />
            <p className="text-sm font-medium text-zinc-400">No workload estimated for today</p>
          </div>
        ) : (
          <div className="divide-y divide-border/10">
            {workloads.map(({ assignee, totalMins }) => (
              <div key={assignee} className="p-4 flex items-center justify-between hover:bg-zinc-900/30 transition-colors">
                <span className="text-sm font-medium text-zinc-300">{assignee}</span>
                <div className="flex items-center gap-1.5 bg-zinc-900/50 px-2.5 py-1 rounded-md border border-border/20">
                  <span className="text-xs font-bold text-emerald-400">
                    {formatMinutes(totalMins)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

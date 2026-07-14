"use client";

import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Issue } from "@/features/dashboard/types";
import { Skeleton } from "@/components/ui/skeleton";

interface ReporterCardsProps {
  issues: Issue[];
  loading?: boolean;
  onCardClick?: (reporterName: string, filteredIssues: Issue[]) => void;
}

interface ReporterBreakdown {
  reporter: string;
  total: number;
  app: number;
  admin: number;
  resolvedApp: number;
  resolvedAdmin: number;
}

export function ReporterCards({ issues, loading = false, onCardClick }: ReporterCardsProps) {
  const reporters = useMemo<ReporterBreakdown[]>(() => {
    const map: Record<string, ReporterBreakdown> = {};
    issues.forEach((issue) => {
      const name = issue.reportedBy || "Unknown";
      if (!map[name]) {
        map[name] = { reporter: name, total: 0, app: 0, admin: 0, resolvedApp: 0, resolvedAdmin: 0 };
      }
      map[name].total++;
      
      const isResolved = issue.issueStatus === "RESOLVED";

      if (issue.sheetSource === "App") {
        map[name].app++;
        if (isResolved) map[name].resolvedApp++;
      } else {
        map[name].admin++;
        if (isResolved) map[name].resolvedAdmin++;
      }
    });
    return Object.values(map).sort((a, b) => b.total - a.total);
  }, [issues]);

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-28 w-full bg-zinc-800/60 rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Section header */}
      <div className="flex items-center">
        <span className="text-xs text-zinc-500 ml-auto">
          {reporters.length} reporter{reporters.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Reporter cards grid */}
      {reporters.length === 0 ? (
        <p className="text-sm text-zinc-500 py-4 text-center">No reporters found.</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {reporters.map((r) => (
            <Card
              key={r.reporter}
              onClick={() => {
                if (onCardClick) {
                  const reporterIssues = issues.filter(
                    (issue) => (issue.reportedBy || "Unknown") === r.reporter
                  );
                  onCardClick(r.reporter, reporterIssues);
                }
              }}
              className={`border border-border/30 bg-zinc-900/30 transition-all duration-200 ${
                onCardClick ? "cursor-pointer hover:border-primary/40 hover:bg-zinc-900/50 hover:scale-[1.01]" : ""
              }`}
            >
              <CardContent className="p-4 flex flex-col gap-3">
                {/* Reporter name */}
                <p className="text-sm font-semibold text-white truncate" title={r.reporter}>
                  {r.reporter}
                </p>

                {/* Total */}
                <div className="flex items-end gap-1">
                  <span className="text-3xl font-bold text-white tabular-nums">{r.total}</span>
                  <span className="text-xs text-zinc-500 mb-1">issues</span>
                </div>

                {/* App / Admin breakdown */}
                <div className="flex flex-col gap-2 border-t border-border/20 pt-3 mt-auto">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                      <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 shrink-0" />
                      <span className="font-medium text-white">{r.app}</span>
                      <span>App</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                      <span className="h-1.5 w-1.5 rounded-full bg-teal-400 shrink-0" />
                      <span className="font-medium text-white">{r.admin}</span>
                      <span>Admin</span>
                    </div>
                  </div>
                  
                  {/* Solved / Resolved breakdown */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-sm text-zinc-400">
                      <span className="font-bold text-emerald-400">{r.resolvedApp}</span>
                      <span>solved</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-sm text-zinc-400">
                      <span className="font-bold text-emerald-400">{r.resolvedAdmin}</span>
                      <span>solved</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

"use client";

import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Issue } from "@/features/dashboard/types";
import { Skeleton } from "@/components/ui/skeleton";

interface ReporterCardsProps {
  issues: Issue[];
  loading?: boolean;
  onCardClick?: (reporterName: string, filteredIssues: Issue[]) => void;
  tabsList?: string[];
}

interface ReporterBreakdown {
  reporter: string;
  total: number;
  byTab: Record<string, { total: number; resolved: number }>;
}

export function ReporterCards({ issues, loading = false, onCardClick, tabsList = ["Admin", "App"] }: ReporterCardsProps) {
  const reporters = useMemo<ReporterBreakdown[]>(() => {
    const map: Record<string, ReporterBreakdown> = {};
    issues.forEach((issue) => {
      const name = issue.reportedBy || "Unknown";
      if (!map[name]) {
        const byTab: Record<string, { total: number; resolved: number }> = {};
        tabsList.forEach((tab) => {
          byTab[tab] = { total: 0, resolved: 0 };
        });
        map[name] = { reporter: name, total: 0, byTab };
      }
      map[name].total++;
      
      const isResolved = issue.issueStatus === "RESOLVED";

      if (issue.sheetSource) {
        if (map[name].byTab[issue.sheetSource] === undefined) {
          map[name].byTab[issue.sheetSource] = { total: 0, resolved: 0 };
        }
        map[name].byTab[issue.sheetSource].total++;
        if (isResolved) {
          map[name].byTab[issue.sheetSource].resolved++;
        }
      }
    });
    return Object.values(map).sort((a, b) => b.total - a.total);
  }, [issues, tabsList]);

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

                {/* Dynamic tab breakdown */}
                {tabsList && tabsList.length > 0 && (
                  <div className="flex flex-col gap-1 border-t border-border/10 pt-2.5 mt-auto text-[10px] text-zinc-400 font-mono">
                    {tabsList.slice(0, 3).map((tab, idx) => {
                      const colors = ["bg-indigo-400", "bg-teal-400", "bg-purple-400", "bg-pink-400", "bg-blue-400"];
                      const colorClass = colors[idx % colors.length];
                      const tabStats = r.byTab[tab] || { total: 0, resolved: 0 };
                      return (
                        <div key={tab} className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1">
                            <span className={`h-1.5 w-1.5 rounded-full ${colorClass} shrink-0`} />
                            <span className="font-medium text-white">{tabStats.total}</span>
                            <span className="text-[9px] font-sans text-zinc-500 truncate max-w-[45px]" title={tab}>{tab}</span>
                          </div>
                          <span className="text-[9px] text-emerald-400 font-sans">{tabStats.resolved} solved</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

"use client";

import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Issue } from "@/features/dashboard/types";
import { Skeleton } from "@/components/ui/skeleton";

interface ReporterCardsProps {
  issues: Issue[];
  loading?: boolean;
}

interface ReporterBreakdown {
  reporter: string;
  total: number;
  app: number;
  admin: number;
}

export function ReporterCards({ issues, loading = false }: ReporterCardsProps) {
  const reporters = useMemo<ReporterBreakdown[]>(() => {
    const map: Record<string, ReporterBreakdown> = {};
    issues.forEach((issue) => {
      const name = issue.reportedBy || "Unknown";
      if (!map[name]) map[name] = { reporter: name, total: 0, app: 0, admin: 0 };
      map[name].total++;
      if (issue.sheetSource === "App") map[name].app++;
      else map[name].admin++;
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
              className="border border-border/30 bg-zinc-900/30 hover:bg-zinc-900/50 transition-colors"
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
                <div className="flex items-center justify-between border-t border-border/20 pt-2 mt-auto">
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
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

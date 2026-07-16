"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { STATUS_META_MAP } from "@/features/dashboard/constants";
import { IssuesTableProps } from "./IssuesTable.types";

export function IssuesTableMobile({ issues, loading = false, onEditIssue }: IssuesTableProps) {
  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 w-full bg-zinc-900/60 border border-border/20 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (issues.length === 0) {
    return (
      <div className="h-32 rounded-lg border border-dashed border-border/30 flex items-center justify-center text-xs text-zinc-500">
        No issues matching the current filters.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {issues.map((issue, idx) => {
        const meta = STATUS_META_MAP[issue.issueStatus];
        return (
          <Card
            key={idx}
            onClick={() => onEditIssue?.(issue)}
            className="border border-border/30 bg-zinc-950/20 active:bg-zinc-900/30 transition-all duration-200 cursor-pointer"
          >
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <Badge className={`px-2 py-0.5 text-[9px] font-semibold border ${meta?.bgClass || ""}`}>
                    {meta?.label || issue.issueStatus}
                  </Badge>
                  <Badge className={`px-2 py-0.5 text-[9px] font-semibold border ${issue.sheetSource === "App" ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/20" : "bg-teal-500/10 text-teal-400 border-teal-500/20"}`}>
                    {issue.sheetSource}
                  </Badge>
                </div>
                <span className="text-[10px] text-zinc-500 font-mono">Est: {issue.estimation || "—"}</span>
              </div>

              <div>
                <h4 className="text-xs font-bold text-white line-clamp-2">
                  {issue.issueTitle}
                </h4>
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-border/10 text-[10px] text-zinc-400">
                <span className="truncate max-w-[120px]">
                  {issue.module}
                </span>
                <span className="font-semibold text-zinc-300">
                  {issue.assignee || "Unassigned"}
                </span>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

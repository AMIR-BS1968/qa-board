"use client";

import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Calendar, X } from "lucide-react";
import { Issue } from "@/features/dashboard/types";
import { Skeleton } from "@/components/ui/skeleton";
import { parseSheetDate } from "@/lib/utils";
import { format } from "date-fns";

interface AssigneeCardsProps {
  issues: Issue[];
  loading?: boolean;
  onCardClick?: (assigneeName: string, filteredIssues: Issue[]) => void;
  tabsList?: string[];
}

interface AssigneeBreakdown {
  assignee: string;
  total: number;
  byTab: Record<string, number>;
}

export function AssigneeCards({ issues, loading = false, onCardClick, tabsList = ["Admin", "App"] }: AssigneeCardsProps) {
  const [dateStart, setDateStart] = useState<Date | undefined>(undefined);
  const [dateEnd, setDateEnd] = useState<Date | undefined>(undefined);

  const filteredIssues = useMemo(() => {
    // Only count open issues
    const openStatuses = ["TODO", "IN PROGRESS", "NOT RESOLVED"];
    const baseIssues = issues.filter((issue) => openStatuses.includes(issue.issueStatus));

    if (!dateStart && !dateEnd) return baseIssues;
    return baseIssues.filter((issue) => {
      const d = parseSheetDate(issue.assignedDate);
      if (!d) return false;
      d.setHours(0, 0, 0, 0);

      if (dateStart) {
        const s = new Date(dateStart);
        s.setHours(0, 0, 0, 0);
        if (d < s) return false;
      }
      if (dateEnd) {
        const e = new Date(dateEnd);
        e.setHours(23, 59, 59, 999);
        if (d > e) return false;
      }
      return true;
    });
  }, [issues, dateStart, dateEnd]);

  const assignees = useMemo<AssigneeBreakdown[]>(() => {
    const map: Record<string, AssigneeBreakdown> = {};
    filteredIssues.forEach((issue) => {
      const name = issue.assignee || "Unassigned";
      if (!map[name]) {
        const byTab: Record<string, number> = {};
        tabsList.forEach((tab) => {
          byTab[tab] = 0;
        });
        map[name] = { assignee: name, total: 0, byTab };
      }
      map[name].total++;
      if (issue.sheetSource) {
        if (map[name].byTab[issue.sheetSource] === undefined) {
          map[name].byTab[issue.sheetSource] = 0;
        }
        map[name].byTab[issue.sheetSource]++;
      }
    });
    return Object.values(map).sort((a, b) => b.total - a.total);
  }, [filteredIssues, tabsList]);

  const hasDateFilter = !!(dateStart || dateEnd);

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
      {/* Section header with own date filter */}
      <div className="flex flex-wrap items-center gap-3">
        <Popover>
          <PopoverTrigger
            render={
              <Button
                variant="outline"
                className="h-9 text-xs bg-zinc-900/40 border-border/30 text-zinc-300 hover:text-white hover:bg-zinc-900/70 gap-2"
              >
                <Calendar className="h-3.5 w-3.5 text-zinc-500" />
                <span>Assigned Date</span>
                {hasDateFilter && <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />}
              </Button>
            }
          />
          <PopoverContent className="w-auto p-4 bg-zinc-950 border-border/40" align="start">
            <div className="space-y-4">
              <div className="flex flex-col gap-2">
                <span className="text-xs text-zinc-400 font-semibold">From</span>
                <CalendarComponent
                  mode="single"
                  selected={dateStart}
                  onSelect={setDateStart}
                  className="bg-zinc-900/40 rounded-md border border-border/20"
                />
              </div>
              <div className="flex flex-col gap-2">
                <span className="text-xs text-zinc-400 font-semibold">To</span>
                <CalendarComponent
                  mode="single"
                  selected={dateEnd}
                  onSelect={setDateEnd}
                  className="bg-zinc-900/40 rounded-md border border-border/20"
                />
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { setDateStart(undefined); setDateEnd(undefined); }}
                className="w-full text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
              >
                Clear
              </Button>
            </div>
          </PopoverContent>
        </Popover>

        {hasDateFilter && (
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-md text-xs font-medium text-indigo-300">
              {dateStart ? format(dateStart, "MMM d, yyyy") : "Any"}
              <span className="text-indigo-500/50">→</span>
              {dateEnd ? format(dateEnd, "MMM d, yyyy") : "Any"}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setDateStart(undefined); setDateEnd(undefined); }}
              className="h-9 text-xs text-zinc-400 hover:text-white hover:bg-zinc-900/50 gap-1"
            >
              <X className="h-3.5 w-3.5" />
              Clear
            </Button>
          </div>
        )}

        <span className="text-xs text-zinc-500 ml-auto">
          {assignees.length} assignee{assignees.length !== 1 ? "s" : ""}
          {hasDateFilter ? " (filtered)" : ""}
        </span>
      </div>

      {/* Assignee cards grid */}
      {assignees.length === 0 ? (
        <p className="text-sm text-zinc-500 py-4 text-center">No issues found for selected date range.</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {assignees.map((a) => (
            <Card
              key={a.assignee}
              onClick={() => {
                if (onCardClick) {
                  const assigneeIssues = filteredIssues.filter(
                    (issue) => (issue.assignee || "Unassigned") === a.assignee
                  );
                  onCardClick(a.assignee, assigneeIssues);
                }
              }}
              className={`border border-border/30 bg-zinc-900/30 transition-all duration-200 ${
                onCardClick ? "cursor-pointer hover:border-primary/40 hover:bg-zinc-900/50 hover:scale-[1.01]" : ""
              }`}
            >
              <CardContent className="p-4 flex flex-col gap-3">
                {/* Assignee name */}
                <p className="text-sm font-semibold text-white truncate" title={a.assignee}>
                  {a.assignee}
                </p>

                {/* Total */}
                <div className="flex items-end gap-1">
                  <span className="text-3xl font-bold text-white tabular-nums">{a.total}</span>
                  <span className="text-xs text-zinc-500 mb-1">issues</span>
                </div>

                {/* Dynamic tab breakdown */}
                {tabsList && tabsList.length > 0 && (
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 border-t border-border/10 pt-2 mt-auto text-[10px] text-zinc-400 font-mono">
                    {tabsList.slice(0, 3).map((tab, idx) => {
                      const colors = ["bg-indigo-400", "bg-teal-400", "bg-purple-400", "bg-pink-400", "bg-blue-400"];
                      const colorClass = colors[idx % colors.length];
                      return (
                        <div key={tab} className="flex items-center gap-1">
                          <span className={`h-1.5 w-1.5 rounded-full ${colorClass} shrink-0`} />
                          <span className="font-medium text-white">{a.byTab[tab] || 0}</span>
                          <span className="text-[9px] font-sans text-zinc-500 truncate max-w-[45px]" title={tab}>{tab}</span>
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

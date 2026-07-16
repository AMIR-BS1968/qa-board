"use client";

import { useMemo } from "react";
import { Issue, IssueStatus } from "@/features/dashboard/types";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ISSUE_STATUSES, STATUS_META_MAP } from "@/features/dashboard/constants";
import { Badge } from "@/components/ui/badge";

interface AssigneeStatusTableProps {
  issues: Issue[];
  loading?: boolean;
}

export function AssigneeStatusTable({ issues, loading = false }: AssigneeStatusTableProps) {
  // Extract unique assignees dynamically
  const assignees = useMemo(() => {
    const set = new Set<string>();
    issues.forEach(i => set.add(i.assignee || "Unassigned"));
    return Array.from(set).sort();
  }, [issues]);

  // Compute total issues per assignee for the bottom summary row
  const assigneeTotals = useMemo(() => {
    const map: Record<string, number> = {};
    assignees.forEach(a => map[a] = 0);
    issues.forEach(i => {
      const a = i.assignee || "Unassigned";
      if (map[a] !== undefined) map[a]++;
    });
    return map;
  }, [issues, assignees]);

  // Create lookup map for quick counting: map[status][assignee] = count
  const counts = useMemo(() => {
    const map: Record<string, Record<string, number>> = {};
    ISSUE_STATUSES.forEach(status => {
      map[status] = {};
      assignees.forEach(a => map[status][a] = 0);
    });

    issues.forEach(issue => {
      const status = issue.issueStatus || "TODO";
      const assignee = issue.assignee || "Unassigned";
      // ensure we capture the status in case there's an unexpected string
      if (!map[status]) map[status] = {};
      if (map[status][assignee] === undefined) map[status][assignee] = 0;
      
      map[status][assignee]++;
    });
    return map;
  }, [issues, assignees]);

  // If there are statuses in the data not present in ISSUE_STATUSES, we add them
  const allStatuses = useMemo(() => {
    const foundStatuses = new Set<string>(Object.keys(counts));
    // Sort them such that known statuses are first
    return Array.from(foundStatuses).sort((a, b) => {
      const aIdx = ISSUE_STATUSES.indexOf(a as IssueStatus);
      const bIdx = ISSUE_STATUSES.indexOf(b as IssueStatus);
      if (aIdx === -1 && bIdx === -1) return a.localeCompare(b);
      if (aIdx === -1) return 1;
      if (bIdx === -1) return -1;
      return aIdx - bIdx;
    });
  }, [counts]);

  if (loading) {
    return <Skeleton className="h-64 w-full bg-zinc-900/40 rounded-xl" />;
  }

  return (
    <div className="rounded-xl border border-border/30 overflow-hidden bg-zinc-900/20 backdrop-blur-sm h-full flex flex-col">
      <div className="p-4 border-b border-border/20 bg-zinc-900/40">
        <h3 className="text-sm font-semibold text-white">Assignee Status Breakdown</h3>
        <p className="text-xs text-zinc-500 mt-0.5">Status counts across all team members</p>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-zinc-950/40">
            <TableRow className="border-border/20 hover:bg-transparent">
              <TableHead className="font-semibold text-zinc-400 min-w-[160px]">Status</TableHead>
              {assignees.map((assignee) => (
                <TableHead key={assignee} className="font-semibold text-zinc-400 text-center whitespace-nowrap min-w-[100px]">
                  {assignee}
                </TableHead>
              ))}
              <TableHead className="font-bold text-zinc-300 text-center min-w-[80px]">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {allStatuses.map((status) => {
              const meta = STATUS_META_MAP[status as IssueStatus];
              let rowTotal = 0;
              
              return (
                <TableRow key={status} className="border-border/20 hover:bg-zinc-900/30">
                  <TableCell className="font-medium">
                    <Badge className={`px-2 py-0.5 text-[10px] font-semibold border ${meta?.bgClass || "bg-zinc-800 text-zinc-300 border-zinc-700"}`}>
                      <span className="h-1.5 w-1.5 rounded-full mr-1.5 shrink-0" style={{ backgroundColor: meta?.chartColor || "#71717a" }} />
                      {meta?.label || status}
                    </Badge>
                  </TableCell>
                  {assignees.map((assignee) => {
                    const count = counts[status][assignee] || 0;
                    rowTotal += count;
                    return (
                      <TableCell key={assignee} className="text-center">
                        {count > 0 ? (
                          <span className="font-semibold text-zinc-200">{count}</span>
                        ) : (
                          <span className="text-zinc-700">-</span>
                        )}
                      </TableCell>
                    );
                  })}
                  <TableCell className="text-center font-bold text-zinc-100 bg-zinc-900/20">
                    {rowTotal}
                  </TableCell>
                </TableRow>
              );
            })}
            
            {/* Bottom Total Row */}
            <TableRow className="border-t-2 border-border/40 hover:bg-zinc-900/40 bg-zinc-950/20">
              <TableCell className="font-bold text-zinc-300">Total</TableCell>
              {assignees.map((assignee) => {
                const total = assigneeTotals[assignee] || 0;
                return (
                  <TableCell key={assignee} className="text-center font-bold text-zinc-200">
                    {total > 0 ? total : "-"}
                  </TableCell>
                );
              })}
              <TableCell className="text-center font-black text-white bg-zinc-900/40">
                {issues.length}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

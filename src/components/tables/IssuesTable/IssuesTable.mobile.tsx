"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Calendar, User, Tag, Clock, ExternalLink } from "lucide-react";
import { Issue } from "@/features/dashboard/types";
import { STATUS_META_MAP } from "@/features/dashboard/constants";
import { IssuesTableProps } from "./IssuesTable.types";

export function IssuesTableMobile({ issues, loading = false }: IssuesTableProps) {
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);

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
            onClick={() => setSelectedIssue(issue)}
            className="border border-border/30 bg-zinc-950/20 active:bg-zinc-900/30 transition-all duration-200"
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
                  {issue.module} &rsaquo; {issue.feature}
                </span>
                <span className="font-semibold text-zinc-300">
                  {issue.assignee}
                </span>
              </div>
            </CardContent>
          </Card>
        );
      })}

      {/* Mobile Drawer Detail Sheet */}
      <Sheet open={!!selectedIssue} onOpenChange={(open) => !open && setSelectedIssue(null)}>
        {selectedIssue && (
          <SheetContent side="bottom" className="h-[80vh] rounded-t-2xl bg-zinc-950 border-t border-border/30 text-white overflow-y-auto p-5 outline-none">
            <SheetHeader className="pb-3 border-b border-border/20 text-left">
              <div className="flex items-center gap-1.5 mb-1.5">
                <Badge className={`px-2 py-0.5 text-[9px] font-semibold border ${STATUS_META_MAP[selectedIssue.issueStatus]?.bgClass || ""}`}>
                  {STATUS_META_MAP[selectedIssue.issueStatus]?.label || selectedIssue.issueStatus}
                </Badge>
                <Badge className={`px-2 py-0.5 text-[9px] font-semibold border ${selectedIssue.sheetSource === "App" ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/20" : "bg-teal-500/10 text-teal-400 border-teal-500/20"}`}>
                  {selectedIssue.sheetSource}
                </Badge>
                <span className="text-[9px] font-mono text-zinc-500 bg-zinc-900/60 px-1 rounded border border-border/20">Est: {selectedIssue.estimation || "—"}</span>
                <span className="text-[9px] font-mono text-zinc-500 bg-zinc-900/60 px-1 rounded border border-border/20">Spent: {selectedIssue.spentTime || "—"}</span>
              </div>
              <SheetTitle className="text-sm font-bold text-white leading-normal">
                {selectedIssue.issueTitle}
              </SheetTitle>
            </SheetHeader>

            <div className="py-4 space-y-5 text-left">
              {/* Context Summary Grid */}
              <div className="grid grid-cols-2 gap-3 bg-zinc-900/40 p-3 rounded-lg border border-border/10 text-[10px]">
                <div className="space-y-0.5">
                  <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider flex items-center gap-1">
                    <Tag className="h-2.5 w-2.5" />
                    Module
                  </span>
                  <p className="font-semibold text-zinc-200 truncate">{selectedIssue.module}</p>
                </div>
                <div className="space-y-0.5">
                  <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider flex items-center gap-1">
                    <User className="h-2.5 w-2.5" />
                    Reporter
                  </span>
                  <p className="font-semibold text-zinc-200 truncate">{selectedIssue.reportedBy || "—"}</p>
                </div>
                <div className="space-y-0.5">
                  <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider flex items-center gap-1">
                    <User className="h-2.5 w-2.5" />
                    Assignee
                  </span>
                  <p className="font-semibold text-zinc-200 truncate">{selectedIssue.assignee}</p>
                </div>
                <div className="space-y-0.5 pt-1.5 border-t border-border/10">
                  <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider flex items-center gap-1">
                    <Calendar className="h-2.5 w-2.5" />
                    Assigned
                  </span>
                  <p className="text-zinc-300 font-medium">{selectedIssue.assignedDate || "—"}</p>
                </div>
                <div className="space-y-0.5 pt-1.5 border-t border-border/10">
                  <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider flex items-center gap-1">
                    <Clock className="h-2.5 w-2.5" />
                    Resolved
                  </span>
                  <p className="text-zinc-300 font-medium">{selectedIssue.resolutionDate || "—"}</p>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1">
                <h5 className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Description</h5>
                <p className="text-xs text-zinc-300 leading-normal bg-zinc-900/10 p-2.5 rounded-lg border border-border/10 whitespace-pre-line">
                  {selectedIssue.issueDescription || "No description provided."}
                </p>
              </div>

              {/* Steps */}
              {selectedIssue.stepsToReproduce && (
                <div className="space-y-1">
                  <h5 className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Steps to Reproduce</h5>
                  <pre className="text-[10px] font-mono text-zinc-300 bg-zinc-900/60 p-3 rounded-lg border border-border/20 overflow-x-auto whitespace-pre-wrap leading-relaxed">
                    {selectedIssue.stepsToReproduce}
                  </pre>
                </div>
              )}

              {/* Dev Comments */}
              <div className="space-y-1">
                <h5 className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Developer Comments</h5>
                <div className="text-xs text-zinc-300 bg-zinc-900/20 p-2.5 rounded-lg border border-border/10">
                  {selectedIssue.devComments || <span className="text-zinc-600 italic">No developer comments yet.</span>}
                </div>
              </div>

              {/* QA Comments */}
              <div className="space-y-1">
                <h5 className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">QA Verification Comments</h5>
                <div className="text-xs text-zinc-300 bg-zinc-900/20 p-2.5 rounded-lg border border-border/10">
                  {selectedIssue.qaComments || <span className="text-zinc-600 italic">No QA comments yet.</span>}
                </div>
              </div>

              {/* Resources */}
              {selectedIssue.resources && (
                <div className="space-y-1 pt-1">
                  <h5 className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Resources</h5>
                  <a
                    href={selectedIssue.resources}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-indigo-400 font-semibold"
                  >
                    View Resource Link
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}
            </div>
          </SheetContent>
        )}
      </Sheet>
    </div>
  );
}

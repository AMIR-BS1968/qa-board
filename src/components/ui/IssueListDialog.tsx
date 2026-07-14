"use client";

import { useState, useEffect } from "react";
import { X, ChevronDown, ChevronUp, User, Tag, Layers, Clock } from "lucide-react";
import { Issue } from "@/features/dashboard/types";

interface IssueListDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  issues: Issue[];
}

export function IssueListDialog({ isOpen, onClose, title, issues }: IssueListDialogProps) {
  const [expandedIssueIndex, setExpandedIssueIndex] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const toggleExpand = (index: number) => {
    setExpandedIssueIndex(expandedIssueIndex === index ? null : index);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[85vh] bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-white">{title}</h2>
            <span className="px-2.5 py-0.5 text-xs font-semibold bg-zinc-800 text-zinc-400 rounded-full">
              {issues.length} {issues.length === 1 ? "issue" : "issues"}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-white bg-zinc-800/40 hover:bg-zinc-800 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {issues.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-zinc-500">
              <p className="text-sm">No issues found matching this metric.</p>
            </div>
          ) : (
            <div className="border border-zinc-850 rounded-xl overflow-hidden bg-zinc-950/20">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-zinc-900/60 text-xs font-bold text-zinc-400 border-b border-zinc-850">
                    <th className="px-4 py-3">Issue Title</th>
                    <th className="px-4 py-3 hidden md:table-cell">Module</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Assignee</th>
                    <th className="px-4 py-3 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-850 text-sm text-zinc-300">
                  {issues.map((issue, index) => {
                    const isExpanded = expandedIssueIndex === index;
                    return (
                      <React.Fragment key={index}>
                        <tr
                          onClick={() => toggleExpand(index)}
                          className="hover:bg-zinc-800/20 cursor-pointer transition"
                        >
                          <td className="px-4 py-3 font-semibold text-white max-w-xs truncate">
                            {issue.issueTitle || "(No Title)"}
                          </td>
                          <td className="px-4 py-3 hidden md:table-cell text-zinc-400">
                            {issue.module || "-"}
                          </td>
                          <td className="px-4 py-3">
                            <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full bg-zinc-800 text-zinc-300">
                              {issue.issueStatus || "TODO"}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-zinc-400">
                            {issue.assignee || "Unassigned"}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4 text-zinc-500" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-zinc-500" />
                            )}
                          </td>
                        </tr>

                        {isExpanded && (
                          <tr className="bg-zinc-900/40">
                            <td colSpan={5} className="px-6 py-4 space-y-4 text-sm border-t border-zinc-850">
                              {/* Details */}
                              {issue.issueDescription && (
                                <div>
                                  <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1">
                                    Description
                                  </h4>
                                  <p className="text-zinc-300 whitespace-pre-line bg-zinc-950/40 p-3 rounded-lg border border-zinc-850/60">
                                    {issue.issueDescription}
                                  </p>
                                </div>
                              )}

                              {issue.stepsToReproduce && (
                                <div>
                                  <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1">
                                    Steps to Reproduce
                                  </h4>
                                  <p className="text-zinc-300 whitespace-pre-line bg-zinc-950/40 p-3 rounded-lg border border-zinc-850/60">
                                    {issue.stepsToReproduce}
                                  </p>
                                </div>
                              )}

                              {/* Attributes Info Grid */}
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                                <div>
                                  <div className="text-zinc-500 font-bold uppercase mb-1">Reporter</div>
                                  <div className="text-zinc-300 flex items-center gap-1.5">
                                    <User className="w-3.5 h-3.5 text-zinc-500" />
                                    {issue.reportedBy || "-"}
                                  </div>
                                </div>
                                <div>
                                  <div className="text-zinc-500 font-bold uppercase mb-1">Feature</div>
                                  <div className="text-zinc-300 flex items-center gap-1.5">
                                    <Layers className="w-3.5 h-3.5 text-zinc-500" />
                                    {issue.feature || "-"}
                                  </div>
                                </div>
                                <div>
                                  <div className="text-zinc-500 font-bold uppercase mb-1">Estimation</div>
                                  <div className="text-zinc-300 flex items-center gap-1.5">
                                    <Clock className="w-3.5 h-3.5 text-zinc-500" />
                                    {issue.estimation || "0h"}
                                  </div>
                                </div>
                                <div>
                                  <div className="text-zinc-500 font-bold uppercase mb-1">Spent Time</div>
                                  <div className="text-zinc-300 flex items-center gap-1.5">
                                    <Clock className="w-3.5 h-3.5 text-zinc-500" />
                                    {issue.spentTime || "0h"}
                                  </div>
                                </div>
                              </div>

                              {/* Comments Section */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {issue.devComments && (
                                  <div className="p-3 bg-blue-950/10 border border-blue-900/30 rounded-lg">
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-blue-400 mb-1">
                                      Developer Comments
                                    </h4>
                                    <p className="text-xs text-zinc-300 whitespace-pre-line">{issue.devComments}</p>
                                  </div>
                                )}
                                {issue.qaComments && (
                                  <div className="p-3 bg-amber-950/10 border border-amber-900/30 rounded-lg">
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-1">
                                      QA/Tester Comments
                                    </h4>
                                    <p className="text-xs text-zinc-300 whitespace-pre-line">{issue.qaComments}</p>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-zinc-800 bg-zinc-950/20 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-zinc-400 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-850 rounded-xl transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// Add React import dynamically if not present
import React from "react";

"use client";

import { Eye } from "lucide-react";

interface MetricItem {
  key: string;
  label: string;
  required: string[];
}

interface MetricTogglesTabProps {
  tabsList: string[];
  columnMappings: Record<string, Record<string, number>>;
  metricVisibilities: Record<string, boolean>;
  handleMetricToggle: (key: string) => void;
}

export function MetricTogglesTab({
  tabsList,
  columnMappings,
  metricVisibilities,
  handleMetricToggle,
}: MetricTogglesTabProps) {
  const metrics: MetricItem[] = [
    { key: "openIssues", label: "Open Issues Metric", required: ["issueStatus"] },
    { key: "fixedIssues", label: "Fixed Issues Metric", required: ["issueStatus"] },
    { key: "inQaIssues", label: "In QA Issues Metric", required: ["issueStatus"] },
    { key: "issuesByAssignee", label: "Issues by Assignee Cards", required: ["issueStatus", "assignee"] },
    { key: "fixedDeployed", label: "Fixed & Deployed Metric", required: ["issueStatus"] },
    { key: "resolvedIssues", label: "Resolved Issues Metric", required: ["issueStatus"] },
    { key: "workloadEstimation", label: "Workload Estimation Cards", required: ["issueStatus", "estimation"] },
    { key: "todayWorkload", label: "Today's Workload Estimate", required: ["issueStatus", "estimation", "assignedDate"] },
    { key: "issuesByStatus", label: "Issues by Status Chart", required: ["issueStatus"] },
    { key: "openIssuesByAssignee", label: "Open Issues by Assignee Chart", required: ["issueStatus", "assignee"] },
    { key: "assigneeStatusTable", label: "Assignee Status Grid", required: ["issueStatus", "assignee"] },
    { key: "issuesByModule", label: "Issues by Module Chart", required: ["module"] },
    { key: "issuesReportedBy", label: "Issues Reported By Card", required: ["reportedBy", "issueStatus"] },
    { key: "issueTable", label: "Issues Table View", required: ["issueTitle", "issueStatus"] },
    { key: "kanbanBoard", label: "Kanban Board View", required: ["issueTitle", "issueStatus"] },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 border-b border-zinc-900/60 pb-3">
        <Eye className="h-4 w-4 text-blue-400" />
        <h3 className="text-xs font-bold text-white uppercase tracking-wider">Metrics Visibility Toggles</h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {metrics.map((m) => {
          const enabled = metricVisibilities[m.key] !== false;

          // Simple logic to verify if dependent fields are mapped in at least one tab
          const isMappedInAllTabs = tabsList.every((tab) => {
            const tabMap = columnMappings[tab] || {};
            return m.required.every((field) => tabMap[field] !== undefined && tabMap[field] >= 0);
          });

          return (
            <div
              key={m.key}
              className={`p-3.5 bg-zinc-900/10 border border-zinc-900 rounded-xl flex items-start justify-between gap-4 transition ${
                !isMappedInAllTabs ? "opacity-50" : ""
              }`}
            >
              <div className="space-y-1">
                <span className="text-xs font-bold text-white block">{m.label}</span>
                <span className="text-[10px] text-zinc-500 font-medium block leading-tight">
                  Requires: {m.required.join(", ")}
                </span>
                {!isMappedInAllTabs && (
                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[8px] bg-rose-950/20 text-rose-400 border border-rose-500/20 font-bold uppercase mt-1">
                    Missing dependencies
                  </span>
                )}
              </div>

              <div className="flex items-center h-full">
                <input
                  type="checkbox"
                  checked={enabled && isMappedInAllTabs}
                  disabled={!isMappedInAllTabs}
                  onChange={() => handleMetricToggle(m.key)}
                  className="w-4 h-4 bg-zinc-950 border border-zinc-850 rounded text-blue-500 focus:ring-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

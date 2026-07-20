"use client";

import { useState, useEffect, useMemo } from "react";
import { useIssues } from "../../hooks/useIssues";
import { calculateMetrics } from "../../analytics/engine";
import { useIsMobile } from "@/hooks/useIsMobile";
import { MetricCard, MetricCardMobile } from "../metrics/MetricCard";
import { IssueListDialog } from "@/components/ui/IssueListDialog";
import { getTodayString } from "../../analytics/engine";
import { EstimationCardsSection } from "../metrics/EstimationCardsSection/EstimationCardsSection";
import { AssigneeCards } from "../assignee/AssigneeCards/AssigneeCards";
import { ReporterCards } from "../reporter/ReporterCards/ReporterCards";
import { AssigneeStatusTable } from "../assignee/AssigneeStatusTable/AssigneeStatusTable";
import { TodayWorkloadCard } from "../assignee/TodayWorkloadCard/TodayWorkloadCard";
import { ModuleCharts } from "../modules/ModuleList/ModuleList";
import { Button } from "@/components/ui/button";
import { RefreshCw, Bug, ShieldCheck, CircleDot, Archive, HelpCircle, Folder, Settings, LayoutGrid, CheckCircle2, ChevronDown } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";

export function DashboardContainer({
  slug = "default",
}: {
  slug?: string;
}) {
  const {
    rawIssues,
    isLoading,
    lastSynced,
    refetch,
    projectConfig,
    roles,
  } = useIssues(slug);

  const isMobile = useIsMobile();
  const isOwnerOrManager = roles.includes("OWNER") || roles.includes("MANAGER");

  // Dialog state for card drill-down lists
  const [activeMetricDialog, setActiveMetricDialog] = useState<{
    isOpen: boolean;
    title: string;
    issues: any[];
  }>({
    isOpen: false,
    title: "",
    issues: [],
  });

  // Assignee View Filter state (null represents default - all selected)
  const [selectedAssignees, setSelectedAssignees] = useState<string[] | null>(null);
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false);
  const [filterSearch, setFilterSearch] = useState("");

  const tabsList = projectConfig?.sheetConfigs?.[0]?.selectedTabs || ["Admin", "App"];
  const statusConfigs = projectConfig?.statusConfigs || [];

  // Extract unique assignee names for the dropdown filter
  const uniqueAssignees = useMemo(() => {
    const set = new Set<string>();
    rawIssues.forEach((issue) => {
      set.add(issue.assignee || "(Unassigned)");
    });
    return Array.from(set).sort();
  }, [rawIssues]);

  // Derive filtered issues for dashboard stats
  const dashboardIssues = useMemo(() => {
    return rawIssues.filter((i) => {
      const name = i.assignee || "(Unassigned)";
      if (selectedAssignees === null) return true;
      return selectedAssignees.includes(name);
    });
  }, [rawIssues, selectedAssignees]);

  // Recalculate metrics locally based on the selected assignee view
  const metrics = useMemo(() => {
    return calculateMetrics(dashboardIssues, tabsList, statusConfigs);
  }, [dashboardIssues, tabsList, statusConfigs]);

  const getCategoryStatusesStr = (category: string) => {
    const matched = statusConfigs.filter((s: any) => s.category === category);
    if (matched.length === 0) {
      if (category === "open") return "TODO, IN PROGRESS, NOT RESOLVED";
      if (category === "closed") return "RESOLVED";
      if (category === "fixed") return "FIXED";
      if (category === "qa") return "IN QA";
    }
    return matched.map((s: any) => s.displayLabel).join(", ");
  };

  const getCategoryStatusValues = (category: string, defaultVals: string[]) => {
    const matched = statusConfigs.filter((s: any) => s.category === category);
    return matched.length > 0 ? matched.map((s: any) => s.statusValue) : defaultVals;
  };

  const openList = getCategoryStatusValues("open", ["TODO", "IN PROGRESS", "NOT RESOLVED"]);
  const closedList = getCategoryStatusValues("closed", ["RESOLVED"]);
  const fixedList = getCategoryStatusValues("fixed", ["FIXED"]);
  const qaList = getCategoryStatusValues("qa", ["IN QA"]);

  const getBreakdown = (breakdownObj: any) => {
    if (!breakdownObj || !breakdownObj.byTab) return [];
    return Object.entries(breakdownObj.byTab).map(([tab, value]) => ({
      label: tab,
      value: value as number,
    }));
  };

  // Helper function to query list issues on card clicks
  const openMetricIssues = (title: string, predicate: (issue: any) => boolean) => {
    const list = dashboardIssues.filter(predicate);
    setActiveMetricDialog({
      isOpen: true,
      title,
      issues: list,
    });
  };

  const syncTimeStr = lastSynced
    ? `Synced ${formatDistanceToNow(lastSynced, { addSuffix: true })}`
    : "Not synced";

  return (
    <div className="flex-1 w-full min-h-screen flex flex-col bg-zinc-950 pb-16 text-zinc-300">
      {/* Header section with inline action bars */}
      <header className="sticky top-0 z-30 w-full border-b border-zinc-800/40 bg-zinc-950/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-zinc-900 border border-zinc-800 text-blue-500">
                <Bug className="h-4 w-4" />
              </div>
              <span className="text-sm font-black text-white sm:inline-block">
                {projectConfig?.name || "QA Board"}
              </span>
            </div>

            <div className="hidden md:flex items-center gap-4 text-xs font-semibold text-zinc-400">
              <Link href="/projects" className="flex items-center gap-1 hover:text-white transition">
                <Folder className="h-3.5 w-3.5" />
                <span>Projects</span>
              </Link>
              <div className="w-px h-3.5 bg-zinc-800" />
              <Link href={`/p/${slug}`} className="flex items-center gap-1 text-blue-400">
                <LayoutGrid className="h-3.5 w-3.5" />
                <span>Dashboard</span>
              </Link>
              <Link href={`/p/${slug}/issues`} className="flex items-center gap-1 hover:text-white transition">
                <Bug className="h-3.5 w-3.5" />
                <span>Issues</span>
              </Link>
              <Link href={`/p/${slug}/board`} className="flex items-center gap-1 hover:text-white transition">
                <LayoutGrid className="h-3.5 w-3.5 rotate-45" />
                <span>Kanban Board</span>
              </Link>
              {isOwnerOrManager && (
                <Link href={`/p/${slug}/settings`} className="flex items-center gap-1 hover:text-white transition">
                  <Settings className="h-3.5 w-3.5" />
                  <span>Settings</span>
                </Link>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[10px] sm:text-xs text-zinc-500 font-medium font-mono">
              {syncTimeStr}
            </span>
            <Button
              onClick={() => refetch()}
              disabled={isLoading}
              variant="outline"
              size="sm"
              className="h-8 text-xs bg-zinc-900 border-zinc-850 hover:bg-zinc-850 hover:border-zinc-800 text-white font-bold px-3 rounded-lg flex items-center gap-1.5 active:scale-[0.98] transition cursor-pointer"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
              <span className="text-xs hidden sm:inline">Sync Data</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full px-4 sm:px-6 lg:px-8 pt-8 space-y-10">

        {/* Assignee Filter Dropdown */}
        <div className="relative flex flex-col sm:flex-row sm:items-center gap-3 bg-zinc-900/40 border border-zinc-800/40 p-4 rounded-2xl max-w-md">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
              Filter by Assignees:
            </span>
          </div>

          <div className="relative flex-1">
            {/* Popover trigger button */}
            <button
              type="button"
              onClick={() => setFilterDropdownOpen(!filterDropdownOpen)}
              className="w-full h-9 bg-zinc-950 border border-zinc-850 hover:border-zinc-800 text-xs font-semibold text-white px-3 rounded-xl flex items-center justify-between transition cursor-pointer select-none active:scale-[0.99]"
            >
              <span className="truncate">
                {selectedAssignees === null || selectedAssignees.length === uniqueAssignees.length
                  ? "All Selected"
                  : selectedAssignees.length === 0
                  ? "None Selected"
                  : selectedAssignees.length <= 2
                  ? selectedAssignees.join(", ")
                  : `${selectedAssignees.length} Selected`}
              </span>
              <ChevronDown className="h-4 w-4 text-zinc-400 ml-1 shrink-0" />
            </button>

            {/* Click-outside backdrop */}
            {filterDropdownOpen && (
              <div
                className="fixed inset-0 z-40"
                onClick={() => setFilterDropdownOpen(false)}
              />
            )}

            {/* Popover content */}
            {filterDropdownOpen && (
              <div className="absolute left-0 right-0 mt-2 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-xl z-50 p-3 space-y-2.5 animate-in fade-in slide-in-from-top-1 duration-150">
                {/* Search & Actions Bar */}
                <div className="flex items-center justify-between gap-2 border-b border-zinc-800 pb-2">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedAssignees(null)}
                      className="text-[10px] uppercase font-black text-blue-400 hover:text-blue-300 transition cursor-pointer"
                    >
                      Select All
                    </button>
                    <span className="text-zinc-700 text-[10px]">|</span>
                    <button
                      type="button"
                      onClick={() => setSelectedAssignees([])}
                      className="text-[10px] uppercase font-black text-zinc-500 hover:text-zinc-300 transition cursor-pointer"
                    >
                      Clear All
                    </button>
                  </div>
                  <span className="text-[10px] font-mono text-zinc-500">
                    {selectedAssignees === null
                      ? uniqueAssignees.length
                      : selectedAssignees.length}{" "}
                    / {uniqueAssignees.length}
                  </span>
                </div>

                {/* Search input field */}
                <input
                  type="text"
                  placeholder="Search assignees..."
                  value={filterSearch}
                  onChange={(e) => setFilterSearch(e.target.value)}
                  className="w-full h-8 bg-zinc-950 border border-zinc-850 focus:border-zinc-800 rounded-lg text-xs px-2.5 text-white placeholder-zinc-600 focus:outline-none transition"
                />

                {/* Checklist options list */}
                <div className="max-h-48 overflow-y-auto pr-1 space-y-1 scrollbar-thin select-none">
                  {uniqueAssignees
                    .filter((assignee) =>
                      assignee.toLowerCase().includes(filterSearch.toLowerCase())
                    )
                    .map((assignee) => {
                      const isChecked =
                        selectedAssignees === null ||
                        selectedAssignees.includes(assignee);
                      return (
                        <label
                          key={assignee}
                          className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-zinc-950/60 cursor-pointer text-xs font-semibold text-zinc-300 hover:text-white transition"
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              const currentSelected =
                                selectedAssignees === null
                                  ? uniqueAssignees
                                  : selectedAssignees;
                              if (currentSelected.includes(assignee)) {
                                const next = currentSelected.filter(
                                  (item) => item !== assignee
                                );
                                setSelectedAssignees(next);
                              } else {
                                const next = [...currentSelected, assignee];
                                // If we just selected everything, we can restore null representation
                                if (next.length === uniqueAssignees.length) {
                                  setSelectedAssignees(null);
                                } else {
                                  setSelectedAssignees(next);
                                }
                              }
                            }}
                            className="h-3.5 w-3.5 rounded border-zinc-850 bg-zinc-950 text-blue-500 focus:ring-0 focus:ring-offset-0 cursor-pointer accent-blue-500"
                          />
                          <span className="truncate">{assignee}</span>
                        </label>
                      );
                    })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 1. KPI Cards */}
        <section className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
          {isMobile ? (
            <>
              <MetricCardMobile
                label="Today's Found"
                value={metrics.todayFoundCount.total}
                tabBreakdown={getBreakdown(metrics.todayFoundCount)}
                loading={isLoading}
                icon={<Bug className="h-4 w-4" />}
                description="New tickets logged today"
                onClick={() => openMetricIssues("Today's Found Issues", (issue) => issue.assignedDate === getTodayString())}
              />
              <MetricCardMobile
                label="Today's Resolved"
                value={metrics.todayResolvedCount.total}
                tabBreakdown={getBreakdown(metrics.todayResolvedCount)}
                loading={isLoading}
                icon={<ShieldCheck className="h-4 w-4" />}
                description={getCategoryStatusesStr("closed") ? `Status: ${getCategoryStatusesStr("closed")}` : "Resolved today"}
                onClick={() => openMetricIssues("Today's Resolved Issues", (issue) => issue.resolutionDate === getTodayString() && closedList.includes(issue.issueStatus))}
              />
              <MetricCardMobile
                label="Open Issues"
                value={metrics.totalOpenCount.total}
                tabBreakdown={getBreakdown(metrics.totalOpenCount)}
                loading={isLoading}
                icon={<CircleDot className="h-4 w-4" />}
                description={getCategoryStatusesStr("open") ? `Status: ${getCategoryStatusesStr("open")}` : "Currently open"}
                onClick={() => openMetricIssues("Total Open Issues", (issue) => openList.includes(issue.issueStatus))}
              />
              <MetricCardMobile
                label="Fixed Issues"
                value={metrics.awaitingDeploymentCount.total}
                tabBreakdown={getBreakdown(metrics.awaitingDeploymentCount)}
                loading={isLoading}
                icon={<Archive className="h-4 w-4" />}
                description={getCategoryStatusesStr("fixed") ? `Status: ${getCategoryStatusesStr("fixed")}` : "Awaiting deployment"}
                onClick={() => openMetricIssues("Fixed Issues", (issue) => fixedList.includes(issue.issueStatus))}
              />
              <MetricCardMobile
                label="Total Resolved"
                value={metrics.totalClosedCount.total}
                tabBreakdown={getBreakdown(metrics.totalClosedCount)}
                loading={isLoading}
                icon={<CheckCircle2 className="h-4 w-4" />}
                description={getCategoryStatusesStr("closed") ? `Status: ${getCategoryStatusesStr("closed")}` : "Resolved issues"}
                onClick={() => openMetricIssues("Total Resolved Issues", (issue) => closedList.includes(issue.issueStatus))}
              />
              <MetricCardMobile
                label="In QA"
                value={metrics.qaBottleneckCount.total}
                tabBreakdown={getBreakdown(metrics.qaBottleneckCount)}
                loading={isLoading}
                icon={<HelpCircle className="h-4 w-4" />}
                description={getCategoryStatusesStr("qa") ? `Status: ${getCategoryStatusesStr("qa")}` : "Testing ongoing"}
                onClick={() => openMetricIssues("In QA Issues", (issue) => qaList.includes(issue.issueStatus))}
              />
            </>
          ) : (
            <>
              <MetricCard
                label="Today's Found"
                value={metrics.todayFoundCount.total}
                tabBreakdown={getBreakdown(metrics.todayFoundCount)}
                loading={isLoading}
                icon={<Bug className="h-5 w-5" />}
                description="Tickets logged today"
                onClick={() => openMetricIssues("Today's Found Issues", (issue) => issue.assignedDate === getTodayString())}
              />
              <MetricCard
                label="Today's Resolved"
                value={metrics.todayResolvedCount.total}
                tabBreakdown={getBreakdown(metrics.todayResolvedCount)}
                loading={isLoading}
                icon={<ShieldCheck className="h-5 w-5" />}
                description={getCategoryStatusesStr("closed") ? `Status: ${getCategoryStatusesStr("closed")}` : "Fixed/Resolved today"}
                onClick={() => openMetricIssues("Today's Resolved Issues", (issue) => issue.resolutionDate === getTodayString() && closedList.includes(issue.issueStatus))}
              />
              <MetricCard
                label="Open Issues"
                value={metrics.totalOpenCount.total}
                tabBreakdown={getBreakdown(metrics.totalOpenCount)}
                loading={isLoading}
                icon={<CircleDot className="h-5 w-5" />}
                description={getCategoryStatusesStr("open") ? `Status: ${getCategoryStatusesStr("open")}` : "Issues currently unresolved"}
                onClick={() => openMetricIssues("Total Open Issues", (issue) => openList.includes(issue.issueStatus))}
              />
              <MetricCard
                label="Fixed Issues"
                value={metrics.awaitingDeploymentCount.total}
                tabBreakdown={getBreakdown(metrics.awaitingDeploymentCount)}
                loading={isLoading}
                icon={<Archive className="h-5 w-5" />}
                description={getCategoryStatusesStr("fixed") ? `Status: ${getCategoryStatusesStr("fixed")}` : "Awaiting deployment"}
                onClick={() => openMetricIssues("Fixed Issues", (issue) => fixedList.includes(issue.issueStatus))}
              />
              <MetricCard
                label="Total Resolved"
                value={metrics.totalClosedCount.total}
                tabBreakdown={getBreakdown(metrics.totalClosedCount)}
                loading={isLoading}
                icon={<CheckCircle2 className="h-5 w-5" />}
                description={getCategoryStatusesStr("closed") ? `Status: ${getCategoryStatusesStr("closed")}` : "Resolved/Closed issues"}
                onClick={() => openMetricIssues("Total Resolved Issues", (issue) => closedList.includes(issue.issueStatus))}
              />
              <MetricCard
                label="In QA"
                value={metrics.qaBottleneckCount.total}
                tabBreakdown={getBreakdown(metrics.qaBottleneckCount)}
                loading={isLoading}
                icon={<HelpCircle className="h-5 w-5" />}
                description={getCategoryStatusesStr("qa") ? `Status: ${getCategoryStatusesStr("qa")}` : "Issues under QA verification"}
                onClick={() => openMetricIssues("In QA Issues", (issue) => qaList.includes(issue.issueStatus))}
              />
            </>
          )}
        </section>

        {/* 1.5. Estimation Cards Section */}
        <section className="space-y-4">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-500">
              Workload & Estimation Metrics
            </h2>
            <p className="text-xs text-zinc-600 mt-0.5">
              Comparison between estimated time and spent time across sheet sources
            </p>
          </div>
          <EstimationCardsSection issues={dashboardIssues} loading={isLoading} />
        </section>

        {/* 1.8. Issues by Reporter */}
        <section className="space-y-4">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-500">
              Issues by Reporter
            </h2>
            <p className="text-xs text-zinc-600 mt-0.5">
              Reporting distribution per team member and client
            </p>
          </div>
          <ReporterCards
            issues={dashboardIssues}
            loading={isLoading}
            tabsList={tabsList}
            onCardClick={(name, filtered) => {
              setActiveMetricDialog({
                isOpen: true,
                title: `Issues Reported By: ${name}`,
                issues: filtered,
              });
            }}
          />
        </section>

        {/* 2. Issues by Assignee */}
        <section className="space-y-4">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-500">
              Open Issues by Assignee
            </h2>
            <p className="text-xs text-zinc-600 mt-0.5">
              Total and dynamic tab breakdown per team member
            </p>
          </div>
          <AssigneeCards
            issues={dashboardIssues}
            loading={isLoading}
            tabsList={tabsList}
            onCardClick={(name, filtered) => {
              setActiveMetricDialog({
                isOpen: true,
                title: `Open Issues for: ${name}`,
                issues: filtered,
              });
            }}
          />
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 pt-2">
            <div className="lg:col-span-3">
              <AssigneeStatusTable issues={dashboardIssues} loading={isLoading} />
            </div>
            <div className="lg:col-span-1 min-h-[300px]">
              <TodayWorkloadCard issues={dashboardIssues} loading={isLoading} />
            </div>
          </div>
        </section>

        {/* 3. Problem Areas by Module */}
        <section className="space-y-4">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-500">
              Problem Areas by Module
            </h2>
            <p className="text-xs text-zinc-600 mt-0.5">
              Modules ranked by total issue count
            </p>
          </div>
          <ModuleCharts metrics={metrics} loading={isLoading} />
        </section>

      </main>

      {/* Drill-down Dialog */}
      <IssueListDialog
        isOpen={activeMetricDialog.isOpen}
        onClose={() => setActiveMetricDialog({ ...activeMetricDialog, isOpen: false })}
        title={activeMetricDialog.title}
        issues={activeMetricDialog.issues}
      />
    </div>
  );
}

"use client";

import { useState } from "react";
import { useIssues } from "../../hooks/useIssues";
import { useIsMobile } from "@/hooks/useIsMobile";
import { MetricCard, MetricCardMobile } from "@/components/metrics/MetricCard";
import { IssueListDialog } from "@/components/ui/IssueListDialog";
import { getTodayString } from "../../analytics/engine";
import { EstimationCardsSection } from "@/components/metrics/EstimationCardsSection/EstimationCardsSection";
import { Filters, FiltersMobile } from "@/components/filters/Filters";
import { IssuesTable, IssuesTableMobile } from "@/components/tables/IssuesTable";
import { AssigneeCards } from "@/components/assignee/AssigneeCards/AssigneeCards";
import { ReporterCards } from "@/components/reporter/ReporterCards/ReporterCards";
import { AssigneeStatusTable } from "@/components/assignee/AssigneeStatusTable/AssigneeStatusTable";
import { TodayWorkloadCard } from "@/components/assignee/TodayWorkloadCard/TodayWorkloadCard";
import { ModuleCharts } from "@/components/modules/ModuleList/ModuleList";
import { Button } from "@/components/ui/button";
import { RefreshCw, Bug, ShieldCheck, CircleDot, Archive, HelpCircle, Folder, Settings, LayoutGrid } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";

export function DashboardContainer({ slug = "default" }: { slug?: string }) {
  const {
    rawIssues,
    filteredIssues,
    metrics,
    filterOptions,
    filters,
    setFilters,
    resetFilters,
    isLoading,
    refetch,
    lastSynced,
  } = useIssues(slug);

  const isMobile = useIsMobile(768);

  const [activeMetricDialog, setActiveMetricDialog] = useState<{
    isOpen: boolean;
    title: string;
    issues: any[];
  }>({
    isOpen: false,
    title: "",
    issues: [],
  });

  const openMetricIssues = (title: string, filterFn: (issue: any) => boolean) => {
    setActiveMetricDialog({
      isOpen: true,
      title,
      issues: rawIssues.filter(filterFn),
    });
  };

  const syncTimeStr = lastSynced
    ? `Synced ${formatDistanceToNow(lastSynced, { addSuffix: true })}`
    : "Not synced";

  return (
    <div className="flex-1 w-full min-h-screen flex flex-col bg-zinc-950 pb-16">
      {/* Navbar */}
      <header className="sticky top-0 z-30 w-full border-b border-border/40 bg-zinc-950/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-zinc-900 border border-zinc-800 text-blue-500">
                <Bug className="h-4 w-4" />
              </div>
              <span className="text-sm font-black text-white hidden sm:inline-block">QA Board</span>
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
              <Link href={`/p/${slug}/board`} className="flex items-center gap-1 hover:text-white transition">
                <LayoutGrid className="h-3.5 w-3.5 rotate-45" />
                <span>Kanban Board</span>
              </Link>
              <Link href={`/p/${slug}/settings`} className="flex items-center gap-1 hover:text-white transition">
                <Settings className="h-3.5 w-3.5" />
                <span>Settings</span>
              </Link>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[10px] sm:text-xs text-zinc-500 font-medium font-mono">
              {syncTimeStr}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={refetch}
              disabled={isLoading}
              className="h-8 bg-zinc-900/40 border-border/30 text-zinc-300 hover:text-white hover:bg-zinc-900/80 gap-1.5 shadow-sm active:bg-zinc-900"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin text-primary" : "text-zinc-400"}`} />
              <span className="text-xs hidden sm:inline">Sync Data</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-10">

        {/* 1. KPI Cards */}
        <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {isMobile ? (
            <>
              <MetricCardMobile
                label="Today's Found"
                value={metrics.todayFoundCount.total}
                appValue={metrics.todayFoundCount.app}
                adminValue={metrics.todayFoundCount.admin}
                loading={isLoading}
                icon={<Bug className="h-4 w-4" />}
                description="New tickets logged today"
                onClick={() => openMetricIssues("Today's Found Issues", (issue) => issue.assignedDate === getTodayString())}
              />
              <MetricCardMobile
                label="Today's Resolved"
                value={metrics.todayResolvedCount.total}
                appValue={metrics.todayResolvedCount.app}
                adminValue={metrics.todayResolvedCount.admin}
                loading={isLoading}
                icon={<ShieldCheck className="h-4 w-4" />}
                description="Fixed/Resolved today"
                onClick={() => openMetricIssues("Today's Resolved Issues", (issue) => issue.resolutionDate === getTodayString() && issue.issueStatus === "RESOLVED")}
              />
              <MetricCardMobile
                label="Open Issues"
                value={metrics.totalOpenCount.total}
                appValue={metrics.totalOpenCount.app}
                adminValue={metrics.totalOpenCount.admin}
                loading={isLoading}
                icon={<CircleDot className="h-4 w-4" />}
                description="Needs development"
                onClick={() => openMetricIssues("Open Issues", (issue) => ["TODO", "IN PROGRESS", "NOT RESOLVED"].includes(issue.issueStatus))}
              />
              <MetricCardMobile
                label="Fixed and Deployed"
                value={metrics.awaitingDeploymentCount.total}
                appValue={metrics.awaitingDeploymentCount.app}
                adminValue={metrics.awaitingDeploymentCount.admin}
                loading={isLoading}
                icon={<Archive className="h-4 w-4 text-emerald-400" />}
                description="Status is FIXED"
                onClick={() => openMetricIssues("Fixed and Deployed Issues", (issue) => issue.issueStatus === "FIXED")}
              />
              <MetricCardMobile
                label="Resolved Issues"
                value={metrics.totalClosedCount.total}
                appValue={metrics.totalClosedCount.app}
                adminValue={metrics.totalClosedCount.admin}
                loading={isLoading}
                icon={<Archive className="h-4 w-4" />}
                description="Status is RESOLVED"
                onClick={() => openMetricIssues("Resolved Issues", (issue) => issue.issueStatus === "RESOLVED")}
              />
              <div className="col-span-2">
                <MetricCardMobile
                  label="In QA"
                  value={metrics.qaBottleneckCount.total}
                  appValue={metrics.qaBottleneckCount.app}
                  adminValue={metrics.qaBottleneckCount.admin}
                  loading={isLoading}
                  icon={<HelpCircle className="h-4 w-4" />}
                  description="Testing ongoing"
                  onClick={() => openMetricIssues("In QA Issues", (issue) => issue.issueStatus === "IN QA")}
                />
              </div>
            </>
          ) : (
            <>
              <MetricCard
                label="Today's Found"
                value={metrics.todayFoundCount.total}
                appValue={metrics.todayFoundCount.app}
                adminValue={metrics.todayFoundCount.admin}
                loading={isLoading}
                icon={<Bug className="h-5 w-5" />}
                description="Tickets logged today"
                onClick={() => openMetricIssues("Today's Found Issues", (issue) => issue.assignedDate === getTodayString())}
              />
              <MetricCard
                label="Today's Resolved"
                value={metrics.todayResolvedCount.total}
                appValue={metrics.todayResolvedCount.app}
                adminValue={metrics.todayResolvedCount.admin}
                loading={isLoading}
                icon={<ShieldCheck className="h-5 w-5" />}
                description="Fixed/Resolved today"
                onClick={() => openMetricIssues("Today's Resolved Issues", (issue) => issue.resolutionDate === getTodayString() && issue.issueStatus === "RESOLVED")}
              />
              <MetricCard
                label="Open Issues"
                value={metrics.totalOpenCount.total}
                appValue={metrics.totalOpenCount.app}
                adminValue={metrics.totalOpenCount.admin}
                loading={isLoading}
                icon={<CircleDot className="h-5 w-5" />}
                description="Needs development"
                onClick={() => openMetricIssues("Open Issues", (issue) => ["TODO", "IN PROGRESS", "NOT RESOLVED"].includes(issue.issueStatus))}
              />
              <MetricCard
                label="Fixed and Deployed"
                value={metrics.awaitingDeploymentCount.total}
                appValue={metrics.awaitingDeploymentCount.app}
                adminValue={metrics.awaitingDeploymentCount.admin}
                loading={isLoading}
                icon={<Archive className="h-5 w-5 text-emerald-400" />}
                description="Status is FIXED"
                onClick={() => openMetricIssues("Fixed and Deployed Issues", (issue) => issue.issueStatus === "FIXED")}
              />
              <MetricCard
                label="Resolved Issues"
                value={metrics.totalClosedCount.total}
                appValue={metrics.totalClosedCount.app}
                adminValue={metrics.totalClosedCount.admin}
                loading={isLoading}
                icon={<Archive className="h-5 w-5" />}
                description="Status is RESOLVED"
                onClick={() => openMetricIssues("Resolved Issues", (issue) => issue.issueStatus === "RESOLVED")}
              />
              <MetricCard
                label="In QA"
                value={metrics.qaBottleneckCount.total}
                appValue={metrics.qaBottleneckCount.app}
                adminValue={metrics.qaBottleneckCount.admin}
                loading={isLoading}
                icon={<HelpCircle className="h-5 w-5" />}
                description="Testing ongoing"
                onClick={() => openMetricIssues("In QA Issues", (issue) => issue.issueStatus === "IN QA")}
              />
            </>
          )}
        </section>

        {/* 1.5 Estimation Cards */}
        <section className="space-y-4">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-500">
              Workload Estimation
            </h2>
            <p className="text-xs text-zinc-600 mt-0.5">
              Remaining vs total estimated time
            </p>
          </div>
          <EstimationCardsSection issues={rawIssues} loading={isLoading} />
        </section>

        {/* 1.75 Issues by Reporter */}
        <section className="space-y-4">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-500">
              Issues Reported By
            </h2>
            <p className="text-xs text-zinc-600 mt-0.5">
              Issue distribution by reporter
            </p>
          </div>
          <ReporterCards
            issues={rawIssues}
            loading={isLoading}
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
              Total, App and Admin breakdown per team member
            </p>
          </div>
          <AssigneeCards
            issues={rawIssues}
            loading={isLoading}
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
              <AssigneeStatusTable issues={rawIssues} loading={isLoading} />
            </div>
            <div className="lg:col-span-1 min-h-[300px]">
              <TodayWorkloadCard issues={rawIssues} loading={isLoading} />
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

        {/* 4. Issues Board & Filters */}
        <section className="space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-500">
            Issues Board & Filters
          </h2>
          {isMobile ? (
            <FiltersMobile
              filters={filters}
              setFilters={setFilters}
              resetFilters={resetFilters}
              options={filterOptions}
            />
          ) : (
            <Filters
              filters={filters}
              setFilters={setFilters}
              resetFilters={resetFilters}
              options={filterOptions}
            />
          )}
        </section>

        {/* 5. Issues Table */}
        <section>
          {isMobile ? (
            <IssuesTableMobile issues={filteredIssues} loading={isLoading} />
          ) : (
            <IssuesTable issues={filteredIssues} loading={isLoading} />
          )}
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

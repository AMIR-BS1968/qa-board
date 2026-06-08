"use client";

import { useIssues } from "../../hooks/useIssues";
import { useIsMobile } from "@/hooks/useIsMobile";
import { MetricCard, MetricCardMobile } from "@/components/metrics/MetricCard";
import { Filters, FiltersMobile } from "@/components/filters/Filters";
import { IssuesTable, IssuesTableMobile } from "@/components/tables/IssuesTable";
import { AssigneeCards } from "@/components/assignee/AssigneeCards/AssigneeCards";
import { AssigneeStatusTable } from "@/components/assignee/AssigneeStatusTable/AssigneeStatusTable";
import { ModuleCharts } from "@/components/modules/ModuleList/ModuleList";
import { Button } from "@/components/ui/button";
import { RefreshCw, Bug, ShieldCheck, CircleDot, Archive, HelpCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export function DashboardContainer() {
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
  } = useIssues();

  const isMobile = useIsMobile(768);

  const syncTimeStr = lastSynced
    ? `Synced ${formatDistanceToNow(lastSynced, { addSuffix: true })}`
    : "Not synced";

  return (
    <div className="flex-1 w-full min-h-screen flex flex-col bg-zinc-950 pb-16">
      {/* Navbar */}
      <header className="sticky top-0 z-30 w-full border-b border-border/40 bg-zinc-950/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2.5">
            <div>
              <h1 className="text-base font-extrabold tracking-tight text-white sm:text-lg">
                PIOMS Issue Summary
              </h1>
              <p className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider hidden sm:block">
                Issue Management Board
              </p>
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
        <section className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-5">
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
              />
              <MetricCardMobile
                label="Today's Resolved"
                value={metrics.todayResolvedCount.total}
                appValue={metrics.todayResolvedCount.app}
                adminValue={metrics.todayResolvedCount.admin}
                loading={isLoading}
                icon={<ShieldCheck className="h-4 w-4" />}
                description="Fixed/Resolved today"
              />
              <MetricCardMobile
                label="Total Open"
                value={metrics.totalOpenCount.total}
                appValue={metrics.totalOpenCount.app}
                adminValue={metrics.totalOpenCount.admin}
                loading={isLoading}
                icon={<CircleDot className="h-4 w-4" />}
                description="Needs work/QA"
              />
              <MetricCardMobile
                label="Total Closed"
                value={metrics.totalClosedCount.total}
                appValue={metrics.totalClosedCount.app}
                adminValue={metrics.totalClosedCount.admin}
                loading={isLoading}
                icon={<Archive className="h-4 w-4" />}
                description="Fixed & Resolved"
              />
              <div className="col-span-2">
                <MetricCardMobile
                  label="QA Bottlenecks"
                  value={metrics.qaBottleneckCount.total}
                  appValue={metrics.qaBottleneckCount.app}
                  adminValue={metrics.qaBottleneckCount.admin}
                  loading={isLoading}
                  icon={<HelpCircle className="h-4 w-4" />}
                  description="Issues stuck in QA state"
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
              />
              <MetricCard
                label="Today's Resolved"
                value={metrics.todayResolvedCount.total}
                appValue={metrics.todayResolvedCount.app}
                adminValue={metrics.todayResolvedCount.admin}
                loading={isLoading}
                icon={<ShieldCheck className="h-5 w-5" />}
                description="Fixed/Resolved today"
              />
              <MetricCard
                label="Open Issues"
                value={metrics.totalOpenCount.total}
                appValue={metrics.totalOpenCount.app}
                adminValue={metrics.totalOpenCount.admin}
                loading={isLoading}
                icon={<CircleDot className="h-5 w-5" />}
                description="Needs development or QA"
              />
              <MetricCard
                label="Closed Issues"
                value={metrics.totalClosedCount.total}
                appValue={metrics.totalClosedCount.app}
                adminValue={metrics.totalClosedCount.admin}
                loading={isLoading}
                icon={<Archive className="h-5 w-5" />}
                description="Fully validated & completed"
              />
              <MetricCard
                label="QA Bottlenecks"
                value={metrics.qaBottleneckCount.total}
                appValue={metrics.qaBottleneckCount.app}
                adminValue={metrics.qaBottleneckCount.admin}
                loading={isLoading}
                icon={<HelpCircle className="h-5 w-5" />}
                description="Stuck in IN QA status"
              />
            </>
          )}
        </section>

        {/* 2. Issues by Assignee */}
        <section className="space-y-4">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-500">
              Issues by Assignee
            </h2>
            <p className="text-xs text-zinc-600 mt-0.5">
              Total, App and Admin breakdown per team member
            </p>
          </div>
          <AssigneeCards issues={rawIssues} loading={isLoading} />
          <AssigneeStatusTable issues={rawIssues} loading={isLoading} />
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
    </div>
  );
}

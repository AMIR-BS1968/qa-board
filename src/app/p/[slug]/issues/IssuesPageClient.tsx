"use client";

import { useState } from "react";
import { useIssues } from "@/features/dashboard/hooks/useIssues";
import { useIsMobile } from "@/hooks/useIsMobile";
import { Filters, FiltersMobile } from "@/features/dashboard/components/filters/Filters";
import { IssuesTable, IssuesTableMobile } from "@/features/dashboard/components/tables/IssuesTable";
import { IssueFormDialog } from "@/components/ui/IssueFormDialog";
import { Button } from "@/components/ui/button";
import { RefreshCw, Bug, Folder, LayoutGrid, Settings, Plus } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { addPendingChange } from "@/lib/batchUpdates";

export function IssuesPageClient({ slug }: { slug: string }) {
  const {
    filteredIssues,
    isLoading,
    error,
    lastSynced,
    refetch,
    projectConfig,
    validationRules,
    roles,
  } = useIssues(slug);

  const isOwnerOrManager = roles.includes("OWNER") || roles.includes("MANAGER");

  const isMobile = useIsMobile();

  // Dialog states for Create and Edit Issue Form
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editIssue, setEditIssue] = useState<any>(null);

  const handleCreateSubmit = async (tabName: string, data: Record<string, any>) => {
    const tempIndex = `pending-${Date.now()}`;
    addPendingChange(slug, {
      type: "ISSUE_CREATE",
      tabName,
      sheetRowIndex: tempIndex,
      newData: {
        ...data,
        sheetSource: tabName,
        sheetRowIndex: tempIndex,
      },
      description: `Create issue "${data.issueTitle}" in tab "${tabName}"`,
    });
    setIsCreateOpen(false);
    return true;
  };

  const handleEditSubmit = async (tabName: string, data: Record<string, any>) => {
    if (!editIssue) return false;
    
    // Track original data for revert mapping
    const prevData: Record<string, any> = {};
    Object.keys(data).forEach((key) => {
      prevData[key] = (editIssue as any)[key] ?? "";
    });

    addPendingChange(slug, {
      type: "ISSUE_UPDATE",
      tabName,
      sheetRowIndex: editIssue.sheetRowIndex,
      newData: data,
      prevData,
      description: `Edit issue "${data.issueTitle || editIssue.issueTitle}" in tab "${tabName}"`,
    });
    setEditIssue(null);
    return true;
  };

  const tabsList = projectConfig?.sheetConfigs?.[0]?.selectedTabs || ["Admin", "App"];
  const syncTimeStr = lastSynced
    ? `Synced ${formatDistanceToNow(lastSynced, { addSuffix: true })}`
    : "Not synced";

  // Derive status options from projectConfig statusConfigs
  const statusOptions: string[] = projectConfig?.statusConfigs?.map((s: any) => s.statusValue) || [];

  const handleStatusChange = async (issue: any, newStatus: string) => {
    addPendingChange(slug, {
      type: "ISSUE_UPDATE",
      tabName: issue.sheetSource,
      sheetRowIndex: issue.sheetRowIndex,
      newData: { issueStatus: newStatus },
      prevData: { issueStatus: issue.issueStatus },
      description: `Change status of "${issue.issueTitle}" to "${newStatus}"`,
    });
  };

  // Derive filter options dynamically
  const modulesSet = new Set<string>(validationRules.module || []);
  const assigneesSet = new Set<string>(validationRules.assignee || []);
  const reportersSet = new Set<string>(validationRules.reportedBy || []);

  filteredIssues.forEach((issue) => {
    if (issue.module) modulesSet.add(issue.module);
    if (issue.assignee) assigneesSet.add(issue.assignee);
    if (issue.reportedBy) reportersSet.add(issue.reportedBy);
  });

  const filterOptions = {
    modules: Array.from(modulesSet).sort(),
    assignees: Array.from(assigneesSet).sort(),
    reporters: Array.from(reportersSet).sort(),
  };

  // State for filter values
  const [filters, setFilters] = useState<any>({
    search: "",
    source: [],
    module: [],
    status: [],
    assignee: [],
    reportedBy: [],
    assignedDateStart: undefined,
    assignedDateEnd: undefined,
    resolutionDateStart: undefined,
    resolutionDateEnd: undefined,
  });

  const resetFilters = () => {
    setFilters({
      search: "",
      source: [],
      module: [],
      status: [],
      assignee: [],
      reportedBy: [],
      assignedDateStart: undefined,
      assignedDateEnd: undefined,
      resolutionDateStart: undefined,
      resolutionDateEnd: undefined,
    });
  };

  // Perform filtering locally inside the client page
  const pageFilteredIssues = filteredIssues.filter((issue) => {
    if (filters.search.trim()) {
      const query = filters.search.toLowerCase().trim();
      const inTitle = issue.issueTitle?.toLowerCase().includes(query);
      const inDesc = issue.issueDescription?.toLowerCase().includes(query);
      const inAssignee = issue.assignee?.toLowerCase().includes(query);
      const inModule = issue.module?.toLowerCase().includes(query);
      if (!inTitle && !inDesc && !inAssignee && !inModule) return false;
    }
    if (filters.source.length > 0 && !filters.source.includes(issue.sheetSource)) return false;
    if (filters.module.length > 0 && !filters.module.includes(issue.module)) return false;
    if (filters.status.length > 0 && !filters.status.includes(issue.issueStatus)) return false;
    if (filters.assignee.length > 0 && !filters.assignee.includes(issue.assignee)) return false;
    if (filters.reportedBy.length > 0 && !filters.reportedBy.includes(issue.reportedBy)) return false;
    return true;
  });

  return (
    <div className="flex-1 w-full min-h-screen flex flex-col bg-zinc-950 pb-16 text-zinc-300">
      {/* Top Navbar */}
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
              <Link href={`/p/${slug}`} className="flex items-center gap-1 hover:text-white transition">
                <LayoutGrid className="h-3.5 w-3.5" />
                <span>Dashboard</span>
              </Link>
              <Link href={`/p/${slug}/issues`} className="flex items-center gap-1 text-blue-400">
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

      {/* Main Workspace */}
      <main className="flex-1 w-full px-4 sm:px-6 lg:px-8 pt-8 space-y-6">
        
        {/* Header toolbar */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-500">
              Issues List & Search
            </h2>
            <p className="text-xs text-zinc-600 mt-0.5">
              All QA ticket logs fetched dynamically from Google Sheets
            </p>
          </div>
          <Button
            onClick={() => setIsCreateOpen(true)}
            className="h-8 bg-blue-500 hover:bg-blue-600 rounded-lg text-white text-xs font-bold px-3.5 flex items-center gap-1.5 cursor-pointer select-none active:scale-[0.98] transition border-none"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Issue</span>
          </Button>
        </div>

        {/* Filters */}
        <section className="space-y-4">
          {isMobile ? (
            <FiltersMobile
              filters={filters}
              setFilters={setFilters}
              resetFilters={resetFilters}
              options={filterOptions}
              tabsList={tabsList}
            />
          ) : (
            <Filters
              filters={filters}
              setFilters={setFilters}
              resetFilters={resetFilters}
              options={filterOptions}
              tabsList={tabsList}
            />
          )}
        </section>

        {/* Issues List Table */}
        <section>
          {isMobile ? (
            <IssuesTableMobile 
              issues={pageFilteredIssues} 
              loading={isLoading} 
              onEditIssue={(issue) => setEditIssue(issue)}
              onStatusChange={handleStatusChange}
              statusOptions={statusOptions}
            />
          ) : (
            <IssuesTable 
              issues={pageFilteredIssues} 
              loading={isLoading} 
              onEditIssue={(issue) => setEditIssue(issue)}
              onStatusChange={handleStatusChange}
              statusOptions={statusOptions}
            />
          )}
        </section>
      </main>

      {/* Create Issue Dialog */}
      {projectConfig && (
        <IssueFormDialog
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          onSubmit={handleCreateSubmit}
          projectConfig={projectConfig}
          validationRules={validationRules || {}}
        />
      )}

      {/* Edit Issue Dialog */}
      {projectConfig && editIssue && (
        <IssueFormDialog
          isOpen={!!editIssue}
          onClose={() => setEditIssue(null)}
          onSubmit={handleEditSubmit}
          projectConfig={projectConfig}
          validationRules={validationRules || {}}
          issue={editIssue}
        />
      )}
    </div>
  );
}

"use client";

import { useState, useEffect, useMemo } from "react";
import { Bug, Folder, Settings, LayoutGrid, Search, User, Clock, ArrowLeft, RefreshCw } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

interface StatusConfig {
  id: string;
  statusValue: string;
  displayLabel: string;
  color: string;
  category: string;
  kanbanEnabled?: boolean;
  sortOrder?: number;
}

interface Issue {
  module: string;
  feature: string;
  issueTitle: string;
  issueDescription: string;
  stepsToReproduce: string;
  resources: string;
  issueStatus: string;
  reportedBy: string;
  devComments: string;
  estimation: string;
  spentTime: string;
  assignedDate: string;
  assignee: string;
  resolutionDate: string;
  qaComments: string;
  sheetSource: string;
  sheetRowIndex: number;
}

interface ProjectMetadata {
  id: string;
  name: string;
  slug: string;
  statusConfigs: StatusConfig[];
}

interface KanbanBoardClientProps {
  slug: string;
}

export function KanbanBoardClient({ slug }: KanbanBoardClientProps) {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [project, setProject] = useState<ProjectMetadata | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAssignee, setSelectedAssignee] = useState("all");

  // Drag-and-drop cell update status tracker
  const [updatingItemId, setUpdatingItemId] = useState<string | null>(null);

  const fetchBoardData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/issues?slug=${slug}`);
      const result = await response.json();
      if (result.success) {
        setIssues(result.data || []);
        setProject(result.project);
        setLastSynced(new Date());
      } else {
        throw new Error(result.error || "Failed to load issues");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An error occurred fetching issues");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBoardData();
  }, [slug]);

  // Extract unique assignees dynamically for filter
  const assignees = useMemo(() => {
    const set = new Set<string>();
    issues.forEach((issue) => {
      if (issue.assignee) {
        set.add(issue.assignee);
      }
    });
    return Array.from(set).sort();
  }, [issues]);

  // Columns defined in database, fall back to defaults if not seeded
  const columns = useMemo(() => {
    if (project?.statusConfigs && project.statusConfigs.length > 0) {
      return project.statusConfigs
        .filter((s) => s.kanbanEnabled !== false)
        .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
    }
    return [
      { id: "1", statusValue: "TODO", displayLabel: "TODO", color: "#64748b", category: "open" },
      { id: "2", statusValue: "IN PROGRESS", displayLabel: "IN PROGRESS", color: "#0ea5e9", category: "open" },
      { id: "3", statusValue: "IN QA", displayLabel: "IN QA", color: "#f59e0b", category: "qa" },
      { id: "4", statusValue: "FIXED", displayLabel: "FIXED", color: "#a855f7", category: "fixed" },
      { id: "5", statusValue: "RESOLVED", displayLabel: "RESOLVED", color: "#10b981", category: "closed" },
    ];
  }, [project]);

  // Filter issues
  const filteredIssues = useMemo(() => {
    return issues.filter((issue) => {
      // Search term
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const inTitle = issue.issueTitle?.toLowerCase().includes(q);
        const inDesc = issue.issueDescription?.toLowerCase().includes(q);
        const inModule = issue.module?.toLowerCase().includes(q);
        if (!inTitle && !inDesc && !inModule) return false;
      }
      // Assignee dropdown
      if (selectedAssignee !== "all" && issue.assignee !== selectedAssignee) {
        return false;
      }
      return true;
    });
  }, [issues, searchQuery, selectedAssignee]);

  // HTML5 Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, issue: Issue) => {
    e.dataTransfer.setData("text/plain", `${issue.sheetRowIndex}|${issue.sheetSource}`);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDrop = async (e: React.DragEvent, targetStatus: string) => {
    e.preventDefault();
    const dragData = e.dataTransfer.getData("text/plain");
    if (!dragData) return;

    const [rowIndexStr, tabName] = dragData.split("|");
    const sheetRowIndex = parseInt(rowIndexStr, 10);

    if (isNaN(sheetRowIndex) || !tabName) return;

    // Find the issue to check if status actually changed
    const targetIssue = issues.find(
      (i) => i.sheetRowIndex === sheetRowIndex && i.sheetSource === tabName
    );
    if (!targetIssue || targetIssue.issueStatus === targetStatus) return;

    // Track updating key (source tab + row number)
    const updateKey = `${tabName}-${sheetRowIndex}`;
    setUpdatingItemId(updateKey);

    // Optimistic client update
    const previousIssues = [...issues];
    setIssues((prev) =>
      prev.map((i) =>
        i.sheetRowIndex === sheetRowIndex && i.sheetSource === tabName
          ? { ...i, issueStatus: targetStatus }
          : i
      )
    );

    try {
      const response = await fetch("/api/issues", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          tabName,
          sheetRowIndex,
          newStatus: targetStatus,
        }),
      });

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || "Failed to update cell");
      }
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Failed to save status update back to Google Sheets. Reverting.");
      // Revert state
      setIssues(previousIssues);
    } finally {
      setUpdatingItemId(null);
    }
  };

  const syncTimeStr = lastSynced
    ? `Synced ${formatDistanceToNow(lastSynced, { addSuffix: true })}`
    : "Not synced";

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
              <span className="text-sm font-black text-white hidden sm:inline-block">QA Board</span>
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
              <Link href={`/p/${slug}/board`} className="flex items-center gap-1 text-blue-400">
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
            <button
              onClick={fetchBoardData}
              disabled={isLoading}
              className="h-8 bg-zinc-900/40 border border-zinc-800/40 rounded-lg text-zinc-300 hover:text-white hover:bg-zinc-900/80 px-3 flex items-center gap-1.5 shadow-sm active:bg-zinc-900 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin text-primary" : "text-zinc-400"}`} />
              <span className="text-xs hidden sm:inline">Sync Board</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-8 flex flex-col space-y-6">
        
        {/* Controls Block */}
        <section className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-zinc-900/20 border border-zinc-900 rounded-2xl p-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800">
              <LayoutGrid className="h-4 w-4 rotate-45 text-blue-500" />
            </div>
            <div>
              <h2 className="text-sm font-black text-white uppercase tracking-wider">
                {project?.name || "Kanban Board"}
              </h2>
              <p className="text-[11px] text-zinc-500">
                Drag cards between columns to directly update Google Sheets cells.
              </p>
            </div>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-3 w-full sm:w-auto">
            {/* Search */}
            <div className="relative flex-1 sm:w-60">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-600" />
              <input
                type="text"
                placeholder="Search board issues..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-850 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-800 transition"
              />
            </div>
            
            {/* Assignee select */}
            <select
              value={selectedAssignee}
              onChange={(e) => setSelectedAssignee(e.target.value)}
              className="bg-zinc-950 border border-zinc-850 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-zinc-800 transition cursor-pointer"
            >
              <option value="all">All Assignees</option>
              {assignees.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>
        </section>

        {/* Board Columns Grid */}
        <section className="flex-1 overflow-x-auto min-h-[500px] pb-4 flex gap-4 items-start select-none">
          {columns.map((col) => {
            const colIssues = filteredIssues.filter((i) => i.issueStatus === col.statusValue);
            
            return (
              <div
                key={col.id}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => handleDrop(e, col.statusValue)}
                className="w-72 flex-shrink-0 bg-zinc-900/10 border border-zinc-900 rounded-2xl flex flex-col max-h-[700px] overflow-hidden"
              >
                {/* Column Title */}
                <div className="p-4 flex items-center justify-between border-b border-zinc-900/60 bg-zinc-900/5">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: col.color }}
                    />
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                      {col.displayLabel}
                    </h3>
                  </div>
                  <span className="text-[10px] text-zinc-500 font-bold bg-zinc-900/80 px-2 py-0.5 rounded-full">
                    {colIssues.length}
                  </span>
                </div>

                {/* Cards Container */}
                <div className="p-3 overflow-y-auto space-y-2.5 flex-1 min-h-[250px]">
                  {colIssues.length === 0 ? (
                    <div className="py-12 text-center text-[10px] text-zinc-700 font-semibold uppercase tracking-wider">
                      Empty Column
                    </div>
                  ) : (
                    colIssues.map((issue) => {
                      const isUpdating = updatingItemId === `${issue.sheetSource}-${issue.sheetRowIndex}`;
                      
                      return (
                        <div
                          key={`${issue.sheetSource}-${issue.sheetRowIndex}`}
                          draggable={!isUpdating}
                          onDragStart={(e) => handleDragStart(e, issue)}
                          className={`group bg-zinc-900/40 hover:bg-zinc-900 border border-zinc-850 hover:border-zinc-800 rounded-xl p-3.5 shadow-sm active:scale-[0.98] active:border-zinc-800 transition duration-150 cursor-grab relative overflow-hidden ${
                            isUpdating ? "opacity-40 pointer-events-none cursor-wait" : ""
                          }`}
                        >
                          {/* Inner Cell Sync Loading Ring */}
                          {isUpdating && (
                            <div className="absolute inset-0 bg-zinc-950/80 flex items-center justify-center z-10">
                              <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />
                            </div>
                          )}

                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-500">
                              {issue.module || "General"}
                            </span>
                            <span className="text-[9px] font-semibold text-zinc-500 font-mono">
                              Row {issue.sheetRowIndex}
                            </span>
                          </div>

                          <h4 className="text-xs font-bold text-white group-hover:text-blue-400 transition leading-relaxed mb-3">
                            {issue.issueTitle}
                          </h4>

                          <div className="flex items-center justify-between pt-2.5 border-t border-zinc-900/60">
                            <div className="flex items-center gap-1 text-[10px] text-zinc-400 font-medium">
                              <User className="h-3 w-3 text-zinc-600" />
                              <span className="truncate max-w-[100px]">{issue.assignee || "Unassigned"}</span>
                            </div>
                            
                            {issue.estimation && (
                              <div className="flex items-center gap-0.5 text-[9px] text-zinc-500 font-mono font-medium">
                                <Clock className="h-2.5 w-2.5" />
                                <span>{issue.estimation}h</span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </section>
      </main>
    </div>
  );
}

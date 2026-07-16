"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { Bug, Folder, Settings, LayoutGrid, RefreshCw } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

import { Issue, StatusConfig, ProjectMetadata } from "./types";
import { BoardControls } from "./components/BoardControls";
import { ScrollNavigationCard } from "./components/ScrollNavigationCard";
import { KanbanColumn } from "./components/KanbanColumn";

interface KanbanBoardClientProps {
  slug: string;
}

export function KanbanBoardClient({ slug }: KanbanBoardClientProps) {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [project, setProject] = useState<ProjectMetadata | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAssignee, setSelectedAssignee] = useState("all");

  // Drag-and-drop cell update status tracker
  const [updatingItemId, setUpdatingItemId] = useState<string | null>(null);

  const boardRef = useRef<HTMLDivElement>(null);
  const arrowsRef = useRef<HTMLDivElement>(null);

  const handleScroll = (direction: "left" | "right") => {
    if (boardRef.current) {
      const scrollAmount = 320;
      boardRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  const fetchBoardData = async (forceSync = false) => {
    setIsLoading(true);
    setError(null);
    try {
      const cacheKey = `qa-board-cache-${slug}`;
      const cached = typeof window !== "undefined" ? localStorage.getItem(cacheKey) : null;

      if (!forceSync && cached) {
        try {
          const parsed = JSON.parse(cached);
          if (parsed && Array.isArray(parsed.data) && parsed.project) {
            setIssues(parsed.data);
            setProject(parsed.project);
            setLastSynced(new Date(parsed.timestamp));
            setIsLoading(false);
            return;
          }
        } catch (e) {
          console.error("Failed to parse cached Kanban board issues:", e);
        }
      }

      if (forceSync || !cached) {
        await fetch(`/api/sync?slug=${slug}`, { method: "POST" });
      }

      const response = await fetch(`/api/issues?slug=${slug}`);
      const result = await response.json();
      if (result.success) {
        setIssues(result.data || []);
        setProject(result.project);
        const now = new Date();
        setLastSynced(now);

        if (typeof window !== "undefined") {
          localStorage.setItem(
            cacheKey,
            JSON.stringify({
              data: result.data,
              project: result.project,
              timestamp: now.getTime(),
            })
          );
        }
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
    fetchBoardData(false);
  }, [slug]);

  useEffect(() => {
    if (!mounted) return;

    const boardEl = boardRef.current;
    const arrowsEl = arrowsRef.current;

    const handleWheel = (e: WheelEvent) => {
      if (e.deltaY !== 0 && boardEl) {
        e.preventDefault();
        boardEl.scrollLeft += e.deltaY;
      }
    };

    if (arrowsEl) {
      arrowsEl.addEventListener("wheel", handleWheel, { passive: false });
    }

    return () => {
      if (arrowsEl) arrowsEl.removeEventListener("wheel", handleWheel);
    };
  }, [mounted]);

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
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const inTitle = issue.issueTitle?.toLowerCase().includes(q);
        const inDesc = issue.issueDescription?.toLowerCase().includes(q);
        const inModule = issue.module?.toLowerCase().includes(q);
        if (!inTitle && !inDesc && !inModule) return false;
      }
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

    const targetIssue = issues.find(
      (i) => i.sheetRowIndex === sheetRowIndex && i.sheetSource === tabName
    );
    if (!targetIssue || targetIssue.issueStatus === targetStatus) return;

    const updateKey = `${tabName}-${sheetRowIndex}`;
    setUpdatingItemId(updateKey);

    const previousIssues = [...issues];
    const updatedIssues = previousIssues.map((i) =>
      i.sheetRowIndex === sheetRowIndex && i.sheetSource === tabName
        ? { ...i, issueStatus: targetStatus }
        : i
    );
    setIssues(updatedIssues);

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

      const cacheKey = `qa-board-cache-${slug}`;
      if (typeof window !== "undefined") {
        localStorage.setItem(
          cacheKey,
          JSON.stringify({
            data: updatedIssues,
            project,
            timestamp: Date.now(),
          })
        );
      }
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Failed to save status update back to Google Sheets. Reverting.");
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
              <span className="text-sm font-black text-white sm:inline-block">
                {project?.name || "QA Board"}
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
              <Link href={`/p/${slug}/issues`} className="flex items-center gap-1 hover:text-white transition">
                <Bug className="h-3.5 w-3.5" />
                <span>Issues</span>
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
              onClick={() => fetchBoardData(true)}
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
        <BoardControls
          projectName={project?.name || "Kanban Board"}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          selectedAssignee={selectedAssignee}
          setSelectedAssignee={setSelectedAssignee}
          assignees={assignees}
        />

        {/* Scroll Helper Bar */}
        <ScrollNavigationCard
          arrowsRef={arrowsRef}
          onScrollLeft={() => handleScroll("left")}
          onScrollRight={() => handleScroll("right")}
        />

        {/* Board Columns Grid */}
        <section ref={boardRef} className="flex-1 overflow-x-auto min-h-[500px] pb-4 flex gap-4 items-start select-none">
          {!mounted || isLoading ? (
            <div className="flex-1 min-h-[400px] flex items-center justify-center bg-zinc-900/10 border border-zinc-900/40 rounded-2xl p-12">
              <div className="flex flex-col items-center gap-3">
                <RefreshCw className="h-6 w-6 animate-spin text-blue-500" />
                <span className="text-xs text-zinc-500 font-semibold uppercase tracking-wider">Loading Kanban Columns...</span>
              </div>
            </div>
          ) : (
            columns.map((col) => {
              const colIssues = filteredIssues.filter((i) => i.issueStatus === col.statusValue);
              return (
                <KanbanColumn
                  key={col.id}
                  column={col}
                  issues={colIssues}
                  updatingItemId={updatingItemId}
                  onDragStart={handleDragStart}
                  onDrop={handleDrop}
                />
              );
            })
          )}
        </section>
      </main>
    </div>
  );
}

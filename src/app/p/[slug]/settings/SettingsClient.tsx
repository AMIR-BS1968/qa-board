"use client";

import { useState, useTransition, useEffect } from "react";
import { Bug, Folder, Settings, LayoutGrid, Save, Plus, Trash2, Shield, Eye, HelpCircle } from "lucide-react";
import Link from "next/link";
import { saveProjectSettings } from "@/app/actions/settings";
import { deleteProject } from "@/app/actions/project";
import { useRouter } from "next/navigation";

import { ProjectData, StatusConfig } from "./types";
import { SheetSetupTab } from "./components/SheetSetupTab";
import { ColumnMapsTab } from "./components/ColumnMapsTab";
import { StatusBadgesTab } from "./components/StatusBadgesTab";
import { MetricTogglesTab } from "./components/MetricTogglesTab";
import { KpiMappingsTab } from "./components/KpiMappingsTab";
import { TabsManagementTab } from "./components/TabsManagementTab";
import { ValidationManagementTab } from "./components/ValidationManagementTab";

interface SettingsClientProps {
  project: ProjectData;
}

export function SettingsClient({ project }: SettingsClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"sheet" | "columns" | "statuses" | "kpis" | "metrics" | "tabs" | "validation" | "actions">("sheet");
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Client side fetch state
  const [tabs, setTabs] = useState<string[]>([]);
  const [isLoadingTabs, setIsLoadingTabs] = useState(true);

  useEffect(() => {
    async function loadTabs() {
      setIsLoadingTabs(true);
      try {
        const response = await fetch(`/api/project/tabs?slug=${project.slug}`);
        const result = await response.json();
        if (result.success) {
          setTabs(result.tabs || []);
        } else {
          throw new Error(result.error || "Failed to load spreadsheet tabs");
        }
      } catch (err: any) {
        console.error("Failed to load tabs asynchronously in settings:", err);
      } finally {
        setIsLoadingTabs(false);
      }
    }
    loadTabs();
  }, [project.slug]);

  const [deleteConfirmSlug, setDeleteConfirmSlug] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteProject = async () => {
    if (deleteConfirmSlug !== project.slug) return;
    setIsDeleting(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const result = await deleteProject(project.id);
      if (result?.error) {
        setErrorMsg(result.error);
        setIsDeleting(false);
      } else {
        router.push("/projects");
        router.refresh();
      }
    } catch (e: any) {
      setErrorMsg(e.message || "Failed to delete project.");
      setIsDeleting(false);
    }
  };

  // 1. Sheet Settings State
  const config = project.sheetConfigs[0] || {
    sheetUrl: "",
    selectedTabs: ["Admin", "App"],
    headerRow: 9,
    dataStartRow: 10,
  };
  const [sheetUrl, setSheetUrl] = useState(config.sheetUrl);
  const [selectedTabs, setSelectedTabs] = useState<string[]>(config.selectedTabs);
  const [headerRow, setHeaderRow] = useState(config.headerRow);
  const [dataStartRow, setDataStartRow] = useState(config.dataStartRow);
  const [validationTabName, setValidationTabName] = useState(config.validationTabName || "");

  // 2. Column Mappings State
  const fieldKeys = [
    { key: "module", label: "Module (A)", description: "The module/component of the bug." },
    { key: "feature", label: "Feature (B)", description: "The specific sub-feature/screen." },
    { key: "issueTitle", label: "Issue Title (C)", description: "Short description of the bug." },
    { key: "issueDescription", label: "Issue Description (D)", description: "Detailed summary." },
    { key: "stepsToReproduce", label: "Steps To Reproduce (E)", description: "Step-by-step description." },
    { key: "resources", label: "Resources (F)", description: "Attachments, URLs, links." },
    { key: "issueStatus", label: "Issue Status (G)", description: "Status of the bug (Required)." },
    { key: "reportedBy", label: "Reported By (H)", description: "Who found the bug." },
    { key: "devComments", label: "Dev Comments (I)", description: "Engineering notes." },
    { key: "estimation", label: "Estimation (J)", description: "Effort estimation in hours." },
    { key: "spentTime", label: "Spent Time (K)", description: "Time spent in hours." },
    { key: "assignedDate", label: "Assigned Date (L)", description: "Date ticket was assigned." },
    { key: "assignee", label: "Assignee (M)", description: "Developer assignee." },
    { key: "resolutionDate", label: "Resolution Date (N)", description: "Date ticket was resolved." },
    { key: "qaComments", label: "QA Comments (O)", description: "Tester regression details." },
  ];

  const [columnMappings, setColumnMappings] = useState<Record<string, Record<string, number>>>(() => {
    const state: Record<string, Record<string, number>> = {};
    const tabs = config.selectedTabs;
    
    tabs.forEach((tab) => {
      state[tab] = {};
      fieldKeys.forEach((fk) => {
        const existing = project.columnMappings.find(
          (m) => m.tabName === tab && m.fieldKey === fk.key
        );
        state[tab][fk.key] = existing !== undefined ? existing.columnIndex : -1;
      });
    });
    return state;
  });

  const handleColumnIndexChange = (tab: string, fieldKey: string, val: number) => {
    setColumnMappings((prev) => ({
      ...prev,
      [tab]: {
        ...prev[tab],
        [fieldKey]: val,
      },
    }));
  };

  // 3. Statuses State
  const [statuses, setStatuses] = useState<StatusConfig[]>(() => {
    if (project.statusConfigs && project.statusConfigs.length > 0) {
      return project.statusConfigs.map((s) => ({
        id: s.id,
        statusValue: s.statusValue,
        displayLabel: s.displayLabel,
        color: s.color,
        category: s.category,
        sortOrder: s.sortOrder ?? undefined,
        kanbanEnabled: s.kanbanEnabled ?? true,
      }));
    }
    return [
      { id: "1", statusValue: "TODO", displayLabel: "TODO", color: "#64748b", category: "open", sortOrder: 0, kanbanEnabled: true },
      { id: "2", statusValue: "IN PROGRESS", displayLabel: "IN PROGRESS", color: "#0ea5e9", category: "open", sortOrder: 1, kanbanEnabled: true },
      { id: "3", statusValue: "IN QA", displayLabel: "IN QA", color: "#f59e0b", category: "qa", sortOrder: 2, kanbanEnabled: true },
      { id: "4", statusValue: "FIXED", displayLabel: "FIXED", color: "#a855f7", category: "fixed", sortOrder: 3, kanbanEnabled: true },
      { id: "5", statusValue: "RESOLVED", displayLabel: "RESOLVED", color: "#10b981", category: "closed", sortOrder: 4, kanbanEnabled: true },
    ];
  });

  // 4. Metric Visibility State
  const metrics = [
    { key: "openIssues", label: "Open Issues Metric" },
    { key: "fixedIssues", label: "Fixed Issues Metric" },
    { key: "inQaIssues", label: "In QA Issues Metric" },
    { key: "issuesByAssignee", label: "Issues by Assignee Cards" },
    { key: "fixedDeployed", label: "Fixed & Deployed Metric" },
    { key: "resolvedIssues", label: "Resolved Issues Metric" },
    { key: "workloadEstimation", label: "Workload Estimation Cards" },
    { key: "todayWorkload", label: "Today's Workload Estimate" },
    { key: "issuesByStatus", label: "Issues by Status Chart" },
    { key: "openIssuesByAssignee", label: "Open Issues by Assignee Chart" },
    { key: "assigneeStatusTable", label: "Assignee Status Grid" },
    { key: "issuesByModule", label: "Issues by Module Chart" },
    { key: "issuesReportedBy", label: "Issues Reported By Card" },
    { key: "issueTable", label: "Issues Table View" },
    { key: "kanbanBoard", label: "Kanban Board View" },
  ];

  const [metricVisibilities, setMetricVisibilities] = useState<Record<string, boolean>>(() => {
    const state: Record<string, boolean> = {};
    metrics.forEach((m) => {
      const existing = project.metricVisibilities.find((v) => v.metricKey === m.key);
      state[m.key] = existing ? existing.enabled : true;
    });
    return state;
  });

  const handleMetricToggle = (key: string) => {
    setMetricVisibilities((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Submit Save action
  const handleSave = () => {
    setErrorMsg(null);
    setSuccessMsg(null);

    const tabsList = selectedTabs;

    if (tabsList.length === 0) {
      setErrorMsg("You must specify at least one sheet tab name.");
      return;
    }

    // Build payload
    const flatMappings: any[] = [];
    tabsList.forEach((tab) => {
      const tabMappings = columnMappings[tab] || {};
      fieldKeys.forEach((fk) => {
        const colIdx = tabMappings[fk.key] !== undefined ? tabMappings[fk.key] : -1;
        if (colIdx >= 0) {
          flatMappings.push({
            tabName: tab,
            fieldKey: fk.key,
            columnIndex: colIdx,
          });
        }
      });
    });

    const flatMetrics = Object.entries(metricVisibilities).map(([key, enabled]) => ({
      metricKey: key,
      enabled,
    }));

    startTransition(async () => {
      const response = await saveProjectSettings(project.id, {
        sheetConfig: {
          sheetUrl,
          selectedTabs: tabsList,
          headerRow,
          dataStartRow,
          validationTabName: validationTabName || null,
        },
        columnMappings: flatMappings,
        statusConfigs: statuses,
        metricVisibilities: flatMetrics,
      });

      if (response.error) {
        setErrorMsg(response.error);
      } else {
        setSuccessMsg("Project settings successfully saved!");
        // Clear the shared localStorage cache so the Kanban board and dashboard
        // re-fetch fresh data (including updated statusConfig sortOrder) on next visit.
        if (typeof window !== "undefined") {
          localStorage.removeItem(`qa-board-cache-${project.slug}`);
        }
        router.refresh();
      }
    });
  };

  const tabsList = selectedTabs;

  return (
    <div className="flex-1 w-full min-h-screen flex flex-col bg-zinc-950 pb-16 text-zinc-300">
      {/* Navbar */}
      <header className="sticky top-0 z-30 w-full border-b border-zinc-800/40 bg-zinc-950/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-zinc-900 border border-zinc-800 text-blue-500">
                <Bug className="h-4 w-4" />
              </div>
              <span className="text-sm font-black text-white sm:inline-block">
                {project.name}
              </span>
            </div>

            <div className="hidden md:flex items-center gap-4 text-xs font-semibold text-zinc-400">
              <Link href="/projects" className="flex items-center gap-1 hover:text-white transition">
                <Folder className="h-3.5 w-3.5" />
                <span>Projects</span>
              </Link>
              <div className="w-px h-3.5 bg-zinc-800" />
              <Link href={`/p/${project.slug}`} className="flex items-center gap-1 hover:text-white transition">
                <LayoutGrid className="h-3.5 w-3.5" />
                <span>Dashboard</span>
              </Link>
              <Link href={`/p/${project.slug}/issues`} className="flex items-center gap-1 hover:text-white transition">
                <Bug className="h-3.5 w-3.5" />
                <span>Issues</span>
              </Link>
              <Link href={`/p/${project.slug}/board`} className="flex items-center gap-1 hover:text-white transition">
                <LayoutGrid className="h-3.5 w-3.5 rotate-45" />
                <span>Kanban Board</span>
              </Link>
              <Link href={`/p/${project.slug}/settings`} className="flex items-center gap-1 text-blue-400">
                <Settings className="h-3.5 w-3.5" />
                <span>Settings</span>
              </Link>
            </div>
          </div>

          <div>
            <button
              onClick={handleSave}
              disabled={isPending}
              className="h-8 bg-white hover:bg-zinc-100 text-zinc-950 font-bold text-xs px-4 rounded-lg flex items-center gap-1.5 shadow active:scale-[0.98] transition cursor-pointer disabled:opacity-50"
            >
              <Save className="h-3.5 w-3.5" />
              <span>{isPending ? "Saving..." : "Save Settings"}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 w-full px-4 sm:px-6 lg:px-8 pt-8 flex flex-col space-y-6">
        
        {/* Title bar */}
        <section className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800">
            <Settings className="h-4 w-4 text-blue-500" />
          </div>
          <div>
            <h2 className="text-sm font-black text-white uppercase tracking-wider">
              {project.name} Settings
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              Customize sheet URLs, column offsets, custom status badges, and toggles.
            </p>
          </div>
        </section>

        {/* Messaging banners */}
        {errorMsg && (
          <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-xs font-semibold">
            {errorMsg}
          </div>
        )}
        {successMsg && (
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs font-semibold">
            {successMsg}
          </div>
        )}

        {/* Tab Buttons & Settings block */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
          
          {/* Tabs Navigation Sidebar */}
          <nav className="md:col-span-1 bg-zinc-900/10 border border-zinc-900 rounded-2xl p-2.5 flex flex-row md:flex-col gap-1 overflow-x-auto">
            <button
              onClick={() => setActiveTab("sheet")}
              className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
                activeTab === "sheet"
                  ? "bg-zinc-900 border border-zinc-800 text-white shadow-inner"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              <Folder className="h-3.5 w-3.5" />
              <span>Sheet Setup</span>
            </button>
            <button
              onClick={() => setActiveTab("columns")}
              className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
                activeTab === "columns"
                  ? "bg-zinc-900 border border-zinc-800 text-white shadow-inner"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <span>Column Maps</span>
            </button>
            <button
              onClick={() => setActiveTab("statuses")}
              className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
                activeTab === "statuses"
                  ? "bg-zinc-900 border border-zinc-800 text-white shadow-inner"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              <Shield className="h-3.5 w-3.5" />
              <span>Status Badges</span>
            </button>
            <button
              onClick={() => setActiveTab("kpis")}
              className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
                activeTab === "kpis"
                  ? "bg-zinc-900 border border-zinc-800 text-white shadow-inner"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <span>KPI Mappings</span>
            </button>
            <button
              onClick={() => setActiveTab("metrics")}
              className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
                activeTab === "metrics"
                  ? "bg-zinc-900 border border-zinc-800 text-white shadow-inner"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              <Eye className="h-3.5 w-3.5" />
              <span>Metric Toggles</span>
            </button>
            <button
              onClick={() => setActiveTab("tabs")}
              className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
                activeTab === "tabs"
                  ? "bg-zinc-900 border border-zinc-800 text-white shadow-inner"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Manage Tabs</span>
            </button>
            <button
              onClick={() => setActiveTab("validation")}
              className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
                activeTab === "validation"
                  ? "bg-zinc-900 border border-zinc-800 text-white shadow-inner"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              <HelpCircle className="h-3.5 w-3.5" />
              <span>Validation Data</span>
            </button>
            <button
              onClick={() => setActiveTab("actions")}
              className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
                activeTab === "actions"
                  ? "bg-rose-950/20 border border-rose-900/30 text-rose-400 shadow-inner"
                  : "text-zinc-500 hover:text-rose-400"
              }`}
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Actions</span>
            </button>
          </nav>

          {/* Configuration Form Card */}
          <div className="md:col-span-3 bg-zinc-900/20 border border-zinc-900 rounded-2xl p-6 shadow-xl min-h-[400px]">
            
            {/* Tab 1: Sheet Setup */}
            {activeTab === "sheet" && (
              <SheetSetupTab
                sheetUrl={sheetUrl}
                setSheetUrl={setSheetUrl}
                selectedTabs={selectedTabs}
                setSelectedTabs={setSelectedTabs}
                tabs={tabs}
                isLoadingTabs={isLoadingTabs}
                headerRow={headerRow}
                setHeaderRow={setHeaderRow}
                dataStartRow={dataStartRow}
                setDataStartRow={setDataStartRow}
                validationTabName={validationTabName}
                setValidationTabName={setValidationTabName}
              />
            )}

            {/* Tab 2: Column Maps */}
            {activeTab === "columns" && (
              <ColumnMapsTab
                tabsList={tabsList}
                fieldKeys={fieldKeys}
                columnMappings={columnMappings}
                handleColumnIndexChange={handleColumnIndexChange}
              />
            )}

            {/* Tab 3: Status Badges */}
            {activeTab === "statuses" && (
              <StatusBadgesTab
                statuses={statuses}
                setStatuses={setStatuses}
                slug={project.slug}
              />
            )}

            {/* Tab 3.5: KPI Mappings */}
            {activeTab === "kpis" && (
              <KpiMappingsTab
                statuses={statuses}
                setStatuses={setStatuses}
              />
            )}

            {/* Tab 4: Metric Toggles */}
            {activeTab === "metrics" && (
              <MetricTogglesTab
                tabsList={tabsList}
                columnMappings={columnMappings}
                metricVisibilities={metricVisibilities}
                handleMetricToggle={handleMetricToggle}
              />
            )}

            {/* Tab: Manage Tabs */}
            {activeTab === "tabs" && (
              <TabsManagementTab slug={project.slug} />
            )}

            {/* Tab: Validation Data */}
            {activeTab === "validation" && (
              <ValidationManagementTab slug={project.slug} />
            )}

            {/* Tab 5: Actions */}
            {activeTab === "actions" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-rose-500">Actions</h3>
                  <p className="text-xs text-zinc-500 mt-1">
                    Administrative actions for this project.
                  </p>
                </div>

                <div className="border border-rose-900/30 bg-rose-950/10 rounded-xl p-6 space-y-4">
                  <div>
                    <h4 className="text-sm font-semibold text-white">Delete Project</h4>
                    <p className="text-xs text-zinc-400 mt-1">
                      This will permanently delete the project <strong className="text-rose-400 font-mono">"{project.name}"</strong>, its sheet configurations, column maps, and settings. This action cannot be undone.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs text-zinc-400 block font-medium">
                      To confirm deletion, type the project slug <strong className="text-white font-mono bg-zinc-900 px-1.5 py-0.5 rounded">{project.slug}</strong>:
                    </label>
                    <input
                      type="text"
                      value={deleteConfirmSlug}
                      onChange={(e) => setDeleteConfirmSlug(e.target.value)}
                      placeholder={project.slug}
                      className="w-full max-w-md h-9 text-xs rounded-lg bg-zinc-950 border border-zinc-800 text-white px-3 focus:outline-none focus:border-rose-500 transition font-mono"
                    />
                  </div>

                  <button
                    disabled={deleteConfirmSlug !== project.slug || isDeleting}
                    onClick={handleDeleteProject}
                    className={`h-9 text-xs font-bold px-4 rounded-lg flex items-center gap-1.5 transition active:scale-[0.98] cursor-pointer ${
                      deleteConfirmSlug === project.slug && !isDeleting
                        ? "bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-950/20"
                        : "bg-zinc-900 text-zinc-500 border border-zinc-850 cursor-not-allowed"
                    }`}
                  >
                    {isDeleting ? "Deleting..." : "Permanently Delete Project"}
                  </button>
                </div>
              </div>
            )}

          </div>

        </div>

      </main>
    </div>
  );
}

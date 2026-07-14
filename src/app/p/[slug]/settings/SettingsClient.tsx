"use client";

import { useState, useTransition } from "react";
import { Bug, Folder, Settings, LayoutGrid, Save, Plus, Trash2, Shield, Eye, HelpCircle } from "lucide-react";
import Link from "next/link";
import { saveProjectSettings } from "@/app/actions/settings";
import { useRouter } from "next/navigation";

interface SheetConfig {
  id: string;
  sheetUrl: string;
  sheetId: string;
  selectedTabs: string[];
  headerRow: number;
  dataStartRow: number;
}

interface ColumnMapping {
  id: string;
  tabName: string;
  fieldKey: string;
  columnIndex: number;
}

interface StatusConfig {
  id: string;
  statusValue: string;
  displayLabel: string;
  color: string;
  category: "open" | "closed" | "fixed" | "qa" | "other";
}

interface MetricVisibility {
  id: string;
  metricKey: string;
  enabled: boolean;
}

interface ProjectData {
  id: string;
  name: string;
  slug: string;
  sheetConfigs: SheetConfig[];
  columnMappings: ColumnMapping[];
  statusConfigs: StatusConfig[];
  metricVisibilities: MetricVisibility[];
}

interface SettingsClientProps {
  project: ProjectData;
}

export function SettingsClient({ project }: SettingsClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"sheet" | "columns" | "statuses" | "metrics">("sheet");
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // 1. Sheet Settings State
  const config = project.sheetConfigs[0] || {
    sheetUrl: "",
    selectedTabs: ["Admin", "App"],
    headerRow: 9,
    dataStartRow: 10,
  };
  const [sheetUrl, setSheetUrl] = useState(config.sheetUrl);
  const [tabsStr, setTabsStr] = useState(config.selectedTabs.join(", "));
  const [headerRow, setHeaderRow] = useState(config.headerRow);
  const [dataStartRow, setDataStartRow] = useState(config.dataStartRow);

  // 2. Column Mappings State
  // We represent mappings in a structured state
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

  // Initialize mappings state. We store column index per field key per tab.
  // Defaults to the database columnMappings or standard offsets
  const [columnMappings, setColumnMappings] = useState<Record<string, Record<string, number>>>(() => {
    const state: Record<string, Record<string, number>> = {};
    const tabs = tabsStr.split(",").map((t) => t.trim()).filter(Boolean);
    
    tabs.forEach((tab) => {
      state[tab] = {};
      fieldKeys.forEach((fk) => {
        // Find existing index in database mappings
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
      }));
    }
    return [
      { id: "1", statusValue: "TODO", displayLabel: "TODO", color: "#64748b", category: "open" },
      { id: "2", statusValue: "IN PROGRESS", displayLabel: "IN PROGRESS", color: "#0ea5e9", category: "open" },
      { id: "3", statusValue: "IN QA", displayLabel: "IN QA", color: "#f59e0b", category: "qa" },
      { id: "4", statusValue: "FIXED", displayLabel: "FIXED", color: "#a855f7", category: "fixed" },
      { id: "5", statusValue: "RESOLVED", displayLabel: "RESOLVED", color: "#10b981", category: "closed" },
    ];
  });

  const [newStatusVal, setNewStatusVal] = useState("");
  const [newStatusLabel, setNewStatusLabel] = useState("");
  const [newStatusColor, setNewStatusColor] = useState("#3b82f6");
  const [newStatusCat, setNewStatusCat] = useState<"open" | "closed" | "fixed" | "qa" | "other">("open");

  const handleAddStatus = () => {
    if (!newStatusVal.trim() || !newStatusLabel.trim()) return;
    const cleanVal = newStatusVal.trim().toUpperCase();
    if (statuses.some((s) => s.statusValue === cleanVal)) {
      alert("A status with this value already exists.");
      return;
    }
    setStatuses((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        statusValue: cleanVal,
        displayLabel: newStatusLabel.trim(),
        color: newStatusColor,
        category: newStatusCat,
      },
    ]);
    setNewStatusVal("");
    setNewStatusLabel("");
  };

  const handleRemoveStatus = (id: string) => {
    setStatuses((prev) => prev.filter((s) => s.id !== id));
  };

  // 4. Metric Visibility State
  const metrics = [
    { key: "todayFound", label: "Today's Found Issues", required: ["issueStatus", "assignedDate"] },
    { key: "todayResolved", label: "Today's Resolved Issues", required: ["issueStatus", "resolutionDate"] },
    { key: "openIssues", label: "Open Issues Metric", required: ["issueStatus"] },
    { key: "inQa", label: "In QA Metric", required: ["issueStatus"] },
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

    const tabsList = tabsStr
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

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
        // Don't save unmapped columns
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
        },
        columnMappings: flatMappings,
        statusConfigs: statuses,
        metricVisibilities: flatMetrics,
      });

      if (response.error) {
        setErrorMsg(response.error);
      } else {
        setSuccessMsg("Project settings successfully saved!");
        router.refresh();
      }
    });
  };

  const tabsList = tabsStr
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

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
              <span className="text-sm font-black text-white hidden sm:inline-block">QA Board</span>
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
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-8 flex flex-col space-y-6">
        
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
          </nav>

          {/* Configuration Form Card */}
          <div className="md:col-span-3 bg-zinc-900/20 border border-zinc-900 rounded-2xl p-6 shadow-xl min-h-[400px]">
            
            {/* Tab 1: Sheet Setup */}
            {activeTab === "sheet" && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-zinc-900/60 pb-3 mb-4">
                  <Folder className="h-4 w-4 text-blue-400" />
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">Google Sheets Integration</h3>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Spreadsheet URL</label>
                  <input
                    type="url"
                    value={sheetUrl}
                    onChange={(e) => setSheetUrl(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-850 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-700 focus:outline-none focus:border-zinc-800 transition"
                    placeholder="https://docs.google.com/spreadsheets/d/..."
                  />
                  <p className="text-[10px] text-zinc-500 mt-1 leading-relaxed">
                    Paste the full browser URL of the Google Sheet. The Spreadsheet ID will be parsed automatically.
                  </p>
                </div>

                <div className="space-y-1.5 pt-2">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Tracked Tab Names</label>
                  <input
                    type="text"
                    value={tabsStr}
                    onChange={(e) => setTabsStr(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-850 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-700 focus:outline-none focus:border-zinc-800 transition"
                    placeholder="e.g. Admin, App"
                  />
                  <p className="text-[10px] text-zinc-500 mt-1 leading-relaxed">
                    A comma-separated list of sheet tab names (e.g. <code>Admin, App, Backend</code>) to scan for QA issues.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Header Row</label>
                    <input
                      type="number"
                      value={headerRow}
                      onChange={(e) => setHeaderRow(parseInt(e.target.value) || 0)}
                      className="w-full bg-zinc-950 border border-zinc-850 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-zinc-800 transition"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Data Start Row</label>
                    <input
                      type="number"
                      value={dataStartRow}
                      onChange={(e) => setDataStartRow(parseInt(e.target.value) || 0)}
                      className="w-full bg-zinc-950 border border-zinc-850 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-zinc-800 transition"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Tab 2: Column Maps */}
            {activeTab === "columns" && (
              <div className="space-y-6">
                <div className="flex items-center gap-2 border-b border-zinc-900/60 pb-3">
                  <LayoutGrid className="h-4 w-4 text-blue-400" />
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">Column Index Mapping</h3>
                </div>

                <div className="space-y-6">
                  {tabsList.map((tab) => (
                    <div key={tab} className="bg-zinc-900/10 border border-zinc-900 rounded-xl p-4 space-y-4">
                      <div className="flex items-center gap-1.5 border-b border-zinc-900/40 pb-2">
                        <Folder className="w-3.5 h-3.5 text-blue-400" />
                        <h4 className="text-xs font-extrabold text-white">Tab: {tab}</h4>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {fieldKeys.map((fk) => {
                          const tabMappings = columnMappings[tab] || {};
                          const colIdx = tabMappings[fk.key] !== undefined ? tabMappings[fk.key] : -1;
                          
                          return (
                            <div key={fk.key} className="flex items-center justify-between gap-3 text-xs">
                              <div>
                                <span className="font-bold text-zinc-300 block">{fk.label}</span>
                                <span className="text-[10px] text-zinc-500 block leading-tight">{fk.description}</span>
                              </div>
                              <input
                                type="number"
                                min="-1"
                                value={colIdx}
                                onChange={(e) => handleColumnIndexChange(tab, fk.key, parseInt(e.target.value) ?? -1)}
                                className="w-16 bg-zinc-950 border border-zinc-850 rounded-lg px-2 py-1.5 text-center text-xs text-white focus:outline-none focus:border-zinc-800 transition"
                                title="0-based column index (e.g. A=0, B=1, G=6). Use -1 to keep unmapped."
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tab 3: Status Badges */}
            {activeTab === "statuses" && (
              <div className="space-y-6">
                <div className="flex items-center gap-2 border-b border-zinc-900/60 pb-3">
                  <Shield className="h-4 w-4 text-blue-400" />
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">Status Configurations</h3>
                </div>

                {/* Status adder form */}
                <div className="bg-zinc-950/60 border border-zinc-900 rounded-xl p-4 grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Raw value in sheet</label>
                    <input
                      type="text"
                      placeholder="e.g. TODO"
                      value={newStatusVal}
                      onChange={(e) => setNewStatusVal(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-850 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Display Label</label>
                    <input
                      type="text"
                      placeholder="e.g. To Do"
                      value={newStatusLabel}
                      onChange={(e) => setNewStatusLabel(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-850 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Color</label>
                      <input
                        type="color"
                        value={newStatusColor}
                        onChange={(e) => setNewStatusColor(e.target.value)}
                        className="w-full h-8 bg-zinc-950 border border-zinc-850 rounded-lg cursor-pointer"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Category</label>
                      <select
                        value={newStatusCat}
                        onChange={(e: any) => setNewStatusCat(e.target.value)}
                        className="w-full h-8 bg-zinc-950 border border-zinc-850 rounded-lg px-1 text-xs text-white focus:outline-none"
                      >
                        <option value="open">Open</option>
                        <option value="closed">Closed</option>
                        <option value="fixed">Fixed</option>
                        <option value="qa">QA</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddStatus}
                    className="w-full h-8 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-white font-bold text-xs rounded-lg flex items-center justify-center gap-1 cursor-pointer transition active:scale-[0.98]"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Status</span>
                  </button>
                </div>

                {/* Statuses List */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Configured Status Rules</label>
                  
                  <div className="divide-y divide-zinc-900 border border-zinc-900 rounded-xl overflow-hidden bg-zinc-900/10">
                    {statuses.map((status) => (
                      <div key={status.id} className="p-3.5 flex items-center justify-between gap-4 text-xs">
                        <div className="flex items-center gap-3">
                          <span
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: status.color }}
                          />
                          <div>
                            <span className="font-bold text-white block">{status.displayLabel}</span>
                            <span className="text-[10px] text-zinc-500 font-medium block">
                              Raw sheet match: <code>{status.statusValue}</code> | Category: <code>{status.category}</code>
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveStatus(status.id)}
                          className="text-zinc-600 hover:text-rose-400 p-1.5 hover:bg-zinc-900/60 rounded-lg transition cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Tab 4: Metric Toggles */}
            {activeTab === "metrics" && (
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
            )}

          </div>

        </div>

      </main>
    </div>
  );
}

"use client";

import React, { useState, useEffect, useRef } from "react";
import { X, ChevronDown, Check, RefreshCw } from "lucide-react";

interface StatusConfig {
  statusValue: string;
  displayLabel: string;
}

interface ProjectConfig {
  sheetConfigs: { selectedTabs: string[] }[];
  statusConfigs: StatusConfig[];
  columnMappings: { fieldKey: string; columnIndex: number }[];
}

interface IssueFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (tabName: string, data: Record<string, any>) => Promise<boolean>;
  projectConfig: ProjectConfig;
  validationRules: Record<string, string[]>;
  issue?: any; // If provided, we are editing this issue!
}

// MultiSelect Dropdown component
function MultiSelectDropdown({
  options,
  selected,
  onChange,
  placeholder = "Select options...",
}: {
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const toggleOption = (option: string) => {
    if (selected.includes(option)) {
      onChange(selected.filter((x) => x !== option));
    } else {
      onChange([...selected, option]);
    }
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full min-h-10 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white flex items-center justify-between gap-2 focus:outline-none focus:border-zinc-700 transition cursor-pointer select-none text-left"
      >
        <div className="flex flex-wrap gap-1.5 flex-1 min-w-0">
          {selected.length === 0 ? (
            <span className="text-zinc-500">{placeholder}</span>
          ) : (
            selected.map((item) => (
              <span
                key={item}
                className="bg-blue-500/10 border border-blue-500/20 text-blue-400 px-2 py-0.5 rounded-lg text-[10px] font-bold flex items-center gap-1 shrink-0"
              >
                <span>{item}</span>
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleOption(item);
                  }}
                  className="hover:text-white cursor-pointer"
                >
                  <X className="w-2.5 h-2.5" />
                </span>
              </span>
            ))
          )}
        </div>
        <ChevronDown className="w-4 h-4 text-zinc-500 shrink-0" />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1.5 bg-zinc-950 border border-zinc-800 rounded-xl shadow-2xl max-h-56 overflow-y-auto p-1.5 space-y-0.5">
          {options.length === 0 ? (
            <p className="text-[10px] text-zinc-500 italic p-2 text-center">No options available</p>
          ) : (
            options.map((option) => {
              const isChecked = selected.includes(option);
              return (
                <div
                  key={option}
                  onClick={() => toggleOption(option)}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-bold transition cursor-pointer select-none ${
                    isChecked
                      ? "bg-zinc-900 text-blue-400"
                      : "text-zinc-400 hover:bg-zinc-900 hover:text-white"
                  }`}
                >
                  <span>{option}</span>
                  {isChecked && <Check className="w-3.5 h-3.5 text-blue-400 stroke-[3]" />}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

export function IssueFormDialog({
  isOpen,
  onClose,
  onSubmit,
  projectConfig,
  validationRules,
  issue,
}: IssueFormDialogProps) {
  const isEditMode = !!issue;

  // Form Fields States
  const [tabName, setTabName] = useState("");
  const [issueTitle, setIssueTitle] = useState("");
  const [module, setModule] = useState("");
  const [issueDescription, setIssueDescription] = useState("");
  const [stepsToReproduce, setStepsToReproduce] = useState("");
  const [resources, setResources] = useState("");
  const [issueStatus, setIssueStatus] = useState("");
  const [reportedBy, setReportedBy] = useState<string[]>([]);
  const [assignee, setAssignee] = useState<string[]>([]);
  const [devComments, setDevComments] = useState("");
  const [estimation, setEstimation] = useState("");
  const [spentTime, setSpentTime] = useState("");
  const [assignedDate, setAssignedDate] = useState("");
  const [resolutionDate, setResolutionDate] = useState("");
  const [qaComments, setQaComments] = useState("");

  const [isPending, setIsPending] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Initialize fields on load or change of issue prop
  useEffect(() => {
    if (issue) {
      setTabName(issue.sheetSource || "");
      setIssueTitle(issue.issueTitle || "");
      setModule(issue.module || "");
      setIssueDescription(issue.issueDescription || "");
      setStepsToReproduce(issue.stepsToReproduce || "");
      setResources(issue.resources || "");
      setIssueStatus(issue.issueStatus || "");
      
      // Multi-select list fields (split by comma if string)
      setReportedBy(
        issue.reportedBy ? String(issue.reportedBy).split(",").map((s) => s.trim()).filter(Boolean) : []
      );
      setAssignee(
        issue.assignee ? String(issue.assignee).split(",").map((s) => s.trim()).filter(Boolean) : []
      );
      
      setDevComments(issue.devComments || "");
      setEstimation(issue.estimation !== undefined && issue.estimation !== null ? String(issue.estimation) : "");
      setSpentTime(issue.spentTime !== undefined && issue.spentTime !== null ? String(issue.spentTime) : "");
      setAssignedDate(issue.assignedDate || "");
      setResolutionDate(issue.resolutionDate || "");
      setQaComments(issue.qaComments || "");
    } else {
      // Clear fields for Create Mode
      const selectedTabs = projectConfig.sheetConfigs?.[0]?.selectedTabs || [];
      setTabName(selectedTabs[0] || "");
      setIssueTitle("");
      setModule("");
      setIssueDescription("");
      setStepsToReproduce("");
      setResources("");
      setIssueStatus(projectConfig.statusConfigs?.[0]?.statusValue || "TODO");
      setReportedBy([]);
      setAssignee([]);
      setDevComments("");
      setEstimation("");
      setSpentTime("");
      
      // Auto-initialize Assigned Date with today's date in YYYY-MM-DD format
      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, "0");
      const dd = String(today.getDate()).padStart(2, "0");
      setAssignedDate(`${yyyy}-${mm}-${dd}`);
      setResolutionDate("");
      setQaComments("");
    }
    setFormError(null);
  }, [issue, projectConfig, isOpen]);

  // Helper to extract validation dropdown values fuzzy-matching the field key
  const getValidationOptions = (fieldKey: string) => {
    const cleanField = fieldKey.toLowerCase().replace(/[^a-z0-9]/g, "");
    for (const [header, options] of Object.entries(validationRules)) {
      const cleanHeader = header.toLowerCase().replace(/[^a-z0-9]/g, "");
      if (cleanHeader === cleanField || cleanHeader.includes(cleanField) || cleanField.includes(cleanHeader)) {
        return options;
      }
    }
    return [];
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Validation
    if (!tabName) {
      setFormError("Spreadsheet tab selection is required.");
      return;
    }
    if (!issueTitle.trim()) {
      setFormError("Issue Title is required.");
      return;
    }
    if (!module.trim()) {
      setFormError("Module / Platform is required.");
      return;
    }
    if (!issueDescription.trim()) {
      setFormError("Issue Description is required.");
      return;
    }

    setIsPending(true);

    const issueData: Record<string, any> = {
      issueTitle: issueTitle.trim(),
      module: module.trim(),
      issueDescription: issueDescription.trim(),
      stepsToReproduce: stepsToReproduce.trim(),
      resources: resources.trim(),
      issueStatus,
      reportedBy,
      assignee,
      devComments: devComments.trim(),
      estimation: estimation.trim() !== "" ? parseFloat(estimation) : null,
      spentTime: spentTime.trim() !== "" ? parseFloat(spentTime) : null,
      assignedDate: assignedDate.trim(),
      resolutionDate: resolutionDate.trim(),
      qaComments: qaComments.trim(),
    };

    try {
      const success = await onSubmit(tabName, issueData);
      if (success) {
        onClose();
      } else {
        setFormError("Failed to write updates to Google Sheets. Verify permissions.");
      }
    } catch (err: any) {
      setFormError(err.message || "An error occurred writing data.");
    } finally {
      setIsPending(false);
    }
  };

  if (!isOpen) return null;

  const selectedTabs = projectConfig.sheetConfigs?.[0]?.selectedTabs || [];
  const statusOptions = projectConfig.statusConfigs || [];

  const reportedByOptions = getValidationOptions("reportedBy");
  const assigneeOptions = getValidationOptions("assignee");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-zinc-950 border border-zinc-850 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-zinc-900 flex items-center justify-between bg-zinc-900/10">
          <div>
            <h3 className="text-sm font-black text-white uppercase tracking-wider">
              {isEditMode ? `Edit Issue Row #${issue.sheetRowIndex}` : "Create New Issue"}
            </h3>
            <p className="text-[10px] text-zinc-500 mt-0.5">
              {isEditMode ? `Updating fields on tab ${issue.sheetSource}` : "Append a new QA ticket to Google Sheets"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="text-zinc-500 hover:text-white transition p-1.5 hover:bg-zinc-900 rounded-lg cursor-pointer disabled:opacity-50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-6">
          {formError && (
            <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-xs font-semibold">
              {formError}
            </div>
          )}

          {/* Form grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Sheet Tab - Single Select (Locked in Edit Mode) */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                Target Spreadsheet Tab <span className="text-red-500">*</span>
              </label>
              {isEditMode ? (
                <input
                  type="text"
                  value={tabName}
                  disabled
                  className="w-full bg-zinc-900/40 border border-zinc-850/80 rounded-xl px-3.5 py-2.5 text-xs text-zinc-500 cursor-not-allowed"
                />
              ) : (
                <select
                  value={tabName}
                  onChange={(e) => setTabName(e.target.value)}
                  className="w-full h-10 bg-zinc-950 border border-zinc-800 rounded-xl px-3 text-xs text-white focus:outline-none focus:border-zinc-700 transition"
                >
                  {selectedTabs.map((tab) => (
                    <option key={tab} value={tab}>
                      {tab}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Issue Status */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Status</label>
              <select
                value={issueStatus}
                onChange={(e) => setIssueStatus(e.target.value)}
                className="w-full h-10 bg-zinc-950 border border-zinc-800 rounded-xl px-3 text-xs text-white focus:outline-none focus:border-zinc-700 transition"
              >
                {statusOptions.map((st) => (
                  <option key={st.statusValue} value={st.statusValue}>
                    {st.displayLabel}
                  </option>
                ))}
              </select>
            </div>

            {/* Issue Title - Required */}
            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                Issue Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={issueTitle}
                onChange={(e) => setIssueTitle(e.target.value)}
                placeholder="e.g. Broken login redirection on mobile"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-zinc-700 transition"
              />
            </div>

            {/* Module / Platform - Required */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                Module / Platform <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={module}
                onChange={(e) => setModule(e.target.value)}
                placeholder="e.g. AUTH, MOBILE"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-zinc-700 transition"
              />
            </div>

            {/* Resources / Links */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Resources / Attachments URL</label>
              <input
                type="url"
                value={resources}
                onChange={(e) => setResources(e.target.value)}
                placeholder="https://drive.google.com/... (Optional)"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-zinc-700 transition"
              />
            </div>

            {/* Issue Description - Required */}
            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                Issue Description <span className="text-red-500">*</span>
              </label>
              <textarea
                value={issueDescription}
                onChange={(e) => setIssueDescription(e.target.value)}
                placeholder="Provide a description of the issue..."
                rows={3}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-zinc-700 transition resize-y"
              />
            </div>

            {/* Steps to Reproduce */}
            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Steps to Reproduce</label>
              <textarea
                value={stepsToReproduce}
                onChange={(e) => setStepsToReproduce(e.target.value)}
                placeholder="1. Open page X\n2. Click button Y\n3. Redirection fails"
                rows={3}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-zinc-700 transition resize-y"
              />
            </div>

            {/* Validation Dropdowns: Reported By & Assignee */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Reported By</label>
              {reportedByOptions.length > 0 ? (
                <MultiSelectDropdown
                  options={reportedByOptions}
                  selected={reportedBy}
                  onChange={setReportedBy}
                  placeholder="Select reporter(s)..."
                />
              ) : (
                <input
                  type="text"
                  value={reportedBy.join(", ")}
                  onChange={(e) => setReportedBy(e.target.value.split(",").map((s) => s.trim()).filter(Boolean))}
                  placeholder="Enter reporter name..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-zinc-700 transition"
                />
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Assignee</label>
              {assigneeOptions.length > 0 ? (
                <MultiSelectDropdown
                  options={assigneeOptions}
                  selected={assignee}
                  onChange={setAssignee}
                  placeholder="Select assignee(s)..."
                />
              ) : (
                <input
                  type="text"
                  value={assignee.join(", ")}
                  onChange={(e) => setAssignee(e.target.value.split(",").map((s) => s.trim()).filter(Boolean))}
                  placeholder="Enter assignee name..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-zinc-700 transition"
                />
              )}
            </div>

            {/* Estimation (Hours) & Spent Time (Hours) */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Estimation (Hours)</label>
              <input
                type="number"
                step="0.5"
                min="0"
                value={estimation}
                onChange={(e) => setEstimation(e.target.value)}
                placeholder="e.g. 4"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-zinc-700 transition"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Spent Time (Hours)</label>
              <input
                type="number"
                step="0.5"
                min="0"
                value={spentTime}
                onChange={(e) => setSpentTime(e.target.value)}
                placeholder="e.g. 2"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-zinc-700 transition"
              />
            </div>

            {/* Date Mappings: Assigned Date & Resolution Date */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Assigned Date</label>
              <input
                type="text"
                placeholder="YYYY-MM-DD"
                value={assignedDate}
                onChange={(e) => setAssignedDate(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-zinc-700 transition"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Resolution Date</label>
              <input
                type="text"
                placeholder="YYYY-MM-DD"
                value={resolutionDate}
                onChange={(e) => setResolutionDate(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-zinc-700 transition"
              />
            </div>

            {/* Dev Comments */}
            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Dev Comments</label>
              <textarea
                value={devComments}
                onChange={(e) => setDevComments(e.target.value)}
                placeholder="Developer comments, resolutions notes..."
                rows={2}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-zinc-700 transition resize-y"
              />
            </div>

            {/* QA Comments */}
            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">QA Comments</label>
              <textarea
                value={qaComments}
                onChange={(e) => setQaComments(e.target.value)}
                placeholder="Regression tests notes, QA verification comments..."
                rows={2}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-zinc-700 transition resize-y"
              />
            </div>

          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-zinc-900 flex items-center justify-end gap-3 bg-zinc-900/5">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="px-4 py-2 border border-zinc-800 rounded-xl text-xs font-bold text-zinc-400 hover:text-white transition cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="px-5 py-2 bg-blue-500 hover:bg-blue-600 rounded-xl text-xs font-bold text-white transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 select-none active:scale-[0.98]"
            >
              {isPending && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
              <span>{isEditMode ? "Save Changes" : "Create Issue"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

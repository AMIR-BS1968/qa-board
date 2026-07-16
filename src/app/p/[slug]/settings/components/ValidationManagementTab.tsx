"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Trash2, RefreshCw, Save, Database, ChevronRight } from "lucide-react";
import { addPendingChange, getPendingChanges } from "@/lib/batchUpdates";

interface ValidationManagementTabProps {
  slug: string;
}

export function ValidationManagementTab({ slug }: ValidationManagementTabProps) {
  // rows[0] = headers, rows[1..n] = data values
  const [rows, setRows] = useState<string[][]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedCol, setSelectedCol] = useState<number | null>(null);
  const [newColName, setNewColName] = useState("");
  const [newValue, setNewValue] = useState("");
  const [isDirty, setIsDirty] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/settings/validation?slug=${slug}`);
      const data = await res.json();
      if (data.success) {
        // Load staged validation rules from pending queue if present
        const changes = getPendingChanges(slug);
        const valChange = changes.find((c) => c.type === "VALIDATION_UPDATE");
        if (valChange && valChange.newData && Array.isArray(valChange.newData.rows)) {
          setRows(valChange.newData.rows);
          setSelectedCol(valChange.newData.rows?.[0]?.length > 0 ? 0 : null);
          setIsDirty(true);
        } else {
          setRows(data.rows || []);
          setSelectedCol(data.rows?.[0]?.length > 0 ? 0 : null);
          setIsDirty(false);
        }
      } else {
        setError(data.error || "Failed to load validation data");
      }
    } catch (err: any) {
      setError(err.message || "Network error");
    } finally {
      setIsLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const headers = rows[0] || [];
  const dataRows = rows.slice(1);

  // Get all values for a given column index
  const getColValues = (colIdx: number) =>
    dataRows.map((row) => row[colIdx] ?? "").filter((v) => v !== "");

  const handleSave = () => {
    addPendingChange(slug, {
      type: "VALIDATION_UPDATE",
      newData: { rows },
      description: "Update validation rules (add/remove columns/values)",
    });
    setSuccess("Validation changes staged locally!");
    setIsDirty(false);
    setTimeout(() => setSuccess(null), 3000);
  };

  const handleAddColumn = () => {
    const name = newColName.trim();
    if (!name) return;
    if (headers.some((h) => h.toLowerCase() === name.toLowerCase())) {
      setError("A column with this name already exists.");
      return;
    }
    setRows((prev) => {
      const newRows = prev.map((row) => [...row, ""]);
      if (newRows.length === 0) newRows.push([name]);
      else newRows[0] = [...(newRows[0] || []), name];
      return newRows;
    });
    setSelectedCol(headers.length);
    setNewColName("");
    setIsDirty(true);
  };

  const handleAddValue = () => {
    const val = newValue.trim();
    if (!val || selectedCol === null) return;

    setRows((prev) => {
      const copy = prev.map((row) => [...row]);
      // Ensure header row exists
      while (copy.length === 0) copy.push([]);

      // Find first empty slot in the column
      let inserted = false;
      for (let r = 1; r < copy.length; r++) {
        while (copy[r].length <= selectedCol) copy[r].push("");
        if (!copy[r][selectedCol] || copy[r][selectedCol].trim() === "") {
          copy[r][selectedCol] = val;
          inserted = true;
          break;
        }
      }
      if (!inserted) {
        // Append a new row
        const newRow = headers.map(() => "");
        newRow[selectedCol] = val;
        copy.push(newRow);
      }
      return copy;
    });
    setNewValue("");
    setIsDirty(true);
  };

  const handleRemoveValue = (colIdx: number, valueToRemove: string) => {
    setRows((prev) => {
      const copy = prev.map((row) => [...row]);
      for (let r = 1; r < copy.length; r++) {
        if ((copy[r][colIdx] || "").trim() === valueToRemove.trim()) {
          copy[r][colIdx] = "";
          break;
        }
      }
      return copy;
    });
    setIsDirty(true);
  };

  const handleRemoveColumn = (colIdx: number) => {
    setRows((prev) =>
      prev.map((row) => row.filter((_, i) => i !== colIdx))
    );
    setSelectedCol((prev) => {
      if (prev === null) return null;
      if (prev === colIdx) return null;
      if (prev > colIdx) return prev - 1;
      return prev;
    });
    setIsDirty(true);
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => <div key={i} className="h-10 bg-zinc-900/60 rounded-lg animate-pulse" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-zinc-900/60 pb-3">
        <Database className="h-4 w-4 text-blue-400" />
        <h3 className="text-xs font-bold text-white uppercase tracking-wider">Validation Data Manager</h3>
        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={loadData}
            disabled={isLoading}
            className="text-zinc-500 hover:text-white transition cursor-pointer disabled:opacity-50"
            title="Reload from sheet"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
          </button>
          {isDirty && (
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-1.5 h-7 bg-blue-500 hover:bg-blue-600 text-white font-bold text-[10px] px-3 rounded-lg cursor-pointer transition active:scale-[0.98] disabled:opacity-50"
            >
              <Save className="h-3 w-3" />
              <span>{isSaving ? "Saving..." : "Save to Sheet"}</span>
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-lg text-xs">
          {error}
        </div>
      )}
      {success && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg text-xs">
          {success}
        </div>
      )}

      {/* Add Column */}
      <div className="bg-zinc-950/60 border border-zinc-900 rounded-xl p-4 flex gap-3 items-end">
        <div className="flex-1 space-y-1">
          <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">New Column Header</label>
          <input
            type="text"
            placeholder="e.g. Status, Assignee, Module..."
            value={newColName}
            onChange={(e) => setNewColName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddColumn()}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-zinc-700 transition"
          />
        </div>
        <button
          type="button"
          onClick={handleAddColumn}
          disabled={!newColName.trim()}
          className="h-8 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-white font-bold text-xs px-4 rounded-lg flex items-center gap-1.5 cursor-pointer transition active:scale-[0.98] disabled:opacity-50"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Column</span>
        </button>
      </div>

      {/* Two-panel: columns list + selected column values */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {/* Column Selector */}
        <div className="md:col-span-2 space-y-2">
          <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Columns</label>
          {headers.length === 0 ? (
            <div className="h-16 flex items-center justify-center text-xs text-zinc-600 border border-dashed border-zinc-900 rounded-xl">
              No columns yet. Add one above.
            </div>
          ) : (
            <div className="divide-y divide-zinc-900 border border-zinc-900 rounded-xl overflow-hidden bg-zinc-900/10">
              {headers.map((header, colIdx) => (
                <div
                  key={colIdx}
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelectedCol(colIdx)}
                  onKeyDown={(e) => e.key === "Enter" && setSelectedCol(colIdx)}
                  className={`w-full text-left p-3 flex items-center justify-between text-xs transition cursor-pointer group ${
                    selectedCol === colIdx
                      ? "bg-zinc-900/60 text-white"
                      : "text-zinc-400 hover:text-white hover:bg-zinc-900/30"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{header || "(unnamed)"}</span>
                    <span className="text-[10px] text-zinc-600 font-mono">
                      {getColValues(colIdx).length} values
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveColumn(colIdx);
                      }}
                      className="opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-rose-400 p-0.5 rounded transition cursor-pointer"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                    <ChevronRight className={`h-3.5 w-3.5 transition ${selectedCol === colIdx ? "text-blue-400" : "text-zinc-700"}`} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Values for selected column */}
        <div className="md:col-span-3 space-y-2">
          {selectedCol !== null && headers[selectedCol] ? (
            <>
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                Values for: <span className="text-zinc-300">{headers[selectedCol]}</span>
              </label>

              {/* Add value input */}
              <div className="flex gap-2 items-center">
                <input
                  type="text"
                  placeholder={`Add value to "${headers[selectedCol]}"...`}
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddValue()}
                  className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-zinc-700 transition"
                />
                <button
                  type="button"
                  onClick={handleAddValue}
                  disabled={!newValue.trim()}
                  className="h-8 w-8 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-white rounded-lg flex items-center justify-center cursor-pointer transition active:scale-[0.98] disabled:opacity-50"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Values list */}
              <div className="divide-y divide-zinc-900 border border-zinc-900 rounded-xl overflow-hidden bg-zinc-900/10 max-h-64 overflow-y-auto">
                {getColValues(selectedCol).length === 0 ? (
                  <div className="py-8 text-center text-xs text-zinc-600">
                    No values yet. Add one above.
                  </div>
                ) : (
                  getColValues(selectedCol).map((val, vIdx) => (
                    <div key={vIdx} className="px-3 py-2.5 flex items-center justify-between text-xs group">
                      <span className="text-zinc-300 font-medium">{val}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveValue(selectedCol, val)}
                        className="opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-rose-400 p-1 rounded transition cursor-pointer"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </>
          ) : (
            <div className="h-full min-h-[200px] flex items-center justify-center text-xs text-zinc-600 border border-dashed border-zinc-900 rounded-xl">
              Select a column to view and edit its values.
            </div>
          )}
        </div>
      </div>

      <p className="text-[10px] text-zinc-600 leading-relaxed">
        Changes are staged locally. Click <strong className="text-zinc-400">Save to Sheet</strong> to write them back to the Google Spreadsheet validation tab.
      </p>
    </div>
  );
}

"use client";

import { useState } from "react";
import { Shield, Plus, ArrowUp, ArrowDown, Trash2 } from "lucide-react";
import { StatusConfig } from "../types";

interface StatusBadgesTabProps {
  statuses: StatusConfig[];
  setStatuses: React.Dispatch<React.SetStateAction<StatusConfig[]>>;
  slug: string;
}

export function StatusBadgesTab({ statuses, setStatuses, slug }: StatusBadgesTabProps) {
  const [newStatusVal, setNewStatusVal] = useState("");
  const [newStatusLabel, setNewStatusLabel] = useState("");
  const [newStatusColor, setNewStatusColor] = useState("#3b82f6");
  const [newStatusCat, setNewStatusCat] = useState<"open" | "closed" | "fixed" | "qa" | "other">("open");
  const [isSyncing, setIsSyncing] = useState(false);

  const handleAddStatus = async () => {
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
        kanbanEnabled: true,
        sortOrder: prev.length,
      },
    ]);
    setNewStatusVal("");
    setNewStatusLabel("");

    // Sync to validation sheet immediately
    setIsSyncing(true);
    try {
      await fetch("/api/settings/status-sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, statusValue: cleanVal }),
      });
    } catch (err) {
      console.warn("[status-sync] Failed to write status to validation sheet:", err);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleRemoveStatus = (id: string) => {
    setStatuses((prev) => prev.filter((s) => s.id !== id));
  };

  const handleMoveStatus = (index: number, direction: "up" | "down") => {
    const nextIndex = direction === "up" ? index - 1 : index + 1;
    if (nextIndex < 0 || nextIndex >= statuses.length) return;

    setStatuses((prev) => {
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[nextIndex];
      copy[nextIndex] = temp;
      return copy.map((s, idx) => ({ ...s, sortOrder: idx }));
    });
  };

  const handleToggleKanban = (id: string) => {
    setStatuses((prev) =>
      prev.map((s) => (s.id === id ? { ...s, kanbanEnabled: !s.kanbanEnabled } : s))
    );
  };

  const handleCategoryChange = (id: string, newCat: "open" | "closed" | "fixed" | "qa" | "other") => {
    setStatuses((prev) =>
      prev.map((s) => (s.id === id ? { ...s, category: newCat } : s))
    );
  };

  return (
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
          disabled={isSyncing}
          className="w-full h-8 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-white font-bold text-xs rounded-lg flex items-center justify-center gap-1 cursor-pointer transition active:scale-[0.98] disabled:opacity-60 disabled:cursor-wait"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{isSyncing ? "Syncing to sheet..." : "Add Status"}</span>
        </button>
      </div>

      {/* Statuses List */}
      <div className="space-y-2">
        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Configured Status Rules</label>

        <div className="divide-y divide-zinc-900 border border-zinc-900 rounded-xl overflow-hidden bg-zinc-900/10">
          {statuses.map((status) => {
            const index = statuses.findIndex((s) => s.id === status.id);
            return (
              <div key={status.id} className="p-3.5 flex items-center justify-between gap-4 text-xs">
                <div className="flex items-center gap-3">
                  <div className="flex flex-col gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleMoveStatus(index, "up")}
                      disabled={index === 0}
                      className="text-zinc-600 hover:text-white disabled:opacity-30 disabled:hover:text-zinc-600 transition cursor-pointer"
                      title="Move Up"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMoveStatus(index, "down")}
                      disabled={index === statuses.length - 1}
                      className="text-zinc-600 hover:text-white disabled:opacity-30 disabled:hover:text-zinc-600 transition cursor-pointer"
                      title="Move Down"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: status.color }}
                  />
                  <div>
                    <span className="font-bold text-white block">{status.displayLabel}</span>
                    <div className="text-[10px] text-zinc-500 font-medium flex flex-wrap items-center gap-x-2 gap-y-1 mt-1">
                      <span>Raw match: <code>{status.statusValue}</code></span>
                      <span>|</span>
                      <span className="flex items-center gap-1">
                        <span>Category:</span>
                        <select
                          value={status.category}
                          onChange={(e) => handleCategoryChange(status.id, e.target.value as any)}
                          className="bg-zinc-950 border border-zinc-800 rounded px-1.5 py-0.5 text-[10px] text-zinc-300 focus:outline-none focus:border-zinc-700 transition"
                        >
                          <option value="open">Open</option>
                          <option value="closed">Closed</option>
                          <option value="fixed">Fixed</option>
                          <option value="qa">QA</option>
                          <option value="other">Other</option>
                        </select>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-1.5 cursor-pointer text-zinc-400 select-none">
                    <input
                      type="checkbox"
                      checked={status.kanbanEnabled !== false}
                      onChange={() => handleToggleKanban(status.id)}
                      className="w-3.5 h-3.5 bg-zinc-950 border border-zinc-850 rounded text-blue-500 focus:ring-0 cursor-pointer"
                    />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Show in Kanban</span>
                  </label>

                  <button
                    type="button"
                    onClick={() => handleRemoveStatus(status.id)}
                    className="text-zinc-600 hover:text-rose-400 p-1.5 hover:bg-zinc-900/60 rounded-lg transition cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
